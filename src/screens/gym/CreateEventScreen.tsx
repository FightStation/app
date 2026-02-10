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
import { useAuth } from '../../context/AuthContext';
import { Gym } from '../../types';
import { createEvent } from '../../services/events';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type CreateEventScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const EVENT_TYPES = [
  { id: 'sparring', label: 'Sparring Session', icon: 'fitness', description: 'Practice sparring with other fighters' },
  { id: 'tryout', label: 'Try-Out / Intro Day', icon: 'person-add', description: 'Open session for new members' },
  { id: 'fight', label: 'Upcoming Fight', icon: 'trophy', description: 'Announce fighter competitions' },
  { id: 'training', label: 'Training Session', icon: 'barbell', description: 'Regular training class' },
];

const INTENSITY_OPTIONS = [
  { id: 'technical', label: 'Technical', description: 'Light contact, focus on technique' },
  { id: 'hard', label: 'Hard Sparring', description: 'Competitive sparring with protection' },
  { id: 'all_levels', label: 'All Levels', description: 'Mixed intensity, all welcome' },
];

const WEIGHT_CLASSES = [
  'Flyweight',
  'Bantamweight',
  'Featherweight',
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Cruiserweight',
  'Heavyweight',
];

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export function CreateEventScreen({ navigation }: CreateEventScreenProps) {
  const { profile } = useAuth();
  const gym = profile as Gym;

  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [intensity, setIntensity] = useState('');
  const [selectedWeightClasses, setSelectedWeightClasses] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [fighterName, setFighterName] = useState('');
  const [opponent, setOpponent] = useState('');
  const [venue, setVenue] = useState('');

  const toggleWeightClass = (wc: string) => {
    if (selectedWeightClasses.includes(wc)) {
      setSelectedWeightClasses(selectedWeightClasses.filter((w) => w !== wc));
    } else {
      setSelectedWeightClasses([...selectedWeightClasses, wc]);
    }
  };

  const toggleExperience = (exp: string) => {
    if (selectedExperience.includes(exp)) {
      setSelectedExperience(selectedExperience.filter((e) => e !== exp));
    } else {
      setSelectedExperience([...selectedExperience, exp]);
    }
  };

  const handleCreate = async () => {
    if (!eventType || !title || !eventDate || !startTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Additional validation for fight events
    if (eventType === 'fight' && (!fighterName || !opponent)) {
      alert('Please specify fighter name and opponent for fight events');
      return;
    }

    setLoading(true);

    try {
      const mappedWeightClasses = selectedWeightClasses.map((wc) =>
        wc.replaceAll(' ', '_').toLowerCase()
      );
      const mappedExperience = selectedExperience.map((exp) =>
        exp === 'Professional' ? 'pro' : exp.toLowerCase()
      );

      await createEvent({
        gym_id: gym.id,
        title,
        description: description || undefined,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime || undefined,
        max_participants: parseInt(maxParticipants, 10) || 16,
        intensity: intensity || undefined,
        weight_classes: mappedWeightClasses,
        experience_levels: mappedExperience,
        status: 'upcoming',
      });

      alert('Event created successfully!');
      navigation.goBack();
    } catch (error: any) {
      alert(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              EVENT TYPE <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.eventTypesGrid}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.eventTypeCard,
                    eventType === type.id && styles.eventTypeCardSelected,
                  ]}
                  onPress={() => setEventType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={32}
                    color={
                      eventType === type.id ? colors.primary[500] : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.eventTypeLabel,
                      eventType === type.id && styles.eventTypeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text style={styles.eventTypeDescription}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EVENT DETAILS</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Event Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Technical Sparring Session"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the session, rules, requirements..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATE & TIME</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>
                  Date <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nov 5, 2024"
                  placeholderTextColor={colors.textMuted}
                  value={eventDate}
                  onChangeText={setEventDate}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing[2] }]}>
                <Text style={styles.inputLabel}>
                  Start Time <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="18:00"
                  placeholderTextColor={colors.textMuted}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="20:00"
                  placeholderTextColor={colors.textMuted}
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Max Participants</Text>
              <TextInput
                style={styles.input}
                placeholder="16"
                placeholderTextColor={colors.textMuted}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Fight-specific fields */}
          {eventType === 'fight' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FIGHT DETAILS</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Fighter Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your fighter's name"
                  placeholderTextColor={colors.textMuted}
                  value={fighterName}
                  onChangeText={setFighterName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Opponent <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Opponent's name"
                  placeholderTextColor={colors.textMuted}
                  value={opponent}
                  onChangeText={setOpponent}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Venue</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Fight venue/location"
                  placeholderTextColor={colors.textMuted}
                  value={venue}
                  onChangeText={setVenue}
                />
              </View>
            </View>
          )}

          {/* Intensity - only for sparring events */}
          {eventType === 'sparring' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                INTENSITY <Text style={styles.required}>*</Text>
              </Text>
              {INTENSITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    intensity === option.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setIntensity(option.id)}
                >
                  <View style={styles.optionHeader}>
                    <Text
                      style={[
                        styles.optionTitle,
                        intensity === option.id && styles.optionTitleSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        intensity === option.id && styles.radioSelected,
                      ]}
                    >
                      {intensity === option.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Weight Classes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEIGHT CLASSES</Text>
            <Text style={styles.sectionHint}>
              Select all weight classes welcome at this session
            </Text>
            <View style={styles.tagsContainer}>
              {WEIGHT_CLASSES.map((wc) => (
                <TouchableOpacity
                  key={wc}
                  style={[
                    styles.tag,
                    selectedWeightClasses.includes(wc) && styles.tagSelected,
                  ]}
                  onPress={() => toggleWeightClass(wc)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedWeightClasses.includes(wc) && styles.tagTextSelected,
                    ]}
                  >
                    {wc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Experience Levels */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXPERIENCE LEVELS</Text>
            <Text style={styles.sectionHint}>
              Who is this session appropriate for?
            </Text>
            <View style={styles.tagsContainer}>
              {EXPERIENCE_LEVELS.map((exp) => (
                <TouchableOpacity
                  key={exp}
                  style={[
                    styles.tag,
                    selectedExperience.includes(exp) && styles.tagSelected,
                  ]}
                  onPress={() => toggleExperience(exp)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedExperience.includes(exp) && styles.tagTextSelected,
                    ]}
                  >
                    {exp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color={colors.textPrimary}
            />
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Event'}
            </Text>
          </TouchableOpacity>

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
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  eventTypeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
  },
  eventTypeCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  eventTypeLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  eventTypeLabelSelected: {
    color: colors.primary[500],
  },
  eventTypeDescription: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[2],
  },
  required: {
    color: colors.primary[500],
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  textArea: {
    height: 100,
    paddingTop: spacing[3],
  },
  row: {
    flexDirection: 'row',
  },
  optionCard: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  optionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  optionTitleSelected: {
    color: colors.primary[500],
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tagTextSelected: {
    color: colors.textPrimary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    marginTop: spacing[4],
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  bottomPadding: {
    height: spacing[10],
  },
});
