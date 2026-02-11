import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { glass, borderRadius, spacing, animations } from '../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type GlassIntensity = 'light' | 'medium' | 'dark' | 'accent';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: GlassIntensity;
  accentColor?: string;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  style,
  onPress,
  intensity = 'light',
  accentColor,
  noPadding = false,
}: GlassCardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glassPreset = glass[intensity];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, animations.spring.snappy);
    translateY.value = withSpring(2, animations.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.spring.snappy);
    translateY.value = withSpring(0, animations.spring.snappy);
  };

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      borderColor: accentColor
        ? `${accentColor}33`
        : glassPreset.borderColor,
      borderWidth: glassPreset.borderWidth,
    },
    noPadding ? undefined : styles.padding,
    style,
  ].filter(Boolean) as ViewStyle[];

  const renderContent = () => {
    // On iOS, use real blur
    if (Platform.OS === 'ios') {
      return (
        <BlurView
          intensity={glassPreset.blurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: glassPreset.backgroundColor,
              },
            ]}
          />
        </BlurView>
      );
    }

    // On web, use CSS backdrop-filter
    if (Platform.OS === 'web') {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: glassPreset.backgroundColor,
              // @ts-ignore - web only
              backdropFilter: `blur(${glassPreset.blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${glassPreset.blurIntensity}px)`,
            },
          ]}
        />
      );
    }

    // Android fallback - semi-transparent bg without blur
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              intensity === 'dark'
                ? 'rgba(0, 0, 0, 0.6)'
                : intensity === 'accent'
                ? 'rgba(19, 91, 236, 0.12)'
                : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      />
    );
  };

  if (onPress) {
    return (
      <AnimatedPressable
        style={[containerStyle, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {renderContent()}
        {accentColor && (
          <View
            style={[
              styles.accentBar,
              { backgroundColor: accentColor },
            ]}
          />
        )}
        <View style={styles.contentLayer}>{children}</View>
      </AnimatedPressable>
    );
  }

  return (
    <View style={containerStyle}>
      {renderContent()}
      {accentColor && (
        <View
          style={[
            styles.accentBar,
            { backgroundColor: accentColor },
          ]}
        />
      )}
      <View style={styles.contentLayer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  padding: {
    padding: spacing[4],
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 2,
  },
});
