import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../components';
import {
  getDirectoryGym,
  getClaimRequestForGym,
} from '../../services/gymDirectory';
import {
  DirectoryGym,
  GymClaimRequest,
  CombatSport,
  COMBAT_SPORT_LABELS,
  getCountryFlag,
} from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

type DirectoryGymDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ DirectoryGymDetail: { gymId: string } }, 'DirectoryGymDetail'>;
};

export function DirectoryGymDetailScreen({
  navigation,
  route,
}: DirectoryGymDetailScreenProps) {
  const { gymId } = route.params as { gymId: string };
  const { t } = useTranslation();
  const { role } = useAuth();

  const [gym, setGym] = useState<DirectoryGym | null>(null);
  const [claimRequest, setClaimRequest] = useState<GymClaimRequest | null>(null);
  const [loading, setLoading] = useState(true);

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
      setClaimRequest(claim);
    } catch (error) {
      console.error('Error loading gym:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    }
    setLoading(false);
  };

  const handleCall = () => {
    if (gym?.phone) {
      Linking.openURL(`tel:${gym.phone}`);
    }
  };

  const handleEmail = () => {
    if (gym?.email) {
      Linking.openURL(`mailto:${gym.email}`);
    }
  };

  const handleWebsite = () => {
    if (gym?.website) {
      Linking.openURL(gym.website);
    }
  };

  const handleInstagram = () => {
    if (gym?.instagram) {
      Linking.openURL(`https://instagram.com/${gym.instagram}`);
    }
  };

  const handleClaim = () => {
    if (role !== 'gym') {
      Alert.alert(
        t('directory.claimThisGym'),
        t('directory.claimRequiresGymAccount'),
        [{ text: t('common.done') }]
      );
      return;
    }
    navigation.navigate('ClaimGym', { gymId: gym!.id, gymName: gym!.name });
  };

  const getSportIcon = (sport: CombatSport): string => {
    switch (sport) {
      case 'boxing':
        return '🥊';
      case 'mma':
        return '🥋';
      case 'muay_thai':
        return '🦵';
      case 'kickboxing':
        return '👊';
      default:
        return '🏟️';
    }
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

  const hasPendingClaim = claimRequest && claimRequest.status === 'pending';

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[50]} />
        </TouchableOpacity>
      </View>

      {/* Placeholder Image */}
      <View style={styles.imagePlaceholder}>
        <Ionicons name="image-outline" size={48} color={colors.neutral[600]} />
        <Text style={styles.placeholderText}>{t('directory.noPhotosYet')}</Text>
      </View>

      {/* Gym Info */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleInfo}>
            <Text style={styles.gymName}>{gym.name}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.countryFlag}>{getCountryFlag(gym.country_code)}</Text>
              <Text style={styles.location}>
                {gym.city}, {gym.country_name}
              </Text>
            </View>
          </View>
          {gym.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.verifiedText}>{t('directory.verified')}</Text>
            </View>
          )}
        </View>

        {/* Sports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sports.primary')}</Text>
          <View style={styles.sportsRow}>
            {gym.sports.map((sport) => (
              <View key={sport} style={styles.sportBadge}>
                <Text style={styles.sportIcon}>{getSportIcon(sport)}</Text>
                <Text style={styles.sportName}>{COMBAT_SPORT_LABELS[sport] || sport}</Text>
              </View>
            ))}
            {gym.sports.length === 0 && (
              <Text style={styles.noData}>{t('directory.noSportsListed')}</Text>
            )}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('gym.contact')}</Text>

          {gym.address && (
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <Ionicons name="location-outline" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.contactText}>{gym.address}</Text>
            </View>
          )}

          {gym.phone && (
            <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={20} color={colors.primary[500]} />
              </View>
              <Text style={[styles.contactText, styles.contactLink]}>{gym.phone}</Text>
            </TouchableOpacity>
          )}

          {gym.email && (
            <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={20} color={colors.primary[500]} />
              </View>
              <Text style={[styles.contactText, styles.contactLink]}>{gym.email}</Text>
            </TouchableOpacity>
          )}

          {gym.website && (
            <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
              <View style={styles.contactIcon}>
                <Ionicons name="globe-outline" size={20} color={colors.primary[500]} />
              </View>
              <Text style={[styles.contactText, styles.contactLink]} numberOfLines={1}>
                {gym.website.replace(/^https?:\/\//, '')}
              </Text>
            </TouchableOpacity>
          )}

          {gym.instagram && (
            <TouchableOpacity style={styles.contactRow} onPress={handleInstagram}>
              <View style={styles.contactIcon}>
                <Ionicons name="logo-instagram" size={20} color={colors.primary[500]} />
              </View>
              <Text style={[styles.contactText, styles.contactLink]}>@{gym.instagram}</Text>
            </TouchableOpacity>
          )}

          {!gym.address && !gym.phone && !gym.email && !gym.website && !gym.instagram && (
            <Text style={styles.noData}>{t('directory.noContactInfo')}</Text>
          )}
        </View>

        {/* Claim Banner */}
        {!gym.is_claimed && (
          <Card style={styles.claimBanner}>
            <View style={styles.claimBannerContent}>
              <Ionicons name="business-outline" size={32} color={colors.primary[500]} />
              <View style={styles.claimBannerText}>
                <Text style={styles.claimBannerTitle}>{t('directory.isThisYourGym')}</Text>
                <Text style={styles.claimBannerDesc}>{t('directory.claimBenefits')}</Text>
              </View>
            </View>

            {hasPendingClaim ? (
              <View style={styles.pendingClaimBadge}>
                <Ionicons name="time-outline" size={16} color={colors.warning} />
                <Text style={styles.pendingClaimText}>{t('directory.pendingClaim')}</Text>
              </View>
            ) : (
              <Button
                title={t('directory.claimThisGym')}
                onPress={handleClaim}
                style={styles.claimButton}
              />
            )}
          </Card>
        )}

        {/* Source info (small footer) */}
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceText}>
            {t('directory.dataSource')}: {gym.source === 'manual' ? 'Fight Station' : gym.source}
          </Text>
          {gym.updated_at && (
            <Text style={styles.sourceText}>
              {t('directory.lastUpdated')}: {new Date(gym.updated_at).toLocaleDateString()}
            </Text>
          )}
        </View>
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
    position: 'absolute',
    top: spacing[6],
    left: spacing[4],
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    marginTop: spacing[2],
  },
  content: {
    padding: spacing[4],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  titleInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: typography.fontSize['2xl'],
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  sportIcon: {
    fontSize: 18,
  },
  sportName: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[200],
    fontWeight: '500',
  },
  noData: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[800],
  },
  contactIcon: {
    width: 40,
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.neutral[200],
  },
  contactLink: {
    color: colors.primary[400],
  },
  claimBanner: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  claimBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  claimBannerText: {
    flex: 1,
  },
  claimBannerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  claimBannerDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: 20,
  },
  claimButton: {
    marginTop: spacing[2],
  },
  pendingClaimBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  pendingClaimText: {
    fontSize: typography.fontSize.base,
    color: colors.warning,
    fontWeight: '500',
  },
  sourceInfo: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[800],
  },
  sourceText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[600],
    marginBottom: spacing[1],
  },
});