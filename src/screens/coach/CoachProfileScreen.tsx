import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
} from '../../components';

type CoachProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

export function CoachProfileScreen({ navigation }: CoachProfileScreenProps) {
  const { profile, signOut } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [availableForBooking, setAvailableForBooking] = React.useState(true);

  const coachName = profile && 'first_name' in profile
    ? `${profile.first_name} ${profile.last_name}`
    : 'Coach';

  const menuSections = [
    {
      title: 'PROFILE',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', action: () => {} },
        { icon: 'camera-outline', label: 'Profile Photo', action: () => {} },
        { icon: 'trophy-outline', label: 'Credentials & Certifications', action: () => {} },
        { icon: 'star-outline', label: 'Reviews & Ratings', action: () => {} },
      ],
    },
    {
      title: 'COACHING',
      items: [
        { icon: 'calendar-outline', label: 'Schedule Settings', action: () => {} },
        { icon: 'cash-outline', label: 'Pricing & Packages', action: () => {} },
        { icon: 'barbell-outline', label: 'Training Specialties', action: () => {} },
        { icon: 'location-outline', label: 'Training Locations', action: () => {} },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { icon: 'card-outline', label: 'Payment Methods', action: () => {} },
        { icon: 'gift-outline', label: 'Referral Program', action: () => navigation.navigate('CoachReferralDashboard') },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Security', action: () => {} },
        { icon: 'help-circle-outline', label: 'Help & Support', action: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Profile Card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={colors.textPrimary} />
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{coachName}</Text>
            <Text style={styles.subtitle}>Professional Coach</Text>
            <View style={styles.statsRow}>
              <StatCard icon="calendar" value={48} label="Sessions" />
              <StatCard icon="people" value={5} label="Students" />
              <StatCard icon="star" value={4.9} label="Rating" />
            </View>
          </GlassCard>

          {/* Quick Toggles */}
          <GlassCard style={styles.toggleSection}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.toggleLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.surfaceLight, true: colors.primary[500] }}
                thumbColor={colors.textPrimary}
              />
            </View>
            <View style={[styles.toggleItem, styles.toggleItemLast]}>
              <View style={styles.toggleInfo}>
                <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.toggleLabel}>Available for Booking</Text>
              </View>
              <Switch
                value={availableForBooking}
                onValueChange={setAvailableForBooking}
                trackColor={{ false: colors.surfaceLight, true: colors.primary[500] }}
                thumbColor={colors.textPrimary}
              />
            </View>
          </GlassCard>

          {/* Menu Sections */}
          {menuSections.map((section) => (
            <View key={section.title} style={styles.menuSection}>
              <SectionHeader title={section.title} />
              <GlassCard noPadding>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.menuItem,
                      index < section.items.length - 1 && styles.menuItemBorder,
                    ]}
                    onPress={item.action}
                  >
                    <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </GlassCard>
            </View>
          ))}

          {/* Sign Out */}
          <GradientButton
            title="Sign Out"
            onPress={signOut}
            icon="log-out-outline"
            gradient={['#DC2626', '#991B1B'] as readonly [string, string]}
            fullWidth
            style={styles.signOutButton}
          />

          {/* App Version */}
          <Text style={styles.version}>Fight Station v1.0.0</Text>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  webContainer: {
    flex: 1,
    maxWidth: containerMaxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  container: { flex: 1 },
  content: { padding: spacing[4] },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  toggleSection: {
    marginBottom: spacing[4],
    padding: 0,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleItemLast: {
    borderBottomWidth: 0,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  menuSection: {
    marginBottom: spacing[4],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  signOutButton: {
    marginTop: spacing[2],
  },
  version: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing[6],
  },
  bottomPadding: { height: spacing[10] },
});
