import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Post, Fighter, Gym, Coach, SparringEvent, CombatSport, COMBAT_SPORT_SHORT } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { isDesktop } from '../../lib/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = isDesktop ? 600 : SCREEN_WIDTH;

interface FeedPost extends Post {
  author_fighter?: Fighter;
  author_gym?: Gym;
  author_coach?: Coach;
  event?: SparringEvent & { gym?: Gym };
}

type FeedTab = 'all' | 'gyms' | 'fighters';
type SportFilter = 'all' | CombatSport;

// Sport color helper
const getSportColor = (sport: CombatSport): string => {
  const sportColors: Record<CombatSport, string> = {
    boxing: colors.sport.boxing,
    mma: colors.sport.mma,
    muay_thai: colors.sport.muay_thai,
    kickboxing: colors.sport.kickboxing,
  };
  return sportColors[sport] || colors.primary[500];
};

const getSportBgColor = (sport: CombatSport): string => {
  const sportColors: Record<CombatSport, string> = {
    boxing: colors.sport.boxingLight,
    mma: colors.sport.mmaLight,
    muay_thai: colors.sport.muay_thaiLight,
    kickboxing: colors.sport.kickboxingLight,
  };
  return sportColors[sport] || `${colors.primary[500]}15`;
};

// Story item type
interface StoryItem {
  id: string;
  type: 'event' | 'training' | 'live';
  title: string;
  subtitle?: string;
  image?: string;
  avatar?: string;
  isLive?: boolean;
  eventDate?: string;
  gymId?: string;
  eventId?: string;
  sport?: CombatSport;
}

// Mock stories data
const getMockStories = (): StoryItem[] => [
  {
    id: 's1',
    type: 'event',
    title: 'Sparring Day',
    subtitle: 'Tomorrow 6PM',
    avatar: undefined,
    isLive: false,
    eventDate: new Date(Date.now() + 86400000).toISOString(),
    sport: 'boxing',
  },
  {
    id: 's2',
    type: 'live',
    title: 'Elite MMA',
    subtitle: 'LIVE NOW',
    avatar: undefined,
    isLive: true,
    sport: 'mma',
  },
  {
    id: 's3',
    type: 'training',
    title: 'Pad Work',
    subtitle: '2h ago',
    avatar: undefined,
    sport: 'muay_thai',
  },
  {
    id: 's4',
    type: 'event',
    title: 'Hard Rounds',
    subtitle: 'Fri 7PM',
    avatar: undefined,
    eventDate: new Date(Date.now() + 172800000).toISOString(),
    sport: 'kickboxing',
  },
  {
    id: 's5',
    type: 'training',
    title: 'Sparring Clips',
    subtitle: '5h ago',
    avatar: undefined,
    sport: 'boxing',
  },
];

// Discovery content for empty state
interface DiscoverItem {
  id: string;
  type: 'gym' | 'fighter' | 'event';
  name: string;
  subtitle: string;
  image?: string;
  stats?: string;
  sport?: CombatSport;
}

const getMockDiscovery = (): DiscoverItem[] => [
  { id: 'd1', type: 'gym', name: 'Elite Boxing Academy', subtitle: 'Berlin, Germany', stats: '234 members', sport: 'boxing' },
  { id: 'd2', type: 'fighter', name: 'Marcus Petrov', subtitle: 'Middleweight • Pro', stats: '12-2-0', sport: 'mma' },
  { id: 'd3', type: 'event', name: 'Technical Sparring', subtitle: 'Tomorrow 6PM', stats: '8 spots left', sport: 'muay_thai' },
  { id: 'd4', type: 'gym', name: 'Fight Factory', subtitle: 'Warsaw, Poland', stats: '156 members', sport: 'kickboxing' },
  { id: 'd5', type: 'fighter', name: 'Sarah Chen', subtitle: 'Lightweight • Advanced', stats: '8-1-0', sport: 'boxing' },
];

// All supported sports for filter
const SPORT_FILTERS: { key: SportFilter; label: string; color: string }[] = [
  { key: 'all', label: 'ALL', color: colors.primary[500] },
  { key: 'boxing', label: 'BOXING', color: colors.sport.boxing },
  { key: 'mma', label: 'MMA', color: colors.sport.mma },
  { key: 'muay_thai', label: 'MUAY THAI', color: colors.sport.muay_thai },
  { key: 'kickboxing', label: 'KICKBOXING', color: colors.sport.kickboxing },
];

const getAuthorSports = (post: FeedPost): CombatSport[] => {
  if (post.author_fighter?.sports) return post.author_fighter.sports;
  if (post.author_fighter?.primary_sport) return [post.author_fighter.primary_sport];
  if (post.author_gym?.sports) return post.author_gym.sports;
  return [];
};

export function FeedScreen({ navigation }: any) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories] = useState<StoryItem[]>(getMockStories());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [activeSport, setActiveSport] = useState<SportFilter>('all');
  const [lastTap, setLastTap] = useState<{ postId: string; time: number } | null>(null);
  const heartAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => {
    // Tab filter
    if (activeTab === 'gyms' && post.author_type !== 'gym') return false;
    if (activeTab === 'fighters' && post.author_type !== 'fighter') return false;

    // Sport filter
    if (activeSport !== 'all') {
      const authorSports = getAuthorSports(post);
      if (!authorSports.includes(activeSport)) return false;
    }

    return true;
  });

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          author_fighter:fighters!posts_author_id_fkey(*),
          author_gym:gyms!posts_author_id_fkey(*),
          author_coach:coaches!posts_author_id_fkey(*),
          event:sparring_events(*, gym:gyms(*))
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Feed] Error loading posts:', error);
        setPosts([]);
      } else {
        setPosts(postsData || []);
      }

      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (likesData) {
        setLikedPosts(new Set(likesData.map(l => l.post_id)));
      }
    } catch (err) {
      console.error('[Feed] Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  // Double-tap to like handler
  const handleDoubleTap = useCallback((postId: string) => {
    const now = Date.now();
    if (lastTap && lastTap.postId === postId && now - lastTap.time < 300) {
      // Double tap detected
      if (!likedPosts.has(postId)) {
        handleLike(postId);
        // Trigger heart animation
        if (!heartAnimations[postId]) {
          heartAnimations[postId] = new Animated.Value(0);
        }
        Animated.sequence([
          Animated.timing(heartAnimations[postId], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnimations[postId], {
            toValue: 0,
            duration: 300,
            delay: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
      setLastTap(null);
    } else {
      setLastTap({ postId, time: now });
    }
  }, [lastTap, likedPosts]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
        };
      }
      return p;
    }));

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      console.error('[Feed] Failed to toggle like:', err);
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    }
  };

  const getAuthorInfo = (post: FeedPost) => {
    if (post.author_type === 'fighter' && post.author_fighter) {
      const fighter = post.author_fighter;
      return {
        name: `${fighter.first_name} ${fighter.last_name}`,
        avatar: fighter.avatar_url,
        location: `${fighter.city}, ${fighter.country}`,
        id: fighter.id,
        type: 'fighter' as const,
        weightClass: fighter.weight_class,
        experience: fighter.experience_level,
        record: fighter.record,
      };
    } else if (post.author_type === 'gym' && post.author_gym) {
      return {
        name: post.author_gym.name,
        avatar: post.author_gym.logo_url,
        location: `${post.author_gym.city}, ${post.author_gym.country}`,
        id: post.author_gym.id,
        type: 'gym' as const,
      };
    } else if (post.author_type === 'coach' && post.author_coach) {
      return {
        name: `${post.author_coach.first_name} ${post.author_coach.last_name}`,
        avatar: post.author_coach.avatar_url,
        location: 'Coach',
        id: post.author_coach.id,
        type: 'coach' as const,
      };
    }
    return {
      name: 'Unknown',
      avatar: null,
      location: '',
      id: '',
      type: 'fighter' as const,
    };
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeightClassShort = (wc: string) => {
    const labels: Record<string, string> = {
      flyweight: 'FLY',
      bantamweight: 'BAN',
      featherweight: 'FEA',
      lightweight: 'LW',
      light_welterweight: 'LWW',
      welterweight: 'WW',
      light_middleweight: 'LMW',
      middleweight: 'MW',
      light_heavyweight: 'LHW',
      heavyweight: 'HW',
      super_heavyweight: 'SHW',
    };
    return labels[wc] || wc?.substring(0, 3).toUpperCase();
  };

  const getExperienceShort = (exp: string) => {
    const labels: Record<string, string> = {
      beginner: 'BEG',
      intermediate: 'INT',
      advanced: 'ADV',
      pro: 'PRO',
    };
    return labels[exp] || exp?.substring(0, 3).toUpperCase();
  };

  const navigateToProfile = (authorType: string, authorId: string) => {
    if (authorType === 'fighter') {
      navigation.navigate('FighterProfileView', { fighterId: authorId });
    } else if (authorType === 'gym') {
      navigation.navigate('GymProfileView', { gymId: authorId });
    } else if (authorType === 'coach') {
      navigation.navigate('CoachProfileView', { coachId: authorId });
    }
  };

  // Render Stories Row with sport-colored rings
  const renderStoriesRow = () => (
    <View style={styles.storiesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        {/* Add Story Button */}
        <TouchableOpacity
          style={styles.addStoryCard}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <View style={styles.addStoryIcon}>
            <Ionicons name="add" size={28} color={colors.primary[500]} />
          </View>
          <Text style={styles.storyLabel}>Your Story</Text>
        </TouchableOpacity>

        {/* Story Items with sport-colored rings */}
        {stories.map((story) => {
          const sportColor = story.sport ? getSportColor(story.sport) : colors.border;
          return (
            <TouchableOpacity
              key={story.id}
              style={styles.storyCard}
              onPress={() => {
                if (story.eventId) {
                  navigation.navigate('EventDetail', { eventId: story.eventId });
                }
              }}
            >
              <View style={[
                styles.storyRing,
                { borderColor: story.isLive ? colors.error : sportColor },
                story.isLive && styles.storyRingLive,
              ]}>
                <View style={styles.storyAvatar}>
                  {story.type === 'live' && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                  {story.type === 'event' && (
                    <Ionicons name="calendar" size={24} color={sportColor} />
                  )}
                  {story.type === 'training' && (
                    <Ionicons name="videocam" size={24} color={sportColor} />
                  )}
                </View>
                {/* Sport badge */}
                {story.sport && (
                  <View style={[styles.sportMicroBadge, { backgroundColor: sportColor }]}>
                    <Text style={styles.sportMicroBadgeText}>
                      {COMBAT_SPORT_SHORT[story.sport]}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>{story.title}</Text>
              <Text style={[
                styles.storySubtitle,
                story.isLive && styles.storySubtitleLive,
              ]} numberOfLines={1}>
                {story.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render Sport Filter Chips
  const renderSportFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.sportFilterContainer}
      contentContainerStyle={styles.sportFilterScroll}
    >
      {SPORT_FILTERS.map((filter) => {
        const isActive = activeSport === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.sportChip,
              isActive && { backgroundColor: filter.color, borderColor: filter.color },
            ]}
            onPress={() => setActiveSport(filter.key)}
          >
            {filter.key !== 'all' && (
              <View style={[
                styles.sportChipDot,
                { backgroundColor: isActive ? colors.textPrimary : filter.color },
              ]} />
            )}
            <Text style={[
              styles.sportChipText,
              isActive && styles.sportChipTextActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Render Fighter Badges
  const renderFighterBadges = (author: ReturnType<typeof getAuthorInfo>) => {
    if (author.type !== 'fighter') return null;

    return (
      <View style={styles.badgeRow}>
        {author.weightClass && (
          <View style={styles.badge}>
            <Ionicons name="barbell" size={10} color={colors.primary[400]} />
            <Text style={styles.badgeText}>{getWeightClassShort(author.weightClass)}</Text>
          </View>
        )}
        {author.experience && (
          <View style={[styles.badge, styles.badgeExperience]}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={[styles.badgeText, styles.badgeTextExperience]}>
              {getExperienceShort(author.experience)}
            </Text>
          </View>
        )}
        {author.record && (
          <View style={[styles.badge, styles.badgeRecord]}>
            <Text style={[styles.badgeText, styles.badgeTextRecord]}>{author.record}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderPostCard = ({ item: post }: { item: FeedPost }) => {
    const author = getAuthorInfo(post);
    const isLiked = likedPosts.has(post.id);
    const heartAnim = heartAnimations[post.id] || new Animated.Value(0);

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => navigateToProfile(author.type, author.id)}
        >
          <View style={styles.avatarContainer}>
            {author.avatar ? (
              <Image source={{ uri: author.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons
                  name={author.type === 'gym' ? 'business' : 'person'}
                  size={22}
                  color={colors.primary[500]}
                />
              </View>
            )}
            {/* Type indicator */}
            <View style={[
              styles.typeIndicator,
              author.type === 'gym' && styles.typeIndicatorGym,
            ]}>
              <Ionicons
                name={author.type === 'gym' ? 'business' : 'fitness'}
                size={10}
                color={colors.textPrimary}
              />
            </View>
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{author.name}</Text>
              {author.type === 'gym' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.info} />
                </View>
              )}
            </View>
            {author.type === 'fighter' ? (
              renderFighterBadges(author)
            ) : (
              <Text style={styles.postMeta}>
                {author.location} • {formatTimeAgo(post.created_at)}
              </Text>
            )}
            {author.type === 'fighter' && (
              <Text style={styles.postMetaSmall}>
                {author.location} • {formatTimeAgo(post.created_at)}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Post Content */}
        {post.content && (
          <Text style={styles.postContent}>{post.content}</Text>
        )}

        {/* Media with double-tap */}
        {post.media_urls && post.media_urls.length > 0 && (
          <Pressable
            style={styles.mediaContainer}
            onPress={() => handleDoubleTap(post.id)}
          >
            {post.media_type === 'video' ? (
              <View style={styles.videoPlaceholder}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={32} color={colors.textPrimary} />
                </View>
                <Text style={styles.videoText}>Tap to play</Text>
              </View>
            ) : (
              <Image
                source={{ uri: post.media_urls[0] }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}
            {post.media_urls.length > 1 && (
              <View style={styles.mediaCount}>
                <Text style={styles.mediaCountText}>+{post.media_urls.length - 1}</Text>
              </View>
            )}
            {/* Double-tap heart animation */}
            <Animated.View
              style={[
                styles.doubleTapHeart,
                {
                  opacity: heartAnim,
                  transform: [
                    {
                      scale: heartAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.3, 1],
                      }),
                    },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="heart" size={80} color={colors.primary[500]} />
            </Animated.View>
          </Pressable>
        )}

        {/* Event Share */}
        {post.post_type === 'event_share' && post.event && (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => navigation.navigate('EventDetail', { eventId: post.event?.id })}
          >
            <View style={styles.eventBanner}>
              <Ionicons name="flash" size={16} color={colors.primary[500]} />
              <Text style={styles.eventLabel}>SPARRING EVENT</Text>
            </View>
            <Text style={styles.eventTitle}>{post.event.title}</Text>
            <View style={styles.eventDetailsRow}>
              <View style={styles.eventDetailItem}>
                <Ionicons name="calendar" size={14} color={colors.textMuted} />
                <Text style={styles.eventDetailText}>
                  {new Date(post.event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.eventDetailItem}>
                <Ionicons name="time" size={14} color={colors.textMuted} />
                <Text style={styles.eventDetailText}>
                  {post.event.start_time}
                </Text>
              </View>
            </View>
            <View style={styles.eventFooter}>
              <Text style={styles.eventGym}>
                @ {post.event.gym?.name}
              </Text>
              <View style={styles.joinButton}>
                <Text style={styles.joinButtonText}>View</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary[500]} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Engagement Stats */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
          <View style={styles.statsRow}>
            {post.likes_count > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="heart" size={14} color={colors.error} />
                <Text style={styles.statsText}>{post.likes_count}</Text>
              </View>
            )}
            {post.comments_count > 0 && (
              <Text style={styles.statsText}>{post.comments_count} comments</Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={() => handleLike(post.id)}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? colors.error : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar with gradient accent */}
      <LinearGradient
        colors={[colors.primary[500], 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      />
      <View style={styles.feedHeader}>
        <View>
          <Text style={styles.feedTitle}>FIGHT<Text style={styles.feedTitleAccent}>FEED</Text></Text>
          <Text style={styles.feedSubtitle}>Boxing • MMA • Muay Thai • Kickboxing</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Ionicons name="add" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <View style={styles.notificationDot} />
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories Row */}
      {renderStoriesRow()}

      {/* Sport Filter Chips */}
      {renderSportFilters()}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            ALL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gyms' && styles.activeTab]}
          onPress={() => setActiveTab('gyms')}
        >
          <Ionicons
            name="business"
            size={16}
            color={activeTab === 'gyms' ? colors.primary[500] : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'gyms' && styles.activeTabText]}>
            GYMS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fighters' && styles.activeTab]}
          onPress={() => setActiveTab('fighters')}
        >
          <Ionicons
            name="fitness"
            size={16}
            color={activeTab === 'fighters' ? colors.primary[500] : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'fighters' && styles.activeTabText]}>
            FIGHTERS
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Discovery Empty State
  const renderEmptyState = () => {
    const discovery = getMockDiscovery();

    return (
      <View style={styles.emptyContainer}>
        {/* Empty Message */}
        <View style={styles.emptyMessageBox}>
          <Ionicons name="flame" size={40} color={colors.primary[500]} />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>
            Discover fighters and gyms to follow
          </Text>
        </View>

        {/* Discovery Section */}
        <View style={styles.discoverySection}>
          <Text style={styles.discoverySectionTitle}>🔥 TRENDING</Text>

          {discovery.map((item) => {
            const sportColor = item.sport ? getSportColor(item.sport) : colors.primary[500];
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.discoveryCard}
                onPress={() => {
                  if (item.type === 'fighter') {
                    navigation.navigate('FighterProfileView', { fighterId: item.id });
                  } else if (item.type === 'gym') {
                    navigation.navigate('GymProfileView', { gymId: item.id });
                  }
                }}
              >
                <View style={[
                  styles.discoveryAvatar,
                  item.type === 'event' && styles.discoveryAvatarEvent,
                  item.sport && { borderWidth: 2, borderColor: sportColor },
                ]}>
                  <Ionicons
                    name={item.type === 'gym' ? 'business' : item.type === 'fighter' ? 'person' : 'calendar'}
                    size={20}
                    color={item.sport ? sportColor : colors.textSecondary}
                  />
                </View>
                <View style={styles.discoveryInfo}>
                  <View style={styles.discoveryNameRow}>
                    <Text style={styles.discoveryName}>{item.name}</Text>
                    {item.sport && (
                      <View style={[styles.discoverySportBadge, { backgroundColor: getSportBgColor(item.sport) }]}>
                        <Text style={[styles.discoverySportText, { color: sportColor }]}>
                          {COMBAT_SPORT_SHORT[item.sport]}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.discoverySubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.discoveryStats}>
                  <Text style={styles.discoveryStatsText}>{item.stats}</Text>
                </View>
                <TouchableOpacity style={[styles.followButton, item.sport && { backgroundColor: sportColor }]}>
                  <Text style={styles.followButtonText}>
                    {item.type === 'event' ? 'View' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Skeleton loading card
  const renderSkeletonCard = (index: number) => (
    <View key={`skeleton-${index}`} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={[styles.skeletonAvatar, styles.skeleton]} />
        <View style={styles.authorInfo}>
          <View style={[styles.skeletonText, styles.skeleton, { width: 120 }]} />
          <View style={[styles.skeletonText, styles.skeleton, { width: 80, marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.skeletonMedia, styles.skeleton]} />
      <View style={styles.actionsRow}>
        <View style={[styles.skeletonAction, styles.skeleton]} />
        <View style={[styles.skeletonAction, styles.skeleton]} />
        <View style={[styles.skeletonAction, styles.skeleton]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <ScrollView style={styles.skeletonContainer} showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map(renderSkeletonCard)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredPosts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.feedContent,
          isDesktop && styles.feedContentDesktop,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    opacity: 0.1,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  feedTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.displayBlack,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  feedTitleAccent: {
    color: colors.primary[500],
  },
  feedSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    zIndex: 1,
  },
  // Stories
  storiesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing[3],
  },
  storiesScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  addStoryCard: {
    alignItems: 'center',
    width: 72,
  },
  addStoryIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBg,
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  storyCard: {
    alignItems: 'center',
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    backgroundColor: colors.cardBg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingLive: {
    borderColor: colors.error,
    borderWidth: 3,
  },
  storyRingEvent: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: colors.error,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  liveBadgeText: {
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  storyLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  storySubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  storySubtitleLive: {
    color: colors.error,
    fontWeight: '700',
  },
  sportMicroBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.cardBg,
  },
  sportMicroBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  // Sport Filters
  sportFilterContainer: {
    maxHeight: 44,
  },
  sportFilterScroll: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
    flexDirection: 'row',
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    gap: spacing[1],
  },
  sportChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sportChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  sportChipTextActive: {
    color: colors.textPrimary,
  },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  activeTab: {
    backgroundColor: `${colors.primary[500]}20`,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: colors.primary[500],
  },
  // Feed Content
  feedContent: {
    paddingBottom: spacing[10],
  },
  feedContentDesktop: {
    maxWidth: CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    marginTop: spacing[4],
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
  },
  // Skeleton styles
  skeletonContainer: {
    flex: 1,
    paddingTop: spacing[2],
  },
  skeleton: {
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing[3],
  },
  skeletonText: {
    height: 14,
    borderRadius: borderRadius.sm,
  },
  skeletonMedia: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
  },
  skeletonAction: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
  },
  // Post Card
  postCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  avatarContainer: {
    marginRight: spacing[3],
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  typeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBg,
  },
  typeIndicatorGym: {
    backgroundColor: colors.info,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  authorName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  verifiedBadge: {
    marginLeft: spacing[1],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary[500]}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  badgeExperience: {
    backgroundColor: `${colors.warning}20`,
  },
  badgeRecord: {
    backgroundColor: colors.surfaceLight,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary[400],
  },
  badgeTextExperience: {
    color: colors.warning,
  },
  badgeTextRecord: {
    color: colors.textSecondary,
  },
  postMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
  postMetaSmall: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  // Media
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary[500]}90`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    marginTop: spacing[2],
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  mediaCount: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  mediaCountText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  // Event Card
  eventCard: {
    margin: spacing[4],
    marginTop: 0,
    padding: spacing[4],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderLeftWidth: 4,
  },
  eventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  eventLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    fontWeight: '900',
    letterSpacing: 1,
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  eventDetailsRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  eventDetailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  eventGym: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  joinButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '700',
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing[4],
  },
  actionButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
  },
  actionButtonActive: {
    backgroundColor: `${colors.error}15`,
  },
  // Empty State / Discovery
  emptyContainer: {
    paddingHorizontal: spacing[4],
  },
  emptyMessageBox: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing[3],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
  discoverySection: {
    marginBottom: spacing[6],
  },
  discoverySectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '900',
    color: colors.primary[500],
    letterSpacing: 1,
    marginBottom: spacing[3],
  },
  discoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  discoveryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  discoveryAvatarEvent: {
    backgroundColor: `${colors.primary[500]}20`,
  },
  discoveryInfo: {
    flex: 1,
  },
  discoveryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  discoveryName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  discoverySportBadge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discoverySportText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discoverySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  discoveryStats: {
    marginRight: spacing[3],
  },
  discoveryStatsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  followButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});