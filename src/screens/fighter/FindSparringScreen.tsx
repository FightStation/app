import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  GlassCard,
  GlassInput,
  AnimatedListItem,
  SectionHeader,
  EmptyState,
  BadgeRow,
} from '../../components';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';
import type { SparringEvent, Gym, EventType, WeightClass } from '../../types';
import { WEIGHT_CLASS_LABELS } from '../../types';

type FindSparringScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? (isDesktop ? 800 : 480) : width;

type EventTypeFilter = 'all' | 'sparring' | 'training' | 'fight';

const EVENT_TYPE_FILTERS: { key: EventTypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sparring', label: 'Sparring' },
  { key: 'training', label: 'Training' },
  { key: 'fight', label: 'Fight' },
];

// Mock data for demo/offline mode
const createMockEvent = (
  id: string,
  title: string,
  gymId: string,
  gymName: string,
  daysOffset: number,
  type: EventType,
  intensity: 'technical' | 'moderate' | 'hard'
): SparringEvent => ({
  id,
  gym_id: gymId,
  title,
  event_type: type,
  intensity,
  event_date: new Date(Date.now() + daysOffset * 86400000).toISOString().split('T')[0],
  start_time: '18:00',
  end_time: '20:00',
  weight_classes: ['lightweight', 'welterweight'],
  max_participants: 12,
  current_participants: 8,
  experience_levels: ['beginner', 'intermediate'],
  status: 'published',
  gym: {
    id: gymId,
    name: gymName,
    city: 'Berlin',
    country: 'Germany',
    address: 'Main Street',
    photos: [],
    facilities: [],
    sports: [type === 'sparring' ? 'boxing' : 'mma'],
    contact_email: '',
    user_id: '',
    created_at: '',
    updated_at: '',
  },
  created_at: '',
  updated_at: '',
});

const MOCK_EVENTS = [
  createMockEvent('e1', 'Monday Evening Sparring', 'g1', 'Elite Boxing Academy', 1, 'sparring', 'moderate'),
  createMockEvent('e2', 'Hard Sparring Session', 'g2', 'Iron Fist MMA Club', 2, 'sparring', 'hard'),
  createMockEvent('e3', 'Technical Training Workshop', 'g3', 'Bangkok Warriors Gym', 3, 'training', 'technical'),
  createMockEvent('e4', 'Amateur Fight Night', 'g1', 'Elite Boxing Academy', 7, 'fight', 'hard'),
];

const MOCK_GYMS: Gym[] = [
  {
    id: 'g1',
    name: 'Elite Boxing Academy',
    city: 'Berlin',
    country: 'Germany',
    address: 'Friedrichstrasse 45',
    photos: [],
    facilities: ['Ring', 'Heavy Bags', 'Showers'],
    sports: ['boxing'],
    contact_email: '',
    user_id: '',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'g2',
    name: 'Iron Fist MMA Club',
    city: 'Munich',
    country: 'Germany',
    address: 'Leopoldstrasse 12',
    photos: [],
    facilities: ['Cage', 'Mats', 'Weights'],
    sports: ['mma'],
    contact_email: '',
    user_id: '',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'g3',
    name: 'Bangkok Warriors Gym',
    city: 'Berlin',
    country: 'Germany',
    address: 'Schoenhauser Allee 78',
    photos: [],
    facilities: ['Ring', 'Thai Pads', 'Heavy Bags'],
    sports: ['muay_thai'],
    contact_email: '',
    user_id: '',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'g4',
    name: 'Grappler\'s Haven',
    city: 'Hamburg',
    country: 'Germany',
    address: 'Reeperbahn 99',
    photos: [],
    facilities: ['Mats', 'Weights'],
    sports: ['mma'],
    contact_email: '',
    user_id: '',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'g5',
    name: 'Street Fight Academy',
    city: 'Cologne',
    country: 'Germany',
    address: 'Hohenzollernring 42',
    photos: [],
    facilities: ['Ring', 'Weights', 'Showers'],
    sports: ['boxing'],
    contact_email: '',
    user_id: '',
    created_at: '',
    updated_at: '',
  },
];

export function FindSparringScreen({ navigation }: FindSparringScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const [events, setEvents] = useState<SparringEvent[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setEvents(MOCK_EVENTS);
      setGyms(MOCK_GYMS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: eventsData } = await supabase
        .from('sparring_events')
        .select('*, gym:gyms(*)')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(20);

      const { data: gymsData } = await supabase
        .from('gyms')
        .select('*')
        .limit(10);

      setEvents(eventsData || MOCK_EVENTS);
      setGyms(gymsData || MOCK_GYMS);
    } catch (err) {
      console.error('Error loading data:', err);
      setEvents(MOCK_EVENTS);
      setGyms(MOCK_GYMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredEvents = useMemo(() => {
    let result = events;
    if (eventTypeFilter !== 'all') {
      result = result.filter((e) => e.event_type === eventTypeFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.gym?.name.toLowerCase().includes(query) ||
          e.gym?.city.toLowerCase().includes(query)
      );
    }
    return result;
  }, [events, eventTypeFilter, searchQuery]);

  const filteredGyms = useMemo(() => {
    if (!searchQuery.trim()) return gyms;
    const query = searchQuery.toLowerCase().trim();
    return gyms.filter((g) => g.name.toLowerCase().includes(query) || g.city.toLowerCase().includes(query));
  }, [gyms, searchQuery]);

  const formatEventDate = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const isToday = date.toDateString() === new Date().toDateString();
    const isTomorrow = new Date(date.getTime() - 86400000).toDateString() === new Date().toDateString();
    let label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (isToday) label = 'Today';
    if (isTomorrow) label = 'Tomorrow';
    return `${label} • ${timeStr}`;
  };

  const getIntensityColor = (intensity?: string) => {
    const map: Record<string, string> = { hard: colors.error, moderate: colors.primary[500], technical: colors.primary[400] };
    return map[intensity || ''] || colors.textSecondary;
  };

  const renderEventCard = ({ item, index }: { item: SparringEvent; index: number }) => (
    <AnimatedListItem index={index}>
      <GlassCard style={styles.eventCard} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleContainer}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.eventGym} numberOfLines={1}>
              {item.gym?.name}
            </Text>
          </View>
          {item.intensity && (
            <View style={[styles.intensityBadge, { backgroundColor: `${getIntensityColor(item.intensity)}20` }]}>
              <Text style={[styles.intensityBadgeText, { color: getIntensityColor(item.intensity) }]}>
                {item.intensity.charAt(0).toUpperCase() + item.intensity.slice(1)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{formatEventDate(item.event_date, item.start_time)}</Text>
          </View>
          {item.weight_classes && item.weight_classes.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="barbell-outline" size={14} color={colors.textMuted} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.weight_classes.map((wc) => WEIGHT_CLASS_LABELS[wc] || wc).join(', ')}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {item.current_participants}/{item.max_participants} participants
            </Text>
          </View>
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  const renderGymCard = ({ item, index }: { item: Gym; index: number }) => (
    <AnimatedListItem index={index}>
      <GlassCard style={styles.gymCard} onPress={() => navigation.navigate('GymProfileView', { gymId: item.id })}>
        <View style={styles.gymContent}>
          <View style={styles.gymInfo}>
            <Text style={styles.gymName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.gymLocationRow}>
              <Ionicons name="location-outline" size={13} color={colors.primary[500]} />
              <Text style={styles.gymLocation}>
                {item.city}, {item.country}
              </Text>
            </View>
            {item.facilities && item.facilities.length > 0 && (
              <Text style={styles.gymFacilities} numberOfLines={1}>
                {item.facilities.join(' • ')}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  const renderListHeader = () => (
    <>
      {!isDesktop && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
      )}
      <View style={styles.searchContainer}>
        <GlassInput
          placeholder="Search events, gyms, cities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={18} color={colors.textMuted} />}
          rightIcon={searchQuery.length > 0 ? <Ionicons name="close-circle" size={18} color={colors.textMuted} /> : undefined}
          onRightIconPress={searchQuery.length > 0 ? () => setSearchQuery('') : undefined}
        />
      </View>
      <View style={styles.filtersContainer}>
        <BadgeRow items={EVENT_TYPE_FILTERS} selected={eventTypeFilter} onSelect={(key) => setEventTypeFilter(key as EventTypeFilter)} />
      </View>
      <View style={styles.sectionHeaderContainer}>
        <SectionHeader title="Upcoming Events" />
        {filteredEvents.length > 5 && (
          <TouchableOpacity onPress={() => navigation.navigate('MyEvents')}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderListFooter = () => (
    <>
      <View style={styles.sectionHeaderContainer}>
        <SectionHeader title="Gyms Near You" />
        {filteredGyms.length > 3 && (
          <TouchableOpacity onPress={() => navigation.navigate('GymDirectory')}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      {filteredGyms.length === 0 ? (
        <View style={styles.emptySection}>
          <EmptyState icon="business-outline" title="No Gyms Found" description="Try adjusting your search filters" />
        </View>
      ) : (
        filteredGyms.map((gym, index) => renderGymCard({ item: gym, index }))
      )}
      <View style={styles.bottomPadding} />
    </>
  );

  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? [] : ['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Discovering events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={isDesktop ? [] : ['top']}>
      <View style={styles.webContainer}>
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
          ListEmptyComponent={
            filteredEvents.length === 0 ? (
              <View style={styles.emptySection}>
                <EmptyState icon="flash-outline" title="No Events Found" description="Try adjusting your search or filters" />
              </View>
            ) : undefined
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[500]} />}
          scrollEventThrottle={16}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  webContainer: { flex: 1, maxWidth: containerMaxWidth, width: '100%', alignSelf: 'center', backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  loadingText: { color: colors.textMuted, fontSize: typography.fontSize.base },
  header: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  headerTitle: { color: colors.textPrimary, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  searchContainer: { paddingHorizontal: spacing[4], marginBottom: spacing[3] },
  filtersContainer: { paddingHorizontal: spacing[4], marginBottom: spacing[4] },
  sectionHeaderContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], marginBottom: spacing[3], marginTop: spacing[4] },
  seeAllLink: { color: colors.primary[500], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  eventCard: { marginHorizontal: spacing[4], marginBottom: spacing[3] },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing[3], gap: spacing[2] },
  eventTitleContainer: { flex: 1 },
  eventTitle: { color: colors.textPrimary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[1] },
  eventGym: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  intensityBadge: { paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: borderRadius.sm, flexShrink: 0 },
  intensityBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  eventDetails: { gap: spacing[2] },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  detailText: { color: colors.textMuted, fontSize: typography.fontSize.sm, flex: 1 },
  gymCard: { marginHorizontal: spacing[4], marginBottom: spacing[3] },
  gymContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gymInfo: { flex: 1 },
  gymName: { color: colors.textPrimary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[1] },
  gymLocationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginBottom: spacing[1] },
  gymLocation: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  gymFacilities: { color: colors.textMuted, fontSize: typography.fontSize.xs },
  emptySection: { paddingHorizontal: spacing[4], paddingVertical: spacing[6] },
  listContent: { paddingBottom: spacing[20] },
  bottomPadding: { height: spacing[4] },
});
