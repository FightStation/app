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
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Card,
  ProfileCompletenessCard,
  MatchScoreBadge,
  SkeletonCard,
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
  EmptyState,
  PulseIndicator,
  ProgressRing,
  AnimatedListItem,
} from '../../components';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SparringEvent, Fighter, WEIGHT_CLASS_LABELS, MatchScore } from '../../types';
import { colors, spacing, typography, borderRadius, gradients, textStyles, animations } from '../../lib/theme';
import { calculateFighterCompleteness } from '../../utils/profileCompleteness';
import { useMatching } from '../../_deprecated/hooks/useMatching';

type FighterDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function FighterDashboardScreen({ navigation }: FighterDashboardScreenProps) {
  const { profile, signOut } = useAuth();
  const fighter = profile as Fighter;
  const insets = useSafeAreaInsets();

  const [upcomingEvents, setUpcomingEvents] = useState<SparringEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Smart matching for discovery sections
  const { events: matchedEvents, partners: matchedPartners, loading: matchingLoading, refreshAll } = useMatching({
    fighterId: fighter?.id,
    limit: 10,
    autoFetch: true,
  });

  // Calculate profile completeness
  const profileCompleteness = useMemo(
    () => calculateFighterCompleteness(fighter),
    [fighter]
  );

  // Animated scroll value
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshAll()]);
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

  // Calculate days until an event
  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary[500]}
        />
      }
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {/* Header with warm gradient glow */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={gradients.warmGlow}
          style={styles.headerGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{fighter?.first_name}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('FighterProfile')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {fighter?.first_name?.charAt(0)}
                {fighter?.last_name?.charAt(0)}
              </Text>
            </View>
            <View style={styles.pulseWrapper}>
              <PulseIndicator color={colors.success} size="sm" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Completeness */}
      <ProfileCompletenessCard
        completeness={profileCompleteness}
        onPress={() => navigation.navigate('FighterProfile')}
      />

      {/* Your Next Event - Hero Card */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Your Next Event" />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EventDetail', { eventId: upcomingEvents[0].id })}
          >
            <LinearGradient
              colors={gradients.primaryToDeep}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextEventCard}
            >
              <View style={styles.nextEventContent}>
                <View style={styles.nextEventLeft}>
                  <View style={styles.nextEventHeader}>
                    <View style={styles.nextEventBadge}>
                      <Text style={styles.nextEventBadgeText}>CONFIRMED</Text>
                    </View>
                    <Text style={styles.nextEventDate}>{formatDate(upcomingEvents[0].event_date)}</Text>
                  </View>
                  <Text style={styles.nextEventTitle}>{upcomingEvents[0].title}</Text>
                  <Text style={styles.nextEventGym}>@ {upcomingEvents[0].gym?.name}</Text>
                </View>
                <View style={styles.nextEventRing}>
                  <ProgressRing
                    progress={Math.max(0, 100 - getDaysUntil(upcomingEvents[0].event_date) * 3.33)}
                    size={56}
                    strokeWidth={4}
                    color="rgba(255,255,255,0.9)"
                    backgroundColor="rgba(255,255,255,0.2)"
                    showLabel={false}
                  >
                    <View style={styles.ringLabel}>
                      <Text style={styles.ringDays}>{getDaysUntil(upcomingEvents[0].event_date)}</Text>
                      <Text style={styles.ringDaysLabel}>days</Text>
                    </View>
                  </ProgressRing>
                </View>
              </View>
              <View style={styles.nextEventFooter}>
                <View style={styles.nextEventTime}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.nextEventTimeText}>
                    {upcomingEvents[0].start_time} - {upcomingEvents[0].end_time}
                  </Text>
                </View>
                <TouchableOpacity style={styles.nextEventAction}>
                  <Ionicons name="navigate-outline" size={16} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.nextEventActionText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* No Events Fallback */}
      {upcomingEvents.length === 0 && (
        <View style={styles.section}>
          <SectionHeader title="Your Upcoming Events" />
          <EmptyState
            icon="calendar-outline"
            title="No Upcoming Events"
            description="Browse events to find sparring opportunities"
            actionLabel="Find Events"
            onAction={() => navigation.navigate('MatchesTab')}
          />
        </View>
      )}

      {/* Quick Stats - 3 StatCards */}
      <View style={styles.statsRow}>
        <StatCard
          icon="flash"
          value={fighter?.sparring_count || 0}
          label="Sessions"
          accentColor={colors.primary[500]}
        />
        <StatCard
          icon="trophy"
          value={fighter?.fights_count || 0}
          label="Fights"
          accentColor={colors.warning}
        />
        <StatCard
          icon="star"
          value="4.9"
          label="Rating"
          accentColor={colors.info}
        />
      </View>

      {/* Recommended Sparring Partners */}
      <View style={styles.section}>
        <SectionHeader title="Recommended Partners" subtitle="Based on your profile" />
        {matchingLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fightersScroll}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.fighterCard}>
                <View style={[styles.fighterAvatar, { backgroundColor: colors.surfaceLight }]} />
                <View style={{ width: 60, height: 12, backgroundColor: colors.surfaceLight, borderRadius: 4, marginTop: spacing[2] }} />
                <View style={{ width: 40, height: 10, backgroundColor: colors.surfaceLight, borderRadius: 4, marginTop: spacing[1] }} />
              </View>
            ))}
          </ScrollView>
        ) : matchedPartners.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fightersScroll}
          >
            {matchedPartners.map((match: MatchScore, index: number) => {
              const f = match.fighter;
              if (!f) return null;
              return (
                <AnimatedListItem key={match.entity_id} index={index}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('FighterProfileView', { fighterId: match.entity_id })}
                  >
                    <GlassCard style={styles.fighterCard}>
                      <View style={styles.matchBadgeContainer}>
                        <MatchScoreBadge score={match.overall_score} />
                      </View>
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
                      {match.reasons.length > 0 && (
                        <Text style={styles.matchReason} numberOfLines={1}>
                          {match.reasons[0]}
                        </Text>
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                </AnimatedListItem>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState
            icon="people-outline"
            title="No Partners Found"
            description="Complete your profile for better matches"
          />
        )}
      </View>

      {/* Other Upcoming Events */}
      {upcomingEvents.length > 1 && (
        <View style={styles.section}>
          <SectionHeader title="Your Upcoming Events" />
          {upcomingEvents.slice(1).map((event, i) => (
            <AnimatedListItem key={event.id} index={i}>
              <GlassCard
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
              </GlassCard>
            </AnimatedListItem>
          ))}
        </View>
      )}

      {/* Recommended Events */}
      <View style={styles.section}>
        <SectionHeader
          title="Recommended Events"
          onSeeAll={() => navigation.navigate('MatchesTab')}
        />

        {matchingLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : matchedEvents.length > 0 ? (
          matchedEvents.slice(0, 3).map((match: MatchScore, i: number) => {
            const event = match.event;
            if (!event) return null;
            // Determine sport color for the accent bar
            const sportType = (event as any).sport_type as string | undefined;
            const sportColorKey = sportType as keyof typeof colors.sport;
            const accentColor = sportType && colors.sport[sportColorKey]
              ? colors.sport[sportColorKey]
              : colors.primary[500];
            return (
              <AnimatedListItem key={match.entity_id} index={i}>
                <GlassCard
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('EventDetail', { eventId: match.entity_id })}
                  accentColor={accentColor}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <MatchScoreBadge score={match.overall_score} />
                  </View>
                  <Text style={styles.eventGym}>{event.gym?.name}</Text>
                  {match.reasons.length > 0 && (
                    <Text style={styles.matchReasonEvent}>
                      {match.reasons.slice(0, 2).join(' \u00B7 ')}
                    </Text>
                  )}
                  <View style={styles.eventMeta}>
                    <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                    <Text style={styles.eventLocation}>
                      {event.gym?.city}, {event.gym?.country}
                    </Text>
                  </View>
                </GlassCard>
              </AnimatedListItem>
            );
          })
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No Events Found"
            description="Check back later for new events in your area"
            actionLabel="Find Events"
            onAction={() => navigation.navigate('MatchesTab')}
          />
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <GradientButton
          title="Find Events"
          onPress={() => navigation.navigate('MatchesTab')}
          icon="search"
          fullWidth
        />
        <View style={styles.actionSpacer} />
        <GradientButton
          title="Find Partners"
          onPress={() => navigation.navigate('ExploreTab')}
          icon="people"
          fullWidth
          gradient={['#3B82F6', '#1D4ED8']}
        />
      </View>
    </Animated.ScrollView>
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
  // Header
  headerWrapper: {
    position: 'relative',
    marginBottom: spacing[6],
    marginTop: spacing[4],
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    height: 160,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: 28,
    color: colors.neutral[50],
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  avatarText: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  pulseWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  // Sections
  section: {
    marginBottom: spacing[6],
  },
  // Event card shared styles
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
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
    color: colors.neutral[50],
    flex: 1,
    marginRight: spacing[2],
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
  matchReasonEvent: {
    fontSize: typography.fontSize.xs,
    color: colors.secondary[400],
    marginBottom: spacing[2],
  },
  // Next Event Hero Card
  nextEventCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    overflow: 'hidden',
  },
  nextEventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nextEventLeft: {
    flex: 1,
    marginRight: spacing[3],
  },
  nextEventRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  ringLabel: {
    alignItems: 'center',
  },
  ringDays: {
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  ringDaysLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    marginTop: spacing[3],
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
  // Fighters section
  fightersScroll: {
    paddingRight: spacing[4],
    gap: spacing[3],
  },
  fighterCard: {
    width: 130,
    alignItems: 'center',
    padding: spacing[3],
  },
  matchBadgeContainer: {
    alignSelf: 'flex-end',
    marginBottom: spacing[1],
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
  matchReason: {
    color: colors.secondary[400],
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing[1],
  },
  // Quick Actions
  actions: {
    marginTop: spacing[4],
  },
  actionSpacer: {
    height: spacing[3],
  },
});
