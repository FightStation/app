/**
 * Referral Tier System
 *
 * Gamified status system that rewards users for referrals with:
 * - Visual badges displayed on profiles
 * - Better affiliate commission rates
 * - Priority perks (event requests, visibility)
 */

export type ReferralTierLevel = 'member' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface ReferralTier {
  level: ReferralTierLevel;
  name: string;
  minReferrals: number;
  maxReferrals: number | null; // null = unlimited
  badgeColor: string;
  badgeIcon: string;
  affiliateRate: number; // percentage (e.g., 10 = 10%)
  tier2Rate: number; // percentage for indirect referrals
  perks: string[];
}

export const REFERRAL_TIERS: Record<ReferralTierLevel, ReferralTier> = {
  member: {
    level: 'member',
    name: 'Member',
    minReferrals: 0,
    maxReferrals: 2,
    badgeColor: '#6B7280', // gray
    badgeIcon: 'person-outline',
    affiliateRate: 10,
    tier2Rate: 3,
    perks: [],
  },
  bronze: {
    level: 'bronze',
    name: 'Bronze',
    minReferrals: 3,
    maxReferrals: 9,
    badgeColor: '#CD7F32', // bronze
    badgeIcon: 'shield',
    affiliateRate: 12,
    tier2Rate: 4,
    perks: ['Bronze badge on profile'],
  },
  silver: {
    level: 'silver',
    name: 'Silver',
    minReferrals: 10,
    maxReferrals: 24,
    badgeColor: '#C0C0C0', // silver
    badgeIcon: 'shield',
    affiliateRate: 14,
    tier2Rate: 5,
    perks: [
      'Silver badge on profile',
      'Priority event requests',
    ],
  },
  gold: {
    level: 'gold',
    name: 'Gold',
    minReferrals: 25,
    maxReferrals: 49,
    badgeColor: '#FFD700', // gold
    badgeIcon: 'shield',
    affiliateRate: 16,
    tier2Rate: 6,
    perks: [
      'Gold badge on profile',
      'Priority event requests',
      'Featured in "Top Referrers"',
    ],
  },
  platinum: {
    level: 'platinum',
    name: 'Platinum',
    minReferrals: 50,
    maxReferrals: 99,
    badgeColor: '#E5E4E2', // platinum
    badgeIcon: 'diamond',
    affiliateRate: 18,
    tier2Rate: 7,
    perks: [
      'Platinum badge + "Ambassador" title',
      'Priority event requests',
      'Featured in "Top Referrers"',
      'Early access to new features',
    ],
  },
  diamond: {
    level: 'diamond',
    name: 'Diamond',
    minReferrals: 100,
    maxReferrals: null,
    badgeColor: '#B9F2FF', // diamond blue
    badgeIcon: 'diamond',
    affiliateRate: 20,
    tier2Rate: 8,
    perks: [
      'Diamond badge + verified checkmark',
      'Priority event requests',
      'Permanent "Top Referrers" spot',
      'Early access to new features',
      'Direct line to founders',
    ],
  },
};

// Ordered array for easy iteration
export const TIER_ORDER: ReferralTierLevel[] = [
  'member',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
];

/**
 * Get tier level based on referral count
 */
export function getTierForReferralCount(count: number): ReferralTier {
  // Iterate in reverse to find highest matching tier
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = REFERRAL_TIERS[TIER_ORDER[i]];
    if (count >= tier.minReferrals) {
      return tier;
    }
  }
  return REFERRAL_TIERS.member;
}

/**
 * Get next tier (for progress display)
 */
export function getNextTier(currentLevel: ReferralTierLevel): ReferralTier | null {
  const currentIndex = TIER_ORDER.indexOf(currentLevel);
  if (currentIndex === TIER_ORDER.length - 1) {
    return null; // Already at max tier
  }
  return REFERRAL_TIERS[TIER_ORDER[currentIndex + 1]];
}

/**
 * Calculate progress to next tier (0-100)
 */
export function getTierProgress(referralCount: number): number {
  const currentTier = getTierForReferralCount(referralCount);
  const nextTier = getNextTier(currentTier.level);

  if (!nextTier) {
    return 100; // Max tier reached
  }

  const progressInTier = referralCount - currentTier.minReferrals;
  const tierRange = nextTier.minReferrals - currentTier.minReferrals;

  return Math.min(100, Math.round((progressInTier / tierRange) * 100));
}

/**
 * Get referrals needed for next tier
 */
export function getReferralsToNextTier(referralCount: number): number | null {
  const currentTier = getTierForReferralCount(referralCount);
  const nextTier = getNextTier(currentTier.level);

  if (!nextTier) {
    return null; // Already at max tier
  }

  return nextTier.minReferrals - referralCount;
}

export interface UserTierInfo {
  tier: ReferralTier;
  referralCount: number;
  progress: number;
  referralsToNext: number | null;
  nextTier: ReferralTier | null;
}

/**
 * Get complete tier info for a user
 */
export function getUserTierInfo(referralCount: number): UserTierInfo {
  const tier = getTierForReferralCount(referralCount);
  const nextTier = getNextTier(tier.level);

  return {
    tier,
    referralCount,
    progress: getTierProgress(referralCount),
    referralsToNext: getReferralsToNextTier(referralCount),
    nextTier,
  };
}