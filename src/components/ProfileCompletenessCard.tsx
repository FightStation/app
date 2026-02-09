import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import {
  ProfileCompletenessResult,
  getNextProfileAction,
  getCompletenessColor,
} from '../utils/profileCompleteness';

type ProfileCompletenessCardProps = {
  completeness: ProfileCompletenessResult;
  onPress: () => void;
};

export function ProfileCompletenessCard({ completeness, onPress }: ProfileCompletenessCardProps) {
  const { percentage, isComplete } = completeness;
  const nextAction = getNextProfileAction(completeness);
  const color = getCompletenessColor(percentage);

  // Don't show if profile is 100% complete
  if (percentage === 100) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={isComplete ? 'checkmark-circle' : 'alert-circle'}
            size={24}
            color={color}
          />
          <Text style={styles.title}>Profile Completeness</Text>
        </View>
        <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Next Action */}
      {nextAction && (
        <View style={styles.actionRow}>
          <Ionicons name="arrow-forward-circle" size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>{nextAction}</Text>
        </View>
      )}

      {/* Info Message */}
      {!isComplete && (
        <Text style={styles.infoText}>
          Complete your profile to get more visibility and better matches
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  percentage: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing[2],
    flexShrink: 0,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
