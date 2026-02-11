import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Fighter } from '../../types';
import {
  submitEventReview,
  getFighterReview,
} from '../../services/events';
import { GlassCard, GradientButton, SectionHeader, GlassInput } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type EventReviewScreenProps = NativeStackScreenProps<{
  EventReview: { eventId: string; eventTitle?: string };
}, 'EventReview'>;

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function EventReviewScreen({ navigation, route }: EventReviewScreenProps) {
  const { eventId, eventTitle } = route.params;
  const { profile } = useAuth();
  const fighter = profile as Fighter;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [overallRating, setOverallRating] = useState(0);
  const [organizationRating, setOrganizationRating] = useState(0);
  const [facilityRating, setFacilityRating] = useState(0);
  const [coachingRating, setCoachingRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  useEffect(() => {
    loadExistingReview();
  }, []);

  const loadExistingReview = async () => {
    try {
      const existing = await getFighterReview(eventId, fighter.id);
      if (existing) {
        setIsEditing(true);
        setOverallRating(existing.rating);
        setOrganizationRating(existing.organization_rating);
        setFacilityRating(existing.facility_rating);
        setCoachingRating(existing.coaching_rating);
        setReviewText(existing.review_text || '');
        setWouldRecommend(existing.would_recommend);
      }
    } catch (error) {
      console.error('Error loading existing review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating');
      return;
    }
    if (organizationRating === 0 || facilityRating === 0 || coachingRating === 0) {
      Alert.alert('Ratings Required', 'Please rate all categories');
      return;
    }
    if (wouldRecommend === null) {
      Alert.alert('Required', 'Please select whether you would recommend this event');
      return;
    }

    setSubmitting(true);
    try {
      await submitEventReview({
        event_id: eventId,
        fighter_id: fighter.id,
        rating: overallRating,
        review_text: reviewText || undefined,
        organization_rating: organizationRating,
        facility_rating: facilityRating,
        coaching_rating: coachingRating,
        would_recommend: wouldRecommend,
      });

      Alert.alert(
        'Review Submitted',
        isEditing ? 'Your review has been updated.' : 'Thanks for your feedback!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRow = ({
    rating,
    onRate,
    size = 32,
  }: {
    rating: number;
    onRate: (n: number) => void;
    size?: number;
  }) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onRate(n)} style={styles.starButton}>
          <Ionicons
            name={n <= rating ? 'star' : 'star-outline'}
            size={size}
            color={n <= rating ? colors.warning : colors.textMuted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

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
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Update Review' : 'Review Event'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Info */}
          {eventTitle && (
            <View style={styles.eventInfo}>
              <Ionicons name="calendar" size={20} color={colors.primary[500]} />
              <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
            </View>
          )}

          {/* Overall Rating */}
          <GlassCard style={styles.section}>
            <SectionHeader title="Overall Rating" />
            <StarRow rating={overallRating} onRate={setOverallRating} size={40} />
          </GlassCard>

          {/* Category Ratings */}
          <GlassCard style={styles.section}>
            <SectionHeader title="Category Ratings" />

            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>Organization</Text>
              <StarRow rating={organizationRating} onRate={setOrganizationRating} size={24} />
            </View>

            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>Facility</Text>
              <StarRow rating={facilityRating} onRate={setFacilityRating} size={24} />
            </View>

            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>Coaching</Text>
              <StarRow rating={coachingRating} onRate={setCoachingRating} size={24} />
            </View>
          </GlassCard>

          {/* Review Text */}
          <GlassCard style={styles.section}>
            <SectionHeader title="Your Review" />
            <GlassInput
              placeholder="Share your experience..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
            />
          </GlassCard>

          {/* Would Recommend */}
          <GlassCard style={styles.section}>
            <SectionHeader title="Would you recommend this event?" />
            <View style={styles.recommendRow}>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldRecommend === true && styles.recommendButtonActive,
                ]}
                onPress={() => setWouldRecommend(true)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={20}
                  color={wouldRecommend === true ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.recommendText,
                    wouldRecommend === true && styles.recommendTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldRecommend === false && styles.recommendButtonNo,
                ]}
                onPress={() => setWouldRecommend(false)}
              >
                <Ionicons
                  name="thumbs-down"
                  size={20}
                  color={wouldRecommend === false ? '#fff' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.recommendText,
                    wouldRecommend === false && styles.recommendTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Submit Button */}
          <GradientButton
            title={isEditing ? 'Update Review' : 'Submit Review'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            fullWidth
            size="lg"
          />

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[6],
    gap: spacing[2],
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  starRow: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  starButton: {
    padding: spacing[1],
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  textArea: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    height: 120,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  recommendRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  recommendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  recommendButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  recommendButtonNo: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  recommendText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  recommendTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing[4],
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  bottomPadding: {
    height: spacing[10],
  },
});