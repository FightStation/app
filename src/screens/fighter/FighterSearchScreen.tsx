import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  GlassCard,
  GlassInput,
  GradientButton,
  SectionHeader,
  EmptyState,
  BadgeRow,
  AnimatedListItem,
} from '../../components';

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

  const weightClassBadges = WEIGHT_CLASSES.map((wc) => ({ key: wc, label: wc }));
  const experienceBadges = EXPERIENCE_LEVELS.map((exp) => ({ key: exp, label: exp }));
  const stanceBadges = STANCES.map((s) => ({ key: s, label: s }));

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
        <GlassInput
          placeholder="Search by name, location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color={colors.textMuted} />}
          rightIcon={searchQuery.length > 0 ? <Ionicons name="close-circle" size={20} color={colors.textMuted} /> : undefined}
          onRightIconPress={searchQuery.length > 0 ? () => setSearchQuery('') : undefined}
          containerStyle={styles.searchInputContainer}
        />

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
        <GlassCard style={styles.filtersPanel} noPadding>
          <View style={styles.filtersPanelInner}>
            {/* Weight Class */}
            <SectionHeader title="Weight Class" />
            <BadgeRow
              items={weightClassBadges}
              selected={selectedWeightClass}
              onSelect={setSelectedWeightClass}
            />

            {/* Experience Level */}
            <SectionHeader title="Experience" />
            <BadgeRow
              items={experienceBadges}
              selected={selectedExperience}
              onSelect={setSelectedExperience}
            />

            {/* Stance */}
            <SectionHeader title="Stance" />
            <BadgeRow
              items={stanceBadges}
              selected={selectedStance}
              onSelect={setSelectedStance}
            />

            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
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
          <EmptyState
            icon="people-outline"
            title="No fighters found"
            description="Try adjusting your search or filters"
          />
        ) : (
          filteredFighters.map((fighter, index) => (
            <AnimatedListItem key={fighter.id} index={index}>
              <GlassCard
                style={styles.fighterCard}
                onPress={() => handleFighterPress(fighter.id)}
              >
                <View style={styles.fighterCardContent}>
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
                </View>
              </GlassCard>
            </AnimatedListItem>
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
    alignItems: 'flex-start',
  },
  searchInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: spacing[0.5],
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
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  filtersPanelInner: {
    paddingVertical: spacing[3],
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
  fighterCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
  },
  fighterCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
