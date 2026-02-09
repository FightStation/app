import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GymCard, WebLayout } from '../../components';
import { mockGyms, MockGym } from '../../lib/mockData';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';
import { useMatching } from '../../hooks/useMatching';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { Gym } from '../../types';

type FindSparringScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? (isDesktop ? 800 : 480) : width;

// Transform Supabase Gym to MockGym format for GymCard component
function transformGymToMockGym(gym: Gym): MockGym {
  // Generate intensity badge from description or random
  const intensityBadges: ('high' | 'hard' | 'all_levels')[] = ['high', 'hard', 'all_levels'];
  const randomIntensity = intensityBadges[Math.floor(Math.random() * intensityBadges.length)];

  return {
    id: gym.id,
    name: gym.name,
    image: gym.photos?.[0] || gym.logo_url || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=200&fit=crop',
    distance: `${gym.city}, ${gym.country}`,
    sessionType: 'Open Sparring',
    isVerified: true,
    intensityBadge: randomIntensity,
    weightClasses: [
      { count: 2, name: 'Lightweight' },
      { count: 3, name: 'Welterweight' },
    ],
    memberAvatars: ['A', 'B', 'C'],
    memberCount: 5,
  };
}

export function FindSparringScreen({ navigation }: FindSparringScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [_selectedLocation, _setSelectedLocation] = useState('berlin');
  const [selectedIntensity, setSelectedIntensity] = useState('all');
  const [gyms, setGyms] = useState<MockGym[]>(mockGyms);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load gyms from Supabase or use mock data
  const loadGyms = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setGyms(mockGyms);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedGyms = data.map(transformGymToMockGym);
        setGyms(transformedGyms);
      } else {
        // Fall back to mock data if no gyms in database
        setGyms(mockGyms);
      }
    } catch (err) {
      console.error('Error loading gyms:', err);
      // Fall back to mock data on error
      setGyms(mockGyms);
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

  // Smart matching - uses mock fighter ID for now
  const { events, partners, loading: matchingLoading } = useMatching({
    fighterId: 'current-user',
    limit: 5,
  });

  const handleRequestSparring = (gymId: string) => {
    const gym = gyms.find(g => g.id === gymId);
    navigation.navigate('ProposeSession', {
      gymId,
      gymName: gym?.name || 'Gym'
    });
  };

  const handleGymPress = (gymId: string) => {
    navigation.navigate('GymProfileView', { gymId });
  };

  const cycleIntensity = () => {
    const intensities = ['all', 'high', 'hard', 'all_levels'];
    const currentIndex = intensities.indexOf(selectedIntensity);
    const nextIndex = (currentIndex + 1) % intensities.length;
    setSelectedIntensity(intensities[nextIndex]);
  };

  const getIntensityLabel = () => {
    switch (selectedIntensity) {
      case 'high': return 'Intensity: High';
      case 'hard': return 'Intensity: Hard';
      case 'all_levels': return 'Intensity: All Levels';
      default: return 'Intensity: All';
    }
  };

  // Filter gyms based on search and filters
  const filteredGyms = gyms.filter((gym) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = gym.name.toLowerCase().includes(query);
      const matchesSession = gym.sessionType.toLowerCase().includes(query);
      if (!matchesName && !matchesSession) return false;
    }

    // Intensity filter
    if (selectedIntensity !== 'all') {
      if (gym.intensityBadge !== selectedIntensity) return false;
    }

    return true;
  });

  // Show loading indicator while fetching gyms
  if (loading && gyms.length === 0) {
    return (
      <WebLayout currentRoute="HomeTab" navigation={navigation}>
        <SafeAreaView style={styles.safeArea} edges={isDesktop ? [] : ['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Finding gyms near you...</Text>
          </View>
        </SafeAreaView>
      </WebLayout>
    );
  }

  return (
    <WebLayout currentRoute="HomeTab" navigation={navigation}>
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? [] : ['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.webContainer}>
          {/* Header - hide on desktop since WebLayout has one */}
          {!isDesktop && (
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="flash" size={24} color={colors.primary[500]} />
                <Text style={styles.headerTitle}>Find Sparring</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerIcon}>
                  <Ionicons name="bookmark-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIcon}>
                  <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search gym name or city..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              {/* Location Filter */}
              <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}>
                <Text style={[styles.filterPillText, styles.filterPillTextActive]}>
                  Berlin, DE
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textPrimary} />
              </TouchableOpacity>

              {/* Intensity Filter */}
              <TouchableOpacity
                style={[styles.filterPill, selectedIntensity !== 'all' && styles.filterPillActive]}
                onPress={cycleIntensity}
              >
                <Text style={[
                  styles.filterPillText,
                  selectedIntensity !== 'all' && styles.filterPillTextActive
                ]}>
                  {getIntensityLabel()}
                </Text>
                <Ionicons
                  name="options-outline"
                  size={14}
                  color={selectedIntensity !== 'all' ? colors.textPrimary : colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Weight Filter */}
              <TouchableOpacity style={styles.filterPill}>
                <Text style={styles.filterPillText}>Weight</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Recommended Events */}
          {events.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>RECOMMENDED EVENTS</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationScroll}
                style={styles.recommendationList}
              >
                {events.map((match) => (
                  <TouchableOpacity
                    key={match.entity_id}
                    style={styles.recommendationCard}
                    onPress={() => navigation.navigate('EventDetail', { eventId: match.entity_id })}
                  >
                    <View style={styles.matchScoreBadge}>
                      <Text style={styles.matchScoreText}>{Math.round(match.overall_score)}%</Text>
                    </View>
                    <Text style={styles.recommendationName} numberOfLines={1}>
                      {match.event?.title || 'Sparring Event'}
                    </Text>
                    <Text style={styles.recommendationDetail} numberOfLines={1}>
                      {match.event?.gym?.name || 'Local Gym'}
                    </Text>
                    {match.reasons.length > 0 && (
                      <Text style={styles.recommendationReason} numberOfLines={1}>
                        {match.reasons[0]}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Recommended Partners */}
          {partners.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>FIGHTERS NEAR YOU</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationScroll}
                style={styles.recommendationList}
              >
                {partners.map((match) => (
                  <TouchableOpacity
                    key={match.entity_id}
                    style={styles.partnerCard}
                    onPress={() => navigation.navigate('FighterProfileView', { fighterId: match.entity_id })}
                  >
                    <View style={styles.partnerAvatar}>
                      <Ionicons name="person" size={24} color={colors.textMuted} />
                    </View>
                    <View style={styles.matchScoreBadgeSmall}>
                      <Text style={styles.matchScoreTextSmall}>{Math.round(match.overall_score)}%</Text>
                    </View>
                    <Text style={styles.partnerName} numberOfLines={1}>
                      {match.fighter?.first_name || 'Fighter'}
                    </Text>
                    <Text style={styles.partnerDetail} numberOfLines={1}>
                      {match.fighter?.weight_class || 'Unknown'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {matchingLoading && (
            <View style={styles.matchingLoader}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.matchingLoaderText}>Finding matches...</Text>
            </View>
          )}

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NEARBY GYMS LOOKING FOR PARTNERS</Text>
          </View>

          {/* Gym Cards List */}
          <ScrollView
            style={styles.gymsList}
            contentContainerStyle={styles.gymsListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary[500]}
              />
            }
          >
            {filteredGyms.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No gyms found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your search or filters
                </Text>
              </View>
            ) : (
              filteredGyms.map((gym) => (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  onPress={() => handleGymPress(gym.id)}
                  onRequestSparring={() => handleRequestSparring(gym.id)}
                />
              ))
            )}

            {/* Bottom padding for tab bar */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
  },
  webContainer: {
    flex: 1,
    maxWidth: containerMaxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.OS === 'web' ? spacing[3] : spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  filtersContainer: {
    marginBottom: spacing[4],
  },
  filtersScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    marginRight: spacing[2],
  },
  filterPillActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  filterPillTextActive: {
    color: colors.textPrimary,
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  gymsList: {
    flex: 1,
  },
  gymsListContent: {
    paddingHorizontal: spacing[4],
  },
  bottomPadding: {
    height: spacing[20],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  // Recommendation sections
  recommendationList: {
    marginBottom: spacing[4],
  },
  recommendationScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  recommendationCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    width: 160,
  },
  matchScoreBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  matchScoreText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  recommendationName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  recommendationDetail: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing[1],
  },
  recommendationReason: {
    color: colors.primary[400],
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
  // Partner cards
  partnerCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    width: 110,
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  matchScoreBadgeSmall: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[1],
    paddingVertical: 1,
    marginBottom: spacing[1],
  },
  matchScoreTextSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  partnerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  partnerDetail: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  // Loading
  matchingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  matchingLoaderText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
