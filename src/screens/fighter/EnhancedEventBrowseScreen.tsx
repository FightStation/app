import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  searchEvents,
  getNearbyEvents,
  getRecommendedEvents,
  requestToJoinEvent,
  EventWithDistance,
  EventFilters,
} from '../../services/events';
import {
  Fighter,
  WEIGHT_CLASS_LABELS,
  EXPERIENCE_LABELS,
  EVENT_TYPE_ICONS,
  EVENT_TYPE_LABELS,
  INTENSITY_OPTIONS,
} from '../../types';

type EnhancedEventBrowseScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function EnhancedEventBrowseScreen({ navigation }: EnhancedEventBrowseScreenProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const fighter = profile as Fighter;

  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'all' | 'nearby' | 'recommended'>('recommended');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState<EventFilters>({});
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedIntensities, setSelectedIntensities] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(50);

  useEffect(() => {
    loadEvents();
  }, [view]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let result: EventWithDistance[];

      if (view === 'nearby') {
        result = await getNearbyEvents(maxDistance, fighter?.id);
      } else if (view === 'recommended') {
        result = await getRecommendedEvents(fighter);
      } else {
        result = await searchEvents(filters, undefined, fighter?.id);
      }

      setEvents(result);
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    const newFilters: EventFilters = {
      eventType: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
      intensity: selectedIntensities.length > 0 ? selectedIntensities : undefined,
      maxDistance: view === 'nearby' ? maxDistance : undefined,
    };

    setFilters(newFilters);
    setShowFilters(false);
    setLoading(true);

    try {
      const result = await searchEvents(newFilters, undefined, fighter?.id);
      setEvents(result);
    } catch (error) {
      console.error('Error applying filters:', error);
      showToast('Failed to apply filters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedEventTypes([]);
    setSelectedIntensities([]);
    setMaxDistance(50);
    setFilters({});
    loadEvents();
  };

  const handleRequestToJoin = async (event: EventWithDistance) => {
    if (!fighter?.id) {
      showToast('Only fighters can request to join events', 'error');
      return;
    }

    try {
      await requestToJoinEvent(event.id, fighter.id);
      showToast('Request sent to gym!', 'success');
      loadEvents();
    } catch (error: any) {
      showToast(error.message || 'Failed to send request', 'error');
    }
  };

  const toggleEventType = (type: string) => {
    if (selectedEventTypes.includes(type)) {
      setSelectedEventTypes(selectedEventTypes.filter(t => t !== type));
    } else {
      setSelectedEventTypes([...selectedEventTypes, type]);
    }
  };

  const toggleIntensity = (intensity: string) => {
    if (selectedIntensities.includes(intensity)) {
      setSelectedIntensities(selectedIntensities.filter(i => i !== intensity));
    } else {
      setSelectedIntensities([...selectedIntensities, intensity]);
    }
  };

  const renderEvent = ({ item }: { item: EventWithDistance }) => {
    const isFull = (item.current_participants || 0) >= item.max_participants;
    const hasRequested = item.request_status === 'pending';
    const isApproved = item.request_status === 'approved';

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventType}>
            <Ionicons
              name={(EVENT_TYPE_ICONS[item.event_type || 'sparring']) as any}
              size={16}
              color={colors.primary[500]}
            />
            <Text style={styles.eventTypeText}>
              {EVENT_TYPE_LABELS[item.event_type || 'sparring']}
            </Text>
          </View>

          {item.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Ionicons name="location" size={12} color={colors.textMuted} />
              <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
            </View>
          )}

          {isFull && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>FULL</Text>
            </View>
          )}
          {hasRequested && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>REQUESTED</Text>
            </View>
          )}
          {isApproved && (
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedBadgeText}>APPROVED</Text>
            </View>
          )}
        </View>

        <Text style={styles.eventTitle}>{item.title}</Text>

        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="business" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.gym_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.gym_city}</Text>
          </View>
        </View>

        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {new Date(item.event_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.start_time}</Text>
          </View>
        </View>

        {item.intensity && (
          <View style={styles.intensityBadge}>
            <Text style={styles.intensityText}>{item.intensity.toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <Text style={styles.participantsText}>
            {item.current_participants || 0}/{item.max_participants} participants
          </Text>

          {!hasRequested && !isApproved && !isFull && (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => handleRequestToJoin(item)}
            >
              <Text style={styles.requestButtonText}>Request to Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Events</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="options" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* View Tabs */}
      <View style={styles.viewTabs}>
        <TouchableOpacity
          style={[styles.viewTab, view === 'recommended' && styles.viewTabActive]}
          onPress={() => setView('recommended')}
        >
          <Ionicons
            name="star"
            size={18}
            color={view === 'recommended' ? colors.primary[500] : colors.textMuted}
          />
          <Text
            style={[styles.viewTabText, view === 'recommended' && styles.viewTabTextActive]}
          >
            For You
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewTab, view === 'nearby' && styles.viewTabActive]}
          onPress={() => setView('nearby')}
        >
          <Ionicons
            name="navigate"
            size={18}
            color={view === 'nearby' ? colors.primary[500] : colors.textMuted}
          />
          <Text style={[styles.viewTabText, view === 'nearby' && styles.viewTabTextActive]}>
            Nearby
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewTab, view === 'all' && styles.viewTabActive]}
          onPress={() => setView('all')}
        >
          <Ionicons
            name="grid"
            size={18}
            color={view === 'all' ? colors.primary[500] : colors.textMuted}
          />
          <Text style={[styles.viewTabText, view === 'all' && styles.viewTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={loadEvents}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>No events found</Text>
              <Text style={styles.emptyStateSubtext}>
                {view === 'recommended' && 'Complete your profile to get better recommendations'}
                {view === 'nearby' && 'No events found in your area'}
                {view === 'all' && 'Try adjusting your filters'}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Event Type */}
              <Text style={styles.filterSectionTitle}>Event Type</Text>
              <View style={styles.filterOptions}>
                {(Object.keys(EVENT_TYPE_LABELS) as Array<keyof typeof EVENT_TYPE_LABELS>).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      selectedEventTypes.includes(type) && styles.filterOptionActive,
                    ]}
                    onPress={() => toggleEventType(type)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedEventTypes.includes(type) && styles.filterOptionTextActive,
                      ]}
                    >
                      {EVENT_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Intensity */}
              <Text style={styles.filterSectionTitle}>Intensity</Text>
              <View style={styles.filterOptions}>
                {INTENSITY_OPTIONS.map((intensity) => (
                  <TouchableOpacity
                    key={intensity}
                    style={[
                      styles.filterOption,
                      selectedIntensities.includes(intensity) && styles.filterOptionActive,
                    ]}
                    onPress={() => toggleIntensity(intensity)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedIntensities.includes(intensity) && styles.filterOptionTextActive,
                      ]}
                    >
                      {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Distance */}
              {view === 'nearby' && (
                <>
                  <Text style={styles.filterSectionTitle}>
                    Max Distance: {maxDistance} km
                  </Text>
                  <View style={styles.distanceOptions}>
                    {[10, 25, 50, 100].map((distance) => (
                      <TouchableOpacity
                        key={distance}
                        style={[
                          styles.distanceOption,
                          maxDistance === distance && styles.distanceOptionActive,
                        ]}
                        onPress={() => setMaxDistance(distance)}
                      >
                        <Text
                          style={[
                            styles.distanceOptionText,
                            maxDistance === distance && styles.distanceOptionTextActive,
                          ]}
                        >
                          {distance} km
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  viewTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  viewTabActive: {
    borderBottomColor: colors.primary[500],
  },
  viewTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
  },
  viewTabTextActive: {
    color: colors.primary[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  eventType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: `${colors.primary[500]}20`,
    borderRadius: borderRadius.md,
  },
  eventTypeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    textTransform: 'uppercase',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
  },
  fullBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: `${colors.error}20`,
    borderRadius: borderRadius.md,
  },
  fullBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
  },
  pendingBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: `${colors.warning}20`,
    borderRadius: borderRadius.md,
  },
  pendingBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning,
  },
  approvedBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: `${colors.success}20`,
    borderRadius: borderRadius.md,
  },
  approvedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  eventMeta: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[2],
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
  intensityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  intensityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  participantsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  requestButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
  },
  requestButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyStateText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginTop: spacing[2],
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalScroll: {
    padding: spacing[4],
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: colors.textPrimary,
  },
  distanceOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  distanceOption: {
    flex: 1,
    paddingVertical: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  distanceOptionActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  distanceOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  distanceOptionTextActive: {
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
