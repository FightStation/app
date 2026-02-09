import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

interface StatBadgeProps {
  label: string;
  value: string;
  variant?: 'default' | 'highlight' | 'minimal';
}

export function StatBadge({ label, value, variant = 'default' }: StatBadgeProps) {
  return (
    <View style={[styles.container, styles[variant]]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minWidth: 80,
  },
  default: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[700],
  },
  highlight: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  minimal: {
    backgroundColor: 'transparent',
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.neutral[50],
    letterSpacing: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
