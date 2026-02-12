import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getAllPendingClaims,
  getAllClaimRequests,
  approveGymClaim,
  rejectGymClaim,
  getClaimStats,
} from '../../services/gymDirectory';
import { GymClaimRequest, DirectoryGym, ClaimStatus, ClaimVerificationMethod, COMBAT_SPORT_LABELS, CombatSport } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
  EmptyState,
  BadgeRow,
  AnimatedListItem,
} from '../../components';

type GymDirectoryAdminScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
};

type ClaimWithGym = GymClaimRequest & { gym: DirectoryGym };

type TabType = 'pending' | 'all';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 700 : width;

export function GymDirectoryAdminScreen({ navigation }: GymDirectoryAdminScreenProps) {
  const [claims, setClaims] = useState<ClaimWithGym[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [claimsData, statsData] = await Promise.all([
        activeTab === 'pending' ? getAllPendingClaims() : getAllClaimRequests(),
        getClaimStats(),
      ]);
      setClaims(claimsData as ClaimWithGym[]);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading claims:', err);
      setError('Failed to load claims');
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    fetchInitial();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  const handleApprove = async (claim: ClaimWithGym) => {
    Alert.alert(
      'Approve Claim',
      `Approve claim for "${claim.gym.name}"? This will grant the claimant full access to manage this gym profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(claim.id);
              await approveGymClaim(claim.id);
              Alert.alert('Success', 'Claim approved successfully');
              await loadData();
            } catch (err) {
              console.error('Error approving claim:', err);
              Alert.alert('Error', 'Failed to approve claim');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectStart = (claim: ClaimWithGym) => {
    setRejectModalId(claim.id);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalId) return;
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    const claim = claims.find(c => c.id === rejectModalId);
    if (!claim) return;

    try {
      setProcessingId(rejectModalId);
      await rejectGymClaim(rejectModalId, rejectReason.trim());
      setRejectModalId(null);
      setRejectReason('');
      Alert.alert('Success', 'Claim rejected');
      await loadData();
    } catch (err) {
      console.error('Error rejecting claim:', err);
      Alert.alert('Error', 'Failed to reject claim');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalId(null);
    setRejectReason('');
  };

  const getVerificationIcon = (method: ClaimVerificationMethod): keyof typeof Ionicons.glyphMap => {
    switch (method) {
      case 'email': return 'mail';
      case 'phone': return 'call';
      case 'manual': return 'document-text';
      default: return 'help-circle';
    }
  };

  const getVerificationLabel = (method: ClaimVerificationMethod): string => {
    switch (method) {
      case 'email': return 'Email Verification';
      case 'phone': return 'Phone Verification';
      case 'manual': return 'Manual Review';
      default: return method;
    }
  };

  const getStatusColor = (status: ClaimStatus): string => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'verifying': return colors.info || colors.primary[500];
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status: ClaimStatus): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'verifying': return 'Verifying';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatSports = (sports: CombatSport[]): string => {
    return sports.map(s => COMBAT_SPORT_LABELS[s] || s).join(', ');
  };

  const tabItems = [
    { key: 'pending', label: `Pending (${stats.pending})` },
    { key: 'all', label: `All (${stats.total})` },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading claims...</Text>
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
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gym Claims</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {error && (
          <GlassCard style={styles.errorBanner} intensity="dark">
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="time"
            value={stats.pending}
            label="Pending"
            accentColor={colors.warning}
          />
          <StatCard
            icon="checkmark-circle"
            value={stats.approved}
            label="Approved"
            accentColor={colors.success}
          />
          <StatCard
            icon="close-circle"
            value={stats.rejected}
            label="Rejected"
            accentColor={colors.error}
          />
          <StatCard
            icon="list"
            value={stats.total}
            label="Total"
            accentColor={colors.primary[500]}
          />
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBarContainer}>
          <BadgeRow
            items={tabItems}
            selected={activeTab}
            onSelect={handleTabChange}
          />
        </View>

        {/* Claims List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
            />
          }
        >
          {claims.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title={activeTab === 'pending' ? 'No Pending Claims' : 'No Claims Found'}
              description={activeTab === 'pending'
                ? 'All gym claims have been processed'
                : 'No claim requests have been submitted yet'}
            />
          ) : (
            claims.map((claim, index) => (
              <AnimatedListItem key={claim.id} index={index}>
                <GlassCard style={styles.claimCard}>
                  {/* Gym Info */}
                  <View style={styles.gymInfo}>
                    <View style={styles.gymIconContainer}>
                      <Ionicons name="business" size={24} color={colors.primary[500]} />
                    </View>
                    <View style={styles.gymDetails}>
                      <Text style={styles.gymName}>{claim.gym.name}</Text>
                      <Text style={styles.gymLocation}>
                        {claim.gym.city}, {claim.gym.country_name}
                      </Text>
                      {claim.gym.sports.length > 0 && (
                        <Text style={styles.gymSports}>{formatSports(claim.gym.sports)}</Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>
                        {getStatusLabel(claim.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Claim Details */}
                  <View style={styles.claimDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons
                        name={getVerificationIcon(claim.verification_method)}
                        size={16}
                        color={colors.textMuted}
                      />
                      <Text style={styles.detailText}>{getVerificationLabel(claim.verification_method)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color={colors.textMuted} />
                      <Text style={styles.detailText}>Submitted {formatDate(claim.created_at)}</Text>
                    </View>
                    {claim.proof_document_url && (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-attach" size={16} color={colors.primary[500]} />
                        <Text style={[styles.detailText, { color: colors.primary[500] }]}>
                          Proof document attached
                        </Text>
                      </View>
                    )}
                    {claim.rejected_reason && (
                      <View style={styles.rejectionReason}>
                        <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                        <Text style={styles.rejectionText}>{claim.rejected_reason}</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions (only for pending claims) */}
                  {claim.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      {processingId === claim.id ? (
                        <ActivityIndicator size="small" color={colors.primary[500]} />
                      ) : (
                        <>
                          <GradientButton
                            title="Approve"
                            icon="checkmark"
                            onPress={() => handleApprove(claim)}
                            size="sm"
                            style={styles.approveButton}
                          />
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => handleRejectStart(claim)}
                          >
                            <Ionicons name="close" size={18} color={colors.error} />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </GlassCard>
              </AnimatedListItem>
            ))
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Reject Modal */}
        {rejectModalId && (
          <View style={styles.modalOverlay}>
            <GlassCard intensity="dark" style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reject Claim</Text>
              <Text style={styles.modalSubtitle}>
                Please provide a reason for rejecting this claim. This will be visible to the claimant.
              </Text>
              <TextInput
                style={styles.modalInput}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Enter rejection reason..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={handleRejectCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalConfirmButton,
                    !rejectReason.trim() && styles.modalConfirmButtonDisabled,
                  ]}
                  onPress={handleRejectConfirm}
                  disabled={!rejectReason.trim()}
                >
                  {processingId ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Reject Claim</Text>
                  )}
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        )}
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[4],
    gap: spacing[2],
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  retryText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  tabBarContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  claimCard: {
    marginBottom: spacing[3],
  },
  gymInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  gymIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  gymDetails: {
    flex: 1,
  },
  gymName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  gymLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gymSports: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  claimDetails: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  rejectionReason: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rejectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: spacing[1],
  },
  rejectionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '20',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  rejectButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  bottomPadding: {
    height: spacing[10],
  },
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing[4],
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  modalConfirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
