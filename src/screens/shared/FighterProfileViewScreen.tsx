import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { getOrCreateConversation } from '../../services/messaging';


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

const MOCK_FIGHTER: FighterProfile = {
  id: '1',
  user_id: 'user1',
  first_name: 'Marcus',
  last_name: 'Petrov',
  nickname: 'The Hammer',
  bio: 'Professional boxer with 5 years of experience. Always looking to improve and train with dedicated fighters.',
  age: 28,
  weight_class: 'Middleweight',
  experience_level: 'Advanced',
  record: '18-3-0',
  city: 'Berlin',
  country: 'Germany',
  height_cm: 183,
  reach_cm: 188,
  stance: 'Orthodox',
  fights_count: 21,
  sparring_count: 156,
  instagram: '@marcushammer',
};

export function FighterProfileViewScreen({ navigation, route }: any) {
  const { profile: currentUserProfile, user } = useAuth();
  const { fighterId } = route.params;
  const [fighter, setFighter] = useState<FighterProfile>(MOCK_FIGHTER);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [affiliatedGym, setAffiliatedGym] = useState<AffiliatedGym | null>(null);
  const [coaches, setCoaches] = useState<AffiliatedCoach[]>([]);

  const isOwnProfile = currentUserProfile && 'first_name' in currentUserProfile &&
    (currentUserProfile as any).id === fighterId;

  useEffect(() => {
    loadFighterProfile();
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

  const loadAffiliations = async (gymId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // Fetch affiliated gym
      const { data: gymData } = await supabase
        .from('gyms')
        .select('id, name, logo_url, city, country')
        .eq('id', gymId)
        .single();

      if (gymData) setAffiliatedGym(gymData);

      // Fetch coaches from same gym
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

  const handleMessage = async () => {
    if (!user?.id || !fighter.user_id) {
      Alert.alert('Error', 'Unable to start conversation');
      return;
    }

    setStartingChat(true);
    try {
      const conversationId = await getOrCreateConversation(user.id, fighter.user_id);
      navigation.navigate('Chat', {
        conversationId,
        otherUserId: fighter.user_id,
        name: `${fighter.first_name} ${fighter.last_name}`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('FighterProfile');
  };

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fighter Profile</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            {fighter.avatar_url ? (
              <Image source={{ uri: fighter.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={64} color={colors.textMuted} />
              </View>
            )}
          </View>

          <Text style={styles.name}>
            {fighter.first_name} {fighter.last_name}
          </Text>

          {fighter.nickname && (
            <Text style={styles.nickname}>"{fighter.nickname}"</Text>
          )}

          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.textMuted} />
            <Text style={styles.location}>
              {fighter.city}, {fighter.country}
            </Text>
          </View>

          {!isOwnProfile && (
            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
              disabled={startingChat}
            >
              {startingChat ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="chatbubble" size={18} color={colors.textPrimary} />
                  <Text style={styles.messageButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fighter.record || '0-0-0'}</Text>
            <Text style={styles.statLabel}>Record</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fighter.fights_count || 0}</Text>
            <Text style={styles.statLabel}>Fights</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fighter.sparring_count || 0}</Text>
            <Text style={styles.statLabel}>Sparring</Text>
          </View>
        </View>

        {/* Bio */}
        {fighter.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{fighter.bio}</Text>
          </View>
        )}

        {/* Fighter Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fighter Info</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Weight Class</Text>
                <Text style={styles.infoValue}>{fighter.weight_class || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>{fighter.experience_level || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{formatHeight(fighter.height_cm)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Reach</Text>
                <Text style={styles.infoValue}>{formatReach(fighter.reach_cm)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Stance</Text>
                <Text style={styles.infoValue}>{fighter.stance || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{fighter.age || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Social Media */}
        {(fighter.instagram || fighter.facebook || fighter.tiktok || fighter.youtube) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media</Text>
            <View style={styles.socialLinks}>
              {fighter.instagram && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-instagram" size={24} color={colors.textPrimary} />
                  <Text style={styles.socialText}>{fighter.instagram}</Text>
                </TouchableOpacity>
              )}
              {fighter.facebook && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-facebook" size={24} color={colors.textPrimary} />
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              )}
              {fighter.tiktok && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-tiktok" size={24} color={colors.textPrimary} />
                  <Text style={styles.socialText}>{fighter.tiktok}</Text>
                </TouchableOpacity>
              )}
              {fighter.youtube && (
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-youtube" size={24} color={colors.textPrimary} />
                  <Text style={styles.socialText}>YouTube</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Affiliations Section */}
        {(affiliatedGym || coaches.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Affiliations</Text>

            {/* Gym */}
            {affiliatedGym && (
              <TouchableOpacity
                style={styles.gymCard}
                onPress={() => navigation.navigate('GymProfileView', { gymId: affiliatedGym.id })}
              >
                <View style={styles.gymIconContainer}>
                  {affiliatedGym.logo_url ? (
                    <Image source={{ uri: affiliatedGym.logo_url }} style={styles.gymLogo} />
                  ) : (
                    <Ionicons name="business" size={28} color={colors.primary[500]} />
                  )}
                </View>
                <View style={styles.gymInfo}>
                  <Text style={styles.gymName}>{affiliatedGym.name}</Text>
                  <Text style={styles.gymLocation}>
                    {affiliatedGym.city}, {affiliatedGym.country}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            {/* Coaches */}
            {coaches.length > 0 && (
              <View style={styles.coachesSection}>
                <Text style={styles.subsectionTitle}>Coaches</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.coachesScroll}
                >
                  {coaches.map((coach) => (
                    <TouchableOpacity
                      key={coach.id}
                      style={styles.coachCard}
                      onPress={() => navigation.navigate('CoachProfileView', { coachId: coach.id })}
                    >
                      {coach.avatar_url ? (
                        <Image source={{ uri: coach.avatar_url }} style={styles.coachAvatar} />
                      ) : (
                        <View style={styles.coachAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color={colors.textMuted} />
                        </View>
                      )}
                      <Text style={styles.coachName} numberOfLines={1}>
                        {coach.first_name}
                      </Text>
                      {coach.specializations && coach.specializations.length > 0 && (
                        <Text style={styles.coachSpecialization} numberOfLines={1}>
                          {coach.specializations[0]}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
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
  container: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: spacing[4],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary[500],
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.border,
  },
  name: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  nickname: {
    fontSize: typography.fontSize.xl,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[4],
  },
  location: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
  },
  messageButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  section: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[3],
  },
  bioText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
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
  socialLinks: {
    gap: spacing[2],
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  socialText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  gymIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  gymLogo: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[0.5] || 2,
  },
  gymLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  coachesSection: {
    marginTop: spacing[2],
  },
  subsectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
  coachesScroll: {
    gap: spacing[3],
  },
  coachCard: {
    alignItems: 'center',
    width: 72,
  },
  coachAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceLight,
  },
  coachAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  coachSpecialization: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing[0.5] || 2,
  },
});
