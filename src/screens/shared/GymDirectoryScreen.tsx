import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  BadgeRow,
  EmptyState,
  AnimatedListItem,
} from '../../components';
import {
  getDirectoryCountries,
  getCitiesForCountry,
  searchGymDirectory,
} from '../../services/gymDirectory';
import {
  DirectoryCountry,
  DirectoryGym,
  CombatSport,
  getCountryFlag,
  COMBAT_SPORT_LABELS,
} from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { useTranslation } from 'react-i18next';

type GymDirectoryScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type ViewMode = 'countries' | 'gyms';

export function GymDirectoryScreen({ navigation }: GymDirectoryScreenProps) {
  const { t } = useTranslation();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('countries');
  const [selectedCountry, setSelectedCountry] = useState<DirectoryCountry | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Data state
  const [countries, setCountries] = useState<DirectoryCountry[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [gyms, setGyms] = useState<DirectoryGym[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadCities(selectedCountry.code);
      loadGyms(selectedCountry.code, selectedCity);
    }
  }, [selectedCountry, selectedCity]);

  useEffect(() => {
    if (viewMode === 'gyms' && selectedCountry) {
      // Filter gyms by search query
      if (searchQuery) {
        loadGyms(selectedCountry.code, selectedCity, searchQuery);
      } else {
        loadGyms(selectedCountry.code, selectedCity);
      }
    }
  }, [searchQuery]);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const data = await getDirectoryCountries();
      // Sort by gym count descending
      const sorted = data.sort((a, b) => b.gym_count - a.gym_count);
      setCountries(sorted);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
    setLoading(false);
  };

  const loadCities = async (countryCode: string) => {
    try {
      const data = await getCitiesForCountry(countryCode);
      setCities(data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadGyms = async (
    countryCode: string,
    city?: string | null,
    search?: string
  ) => {
    setLoading(true);
    try {
      const data = await searchGymDirectory({
        country_code: countryCode,
        city: city || undefined,
        search_term: search || undefined,
        limit: 100,
      });
      setGyms(data);
    } catch (error) {
      console.error('Error loading gyms:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (viewMode === 'countries') {
      await loadCountries();
    } else if (selectedCountry) {
      await loadGyms(selectedCountry.code, selectedCity);
    }
    setRefreshing(false);
  };

  const handleCountrySelect = (country: DirectoryCountry) => {
    setSelectedCountry(country);
    setSelectedCity(null);
    setViewMode('gyms');
    setSearchQuery('');
  };

  const handleBack = () => {
    if (viewMode === 'gyms') {
      setViewMode('countries');
      setSelectedCountry(null);
      setSelectedCity(null);
      setSearchQuery('');
      setGyms([]);
    } else {
      navigation.goBack();
    }
  };

  const handleCitySelect = (city: string | null) => {
    setSelectedCity(city);
  };

  const handleGymPress = (gym: DirectoryGym) => {
    if (gym.is_claimed && gym.gym_id) {
      // Navigate to full gym profile
      navigation.navigate('GymProfileView', { gymId: gym.gym_id });
    } else {
      // Navigate to directory gym detail (unclaimed)
      navigation.navigate('DirectoryGymDetail', { gymId: gym.id });
    }
  };

  const getSportIcon = (sport: CombatSport): string => {
    switch (sport) {
      case 'boxing':
        return '\u{1F94A}';
      case 'mma':
        return '\u{1F94B}';
      case 'muay_thai':
        return '\u{1F9B5}';
      case 'kickboxing':
        return '\u{1F44A}';
      default:
        return '\u{1F3DF}';
    }
  };

  const renderCountry = ({ item, index }: { item: DirectoryCountry; index: number }) => (
    <AnimatedListItem index={index}>
      <GlassCard
        intensity="light"
        onPress={() => handleCountrySelect(item)}
        noPadding
        style={styles.countryCardGlass}
      >
        <View style={styles.countryCardContent}>
          <View style={styles.countryFlag}>
            <Text style={styles.flagEmoji}>{getCountryFlag(item.code)}</Text>
          </View>
          <View style={styles.countryInfo}>
            <Text style={styles.countryName}>{item.name}</Text>
            {item.name_native && item.name_native !== item.name && (
              <Text style={styles.countryNative}>{item.name_native}</Text>
            )}
          </View>
          <View style={styles.countryCount}>
            <Text style={styles.gymCount}>{item.gym_count}</Text>
            <Text style={styles.gymCountLabel}>{t('directory.gymsCount', { count: item.gym_count }).replace(`${item.gym_count} `, '')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  const renderGym = ({ item, index }: { item: DirectoryGym; index: number }) => (
    <AnimatedListItem index={index}>
      <GlassCard
        intensity="light"
        onPress={() => handleGymPress(item)}
        style={styles.gymCardGlass}
      >
        <View style={styles.gymHeader}>
          <View style={styles.gymSportIcon}>
            <Text style={styles.sportEmoji}>
              {item.sports.length > 0 ? getSportIcon(item.sports[0]) : '\u{1F3DF}'}
            </Text>
          </View>
          <View style={styles.gymInfo}>
            <Text style={styles.gymName}>{item.name}</Text>
            <Text style={styles.gymLocation}>
              {item.city}{item.address ? ` \u2022 ${item.address}` : ''}
            </Text>
          </View>
          {item.is_claimed ? (
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.claimedText}>{t('directory.claimed')}</Text>
            </View>
          ) : (
            <GradientButton
              title={t('directory.claimThisGym')}
              onPress={() => navigation.navigate('DirectoryGymDetail', { gymId: item.id })}
              size="sm"
            />
          )}
        </View>

        <View style={styles.gymSports}>
          {item.sports.map((sport) => (
            <View key={sport} style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>
                {COMBAT_SPORT_LABELS[sport] || sport}
              </Text>
            </View>
          ))}
        </View>

        {(item.phone || item.website || item.instagram) && (
          <View style={styles.gymContact}>
            {item.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={14} color={colors.neutral[500]} />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            )}
            {item.website && (
              <View style={styles.contactItem}>
                <Ionicons name="globe-outline" size={14} color={colors.neutral[500]} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {item.website.replace(/^https?:\/\//, '')}
                </Text>
              </View>
            )}
          </View>
        )}
      </GlassCard>
    </AnimatedListItem>
  );

  const renderCityTabs = () => {
    if (!cities.length) return null;

    const badgeItems = [
      { key: '__all__', label: t('common.viewAll') },
      ...cities.map(city => ({ key: city, label: city })),
    ];

    return (
      <View style={styles.cityTabsContainer}>
        <BadgeRow
          items={badgeItems}
          selected={selectedCity || '__all__'}
          onSelect={(key: string) => handleCitySelect(key === '__all__' ? null : key)}
        />
      </View>
    );
  };

  if (viewMode === 'countries') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.neutral[50]} />
            </TouchableOpacity>
          </View>
          <SectionHeader title={t('directory.title')} subtitle={t('directory.selectCountry')} />
        </View>

        <FlatList
          data={countries}
          renderItem={renderCountry}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
              </View>
            ) : (
              <EmptyState
                icon="business-outline"
                title={t('directory.noGymsFound')}
                description="No countries with registered gyms yet"
              />
            )
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[50]} />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Text style={styles.countryHeaderFlag}>{getCountryFlag(selectedCountry!.code)}</Text>
            <Text style={styles.countryHeaderName}>{selectedCountry!.name}</Text>
          </View>
        </View>

        {/* Search */}
        <GlassCard intensity="light" noPadding style={styles.searchGlass}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color={colors.neutral[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('directory.searchByCity')}
              placeholderTextColor={colors.neutral[500]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </GlassCard>
      </View>

      {renderCityTabs()}

      <FlatList
        data={gyms}
        renderItem={renderGym}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          ) : (
            <EmptyState
              icon="business-outline"
              title={t('directory.noGymsFound')}
              description="No gyms found in this area"
              actionLabel={t('directory.addGym')}
              onAction={() => {}}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing[4],
    paddingTop: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[2],
    marginLeft: -spacing[2],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryHeaderFlag: {
    fontSize: 24,
    marginRight: spacing[2],
  },
  countryHeaderName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[50],
  },
  // Search
  searchGlass: {
    borderRadius: borderRadius.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: Platform.OS === 'web' ? spacing[3] : spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  list: {
    padding: spacing[4],
    paddingTop: spacing[2],
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing[10],
  },

  // City tabs
  cityTabsContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },

  // Country list styles
  countryCardGlass: {
    marginBottom: spacing[3],
  },
  countryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  countryFlag: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary[500]}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  flagEmoji: {
    fontSize: 28,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[50],
  },
  countryNative: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    marginTop: spacing[1],
  },
  countryCount: {
    alignItems: 'flex-end',
    marginRight: spacing[3],
  },
  gymCount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  gymCountLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
  },

  // Gym card styles
  gymCardGlass: {
    marginBottom: spacing[3],
  },
  gymHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  gymSportIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary[500]}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  sportEmoji: {
    fontSize: 24,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  gymLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  claimedText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  gymSports: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sportBadge: {
    backgroundColor: `${colors.primary[500]}15`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  sportBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[400],
    fontWeight: typography.fontWeight.medium,
  },
  gymContact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  contactText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
});
