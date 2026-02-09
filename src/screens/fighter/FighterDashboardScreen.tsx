import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button, ProfileCompletenessCard } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SparringEvent, Fighter, WEIGHT_CLASS_LABELS, EXPERIENCE_LABELS } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { calculateFighterCompleteness } from '../../utils/profileCompleteness';

// Type for nearby fighters
type NearbyFighter = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  weight_class: string;
  experience_level: string;
  city: string;
  country: string;
};

type FighterDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function FighterDashboardScreen({ navigation }: FighterDashboardScreenProps) {
  const { profile, signOut } = useAuth();
  const fighter = profile as Fighter;

  const [upcomingEvents, setUpcomingEvents] = useState<SparringEvent[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<SparringEvent[]>([]);
  const [nearbyFighters, setNearbyFighters] = useState<NearbyFighter[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate profile completeness
  const profileCompleteness = useMemo(
    () => calculateFighterCompleteness(fighter),
    [fighter]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load upcoming events the fighter is registered for
    const { data: registrations } = await supabase
      .from('event_requests')
      .select(`
        *,
        event:sparring_events(*, gym:gyms(*))
      `)
      .eq('fighter_id', fighter?.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5);

    if (registrations) {
      setUpcomingEvents(
        registrations
          .map((r) => r.event as SparringEvent)
          .filter((e) => e && new Date(e.event_date) >= new Date())
      );
    }

    // Load nearby events (matching weight class)
    const { data: events } = await supabase
      .from('sparring_events')
      .select('*, gym:gyms(*)')
      .eq('status', 'published')
      .contains('weight_classes', [fighter?.weight_class])
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(10);

    if (events) {
      setNearbyEvents(events as SparringEvent[]);
    }

    // Load nearby fighters (same weight class, different from current user)
    const { data: fighters } = await supabase
      .from('fighters')
      .select('id, first_name, last_name, avatar_url, weight_class, experience_level, city, country')
      .eq('weight_class', fighter?.weight_class)
      .neq('id', fighter?.id)
      .limit(10);

    if (fighters) {
      setNearbyFighters(fighters as NearbyFighter[]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{fighter?.first_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('FighterProfile')}
        >
          <Text style={styles.avatarText}>
            {fighter?.first_name?.charAt(0)}
            {fighter?.last_name?.charAt(0)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Completeness */}
      <ProfileCompletenessCard
        completeness={profileCompleteness}
        onPress={() => navigation.navigate('FighterProfile')}
      />

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{fighter?.sparring_count || 0}</Text>
          <Text style={styles.statLabel}>Sparring Sessions</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{fighter?.fights_count || 0}</Text>
          <Text style={styles.statLabel}>Fights</Text>
        </Card>
      </View>

      {/* Profile Summary */}
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Weight</Text>
            <Text style={styles.profileValue}>
              {fighter?.weight_class
                ? WEIGHT_CLASS_LABELS[fighter.weight_class]
                : 'Not set'}
            </Text>
          </View>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Experience</Text>
            <Text style={styles.profileValue}>
              {fighter?.experience_level
                ? EXPERIENCE_LABELS[fighter.experience_level]
                : 'Not set'}
            </Text>
          </View>
        </View>
        <View style={styles.profileRow}>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Location</Text>
            <Text style={styles.profileValue}>
              {fighter?.city}, {fighter?.country}
            </Text>
          </View>
        </View>
      </Card>

      {/* Your Next Event - Highlighted */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Next Event</Text>
          <TouchableOpacity
            style={styles.nextEventCard}
            onPress={() => navigation.navigate('EventDetail', { eventId: upcomingEvents[0].id })}
          >
            <View style={styles.nextEventHeader}>
              <View style={styles.nextEventBadge}>
                <Text style={styles.nextEventBadgeText}>CONFIRMED</Text>
              </View>
              <Text style={styles.nextEventDate}>{formatDate(upcomingEvents[0].event_date)}</Text>
            </View>
            <Text style={styles.nextEventTitle}>{upcomingEvents[0].title}</Text>
            <Text style={styles.nextEventGym}>@ {upcomingEvents[0].gym?.name}</Text>
            <View style={styles.nextEventFooter}>
              <View style={styles.nextEventTime}>
                <Ionicons name="time-outline" size={14} color={colors.neutral[400]} />
                <Text style={styles.nextEventTimeText}>
                  {upcomingEvents[0].start_time} - {upcomingEvents[0].end_time}
                </Text>
              </View>
              <TouchableOpacity style={styles.nextEventAction}>
                <Ionicons name="navigate-outline" size={16} color={colors.primary[500]} />
                <Text style={styles.nextEventActionText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Other Upcoming Events */}
      {upcomingEvents.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Upcoming Events</Text>
          {upcomingEvents.slice(1).map((event) => (
            <Card
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>Confirmed</Text>
                </View>
              </View>
              <Text style={styles.eventGym}>{event.gym?.name}</Text>
              <View style={styles.eventMeta}>
                <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                <Text style={styles.eventTime}>
                  {event.start_time} - {event.end_time}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* No Events Fallback */}
      {upcomingEvents.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Upcoming Events</Text>
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={colors.neutral[500]} />
            <Text style={styles.emptyText}>No upcoming events</Text>
            <Text style={styles.emptySubtext}>
              Browse events to find sparring opportunities
            </Text>
          </Card>
        </View>
      )}

      {/* Fighters Near You */}
      {nearbyFighters.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fighters Near You</Text>
            <Text style={styles.sectionSubtitle}>Looking for sparring</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fightersScroll}
          >
            {nearbyFighters.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.fighterCard}
                onPress={() => navigation.navigate('FighterProfileView', { fighterId: f.id })}
              >
                <View style={styles.fighterAvatar}>
                  {f.avatar_url ? (
                    <Image source={{ uri: f.avatar_url }} style={styles.fighterAvatarImage} />
                  ) : (
                    <Text style={styles.fighterAvatarText}>
                      {f.first_name?.charAt(0)}{f.last_name?.charAt(0)}
                    </Text>
                  )}
                </View>
                <Text style={styles.fighterName} numberOfLines={1}>
                  {f.first_name} {f.last_name?.charAt(0)}.
                </Text>
                <Text style={styles.fighterWeight} numberOfLines={1}>
                  {f.weight_class ? WEIGHT_CLASS_LABELS[f.weight_class as keyof typeof WEIGHT_CLASS_LABELS]?.split(' ')[0] : ''}
                </Text>
                <Text style={styles.fighterLocation} numberOfLines={1}>
                  {f.city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Nearby Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Events Near You</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EventsTab')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {nearbyEvents.length > 0 ? (
          nearbyEvents.slice(0, 3).map((event) => (
            <Card
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventSpots}>
                  {event.max_participants - event.current_participants} spots
                </Text>
              </View>
              <Text style={styles.eventGym}>{event.gym?.name}</Text>
              <View style={styles.eventMeta}>
                <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                <Text style={styles.eventLocation}>
                  {event.gym?.city}, {event.gym?.country}
                </Text>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new events in your area
            </Text>
          </Card>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Button
          title="Find Events"
          onPress={() => navigation.navigate('EventsTab')}
          size="lg"
        />
        <Button
          title="Sign Out"
          onPress={signOut}
          variant="ghost"
          size="lg"
          style={{ marginTop: spacing[2] }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
    marginTop: spacing[4],
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
    color: colors.neutral[50],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[4],
  },
  statValue: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.display,
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary[500],
    marginTop: spacing[1],
  },
  profileCard: {
    marginBottom: spacing[6],
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  profileItem: {
    flex: 1,
  },
  profileLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  profileValue: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[200],
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.displayMedium,
    color: colors.neutral[50],
    marginBottom: spacing[3],
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },
  eventCard: {
    marginBottom: spacing[3],
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  eventTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    flex: 1,
  },
  eventBadge: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  eventBadgeText: {
    color: colors.success,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  eventSpots: {
    color: colors.secondary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  eventGym: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginBottom: spacing[2],
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventDate: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontWeight: '500',
  },
  eventTime: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  eventLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing[6],
    gap: spacing[2],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
    marginBottom: spacing[1],
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing[4],
  },
  // Next Event Card styles
  nextEventCard: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    padding: spacing[4],
  },
  nextEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  nextEventBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  nextEventBadgeText: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  nextEventDate: {
    color: colors.neutral[100],
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  nextEventTitle: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing[1],
  },
  nextEventGym: {
    color: colors.neutral[200],
    fontSize: typography.fontSize.base,
    marginBottom: spacing[3],
  },
  nextEventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: spacing[3],
  },
  nextEventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  nextEventTimeText: {
    color: colors.neutral[200],
    fontSize: typography.fontSize.sm,
  },
  nextEventAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  nextEventActionText: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  // Section subtitle
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  // Fighters section
  fightersScroll: {
    paddingRight: spacing[4],
    gap: spacing[3],
  },
  fighterCard: {
    width: 100,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  fighterAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    overflow: 'hidden',
  },
  fighterAvatarImage: {
    width: 56,
    height: 56,
  },
  fighterAvatarText: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  fighterName: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  fighterWeight: {
    color: colors.primary[400],
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  fighterLocation: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing[1],
  },
});
