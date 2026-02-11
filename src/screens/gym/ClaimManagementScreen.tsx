import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GradientButton,
  StatCard,
  BadgeRow,
  EmptyState,
  AnimatedListItem,
} from '../../components';
import {
  getAllPendingClaims,
  getAllClaimRequests,
  approveGymClaim,
  rejectGymClaim,
  getClaimStats,
} from '../../services/gymDirectory';
import {
  DirectoryGym,
  GymClaimRequest,
  ClaimStatus,
  getCountryFlag,
  COMBAT_SPORT_LABELS,
} from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

type ClaimWithGym = GymClaimRequest & { gym: DirectoryGym };

type ClaimManagementScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

export function ClaimManagementScreen({ navigation }: ClaimManagementScreenProps) {
  const { t } = useTranslation();

  const [claims, setClaims] = useState<ClaimWithGym[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectClaimId, setRejectClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsData, statsData] = await Promise.all([
        activeTab === 'all'
          ? getAllClaimRequests()
          : getAllClaimRequests(activeTab === 'pending' ? 'pending' : activeTab),
        getClaimStats(),
      ]);
      setClaims(claimsData as ClaimWithGym[]);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading claims:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [activeTab]);

  const handleApprove = async (claimId: string, gymName: string) => {
    Alert.alert(
      t('admin.approveClaim'),
      t('admin.approveClaimConfirm', { gymName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.approve'),
          onPress: async () => {
            setProcessingId(claimId);
            try {
              await approveGymClaim(claimId);
              Alert.alert(t('common.success'), t('admin.claimApprovedSuccess'));
              loadData();
            } catch (error) {
              console.error('Error approving claim:', error);
              Alert.alert(t('common.error'), t('errors.generic'));
            }
            setProcessingId(null);
          },
        },
      ]
    );
  };

  const handleRejectPress = (claimId: string) => {
    setRejectClaimId(claimId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectClaimId) return;

    if (!rejectReason.trim()) {
      Alert.alert(t('common.error'), t('admin.rejectReasonRequired'));
      return;
    }

    setProcessingId(rejectClaimId);
    setShowRejectModal(false);

    try {
      await rejectGymClaim(rejectClaimId, rejectReason.trim());
      Alert.alert(t('common.success'), t('admin.claimRejectedSuccess'));
      loadData();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    }
    setProcessingId(null);
    setRejectClaimId(null);
    setRejectReason('');
  };

  const getVerificationMethodLabel = (method: string): string => {
    switch (method) {
      case 'email':
        return t('directory.emailVerification');
      case 'phone':
        return t('directory.phoneVerification');
      case 'manual':
        return t('directory.manualReview');
      default:
        return method;
    }
  };

  const getStatusBadgeStyle = (status: ClaimStatus) => {
    switch (status) {
      case 'approved':
        return { backgroundColor: colors.success + '20', color: colors.success };
      case 'rejected':
        return { backgroundColor: colors.error + '20', color: colors.error };
      case 'verifying':
        return { backgroundColor: colors.warning + '20', color: colors.warning };
      default:
        return { backgroundColor: colors.primary[500] + '20', color: colors.primary[500] };
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabItems = [
    { key: 'pending', label: `${t('admin.pending')} (${stats.pending})` },
    { key: 'approved', label: `${t('admin.approved')} (${stats.approved})` },
    { key: 'rejected', label: `${t('admin.rejected')} (${stats.rejected})` },
    { key: 'all', label: `${t('admin.all')} (${stats.total})` },
  ];

  const renderClaimCard = (claim: ClaimWithGym, index: number) => {
    const isProcessing = processingId === claim.id;
    const statusStyle = getStatusBadgeStyle(claim.status);

    return (
      <AnimatedListItem key={claim.id} index={index}>
        <GlassCard style={styles.claimCard}>
          {/* Header with gym info */}
          <View style={styles.cardHeader}>
            <View style={styles.gymInfo}>
              <Text style={styles.gymName}>{claim.gym.name}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.countryFlag}>{getCountryFlag(claim.gym.country_code)}</Text>
                <Text style={styles.location}>
                  {claim.gym.city}, {claim.gym.country_name}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {claim.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Sports */}
          <View style={styles.sportsRow}>
            {claim.gym.sports.map((sport) => (
              <View key={sport} style={styles.sportBadge}>
                <Text style={styles.sportText}>{COMBAT_SPORT_LABELS[sport] || sport}</Text>
              </View>
            ))}
          </View>

          {/* Claim details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.neutral[500]} />
              <Text style={styles.detailLabel}>{t('directory.verificationMethod')}:</Text>
              <Text style={styles.detailValue}>
                {getVerificationMethodLabel(claim.verification_method)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.neutral[500]} />
              <Text style={styles.detailLabel}>{t('directory.submittedOn')}:</Text>
              <Text style={styles.detailValue}>{formatDate(claim.created_at)}</Text>
            </View>

            {claim.proof_document_url && (
              <View style={styles.detailRow}>
                <Ionicons name="document-attach-outline" size={16} color={colors.neutral[500]} />
                <Text style={styles.detailLabel}>{t('admin.proofDocument')}:</Text>
                <TouchableOpacity>
                  <Text style={[styles.detailValue, styles.linkText]}>{t('admin.viewDocument')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {claim.rejected_reason && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>{t('admin.rejectionReason')}:</Text>
                <Text style={styles.reasonText}>{claim.rejected_reason}</Text>
              </View>
            )}
          </View>

          {/* Action buttons (only for pending claims) */}
          {claim.status === 'pending' && (
            <View style={styles.actionButtons}>
              <GradientButton
                title={isProcessing ? t('common.processing') : t('common.approve')}
                onPress={() => handleApprove(claim.id, claim.gym.name)}
                disabled={isProcessing}
                style={styles.approveButton}
                size="sm"
              />
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectPress(claim.id)}
                disabled={isProcessing}
              >
                <Text style={styles.rejectButtonText}>{t('common.reject')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>
      </AnimatedListItem>
    );
  };

  const renderRejectModal = () => (
    <Modal
      visible={showRejectModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View style={styles.modalOverlay}>
        <GlassCard intensity="dark" style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('admin.rejectClaim')}</Text>
          <Text style={styles.modalSubtitle}>{t('admin.rejectClaimSubtitle')}</Text>

          <TextInput
            style={styles.reasonInput}
            placeholder={t('admin.rejectReasonPlaceholder')}
            placeholderTextColor={colors.neutral[500]}
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
            numberOfLines={4}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowRejectModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <GradientButton
              title={t('common.reject')}
              onPress={handleRejectConfirm}
              style={styles.modalRejectButton}
              size="sm"
              gradient={[colors.error, '#991B1B'] as readonly [string, string]}
            />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[50]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.claimManagement')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="time"
          value={stats.pending}
          label={t('admin.pending')}
          accentColor={colors.primary[500]}
        />
        <StatCard
          icon="checkmark-circle"
          value={stats.approved}
          label={t('admin.approved')}
          accentColor={colors.success}
        />
        <StatCard
          icon="close-circle"
          value={stats.rejected}
          label={t('admin.rejected')}
          accentColor={colors.error}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <BadgeRow
          items={tabItems}
          selected={activeTab}
          onSelect={(key) => setActiveTab(key as FilterTab)}
        />
      </View>

      {/* Claims List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <ScrollView
          style={styles.claimsList}
          contentContainerStyle={styles.claimsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
          }
        >
          {claims.length === 0 ? (
            <EmptyState
              icon="checkmark-done-circle-outline"
              title={t('admin.noClaimsTitle')}
              description={t('admin.noClaimsSubtitle')}
            />
          ) : (
            claims.map((claim, index) => renderClaimCard(claim, index))
          )}
        </ScrollView>
      )}

      {/* Reject Modal */}
      {renderRejectModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[800],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
  },
  tabsContainer: {
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[800],
    paddingBottom: spacing[3],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimsList: {
    flex: 1,
  },
  claimsListContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  claimCard: {
    marginBottom: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  gymInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  gymName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  countryFlag: {
    fontSize: 14,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sportBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  sportText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    paddingTop: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    fontWeight: '500',
  },
  linkText: {
    color: colors.primary[400],
    textDecorationLine: 'underline',
  },
  reasonBox: {
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginTop: spacing[2],
  },
  reasonLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  reasonText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    paddingTop: spacing[4],
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[2],
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginBottom: spacing[4],
  },
  reasonInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    color: colors.neutral[50],
    fontSize: typography.fontSize.base,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing[4],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.neutral[300],
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  modalRejectButton: {
    flex: 1,
  },
});
