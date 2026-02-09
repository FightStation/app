import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { useAuth } from '../../context/AuthContext';
import {
  sendMessage,
  getConversationMessages,
  markConversationAsRead,
  subscribeToConversation,
  unsubscribeFromChannel,
  Message as MessageType,
} from '../../services/messaging';
import {
  translateText,
  detectLanguage,
  getLanguageName,
  LANGUAGES,
  SupportedLanguage,
} from '../../services/translation';
import { RealtimeChannel } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const containerMaxWidth = isWeb ? 480 : width;

type TranslationState = {
  translatedText: string;
  targetLanguage: SupportedLanguage;
  detectedLanguage: SupportedLanguage;
};

export function ChatScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { conversationId, name } = route.params;
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Translation state
  const [translations, setTranslations] = useState<Record<string, TranslationState>>({});
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [userPreferredLanguage, setUserPreferredLanguage] = useState<SupportedLanguage>('en');

  useEffect(() => {
    loadMessages();
    markAsRead();

    // Subscribe to new messages
    const messageChannel = subscribeToConversation(conversationId, handleNewMessage);
    setChannel(messageChannel);

    return () => {
      if (channel) {
        unsubscribeFromChannel(channel);
      }
    };
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (user?.id) {
      try {
        await markConversationAsRead(conversationId, user.id);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  const handleNewMessage = (message: MessageType) => {
    setMessages((prev) => [...prev, message]);
    markAsRead();

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!messageText.trim() || !user?.id) return;

    try {
      setSending(true);
      const message = await sendMessage(conversationId, user.id, messageText.trim());

      // Add message to local state immediately (optimistic update)
      setMessages((prev) => [...prev, message]);
      setMessageText('');

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Translation handlers
  const handleTranslatePress = (messageId: string) => {
    // If already translated, show/hide translation
    if (translations[messageId]) {
      // Remove translation to hide it
      setTranslations((prev) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
      return;
    }

    // Show language picker
    setSelectedMessageId(messageId);
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = async (language: SupportedLanguage) => {
    setShowLanguageModal(false);
    setUserPreferredLanguage(language);

    if (!selectedMessageId) return;

    const message = messages.find((m) => m.id === selectedMessageId);
    if (!message) return;

    setTranslatingMessageId(selectedMessageId);

    try {
      const result = await translateText(message.message_text, language);
      setTranslations((prev) => ({
        ...prev,
        [selectedMessageId]: {
          translatedText: result.translatedText,
          targetLanguage: language,
          detectedLanguage: result.detectedLanguage,
        },
      }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslatingMessageId(null);
      setSelectedMessageId(null);
    }
  };

  const handleQuickTranslate = async (messageId: string) => {
    // Quick translate using preferred language
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    // If already translated, toggle off
    if (translations[messageId]) {
      setTranslations((prev) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
      return;
    }

    setTranslatingMessageId(messageId);

    try {
      const detectedLang = detectLanguage(message.message_text);
      // If message is in user's preferred language, translate to English instead
      const targetLang = detectedLang === userPreferredLanguage ? 'en' : userPreferredLanguage;

      const result = await translateText(message.message_text, targetLang);
      setTranslations((prev) => ({
        ...prev,
        [messageId]: {
          translatedText: result.translatedText,
          targetLanguage: targetLang,
          detectedLanguage: result.detectedLanguage,
        },
      }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslatingMessageId(null);
    }
  };

  const renderMessage = (message: MessageType) => {
    const isOwn = message.sender_id === user?.id;
    const translation = translations[message.id];
    const isTranslating = translatingMessageId === message.id;

    return (
      <View key={message.id} style={styles.messageWrapper}>
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwn ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.message_text}
          </Text>

          {/* Translation */}
          {translation && (
            <View style={styles.translationContainer}>
              <View style={styles.translationDivider} />
              <View style={styles.translationHeader}>
                <Ionicons name="language" size={12} color={isOwn ? 'rgba(255,255,255,0.6)' : colors.textMuted} />
                <Text style={[styles.translationLabel, isOwn && styles.ownTranslationLabel]}>
                  {getLanguageName(translation.targetLanguage)}
                </Text>
              </View>
              <Text
                style={[
                  styles.translatedText,
                  isOwn ? styles.ownTranslatedText : styles.otherTranslatedText,
                ]}
              >
                {translation.translatedText}
              </Text>
            </View>
          )}

          {/* Loading indicator for translation */}
          {isTranslating && (
            <View style={styles.translatingIndicator}>
              <ActivityIndicator size="small" color={isOwn ? colors.textPrimary : colors.primary[500]} />
              <Text style={[styles.translatingText, isOwn && styles.ownTranslatingText]}>
                Translating...
              </Text>
            </View>
          )}

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timestamp,
                isOwn ? styles.ownTimestamp : styles.otherTimestamp,
              ]}
            >
              {formatTimestamp(message.created_at)}
            </Text>
            {isOwn && (
              <Ionicons
                name={message.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={
                  message.is_read ? colors.primary[400] : 'rgba(255,255,255,0.5)'
                }
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>

        {/* Translate button - only for other's messages */}
        {!isOwn && (
          <View style={styles.messageActions}>
            <TouchableOpacity
              style={[styles.translateButton, translation && styles.translateButtonActive]}
              onPress={() => handleQuickTranslate(message.id)}
              onLongPress={() => handleTranslatePress(message.id)}
            >
              <Ionicons
                name="language"
                size={16}
                color={translation ? colors.primary[500] : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={colors.textPrimary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{name}</Text>
              <Text style={styles.headerStatus}>Active now</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setShowLanguageModal(true)}
          >
            <Ionicons name="language-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Language preference indicator */}
        <TouchableOpacity
          style={styles.languageBanner}
          onPress={() => setShowLanguageModal(true)}
        >
          <Ionicons name="language" size={14} color={colors.primary[500]} />
          <Text style={styles.languageBannerText}>
            Translating to {getLanguageName(userPreferredLanguage)}
          </Text>
          <Text style={styles.languageBannerHint}>Tap to change</Text>
        </TouchableOpacity>

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            ) : (
              messages.map(renderMessage)
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={24} color={colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                messageText.trim() && !sending && styles.sendButtonActive,
              ]}
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={messageText.trim() ? colors.textPrimary : colors.textMuted}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Language Selection Modal */}
        <Modal
          visible={showLanguageModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Translate to</Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Select your preferred language for translations
              </Text>
              <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      userPreferredLanguage === lang.code && styles.languageOptionActive,
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={[
                        styles.languageName,
                        userPreferredLanguage === lang.code && styles.languageNameActive,
                      ]}>
                        {lang.name}
                      </Text>
                      <Text style={styles.languageNative}>{lang.nativeName}</Text>
                    </View>
                    {userPreferredLanguage === lang.code && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
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
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[0.5],
  },
  headerStatus: {
    color: colors.primary[500],
    fontSize: typography.fontSize.xs,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: `${colors.primary[500]}15`,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageBannerText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  languageBannerHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  messageWrapper: {
    marginBottom: spacing[2],
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: borderRadius.xl,
    padding: spacing[3],
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: spacing[1],
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderBottomLeftRadius: spacing[1],
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing[1],
  },
  ownMessageText: {
    color: colors.textPrimary,
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  // Translation styles
  translationContainer: {
    marginTop: spacing[2],
  },
  translationDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing[2],
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  translationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  ownTranslationLabel: {
    color: 'rgba(255,255,255,0.6)',
  },
  translatedText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.5,
    fontStyle: 'italic',
  },
  ownTranslatedText: {
    color: 'rgba(255,255,255,0.9)',
  },
  otherTranslatedText: {
    color: colors.textSecondary,
  },
  translatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  translatingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  ownTranslatingText: {
    color: 'rgba(255,255,255,0.6)',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    paddingLeft: spacing[2],
  },
  translateButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translateButtonActive: {
    backgroundColor: `${colors.primary[500]}20`,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
  },
  ownTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTimestamp: {
    color: colors.textMuted,
  },
  statusIcon: {
    marginLeft: spacing[0.5],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    paddingTop: Platform.OS === 'ios' ? spacing[2] : spacing[2],
    maxHeight: 100,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  sendButtonActive: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '70%',
    paddingBottom: spacing[8],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  languageList: {
    paddingHorizontal: spacing[4],
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
    backgroundColor: colors.surfaceLight,
  },
  languageOptionActive: {
    backgroundColor: `${colors.primary[500]}20`,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing[0.5],
  },
  languageNameActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
  languageNative: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
});
