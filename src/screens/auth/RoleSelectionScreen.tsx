import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassCard, GradientButton, AnimatedListItem } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

type RoleSelectionScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  features: string[];
}

const roles: RoleOption[] = [
  {
    id: 'fighter',
    title: 'Fighter',
    description: 'Find sparring partners, join events, and track your progress',
    icon: 'body',
    features: ['Find sparring partners', 'Join gym events', 'Track your record', 'Connect with gyms'],
  },
  {
    id: 'gym',
    title: 'Gym',
    description: 'Host events, manage fighters, and grow your community',
    icon: 'business',
    features: ['Host sparring events', 'Manage your fighters', 'Earn from referrals', 'Build your reputation'],
  },
  {
    id: 'coach',
    title: 'Coach',
    description: 'Manage your fighters and coordinate training sessions',
    icon: 'school',
    features: ['Support your athletes', 'Coordinate sessions', 'Track fighter progress', 'Connect with gyms'],
  },
];

export function RoleSelectionScreen({ navigation }: RoleSelectionScreenProps) {
  const { setUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    await setUserRole(selectedRole);
    setLoading(false);

    // Navigate to profile setup based on role
    if (selectedRole === 'fighter') {
      navigation.navigate('FighterSetup');
    } else if (selectedRole === 'gym') {
      navigation.navigate('GymSetup');
    } else {
      navigation.navigate('CoachSetup');
    }
  };

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isDesktop && styles.desktopCard]}>
          {/* Header */}
          <Animated.View
            entering={FadeIn.delay(0).duration(500)}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="flash" size={32} color={colors.primary[500]} />
            </View>
            <Text style={styles.title}>Welcome to Fight Station</Text>
            <Text style={styles.subtitle}>
              Select your role to personalize your experience
            </Text>
          </Animated.View>

          {/* Role Cards */}
          <View style={[styles.roles, isDesktop && styles.desktopRoles]}>
            {roles.map((role, index) => (
              <AnimatedListItem key={role.id} index={index}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedRole(role.id)}
                >
                  <GlassCard
                    style={{
                      ...styles.roleCardGlass,
                      ...(selectedRole === role.id ? styles.roleCardSelected : {}),
                      ...(selectedRole === role.id ? shadows.glow : {}),
                      ...(isDesktop ? styles.desktopRoleCard : {}),
                    }}
                  >
                    <View style={styles.roleHeader}>
                      <View style={[
                        styles.roleIconContainer,
                        selectedRole === role.id
                          ? styles.roleIconContainerSelected
                          : styles.roleIconContainerDefault,
                      ]}>
                        <Ionicons
                          name={role.icon}
                          size={24}
                          color={selectedRole === role.id ? '#FFFFFF' : colors.textMuted}
                        />
                      </View>
                      <View style={styles.roleInfo}>
                        <Text style={[
                          styles.roleTitle,
                          selectedRole === role.id && styles.roleTitleSelected,
                        ]}>
                          {role.title}
                        </Text>
                        <Text style={styles.roleDescription}>{role.description}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          selectedRole === role.id && styles.radioOuterSelected,
                        ]}
                      >
                        {selectedRole === role.id && <View style={styles.radioInner} />}
                      </View>
                    </View>

                    {/* Features - show when selected or on desktop */}
                    {(selectedRole === role.id || isDesktop) && (
                      <View style={styles.featuresContainer}>
                        {role.features.map((feature, featureIndex) => (
                          <View key={featureIndex} style={[
                            styles.featurePill,
                            selectedRole === role.id && styles.featurePillSelected,
                          ]}>
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={selectedRole === role.id ? colors.primary[500] : colors.textMuted}
                            />
                            <Text style={[
                              styles.featureText,
                              selectedRole === role.id && styles.featureTextSelected,
                            ]}>
                              {feature}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              </AnimatedListItem>
            ))}
          </View>

          {/* Footer */}
          <Animated.View
            entering={FadeIn.delay(400).duration(500)}
            style={styles.footer}
          >
            <GradientButton
              title="Continue"
              onPress={handleContinue}
              loading={loading}
              disabled={!selectedRole}
              fullWidth
              size="lg"
              icon="arrow-forward"
              iconPosition="right"
            />
            <Text style={styles.footerNote}>You can change this later in settings</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  desktopScrollContent: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: spacing[8],
    paddingTop: spacing[12],
    minHeight: '100%',
  },
  card: {
    flex: 1,
    padding: spacing[6],
  },
  desktopCard: {
    flex: 0,
    width: '100%',
    maxWidth: 700,
    borderRadius: borderRadius['2xl'],
    padding: spacing[8],
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing[4],
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    } : {}),
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  roles: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  desktopRoles: {
    gap: spacing[4],
  },
  roleCardGlass: {
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  desktopRoleCard: {
    padding: spacing[5],
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  roleIconContainerDefault: {
    backgroundColor: colors.surfaceLight,
  },
  roleIconContainerSelected: {
    backgroundColor: colors.primary[500],
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  roleTitleSelected: {
    color: colors.primary[500],
  },
  roleDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  radioOuterSelected: {
    borderColor: colors.primary[500],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  featuresContainer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  featurePillSelected: {
    backgroundColor: `${colors.primary[500]}10`,
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  featureTextSelected: {
    color: colors.textSecondary,
  },
  footer: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    marginBottom: spacing[3],
  },
  footerNote: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing[3],
  },
});
