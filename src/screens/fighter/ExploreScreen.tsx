import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonCard } from '../../components/Skeleton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  GlassCard,
  SectionHeader,
  AnimatedListItem,
} from '../../components';
import type { Gym, Fighter } from '../../types';

type ExploreScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const TRENDING_GYMS = [
  {
    id: '1',
    name: 'Elite Boxing Academy',
    location: 'Berlin, Germany',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400',
    members: 127,
    sessionsThisWeek: 8,
  },
  {
    id: '2',
    name: 'Iron Fist Club',
    location: 'Munich, Germany',
    image: 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=400',
    members: 89,
    sessionsThisWeek: 5,
  },
];

const FEATURED_FIGHTERS = [
  {
    id: '1',
    name: 'Marcus Petrov',
    nickname: 'The Hammer',
    weightClass: 'Middleweight',
    record: '18-3-0',
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    nickname: 'Lightning',
    weightClass: 'Welterweight',
    record: '15-1-0',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
  },
  {
    id: '3',
    name: 'Javier Mendez',
    nickname: 'El Toro',
    weightClass: 'Light Heavyweight',
    record: '22-5-1',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
];

export function ExploreScreen({ navigation }: ExploreScreenProps) {
  const [trendingGyms, setTrendingGyms] = useState(TRENDING_GYMS);
  const [featuredFighters, setFeaturedFighters] = useState(FEATURED_FIGHTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExploreData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setTrendingGyms(TRENDING_GYMS);
      setFeaturedFighters(FEATURED_FIGHTERS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [gymsResult, fightersResult] = await Promise.all([
        supabase
          .from('gyms')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('fighters')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      if (gymsResult.error) throw gymsResult.error;
      if (fightersResult.error) throw fightersResult.error;

      if (gymsResult.data && gymsResult.data.length > 0) {
        const transformed = gymsResult.data.map((gym: Gym) => ({
          id: gym.id,
          name: gym.name,
          location: `${gym.city}, ${gym.country}`,
          image: gym.photos?.[0] || gym.logo_url || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400',
          members: 0,
          sessionsThisWeek: 0,
        }));
        setTrendingGyms(transformed);
      } else {
        setTrendingGyms(TRENDING_GYMS);
      }

      if (fightersResult.data && fightersResult.data.length > 0) {
        const transformed = fightersResult.data.map((fighter: Fighter) => ({
          id: fighter.id,
          name: `${fighter.first_name} ${fighter.last_name}`,
          nickname: fighter.nickname || '',
          weightClass: fighter.weight_class || 'Unknown',
          record: fighter.record || '0-0-0',
          image: fighter.avatar_url || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200',
        }));
        setFeaturedFighters(transformed);
      } else {
        setFeaturedFighters(FEATURED_FIGHTERS);
      }
    } catch (err) {
      console.error('Error loading explore data:', err);
      setTrendingGyms(TRENDING_GYMS);
      setFeaturedFighters(FEATURED_FIGHTERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExploreData();
  }, [loadExploreData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExploreData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      icon: 'people' as const,
      title: 'Find Fighters',
      description: 'Search fighters by weight class and experience',
      route: 'FighterSearch',
    },
    {
      icon: 'search' as const,
      title: 'Find Gyms',
      description: 'Discover gyms in your area',
      route: 'GymSearch',
    },
    {
      icon: 'calendar' as const,
      title: 'Browse Events',
      description: 'View upcoming sparring sessions',
      route: 'EventBrowse',
    },
    {
      icon: 'map' as const,
      title: 'Map View',
      description: 'Find nearby gyms and events',
      route: 'MapView',
    },
    {
      icon: 'chatbubble' as const,
      title: 'Messages',
      description: 'Connect with gyms and fighters',
      route: 'MessagesTab',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="compass" size={24} color={colors.primary[500]} />
            <Text style={styles.headerTitle}>Explore</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
            />
          }
        >
          {loading ? (
            <View style={{ paddingHorizontal: spacing[4], paddingTop: spacing[4] }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
          <>
          {/* Trending Gyms */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWrapper}>
              <SectionHeader
                title="Trending Gyms"
                onSeeAll={() => {}}
              />
            </View>

            {trendingGyms.map((gym, index) => (
              <AnimatedListItem key={gym.id} index={index}>
                <GlassCard style={styles.gymCard} onPress={() => {}}>
                  <View style={styles.gymCardContent}>
                    <Image source={{ uri: gym.image }} style={styles.gymImage} />
                    <View style={styles.gymInfo}>
                      <Text style={styles.gymName}>{gym.name}</Text>
                      <View style={styles.gymMeta}>
                        <Ionicons name="location" size={14} color={colors.textMuted} />
                        <Text style={styles.gymLocation}>{gym.location}</Text>
                      </View>
                      <View style={styles.gymStats}>
                        <View style={styles.stat}>
                          <Ionicons name="people" size={14} color={colors.primary[500]} />
                          <Text style={styles.statText}>{gym.members} members</Text>
                        </View>
                        <View style={styles.stat}>
                          <Ionicons name="calendar" size={14} color={colors.primary[500]} />
                          <Text style={styles.statText}>
                            {gym.sessionsThisWeek} sessions this week
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                </GlassCard>
              </AnimatedListItem>
            ))}
          </View>

          {/* Featured Fighters */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWrapper}>
              <SectionHeader
                title="Featured Fighters"
                onSeeAll={() => navigation.navigate('FighterSearch')}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fightersScroll}
            >
              {featuredFighters.map((fighter) => (
                <TouchableOpacity key={fighter.id} style={styles.fighterCard}>
                  <Image
                    source={{ uri: fighter.image }}
                    style={styles.fighterImage}
                  />
                  <View style={styles.fighterOverlay}>
                    <Text style={styles.fighterName}>{fighter.name}</Text>
                    <Text style={styles.fighterNickname}>"{fighter.nickname}"</Text>
                    <View style={styles.fighterBadge}>
                      <Text style={styles.fighterBadgeText}>
                        {fighter.weightClass}
                      </Text>
                    </View>
                    <View style={styles.fighterRecord}>
                      <Ionicons name="trophy" size={12} color={colors.primary[500]} />
                      <Text style={styles.fighterRecordText}>{fighter.record}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWrapper}>
              <SectionHeader title="Quick Actions" />
            </View>

            {quickActions.map((action, index) => (
              <AnimatedListItem key={action.route} index={index}>
                <GlassCard
                  style={styles.actionCard}
                  onPress={() => navigation.navigate(action.route as any)}
                >
                  <View style={styles.actionCardContent}>
                    <View style={styles.actionIcon}>
                      <Ionicons name={action.icon} size={24} color={colors.primary[500]} />
                    </View>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionDescription}>
                        {action.description}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                </GlassCard>
              </AnimatedListItem>
            ))}
          </View>

          <View style={styles.bottomPadding} />
          </>
          )}
        </ScrollView>
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
    fontFamily: typography.fontFamily.display,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeaderWrapper: {
    paddingHorizontal: spacing[4],
  },
  // Gym Cards
  gymCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  gymCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gymImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    marginRight: spacing[3],
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  gymMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  gymLocation: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  gymStats: {
    gap: spacing[1],
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  // Fighter Cards
  fightersScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  fighterCard: {
    width: 160,
    height: 220,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  fighterImage: {
    width: '100%',
    height: '100%',
  },
  fighterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  fighterName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[0.5],
  },
  fighterNickname: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
    marginBottom: spacing[2],
  },
  fighterBadge: {
    backgroundColor: `${colors.primary[500]}30`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing[1],
  },
  fighterBadgeText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  fighterRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  fighterRecordText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  // Action Cards
  actionCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  bottomPadding: {
    height: spacing[20],
  },
});
