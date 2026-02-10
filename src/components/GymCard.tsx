import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, gradients, glass } from '../lib/theme';
import { MockGym } from '../lib/mockData';

interface GymCardProps {
  gym: MockGym;
  onPress?: () => void;
  onRequestSparring?: () => void;
}

export function GymCard({ gym, onPress, onRequestSparring }: GymCardProps) {
  const getBadgeStyle = (badge?: 'high' | 'hard' | 'all_levels') => {
    switch (badge) {
      case 'high':
        return { bg: colors.badge.highIntensity, label: 'HIGH INTENSITY' };
      case 'hard':
        return { bg: colors.badge.hardSparring, label: 'HARD SPARRING' };
      case 'all_levels':
        return { bg: colors.badge.allLevels, label: 'ALL LEVELS' };
      default:
        return null;
    }
  };

  const badge = getBadgeStyle(gym.intensityBadge);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {/* Image with badge overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: gym.image }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient overlay for better text readability */}
        <LinearGradient
          colors={gradients.heroOverlay}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Intensity Badge */}
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={styles.badgeText}>{badge.label}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Gym name and verification */}
        <View style={styles.nameRow}>
          <Text style={styles.gymName}>{gym.name}</Text>
          {gym.isVerified && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.secondary[500]}
              style={styles.verifiedIcon}
            />
          )}
        </View>

        {/* Location and session type */}
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {gym.distance} • {gym.sessionType}
          </Text>
        </View>

        {/* Weight class tags */}
        <View style={styles.tagsRow}>
          {gym.weightClasses.map((wc, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>
                {wc.count}x {wc.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Bottom row: avatars and request button */}
        <View style={styles.bottomRow}>
          {/* Member avatars */}
          <View style={styles.avatarsContainer}>
            <View style={styles.avatarStack}>
              {gym.memberAvatars.slice(0, 3).map((letter, index) => (
                <View
                  key={index}
                  style={[
                    styles.avatar,
                    { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index },
                  ]}
                >
                  <Text style={styles.avatarText}>{letter}</Text>
                </View>
              ))}
            </View>
            {gym.memberCount > 3 && (
              <View style={styles.moreCount}>
                <Text style={styles.moreCountText}>+{gym.memberCount - 3}</Text>
              </View>
            )}
          </View>

          {/* Request Sparring button */}
          <TouchableOpacity
            style={styles.requestButton}
            onPress={onRequestSparring}
            activeOpacity={0.8}
          >
            <Text style={styles.requestButtonText}>Request Sparring</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: glass.light.backgroundColor,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: glass.light.borderColor,
    ...(Platform.OS === 'web' ? {
      // @ts-ignore
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } : {}),
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  gymName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.bold,
  },
  verifiedIcon: {
    marginLeft: spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginLeft: spacing[1],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBg,
  },
  avatarText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  moreCount: {
    marginLeft: spacing[2],
    backgroundColor: colors.primary[500],
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCountText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  requestButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.lg,
  },
  requestButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
