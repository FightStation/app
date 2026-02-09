import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../lib/theme';

interface MatchScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function MatchScoreBadge({ score, size = 'sm' }: MatchScoreBadgeProps) {
  const getColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.neutral[500];
  };

  const color = getColor();
  const isMd = size === 'md';

  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }, isMd && styles.badgeMd]}>
      <View style={[styles.dot, { backgroundColor: color }, isMd && styles.dotMd]} />
      <Text style={[styles.text, { color }, isMd && styles.textMd]}>
        {Math.round(score)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeMd: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotMd: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  textMd: {
    fontSize: typography.fontSize.sm,
  },
});