import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { GlassCard, GlassInput, GradientButton, SectionHeader, EmptyState, AnimatedListItem } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

type TrainingScheduleScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type TrainingSession = {
  id: string;
  name: string;
  description: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string;
  endTime: string;
  coachName: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  maxParticipants?: number;
};

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

// Mock sessions for demo mode
const MOCK_SESSIONS: TrainingSession[] = [
  {
    id: '1',
    name: 'Morning Conditioning',
    description: 'High-intensity cardio and strength training',
    dayOfWeek: 1,
    startTime: '06:00',
    endTime: '07:30',
    coachName: 'Mike Thompson',
    level: 'All Levels',
    maxParticipants: 20,
  },
  {
    id: '2',
    name: 'Technical Boxing',
    description: 'Focus on technique, footwork, and combinations',
    dayOfWeek: 1,
    startTime: '18:00',
    endTime: '19:30',
    coachName: 'Sarah Chen',
    level: 'Intermediate',
    maxParticipants: 15,
  },
  {
    id: '3',
    name: 'Beginners Class',
    description: 'Introduction to boxing fundamentals',
    dayOfWeek: 2,
    startTime: '19:00',
    endTime: '20:00',
    coachName: 'Mike Thompson',
    level: 'Beginner',
    maxParticipants: 12,
  },
  {
    id: '4',
    name: 'Sparring Session',
    description: 'Controlled sparring for all levels',
    dayOfWeek: 3,
    startTime: '18:00',
    endTime: '19:30',
    coachName: 'Sarah Chen',
    level: 'All Levels',
    maxParticipants: 16,
  },
  {
    id: '5',
    name: 'Open Gym',
    description: 'Self-training with equipment access',
    dayOfWeek: 5,
    startTime: '12:00',
    endTime: '14:00',
    coachName: 'No coach',
    level: 'All Levels',
  },
];

export function TrainingScheduleScreen({
  navigation,
}: TrainingScheduleScreenProps) {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    coachName: '',
    level: 'All Levels' as TrainingSession['level'],
    maxParticipants: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    if (!isSupabaseConfigured) {
      // Demo mode
      setSessions(MOCK_SESSIONS);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('gym_id', (profile as any)?.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load training sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async () => {
    if (!formData.name || !formData.coachName) {
      Alert.alert('Missing Info', 'Please fill in session name and coach');
      return;
    }

    if (!isSupabaseConfigured) {
      // Demo mode
      const newSession: TrainingSession = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        coachName: formData.coachName,
        level: formData.level,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : undefined,
      };
      setSessions([...sessions, newSession]);
      Alert.alert('Success', 'Training session added! (Demo mode)');
      setShowAddForm(false);
      resetForm();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('training_sessions').insert({
        gym_id: (profile as any)?.id,
        name: formData.name,
        description: formData.description,
        day_of_week: formData.dayOfWeek,
        start_time: formData.startTime,
        end_time: formData.endTime,
        coach_name: formData.coachName,
        level: formData.level,
        max_participants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
      });

      if (error) throw error;

      Alert.alert('Success', 'Training session added!');
      setShowAddForm(false);
      resetForm();
      loadSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      Alert.alert('Error', 'Failed to add training session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (session: TrainingSession) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${session.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!isSupabaseConfigured) {
              setSessions(sessions.filter((s) => s.id !== session.id));
              Alert.alert('Success', 'Session deleted! (Demo mode)');
              return;
            }

            try {
              const { error } = await supabase
                .from('training_sessions')
                .delete()
                .eq('id', session.id);

              if (error) throw error;
              Alert.alert('Success', 'Session deleted');
              loadSessions();
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
      coachName: '',
      level: 'All Levels',
      maxParticipants: '',
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return colors.success;
      case 'Intermediate':
        return colors.warning;
      case 'Advanced':
        return colors.error;
      default:
        return colors.primary[500];
    }
  };

  const groupSessionsByDay = () => {
    const grouped: { [key: number]: TrainingSession[] } = {};
    sessions.forEach((session) => {
      if (!grouped[session.dayOfWeek]) {
        grouped[session.dayOfWeek] = [];
      }
      grouped[session.dayOfWeek].push(session);
    });
    return grouped;
  };

  const sessionsByDay = groupSessionsByDay();

  const renderAddForm = () => (
    <GlassCard style={styles.addForm}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>New Training Session</Text>
        <TouchableOpacity onPress={() => setShowAddForm(false)}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <GlassInput
        label="Session Name"
        placeholder="e.g., Morning Conditioning"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <GlassInput
        label="Description"
        placeholder="Brief description of the session..."
        value={formData.description}
        onChangeText={(text) =>
          setFormData({ ...formData, description: text })
        }
        multiline
        numberOfLines={3}
      />

      <Text style={styles.inputLabel}>Day of Week</Text>
      <View style={styles.chipGrid}>
        {DAYS_OF_WEEK.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayChip,
              formData.dayOfWeek === index && styles.dayChipSelected,
            ]}
            onPress={() => setFormData({ ...formData, dayOfWeek: index })}
          >
            <Text
              style={[
                styles.dayChipText,
                formData.dayOfWeek === index && styles.dayChipTextSelected,
              ]}
            >
              {day.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <GlassInput
            label="Start Time"
            placeholder="09:00"
            value={formData.startTime}
            onChangeText={(text) =>
              setFormData({ ...formData, startTime: text })
            }
          />
        </View>
        <View style={styles.timeField}>
          <GlassInput
            label="End Time"
            placeholder="10:30"
            value={formData.endTime}
            onChangeText={(text) =>
              setFormData({ ...formData, endTime: text })
            }
          />
        </View>
      </View>

      <GlassInput
        label="Coach Name"
        placeholder="Coach or instructor name"
        value={formData.coachName}
        onChangeText={(text) =>
          setFormData({ ...formData, coachName: text })
        }
      />

      <Text style={styles.inputLabel}>Level</Text>
      <View style={styles.chipGrid}>
        {LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelChip,
              formData.level === level && styles.levelChipSelected,
            ]}
            onPress={() =>
              setFormData({
                ...formData,
                level: level as TrainingSession['level'],
              })
            }
          >
            <Text
              style={[
                styles.levelChipText,
                formData.level === level && styles.levelChipTextSelected,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <GlassInput
        label="Max Participants (Optional)"
        placeholder="Leave empty for unlimited"
        value={formData.maxParticipants}
        onChangeText={(text) =>
          setFormData({ ...formData, maxParticipants: text })
        }
        keyboardType="number-pad"
      />

      <GradientButton
        title="Add Session"
        onPress={handleAddSession}
        loading={loading}
        fullWidth
        style={styles.addButton}
      />
    </GlassCard>
  );

  const renderSessionCard = (session: TrainingSession, index: number) => (
    <AnimatedListItem key={session.id} index={index}>
      <GlassCard accentColor={getLevelColor(session.level)} style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionMainInfo}>
            <Text style={styles.sessionName}>{session.name}</Text>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: `${getLevelColor(session.level)}20` },
              ]}
            >
              <Text
                style={[
                  styles.levelBadgeText,
                  { color: getLevelColor(session.level) },
                ]}
              >
                {session.level}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSession(session)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {session.description && (
          <Text style={styles.sessionDescription}>
            {session.description}
          </Text>
        )}

        <View style={styles.sessionMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {session.startTime} - {session.endTime}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={16} color={colors.textMuted} />
            <Text style={styles.metaText}>{session.coachName}</Text>
          </View>
          {session.maxParticipants && (
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>
                Max {session.maxParticipants}
              </Text>
            </View>
          )}
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  const renderScheduleContent = () => (
    <>
      {/* Weekly Schedule */}
      {DAYS_OF_WEEK.map((day, dayIndex) => {
        const daySessions = sessionsByDay[dayIndex] || [];
        if (daySessions.length === 0) return null;

        return (
          <View key={dayIndex} style={styles.daySection}>
            <SectionHeader title={day} />
            {daySessions.map((session, idx) => renderSessionCard(session, idx))}
          </View>
        );
      })}

      {sessions.length === 0 && !showAddForm && (
        <EmptyState
          icon="calendar-outline"
          title="No training sessions yet"
          description="Tap the + button to add your first session"
          actionLabel="Add Session"
          onAction={() => setShowAddForm(true)}
        />
      )}

      {/* Info Box */}
      <GlassCard intensity="accent" style={styles.infoBox}>
        <View style={styles.infoBoxContent}>
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
          <Text style={styles.infoText}>
            Set up your recurring training schedule. Fighters can view these times
            and plan their training accordingly.
          </Text>
        </View>
      </GlassCard>
    </>
  );

  // Desktop layout
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Header */}
        <View style={styles.desktopHeader}>
          <TouchableOpacity
            style={styles.backButtonDesktop}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.desktopHeaderTitle}>Training Schedule</Text>
          <TouchableOpacity
            style={styles.addButtonDesktop}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons
              name={showAddForm ? 'close' : 'add'}
              size={24}
              color={colors.primary[500]}
            />
            <Text style={styles.addButtonText}>
              {showAddForm ? 'Cancel' : 'Add Session'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.desktopScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.desktopCard}>
            {/* Icon and Title */}
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={32} color={colors.primary[500]} />
              </View>
              <Text style={styles.cardTitle}>Weekly Training Schedule</Text>
              <Text style={styles.cardSubtitle}>
                Manage your gym's training sessions and classes
              </Text>
            </View>

            {/* Add Session Form */}
            {showAddForm && renderAddForm()}

            {/* Schedule Content */}
            {renderScheduleContent()}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Schedule</Text>
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
          <Ionicons
            name={showAddForm ? 'close' : 'add'}
            size={28}
            color={colors.primary[500]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.mobileScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Session Form */}
        {showAddForm && renderAddForm()}

        {/* Schedule Content */}
        {renderScheduleContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
  },
  desktopHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: `${colors.primary[500]}15`,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  mobileScrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  desktopScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing[8],
  },
  desktopCard: {
    width: '100%',
    maxWidth: 800,
    borderRadius: borderRadius['2xl'],
    padding: spacing[8],
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    } : {}),
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  cardTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  cardSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addForm: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[6],
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  dayChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  dayChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  dayChipTextSelected: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  timeField: {
    flex: 1,
  },
  levelChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelChipSelected: {
    backgroundColor: `${colors.primary[500]}20`,
    borderColor: colors.primary[500],
  },
  levelChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  levelChipTextSelected: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
  addButton: {
    marginTop: spacing[2],
  },
  daySection: {
    marginBottom: spacing[6],
  },
  dayTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[3],
  },
  sessionCard: {
    marginBottom: spacing[3],
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  sessionMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  sessionName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  levelBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  levelBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  deleteButton: {
    padding: spacing[1],
  },
  sessionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyStateText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  infoBox: {
    marginTop: spacing[4],
  },
  infoBoxContent: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
