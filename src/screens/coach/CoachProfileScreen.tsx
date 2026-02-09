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
          <View style={styles.profileCard}>
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
              <View style={styles.statItem}>
                <Text style={styles.statValue}>48</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4.9</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>

          {/* Quick Toggles */}
          <View style={styles.toggleSection}>
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
            <View style={styles.toggleItem}>
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
          </View>

          {/* Menu Sections */}
          {menuSections.map((section) => (
            <View key={section.title} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
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
              </View>
            </View>
          ))}

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

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
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  toggleSection: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
    overflow: 'hidden',
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
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    letterSpacing: 0.5,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  menuCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: spacing[2],
  },
  signOutText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing[6],
  },
  bottomPadding: { height: spacing[10] },
});
