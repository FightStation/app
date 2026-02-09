import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useReferral } from '../../context/ReferralContext';
import { TierBreakdownCard } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type ReferralDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function ReferralDashboardScreen({ navigation }: ReferralDashboardScreenProps) {
  const {
    referralCode,
    affiliateStats,
    referrals,
    loading,
    tierBreakdown,
    tierLoading,
    shareReferralCode,
    copyReferralCode,
  } = useReferral();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Ionicons name="gift" size={28} color={colors.primary[500]} />
              <Text style={styles.codeTitle}>Your Referral Code</Text>
            </View>
            <Text style={styles.codeSubtitle}>
              Share with friends to earn rewards
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.code}>{referralCode?.code}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyReferralCode}
              >
                <Ionicons name="copy-outline" size={20} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareReferralCode}
            >
              <Ionicons name="share-social" size={20} color={colors.textPrimary} />
              <Text style={styles.shareButtonText}>Share with Friends</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.statValue}>{affiliateStats?.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>Total Invites</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{affiliateStats?.completedReferrals || 0}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={24} color={colors.warning} />
              </View>
              <Text style={styles.statValue}>{affiliateStats?.pendingReferrals || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {/* Multi-Tier Earnings Breakdown */}
          <TierBreakdownCard breakdown={tierBreakdown} loading={tierLoading} />

          {/* Future Earnings Preview */}
          <View style={styles.earningsPreview}>
            <View style={styles.earningsHeader}>
              <Ionicons name="trending-up" size={20} color={colors.primary[500]} />
              <Text style={styles.earningsTitle}>Future Earnings</Text>
            </View>
            <Text style={styles.earningsSubtitle}>
              When we launch paid features, you'll earn:
            </Text>
            <View style={styles.earningsList}>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  10% recurring commission on subscriptions
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  10% commission on merchandise sales
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  $5 bonus when friends complete their profile
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  Milestone bonuses: $50, $250, $500
                </Text>
              </View>
            </View>
            <View style={styles.earningsEstimate}>
              <Text style={styles.estimateLabel}>Potential Monthly Earnings</Text>
              <Text style={styles.estimateValue}>
                ${Math.round((affiliateStats?.completedReferrals || 0) * 8.5)} - ${Math.round((affiliateStats?.completedReferrals || 0) * 15)}
              </Text>
              <Text style={styles.estimateNote}>
                Based on {affiliateStats?.completedReferrals || 0} active referrals
              </Text>
            </View>
          </View>

          {/* Referrals List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YOUR REFERRALS</Text>

            {referrals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No referrals yet</Text>
                <Text style={styles.emptySubtitle}>
                  Share your referral code to start earning
                </Text>
              </View>
            ) : (
              referrals.map((referral) => (
                <View key={referral.id} style={styles.referralCard}>
                  <View style={styles.referralIcon}>
                    <Ionicons
                      name={referral.referredUser?.role === 'gym' ? 'business' : 'person'}
                      size={24}
                      color={colors.primary[500]}
                    />
                  </View>

                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>
                      {referral.referredUser?.name || 'Unknown'}
                    </Text>
                    <View style={styles.referralMeta}>
                      <Text style={styles.referralRole}>
                        {referral.referredUser?.role || 'user'}
                      </Text>
                      <Text style={styles.referralDot}>•</Text>
                      <Text style={styles.referralDate}>
                        {formatDate(referral.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      referral.status === 'completed'
                        ? styles.statusCompleted
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        referral.status === 'completed'
                          ? styles.statusTextCompleted
                          : styles.statusTextPending,
                      ]}
                    >
                      {referral.status === 'completed' ? 'Joined' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* How It Works */}
          <View style={styles.howItWorks}>
            <Text style={styles.howTitle}>How It Works</Text>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Share your unique referral code with friends
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                They sign up and complete their profile
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                When paid features launch, you'll earn commissions automatically
              </Text>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    maxWidth: containerMaxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  codeCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  codeTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  codeSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[4],
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderStyle: 'dashed',
  },
  code: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  copyButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  shareButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  earningsPreview: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  earningsTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  earningsSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
  },
  earningsList: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  earningsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  earningsItemText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  earningsEstimate: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  estimateLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing[1],
  },
  estimateValue: {
    color: colors.primary[500],
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  estimateNote: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  referralIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  referralMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  referralRole: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'capitalize',
  },
  referralDot: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  referralDate: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statusCompleted: {
    backgroundColor: `${colors.success}20`,
  },
  statusPending: {
    backgroundColor: `${colors.warning}20`,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  statusTextCompleted: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.warning,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  howItWorks: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  howTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[4],
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  stepText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    paddingTop: spacing[1],
  },
  bottomPadding: {
    height: spacing[10],
  },
});
