import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  GlassCard,
  GlassInput,
  EmptyState,
} from '../../components';

type GymSearchScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type Gym = {
  id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  address: string;
  facilities: string[];
  photos: string[];
  contact_email: string;
  member_count?: number;
};

const MOCK_GYMS: Gym[] = [
  {
    id: '1',
    name: 'Elite Boxing Academy',
    description: 'Premier boxing facility offering technical and competitive training',
    city: 'Berlin',
    country: 'Germany',
    address: 'Friedrichstraße 123, 10117 Berlin',
    facilities: ['Boxing Ring', 'Heavy Bags', 'Speed Bags', 'Weights'],
    photos: [],
    contact_email: 'info@eliteboxing.de',
    member_count: 45,
  },
  {
    id: '2',
    name: 'Iron Fist Gym',
    description: 'Old-school boxing gym with experienced trainers',
    city: 'Hamburg',
    country: 'Germany',
    address: 'Reeperbahn 45, 20359 Hamburg',
    facilities: ['Boxing Ring', 'Heavy Bags', 'Locker Rooms'],
    photos: [],
    contact_email: 'contact@ironfist.de',
    member_count: 32,
  },
  {
    id: '3',
    name: 'Champion Boxing Club',
    description: 'Modern facility with Olympic-standard equipment',
    city: 'Munich',
    country: 'Germany',
    address: 'Marienplatz 12, 80331 Munich',
    facilities: ['Boxing Ring', 'Heavy Bags', 'Speed Bags', 'Weights', 'Sauna', 'Physio'],
    photos: [],
    contact_email: 'info@championboxing.de',
    member_count: 67,
  },
];

export function GymSearchScreen({ navigation }: GymSearchScreenProps) {
  const [gyms, setGyms] = useState<Gym[]>(MOCK_GYMS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    if (!isSupabaseConfigured) {
      setGyms(MOCK_GYMS);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setGyms(data || []);
    } catch (error) {
      console.error('Error loading gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGyms = () => {
    if (!searchQuery) return gyms;

    const query = searchQuery.toLowerCase();
    return gyms.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.city.toLowerCase().includes(query) ||
        gym.country.toLowerCase().includes(query)
    );
  };

  const renderGym = ({ item }: { item: Gym }) => {
    return (
      <GlassCard
        intensity="light"
        onPress={() => navigation.navigate('GymProfileView', { gymId: item.id })}
        style={styles.gymCard}
      >
        <View style={styles.gymHeader}>
          <View style={styles.gymAvatar}>
            <Ionicons name="business" size={24} color={colors.primary[500]} />
          </View>
          <View style={styles.gymInfo}>
            <Text style={styles.gymName}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.textMuted} />
              <Text style={styles.locationText}>
                {item.city}, {item.country}
              </Text>
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={styles.gymDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.facilitiesContainer}>
          {item.facilities.slice(0, 3).map((facility, index) => (
            <View key={index} style={styles.facilityBadge}>
              <Text style={styles.facilityText}>{facility}</Text>
            </View>
          ))}
          {item.facilities.length > 3 && (
            <View style={styles.facilityBadge}>
              <Text style={styles.facilityText}>+{item.facilities.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.gymFooter}>
          {item.member_count && (
            <View style={styles.memberCount}>
              <Ionicons name="people" size={14} color={colors.textMuted} />
              <Text style={styles.memberCountText}>{item.member_count} members</Text>
            </View>
          )}
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
          </View>
        </View>
      </GlassCard>
    );
  };

  const filteredGyms = getFilteredGyms();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Gyms</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <GlassInput
          placeholder="Search by name or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color={colors.textMuted} />}
          rightIcon={
            searchQuery.length > 0 ? (
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            ) : undefined
          }
          onRightIconPress={searchQuery.length > 0 ? () => setSearchQuery('') : undefined}
          containerStyle={styles.searchInputContainer}
        />
      </View>

      <FlatList
        data={filteredGyms}
        renderItem={renderGym}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadGyms}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No gyms found"
            description={
              searchQuery ? 'Try a different search term' : 'Check back later for new gyms'
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  gymCard: {
    padding: spacing[4],
  },
  gymHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  gymAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  gymDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  facilityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  facilityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  gymFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  memberCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  viewButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
});
