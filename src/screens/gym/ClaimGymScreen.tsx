import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card } from '../../components';
import {
  getDirectoryGym,
  createGymClaimRequest,
  getClaimRequestForGym,
} from '../../services/gymDirectory';
import {
  DirectoryGym,
  GymClaimRequest,
  ClaimVerificationMethod,
  getCountryFlag,
} from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

type ClaimGymScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ ClaimGym: { gymId: string; gymName: string } }, 'ClaimGym'>;
};

export function ClaimGymScreen({ navigation, route }: ClaimGymScreenProps) {
  const { gymId, gymName } = route.params;
  const { t } = useTranslation();

  const [gym, setGym] = useState<DirectoryGym | null>(null);
  const [existingClaim, setExistingClaim] = useState<GymClaimRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<ClaimVerificationMethod | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    loadGymData();
  }, [gymId]);

  const loadGymData = async () => {
    setLoading(true);
    try {
      const [gymData, claim] = await Promise.all([
        getDirectoryGym(gymId),
        getClaimRequestForGym(gymId),
      ]);
      setGym(gymData);
      setExistingClaim(claim);
    } catch (error) {
      console.error('Error loading gym:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    }
    setLoading(false);
  };

  const handleSelectMethod = (method: ClaimVerificationMethod) => {
    setSelectedMethod(method);
    setProofImage(null);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('common.error'), t('permissions.mediaLibrary'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProofImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('common.error'), t('permissions.camera'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProofImage(result.assets[0].uri);
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedMethod) {
      Alert.alert(t('common.error'), t('directory.selectVerificationMethod'));
      return;
    }

    if (selectedMethod === 'manual' && !proofImage) {
      Alert.alert(t('common.error'), t('directory.uploadProofRequired'));
      return;
    }

    setSubmitting(true);
    try {
      // In a real app, you'd upload the proofImage to storage first
      const proofUrl = proofImage ? `uploaded://${proofImage}` : undefined;

      await createGymClaimRequest(gymId, selectedMethod, proofUrl);

      Alert.alert(
        t('common.success'),
        t('directory.claimSubmittedMessage'),
        [
          {
            text: t('common.done'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting claim:', error);
      if (error.code === '23505') {
        Alert.alert(t('common.error'), t('directory.alreadySubmittedClaim'));
      } else {
        Alert.alert(t('common.error'), t('errors.generic'));
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.neutral[500]} />
        <Text style={styles.errorText}>{t('errors.notFound')}</Text>
        <Button title={t('common.back')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // Show existing claim status
  if (existingClaim) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[50]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('directory.claimStatus')}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <Card style={styles.gymCard}>
            <Text style={styles.gymName}>{gym.name}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.countryFlag}>{getCountryFlag(gym.country_code)}</Text>
              <Text style={styles.location}>{gym.city}, {gym.country_name}</Text>
            </View>
          </Card>

          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={
                  existingClaim.status === 'approved'
                    ? 'checkmark-circle'
                    : existingClaim.status === 'rejected'
                    ? 'close-circle'
                    : 'time'
                }
                size={48}
                color={
                  existingClaim.status === 'approved'
                    ? colors.success
                    : existingClaim.status === 'rejected'
                    ? colors.error
                    : colors.warning
                }
              />
              <Text style={styles.statusTitle}>
                {existingClaim.status === 'approved'
                  ? t('directory.claimApproved')
                  : existingClaim.status === 'rejected'
                  ? t('directory.claimRejected')
                  : existingClaim.status === 'verifying'
                  ? t('directory.claimVerifying')
                  : t('directory.claimPending')}
              </Text>
            </View>

            <Text style={styles.statusDescription}>
              {existingClaim.status === 'approved'
                ? t('directory.claimApprovedDesc')
                : existingClaim.status === 'rejected'
                ? existingClaim.rejected_reason || t('directory.claimRejectedDesc')
                : existingClaim.status === 'verifying'
                ? t('directory.claimVerifyingDesc')
                : t('directory.claimPendingDesc')}
            </Text>

            <View style={styles.statusDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('directory.verificationMethod')}:</Text>
                <Text style={styles.detailValue}>
                  {existingClaim.verification_method === 'email'
                    ? t('directory.emailVerification')
                    : existingClaim.verification_method === 'phone'
                    ? t('directory.phoneVerification')
                    : t('directory.manualReview')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('directory.submittedOn')}:</Text>
                <Text style={styles.detailValue}>
                  {new Date(existingClaim.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card>

          {existingClaim.status === 'rejected' && (
            <Button
              title={t('directory.submitNewClaim')}
              onPress={() => {
                setExistingClaim(null);
                setSelectedMethod(null);
              }}
              style={styles.retryButton}
            />
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[50]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('directory.claimThisGym')}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Gym Info Card */}
        <Card style={styles.gymCard}>
          <Text style={styles.gymName}>{gym.name}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.countryFlag}>{getCountryFlag(gym.country_code)}</Text>
            <Text style={styles.location}>{gym.city}, {gym.country_name}</Text>
          </View>
          {gym.address && (
            <Text style={styles.address}>{gym.address}</Text>
          )}
        </Card>

        {/* Verification Methods */}
        <Text style={styles.sectionTitle}>{t('directory.verifyOwnership')}</Text>
        <Text style={styles.sectionSubtitle}>{t('directory.selectVerificationMethod')}</Text>

        {/* Email Verification Option */}
        {gym.email && (
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'email' && styles.methodCardSelected,
            ]}
            onPress={() => handleSelectMethod('email')}
          >
            <View style={styles.methodHeader}>
              <View style={[
                styles.methodIconContainer,
                selectedMethod === 'email' && styles.methodIconSelected,
              ]}>
                <Ionicons name="mail" size={24} color={
                  selectedMethod === 'email' ? colors.neutral[50] : colors.primary[500]
                } />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>{t('directory.emailVerification')}</Text>
                <Text style={styles.methodDescription}>
                  {t('directory.emailVerificationDesc')}
                </Text>
                <Text style={styles.methodTarget}>{gym.email}</Text>
              </View>
              {selectedMethod === 'email' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Phone Verification Option */}
        {gym.phone && (
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'phone' && styles.methodCardSelected,
            ]}
            onPress={() => handleSelectMethod('phone')}
          >
            <View style={styles.methodHeader}>
              <View style={[
                styles.methodIconContainer,
                selectedMethod === 'phone' && styles.methodIconSelected,
              ]}>
                <Ionicons name="call" size={24} color={
                  selectedMethod === 'phone' ? colors.neutral[50] : colors.primary[500]
                } />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>{t('directory.phoneVerification')}</Text>
                <Text style={styles.methodDescription}>
                  {t('directory.phoneVerificationDesc')}
                </Text>
                <Text style={styles.methodTarget}>{gym.phone}</Text>
              </View>
              {selectedMethod === 'phone' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Manual Verification Option (always available) */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            selectedMethod === 'manual' && styles.methodCardSelected,
          ]}
          onPress={() => handleSelectMethod('manual')}
        >
          <View style={styles.methodHeader}>
            <View style={[
              styles.methodIconContainer,
              selectedMethod === 'manual' && styles.methodIconSelected,
            ]}>
              <Ionicons name="document-text" size={24} color={
                selectedMethod === 'manual' ? colors.neutral[50] : colors.primary[500]
              } />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{t('directory.manualReview')}</Text>
              <Text style={styles.methodDescription}>
                {t('directory.manualReviewDesc')}
              </Text>
            </View>
            {selectedMethod === 'manual' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
            )}
          </View>
        </TouchableOpacity>

        {/* Document Upload Section (for manual verification) */}
        {selectedMethod === 'manual' && (
          <Card style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>{t('directory.uploadProof')}</Text>
            <Text style={styles.uploadDescription}>{t('directory.uploadProofDesc')}</Text>

            {proofImage ? (
              <View style={styles.proofImageContainer}>
                <View style={styles.proofImagePlaceholder}>
                  <Ionicons name="document-attach" size={48} color={colors.success} />
                  <Text style={styles.proofImageText}>{t('directory.documentUploaded')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setProofImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                  <Ionicons name="images" size={24} color={colors.primary[500]} />
                  <Text style={styles.uploadButtonText}>{t('directory.chooseFromGallery')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
                  <Ionicons name="camera" size={24} color={colors.primary[500]} />
                  <Text style={styles.uploadButtonText}>{t('directory.takePhoto')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.uploadHint}>{t('directory.acceptedDocuments')}</Text>
          </Card>
        )}

        {/* Additional Info */}
        {selectedMethod && (
          <View style={styles.additionalInfoSection}>
            <Text style={styles.additionalInfoLabel}>{t('directory.additionalInfo')}</Text>
            <TextInput
              style={styles.additionalInfoInput}
              placeholder={t('directory.additionalInfoPlaceholder')}
              placeholderTextColor={colors.neutral[500]}
              multiline
              numberOfLines={3}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
            />
          </View>
        )}

        {/* Submit Button */}
        {selectedMethod && (
          <Button
            title={submitting ? t('common.submitting') : t('directory.submitClaim')}
            onPress={handleSubmitClaim}
            disabled={submitting || (selectedMethod === 'manual' && !proofImage)}
            style={styles.submitButton}
          />
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>{t('directory.claimDisclaimer')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[400],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[12],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
  },
  content: {
    padding: spacing[4],
  },
  gymCard: {
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  gymName: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[2],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  countryFlag: {
    fontSize: 16,
  },
  location: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginBottom: spacing[4],
  },
  methodCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.surfaceLight,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  methodIconSelected: {
    backgroundColor: colors.primary[500],
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 20,
  },
  methodTarget: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[400],
    marginTop: spacing[1],
    fontWeight: '500',
  },
  uploadSection: {
    padding: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  uploadTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  uploadDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginBottom: spacing[4],
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.surfaceLight,
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },
  proofImageContainer: {
    position: 'relative',
  },
  proofImagePlaceholder: {
    backgroundColor: colors.surfaceLight,
    padding: spacing[6],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  proofImageText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginTop: spacing[2],
    fontWeight: '500',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  uploadHint: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginTop: spacing[3],
    fontStyle: 'italic',
  },
  additionalInfoSection: {
    marginBottom: spacing[4],
  },
  additionalInfoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.neutral[300],
    marginBottom: spacing[2],
  },
  additionalInfoInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    color: colors.neutral[50],
    fontSize: typography.fontSize.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  disclaimer: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing[8],
  },
  // Status view styles
  statusCard: {
    padding: spacing[6],
    alignItems: 'center',
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  statusTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginTop: spacing[3],
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  statusDetails: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
    paddingTop: spacing[4],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    fontWeight: '500',
  },
  retryButton: {
    marginTop: spacing[4],
  },
});