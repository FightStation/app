import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleNotification, cancelScheduledNotification } from './notifications';

const REMINDER_STORAGE_KEY = '@fight_station_event_reminders';

interface StoredReminder {
  eventId: string;
  type: '24h' | '1h';
  notificationId: string;
}

/**
 * Schedule event reminders (24h and 1h before the event)
 */
export async function scheduleEventReminders(
  eventId: string,
  eventTitle: string,
  eventDate: Date
): Promise<void> {
  const reminders: StoredReminder[] = [];
  const now = new Date();

  // 24 hours before
  const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  if (reminder24h > now) {
    try {
      const notificationId = await scheduleNotification(
        'Event Tomorrow!',
        `${eventTitle} is happening tomorrow. Get ready!`,
        reminder24h,
        { type: 'event_reminder', eventId, reminderType: '24h' }
      );
      reminders.push({ eventId, type: '24h', notificationId });
      console.log('Scheduled 24h reminder for:', eventTitle);
    } catch (error) {
      console.error('Failed to schedule 24h reminder:', error);
    }
  }

  // 1 hour before
  const reminder1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
  if (reminder1h > now) {
    try {
      const notificationId = await scheduleNotification(
        'Starting Soon!',
        `${eventTitle} starts in 1 hour!`,
        reminder1h,
        { type: 'event_reminder', eventId, reminderType: '1h' }
      );
      reminders.push({ eventId, type: '1h', notificationId });
      console.log('Scheduled 1h reminder for:', eventTitle);
    } catch (error) {
      console.error('Failed to schedule 1h reminder:', error);
    }
  }

  // Store notification IDs for later cancellation
  if (reminders.length > 0) {
    await storeReminders(eventId, reminders);
  }
}

/**
 * Cancel all scheduled reminders for an event
 */
export async function cancelEventReminders(eventId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    const allReminders: Record<string, StoredReminder[]> = stored ? JSON.parse(stored) : {};

    if (allReminders[eventId]) {
      for (const reminder of allReminders[eventId]) {
        try {
          await cancelScheduledNotification(reminder.notificationId);
          console.log(`Cancelled ${reminder.type} reminder for event:`, eventId);
        } catch (error) {
          console.error(`Failed to cancel ${reminder.type} reminder:`, error);
        }
      }
      delete allReminders[eventId];
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(allReminders));
    }
  } catch (error) {
    console.error('Error cancelling event reminders:', error);
  }
}

/**
 * Check if reminders are scheduled for an event
 */
export async function hasScheduledReminders(eventId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    const allReminders: Record<string, StoredReminder[]> = stored ? JSON.parse(stored) : {};
    return !!allReminders[eventId] && allReminders[eventId].length > 0;
  } catch (error) {
    console.error('Error checking reminders:', error);
    return false;
  }
}

/**
 * Store reminders for an event
 */
async function storeReminders(eventId: string, reminders: StoredReminder[]): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    const allReminders: Record<string, StoredReminder[]> = stored ? JSON.parse(stored) : {};
    allReminders[eventId] = reminders;
    await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(allReminders));
  } catch (error) {
    console.error('Error storing reminders:', error);
  }
}

/**
 * Clean up expired reminders from storage
 */
export async function cleanupExpiredReminders(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    if (!stored) return;

    const allReminders: Record<string, StoredReminder[]> = JSON.parse(stored);
    // Note: We can't easily check if notifications are still valid,
    // so this is a placeholder for future cleanup logic
    // For now, reminders are cleaned up when events are cancelled
  } catch (error) {
    console.error('Error cleaning up reminders:', error);
  }
}
