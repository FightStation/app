import React, { useState, useEffect, useCallback } from 'react';
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
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  EmptyState,
  PulseIndicator,
  AnimatedListItem,
} from '../../components';
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
const containerMaxWidth = Platform.OS === 'web' ? 480 : width;

export function GymDashboardScreen({ navigation }: GymDashboardScreenProps) {
  const { profile } = useAuth();
  const gym = profile as Gym;

  const [pendingRequests, setPendingRequests] = useState<EventRequestWithDetails[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<GymEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

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

  const fetchData = useCallback(async () => {
    if (!gym?.id) {
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
    Alert.alert('Decline Request', 'Are you sure?', [
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
    ]);
  }, []);

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

  const isEventToday = (dateStr: string) => {
    const eventDate = new Date(dateStr).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {gym?.name || 'Gym'}</Text>
          <TouchableOpacity
            style={styles.settingsIcon}
            onPress={() => navigation.navigate('GymProfile')}
          >
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
              <View style={styles.ctaContainer}>
                <GradientButton
                  title="Create Sparring Event"
                  onPress={() => navigation.navigate('CreateEvent')}
                  icon="add-circle"
                  size="lg"
                  fullWidth
                />
              </View>

              {pendingRequests.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.alertBanner}>
                    <View style={styles.alertLeft}>
                      <PulseIndicator color={colors.warning} size="sm" />
                      <View>
                        <Text style={styles.alertTitle}>
                          {pendingRequests.length} Pending Request{pendingRequests.length !== 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.alertSubtitle}>Fighters waiting for approval</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('ManageRequests')}>
                      <Ionicons name="chevron-forward" size={18} color={colors.warning} />
                    </TouchableOpacity>
                  </View>

                  {pendingRequests.slice(0, 3).map((request, i) => (
                    <AnimatedListItem key={request.id} index={i}>
                      <GlassCard style={styles.requestCard}>
                        <View style={styles.requestContent}>
                          <View style={styles.requestInfo}>
                            <Text style={styles.requestFighter}>{request.fighter_name}</Text>
                            <Text style={styles.requestEvent}>{request.event_title}</Text>
                            {request.fighter_weight_class && (
                              <Text style={styles.requestWeight}>{request.fighter_weight_class}</Text>
                            )}
                          </View>
                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              style={styles.declineButton}
                              onPress={() => handleDecline(request.id)}
                              disabled={processingRequestId === request.id}
                            >
                              {processingRequestId === request.id ? (
                                <ActivityIndicator size="small" color={colors.error} />
                              ) : (
                                <Ionicons name="close" size={18} color={colors.error} />
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
                                <Ionicons name="checkmark" size={18} color={colors.success} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </GlassCard>
                    </AnimatedListItem>
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <SectionHeader
                  title="Your Events"
                  subtitle={upcomingEvents.length > 0 ? `${upcomingEvents.length} upcoming` : undefined}
                />

                {upcomingEvents.length === 0 ? (
                  <EmptyState
                    icon="calendar-outline"
                    title="No Upcoming Events"
                    description="Create a sparring event to attract fighters to your gym."
                    actionLabel="Create Event"
                    onAction={() => navigation.navigate('CreateEvent')}
                  />
                ) : (
                  upcomingEvents.map((event, i) => {
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
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            {today && (
                              <View style={styles.todayBadge}>
                                <PulseIndicator color={colors.primary[500]} size="sm" />
                                <Text style={styles.todayBadgeText}>TODAY</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.eventMeta}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.metaText}>
                              {formatDate(event.event_date)} • {event.start_time}
                            </Text>
                          </View>

                          <View style={styles.eventFooter}>
                            <View style={styles.capacityInfo}>
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

                            {today && (
                              <TouchableOpacity
                                style={[styles.checkInButton, { backgroundColor: `${colors.success}20` }]}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  navigation.navigate('EventCheckIn', {
                                    eventId: event.id,
                                    eventTitle: event.title,
                                  });
                                }}
                              >
                                <Ionicons name="checkbox-outline" size={16} color={colors.success} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </GlassCard>
                      </AnimatedListItem>
                    );
                  })
                )}
              </View>

              <View style={styles.bottomPadding} />
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  webContainer: { flex: 1, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border },
  greeting: { color: colors.textPrimary, fontSize: 24, fontWeight: '600', fontFamily: 'BarlowCondensed-Bold', flex: 1 },
  settingsIcon: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: spacing[4] },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[10] },
  ctaContainer: { marginBottom: spacing[8] },
  section: { marginBottom: spacing[8] },
  alertBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${colors.warning}15`, borderWidth: 1, borderColor: `${colors.warning}40`, borderRadius: borderRadius.lg, paddingVertical: spacing[3], paddingHorizontal: spacing[4], marginBottom: spacing[4] },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  alertTitle: { color: colors.warning, fontSize: typography.fontSize.base, fontWeight: '600', fontFamily: typography.fontFamily.semibold },
  alertSubtitle: { color: colors.textMuted, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular, marginTop: spacing[0.5] },
  requestCard: { marginBottom: spacing[3] },
  requestContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requestInfo: { flex: 1 },
  requestFighter: { color: colors.textPrimary, fontSize: typography.fontSize.base, fontWeight: '600', fontFamily: typography.fontFamily.semibold, marginBottom: spacing[1] },
  requestEvent: { color: colors.textSecondary, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular },
  requestWeight: { color: colors.textMuted, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.regular, marginTop: spacing[1] },
  requestActions: { flexDirection: 'row', gap: spacing[2], marginLeft: spacing[3] },
  declineButton: { width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: `${colors.error}20`, alignItems: 'center', justifyContent: 'center' },
  approveButton: { width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: `${colors.success}20`, alignItems: 'center', justifyContent: 'center' },
  eventCard: { marginBottom: spacing[3] },
  eventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3], gap: spacing[2] },
  eventTitle: { color: colors.textPrimary, fontSize: typography.fontSize.base, fontWeight: '600', fontFamily: typography.fontFamily.semibold, flex: 1 },
  todayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.primary[500]}20`, paddingHorizontal: spacing[2], paddingVertical: spacing[0.5], borderRadius: borderRadius.sm, gap: 4 },
  todayBadgeText: { color: colors.primary[500], fontSize: typography.fontSize.xs, fontWeight: '700', fontFamily: typography.fontFamily.bold, letterSpacing: 0.5 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginBottom: spacing[3] },
  metaText: { color: colors.textMuted, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: spacing[3] },
  capacityInfo: { flex: 1 },
  participantsText: { color: colors.textSecondary, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.regular, marginBottom: spacing[1] },
  capacityBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.full, overflow: 'hidden' },
  capacityBarFill: { height: '100%', borderRadius: borderRadius.full },
  checkInButton: { width: 32, height: 32, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  bottomPadding: { height: spacing[10] },
});
