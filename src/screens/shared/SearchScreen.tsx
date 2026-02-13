import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  GlassCard,
  GlassInput,
  BadgeRow,
  AnimatedListItem,
  EmptyState,
} from '../../components';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type CategoryKey = 'fighters' | 'gyms' | 'events';

type FighterResult = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  weight_class?: string;
  experience_level?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  record?: string;
};

type GymResult = {
  id: string;
  name: string;
  city: string;
  country: string;
  member_count?: number;
  sports?: string[];
  rating?: number;
};

type EventResult = {
  id: string;
  title: string;
  event_date: string;
  gym_name: string;
  sport_type: string;
  max_participants: number;
  current_participants: number;
};

// ---------------------------------------------------------------------------
// Category tabs
// ---------------------------------------------------------------------------

const CATEGORIES: { key: CategoryKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'fighters', label: 'Fighters', icon: 'people' },
  { key: 'gyms', label: 'Gyms', icon: 'business' },
  { key: 'events', label: 'Events', icon: 'calendar' },
];

const categoryBadges = CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
  icon: c.icon,
}));

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_FIGHTERS: FighterResult[] = [
  {
    id: 'f1',
    user_id: 'u1',
    first_name: 'Marcus',
    last_name: 'Petrov',
    nickname: 'The Hammer',
    weight_class: 'Middleweight',
    experience_level: 'Advanced',
    city: 'Berlin',
    country: 'Germany',
    record: '18-3-0',
  },
  {
    id: 'f2',
    user_id: 'u2',
    first_name: 'Sarah',
    last_name: 'Martinez',
    nickname: 'Lightning',
    weight_class: 'Featherweight',
    experience_level: 'Professional',
    city: 'Barcelona',
    country: 'Spain',
    record: '23-1-0',
  },
  {
    id: 'f3',
    user_id: 'u3',
    first_name: 'Alex',
    last_name: 'Chen',
    weight_class: 'Welterweight',
    experience_level: 'Intermediate',
    city: 'Singapore',
    country: 'Singapore',
    record: '8-2-1',
  },
  {
    id: 'f4',
    user_id: 'u4',
    first_name: 'Emma',
    last_name: 'Johnson',
    nickname: 'The Tiger',
    weight_class: 'Lightweight',
    experience_level: 'Advanced',
    city: 'London',
    country: 'UK',
    record: '15-4-0',
  },
];

const MOCK_GYMS: GymResult[] = [
  {
    id: 'g1',
    name: 'Elite Boxing Academy',
    city: 'Berlin',
    country: 'Germany',
    member_count: 128,
    sports: ['Boxing', 'Kickboxing'],
    rating: 4.8,
  },
  {
    id: 'g2',
    name: 'Iron Fist MMA',
    city: 'Barcelona',
    country: 'Spain',
    member_count: 95,
    sports: ['MMA', 'Boxing', 'Muay Thai'],
    rating: 4.6,
  },
  {
    id: 'g3',
    name: 'Tiger Muay Thai',
    city: 'Phuket',
    country: 'Thailand',
    member_count: 240,
    sports: ['Muay Thai', 'MMA'],
    rating: 4.9,
  },
  {
    id: 'g4',
    name: 'Champion Fight Club',
    city: 'London',
    country: 'UK',
    member_count: 76,
    sports: ['Boxing', 'MMA', 'Kickboxing'],
    rating: 4.5,
  },
];

const MOCK_EVENTS: EventResult[] = [
  {
    id: 'e1',
    title: 'Friday Night Sparring',
    event_date: '2026-02-20T19:00:00Z',
    gym_name: 'Elite Boxing Academy',
    sport_type: 'Boxing',
    max_participants: 20,
    current_participants: 14,
  },
  {
    id: 'e2',
    title: 'Open Mat MMA',
    event_date: '2026-02-22T10:00:00Z',
    gym_name: 'Iron Fist MMA',
    sport_type: 'MMA',
    max_participants: 30,
    current_participants: 30,
  },
  {
    id: 'e3',
    title: 'Muay Thai Interclub',
    event_date: '2026-03-01T14:00:00Z',
    gym_name: 'Tiger Muay Thai',
    sport_type: 'Muay Thai',
    max_participants: 16,
    current_participants: 9,
  },
  {
    id: 'e4',
    title: 'Beginner Sparring Day',
    event_date: '2026-03-05T18:00:00Z',
    gym_name: 'Champion Fight Club',
    sport_type: 'Boxing',
    max_participants: 12,
    current_participants: 5,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchScreen({ navigation }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('fighters');
  const [loading, setLoading] = useState(false);

  // Data stores
  const [fighters, setFighters] = useState<FighterResult[]>([]);
  const [gyms, setGyms] = useState<GymResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);

  // Filtered results
  const [filteredFighters, setFilteredFighters] = useState<FighterResult[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<GymResult[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventResult[]>([]);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadFighters(), loadGyms(), loadEvents()]);
    setLoading(false);
  };

  const loadFighters = async () => {
    if (!isSupabaseConfigured) {
      setFighters(MOCK_FIGHTERS);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('fighters')
        .select('id, user_id, first_name, last_name, nickname, weight_class, experience_level, city, country, avatar_url, record')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setFighters(data || []);
    } catch {
      setFighters(MOCK_FIGHTERS);
    }
  };

  const loadGyms = async () => {
    if (!isSupabaseConfigured) {
      setGyms(MOCK_GYMS);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, name, city, country, member_count, sports, rating')
        .order('name', { ascending: true })
        .limit(50);
      if (error) throw error;
      setGyms(data || []);
    } catch {
      setGyms(MOCK_GYMS);
    }
  };

  const loadEvents = async () => {
    if (!isSupabaseConfigured) {
      setEvents(MOCK_EVENTS);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('sparring_events')
        .select('id, title, event_date, sport_type, max_participants, current_participants, gym:gyms(name)')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(50);
      if (error) throw error;
      const mapped = (data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        event_date: e.event_date,
        gym_name: e.gym?.name ?? 'Unknown Gym',
        sport_type: e.sport_type ?? 'Boxing',
        max_participants: e.max_participants ?? 0,
        current_participants: e.current_participants ?? 0,
      }));
      setEvents(mapped);
    } catch {
      setEvents(MOCK_EVENTS);
    }
  };

  // -----------------------------------------------------------------------
  // Filtering
  // -----------------------------------------------------------------------

  useEffect(() => {
    filterFighters();
  }, [searchQuery, fighters]);

  useEffect(() => {
    filterGyms();
  }, [searchQuery, gyms]);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, events]);

  const filterFighters = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredFighters(fighters);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredFighters(
      fighters.filter(
        (f) =>
          f.first_name.toLowerCase().includes(q) ||
          f.last_name.toLowerCase().includes(q) ||
          f.nickname?.toLowerCase().includes(q) ||
          f.city?.toLowerCase().includes(q) ||
          f.country?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, fighters]);

  const filterGyms = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredGyms(gyms);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredGyms(
      gyms.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.city.toLowerCase().includes(q) ||
          g.country.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, gyms]);

  const filterEvents = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredEvents(
      events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.sport_type.toLowerCase().includes(q) ||
          e.gym_name.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, events]);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const formatEventDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getResultCount = (): number => {
    switch (activeCategory) {
      case 'fighters':
        return filteredFighters.length;
      case 'gyms':
        return filteredGyms.length;
      case 'events':
        return filteredEvents.length;
    }
  };

  const getCategoryLabel = (): string => {
    switch (activeCategory) {
      case 'fighters':
        return 'fighter';
      case 'gyms':
        return 'gym';
      case 'events':
        return 'event';
    }
  };

  // -----------------------------------------------------------------------
  // Navigation handlers
  // -----------------------------------------------------------------------

  const handleFighterPress = (fighterId: string) => {
    navigation.navigate('FighterProfileView', { fighterId });
  };

  const handleGymPress = (gymId: string) => {
    navigation.navigate('GymProfileView', { gymId });
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  };

  // -----------------------------------------------------------------------
  // Render cards
  // -----------------------------------------------------------------------

  const renderFighterCard = (fighter: FighterResult, index: number) => (
    <AnimatedListItem key={fighter.id} index={index}>
      <GlassCard style={styles.resultCard} onPress={() => handleFighterPress(fighter.id)}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {fighter.avatar_url ? (
              <Image source={{ uri: fighter.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={colors.textMuted} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {fighter.first_name} {fighter.last_name}
            </Text>
            {fighter.nickname ? (
              <Text style={styles.cardNickname} numberOfLines={1}>
                &ldquo;{fighter.nickname}&rdquo;
              </Text>
            ) : null}

            <View style={styles.tagRow}>
              {fighter.weight_class ? (
                <View style={styles.tag}>
                  <Ionicons name="barbell-outline" size={12} color={colors.primary[400]} />
                  <Text style={styles.tagText}>{fighter.weight_class}</Text>
                </View>
              ) : null}
              {fighter.experience_level ? (
                <View style={styles.tag}>
                  <Ionicons name="medal-outline" size={12} color={colors.primary[400]} />
                  <Text style={styles.tagText}>{fighter.experience_level}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              {fighter.record ? (
                <View style={styles.metaItem}>
                  <Ionicons name="trophy-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.metaText}>{fighter.record}</Text>
                </View>
              ) : null}
              {fighter.city ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {fighter.city}{fighter.country ? `, ${fighter.country}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  const renderGymCard = (gym: GymResult, index: number) => (
    <AnimatedListItem key={gym.id} index={index}>
      <GlassCard style={styles.resultCard} onPress={() => handleGymPress(gym.id)}>
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={styles.gymAvatarCircle}>
            <Ionicons name="business" size={24} color={colors.primary[500]} />
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {gym.name}
              </Text>
              {gym.rating ? (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color={colors.warning} />
                  <Text style={styles.ratingText}>{gym.rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {gym.city}, {gym.country}
              </Text>
            </View>

            {gym.member_count ? (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{gym.member_count} members</Text>
              </View>
            ) : null}

            {gym.sports && gym.sports.length > 0 ? (
              <View style={styles.tagRow}>
                {gym.sports.slice(0, 3).map((sport) => (
                  <View key={sport} style={styles.sportTag}>
                    <Text style={styles.sportTagText}>{sport}</Text>
                  </View>
                ))}
                {gym.sports.length > 3 ? (
                  <Text style={styles.moreText}>+{gym.sports.length - 3}</Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  const renderEventCard = (event: EventResult, index: number) => {
    const spotsLeft = event.max_participants - event.current_participants;
    const isFull = spotsLeft <= 0;
    const eventDate = new Date(event.event_date);

    return (
      <AnimatedListItem key={event.id} index={index}>
        <GlassCard style={styles.resultCard} onPress={() => handleEventPress(event.id)}>
          <View style={styles.cardRow}>
            {/* Date box */}
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{eventDate.getDate()}</Text>
              <Text style={styles.dateMonth}>
                {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </Text>
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {event.title}
              </Text>

              <View style={styles.metaItem}>
                <Ionicons name="business-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{event.gym_name}</Text>
              </View>

              <View style={styles.tagRow}>
                <View style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{event.sport_type}</Text>
                </View>
                <View style={[styles.capacityBadge, isFull && styles.capacityFull]}>
                  <Ionicons
                    name="people-outline"
                    size={11}
                    color={isFull ? colors.error : colors.success}
                  />
                  <Text
                    style={[styles.capacityText, isFull && styles.capacityTextFull]}
                  >
                    {isFull
                      ? 'Full'
                      : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventDateText}>{formatEventDate(event.event_date)}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </GlassCard>
      </AnimatedListItem>
    );
  };

  // -----------------------------------------------------------------------
  // Suggested / trending content (shown when search query is empty)
  // -----------------------------------------------------------------------

  const renderSuggestedContent = () => {
    switch (activeCategory) {
      case 'fighters':
        return (
          <View style={styles.suggestedSection}>
            <Text style={styles.suggestedTitle}>Trending Fighters</Text>
            <Text style={styles.suggestedSubtitle}>
              Popular fighters in the community
            </Text>
            {filteredFighters.map((f, i) => renderFighterCard(f, i))}
          </View>
        );
      case 'gyms':
        return (
          <View style={styles.suggestedSection}>
            <Text style={styles.suggestedTitle}>Top Gyms</Text>
            <Text style={styles.suggestedSubtitle}>
              Highest rated gyms near you
            </Text>
            {filteredGyms.map((g, i) => renderGymCard(g, i))}
          </View>
        );
      case 'events':
        return (
          <View style={styles.suggestedSection}>
            <Text style={styles.suggestedTitle}>Upcoming Events</Text>
            <Text style={styles.suggestedSubtitle}>
              Events happening soon
            </Text>
            {filteredEvents.map((e, i) => renderEventCard(e, i))}
          </View>
        );
    }
  };

  // -----------------------------------------------------------------------
  // Render search results
  // -----------------------------------------------------------------------

  const renderResults = () => {
    const count = getResultCount();

    if (count === 0) {
      return (
        <EmptyState
          icon={
            activeCategory === 'fighters'
              ? 'people-outline'
              : activeCategory === 'gyms'
              ? 'business-outline'
              : 'calendar-outline'
          }
          title={`No ${getCategoryLabel()}s found`}
          description={
            searchQuery.trim()
              ? 'Try a different search term'
              : 'Check back later for new content'
          }
        />
      );
    }

    switch (activeCategory) {
      case 'fighters':
        return filteredFighters.map((f, i) => renderFighterCard(f, i));
      case 'gyms':
        return filteredGyms.map((g, i) => renderGymCard(g, i));
      case 'events':
        return filteredEvents.map((e, i) => renderEventCard(e, i));
    }
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  const resultCount = getResultCount();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <GlassInput
            placeholder="Search fighters, gyms, events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search" size={20} color={colors.textMuted} />}
            rightIcon={
              searchQuery.length > 0 ? (
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              ) : undefined
            }
            onRightIconPress={
              searchQuery.length > 0 ? () => setSearchQuery('') : undefined
            }
            containerStyle={styles.searchInputContainer}
          />
        </View>

        {/* Category tabs */}
        <View style={styles.categoryContainer}>
          <BadgeRow
            items={categoryBadges}
            selected={activeCategory}
            onSelect={(key) => setActiveCategory(key as CategoryKey)}
          />
        </View>

        {/* Results count */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {resultCount} {getCategoryLabel()}
              {resultCount !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : searchQuery.trim().length > 0 ? (
            renderResults()
          ) : (
            renderSuggestedContent()
          )}

          {/* Bottom spacer */}
          <View style={{ height: spacing[10] }} />
        </ScrollView>
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
  webWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
  },

  // Header
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  searchInputContainer: {
    marginBottom: 0,
  },

  // Category tabs
  categoryContainer: {
    paddingVertical: spacing[3],
  },

  // Results header
  resultsHeader: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[3],
  },

  // Result card (shared)
  resultCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[0.5],
  },
  cardNickname: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },

  // Fighter avatar
  avatarContainer: {
    marginRight: spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },

  // Gym avatar
  gymAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  // Tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
    marginTop: spacing[1],
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    backgroundColor: `${colors.primary[500]}15`,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[300],
  },
  sportTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  sportTagText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  moreText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    alignSelf: 'center',
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[1.5],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[0.5],
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },

  // Rating badge
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[0.5],
    paddingHorizontal: spacing[1.5],
    paddingVertical: spacing[0.5],
    backgroundColor: `${colors.warning}20`,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.warning,
  },

  // Event date box
  dateBox: {
    width: 52,
    height: 52,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  dateDay: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary[100],
  },

  // Capacity badge
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    backgroundColor: `${colors.success}15`,
    borderRadius: borderRadius.sm,
  },
  capacityFull: {
    backgroundColor: `${colors.error}15`,
  },
  capacityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
  },
  capacityTextFull: {
    color: colors.error,
  },
  eventDateText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: spacing[1],
  },

  // Suggested content
  suggestedSection: {
    paddingTop: spacing[2],
  },
  suggestedTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.displayMedium,
    color: colors.textPrimary,
    paddingHorizontal: spacing[4],
    letterSpacing: typography.letterSpacing.wide,
  },
  suggestedSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    paddingHorizontal: spacing[4],
    marginTop: spacing[0.5],
    marginBottom: spacing[1],
  },
});
