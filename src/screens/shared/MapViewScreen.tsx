import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  GlassCard,
  BadgeRow,
  AnimatedListItem,
  EmptyState,
  SectionHeader,
} from '../../components';

type MapViewScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type FilterType = 'all' | 'gyms' | 'events';

type LocationItem = {
  id: string;
  type: 'gym' | 'event';
  title: string;
  subtitle: string;
  address: string;
  distance?: string;
  latitude: number;
  longitude: number;
  data: any;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

// Mock data for gyms and events
const MOCK_LOCATIONS: LocationItem[] = [
  {
    id: 'gym-1',
    type: 'gym',
    title: 'Elite Boxing Academy',
    subtitle: '127 members • 8 events this week',
    address: 'Friedrichstra\u00dfe 123, Berlin',
    distance: '0.8 km',
    latitude: 52.5200,
    longitude: 13.4050,
    data: { memberCount: 127, eventsThisWeek: 8 },
  },
  {
    id: 'gym-2',
    type: 'gym',
    title: 'Iron Fist Club',
    subtitle: '89 members • 5 events this week',
    address: 'Alexanderplatz 45, Berlin',
    distance: '1.2 km',
    latitude: 52.5100,
    longitude: 13.3900,
    data: { memberCount: 89, eventsThisWeek: 5 },
  },
  {
    id: 'event-1',
    type: 'event',
    title: 'Technical Sparring Session',
    subtitle: 'Tomorrow • 16:00 • 4/8 spots',
    address: 'Elite Boxing Academy',
    distance: '0.8 km',
    latitude: 52.5150,
    longitude: 13.4100,
    data: { date: 'Tomorrow', time: '16:00', spots: 4, maxSpots: 8 },
  },
  {
    id: 'gym-3',
    type: 'gym',
    title: 'Champion Boxing',
    subtitle: '156 members • 12 events this week',
    address: 'Potsdamer Platz 8, Berlin',
    distance: '2.1 km',
    latitude: 52.5300,
    longitude: 13.4200,
    data: { memberCount: 156, eventsThisWeek: 12 },
  },
  {
    id: 'event-2',
    type: 'event',
    title: 'Open Sparring Night',
    subtitle: 'Fri, Nov 8 • 18:00 • 12/20 spots',
    address: 'Iron Fist Club',
    distance: '1.2 km',
    latitude: 52.5250,
    longitude: 13.3950,
    data: { date: 'Fri, Nov 8', time: '18:00', spots: 12, maxSpots: 20 },
  },
  {
    id: 'event-3',
    type: 'event',
    title: 'Boxing Clinic: Footwork',
    subtitle: 'Sat, Nov 9 • 10:00 • 6/15 spots',
    address: 'Champion Boxing',
    distance: '2.1 km',
    latitude: 52.5080,
    longitude: 13.4150,
    data: { date: 'Sat, Nov 9', time: '10:00', spots: 6, maxSpots: 15 },
  },
];

const FILTER_ITEMS = [
  { key: 'all', label: 'All', icon: 'apps' as const },
  { key: 'gyms', label: 'Gyms', icon: 'business' as const },
  { key: 'events', label: 'Events', icon: 'calendar' as const },
];

export function MapViewScreen({ navigation }: MapViewScreenProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>(MOCK_LOCATIONS);

  const calculateDistance = useCallback((lat: number, lon: number, from: { latitude: number; longitude: number }): string => {
    const R = 6371;
    const dLat = (lat - from.latitude) * (Math.PI / 180);
    const dLon = (lon - from.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.latitude * (Math.PI / 180)) *
        Math.cos(lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return `${distance.toFixed(1)} km`;
  }, []);

  const loadLocations = useCallback(async (currentUserLocation: { latitude: number; longitude: number } | null) => {
    if (!isSupabaseConfigured) {
      setLocations(MOCK_LOCATIONS);
      return;
    }

    try {
      const [gymsResult, eventsResult] = await Promise.all([
        supabase
          .from('gyms')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(20),
        supabase
          .from('sparring_events')
          .select(`
            *,
            gym:gyms (
              id, name, latitude, longitude, address, city, country
            )
          `)
          .gte('event_date', new Date().toISOString().split('T')[0])
          .eq('status', 'published')
          .order('event_date', { ascending: true })
          .limit(10),
      ]);

      if (gymsResult.error) throw gymsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const transformedLocations: LocationItem[] = [];

      if (gymsResult.data) {
        gymsResult.data.forEach((gym: any) => {
          if (gym.latitude && gym.longitude) {
            transformedLocations.push({
              id: `gym-${gym.id}`,
              type: 'gym',
              title: gym.name,
              subtitle: `${gym.city}, ${gym.country}`,
              address: gym.address || `${gym.city}, ${gym.country}`,
              distance: currentUserLocation
                ? calculateDistance(gym.latitude, gym.longitude, currentUserLocation)
                : undefined,
              latitude: gym.latitude,
              longitude: gym.longitude,
              data: gym,
            });
          }
        });
      }

      if (eventsResult.data) {
        eventsResult.data.forEach((event: any) => {
          const gym = event.gym;
          if (gym?.latitude && gym?.longitude) {
            const eventDate = new Date(event.event_date);
            const dateStr = eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            transformedLocations.push({
              id: `event-${event.id}`,
              type: 'event',
              title: event.title,
              subtitle: `${dateStr} • ${event.start_time || ''} • ${event.current_participants || 0}/${event.max_participants || 0} spots`,
              address: gym.name,
              distance: currentUserLocation
                ? calculateDistance(gym.latitude, gym.longitude, currentUserLocation)
                : undefined,
              latitude: gym.latitude,
              longitude: gym.longitude,
              data: event,
            });
          }
        });
      }

      if (transformedLocations.length > 0) {
        if (currentUserLocation) {
          transformedLocations.sort((a, b) => {
            if (!a.distance || !b.distance) return 0;
            return parseFloat(a.distance) - parseFloat(b.distance);
          });
        }
        setLocations(transformedLocations);
      } else {
        setLocations(MOCK_LOCATIONS);
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      setLocations(MOCK_LOCATIONS);
    }
  }, [calculateDistance]);

  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');

        let loc: { latitude: number; longitude: number } | null = null;
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          loc = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(loc);
        }

        await loadLocations(loc);
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadLocations]);

  const getFilteredLocations = (): LocationItem[] => {
    switch (filter) {
      case 'gyms':
        return locations.filter((l) => l.type === 'gym');
      case 'events':
        return locations.filter((l) => l.type === 'event');
      default:
        return locations;
    }
  };

  const getMarkerColor = (type: 'gym' | 'event') => {
    return type === 'gym' ? colors.primary[500] : colors.success;
  };

  const handleItemPress = (item: LocationItem) => {
    if (item.type === 'gym') {
      navigation.navigate('GymProfileView', { gymId: item.id.replace('gym-', '') });
    } else {
      navigation.navigate('EventDetail', { eventId: item.id.replace('event-', '') });
    }
  };

  const handleOpenInMaps = (item: LocationItem) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${item.latitude},${item.longitude}`,
      android: `google.navigation:q=${item.latitude},${item.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`,
    });
    Linking.openURL(url as string);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  const filteredLocations = getFilteredLocations();
  const gymCount = locations.filter((l) => l.type === 'gym').length;
  const eventCount = locations.filter((l) => l.type === 'event').length;

  // Update filter items with counts
  const filterItemsWithCounts = [
    { key: 'all', label: `All (${gymCount + eventCount})`, icon: 'apps' as const },
    { key: 'gyms', label: `Gyms (${gymCount})`, icon: 'business' as const },
    { key: 'events', label: `Events (${eventCount})`, icon: 'calendar' as const },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nearby</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Location Status */}
        {userLocation && (
          <View style={styles.locationStatus}>
            <Ionicons name="location" size={16} color={colors.success} />
            <Text style={styles.locationStatusText}>Location enabled</Text>
          </View>
        )}
        {locationPermission === false && (
          <TouchableOpacity style={styles.locationWarning} onPress={() => {
            const reloadLocation = async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setLocationPermission(status === 'granted');
                if (status === 'granted') {
                  const location = await Location.getCurrentPositionAsync({});
                  const loc = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  };
                  setUserLocation(loc);
                  await loadLocations(loc);
                }
              } catch (error) {
                console.error('Error getting location:', error);
              }
            };
            reloadLocation();
          }}>
            <Ionicons name="location-outline" size={16} color={colors.warning} />
            <Text style={styles.locationWarningText}>Enable location for better results</Text>
          </TouchableOpacity>
        )}

        {/* Filter Chips - BadgeRow */}
        <BadgeRow
          items={filterItemsWithCounts}
          selected={filter}
          onSelect={(key) => setFilter(key as FilterType)}
          style={{ paddingVertical: spacing[3] }}
        />

        {/* Results Count */}
        <SectionHeader
          title={`${filteredLocations.length} location${filteredLocations.length !== 1 ? 's' : ''} found`}
        />

        {/* Location List */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredLocations.length === 0 ? (
            <EmptyState
              icon="location-outline"
              title="No Locations Found"
              description="Try changing your filters"
            />
          ) : (
            filteredLocations.map((item, index) => (
              <AnimatedListItem key={item.id} index={index}>
                <GlassCard
                  style={styles.locationCard}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.locationCardRow}>
                    <View style={[styles.iconContainer, { backgroundColor: `${getMarkerColor(item.type)}20` }]}>
                      <Ionicons
                        name={item.type === 'gym' ? 'business' : 'calendar'}
                        size={24}
                        color={getMarkerColor(item.type)}
                      />
                    </View>
                    <View style={styles.locationInfo}>
                      <View style={styles.locationHeader}>
                        <Text style={styles.locationTitle}>{item.title}</Text>
                        {item.distance && (
                          <View style={styles.distanceBadge}>
                            <Text style={styles.distanceText}>{item.distance}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.locationSubtitle}>{item.subtitle}</Text>
                      <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.addressText}>{item.address}</Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={() => handleOpenInMaps(item)}
                      >
                        <Ionicons name="navigate" size={18} color={colors.primary[500]} />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </View>
                  </View>
                </GlassCard>
              </AnimatedListItem>
            ))
          )}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    maxWidth: containerMaxWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: `${colors.success}15`,
  },
  locationStatusText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: `${colors.warning}15`,
  },
  locationWarningText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
  },
  locationCard: {
    marginBottom: spacing[3],
  },
  locationCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  locationInfo: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  locationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
    marginLeft: spacing[2],
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  locationSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  addressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  directionsButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: spacing[10],
  },
});
