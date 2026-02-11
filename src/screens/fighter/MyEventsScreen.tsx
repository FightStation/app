import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  GlassCard,
  GradientButton,
  BadgeRow,
  AnimatedListItem,
  EmptyState,
} from '../../components';

type MyEventsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface MyEvent {
  id: string;
  eventId: string;
  title: string;
  gymName: string;
  gymAddress: string;
  gymId: string;
  date: string;
  time: string;
  intensity: string;
  participants: number;
  maxParticipants: number;
  status: RequestStatus;
  isPast: boolean;
  requestedAt: string;
}

// Mock events data for demo mode
const mockMyEvents: MyEvent[] = [
  {
    id: '1',
    eventId: 'event-1',
    title: 'Technical Sparring Session',
    gymName: 'Elite Boxing Academy',
    gymAddress: 'Schönhauser Allee 123, Berlin',
    gymId: 'gym-1',
    date: 'Nov 5, 2024',
    time: '18:00 - 20:00',
    intensity: 'Technical',
    participants: 12,
    maxParticipants: 16,
    status: 'approved',
    isPast: false,
    requestedAt: '2 days ago',
  },
  {
    id: '2',
    eventId: 'event-2',
    title: 'Hard Rounds Friday',
    gymName: 'Champions Boxing Club',
    gymAddress: 'Warschauer Str 45, Berlin',
    gymId: 'gym-2',
    date: 'Nov 8, 2024',
    time: '19:00 - 21:00',
    intensity: 'Hard',
    participants: 8,
    maxParticipants: 12,
    status: 'pending',
    isPast: false,
    requestedAt: '2 hours ago',
  },
  {
    id: '3',
    eventId: 'event-3',
    title: 'Weekend Open Sparring',
    gymName: 'Elite Boxing Academy',
    gymAddress: 'Schönhauser Allee 123, Berlin',
    gymId: 'gym-1',
    date: 'Oct 28, 2024',
    time: '10:00 - 12:00',
    intensity: 'All Levels',
    participants: 15,
    maxParticipants: 20,
    status: 'approved',
    isPast: true,
    requestedAt: '1 week ago',
  },
];

const TAB_ITEMS = [
  { key: 'upcoming', label: 'Upcoming', icon: 'calendar' as const },
  { key: 'past', label: 'Past', icon: 'time' as const },
];

export function MyEventsScreen({ navigation }: MyEventsScreenProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [profile])
  );

  const loadEvents = async () => {
    if (!isSupabaseConfigured || !profile) {
      // Demo mode
      setEvents(mockMyEvents);
      setLoading(false);
      return;
    }

    try {
      // Get fighter ID from profile
      const fighterId = profile.id;

      const { data, error } = await supabase
        .from('event_requests')
        .select(`
          id,
          status,
          created_at,
          sparring_events (
            id,
            title,
            event_date,
            start_time,
            end_time,
            current_participants,
            max_participants,
            status,
            gyms (
              id,
              name,
              address,
              city
            )
          )
        `)
        .eq('fighter_id', fighterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to MyEvent format
      const transformedEvents: MyEvent[] = (data || [])
        .filter((item: any) => item.sparring_events) // Filter out any with deleted events
        .map((item: any) => {
          const event = item.sparring_events;
          const gym = event.gyms;
          const eventDate = new Date(event.event_date);
          const isPast = eventDate < new Date() || event.status === 'completed';

          return {
            id: item.id,
            eventId: event.id,
            title: event.title,
            gymName: gym?.name || 'Unknown Gym',
            gymAddress: `${gym?.address || ''}, ${gym?.city || ''}`,
            gymId: gym?.id || '',
            date: eventDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            time: `${event.start_time?.substring(0, 5)} - ${event.end_time?.substring(0, 5)}`,
            intensity: 'Technical', // Default - could add to schema
            participants: event.current_participants || 0,
            maxParticipants: event.max_participants || 10,
            status: item.status as RequestStatus,
            isPast,
            requestedAt: formatTimeAgo(item.created_at),
          };
        });

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to mock data on error
      setEvents(mockMyEvents);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!isSupabaseConfigured) {
              setEvents(events.filter((e) => e.id !== requestId));
              Alert.alert('Success', 'Request cancelled (Demo mode)');
              return;
            }

            try {
              const { error } = await supabase
                .from('event_requests')
                .update({ status: 'cancelled' })
                .eq('id', requestId);

              if (error) throw error;

              // Refresh the list
              loadEvents();
              Alert.alert('Success', 'Request cancelled');
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const getStatusBadge = (status: RequestStatus, isPast: boolean) => {
    if (isPast && status === 'approved') {
      return {
        bg: `${colors.textMuted}20`,
        color: colors.textMuted,
        label: 'COMPLETED',
        icon: 'checkmark-done' as const,
      };
    }

    switch (status) {
      case 'approved':
        return {
          bg: `${colors.success}20`,
          color: colors.success,
          label: 'CONFIRMED',
          icon: 'checkmark-circle' as const,
        };
      case 'pending':
        return {
          bg: `${colors.warning}20`,
          color: colors.warning,
          label: 'PENDING APPROVAL',
          icon: 'time' as const,
        };
      case 'rejected':
        return {
          bg: `${colors.error}20`,
          color: colors.error,
          label: 'REJECTED',
          icon: 'close-circle' as const,
        };
      case 'cancelled':
        return {
          bg: `${colors.textMuted}20`,
          color: colors.textMuted,
          label: 'CANCELLED',
          icon: 'close' as const,
        };
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'hard':
        return colors.primary[500];
      case 'technical':
        return colors.info;
      case 'all levels':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  // Filter events by tab
  const upcomingEvents = events.filter(
    (e) => !e.isPast && e.status !== 'cancelled' && e.status !== 'rejected'
  );
  const pastEvents = events.filter(
    (e) => e.isPast || e.status === 'cancelled' || e.status === 'rejected'
  );
  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  // Update tab items with counts
  const tabItems = [
    { key: 'upcoming', label: `Upcoming (${upcomingEvents.length})`, icon: 'calendar' as const },
    { key: 'past', label: `Past (${pastEvents.length})`, icon: 'time' as const },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={24} color={colors.primary[500]} />
            <Text style={styles.headerTitle}>My Events</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Ionicons name="add-circle" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tabs - BadgeRow */}
        <BadgeRow
          items={tabItems}
          selected={activeTab}
          onSelect={(key) => setActiveTab(key as 'upcoming' | 'past')}
          style={{ marginBottom: spacing[4] }}
        />

        {/* Events List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
        >
          {displayedEvents.length === 0 ? (
            <EmptyState
              icon={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
              title={activeTab === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
              description={
                activeTab === 'upcoming'
                  ? 'Request to join a sparring session to get started'
                  : 'Your completed sessions will appear here'
              }
              actionLabel={activeTab === 'upcoming' ? 'Find Sparring' : undefined}
              onAction={activeTab === 'upcoming' ? () => navigation.navigate('HomeTab') : undefined}
            />
          ) : (
            displayedEvents.map((event, index) => {
              const statusBadge = getStatusBadge(event.status, event.isPast);
              return (
                <AnimatedListItem key={event.id} index={index}>
                  <GlassCard
                    style={styles.eventCard}
                    onPress={() => navigation.navigate('EventDetail', { eventId: event.eventId })}
                  >
                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusBadge.bg },
                      ]}
                    >
                      <Ionicons
                        name={statusBadge.icon}
                        size={14}
                        color={statusBadge.color}
                      />
                      <Text style={[styles.statusText, { color: statusBadge.color }]}>
                        {statusBadge.label}
                      </Text>
                    </View>

                    {/* Event Header */}
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View
                        style={[
                          styles.intensityBadge,
                          {
                            backgroundColor: `${getIntensityColor(event.intensity)}20`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.intensityText,
                            { color: getIntensityColor(event.intensity) },
                          ]}
                        >
                          {event.intensity}
                        </Text>
                      </View>
                    </View>

                    {/* Gym Info */}
                    <TouchableOpacity
                      style={styles.gymInfo}
                      onPress={() => navigation.navigate('GymProfileView', { gymId: event.gymId })}
                    >
                      <Ionicons name="business" size={16} color={colors.textMuted} />
                      <View style={styles.gymDetails}>
                        <Text style={styles.gymName}>{event.gymName}</Text>
                        <Text style={styles.gymAddress}>{event.gymAddress}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* Date & Time */}
                    <View style={styles.eventMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={colors.textMuted}
                        />
                        <Text style={styles.metaText}>{event.date}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={colors.textMuted}
                        />
                        <Text style={styles.metaText}>{event.time}</Text>
                      </View>
                    </View>

                    {/* Participants */}
                    <View style={styles.participantsRow}>
                      <View style={styles.participantsInfo}>
                        <Ionicons
                          name="people"
                          size={18}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.participantsText}>
                          {event.participants}/{event.maxParticipants} fighters
                        </Text>
                      </View>
                    </View>

                    {/* Pending Info */}
                    {event.status === 'pending' && (
                      <View style={styles.pendingInfo}>
                        <Ionicons
                          name="information-circle"
                          size={16}
                          color={colors.warning}
                        />
                        <Text style={styles.pendingText}>
                          Requested {event.requestedAt} • Waiting for gym approval
                        </Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.eventActions}>
                      {event.status === 'approved' && !event.isPast && (
                        <>
                          <GlassCard
                            style={styles.secondaryActionButton}
                            onPress={() => {}}
                          >
                            <View style={styles.actionButtonContent}>
                              <Ionicons
                                name="navigate"
                                size={16}
                                color={colors.textPrimary}
                              />
                              <Text style={styles.secondaryButtonText}>Directions</Text>
                            </View>
                          </GlassCard>
                          <GradientButton
                            title="Details"
                            icon="information-circle"
                            size="sm"
                            onPress={() => navigation.navigate('EventDetail', { eventId: event.eventId })}
                            style={{ flex: 1 }}
                          />
                        </>
                      )}
                      {event.status === 'pending' && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleCancelRequest(event.id)}
                        >
                          <Ionicons name="close-circle" size={16} color={colors.error} />
                          <Text style={styles.cancelButtonText}>Cancel Request</Text>
                        </TouchableOpacity>
                      )}
                      {event.isPast && event.status === 'approved' && (
                        <GlassCard
                          style={styles.secondaryActionButton}
                          onPress={() => navigation.navigate('EventDetail', { eventId: event.eventId })}
                        >
                          <View style={styles.actionButtonContent}>
                            <Ionicons
                              name="repeat"
                              size={16}
                              color={colors.textPrimary}
                            />
                            <Text style={styles.secondaryButtonText}>Book Again</Text>
                          </View>
                        </GlassCard>
                      )}
                    </View>
                  </GlassCard>
                </AnimatedListItem>
              );
            })
          )}

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
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
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  // Event Card
  eventCard: {
    marginBottom: spacing[4],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginBottom: spacing[3],
    gap: spacing[1],
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
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
  gymInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gymDetails: {
    flex: 1,
  },
  gymName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[0.5],
  },
  gymAddress: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  participantsText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}20`,
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  pendingText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryActionButton: {
    flex: 1,
    padding: spacing[2],
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.lg,
    gap: spacing[1],
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  bottomPadding: {
    height: spacing[10],
  },
});
