import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useReferral } from '../../context/ReferralContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Gym } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

type CoachSetupScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const TOTAL_STEPS = 2;

export function CoachSetupScreen({ navigation }: CoachSetupScreenProps) {
  const { user, refreshProfile } = useAuth();
  const { generateReferralCode } = useReferral();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state - only essential fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymSearch, setGymSearch] = useState('');

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    const { data } = await supabase
      .from('gyms')
      .select('*')
      .order('name', { ascending: true });

    if (data) {
      setGyms(data as Gym[]);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Your Details';
      case 2: return 'Select Your Gym';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Tell us about yourself';
      case 2: return 'Choose the gym you coach at';
      default: return '';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return 'person';
      case 2: return 'business';
      default: return 'person';
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName) {
        setError('Please enter your name');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedGym) {
      setError('Please select your gym');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create coach profile with minimal required fields
      const { error: insertError } = await supabase.from('coaches').insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        gym_id: selectedGym.id,
        specializations: [],
        years_experience: 0,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Generate referral code for new coach (don't await - do in background)
      if (isSupabaseConfigured) {
        generateReferralCode().catch(referralError => {
          console.error('[CoachSetup] Failed to generate referral code:', referralError);
        });
      }

      // Refresh profile and navigate
      await refreshProfile();

      // Navigate to welcome screen
      navigation.replace('Welcome');
    } catch (err) {
      console.error('[CoachSetup] Setup failed:', err);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredGyms = gyms.filter(
    (g) =>
      g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
      g.city.toLowerCase().includes(gymSearch.toLowerCase())
  );

  const renderStep1 = () => (
    <>
      <Input
        label="First Name"
        placeholder="Enter your first name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />

      <Input
        label="Last Name"
        placeholder="Enter your last name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Input
        placeholder="Search gyms..."
        value={gymSearch}
        onChangeText={setGymSearch}
      />

      <ScrollView
        style={styles.gymList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {filteredGyms.map((gym) => (
          <TouchableOpacity
            key={gym.id}
            style={[
              styles.gymCard,
              selectedGym?.id === gym.id && styles.gymCardSelected,
            ]}
            onPress={() => setSelectedGym(gym)}
          >
            <View style={styles.gymCardIcon}>
              <Ionicons
                name="business"
                size={24}
                color={selectedGym?.id === gym.id ? colors.primary[500] : colors.textMuted}
              />
            </View>
            <View style={styles.gymCardInfo}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <Text style={styles.gymLocation}>
                {gym.city}, {gym.country}
              </Text>
            </View>
            <View
              style={[
                styles.radioOuter,
                selectedGym?.id === gym.id && styles.radioOuterSelected,
              ]}
            >
              {selectedGym?.id === gym.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
        {filteredGyms.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={colors.textMuted} />
            <Text style={styles.noGyms}>
              No gyms found. Ask your gym to register on Fight Station.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
        <Text style={styles.infoText}>
          You can add your specializations, experience, and bio later in your profile settings.
        </Text>
      </View>
    </>
  );

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
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={getStepIcon() as any} size={32} color={colors.primary[500]} />
            </View>
            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepDescription()}</Text>
          </View>

          {/* Progress Steps */}
          <View style={styles.progressContainer}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <View key={s} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    s < step && styles.progressDotCompleted,
                    s === step && styles.progressDotActive,
                  ]}
                >
                  {s < step ? (
                    <Ionicons name="checkmark" size={12} color={colors.background} />
                  ) : (
                    <Text style={[
                      styles.progressNumber,
                      s === step && styles.progressNumberActive,
                    ]}>
                      {s}
                    </Text>
                  )}
                </View>
                {s < TOTAL_STEPS && (
                  <View style={[
                    styles.progressLine,
                    s < step && styles.progressLineCompleted,
                  ]} />
                )}
              </View>
            ))}
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          <View style={styles.formContent}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </View>
        </View>
      </ScrollView>

      {/* Footer - Outside ScrollView for proper positioning */}
      <View style={[styles.footer, isDesktop && styles.desktopFooter]}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={colors.primary[500]} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerRight}>
          <Text style={styles.stepIndicator}>Step {step} of {TOTAL_STEPS}</Text>
          {step < TOTAL_STEPS ? (
            <Button title="Continue" onPress={handleNext} size="lg" style={styles.nextButton} />
          ) : (
            <Button
              title="Get Started"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={styles.nextButton}
            />
          )}
        </View>
      </View>
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
    backgroundColor: colors.background,
    padding: spacing[6],
  },
  desktopCard: {
    flex: 0,
    width: '100%',
    maxWidth: 500,
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
    marginBottom: spacing[6],
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
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}20`,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  progressNumber: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressNumberActive: {
    color: colors.primary[500],
  },
  progressLine: {
    width: isDesktop ? 60 : 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing[2],
  },
  progressLineCompleted: {
    backgroundColor: colors.primary[500],
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
  formContent: {
    flex: 1,
  },
  gymList: {
    maxHeight: 280,
    marginTop: spacing[2],
  },
  gymCard: {
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gymCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: `${colors.primary[500]}10`,
  },
  gymCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  gymCardInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  gymLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyState: {
    alignItems: 'center',
    padding: spacing[8],
  },
  noGyms: {
    textAlign: 'center',
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[4],
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary[500]}10`,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: spacing[4],
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  desktopFooter: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: spacing[4],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
  },
  backButtonText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    flex: 1,
    justifyContent: 'flex-end',
  },
  stepIndicator: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  nextButton: {
    minWidth: 140,
  },
});
