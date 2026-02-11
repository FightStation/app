import React, { useState } from 'react';
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
import { GradientButton, GlassInput } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useReferral } from '../../context/ReferralContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { SUPPORTED_COUNTRIES, CombatSport } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { isDesktop } from '../../lib/responsive';

type FighterSetupScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const TOTAL_STEPS = 3;

// Combat sports with colors
const COMBAT_SPORTS: { key: CombatSport; label: string; color: string; icon: string }[] = [
  { key: 'boxing', label: 'Boxing', color: '#C41E3A', icon: 'fitness' },
  { key: 'mma', label: 'MMA', color: '#F97316', icon: 'hand-left' },
  { key: 'muay_thai', label: 'Muay Thai', color: '#EAB308', icon: 'flash' },
  { key: 'kickboxing', label: 'Kickboxing', color: '#3B82F6', icon: 'flame' },
];

export function FighterSetupScreen({ navigation }: FighterSetupScreenProps) {
  const { user, refreshProfile } = useAuth();
  const { generateReferralCode } = useReferral();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state - only essential fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [selectedSports, setSelectedSports] = useState<CombatSport[]>([]);
  const [primarySport, setPrimarySport] = useState<CombatSport | null>(null);

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Your Name';
      case 2: return 'Location';
      case 3: return 'Your Disciplines';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'This will be shown on your profile';
      case 2: return 'Help us find events and partners near you';
      case 3: return 'Select the combat sports you train';
      default: return '';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return 'person';
      case 2: return 'location';
      case 3: return 'fitness';
      default: return 'person';
    }
  };

  const toggleSport = (sport: CombatSport) => {
    setSelectedSports(prev => {
      if (prev.includes(sport)) {
        // If removing and it was primary, clear primary
        if (primarySport === sport) {
          setPrimarySport(prev.length > 1 ? prev.filter(s => s !== sport)[0] : null);
        }
        return prev.filter(s => s !== sport);
      } else {
        // If first selection, make it primary
        if (prev.length === 0) {
          setPrimarySport(sport);
        }
        return [...prev, sport];
      }
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName || !lastName) {
        setError('Please enter your name');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!country || !city) {
        setError('Please select your location');
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (selectedSports.length === 0) {
      setError('Please select at least one combat sport');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create fighter profile with sports selection
      const { error: insertError } = await supabase.from('fighters').insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        country,
        city,
        sports: selectedSports,
        primary_sport: primarySport || selectedSports[0],
        weight_class: 'welterweight', // Default weight class
        experience_level: 'beginner', // Default experience level
        fights_count: 0,
        sparring_count: 0,
      });

      if (insertError) {
        console.error('[FighterSetup] Insert error:', insertError);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Generate referral code for new user (don't await - do in background)
      if (isSupabaseConfigured) {
        generateReferralCode().catch(referralError => {
          console.error('[FighterSetup] Failed to generate referral code:', referralError);
        });
      }

      // Refresh profile and navigate
      await refreshProfile();

      // Navigate to welcome screen
      navigation.replace('Welcome');
    } catch (err) {
      console.error('[FighterSetup] Setup failed:', err);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <GlassInput
        label="First Name"
        placeholder="Enter your first name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />

      <GlassInput
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
      <Text style={styles.selectLabel}>Country</Text>
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

      <GlassInput
        label="City"
        placeholder="Enter your city"
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
      />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
        <Text style={styles.infoText}>
          You can add your weight class, experience level, and bio later in your profile settings.
        </Text>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.selectLabel}>Select your combat sports (tap to select)</Text>
      <View style={styles.sportsGrid}>
        {COMBAT_SPORTS.map((sport) => {
          const isSelected = selectedSports.includes(sport.key);
          const isPrimary = primarySport === sport.key;
          return (
            <TouchableOpacity
              key={sport.key}
              style={[
                styles.sportCard,
                isSelected && { borderColor: sport.color, backgroundColor: `${sport.color}15` },
              ]}
              onPress={() => toggleSport(sport.key)}
              onLongPress={() => {
                if (isSelected) {
                  setPrimarySport(sport.key);
                }
              }}
            >
              <View style={[
                styles.sportIconContainer,
                isSelected && { backgroundColor: sport.color },
              ]}>
                <Ionicons
                  name={sport.icon as any}
                  size={28}
                  color={isSelected ? colors.textPrimary : colors.textMuted}
                />
              </View>
              <Text style={[
                styles.sportLabel,
                isSelected && { color: sport.color, fontWeight: '700' },
              ]}>
                {sport.label}
              </Text>
              {isPrimary && (
                <View style={[styles.primaryBadge, { backgroundColor: sport.color }]}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              )}
              {isSelected && !isPrimary && (
                <View style={styles.selectedCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={sport.color} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedSports.length > 1 && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
          <Text style={styles.infoText}>
            Long-press on a sport to set it as your primary discipline
          </Text>
        </View>
      )}

      {selectedSports.length === 0 && (
        <View style={[styles.infoBox, { backgroundColor: `${colors.warning}15` }]}>
          <Ionicons name="alert-circle" size={20} color={colors.warning} />
          <Text style={styles.infoText}>
            Select at least one combat sport to continue
          </Text>
        </View>
      )}
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
            {step === 3 && renderStep3()}
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
            <GradientButton title="Continue" onPress={handleNext} size="lg" />
          ) : (
            <GradientButton
              title="Get Started"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
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
    paddingBottom: 100, // Space for fixed footer
  },
  desktopScrollContent: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: spacing[8],
    paddingTop: spacing[12],
    paddingBottom: 120, // Space for fixed footer on desktop
    minHeight: '100%',
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingTop: isDesktop ? 0 : spacing[6],
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
    marginHorizontal: isDesktop ? 0 : spacing[6],
    gap: spacing[2],
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  formContent: {
    flex: 1,
    paddingHorizontal: isDesktop ? 0 : spacing[6],
  },
  selectLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  countryChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceLight,
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
  // Sports selection styles
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  sportCard: {
    width: '47%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  sportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  sportLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  primaryBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  selectedCheck: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
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
