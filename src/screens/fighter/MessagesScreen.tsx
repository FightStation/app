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

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
            {activeTab === 'all' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'gyms' && styles.tabActive]}
            onPress={() => setActiveTab('gyms')}
          >
            <Text style={[styles.tabText, activeTab === 'gyms' && styles.tabTextActive]}>
              Gyms
            </Text>
            {activeTab === 'gyms' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fighters' && styles.tabActive]}
            onPress={() => setActiveTab('fighters')}
          >
            <Text style={[styles.tabText, activeTab === 'fighters' && styles.tabTextActive]}>
              Fighters
            </Text>
            {activeTab === 'fighters' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
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
            filteredConversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationCard}
                onPress={() => handleConversationPress(conversation)}
              >
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
                </View>

                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>
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
              </TouchableOpacity>
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
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary[500],
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.cardBg,
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
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
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
  },
  lastMessageUnread: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
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
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
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
