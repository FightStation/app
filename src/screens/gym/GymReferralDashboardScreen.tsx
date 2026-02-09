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
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type GymReferralDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function GymReferralDashboardScreen({ navigation }: GymReferralDashboardScreenProps) {
  const {
    referralCode,
    affiliateStats,
    referrals,
    loading,
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
          <Text style={styles.headerTitle}>Gym Referral Program</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Gym-Specific Hero */}
          <View style={styles.heroCard}>
            <Ionicons name="trophy" size={48} color={colors.primary[500]} />
            <Text style={styles.heroTitle}>Grow Your Community</Text>
            <Text style={styles.heroSubtitle}>
              Invite your fighters to join the platform and earn commissions when they purchase merchandise or premium features
            </Text>
          </View>

          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Ionicons name="qr-code" size={28} color={colors.primary[500]} />
              <Text style={styles.codeTitle}>Your Gym Referral Code</Text>
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
              <Text style={styles.shareButtonText}>Share with Your Fighters</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconLarge}>
                <Ionicons name="people" size={28} color={colors.primary[500]} />
              </View>
              <Text style={styles.statValue}>{affiliateStats?.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>Total Invites</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconLarge}>
                <Ionicons name="body" size={28} color={colors.info} />
              </View>
              <Text style={styles.statValue}>{affiliateStats?.fighterReferrals || 0}</Text>
              <Text style={styles.statLabel}>Fighters</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCardSmall}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <View>
                <Text style={styles.statValueSmall}>{affiliateStats?.completedReferrals || 0}</Text>
                <Text style={styles.statLabelSmall}>Active</Text>
              </View>
            </View>
            <View style={styles.statCardSmall}>
              <Ionicons name="time" size={20} color={colors.warning} />
              <View>
                <Text style={styles.statValueSmall}>{affiliateStats?.pendingReferrals || 0}</Text>
                <Text style={styles.statLabelSmall}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Future Earnings for Gyms */}
          <View style={styles.earningsPreview}>
            <View style={styles.earningsHeader}>
              <Ionicons name="cash" size={24} color={colors.primary[500]} />
              <Text style={styles.earningsTitle}>Future Revenue Stream</Text>
            </View>
            <Text style={styles.earningsSubtitle}>
              When we launch our marketplace, you'll earn from your fighters:
            </Text>
            <View style={styles.earningsList}>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  <Text style={styles.bold}>20% recurring</Text> commission on premium subscriptions (12 months)
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  <Text style={styles.bold}>15% commission</Text> on all merchandise sales to your fighters
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  <Text style={styles.bold}>25% one-time</Text> commission on premium feature purchases
                </Text>
              </View>
              <View style={styles.earningsItem}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.earningsItemText}>
                  <Text style={styles.bold}>Milestone bonuses</Text> at 10, 50, and 100 referrals
                </Text>
              </View>
            </View>
            <View style={styles.earningsEstimate}>
              <Text style={styles.estimateLabel}>Estimated Monthly Potential</Text>
              <Text style={styles.estimateValue}>
                ${Math.round((affiliateStats?.completedReferrals || 0) * 12)} - ${Math.round((affiliateStats?.completedReferrals || 0) * 25)}
              </Text>
              <Text style={styles.estimateNote}>
                Per fighter (based on {affiliateStats?.completedReferrals || 0} active referrals)
              </Text>
              <Text style={styles.estimateTotal}>
                Total: ${Math.round((affiliateStats?.completedReferrals || 0) * 12 * (affiliateStats?.completedReferrals || 0))} - ${Math.round((affiliateStats?.completedReferrals || 0) * 25 * (affiliateStats?.completedReferrals || 0))}/mo
              </Text>
            </View>
          </View>

          {/* Referred Fighters List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>YOUR FIGHTERS ON PLATFORM</Text>

            {referrals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No referrals yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start inviting your fighters to join
                </Text>
              </View>
            ) : (
              referrals.map((referral) => (
                <View key={referral.id} style={styles.referralCard}>
                  <View style={styles.referralIcon}>
                    <Ionicons
                      name={referral.referredUser?.role === 'gym' ? 'business' : 'body'}
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
                      {referral.status === 'completed' ? 'Active' : 'Invited'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Tips for Gyms */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color={colors.primary[500]} />
              <Text style={styles.tipsTitle}>Maximizing Your Earnings</Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>💪</Text>
              <Text style={styles.tipText}>
                Post your referral code in your gym's common areas
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>📱</Text>
              <Text style={styles.tipText}>
                Share via WhatsApp group or gym app
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>🎯</Text>
              <Text style={styles.tipText}>
                Mention benefits: find sparring partners, track progress
              </Text>
            </View>
            <View style={styles.tip}>
              <Text style={styles.tipNumber}>🏆</Text>
              <Text style={styles.tipText}>
                Encourage active fighters first - they'll bring friends
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
    fontSize: typography.fontSize.lg,
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
  heroCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 2,
    borderColor: colors.primary[500],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
  },
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
    marginBottom: spacing[4],
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
    marginBottom: spacing[3],
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
  statIconLarge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[1],
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCardSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValueSmall: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabelSmall: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
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
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  earningsItemText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  bold: {
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
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
    marginBottom: spacing[2],
  },
  estimateTotal: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
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
  tipsCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  tipsTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  tipNumber: {
    fontSize: typography.fontSize.xl,
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
