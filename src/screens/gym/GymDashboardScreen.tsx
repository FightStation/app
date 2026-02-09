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
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { ProfileCompletenessCard } from '../../components';
import { calculateGymCompleteness } from '../../utils/profileCompleteness';
import {
  getGymPendingRequests,
  getGymUpcomingEvents,
  approveEventRequest,
  declineEventRequest,
  EventRequestWithDetails,
  GymEventSummary,
} from '../../services/events';

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
      current_participants: 5,
      status: 'published',
    },
  ];

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!gym?.id) {
      // Use mock data if no gym ID (demo mode)
      setPendingRequests(getMockPendingRequests());
      setUpcomingEvents(getMockUpcomingEvents());
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gym?.id]);

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
    return colors.textMuted;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="business" size={24} color={colors.primary[500]} />
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.gymName}>{gym?.name || 'Gym'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="settings" size={22} color={colors.textPrimary} />
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

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="calendar" size={24} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.statValue}>{upcomingEvents.length}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="people" size={24} color={colors.warning} />
                  </View>
                  <Text style={styles.statValue}>{pendingRequests.length}</Text>
                  <Text style={styles.statLabel}>Requests</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <Ionicons name="add-circle" size={24} color={colors.textPrimary} />
                <Text style={styles.createButtonText}>Create Sparring Event</Text>
              </TouchableOpacity>

              {pendingRequests.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>PENDING REQUESTS ({pendingRequests.length})</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ManageRequests')}>
                      <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                  </View>

                  {pendingRequests.slice(0, 3).map((request) => (
                    <View key={request.id} style={styles.requestCard}>
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
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
                  {upcomingEvents.length === 0 && (
                    <Text style={styles.emptyText}>No upcoming events</Text>
                  )}
                </View>

                {upcomingEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  >
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {event.intensity && (
                        <View
                          style={[
                            styles.intensityBadge,
                            { backgroundColor: `${getIntensityColor(event.intensity)}20` },
                          ]}
                        >
                          <Text style={[styles.intensityText, { color: getIntensityColor(event.intensity) }]}>
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
                      <Text style={styles.participantsText}>
                        {event.current_participants}/{event.max_participants} fighters
                      </Text>
                      <View style={styles.eventActions}>
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
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('GymPhotoUpload' as never)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="images" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Add Gym Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('GymReferralDashboard')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="people" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Invite Fighters</Text>
              <View style={styles.earnBadge}>
                <Text style={styles.earnBadgeText}>EARN</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminManagement' as never)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="shield" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Manage Admins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('TrainingSchedule' as never)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Training Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('GymReels' as never)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="film" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.actionButtonText}>Training Videos</Text>
              <View style={[styles.earnBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.earnBadgeText}>NEW</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  webContainer: {
    flex: 1,
    maxWidth: containerMaxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  greeting: { color: colors.textMuted, fontSize: typography.fontSize.sm },
  gymName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1 },
  content: { padding: spacing[4] },
  statsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  statLabel: { color: colors.textMuted, fontSize: typography.fontSize.xs },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  createButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  section: { marginBottom: spacing[6] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  seeAll: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
  },
  requestInfo: { flex: 1 },
  requestFighter: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  requestEvent: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  requestWeight: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  eventCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
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
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  metaText: { color: colors.textMuted, fontSize: typography.fontSize.sm },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  participantsText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  eventActionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Actions Section
  actionsSection: {
    gap: spacing[3],
    marginTop: spacing[6],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  earnBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  earnBadgeText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  signOutButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: spacing[4],
  },
  signOutText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  bottomPadding: { height: spacing[10] },
});
