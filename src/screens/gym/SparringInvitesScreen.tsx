import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import {
  GlassCard,
  GradientButton,
  BadgeRow,
  EmptyState,
  AnimatedListItem,
} from '../../components';

type SparringInvitesScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

interface FighterRequest {
  id: string;
  fighterName: string;
  fighterNickname?: string;
  fighterAvatar?: string;
  weightClass: string;
  record: string;
  experience: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Mock fighter requests
const mockIncomingRequests: FighterRequest[] = [
  {
    id: 'req-1',
    fighterName: 'Marcus Petrov',
    fighterNickname: 'The Hammer',
    fighterAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
    weightClass: 'Middleweight',
    record: '18-3-0',
    experience: 'Advanced',
    eventId: 'event-1',
    eventTitle: 'Technical Sparring Session',
    eventDate: 'Nov 5, 2024',
    eventTime: '18:00',
    requestedAt: '2 hours ago',
    status: 'pending',
  },
  {
    id: 'req-2',
    fighterName: 'Sarah Chen',
    weightClass: 'Welterweight',
    record: '12-1-0',
    experience: 'Intermediate',
    eventId: 'event-1',
    eventTitle: 'Technical Sparring Session',
    eventDate: 'Nov 5, 2024',
    eventTime: '18:00',
    requestedAt: '5 hours ago',
    status: 'pending',
  },
  {
    id: 'req-3',
    fighterName: 'Javier Mendez',
    fighterNickname: 'El Toro',
    weightClass: 'Light Heavyweight',
    record: '22-5-1',
    experience: 'Professional',
    eventId: 'event-2',
    eventTitle: 'Hard Rounds Friday',
    eventDate: 'Nov 8, 2024',
    eventTime: '19:00',
    requestedAt: '1 day ago',
    status: 'pending',
  },
];

const mockSentInvites: FighterRequest[] = [
  {
    id: 'sent-1',
    fighterName: 'Elena Volkov',
    fighterNickname: 'Ice Queen',
    fighterAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    weightClass: 'Flyweight',
    record: '15-2-0',
    experience: 'Advanced',
    eventId: 'event-3',
    eventTitle: 'Weekend Open Sparring',
    eventDate: 'Nov 10, 2024',
    eventTime: '10:00',
    requestedAt: '3 days ago',
    status: 'pending',
  },
];

const tabBadgeItems = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'sent', label: 'Sent Invites' },
];

export function SparringInvitesScreen({ navigation }: SparringInvitesScreenProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [requests, setRequests] = useState<FighterRequest[]>(mockIncomingRequests);
  const [sentInvites, setSentInvites] = useState<FighterRequest[]>(mockSentInvites);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    if (!isSupabaseConfigured || !profile || !('name' in profile)) {
      setRequests(mockIncomingRequests);
      setSentInvites(mockSentInvites);
      return;
    }

    setLoading(true);
    try {
      // Load incoming requests for gym's events
      const { data, error } = await supabase
        .from('event_requests')
        .select(`
          *,
          events (
            title,
            event_date,
            start_time
          ),
          fighters (
            first_name,
            last_name,
            weight_class,
            experience_level
          )
        `)
        .eq('events.gym_id', (profile as any).id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = data?.map((req: any) => ({
        id: req.id,
        fighterName: `${req.fighters?.first_name} ${req.fighters?.last_name}`,
        weightClass: req.fighters?.weight_class || 'Unknown',
        record: '0-0-0',
        experience: req.fighters?.experience_level || 'Unknown',
        eventId: req.event_id,
        eventTitle: req.events?.title || 'Event',
        eventDate: req.events?.event_date || '',
        eventTime: req.events?.start_time || '',
        requestedAt: new Date(req.created_at).toLocaleDateString(),
        status: req.status,
      })) || [];

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!isSupabaseConfigured) {
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'approved' as const } : req
        )
      );
      Alert.alert('Success', 'Request approved! (Demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Success', 'Request approved!');
      loadRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!isSupabaseConfigured) {
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'rejected' as const } : req
        )
      );
      Alert.alert('Rejected', 'Request declined (Demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Rejected', 'Request declined');
      loadRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline request');
    }
  };

  const handleViewFighterProfile = (fighterId: string) => {
    navigation.navigate('FighterProfileView', { fighterId });
  };

  const displayRequests = activeTab === 'incoming' ? requests : sentInvites;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Sparring Requests</Text>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Tabs */}
        <BadgeRow
          items={tabBadgeItems}
          selected={activeTab}
          onSelect={(key) => setActiveTab(key as 'incoming' | 'sent')}
          style={styles.tabRow}
        />

        {/* Requests List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {displayRequests.length === 0 ? (
            <EmptyState
              icon={activeTab === 'incoming' ? 'mail-open-outline' : 'send-outline'}
              title={activeTab === 'incoming' ? 'No Incoming Requests' : 'No Sent Invites'}
              description={
                activeTab === 'incoming'
                  ? 'Fighter requests to join your events will appear here'
                  : 'Invites you send to fighters will appear here'
              }
            />
          ) : (
            displayRequests.map((request, index) => (
              <AnimatedListItem key={request.id} index={index}>
                <GlassCard style={styles.requestCard}>
                  {/* Fighter Info */}
                  <View style={styles.fighterHeader}>
                    <View style={styles.avatarContainer}>
                      {request.fighterAvatar ? (
                        <Image
                          source={{ uri: request.fighterAvatar }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person" size={24} color={colors.textMuted} />
                        </View>
                      )}
                    </View>
                    <View style={styles.fighterInfo}>
                      <View style={styles.fighterNameRow}>
                        <Text style={styles.fighterName}>{request.fighterName}</Text>
                        {request.status === 'approved' && (
                          <View style={styles.approvedBadge}>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color={colors.success}
                            />
                            <Text style={styles.approvedText}>APPROVED</Text>
                          </View>
                        )}
                        {request.status === 'rejected' && (
                          <View style={styles.rejectedBadge}>
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color={colors.error}
                            />
                            <Text style={styles.rejectedText}>REJECTED</Text>
                          </View>
                        )}
                      </View>
                      {request.fighterNickname && (
                        <Text style={styles.fighterNickname}>
                          "{request.fighterNickname}"
                        </Text>
                      )}
                      <View style={styles.fighterMetaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="trophy-outline"
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text style={styles.metaText}>{request.record}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="scale-outline"
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text style={styles.metaText}>{request.weightClass}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="star-outline"
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text style={styles.metaText}>{request.experience}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.profileButton}
                      onPress={() => handleViewFighterProfile(request.id)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Event Info */}
                  <View style={styles.eventInfo}>
                    <View style={styles.eventInfoHeader}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={colors.primary[500]}
                      />
                      <Text style={styles.eventInfoLabel}>REQUESTING TO JOIN</Text>
                    </View>
                    <Text style={styles.eventTitle}>{request.eventTitle}</Text>
                    <View style={styles.eventMeta}>
                      <Text style={styles.eventMetaText}>
                        {request.eventDate} • {request.eventTime}
                      </Text>
                    </View>
                  </View>

                  {/* Request Time */}
                  <View style={styles.requestTime}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.requestTimeText}>
                      Requested {request.requestedAt}
                    </Text>
                  </View>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(request.id)}
                      >
                        <Ionicons name="close" size={18} color={colors.error} />
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                      <GradientButton
                        title="Approve"
                        onPress={() => handleApprove(request.id)}
                        icon="checkmark"
                        size="sm"
                        style={styles.approveButtonStyle}
                      />
                    </View>
                  )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  pendingBadge: {
    backgroundColor: `${colors.primary[500]}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  pendingBadgeText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  headerRight: {
    width: 40,
  },
  tabRow: {
    paddingVertical: spacing[3],
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  // Request Card
  requestCard: {
    marginBottom: spacing[4],
  },
  fighterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginRight: spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fighterInfo: {
    flex: 1,
  },
  fighterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  fighterName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
    gap: spacing[0.5],
  },
  approvedText: {
    color: colors.success,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}20`,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
    gap: spacing[0.5],
  },
  rejectedText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  fighterNickname: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    marginBottom: spacing[2],
  },
  fighterMetaRow: {
    flexDirection: 'row',
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  profileButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
  },
  eventInfo: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  eventInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  eventInfoLabel: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  requestTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  requestTimeText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.lg,
    gap: spacing[1],
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  approveButtonStyle: {
    flex: 1,
  },
  // Empty State
  bottomPadding: {
    height: spacing[10],
  },
});
