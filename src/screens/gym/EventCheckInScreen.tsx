import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getEventAttendees,
  checkInFighter,
  checkOutFighter,
  markNoShow,
  AttendeeWithDetails,
} from '../../services/events';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { GlassCard, GradientButton, StatCard, EmptyState, AnimatedListItem } from '../../components';

type EventCheckInScreenProps = NativeStackScreenProps<{
  EventCheckIn: { eventId: string; eventTitle?: string };
}, 'EventCheckIn'>;

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function EventCheckInScreen({ navigation, route }: EventCheckInScreenProps) {
  const { eventId, eventTitle } = route.params;
  const [attendees, setAttendees] = useState<AttendeeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAttendees = useCallback(async () => {
    try {
      const data = await getEventAttendees(eventId);
      setAttendees(data);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const checkedInCount = attendees.filter((a) => a.checked_in_at && !a.no_show).length;
  const noShowCount = attendees.filter((a) => a.no_show).length;

  const handleCheckIn = async (fighterId: string) => {
    setActionLoading(fighterId);
    try {
      await checkInFighter(eventId, fighterId);
      await loadAttendees();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check in fighter');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (fighterId: string) => {
    setActionLoading(fighterId);
    try {
      await checkOutFighter(eventId, fighterId);
      await loadAttendees();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check out fighter');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (fighterId: string, name: string) => {
    Alert.alert(
      'Mark No-Show',
      `Mark ${name} as a no-show?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(fighterId);
            try {
              await markNoShow(eventId, fighterId);
              await loadAttendees();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark no-show');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAttendee = (attendee: AttendeeWithDetails, index: number) => {
    const isLoading = actionLoading === attendee.fighter_id;

    return (
      <AnimatedListItem key={attendee.fighter_id} index={index}>
        <GlassCard
          accentColor={
            attendee.no_show
              ? colors.error
              : attendee.checked_in_at
              ? colors.success
              : undefined
          }
          style={styles.attendeeCardWrapper}
        >
          <View style={styles.attendeeCardRow}>
            <View style={styles.attendeeInfo}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color={colors.textMuted} />
              </View>
              <View style={styles.attendeeText}>
                <Text style={styles.attendeeName}>{attendee.fighter_name}</Text>
                {attendee.weight_class && (
                  <Text style={styles.attendeeWeight}>
                    {attendee.weight_class.replace(/_/g, ' ')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.attendeeActions}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : attendee.no_show ? (
                <View style={styles.noShowBadge}>
                  <Text style={styles.noShowText}>No-Show</Text>
                </View>
              ) : attendee.checked_in_at ? (
                <View style={styles.checkedInActions}>
                  <Text style={styles.checkInTime}>
                    {formatTime(attendee.checked_in_at)}
                  </Text>
                  {!attendee.checked_out_at && (
                    <TouchableOpacity
                      style={styles.checkOutButton}
                      onPress={() => handleCheckOut(attendee.fighter_id)}
                    >
                      <Text style={styles.checkOutText}>Check Out</Text>
                    </TouchableOpacity>
                  )}
                  {attendee.checked_out_at && (
                    <Text style={styles.checkedOutLabel}>Left</Text>
                  )}
                </View>
              ) : (
                <View style={styles.notCheckedInActions}>
                  <GradientButton
                    title="Check In"
                    onPress={() => handleCheckIn(attendee.fighter_id)}
                    size="sm"
                    icon="checkmark-circle"
                  />
                  <TouchableOpacity
                    style={styles.noShowButton}
                    onPress={() => handleNoShow(attendee.fighter_id, attendee.fighter_name)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      </AnimatedListItem>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Event Check-In</Text>
            {eventTitle && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {eventTitle}
              </Text>
            )}
          </View>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <StatCard
                icon="checkmark-circle"
                value={`${checkedInCount}/${attendees.length}`}
                label="Checked In"
                accentColor={colors.success}
              />
              <StatCard
                icon="close-circle"
                value={noShowCount}
                label="No-Shows"
                accentColor={noShowCount > 0 ? colors.error : colors.textMuted}
              />
            </View>

            {/* Attendee List */}
            {attendees.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No Approved Fighters"
                description="Approved fighters will appear here for check-in"
              />
            ) : (
              attendees.map((attendee, index) => renderAttendee(attendee, index))
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  statsBar: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  attendeeCardWrapper: {
    marginBottom: spacing[2],
  },
  attendeeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  attendeeText: {
    flex: 1,
  },
  attendeeName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  attendeeWeight: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  attendeeActions: {
    marginLeft: spacing[2],
  },
  noShowBadge: {
    backgroundColor: `${colors.error}20`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  noShowText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  checkedInActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  checkInTime: {
    color: colors.success,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  checkOutButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkOutText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  checkedOutLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
  notCheckedInActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  // checkInButton styles removed - using GradientButton component
  noShowButton: {
    padding: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[3],
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  bottomPadding: {
    height: spacing[10],
  },
});