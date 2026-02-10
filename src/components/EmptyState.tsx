import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from './GradientButton';
import { colors, spacing, typography } from '../lib/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  accentColor = colors.primary[500],
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(100)}
      style={styles.container}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${accentColor}15` },
        ]}
      >
        <Ionicons name={icon} size={40} color={accentColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <GradientButton
            title={actionLabel}
            onPress={onAction}
            size="md"
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: spacing[6],
  },
});
