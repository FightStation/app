import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Coach } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type StudentWithActivity = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  experience_level: string;
  sessions_count: number;
  sessions_this_month: number;
  last_session_date?: string;
  upcoming_event?: {
    id: string;
    title: string;
    event_date: string;
  };
};

type GymEvent = {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  current_participants: number;
  max_participants: number;
};

type TrainingOverview = {
  total_sessions: number;
  active_students: number;
  total_students: number;
  top_session_type: string;
  inactive_names: string[];
};

type CoachDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

// Mock data functions
function getMockStudents(): StudentWithActivity[] {
  return [
    { id: '1', first_name: 'Marcus', last_name: 'Petrov', experience_level: 'advanced', sessions_count: 24, sessions_this_month: 8, last_session_date: new Date(Date.now() - 2 * 86400000).toISOString(), upcoming_event: { id: 'e1', title: 'Technical Sparring', event_date: '2026-02-05' } },
    { id: '2', first_name: 'Sarah', last_name: 'Chen', experience_level: 'intermediate', sessions_count: 18, sessions_this_month: 3, last_session_date: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: '3', first_name: 'Alex', last_name: 'Rodriguez', experience_level: 'beginner', sessions_count: 6, sessions_this_month: 0 },
  ];
}

function getMockGymEvents(): GymEvent[] {
  return [
    { id: '1', title: 'Technical Sparring Session', event_date: '2026-02-05', start_time: '18:00', current_participants: 8, max_participants: 16 },
    { id: '2', title: 'Hard Rounds Friday', event_date: '2026-02-08', start_time: '19:00', current_participants: 6, max_participants: 12 },
  ];
}

const getActivityColor = (lastDate?: string) => {
  if (!lastDate) return colors.error;
  const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 7) return colors.success;
  if (daysSince <= 14) return colors.warning;
  return colors.error;
};

export function CoachDashboardScreen({ navigation }: CoachDashboardScreenProps) {
  const { profile, signOut } = useAuth();
  const coach = profile as Coach;

  // State
  const [students, setStudents] = useState<StudentWithActivity[]>([]);
  const [gymEvents, setGymEvents] = useState<GymEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get coach name from profile
  const coachName = coach?.first_name
    ? `${coach.first_name} ${coach.last_name}`
    : 'Coach';

  // Compute training overview from students
  const trainingOverview = useMemo((): TrainingOverview => {
    const totalSessions = students.reduce((sum, s) => sum + s.sessions_this_month, 0);
    const activeStudents = students.filter(s => s.sessions_this_month > 0).length;
    const inactiveNames = students
      .filter(s => s.sessions_this_month === 0)
      .map(s => s.first_name);

    return {
      total_sessions: totalSessions,
      active_students: activeStudents,
      total_students: students.length,
      top_session_type: 'Sparring',
      inactive_names: inactiveNames,
    };
  }, [students]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!coach?.id) {
      // Use mock data if no coach ID (demo mode)
      setStudents(getMockStudents());
      setGymEvents(getMockGymEvents());
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Fetch students from the same gym
      const { data: fightersData } = await supabase
        .from('fighters')
        .select('id, first_name, last_name, avatar_url, experience_level')
        .eq('gym_id', coach.gym_id)
        .limit(10);

      // Get upcoming events for students
      const studentIds = (fightersData || []).map(f => f.id);
      const { data: studentEvents } = await supabase
        .from('event_requests')
        .select(`
          fighter_id,
          event:sparring_events (id, title, event_date)
        `)
        .in('fighter_id', studentIds)
        .eq('status', 'approved')
        .gte('event.event_date', new Date().toISOString().split('T')[0])
        .limit(20);

      // Fetch training sessions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      let sessionsByFighter: Record<string, { count: number; lastDate?: string }> = {};

      if (isSupabaseConfigured) {
        const { data: recentSessions } = await supabase
          .from('training_sessions')
          .select('id, fighter_id, session_date, session_type, status')
          .eq('coach_id', coach.id)
          .gte('session_date', thirtyDaysAgoStr)
          .eq('status', 'completed')
          .order('session_date', { ascending: false })
          .limit(100);

        // Aggregate per student
        for (const session of recentSessions || []) {
          if (!sessionsByFighter[session.fighter_id]) {
            sessionsByFighter[session.fighter_id] = { count: 0, lastDate: session.session_date };
          }
          sessionsByFighter[session.fighter_id].count++;
        }
      }

      // Map students with their upcoming events and activity
      const studentsWithActivity: StudentWithActivity[] = (fightersData || []).map(fighter => {
        const upcomingEvent = (studentEvents || []).find(
          e => e.fighter_id === fighter.id && e.event
        );
        const activity = sessionsByFighter[fighter.id];
        return {
          ...fighter,
          sessions_count: activity?.count || 0,
          sessions_this_month: activity?.count || 0,
          last_session_date: activity?.lastDate,
          upcoming_event: upcomingEvent?.event as any,
        };
      });

      setStudents(studentsWithActivity);

      // Fetch gym events
      const { data: eventsData } = await supabase
        .from('sparring_events')
        .select('id, title, event_date, start_time, current_participants, max_participants')
        .eq('gym_id', coach.gym_id)
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5);

      setGymEvents((eventsData || []) as GymEvent[]);
    } catch (error) {
      console.error('Error fetching coach data:', error);
      // Use mock data as fallback
      setStudents(getMockStudents());
      setGymEvents(getMockGymEvents());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coach?.id, coach?.gym_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="school" size={24} color={colors.primary[500]} />
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.coachName}>Coach {coachName}</Text>
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
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="people" size={24} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.statValue}>{students.length}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="calendar" size={24} color={colors.info} />
                  </View>
                  <Text style={styles.statValue}>{gymEvents.length}</Text>
                  <Text style={styles.statLabel}>Gym Events</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Ionicons name="star" size={24} color={colors.warning} />
                  </View>
                  <Text style={styles.statValue}>4.9</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>

              {/* Training Overview */}
              {students.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TRAINING OVERVIEW</Text>
                    <Text style={styles.sectionSubtitle}>Last 30 days</Text>
                  </View>

                  <View style={styles.overviewCard}>
                    <View style={styles.overviewRow}>
                      <View style={styles.overviewStat}>
                        <Text style={styles.overviewValue}>{trainingOverview.total_sessions}</Text>
                        <Text style={styles.overviewLabel}>Sessions</Text>
                      </View>
                      <View style={styles.overviewDivider} />
                      <View style={styles.overviewStat}>
                        <Text style={styles.overviewValue}>
                          {trainingOverview.active_students}/{trainingOverview.total_students}
                        </Text>
                        <Text style={styles.overviewLabel}>Active</Text>
                      </View>
                      <View style={styles.overviewDivider} />
                      <View style={styles.overviewStat}>
                        <Text style={styles.overviewValue}>{trainingOverview.top_session_type}</Text>
                        <Text style={styles.overviewLabel}>Top Type</Text>
                      </View>
                    </View>

                    {trainingOverview.inactive_names.length > 0 && (
                      <View style={styles.inactiveAlert}>
                        <Ionicons name="alert-circle" size={16} color={colors.warning} />
                        <Text style={styles.inactiveText}>
                          {trainingOverview.inactive_names.join(', ')} had no sessions this month
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('ScheduleSession')}
                >
                  <Ionicons name="add-circle" size={20} color={colors.textPrimary} />
                  <Text style={styles.actionButtonText}>Schedule Session</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => navigation.navigate('StudentProgress')}
                >
                  <Ionicons name="analytics" size={20} color={colors.textSecondary} />
                  <Text style={styles.actionButtonTextSecondary}>View Progress</Text>
                </TouchableOpacity>
              </View>

              {/* Student Activity - Students with upcoming events */}
              {students.some(s => s.upcoming_event) && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>STUDENT ACTIVITY</Text>
                  </View>

                  {students.filter(s => s.upcoming_event).map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      style={styles.activityCard}
                      onPress={() => navigation.navigate('FighterProfileView', { fighterId: student.id })}
                    >
                      <View style={styles.activityIcon}>
                        <Ionicons name="calendar" size={16} color={colors.primary[500]} />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityText}>
                          <Text style={styles.activityName}>{student.first_name}</Text> has an event
                        </Text>
                        <Text style={styles.activityEvent}>
                          {student.upcoming_event?.title} • {formatDate(student.upcoming_event?.event_date || '')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* My Students */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>MY STUDENTS</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AllStudents')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                {students.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={styles.studentCard}
                    onPress={() => navigation.navigate('FighterProfileView', { fighterId: student.id })}
                  >
                    <View style={styles.studentAvatarContainer}>
                      <View style={styles.studentAvatar}>
                        <Ionicons name="person" size={24} color={colors.textPrimary} />
                      </View>
                      <View
                        style={[
                          styles.activityDot,
                          { backgroundColor: getActivityColor(student.last_session_date) },
                        ]}
                      />
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.first_name} {student.last_name}</Text>
                      <View style={styles.studentMeta}>
                        <View style={[styles.levelBadge, { backgroundColor: `${colors.primary[500]}20` }]}>
                          <Text style={[styles.levelText, { color: colors.primary[500] }]}>
                            {student.experience_level}
                          </Text>
                        </View>
                        <Text style={styles.studentSessions}>
                          {student.sessions_this_month} this mo.
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Gym Events */}
              {gymEvents.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>GYM EVENTS</Text>
                    <TouchableOpacity>
                      <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                  </View>

                  {gymEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.sessionCard}
                      onPress={() => navigation.navigate('EventDetail' as any, { eventId: event.id })}
                    >
                      <View style={styles.sessionIcon}>
                        <Ionicons name="fitness" size={24} color={colors.primary[500]} />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>{event.title}</Text>
                        <View style={styles.sessionMeta}>
                          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                          <Text style={styles.metaText}>{formatDate(event.event_date)} • {event.start_time}</Text>
                        </View>
                      </View>
                      <View style={styles.participantsCount}>
                        <Text style={styles.participantsText}>
                          {event.current_participants}/{event.max_participants}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Referral Program */}
              <TouchableOpacity
                style={styles.referButton}
                onPress={() => navigation.navigate('CoachReferralDashboard')}
              >
                <Ionicons name="gift" size={20} color={colors.textPrimary} />
                <Text style={styles.referButtonText}>Refer Students & Earn</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </TouchableOpacity>

              {/* Sign Out */}
              <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>

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
  coachName: {
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
  // Training Overview
  overviewCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  overviewLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  overviewDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  inactiveAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inactiveText: {
    color: colors.warning,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  actionButtonTextSecondary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
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
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  seeAll: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  sessionInfo: { flex: 1 },
  sessionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[0.5],
  },
  metaText: { color: colors.textMuted, fontSize: typography.fontSize.xs },
  participantsCount: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  participantsText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  // Student card with activity dot
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentAvatarContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.cardBg,
  },
  studentInfo: { flex: 1 },
  studentName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  levelBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  levelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  studentSessions: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  referButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    marginTop: spacing[2],
  },
  referButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  newBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
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
  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  // Activity card styles
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  activityName: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  activityEvent: {
    color: colors.primary[400],
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
});