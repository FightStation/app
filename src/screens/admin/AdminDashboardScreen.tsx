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
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
  AnimatedListItem,
  PulseIndicator,
} from '../../components';

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
          <GlassCard style={styles.errorBanner} intensity="dark">
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </GlassCard>
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
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickActionsGrid}>
            <AnimatedListItem index={0}>
              <GlassCard
                style={styles.quickActionCard}
                onPress={() => navigation?.navigate('GymDirectoryAdmin')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="business" size={24} color={colors.warning} />
                </View>
                <Text style={styles.quickActionTitle}>Gym Claims</Text>
                {stats && stats.pendingClaims > 0 && (
                  <View style={styles.quickActionBadge}>
                    <PulseIndicator color={colors.warning} size={8} />
                    <Text style={styles.quickActionBadgeText}>{stats.pendingClaims} pending</Text>
                  </View>
                )}
              </GlassCard>
            </AnimatedListItem>

            <AnimatedListItem index={1}>
              <GlassCard
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
              </GlassCard>
            </AnimatedListItem>
          </View>

          {/* Platform Stats */}
          <SectionHeader title="Platform Overview" />
          <View style={styles.statsGrid}>
            <StatCard
              icon="business"
              value={stats?.totalGyms || 0}
              label="Gyms"
              accentColor={colors.primary[500]}
            />
            <StatCard
              icon="fitness"
              value={stats?.totalFighters || 0}
              label="Fighters"
              accentColor={colors.info}
            />
            <StatCard
              icon="school"
              value={stats?.totalCoaches || 0}
              label="Coaches"
              accentColor={colors.warning}
            />
            <StatCard
              icon="calendar"
              value={stats?.totalEvents || 0}
              label="Total Events"
              accentColor={colors.success}
            />
          </View>

          {/* Gym Directory Stats */}
          <SectionHeader title="Gym Directory" />
          <AnimatedListItem index={0}>
            <GlassCard style={styles.directoryStatsCard}>
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
            </GlassCard>
          </AnimatedListItem>

          {/* System Info */}
          <SectionHeader title="System Status" />
          <AnimatedListItem index={0}>
            <GlassCard style={styles.systemInfoCard}>
              <View style={styles.systemInfoRow}>
                <Text style={styles.systemInfoLabel}>Supabase</Text>
                <View style={[
                  styles.systemStatusBadge,
                  { backgroundColor: isSupabaseConfigured ? colors.success + '20' : colors.warning + '20' }
                ]}>
                  <PulseIndicator
                    color={isSupabaseConfigured ? colors.success : colors.warning}
                    size={6}
                  />
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
            </GlassCard>
          </AnimatedListItem>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  quickActionCard: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    gap: spacing[1],
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
  directoryStatsCard: {
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
  systemStatusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  bottomPadding: {
    height: spacing[10],
  },
});
