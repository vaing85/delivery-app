import React from 'react';

// Push Notification Service for Web and Mobile
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationPermission {
  permission: NotificationPermissionState;
  granted: boolean;
}

class PushNotificationService {
  private isSupported: boolean;
  private permission: NotificationPermissionState = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  // Check if push notifications are supported
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return {
      permission: this.permission,
      granted: this.permission === 'granted'
    };
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      return {
        permission,
        granted: permission === 'granted'
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  // Register service worker for push notifications
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported) {
      throw new Error('Service workers are not supported in this browser');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorkerRegistration = registration;
      
      console.log('Service worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker registration failed');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI0YyQfN2kA5LtV1QUBR8uTt1BUYwo6LNJNWQd0T2Q1yTpgVY78eaYpFYfo'
        )
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push unsubscription successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  // Send local notification
  showNotification(data: PushNotificationData): void {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/badge-72x72.png',
        image: data.image,
        tag: data.tag,
        data: data.data,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        timestamp: data.timestamp || Date.now()
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Handle notification click action
        if (data.data?.url) {
          window.open(data.data.url, '_blank');
        }
        
        notification.close();
      };

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Send notification via service worker
  async sendNotificationViaServiceWorker(data: PushNotificationData): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      await this.registerServiceWorker();
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not available');
    }

    try {
      await this.serviceWorkerRegistration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/badge-72x72.png',
        image: data.image,
        tag: data.tag,
        data: data.data,
        actions: data.actions,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        timestamp: data.timestamp || Date.now()
      });
    } catch (error) {
      console.error('Error sending notification via service worker:', error);
      throw error;
    }
  }

  // Handle incoming push messages
  handlePushMessage(event: PushEvent): void {
    try {
      const data = event.data?.json();
      
      if (data) {
        this.showNotification({
          title: data.title || 'New Notification',
          body: data.body || 'You have a new notification',
          icon: data.icon,
          badge: data.badge,
          image: data.image,
          tag: data.tag,
          data: data.data,
          requireInteraction: data.requireInteraction,
          silent: data.silent
        });
      }
    } catch (error) {
      console.error('Error handling push message:', error);
    }
  }

  // Initialize push notification service
  async initialize(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscription?: PushSubscription;
  }> {
    const result = {
      supported: this.isSupported,
      permission: this.getPermissionStatus(),
      subscription: undefined as PushSubscription | undefined
    };

    if (!this.isSupported) {
      return result;
    }

    try {
      // Register service worker
      await this.registerServiceWorker();

      // Get existing subscription
      if (this.serviceWorkerRegistration) {
        const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
        result.subscription = subscription || undefined;
      }

      return result;
    } catch (error) {
      console.error('Error initializing push notification service:', error);
      return result;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Test notification
  async testNotification(): Promise<void> {
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (!permission.granted) {
        throw new Error('Notification permission denied');
      }
    }

    this.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the delivery app',
      icon: '/icon-192x192.png',
      tag: 'test-notification',
      data: { url: window.location.origin }
    });
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// React hook for push notifications
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>({
    permission: 'default',
    granted: false
  });
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const result = await pushNotificationService.initialize();
        setIsSupported(result.supported);
        setPermission(result.permission);
        setSubscription(result.subscription || null);
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await pushNotificationService.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const newSubscription = await pushNotificationService.subscribeToPush();
      setSubscription(newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribeFromPush();
      if (success) {
        setSubscription(null);
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (data: PushNotificationData) => {
    pushNotificationService.showNotification(data);
  };

  const testNotification = async () => {
    await pushNotificationService.testNotification();
  };

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    testNotification
  };
};
