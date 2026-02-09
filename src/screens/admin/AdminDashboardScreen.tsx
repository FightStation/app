import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getClaimStats } from '../../services/gymDirectory';
import { getCommissionRates } from '../../services/affiliate';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type AdminDashboardScreenProps = {
  navigation?: NativeStackNavigationProp<any>;
};

interface DashboardStats {
  totalGyms: number;
  totalFighters: number;
  totalCoaches: number;
  totalEvents: number;
  activeEvents: number;
  pendingClaims: number;
  approvedClaims: number;
  commissionRates: number;
}

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 700 : width;

export function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);

      // Load claim stats
      const claimStats = await getClaimStats();

      // Load commission rates count
      const rates = await getCommissionRates();

      let dashboardStats: DashboardStats = {
        totalGyms: 0,
        totalFighters: 0,
        totalCoaches: 0,
        totalEvents: 0,
        activeEvents: 0,
        pendingClaims: claimStats.pending,
        approvedClaims: claimStats.approved,
        commissionRates: rates.length,
      };

      if (isSupabaseConfigured) {
        // Fetch actual counts from Supabase
        const [gymsResult, fightersResult, coachesResult, eventsResult, activeEventsResult] = await Promise.all([
          supabase.from('gyms').select('id', { count: 'exact', head: true }),
          supabase.from('fighters').select('id', { count: 'exact', head: true }),
          supabase.from('coaches').select('id', { count: 'exact', head: true }),
          supabase.from('sparring_events').select('id', { count: 'exact', head: true }),
          supabase.from('sparring_events').select('id', { count: 'exact', head: true }).in('status', ['published', 'full']),
        ]);

        dashboardStats = {
          ...dashboardStats,
          totalGyms: gymsResult.count || 0,
          totalFighters: fightersResult.count || 0,
          totalCoaches: coachesResult.count || 0,
          totalEvents: eventsResult.count || 0,
          activeEvents: activeEventsResult.count || 0,
        };
      } else {
        // Mock data for demo mode
        dashboardStats = {
          ...dashboardStats,
          totalGyms: 47,
          totalFighters: 312,
          totalCoaches: 28,
          totalEvents: 156,
          activeEvents: 23,
        };
      }

      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      await loadStats();
      setLoading(false);
    };
    fetchInitial();
  }, [loadStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

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
          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation?.navigate('GymDirectoryAdmin')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="business" size={24} color={colors.warning} />
              </View>
              <Text style={styles.quickActionTitle}>Gym Claims</Text>
              {stats && stats.pendingClaims > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{stats.pendingClaims} pending</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation?.navigate('CommissionRates')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="cash" size={24} color={colors.success} />
              </View>
              <Text style={styles.quickActionTitle}>Commission Rates</Text>
              {stats && (
                <View style={[styles.quickActionBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.quickActionBadgeText, { color: colors.success }]}>
                    {stats.commissionRates} rates
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Platform Stats */}
          <Text style={styles.sectionTitle}>PLATFORM OVERVIEW</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary[500] + '20' }]}>
                <Ionicons name="business" size={22} color={colors.primary[500]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{stats?.totalGyms || 0}</Text>
                <Text style={styles.statLabel}>Gyms</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.info + '20' }]}>
                <Ionicons name="fitness" size={22} color={colors.info || colors.primary[500]} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{stats?.totalFighters || 0}</Text>
                <Text style={styles.statLabel}>Fighters</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="school" size={22} color={colors.warning} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{stats?.totalCoaches || 0}</Text>
                <Text style={styles.statLabel}>Coaches</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="calendar" size={22} color={colors.success} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{stats?.totalEvents || 0}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </View>
            </View>
          </View>

          {/* Gym Directory Stats */}
          <Text style={styles.sectionTitle}>GYM DIRECTORY</Text>
          <View style={styles.directoryStatsCard}>
            <View style={styles.directoryStatRow}>
              <View style={styles.directoryStatItem}>
                <View style={[styles.directoryStatDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.directoryStatLabel}>Pending Claims</Text>
              </View>
              <Text style={styles.directoryStatValue}>{stats?.pendingClaims || 0}</Text>
            </View>
            <View style={styles.directoryStatRow}>
              <View style={styles.directoryStatItem}>
                <View style={[styles.directoryStatDot, { backgroundColor: colors.success }]} />
                <Text style={styles.directoryStatLabel}>Approved Claims</Text>
              </View>
              <Text style={styles.directoryStatValue}>{stats?.approvedClaims || 0}</Text>
            </View>
            <View style={styles.directoryStatRow}>
              <View style={styles.directoryStatItem}>
                <View style={[styles.directoryStatDot, { backgroundColor: colors.primary[500] }]} />
                <Text style={styles.directoryStatLabel}>Active Events</Text>
              </View>
              <Text style={styles.directoryStatValue}>{stats?.activeEvents || 0}</Text>
            </View>
          </View>

          {/* System Info */}
          <Text style={styles.sectionTitle}>SYSTEM STATUS</Text>
          <View style={styles.systemInfoCard}>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>Supabase</Text>
              <View style={[
                styles.systemStatusBadge,
                { backgroundColor: isSupabaseConfigured ? colors.success + '20' : colors.warning + '20' }
              ]}>
                <View style={[
                  styles.systemStatusDot,
                  { backgroundColor: isSupabaseConfigured ? colors.success : colors.warning }
                ]} />
                <Text style={[
                  styles.systemStatusText,
                  { color: isSupabaseConfigured ? colors.success : colors.warning }
                ]}>
                  {isSupabaseConfigured ? 'Connected' : 'Demo Mode'}
                </Text>
              </View>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>Commission Rates</Text>
              <Text style={styles.systemInfoValue}>
                {stats?.commissionRates || 0} configured
              </Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>Platform</Text>
              <Text style={styles.systemInfoValue}>{Platform.OS}</Text>
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
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    letterSpacing: 1,
    marginBottom: spacing[3],
    marginTop: spacing[4],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  quickActionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  quickActionBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  quickActionBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  directoryStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  directoryStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directoryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  directoryStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  directoryStatLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  directoryStatValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  systemInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  systemInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemInfoLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  systemInfoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  systemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    gap: spacing[2],
  },
  systemStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  systemStatusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  bottomPadding: {
    height: spacing[10],
  },
});