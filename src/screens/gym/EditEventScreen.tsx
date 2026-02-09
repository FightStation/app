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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button, Input } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';


type EventFighter = {
  id: string;
  name: string;
  avatar?: string;
  weightClass: string;
  experience: string;
  status: 'approved' | 'pending' | 'rejected';
};

type Event = {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  intensity: string;
  weightClasses: string[];
  experienceLevels: string[];
  status: 'active' | 'cancelled' | 'completed';
  fighters: EventFighter[];
};

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

// Mock event data for demo mode
const MOCK_EVENT: Event = {
  id: '1',
  type: 'sparring',
  title: 'Technical Sparring Session',
  description: 'Light sparring session focused on technique and movement. All levels welcome.',
  date: '2024-11-15',
  startTime: '18:00',
  endTime: '20:00',
  maxParticipants: 16,
  intensity: 'technical',
  weightClasses: ['Lightweight', 'Welterweight', 'Middleweight'],
  experienceLevels: ['Intermediate', 'Advanced'],
  status: 'active',
  fighters: [
    {
      id: '1',
      name: 'Jake Martinez',
      weightClass: 'Welterweight',
      experience: 'Advanced',
      status: 'approved',
    },
    {
      id: '2',
      name: 'Mike Johnson',
      weightClass: 'Lightweight',
      experience: 'Intermediate',
      status: 'approved',
    },
    {
      id: '3',
      name: 'Alex Chen',
      weightClass: 'Middleweight',
      experience: 'Advanced',
      status: 'pending',
    },
    {
      id: '4',
      name: 'David Kim',
      weightClass: 'Welterweight',
      experience: 'Beginner',
      status: 'pending',
    },
  ],
};

export function EditEventScreen({ navigation, route }: any) {
  const { profile } = useAuth();
  const eventId = route.params?.eventId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'fighters'>('details');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [intensity, setIntensity] = useState('');
  const [selectedWeightClasses, setSelectedWeightClasses] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [fighters, setFighters] = useState<EventFighter[]>([]);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!isSupabaseConfigured) {
      // Demo mode
      setEvent(MOCK_EVENT);
      setTitle(MOCK_EVENT.title);
      setDescription(MOCK_EVENT.description);
      setEventDate(MOCK_EVENT.date);
      setStartTime(MOCK_EVENT.startTime);
      setEndTime(MOCK_EVENT.endTime);
      setMaxParticipants(String(MOCK_EVENT.maxParticipants));
      setIntensity(MOCK_EVENT.intensity);
      setSelectedWeightClasses(MOCK_EVENT.weightClasses);
      setSelectedExperience(MOCK_EVENT.experienceLevels);
      setFighters(MOCK_EVENT.fighters);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sparring_events')
        .select(`
          *,
          event_requests (
            id,
            fighter_id,
            status,
            fighters (
              first_name,
              last_name,
              weight_class,
              experience_level
            )
          )
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Transform and set data
      const eventData = data as Event;
      setEvent(eventData);
      setTitle(eventData.title);
      setDescription(eventData.description);
      setEventDate(eventData.date);
      setStartTime(eventData.startTime);
      setEndTime(eventData.endTime);
      setMaxParticipants(String(eventData.maxParticipants));
      setIntensity(eventData.intensity);
      setSelectedWeightClasses(eventData.weightClasses || []);
      setSelectedExperience(eventData.experienceLevels || []);
      setFighters(eventData.fighters || []);
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!title || !eventDate || !startTime) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }

    setSaving(true);

    if (!isSupabaseConfigured) {
      // Demo mode
      setTimeout(() => {
        setSaving(false);
        Alert.alert('Success', 'Event updated! (Demo mode)');
        navigation.goBack();
      }, 500);
      return;
    }

    try {
      const { error } = await supabase
        .from('sparring_events')
        .update({
          title,
          description,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          max_participants: parseInt(maxParticipants),
          weight_classes: selectedWeightClasses,
          experience_levels: selectedExperience,
        })
        .eq('id', eventId);

      if (error) throw error;

      Alert.alert('Success', 'Event updated!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEvent = () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? All registered fighters will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Event',
          style: 'destructive',
          onPress: async () => {
            if (!isSupabaseConfigured) {
              Alert.alert('Success', 'Event cancelled! (Demo mode)');
              navigation.goBack();
              return;
            }

            try {
              const { error } = await supabase
                .from('sparring_events')
                .update({ status: 'cancelled' })
                .eq('id', eventId);

              if (error) throw error;
              Alert.alert('Success', 'Event has been cancelled');
              navigation.goBack();
            } catch (error) {
              console.error('Error cancelling event:', error);
              Alert.alert('Error', 'Failed to cancel event');
            }
          },
        },
      ]
    );
  };

  const handleFighterAction = (fighter: EventFighter, action: 'approve' | 'reject' | 'remove') => {
    const actionMessages = {
      approve: `Approve ${fighter.name} for this event?`,
      reject: `Reject ${fighter.name}'s request?`,
      remove: `Remove ${fighter.name} from this event?`,
    };

    Alert.alert(
      action === 'approve' ? 'Approve Fighter' : action === 'reject' ? 'Reject Request' : 'Remove Fighter',
      actionMessages[action],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Remove',
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            if (!isSupabaseConfigured) {
              // Update local state for demo
              if (action === 'remove') {
                setFighters(fighters.filter((f) => f.id !== fighter.id));
              } else {
                setFighters(
                  fighters.map((f) =>
                    f.id === fighter.id
                      ? { ...f, status: action === 'approve' ? 'approved' : 'rejected' }
                      : f
                  )
                );
              }
              Alert.alert('Success', `Fighter ${action}d! (Demo mode)`);
              return;
            }

            try {
              if (action === 'remove') {
                const { error } = await supabase
                  .from('event_requests')
                  .delete()
                  .eq('id', fighter.id);
                if (error) throw error;
              } else {
                const { error } = await supabase
                  .from('event_requests')
                  .update({ status: action === 'approve' ? 'approved' : 'rejected' })
                  .eq('id', fighter.id);
                if (error) throw error;
              }
              loadEvent();
              Alert.alert('Success', `Fighter ${action}d`);
            } catch (error) {
              console.error(`Error ${action}ing fighter:`, error);
              Alert.alert('Error', `Failed to ${action} fighter`);
            }
          },
        },
      ]
    );
  };

  const getStatusBadgeStyle = (status: EventFighter['status']) => {
    switch (status) {
      case 'approved':
        return { bg: colors.success, text: 'Approved' };
      case 'pending':
        return { bg: colors.warning, text: 'Pending' };
      case 'rejected':
        return { bg: colors.error, text: 'Rejected' };
    }
  };

  const renderDetailsTab = () => (
    <>
      <Input
        label="Event Title"
        placeholder="e.g., Technical Sparring Session"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Description"
        placeholder="Describe the session, rules, requirements..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Input
            label="Date"
            placeholder="YYYY-MM-DD"
            value={eventDate}
            onChangeText={setEventDate}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Input
            label="Start Time"
            placeholder="18:00"
            value={startTime}
            onChangeText={setStartTime}
          />
        </View>
        <View style={styles.halfField}>
          <Input
            label="End Time"
            placeholder="20:00"
            value={endTime}
            onChangeText={setEndTime}
          />
        </View>
      </View>

      <Input
        label="Max Participants"
        placeholder="16"
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        keyboardType="number-pad"
      />

      {event?.type === 'sparring' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INTENSITY</Text>
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
                  {intensity === option.id && <View style={styles.radioInner} />}
                </View>
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WEIGHT CLASSES</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EXPERIENCE LEVELS</Text>
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

      <Button
        title={saving ? 'Saving...' : 'Save Changes'}
        onPress={handleSave}
        loading={saving}
        style={styles.saveButton}
      />
    </>
  );

  const renderFightersTab = () => {
    const approvedFighters = fighters.filter((f) => f.status === 'approved');
    const pendingFighters = fighters.filter((f) => f.status === 'pending');

    return (
      <>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{approvedFighters.length}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>{pendingFighters.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{maxParticipants || '16'}</Text>
            <Text style={styles.statLabel}>Max</Text>
          </View>
        </View>

        {/* Pending Requests */}
        {pendingFighters.length > 0 && (
          <View style={styles.fighterSection}>
            <Text style={styles.sectionLabel}>PENDING REQUESTS</Text>
            {pendingFighters.map((fighter) => (
              <View key={fighter.id} style={styles.fighterCard}>
                <View style={styles.fighterAvatar}>
                  <Ionicons name="person" size={24} color={colors.primary[500]} />
                </View>
                <View style={styles.fighterInfo}>
                  <Text style={styles.fighterName}>{fighter.name}</Text>
                  <Text style={styles.fighterDetails}>
                    {fighter.weightClass} - {fighter.experience}
                  </Text>
                </View>
                <View style={styles.fighterActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleFighterAction(fighter, 'approve')}
                  >
                    <Ionicons name="checkmark" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleFighterAction(fighter, 'reject')}
                  >
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Approved Fighters */}
        {approvedFighters.length > 0 && (
          <View style={styles.fighterSection}>
            <Text style={styles.sectionLabel}>APPROVED FIGHTERS</Text>
            {approvedFighters.map((fighter) => (
              <View key={fighter.id} style={styles.fighterCard}>
                <View style={styles.fighterAvatar}>
                  <Ionicons name="person" size={24} color={colors.primary[500]} />
                </View>
                <View style={styles.fighterInfo}>
                  <Text style={styles.fighterName}>{fighter.name}</Text>
                  <Text style={styles.fighterDetails}>
                    {fighter.weightClass} - {fighter.experience}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleFighterAction(fighter, 'remove')}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {fighters.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={48} color={colors.primary[500]} />
            </View>
            <Text style={styles.emptyStateText}>No fighters yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Fighters will appear here when they request to join this event
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderContent = () => (
    <>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.tabActive]}
          onPress={() => setActiveTab('details')}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={activeTab === 'details' ? colors.primary[500] : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Event Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fighters' && styles.tabActive]}
          onPress={() => setActiveTab('fighters')}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === 'fighters' ? colors.primary[500] : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'fighters' && styles.tabTextActive]}>
            Manage Fighters ({fighters.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'details' ? renderDetailsTab() : renderFightersTab()}
      </View>

      {/* Cancel Event Button */}
      {event?.status === 'active' && (
        <TouchableOpacity style={styles.cancelEventButton} onPress={handleCancelEvent}>
          <Ionicons name="close-circle-outline" size={20} color={colors.error} />
          <Text style={styles.cancelEventText}>Cancel This Event</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.desktopHeaderTitle}>Edit Event</Text>
          <View style={{ width: 48 }} />
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
              <Text style={styles.cardTitle}>{event?.title || 'Edit Event'}</Text>
              <Text style={styles.cardSubtitle}>
                Update event details, manage times, and handle fighter registrations
              </Text>
            </View>

            {/* Content */}
            {renderContent()}
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
        <Text style={styles.headerTitle}>Edit Event</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.mobileScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
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
    marginBottom: spacing[6],
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
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    marginBottom: spacing[6],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.surfaceLight,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary[500],
  },
  tabContent: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfField: {
    flex: 1,
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
  saveButton: {
    marginTop: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  fighterSection: {
    marginBottom: spacing[6],
  },
  fighterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  fighterAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fighterInfo: {
    flex: 1,
  },
  fighterName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[0.5],
  },
  fighterDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  fighterActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: colors.success,
  },
  rejectBtn: {
    backgroundColor: colors.error,
  },
  removeBtn: {
    padding: spacing[2],
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
  cancelEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    marginTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelEventText: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },
});
