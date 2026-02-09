import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Fighter,
  TrainingSession,
  StudentProgressMetrics,
  TRAINING_FOCUS_LABELS,
  TrainingFocusArea,
} from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type StudentProgressScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
  route?: RouteProp<{ params: { studentId?: string } }, 'params'>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const MOCK_STUDENT: Fighter = {
  id: 'f-1',
  user_id: 'u-10',
  first_name: 'Max',
  last_name: 'Richter',
  weight_class: 'middleweight',
  experience_level: 'intermediate',
  country: 'Germany',
  city: 'Berlin',
  fights_count: 3,
  sparring_count: 15,
  record: '3-1-0',
  sports: ['boxing'],
  avatar_url: undefined,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_METRICS: StudentProgressMetrics = {
  fighter_id: 'f-1',
  total_sessions: 24,
  total_hours: 36,
  improvement_score: 72,
  streak_days: 5,
  last_session_date: new Date().toISOString().split('T')[0],
  sessions_this_month: 8,
  avg_session_rating: 4.2,
  improving_areas: ['technique', 'pad_work', 'conditioning'],
  needs_work_areas: ['sparring', 'flexibility'],
};

const MOCK_SESSIONS: TrainingSession[] = [
  {
    id: 's-1', coach_id: 'c-1', fighter_id: 'f-1',
    session_date: getDateStr(0), duration_minutes: 90,
    focus_areas: ['technique', 'pad_work'], rating: 4,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 's-2', coach_id: 'c-1', fighter_id: 'f-1',
    session_date: getDateStr(-2), duration_minutes: 60,
    focus_areas: ['conditioning', 'bag_work'], rating: 3,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 's-3', coach_id: 'c-1', fighter_id: 'f-1',
    session_date: getDateStr(-5), duration_minutes: 75,
    focus_areas: ['sparring', 'technique'], rating: 5,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 's-4', coach_id: 'c-1', fighter_id: 'f-1',
    session_date: getDateStr(-7), duration_minutes: 60,
    focus_areas: ['strength', 'cardio'], rating: 4,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

function getDateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export function StudentProgressScreen({ navigation, route }: StudentProgressScreenProps) {
  const studentId = route?.params?.studentId;
  const [student, setStudent] = useState<Fighter>(MOCK_STUDENT);
  const [metrics, setMetrics] = useState<StudentProgressMetrics>(MOCK_METRICS);
  const [sessions, setSessions] = useState<TrainingSession[]>(MOCK_SESSIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studentId) loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    if (!isSupabaseConfigured || !studentId) return;

    setLoading(true);
    try {
      // Fetch student profile
      const { data: fighterData } = await supabase
        .from('fighters')
        .select('*')
        .eq('id', studentId)
        .single();

      if (fighterData) setStudent(fighterData);

      // Fetch training sessions
      const { data: sessionsData } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('fighter_id', studentId)
        .order('session_date', { ascending: false })
        .limit(20);

      if (sessionsData) setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary[500];
    if (score >= 40) return colors.warning;
    return colors.error;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Progress</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Student Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.studentName}>{student.first_name} {student.last_name}</Text>
            <View style={styles.profileMeta}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>
                  {student.weight_class?.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{student.experience_level}</Text>
              </View>
              {student.record && (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{student.record}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.total_sessions}</Text>
              <Text style={styles.metricLabel}>Sessions</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.total_hours}h</Text>
              <Text style={styles.metricLabel}>Trained</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: getScoreColor(metrics.improvement_score) }]}>
                {metrics.improvement_score}
              </Text>
              <Text style={styles.metricLabel}>Score</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.streak_days}</Text>
              <Text style={styles.metricLabel}>Streak</Text>
            </View>
          </View>

          {/* This Month Stats */}
          <View style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <Ionicons name="calendar" size={20} color={colors.primary[500]} />
              <Text style={styles.monthTitle}>This Month</Text>
            </View>
            <View style={styles.monthStats}>
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>{metrics.sessions_this_month}</Text>
                <Text style={styles.monthStatLabel}>sessions</Text>
              </View>
              <View style={styles.monthDivider} />
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>{metrics.avg_session_rating?.toFixed(1)}</Text>
                <Text style={styles.monthStatLabel}>avg rating</Text>
              </View>
            </View>
          </View>

          {/* Improvement Trends */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Improvement Trends</Text>

            {metrics.improving_areas.length > 0 && (
              <View style={styles.trendSection}>
                <View style={styles.trendHeader}>
                  <Ionicons name="trending-up" size={18} color={colors.success} />
                  <Text style={[styles.trendLabel, { color: colors.success }]}>Improving</Text>
                </View>
                <View style={styles.trendTags}>
                  {metrics.improving_areas.map((area) => (
                    <View key={area} style={[styles.trendTag, styles.trendTagPositive]}>
                      <Text style={styles.trendTagTextPositive}>
                        {TRAINING_FOCUS_LABELS[area as TrainingFocusArea] || area}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {metrics.needs_work_areas.length > 0 && (
              <View style={styles.trendSection}>
                <View style={styles.trendHeader}>
                  <Ionicons name="alert-circle" size={18} color={colors.warning} />
                  <Text style={[styles.trendLabel, { color: colors.warning }]}>Needs Work</Text>
                </View>
                <View style={styles.trendTags}>
                  {metrics.needs_work_areas.map((area) => (
                    <View key={area} style={[styles.trendTag, styles.trendTagWarning]}>
                      <Text style={styles.trendTagTextWarning}>
                        {TRAINING_FOCUS_LABELS[area as TrainingFocusArea] || area}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Session History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>

            {sessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No sessions recorded yet</Text>
              </View>
            ) : (
              sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => navigation?.navigate('SessionDetail', { sessionId: session.id })}
                >
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionDate}>{formatDate(session.session_date)}</Text>
                    <Text style={styles.sessionDuration}>{session.duration_minutes} min</Text>
                    <View style={styles.sessionFocusTags}>
                      {session.focus_areas.slice(0, 2).map((area) => (
                        <View key={area} style={styles.sessionFocusTag}>
                          <Text style={styles.sessionFocusTagText}>
                            {TRAINING_FOCUS_LABELS[area as TrainingFocusArea] || area}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.sessionRight}>
                    {session.rating != null && (
                      <View style={styles.sessionRating}>
                        <Ionicons name="star" size={14} color={colors.warning} />
                        <Text style={styles.sessionRatingText}>{session.rating}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))
            )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerSpacer: { width: 40 },
  container: { flex: 1 },
  content: { padding: spacing[4] },

  // Profile
  profileCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  studentName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[2],
  },
  profileMeta: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  metaBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  metaBadgeText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'capitalize',
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },

  // Month
  monthCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  monthTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthStat: {
    flex: 1,
    alignItems: 'center',
  },
  monthStatValue: {
    color: colors.primary[500],
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  monthStatLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  monthDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },

  // Sections
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: spacing[3],
    textTransform: 'uppercase',
  },

  // Trends
  trendSection: {
    marginBottom: spacing[3],
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  trendLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  trendTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  trendTag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
  },
  trendTagPositive: {
    backgroundColor: `${colors.success}15`,
  },
  trendTagWarning: {
    backgroundColor: `${colors.warning}15`,
  },
  trendTagTextPositive: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  trendTagTextWarning: {
    color: colors.warning,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Sessions
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionLeft: { flex: 1 },
  sessionDate: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  sessionDuration: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
  },
  sessionFocusTags: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sessionFocusTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.md,
  },
  sessionFocusTagText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sessionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  sessionRatingText: {
    color: colors.warning,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    marginTop: spacing[3],
  },

  bottomPadding: {
    height: spacing[10],
  },
});