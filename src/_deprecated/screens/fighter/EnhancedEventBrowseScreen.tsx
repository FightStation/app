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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography, borderRadius, glass } from '../../lib/theme';
import { BadgeRow, GlassCard, AnimatedListItem, SectionHeader, EmptyState } from '../../components';
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

// Sport type to color mapping for accent bars
const getEventTypeColor = (eventType?: string): string | undefined => {
  switch (eventType) {
    case 'sparring': return colors.sport.boxing;
    case 'pad_work': return colors.sport.muay_thai;
    case 'technique': return colors.sport.kickboxing;
    case 'conditioning': return colors.sport.mma;
    default: return undefined;
  }
};

const VIEW_TABS = [
  { key: 'recommended', label: 'For You', icon: 'star' as keyof typeof Ionicons.glyphMap },
  { key: 'nearby', label: 'Nearby', icon: 'navigate' as keyof typeof Ionicons.glyphMap },
  { key: 'all', label: 'All', icon: 'grid' as keyof typeof Ionicons.glyphMap },
];

export function EnhancedEventBrowseScreen({ navigation }: EnhancedEventBrowseScreenProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const fighter = profile as Fighter;

  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'all' | 'nearby' | 'recommended'>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter events by search query
  const filteredEvents = searchQuery.trim()
    ? events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.gym_name && e.gym_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.gym_city && e.gym_city.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : events;

  const renderEvent = ({ item, index }: { item: EventWithDistance; index: number }) => {
    const isFull = (item.current_participants || 0) >= item.max_participants;
    const hasRequested = item.request_status === 'pending';
    const isApproved = item.request_status === 'approved';
    const accentColor = getEventTypeColor(item.event_type);

    return (
      <AnimatedListItem index={index}>
        <GlassCard
          style={styles.eventCard}
          onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
          accentColor={accentColor}
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
        </GlassCard>
      </AnimatedListItem>
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

      {/* Glass Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, gyms, cities..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* View Tabs - BadgeRow */}
      <View style={styles.tabContainer}>
        <BadgeRow
          items={VIEW_TABS}
          selected={view}
          onSelect={(key) => setView(key as 'all' | 'nearby' | 'recommended')}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={loadEvents}
          refreshing={loading}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No events found"
              description={
                view === 'recommended'
                  ? 'Complete your profile to get better recommendations'
                  : view === 'nearby'
                  ? 'No events found in your area'
                  : 'Try adjusting your filters'
              }
            />
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
    fontFamily: typography.fontFamily.display,
  },
  // Glass Search Bar
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.light.backgroundColor,
    borderColor: glass.light.borderColor,
    borderWidth: glass.light.borderWidth,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
  },
  // Tab container for BadgeRow
  tabContainer: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    marginBottom: 0,
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
    fontFamily: typography.fontFamily.semibold,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    fontFamily: typography.fontFamily.semibold,
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
    fontFamily: typography.fontFamily.regular,
  },
  intensityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  intensityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.semibold,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  participantsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.semibold,
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
    fontFamily: typography.fontFamily.display,
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
    fontFamily: typography.fontFamily.semibold,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
