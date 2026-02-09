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

type CoachProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  specializations?: string[];
  certifications?: string[];
  years_experience?: number;
  gym_id?: string;
};

type AffiliatedGym = {
  id: string;
  name: string;
  logo_url?: string;
  city?: string;
  country?: string;
};

type AffiliatedFighter = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  weight_class?: string;
};

const MOCK_COACH: CoachProfile = {
  id: '1',
  user_id: 'user1',
  first_name: 'John',
  last_name: 'Martinez',
  bio: 'Former professional boxer with 15 years of coaching experience. Specialized in technical boxing and conditioning.',
  specializations: ['Boxing', 'Conditioning', 'Footwork'],
  certifications: ['USA Boxing Level 3', 'NASM Personal Trainer'],
  years_experience: 15,
};

export function CoachProfileViewScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { coachId } = route.params;
  const [coach, setCoach] = useState<CoachProfile>(MOCK_COACH);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [affiliatedGym, setAffiliatedGym] = useState<AffiliatedGym | null>(null);
  const [fighters, setFighters] = useState<AffiliatedFighter[]>([]);

  useEffect(() => {
    loadCoachProfile();
  }, [coachId]);

  useEffect(() => {
    if (coach.gym_id) {
      loadAffiliations(coach.gym_id);
    }
  }, [coach.gym_id]);

  const loadCoachProfile = async () => {
    if (!isSupabaseConfigured) {
      setCoach(MOCK_COACH);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .single();

      if (error) throw error;
      if (data) setCoach(data);
    } catch (error) {
      console.error('Error loading coach:', error);
      Alert.alert('Error', 'Failed to load coach profile');
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

      // Fetch fighters from same gym
      const { data: fightersData } = await supabase
        .from('fighters')
        .select('id, first_name, last_name, avatar_url, weight_class')
        .eq('gym_id', gymId)
        .eq('is_active', true)
        .limit(10);

      if (fightersData) setFighters(fightersData);
    } catch (error) {
      console.error('Error loading affiliations:', error);
    }
  };

  const handleMessage = async () => {
    if (!user?.id || !coach.user_id) {
      Alert.alert('Error', 'Unable to start conversation');
      return;
    }

    setStartingChat(true);
    try {
      const conversationId = await getOrCreateConversation(user.id, coach.user_id);
      navigation.navigate('Chat', {
        conversationId,
        otherUserId: coach.user_id,
        name: `${coach.first_name} ${coach.last_name}`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            {coach.avatar_url ? (
              <Image source={{ uri: coach.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={64} color={colors.textMuted} />
              </View>
            )}
          </View>

          <Text style={styles.name}>
            {coach.first_name} {coach.last_name}
          </Text>

          <Text style={styles.roleLabel}>Coach</Text>

          {coach.years_experience && (
            <Text style={styles.experienceText}>
              {coach.years_experience} years experience
            </Text>
          )}

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
        </View>

        {/* Bio */}
        {coach.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{coach.bio}</Text>
          </View>
        )}

        {/* Specializations */}
        {coach.specializations && coach.specializations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.tagsContainer}>
              {coach.specializations.map((spec, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {coach.certifications && coach.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.certificationsList}>
              {coach.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <Ionicons name="ribbon" size={18} color={colors.primary[500]} />
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Affiliated Gym */}
        {affiliatedGym && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gym</Text>
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
          </View>
        )}

        {/* Fighters */}
        {fighters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fighters ({fighters.length})</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fightersScroll}
            >
              {fighters.map((fighter) => (
                <TouchableOpacity
                  key={fighter.id}
                  style={styles.fighterCard}
                  onPress={() => navigation.navigate('FighterProfileView', { fighterId: fighter.id })}
                >
                  {fighter.avatar_url ? (
                    <Image source={{ uri: fighter.avatar_url }} style={styles.fighterAvatar} />
                  ) : (
                    <View style={styles.fighterAvatarPlaceholder}>
                      <Ionicons name="person" size={20} color={colors.textMuted} />
                    </View>
                  )}
                  <Text style={styles.fighterName} numberOfLines={1}>
                    {fighter.first_name}
                  </Text>
                  {fighter.weight_class && (
                    <Text style={styles.fighterWeightClass} numberOfLines={1}>
                      {fighter.weight_class}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  roleLabel: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  experienceText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing[4],
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: `${colors.primary[500]}20`,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  certificationsList: {
    gap: spacing[2],
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  certificationText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
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
  fightersScroll: {
    gap: spacing[3],
  },
  fighterCard: {
    alignItems: 'center',
    width: 72,
  },
  fighterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceLight,
  },
  fighterAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fighterName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  fighterWeightClass: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing[0.5] || 2,
  },
});