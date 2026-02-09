import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SparringEvent, WEIGHT_CLASS_LABELS } from '../types';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing[8];
const CARD_HEIGHT = CARD_WIDTH * 1.4; // Instagram story ratio approx

interface EventShareCardProps {
  event: SparringEvent;
  referralCode?: string;
}

export const EventShareCard = forwardRef<View, EventShareCardProps>(
  ({ event, referralCode }, ref) => {
    const eventDate = new Date(event.event_date);
    const shareUrl = referralCode
      ? `https://fightstation.app/events/${event.id}?ref=${referralCode}`
      : `https://fightstation.app/events/${event.id}`;

    const formatDate = () => {
      return eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    };

    const spotsLeft = event.max_participants - event.current_participants;

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* Header with branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>FIGHT</Text>
            <Text style={styles.logoTextAccent}>STATION</Text>
          </View>
          <Text style={styles.tagline}>Find Your Next Sparring</Text>
        </View>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.gymRow}>
            <Text style={styles.gymIcon}>📍</Text>
            <Text style={styles.gymName} numberOfLines={1}>
              {event.gym?.name || 'TBA'}
            </Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate()}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailIcon}>⏰</Text>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{event.start_time}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailLabel}>Spots</Text>
              <Text style={[styles.detailValue, spotsLeft <= 3 && styles.spotsLow]}>
                {spotsLeft} left
              </Text>
            </View>
          </View>

          {/* Weight Classes */}
          <View style={styles.weightClasses}>
            {event.weight_classes.slice(0, 3).map((wc) => (
              <View key={wc} style={styles.weightBadge}>
                <Text style={styles.weightText}>
                  {WEIGHT_CLASS_LABELS[wc]}
                </Text>
              </View>
            ))}
            {event.weight_classes.length > 3 && (
              <View style={styles.weightBadge}>
                <Text style={styles.weightText}>
                  +{event.weight_classes.length - 3}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <QRCode
              value={shareUrl}
              size={80}
              backgroundColor="white"
              color={colors.background}
            />
          </View>
          <View style={styles.qrInfo}>
            <Text style={styles.scanText}>Scan to join</Text>
            <Text style={styles.urlText}>fightstation.app</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Download the app • Join the fight</Text>
        </View>
      </View>
    );
  }
);

EventShareCard.displayName = 'EventShareCard';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  header: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  logoText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    letterSpacing: 2,
  },
  logoTextAccent: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[900],
    letterSpacing: 2,
  },
  tagline: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[200],
    marginTop: spacing[1],
    letterSpacing: 1,
  },
  eventInfo: {
    flex: 1,
    padding: spacing[4],
  },
  eventTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[2],
    lineHeight: 28,
  },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  gymIcon: {
    fontSize: 14,
    marginRight: spacing[1],
  },
  gymName: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  detailBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 18,
    marginBottom: spacing[1],
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[50],
  },
  spotsLow: {
    color: colors.warning,
  },
  weightClasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  weightBadge: {
    backgroundColor: colors.primary[500] + '30',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  weightText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    fontWeight: '500',
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surfaceLight,
    gap: spacing[3],
  },
  qrContainer: {
    padding: spacing[2],
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
  },
  qrInfo: {
    flex: 1,
  },
  scanText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  urlText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
  },
  footer: {
    paddingVertical: spacing[2],
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
  },
});
