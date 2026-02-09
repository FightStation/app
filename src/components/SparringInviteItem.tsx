import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SparringEvent, Gym } from '../types';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

interface SparringInviteItemProps {
  event: SparringEvent;
  gym?: Gym;
  status?: 'pending' | 'accepted' | 'declined';
  onAccept?: () => void;
  onDecline?: () => void;
  onPress?: () => void;
}

export function SparringInviteItem({
  event,
  gym,
  status = 'pending',
  onAccept,
  onDecline,
  onPress,
}: SparringInviteItemProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    };
  };

  const dateInfo = formatDate(event.event_date);

  const getStatusStyle = () => {
    switch (status) {
      case 'accepted':
        return { bg: `${colors.success}20`, text: colors.success, label: 'ACCEPTED' };
      case 'declined':
        return { bg: `${colors.error}20`, text: colors.error, label: 'DECLINED' };
      default:
        return { bg: `${colors.warning}20`, text: colors.warning, label: 'PENDING' };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {/* Date Box */}
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{dateInfo.day}</Text>
        <Text style={styles.dateMonth}>{dateInfo.month}</Text>
        <View style={styles.dateLine} />
        <Text style={styles.dateWeekday}>{dateInfo.weekday}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.gymName}>{gym?.name || 'Unknown Gym'}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.time}>
            {event.start_time} - {event.end_time}
          </Text>
          <Text style={styles.location}>
            {gym?.city}, {gym?.country}
          </Text>
        </View>

        {/* Actions for pending */}
        {status === 'pending' && (onAccept || onDecline) && (
          <View style={styles.actions}>
            {onAccept && (
              <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
                <Text style={styles.acceptBtnText}>ACCEPT</Text>
              </TouchableOpacity>
            )}
            {onDecline && (
              <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
                <Text style={styles.declineBtnText}>DECLINE</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  dateBox: {
    width: 72,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
  },
  dateDay: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.neutral[50],
  },
  dateMonth: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.neutral[200],
    letterSpacing: 1,
  },
  dateLine: {
    width: 24,
    height: 1,
    backgroundColor: colors.neutral[200],
    opacity: 0.3,
    marginVertical: spacing[2],
  },
  dateWeekday: {
    fontSize: 10,
    color: colors.neutral[300],
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.neutral[50],
    flex: 1,
    marginRight: spacing[2],
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  gymName: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginBottom: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.neutral[50],
    letterSpacing: 1,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  declineBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.neutral[500],
    letterSpacing: 1,
  },
});
