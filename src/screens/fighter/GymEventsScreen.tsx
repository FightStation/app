import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type GymEventsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      gymId: string;
      gymName?: string;
    };
  };
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

// Mock gym events
const mockGymEvents = [
  {
    id: '1',
    title: 'Technical Sparring Session',
    date: 'Nov 5, 2024',
    time: '18:00 - 20:00',
    participants: 12,
    maxParticipants: 16,
    intensity: 'Technical',
    weightClasses: ['Welterweight', 'Middleweight', 'Light Heavyweight'],
    experienceLevels: ['Intermediate', 'Advanced'],
    description: 'Focus on technique, footwork, and defensive skills. Light contact.',
    spotsLeft: 4,
  },
  {
    id: '2',
    title: 'Hard Rounds Friday',
    date: 'Nov 8, 2024',
    time: '19:00 - 21:00',
    participants: 8,
    maxParticipants: 12,
    intensity: 'Hard',
    weightClasses: ['Middleweight', 'Cruiserweight', 'Heavyweight'],
    experienceLevels: ['Advanced', 'Professional'],
    description: 'Competitive sparring with experienced fighters. Hard contact, headgear required.',
    spotsLeft: 4,
  },
  {
    id: '3',
    title: 'Weekend Open Sparring',
    date: 'Nov 10, 2024',
    time: '10:00 - 12:00',
    participants: 15,
    maxParticipants: 20,
    intensity: 'All Levels',
    weightClasses: ['All'],
    experienceLevels: ['Beginner', 'Intermediate', 'Advanced'],
    description: 'Open session for all skill levels. Multiple rings available.',
    spotsLeft: 5,
  },
];

export function GymEventsScreen({ navigation, route }: GymEventsScreenProps) {
  const { gymId: _gymId, gymName = 'Elite Boxing Academy' } = route.params;
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [_requestMessage, _setRequestMessage] = useState('');

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'hard':
        return colors.primary[500];
      case 'technical':
        return colors.info;
      case 'all levels':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  const handleRequestJoin = (eventId: string) => {
    setSelectedEvent(eventId);
    setShowConfirmModal(true);
  };

  const handleConfirmRequest = () => {
    // In real app, this would call Supabase to create request
    setShowConfirmModal(false);
    navigation.goBack();
  };

  const selectedEventData = mockGymEvents.find(e => e.id === selectedEvent);

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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{gymName}</Text>
            <Text style={styles.headerSubtitle}>Available Sessions</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Events List */}
          {mockGymEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              {/* Event Header */}
              <View style={styles.eventHeader}>
                <View style={styles.eventTitleRow}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View
                    style={[
                      styles.intensityBadge,
                      { backgroundColor: `${getIntensityColor(event.intensity)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.intensityText,
                        { color: getIntensityColor(event.intensity) },
                      ]}
                    >
                      {event.intensity}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.eventMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.metaText}>{event.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.metaText}>{event.time}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description}>{event.description}</Text>

              {/* Weight Classes */}
              <View style={styles.tagsSection}>
                <Text style={styles.tagLabel}>WEIGHT CLASSES</Text>
                <View style={styles.tagsRow}>
                  {event.weightClasses.map((wc, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{wc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Experience Levels */}
              <View style={styles.tagsSection}>
                <Text style={styles.tagLabel}>EXPERIENCE</Text>
                <View style={styles.tagsRow}>
                  {event.experienceLevels.map((exp, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{exp}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Footer */}
              <View style={styles.eventFooter}>
                <View style={styles.participantsInfo}>
                  <Ionicons name="people" size={18} color={colors.textSecondary} />
                  <Text style={styles.participantsText}>
                    {event.participants}/{event.maxParticipants} fighters
                  </Text>
                  <Text style={styles.spotsText}>
                    • {event.spotsLeft} spots left
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={() => handleRequestJoin(event.id)}
                >
                  <Ionicons name="add-circle" size={18} color={colors.textPrimary} />
                  <Text style={styles.requestButtonText}>Request to Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Confirm Request</Text>
                <TouchableOpacity
                  onPress={() => setShowConfirmModal(false)}
                  style={styles.modalClose}
                >
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {selectedEventData && (
                <>
                  <View style={styles.modalEvent}>
                    <Text style={styles.modalEventTitle}>
                      {selectedEventData.title}
                    </Text>
                    <Text style={styles.modalEventMeta}>
                      {selectedEventData.date} • {selectedEventData.time}
                    </Text>
                    <Text style={styles.modalEventGym}>at {gymName}</Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Ionicons name="information-circle" size={20} color={colors.info} />
                    <Text style={styles.modalInfoText}>
                      The gym owner will review your request and notify you once approved.
                    </Text>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowConfirmModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleConfirmRequest}
                    >
                      <Text style={styles.confirmButtonText}>Send Request</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[0.5],
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
  // Event Card
  eventCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  eventHeader: {
    marginBottom: spacing[3],
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  intensityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginLeft: spacing[2],
  },
  intensityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  tagsSection: {
    marginBottom: spacing[3],
  },
  tagLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  participantsText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  spotsText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    gap: spacing[1],
  },
  requestButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  bottomPadding: {
    height: spacing[10],
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius['2xl'],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  modalClose: {
    padding: spacing[1],
  },
  modalEvent: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  modalEventTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  modalEventMeta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[0.5],
  },
  modalEventGym: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  modalInfo: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}20`,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  modalInfoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
