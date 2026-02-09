import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebLayout } from '../../components/WebLayout';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isWeb, getGridColumns } from '../../lib/responsive';
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
  EVENT_TYPE_ICONS,
  EVENT_TYPE_LABELS,
  INTENSITY_OPTIONS,
} from '../../types';

type WebEventDiscoveryScreenProps = {
  navigation: any;
};

export function WebEventDiscoveryScreen({ navigation }: WebEventDiscoveryScreenProps) {
  const { profile } = useAuth();
  const fighter = profile as Fighter;

  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'recommended' | 'nearby' | 'all' | 'map'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
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
        const filters: EventFilters = {
          eventType: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
          intensity: selectedIntensities.length > 0 ? selectedIntensities : undefined,
        };
        result = await searchEvents(filters, undefined, fighter?.id);
      }

      setEvents(result);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToJoin = async (event: EventWithDistance) => {
    if (!fighter?.id) return;

    try {
      await requestToJoinEvent(event.id, fighter.id);
      loadEvents();
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  const toggleEventType = (type: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleIntensity = (intensity: string) => {
    setSelectedIntensities(prev =>
      prev.includes(intensity) ? prev.filter(i => i !== intensity) : [...prev, intensity]
    );
  };

  const applyFilters = () => {
    loadEvents();
  };

  const clearFilters = () => {
    setSelectedEventTypes([]);
    setSelectedIntensities([]);
    setSearchQuery('');
    setMaxDistance(50);
    loadEvents();
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.gym_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gridColumns = getGridColumns();

  const renderEventCard = (event: EventWithDistance) => {
    const isFull = (event.current_participants || 0) >= event.max_participants;
    const hasRequested = event.request_status === 'pending';
    const isApproved = event.request_status === 'approved';

    return (
      <View key={event.id} style={[styles.eventCard, { width: `${100 / gridColumns - 2}%` }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        >
          {/* Event Header */}
          <View style={styles.eventHeader}>
            <View style={styles.eventType}>
              <Ionicons
                name={(EVENT_TYPE_ICONS[event.event_type || 'sparring']) as any}
                size={16}
                color={colors.primary[500]}
              />
              <Text style={styles.eventTypeText}>
                {EVENT_TYPE_LABELS[event.event_type || 'sparring']}
              </Text>
            </View>

            {event.distance !== undefined && (
              <View style={styles.distanceBadge}>
                <Ionicons name="location" size={12} color={colors.textMuted} />
                <Text style={styles.distanceText}>{event.distance.toFixed(1)} km</Text>
              </View>
            )}
          </View>

          {/* Event Title */}
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>

          {/* Gym Info */}
          <View style={styles.gymInfo}>
            <Ionicons name="business" size={14} color={colors.textMuted} />
            <Text style={styles.gymName} numberOfLines={1}>{event.gym_name}</Text>
          </View>

          {/* Date & Time */}
          <View style={styles.dateTime}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.dateTimeText}>
                {new Date(event.event_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.dateTimeText}>{event.start_time}</Text>
            </View>
          </View>

          {/* Intensity */}
          {event.intensity && (
            <View style={styles.intensityBadge}>
              <Text style={styles.intensityText}>{event.intensity.toUpperCase()}</Text>
            </View>
          )}

          {/* Participants */}
          <View style={styles.participants}>
            <Ionicons name="people" size={16} color={colors.textMuted} />
            <Text style={styles.participantsText}>
              {event.current_participants || 0}/{event.max_participants}
            </Text>
          </View>

          {/* Status Badges */}
          {isFull && (
            <View style={[styles.statusBadge, styles.fullBadge]}>
              <Text style={styles.fullBadgeText}>FULL</Text>
            </View>
          )}
          {hasRequested && (
            <View style={[styles.statusBadge, styles.pendingBadge]}>
              <Text style={styles.pendingBadgeText}>REQUESTED</Text>
            </View>
          )}
          {isApproved && (
            <View style={[styles.statusBadge, styles.approvedBadge]}>
              <Text style={styles.approvedBadgeText}>APPROVED</Text>
            </View>
          )}

          {/* Action Button */}
          {!hasRequested && !isApproved && !isFull && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRequestToJoin(event);
              }}
            >
              <Text style={styles.joinButtonText}>Request to Join</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <WebLayout currentRoute="EventBrowse" navigation={navigation} maxWidth="2xl">
      <View style={styles.container}>
        {/* Header with Search */}
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events or gyms..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

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
                Recommended
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
                All Events
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewTab, view === 'map' && styles.viewTabActive]}
              onPress={() => setView('map')}
            >
              <Ionicons
                name="map"
                size={18}
                color={view === 'map' ? colors.primary[500] : colors.textMuted}
              />
              <Text style={[styles.viewTabText, view === 'map' && styles.viewTabTextActive]}>
                Map View
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content with Sidebar Filters */}
        <View style={styles.mainContent}>
          {/* Filters Sidebar */}
          <View style={styles.filtersSidebar}>
            <Text style={styles.filtersTitle}>Filters</Text>

            {/* Event Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Event Type</Text>
              {(Object.keys(EVENT_TYPE_LABELS) as Array<keyof typeof EVENT_TYPE_LABELS>).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.filterCheckbox}
                  onPress={() => toggleEventType(type)}
                >
                  <Ionicons
                    name={selectedEventTypes.includes(type) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selectedEventTypes.includes(type) ? colors.primary[500] : colors.textMuted}
                  />
                  <Text style={styles.filterCheckboxLabel}>{EVENT_TYPE_LABELS[type]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Intensity Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Intensity</Text>
              {INTENSITY_OPTIONS.map((intensity) => (
                <TouchableOpacity
                  key={intensity}
                  style={styles.filterCheckbox}
                  onPress={() => toggleIntensity(intensity)}
                >
                  <Ionicons
                    name={selectedIntensities.includes(intensity) ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selectedIntensities.includes(intensity) ? colors.primary[500] : colors.textMuted}
                  />
                  <Text style={styles.filterCheckboxLabel}>
                    {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Distance Filter */}
            {view === 'nearby' && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Max Distance</Text>
                <View style={styles.distanceButtons}>
                  {[10, 25, 50, 100].map((distance) => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.distanceButton,
                        maxDistance === distance && styles.distanceButtonActive,
                      ]}
                      onPress={() => setMaxDistance(distance)}
                    >
                      <Text
                        style={[
                          styles.distanceButtonText,
                          maxDistance === distance && styles.distanceButtonTextActive,
                        ]}
                      >
                        {distance}km
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Filter Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Events Grid */}
          <View style={styles.eventsContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Finding events...</Text>
              </View>
            ) : view === 'map' ? (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map" size={64} color={colors.textMuted} />
                <Text style={styles.mapPlaceholderText}>Map View Coming Soon</Text>
                <Text style={styles.mapPlaceholderSubtext}>
                  We're working on an interactive map to help you find events near you
                </Text>
              </View>
            ) : (
              <View style={styles.eventsGrid}>
                {filteredEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyStateText}>No events found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Try adjusting your filters or check back later
                    </Text>
                  </View>
                ) : (
                  filteredEvents.map(renderEventCard)
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: spacing[6],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    outlineStyle: 'none' as any,
  },
  viewTabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewTabActive: {
    backgroundColor: `${colors.primary[500]}20`,
    borderColor: colors.primary[500],
  },
  viewTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
  },
  viewTabTextActive: {
    color: colors.primary[500],
  },
  mainContent: {
    flexDirection: 'row',
    gap: spacing[6],
  },
  filtersSidebar: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  filtersTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[6],
  },
  filterSection: {
    marginBottom: spacing[6],
  },
  filterLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[3],
  },
  filterCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  filterCheckboxLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  distanceButton: {
    flex: 1,
    minWidth: 60,
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  distanceButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  distanceButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  distanceButtonTextActive: {
    color: colors.textPrimary,
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  eventsContent: {
    flex: 1,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
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
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  gymInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  gymName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  dateTime: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  dateTimeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  intensityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  intensityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  participantsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  fullBadge: {
    backgroundColor: `${colors.error}20`,
  },
  fullBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
  },
  pendingBadge: {
    backgroundColor: `${colors.warning}20`,
  },
  pendingBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning,
  },
  approvedBadge: {
    backgroundColor: `${colors.success}20`,
  },
  approvedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  joinButton: {
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginTop: spacing[4],
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPlaceholderText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  mapPlaceholderSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginTop: spacing[2],
    textAlign: 'center',
    maxWidth: 400,
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
  },
});
