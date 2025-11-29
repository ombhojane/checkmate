import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import ttsService from './tts.service';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface NotificationPayload {
  title?: string;
  body?: string;
  data?: { [key: string]: string };
  priority?: 'high' | 'normal';
  sound?: boolean;
}

// Set up notification handler - only if not in Expo Go SDK 53+
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
  // Silent fail - notifications not fully available in Expo Go
}

class NotificationService {
  private initialized: boolean = false;
  private expoPushToken: string | null = null;
  private readNotificationsAloud: boolean = false;
  private foregroundSubscription: any;
  private backgroundSubscription: any;
  private isAvailable: boolean = true;

  async init() {
    if (this.initialized) return;

    try {
      // Request notification permissions
      await this.requestPermission();

      // Create notification channels (Android only)
      if (Platform.OS === 'android') {
        await this.createChannels();
      }

      // Get Expo Push Token - skip in Expo Go (not supported in SDK 53+)
      if (!isExpoGo) {
        await this.getExpoPushToken();
      } else {
        console.log('[Notification] Push tokens not available in Expo Go (SDK 53+)');
      }

      // Setup notification listeners
      this.setupNotificationListeners();

      this.initialized = true;
      console.log('[Notification] Service initialized');
    } catch (error) {
      // Silent fail - don't spam errors in Expo Go
      this.initialized = true;
      this.isAvailable = false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';

      if (granted) {
        console.log('[Notification] Permission granted');
      }

      return granted;
    } catch (error) {
      // Silent fail
      return false;
    }
  }

  async createChannels() {
    try {
      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Security Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('threats', {
          name: 'Threat Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#FF0000',
          sound: 'default',
        });

        console.log('[Notification] Channels created');
      }
    } catch (error) {
      // Silent fail
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    // Skip in Expo Go - not supported in SDK 53+
    if (isExpoGo) {
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      console.log('[Notification] Expo Push Token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      // Silent fail
      return null;
    }
  }

  setupNotificationListeners() {
    try {
      // Listen for notification responses when user taps notification
      this.foregroundSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Notification] Notification tapped:', response.notification);
        const data = response.notification.request.content.data;
        this.handleNotificationResponse(data);
      });

      // Listen for notifications received while app is in foreground
      this.backgroundSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
        console.log('[Notification] Received in foreground:', notification);

        // Read notification aloud if enabled
        if (this.readNotificationsAloud) {
          const title = notification.request.content.title || '';
          const body = notification.request.content.body || '';
          if (title && body) {
            await ttsService.readNotification(title, body);
          }
        }
      });
    } catch (error) {
      // Silent fail
    }
  }

  async displayLocalNotification(payload: NotificationPayload) {
    try {
      const { title = 'CheckMate', body = '', data = {}, priority = 'high' } = payload;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
          priority: priority === 'high' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          seconds: 1, // Show immediately
        } as any,
      });

      console.log('[Notification] Local notification displayed:', title);
    } catch (error) {
      console.error('[Notification] Display notification error:', error);
    }
  }

  async scheduleNotification(payload: NotificationPayload, delaySeconds: number) {
    try {
      const { title = 'CheckMate', body = '', data = {}, priority = 'high' } = payload;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
          priority: priority === 'high' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          seconds: delaySeconds,
        } as any,
      });

      console.log('[Notification] Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[Notification] Schedule notification error:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('[Notification] Cancelled notification:', notificationId);
    } catch (error) {
      console.error('[Notification] Cancel notification error:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[Notification] Cancelled all notifications');
    } catch (error) {
      console.error('[Notification] Cancel all notifications error:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      console.error('[Notification] Get badge count error:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('[Notification] Badge count set to:', count);
    } catch (error) {
      console.error('[Notification] Set badge count error:', error);
    }
  }

  setReadNotificationsAloud(enabled: boolean) {
    this.readNotificationsAloud = enabled;
  }

  isReadNotificationsAloudEnabled(): boolean {
    return this.readNotificationsAloud;
  }

  getExpoPushTokenValue(): string | null {
    return this.expoPushToken;
  }

  subscribeToTopic(topic: string) {
    // For local app, we don't subscribe to topics
    // This is used for Firebase Cloud Messaging in production
    console.log('[Notification] Topic subscription (local app):', topic);
  }

  private handleNotificationResponse(data: any) {
    // Handle different notification types based on data
    if (data.type === 'threat') {
      console.log('[Notification] Threat notification tapped');
      // Navigate to alerts screen
    } else if (data.type === 'alert') {
      console.log('[Notification] Alert notification tapped');
      // Navigate to alerts screen
    }
  }

  destroy() {
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
    }
    if (this.backgroundSubscription) {
      this.backgroundSubscription.remove();
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
