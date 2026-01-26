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
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export function showNotification(title, options = {}) {
  if (!areNotificationsEnabled()) return;

  const defaultOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    tag: options.tag || 'dogtale-notification',
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);

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
