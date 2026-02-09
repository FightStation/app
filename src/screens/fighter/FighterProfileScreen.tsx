import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { Fighter, WEIGHT_CLASS_LABELS, EXPERIENCE_LABELS } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { pickImage, uploadFighterPhoto } from '../../lib/storage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type FighterProfileScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

// Mock data for the profile
const mockProfileData = {
  name: "MARCUS 'THE HAMMER' PETROV",
  shortName: 'Marcus Petrov',
  age: 26,
  pugilId: 'PUGIL-00452',
  affiliatedGym: 'Elite Boxing Academy',
  isActive: true,
  weight: 'CRUISER',
  stance: 'ORTHODOX',
  experience: 'AM',
  record: '8-2-0',
  warriorStatus: 'IRON TIER',
  badges: ['PRO ATHLETE', 'VERIFIED PRO'],
  division: 'LHW DIVISION',
  stats: {
    bouts: 42,
    gyms: 12,
    streak: '15D',
  },
  grindData: {
    consistencyIndex: 94,
    // 7x4 grid representing weekly activity over 4 weeks
    heatmap: [
      [3, 2, 3, 2, 1, 0, 3],
      [2, 3, 1, 2, 3, 2, 1],
      [3, 2, 3, 3, 2, 1, 2],
      [2, 1, 2, 3, 2, 3, 3],
    ],
    weeklyVolume: '14.5 HRS',
    intensity: 'HIGH',
  },
  languages: ['English', 'German', 'Bulgarian'],
  trainingReels: [
    { id: '1', title: 'Shadow Work', thumbnail: null },
    { id: '2', title: 'Heavy Bag Power', thumbnail: null },
  ],
  sparringIntensity: 0.7, // 0-1 scale, 0.7 = hard/competitive
  battleHistory: [
    {
      id: '1',
      date: 'OCT 24',
      year: '2023',
      gym: 'THE RING BERLIN',
      verified: true,
      type: 'Heavy Sparring • 8 Rounds',
      difficulty: 'HARD',
    },
    {
      id: '2',
      date: 'OCT 20',
      year: '2023',
      gym: 'HAMMER BOX-CLUB',
      verified: true,
      type: 'Technical Sparring • 12 Rounds',
      difficulty: 'MED',
    },
    {
      id: '3',
      date: 'OCT 15',
      year: '2023',
      gym: 'UNDERGROUND MMA',
      verified: false,
      type: 'Clinch Work • 4 Rounds',
      difficulty: 'LOW',
    },
  ],
  recentActivity: [
    { id: '1', title: 'Heavy Bag Session', subtitle: 'Yesterday • Elite Boxing Academy', xp: '+450 XP', icon: 'fitness' },
    { id: '2', title: 'Technical Sparring', subtitle: '2 days ago • 8 Rounds', xp: '+620 XP', icon: 'people' },
  ],
  bio: 'Explosive counterpuncher with devastating right hand punching. Currently training for the European Amateur Championships.',
};

export function FighterProfileScreen({ navigation }: FighterProfileScreenProps) {
  const { profile, signOut } = useAuth();
  const fighter = profile as Fighter;
  const [activeTab, setActiveTab] = useState<'stats' | 'training'>('stats');
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'HARD': return colors.primary[500];
      case 'MED': return colors.warning;
      case 'LOW': return colors.success;
      default: return colors.textMuted;
    }
  };

  const getHeatmapColor = (value: number) => {
    switch (value) {
      case 0: return colors.surfaceLight;
      case 1: return `${colors.primary[500]}40`;
      case 2: return `${colors.primary[500]}80`;
      case 3: return colors.primary[500];
      default: return colors.surfaceLight;
    }
  };

  const handleUploadPhoto = async () => {
    try {
      // Pick image
      const image = await pickImage();
      if (!image) return;

      setUploading(true);

      // Upload to Supabase Storage
      const publicUrl = await uploadFighterPhoto(fighter?.id || 'demo', image.uri);

      // Update fighter profile with new image URL
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

            {/* Badge */}
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO ATHLETE</Text>
            </View>

            {/* Name & Info */}
            <View style={styles.heroContent}>
              <Text style={styles.fighterName}>{mockProfileData.name}</Text>
              <View style={styles.fighterMeta}>
                <Text style={styles.fighterAge}>Age: {mockProfileData.age}</Text>
                <Text style={styles.fighterMetaDot}>•</Text>
                <Text style={styles.fighterPugilId}>{mockProfileData.pugilId}</Text>
              </View>
            </View>
          </View>

          {/* Affiliated Gym Card */}
          <View style={styles.gymCard}>
            <View style={styles.gymCardLeft}>
              <View style={styles.gymLogo}>
                <Text style={styles.gymLogoText}>E</Text>
              </View>
              <View>
                <Text style={styles.gymLabel}>AFFILIATED GYM</Text>
                <Text style={styles.gymName}>{mockProfileData.affiliatedGym}</Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>WEIGHT</Text>
              <Text style={styles.quickStatValue}>{mockProfileData.weight}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>STANCE</Text>
              <Text style={styles.quickStatValue}>{mockProfileData.stance}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>EXP.</Text>
              <Text style={styles.quickStatValue}>{mockProfileData.experience}</Text>
              <Text style={styles.quickStatRecord}>{mockProfileData.record}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
              onPress={() => setActiveTab('stats')}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
                STATS & BIO
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'training' && styles.tabActive]}
              onPress={() => setActiveTab('training')}
            >
              <Text style={[styles.tabText, activeTab === 'training' && styles.tabTextActive]}>
                TRAINING
              </Text>
            </TouchableOpacity>
          </View>

          {/* Request Sparring Button */}
          <TouchableOpacity style={styles.requestButton}>
            <Ionicons name="flash" size={18} color={colors.textPrimary} />
            <Text style={styles.requestButtonText}>REQUEST SPARRING</Text>
          </TouchableOpacity>

          {/* Bio Section */}
          <Text style={styles.bioText}>{mockProfileData.bio}</Text>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LANGUAGES</Text>
            <View style={styles.tagsRow}>
              {mockProfileData.languages.map((lang, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Training Reels */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TRAINING REELS</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.reelsRow}>
              {mockProfileData.trainingReels.map((reel) => (
                <View key={reel.id} style={styles.reelCard}>
                  <View style={styles.reelThumbnail}>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={20} color={colors.textPrimary} />
                    </View>
                  </View>
                  <Text style={styles.reelTitle}>{reel.title}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sparring Intensity */}
          <View style={styles.intensityCard}>
            <View style={styles.intensityHeader}>
              <Text style={styles.sectionLabel}>SPARRING INTENSITY</Text>
              <Text style={styles.intensitySubtitle}>CURRENT CAMP</Text>
            </View>
            <View style={styles.intensitySlider}>
              <View style={styles.intensityTrack}>
                <View
                  style={[
                    styles.intensityFill,
                    { width: `${mockProfileData.sparringIntensity * 100}%` }
                  ]}
                />
                <View
                  style={[
                    styles.intensityThumb,
                    { left: `${mockProfileData.sparringIntensity * 100 - 2}%` }
                  ]}
                />
              </View>
              <View style={styles.intensityLabels}>
                <Text style={styles.intensityLabelText}>TECHNICAL</Text>
                <Text style={[styles.intensityLabelText, styles.intensityLabelActive]}>
                  HARD / COMPETITIVE
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
            {mockProfileData.recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name={activity.icon as any}
                    size={20}
                    color={colors.primary[500]}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                </View>
                <Text style={styles.activityXp}>{activity.xp}</Text>
              </View>
            ))}
          </View>

          {/* Refer Friends Button */}
          <TouchableOpacity
            style={styles.referButton}
            onPress={() => navigation?.navigate('ReferralDashboard')}
          >
            <Ionicons name="gift" size={20} color={colors.textPrimary} />
            <Text style={styles.referButtonText}>Refer Friends & Earn</Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </TouchableOpacity>

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
  proBadge: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[4],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  proBadgeText: {
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
  fighterPugilId: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  // Gym Card
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceLight,
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
  gymName: {
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
  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  quickStatValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  quickStatRecord: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[0.5],
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[1],
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  // Request Button
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  requestButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  // Bio
  bioText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  // Sections
  section: {
    marginHorizontal: spacing[4],
    marginTop: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionLabel: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  viewAllText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  // Reels
  reelsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  reelCard: {
    width: 120,
  },
  reelThumbnail: {
    width: 120,
    height: 160,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[2],
  },
  // Intensity
  intensityCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[5],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  intensitySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  intensitySlider: {
    marginTop: spacing[2],
  },
  intensityTrack: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    position: 'relative',
  },
  intensityFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  intensityThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.textPrimary,
    borderWidth: 3,
    borderColor: colors.primary[500],
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
  intensityLabelText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  intensityLabelActive: {
    color: colors.primary[500],
  },
  // Activity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  activityTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  activitySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[0.5],
  },
  activityXp: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  // Refer Button
  referButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  referButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  newBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
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
