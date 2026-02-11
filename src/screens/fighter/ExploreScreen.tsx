import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  FlatList,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SkeletonCard } from '../../components/Skeleton';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  gradients,
  glass,
  shadows,
} from '../../lib/theme';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  GlassCard,
  GlassInput,
  GradientButton,
  AnimatedListItem,
  EmptyState,
} from '../../components';
import type { Gym, CombatSport } from '../../types';
import { COMBAT_SPORT_LABELS, COMBAT_SPORT_ICONS } from '../../types';

type ExploreScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const MAP_HEIGHT = height * 0.35;

type DisciplineFilter = 'all' | CombatSport;

const DISCIPLINE_FILTERS: { key: DisciplineFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mma', label: 'MMA' },
  { key: 'muay_thai', label: 'Muay Thai' },
  { key: 'boxing', label: 'Boxing' },
  { key: 'kickboxing', label: 'Kickboxing' },
];

// Mock map marker positions (percentage-based for responsiveness)
const MAP_MARKERS = [
  { id: '1', left: '25%', top: '30%', icon: 'fitness' as const },
  { id: '2', left: '58%', top: '50%', icon: 'hand-left' as const },
  { id: '3', left: '72%', top: '28%', icon: 'flash' as const },
];

const PLACEHOLDER_GYMS: Gym[] = [
  {
    id: 'p1',
    user_id: '',
    name: 'Elite Boxing Academy',
    address: 'Friedrichstrasse 45',
    city: 'Berlin',
    country: 'Germany',
    photos: ['https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400'],
    facilities: ['Ring', 'Heavy Bags', 'Showers'],
    sports: ['boxing', 'mma'],
    contact_email: '',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'p2',
    user_id: '',
    name: 'Iron Fist MMA Club',
    address: 'Leopoldstrasse 12',
    city: 'Munich',
    country: 'Germany',
    photos: ['https://images.unsplash.com/photo-1517438322307-e67111335449?w=400'],
    facilities: ['Cage', 'Mats', 'Weights'],
    sports: ['mma', 'kickboxing'],
    contact_email: '',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'p3',
    user_id: '',
    name: 'Bangkok Warriors Gym',
    address: 'Schoenhauser Allee 78',
    city: 'Berlin',
    country: 'Germany',
    photos: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'],
    facilities: ['Ring', 'Thai Pads', 'Heavy Bags'],
    sports: ['muay_thai', 'kickboxing'],
    contact_email: '',
    created_at: '',
    updated_at: '',
  },
];

// Simulate distance for demo purposes
function getMockDistance(gymId: string): string {
  const distances: Record<string, string> = {
    p1: '1.2 km',
    p2: '3.8 km',
    p3: '5.4 km',
  };
  // For real gym IDs, generate a pseudo-random distance
  if (distances[gymId]) return distances[gymId];
  const hash = gymId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `${(hash % 20) + 1}.${hash % 10} km`;
}

export function ExploreScreen({ navigation }: ExploreScreenProps) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineFilter>('all');

  const loadGyms = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setGyms(PLACEHOLDER_GYMS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        setGyms(data);
      } else {
        setGyms(PLACEHOLDER_GYMS);
      }
    } catch (err) {
      console.error('Error loading gyms:', err);
      setGyms(PLACEHOLDER_GYMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGyms();
  }, [loadGyms]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGyms();
    setRefreshing(false);
  };

  const filteredGyms = useMemo(() => {
    let result = gyms;

    // Filter by discipline
    if (activeDiscipline !== 'all') {
      result = result.filter(
        (gym) => gym.sports && gym.sports.includes(activeDiscipline)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (gym) =>
          gym.name.toLowerCase().includes(query) ||
          gym.city.toLowerCase().includes(query)
      );
    }

    return result;
  }, [gyms, activeDiscipline, searchQuery]);

  const handleGymPress = (gymId: string) => {
    navigation.navigate('GymProfileView', { gymId });
  };

  const renderMapPin = (marker: (typeof MAP_MARKERS)[number]) => (
    <View
      key={marker.id}
      style={[
        styles.mapPin,
        { left: marker.left as any, top: marker.top as any },
      ]}
    >
      <View style={styles.mapPinOuter}>
        <View style={styles.mapPinInner}>
          <Ionicons name={marker.icon} size={14} color={colors.textPrimary} />
        </View>
      </View>
      <View style={styles.mapPinPulse} />
    </View>
  );

  const renderDisciplineChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipScrollContent}
      style={styles.chipScroll}
    >
      {DISCIPLINE_FILTERS.map((filter) => {
        const isActive = activeDiscipline === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => setActiveDiscipline(filter.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderGymCard = ({ item, index }: { item: Gym; index: number }) => {
    const imageUri =
      item.photos?.[0] ||
      item.logo_url ||
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400';
    const distance = getMockDistance(item.id);

    return (
      <AnimatedListItem index={index}>
        <GlassCard
          style={styles.gymCard}
          onPress={() => handleGymPress(item.id)}
        >
          <View style={styles.gymCardRow}>
            <Image source={{ uri: imageUri }} style={styles.gymImage} />
            <View style={styles.gymInfo}>
              <Text style={styles.gymName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.gymLocationRow}>
                <Ionicons
                  name="location"
                  size={13}
                  color={colors.primary[500]}
                />
                <Text style={styles.gymDistance}>
                  {distance} &middot; {item.city}
                </Text>
              </View>
              {item.sports && item.sports.length > 0 && (
                <View style={styles.sportBadges}>
                  {item.sports.map((sport) => (
                    <View
                      key={sport}
                      style={[
                        styles.sportBadge,
                        {
                          backgroundColor:
                            colors.sport[`${sport}Light` as keyof typeof colors.sport] ||
                            `${colors.primary[500]}15`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          COMBAT_SPORT_ICONS[sport] as keyof typeof Ionicons.glyphMap
                        }
                        size={10}
                        color={
                          colors.sport[sport as keyof typeof colors.sport] ||
                          colors.primary[500]
                        }
                      />
                      <Text
                        style={[
                          styles.sportBadgeText,
                          {
                            color:
                              colors.sport[sport as keyof typeof colors.sport] ||
                              colors.primary[500],
                          },
                        ]}
                      >
                        {COMBAT_SPORT_LABELS[sport]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          <GradientButton
            title="ARRANGE SPARRING DAY"
            onPress={() => handleGymPress(item.id)}
            size="sm"
            icon="calendar-outline"
            fullWidth
            style={styles.sparringButton}
          />
        </GlassCard>
      </AnimatedListItem>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Drag handle indicator */}
      <View style={styles.handleBar} />

      {/* Count and sort row */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>
          {filteredGyms.length} Gym{filteredGyms.length !== 1 ? 's' : ''} Nearby
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
          <Text style={styles.sortText}>Sort by: Proximity</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => {
    if (loading) return null;
    return (
      <EmptyState
        icon="business-outline"
        title="No Gyms Found"
        description={
          searchQuery
            ? `No partner gyms match "${searchQuery}"`
            : 'No partner gyms available for this discipline yet.'
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Partner Gyms</Text>
          <TouchableOpacity style={styles.headerFilterButton}>
            <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <GlassInput
            placeholder="Search by city or gym name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={
              <Ionicons name="search" size={18} color={colors.textMuted} />
            }
            rightIcon={
              searchQuery.length > 0 ? (
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              ) : undefined
            }
            onRightIconPress={
              searchQuery.length > 0 ? () => setSearchQuery('') : undefined
            }
            containerStyle={styles.searchInputContainer}
            returnKeyType="search"
          />
        </View>

        {/* Map placeholder with pins and discipline chips */}
        <View style={styles.mapContainer}>
          <LinearGradient
            colors={['#131A2A', '#161D2E', '#0E1320'] as const}
            style={styles.mapGradient}
          >
            {/* Grid overlay for map texture */}
            <View style={styles.mapGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={`h-${i}`}
                  style={[
                    styles.mapGridLineH,
                    { top: `${(i + 1) * 16}%` as any },
                  ]}
                />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={`v-${i}`}
                  style={[
                    styles.mapGridLineV,
                    { left: `${(i + 1) * 18}%` as any },
                  ]}
                />
              ))}
            </View>

            {/* Map label */}
            <View style={styles.mapLabel}>
              <Ionicons name="map" size={14} color={colors.textMuted} />
              <Text style={styles.mapLabelText}>Map View</Text>
            </View>

            {/* Mock pins */}
            {MAP_MARKERS.map(renderMapPin)}
          </LinearGradient>

          {/* Discipline filter chips overlaid at bottom of map */}
          <View style={styles.chipOverlay}>{renderDisciplineChips()}</View>
        </View>

        {/* Gym list section */}
        <View style={styles.listSection}>
          {loading ? (
            <View style={styles.skeletonContainer}>
              <View style={styles.listHeaderContainer}>
                <View style={styles.handleBar} />
              </View>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <FlatList
              data={filteredGyms}
              keyExtractor={(item) => item.id}
              renderItem={renderGymCard}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderEmptyList}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary[500]}
                />
              }
            />
          )}
        </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
    letterSpacing: typography.letterSpacing.wide,
  },
  headerFilterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing[4],
  },
  searchInputContainer: {
    marginBottom: spacing[2],
  },

  // Map
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  mapGradient: {
    flex: 1,
    position: 'relative',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapLabel: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
  },
  mapLabelText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },

  // Map pins
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinOuter: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinInner: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}10`,
  },

  // Discipline chips overlaid on map
  chipOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing[3],
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipScrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(30, 39, 64, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },

  // List section
  listSection: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    marginTop: -spacing[4],
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listContent: {
    paddingBottom: spacing[20],
  },
  skeletonContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },

  // List header (handlebar + count)
  listHeaderContainer: {
    alignItems: 'center',
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing[3],
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  listHeaderTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.displayMedium,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  sortText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },

  // Gym card
  gymCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  gymCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  gymImage: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
  },
  gymInfo: {
    flex: 1,
    marginLeft: spacing[3],
    justifyContent: 'center',
  },
  gymName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  gymLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  gymDistance: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  sportBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  sportBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.medium,
  },
  sparringButton: {
    marginTop: spacing[1],
  },
});
