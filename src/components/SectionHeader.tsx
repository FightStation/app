import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../lib/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}

export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = 'See All',
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          <View style={styles.accentLine} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {onSeeAll && (
          <Pressable
            onPress={onSeeAll}
            style={styles.seeAllButton}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>{seeAllLabel}</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  accentLine: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
  },
  title: {
    ...textStyles.sectionHeader,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing[1],
    marginLeft: spacing[2] + 3, // align with title text past accent line
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
});
