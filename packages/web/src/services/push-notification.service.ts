/**
 * Push notification service for Web Push API
 */

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  
  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return { granted: false, denied: true, default: false };
    }

    return {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      default: Notification.permission === 'default'
    };
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied by user');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log(`Notification permission: ${permission}`);
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(vapidPublicKey?: string): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Already subscribed to push notifications');
        return subscription;
      }

      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      // Subscribe to push manager
      const options: PushSubscriptionOptionsInit = {
        userVisibleOnly: true
      };

      // Add VAPID key if provided
      if (vapidPublicKey) {
        options.applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
      }

      subscription = await this.registration.pushManager.subscribe(options);
      
      console.log('Subscribed to push notifications:', subscription.endpoint);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.ready;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('No active push subscription');
        return true;
      }

      const success = await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications:', success);
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.ready;
      }

      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Show local notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return;
    }

    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.ready;
      }

      await this.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        ...options
      });

      console.log(`Notification shown: ${title}`);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
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

  /**
   * Extract subscription keys for server
   */
  extractSubscriptionKeys(subscription: PushSubscription): any {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : ''
      }
    };
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const pushNotificationService = new PushNotificationService();
