/**
 * Quest Progress Utility
 * Local quest tracking and progression system
 */

const STORAGE_KEY = 'dogtale-quest-progress';
const QUEST_HISTORY_KEY = 'dogtale-quest-history';

// Quest definitions with local tracking
export const QUEST_DEFINITIONS = {
  // Daily quests
  daily_photo: {
    key: 'daily_photo',
    type: 'daily',
    title: 'Paw-parazzi',
    description: 'View today\'s daily pet image',
    target: 1,
    xp: 10,
    icon: '📷',
    trigger: 'view_image',
  },
  daily_journal: {
    key: 'daily_journal',
    type: 'daily',
    title: 'Pet Chronicler',
    description: 'Write a journal entry today',
    target: 1,
    xp: 20,
    icon: '📝',
    trigger: 'write_journal',
  },
  daily_favorite: {
    key: 'daily_favorite',
    type: 'daily',
    title: 'Picture Purrfect',
    description: 'Add an image to favorites',
    target: 1,
    xp: 10,
    icon: '❤️',
    trigger: 'add_favorite',
  },
  daily_virtual_pet: {
    key: 'daily_virtual_pet',
    type: 'daily',
    title: 'Virtual Caretaker',
    description: 'Feed and play with your virtual pet',
    target: 2,
    xp: 15,
    icon: '🐕',
    trigger: 'pet_action',
  },
  daily_explore: {
    key: 'daily_explore',
    type: 'daily',
    title: 'Date Explorer',
    description: 'Navigate to 3 different dates',
    target: 3,
    xp: 10,
    icon: '🗓️',
    trigger: 'navigate_date',
  },

  // Weekly quests
  weekly_streak: {
    key: 'weekly_streak',
    type: 'weekly',
    title: 'Dedicated Parent',
    description: 'Maintain a 7-day streak',
    target: 7,
    xp: 100,
    icon: '🔥',
    trigger: 'login_streak',
  },
  weekly_journalist: {
    key: 'weekly_journalist',
    type: 'weekly',
    title: 'Master Journalist',
    description: 'Write 5 journal entries this week',
    target: 5,
    xp: 80,
    icon: '📚',
    trigger: 'write_journal',
  },
  weekly_collector: {
    key: 'weekly_collector',
    type: 'weekly',
    title: 'Image Collector',
    description: 'Add 10 images to favorites',
    target: 10,
    xp: 75,
    icon: '🏆',
    trigger: 'add_favorite',
  },
  weekly_explorer: {
    key: 'weekly_explorer',
    type: 'weekly',
    title: 'Time Traveler',
    description: 'Explore 14 different dates',
    target: 14,
    xp: 60,
    icon: '🔍',
    trigger: 'navigate_date',
  },
  weekly_caretaker: {
    key: 'weekly_caretaker',
    type: 'weekly',
    title: 'Super Caretaker',
    description: 'Perform 20 virtual pet actions',
    target: 20,
    xp: 90,
    icon: '🌟',
    trigger: 'pet_action',
  },
};

/**
 * Get the start of today (midnight)
 */
function getStartOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Get the start of current week (Sunday midnight)
 */
function getStartOfWeek() {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Get the end of today
 */
function getEndOfDay() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

/**
 * Get the end of current week
 */
function getEndOfWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() + (6 - day);
  date.setDate(diff);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

/**
 * Check if a date string is today
 */
function isToday(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date string is in current week
 */
function isThisWeek(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const startOfWeek = new Date(getStartOfWeek());
  const endOfWeek = new Date(getEndOfWeek());
  return date >= startOfWeek && date <= endOfWeek;
}

/**
 * Load quest progress from localStorage
 */
export function loadQuestProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initializeQuestProgress();

    const data = JSON.parse(stored);

    // Check if data needs to be reset (new day/week)
    const now = new Date();
    const lastUpdated = new Date(data.lastUpdated || 0);

    // Reset daily quests if new day
    if (lastUpdated.toDateString() !== now.toDateString()) {
      data.daily = initializeDailyQuests();
    }

    // Reset weekly quests if new week
    const lastWeekStart = new Date(lastUpdated);
    lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay());
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    if (lastWeekStart.toDateString() !== currentWeekStart.toDateString()) {
      data.weekly = initializeWeeklyQuests();
    }

    data.lastUpdated = now.toISOString();
    saveQuestProgress(data);

    return data;
  } catch (err) {
    console.error('Error loading quest progress:', err);
    return initializeQuestProgress();
  }
}

/**
 * Initialize fresh quest progress
 */
function initializeQuestProgress() {
  const data = {
    daily: initializeDailyQuests(),
    weekly: initializeWeeklyQuests(),
    totalXp: loadTotalXp(),
    completedCount: loadCompletedCount(),
    lastUpdated: new Date().toISOString(),
  };

  saveQuestProgress(data);
  return data;
}

/**
 * Initialize daily quests
 */
function initializeDailyQuests() {
  const daily = {};
  Object.values(QUEST_DEFINITIONS)
    .filter(q => q.type === 'daily')
    .forEach(def => {
      daily[def.key] = {
        ...def,
        progress: 0,
        completedAt: null,
        startedAt: getStartOfDay(),
        expiresAt: getEndOfDay(),
      };
    });
  return daily;
}

/**
 * Initialize weekly quests
 */
function initializeWeeklyQuests() {
  const weekly = {};
  Object.values(QUEST_DEFINITIONS)
    .filter(q => q.type === 'weekly')
    .forEach(def => {
      weekly[def.key] = {
        ...def,
        progress: 0,
        completedAt: null,
        startedAt: getStartOfWeek(),
        expiresAt: getEndOfWeek(),
      };
    });
  return weekly;
}

/**
 * Save quest progress to localStorage
 */
export function saveQuestProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving quest progress:', err);
  }
}

/**
 * Load total accumulated XP
 */
function loadTotalXp() {
  try {
    const history = localStorage.getItem(QUEST_HISTORY_KEY);
    if (!history) return 0;
    const data = JSON.parse(history);
    return data.totalXp || 0;
  } catch {
    return 0;
  }
}

/**
 * Load total completed quest count
 */
function loadCompletedCount() {
  try {
    const history = localStorage.getItem(QUEST_HISTORY_KEY);
    if (!history) return 0;
    const data = JSON.parse(history);
    return data.completedCount || 0;
  } catch {
    return 0;
  }
}

/**
 * Save quest completion to history
 */
function saveToHistory(xpEarned) {
  try {
    const stored = localStorage.getItem(QUEST_HISTORY_KEY);
    const history = stored ? JSON.parse(stored) : { totalXp: 0, completedCount: 0, completions: [] };

    history.totalXp = (history.totalXp || 0) + xpEarned;
    history.completedCount = (history.completedCount || 0) + 1;
    history.completions.push({
      xp: xpEarned,
      completedAt: new Date().toISOString(),
    });

    // Keep only last 100 completions
    if (history.completions.length > 100) {
      history.completions = history.completions.slice(-100);
    }

    localStorage.setItem(QUEST_HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (err) {
    console.error('Error saving quest history:', err);
    return { totalXp: 0, completedCount: 0 };
  }
}

/**
 * Update progress for a specific trigger
 * @param {string} trigger - The trigger type (view_image, write_journal, etc.)
 * @param {number} amount - Amount to increment (default 1)
 * @returns {Object} Result with any completed quests
 */
export function updateQuestProgress(trigger, amount = 1) {
  const data = loadQuestProgress();
  const completed = [];

  // Check daily quests
  Object.values(data.daily).forEach(quest => {
    if (quest.trigger === trigger && !quest.completedAt) {
      quest.progress = Math.min(quest.target, quest.progress + amount);

      if (quest.progress >= quest.target) {
        quest.completedAt = new Date().toISOString();
        completed.push({
          ...quest,
          type: 'daily',
        });

        // Update history
        const history = saveToHistory(quest.xp);
        data.totalXp = history.totalXp;
        data.completedCount = history.completedCount;
      }
    }
  });

  // Check weekly quests
  Object.values(data.weekly).forEach(quest => {
    if (quest.trigger === trigger && !quest.completedAt) {
      quest.progress = Math.min(quest.target, quest.progress + amount);

      if (quest.progress >= quest.target) {
        quest.completedAt = new Date().toISOString();
        completed.push({
          ...quest,
          type: 'weekly',
        });

        // Update history
        const history = saveToHistory(quest.xp);
        data.totalXp = history.totalXp;
        data.completedCount = history.completedCount;
      }
    }
  });

  data.lastUpdated = new Date().toISOString();
  saveQuestProgress(data);

  return {
    data,
    completed,
    totalXpEarned: completed.reduce((sum, q) => sum + q.xp, 0),
  };
}

/**
 * Update streak-based quest progress
 * @param {number} currentStreak - Current login streak
 */
export function updateStreakProgress(currentStreak) {
  const data = loadQuestProgress();
  const completed = [];

  // Update weekly streak quest
  const streakQuest = data.weekly.weekly_streak;
  if (streakQuest && !streakQuest.completedAt) {
    streakQuest.progress = Math.min(streakQuest.target, currentStreak);

    if (streakQuest.progress >= streakQuest.target) {
      streakQuest.completedAt = new Date().toISOString();
      completed.push({
        ...streakQuest,
        type: 'weekly',
      });

      const history = saveToHistory(streakQuest.xp);
      data.totalXp = history.totalXp;
      data.completedCount = history.completedCount;
    }
  }

  data.lastUpdated = new Date().toISOString();
  saveQuestProgress(data);

  return { data, completed };
}

/**
 * Get all active quests formatted for display
 */
export function getActiveQuests() {
  const data = loadQuestProgress();

  const formatQuest = (quest) => ({
    ...quest,
    percentComplete: Math.min(100, (quest.progress / quest.target) * 100),
    isComplete: quest.completedAt !== null,
    remaining: Math.max(0, quest.target - quest.progress),
  });

  return {
    daily: Object.values(data.daily).map(formatQuest),
    weekly: Object.values(data.weekly).map(formatQuest),
    totalXp: data.totalXp,
    completedCount: data.completedCount,
  };
}

/**
 * Get quest statistics
 */
export function getQuestStats() {
  const data = loadQuestProgress();

  const dailyComplete = Object.values(data.daily).filter(q => q.completedAt).length;
  const weeklyComplete = Object.values(data.weekly).filter(q => q.completedAt).length;
  const dailyTotal = Object.keys(data.daily).length;
  const weeklyTotal = Object.keys(data.weekly).length;

  return {
    dailyComplete,
    dailyTotal,
    dailyProgress: dailyTotal > 0 ? (dailyComplete / dailyTotal) * 100 : 0,
    weeklyComplete,
    weeklyTotal,
    weeklyProgress: weeklyTotal > 0 ? (weeklyComplete / weeklyTotal) * 100 : 0,
    totalXp: data.totalXp,
    completedCount: data.completedCount,
    dailyXpEarned: Object.values(data.daily)
      .filter(q => q.completedAt)
      .reduce((sum, q) => sum + q.xp, 0),
    weeklyXpEarned: Object.values(data.weekly)
      .filter(q => q.completedAt)
      .reduce((sum, q) => sum + q.xp, 0),
  };
}

/**
 * Calculate user level from XP
 */
export function calculateLevelFromXp(xp) {
  // Each level requires levelNumber * 50 XP
  // Level 1: 0-49, Level 2: 50-149, Level 3: 150-299, etc.
  let level = 1;
  let xpNeeded = 50;
  let totalXpNeeded = 0;

  while (xp >= totalXpNeeded + xpNeeded) {
    totalXpNeeded += xpNeeded;
    level++;
    xpNeeded = level * 50;
  }

  const xpIntoLevel = xp - totalXpNeeded;
  const xpForNextLevel = xpNeeded;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progressPercent: (xpIntoLevel / xpForNextLevel) * 100,
    totalXp: xp,
  };
}

export default {
  QUEST_DEFINITIONS,
  loadQuestProgress,
  saveQuestProgress,
  updateQuestProgress,
  updateStreakProgress,
  getActiveQuests,
  getQuestStats,
  calculateLevelFromXp,
};
