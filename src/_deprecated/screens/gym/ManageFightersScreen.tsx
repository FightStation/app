import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Fighter, Gym, WEIGHT_CLASS_LABELS, EXPERIENCE_LABELS } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';
import { GlassCard, BadgeRow, EmptyState, AnimatedListItem } from '../../components';

type ManageFightersScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type FighterWithStatus = Fighter & {
  isGymMember: boolean;
};

export function ManageFightersScreen({ navigation }: ManageFightersScreenProps) {
  const { profile } = useAuth();
  const gym = profile as Gym;

  const [fighters, setFighters] = useState<FighterWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'members' | 'nearby'>('all');

  useEffect(() => {
    loadFighters();
  }, []);

  const loadFighters = async () => {
    if (!gym) return;

    try {
      // Get all fighters
      const { data: allFighters, error } = await supabase
        .from('fighters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ManageFighters] Error loading fighters:', error);
        return;
      }

      // Mark which fighters are gym members
      const fightersWithStatus = (allFighters || []).map(fighter => ({
        ...fighter,
        isGymMember: fighter.gym_id === gym.id,
      }));

      setFighters(fightersWithStatus);
    } catch (err) {
      console.error('[ManageFighters] Failed to load fighters:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFighters();
    setRefreshing(false);
  };

  const filteredFighters = fighters.filter(fighter => {
    // Apply search filter
    const matchesSearch = searchQuery === '' ||
      `${fighter.first_name} ${fighter.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fighter.city?.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply category filter
    if (filter === 'members') {
      return matchesSearch && fighter.isGymMember;
    } else if (filter === 'nearby') {
      return matchesSearch && fighter.city?.toLowerCase() === gym?.city?.toLowerCase();
    }

    return matchesSearch;
  });

  const gymMembers = fighters.filter(f => f.isGymMember);

  const renderFighterCard = (fighter: FighterWithStatus, index: number) => (
    <AnimatedListItem key={fighter.id} index={index}>
      <GlassCard
        onPress={() => navigation.navigate('FighterProfileView', { fighterId: fighter.id })}
        accentColor={fighter.isGymMember ? colors.success : undefined}
        style={styles.fighterCardWrapper}
      >
        <View style={styles.fighterCardRow}>
          <View style={styles.fighterAvatar}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {fighter.first_name[0]}{fighter.last_name[0]}
              </Text>
            </View>
            {fighter.isGymMember && (
              <View style={styles.memberBadge}>
                <Ionicons name="checkmark" size={10} color={colors.textPrimary} />
              </View>
            )}
          </View>

          <View style={styles.fighterInfo}>
            <Text style={styles.fighterName}>
              {fighter.first_name} {fighter.last_name}
            </Text>
            <Text style={styles.fighterDetails}>
              {WEIGHT_CLASS_LABELS[fighter.weight_class]} • {EXPERIENCE_LABELS[fighter.experience_level]}
            </Text>
            <Text style={styles.fighterLocation}>
              {fighter.city}, {fighter.country}
            </Text>
          </View>

          <View style={styles.fighterStats}>
            <Text style={styles.statValue}>{fighter.sparring_count || 0}</Text>
            <Text style={styles.statLabel}>Spars</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  // Desktop layout
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <View style={styles.desktopContent}>
          {/* Desktop Header */}
          <View style={styles.desktopHeader}>
            <View style={styles.desktopHeaderLeft}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="people" size={28} color={colors.primary[500]} />
              </View>
              <View>
                <Text style={styles.desktopTitle}>Manage Fighters</Text>
                <Text style={styles.desktopSubtitle}>
                  {gymMembers.length} gym members • {fighters.length} total fighters
                </Text>
              </View>
            </View>
          </View>

          {/* Search and Filters */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search fighters by name or city..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <BadgeRow
              items={[
                { key: 'all', label: 'All Fighters', icon: 'people' },
                { key: 'members', label: 'Gym Members', icon: 'checkmark-circle' },
                { key: 'nearby', label: 'Nearby', icon: 'location' },
              ]}
              selected={filter}
              onSelect={(key) => setFilter(key as any)}
            />
          </View>

          {/* Fighters List */}
          <ScrollView
            style={styles.desktopScrollView}
            contentContainerStyle={styles.desktopScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
            }
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading fighters...</Text>
              </View>
            ) : filteredFighters.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No fighters found"
                description={searchQuery ? 'Try a different search term' : 'Fighters will appear here when they register'}
              />
            ) : (
              <View style={styles.fightersGrid}>
                {filteredFighters.map((fighter, index) => renderFighterCard(fighter, index))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="people" size={24} color={colors.primary[500]} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Fighters</Text>
            <Text style={styles.headerSubtitle}>{gymMembers.length} members</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fighters..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <BadgeRow
          items={[
            { key: 'all', label: 'All' },
            { key: 'members', label: 'Members' },
            { key: 'nearby', label: 'Nearby' },
          ]}
          selected={filter}
          onSelect={(key) => setFilter(key as any)}
        />
      </View>

      {/* Fighters List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading fighters...</Text>
          </View>
        ) : filteredFighters.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No fighters found"
            description={searchQuery ? 'Try a different search' : 'Invite fighters to join your gym'}
          />
        ) : (
          filteredFighters.map((fighter, index) => renderFighterCard(fighter, index))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  desktopContent: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  desktopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  desktopTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  desktopSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  searchSection: {
    padding: spacing[4],
    gap: spacing[3],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  filterTabActive: {
    backgroundColor: colors.primary[500],
  },
  filterTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.textPrimary,
  },
  filterScroll: {
    marginHorizontal: -spacing[4],
  },
  filterScrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing[2],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  desktopScrollView: {
    flex: 1,
  },
  desktopScrollContent: {
    padding: spacing[6],
  },
  fightersGrid: {
    gap: spacing[3],
  },
  fighterCardWrapper: {
    marginBottom: spacing[3],
  },
  fighterCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fighterAvatar: {
    position: 'relative',
    marginRight: spacing[3],
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  memberBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceLight,
  },
  fighterInfo: {
    flex: 1,
  },
  fighterName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  fighterDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  fighterLocation: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  fighterStats: {
    alignItems: 'center',
    marginRight: spacing[3],
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
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
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
