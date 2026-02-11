import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { GlassCard, GlassInput, GradientButton, SectionHeader, EmptyState, AnimatedListItem } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

type AdminManagementScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type Admin = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  permissions: {
    canPostEvents: boolean;
    canEditGym: boolean;
    canManageAdmins: boolean;
  };
  status: 'active' | 'pending';
  invitedAt: string;
};

// Mock admins for demo mode
const MOCK_ADMINS: Admin[] = [
  {
    id: '1',
    email: 'coach@eliteboxing.com',
    name: 'Mike Thompson',
    role: 'admin',
    permissions: {
      canPostEvents: true,
      canEditGym: true,
      canManageAdmins: false,
    },
    status: 'active',
    invitedAt: '2024-10-15',
  },
  {
    id: '2',
    email: 'assistant@eliteboxing.com',
    name: 'Sarah Chen',
    role: 'admin',
    permissions: {
      canPostEvents: true,
      canEditGym: false,
      canManageAdmins: false,
    },
    status: 'active',
    invitedAt: '2024-10-20',
  },
  {
    id: '3',
    email: 'newadmin@example.com',
    name: 'Pending Invite',
    role: 'admin',
    permissions: {
      canPostEvents: true,
      canEditGym: false,
      canManageAdmins: false,
    },
    status: 'pending',
    invitedAt: '2024-11-01',
  },
];

export function AdminManagementScreen({ navigation }: AdminManagementScreenProps) {
  const { profile } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState({
    canPostEvents: true,
    canEditGym: false,
    canManageAdmins: false,
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    if (!isSupabaseConfigured) {
      // Demo mode
      setAdmins(MOCK_ADMINS);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gym_admins')
        .select('*')
        .eq('gym_id', (profile as any)?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
      Alert.alert('Error', 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteAdmin = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!isSupabaseConfigured) {
      // Demo mode
      Alert.alert(
        'Success',
        `Invitation sent to ${inviteEmail}! (Demo mode - no email actually sent)`
      );
      setShowInviteForm(false);
      setInviteEmail('');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('gym_admins').insert({
        gym_id: (profile as any)?.id,
        email: inviteEmail,
        permissions: invitePermissions,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert('Success', `Invitation sent to ${inviteEmail}!`);
      setShowInviteForm(false);
      setInviteEmail('');
      setInvitePermissions({
        canPostEvents: true,
        canEditGym: false,
        canManageAdmins: false,
      });
      loadAdmins();
    } catch (error) {
      console.error('Error inviting admin:', error);
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = (admin: Admin) => {
    Alert.alert(
      'Remove Admin',
      `Are you sure you want to remove ${admin.name || admin.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!isSupabaseConfigured) {
              Alert.alert('Success', 'Admin removed! (Demo mode)');
              setAdmins(admins.filter((a) => a.id !== admin.id));
              return;
            }

            try {
              const { error } = await supabase
                .from('gym_admins')
                .delete()
                .eq('id', admin.id);

              if (error) throw error;
              Alert.alert('Success', 'Admin removed');
              loadAdmins();
            } catch (error) {
              console.error('Error removing admin:', error);
              Alert.alert('Error', 'Failed to remove admin');
            }
          },
        },
      ]
    );
  };

  const togglePermission = (permission: keyof typeof invitePermissions) => {
    setInvitePermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const renderInviteForm = () => (
    <GlassCard style={styles.inviteForm}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Invite New Admin</Text>
        <TouchableOpacity onPress={() => setShowInviteForm(false)}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <GlassInput
        label="Email Address"
        placeholder="admin@example.com"
        value={inviteEmail}
        onChangeText={setInviteEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.permissionsTitle}>Permissions</Text>

      <TouchableOpacity
        style={styles.permissionRow}
        onPress={() => togglePermission('canPostEvents')}
      >
        <View
          style={[
            styles.checkbox,
            invitePermissions.canPostEvents && styles.checkboxChecked,
          ]}
        >
          {invitePermissions.canPostEvents && (
            <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
          )}
        </View>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionLabel}>Post Events</Text>
          <Text style={styles.permissionDescription}>
            Create and manage gym events
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.permissionRow}
        onPress={() => togglePermission('canEditGym')}
      >
        <View
          style={[
            styles.checkbox,
            invitePermissions.canEditGym && styles.checkboxChecked,
          ]}
        >
          {invitePermissions.canEditGym && (
            <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
          )}
        </View>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionLabel}>Edit Gym Info</Text>
          <Text style={styles.permissionDescription}>
            Update gym details and photos
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.permissionRow}
        onPress={() => togglePermission('canManageAdmins')}
      >
        <View
          style={[
            styles.checkbox,
            invitePermissions.canManageAdmins && styles.checkboxChecked,
          ]}
        >
          {invitePermissions.canManageAdmins && (
            <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
          )}
        </View>
        <View style={styles.permissionInfo}>
          <Text style={styles.permissionLabel}>Manage Admins</Text>
          <Text style={styles.permissionDescription}>
            Invite and remove other admins
          </Text>
        </View>
      </TouchableOpacity>

      <GradientButton
        title="Send Invitation"
        onPress={handleInviteAdmin}
        loading={loading}
        fullWidth
        icon="send"
        style={styles.sendButton}
      />
    </GlassCard>
  );

  const renderAdminCard = (admin: Admin, index: number) => (
    <AnimatedListItem key={admin.id} index={index}>
      <GlassCard
        accentColor={admin.role === 'owner' ? colors.warning : undefined}
        style={styles.adminCardWrapper}
      >
        <View style={styles.adminCardRow}>
          <View style={styles.adminAvatar}>
            <Ionicons
              name={admin.role === 'owner' ? 'shield' : 'person'}
              size={24}
              color={
                admin.role === 'owner' ? colors.warning : colors.primary[500]
              }
            />
          </View>

          <View style={styles.adminInfo}>
            <View style={styles.adminHeader}>
              <Text style={styles.adminName}>{admin.name}</Text>
              {admin.status === 'pending' && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>PENDING</Text>
                </View>
              )}
            </View>
            <Text style={styles.adminEmail}>{admin.email}</Text>

            <View style={styles.permissionsList}>
              {admin.permissions.canPostEvents && (
                <View style={styles.permissionTag}>
                  <Ionicons
                    name="calendar"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.permissionTagText}>Events</Text>
                </View>
              )}
              {admin.permissions.canEditGym && (
                <View style={styles.permissionTag}>
                  <Ionicons name="create" size={12} color={colors.textSecondary} />
                  <Text style={styles.permissionTagText}>Edit Gym</Text>
                </View>
              )}
              {admin.permissions.canManageAdmins && (
                <View style={styles.permissionTag}>
                  <Ionicons name="people" size={12} color={colors.textSecondary} />
                  <Text style={styles.permissionTagText}>Admins</Text>
                </View>
              )}
            </View>
          </View>

          {admin.role !== 'owner' && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveAdmin(admin)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  const renderContent = () => (
    <>
      {/* Invite Button */}
      {!showInviteForm && (
        <GlassCard onPress={() => setShowInviteForm(true)} style={styles.inviteButton}>
          <View style={styles.inviteButtonRow}>
            <View style={styles.inviteIconContainer}>
              <Ionicons name="person-add" size={24} color={colors.primary[500]} />
            </View>
            <Text style={styles.inviteButtonText}>Invite New Admin</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </GlassCard>
      )}

      {/* Invite Form */}
      {showInviteForm && renderInviteForm()}

      {/* Admins List */}
      <View style={styles.section}>
        <SectionHeader
          title={`Team Members (${admins.filter((a) => a.status === 'active').length})`}
        />

        {admins.map((admin, index) => renderAdminCard(admin, index))}

        {admins.length === 0 && (
          <EmptyState
            icon="people-outline"
            title="No admins yet"
            description="Invite team members to help manage your gym"
            actionLabel="Invite Admin"
            onAction={() => setShowInviteForm(true)}
          />
        )}
      </View>

      {/* Info Box */}
      <GlassCard intensity="accent">
        <View style={styles.infoBoxContent}>
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
          <Text style={styles.infoText}>
            Admins will receive an email invitation. They can accept and start helping
            manage your gym based on their permissions.
          </Text>
        </View>
      </GlassCard>
    </>
  );

  // Desktop layout
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Header */}
        <View style={styles.desktopHeader}>
          <TouchableOpacity
            style={styles.backButtonDesktop}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.desktopHeaderTitle}>Admin Management</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.desktopScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.desktopCard}>
            {/* Icon and Title */}
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="people" size={32} color={colors.primary[500]} />
              </View>
              <Text style={styles.cardTitle}>Team Management</Text>
              <Text style={styles.cardSubtitle}>
                Invite team members to help manage your gym, post events, and update information.
              </Text>
            </View>

            {/* Content */}
            {renderContent()}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.mobileScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Invite team members to help manage your gym, post events, and update information.
        </Text>

        {/* Content */}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
  },
  desktopHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  mobileScrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  desktopScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing[8],
  },
  desktopCard: {
    width: '100%',
    maxWidth: 700,
    borderRadius: borderRadius['2xl'],
    padding: spacing[8],
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    } : {}),
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  cardTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  cardSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 22,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  inviteButton: {
    marginBottom: spacing[6],
  },
  inviteButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  inviteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  inviteForm: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[6],
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  permissionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing[0.5],
  },
  permissionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  sendButton: {
    marginTop: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  adminCardWrapper: {
    marginBottom: spacing[3],
  },
  adminCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  adminAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfo: {
    flex: 1,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
    flexWrap: 'wrap',
  },
  adminName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  pendingBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  pendingBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  adminEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  permissionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    gap: spacing[1],
  },
  permissionTagText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing[3],
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  infoBoxContent: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
