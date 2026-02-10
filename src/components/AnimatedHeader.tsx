import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  typography,
  gradients,
} from '../lib/theme';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  backgroundGradient?: boolean;
}

export function AnimatedHeader({
  title,
  subtitle,
  scrollY,
  rightAction,
  showBackButton = false,
  onBackPress,
  backgroundGradient = true,
}: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();

  // Large header fades/shrinks as user scrolls
  const largeHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 80],
      [0, -10],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0.9],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  // Compact header appears as user scrolls
  const compactHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [60, 100],
      [0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background gradient glow */}
      {backgroundGradient && (
        <LinearGradient
          colors={gradients.warmGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.backgroundGlow}
        />
      )}

      {/* Compact header (visible on scroll) */}
      <Animated.View style={[styles.compactHeader, compactHeaderStyle]}>
        {showBackButton && (
          <Pressable onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
        <Text style={styles.compactTitle} numberOfLines={1}>
          {title}
        </Text>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </Animated.View>

      {/* Large header (fades on scroll) */}
      <Animated.View style={[styles.largeHeader, largeHeaderStyle]}>
        {showBackButton && (
          <Pressable onPress={onBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
          <Text style={styles.largeTitle}>{title}</Text>
        </View>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  backgroundGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  largeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[3],
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[0.5],
  },
  largeTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  compactTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  backButton: {
    marginRight: spacing[3],
    padding: spacing[1],
  },
  rightAction: {
    marginLeft: spacing[3],
  },
});
