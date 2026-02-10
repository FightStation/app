import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '../lib/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Icon mapping for different tabs
export type TabIconName = keyof typeof Ionicons.glyphMap;

export interface TabConfig {
  name: string;
  label: string;
  iconDefault: TabIconName;
  iconFocused: TabIconName;
}

interface ModernTabBarProps extends BottomTabBarProps {
  tabs: TabConfig[];
}

// Animated tab item component
function TabItem({
  tab,
  isFocused,
  onPress,
  onLongPress,
}: {
  tab: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const iconOpacity = useSharedValue(isFocused ? 1 : 0.6);

  React.useEffect(() => {
    iconOpacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
  }, [isFocused, iconOpacity]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: iconOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 300 });
    Haptics.selectionAsync();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.1, { damping: 12, stiffness: 200 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, 100);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={tab.label}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabContent, animatedIconStyle]}>
        <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
          <Ionicons
            name={isFocused ? tab.iconFocused : tab.iconDefault}
            size={24}
            color={isFocused ? colors.primary[500] : colors.neutral[500]}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            isFocused && styles.tabLabelFocused,
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Main modern tab bar component
export function ModernTabBar({ state, descriptors, navigation, tabs }: ModernTabBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(state.index);

  React.useEffect(() => {
    indicatorPosition.value = withSpring(state.index, {
      damping: 20,
      stiffness: 200,
    });
  }, [state.index, indicatorPosition]);

  const tabWidth = SCREEN_WIDTH / tabs.length;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          indicatorPosition.value,
          [0, tabs.length - 1],
          [0, (tabs.length - 1) * tabWidth]
        ),
      },
    ],
  }));

  const bottomPadding = Math.max(insets.bottom, spacing[2]);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* Blur background */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 100}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      {/* Gradient overlay for better visibility */}
      <View style={styles.gradientOverlay} />

      {/* Sliding indicator */}
      <View style={styles.indicatorContainer}>
        <Animated.View
          style={[
            styles.indicator,
            { width: tabWidth },
            indicatorStyle,
          ]}
        >
          <View style={styles.indicatorPill} />
        </Animated.View>
      </View>

      {/* Tab items */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const tab = tabs[index];
          if (!tab) return null;

          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// Simple tab icon for navigators that don't use ModernTabBar yet
export function TabIcon({
  focused,
  iconFocused,
  iconDefault,
  label,
}: {
  focused: boolean;
  iconFocused: TabIconName;
  iconDefault: TabIconName;
  label: string;
}) {
  return (
    <View style={styles.simpleTabIcon}>
      <Ionicons
        name={focused ? iconFocused : iconDefault}
        size={24}
        color={focused ? colors.primary[500] : colors.neutral[500]}
      />
      <Text style={[styles.simpleTabLabel, focused && styles.simpleTabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  indicator: {
    height: 3,
    alignItems: 'center',
  },
  indicatorPill: {
    width: 40,
    height: 3,
    backgroundColor: colors.primary[500],
    borderRadius: 1.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: spacing[3],
    paddingHorizontal: spacing[2],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
  },
  tabContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: spacing[0.5],
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(196, 30, 58, 0.15)',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[500],
    marginTop: 2,
  },
  tabLabelFocused: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  // Simple tab icon styles (for backwards compatibility)
  simpleTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[1],
  },
  simpleTabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  simpleTabLabelFocused: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
});