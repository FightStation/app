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
import { GradientButton, GlassInput, BadgeRow, SectionHeader } from '../../components';
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
          <Text style={styles.headerTitle}>Create Post</Text>
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
          {/* Author Info */}
          {author && (
            <View style={styles.authorRow}>
              <View style={styles.avatarContainer}>
                {author.avatar ? (
                  <Image source={{ uri: author.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {author.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{author.name}</Text>
                <TouchableOpacity style={styles.visibilitySelector}>
                  <Ionicons
                    name={visibility === 'public' ? 'globe-outline' : 'people-outline'}
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.visibilityText}>
                    {visibility === 'public' ? 'Public' : 'Followers'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Post Type Selector - BadgeRow */}
          <BadgeRow
            items={postTypeItems}
            selected={postType}
            onSelect={(key) => setPostType(key as PostType)}
            style={{ marginBottom: spacing[4] }}
          />

          {/* Content Input - GlassInput */}
          <GlassInput
            placeholder={
              postType === 'reel'
                ? "Add a caption for your reel..."
                : postType === 'training_update'
                ? "Share your training update..."
                : "What's on your mind?"
            }
            value={content}
            onChangeText={setContent}
            multiline
            containerStyle={styles.contentInputContainer}
          />

          {/* Media Preview */}
          {media.length > 0 && (
            <View style={styles.mediaPreview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {media.map((item, index) => (
                  <View key={index} style={styles.mediaItem}>
                    {item.type === 'video' ? (
                      <View style={styles.videoPreview}>
                        <Ionicons name="videocam" size={32} color={colors.primary[500]} />
                      </View>
                    ) : (
                      <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                    )}
                    <TouchableOpacity
                      style={styles.removeMedia}
                      onPress={() => removeMedia(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Media Actions */}
          <View style={styles.mediaActions}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color={colors.primary[500]} />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color={colors.primary[500]} />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
            {role === 'gym' && (
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.primary[500]} />
                <Text style={styles.mediaButtonText}>Event</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Visibility Options */}
          <SectionHeader title="Who can see this?" />
          <BadgeRow
            items={visibilityItems}
            selected={visibility}
            onSelect={(key) => setVisibility(key as PostVisibility)}
          />
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  avatarContainer: {
    marginRight: spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  visibilitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  visibilityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  contentInputContainer: {
    marginBottom: spacing[4],
  },
  mediaPreview: {
    marginBottom: spacing[4],
  },
  mediaItem: {
    position: 'relative',
    marginRight: spacing[3],
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
  videoPreview: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMedia: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing[4],
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  mediaButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },
});
