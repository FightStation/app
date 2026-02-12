import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Configure notification behavior (native only - not supported on web)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('[Fight Station] Notification handler setup failed:', e);
  }
}

export type NotificationType =
  | 'event_request_approved'
  | 'event_request_rejected'
  | 'new_event_request'
  | 'event_reminder'
  | 'new_message'
  | 'referral_completed';

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask for permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification');
      return null;
    }

    // Get the push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'fight-station',
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Create channels for different notification types
      Notifications.setNotificationChannelAsync('events', {
        name: 'Events',
        description: 'Sparring event notifications',
        importance: Notifications.AndroidImportance.HIGH,
      });

      Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        description: 'Chat message notifications',
        importance: Notifications.AndroidImportance.HIGH,
      });

      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        description: 'Event reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to database using push_tokens table
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would save push token:', token);
    return;
  }

  try {
    const platform = Platform.OS as 'ios' | 'android' | 'web';

    // Upsert the token (insert or update if exists)
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token: token,
          platform: platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
        }
      );

    if (error) throw error;
    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
}

/**
 * Remove push token from database (on logout)
 */
export async function removePushToken(userId: string, token: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log('Demo mode: Would remove push token');
    return;
  }

  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;
    console.log('Push token removed successfully');
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

/**
 * Get all push tokens for a user (they might have multiple devices)
 */
export async function getUserPushTokens(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((row) => row.token);
  } catch (error) {
    console.error('Error getting push tokens:', error);
    return [];
  }
}

/**
 * Send a local notification (for testing or immediate feedback)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Schedule a notification for later (e.g., event reminders)
 */
export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return identifier;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Send push notification to a user via Expo Push API
 * In production, this should be done from a backend server for security
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId?: string
): Promise<boolean> {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    channelId: channelId || 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === 'error') {
      console.error('Push notification error:', result.data.message);
      return false;
    }

    console.log('Push notification sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send push notification to a user by their user ID
 * Sends to all their registered devices
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId?: string
): Promise<void> {
  const tokens = await getUserPushTokens(userId);

  const sendPromises = tokens.map((token) =>
    sendPushNotification(token, title, body, data, channelId)
  );

  await Promise.all(sendPromises);
}

/**
 * Schedule an event reminder notification
 */
export async function scheduleEventReminder(
  eventId: string,
  eventTitle: string,
  eventDate: Date,
  reminderMinutesBefore: number = 60
): Promise<string | null> {
  const reminderTime = new Date(eventDate.getTime() - reminderMinutesBefore * 60 * 1000);

  // Don't schedule if reminder time is in the past
  if (reminderTime <= new Date()) {
    return null;
  }

  const identifier = await scheduleNotification(
    'Event Reminder',
    `${eventTitle} starts in ${reminderMinutesBefore} minutes`,
    reminderTime,
    {
      type: 'event_reminder',
      eventId,
    }
  );

  return identifier;
}

/**
 * Get notification listener for received notifications
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Get notification listener for user taps on notifications
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Remove notification listener
 */
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
): void {
  subscription.remove();
}

/**
 * Clear all notifications
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get all pending notification requests
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
