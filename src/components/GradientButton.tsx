import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  gradients,
  shadows,
  borderRadius,
  spacing,
  typography,
  colors,
  animations,
} from '../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  gradient?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function GradientButton({
  title,
  onPress,
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  gradient = gradients.primaryToCrimson,
  style,
  textStyle,
  fullWidth = false,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, animations.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.snappy);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const sizeStyles = sizeMap[size];
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  return (
    <AnimatedPressable
      style={[
        styles.wrapper,
        fullWidth && styles.fullWidth,
        !disabled && shadows.glow,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={disabled ? ['#334155', '#1E293B'] : gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, sizeStyles.container]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={iconSize}
                color="#FFFFFF"
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.text,
                sizeStyles.text,
                disabled && styles.disabledText,
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={iconSize}
                color="#FFFFFF"
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const sizeMap = {
  sm: {
    container: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: typography.fontSize.sm,
    },
  },
  md: {
    container: {
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[3],
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: typography.fontSize.base,
    },
  },
  lg: {
    container: {
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[3.5],
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: typography.fontSize.lg,
    },
  },
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold,
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
