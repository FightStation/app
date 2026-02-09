import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Fighter,
  Gym,
  SparringEvent,
  WeightClass,
  ExperienceLevel,
  CombatSport,
  MatchScore,
  MatchScoreBreakdown,
  MatchingCriteria,
  WEIGHT_CLASS_ORDER,
  EXPERIENCE_ORDER,
} from '../types';

// ============================================
// SCORING UTILITIES
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Score weight class compatibility (0-100)
 */
function scoreWeightClass(
  fighterWc: WeightClass,
  targetWc: WeightClass | WeightClass[]
): number {
  const targets = Array.isArray(targetWc) ? targetWc : [targetWc];
  const fighterIdx = WEIGHT_CLASS_ORDER.indexOf(fighterWc);

  // Find closest matching weight class
  let bestScore = 0;
  for (const target of targets) {
    const targetIdx = WEIGHT_CLASS_ORDER.indexOf(target);
    const distance = Math.abs(fighterIdx - targetIdx);

    let score: number;
    if (distance === 0) score = 100;
    else if (distance === 1) score = 80;
    else if (distance === 2) score = 60;
    else if (distance === 3) score = 30;
    else score = 0;

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

/**
 * Score experience level compatibility (0-100)
 */
function scoreExperience(
  fighterExp: ExperienceLevel,
  targetExp: ExperienceLevel | ExperienceLevel[]
): number {
  const targets = Array.isArray(targetExp) ? targetExp : [targetExp];
  const fighterIdx = EXPERIENCE_ORDER.indexOf(fighterExp);

  let bestScore = 0;
  for (const target of targets) {
    const targetIdx = EXPERIENCE_ORDER.indexOf(target);
    const distance = Math.abs(fighterIdx - targetIdx);

    let score: number;
    if (distance === 0) score = 100;
    else if (distance === 1) score = 70;
    else if (distance === 2) score = 40;
    else score = 10;

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

/**
 * Score location proximity (0-100)
 * Uses city/country string matching as fallback when coordinates unavailable
 */
function scoreLocation(
  fighterCity: string,
  fighterCountry: string,
  targetCity: string,
  targetCountry: string,
  fighterLat?: number,
  fighterLon?: number,
  targetLat?: number,
  targetLon?: number,
  maxDistanceKm: number = 50
): number {
  // If we have coordinates, use distance
  if (fighterLat && fighterLon && targetLat && targetLon) {
    const distance = calculateDistanceKm(fighterLat, fighterLon, targetLat, targetLon);
    if (distance <= 5) return 100;
    if (distance <= 10) return 90;
    if (distance <= 20) return 70;
    if (distance <= maxDistanceKm) return 50;
    return Math.max(0, 30 - Math.floor((distance - maxDistanceKm) / 10));
  }

  // Fallback: string-based matching
  const sameCity = fighterCity.toLowerCase() === targetCity.toLowerCase();
  const sameCountry = fighterCountry.toLowerCase() === targetCountry.toLowerCase();

  if (sameCity && sameCountry) return 100;
  if (sameCountry) return 50;
  return 10;
}

/**
 * Score sport compatibility (0-100)
 */
function scoreSports(
  fighterSports: CombatSport[],
  targetSports: CombatSport[]
): number {
  if (!fighterSports.length || !targetSports.length) return 50; // No data = neutral

  const overlap = fighterSports.filter(s => targetSports.includes(s));
  if (overlap.length === 0) return 0;

  // Score based on overlap ratio
  return Math.round((overlap.length / fighterSports.length) * 100);
}

// ============================================
// EVENT MATCHING
// ============================================

/**
 * Find events that match a fighter's profile
 */
export async function getMatchingEvents(
  fighterId: string,
  criteria?: Partial<MatchingCriteria>,
  limit: number = 20
): Promise<MatchScore[]> {
  if (!isSupabaseConfigured) {
    return getMockMatchingEvents(fighterId, limit);
  }

  try {
    // 1. Get fighter profile
    const { data: fighter, error: fErr } = await supabase
      .from('fighters')
      .select('*')
      .eq('id', fighterId)
      .single();

    if (fErr || !fighter) return [];

    // 2. Fetch upcoming published events with gym data
    const { data: events, error: eErr } = await supabase
      .from('sparring_events')
      .select('*, gym:gyms(*)')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(50);

    if (eErr || !events) return [];

    // 3. Score each event
    const scores: MatchScore[] = events.map((event: any) => {
      const gym = event.gym as Gym;
      const reasons: string[] = [];

      const wcScore = scoreWeightClass(
        criteria?.weight_class || fighter.weight_class,
        event.weight_classes || []
      );
      if (wcScore >= 80) reasons.push(`Matches your weight class`);

      const expScore = scoreExperience(
        criteria?.experience_level || fighter.experience_level,
        event.experience_levels || []
      );
      if (expScore >= 70) reasons.push(`Right experience level`);

      const locScore = scoreLocation(
        fighter.city, fighter.country,
        gym?.city || '', gym?.country || '',
        undefined, undefined,
        gym?.latitude || undefined, gym?.longitude || undefined
      );
      if (locScore >= 80) reasons.push(`Near your location`);

      const sportScore = scoreSports(
        fighter.sports || [],
        gym?.sports || []
      );
      if (sportScore >= 80) reasons.push(`Matches your sport`);

      // Weighted overall
      const overallScore = Math.round(
        wcScore * 0.4 +
        expScore * 0.3 +
        locScore * 0.2 +
        sportScore * 0.1
      );

      return {
        entity_id: event.id,
        entity_type: 'event' as const,
        overall_score: overallScore,
        breakdown: {
          weight_class_score: wcScore,
          experience_score: expScore,
          location_score: locScore,
          availability_score: 100,
          sport_match_score: sportScore,
        },
        reasons,
        event: { ...event, gym },
      };
    });

    // 4. Sort by score and return top results
    return scores
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error matching events:', error);
    return [];
  }
}

// ============================================
// FIGHTER MATCHING (Sparring Partners)
// ============================================

/**
 * Find fighters looking for sparring partners
 */
export async function getMatchingSparringPartners(
  fighterId: string,
  criteria?: Partial<MatchingCriteria>,
  limit: number = 20
): Promise<MatchScore[]> {
  if (!isSupabaseConfigured) {
    return getMockMatchingFighters(fighterId, limit);
  }

  try {
    // 1. Get current fighter
    const { data: fighter, error: fErr } = await supabase
      .from('fighters')
      .select('*')
      .eq('id', fighterId)
      .single();

    if (fErr || !fighter) return [];

    // 2. Fetch active fighters (exclude self)
    const { data: fighters, error: aErr } = await supabase
      .from('fighters')
      .select('*')
      .neq('id', fighterId)
      .eq('is_active', true)
      .limit(100);

    if (aErr || !fighters) return [];

    // 3. Score each fighter
    const scores: MatchScore[] = fighters.map((target: Fighter) => {
      const reasons: string[] = [];

      const wcScore = scoreWeightClass(
        criteria?.weight_class || fighter.weight_class,
        target.weight_class
      );
      if (wcScore === 100) reasons.push(`Same weight class`);
      else if (wcScore >= 60) reasons.push(`Compatible weight`);

      const expScore = scoreExperience(
        criteria?.experience_level || fighter.experience_level,
        target.experience_level
      );
      if (expScore >= 70) reasons.push(`Similar experience`);

      const locScore = scoreLocation(
        fighter.city, fighter.country,
        target.city, target.country
      );
      if (locScore >= 80) reasons.push(`In your area`);

      const sportScore = scoreSports(
        fighter.sports || [],
        target.sports || []
      );
      if (sportScore >= 80) reasons.push(`Same sport`);

      // Weighted: heavier on weight class for safety
      const overallScore = Math.round(
        wcScore * 0.45 +
        expScore * 0.35 +
        locScore * 0.15 +
        sportScore * 0.05
      );

      return {
        entity_id: target.id,
        entity_type: 'fighter' as const,
        overall_score: overallScore,
        breakdown: {
          weight_class_score: wcScore,
          experience_score: expScore,
          location_score: locScore,
          availability_score: 100,
          sport_match_score: sportScore,
        },
        reasons,
        fighter: target,
      };
    });

    // Filter out poor matches (below 30 = unsafe weight class mismatch)
    return scores
      .filter(s => s.breakdown.weight_class_score >= 30)
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error matching fighters:', error);
    return [];
  }
}

// ============================================
// GYM RECOMMENDATIONS
// ============================================

/**
 * Recommend gyms based on fighter preferences
 */
export async function getRecommendedGyms(
  fighterId: string,
  criteria?: Partial<MatchingCriteria>,
  limit: number = 20
): Promise<MatchScore[]> {
  if (!isSupabaseConfigured) {
    return getMockMatchingGyms(fighterId, limit);
  }

  try {
    // 1. Get fighter profile
    const { data: fighter, error: fErr } = await supabase
      .from('fighters')
      .select('*')
      .eq('id', fighterId)
      .single();

    if (fErr || !fighter) return [];

    // 2. Fetch active gyms
    const { data: gyms, error: gErr } = await supabase
      .from('gyms')
      .select('*')
      .limit(100);

    if (gErr || !gyms) return [];

    // 3. Get event counts per gym (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: eventCounts } = await supabase
      .from('sparring_events')
      .select('gym_id')
      .gte('event_date', thirtyDaysAgo.toISOString().split('T')[0])
      .eq('status', 'published');

    const gymEventCounts: Record<string, number> = {};
    (eventCounts || []).forEach((e: any) => {
      gymEventCounts[e.gym_id] = (gymEventCounts[e.gym_id] || 0) + 1;
    });

    // 4. Score each gym
    const scores: MatchScore[] = gyms.map((gym: Gym) => {
      const reasons: string[] = [];

      const sportScore = scoreSports(
        fighter.sports || [],
        gym.sports || []
      );
      if (sportScore >= 80) reasons.push(`Offers your sport`);

      const locScore = scoreLocation(
        fighter.city, fighter.country,
        gym.city, gym.country,
        undefined, undefined,
        gym.latitude || undefined, gym.longitude || undefined
      );
      if (locScore >= 80) reasons.push(`Near you`);

      // Event frequency score
      const eventCount = gymEventCounts[gym.id] || 0;
      let eventFreqScore: number;
      if (eventCount === 0) eventFreqScore = 0;
      else if (eventCount <= 2) eventFreqScore = 40;
      else if (eventCount <= 5) eventFreqScore = 70;
      else eventFreqScore = 100;
      if (eventFreqScore >= 70) reasons.push(`Active events (${eventCount}/month)`);

      const overallScore = Math.round(
        sportScore * 0.4 +
        locScore * 0.3 +
        eventFreqScore * 0.2 +
        50 * 0.1 // placeholder for rating
      );

      return {
        entity_id: gym.id,
        entity_type: 'gym' as const,
        overall_score: overallScore,
        breakdown: {
          weight_class_score: 0,
          experience_score: 0,
          location_score: locScore,
          availability_score: 100,
          sport_match_score: sportScore,
          event_frequency_score: eventFreqScore,
        },
        reasons,
        gym,
      };
    });

    return scores
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error matching gyms:', error);
    return [];
  }
}

// ============================================
// MOCK DATA FOR DEMO MODE
// ============================================

function getMockMatchingEvents(fighterId: string, limit: number): MatchScore[] {
  const mockEvents: MatchScore[] = [
    {
      entity_id: 'evt-1',
      entity_type: 'event',
      overall_score: 92,
      breakdown: {
        weight_class_score: 100,
        experience_score: 100,
        location_score: 80,
        availability_score: 100,
        sport_match_score: 100,
      },
      reasons: ['Matches your weight class', 'Right experience level', 'Near your location'],
      event: {
        id: 'evt-1',
        gym_id: 'gym-1',
        title: 'Open Sparring Day',
        event_type: 'sparring',
        intensity: 'moderate',
        description: 'All-levels sparring session',
        event_date: getNextDate(2),
        start_time: '14:00',
        end_time: '17:00',
        weight_classes: ['middleweight', 'light_middleweight', 'welterweight'],
        max_participants: 16,
        current_participants: 8,
        experience_levels: ['intermediate', 'advanced'],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        gym: {
          id: 'gym-1', user_id: 'u1', name: 'Elite Boxing Academy',
          city: 'Berlin', country: 'Germany', address: 'Friedrichstr. 123',
          photos: [], facilities: [], contact_email: 'info@elite.de',
          sports: ['boxing', 'kickboxing'],
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        },
      },
    },
    {
      entity_id: 'evt-2',
      entity_type: 'event',
      overall_score: 85,
      breakdown: {
        weight_class_score: 80,
        experience_score: 100,
        location_score: 100,
        availability_score: 100,
        sport_match_score: 80,
      },
      reasons: ['Compatible weight', 'Right experience level', 'Near your location'],
      event: {
        id: 'evt-2',
        gym_id: 'gym-2',
        title: 'Technical Sparring Session',
        event_type: 'sparring',
        intensity: 'technical',
        description: 'Focus on technique and timing',
        event_date: getNextDate(5),
        start_time: '18:00',
        end_time: '20:00',
        weight_classes: ['welterweight', 'light_middleweight'],
        max_participants: 10,
        current_participants: 4,
        experience_levels: ['intermediate', 'advanced', 'pro'],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        gym: {
          id: 'gym-2', user_id: 'u2', name: 'Iron Fist MMA',
          city: 'Berlin', country: 'Germany', address: 'Alexanderplatz 45',
          photos: [], facilities: [], contact_email: 'hello@ironfist.de',
          sports: ['mma', 'boxing'],
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        },
      },
    },
    {
      entity_id: 'evt-3',
      entity_type: 'event',
      overall_score: 74,
      breakdown: {
        weight_class_score: 100,
        experience_score: 70,
        location_score: 50,
        availability_score: 100,
        sport_match_score: 100,
      },
      reasons: ['Matches your weight class', 'Matches your sport'],
      event: {
        id: 'evt-3',
        gym_id: 'gym-3',
        title: 'Friday Fight Night',
        event_type: 'sparring',
        intensity: 'hard',
        description: 'Competitive sparring for experienced fighters',
        event_date: getNextDate(7),
        start_time: '19:00',
        end_time: '22:00',
        weight_classes: ['middleweight', 'light_heavyweight'],
        max_participants: 20,
        current_participants: 14,
        experience_levels: ['advanced', 'pro'],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        gym: {
          id: 'gym-3', user_id: 'u3', name: 'Warriors Gym',
          city: 'Hamburg', country: 'Germany', address: 'Reeperbahn 10',
          photos: [], facilities: [], contact_email: 'info@warriors.de',
          sports: ['boxing', 'muay_thai'],
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        },
      },
    },
  ];

  return mockEvents.slice(0, limit);
}

function getMockMatchingFighters(fighterId: string, limit: number): MatchScore[] {
  const mockFighters: MatchScore[] = [
    {
      entity_id: 'f-1',
      entity_type: 'fighter',
      overall_score: 95,
      breakdown: {
        weight_class_score: 100,
        experience_score: 100,
        location_score: 100,
        availability_score: 100,
      },
      reasons: ['Same weight class', 'Similar experience', 'In your area'],
      fighter: {
        id: 'f-1', user_id: 'u10', first_name: 'Max', last_name: 'Richter',
        weight_class: 'middleweight', experience_level: 'intermediate',
        sports: ['boxing'], country: 'Germany', city: 'Berlin',
        fights_count: 3, sparring_count: 15,
        record: '3-1-0', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      },
    },
    {
      entity_id: 'f-2',
      entity_type: 'fighter',
      overall_score: 87,
      breakdown: {
        weight_class_score: 80,
        experience_score: 100,
        location_score: 100,
        availability_score: 100,
      },
      reasons: ['Compatible weight', 'Similar experience', 'In your area'],
      fighter: {
        id: 'f-2', user_id: 'u11', first_name: 'Andrei', last_name: 'Petrov',
        weight_class: 'welterweight', experience_level: 'advanced',
        sports: ['boxing', 'kickboxing'], country: 'Germany', city: 'Berlin',
        fights_count: 8, sparring_count: 40,
        record: '6-2-0', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      },
    },
    {
      entity_id: 'f-3',
      entity_type: 'fighter',
      overall_score: 78,
      breakdown: {
        weight_class_score: 100,
        experience_score: 70,
        location_score: 50,
        availability_score: 100,
      },
      reasons: ['Same weight class', 'Similar experience'],
      fighter: {
        id: 'f-3', user_id: 'u12', first_name: 'Tomas', last_name: 'Kask',
        weight_class: 'middleweight', experience_level: 'beginner',
        sports: ['mma'], country: 'Germany', city: 'Hamburg',
        fights_count: 0, sparring_count: 5,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      },
    },
  ];

  return mockFighters.slice(0, limit);
}

function getMockMatchingGyms(fighterId: string, limit: number): MatchScore[] {
  const mockGyms: MatchScore[] = [
    {
      entity_id: 'gym-1',
      entity_type: 'gym',
      overall_score: 90,
      breakdown: {
        weight_class_score: 0,
        experience_score: 0,
        location_score: 100,
        availability_score: 100,
        sport_match_score: 100,
        event_frequency_score: 100,
      },
      reasons: ['Offers your sport', 'Near you', 'Active events (8/month)'],
      gym: {
        id: 'gym-1', user_id: 'u1', name: 'Elite Boxing Academy',
        city: 'Berlin', country: 'Germany', address: 'Friedrichstr. 123',
        photos: [], facilities: ['Ring', 'Heavy Bags', 'Weights'],
        contact_email: 'info@elite.de', sports: ['boxing', 'kickboxing'],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      },
    },
    {
      entity_id: 'gym-2',
      entity_type: 'gym',
      overall_score: 82,
      breakdown: {
        weight_class_score: 0,
        experience_score: 0,
        location_score: 100,
        availability_score: 100,
        sport_match_score: 80,
        event_frequency_score: 70,
      },
      reasons: ['Offers your sport', 'Near you', 'Active events (4/month)'],
      gym: {
        id: 'gym-2', user_id: 'u2', name: 'Iron Fist MMA',
        city: 'Berlin', country: 'Germany', address: 'Alexanderplatz 45',
        photos: [], facilities: ['Cage', 'Mats', 'Bags'],
        contact_email: 'hello@ironfist.de', sports: ['mma', 'boxing'],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      },
    },
  ];

  return mockGyms.slice(0, limit);
}

// Helper to get a future date string
function getNextDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}