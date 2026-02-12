import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  gradients,
  shadows,
} from '../../lib/theme';

import {
  GlassCard,
  GradientButton,
  AnimatedListItem,
  EmptyState,
} from '../../components';
import { CombatSport, COMBAT_SPORT_LABELS } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

// ---------- Types ----------

type FighterProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  bio?: string;
  age?: number;
  weight_class?: string;
  experience_level?: string;
  record?: string;
  city?: string;
  country?: string;
  avatar_url?: string;
  height_cm?: number;
  reach_cm?: number;
  stance?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  fights_count?: number;
  sparring_count?: number;
  gym_id?: string;
  sports?: string[];
  primary_sport?: string;
};

type AffiliatedGym = {
  id: string;
  name: string;
  logo_url?: string;
  city?: string;
  country?: string;
};

type AffiliatedCoach = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  specializations?: string[];
};

type FighterPost = {
  id: string;
  media_urls?: string[];
  media_type?: string;
  post_type?: string;
};

// ---------- Mock Data ----------

const MOCK_FIGHTER: FighterProfile = {
  id: '1',
  user_id: 'user1',
  first_name: 'Alex',
  last_name: 'Silva',
  nickname: 'The Viper',
  bio: 'Professional MMA fighter specializing in Brazilian Jiu-Jitsu and striking. 5x regional champion. Training out of Elite Combat Academy.',
  age: 28,
  weight_class: 'Welterweight',
  experience_level: 'Advanced',
  record: '18-3-0',
  city: 'Miami',
  country: 'USA',
  height_cm: 183,
  reach_cm: 188,
  stance: 'Orthodox',
  fights_count: 21,
  sparring_count: 156,
  instagram: '@alex_silva_mma',
  sports: ['mma', 'boxing'],
  primary_sport: 'mma',
};

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type SessionSlot = {
  time: string;
  label: string;
  status: 'available' | 'booked';
};

const MOCK_AVAILABILITY: Record<string, SessionSlot[]> = {
  MON: [
    { time: '07:00 - 09:00', label: 'Morning', status: 'available' },
    { time: '18:00 - 20:00', label: 'Evening', status: 'booked' },
  ],
  TUE: [
    { time: '07:00 - 09:00', label: 'Morning', status: 'booked' },
    { time: '18:00 - 20:00', label: 'Evening', status: 'available' },
  ],
  WED: [
    { time: '07:00 - 09:00', label: 'Morning', status: 'available' },
    { time: '18:00 - 20:00', label: 'Evening', status: 'available' },
  ],
  THU: [
    { time: '07:00 - 09:00', label: 'Morning', status: 'available' },
    { time: '18:00 - 20:00', label: 'Evening', status: 'booked' },
  ],
  FRI: [
    { time: '07:00 - 09:00', label: 'Morning', status: 'booked' },
    { time: '18:00 - 20:00', label: 'Evening', status: 'available' },
  ],
  SAT: [
    { time: '09:00 - 11:00', label: 'Morning', status: 'available' },
  ],
};

const WEIGHT_CLASS_ORDER = [
  'Strawweight',
  'Flyweight',
  'Bantamweight',
  'Featherweight',
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Heavyweight',
];

// ---------- Helpers ----------

const formatHeight = (cm?: number) => {
  if (!cm) return 'N/A';
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm % 30.48) / 2.54);
  return `${cm}cm (${feet}'${inches}")`;
};

const formatReach = (cm?: number) => {
  if (!cm) return 'N/A';
  return `${cm}cm`;
};

const getPreferredWeightClasses = (current?: string): string[] => {
  if (!current) return [];
  const idx = WEIGHT_CLASS_ORDER.indexOf(current);
  if (idx === -1) return [current];
  const classes: string[] = [];
  if (idx > 0) classes.push(WEIGHT_CLASS_ORDER[idx - 1]);
  classes.push(current);
  if (idx < WEIGHT_CLASS_ORDER.length - 1) classes.push(WEIGHT_CLASS_ORDER[idx + 1]);
  return classes;
};

// ---------- Tab Types ----------

type ProfileTab = 'grid' | 'schedule' | 'highlights';

// ---------- Component ----------

export function FighterProfileViewScreen({ navigation, route }: any) {
  const { profile: currentUserProfile, user } = useAuth();
  const { fighterId } = route.params;
  const [fighter, setFighter] = useState<FighterProfile>(MOCK_FIGHTER);
  const [loading, setLoading] = useState(false);
  const [affiliatedGym, setAffiliatedGym] = useState<AffiliatedGym | null>(null);
  const [coaches, setCoaches] = useState<AffiliatedCoach[]>([]);
  const [posts, setPosts] = useState<FighterPost[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('grid');
  const [selectedDay, setSelectedDay] = useState('MON');

  const isOwnProfile =
    currentUserProfile &&
    'first_name' in currentUserProfile &&
    (currentUserProfile as any).id === fighterId;

  const usernameHandle = useMemo(() => {
    const first = (fighter.first_name || '').toLowerCase().replace(/\s+/g, '_');
    const last = (fighter.last_name || '').toLowerCase().replace(/\s+/g, '_');
    return `${first}_${last}`;
  }, [fighter.first_name, fighter.last_name]);

  const isVerified = (fighter.fights_count ?? 0) > 10;

  const winsCount = useMemo(() => {
    if (!fighter.record) return 0;
    const parts = fighter.record.split('-');
    return parseInt(parts[0], 10) || 0;
  }, [fighter.record]);

  const preferredWeightClasses = useMemo(
    () => getPreferredWeightClasses(fighter.weight_class),
    [fighter.weight_class],
  );

  // ---------- Data Loading ----------

  useEffect(() => {
    loadFighterProfile();
    loadPosts();
  }, [fighterId]);

  useEffect(() => {
    if (fighter.gym_id) {
      loadAffiliations(fighter.gym_id);
    }
  }, [fighter.gym_id]);

  const loadFighterProfile = async () => {
    if (!isSupabaseConfigured) {
      setFighter(MOCK_FIGHTER);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fighters')
        .select('*')
        .eq('id', fighterId)
        .single();

      if (error) throw error;
      if (data) setFighter(data);
    } catch (error) {
      console.error('Error loading fighter:', error);
      Alert.alert('Error', 'Failed to load fighter profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, media_urls, media_type, post_type')
        .eq('author_id', fighterId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      if (data) setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadAffiliations = async (gymId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data: gymData } = await supabase
        .from('gyms')
        .select('id, name, logo_url, city, country')
        .eq('id', gymId)
        .single();

      if (gymData) setAffiliatedGym(gymData);

      const { data: coachesData } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, avatar_url, specializations')
        .eq('gym_id', gymId)
        .limit(5);

      if (coachesData) setCoaches(coachesData);
    } catch (error) {
      console.error('Error loading affiliations:', error);
    }
  };

  // ---------- Actions ----------


  const handleEdit = () => {
    navigation.navigate('FighterProfile');
  };

  // ---------- Sub-components ----------

  const renderSportPills = () => {
    const sports = fighter.sports ?? [];
    if (sports.length === 0) return null;

    return (
      <View style={styles.sportPillsRow}>
        {sports.map((sport) => {
          const label =
            COMBAT_SPORT_LABELS[sport as CombatSport] ?? sport.replace(/_/g, ' ');
          return (
            <View key={sport} style={styles.sportPill}>
              <Text style={styles.sportPillText}>#{label.replace(/\s+/g, '')}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderGridTab = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyGrid}>
          <EmptyState
            icon="camera-outline"
            title="No Posts Yet"
            subtitle="Posts will appear here once they share content"
          />
        </View>
      );
    }

    return (
      <View style={styles.photoGrid}>
        {posts.map((post) => {
          const thumbnail = post.media_urls?.[0];
          const isVideo = post.media_type === 'video' || post.post_type === 'video';

          return (
            <TouchableOpacity
              key={post.id}
              style={styles.gridItem}
              activeOpacity={0.8}
            >
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.gridImage} />
              ) : (
                <View style={styles.gridPlaceholder}>
                  <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                </View>
              )}
              {isVideo && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderScheduleTab = () => {
    const daySlots = MOCK_AVAILABILITY[selectedDay] ?? [];

    return (
      <View style={styles.scheduleContainer}>
        {/* Day Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {DAYS_OF_WEEK.map((day) => {
            const isActive = day === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, isActive && styles.dayChipActive]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Session Slots */}
        <View style={styles.slotsContainer}>
          {daySlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
              <Text style={styles.noSlotsText}>No sessions on this day</Text>
            </View>
          ) : (
            daySlots.map((slot, idx) => (
              <View key={idx} style={styles.slotRow}>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                  <Text style={styles.slotTime}>{slot.time}</Text>
                </View>
                <View
                  style={[
                    styles.slotBadge,
                    slot.status === 'available'
                      ? styles.slotBadgeAvailable
                      : styles.slotBadgeBooked,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotBadgeText,
                      slot.status === 'available'
                        ? styles.slotBadgeTextAvailable
                        : styles.slotBadgeTextBooked,
                    ]}
                  >
                    {slot.status === 'available' ? 'AVAILABLE' : 'BOOKED'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderHighlightsTab = () => (
    <View style={styles.emptyGrid}>
      <EmptyState
        icon="star-outline"
        title="No Highlights"
        subtitle="Featured content and achievements will appear here"
      />
    </View>
  );

  // ---------- Loading State ----------

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Render ----------

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerUsername} numberOfLines={1}>
          {usernameHandle}
        </Text>

        <View style={styles.headerRight}>
          {isOwnProfile ? (
            <TouchableOpacity onPress={handleEdit} style={styles.headerBtn}>
              <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header Row: Avatar + Stats */}
        <View style={styles.profileHeaderRow}>
          {/* Avatar with Gradient Ring */}
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={gradients.primaryToCrimson}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                {fighter.avatar_url ? (
                  <Image source={{ uri: fighter.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color={colors.textMuted} />
                  </View>
                )}
              </View>
            </LinearGradient>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={colors.info} />
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{fighter.fights_count ?? 0}</Text>
              <Text style={styles.statLabel}>Fights</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{winsCount}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{fighter.sparring_count ?? 0}</Text>
              <Text style={styles.statLabel}>Sparring</Text>
            </View>
          </View>
        </View>

        {/* Name & Bio Section */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.fullName}>
              {fighter.first_name} {fighter.last_name}
            </Text>
            {fighter.nickname && (
              <Text style={styles.nickname}> "{fighter.nickname}"</Text>
            )}
          </View>

          <Text style={styles.roleSubtitle}>
            {fighter.experience_level
              ? `${fighter.experience_level} `
              : 'Professional '}
            {fighter.primary_sport
              ? (COMBAT_SPORT_LABELS[fighter.primary_sport as CombatSport] ?? 'Fighter')
              : 'Fighter'}
            {fighter.weight_class ? ` \u2022 ${fighter.weight_class}` : ''}
          </Text>

          {(fighter.city || fighter.country) && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.primary[500]} />
              <Text style={styles.locationText}>
                {[fighter.city, fighter.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {fighter.bio && (
            <Text style={styles.bioText}>{fighter.bio}</Text>
          )}

          {renderSportPills()}
        </View>

        {/* CTA Buttons */}
        {!isOwnProfile && (
          <View style={styles.ctaRow}>
            <GradientButton
              title="Book Sparring"
              onPress={() => {}}
              icon="flash"
              size="sm"
              style={styles.ctaGradient}
              fullWidth
            />
          </View>
        )}

        {/* Tabs: Grid / Schedule / Highlights */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grid' && styles.tabActive]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons
              name="grid"
              size={22}
              color={activeTab === 'grid' ? colors.textPrimary : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
            onPress={() => setActiveTab('schedule')}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={activeTab === 'schedule' ? colors.textPrimary : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'highlights' && styles.tabActive]}
            onPress={() => setActiveTab('highlights')}
          >
            <Ionicons
              name="star-outline"
              size={22}
              color={activeTab === 'highlights' ? colors.textPrimary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'grid' && renderGridTab()}
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'highlights' && renderHighlightsTab()}

        {/* Sparring Availability (below tabs when on grid) */}
        {activeTab === 'grid' && (
          <>
            {/* Preferred Weight Classes */}
            {preferredWeightClasses.length > 0 && (
              <AnimatedListItem index={0}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Preferred Weight Classes</Text>
                  <View style={styles.weightClassRow}>
                    {preferredWeightClasses.map((wc) => {
                      const isPrimary = wc === fighter.weight_class;
                      return (
                        <View
                          key={wc}
                          style={[
                            styles.weightClassPill,
                            isPrimary && styles.weightClassPillActive,
                          ]}
                        >
                          {isPrimary && <View style={styles.weightClassDot} />}
                          <Text
                            style={[
                              styles.weightClassText,
                              isPrimary && styles.weightClassTextActive,
                            ]}
                          >
                            {wc}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </AnimatedListItem>
            )}

            {/* Primary Gym Hero Card */}
            {affiliatedGym && (
              <AnimatedListItem index={1}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Primary Gym</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('GymProfileView', {
                        gymId: affiliatedGym.id,
                      })
                    }
                    style={styles.gymHeroCard}
                  >
                    {affiliatedGym.logo_url ? (
                      <Image
                        source={{ uri: affiliatedGym.logo_url }}
                        style={styles.gymHeroImage}
                      />
                    ) : (
                      <View style={styles.gymHeroPlaceholder}>
                        <Ionicons name="business" size={48} color={colors.textMuted} />
                      </View>
                    )}
                    <LinearGradient
                      colors={gradients.heroOverlay}
                      style={styles.gymHeroOverlay}
                    >
                      <View style={styles.gymHeroContent}>
                        <Text style={styles.gymHeroName}>{affiliatedGym.name}</Text>
                        {(affiliatedGym.city || affiliatedGym.country) && (
                          <Text style={styles.gymHeroLocation}>
                            {[affiliatedGym.city, affiliatedGym.country]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                        )}
                        <View style={styles.gymHeroBtn}>
                          <Text style={styles.gymHeroBtnText}>VIEW GYM</Text>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={colors.textPrimary}
                          />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </AnimatedListItem>
            )}

            {/* Fighter Info */}
            <AnimatedListItem index={2}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fighter Info</Text>
                <GlassCard intensity="light">
                  <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Weight Class</Text>
                        <Text style={styles.infoValue}>
                          {fighter.weight_class || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Experience</Text>
                        <Text style={styles.infoValue}>
                          {fighter.experience_level || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Height</Text>
                        <Text style={styles.infoValue}>
                          {formatHeight(fighter.height_cm)}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Reach</Text>
                        <Text style={styles.infoValue}>
                          {formatReach(fighter.reach_cm)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Stance</Text>
                        <Text style={styles.infoValue}>
                          {fighter.stance || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Record</Text>
                        <Text style={styles.infoValue}>
                          {fighter.record || '0-0-0'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </View>
            </AnimatedListItem>
          </>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    padding: spacing[1],
  },
  headerUsername: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginLeft: spacing[3],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  // Main container
  container: {
    flex: 1,
  },

  // Profile Header Row (avatar + stats)
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing[5],
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.background,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Row
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Name Section
  nameSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  fullName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  nickname: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  roleSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing[1],
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
  },
  bioText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing[2],
  },

  // Sport Pills
  sportPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  sportPill: {
    backgroundColor: `${colors.primary[500]}15`,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  sportPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[400],
  },

  // CTA Buttons
  ctaRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  ctaGradient: {
    flex: 1,
  },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  ctaSecondaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.textPrimary,
  },

  // Photo Grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  emptyGrid: {
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[4],
  },

  // Schedule Tab
  scheduleContainer: {
    paddingTop: spacing[3],
  },
  daySelector: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingBottom: spacing[3],
  },
  dayChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  dayChipActive: {
    backgroundColor: colors.primary[500],
  },
  dayChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  dayChipTextActive: {
    color: colors.textPrimary,
  },
  slotsContainer: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingBottom: spacing[4],
  },
  noSlotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  noSlotsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotInfo: {
    flex: 1,
  },
  slotLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  slotTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  slotBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  slotBadgeAvailable: {
    backgroundColor: `${colors.success}20`,
  },
  slotBadgeBooked: {
    backgroundColor: `${colors.primary[500]}20`,
  },
  slotBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  slotBadgeTextAvailable: {
    color: colors.success,
  },
  slotBadgeTextBooked: {
    color: colors.primary[400],
  },

  // Sections
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[3],
  },

  // Weight Classes
  weightClassRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  weightClassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    gap: spacing[1],
  },
  weightClassPillActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}15`,
  },
  weightClassDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
  },
  weightClassText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  weightClassTextActive: {
    color: colors.textPrimary,
  },

  // Gym Hero Card
  gymHeroCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 180,
  },
  gymHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gymHeroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing[4],
  },
  gymHeroContent: {},
  gymHeroName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  gymHeroLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
  gymHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary[500]}CC`,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  gymHeroBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },

  // Fighter Info Grid
  infoGrid: {
    gap: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoItem: {
    flex: 1,
    padding: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
