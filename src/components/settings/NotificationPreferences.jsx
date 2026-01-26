import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  requestNotificationPermission,
  areNotificationsEnabled,
  isPushSupported,
  isSubscribedToPush,
  subscribeToPush,
  unsubscribeFromPush,
  saveNotificationPreferences,
  loadNotificationPreferences,
  showToast,
} from '../../services/notificationService';

// Human-readable labels for notification types
const NOTIFICATION_LABELS = {
  [NOTIFICATION_TYPES.VACCINATION_DUE]: {
    label: 'Vaccination Reminders',
    description: 'Get notified when vaccinations are due',
    category: 'health',
  },
  [NOTIFICATION_TYPES.MEDICATION_REMINDER]: {
    label: 'Medication Reminders',
    description: 'Reminders to give medications on schedule',
    category: 'health',
  },
  [NOTIFICATION_TYPES.VET_APPOINTMENT]: {
    label: 'Vet Appointments',
    description: 'Upcoming vet appointment notifications',
    category: 'health',
  },
  [NOTIFICATION_TYPES.FRIEND_REQUEST]: {
    label: 'Friend Requests',
    description: 'When someone sends you a friend request',
    category: 'social',
  },
  [NOTIFICATION_TYPES.FRIEND_ACCEPTED]: {
    label: 'Friend Accepted',
    description: 'When someone accepts your friend request',
    category: 'social',
  },
  [NOTIFICATION_TYPES.ACTIVITY_REACTION]: {
    label: 'Reactions',
    description: 'When someone reacts to your posts',
    category: 'social',
  },
  [NOTIFICATION_TYPES.ACTIVITY_COMMENT]: {
    label: 'Comments',
    description: 'When someone comments on your posts',
    category: 'social',
  },
  [NOTIFICATION_TYPES.QUEST_COMPLETE]: {
    label: 'Quest Complete',
    description: 'When you complete a quest',
    category: 'gamification',
  },
  [NOTIFICATION_TYPES.LEVEL_UP]: {
    label: 'Level Up',
    description: 'When you reach a new level',
    category: 'gamification',
  },
  [NOTIFICATION_TYPES.STREAK_MILESTONE]: {
    label: 'Streak Milestones',
    description: 'Celebrate your journaling streaks',
    category: 'gamification',
  },
  [NOTIFICATION_TYPES.VIRTUAL_PET_NEEDS]: {
    label: 'Pet Needs Attention',
    description: 'When your virtual pet needs care',
    category: 'gamification',
  },
};

const CATEGORIES = {
  health: { label: 'Health & Reminders', icon: '💊' },
  social: { label: 'Social', icon: '👥' },
  gamification: { label: 'Gameplay', icon: '🎮' },
};

const NotificationPreferences = ({ userId, onPreferencesChange }) => {
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Check browser support and permission
      setPushSupported(isPushSupported());
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }

      // Check push subscription status
      const subscribed = await isSubscribedToPush();
      setPushSubscribed(subscribed);

      // Load saved preferences
      const savedPrefs = await loadNotificationPreferences(userId);
      setPreferences(savedPrefs);

      setLoading(false);
    }

    load();
  }, [userId]);

  // Save preferences
  const handleSave = useCallback(async (newPrefs) => {
    setSaving(true);
    const success = await saveNotificationPreferences(userId, newPrefs);
    setSaving(false);

    if (success) {
      showToast('Notification preferences saved', { type: 'success' });
      if (onPreferencesChange) {
        onPreferencesChange(newPrefs);
      }
    } else {
      showToast('Failed to save preferences', { type: 'error' });
    }
  }, [userId, onPreferencesChange]);

  // Toggle master switch
  const handleMasterToggle = async () => {
    if (!preferences.enabled) {
      // Enabling - request permission first
      const granted = await requestNotificationPermission();
      if (!granted) {
        showToast('Notification permission denied. Please enable in browser settings.', {
          type: 'warning',
          duration: 5000,
        });
        return;
      }
      setPermissionStatus('granted');
    }

    const newPrefs = { ...preferences, enabled: !preferences.enabled };
    setPreferences(newPrefs);
    await handleSave(newPrefs);
  };

  // Toggle push notifications
  const handlePushToggle = async () => {
    if (!preferences.pushEnabled) {
      // Enabling push - subscribe
      const subscription = await subscribeToPush(userId);
      if (subscription) {
        setPushSubscribed(true);
        const newPrefs = { ...preferences, pushEnabled: true };
        setPreferences(newPrefs);
        await handleSave(newPrefs);
        showToast('Push notifications enabled', { type: 'success' });
      } else {
        showToast('Could not enable push notifications. Check browser settings.', {
          type: 'error',
        });
      }
    } else {
      // Disabling push - unsubscribe
      const success = await unsubscribeFromPush(userId);
      if (success) {
        setPushSubscribed(false);
        const newPrefs = { ...preferences, pushEnabled: false };
        setPreferences(newPrefs);
        await handleSave(newPrefs);
        showToast('Push notifications disabled', { type: 'info' });
      }
    }
  };

  // Toggle individual notification type
  const handleTypeToggle = async (type) => {
    const newPrefs = { ...preferences, [type]: !preferences[type] };
    setPreferences(newPrefs);
    await handleSave(newPrefs);
  };

  // Enable all in category
  const handleEnableCategory = async (category) => {
    const newPrefs = { ...preferences };
    Object.entries(NOTIFICATION_LABELS).forEach(([type, config]) => {
      if (config.category === category) {
        newPrefs[type] = true;
      }
    });
    setPreferences(newPrefs);
    await handleSave(newPrefs);
  };

  // Disable all in category
  const handleDisableCategory = async (category) => {
    const newPrefs = { ...preferences };
    Object.entries(NOTIFICATION_LABELS).forEach(([type, config]) => {
      if (config.category === category) {
        newPrefs[type] = false;
      }
    });
    setPreferences(newPrefs);
    await handleSave(newPrefs);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Group notification types by category
  const groupedTypes = Object.entries(NOTIFICATION_LABELS).reduce((acc, [type, config]) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push({ type, ...config });
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Permission Warning */}
      {permissionStatus === 'denied' && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Notifications blocked:</strong> You have blocked notifications for this site.
            To receive notifications, please enable them in your browser settings.
          </p>
        </div>
      )}

      {/* Master Toggle */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-800 dark:text-gray-100">
              Enable Notifications
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Master switch for all notification types
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={handleMasterToggle}
              disabled={permissionStatus === 'denied'}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600" />
          </div>
        </label>
      </div>

      {/* Push Notifications Toggle */}
      {pushSupported && preferences.enabled && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Push Notifications
              </span>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Receive notifications even when the app is closed
              </p>
              {!pushSubscribed && preferences.pushEnabled && (
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                  Push subscription needs to be renewed
                </p>
              )}
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={preferences.pushEnabled && pushSubscribed}
                onChange={handlePushToggle}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600" />
            </div>
          </label>
        </div>
      )}

      {/* Browser Not Supported */}
      {!pushSupported && preferences.enabled && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Push notifications are not supported in this browser. You will only receive
            notifications when the app is open.
          </p>
        </div>
      )}

      {/* Notification Types by Category */}
      {preferences.enabled && (
        <div className="space-y-6">
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const types = groupedTypes[categoryKey] || [];
            const allEnabled = types.every((t) => preferences[t.type]);
            const someEnabled = types.some((t) => preferences[t.type]);

            return (
              <div key={categoryKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100">
                    {category.icon} {category.label}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEnableCategory(categoryKey)}
                      disabled={allEnabled || saving}
                      className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      Enable all
                    </button>
                    <button
                      onClick={() => handleDisableCategory(categoryKey)}
                      disabled={!someEnabled || saving}
                      className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      Disable all
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {types.map(({ type, label, description }) => (
                    <label
                      key={type}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {label}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences[type]}
                        onChange={() => handleTypeToggle(type)}
                        disabled={saving}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Saving...
        </div>
      )}
    </div>
  );
};

NotificationPreferences.propTypes = {
  userId: PropTypes.string,
  onPreferencesChange: PropTypes.func,
};

NotificationPreferences.defaultProps = {
  userId: null,
  onPreferencesChange: null,
};

export default NotificationPreferences;
