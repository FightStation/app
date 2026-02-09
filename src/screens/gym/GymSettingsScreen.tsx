import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Gym, SUPPORTED_COUNTRIES } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';
import { Button, Input, ProfileCompletenessCard } from '../../components';
import { calculateGymCompleteness } from '../../utils/profileCompleteness';

type GymSettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const FACILITIES = [
  'Boxing Ring',
  'Heavy Bags',
  'Speed Bags',
  'Weights',
  'Cardio Equipment',
  'Showers',
  'Locker Rooms',
  'Sauna',
  'Pro Shop',
  'Parking',
];

type SettingsSection = 'profile' | 'contact' | 'facilities' | 'account';

export function GymSettingsScreen({ navigation }: GymSettingsScreenProps) {
  const { profile, refreshProfile, signOut } = useAuth();
  const gym = profile as Gym;

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState(gym?.name || '');
  const [description, setDescription] = useState(gym?.description || '');
  const [address, setAddress] = useState(gym?.address || '');
  const [city, setCity] = useState(gym?.city || '');
  const [country, setCountry] = useState(gym?.country || '');
  const [contactEmail, setContactEmail] = useState(gym?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(gym?.contact_phone || '');
  const [website, setWebsite] = useState(gym?.website || '');
  const [facilities, setFacilities] = useState<string[]>(gym?.facilities || []);

  // Profile completeness
  const profileCompleteness = useMemo(
    () => calculateGymCompleteness(gym),
    [gym]
  );

  useEffect(() => {
    if (gym) {
      setName(gym.name || '');
      setDescription(gym.description || '');
      setAddress(gym.address || '');
      setCity(gym.city || '');
      setCountry(gym.country || '');
      setContactEmail(gym.contact_email || '');
      setContactPhone(gym.contact_phone || '');
      setWebsite(gym.website || '');
      setFacilities(gym.facilities || []);
    }
  }, [gym]);

  const toggleFacility = (facility: string) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  };

  const handleSave = async () => {
    if (!gym) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updates: Partial<Gym> = {};

      // Only include changed fields based on active section
      if (activeSection === 'profile') {
        if (name !== gym.name) updates.name = name;
        if (description !== gym.description) updates.description = description;
        if (address !== gym.address) updates.address = address;
        if (city !== gym.city) updates.city = city;
        if (country !== gym.country) updates.country = country;
      } else if (activeSection === 'contact') {
        if (contactEmail !== gym.contact_email) updates.contact_email = contactEmail;
        if (contactPhone !== gym.contact_phone) updates.contact_phone = contactPhone;
        if (website !== gym.website) updates.website = website;
      } else if (activeSection === 'facilities') {
        if (JSON.stringify(facilities) !== JSON.stringify(gym.facilities)) {
          updates.facilities = facilities;
        }
      }

      if (Object.keys(updates).length === 0) {
        setSuccess('No changes to save');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('gyms')
        .update(updates)
        .eq('id', gym.id);

      if (updateError) {
        console.error('[GymSettings] Update error:', updateError);
        setError(updateError.message);
      } else {
        setSuccess('Settings saved successfully!');
        await refreshProfile();
      }
    } catch (err) {
      console.error('[GymSettings] Save failed:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to sign out?')) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]
      );
    }
  };

  const renderProfileSection = () => (
    <View style={styles.sectionContent}>
      <Input
        label="Gym Name"
        placeholder="Enter your gym name"
        value={name}
        onChangeText={setName}
      />

      <Input
        label="Description"
        placeholder="Describe your gym, training style, and what makes you unique..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.fieldLabel}>Country</Text>
      <View style={styles.countryGrid}>
        {SUPPORTED_COUNTRIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.countryChip, country === c && styles.countryChipSelected]}
            onPress={() => setCountry(c)}
          >
            <Text style={[styles.countryChipText, country === c && styles.countryChipTextSelected]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="City"
        placeholder="Enter city"
        value={city}
        onChangeText={setCity}
      />

      <Input
        label="Full Address"
        placeholder="Enter full street address"
        value={address}
        onChangeText={setAddress}
      />
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.sectionContent}>
      <Input
        label="Contact Email"
        placeholder="gym@example.com"
        value={contactEmail}
        onChangeText={setContactEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Phone Number"
        placeholder="+1 234 567 8900"
        value={contactPhone}
        onChangeText={setContactPhone}
        keyboardType="phone-pad"
      />

      <Input
        label="Website"
        placeholder="https://yourgym.com"
        value={website}
        onChangeText={setWebsite}
        autoCapitalize="none"
        keyboardType="url"
      />
    </View>
  );

  const renderFacilitiesSection = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.fieldLabel}>What does your gym offer?</Text>
      <View style={styles.facilitiesGrid}>
        {FACILITIES.map((facility) => (
          <TouchableOpacity
            key={facility}
            style={[
              styles.facilityChip,
              facilities.includes(facility) && styles.facilityChipSelected,
            ]}
            onPress={() => toggleFacility(facility)}
          >
            <Ionicons
              name={facilities.includes(facility) ? 'checkmark-circle' : 'add-circle-outline'}
              size={18}
              color={facilities.includes(facility) ? colors.primary[500] : colors.textMuted}
              style={styles.facilityIcon}
            />
            <Text
              style={[
                styles.facilityText,
                facilities.includes(facility) && styles.facilityTextSelected,
              ]}
            >
              {facility}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAccountSection = () => (
    <View style={styles.sectionContent}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('GymPhotoUpload')}
      >
        <View style={styles.menuItemIcon}>
          <Ionicons name="images" size={22} color={colors.primary[500]} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>Gym Photos</Text>
          <Text style={styles.menuItemSubtitle}>{gym?.photos?.length || 0} photos uploaded</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('AdminManagement')}
      >
        <View style={styles.menuItemIcon}>
          <Ionicons name="shield" size={22} color={colors.primary[500]} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>Manage Admins</Text>
          <Text style={styles.menuItemSubtitle}>Add or remove gym administrators</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('GymReferralDashboard')}
      >
        <View style={styles.menuItemIcon}>
          <Ionicons name="people" size={22} color={colors.primary[500]} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>Referral Program</Text>
          <Text style={styles.menuItemSubtitle}>Invite fighters and earn rewards</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('AdminDashboard')}
      >
        <View style={[styles.menuItemIcon, { backgroundColor: `${colors.warning}15` }]}>
          <Ionicons name="shield-checkmark" size={22} color={colors.warning} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>Admin Dashboard</Text>
          <Text style={styles.menuItemSubtitle}>System management and analytics</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={22} color={colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  const sections: { key: SettingsSection; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'profile', label: 'Profile', icon: 'business' },
    { key: 'contact', label: 'Contact', icon: 'call' },
    { key: 'facilities', label: 'Facilities', icon: 'fitness' },
    { key: 'account', label: 'Account', icon: 'settings' },
  ];

  // Desktop layout
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <View style={styles.desktopContent}>
          {/* Desktop Header */}
          <View style={styles.desktopHeader}>
            <View style={styles.desktopHeaderLeft}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="settings" size={28} color={colors.primary[500]} />
              </View>
              <View>
                <Text style={styles.desktopTitle}>Gym Settings</Text>
                <Text style={styles.desktopSubtitle}>Manage your gym profile and preferences</Text>
              </View>
            </View>
          </View>

          <View style={styles.desktopLayout}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
              <ProfileCompletenessCard
                completeness={profileCompleteness}
                onPress={() => setActiveSection('profile')}
              />

              <View style={styles.sidebarNav}>
                {sections.map(section => (
                  <TouchableOpacity
                    key={section.key}
                    style={[styles.sidebarItem, activeSection === section.key && styles.sidebarItemActive]}
                    onPress={() => setActiveSection(section.key)}
                  >
                    <Ionicons
                      name={section.icon}
                      size={20}
                      color={activeSection === section.key ? colors.primary[500] : colors.textMuted}
                    />
                    <Text style={[styles.sidebarItemText, activeSection === section.key && styles.sidebarItemTextActive]}>
                      {section.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {sections.find(s => s.key === activeSection)?.label}
                  </Text>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={18} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {success ? (
                    <View style={styles.successContainer}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <Text style={styles.successText}>{success}</Text>
                    </View>
                  ) : null}

                  {activeSection === 'profile' && renderProfileSection()}
                  {activeSection === 'contact' && renderContactSection()}
                  {activeSection === 'facilities' && renderFacilitiesSection()}
                  {activeSection === 'account' && renderAccountSection()}

                  {activeSection !== 'account' && (
                    <Button
                      title="Save Changes"
                      onPress={handleSave}
                      loading={loading}
                      size="lg"
                      style={styles.saveButton}
                    />
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="settings" size={24} color={colors.primary[500]} />
          </View>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      {/* Section Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {sections.map(section => (
          <TouchableOpacity
            key={section.key}
            style={[styles.tab, activeSection === section.key && styles.tabActive]}
            onPress={() => setActiveSection(section.key)}
          >
            <Ionicons
              name={section.icon}
              size={18}
              color={activeSection === section.key ? colors.primary[500] : colors.textMuted}
            />
            <Text style={[styles.tabText, activeSection === section.key && styles.tabTextActive]}>
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'contact' && renderContactSection()}
        {activeSection === 'facilities' && renderFacilitiesSection()}
        {activeSection === 'account' && renderAccountSection()}

        {activeSection !== 'account' && (
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={styles.saveButton}
          />
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  desktopContent: {
    flex: 1,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  desktopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  desktopTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  desktopSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    padding: spacing[4],
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  sidebarNav: {
    marginTop: spacing[4],
    gap: spacing[1],
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
  sidebarItemActive: {
    backgroundColor: `${colors.primary[500]}15`,
  },
  sidebarItemText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  sidebarItemTextActive: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: spacing[6],
  },
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  tabsScroll: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginRight: spacing[2],
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  sectionContent: {
    gap: spacing[4],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  countryChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryChipSelected: {
    backgroundColor: `${colors.primary[500]}20`,
    borderColor: colors.primary[500],
  },
  countryChipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  countryChipTextSelected: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  facilityChipSelected: {
    backgroundColor: `${colors.primary[500]}15`,
    borderColor: colors.primary[500],
  },
  facilityIcon: {
    marginRight: spacing[2],
  },
  facilityText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  facilityTextSelected: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuItemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[4],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}15`,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  successText: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  saveButton: {
    marginTop: spacing[6],
  },
  bottomPadding: {
    height: spacing[10],
  },
});
