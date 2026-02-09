import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, Input } from '../../components';
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

  const renderCountry = ({ item }: { item: DirectoryCountry }) => (
    <TouchableOpacity
      style={styles.countryCard}
      onPress={() => handleCountrySelect(item)}
      activeOpacity={0.7}
    >
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
    </TouchableOpacity>
  );

  const renderGym = ({ item }: { item: DirectoryGym }) => (
    <Card
      style={styles.gymCard}
      onPress={() => handleGymPress(item)}
    >
      <View style={styles.gymHeader}>
        <View style={styles.gymSportIcon}>
          <Text style={styles.sportEmoji}>
            {item.sports.length > 0 ? getSportIcon(item.sports[0]) : '🏟️'}
          </Text>
        </View>
        <View style={styles.gymInfo}>
          <Text style={styles.gymName}>{item.name}</Text>
          <Text style={styles.gymLocation}>
            {item.city}{item.address ? ` • ${item.address}` : ''}
          </Text>
        </View>
        {item.is_claimed ? (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.claimedText}>{t('directory.claimed')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => navigation.navigate('DirectoryGymDetail', { gymId: item.id })}
          >
            <Text style={styles.claimButtonText}>{t('directory.claimThisGym')}</Text>
          </TouchableOpacity>
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
    </Card>
  );

  const renderCityTabs = () => {
    if (!cities.length) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cityTabs}
        contentContainerStyle={styles.cityTabsContent}
      >
        <TouchableOpacity
          style={[styles.cityTab, !selectedCity && styles.cityTabActive]}
          onPress={() => handleCitySelect(null)}
        >
          <Text style={[styles.cityTabText, !selectedCity && styles.cityTabTextActive]}>
            {t('common.viewAll')}
          </Text>
        </TouchableOpacity>
        {cities.map((city) => (
          <TouchableOpacity
            key={city}
            style={[styles.cityTab, selectedCity === city && styles.cityTabActive]}
            onPress={() => handleCitySelect(city)}
          >
            <Text style={[styles.cityTabText, selectedCity === city && styles.cityTabTextActive]}>
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (viewMode === 'countries') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('directory.title')}</Text>
          <Text style={styles.subtitle}>{t('directory.selectCountry')}</Text>
        </View>

        <FlatList
          data={countries}
          renderItem={renderCountry}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary[500]} />
              ) : (
                <>
                  <Ionicons name="business-outline" size={48} color={colors.neutral[600]} />
                  <Text style={styles.emptyText}>{t('directory.noGymsFound')}</Text>
                </>
              )}
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[50]} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.countryHeaderFlag}>{getCountryFlag(selectedCountry!.code)}</Text>
            <Text style={styles.countryHeaderName}>{selectedCountry!.name}</Text>
          </View>
        </View>
        <Input
          placeholder={t('directory.searchByCity')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchContainer}
          leftIcon={<Ionicons name="search" size={18} color={colors.neutral[500]} />}
        />
      </View>

      {renderCityTabs()}

      <FlatList
        data={gyms}
        renderItem={renderGym}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary[500]} />
            ) : (
              <>
                <Ionicons name="business-outline" size={48} color={colors.neutral[600]} />
                <Text style={styles.emptyText}>{t('directory.noGymsFound')}</Text>
                <TouchableOpacity style={styles.addGymButton}>
                  <Text style={styles.addGymText}>{t('directory.addGym')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing[4],
    paddingTop: spacing[6],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[2],
    marginLeft: -spacing[2],
  },
  headerTitle: {
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
    fontWeight: 'bold',
    color: colors.neutral[50],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
  },
  searchContainer: {
    marginBottom: 0,
  },
  list: {
    padding: spacing[4],
    paddingTop: spacing[2],
  },

  // Country list styles
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
  },
  countryFlag: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
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
    fontWeight: '600',
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
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  gymCountLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
  },

  // City tabs styles
  cityTabs: {
    maxHeight: 44,
    marginBottom: spacing[2],
  },
  cityTabsContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  cityTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  cityTabActive: {
    backgroundColor: colors.primary[500],
  },
  cityTabText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  cityTabTextActive: {
    color: colors.neutral[50],
  },

  // Gym card styles
  gymCard: {
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
    backgroundColor: colors.surfaceLight,
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
    fontWeight: '600',
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
    fontWeight: '500',
  },
  claimButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  claimButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[50],
    fontWeight: '600',
  },
  gymSports: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sportBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  sportBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
  },
  gymContact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[700],
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

  // Empty state
  empty: {
    alignItems: 'center',
    padding: spacing[10],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[400],
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  addGymButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  addGymText: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: '500',
  },
});