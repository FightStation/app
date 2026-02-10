import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Fighter, WEIGHT_CLASS_LABELS, EXPERIENCE_LABELS } from '../../types';
import { colors, spacing, typography, borderRadius, gradients } from '../../lib/theme';
import { pickImage, uploadFighterPhoto } from '../../lib/storage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
} from '../../components';

type FighterProfileScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function FighterProfileScreen({ navigation }: FighterProfileScreenProps) {
  const { profile, signOut } = useAuth();
  const fighter = profile as Fighter;
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [gymName, setGymName] = useState<string | null>(null);

  useEffect(() => {
    if (fighter?.gym_id) {
      loadGymName(fighter.gym_id);
    }
  }, [fighter?.gym_id]);

  const loadGymName = async (gymId: string) => {
    if (!isSupabaseConfigured) {
      setGymName('Demo Gym');
      return;
    }
    try {
      const { data } = await supabase
        .from('gyms')
        .select('name')
        .eq('id', gymId)
        .single();
      if (data) setGymName(data.name);
    } catch (error) {
      console.error('Error loading gym name:', error);
    }
  };

  const displayName = fighter?.nickname
    ? `${fighter.first_name} '${fighter.nickname}' ${fighter.last_name}`
    : `${fighter?.first_name || ''} ${fighter?.last_name || ''}`;

  const handleUploadPhoto = async () => {
    try {
      const image = await pickImage();
      if (!image) return;

      setUploading(true);

      const publicUrl = await uploadFighterPhoto(fighter?.id || 'demo', image.uri);

      if (isSupabaseConfigured && fighter?.id) {
        const { error } = await supabase
          .from('fighters')
          .update({ avatar_url: publicUrl })
          .eq('id', fighter.id);

        if (error) throw error;
      }

      setProfileImageUrl(publicUrl);
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FIGHTER PROFILE</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image Section */}
          <View style={styles.heroSection}>
            <Image
              source={{
                uri:
                  profileImageUrl ||
                  fighter?.avatar_url ||
                  'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&h=400&fit=crop',
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />

            {/* Upload Photo Button */}
            <TouchableOpacity
              style={styles.uploadPhotoButton}
              onPress={handleUploadPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="camera" size={20} color={colors.textPrimary} />
                  <Text style={styles.uploadPhotoText}>Change Photo</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Experience Badge */}
            {fighter?.experience_level && (
              <View style={styles.expBadge}>
                <Text style={styles.expBadgeText}>
                  {EXPERIENCE_LABELS[fighter.experience_level]}
                </Text>
              </View>
            )}

            {/* Name & Info */}
            <View style={styles.heroContent}>
              <Text style={styles.fighterName}>{displayName.trim() || 'Fighter'}</Text>
              <View style={styles.fighterMeta}>
                {fighter?.age && (
                  <Text style={styles.fighterAge}>Age: {fighter.age}</Text>
                )}
                {fighter?.age && fighter?.city && (
                  <Text style={styles.fighterMetaDot}>{'\u2022'}</Text>
                )}
                {fighter?.city && (
                  <Text style={styles.fighterCity}>
                    {fighter.city}{fighter.country ? `, ${fighter.country}` : ''}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Affiliated Gym Card */}
          {(gymName || fighter?.gym_id) && (
            <View style={styles.sectionSpacing}>
              <GlassCard>
                <View style={styles.gymCardInner}>
                  <View style={styles.gymCardLeft}>
                    <LinearGradient
                      colors={gradients.primaryToCrimson}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gymLogo}
                    >
                      <Text style={styles.gymLogoText}>
                        {(gymName || 'G').charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.gymLabel}>AFFILIATED GYM</Text>
                      <Text style={styles.gymNameText}>{gymName || 'Loading...'}</Text>
                    </View>
                  </View>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>ACTIVE</Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Quick Stats Row */}
          <View style={styles.sectionSpacing}>
            <SectionHeader title="Quick Stats" />
            <View style={styles.statCardRow}>
              <StatCard
                icon="barbell"
                value={fighter?.weight_class ? WEIGHT_CLASS_LABELS[fighter.weight_class] : '\u2014'}
                label="Weight"
                accentColor={colors.primary[500]}
              />
              <StatCard
                icon="hand-left"
                value={fighter?.stance?.toUpperCase() || '\u2014'}
                label="Stance"
                accentColor={colors.secondary[500]}
              />
              <StatCard
                icon="trophy"
                value={fighter?.record || '0-0-0'}
                label="Record"
                accentColor={colors.accent.gold}
              />
            </View>
          </View>

          {/* Fight Stats */}
          <View style={styles.sectionSpacing}>
            <SectionHeader title="Fight Stats" />
            <View style={styles.statCardRow}>
              <StatCard
                icon="fitness"
                value={fighter?.fights_count || 0}
                label="Fights"
                accentColor={colors.primary[500]}
              />
              <StatCard
                icon="people"
                value={fighter?.sparring_count || 0}
                label="Sparring"
                accentColor={colors.info}
              />
              {fighter?.sports && fighter.sports.length > 0 && (
                <StatCard
                  icon="flash"
                  value={fighter.sports.length}
                  label="Sports"
                  accentColor={colors.warning}
                />
              )}
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.sectionSpacing}>
            <SectionHeader title="Bio" />
            <GlassCard>
              {fighter?.bio ? (
                <Text style={styles.bioText}>{fighter.bio}</Text>
              ) : (
                <Text style={styles.bioPlaceholder}>No bio added yet</Text>
              )}
            </GlassCard>
          </View>

          {/* Refer Friends Button */}
          <View style={styles.buttonSpacing}>
            <GradientButton
              title="Refer Friends & Earn"
              onPress={() => navigation?.navigate('ReferralDashboard')}
              icon="gift"
              fullWidth
              size="lg"
            />
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[10],
  },
  // Hero Section
  heroSection: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  uploadPhotoButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  uploadPhotoText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  expBadge: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[4],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  expBadgeText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  heroContent: {
    position: 'absolute',
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
  },
  fighterName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fighterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  fighterAge: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  fighterMetaDot: {
    color: colors.textMuted,
    marginHorizontal: spacing[2],
  },
  fighterCity: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  // Section spacing
  sectionSpacing: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  // Gym Card inner
  gymCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  gymLogo: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymLogoText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  gymLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.5,
  },
  gymNameText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  activeText: {
    color: colors.success,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  // Stat card row
  statCardRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  // Bio
  bioText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
  },
  bioPlaceholder: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  // Buttons
  buttonSpacing: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  bottomPadding: {
    height: spacing[10],
  },
});
