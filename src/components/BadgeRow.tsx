import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '../lib/theme';

interface BadgeItem {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface BadgeRowProps {
  items: BadgeItem[];
  selected: string;
  onSelect: (key: string) => void;
  style?: object;
}

export function BadgeRow({ items, selected, onSelect, style }: BadgeRowProps) {
  const handleSelect = (key: string) => {
    Haptics.selectionAsync();
    onSelect(key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {items.map((item) => {
        const isActive = selected === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => handleSelect(item.key)}
            style={[
              styles.badge,
              isActive && styles.badgeActive,
            ]}
          >
            {item.icon && (
              <Ionicons
                name={item.icon}
                size={14}
                color={isActive ? '#FFFFFF' : colors.textSecondary}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.badgeText,
                isActive && styles.badgeTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  badgeActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  icon: {
    marginRight: spacing[1],
  },
  badgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
});
