/**
 * Notification service for push notifications and in-app alerts
 */

import { supabase, isOnlineMode } from '../config/supabase';

// Notification types
export const NOTIFICATION_TYPES = {
  VACCINATION_DUE: 'vaccination_due',
  MEDICATION_REMINDER: 'medication_reminder',
  VET_APPOINTMENT: 'vet_appointment',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  ACTIVITY_REACTION: 'activity_reaction',
  ACTIVITY_COMMENT: 'activity_comment',
  QUEST_COMPLETE: 'quest_complete',
  LEVEL_UP: 'level_up',
  STREAK_MILESTONE: 'streak_milestone',
  VIRTUAL_PET_NEEDS: 'virtual_pet_needs',
};

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: false,
  pushEnabled: false,
  [NOTIFICATION_TYPES.VACCINATION_DUE]: true,
  [NOTIFICATION_TYPES.MEDICATION_REMINDER]: true,
  [NOTIFICATION_TYPES.VET_APPOINTMENT]: true,
  [NOTIFICATION_TYPES.FRIEND_REQUEST]: true,
  [NOTIFICATION_TYPES.FRIEND_ACCEPTED]: true,
  [NOTIFICATION_TYPES.ACTIVITY_REACTION]: true,
  [NOTIFICATION_TYPES.ACTIVITY_COMMENT]: true,
  [NOTIFICATION_TYPES.QUEST_COMPLETE]: true,
  [NOTIFICATION_TYPES.LEVEL_UP]: true,
  [NOTIFICATION_TYPES.STREAK_MILESTONE]: true,
  [NOTIFICATION_TYPES.VIRTUAL_PET_NEEDS]: true,
};

// VAPID public key placeholder - replace with your actual key from your push service
// Generate VAPID keys: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Service Worker registration
let swRegistration = null;

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration.scope);

    // Store registration for later use
    swRegistration = registration;

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('Service Worker update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('New Service Worker version available');
          // Could show update prompt to user here
          showToast('App update available. Refresh to update.', {
            type: 'info',
            duration: 0,
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload(),
            },
          });
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        handleNotificationClick(event.data);
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Get the current service worker registration
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function getServiceWorkerRegistration() {
  if (swRegistration) return swRegistration;

  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    swRegistration = registration;
    return registration;
  } catch (error) {
    console.error('Error getting SW registration:', error);
    return null;
  }
}

/**
 * Request permission for push notifications
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
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

/**
 * Check if notifications are enabled
 * @returns {boolean}
 */
export function areNotificationsEnabled() {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Check if push notifications are supported
 * @returns {boolean}
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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
 * Subscribe to push notifications
 * @param {string} userId - User ID for storing subscription
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    console.log('Push notifications not supported');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key not configured. Set VITE_VAPID_PUBLIC_KEY environment variable.');
    return null;
  }

  try {
    // Request permission first
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.log('Notification permission denied');
      return null;
    }

    // Get service worker registration
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      console.error('No service worker registration');
      return null;
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('Push subscription created');
    }

    // Save subscription to backend
    if (isOnlineMode && userId) {
      await savePushSubscription(userId, subscription);
    }

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * @param {string} userId - User ID for removing subscription
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) return true;

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return true;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Push subscription removed');

      // Remove from backend
      if (isOnlineMode && userId) {
        await removePushSubscription(userId);
      }
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

/**
 * Get current push subscription
 * @returns {Promise<PushSubscription|null>}
 */
export async function getPushSubscription() {
  if (!isPushSupported()) return null;

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return null;

    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * Check if user is subscribed to push
 * @returns {Promise<boolean>}
 */
export async function isSubscribedToPush() {
  const subscription = await getPushSubscription();
  return !!subscription;
}

/**
 * Save push subscription to Supabase
 * @param {string} userId
 * @param {PushSubscription} subscription
 */
async function savePushSubscription(userId, subscription) {
  if (!isOnlineMode) return;

  const subscriptionData = subscription.toJSON();

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.keys?.p256dh,
        auth: subscriptionData.keys?.auth,
        expiration_time: subscriptionData.expirationTime,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving push subscription:', error);
    } else {
      console.log('Push subscription saved to database');
    }
  } catch (error) {
    console.error('Error saving push subscription:', error);
  }
}

/**
 * Remove push subscription from Supabase
 * @param {string} userId
 */
async function removePushSubscription(userId) {
  if (!isOnlineMode) return;

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing push subscription:', error);
    } else {
      console.log('Push subscription removed from database');
    }
  } catch (error) {
    console.error('Error removing push subscription:', error);
  }
}

/**
 * Save notification preferences to Supabase
 * @param {string} userId
 * @param {Object} preferences
 */
export async function saveNotificationPreferences(userId, preferences) {
  if (!isOnlineMode) {
    // Save to localStorage in offline mode
    localStorage.setItem('dogtale-notification-preferences', JSON.stringify(preferences));
    return true;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error saving notification preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return false;
  }
}

/**
 * Load notification preferences from Supabase
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function loadNotificationPreferences(userId) {
  if (!isOnlineMode) {
    // Load from localStorage in offline mode
    const stored = localStorage.getItem('dogtale-notification-preferences');
    return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_PREFERENCES;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (error || !data?.notification_preferences) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...data.notification_preferences };
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Handle notification click from service worker
 * @param {Object} data
 */
function handleNotificationClick(data) {
  const { targetUrl } = data;

  if (targetUrl) {
    // Parse URL params to determine action
    const url = new URL(targetUrl, window.location.origin);
    const modal = url.searchParams.get('modal');
    const tab = url.searchParams.get('tab');

    // Dispatch custom event for the app to handle
    window.dispatchEvent(new CustomEvent('notificationClick', {
      detail: { modal, tab, data: data.data },
    }));
  }
}

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export function showNotification(title, options = {}) {
  if (!areNotificationsEnabled()) return;

  const defaultOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    tag: options.tag || 'dogtale-notification',
    requireInteraction: false,
    ...options,
  };

  // Try to use service worker for notification (works in background)
  if (swRegistration) {
    swRegistration.showNotification(title, defaultOptions).catch((err) => {
      console.error('SW notification failed, falling back to Notification API:', err);
      showBrowserNotification(title, defaultOptions);
    });
  } else {
    showBrowserNotification(title, defaultOptions);
  }
}

/**
 * Show notification using browser Notification API (foreground only)
 */
function showBrowserNotification(title, options) {
  try {
    const notification = new Notification(title, options);

    // Handle click
    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick();
        notification.close();
      };
    }

    // Auto-close after timeout
    if (options.autoClose !== false) {
      setTimeout(() => notification.close(), options.timeout || 5000);
    }

    return notification;
  } catch (err) {
    console.error('Error showing notification:', err);
  }
}

/**
 * Show an in-app toast notification
 * @param {string} message - Toast message
 * @param {Object} options - Toast options
 */
let toastContainer = null;

export function showToast(message, options = {}) {
  const {
    type = 'info', // 'success', 'error', 'warning', 'info'
    duration = 3000,
    position = 'bottom-right',
    icon = null,
    action = null,
  } = options;

  // Create container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = `fixed ${getPositionClasses(position)} z-50 flex flex-col gap-2`;
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `
    flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
    transform transition-all duration-300 ease-out
    ${getTypeClasses(type)}
    translate-x-full opacity-0
  `;

  // Icon
  const iconElement = document.createElement('span');
  iconElement.textContent = icon || getDefaultIcon(type);
  iconElement.className = 'text-xl';
  toast.appendChild(iconElement);

  // Message
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  messageElement.className = 'text-sm font-medium';
  toast.appendChild(messageElement);

  // Action button
  if (action) {
    const actionButton = document.createElement('button');
    actionButton.textContent = action.label;
    actionButton.className = 'ml-auto text-sm font-semibold hover:underline';
    actionButton.onclick = () => {
      action.onClick();
      removeToast(toast);
    };
    toast.appendChild(actionButton);
  }

  // Close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.className = 'ml-2 text-lg hover:opacity-70';
  closeButton.onclick = () => removeToast(toast);
  toast.appendChild(closeButton);

  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  });

  // Auto remove
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

function removeToast(toast) {
  toast.classList.add('translate-x-full', 'opacity-0');
  setTimeout(() => {
    toast.remove();
    if (toastContainer && toastContainer.children.length === 0) {
      toastContainer.remove();
      toastContainer = null;
    }
  }, 300);
}

function getPositionClasses(position) {
  const positions = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };
  return positions[position] || positions['bottom-right'];
}

function getTypeClasses(type) {
  const types = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-600 text-white',
  };
  return types[type] || types.info;
}

function getDefaultIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  return icons[type] || icons.info;
}

/**
 * Subscribe to real-time notifications
 * @param {string} userId - User ID to subscribe for
 * @param {Function} onNotification - Callback for new notifications
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNotifications(userId, onNotification) {
  if (!isOnlineMode || !userId) return () => {};

  const subscription = supabase
    .channel(`notifications-${userId}`)
    // Listen for friend requests
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friendships',
        filter: `addressee_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new.status === 'pending') {
          onNotification({
            type: NOTIFICATION_TYPES.FRIEND_REQUEST,
            data: payload.new,
          });
        }
      }
    )
    // Listen for activity reactions
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_reactions',
      },
      async (payload) => {
        // Check if the activity belongs to the user
        const { data: activity } = await supabase
          .from('activities')
          .select('user_id')
          .eq('id', payload.new.activity_id)
          .single();

        if (activity?.user_id === userId && payload.new.user_id !== userId) {
          onNotification({
            type: NOTIFICATION_TYPES.ACTIVITY_REACTION,
            data: payload.new,
          });
        }
      }
    )
    // Listen for comments
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
      },
      async (payload) => {
        // Check if the activity belongs to the user
        const { data: activity } = await supabase
          .from('activities')
          .select('user_id')
          .eq('id', payload.new.activity_id)
          .single();

        if (activity?.user_id === userId && payload.new.user_id !== userId) {
          onNotification({
            type: NOTIFICATION_TYPES.ACTIVITY_COMMENT,
            data: payload.new,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Get notification message for a notification type
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} { title, body }
 */
export function getNotificationMessage(type, data) {
  const messages = {
    [NOTIFICATION_TYPES.VACCINATION_DUE]: {
      title: 'Vaccination Reminder',
      body: `${data.petName}'s ${data.vaccineName} is due!`,
      icon: '💉',
    },
    [NOTIFICATION_TYPES.FRIEND_REQUEST]: {
      title: 'New Friend Request',
      body: `${data.username || 'Someone'} wants to be your friend!`,
      icon: '👋',
    },
    [NOTIFICATION_TYPES.FRIEND_ACCEPTED]: {
      title: 'Friend Request Accepted',
      body: `${data.username || 'Someone'} is now your friend!`,
      icon: '🎉',
    },
    [NOTIFICATION_TYPES.ACTIVITY_REACTION]: {
      title: 'New Reaction',
      body: 'Someone liked your post!',
      icon: '❤️',
    },
    [NOTIFICATION_TYPES.ACTIVITY_COMMENT]: {
      title: 'New Comment',
      body: 'Someone commented on your post!',
      icon: '💬',
    },
    [NOTIFICATION_TYPES.QUEST_COMPLETE]: {
      title: 'Quest Complete!',
      body: `You completed "${data.questName}" and earned ${data.xp} XP!`,
      icon: '🏆',
    },
    [NOTIFICATION_TYPES.LEVEL_UP]: {
      title: 'Level Up!',
      body: `Congratulations! You reached level ${data.level}!`,
      icon: '⭐',
    },
    [NOTIFICATION_TYPES.VIRTUAL_PET_NEEDS]: {
      title: 'Your Pet Needs You!',
      body: `${data.petName} is feeling ${data.need}. Take care of them!`,
      icon: '🐕',
    },
  };

  return messages[type] || { title: 'Notification', body: '', icon: '🔔' };
}

/**
 * Send message to service worker
 * @param {Object} message
 * @returns {Promise<any>}
 */
export function sendMessageToSW(message) {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No service worker controller'));
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);

    // Timeout after 5 seconds
    setTimeout(() => reject(new Error('Message timeout')), 5000);
  });
}

/**
 * Clear service worker cache
 * @returns {Promise<boolean>}
 */
export async function clearSWCache() {
  try {
    const result = await sendMessageToSW({ type: 'CLEAR_CACHE' });
    return result.success;
  } catch (error) {
    console.error('Error clearing SW cache:', error);
    return false;
  }
}

/**
 * Get service worker cache status
 * @returns {Promise<Object>}
 */
export async function getSWCacheStatus() {
  try {
    return await sendMessageToSW({ type: 'GET_CACHE_STATUS' });
  } catch (error) {
    console.error('Error getting SW cache status:', error);
    return { cacheSize: 0, cacheName: 'unknown' };
  }
}
