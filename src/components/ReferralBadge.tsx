import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReferralTierLevel, REFERRAL_TIERS } from '../types/referralTier';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

interface ReferralBadgeProps {
  tier: ReferralTierLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showVerified?: boolean;
}

const SIZES = {
  small: { icon: 12, badge: 18, fontSize: 10 },
  medium: { icon: 16, badge: 24, fontSize: 12 },
  large: { icon: 24, badge: 36, fontSize: 14 },
};

export function ReferralBadge({
  tier,
  size = 'medium',
  showLabel = false,
  showVerified = true,
}: ReferralBadgeProps) {
  const tierInfo = REFERRAL_TIERS[tier];
  const sizeConfig = SIZES[size];

  // Don't show badge for basic members
  if (tier === 'member') {
    return null;
  }

  const isDiamond = tier === 'diamond';
  const isPlatinumOrHigher = tier === 'platinum' || tier === 'diamond';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            width: sizeConfig.badge,
            height: sizeConfig.badge,
            backgroundColor: tierInfo.badgeColor,
          },
          isDiamond && styles.diamondBadge,
        ]}
      >
        <Ionicons
          name={tierInfo.badgeIcon as any}
          size={sizeConfig.icon}
          color={isDiamond ? colors.primary[700] : '#FFFFFF'}
        />
      </View>

      {/* Verified checkmark for Diamond tier */}
      {isDiamond && showVerified && (
        <View style={[styles.verifiedBadge, { right: -sizeConfig.badge * 0.3 }]}>
          <Ionicons
            name="checkmark-circle"
            size={sizeConfig.icon * 0.8}
            color={colors.primary[500]}
          />
        </View>
      )}

      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize: sizeConfig.fontSize },
            isPlatinumOrHigher && styles.ambassadorLabel,
          ]}
        >
          {isPlatinumOrHigher ? 'Ambassador' : tierInfo.name}
        </Text>
      )}
    </View>
  );
}

/**
 * Inline badge for use next to usernames
 */
interface InlineBadgeProps {
  tier: ReferralTierLevel;
}

export function InlineReferralBadge({ tier }: InlineBadgeProps) {
  if (tier === 'member') {
    return null;
  }

  const tierInfo = REFERRAL_TIERS[tier];
  const isDiamond = tier === 'diamond';

  return (
    <View style={styles.inlineContainer}>
      <View
        style={[
          styles.inlineBadge,
          { backgroundColor: tierInfo.badgeColor },
          isDiamond && styles.diamondInline,
        ]}
      >
        <Ionicons
          name={tierInfo.badgeIcon as any}
          size={10}
          color={isDiamond ? colors.primary[700] : '#FFFFFF'}
        />
      </View>
      {isDiamond && (
        <Ionicons
          name="checkmark-circle"
          size={12}
          color={colors.primary[500]}
          style={styles.inlineVerified}
        />
      )}
    </View>
  );
}

/**
 * Full tier display with name and badge
 */
interface TierDisplayProps {
  tier: ReferralTierLevel;
  referralCount?: number;
}

export function TierDisplay({ tier, referralCount }: TierDisplayProps) {
  const tierInfo = REFERRAL_TIERS[tier];
  const isPlatinumOrHigher = tier === 'platinum' || tier === 'diamond';

  return (
    <View style={styles.tierDisplayContainer}>
      <ReferralBadge tier={tier} size="large" />
      <View style={styles.tierDisplayInfo}>
        <Text style={styles.tierDisplayName}>
          {isPlatinumOrHigher ? `${tierInfo.name} Ambassador` : tierInfo.name}
        </Text>
        {referralCount !== undefined && (
          <Text style={styles.tierDisplayCount}>
            {referralCount} referral{referralCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  badge: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  diamondBadge: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: spacing[1],
  },
  ambassadorLabel: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[1],
  },
  inlineBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondInline: {
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  inlineVerified: {
    marginLeft: 2,
  },
  // Tier display styles
  tierDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  tierDisplayInfo: {
    flex: 1,
  },
  tierDisplayName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tierDisplayCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});