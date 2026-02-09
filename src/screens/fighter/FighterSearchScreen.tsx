import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type FighterSearchScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

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
  stance?: string;
  age?: number;
};

const WEIGHT_CLASSES = [
  'All',
  'Flyweight',
  'Bantamweight',
  'Featherweight',
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Heavyweight',
];

const EXPERIENCE_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Professional'];

const STANCES = ['All', 'Orthodox', 'Southpaw', 'Switch'];

const MOCK_FIGHTERS: FighterResult[] = [
  {
    id: '1',
    user_id: 'user1',
    first_name: 'Marcus',
    last_name: 'Petrov',
    nickname: 'The Hammer',
    weight_class: 'Middleweight',
    experience_level: 'Advanced',
    city: 'Berlin',
    country: 'Germany',
    record: '18-3-0',
    stance: 'Orthodox',
    age: 28,
  },
  {
    id: '2',
    user_id: 'user2',
    first_name: 'Sarah',
    last_name: 'Martinez',
    nickname: 'Lightning',
    weight_class: 'Featherweight',
    experience_level: 'Professional',
    city: 'Barcelona',
    country: 'Spain',
    record: '23-1-0',
    stance: 'Southpaw',
    age: 25,
  },
  {
    id: '3',
    user_id: 'user3',
    first_name: 'Alex',
    last_name: 'Chen',
    weight_class: 'Welterweight',
    experience_level: 'Intermediate',
    city: 'Singapore',
    country: 'Singapore',
    record: '8-2-1',
    stance: 'Orthodox',
    age: 22,
  },
  {
    id: '4',
    user_id: 'user4',
    first_name: 'Emma',
    last_name: 'Johnson',
    nickname: 'The Tiger',
    weight_class: 'Lightweight',
    experience_level: 'Advanced',
    city: 'London',
    country: 'UK',
    record: '15-4-0',
    stance: 'Switch',
    age: 27,
  },
];

export function FighterSearchScreen({ navigation }: FighterSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fighters, setFighters] = useState<FighterResult[]>([]);
  const [filteredFighters, setFilteredFighters] = useState<FighterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedWeightClass, setSelectedWeightClass] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [selectedStance, setSelectedStance] = useState('All');

  useEffect(() => {
    loadFighters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, fighters, selectedWeightClass, selectedExperience, selectedStance]);

  const loadFighters = async () => {
    if (!isSupabaseConfigured) {
      setFighters(MOCK_FIGHTERS);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fighters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFighters(data || []);
    } catch (error) {
      console.error('Error loading fighters:', error);
      setFighters(MOCK_FIGHTERS);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let results = [...fighters];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (fighter) =>
          fighter.first_name.toLowerCase().includes(query) ||
          fighter.last_name.toLowerCase().includes(query) ||
          fighter.nickname?.toLowerCase().includes(query) ||
          fighter.city?.toLowerCase().includes(query) ||
          fighter.country?.toLowerCase().includes(query)
      );
    }

    // Weight class filter
    if (selectedWeightClass !== 'All') {
      results = results.filter((fighter) => fighter.weight_class === selectedWeightClass);
    }

    // Experience filter
    if (selectedExperience !== 'All') {
      results = results.filter((fighter) => fighter.experience_level === selectedExperience);
    }

    // Stance filter
    if (selectedStance !== 'All') {
      results = results.filter((fighter) => fighter.stance === selectedStance);
    }

    setFilteredFighters(results);
  };

  const clearFilters = () => {
    setSelectedWeightClass('All');
    setSelectedExperience('All');
    setSelectedStance('All');
    setSearchQuery('');
  };

  const handleFighterPress = (fighterId: string) => {
    navigation.navigate('FighterProfileView', { fighterId });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedWeightClass !== 'All') count++;
    if (selectedExperience !== 'All') count++;
    if (selectedStance !== 'All') count++;
    return count;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Fighters</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, getActiveFilterCount() > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={20} color={colors.textPrimary} />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Weight Class */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Weight Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {WEIGHT_CLASSES.map((wc) => (
                  <TouchableOpacity
                    key={wc}
                    style={[
                      styles.filterChip,
                      selectedWeightClass === wc && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedWeightClass(wc)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedWeightClass === wc && styles.filterChipTextActive,
                      ]}
                    >
                      {wc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Experience Level */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Experience</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {EXPERIENCE_LEVELS.map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[
                      styles.filterChip,
                      selectedExperience === exp && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedExperience(exp)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedExperience === exp && styles.filterChipTextActive,
                      ]}
                    >
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Stance */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Stance</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {STANCES.map((stance) => (
                  <TouchableOpacity
                    key={stance}
                    style={[
                      styles.filterChip,
                      selectedStance === stance && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedStance(stance)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedStance === stance && styles.filterChipTextActive,
                      ]}
                    >
                      {stance}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredFighters.length} fighter{filteredFighters.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : filteredFighters.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No fighters found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          filteredFighters.map((fighter) => (
            <TouchableOpacity
              key={fighter.id}
              style={styles.fighterCard}
              onPress={() => handleFighterPress(fighter.id)}
            >
              <View style={styles.fighterAvatar}>
                {fighter.avatar_url ? (
                  <Image source={{ uri: fighter.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={32} color={colors.textMuted} />
                  </View>
                )}
              </View>

              <View style={styles.fighterInfo}>
                <View style={styles.fighterHeader}>
                  <Text style={styles.fighterName}>
                    {fighter.first_name} {fighter.last_name}
                  </Text>
                  {fighter.nickname && (
                    <Text style={styles.fighterNickname}>"{fighter.nickname}"</Text>
                  )}
                </View>

                <View style={styles.fighterStats}>
                  {fighter.weight_class && (
                    <View style={styles.stat}>
                      <Ionicons name="barbell" size={14} color={colors.textMuted} />
                      <Text style={styles.statText}>{fighter.weight_class}</Text>
                    </View>
                  )}
                  {fighter.experience_level && (
                    <View style={styles.stat}>
                      <Ionicons name="medal" size={14} color={colors.textMuted} />
                      <Text style={styles.statText}>{fighter.experience_level}</Text>
                    </View>
                  )}
                  {fighter.record && (
                    <View style={styles.stat}>
                      <Ionicons name="trophy" size={14} color={colors.textMuted} />
                      <Text style={styles.statText}>{fighter.record}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.fighterLocation}>
                  <Ionicons name="location" size={14} color={colors.textMuted} />
                  <Text style={styles.locationText}>
                    {fighter.city}, {fighter.country}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  filterBadgeText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  filtersPanel: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing[3],
  },
  filterSection: {
    marginBottom: spacing[3],
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  clearFiltersButton: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  resultsHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  fighterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fighterAvatar: {
    marginRight: spacing[3],
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  fighterInfo: {
    flex: 1,
  },
  fighterHeader: {
    marginBottom: spacing[1],
  },
  fighterName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  fighterNickname: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: spacing[0.5],
  },
  fighterStats: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  fighterLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});
