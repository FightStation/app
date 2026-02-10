import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography, borderRadius, gradients, glass, textStyles } from '../lib/theme';
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
  const [searchQuery, setSearchQuery] = useState('');

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
          {!sidebarCollapsed ? (
            <View style={styles.logoContainer}>
              <Text style={styles.logoFight}>FIGHT</Text>
              <View style={styles.logoAccentLine} />
              <Text style={styles.logoStation}>STATION</Text>
            </View>
          ) : (
            <View style={styles.logoCollapsed}>
              <Text style={styles.logoCollapsedText}>F</Text>
            </View>
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
                {/* Active left border accent */}
                {isActive && <View style={styles.navActiveAccent} />}
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={isActive ? colors.primary[500] : colors.textMuted}
                  style={isActive ? styles.navIconActive : undefined}
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
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>
            {navItems.find(item => item.route === currentRoute)?.label || 'Fight Station'}
          </Text>

          {/* Quick Actions with Glass Search */}
          <View style={styles.quickActions}>
            <View style={styles.glassSearchContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.glassSearchInput}
                placeholder="Search..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
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
  logoContainer: {
    alignItems: 'flex-start',
  },
  logoFight: {
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: 1,
    lineHeight: 22,
  },
  logoAccentLine: {
    width: 24,
    height: 2,
    backgroundColor: colors.primary[500],
    marginVertical: 3,
    borderRadius: 1,
  },
  logoStation: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 4,
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  logoCollapsed: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(196, 30, 58, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCollapsedText: {
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: 18,
    color: colors.primary[500],
    letterSpacing: 0,
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
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: 'rgba(196, 30, 58, 0.15)',
  },
  navActiveAccent: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: colors.primary[500],
    borderRadius: 1,
  },
  navIconActive: {
    // Slight shift to keep alignment with accent bar
  },
  navLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
  },
  navLabelActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.semibold,
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
    fontFamily: typography.fontFamily.semibold,
  },
  userRole: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginBottom: spacing[3],
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.medium,
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
    fontFamily: typography.fontFamily.display,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  glassSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.light.backgroundColor,
    borderWidth: glass.light.borderWidth,
    borderColor: glass.light.borderColor,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    height: 40,
    minWidth: 220,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  glassSearchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: glass.light.backgroundColor,
    borderWidth: glass.light.borderWidth,
    borderColor: glass.light.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
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
