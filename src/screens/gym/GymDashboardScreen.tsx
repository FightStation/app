import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Gym } from '../../types';
import { colors, spacing, typography, borderRadius, gradients, textStyles, glass, animations } from '../../lib/theme';
import {
  ProfileCompletenessCard,
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
  EmptyState,
  PulseIndicator,
  AnimatedListItem,
} from '../../components';
import { calculateGymCompleteness } from '../../utils/profileCompleteness';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  getGymPendingRequests,
  getGymUpcomingEvents,
  approveEventRequest,
  declineEventRequest,
  EventRequestWithDetails,
  GymEventSummary,
} from '../../services/events';

type NearbyFighter = {
  id: string;
  first_name: string;
  last_name: string;
  weight_class: string;
  experience_level: string;
  city: string;
};

type GymDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function GymDashboardScreen({ navigation }: GymDashboardScreenProps) {
  const { profile, signOut } = useAuth();
  const gym = profile as Gym;

  // State for real data
  const [pendingRequests, setPendingRequests] = useState<EventRequestWithDetails[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<GymEventSummary[]>([]);
  const [nearbyFighters, setNearbyFighters] = useState<NearbyFighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Calculate profile completeness
  const profileCompleteness = useMemo(
    () => calculateGymCompleteness(gym),
    [gym]
  );

  // Mock data for demo mode
  const getMockPendingRequests = (): EventRequestWithDetails[] => [
    {
      id: 'mock-1',
      event_id: 'event-1',
      fighter_id: 'fighter-1',
      status: 'pending',
      created_at: new Date().toISOString(),
      fighter_name: 'John Doe',
      fighter_weight_class: 'Middleweight',
      event_title: 'Open Sparring Session',
      event_date: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'mock-2',
      event_id: 'event-1',
      fighter_id: 'fighter-2',
      status: 'pending',
      created_at: new Date().toISOString(),
      fighter_name: 'Mike Smith',
      fighter_weight_class: 'Welterweight',
      event_title: 'Open Sparring Session',
      event_date: new Date(Date.now() + 86400000).toISOString(),
    },
  ];

  const getMockUpcomingEvents = (): GymEventSummary[] => [
    {
      id: 'event-1',
      title: 'Open Sparring Session',
      event_date: new Date(Date.now() + 86400000).toISOString(),
      start_time: '14:00',
      end_time: '16:00',
      intensity: 'moderate',
      max_participants: 12,
      current_participants: 8,
      status: 'published',
    },
    {
      id: 'event-2',
      title: 'Advanced Training',
      event_date: new Date(Date.now() + 172800000).toISOString(),
      start_time: '10:00',
      end_time: '12:00',
      intensity: 'hard',
      max_participants: 8,
      current_participants: 8,
      status: 'published',
    },
  ];

  const getMockNearbyFighters = (): NearbyFighter[] => [
    { id: 'nf-1', first_name: 'James', last_name: 'Wilson', weight_class: 'Middleweight', experience_level: 'intermediate', city: 'Copenhagen' },
    { id: 'nf-2', first_name: 'Liam', last_name: 'Berg', weight_class: 'Welterweight', experience_level: 'advanced', city: 'Copenhagen' },
    { id: 'nf-3', first_name: 'Emma', last_name: 'Skov', weight_class: 'Lightweight', experience_level: 'beginner', city: 'Copenhagen' },
  ];

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!gym?.id) {
      // Use mock data if no gym ID (demo mode)
      setPendingRequests(getMockPendingRequests());
      setUpcomingEvents(getMockUpcomingEvents());
      setNearbyFighters(getMockNearbyFighters());
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [requests, events] = await Promise.all([
        getGymPendingRequests(gym.id),
        getGymUpcomingEvents(gym.id),
      ]);
      setPendingRequests(requests);
      setUpcomingEvents(events);

      // Fetch nearby fighters in same city
      if (isSupabaseConfigured && gym.city) {
        const { data: fighters } = await supabase
          .from('fighters')
          .select('id, first_name, last_name, weight_class, experience_level, city')
          .eq('city', gym.city)
          .limit(5);
        setNearbyFighters((fighters || []) as NearbyFighter[]);
      } else {
        setNearbyFighters(getMockNearbyFighters());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setNearbyFighters(getMockNearbyFighters());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gym?.id, gym?.city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Handle approve/decline requests
  const handleApprove = useCallback(async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await approveEventRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      Alert.alert('Success', 'Request approved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request');
    } finally {
      setProcessingRequestId(null);
    }
  }, []);

  const handleDecline = useCallback(async (requestId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingRequestId(requestId);
            try {
              await declineEventRequest(requestId);
              setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            } catch (error) {
              Alert.alert('Error', 'Failed to decline request');
            } finally {
              setProcessingRequestId(null);
            }
          },
        },
      ]
    );
  }, []);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getIntensityColor = (intensity: string) => {
    if (intensity.toLowerCase() === 'hard') return colors.primary[500];
    if (intensity.toLowerCase() === 'technical') return colors.info;
    return colors.success;
  };

  const getCapacityColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio >= 1) return colors.error;
    if (ratio >= 0.75) return colors.warning;
    return colors.success;
  };

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const isEventToday = (dateStr: string) => {
    const eventDate = new Date(dateStr).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  };

  // Quick actions data
  const quickActions = [
    {
      key: 'photos',
      icon: 'images' as keyof typeof Ionicons.glyphMap,
      title: 'Gym Photos',
      onPress: () => navigation.navigate('GymPhotoUpload' as never),
      badge: null,
    },
    {
      key: 'invite',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      title: 'Invite Fighters',
      onPress: () => navigation.navigate('GymReferralDashboard'),
      badge: 'EARN',
    },
    {
      key: 'admins',
      icon: 'shield' as keyof typeof Ionicons.glyphMap,
      title: 'Manage Admins',
      onPress: () => navigation.navigate('AdminManagement' as never),
      badge: null,
    },
    {
      key: 'schedule',
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      title: 'Schedule',
      onPress: () => navigation.navigate('TrainingSchedule' as never),
      badge: null,
    },
    {
      key: 'reels',
      icon: 'film' as keyof typeof Ionicons.glyphMap,
      title: 'Videos',
      onPress: () => navigation.navigate('GymReels' as never),
      badge: 'NEW',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBg}>
              <Ionicons name="business" size={22} color={colors.primary[500]} />
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.gymName}>{gym?.name || 'Gym'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsIcon}>
            <Ionicons name="settings" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          ) : (
            <>
              {/* Profile Completeness */}
              <ProfileCompletenessCard
                completeness={profileCompleteness}
                onPress={() => navigation.navigate('GymProfile')}
              />

              {/* STATS ROW - 3 StatCards */}
              <View style={styles.statsRow}>
                <StatCard
                  icon="calendar"
                  value={upcomingEvents.length}
                  label="Events"
                  accentColor={colors.primary[500]}
                />
                <StatCard
                  icon="people"
                  value={pendingRequests.length}
                  label="Requests"
                  accentColor={colors.warning}
                />
                <StatCard
                  icon="star"
                  value="4.8"
                  label="Rating"
                  accentColor={colors.info}
                />
              </View>

              {/* ALERT BANNER with PulseIndicator */}
              {pendingRequests.length > 0 && (
                <TouchableOpacity
                  style={styles.alertBanner}
                  onPress={() => navigation.navigate('ManageRequests')}
                >
                  <View style={styles.alertLeft}>
                    <View style={styles.alertIconContainer}>
                      <PulseIndicator color={colors.warning} size="sm" />
                    </View>
                    <Text style={styles.alertText}>
                      {pendingRequests.length} fighter{pendingRequests.length !== 1 ? 's' : ''} waiting for approval
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.warning} />
                </TouchableOpacity>
              )}

              {/* CREATE EVENT - GradientButton */}
              <View style={styles.createButtonContainer}>
                <GradientButton
                  title="Create Sparring Event"
                  onPress={() => navigation.navigate('CreateEvent')}
                  icon="add-circle"
                  size="lg"
                  fullWidth
                />
              </View>

              {/* PENDING REQUESTS */}
              {pendingRequests.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Pending Requests"
                    subtitle={pendingRequests.length + ' waiting'}
                    onSeeAll={() => navigation.navigate('ManageRequests')}
                  />

                  {pendingRequests.slice(0, 3).map((request, i) => (
                    <AnimatedListItem key={request.id} index={i}>
                      <GlassCard style={styles.requestCard}>
                        <TouchableOpacity
                          style={styles.requestInfo}
                          onPress={() => navigation.navigate('FighterProfileView', { fighterId: request.fighter_id })}
                        >
                          <Text style={styles.requestFighter}>{request.fighter_name}</Text>
                          <Text style={styles.requestEvent}>{request.event_title}</Text>
                          {request.fighter_weight_class && (
                            <Text style={styles.requestWeight}>{request.fighter_weight_class}</Text>
                          )}
                        </TouchableOpacity>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() => handleDecline(request.id)}
                            disabled={processingRequestId === request.id}
                          >
                            {processingRequestId === request.id ? (
                              <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                              <Ionicons name="close" size={20} color={colors.error} />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => handleApprove(request.id)}
                            disabled={processingRequestId === request.id}
                          >
                            {processingRequestId === request.id ? (
                              <ActivityIndicator size="small" color={colors.success} />
                            ) : (
                              <Ionicons name="checkmark" size={20} color={colors.success} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </GlassCard>
                    </AnimatedListItem>
                  ))}
                </View>
              )}

              {/* UPCOMING EVENTS */}
              <View style={styles.section}>
                <SectionHeader title="Upcoming Events" />

                {upcomingEvents.length === 0 && (
                  <EmptyState
                    icon="calendar-outline"
                    title="No Upcoming Events"
                    description="Create a sparring event to get started and attract fighters to your gym."
                    actionLabel="Create Event"
                    onAction={() => navigation.navigate('CreateEvent')}
                  />
                )}

                {upcomingEvents.map((event, i) => {
                  const capacityRatio = event.max_participants > 0
                    ? event.current_participants / event.max_participants
                    : 0;
                  const capacityColor = getCapacityColor(event.current_participants, event.max_participants);
                  const intensityColor = getIntensityColor(event.intensity || 'moderate');
                  const today = isEventToday(event.event_date);

                  return (
                    <AnimatedListItem key={event.id} index={i}>
                      <GlassCard
                        style={styles.eventCard}
                        onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                        accentColor={intensityColor}
                      >
                        <View style={styles.eventHeader}>
                          <View style={styles.eventTitleRow}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            {today && (
                              <View style={styles.todayBadge}>
                                <PulseIndicator color={colors.primary[500]} size="sm" />
                                <Text style={styles.todayBadgeText}>TODAY</Text>
                              </View>
                            )}
                          </View>
                          {event.intensity && (
                            <View
                              style={[
                                styles.intensityBadge,
                                { backgroundColor: `${intensityColor}20` },
                              ]}
                            >
                              <Text style={[styles.intensityText, { color: intensityColor }]}>
                                {event.intensity}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.eventMeta}>
                          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.metaText}>{formatDate(event.event_date)} • {event.start_time}</Text>
                        </View>
                        <View style={styles.eventFooter}>
                          <View style={styles.capacitySection}>
                            <Text style={styles.participantsText}>
                              {event.current_participants}/{event.max_participants} fighters
                            </Text>
                            <View style={styles.capacityBarBg}>
                              <View
                                style={[
                                  styles.capacityBarFill,
                                  {
                                    width: `${Math.min(capacityRatio * 100, 100)}%`,
                                    backgroundColor: capacityColor,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                          <View style={styles.eventActions}>
                            {today && (
                              <TouchableOpacity
                                style={[styles.eventActionButton, { backgroundColor: `${colors.success}20` }]}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  navigation.navigate('EventCheckIn', { eventId: event.id, eventTitle: event.title });
                                }}
                              >
                                <Ionicons name="checkbox-outline" size={16} color={colors.success} />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={styles.eventActionButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                navigation.navigate('ShareEvent', { eventId: event.id });
                              }}
                            >
                              <Ionicons name="share-outline" size={16} color={colors.primary[500]} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.eventActionButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                navigation.navigate('EditEvent', { eventId: event.id });
                              }}
                            >
                              <Ionicons name="pencil" size={16} color={colors.primary[500]} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </GlassCard>
                    </AnimatedListItem>
                  );
                })}
              </View>

              {/* FIGHTERS IN YOUR AREA */}
              {nearbyFighters.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title="Fighters in Your Area" />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.nearbyScroll}
                  >
                    {nearbyFighters.map((fighter, i) => (
                      <AnimatedListItem key={fighter.id} index={i}>
                        <GlassCard
                          style={styles.nearbyCard}
                          onPress={() => navigation.navigate('FighterProfileView', { fighterId: fighter.id })}
                        >
                          <View style={styles.nearbyAvatar}>
                            <Text style={styles.nearbyInitials}>
                              {getInitials(fighter.first_name, fighter.last_name)}
                            </Text>
                          </View>
                          <Text style={styles.nearbyName} numberOfLines={1}>
                            {fighter.first_name} {fighter.last_name}
                          </Text>
                          <View style={styles.nearbyBadge}>
                            <Text style={styles.nearbyWeight}>{fighter.weight_class}</Text>
                          </View>
                          <Text style={styles.nearbyLevel}>{fighter.experience_level}</Text>
                        </GlassCard>
                      </AnimatedListItem>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* QUICK ACTIONS - 2 column grid */}
          <View style={styles.quickActionsSection}>
            <SectionHeader title="Quick Actions" />
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, i) => (
                <AnimatedListItem key={action.key} index={i}>
                  <GlassCard
                    style={styles.quickActionTile}
                    onPress={action.onPress}
                  >
                    {action.badge && (
                      <View
                        style={[
                          styles.actionBadge,
                          action.badge === 'NEW'
                            ? { backgroundColor: colors.warning }
                            : { backgroundColor: colors.success },
                        ]}
                      >
                        <Text style={styles.actionBadgeText}>{action.badge}</Text>
                      </View>
                    )}
                    <View style={styles.quickActionIconContainer}>
                      <Ionicons name={action.icon} size={28} color={colors.primary[500]} />
                    </View>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                  </GlassCard>
                </AnimatedListItem>
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    maxWidth: containerMaxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  gymName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: 'BarlowCondensed-Bold',
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // CONTENT
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  // STATS ROW
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  // ALERT BANNER
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.warning}15`,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    color: colors.warning,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.semibold,
    flex: 1,
  },
  // CREATE EVENT
  createButtonContainer: {
    marginBottom: spacing[6],
  },
  // SECTIONS
  section: {
    marginBottom: spacing[6],
  },
  // REQUEST CARDS
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  requestInfo: {
    flex: 1,
  },
  requestFighter: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  requestEvent: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  requestWeight: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing[1],
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.error}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // EVENT CARDS
  eventCard: {
    marginBottom: spacing[3],
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.semibold,
    flexShrink: 1,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary[500]}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  todayBadgeText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  intensityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginLeft: spacing[2],
  },
  intensityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'capitalize',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  capacitySection: {
    flex: 1,
    marginRight: spacing[3],
  },
  participantsText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing[1],
  },
  capacityBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  eventActionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // NEARBY FIGHTERS
  nearbyScroll: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  nearbyCard: {
    width: 130,
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
  },
  nearbyAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  nearbyInitials: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bold,
  },
  nearbyName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  nearbyBadge: {
    backgroundColor: `${colors.primary[500]}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
    marginBottom: spacing[1],
  },
  nearbyWeight: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bold,
  },
  nearbyLevel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
  },
  // QUICK ACTIONS - 2 column grid
  quickActionsSection: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  quickActionTile: {
    width: '47.5%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[3],
    position: 'relative',
  },
  quickActionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  quickActionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    zIndex: 2,
  },
  actionBadgeText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  // BOTTOM
  bottomPadding: {
    height: spacing[10],
  },
});
