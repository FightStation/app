import React from 'react';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { ViewStyle } from 'react-native';
import { animations } from '../lib/theme';

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export function AnimatedListItem({
  index,
  children,
  style,
  delay = animations.stagger.normal,
}: AnimatedListItemProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)
        .delay(index * delay)
        .springify()
        .damping(20)
        .stiffness(200)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
