import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Fighter, WEIGHT_CLASS_LABELS, EXPERIENCE_LABELS } from '../types';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

interface FighterCardProps {
  fighter: Fighter;
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export function FighterCard({ fighter, onPress, variant = 'default' }: FighterCardProps) {
  const initials = `${fighter.first_name.charAt(0)}${fighter.last_name.charAt(0)}`;

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={!onPress}
      >
        <View style={styles.compactAvatar}>
          {fighter.avatar_url ? (
            <Image source={{ uri: fighter.avatar_url }} style={styles.compactAvatarImage} />
          ) : (
            <Text style={styles.compactAvatarText}>{initials}</Text>
          )}
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>
            {fighter.first_name} {fighter.last_name}
          </Text>
          <Text style={styles.compactMeta}>
            {WEIGHT_CLASS_LABELS[fighter.weight_class].split(' ')[0]} • {fighter.city}
          </Text>
        </View>
        <View style={styles.compactBadge}>
          <Text style={styles.compactBadgeText}>
            {EXPERIENCE_LABELS[fighter.experience_level].split(' ')[0]}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {fighter.avatar_url ? (
            <Image source={{ uri: fighter.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>
            {fighter.first_name} {fighter.last_name}
          </Text>
          <Text style={styles.fighterId}>
            FIGHTER ID: {fighter.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.location}>
            {fighter.city}, {fighter.country}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {WEIGHT_CLASS_LABELS[fighter.weight_class].split(' ')[0]}
          </Text>
          <Text style={styles.statLabel}>WEIGHT</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{fighter.sparring_count}</Text>
          <Text style={styles.statLabel}>SESSIONS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {EXPERIENCE_LABELS[fighter.experience_level].split(' ')[0]}
          </Text>
          <Text style={styles.statLabel}>LEVEL</Text>
        </View>
      </View>

      {/* Bio Preview */}
      {fighter.bio && variant === 'detailed' && (
        <Text style={styles.bio} numberOfLines={2}>
          {fighter.bio}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.neutral[50],
    letterSpacing: 1,
  },
  headerInfo: {
    marginLeft: spacing[4],
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.neutral[50],
    letterSpacing: 1,
  },
  fighterId: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: spacing[1],
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.neutral[50],
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: spacing[1],
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.neutral[800],
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginTop: spacing[4],
    lineHeight: 20,
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[800],
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[800],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  compactAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  compactAvatarText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.neutral[50],
  },
  compactInfo: {
    marginLeft: spacing[3],
    flex: 1,
  },
  compactName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
  },
  compactMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: 2,
  },
  compactBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  compactBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    fontWeight: '600',
  },
});
