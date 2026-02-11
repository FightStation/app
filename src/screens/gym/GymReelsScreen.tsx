import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';
import {
  GlassCard,
  GradientButton,
  EmptyState,
  SectionHeader,
} from '../../components';

type GymReelsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type Reel = {
  id: string;
  gymId: string;
  gymName: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock reels for demo mode
const MOCK_REELS: Reel[] = [
  {
    id: '1',
    gymId: 'gym1',
    gymName: 'Elite Boxing Club',
    videoUrl: 'https://example.com/video1.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
    caption: 'Morning training session. Heavy bag work with the team #boxing #training',
    likes: 245,
    comments: 18,
    createdAt: '2h ago',
    isLiked: false,
  },
  {
    id: '2',
    gymId: 'gym2',
    gymName: 'Iron Fist Gym',
    videoUrl: 'https://example.com/video2.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=400',
    caption: 'Sparring highlights from today. Technical work at its finest',
    likes: 389,
    comments: 32,
    createdAt: '5h ago',
    isLiked: true,
  },
  {
    id: '3',
    gymId: 'gym3',
    gymName: 'Champion Boxing',
    videoUrl: 'https://example.com/video3.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400',
    caption: 'New fighters crushing their first week! Welcome to the family',
    likes: 512,
    comments: 45,
    createdAt: '1d ago',
    isLiked: false,
  },
  {
    id: '4',
    gymId: 'gym1',
    gymName: 'Elite Boxing Club',
    videoUrl: 'https://example.com/video4.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
    caption: 'Speed bag drill demonstration. Watch and learn!',
    likes: 178,
    comments: 12,
    createdAt: '2d ago',
    isLiked: false,
  },
];

export function GymReelsScreen({ navigation }: GymReelsScreenProps) {
  const { profile } = useAuth();
  const [reels, setReels] = useState<Reel[]>(MOCK_REELS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    if (!isSupabaseConfigured) {
      setReels(MOCK_REELS);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gym_reels')
        .select(`
          *,
          gyms (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReels(data || []);
    } catch (error) {
      console.error('Error loading reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant media library access to upload videos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        if (!isSupabaseConfigured) {
          Alert.alert('Success', 'Video uploaded! (Demo mode)');
          return;
        }

        // In production, upload video to Supabase Storage
        Alert.alert('Upload', 'Video upload functionality will be available in production');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Error', 'Failed to upload video');
    }
  };

  const handleLike = async (reelId: string) => {
    setReels(
      reels.map((reel) =>
        reel.id === reelId
          ? {
              ...reel,
              isLiked: !reel.isLiked,
              likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
            }
          : reel
      )
    );

    if (!isSupabaseConfigured) return;

    // In production, update like in database
    try {
      // Implementation would go here
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderReelCard = (item: Reel) => (
    <GlassCard key={item.id} style={styles.reelCard} noPadding>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
        <View style={styles.playOverlaySmall}>
          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={12} color={colors.textPrimary} />
          <Text style={styles.durationText}>0:45</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.reelContent}>
        <View style={styles.reelHeader}>
          <View style={styles.gymAvatar}>
            <Ionicons name="business" size={18} color={colors.textPrimary} />
          </View>
          <View style={styles.reelHeaderInfo}>
            <Text style={styles.gymNameCard}>{item.gymName}</Text>
            <Text style={styles.timestamp}>{item.createdAt}</Text>
          </View>
        </View>

        <Text style={styles.captionCard} numberOfLines={2}>
          {item.caption}
        </Text>

        {/* Stats */}
        <View style={styles.reelStats}>
          <TouchableOpacity
            style={styles.statButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? colors.error : colors.textMuted}
            />
            <Text style={styles.statText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
            <Text style={styles.statText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="paper-plane-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );

  const renderMobileReel = ({ item, index }: { item: Reel; index: number }) => {
    return (
      <View style={styles.reelContainer}>
        {/* Video/Thumbnail */}
        <Image source={{ uri: item.thumbnailUrl }} style={styles.video} />

        {/* Play icon overlay */}
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
        </View>

        {/* Gym Info Overlay */}
        <View style={styles.overlay}>
          <View style={styles.topInfo}>
            <GlassCard intensity="dark" noPadding style={styles.gymHeaderCard}>
              <View style={styles.gymHeader}>
                <View style={styles.gymAvatarLarge}>
                  <Ionicons name="business" size={20} color={colors.textPrimary} />
                </View>
                <Text style={styles.gymName}>{item.gymName}</Text>
              </View>
            </GlassCard>
            <Text style={styles.timestampMobile}>{item.createdAt}</Text>
          </View>

          <View style={styles.bottomInfo}>
            <View style={styles.captionContainer}>
              <Text style={styles.caption} numberOfLines={2}>
                {item.caption}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike(item.id)}
              >
                <Ionicons
                  name={item.isLiked ? 'heart' : 'heart-outline'}
                  size={32}
                  color={item.isLiked ? colors.error : colors.textPrimary}
                />
                <Text style={styles.actionText}>{item.likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={30} color={colors.textPrimary} />
                <Text style={styles.actionText}>{item.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="paper-plane-outline" size={30} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="bookmark-outline" size={30} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Desktop layout - Grid view
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Header */}
        <View style={styles.desktopHeader}>
          <TouchableOpacity
            style={styles.backButtonDesktop}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.desktopHeaderTitle}>Training Videos</Text>
          <GradientButton
            title="Upload Video"
            icon="cloud-upload-outline"
            size="sm"
            onPress={handleUploadVideo}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.desktopScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.desktopCard}>
            {/* Icon and Title */}
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="videocam" size={32} color={colors.primary[500]} />
              </View>
              <Text style={styles.cardTitle}>Training Reels</Text>
              <Text style={styles.cardSubtitle}>
                Share training highlights, techniques, and gym moments with your community
              </Text>
            </View>

            {/* Reels Grid */}
            <View style={styles.reelsGrid}>
              {reels.map(renderReelCard)}
            </View>

            {reels.length === 0 && (
              <EmptyState
                icon="videocam-outline"
                title="No videos yet"
                description="Upload your first training video to share with fighters"
                actionLabel="Upload Video"
                onAction={handleUploadVideo}
              />
            )}

            {/* Info Box */}
            <GlassCard intensity="accent" style={styles.infoBox}>
              <View style={styles.infoBoxContent}>
                <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
                <Text style={styles.infoText}>
                  Upload short training videos (up to 60 seconds) to showcase your gym's
                  training style and attract new fighters.
                </Text>
              </View>
            </GlassCard>
          </GlassCard>
        </ScrollView>
      </View>
    );
  }

  // Mobile layout - Full screen reels
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Reels</Text>
        <TouchableOpacity onPress={handleUploadVideo}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderMobileReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Position indicator */}
      <View style={styles.positionIndicator}>
        {reels.map((_, index) => (
          <View
            key={index}
            style={[
              styles.positionDot,
              index === currentIndex && styles.positionDotActive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
  },
  desktopHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  desktopScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing[8],
  },
  desktopCard: {
    width: '100%',
    maxWidth: 900,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  cardTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  cardSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 22,
  },
  reelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  reelCard: {
    width: '48%',
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 9 / 16,
    maxHeight: 280,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
  },
  playOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  reelContent: {
    padding: spacing[4],
  },
  reelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  gymAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelHeaderInfo: {
    flex: 1,
  },
  gymNameCard: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  captionCard: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing[3],
  },
  reelStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  infoBox: {
    // handled by GlassCard accent
  },
  infoBoxContent: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Mobile full-screen reel styles
  reelContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  topInfo: {
    alignItems: 'flex-start',
  },
  gymHeaderCard: {
    borderRadius: borderRadius.full,
  },
  gymHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  gymAvatarLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  timestampMobile: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[1],
    marginLeft: spacing[3],
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  captionContainer: {
    flex: 1,
    marginRight: spacing[4],
  },
  caption: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actions: {
    alignItems: 'center',
    gap: spacing[4],
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing[1],
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  positionIndicator: {
    position: 'absolute',
    right: spacing[2],
    top: '50%',
    transform: [{ translateY: -50 }],
    gap: spacing[2],
  },
  positionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  positionDotActive: {
    backgroundColor: colors.primary[500],
    height: 12,
  },
});
