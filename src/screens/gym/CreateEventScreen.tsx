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
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Gym } from '../../types';
import { createEvent } from '../../services/events';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { GlassCard, GradientButton } from '../../components';

type CreateEventScreenProps = { navigation: NativeStackNavigationProp<any> };

const EVENT_TYPES = [
  { id: 'sparring', label: 'Sparring', icon: 'flash', desc: 'Arrange sparring sessions' },
  { id: 'training', label: 'Training', icon: 'barbell', desc: 'Open training for visitors' },
  { id: 'competition', label: 'Competition', icon: 'trophy', desc: 'Upcoming fight or competition' },
];

const INTENSITY_OPTIONS = [
  { id: 'technical', label: 'Technical' },
  { id: 'hard', label: 'Hard Sparring' },
  { id: 'all_levels', label: 'All Levels' },
];

const WEIGHT_CLASSES = [
  'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight', 'Welterweight',
  'Middleweight', 'Light Heavyweight', 'Cruiserweight', 'Heavyweight',
];

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export function CreateEventScreen({ navigation }: CreateEventScreenProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const gym = profile as Gym;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedWeightClasses, setSelectedWeightClasses] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [intensity, setIntensity] = useState('');
  const [venue, setVenue] = useState('');
  const [fighterName, setFighterName] = useState('');
  const [opponent, setOpponent] = useState('');
  const [description, setDescription] = useState('');

  const toggleItem = (item: string, list: string[], setter: (l: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const validateStep = (step: number) => {
    if (step === 1 && (!eventType || !title || !eventDate || !startTime)) {
      showToast('Please fill in all required fields', 'error');
      return false;
    }
    if (step === 2) {
      if (eventType === 'sparring' && !intensity) {
        showToast('Please select sparring intensity', 'error');
        return false;
      }
      if (eventType === 'competition' && (!fighterName || !opponent)) {
        showToast('Please specify fighter name and opponent', 'error');
        return false;
      }
    }
    return true;
  };

  const handleCreate = async () => {
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

      showToast('Event created successfully!', 'success');
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || 'Failed to create event', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.stepDot, step === currentStep && styles.stepDotActive, step < currentStep && styles.stepDotCompleted]}>
                {step < currentStep ? (
                  <Ionicons name="checkmark" size={12} color={colors.textPrimary} />
                ) : (
                  <Text style={styles.stepDotText}>{step}</Text>
                )}
              </View>
              {step < 3 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {currentStep === 1 && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Text style={styles.stepTitle}>Basic Information</Text>
                <Text style={styles.stepSubtitle}>Let's start with the essentials</Text>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Event Type *</Text>
                  <View style={styles.eventTypesGrid}>
                    {EVENT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.eventTypeCard, eventType === type.id && styles.eventTypeCardSelected]}
                        onPress={() => setEventType(type.id)}
                      >
                        <Ionicons name={type.icon as any} size={32} color={eventType === type.id ? colors.primary[500] : colors.textMuted} />
                        <Text style={[styles.eventTypeLabel, eventType === type.id && { color: colors.primary[500] }]}>{type.label}</Text>
                        <Text style={styles.eventTypeDescription}>{type.desc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.inputLabel}>Event Title *</Text>
                  <TextInput style={styles.input} placeholder="e.g., Technical Sparring Session" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
                </View>

                <View style={styles.section}>
                  <Text style={styles.inputLabel}>Date *</Text>
                  <TextInput style={styles.input} placeholder="Nov 5, 2024" placeholderTextColor={colors.textMuted} value={eventDate} onChangeText={setEventDate} />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Start Time *</Text>
                    <TextInput style={styles.input} placeholder="18:00" placeholderTextColor={colors.textMuted} value={startTime} onChangeText={setStartTime} />
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <TextInput style={styles.input} placeholder="20:00" placeholderTextColor={colors.textMuted} value={endTime} onChangeText={setEndTime} />
                  </View>
                </View>
              </Animated.View>
            )}

            {currentStep === 2 && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Text style={styles.stepTitle}>Event Details</Text>
                <Text style={styles.stepSubtitle}>Configure participants & settings</Text>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Weight Classes</Text>
                  <View style={styles.presetButtons}>
                    <TouchableOpacity style={styles.presetButton} onPress={() => setSelectedWeightClasses([...WEIGHT_CLASSES])}>
                      <Text style={styles.presetButtonText}>All Classes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.presetButton} onPress={() => setSelectedWeightClasses([])}>
                      <Text style={styles.presetButtonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.tagsContainer}>
                    {WEIGHT_CLASSES.map((wc) => (
                      <TouchableOpacity
                        key={wc}
                        style={[styles.tag, selectedWeightClasses.includes(wc) && styles.tagSelected]}
                        onPress={() => toggleItem(wc, selectedWeightClasses, setSelectedWeightClasses)}
                      >
                        <Text style={[styles.tagText, selectedWeightClasses.includes(wc) && styles.tagTextSelected]}>{wc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Experience Levels</Text>
                  <View style={styles.tagsContainer}>
                    {EXPERIENCE_LEVELS.map((exp) => (
                      <TouchableOpacity
                        key={exp}
                        style={[styles.tag, selectedExperience.includes(exp) && styles.tagSelected]}
                        onPress={() => toggleItem(exp, selectedExperience, setSelectedExperience)}
                      >
                        <Text style={[styles.tagText, selectedExperience.includes(exp) && styles.tagTextSelected]}>{exp}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.inputLabel}>Max Participants</Text>
                  <TextInput style={styles.input} placeholder="16" placeholderTextColor={colors.textMuted} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" />
                </View>

                {eventType === 'sparring' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Intensity *</Text>
                    {INTENSITY_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[styles.optionCard, intensity === option.id && styles.optionCardSelected]}
                        onPress={() => setIntensity(option.id)}
                      >
                        <Text style={[styles.optionTitle, intensity === option.id && { color: colors.primary[500] }]}>{option.label}</Text>
                        <View style={[styles.radio, intensity === option.id && styles.radioSelected]}>
                          {intensity === option.id && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {eventType === 'competition' && (
                  <View style={styles.section}>
                    <Text style={styles.inputLabel}>Fighter Name *</Text>
                    <TextInput style={styles.input} placeholder="Your fighter's name" placeholderTextColor={colors.textMuted} value={fighterName} onChangeText={setFighterName} />
                    <Text style={[styles.inputLabel, { marginTop: spacing[4] }]}>Opponent *</Text>
                    <TextInput style={styles.input} placeholder="Opponent's name" placeholderTextColor={colors.textMuted} value={opponent} onChangeText={setOpponent} />
                    <Text style={[styles.inputLabel, { marginTop: spacing[4] }]}>Venue</Text>
                    <TextInput style={styles.input} placeholder="Fight venue/location" placeholderTextColor={colors.textMuted} value={venue} onChangeText={setVenue} />
                  </View>
                )}
              </Animated.View>
            )}

            {currentStep === 3 && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Text style={styles.stepTitle}>Review & Create</Text>
                <Text style={styles.stepSubtitle}>Confirm your event details</Text>

                <GlassCard style={{ marginBottom: spacing[6] }}>
                  <ReviewItem label="Event Type" value={EVENT_TYPES.find((t) => t.id === eventType)?.label} />
                  <ReviewItem label="Title" value={title} />
                  <ReviewItem label="Date & Time" value={`${eventDate} • ${startTime}${endTime ? ` - ${endTime}` : ''}`} />
                  {selectedWeightClasses.length > 0 && <ReviewTags label="Weight Classes" items={selectedWeightClasses} />}
                  {selectedExperience.length > 0 && <ReviewTags label="Experience Levels" items={selectedExperience} />}
                  <ReviewItem label="Max Participants" value={maxParticipants} isLast />
                </GlassCard>

                <View style={styles.section}>
                  <Text style={styles.inputLabel}>Description (Optional)</Text>
                  <TextInput style={[styles.input, { height: 100, paddingTop: spacing[3] }]} placeholder="Add details about this event..." placeholderTextColor={colors.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.buttonBar}>
          <TouchableOpacity style={{ flex: 0.4, paddingVertical: spacing[3], alignItems: 'center' }} onPress={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1}>
            <Text style={[styles.backBtnText, currentStep === 1 && { color: colors.textMuted }]}>Back</Text>
          </TouchableOpacity>

          {currentStep < 3 ? (
            <GradientButton title="Next" onPress={() => validateStep(currentStep) && setCurrentStep(currentStep + 1)} disabled={loading} size="lg" style={{ flex: 1 }} />
          ) : (
            <GradientButton title={loading ? 'Creating...' : 'Create Event'} onPress={handleCreate} disabled={loading} loading={loading} size="lg" icon="checkmark-circle" style={{ flex: 1 }} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const ReviewItem = ({ label, value, isLast }: { label: string; value?: string; isLast?: boolean }) => (
  <View style={[styles.reviewSection, isLast && { borderBottomWidth: 0 }]}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text style={styles.reviewValue}>{value}</Text>
  </View>
);

const ReviewTags = ({ label, items }: { label: string; items: string[] }) => (
  <View style={styles.reviewSection}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
      {items.map((item) => (
        <View key={item} style={{ backgroundColor: colors.primary[500], paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: borderRadius.full }}>
          <Text style={{ color: colors.textPrimary, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium }}>{item}</Text>
        </View>
      ))}
    </View>
  </View>
);

const { width } = Dimensions.get('window');
const containerMaxWidth = Platform.OS === 'web' ? 480 : width;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  webContainer: { flex: 1, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.textPrimary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[4] },
  stepDot: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surfaceLight, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[500] },
  stepDotCompleted: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  stepDotText: { color: colors.textSecondary, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
  stepLine: { width: 20, height: 2, backgroundColor: colors.border, marginHorizontal: spacing[2] },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[6] },
  stepTitle: { color: colors.textPrimary, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[1] },
  stepSubtitle: { color: colors.textSecondary, fontSize: typography.fontSize.sm, marginBottom: spacing[6] },
  section: { marginBottom: spacing[6] },
  sectionLabel: { color: colors.textSecondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[3] },
  inputLabel: { color: colors.textSecondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: spacing[2] },
  input: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], color: colors.textPrimary, fontSize: typography.fontSize.base, ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }) },
  row: { flexDirection: 'row', gap: spacing[3] },
  halfWidth: { flex: 1 },
  eventTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  eventTypeCard: { flex: 1, minWidth: '30%', backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl, padding: spacing[3], alignItems: 'center' },
  eventTypeCardSelected: { borderColor: colors.primary[500], backgroundColor: `${colors.primary[500]}10` },
  eventTypeLabel: { color: colors.textPrimary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, marginTop: spacing[2], textAlign: 'center' },
  eventTypeDescription: { color: colors.textMuted, fontSize: typography.fontSize.xs, marginTop: spacing[1], textAlign: 'center' },
  presetButtons: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  presetButton: { flex: 1, paddingVertical: spacing[2], paddingHorizontal: spacing[3], backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, alignItems: 'center' },
  presetButtonText: { color: colors.textSecondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tag: { backgroundColor: colors.surfaceLight, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  tagSelected: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  tagText: { color: colors.textSecondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  tagTextSelected: { color: colors.textPrimary },
  optionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing[3], marginBottom: spacing[2] },
  optionCardSelected: { borderColor: colors.primary[500], backgroundColor: `${colors.primary[500]}10` },
  optionTitle: { color: colors.textPrimary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, flex: 1 },
  radio: { width: 20, height: 20, borderRadius: borderRadius.full, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary[500] },
  radioInner: { width: 10, height: 10, borderRadius: borderRadius.full, backgroundColor: colors.primary[500] },
  reviewSection: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing[3] },
  reviewLabel: { color: colors.textSecondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, marginBottom: spacing[1] },
  reviewValue: { color: colors.textPrimary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  buttonBar: { flexDirection: 'row', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: colors.border, gap: spacing[3], backgroundColor: colors.background },
  backBtnText: { color: colors.primary[500], fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
});
