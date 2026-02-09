import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  UserTierInfo,
  REFERRAL_TIERS,
  ReferralTierLevel,
} from '../types/referralTier';
import { ReferralBadge } from './ReferralBadge';
import { colors, spacing, typography, borderRadius } from '../lib/theme';

interface TierProgressCardProps {
  tierInfo: UserTierInfo;
  style?: object;
}

export function TierProgressCard({ tierInfo, style }: TierProgressCardProps) {
  const { t } = useTranslation();
  const { tier, referralCount, progress, referralsToNext, nextTier } = tierInfo;

  const isMaxTier = !nextTier;

  return (
    <View style={[styles.container, style]}>
      {/* Current Tier Header */}
      <View style={styles.header}>
        <ReferralBadge tier={tier.level} size="large" showLabel />
        <View style={styles.headerRight}>
          <Text style={styles.referralCount}>{referralCount}</Text>
          <Text style={styles.referralLabel}>
            {t('referral.referrals')}
          </Text>
        </View>
      </View>

      {/* Progress Section */}
      {!isMaxTier ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {t('referral.progressToNext', { tier: nextTier.name })}
            </Text>
            <Text style={styles.progressCount}>
              {referralsToNext} {t('referral.more')}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: tier.badgeColor,
                },
              ]}
            />
          </View>

          {/* Tier Icons */}
          <View style={styles.tierIcons}>
            <View style={styles.tierIconContainer}>
              <View
                style={[
                  styles.tierIconBadge,
                  { backgroundColor: tier.badgeColor },
                ]}
              >
                <Ionicons
                  name={tier.badgeIcon as any}
                  size={12}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.tierIconLabel}>{tier.minReferrals}</Text>
            </View>
            <View style={styles.tierIconContainer}>
              <View
                style={[
                  styles.tierIconBadge,
                  { backgroundColor: nextTier.badgeColor },
                ]}
              >
                <Ionicons
                  name={nextTier.badgeIcon as any}
                  size={12}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.tierIconLabel}>{nextTier.minReferrals}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.maxTierSection}>
          <Ionicons
            name="trophy"
            size={24}
            color={colors.primary[500]}
          />
          <Text style={styles.maxTierText}>
            {t('referral.maxTierReached')}
          </Text>
        </View>
      )}

      {/* Current Perks */}
      {tier.perks.length > 0 && (
        <View style={styles.perksSection}>
          <Text style={styles.perksTitle}>{t('referral.yourPerks')}</Text>
          {tier.perks.map((perk, index) => (
            <View key={index} style={styles.perkItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Next Tier Perks Preview */}
      {nextTier && nextTier.perks.length > tier.perks.length && (
        <View style={styles.nextPerksSection}>
          <Text style={styles.nextPerksTitle}>
            {t('referral.unlockAt', { tier: nextTier.name })}
          </Text>
          {nextTier.perks
            .filter((perk) => !tier.perks.includes(perk))
            .slice(0, 2)
            .map((perk, index) => (
              <View key={index} style={styles.perkItem}>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <Text style={styles.lockedPerkText}>{perk}</Text>
              </View>
            ))}
        </View>
      )}

      {/* Affiliate Rate Info */}
      <View style={styles.rateSection}>
        <View style={styles.rateItem}>
          <Text style={styles.rateValue}>{tier.affiliateRate}%</Text>
          <Text style={styles.rateLabel}>{t('referral.directRate')}</Text>
        </View>
        <View style={styles.rateDivider} />
        <View style={styles.rateItem}>
          <Text style={styles.rateValue}>{tier.tier2Rate}%</Text>
          <Text style={styles.rateLabel}>{t('referral.indirectRate')}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Compact version for dashboard widgets
 */
interface CompactTierCardProps {
  tierInfo: UserTierInfo;
  onPress?: () => void;
}

export function CompactTierCard({ tierInfo, onPress }: CompactTierCardProps) {
  const { t } = useTranslation();
  const { tier, referralCount, progress, referralsToNext, nextTier } = tierInfo;

  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactHeader}>
        <ReferralBadge tier={tier.level} size="medium" />
        <View style={styles.compactInfo}>
          <Text style={styles.compactTierName}>{tier.name}</Text>
          <Text style={styles.compactReferrals}>
            {referralCount} {t('referral.referrals')}
          </Text>
        </View>
        {nextTier && (
          <View style={styles.compactProgress}>
            <Text style={styles.compactProgressText}>
              {referralsToNext} to {nextTier.name}
            </Text>
          </View>
        )}
      </View>

      {nextTier && (
        <View style={styles.compactProgressBar}>
          <View
            style={[
              styles.compactProgressFill,
              {
                width: `${progress}%`,
                backgroundColor: tier.badgeColor,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

/**
 * All tiers overview for info/FAQ
 */
export function AllTiersOverview() {
  const { t } = useTranslation();
  const tiers: ReferralTierLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

  return (
    <View style={styles.allTiersContainer}>
      <Text style={styles.allTiersTitle}>{t('referral.tierLevels')}</Text>
      {tiers.map((tierLevel) => {
        const tier = REFERRAL_TIERS[tierLevel];
        return (
          <View key={tierLevel} style={styles.allTiersRow}>
            <View
              style={[
                styles.allTiersBadge,
                { backgroundColor: tier.badgeColor },
              ]}
            >
              <Ionicons
                name={tier.badgeIcon as any}
                size={14}
                color={tierLevel === 'diamond' ? colors.primary[700] : '#FFFFFF'}
              />
            </View>
            <View style={styles.allTiersInfo}>
              <Text style={styles.allTiersName}>{tier.name}</Text>
              <Text style={styles.allTiersRequirement}>
                {tier.minReferrals}+ {t('referral.referrals')}
              </Text>
            </View>
            <View style={styles.allTiersRates}>
              <Text style={styles.allTiersRate}>{tier.affiliateRate}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  referralCount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  referralLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  // Progress section
  progressSection: {
    marginBottom: spacing[4],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  progressCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary[500],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  tierIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  tierIconContainer: {
    alignItems: 'center',
  },
  tierIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierIconLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Max tier
  maxTierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: `${colors.primary[500]}15`,
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  maxTierText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[500],
  },
  // Perks section
  perksSection: {
    marginBottom: spacing[3],
  },
  perksTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  perkText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Next perks
  nextPerksSection: {
    marginBottom: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextPerksTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing[2],
  },
  lockedPerkText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  // Rate section
  rateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
  },
  rateValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.primary[500],
  },
  rateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  rateDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  // Compact styles
  compactContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  compactInfo: {
    flex: 1,
  },
  compactTierName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  compactReferrals: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  compactProgress: {
    alignItems: 'flex-end',
  },
  compactProgressText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
  },
  compactProgressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // All tiers overview
  allTiersContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  allTiersTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[3],
  },
  allTiersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  allTiersBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allTiersInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  allTiersName: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  allTiersRequirement: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  allTiersRates: {
    alignItems: 'flex-end',
  },
  allTiersRate: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary[500],
  },
});