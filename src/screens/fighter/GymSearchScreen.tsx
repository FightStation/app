import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

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
      <TouchableOpacity
        style={styles.gymCard}
        onPress={() => navigation.navigate('GymProfileView', { gymId: item.id })}
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
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or location..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredGyms}
        renderItem={renderGym}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadGyms}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No gyms found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Check back later for new gyms'}
            </Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    margin: spacing[4],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing[1],
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  gymCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyStateText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
