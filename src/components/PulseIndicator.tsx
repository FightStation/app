import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../lib/theme';

interface PulseIndicatorProps {
  color?: string;
  size?: 'sm' | 'md';
}

export function PulseIndicator({
  color = colors.success,
  size = 'sm',
}: PulseIndicatorProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  const dotSize = size === 'sm' ? 8 : 12;

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1000 }),
        withTiming(1, { duration: 0 })
      ),
      -1
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(0.6, { duration: 0 })
      ),
      -1
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: dotSize * 2.5, height: dotSize * 2.5 }]}>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
          pulseStyle,
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  dot: {
    zIndex: 1,
  },
});
