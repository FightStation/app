import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassInput, EmptyState } from '../../components';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SparringEvent, Fighter, WEIGHT_CLASS_LABELS } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type EventsListScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function EventsListScreen({ navigation }: EventsListScreenProps) {
  const { profile, role } = useAuth();
  const fighter = role === 'fighter' ? (profile as Fighter) : null;

  const [events, setEvents] = useState<SparringEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SparringEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.gym?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.gym?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events);
    }
  }, [searchQuery, events]);

  const loadEvents = async () => {
    setLoading(true);

    let query = supabase
      .from('sparring_events')
      .select('*, gym:gyms(*)')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    if (fighter?.weight_class) {
      query = query.contains('weight_classes', [fighter.weight_class]);
    }

    const { data } = await query.limit(50);

    if (data) {
      setEvents(data as SparringEvent[]);
      setFilteredEvents(data as SparringEvent[]);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderEvent = ({ item }: { item: SparringEvent }) => {
    const spotsLeft = item.max_participants - item.current_participants;
    const isFull = spotsLeft <= 0;

    return (
      <GlassCard
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        <View style={styles.eventHeader}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>
              {new Date(item.event_date).getDate()}
            </Text>
            <Text style={styles.dateMonth}>
              {new Date(item.event_date).toLocaleDateString('en-US', {
                month: 'short',
              })}
            </Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventGym}>{item.gym?.name}</Text>
            <Text style={styles.eventLocation}>
              {item.gym?.city}, {item.gym?.country}
            </Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {item.start_time} - {item.end_time}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Spots</Text>
            <Text
              style={[
                styles.detailValue,
                isFull ? styles.spotsFull : styles.spotsAvailable,
              ]}
            >
              {isFull ? 'Full' : `${spotsLeft} available`}
            </Text>
          </View>
        </View>

        <View style={styles.weightClasses}>
          {item.weight_classes.slice(0, 3).map((wc) => (
            <View key={wc} style={styles.weightBadge}>
              <Text style={styles.weightBadgeText}>
                {WEIGHT_CLASS_LABELS[wc].split(' ')[0]}
              </Text>
            </View>
          ))}
          {item.weight_classes.length > 3 && (
            <Text style={styles.moreClasses}>
              +{item.weight_classes.length - 3} more
            </Text>
          )}
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Events</Text>
        <GlassInput
          placeholder="Search events, gyms, cities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchContainer}
          leftIcon={<Ionicons name="search" size={18} color={colors.textMuted} />}
        />
      </View>

      {fighter && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>
            Showing events for {WEIGHT_CLASS_LABELS[fighter.weight_class]}
          </Text>
          <TouchableOpacity>
            <Text style={styles.filterChange}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Loading events...</Text>
            </View>
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No Events Found"
              description="Try adjusting your search or check back later"
            />
          )
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
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.neutral[50],
    marginBottom: spacing[4],
  },
  searchContainer: {
    marginBottom: 0,
  },
  filterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
  },
  filterChange: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },
  list: {
    padding: spacing[4],
    paddingTop: 0,
  },
  eventCard: {
    marginBottom: spacing[4],
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: spacing[3],
  },
  dateBox: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  dateDay: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.neutral[50],
  },
  dateMonth: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[200],
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[50],
    marginBottom: spacing[1],
  },
  eventGym: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[300],
  },
  eventLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[700],
    marginBottom: spacing[3],
  },
  detailRow: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    marginBottom: spacing[1],
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[200],
    fontWeight: '500',
  },
  spotsAvailable: {
    color: colors.success,
  },
  spotsFull: {
    color: colors.error,
  },
  weightClasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  weightBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  weightBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[300],
  },
  moreClasses: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
    alignSelf: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: spacing[10],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[400],
    marginBottom: spacing[2],
  },
});
