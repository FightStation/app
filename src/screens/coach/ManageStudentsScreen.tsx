import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  GlassCard,
  GlassInput,
  SectionHeader,
  StatCard,
  EmptyState,
  BadgeRow,
  AnimatedListItem,
  ProgressRing,
} from '../../components';

type ManageStudentsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

type StudentLevel = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

const mockStudents = [
  {
    id: '1',
    name: 'Marcus Petrov',
    level: 'Advanced',
    sessions: 24,
    lastSession: '2 days ago',
    discipline: 'Boxing',
    avatar: null,
    progress: 85,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    level: 'Intermediate',
    sessions: 18,
    lastSession: '1 week ago',
    discipline: 'Muay Thai',
    avatar: null,
    progress: 62,
  },
  {
    id: '3',
    name: 'Alex Rodriguez',
    level: 'Beginner',
    sessions: 6,
    lastSession: '3 days ago',
    discipline: 'MMA',
    avatar: null,
    progress: 28,
  },
  {
    id: '4',
    name: 'James Wilson',
    level: 'Intermediate',
    sessions: 12,
    lastSession: '5 days ago',
    discipline: 'Boxing',
    avatar: null,
    progress: 45,
  },
  {
    id: '5',
    name: 'Emma Davis',
    level: 'Advanced',
    sessions: 36,
    lastSession: 'Yesterday',
    discipline: 'BJJ',
    avatar: null,
    progress: 92,
  },
];

const levelColors: Record<string, string> = {
  Beginner: colors.success,
  Intermediate: colors.warning,
  Advanced: colors.primary[500],
};

const levelBadgeItems = [
  { key: 'All', label: 'All' },
  { key: 'Beginner', label: 'Beginner' },
  { key: 'Intermediate', label: 'Intermediate' },
  { key: 'Advanced', label: 'Advanced' },
];

export function ManageStudentsScreen({ navigation }: ManageStudentsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<StudentLevel>('All');

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || student.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const handleStudentPress = (studentId: string) => {
    navigation.navigate('FighterProfileView', { fighterId: studentId });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Students</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <GlassInput
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search" size={20} color={colors.textMuted} />}
            rightIcon={
              searchQuery.length > 0 ? (
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              ) : undefined
            }
            onRightIconPress={searchQuery.length > 0 ? () => setSearchQuery('') : undefined}
            containerStyle={styles.searchInputContainer}
          />
        </View>

        {/* Level Filter */}
        <BadgeRow
          items={levelBadgeItems}
          selected={selectedLevel}
          onSelect={(key) => setSelectedLevel(key as StudentLevel)}
          style={styles.filterRow}
        />

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <StatCard
            icon="people"
            value={mockStudents.length}
            label="Total"
          />
          <StatCard
            icon="trophy"
            value={mockStudents.filter((s) => s.level === 'Advanced').length}
            label="Advanced"
            accentColor={colors.primary[500]}
          />
          <StatCard
            icon="trending-up"
            value={mockStudents.filter((s) => s.level === 'Intermediate').length}
            label="Intermediate"
            accentColor={colors.warning}
          />
          <StatCard
            icon="leaf"
            value={mockStudents.filter((s) => s.level === 'Beginner').length}
            label="Beginner"
            accentColor={colors.success}
          />
        </View>

        {/* Students List */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredStudents.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No students found"
              description="Try adjusting your search or filter to find students."
            />
          ) : (
            filteredStudents.map((student, index) => (
              <AnimatedListItem key={student.id} index={index}>
                <GlassCard
                  onPress={() => handleStudentPress(student.id)}
                  style={styles.studentCard}
                >
                  <View style={styles.studentRow}>
                    <View style={styles.studentAvatar}>
                      <Ionicons name="person" size={28} color={colors.textPrimary} />
                    </View>
                    <View style={styles.studentInfo}>
                      <View style={styles.studentHeader}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <View
                          style={[
                            styles.levelBadge,
                            { backgroundColor: `${levelColors[student.level]}20` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.levelText,
                              { color: levelColors[student.level] },
                            ]}
                          >
                            {student.level}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.studentMeta}>
                        <Text style={styles.disciplineText}>{student.discipline}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.sessionCount}>{student.sessions} sessions</Text>
                      </View>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${student.progress}%`,
                                backgroundColor: levelColors[student.level],
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>{student.progress}%</Text>
                      </View>
                      <Text style={styles.lastSession}>Last session: {student.lastSession}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                </GlassCard>
              </AnimatedListItem>
            ))
          )}
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
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  filterRow: {
    paddingVertical: spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  list: { flex: 1 },
  listContent: { padding: spacing[4] },
  studentCard: {
    marginBottom: spacing[3],
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  studentInfo: { flex: 1 },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  studentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  disciplineText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  dotSeparator: {
    color: colors.textMuted,
    marginHorizontal: spacing[1],
  },
  sessionCount: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    width: 35,
  },
  lastSession: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  bottomPadding: { height: spacing[10] },
});
