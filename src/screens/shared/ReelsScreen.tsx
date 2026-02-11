import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Post, Fighter, Gym, Coach } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { GlassCard, GradientButton, EmptyState } from '../../components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelPost extends Post {
  author_fighter?: Fighter;
  author_gym?: Gym;
  author_coach?: Coach;
}

export function ReelsScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState<ReelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author_fighter:fighters!posts_author_id_fkey(*),
          author_gym:gyms!posts_author_id_fkey(*),
          author_coach:coaches!posts_author_id_fkey(*)
        `)
        .eq('status', 'active')
        .eq('post_type', 'reel')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Reels] Error loading reels:', error);
        setReels([]);
      } else {
        setReels(data || []);
      }

      // Get user's liked reels
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likesData) {
          setLikedReels(new Set(likesData.map(l => l.post_id)));
        }
      }
    } catch (err) {
      console.error('[Reels] Failed to load reels:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAuthorInfo = (reel: ReelPost) => {
    if (reel.author_type === 'fighter' && reel.author_fighter) {
      return {
        name: `${reel.author_fighter.first_name} ${reel.author_fighter.last_name}`,
        avatar: reel.author_fighter.avatar_url,
        id: reel.author_fighter.id,
        type: 'fighter' as const,
      };
    } else if (reel.author_type === 'gym' && reel.author_gym) {
      return {
        name: reel.author_gym.name,
        avatar: reel.author_gym.logo_url,
        id: reel.author_gym.id,
        type: 'gym' as const,
      };
    } else if (reel.author_type === 'coach' && reel.author_coach) {
      return {
        name: `${reel.author_coach.first_name} ${reel.author_coach.last_name}`,
        avatar: reel.author_coach.avatar_url,
        id: reel.author_coach.id,
        type: 'coach' as const,
      };
    }
    return { name: 'Unknown', avatar: null, id: '', type: 'fighter' as const };
  };

  const handleLike = async (reelId: string) => {
    if (!user) return;

    const isLiked = likedReels.has(reelId);

    // Optimistic update
    setLikedReels(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(reelId);
      } else {
        next.add(reelId);
      }
      return next;
    });

    setReels(prev => prev.map(r => {
      if (r.id === reelId) {
        return {
          ...r,
          likes_count: isLiked ? r.likes_count - 1 : r.likes_count + 1,
        };
      }
      return r;
    }));

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', reelId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: reelId, user_id: user.id });
      }
    } catch (err) {
      console.error('[Reels] Failed to toggle like:', err);
    }
  };

  const navigateToProfile = (authorType: string, authorId: string) => {
    if (authorType === 'fighter') {
      navigation.navigate('FighterProfileView', { fighterId: authorId });
    } else if (authorType === 'gym') {
      navigation.navigate('GymProfileView', { gymId: authorId });
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderReel = ({ item: reel, index }: { item: ReelPost; index: number }) => {
    const author = getAuthorInfo(reel);
    const isLiked = likedReels.has(reel.id);
    const isActive = index === currentIndex;
    const videoUrl = reel.media_urls?.[0];

    return (
      <View style={[styles.reelContainer, { height: SCREEN_HEIGHT - insets.bottom }]}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          {videoUrl ? (
            <Video
              source={{ uri: videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isActive}
              isLooping
              isMuted={false}
              useNativeControls={false}
            />
          ) : (
            <View style={styles.noVideoPlaceholder}>
              <Ionicons name="videocam-off" size={64} color={colors.textMuted} />
              <Text style={styles.noVideoText}>Video not available</Text>
            </View>
          )}

          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />
        </View>

        {/* Actions Sidebar */}
        <View style={[styles.actionsSidebar, { bottom: insets.bottom + 100 }]}>
          {/* Profile */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigateToProfile(author.type, author.id)}
          >
            <View style={styles.profileAvatarContainer}>
              {author.avatar ? (
                <Image source={{ uri: author.avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.profileAvatarInitials}>
                    {author.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.followBadge}>
                <Ionicons name="add" size={12} color={colors.textPrimary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Like */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleLike(reel.id)}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={32}
              color={isLiked ? colors.error : colors.textPrimary}
            />
            <Text style={styles.actionCount}>{reel.likes_count || 0}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={30} color={colors.textPrimary} />
            <Text style={styles.actionCount}>{reel.comments_count || 0}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="paper-plane-outline" size={30} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* More */}
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 20 }]}>
          <GlassCard intensity="dark" noPadding style={styles.bottomInfoCard}>
            {/* Author */}
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => navigateToProfile(author.type, author.id)}
            >
              <Text style={styles.authorName}>@{author.name.replace(/\s+/g, '_').toLowerCase()}</Text>
            </TouchableOpacity>

            {/* Caption */}
            {reel.content && (
              <Text style={styles.caption} numberOfLines={2}>
                {reel.content}
              </Text>
            )}

            {/* Music/Sound */}
            <View style={styles.soundRow}>
              <Ionicons name="musical-notes" size={14} color={colors.textPrimary} />
              <Text style={styles.soundText} numberOfLines={1}>
                Original audio - {author.name}
              </Text>
            </View>
          </GlassCard>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Reels</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('VideoShare')}
        >
          <Ionicons name="share-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('CreatePost', { postType: 'reel' })}
        >
          <Ionicons name="camera-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        {renderHeader()}
        <View style={styles.emptyContent}>
          <EmptyState
            icon="videocam-outline"
            title="No reels yet"
            description="Be the first to share a training reel!"
            actionLabel="Create Reel"
            onAction={() => navigation.navigate('CreatePost', { postType: 'reel' })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT - insets.bottom}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT - insets.bottom,
          offset: (SCREEN_HEIGHT - insets.bottom) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  createReelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    marginTop: spacing[6],
    gap: spacing[2],
  },
  createReelText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerButton: {
    padding: spacing[2],
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.background,
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    flex: 1,
  },
  noVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  noVideoText: {
    marginTop: spacing[4],
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Gradient not supported in React Native StyleSheet - use LinearGradient component for gradients
    backgroundColor: 'transparent',
  },
  actionsSidebar: {
    position: 'absolute',
    right: spacing[3],
    alignItems: 'center',
    gap: spacing[5],
  },
  actionItem: {
    alignItems: 'center',
  },
  profileAvatarContainer: {
    position: 'relative',
    marginBottom: spacing[2],
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  profileAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  profileAvatarInitials: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCount: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginTop: spacing[1],
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80,
    paddingHorizontal: spacing[4],
  },
  bottomInfoCard: {
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  authorName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  caption: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  soundText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
});
