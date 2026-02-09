import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebLayout } from '../../components/WebLayout';
import { ProfileCompletenessCard } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { calculateFighterCompleteness } from '../../utils/profileCompleteness';
import { Fighter } from '../../types';

type WebDashboardScreenProps = {
  navigation: any;
};

export function WebDashboardScreen({ navigation }: WebDashboardScreenProps) {
  const { profile } = useAuth();
  const fighter = profile as Fighter;

  const profileCompleteness = useMemo(
    () => calculateFighterCompleteness(fighter),
    [fighter]
  );

  const stats = [
    {
      icon: 'fitness',
      label: 'Sparring Sessions',
      value: fighter?.sparring_count || 0,
      color: colors.primary[500],
      route: 'MatchesTab',
    },
    {
      icon: 'trophy',
      label: 'Fights',
      value: fighter?.fights_count || 0,
      color: colors.warning,
      route: 'MatchesTab',
    },
    {
      icon: 'calendar',
      label: 'Upcoming Events',
      value: 3,
      color: colors.info,
      route: 'EventBrowse',
    },
    {
      icon: 'chatbubble',
      label: 'Unread Messages',
      value: 2,
      color: colors.success,
      route: 'MessagesTab',
    },
  ];

  const quickActions = [
    {
      icon: 'search',
      label: 'Find Events',
      description: 'Discover sparring sessions',
      route: 'EventBrowse',
      color: colors.primary[500],
    },
    {
      icon: 'people',
      label: 'Find Fighters',
      description: 'Connect with training partners',
      route: 'FighterSearch',
      color: colors.info,
    },
    {
      icon: 'business',
      label: 'Find Gyms',
      description: 'Explore local gyms',
      route: 'GymSearch',
      color: colors.warning,
    },
    {
      icon: 'gift',
      label: 'Referrals',
      description: 'Earn rewards',
      route: 'ReferralDashboard',
      color: colors.success,
    },
  ];

  const upcomingEvents = [
    {
      id: '1',
      title: 'Technical Sparring Session',
      gym: 'Elite Boxing Academy',
      date: '2026-02-15',
      time: '18:00',
      status: 'approved',
    },
    {
      id: '2',
      title: 'Hard Rounds Friday',
      gym: 'Iron Fist Gym',
      date: '2026-02-18',
      time: '19:00',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Open Sparring',
      gym: 'Elite Boxing Academy',
      date: '2026-02-22',
      time: '17:30',
      status: 'approved',
    },
  ];

  return (
    <WebLayout currentRoute="HomeTab" navigation={navigation} maxWidth="2xl">
      <View style={styles.container}>
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{fighter?.first_name || 'Fighter'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {fighter?.first_name?.charAt(0)}{fighter?.last_name?.charAt(0)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Completeness */}
        {profileCompleteness.percentage < 100 && (
          <ProfileCompletenessCard
            completeness={profileCompleteness}
            onPress={() => navigation.navigate('ProfileTab')}
          />
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.statCard}
              onPress={() => navigation.navigate(stat.route)}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Content Grid */}
        <View style={styles.contentGrid}>
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={() => navigation.navigate(action.route)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                    <Ionicons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upcoming Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MatchesTab')}>
                <Text style={styles.seeAllText}>See all →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.eventsList}>
              {upcomingEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                >
                  <View style={styles.eventHeader}>
                    <View>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <Ionicons name="business" size={14} color={colors.textMuted} />
                        <Text style={styles.eventMetaText}>{event.gym}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        event.status === 'approved' ? styles.approvedBadge : styles.pendingBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          event.status === 'approved' ? styles.approvedText : styles.pendingText,
                        ]}
                      >
                        {event.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventDateTime}>
                    <View style={styles.eventDateTimeItem}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.eventDateTimeText}>
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.eventDateTimeItem}>
                      <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                      <Text style={styles.eventDateTimeText}>{event.time}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityFeed}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${colors.success}20` }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Your request to join <Text style={styles.activityBold}>Technical Sparring</Text> was approved
                </Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${colors.info}20` }]}>
                <Ionicons name="calendar" size={20} color={colors.info} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  New event at <Text style={styles.activityBold}>Elite Boxing Academy</Text>
                </Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${colors.primary[500]}20` }]}>
                <Ionicons name="chatbubble" size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  New message from <Text style={styles.activityBold}>Marcus Petrov</Text>
                </Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[6],
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    color: colors.textMuted,
  },
  userName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  profileButton: {
    padding: spacing[2],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  contentGrid: {
    flexDirection: 'row',
    gap: spacing[6],
  },
  section: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  actionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  actionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  eventsList: {
    gap: spacing[3],
  },
  eventCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  eventTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  eventMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  approvedBadge: {
    backgroundColor: `${colors.success}20`,
  },
  pendingBadge: {
    backgroundColor: `${colors.warning}20`,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  approvedText: {
    color: colors.success,
  },
  pendingText: {
    color: colors.warning,
  },
  eventDateTime: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  eventDateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  eventDateTimeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  activityFeed: {
    gap: spacing[4],
  },
  activityItem: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  activityBold: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  activityTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
});
