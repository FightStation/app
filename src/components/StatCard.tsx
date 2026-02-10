import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import {
  colors,
  spacing,
  typography,
  textStyles,
} from '../lib/theme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  accentColor?: string;
  trend?: string; // e.g. "+12%"
  trendPositive?: boolean;
  onPress?: () => void;
}

export function StatCard({
  icon,
  value,
  label,
  accentColor = colors.primary[500],
  trend,
  trendPositive,
  onPress,
}: StatCardProps) {
  return (
    <GlassCard style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${accentColor}20` },
          ]}
        >
          <Ionicons name={icon} size={20} color={accentColor} />
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trendPositive
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.trendText,
                {
                  color: trendPositive
                    ? colors.success
                    : colors.error,
                },
              ]}
            >
              {trend}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  value: {
    ...textStyles.statValue,
    marginBottom: 2,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
