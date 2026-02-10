import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  labelSuffix?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  color = colors.primary[500],
  backgroundColor = 'rgba(255,255,255,0.08)',
  showLabel = true,
  labelSuffix = '%',
  children,
}: ProgressRingProps) {
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 100), {
      duration: 800,
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (circumference * animatedProgress.value) / 100;
    return { strokeDashoffset };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      {/* Center content */}
      <View style={styles.labelContainer}>
        {children ? (
          children
        ) : showLabel ? (
          <Text
            style={[
              styles.label,
              { fontSize: size < 48 ? 11 : size < 80 ? 14 : 20 },
            ]}
          >
            {Math.round(progress)}
            {labelSuffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.fontFamily.display,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
