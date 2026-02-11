import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  GlassCard,
  GlassInput,
  GradientButton,
  SectionHeader,
} from '../../components';

type ScheduleSessionScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

type SessionType = 'private' | 'group' | 'clinic';

const sessionTypes = [
  { id: 'private', label: 'Private', icon: 'person', description: '1-on-1 session' },
  { id: 'group', label: 'Group', icon: 'people', description: '2-6 students' },
  { id: 'clinic', label: 'Clinic', icon: 'school', description: 'Open session' },
];

const mockStudents = [
  { id: '1', name: 'Marcus Petrov' },
  { id: '2', name: 'Sarah Chen' },
  { id: '3', name: 'Alex Rodriguez' },
  { id: '4', name: 'James Wilson' },
  { id: '5', name: 'Emma Davis' },
];

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];

export function ScheduleSessionScreen({ navigation }: ScheduleSessionScreenProps) {
  const [sessionType, setSessionType] = useState<SessionType>('private');
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState('60');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      num: date.getDate(),
    };
  });

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSchedule = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a session title');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Missing Date', 'Please select a date');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Missing Time', 'Please select a time');
      return;
    }
    if (sessionType === 'private' && selectedStudents.length === 0) {
      Alert.alert('Missing Student', 'Please select a student for the private session');
      return;
    }

    // In a real app, this would save to the database
    Alert.alert(
      'Session Scheduled!',
      `${title} scheduled for ${selectedDate} at ${selectedTime}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.webContainer}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Session Type */}
          <SectionHeader title="Session Type" />
          <View style={styles.typeRow}>
            {sessionTypes.map((type) => (
              <GlassCard
                key={type.id}
                intensity={sessionType === type.id ? 'accent' : 'light'}
                onPress={() => setSessionType(type.id as SessionType)}
                style={[
                  styles.typeCard,
                  sessionType === type.id && styles.typeCardActive,
                ]}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={sessionType === type.id ? colors.primary[500] : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    sessionType === type.id && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Title */}
          <SectionHeader title="Session Title" />
          <GlassInput
            placeholder="e.g., Advanced Footwork Clinic"
            value={title}
            onChangeText={setTitle}
          />

          {/* Date Selection */}
          <SectionHeader title="Select Date" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((d) => (
              <TouchableOpacity
                key={d.date}
                style={[
                  styles.dateCard,
                  selectedDate === d.date && styles.dateCardActive,
                ]}
                onPress={() => setSelectedDate(d.date)}
              >
                <Text
                  style={[
                    styles.dateDay,
                    selectedDate === d.date && styles.dateDayActive,
                  ]}
                >
                  {d.day}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    selectedDate === d.date && styles.dateNumActive,
                  ]}
                >
                  {d.num}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time Selection */}
          <SectionHeader title="Select Time" />
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotActive,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration */}
          <SectionHeader title="Duration (minutes)" />
          <View style={styles.durationRow}>
            {['30', '45', '60', '90', '120'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationChip,
                  duration === d && styles.durationChipActive,
                ]}
                onPress={() => setDuration(d)}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === d && styles.durationTextActive,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Students (for private/group sessions) */}
          {sessionType !== 'clinic' && (
            <View style={styles.section}>
              <SectionHeader
                title={sessionType === 'private' ? 'Select Student' : 'Select Students'}
              />
              {mockStudents.map((student) => (
                <GlassCard
                  key={student.id}
                  intensity={selectedStudents.includes(student.id) ? 'accent' : 'light'}
                  onPress={() => {
                    if (sessionType === 'private') {
                      setSelectedStudents([student.id]);
                    } else {
                      toggleStudent(student.id);
                    }
                  }}
                  style={[
                    styles.studentItem,
                    selectedStudents.includes(student.id) && styles.studentItemActive,
                  ]}
                >
                  <View style={styles.studentRow}>
                    <View style={styles.studentAvatar}>
                      <Ionicons name="person" size={20} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.studentName}>{student.name}</Text>
                    {selectedStudents.includes(student.id) && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                    )}
                  </View>
                </GlassCard>
              ))}
            </View>
          )}

          {/* Location */}
          <SectionHeader title="Location" />
          <GlassInput
            placeholder="e.g., Elite Boxing Academy, Room 2"
            value={location}
            onChangeText={setLocation}
          />

          {/* Notes */}
          <SectionHeader title="Notes (Optional)" />
          <GlassInput
            placeholder="Any additional notes for this session..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Schedule Button */}
        <View style={styles.footer}>
          <GradientButton
            title="Schedule Session"
            onPress={handleSchedule}
            icon="calendar-outline"
            size="lg"
            fullWidth
          />
        </View>
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
  container: { flex: 1 },
  content: { padding: spacing[4] },
  section: { marginBottom: spacing[2] },
  typeRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
  },
  typeCardActive: {
    borderColor: colors.primary[500],
  },
  typeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  typeLabelActive: {
    color: colors.primary[500],
  },
  typeDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
  dateScroll: {
    marginBottom: spacing[4],
  },
  dateCard: {
    width: 60,
    height: 70,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  dateDay: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing[1],
  },
  dateDayActive: {
    color: colors.primary[500],
  },
  dateNum: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  dateNumActive: {
    color: colors.primary[500],
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  timeSlot: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeSlotActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  timeTextActive: {
    color: colors.primary[500],
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  durationChip: {
    flex: 1,
    paddingVertical: spacing[3],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  durationText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  durationTextActive: {
    color: colors.primary[500],
  },
  studentItem: {
    marginBottom: spacing[2],
  },
  studentItemActive: {
    borderColor: colors.primary[500],
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  studentName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomPadding: { height: spacing[10] },
});
