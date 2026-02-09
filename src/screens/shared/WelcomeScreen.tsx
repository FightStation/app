import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useReferral } from '../../context/ReferralContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { referralCode, shareReferralCode, copyReferralCode } = useReferral();
  const { profile, refreshProfile } = useAuth();

  const isGym = profile && 'name' in profile;
  const displayName = isGym
    ? (profile as any).name
    : profile && 'first_name' in profile
      ? (profile as any).first_name
      : 'there';

  const handleContinue = async () => {
    // Refresh profile to ensure RootNavigator picks up the completed profile
    await refreshProfile();
    // The RootNavigator will automatically switch to the correct navigator
    // when the profile is loaded
  };

  const gymBenefits = [
    { icon: 'trophy' as const, text: '20% recurring commission on subscriptions' },
    { icon: 'cart' as const, text: '15% on merchandise sales' },
    { icon: 'people' as const, text: 'Build your community on the platform' },
  ];

  const fighterBenefits = [
    { icon: 'trophy' as const, text: '10% recurring commission on subscriptions' },
    { icon: 'cash' as const, text: '$5 bonus when friends complete signup' },
    { icon: 'people' as const, text: 'Connect with your training partners' },
  ];

  const benefits = isGym ? gymBenefits : fighterBenefits;

  const content = (
    <>
      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
      </View>

      {/* Welcome Message */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Fight Station, {displayName}!</Text>
        <Text style={styles.subtitle}>
          Your profile is all set up. Now let's grow the community together!
        </Text>

        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <View style={styles.codeIconContainer}>
              <Ionicons name="gift" size={24} color={colors.primary[500]} />
            </View>
            <Text style={styles.codeTitle}>Your Invite Code</Text>
          </View>

          <View style={styles.codeBox}>
            <Text style={styles.code}>{referralCode?.code || 'Loading...'}</Text>
            <TouchableOpacity
              style={styles.copyIconButton}
              onPress={copyReferralCode}
            >
              <Ionicons name="copy-outline" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.codeDescription}>
            {isGym
              ? 'Share this code with your fighters and coaches to earn rewards when they join!'
              : 'Share this code with friends to earn rewards when they join the platform!'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareReferralCode}
            >
              <Ionicons name="share-social" size={20} color={colors.textPrimary} />
              <Text style={styles.shareButtonText}>Share Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyReferralCode}
            >
              <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.copyButtonText}>Copy Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why share your code?</Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name={benefit.icon} size={16} color={colors.primary[500]} />
              </View>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleContinue}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Desktop layout
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <ScrollView
          style={styles.desktopScrollView}
          contentContainerStyle={styles.desktopScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.desktopCard}>
            {content}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile layout
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {content}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing[8],
    lineHeight: 24,
  },
  codeCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  codeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: `${colors.primary[500]}40`,
    marginBottom: spacing[3],
  },
  code: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary[500],
    letterSpacing: 2,
  },
  copyIconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  actionButtons: {
    gap: spacing[2],
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  shareButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
  },
  copyButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  benefitsCard: {
    backgroundColor: `${colors.primary[500]}10`,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: `${colors.primary[500]}30`,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  benefitIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    gap: spacing[3],
    marginTop: spacing[6],
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  continueButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
  skipText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },

  // Desktop styles
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  desktopScrollView: {
    flex: 1,
  },
  desktopScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
    minHeight: '100%',
  },
  desktopCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.background,
    borderRadius: borderRadius['2xl'],
    padding: spacing[8],
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    } : {}),
  },
});
