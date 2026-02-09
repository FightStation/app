import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  removeNotificationSubscription,
} from '../services/notifications';

/**
 * Hook to handle push notification events
 * Automatically navigates to relevant screens when notifications are tapped
 */
export function useNotifications() {
  const navigation = useNavigation<any>();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Listen for notifications received while app is open
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);

      // You can show in-app notification UI here if desired
      // For now, the default notification handler will show it
    });

    // Listen for user tapping on notifications
    responseListener.current = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);

      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data?.type === 'message') {
        // Navigate to chat screen
        navigation.navigate('Chat', {
          conversationId: data.conversationId,
          otherUserId: data.otherUserId,
          name: data.senderName,
        });
      } else if (data?.type === 'event') {
        // Navigate to event detail screen
        navigation.navigate('EventDetail', {
          eventId: data.eventId,
        });
      } else if (data?.type === 'sparring_request') {
        // Navigate to event requests screen
        navigation.navigate('MyEvents');
      } else if (data?.type === 'referral') {
        // Navigate to referral dashboard
        navigation.navigate('ReferralDashboard');
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);
}
