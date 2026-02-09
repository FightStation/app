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
import { Card, Button } from '../../components';
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
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { scheduleEventReminders, cancelEventReminders } from '../../services/notificationScheduler';

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

  useEffect(() => {
    loadEvent();
  }, [eventId]);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Event Photos Carousel */}
      {event.photo_url && (
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

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(event.event_date)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>
              {event.start_time} - {event.end_time}
            </Text>
          </View>
          <View style={styles.infoItem}>
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
      </Card>

      {event.description && (
        <Card style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.description}</Text>
        </Card>
      )}

      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Weight Classes</Text>
        <View style={styles.badges}>
          {event.weight_classes.map((wc) => (
            <View key={wc} style={styles.badge}>
              <Text style={styles.badgeText}>{WEIGHT_CLASS_LABELS[wc]}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: spacing[4] }]}>
          Experience Levels
        </Text>
        <View style={styles.badges}>
          {event.experience_levels.map((exp) => (
            <View key={exp} style={styles.badge}>
              <Text style={styles.badgeText}>{EXPERIENCE_LABELS[exp]}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.gymCard}>
        <Text style={styles.sectionTitle}>Hosted By</Text>
        <Text style={styles.gymCardName}>{event.gym?.name}</Text>
        <Text style={styles.gymCardLocation}>
          {event.gym?.address}
          {'\n'}
          {event.gym?.city}, {event.gym?.country}
        </Text>
        {event.gym?.contact_email && (
          <Text style={styles.gymCardContact}>{event.gym.contact_email}</Text>
        )}
      </Card>

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

      {role === 'fighter' && !isOwnGym && (
        <View style={styles.actions}>
          {!existingRequest ? (
            <Button
              title={isFull ? 'Event Full' : 'Request to Join'}
              onPress={handleRequestToJoin}
              loading={requesting}
              disabled={isFull}
              size="lg"
            />
          ) : existingRequest.status === 'pending' ? (
            <Button
              title="Cancel Request"
              onPress={handleCancelRequest}
              loading={requesting}
              variant="outline"
              size="lg"
            />
          ) : existingRequest.status === 'approved' ? (
            <Button
              title="You're In!"
              onPress={() => {}}
              disabled
              size="lg"
              variant="secondary"
            />
          ) : null}
        </View>
      )}

      {isOwnGym && navigation && (
        <View style={styles.actions}>
          <Button
            title="Edit Event"
            onPress={() => navigation.navigate('EditEvent', { eventId: event.id })}
            size="lg"
          />
          <Button
            title="Manage Requests"
            onPress={() => navigation.navigate('ManageRequests', { eventId: event.id })}
            variant="outline"
            size="lg"
            style={{ marginTop: spacing[2] }}
          />
        </View>
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
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
  },
  photosCarousel: {
    height: 250,
    marginBottom: spacing[4],
  },
  eventPhoto: {
    width: width,
    height: 250,
    backgroundColor: colors.surfaceLight,
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
    fontWeight: 'bold',
    color: colors.neutral[50],
  },
  dateMonth: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    textTransform: 'uppercase',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  gymName: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[300],
  },
  statusBanner: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  statusBannerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[200],
    fontWeight: '500',
  },
  spotsAvailable: {
    color: colors.success,
  },
  spotsFull: {
    color: colors.error,
  },
  descriptionCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[2],
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
    lineHeight: 22,
  },
  detailsCard: {
    marginBottom: spacing[4],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
  },
  gymCard: {
    marginBottom: spacing[4],
  },
  gymCardName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  gymCardLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  gymCardContact: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
  },
  actions: {
    marginTop: spacing[4],
  },
  shareButton: {
    marginBottom: spacing[4],
  },
});
