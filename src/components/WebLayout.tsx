import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../lib/theme';
import { shouldShowSidebar, webLayout, getContainerWidth, isWeb } from '../lib/responsive';

type WebLayoutProps = {
  children: React.ReactNode;
  currentRoute?: string;
  navigation?: any;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showSidebar?: boolean;
};

type NavItem = {
  name: string;
  label: string;
  icon: string;
  route: string;
};

const FIGHTER_NAV: NavItem[] = [
  { name: 'home', label: 'Home', icon: 'home', route: 'HomeTab' },
  { name: 'events', label: 'Find Events', icon: 'calendar', route: 'EventBrowse' },
  { name: 'myEvents', label: 'My Events', icon: 'checkmark-circle', route: 'MatchesTab' },
  { name: 'explore', label: 'Explore', icon: 'compass', route: 'ExploreTab' },
  { name: 'messages', label: 'Messages', icon: 'chatbubble', route: 'MessagesTab' },
  { name: 'referrals', label: 'Referrals', icon: 'people', route: 'ReferralDashboard' },
  { name: 'profile', label: 'Profile', icon: 'person', route: 'ProfileTab' },
];

const GYM_NAV: NavItem[] = [
  { name: 'dashboard', label: 'Dashboard', icon: 'grid', route: 'GymDashboard' },
  { name: 'events', label: 'Events', icon: 'calendar', route: 'ManageEvents' },
  { name: 'requests', label: 'Requests', icon: 'people', route: 'ManageRequests' },
  { name: 'messages', label: 'Messages', icon: 'chatbubble', route: 'MessagesTab' },
  { name: 'referrals', label: 'Referrals', icon: 'gift', route: 'ReferralDashboard' },
  { name: 'profile', label: 'Profile', icon: 'business', route: 'ProfileTab' },
];

export function WebLayout({
  children,
  currentRoute,
  navigation,
  maxWidth = 'xl',
  showSidebar: showSidebarProp,
}: WebLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const showSidebar = showSidebarProp ?? (shouldShowSidebar() && isWeb);
  const navItems = role === 'gym' ? GYM_NAV : FIGHTER_NAV;

  if (!showSidebar || !isWeb) {
    // Mobile layout - just render children
    return <>{children}</>;
  }

  const handleNavigate = (route: string) => {
    if (navigation) {
      navigation.navigate(route);
    }
  };

  const getUserName = () => {
    if (!profile) return 'User';
    if ('first_name' in profile) {
      return `${profile.first_name} ${profile.last_name || ''}`.trim();
    }
    if ('name' in profile) {
      return profile.name;
    }
    return 'User';
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          { width: sidebarCollapsed ? webLayout.sidebarWidthCollapsed : webLayout.sidebarWidth },
        ]}
      >
        {/* Logo/Header */}
        <View style={styles.sidebarHeader}>
          {!sidebarCollapsed && (
            <Text style={styles.logo}>Fight Station</Text>
          )}
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Ionicons
              name={sidebarCollapsed ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handleNavigate(item.route)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={isActive ? colors.primary[500] : colors.textMuted}
                />
                {!sidebarCollapsed && (
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* User Profile */}
        <View style={styles.sidebarFooter}>
          {!sidebarCollapsed && (
            <>
              <Text style={styles.userName}>{getUserName()}</Text>
              <Text style={styles.userRole}>{role}</Text>
            </>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Ionicons name="log-out" size={20} color={colors.error} />
            {!sidebarCollapsed && (
              <Text style={styles.logoutText}>Logout</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Top Bar (optional) */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>
            {navItems.find(item => item.route === currentRoute)?.label || 'Fight Station'}
          </Text>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.contentContainer,
            { maxWidth: getContainerWidth(maxWidth) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flexDirection: 'column',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      },
    }),
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: webLayout.headerHeight,
  },
  logo: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  collapseButton: {
    padding: spacing[2],
  },
  sidebarNav: {
    flex: 1,
    paddingVertical: spacing[4],
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[1],
  },
  navItemActive: {
    backgroundColor: `${colors.primary[500]}20`,
  },
  navLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  sidebarFooter: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  userRole: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginBottom: spacing[3],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  logoutText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },
  mainContent: {
    flex: 1,
    ...Platform.select({
      web: {
        marginLeft: webLayout.sidebarWidth,
      },
    }),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: webLayout.headerHeight,
  },
  pageTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  iconButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    alignSelf: 'center',
    padding: spacing[6],
  },
});
