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

type CoachReferralDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function CoachReferralDashboardScreen({ navigation }: CoachReferralDashboardScreenProps) {
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconRow}>
              <View style={styles.heroIconBg}>
                <Ionicons name="people" size={32} color={colors.primary[500]} />
              </View>
            </View>
            <Text style={styles.heroTitle}>Grow Your Network</Text>
            <Text style={styles.heroSubtitle}>
              Refer students, fellow coaches, and gyms. Earn commissions when they join and train.
            </Text>
          </View>

          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Ionicons name="gift" size={24} color={colors.primary[500]} />
              <Text style={styles.codeTitle}>Your Referral Code</Text>
            </View>

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
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.statValue}>{affiliateStats?.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
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

          {/* Tier Breakdown */}
          <TierBreakdownCard breakdown={tierBreakdown} loading={tierLoading} />

          {/* Coach-Specific Earnings Preview */}
          <View style={styles.earningsPreview}>
            <View style={styles.earningsHeader}>
              <Ionicons name="trending-up" size={20} color={colors.primary[500]} />
              <Text style={styles.earningsTitle}>Coach Earnings</Text>
            </View>
            <Text style={styles.earningsSubtitle}>
              Your referral commission structure:
            </Text>
            <View style={styles.earningsList}>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  10% on student subscriptions (Tier 1)
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  3% from your network's activity (Tier 2)
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  Bonus when referred students join events
                </Text>
              </View>
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
                  Share your code with students and fellow coaches
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
                      <Text style={styles.referralDot}>&middot;</Text>
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

          {/* Tips for Coaches */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Tips for Coaches</Text>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={styles.tipText}>
                Share your code at the end of training sessions
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={styles.tipText}>
                Post your referral link on your social media profiles
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={styles.tipText}>
                Encourage students to refer their training partners
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

  // Hero
  heroCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  heroIconRow: {
    marginBottom: spacing[3],
  },
  heroIconBg: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Code Card
  codeCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  codeTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
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

  // Stats
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

  // Earnings
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

  // Referrals
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

  // Tips
  tipsCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  tipsTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[4],
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  tipText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    paddingTop: spacing[0.5],
  },

  bottomPadding: {
    height: spacing[10],
  },
});