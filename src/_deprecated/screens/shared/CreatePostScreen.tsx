import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { GradientButton, GlassInput, GlassCard, BadgeRow, SectionHeader } from '../../components';
import { Fighter, Gym, Coach, PostType, PostVisibility } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

type MediaItem = {
  uri: string;
  type: 'image' | 'video';
};

export function CreatePostScreen({ navigation, route }: any) {
  const { user, role, profile } = useAuth();
  const eventId = route?.params?.eventId;
  const initialPostType = route?.params?.postType || 'post';

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [loading, setLoading] = useState(false);

  const getAuthorInfo = () => {
    if (role === 'fighter' && profile) {
      const fighter = profile as Fighter;
      return {
        type: 'fighter' as const,
        id: fighter.id,
        name: `${fighter.first_name} ${fighter.last_name}`,
        avatar: fighter.avatar_url,
      };
    } else if (role === 'gym' && profile) {
      const gym = profile as Gym;
      return {
        type: 'gym' as const,
        id: gym.id,
        name: gym.name,
        avatar: gym.logo_url,
      };
    } else if (role === 'coach' && profile) {
      const coach = profile as Coach;
      return {
        type: 'coach' as const,
        id: coach.id,
        name: `${coach.first_name} ${coach.last_name}`,
        avatar: coach.avatar_url,
      };
    }
    return null;
  };

  const author = getAuthorInfo();

  const pickImage = async () => {
    if (media.length >= 10) {
      Alert.alert('Limit reached', 'You can only add up to 10 media items');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - media.length,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
      }));
      setMedia([...media, ...newMedia]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
      }));
      setMedia([...media, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const uploadMedia = async (mediaItem: MediaItem): Promise<string | null> => {
    try {
      const filename = `${user?.id}/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const ext = mediaItem.type === 'video' ? 'mp4' : 'jpg';
      const path = `posts/${filename}.${ext}`;

      // For web, we need to fetch the blob
      const response = await fetch(mediaItem.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('media')
        .upload(path, blob, {
          contentType: mediaItem.type === 'video' ? 'video/mp4' : 'image/jpeg',
        });

      if (error) {
        console.error('[CreatePost] Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('[CreatePost] Upload failed:', err);
      return null;
    }
  };

  const handlePost = async () => {
    if (!user || !author) {
      Alert.alert('Error', 'Please log in to create a post');
      return;
    }

    if (!content.trim() && media.length === 0) {
      Alert.alert('Empty post', 'Please add some content or media to your post');
      return;
    }

    setLoading(true);

    try {
      // Upload media files
      const mediaUrls: string[] = [];
      for (const item of media) {
        const url = await uploadMedia(item);
        if (url) {
          mediaUrls.push(url);
        }
      }

      // Determine media type
      let mediaType: 'image' | 'video' | 'mixed' | null = null;
      if (media.length > 0) {
        const hasImages = media.some(m => m.type === 'image');
        const hasVideos = media.some(m => m.type === 'video');
        if (hasImages && hasVideos) {
          mediaType = 'mixed';
        } else if (hasVideos) {
          mediaType = 'video';
        } else {
          mediaType = 'image';
        }
      }

      // Create post
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        author_type: author.type,
        author_id: author.id,
        content: content.trim() || null,
        media_urls: mediaUrls,
        media_type: mediaType,
        post_type: postType,
        event_id: eventId || null,
        visibility,
      });

      if (error) {
        console.error('[CreatePost] Insert error:', error);
        Alert.alert('Error', 'Failed to create post. Please try again.');
        return;
      }

      navigation.goBack();
    } catch (err) {
      console.error('[CreatePost] Failed to create post:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const postTypeItems = [
    { key: 'post', label: 'Post', icon: 'create-outline' as const },
    { key: 'reel', label: 'Reel', icon: 'videocam-outline' as const },
    { key: 'training_update', label: 'Training', icon: 'fitness-outline' as const },
  ];

  const visibilityItems = [
    { key: 'public', label: 'Public', icon: 'globe-outline' as const },
    { key: 'followers', label: 'Followers', icon: 'people-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <GradientButton
            title="Post"
            onPress={handlePost}
            loading={loading}
            disabled={loading || (!content.trim() && media.length === 0)}
            size="sm"
            style={styles.postButton}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Post Type Selector */}
          <BadgeRow
            items={postTypeItems}
            selected={postType}
            onSelect={(key) => setPostType(key as PostType)}
            style={{ marginBottom: spacing[4] }}
          />

          {/* 2. Hero Media Area */}
          <View style={styles.heroMediaContainer}>
            {media.length > 0 ? (
              <View style={styles.heroImageWrapper}>
                {media[0].type === 'video' ? (
                  <View style={styles.heroVideoPlaceholder}>
                    <Ionicons name="videocam" size={48} color={colors.primary[500]} />
                    <Text style={styles.heroVideoText}>Video</Text>
                  </View>
                ) : (
                  <Image source={{ uri: media[0].uri }} style={styles.heroImage} resizeMode="cover" />
                )}
                {/* Remove button overlay top-right */}
                <TouchableOpacity style={styles.heroRemoveButton} onPress={() => removeMedia(0)}>
                  <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
                {/* Media count badge top-left */}
                <View style={styles.heroMediaCount}>
                  <Text style={styles.heroMediaCountText}>{media.length}/10</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.heroPlaceholder} onPress={pickImage}>
                <View style={styles.placeholderIconCircle}>
                  <Ionicons name="camera-outline" size={40} color={colors.primary[500]} />
                </View>
                <Text style={styles.placeholderText}>Tap to add photos or videos</Text>
                <Text style={styles.placeholderSubtext}>Up to 10 items</Text>
              </TouchableOpacity>
            )}
            {/* Overlay action buttons at bottom of hero */}
            {media.length > 0 && (
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroActionButton} onPress={pickImage}>
                  <Ionicons name="images-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.heroActionText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.heroActionText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Gallery/Camera below placeholder when no media */}
            {media.length === 0 && (
              <View style={styles.placeholderActions}>
                <TouchableOpacity style={styles.placeholderActionButton} onPress={pickImage}>
                  <Ionicons name="images-outline" size={22} color={colors.primary[500]} />
                  <Text style={styles.placeholderActionText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.placeholderActionButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={22} color={colors.primary[500]} />
                  <Text style={styles.placeholderActionText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 3. Thumbnail strip - only if multiple media */}
          {media.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailStrip}>
              {media.map((item, index) => (
                <View key={index} style={styles.thumbnail}>
                  {item.type === 'video' ? (
                    <View style={styles.thumbnailVideo}>
                      <Ionicons name="videocam" size={16} color={colors.primary[500]} />
                    </View>
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.thumbnailImage} />
                  )}
                  <TouchableOpacity style={styles.thumbnailRemove} onPress={() => removeMedia(index)}>
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* 4. Compact Caption Input */}
          <GlassInput
            placeholder={
              postType === 'reel'
                ? "Add a caption..."
                : postType === 'training_update'
                ? "Share your training..."
                : "Write a caption..."
            }
            value={content}
            onChangeText={setContent}
            multiline
            containerStyle={styles.captionContainer}
            style={styles.captionInput}
          />

          {/* 5. Bottom Section - Author + Visibility */}
          <View style={styles.bottomSection}>
            {author && (
              <View style={styles.authorRowCompact}>
                <View style={styles.avatarContainer}>
                  {author.avatar ? (
                    <Image source={{ uri: author.avatar }} style={styles.avatarSmall} />
                  ) : (
                    <View style={styles.avatarPlaceholderSmall}>
                      <Text style={styles.avatarInitials}>
                        {author.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.authorName}>{author.name}</Text>
              </View>
            )}

            <SectionHeader title="Who can see this?" />
            <BadgeRow
              items={visibilityItems}
              selected={visibility}
              onSelect={(key) => setVisibility(key as PostVisibility)}
            />

            {role === 'gym' && (
              <TouchableOpacity
                style={styles.eventButton}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
                <Text style={styles.eventButtonText}>Create Event Instead</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  closeButton: {
    padding: spacing[1],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  postButton: {
    minWidth: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  scrollContentDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero media area
  heroMediaContainer: {
    marginBottom: spacing[4],
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImageWrapper: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 400,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroVideoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  heroVideoText: {
    color: colors.textMuted,
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
  },
  heroRemoveButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    zIndex: 2,
  },
  heroMediaCount: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  heroMediaCountText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  heroPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  placeholderIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  placeholderSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
  heroActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: spacing[3],
    gap: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  heroActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  placeholderActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    paddingVertical: spacing[4],
  },
  placeholderActionButton: {
    alignItems: 'center',
    gap: spacing[1],
  },
  placeholderActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },

  // Thumbnail strip
  thumbnailStrip: {
    marginBottom: spacing[4],
  },
  thumbnail: {
    position: 'relative',
    marginRight: spacing[2],
  },
  thumbnailImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  thumbnailVideo: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },

  // Compact caption
  captionContainer: {
    marginBottom: spacing[4],
  },
  captionInput: {
    minHeight: 60,
  },

  // Bottom section
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[4],
  },
  authorRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  avatarContainer: {},
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholderSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  authorName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  eventButtonText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: '500',
  },
});
