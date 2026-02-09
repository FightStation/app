import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Button, Card } from '../../components';
import { EventShareCard } from '../../components/EventShareCard';
import { supabase } from '../../lib/supabase';
import { useReferral } from '../../context/ReferralContext';
import { SparringEvent } from '../../types';
import { colors, spacing, typography } from '../../lib/theme';
import { generateShareableEventUrl } from '../../services/deepLinkHandler';

type ShareEventScreenProps = NativeStackScreenProps<{ ShareEvent: { eventId: string } }, 'ShareEvent'>;

export function ShareEventScreen({ route }: ShareEventScreenProps) {
  const { eventId } = route.params;
  const { referralCode } = useReferral();
  const referralCodeStr = referralCode?.code;
  const cardRef = useRef<View>(null);

  const [event, setEvent] = useState<SparringEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    const { data } = await supabase
      .from('sparring_events')
      .select('*, gym:gyms(*)')
      .eq('id', eventId)
      .single();

    if (data) {
      setEvent(data as SparringEvent);
    }
    setLoading(false);
  };

  const captureCard = async (): Promise<string | null> => {
    if (!cardRef.current) return null;

    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      return uri;
    } catch (error) {
      console.error('Error capturing card:', error);
      return null;
    }
  };

  const handleShare = async () => {
    if (!event) return;
    setSharing(true);

    try {
      const imageUri = await captureCard();
      const shareUrl = generateShareableEventUrl(event.id, referralCodeStr);

      if (imageUri) {
        // Share with image
        await Share.share({
          message: `Check out this sparring event: ${event.title} at ${event.gym?.name}!\n\n${shareUrl}`,
          url: imageUri,
        });
      } else {
        // Fallback to text only
        await Share.share({
          message: `Check out this sparring event: ${event.title} at ${event.gym?.name}!\n\n${shareUrl}`,
        });
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share event');
      }
    }

    setSharing(false);
  };

  const handleSaveToGallery = async () => {
    setSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save images to your gallery.');
        setSaving(false);
        return;
      }

      const imageUri = await captureCard();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image');
        setSaving(false);
        return;
      }

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(imageUri);
      Alert.alert('Saved!', 'Event card saved to your gallery.');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save image');
    }

    setSaving(false);
  };

  const handleCopyLink = async () => {
    if (!event) return;

    const shareUrl = generateShareableEventUrl(event.id, referralCodeStr);

    try {
      // Use Clipboard from expo-clipboard if available, otherwise fall back to Share
      await Share.share({
        message: shareUrl,
      });
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Share Event</Text>
      <Text style={styles.subtitle}>
        Share this event card on social media to invite fighters
      </Text>

      {/* Preview Card */}
      <View style={styles.cardContainer}>
        <EventShareCard
          ref={cardRef}
          event={event}
          referralCode={referralCodeStr}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Share to Social Media"
          onPress={handleShare}
          loading={sharing}
          size="lg"
        />

        <Button
          title="Save to Gallery"
          onPress={handleSaveToGallery}
          loading={saving}
          variant="outline"
          size="lg"
          style={styles.secondaryButton}
        />

        <Button
          title="Copy Link"
          onPress={handleCopyLink}
          variant="ghost"
          size="lg"
          style={styles.secondaryButton}
        />
      </View>

      {/* Referral Info */}
      {referralCodeStr && (
        <Card style={styles.referralCard}>
          <Text style={styles.referralTitle}>Your Referral Code Included</Text>
          <Text style={styles.referralText}>
            When fighters sign up through this link, you'll get credit for the referral!
          </Text>
          <Text style={styles.referralCode}>{referralCodeStr}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.base,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginBottom: spacing[6],
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  actions: {
    gap: spacing[3],
  },
  secondaryButton: {
    marginTop: 0,
  },
  referralCard: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
  referralTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[2],
  },
  referralText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  referralCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary[400],
    letterSpacing: 2,
  },
});
