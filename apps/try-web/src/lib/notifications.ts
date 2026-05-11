// Push notification utilities

declare global {
  interface Window {
    Notification?: Notification;
    firebase?: any;
    PushSubscription?: any;
  }
}

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function getNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log('Notification permission denied');
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      ...options,
    });
  }
}

// Notification service worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Push notification subscription (for Firebase Cloud Messaging)
export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    // Check if push is supported
    if (!('PushManager' in window)) {
      console.log('Push not supported');
      return null;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_KEY || 'YOUR_VAPID_KEY'
      ),
    });

    console.log('Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

// Helper function for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
