import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

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

export function ManageStudentsScreen({ navigation }: ManageStudentsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<StudentLevel>('All');

  const levels: StudentLevel[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

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
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Level Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {levels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterChip,
                  selectedLevel === level && styles.filterChipActive,
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLevel === level && styles.filterChipTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockStudents.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {mockStudents.filter((s) => s.level === 'Advanced').length}
            </Text>
            <Text style={styles.statLabel}>Advanced</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {mockStudents.filter((s) => s.level === 'Intermediate').length}
            </Text>
            <Text style={styles.statLabel}>Intermediate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {mockStudents.filter((s) => s.level === 'Beginner').length}
            </Text>
            <Text style={styles.statLabel}>Beginner</Text>
          </View>
        </View>

        {/* Students List */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          ) : (
            filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentCard}
                onPress={() => handleStudentPress(student.id)}
              >
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
              </TouchableOpacity>
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
    paddingVertical: spacing[3],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
  },
  filterContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: `${colors.primary[500]}20`,
    borderColor: colors.primary[500],
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.primary[500],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
    marginHorizontal: spacing[4],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  list: { flex: 1 },
  listContent: { padding: spacing[4] },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    marginTop: spacing[3],
  },
  bottomPadding: { height: spacing[10] },
});
