import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  Alert,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientButton } from '../../components';
import { WatermarkOverlay, WatermarkPosition } from '../../components/WatermarkOverlay';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT * 0.5;

type VideoShareScreenProps = NativeStackScreenProps<{ VideoShare: undefined }, 'VideoShare'>;

export function VideoShareScreen({ navigation }: VideoShareScreenProps) {
  const videoRef = useRef<Video>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('bottom-right');
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your media library to select videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 60, // 60 second max for social media
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to record videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleShare = async () => {
    if (!videoUri) return;
    setSharing(true);

    try {
      // Note: The watermark is shown as an overlay during playback preview
      // For actual sharing, we share the original video with a message about Fight Station
      // True video watermarking would require server-side processing or native modules
      await Share.share({
        message: 'Check out my sparring session! Recorded with Fight Station - fightstation.app',
        url: Platform.OS === 'ios' ? videoUri : undefined,
      });
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share video');
      }
    }

    setSharing(false);
  };

  const handleSaveToGallery = async () => {
    if (!videoUri) return;
    setSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save videos to your gallery.');
        setSaving(false);
        return;
      }

      await MediaLibrary.saveToLibraryAsync(videoUri);
      Alert.alert('Saved!', 'Video saved to your gallery. Share it on Instagram or TikTok with the Fight Station tag!');
    } catch (error) {
      console.error('Error saving video:', error);
      Alert.alert('Error', 'Failed to save video');
    }

    setSaving(false);
  };

  const cycleWatermarkPosition = () => {
    const positions: WatermarkPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    const currentIndex = positions.indexOf(watermarkPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setWatermarkPosition(positions[nextIndex]);
  };

  return (
    <View style={styles.container}>
      {!videoUri ? (
        // Video Selection
        <View style={styles.selectionContainer}>
          <Text style={styles.title}>Share Your Highlights</Text>
          <Text style={styles.subtitle}>
            Record or select a video to share on social media
          </Text>

          <View style={styles.optionsContainer}>
            <GlassCard style={styles.optionCard} onPress={recordVideo}>
              <View style={styles.optionIcon}>
                <Ionicons name="videocam" size={40} color={colors.primary[400]} />
              </View>
              <Text style={styles.optionTitle}>Record Video</Text>
              <Text style={styles.optionSubtitle}>Capture a new clip</Text>
            </GlassCard>

            <GlassCard style={styles.optionCard} onPress={pickVideo}>
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={40} color={colors.primary[400]} />
              </View>
              <Text style={styles.optionTitle}>Choose Video</Text>
              <Text style={styles.optionSubtitle}>From your gallery</Text>
            </GlassCard>
          </View>

          <Text style={styles.tipText}>
            Tip: Keep videos under 60 seconds for best results on social media
          </Text>
        </View>
      ) : (
        // Video Preview with Watermark
        <View style={styles.previewContainer}>
          <View style={styles.videoContainer}>
            <TouchableOpacity
              style={styles.videoTouchable}
              onPress={togglePlayback}
              activeOpacity={0.9}
            >
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />

              {/* Watermark Overlay */}
              <WatermarkOverlay position={watermarkPosition} opacity={0.7} size="small" />

              {/* Play/Pause Indicator */}
              {!isPlaying && (
                <View style={styles.playIndicator}>
                  <Ionicons name="play" size={48} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Watermark Position Toggle */}
          <TouchableOpacity
            style={styles.positionToggle}
            onPress={cycleWatermarkPosition}
          >
            <Ionicons name="move" size={16} color={colors.neutral[300]} />
            <Text style={styles.positionToggleText}>
              Move watermark ({watermarkPosition.replace('-', ' ')})
            </Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actions}>
            <GradientButton
              title="Share to Social Media"
              onPress={handleShare}
              loading={sharing}
              size="lg"
              icon="share-social"
              fullWidth
            />

            <GlassCard
              onPress={handleSaveToGallery}
              style={styles.secondaryActionCard}
            >
              <Text style={styles.secondaryActionText}>
                {saving ? 'Saving...' : 'Save to Gallery'}
              </Text>
            </GlassCard>

            <GlassCard
              onPress={() => setVideoUri(null)}
              style={styles.secondaryActionCard}
            >
              <Text style={styles.secondaryActionText}>Choose Different Video</Text>
            </GlassCard>
          </View>

          {/* Info Note */}
          <GlassCard style={styles.infoNote}>
            <View style={styles.infoNoteRow}>
              <Ionicons name="information-circle" size={16} color={colors.neutral[500]} />
              <Text style={styles.infoNoteText}>
                The watermark previews how your video will look. When sharing, mention @fightstation in your caption!
              </Text>
            </View>
          </GlassCard>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectionContainer: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  optionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    padding: spacing[4],
  },
  videoContainer: {
    height: VIDEO_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    flex: 1,
    backgroundColor: 'black',
  },
  playIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  positionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    marginBottom: spacing[4],
  },
  positionToggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
  actions: {
    gap: spacing[3],
  },
  secondaryActionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3.5],
  },
  secondaryActionText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoNote: {
    marginTop: spacing[4],
  },
  infoNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  infoNoteText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    lineHeight: 18,
  },
});
