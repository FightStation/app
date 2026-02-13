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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { GlassCard, BadgeRow, PulseIndicator, AnimatedListItem } from '../../components';
import { useAuth } from '../../context/AuthContext';
import {
  getUserConversations,
  subscribeToUserConversations,
  unsubscribeFromChannel,
  ConversationWithDetails,
} from '../../services/messaging';
import { RealtimeChannel } from '@supabase/supabase-js';

type MessagesScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

const TAB_ITEMS = [
  { key: 'all', label: 'All', icon: 'chatbubbles' as keyof typeof Ionicons.glyphMap },
  { key: 'gyms', label: 'Gyms', icon: 'business' as keyof typeof Ionicons.glyphMap },
  { key: 'fighters', label: 'Fighters', icon: 'fitness' as keyof typeof Ionicons.glyphMap },
];

export function MessagesScreen({ navigation }: MessagesScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'gyms' | 'fighters'>('all');
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    loadConversations();

    // Subscribe to real-time updates
    if (user?.id) {
      const conversationChannel = subscribeToUserConversations(user.id, handleConversationUpdate);
      setChannel(conversationChannel);
    }

    return () => {
      if (channel) {
        unsubscribeFromChannel(channel);
      }
    };
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getUserConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationUpdate = () => {
    // Reload conversations when there's an update
    loadConversations();
  };

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'gyms') return conv.other_participant.role === 'gym';
    if (activeTab === 'fighters') return conv.other_participant.role === 'fighter';
    return true;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleConversationPress = (conversation: ConversationWithDetails) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUserId: conversation.other_participant.id,
      name: conversation.other_participant.name,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={24} color={colors.primary[500]} />
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tabs - using BadgeRow */}
        <View style={styles.tabsContainer}>
          <BadgeRow
            items={TAB_ITEMS}
            selected={activeTab}
            onSelect={(key) => setActiveTab(key as 'all' | 'gyms' | 'fighters')}
          />
        </View>

        {/* Conversations List */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          ) : filteredConversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a conversation with gyms or fighters
              </Text>
            </View>
          ) : (
            filteredConversations.map((conversation, index) => (
              <AnimatedListItem key={conversation.id} index={index}>
                <GlassCard
                  style={styles.conversationCard}
                  onPress={() => handleConversationPress(conversation)}
                  accentColor={conversation.unread_count > 0 ? colors.primary[500] : undefined}
                >
                  <View style={styles.conversationRow}>
                    <View style={styles.avatarContainer}>
                      {conversation.other_participant.avatar_url ? (
                        <Image
                          source={{ uri: conversation.other_participant.avatar_url }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons
                            name={
                              conversation.other_participant.role === 'gym' ? 'business' : 'person'
                            }
                            size={24}
                            color={colors.textMuted}
                          />
                        </View>
                      )}
                      {/* Online indicator using PulseIndicator */}
                      {conversation.other_participant.role === 'fighter' && (
                        <View style={styles.onlineIndicatorWrap}>
                          <PulseIndicator color={colors.success} size="sm" />
                        </View>
                      )}
                    </View>

                    <View style={styles.conversationInfo}>
                      <View style={styles.conversationHeader}>
                        <Text style={[
                          styles.conversationName,
                          conversation.unread_count > 0 && styles.conversationNameUnread,
                        ]}>
                          {conversation.other_participant.name}
                        </Text>
                        <Text style={styles.timestamp}>
                          {formatTimestamp(conversation.last_message_at)}
                        </Text>
                      </View>
                      <View style={styles.messageRow}>
                        <Text
                          style={[
                            styles.lastMessage,
                            conversation.unread_count > 0 && styles.lastMessageUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {conversation.last_message || 'No messages yet'}
                        </Text>
                        {conversation.unread_count > 0 && (
                          <View style={styles.unreadCount}>
                            <Text style={styles.unreadCountText}>{conversation.unread_count}</Text>
                          </View>
                        )}
                      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.display,
  },
  unreadBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  unreadBadgeText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  conversationCard: {
    marginBottom: spacing[3],
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicatorWrap: {
    position: 'absolute',
    bottom: 0,
    right: -2,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  conversationName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.semibold,
  },
  conversationNameUnread: {
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bold,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  lastMessageUnread: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.medium,
  },
  unreadCount: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1.5],
    marginLeft: spacing[2],
  },
  unreadCountText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  emptyState: {
    flex: 1,
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
    fontFamily: typography.fontFamily.semibold,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
    fontFamily: typography.fontFamily.regular,
  },
  bottomPadding: {
    height: spacing[20],
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
});
