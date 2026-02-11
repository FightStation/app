import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedListItem } from '../../components';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SparringScheduleScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type SessionStatus = 'confirmed' | 'pending';

interface SparringSession {
  id: string;
  name: string;
  nickname?: string;
  weight: string;
  discipline: string;
  time: string;
  ampm: string;
  location: string;
  status: SessionStatus;
  date: string; // key like "2024-10-13"
  dateLabel: string; // display like "Tuesday, Oct 13"
}

interface CalendarDay {
  dayAbbr: string;
  dateNum: number;
  dateKey: string;
  hasEvents: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const TIME_COLUMN_WIDTH = 76;

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const CALENDAR_DAYS: CalendarDay[] = [
  { dayAbbr: 'MON', dateNum: 12, dateKey: '2024-10-12', hasEvents: false },
  { dayAbbr: 'TUE', dateNum: 13, dateKey: '2024-10-13', hasEvents: true },
  { dayAbbr: 'WED', dateNum: 14, dateKey: '2024-10-14', hasEvents: true },
  { dayAbbr: 'THU', dateNum: 15, dateKey: '2024-10-15', hasEvents: false },
  { dayAbbr: 'FRI', dateNum: 16, dateKey: '2024-10-16', hasEvents: false },
  { dayAbbr: 'SAT', dateNum: 17, dateKey: '2024-10-17', hasEvents: false },
];

const MOCK_SESSIONS: SparringSession[] = [
  {
    id: 'sess-1',
    name: 'Alex Rivera',
    nickname: 'The Ram',
    weight: '155 lbs',
    discipline: 'Lightweight',
    time: '06:30',
    ampm: 'PM',
    location: 'Apex MMA Academy, Downtown',
    status: 'confirmed',
    date: '2024-10-13',
    dateLabel: 'Tuesday, Oct 13',
  },
  {
    id: 'sess-2',
    name: 'Iron Peak Gym',
    nickname: undefined,
    weight: 'Open Mat',
    discipline: 'High Intensity',
    time: '08:00',
    ampm: 'PM',
    location: '42nd St. Industrial Zone',
    status: 'pending',
    date: '2024-10-13',
    dateLabel: 'Tuesday, Oct 13',
  },
  {
    id: 'sess-3',
    name: 'Marcus Chen',
    nickname: 'Titan',
    weight: '170 lbs',
    discipline: 'Welterweight',
    time: '07:15',
    ampm: 'AM',
    location: 'Titan Combat Lab',
    status: 'confirmed',
    date: '2024-10-14',
    dateLabel: 'Wednesday, Oct 14',
  },
];

// ---------------------------------------------------------------------------
// Helper: Group sessions by date
// ---------------------------------------------------------------------------

interface SectionItem {
  type: 'header' | 'session';
  key: string;
  dateLabel?: string;
  session?: SparringSession;
  isFirstSection?: boolean;
}

function buildSectionList(
  sessions: SparringSession[],
  selectedDate: string,
): SectionItem[] {
  const filtered = sessions.filter((s) => s.date >= selectedDate);
  if (filtered.length === 0) return [];

  const items: SectionItem[] = [];
  let currentDate = '';
  let isFirst = true;

  for (const session of filtered) {
    if (session.date !== currentDate) {
      items.push({
        type: 'header',
        key: `header-${session.date}`,
        dateLabel: session.dateLabel,
        isFirstSection: isFirst,
      });
      currentDate = session.date;
      isFirst = false;
    }
    items.push({
      type: 'session',
      key: session.id,
      session,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: SessionStatus }) {
  const isConfirmed = status === 'confirmed';
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: isConfirmed
            ? 'rgba(34, 197, 94, 0.15)'
            : 'rgba(245, 158, 11, 0.15)',
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          { color: isConfirmed ? colors.success : colors.warning },
        ]}
      >
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

function SessionCard({
  session,
  index,
  onPress,
}: {
  session: SparringSession;
  index: number;
  onPress: () => void;
}) {
  const displayName = session.nickname
    ? `${session.name.split(' ')[0]} "${session.nickname}" ${session.name.split(' ').slice(1).join(' ')}`
    : session.name;

  return (
    <AnimatedListItem index={index}>
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Left: Time column */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>{session.time}</Text>
          <Text style={styles.ampmText}>{session.ampm}</Text>
          <View style={styles.statusBadgeWrapper}>
            <StatusBadge status={session.status} />
          </View>
        </View>

        {/* Vertical divider */}
        <View style={styles.verticalDivider} />

        {/* Right: Fighter info */}
        <View style={styles.infoColumn}>
          <View style={styles.infoTopRow}>
            <Text style={styles.fighterName} numberOfLines={1}>
              {displayName}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </View>
          <Text style={styles.weightDiscipline} numberOfLines={1}>
            {session.weight} {'\u2022'} {session.discipline}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={14}
              color={colors.primary[500]}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {session.location}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedListItem>
  );
}

function DayDivider({ dateLabel }: { dateLabel: string }) {
  return (
    <View style={styles.dayDividerContainer}>
      <View style={styles.dayDividerLine} />
      <Text style={styles.dayDividerLabel}>{dateLabel}</Text>
      <View style={styles.dayDividerLine} />
    </View>
  );
}

function MotivationalFooter() {
  return (
    <View style={styles.motivationalContainer}>
      <View style={styles.motivationalIconCircle}>
        <Ionicons name="fitness-outline" size={28} color={colors.primary[500]} />
      </View>
      <Text style={styles.motivationalText}>
        Train hard, stay consistent.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function SparringScheduleScreen({
  navigation,
}: SparringScheduleScreenProps) {
  const [selectedDate, setSelectedDate] = useState('2024-10-13');

  const sectionItems = useMemo(
    () => buildSectionList(MOCK_SESSIONS, selectedDate),
    [selectedDate],
  );

  // Determine session-level index for stagger animation
  let sessionIndex = 0;

  const handleSessionPress = useCallback(() => {
    // Placeholder: no navigation target yet
  }, []);

  const handleFABPress = useCallback(() => {
    navigation.navigate('CreatePost', { postType: 'sparring_request' });
  }, [navigation]);

  const handleProfilePress = useCallback(() => {
    navigation.navigate('FighterProfile');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: SectionItem }) => {
      if (item.type === 'header') {
        if (item.isFirstSection) {
          // First section header: styled as "Upcoming Sessions" label + date
          return (
            <View style={styles.upcomingSectionHeader}>
              <Text style={styles.upcomingLabel}>UPCOMING SESSIONS</Text>
              <Text style={styles.upcomingDate}>{item.dateLabel}</Text>
            </View>
          );
        }
        // Subsequent date headers use the day divider style
        return <DayDivider dateLabel={item.dateLabel ?? ''} />;
      }

      if (item.type === 'session' && item.session) {
        const idx = sessionIndex++;
        return (
          <View style={styles.sessionCardWrapper}>
            <SessionCard
              session={item.session}
              index={idx}
              onPress={handleSessionPress}
            />
          </View>
        );
      }

      return null;
    },
    [handleSessionPress],
  );

  const keyExtractor = useCallback((item: SectionItem) => item.key, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="person"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ---- Calendar Strip ---- */}
        <View style={styles.calendarStrip}>
          {CALENDAR_DAYS.map((day) => {
            const isSelected = day.dateKey === selectedDate;
            return (
              <TouchableOpacity
                key={day.dateKey}
                style={[
                  styles.calendarDay,
                  isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => setSelectedDate(day.dateKey)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.calendarDayAbbr,
                    isSelected && styles.calendarDayAbbrSelected,
                  ]}
                >
                  {day.dayAbbr}
                </Text>
                <Text
                  style={[
                    styles.calendarDayNum,
                    isSelected && styles.calendarDayNumSelected,
                  ]}
                >
                  {day.dateNum}
                </Text>
                {day.hasEvents && !isSelected && (
                  <View style={styles.eventDot} />
                )}
                {day.hasEvents && isSelected && (
                  <View style={styles.eventDotSelected} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---- Sessions List ---- */}
        <FlatList
          data={sectionItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="calendar-outline"
                  size={36}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>No sessions scheduled</Text>
              <Text style={styles.emptySubtitle}>
                Tap the button below to post a sparring request.
              </Text>
            </View>
          }
          ListFooterComponent={
            sectionItems.length > 0 ? <MotivationalFooter /> : null
          }
        />

        {/* ---- FAB ---- */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFABPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={colors.textPrimary} />
          <Text style={styles.fabText}>Post Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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

  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- Calendar Strip ----
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  calendarDay: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 68,
    borderRadius: borderRadius.xl,
    backgroundColor: 'transparent',
    gap: spacing[1],
  },
  calendarDaySelected: {
    backgroundColor: colors.primary[500],
    ...shadows.md,
  },
  calendarDayAbbr: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  calendarDayAbbrSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  calendarDayNum: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  calendarDayNumSelected: {
    color: colors.textPrimary,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
  },
  eventDotSelected: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },

  // ---- Upcoming Section Header ----
  upcomingSectionHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  upcomingLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  upcomingDate: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },

  // ---- Session Card ----
  sessionCardWrapper: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    gap: spacing[0.5],
  },
  timeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  ampmText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  statusBadgeWrapper: {
    marginTop: spacing[1.5],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 9,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[3],
  },
  infoColumn: {
    flex: 1,
    paddingVertical: spacing[4],
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
    justifyContent: 'center',
    gap: spacing[1],
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fighterName: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginRight: spacing[2],
  },
  weightDiscipline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[0.5],
  },
  locationText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },

  // ---- Day Divider ----
  dayDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[5],
  },
  dayDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dayDividerLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },

  // ---- Motivational Footer ----
  motivationalContainer: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  motivationalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationalText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ---- Empty State ----
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[6],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },

  // ---- List ----
  listContent: {
    paddingBottom: spacing[20],
  },

  // ---- FAB ----
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    ...shadows.lg,
  },
  fabText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.wide,
  },
});
