import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { GradientButton, GlassCard, GlassInput } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius, shadows, gradients, glass } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

const { width, height } = Dimensions.get('window');

export function RegisterScreen({ navigation, route }: any) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill referral code from deep link
  useEffect(() => {
    if (route?.params?.referralCode) {
      setReferralCode(route.params.referralCode);
    }
  }, [route?.params?.referralCode]);

  // Animated background orb
  const orbTranslateX = useSharedValue(0);
  useEffect(() => {
    orbTranslateX.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 4000 }),
        withTiming(-30, { duration: 4000 })
      ),
      -1
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: orbTranslateX.value }],
  }));

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await signUp(email, password, referralCode);

    if (authError) {
      setError(authError.message);
    } else {
      // Navigate to role selection after successful signup
      navigation.navigate('RoleSelection');
    }

    setLoading(false);
  };

  // Shared form content
  const renderForm = (isDesktopLayout: boolean) => (
    <>
      <Animated.View entering={FadeIn.delay(200).duration(500)}>
        <GlassInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Ionicons name="mail-outline" size={20} color={colors.neutral[400]} />}
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300).duration(500)}>
        <GlassInput
          label="Password"
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.neutral[400]} />}
          rightIcon={
            <Text style={styles.showHide}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          }
          onRightIconPress={() => setShowPassword(!showPassword)}
          helperText="At least 6 characters"
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(500)}>
        <GlassInput
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.neutral[400]} />}
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(500).duration(500)}>
        <GlassInput
          label="Referral Code (Optional)"
          placeholder="Enter referral code"
          value={referralCode}
          onChangeText={(text) => setReferralCode(text.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          leftIcon={<Ionicons name="gift-outline" size={20} color={colors.neutral[400]} />}
          helperText="Have a code from a gym or friend?"
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(600).duration(500)}>
        <GradientButton
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          fullWidth
          size="lg"
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(700).duration(500)}>
        <Text style={styles.terms}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </>
  );

  // Desktop split-screen layout
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Left side - Form */}
        <View style={styles.formSide}>
          <ScrollView
            contentContainerStyle={styles.desktopFormContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.desktopFormCard}>
              {/* Back to login */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.desktopFormHeader}>
                <Text style={styles.desktopTitle}>Create Account</Text>
                <Text style={styles.desktopSubtitle}>
                  Join the Fight Station community today
                </Text>
              </View>

              {/* Error */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              {/* Form */}
              <View style={styles.desktopForm}>
                {renderForm(true)}
              </View>

              {/* Footer */}
              <View style={styles.desktopFooter}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Right side - Branding */}
        <View style={styles.brandingSide}>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.brandingOverlay}
          >
            <View style={styles.brandingContent}>
              {/* Logo */}
              <View style={styles.desktopLogoContainer}>
                <View style={styles.logoIconContainer}>
                  <Ionicons name="flash" size={48} color={colors.primary[500]} />
                </View>
                <Text style={styles.desktopLogo}>FIGHT</Text>
                <View style={styles.logoRedLine} />
                <Text style={styles.desktopLogoAccent}>STATION</Text>
              </View>

              {/* Benefits */}
              <Text style={styles.brandingTagline}>
                Start your journey to becoming a better fighter
              </Text>

              {/* User types */}
              <View style={styles.userTypesList}>
                <View style={styles.userTypeCard}>
                  <View style={styles.userTypeIcon}>
                    <Ionicons name="person" size={28} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.userTypeTitle}>Fighters</Text>
                  <Text style={styles.userTypeDesc}>
                    Find sparring partners, track your progress, and connect with gyms
                  </Text>
                </View>
                <View style={styles.userTypeCard}>
                  <View style={styles.userTypeIcon}>
                    <Ionicons name="business" size={28} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.userTypeTitle}>Gyms</Text>
                  <Text style={styles.userTypeDesc}>
                    Host events, manage your fighters, and grow your community
                  </Text>
                </View>
                <View style={styles.userTypeCard}>
                  <View style={styles.userTypeIcon}>
                    <Ionicons name="school" size={28} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.userTypeTitle}>Coaches</Text>
                  <Text style={styles.userTypeDesc}>
                    Support your athletes and manage your training sessions
                  </Text>
                </View>
              </View>

              {/* Testimonial */}
              <View style={styles.testimonialCard}>
                <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary[500]} style={styles.quoteIcon} />
                <Text style={styles.testimonialText}>
                  "Fight Station helped me find quality sparring partners in my weight class.
                  The platform is a game-changer for serious fighters."
                </Text>
                <View style={styles.testimonialAuthor}>
                  <View style={styles.testimonialAvatar}>
                    <Ionicons name="person" size={16} color={colors.primary[500]} />
                  </View>
                  <View>
                    <Text style={styles.testimonialName}>Alex Rodriguez</Text>
                    <Text style={styles.testimonialRole}>Pro Boxer, Berlin</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // Mobile layout (redesigned)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animated background orb */}
        <Animated.View style={[styles.backgroundOrb, orbStyle]} />

        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(0).duration(500)}
          style={styles.header}
        >
          <Text style={styles.logo}>FIGHT</Text>
          <View style={styles.logoRedLine} />
          <Text style={styles.logoAccent}>STATION</Text>
        </Animated.View>

        {/* Register Form */}
        <View style={styles.form}>
          <Animated.View entering={FadeIn.delay(100).duration(500)}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the boxing network</Text>
          </Animated.View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {renderForm(false)}
        </View>

        {/* Sign In Link */}
        <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Mobile styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[6],
  },
  backgroundOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(196,30,58,0.05)',
    top: 40,
    alignSelf: 'center',
    left: (width - 300) / 2 - spacing[6],
  },
  header: {
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  logo: {
    fontFamily: 'BarlowCondensed-Black',
    fontSize: 56,
    letterSpacing: 4,
    color: '#FFFFFF',
  },
  logoRedLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary[500],
    marginVertical: spacing[1],
  },
  logoAccent: {
    fontFamily: 'Inter-Medium',
    fontSize: 20,
    letterSpacing: 10,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
    marginBottom: spacing[6],
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
  error: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  showHide: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  button: {
    marginTop: spacing[4],
  },
  terms: {
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing[4],
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary[500],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[6],
  },
  footerText: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.base,
  },
  footerLink: {
    color: colors.primary[500],
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },

  // Desktop styles
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  formSide: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopFormContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[10],
  },
  desktopFormCard: {
    width: '100%',
    maxWidth: 480,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  desktopFormHeader: {
    marginBottom: spacing[6],
  },
  desktopTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[2],
  },
  desktopSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
  },
  desktopForm: {
    gap: spacing[1],
  },
  desktopFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[8],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  brandingSide: {
    flex: 1,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  brandingOverlay: {
    flex: 1,
    padding: spacing[10],
    justifyContent: 'center',
  },
  brandingContent: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  desktopLogoContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius['2xl'],
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  desktopLogo: {
    fontFamily: 'BarlowCondensed-Black',
    fontSize: 56,
    letterSpacing: 4,
    color: '#FFFFFF',
  },
  desktopLogoAccent: {
    fontFamily: 'Inter-Medium',
    fontSize: 20,
    letterSpacing: 10,
    color: colors.textSecondary,
  },
  brandingTagline: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[300],
    textAlign: 'center',
    marginBottom: spacing[8],
    lineHeight: 26,
  },
  userTypesList: {
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  userTypeCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  userTypeIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTypeTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  userTypeDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    flex: 1,
    lineHeight: 18,
  },
  testimonialCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteIcon: {
    marginBottom: spacing[3],
  },
  testimonialText: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[300],
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: spacing[4],
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[50],
  },
  testimonialRole: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
  },
});
