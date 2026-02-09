import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { SparringInvite, EventRequest, SparringEvent, Gym, Fighter } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';

type SparringInvitesScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type TabType = 'received' | 'sent';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const MOCK_RECEIVED: SparringInvite[] = [
  {
    id: 'inv-1',
    invite_type: 'event_invite',
    from_type: 'gym',
    from_gym_id: 'gym-1',
    to_fighter_id: 'me',
    event_id: 'evt-1',
    message: 'We think you\'d be a great fit for our sparring session!',
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    from_gym: {
      id: 'gym-1', user_id: 'u1', name: 'Elite Boxing Academy',
      city: 'Berlin', country: 'Germany', address: 'Friedrichstr. 123',
      photos: [], facilities: [], contact_email: 'info@elite.de',
      sports: ['boxing'], created_at: '', updated_at: '',
    },
    event: {
      id: 'evt-1', gym_id: 'gym-1', title: 'Open Sparring Day',
      event_date: getDateStr(3), start_time: '14:00', end_time: '17:00',
      weight_classes: ['middleweight'], max_participants: 16, current_participants: 8,
      experience_levels: ['intermediate'], status: 'published',
      created_at: '', updated_at: '',
    },
  },
  {
    id: 'inv-2',
    invite_type: 'direct_sparring',
    from_type: 'fighter',
    from_fighter_id: 'f-2',
    to_fighter_id: 'me',
    proposed_date: getDateStr(5),
    proposed_time: '16:00',
    proposed_location: 'Iron Fist MMA, Berlin',
    proposed_weight_class: 'middleweight',
    proposed_intensity: 'moderate',
    message: 'Looking for a sparring partner at my gym this weekend. Interested?',
    status: 'pending',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    from_fighter: {
      id: 'f-2', user_id: 'u11', first_name: 'Andrei', last_name: 'Petrov',
      weight_class: 'middleweight', experience_level: 'advanced',
      sports: ['boxing', 'kickboxing'], country: 'Germany', city: 'Berlin',
      fights_count: 8, sparring_count: 40, record: '6-2-0',
      created_at: '', updated_at: '',
    },
  },
];

const MOCK_SENT: SparringInvite[] = [
  {
    id: 'inv-3',
    invite_type: 'event_invite',
    from_type: 'fighter',
    from_fighter_id: 'me',
    to_fighter_id: 'f-3',
    event_id: 'evt-2',
    status: 'pending',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    event: {
      id: 'evt-2', gym_id: 'gym-2', title: 'Technical Sparring Session',
      event_date: getDateStr(7), start_time: '18:00', end_time: '20:00',
      weight_classes: ['welterweight'], max_participants: 10, current_participants: 4,
      experience_levels: ['intermediate', 'advanced'], status: 'published',
      created_at: '', updated_at: '',
    },
  },
];

function getDateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export function SparringInvitesScreen({ navigation }: SparringInvitesScreenProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [received, setReceived] = useState<SparringInvite[]>(MOCK_RECEIVED);
  const [sent, setSent] = useState<SparringInvite[]>(MOCK_SENT);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    if (!isSupabaseConfigured) return;

    setLoading(true);
    try {
      const fighterId = (profile as any)?.id;
      if (!fighterId) return;

      // Fetch received invites
      const { data: receivedData } = await supabase
        .from('sparring_invites')
        .select(`
          *,
          from_gym:gyms!from_gym_id(*),
          from_fighter:fighters!from_fighter_id(*),
          event:sparring_events(*)
        `)
        .eq('to_fighter_id', fighterId)
        .order('created_at', { ascending: false });

      if (receivedData) setReceived(receivedData);

      // Fetch sent invites
      const { data: sentData } = await supabase
        .from('sparring_invites')
        .select(`
          *,
          to_fighter:fighters!to_fighter_id(*),
          event:sparring_events(*)
        `)
        .eq('from_fighter_id', fighterId)
        .order('created_at', { ascending: false });

      if (sentData) setSent(sentData);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (inviteId: string, response: 'accepted' | 'declined') => {
    setActionLoading(inviteId);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('sparring_invites')
          .update({ status: response, responded_at: new Date().toISOString() })
          .eq('id', inviteId);
      }

      // Optimistic update
      setReceived(prev =>
        prev.map(inv => inv.id === inviteId ? { ...inv, status: response } : inv)
      );
    } catch (error) {
      console.error('Error responding to invite:', error);
      Alert.alert('Error', 'Failed to respond to invite');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('sparring_invites')
          .update({ status: 'cancelled' })
          .eq('id', inviteId);
      }

      setSent(prev =>
        prev.map(inv => inv.id === inviteId ? { ...inv, status: 'cancelled' } : inv)
      );
    } catch (error) {
      console.error('Error cancelling invite:', error);
      Alert.alert('Error', 'Failed to cancel invite');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const pendingCount = received.filter(i => i.status === 'pending').length;

  const renderReceivedInvite = (invite: SparringInvite) => {
    const isFromGym = invite.from_type === 'gym';
    const senderName = isFromGym
      ? invite.from_gym?.name || 'Unknown Gym'
      : `${invite.from_fighter?.first_name || ''} ${invite.from_fighter?.last_name || ''}`.trim() || 'Unknown Fighter';

    return (
      <View key={invite.id} style={styles.inviteCard}>
        <View style={styles.inviteHeader}>
          <View style={styles.senderIcon}>
            <Ionicons
              name={isFromGym ? 'business' : 'person'}
              size={24}
              color={colors.primary[500]}
            />
          </View>
          <View style={styles.senderInfo}>
            <Text style={styles.senderName}>{senderName}</Text>
            <Text style={styles.inviteTime}>{formatTimeAgo(invite.created_at)}</Text>
          </View>
          {invite.status === 'pending' && (
            <View style={styles.pendingDot} />
          )}
        </View>

        {/* Event or Direct Sparring Details */}
        {invite.invite_type === 'event_invite' && invite.event && (
          <TouchableOpacity
            style={styles.eventPreview}
            onPress={() => navigation.navigate('EventDetail', { eventId: invite.event!.id })}
          >
            <Ionicons name="calendar" size={16} color={colors.primary[500]} />
            <View style={styles.eventPreviewInfo}>
              <Text style={styles.eventPreviewTitle}>{invite.event.title}</Text>
              <Text style={styles.eventPreviewMeta}>
                {formatDate(invite.event.event_date)} &middot; {invite.event.start_time}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {invite.invite_type === 'direct_sparring' && (
          <View style={styles.sparringDetails}>
            <View style={styles.sparringDetailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={styles.sparringDetailText}>
                {invite.proposed_date ? formatDate(invite.proposed_date) : 'TBD'}
                {invite.proposed_time ? ` at ${invite.proposed_time}` : ''}
              </Text>
            </View>
            {invite.proposed_location && (
              <View style={styles.sparringDetailRow}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={styles.sparringDetailText}>{invite.proposed_location}</Text>
              </View>
            )}
            {invite.proposed_intensity && (
              <View style={styles.sparringDetailRow}>
                <Ionicons name="flame-outline" size={16} color={colors.textMuted} />
                <Text style={styles.sparringDetailText}>
                  {invite.proposed_intensity.charAt(0).toUpperCase() + invite.proposed_intensity.slice(1)} intensity
                </Text>
              </View>
            )}
          </View>
        )}

        {invite.message && (
          <Text style={styles.inviteMessage}>"{invite.message}"</Text>
        )}

        {/* Action Buttons */}
        {invite.status === 'pending' ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleResponse(invite.id, 'accepted')}
              disabled={actionLoading === invite.id}
            >
              {actionLoading === invite.id ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
                  <Text style={styles.acceptText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleResponse(invite.id, 'declined')}
              disabled={actionLoading === invite.id}
            >
              <Ionicons name="close" size={18} color={colors.error} />
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[
            styles.statusBadgeRow,
            invite.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined,
          ]}>
            <Ionicons
              name={invite.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={invite.status === 'accepted' ? colors.success : colors.error}
            />
            <Text style={[
              styles.statusBadgeText,
              { color: invite.status === 'accepted' ? colors.success : colors.error },
            ]}>
              {invite.status === 'accepted' ? 'Accepted' : 'Declined'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSentInvite = (invite: SparringInvite) => (
    <View key={invite.id} style={styles.inviteCard}>
      <View style={styles.inviteHeader}>
        <View style={styles.senderIcon}>
          <Ionicons name="send" size={20} color={colors.primary[500]} />
        </View>
        <View style={styles.senderInfo}>
          <Text style={styles.senderName}>
            {invite.event?.title || 'Direct Sparring Request'}
          </Text>
          <Text style={styles.inviteTime}>{formatTimeAgo(invite.created_at)}</Text>
        </View>
      </View>

      {invite.event && (
        <View style={styles.eventPreview}>
          <Ionicons name="calendar" size={16} color={colors.primary[500]} />
          <View style={styles.eventPreviewInfo}>
            <Text style={styles.eventPreviewTitle}>{invite.event.title}</Text>
            <Text style={styles.eventPreviewMeta}>
              {formatDate(invite.event.event_date)} &middot; {invite.event.start_time}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.sentStatusRow}>
        <View style={[
          styles.sentStatusBadge,
          invite.status === 'pending' ? styles.sentPending :
          invite.status === 'accepted' ? styles.sentAccepted :
          invite.status === 'cancelled' ? styles.sentCancelled :
          styles.sentDeclined,
        ]}>
          <Text style={[
            styles.sentStatusText,
            invite.status === 'pending' ? styles.sentPendingText :
            invite.status === 'accepted' ? styles.sentAcceptedText :
            invite.status === 'cancelled' ? styles.sentCancelledText :
            styles.sentDeclinedText,
          ]}>
            {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
          </Text>
        </View>

        {invite.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(invite.id)}
            disabled={actionLoading === invite.id}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sparring Invites</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Received
            </Text>
            {pendingCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
            onPress={() => setActiveTab('sent')}
          >
            <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
              Sent Requests
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'received' ? (
              received.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="mail-open-outline" size={64} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No invites yet</Text>
                  <Text style={styles.emptySubtitle}>
                    When gyms or fighters invite you to spar, they'll appear here
                  </Text>
                </View>
              ) : (
                received.map(renderReceivedInvite)
              )
            ) : (
              sent.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="send-outline" size={64} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No requests sent</Text>
                  <Text style={styles.emptySubtitle}>
                    Join events or invite fighters to spar
                  </Text>
                </View>
              ) : (
                sent.map(renderSentInvite)
              )
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerSpacer: { width: 40 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },

  container: { flex: 1 },
  content: { padding: spacing[4] },

  // Invite Card
  inviteCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  senderIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  senderInfo: { flex: 1 },
  senderName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[0.5],
  },
  inviteTime: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },

  // Event Preview
  eventPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  eventPreviewInfo: { flex: 1 },
  eventPreviewTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  eventPreviewMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[0.5],
  },

  // Sparring Details
  sparringDetails: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  sparringDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sparringDetailText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },

  // Message
  inviteMessage: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    marginBottom: spacing[3],
    lineHeight: 20,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  acceptText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: 'transparent',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  declineText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // Status badges
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  statusAccepted: {
    backgroundColor: `${colors.success}15`,
  },
  statusDeclined: {
    backgroundColor: `${colors.error}15`,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  // Sent status
  sentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sentStatusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  sentPending: { backgroundColor: `${colors.warning}20` },
  sentAccepted: { backgroundColor: `${colors.success}20` },
  sentDeclined: { backgroundColor: `${colors.error}20` },
  sentCancelled: { backgroundColor: `${colors.textMuted}20` },
  sentStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  sentPendingText: { color: colors.warning },
  sentAcceptedText: { color: colors.success },
  sentDeclinedText: { color: colors.error },
  sentCancelledText: { color: colors.textMuted },
  cancelButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  cancelText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },

  bottomPadding: {
    height: spacing[10],
  },
});