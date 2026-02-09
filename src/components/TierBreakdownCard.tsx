import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import { TierBreakdown } from '../types';

interface TierBreakdownCardProps {
  breakdown: TierBreakdown | null;
  loading?: boolean;
}

export function TierBreakdownCard({ breakdown, loading }: TierBreakdownCardProps) {
  if (loading) {
    return (
      <Card style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </Card>
    );
  }

  if (!breakdown) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Affiliate Earnings</Text>

      {/* Total Summary */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Earned</Text>
          <Text style={styles.totalValue}>{formatCurrency(breakdown.total_earned)}</Text>
        </View>
        {breakdown.total_pending > 0 && (
          <View style={styles.pendingRow}>
            <Text style={styles.pendingLabel}>Pending</Text>
            <Text style={styles.pendingValue}>{formatCurrency(breakdown.total_pending)}</Text>
          </View>
        )}
      </View>

      {/* Tier Breakdown */}
      <View style={styles.tiersContainer}>
        {/* Tier 1 - Direct Referrals */}
        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>Tier 1</Text>
            </View>
            <Text style={styles.tierRate}>{breakdown.tier1.rate}%</Text>
          </View>
          <Text style={styles.tierDescription}>Direct Referrals</Text>

          <View style={styles.tierStats}>
            <View style={styles.tierStat}>
              <Ionicons name="people" size={16} color={colors.primary[400]} />
              <Text style={styles.tierStatValue}>{breakdown.tier1.total_referrals}</Text>
              <Text style={styles.tierStatLabel}>referrals</Text>
            </View>
            <View style={styles.tierStat}>
              <Ionicons name="cash" size={16} color={colors.success[400]} />
              <Text style={styles.tierStatValue}>{formatCurrency(breakdown.tier1.total_earned)}</Text>
              <Text style={styles.tierStatLabel}>earned</Text>
            </View>
          </View>

          {breakdown.tier1.pending_earned > 0 && (
            <Text style={styles.tierPending}>
              +{formatCurrency(breakdown.tier1.pending_earned)} pending
            </Text>
          )}
        </View>

        {/* Tier 2 - Network Referrals */}
        <View style={[styles.tierCard, styles.tier2Card]}>
          <View style={styles.tierHeader}>
            <View style={[styles.tierBadge, styles.tier2Badge]}>
              <Text style={styles.tierBadgeText}>Tier 2</Text>
            </View>
            <Text style={styles.tierRate}>{breakdown.tier2.rate}%</Text>
          </View>
          <Text style={styles.tierDescription}>Network Referrals</Text>

          <View style={styles.tierStats}>
            <View style={styles.tierStat}>
              <Ionicons name="git-network" size={16} color={colors.secondary[400]} />
              <Text style={styles.tierStatValue}>{breakdown.tier2.total_referrals}</Text>
              <Text style={styles.tierStatLabel}>in network</Text>
            </View>
            <View style={styles.tierStat}>
              <Ionicons name="cash" size={16} color={colors.success[400]} />
              <Text style={styles.tierStatValue}>{formatCurrency(breakdown.tier2.total_earned)}</Text>
              <Text style={styles.tierStatLabel}>earned</Text>
            </View>
          </View>

          {breakdown.tier2.pending_earned > 0 && (
            <Text style={styles.tierPending}>
              +{formatCurrency(breakdown.tier2.pending_earned)} pending
            </Text>
          )}
        </View>
      </View>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <Ionicons name="information-circle" size={14} color={colors.neutral[500]} />
        <Text style={styles.infoNoteText}>
          Tier 1: Earn from your direct referrals. Tier 2: Earn from referrals made by people you referred.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[2],
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[4],
  },
  totalSection: {
    backgroundColor: colors.primary[500] + '15',
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[300],
  },
  totalValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary[400],
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.primary[500] + '30',
  },
  pendingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
  pendingValue: {
    fontSize: typography.fontSize.base,
    color: colors.warning[400],
  },
  tiersContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  tierCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  tier2Card: {
    borderColor: colors.secondary[500] + '30',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  tierBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tier2Badge: {
    backgroundColor: colors.secondary[500],
  },
  tierBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    color: colors.neutral[50],
  },
  tierRate: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[300],
  },
  tierDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    marginBottom: spacing[3],
  },
  tierStats: {
    gap: spacing[2],
  },
  tierStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  tierStatValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[50],
    marginLeft: spacing[1],
  },
  tierStatLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
  },
  tierPending: {
    fontSize: typography.fontSize.xs,
    color: colors.warning[400],
    marginTop: spacing[2],
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoNoteText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    lineHeight: 16,
  },
});