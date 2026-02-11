import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { isDesktop, isWeb } from '../../lib/responsive';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width, height } = Dimensions.get('window');

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animated background orb
  const orbTranslateX = useSharedValue(0);
  React.useEffect(() => {
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

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
    }

    setLoading(false);
  };

  // Desktop split-screen layout
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Left side - Branding */}
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

              {/* Tagline */}
              <Text style={styles.brandingTagline}>
                The premier platform for combat sports athletes
              </Text>

              {/* Features */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="people" size={24} color={colors.primary[500]} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Find Training Partners</Text>
                    <Text style={styles.featureDesc}>Connect with fighters at your skill level</Text>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="calendar" size={24} color={colors.primary[500]} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Book Sparring Sessions</Text>
                    <Text style={styles.featureDesc}>Schedule sessions at top gyms near you</Text>
                  </View>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="trophy" size={24} color={colors.primary[500]} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Track Your Progress</Text>
                    <Text style={styles.featureDesc}>Build your fighting record and reputation</Text>
                  </View>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>2,500+</Text>
                  <Text style={styles.statLabel}>Active Fighters</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>150+</Text>
                  <Text style={styles.statLabel}>Partner Gyms</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>10K+</Text>
                  <Text style={styles.statLabel}>Sessions Booked</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Right side - Login Form */}
        <View style={styles.formSide}>
          <ScrollView
            contentContainerStyle={styles.desktopFormContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.desktopFormCard}>
              {/* Header */}
              <View style={styles.desktopFormHeader}>
                <Text style={styles.desktopTitle}>Welcome Back</Text>
                <Text style={styles.desktopSubtitle}>
                  Sign in to continue to Fight Station
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

                <GlassInput
                  label="Password"
                  placeholder="Enter your password"
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
                />

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <GradientButton
                  title="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                  fullWidth
                  size="lg"
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-apple" size={20} color={colors.textPrimary} />
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.desktopFooter}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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

        {/* Logo/Header */}
        <Animated.View
          entering={FadeIn.delay(0).duration(500)}
          style={styles.header}
        >
          <Text style={styles.logo}>FIGHT</Text>
          <View style={styles.logoRedLine} />
          <Text style={styles.logoAccent}>STATION</Text>
          <Text style={styles.tagline}>Connect. Train. Compete.</Text>
        </Animated.View>

        {/* Login Form */}
        <View style={styles.form}>
          <Animated.View entering={FadeIn.delay(100).duration(500)}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </Animated.View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

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
              placeholder="Enter your password"
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
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400).duration(500)}>
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(500).duration(500)}>
            <GradientButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(600).duration(500)}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={20} color={colors.textPrimary} />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Sign Up Link */}
        <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
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
    backgroundColor: 'rgba(19,91,236,0.05)',
    top: 40,
    alignSelf: 'center',
    left: (width - 300) / 2 - spacing[6],
  },
  header: {
    alignItems: 'center',
    marginTop: spacing[10],
    marginBottom: spacing[8],
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
  tagline: {
    color: colors.neutral[400],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
    letterSpacing: 2,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[6],
  },
  forgotPasswordText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
  },
  button: {
    marginTop: spacing[2],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[700],
  },
  dividerText: {
    color: colors.neutral[500],
    paddingHorizontal: spacing[4],
    fontSize: typography.fontSize.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: glass.light.backgroundColor,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: glass.light.borderColor,
  },
  socialButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  googleButton: {
    borderColor: colors.neutral[600],
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
    marginBottom: spacing[8],
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
    fontSize: typography.fontSize.xl,
    color: colors.neutral[300],
    textAlign: 'center',
    marginBottom: spacing[10],
    lineHeight: 28,
  },
  featuresList: {
    gap: spacing[5],
    marginBottom: spacing[10],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  featureDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    gap: spacing[5],
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
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
    maxWidth: 440,
  },
  desktopFormHeader: {
    marginBottom: spacing[8],
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
});
