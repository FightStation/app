import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// =====================================================
// TYPES (aligned with COMPLETE-SCHEMA.sql)
// =====================================================

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  participant_ids: string[];
  last_message?: string;
  last_message_at?: string;
  created_at: string;
};

export type ConversationWithDetails = Conversation & {
  other_participant: {
    id: string;
    name: string;
    avatar_url?: string;
    role: 'fighter' | 'gym' | 'coach';
  };
  unread_count: number;
};

// =====================================================
// CONVERSATION MANAGEMENT
// =====================================================

/**
 * Gets or creates a conversation between two users
 */
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string
): Promise<string> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Would create conversation between', userId1, userId2);
    return 'demo-conversation-id';
  }

  try {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      user1_id: userId1,
      user2_id: userId2,
    });

    if (error) throw error;

    return data as string;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
};

/**
 * Gets all conversations for the current user
 */
export const getUserConversations = async (
  userId: string
): Promise<ConversationWithDetails[]> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Loading conversations for', userId);
    return MOCK_CONVERSATIONS;
  }

  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    const conversationsWithDetails: ConversationWithDetails[] = [];

    for (const conv of conversations || []) {
      const otherUserId = conv.participant_ids.find((id: string) => id !== userId) || '';

      // Get unread count for this conversation
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId)
        .eq('read', false);

      // Get other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', otherUserId)
        .single();

      if (!profile) continue;

      // Get role-specific data
      let otherParticipant: any = { id: otherUserId, role: profile.role };

      if (profile.role === 'fighter') {
        const { data: fighter } = await supabase
          .from('fighters')
          .select('id, first_name, last_name, avatar_url')
          .eq('user_id', otherUserId)
          .single();

        if (fighter) {
          otherParticipant.id = fighter.id;
          otherParticipant.name = `${fighter.first_name} ${fighter.last_name}`;
          otherParticipant.avatar_url = fighter.avatar_url;
        }
      } else if (profile.role === 'gym') {
        const { data: gym } = await supabase
          .from('gyms')
          .select('id, name')
          .eq('user_id', otherUserId)
          .single();

        if (gym) {
          otherParticipant.id = gym.id;
          otherParticipant.name = gym.name;
        }
      } else if (profile.role === 'coach') {
        const { data: coach } = await supabase
          .from('coaches')
          .select('id, first_name, last_name, avatar_url')
          .eq('user_id', otherUserId)
          .single();

        if (coach) {
          otherParticipant.id = coach.id;
          otherParticipant.name = `${coach.first_name} ${coach.last_name}`;
          otherParticipant.avatar_url = coach.avatar_url;
        }
      }

      conversationsWithDetails.push({
        ...conv,
        other_participant: otherParticipant,
        unread_count: unreadCount || 0,
      });
    }

    return conversationsWithDetails;
  } catch (error) {
    console.error('Error loading conversations:', error);
    throw error;
  }
};

/**
 * Deletes a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Would delete conversation', conversationId);
    return;
  }

  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// =====================================================
// MESSAGE MANAGEMENT
// =====================================================

/**
 * Sends a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  messageText: string
): Promise<Message> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Would send message:', messageText);
    return {
      id: 'demo-message-' + Date.now(),
      conversation_id: conversationId,
      sender_id: senderId,
      content: messageText,
      read: false,
      created_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: messageText,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Gets messages for a conversation
 */
export const getConversationMessages = async (
  conversationId: string,
  limit: number = 50
): Promise<Message[]> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Loading messages for', conversationId);
    return MOCK_MESSAGES;
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data as Message[]).reverse(); // Most recent at bottom
  } catch (error) {
    console.error('Error loading messages:', error);
    throw error;
  }
};

/**
 * Marks all messages in a conversation as read
 */
export const markConversationAsRead = async (
  conversationId: string,
  readerId: string
): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Would mark conversation as read', conversationId);
    return;
  }

  try {
    const { error } = await supabase.rpc('mark_conversation_as_read', {
      conv_id: conversationId,
      reader_id: readerId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    throw error;
  }
};

/**
 * Deletes a message
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Would delete message', messageId);
    return;
  }

  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribes to new messages in a conversation
 */
export const subscribeToConversation = (
  conversationId: string,
  onNewMessage: (message: Message) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Would subscribe to conversation', conversationId);
    return null;
  }

  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  return channel;
};

/**
 * Subscribes to new messages for a user across all conversations.
 * Filters client-side since Supabase Realtime doesn't support array contains filters.
 */
export const subscribeToUserConversations = (
  userId: string,
  onConversationUpdate: (conversation: Conversation) => void
): RealtimeChannel | null => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Would subscribe to conversations for', userId);
    return null;
  }

  const channel = supabase
    .channel(`user-conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        const conv = payload.new as Conversation;
        // Client-side filter: only emit if user is a participant
        if (conv.participant_ids && conv.participant_ids.includes(userId)) {
          onConversationUpdate(conv);
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribes from a Realtime channel
 */
export const unsubscribeFromChannel = async (
  channel: RealtimeChannel | null
): Promise<void> => {
  if (channel) {
    await supabase.removeChannel(channel);
  }
};

// =====================================================
// MOCK DATA FOR DEMO MODE
// =====================================================

const MOCK_CONVERSATIONS: ConversationWithDetails[] = [
  {
    id: '1',
    participant_ids: ['user1', 'user2'],
    last_message: 'Hey, are you available for sparring this weekend?',
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    other_participant: {
      id: 'fighter2',
      name: 'Sarah Martinez',
      role: 'fighter',
    },
    unread_count: 1,
  },
  {
    id: '2',
    participant_ids: ['user1', 'user3'],
    last_message: 'Thanks for the great session today!',
    last_message_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    other_participant: {
      id: 'gym1',
      name: 'Elite Boxing Academy',
      role: 'gym',
    },
    unread_count: 0,
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    conversation_id: '1',
    sender_id: 'user2',
    content: 'Hey! How are you?',
    read: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '2',
    conversation_id: '1',
    sender_id: 'user1',
    content: 'Good! Just finished training. You?',
    read: true,
    created_at: new Date(Date.now() - 7000000).toISOString(),
  },
  {
    id: '3',
    conversation_id: '1',
    sender_id: 'user2',
    content: 'Hey, are you available for sparring this weekend?',
    read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];