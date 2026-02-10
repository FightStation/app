import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, GlassCard, GradientButton, PulseIndicator, SectionHeader } from '../../components';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  SparringEvent,
  Fighter,
  EventRequest,
  WEIGHT_CLASS_LABELS,
  EXPERIENCE_LABELS,
} from '../../types';
import { colors, spacing, typography, borderRadius, gradients } from '../../lib/theme';
import { scheduleEventReminders, cancelEventReminders } from '../../services/notificationScheduler';
import { getEventAverageRating } from '../../services/events';

const { width } = Dimensions.get('window');

type EventDetailScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
  route?: RouteProp<{ params: { eventId: string } }, 'params'>;
  eventId?: string;
};

export function EventDetailScreen({ navigation, route, eventId: propEventId }: EventDetailScreenProps) {
  const eventId = propEventId || route?.params?.eventId || '';
  const { profile, role } = useAuth();
  const fighter = role === 'fighter' ? (profile as Fighter) : null;
  const { showToast } = useToast();

  const [event, setEvent] = useState<SparringEvent | null>(null);
  const [existingRequest, setExistingRequest] = useState<EventRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

  useEffect(() => {
    loadEvent();
    loadReviewStats();
  }, [eventId]);

  const loadReviewStats = async () => {
    try {
      const stats = await getEventAverageRating(eventId);
      setReviewStats(stats);
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const loadEvent = async () => {
    setLoading(true);

    const { data: eventData } = await supabase
      .from('sparring_events')
      .select('*, gym:gyms(*)')
      .eq('id', eventId)
      .single();

    if (eventData) {
      setEvent(eventData as SparringEvent);
    }

    if (fighter) {
      const { data: requestData } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('fighter_id', fighter.id)
        .single();

      if (requestData) {
        setExistingRequest(requestData as EventRequest);
      }
    }

    setLoading(false);
  };

  const handleRequestToJoin = async () => {
    if (!fighter || !event) return;

    setRequesting(true);

    const { error } = await supabase.from('event_requests').insert({
      event_id: event.id,
      fighter_id: fighter.id,
      status: 'pending',
    });

    if (error) {
      showToast(error.message, 'error');
    } else {
      // Schedule event reminders (24h and 1h before)
      const eventDate = new Date(`${event.event_date}T${event.start_time}`);
      await scheduleEventReminders(event.id, event.title, eventDate);

      showToast('Request sent to the gym!', 'success');
      await loadEvent();
    }

    setRequesting(false);
  };

  const handleCancelRequest = async () => {
    if (!existingRequest || !event) return;

    setRequesting(true);

    const { error } = await supabase
      .from('event_requests')
      .delete()
      .eq('id', existingRequest.id);

    if (error) {
      showToast(error.message, 'error');
    } else {
      // Cancel scheduled reminders
      await cancelEventReminders(event.id);
      setExistingRequest(null);
    }

    setRequesting(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      default:
        return colors.neutral[500];
    }
  };

  if (loading || !event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const spotsLeft = event.max_participants - event.current_participants;
  const isFull = spotsLeft <= 0;
  const isOwnGym = role === 'gym' && profile?.id === event.gym_id;
  const capacityRatio = event.current_participants / event.max_participants;
  const spotsLimited = capacityRatio > 0.75;

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Event Photos Carousel with Gradient Overlay */}
        {event.photo_url && (
          <View style={styles.heroContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photosCarousel}
            >
              {Array.isArray(event.photo_url) ? (
                event.photo_url.map((photo: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.eventPhoto}
                    resizeMode="cover"
                  />
                ))
              ) : (
                <Image
                  source={{ uri: event.photo_url }}
                  style={styles.eventPhoto}
                  resizeMode="cover"
                />
              )}
            </ScrollView>
            <LinearGradient
              colors={gradients.heroOverlay}
              style={styles.heroOverlay}
            />
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>
              {new Date(event.event_date).getDate()}
            </Text>
            <Text style={styles.dateMonth}>
              {new Date(event.event_date).toLocaleDateString('en-US', {
                month: 'short',
              })}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.gymName}>{event.gym?.name}</Text>
          </View>
        </View>

        {existingRequest && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: `${getRequestStatusColor(existingRequest.status)}20` },
            ]}
          >
            <Text
              style={[
                styles.statusBannerText,
                { color: getRequestStatusColor(existingRequest.status) },
              ]}
            >
              {existingRequest.status === 'approved'
                ? "You're confirmed for this event!"
                : existingRequest.status === 'pending'
                ? 'Your request is pending'
                : 'Your request was declined'}
            </Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Event Details" />
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary[400]} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(event.event_date)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color={colors.primary[400]} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>
                    {event.start_time} - {event.end_time}
                  </Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={16} color={colors.primary[400]} style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Spots</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      isFull ? styles.spotsFull : styles.spotsAvailable,
                    ]}
                  >
                    {isFull ? 'Full' : `${spotsLeft} / ${event.max_participants}`}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </View>

        {event.description && (
          <View style={styles.sectionContainer}>
            <SectionHeader title="About" />
            <GlassCard style={styles.descriptionCard}>
              <Text style={styles.description}>{event.description}</Text>
            </GlassCard>
          </View>
        )}

        <View style={styles.sectionContainer}>
          <SectionHeader title="Weight Classes" />
          <GlassCard style={styles.detailsCard}>
            <View style={styles.badges}>
              {event.weight_classes.map((wc) => (
                <View key={wc} style={styles.badge}>
                  <Text style={styles.badgeText}>{WEIGHT_CLASS_LABELS[wc]}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          <SectionHeader title="Experience Levels" />
          <GlassCard style={styles.detailsCard}>
            <View style={styles.badges}>
              {event.experience_levels.map((exp) => (
                <View key={exp} style={styles.badge}>
                  <Text style={styles.badgeText}>{EXPERIENCE_LABELS[exp]}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        <View style={styles.sectionContainer}>
          <SectionHeader title="Hosted By" />
          <GlassCard style={styles.gymCard}>
            <Text style={styles.gymCardName}>{event.gym?.name}</Text>
            <Text style={styles.gymCardLocation}>
              {event.gym?.address}
              {'\n'}
              {event.gym?.city}, {event.gym?.country}
            </Text>
            {event.gym?.contact_email && (
              <Text style={styles.gymCardContact}>{event.gym.contact_email}</Text>
            )}
          </GlassCard>
        </View>

        {/* Reviews Summary */}
        {reviewStats.count > 0 && (
          <View style={styles.sectionContainer}>
            <SectionHeader title="Reviews" />
            <GlassCard style={styles.reviewCard}>
              <View style={styles.reviewSummary}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons
                      key={n}
                      name={n <= Math.round(reviewStats.average) ? 'star' : 'star-outline'}
                      size={18}
                      color={colors.warning}
                    />
                  ))}
                </View>
                <Text style={styles.reviewAverage}>{reviewStats.average.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>
                  ({reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'})
                </Text>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Share Button - visible to all users */}
        {navigation && (
          <Button
            title="Share Event"
            onPress={() => navigation.navigate('ShareEvent', { eventId: event.id })}
            variant="outline"
            size="lg"
            style={styles.shareButton}
          />
        )}

        {isOwnGym && navigation && (
          <View style={styles.actions}>
            <GradientButton
              title="Edit Event"
              onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
              size="lg"
              fullWidth
              icon="create-outline"
            />
            <Button
              title="Manage Requests"
              onPress={() => navigation.navigate('ManageRequests', { eventId: event.id })}
              variant="outline"
              size="lg"
              style={{ marginTop: spacing[2] }}
            />
            <Button
              title="Check-In Fighters"
              onPress={() => navigation.navigate('EventCheckIn', { eventId: event.id, eventTitle: event.title })}
              variant="outline"
              size="lg"
              style={{ marginTop: spacing[2] }}
            />
          </View>
        )}

        {/* Bottom padding for pinned CTA */}
        {role === 'fighter' && !isOwnGym && (
          <View style={{ height: 100 }} />
        )}
      </ScrollView>

      {/* Pinned CTA Button for fighters */}
      {role === 'fighter' && !isOwnGym && (
        <View style={styles.pinnedCTA}>
          <LinearGradient
            colors={['rgba(13,13,13,0)', 'rgba(13,13,13,0.95)', colors.background]}
            style={styles.pinnedGradient}
          />
          <View style={styles.pinnedContent}>
            {!existingRequest ? (
              <View style={styles.ctaRow}>
                {spotsLimited && !isFull && (
                  <View style={styles.pulseContainer}>
                    <PulseIndicator color={colors.warning} size="sm" />
                    <Text style={styles.limitedText}>Few spots left</Text>
                  </View>
                )}
                <GradientButton
                  title={isFull ? 'Event Full' : 'Request to Join'}
                  onPress={handleRequestToJoin}
                  loading={requesting}
                  disabled={isFull}
                  size="lg"
                  fullWidth
                  icon={isFull ? 'close-circle' : 'flash'}
                />
              </View>
            ) : existingRequest.status === 'pending' ? (
              <Button
                title="Cancel Request"
                onPress={handleCancelRequest}
                loading={requesting}
                variant="outline"
                size="lg"
              />
            ) : existingRequest.status === 'approved' ? (
              <View>
                <Button
                  title="You're In!"
                  onPress={() => {}}
                  disabled
                  size="lg"
                  variant="secondary"
                />
                {/* Write Review - only for approved fighters on completed events */}
                {event.status === 'completed' && navigation && (
                  <Button
                    title="Write Review"
                    onPress={() => navigation.navigate('EventReview', { eventId: event.id, eventTitle: event.title })}
                    variant="outline"
                    size="lg"
                    style={{ marginTop: spacing[2] }}
                  />
                )}
              </View>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing[10],
  },
  heroContainer: {
    position: 'relative',
    height: 250,
    marginBottom: spacing[4],
  },
  photosCarousel: {
    height: 250,
  },
  eventPhoto: {
    width: width,
    height: 250,
    backgroundColor: colors.surfaceLight,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  header: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.base,
  },
  dateBox: {
    width: 72,
    height: 72,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  dateDay: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
    fontWeight: 'bold',
    color: colors.neutral[50],
  },
  dateMonth: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily.medium,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.display,
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  gymName: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[300],
    fontFamily: typography.fontFamily.regular,
  },
  statusBanner: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  statusBannerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
  },
  sectionContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  infoCard: {
    marginBottom: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: spacing[2],
    marginTop: 2,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginBottom: spacing[0.5],
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[200],
    fontWeight: '500',
    fontFamily: typography.fontFamily.medium,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing[2],
  },
  spotsAvailable: {
    color: colors.success,
  },
  spotsFull: {
    color: colors.error,
  },
  descriptionCard: {
    marginBottom: spacing[2],
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
  },
  detailsCard: {
    marginBottom: spacing[3],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
    fontFamily: typography.fontFamily.medium,
  },
  gymCard: {
    marginBottom: spacing[2],
  },
  gymCardName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
    fontFamily: typography.fontFamily.semibold,
  },
  gymCardLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 20,
    marginBottom: spacing[2],
    fontFamily: typography.fontFamily.regular,
  },
  gymCardContact: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    fontFamily: typography.fontFamily.medium,
  },
  reviewCard: {
    marginBottom: spacing[2],
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewAverage: {
    color: colors.neutral[50],
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    fontFamily: typography.fontFamily.semibold,
  },
  reviewCount: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  actions: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  shareButton: {
    marginBottom: spacing[4],
    marginHorizontal: spacing[4],
  },
  // Pinned CTA
  pinnedCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pinnedGradient: {
    height: 32,
  },
  pinnedContent: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: spacing[2],
  },
  ctaRow: {
    gap: spacing[2],
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  limitedText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
  },
});
