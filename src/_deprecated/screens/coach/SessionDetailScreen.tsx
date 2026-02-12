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
import { TrainingSession, TRAINING_FOCUS_LABELS, TrainingFocusArea } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
  PulseIndicator,
  AnimatedListItem,
} from '../../components';

type SessionDetailScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
  route?: RouteProp<{ params: { sessionId: string } }, 'params'>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const MOCK_SESSION: TrainingSession = {
  id: 'session-1',
  coach_id: 'coach-1',
  fighter_id: 'fighter-1',
  session_date: new Date().toISOString().split('T')[0],
  start_time: '14:00',
  end_time: '15:30',
  duration_minutes: 90,
  focus_areas: ['technique', 'pad_work', 'conditioning'],
  exercises: [
    { id: 'ex-1', session_id: 'session-1', name: 'Jab-Cross Combos', category: 'technique', sets: 5, reps: 20, notes: 'Focus on footwork', order: 1 },
    { id: 'ex-2', session_id: 'session-1', name: 'Pad Rounds', category: 'pad_work', sets: 6, duration_seconds: 180, notes: '3 min rounds', order: 2 },
    { id: 'ex-3', session_id: 'session-1', name: 'Heavy Bag Power Shots', category: 'bag_work', sets: 4, reps: 30, order: 3 },
    { id: 'ex-4', session_id: 'session-1', name: 'Burpees + Shadow Boxing', category: 'conditioning', sets: 3, reps: 15, order: 4 },
    { id: 'ex-5', session_id: 'session-1', name: 'Core Circuit', category: 'strength', sets: 3, reps: 20, order: 5 },
  ],
  notes: 'Good session. Fighter showed improvement in jab speed and footwork. Needs to work on keeping hands up when tired. Conditioning is improving steadily.',
  rating: 4,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  fighter: {
    id: 'fighter-1',
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  technique: 'school',
  conditioning: 'fitness',
  sparring: 'people',
  drills: 'repeat',
  pad_work: 'hand-left',
  bag_work: 'flame',
  strength: 'barbell',
  cardio: 'heart',
  flexibility: 'body',
};

export function SessionDetailScreen({ navigation, route }: SessionDetailScreenProps) {
  const sessionId = route?.params?.sessionId;
  const [session, setSession] = useState<TrainingSession>(MOCK_SESSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    if (!isSupabaseConfigured) {
      setSession(MOCK_SESSION);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          fighter:fighters(*),
          exercises:training_exercises(*)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (data) setSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={20}
        color={i < rating ? colors.warning : colors.textMuted}
      />
    ));
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
          <Text style={styles.headerTitle}>Session Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Session Summary Card */}
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.dateText}>{formatDate(session.session_date)}</Text>
              <PulseIndicator color={colors.success} size="sm" />
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.timeText}>
                {formatTime(session.start_time)} - {formatTime(session.end_time)}
              </Text>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{session.duration_minutes} min</Text>
              </View>
            </View>
            {session.rating != null && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Session Rating</Text>
                <View style={styles.stars}>{renderStars(session.rating)}</View>
              </View>
            )}
          </GlassCard>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <StatCard
              icon="time-outline"
              value={`${session.duration_minutes}m`}
              label="Duration"
            />
            <StatCard
              icon="barbell-outline"
              value={session.exercises?.length || 0}
              label="Exercises"
            />
            <StatCard
              icon="star"
              value={session.rating || '-'}
              label="Rating"
              accentColor={colors.warning}
            />
          </View>

          {/* Fighter Card */}
          {session.fighter && (
            <GlassCard
              onPress={() => navigation?.navigate('FighterProfileView', { fighterId: session.fighter!.id })}
              style={styles.fighterCard}
            >
              <View style={styles.fighterRow}>
                <View style={styles.fighterAvatarPlaceholder}>
                  <Ionicons name="person" size={28} color={colors.textMuted} />
                </View>
                <View style={styles.fighterInfo}>
                  <Text style={styles.fighterName}>
                    {session.fighter.first_name} {session.fighter.last_name}
                  </Text>
                  <Text style={styles.fighterMeta}>
                    {session.fighter.weight_class?.replace(/_/g, ' ')} &middot; {session.fighter.experience_level}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </GlassCard>
          )}

          {/* Focus Areas */}
          <SectionHeader title="Training Focus" />
          <View style={styles.focusTags}>
            {session.focus_areas.map((area) => (
              <GlassCard key={area} style={styles.focusTag}>
                <View style={styles.focusTagContent}>
                  <Ionicons
                    name={(CATEGORY_ICONS[area] || 'fitness') as any}
                    size={16}
                    color={colors.primary[500]}
                  />
                  <Text style={styles.focusTagText}>
                    {TRAINING_FOCUS_LABELS[area as TrainingFocusArea] || area}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Exercises */}
          {session.exercises && session.exercises.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={`Exercises (${session.exercises.length})`} />
              {session.exercises
                .sort((a, b) => a.order - b.order)
                .map((exercise, index) => (
                <AnimatedListItem key={exercise.id} index={index}>
                  <GlassCard style={styles.exerciseCard}>
                    <View style={styles.exerciseRow}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.exerciseDetails}>
                          {exercise.sets && (
                            <Text style={styles.exerciseDetail}>{exercise.sets} sets</Text>
                          )}
                          {exercise.reps && (
                            <Text style={styles.exerciseDetail}>{exercise.reps} reps</Text>
                          )}
                          {exercise.duration_seconds && (
                            <Text style={styles.exerciseDetail}>
                              {Math.floor(exercise.duration_seconds / 60)}:{(exercise.duration_seconds % 60).toString().padStart(2, '0')}
                            </Text>
                          )}
                          {exercise.weight_kg && (
                            <Text style={styles.exerciseDetail}>{exercise.weight_kg}kg</Text>
                          )}
                        </View>
                        {exercise.notes && (
                          <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                </AnimatedListItem>
              ))}
            </View>
          )}

          {/* Coach Notes */}
          {session.notes && (
            <View style={styles.section}>
              <SectionHeader title="Coach Notes" />
              <GlassCard>
                <Text style={styles.notesText}>{session.notes}</Text>
              </GlassCard>
            </View>
          )}

          {/* Actions */}
          {session.fighter && (
            <GradientButton
              title="View Fighter Progress"
              onPress={() => navigation?.navigate('StudentProgress', { studentId: session.fighter!.id })}
              icon="trending-up"
              fullWidth
              style={styles.progressButton}
            />
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

  // Summary
  summaryCard: {
    marginBottom: spacing[4],
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  durationBadge: {
    backgroundColor: `${colors.primary[500]}20`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  durationText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing[1],
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },

  // Fighter
  fighterCard: {
    marginBottom: spacing[4],
  },
  fighterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  fighterAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fighterInfo: { flex: 1 },
  fighterName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  fighterMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textTransform: 'capitalize',
  },

  // Sections
  section: {
    marginBottom: spacing[4],
  },

  // Focus Tags
  focusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  focusTag: {
    padding: spacing[2],
  },
  focusTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  focusTagText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Exercises
  exerciseCard: {
    marginBottom: spacing[2],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumberText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  exerciseDetail: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  exerciseNotes: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    marginTop: spacing[1],
  },

  // Notes
  notesText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },

  // Actions
  progressButton: {
    marginBottom: spacing[4],
  },

  bottomPadding: {
    height: spacing[10],
  },
});
