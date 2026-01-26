/**
 * Analytics Service
 * Tracks user events and provides usage statistics
 */

import { supabase, isOnlineMode } from '../config/supabase';
import { queueChange, isOnline } from './syncService';

// Constants
const STORAGE_KEY = 'dogtale-analytics';
const BATCH_SIZE = 50;
const BATCH_INTERVAL = 30000; // 30 seconds
const MAX_LOCAL_EVENTS = 1000;

// Event types
export const EVENT_TYPES = {
  // Quests & Achievements
  QUEST_COMPLETED: 'quest_completed',
  QUEST_STARTED: 'quest_started',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEVEL_UP: 'level_up',
  XP_EARNED: 'xp_earned',

  // Virtual Pet
  PET_ACTION: 'pet_action',
  PET_FED: 'pet_fed',
  PET_PLAYED: 'pet_played',
  PET_GROOMED: 'pet_groomed',
  PET_CREATED: 'pet_created',

  // Journal
  JOURNAL_ENTRY_CREATED: 'journal_entry_created',
  JOURNAL_ENTRY_UPDATED: 'journal_entry_updated',
  JOURNAL_ENTRY_DELETED: 'journal_entry_deleted',

  // Social
  FRIEND_ADDED: 'friend_added',
  FRIEND_REMOVED: 'friend_removed',
  FRIEND_REQUEST_SENT: 'friend_request_sent',
  ACTIVITY_POSTED: 'activity_posted',
  ACTIVITY_LIKED: 'activity_liked',
  ACTIVITY_COMMENTED: 'activity_commented',

  // UI Interactions
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
  FEATURE_USED: 'feature_used',
  THEME_CHANGED: 'theme_changed',
  DARK_MODE_TOGGLED: 'dark_mode_toggled',

  // Navigation
  PAGE_VIEW: 'page_view',
  DATE_NAVIGATED: 'date_navigated',
  CALENDAR_VIEW_CHANGED: 'calendar_view_changed',

  // Media
  IMAGE_FAVORITED: 'image_favorited',
  IMAGE_UNFAVORITED: 'image_unfavorited',
  IMAGE_VIEWED: 'image_viewed',
  IMAGE_DOWNLOADED: 'image_downloaded',

  // AI
  AI_CHAT_STARTED: 'ai_chat_started',
  AI_MESSAGE_SENT: 'ai_message_sent',
  AI_RESPONSE_RECEIVED: 'ai_response_received',

  // Health
  HEALTH_RECORD_CREATED: 'health_record_created',
  REMINDER_CREATED: 'reminder_created',
  REMINDER_COMPLETED: 'reminder_completed',

  // Subscription
  SUBSCRIPTION_VIEWED: 'subscription_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_CHANGED: 'subscription_changed',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
};

// Local event queue
let eventQueue = [];
let batchTimer = null;

/**
 * Initialize analytics service
 * Loads persisted events and starts batch timer
 */
export function initAnalytics() {
  // Load persisted events
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { events = [] } = JSON.parse(stored);
      eventQueue = events;
    }
  } catch (error) {
    console.error('Error loading analytics events:', error);
  }

  // Start batch timer
  startBatchTimer();

  // Track session start
  trackEvent(EVENT_TYPES.PAGE_VIEW, {
    pageName: 'app_start',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Start the batch upload timer
 */
function startBatchTimer() {
  if (batchTimer) {
    clearInterval(batchTimer);
  }

  batchTimer = setInterval(() => {
    flushEvents();
  }, BATCH_INTERVAL);
}

/**
 * Stop the batch timer
 */
export function stopAnalytics() {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }

  // Final flush before stopping
  flushEvents();
}

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} properties - Event properties
 * @returns {void}
 */
export function trackEvent(eventName, properties = {}) {
  const event = {
    id: generateEventId(),
    event_name: eventName,
    properties: {
      ...properties,
      source: 'web',
    },
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
  };

  // Add to queue
  eventQueue.push(event);

  // Trim queue if too large
  if (eventQueue.length > MAX_LOCAL_EVENTS) {
    eventQueue = eventQueue.slice(-MAX_LOCAL_EVENTS);
  }

  // Persist to localStorage
  persistEvents();

  // Flush if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }
}

/**
 * Track a page view
 * @param {string} pageName - Name of the page/modal
 * @param {Object} properties - Additional properties
 */
export function trackPageView(pageName, properties = {}) {
  trackEvent(EVENT_TYPES.PAGE_VIEW, {
    pageName,
    ...properties,
  });
}

/**
 * Track an error
 * @param {Error} error - The error object
 * @param {Object} context - Error context
 */
export function trackError(error, context = {}) {
  trackEvent(EVENT_TYPES.ERROR_OCCURRED, {
    errorMessage: error.message || String(error),
    errorStack: error.stack,
    errorName: error.name,
    ...context,
  });
}

/**
 * Track feature usage
 * @param {string} featureName - Name of the feature
 * @param {Object} properties - Additional properties
 */
export function trackFeatureUsed(featureName, properties = {}) {
  trackEvent(EVENT_TYPES.FEATURE_USED, {
    featureName,
    ...properties,
  });
}

/**
 * Track modal open/close
 * @param {string} modalName - Name of the modal
 * @param {boolean} isOpen - Whether modal is opening or closing
 */
export function trackModal(modalName, isOpen) {
  trackEvent(isOpen ? EVENT_TYPES.MODAL_OPENED : EVENT_TYPES.MODAL_CLOSED, {
    modalName,
  });
}

/**
 * Flush events to Supabase
 * @returns {Promise<{sent: number, error: Error|null}>}
 */
async function flushEvents() {
  if (eventQueue.length === 0) {
    return { sent: 0, error: null };
  }

  // Get events to send
  const eventsToSend = [...eventQueue];
  const batchId = Date.now();

  // Clear queue optimistically
  eventQueue = [];
  persistEvents();

  // Check if we can send online
  if (!isOnlineMode || !isOnline()) {
    // Queue for later sync
    try {
      await queueChange('analytics_events', 'insert', eventsToSend, {
        batchId,
      });
      return { sent: 0, queued: eventsToSend.length, error: null };
    } catch (error) {
      // Restore events on error
      eventQueue = [...eventsToSend, ...eventQueue];
      persistEvents();
      return { sent: 0, error };
    }
  }

  // Send to Supabase
  try {
    const { error } = await supabase.from('analytics_events').insert(eventsToSend);

    if (error) {
      // Restore events on error
      eventQueue = [...eventsToSend, ...eventQueue];
      persistEvents();
      return { sent: 0, error };
    }

    return { sent: eventsToSend.length, error: null };
  } catch (error) {
    // Restore events on error
    eventQueue = [...eventsToSend, ...eventQueue];
    persistEvents();
    return { sent: 0, error };
  }
}

/**
 * Force flush all pending events
 * @returns {Promise<{sent: number, error: Error|null}>}
 */
export async function forceFlush() {
  return flushEvents();
}

/**
 * Persist events to localStorage
 */
function persistEvents() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        events: eventQueue,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Error persisting analytics events:', error);
  }
}

/**
 * Get session ID (or create one)
 * @returns {string}
 */
function getSessionId() {
  const SESSION_KEY = 'dogtale-session-id';
  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateEventId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Generate unique event ID
 * @returns {string}
 */
function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// USAGE STATISTICS
// ============================================

/**
 * Get aggregated usage stats
 * @param {Object} options - Filter options
 * @returns {Promise<{stats: Object, error: Error|null}>}
 */
export async function getUsageStats(options = {}) {
  const {
    userId,
    startDate,
    endDate = new Date().toISOString(),
    includeLocal = true,
  } = options;

  const stats = {
    totalEvents: 0,
    eventsByType: {},
    dailyActivity: {},
    topFeatures: [],
    errorCount: 0,
    sessionCount: 0,
    avgEventsPerSession: 0,
  };

  // Include local events
  if (includeLocal) {
    processEventsForStats(eventQueue, stats);
  }

  // Fetch from Supabase if online
  if (isOnlineMode && isOnline() && userId) {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*')
        .order('timestamp', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query.limit(10000);

      if (error) {
        console.error('Error fetching analytics:', error);
      } else if (data) {
        processEventsForStats(data, stats);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  }

  // Calculate derived stats
  stats.avgEventsPerSession =
    stats.sessionCount > 0
      ? Math.round(stats.totalEvents / stats.sessionCount)
      : stats.totalEvents;

  // Sort top features
  stats.topFeatures = Object.entries(stats.eventsByType)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { stats, error: null };
}

/**
 * Process events and update stats object
 * @param {Array} events - Events to process
 * @param {Object} stats - Stats object to update
 */
function processEventsForStats(events, stats) {
  const sessions = new Set();

  for (const event of events) {
    stats.totalEvents++;

    // Count by type
    const eventType = event.event_name;
    stats.eventsByType[eventType] = (stats.eventsByType[eventType] || 0) + 1;

    // Track errors
    if (eventType === EVENT_TYPES.ERROR_OCCURRED) {
      stats.errorCount++;
    }

    // Track sessions
    if (event.session_id) {
      sessions.add(event.session_id);
    }

    // Daily activity
    const date = event.timestamp?.split('T')[0];
    if (date) {
      stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
    }
  }

  stats.sessionCount += sessions.size;
}

/**
 * Get local event count
 * @returns {number}
 */
export function getLocalEventCount() {
  return eventQueue.length;
}

/**
 * Get events by type (local only)
 * @param {string} eventType - Event type to filter
 * @returns {Array}
 */
export function getLocalEventsByType(eventType) {
  return eventQueue.filter((e) => e.event_name === eventType);
}

/**
 * Clear local analytics data
 */
export function clearLocalAnalytics() {
  eventQueue = [];
  persistEvents();
  sessionStorage.removeItem('dogtale-session-id');
}

// ============================================
// CONVENIENCE TRACKING FUNCTIONS
// ============================================

/**
 * Track quest completion
 * @param {Object} quest - Quest data
 */
export function trackQuestCompleted(quest) {
  trackEvent(EVENT_TYPES.QUEST_COMPLETED, {
    questKey: quest.key || quest.quest_key,
    questName: quest.title || quest.name,
    questType: quest.type || quest.quest_type,
    xpEarned: quest.xp,
  });
}

/**
 * Track achievement unlock
 * @param {Object} achievement - Achievement data
 */
export function trackAchievementUnlocked(achievement) {
  trackEvent(EVENT_TYPES.ACHIEVEMENT_UNLOCKED, {
    achievementKey: achievement.key || achievement.achievement_key,
    achievementName: achievement.title || achievement.name,
  });
}

/**
 * Track pet action
 * @param {string} action - Action type (feed, play, groom)
 * @param {Object} petData - Pet data
 */
export function trackPetAction(action, petData = {}) {
  trackEvent(EVENT_TYPES.PET_ACTION, {
    action,
    petId: petData.id,
    petName: petData.name,
  });
}

/**
 * Track journal entry
 * @param {string} action - 'created', 'updated', or 'deleted'
 * @param {Object} entryData - Entry data
 */
export function trackJournalEntry(action, entryData = {}) {
  const eventType =
    action === 'created'
      ? EVENT_TYPES.JOURNAL_ENTRY_CREATED
      : action === 'updated'
        ? EVENT_TYPES.JOURNAL_ENTRY_UPDATED
        : EVENT_TYPES.JOURNAL_ENTRY_DELETED;

  trackEvent(eventType, {
    date: entryData.date,
    wordCount: entryData.content?.split(/\s+/).length || 0,
    hasImage: !!entryData.imageUrl,
  });
}

/**
 * Track social action
 * @param {string} action - Social action type
 * @param {Object} data - Action data
 */
export function trackSocialAction(action, data = {}) {
  let eventType;

  switch (action) {
    case 'friend_added':
      eventType = EVENT_TYPES.FRIEND_ADDED;
      break;
    case 'friend_removed':
      eventType = EVENT_TYPES.FRIEND_REMOVED;
      break;
    case 'activity_posted':
      eventType = EVENT_TYPES.ACTIVITY_POSTED;
      break;
    case 'activity_liked':
      eventType = EVENT_TYPES.ACTIVITY_LIKED;
      break;
    case 'activity_commented':
      eventType = EVENT_TYPES.ACTIVITY_COMMENTED;
      break;
    default:
      eventType = EVENT_TYPES.FEATURE_USED;
  }

  trackEvent(eventType, data);
}

export default {
  // Initialization
  initAnalytics,
  stopAnalytics,
  forceFlush,

  // Tracking
  trackEvent,
  trackPageView,
  trackError,
  trackFeatureUsed,
  trackModal,

  // Convenience tracking
  trackQuestCompleted,
  trackAchievementUnlocked,
  trackPetAction,
  trackJournalEntry,
  trackSocialAction,

  // Stats
  getUsageStats,
  getLocalEventCount,
  getLocalEventsByType,
  clearLocalAnalytics,

  // Event types
  EVENT_TYPES,
};
