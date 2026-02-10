import * as Location from 'expo-location';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SparringEvent, EventReview } from '../types';

export type EventFilters = {
  eventType?: string[];
  intensity?: string[];
  weightClasses?: string[];
  experienceLevels?: string[];
  dateFrom?: string;
  dateTo?: string;
  maxDistance?: number; // in km
  gymId?: string;
  status?: string;
};

export type EventWithDistance = SparringEvent & {
  distance?: number; // in km
  gym_name?: string;
  gym_city?: string;
  gym_country?: string;
  gym_latitude?: number;
  gym_longitude?: number;
  request_status?: string;
  current_participants?: number;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get user's current location
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Search events with filters and location-based sorting
 */
export async function searchEvents(
  filters: EventFilters = {},
  userLocation?: { latitude: number; longitude: number } | null,
  fighterId?: string
): Promise<EventWithDistance[]> {
  if (!isSupabaseConfigured) {
    // Return mock data for demo mode
    return getMockEvents();
  }

  try {
    let query = supabase
      .from('sparring_events')
      .select(`
        *,
        gym:gyms (
          id,
          name,
          city,
          country,
          latitude,
          longitude
        )
      `);

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'published');
    }

    // Apply date filters
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('event_date', filters.dateFrom || today);
    if (filters.dateTo) {
      query = query.lte('event_date', filters.dateTo);
    }

    // Apply gym filter
    if (filters.gymId) {
      query = query.eq('gym_id', filters.gymId);
    }

    // Apply event type filter
    if (filters.eventType && filters.eventType.length > 0) {
      query = query.in('event_type', filters.eventType);
    }

    // Apply intensity filter
    if (filters.intensity && filters.intensity.length > 0) {
      query = query.in('intensity', filters.intensity);
    }

    // Order by date
    query = query.order('event_date', { ascending: true });

    const { data: events, error } = await query;

    if (error) throw error;

    // Get user's event requests if fighter ID provided
    let userRequests: any[] = [];
    if (fighterId) {
      const { data: requests } = await supabase
        .from('event_requests')
        .select('event_id, status')
        .eq('fighter_id', fighterId);
      userRequests = requests || [];
    }

    // Map events and calculate distances
    let eventsWithDetails: EventWithDistance[] = (events || []).map((event: any) => {
      const gymData = event.gym;
      const userRequest = userRequests.find(r => r.event_id === event.id);

      let distance: number | undefined;
      if (userLocation && gymData?.latitude && gymData?.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          gymData.latitude,
          gymData.longitude
        );
      }

      return {
        ...event,
        gym_name: gymData?.name,
        gym_city: gymData?.city,
        gym_country: gymData?.country,
        gym_latitude: gymData?.latitude,
        gym_longitude: gymData?.longitude,
        distance,
        request_status: userRequest?.status,
      };
    });

    // Apply weight class filter
    if (filters.weightClasses && filters.weightClasses.length > 0) {
      eventsWithDetails = eventsWithDetails.filter(event =>
        filters.weightClasses!.some(wc => event.weight_classes?.includes(wc as any))
      );
    }

    // Apply experience level filter
    if (filters.experienceLevels && filters.experienceLevels.length > 0) {
      eventsWithDetails = eventsWithDetails.filter(event =>
        filters.experienceLevels!.some(el => event.experience_levels?.includes(el as any))
      );
    }

    // Apply distance filter
    if (filters.maxDistance && userLocation) {
      eventsWithDetails = eventsWithDetails.filter(
        event => event.distance && event.distance <= filters.maxDistance!
      );
    }

    // Sort by distance if user location available
    if (userLocation) {
      eventsWithDetails.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return eventsWithDetails;
  } catch (error) {
    console.error('Error searching events:', error);
    throw error;
  }
}

/**
 * Create a new sparring event
 */
export type CreateEventData = {
  gym_id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  max_participants: number;
  intensity?: string;
  weight_classes: string[];
  experience_levels: string[];
  status: string;
};

export async function createEvent(data: CreateEventData): Promise<string> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would create event', data);
    return 'demo-event-id';
  }

  const { data: result, error } = await supabase
    .from('sparring_events')
    .insert({
      gym_id: data.gym_id,
      title: data.title,
      description: data.description || null,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time || null,
      max_participants: data.max_participants,
      intensity: data.intensity || null,
      weight_classes: data.weight_classes,
      experience_levels: data.experience_levels,
      status: data.status,
      current_participants: 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  return result.id;
}

/**
 * Get events for a specific gym
 */
export async function getGymEvents(gymId: string): Promise<EventWithDistance[]> {
  return searchEvents({ gymId, status: 'published' });
}

/**
 * Get nearby events based on user's location
 */
export async function getNearbyEvents(
  maxDistance: number = 50,
  fighterId?: string
): Promise<EventWithDistance[]> {
  const location = await getCurrentLocation();
  if (!location) {
    return searchEvents({}, null, fighterId);
  }

  return searchEvents({ maxDistance }, location, fighterId);
}

/**
 * Get recommended events for a fighter
 */
export async function getRecommendedEvents(
  fighter: any
): Promise<EventWithDistance[]> {
  const location = await getCurrentLocation();

  const filters: EventFilters = {
    weightClasses: fighter.weight_class ? [fighter.weight_class] : undefined,
    experienceLevels: fighter.experience_level ? [fighter.experience_level] : undefined,
    maxDistance: 50, // 50km radius
  };

  return searchEvents(filters, location, fighter.id);
}

/**
 * Request to join an event
 */
export async function requestToJoinEvent(
  eventId: string,
  fighterId: string,
  message?: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would send join request');
    return;
  }

  const { error } = await supabase.from('event_requests').insert({
    event_id: eventId,
    fighter_id: fighterId,
    status: 'pending',
    message: message || 'I would like to join this event',
  });

  if (error) throw error;
}

/**
 * Cancel event request
 */
export async function cancelEventRequest(
  eventId: string,
  fighterId: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would cancel request');
    return;
  }

  const { error } = await supabase
    .from('event_requests')
    .delete()
    .eq('event_id', eventId)
    .eq('fighter_id', fighterId);

  if (error) throw error;
}

/**
 * Get events a fighter has requested to join
 */
export async function getMyEventRequests(
  fighterId: string
): Promise<EventWithDistance[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data: requests, error } = await supabase
      .from('event_requests')
      .select(`
        *,
        event:sparring_events (
          *,
          gym:gyms (
            name,
            city,
            country,
            latitude,
            longitude
          )
        )
      `)
      .eq('fighter_id', fighterId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (requests || []).map((req: any) => ({
      ...req.event,
      gym_name: req.event?.gym?.name,
      gym_city: req.event?.gym?.city,
      gym_country: req.event?.gym?.country,
      request_status: req.status,
    }));
  } catch (error) {
    console.error('Error getting event requests:', error);
    throw error;
  }
}

/**
 * Get approved events for a fighter
 */
export async function getMyApprovedEvents(
  fighterId: string
): Promise<EventWithDistance[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data: requests, error } = await supabase
      .from('event_requests')
      .select(`
        *,
        event:sparring_events (
          *,
          gym:gyms (
            name,
            city,
            country
          )
        )
      `)
      .eq('fighter_id', fighterId)
      .eq('status', 'approved')
      .gte('event.event_date', new Date().toISOString().split('T')[0])
      .order('event.event_date', { ascending: true });

    if (error) throw error;

    return (requests || []).map((req: any) => ({
      ...req.event,
      gym_name: req.event?.gym?.name,
      gym_city: req.event?.gym?.city,
      gym_country: req.event?.gym?.country,
      request_status: req.status,
    }));
  } catch (error) {
    console.error('Error getting approved events:', error);
    throw error;
  }
}

/**
 * Get pending event requests for a gym
 */
export async function getGymPendingRequests(gymId: string): Promise<EventRequestWithDetails[]> {
  if (!isSupabaseConfigured) {
    return getMockPendingRequests();
  }

  try {
    const { data, error } = await supabase
      .from('event_requests')
      .select(`
        *,
        fighter:fighters (
          id,
          first_name,
          last_name,
          avatar_url,
          weight_class,
          experience_level
        ),
        event:sparring_events!inner (
          id,
          title,
          event_date,
          start_time,
          gym_id
        )
      `)
      .eq('event.gym_id', gymId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((req: any) => ({
      id: req.id,
      event_id: req.event_id,
      fighter_id: req.fighter_id,
      status: req.status,
      message: req.message,
      created_at: req.created_at,
      fighter_name: `${req.fighter?.first_name || ''} ${req.fighter?.last_name || ''}`.trim(),
      fighter_avatar: req.fighter?.avatar_url,
      fighter_weight_class: req.fighter?.weight_class,
      event_title: req.event?.title,
      event_date: req.event?.event_date,
    }));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return getMockPendingRequests();
  }
}

export type EventRequestWithDetails = {
  id: string;
  event_id: string;
  fighter_id: string;
  status: string;
  message?: string;
  created_at: string;
  fighter_name: string;
  fighter_avatar?: string;
  fighter_weight_class?: string;
  event_title?: string;
  event_date?: string;
};

/**
 * Approve an event request
 */
export async function approveEventRequest(requestId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would approve request', requestId);
    return;
  }

  const { error } = await supabase
    .from('event_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Decline an event request
 */
export async function declineEventRequest(requestId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would decline request', requestId);
    return;
  }

  const { error } = await supabase
    .from('event_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Get upcoming events for a gym with participant counts
 */
export async function getGymUpcomingEvents(gymId: string): Promise<GymEventSummary[]> {
  if (!isSupabaseConfigured) {
    return getMockGymEvents();
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sparring_events')
      .select('*')
      .eq('gym_id', gymId)
      .gte('event_date', today)
      .in('status', ['published', 'draft'])
      .order('event_date', { ascending: true })
      .limit(10);

    if (error) throw error;

    // Get participant counts for each event
    const eventIds = (data || []).map((e: any) => e.id);
    const { data: requestCounts } = await supabase
      .from('event_requests')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'approved');

    const countMap: Record<string, number> = {};
    (requestCounts || []).forEach((r: any) => {
      countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
    });

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      intensity: event.intensity,
      max_participants: event.max_participants,
      current_participants: countMap[event.id] || event.current_participants || 0,
      status: event.status,
    }));
  } catch (error) {
    console.error('Error getting gym events:', error);
    return getMockGymEvents();
  }
}

export type GymEventSummary = {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  intensity?: string;
  max_participants: number;
  current_participants: number;
  status: string;
};

/**
 * Mock pending requests for demo mode
 */
function getMockPendingRequests(): EventRequestWithDetails[] {
  return [
    {
      id: 'req-1',
      event_id: 'event-1',
      fighter_id: 'fighter-1',
      status: 'pending',
      created_at: new Date().toISOString(),
      fighter_name: 'Marcus Petrov',
      fighter_weight_class: 'middleweight',
      event_title: 'Technical Sparring Session',
      event_date: '2026-02-05',
    },
    {
      id: 'req-2',
      event_id: 'event-1',
      fighter_id: 'fighter-2',
      status: 'pending',
      created_at: new Date().toISOString(),
      fighter_name: 'Sarah Chen',
      fighter_weight_class: 'lightweight',
      event_title: 'Technical Sparring Session',
      event_date: '2026-02-05',
    },
  ];
}

/**
 * Mock gym events for demo mode
 */
function getMockGymEvents(): GymEventSummary[] {
  return [
    {
      id: 'event-1',
      title: 'Technical Sparring Session',
      event_date: '2026-02-05',
      start_time: '18:00',
      end_time: '20:00',
      intensity: 'technical',
      max_participants: 16,
      current_participants: 12,
      status: 'published',
    },
    {
      id: 'event-2',
      title: 'Hard Rounds Friday',
      event_date: '2026-02-08',
      start_time: '19:00',
      end_time: '21:00',
      intensity: 'hard',
      max_participants: 12,
      current_participants: 8,
      status: 'published',
    },
  ];
}

/**
 * Mock events for demo mode
 */
// ============================================
// Check-in Functions
// ============================================

export type AttendeeWithDetails = {
  fighter_id: string;
  fighter_name: string;
  fighter_avatar?: string;
  weight_class?: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  no_show: boolean;
};

/**
 * Get approved fighters with attendance status for an event
 */
export async function getEventAttendees(eventId: string): Promise<AttendeeWithDetails[]> {
  if (!isSupabaseConfigured) {
    return getMockAttendees();
  }

  try {
    // Get approved requests
    const { data: requests, error: reqError } = await supabase
      .from('event_requests')
      .select(`
        fighter_id,
        fighter:fighters (
          id,
          first_name,
          last_name,
          avatar_url,
          weight_class
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'approved');

    if (reqError) throw reqError;

    // Get attendance records
    const { data: attendance, error: attError } = await supabase
      .from('event_attendance')
      .select('*')
      .eq('event_id', eventId);

    if (attError) throw attError;

    const attendanceMap: Record<string, any> = {};
    (attendance || []).forEach((a: any) => {
      attendanceMap[a.fighter_id] = a;
    });

    return (requests || []).map((req: any) => {
      const att = attendanceMap[req.fighter_id];
      return {
        fighter_id: req.fighter_id,
        fighter_name: `${req.fighter?.first_name || ''} ${req.fighter?.last_name || ''}`.trim(),
        fighter_avatar: req.fighter?.avatar_url,
        weight_class: req.fighter?.weight_class,
        checked_in_at: att?.checked_in_at || null,
        checked_out_at: att?.checked_out_at || null,
        no_show: att?.no_show || false,
      };
    });
  } catch (error) {
    console.error('Error getting event attendees:', error);
    return getMockAttendees();
  }
}

/**
 * Check in a fighter to an event
 */
export async function checkInFighter(eventId: string, fighterId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would check in fighter', fighterId);
    return;
  }

  const { error } = await supabase
    .from('event_attendance')
    .upsert({
      event_id: eventId,
      fighter_id: fighterId,
      checked_in_at: new Date().toISOString(),
      no_show: false,
    }, { onConflict: 'event_id,fighter_id' });

  if (error) throw error;
}

/**
 * Check out a fighter from an event
 */
export async function checkOutFighter(eventId: string, fighterId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would check out fighter', fighterId);
    return;
  }

  const { error } = await supabase
    .from('event_attendance')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('fighter_id', fighterId);

  if (error) throw error;
}

/**
 * Mark a fighter as no-show
 */
export async function markNoShow(eventId: string, fighterId: string, reason?: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would mark no-show', fighterId);
    return;
  }

  const { error } = await supabase
    .from('event_attendance')
    .upsert({
      event_id: eventId,
      fighter_id: fighterId,
      no_show: true,
      no_show_reason: reason || null,
    }, { onConflict: 'event_id,fighter_id' });

  if (error) throw error;
}

// ============================================
// Review Functions
// ============================================

export type CreateReviewData = {
  event_id: string;
  fighter_id: string;
  rating: number;
  review_text?: string;
  organization_rating: number;
  facility_rating: number;
  coaching_rating: number;
  would_recommend: boolean;
};

/**
 * Submit or update an event review
 */
export async function submitEventReview(data: CreateReviewData): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would submit review', data);
    return;
  }

  const { error } = await supabase
    .from('event_reviews')
    .upsert({
      event_id: data.event_id,
      fighter_id: data.fighter_id,
      rating: data.rating,
      review_text: data.review_text || null,
      organization_rating: data.organization_rating,
      facility_rating: data.facility_rating,
      coaching_rating: data.coaching_rating,
      would_recommend: data.would_recommend,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_id,fighter_id' });

  if (error) throw error;
}

/**
 * Get all reviews for an event
 */
export async function getEventReviews(eventId: string): Promise<EventReview[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('event_reviews')
      .select(`
        *,
        fighter:fighters (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting event reviews:', error);
    return [];
  }
}

/**
 * Get average rating and count for an event
 */
export async function getEventAverageRating(eventId: string): Promise<{ average: number; count: number }> {
  if (!isSupabaseConfigured) {
    return { average: 0, count: 0 };
  }

  try {
    const { data, error } = await supabase
      .rpc('get_event_average_rating', { event_uuid: eventId });

    if (error) throw error;

    // Get count separately
    const { count, error: countError } = await supabase
      .from('event_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) throw countError;

    return {
      average: data || 0,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error getting event rating:', error);
    return { average: 0, count: 0 };
  }
}

/**
 * Get a fighter's existing review for an event (for pre-populating edit form)
 */
export async function getFighterReview(eventId: string, fighterId: string): Promise<EventReview | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('event_reviews')
      .select('*')
      .eq('event_id', eventId)
      .eq('fighter_id', fighterId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting fighter review:', error);
    return null;
  }
}

// ============================================
// Mock Data Helpers
// ============================================

function getMockAttendees(): AttendeeWithDetails[] {
  return [
    {
      fighter_id: 'fighter-1',
      fighter_name: 'Marcus Petrov',
      weight_class: 'middleweight',
      checked_in_at: null,
      checked_out_at: null,
      no_show: false,
    },
    {
      fighter_id: 'fighter-2',
      fighter_name: 'Sarah Chen',
      weight_class: 'lightweight',
      checked_in_at: new Date().toISOString(),
      checked_out_at: null,
      no_show: false,
    },
    {
      fighter_id: 'fighter-3',
      fighter_name: 'Jake Thompson',
      weight_class: 'welterweight',
      checked_in_at: null,
      checked_out_at: null,
      no_show: false,
    },
  ];
}

function getMockEvents(): EventWithDistance[] {
  return [
    {
      id: 'mock-1',
      gym_id: 'gym-1',
      event_type: 'sparring',
      title: 'Technical Sparring Session',
      description: 'Light contact sparring focused on technique',
      event_date: '2026-02-15',
      start_time: '18:00',
      end_time: '20:00',
      intensity: 'technical',
      weight_classes: ['welterweight', 'middleweight'],
      experience_levels: ['intermediate', 'advanced'],
      max_participants: 16,
      current_participants: 8,
      status: 'published',
      gym_name: 'Elite Boxing Academy',
      gym_city: 'Berlin',
      gym_country: 'Germany',
      distance: 2.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
