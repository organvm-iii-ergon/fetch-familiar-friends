import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';
import {
  QUEST_DEFINITIONS,
  loadQuestProgress,
  updateQuestProgress as updateLocalQuestProgress,
  updateStreakProgress,
  getActiveQuests,
  getQuestStats,
  calculateLevelFromXp,
} from '../utils/questProgress';

/**
 * Hook for managing quests and achievements
 * @returns {Object} Quest state and methods
 */
export function useQuests() {
  const { user, isAuthenticated } = useAuth();

  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyQuests, setWeeklyQuests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [questStats, setQuestStats] = useState({ totalXp: 0, completedCount: 0 });
  const [userLevel, setUserLevel] = useState({ level: 1, xpIntoLevel: 0, xpForNextLevel: 50 });
  const [recentlyCompleted, setRecentlyCompleted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get quest definition
  const getQuestDefinition = useCallback((questKey) => {
    return QUEST_DEFINITIONS[questKey] || null;
  }, []);

  // Load local quests
  const loadLocalQuests = useCallback(() => {
    const { daily, weekly, totalXp, completedCount } = getActiveQuests();
    setDailyQuests(daily);
    setWeeklyQuests(weekly);
    setQuestStats({ totalXp, completedCount });
    setUserLevel(calculateLevelFromXp(totalXp));
  }, []);

  // Fetch current quests
  const fetchQuests = useCallback(async () => {
    // Always load local quests first
    loadLocalQuests();

    if (!isOnlineMode || !user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch active quests from server
      const { data: quests, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .or(`expires_at.is.null,expires_at.gte.${today}`);

      if (questError) throw questError;

      // If server has quests, merge with local (server takes precedence)
      if (quests && quests.length > 0) {
        const daily = [];
        const weekly = [];

        quests.forEach(quest => {
          const definition = getQuestDefinition(quest.quest_key);
          const enriched = {
            ...quest,
            ...definition,
            percentComplete: Math.min(100, (quest.progress / quest.target) * 100),
            isComplete: quest.completed_at !== null,
          };

          if (quest.quest_type === 'daily') {
            daily.push(enriched);
          } else if (quest.quest_type === 'weekly') {
            weekly.push(enriched);
          }
        });

        // Fill in any missing quests from local definitions
        const missingDaily = Object.values(QUEST_DEFINITIONS)
          .filter(q => q.type === 'daily')
          .filter(def => !daily.some(q => q.quest_key === def.key || q.key === def.key));

        for (const def of missingDaily) {
          await initializeQuest(def.key, 'daily');
          daily.push({
            ...def,
            progress: 0,
            percentComplete: 0,
            isComplete: false,
          });
        }

        setDailyQuests(daily);
        setWeeklyQuests(weekly);
      }

    } catch (err) {
      console.error('Error fetching quests from server:', err);
      // Local quests are already loaded, so just log the error
    } finally {
      setLoading(false);
    }
  }, [user?.id, getQuestDefinition, loadLocalQuests]);

  // Initialize a quest for the user
  const initializeQuest = async (questKey, questType) => {
    if (!isOnlineMode || !user?.id) return;

    const definition = QUEST_DEFINITIONS[questKey];
    if (!definition) return;

    const expiresAt = questType === 'daily'
      ? getEndOfDay()
      : questType === 'weekly'
        ? getEndOfWeek()
        : null;

    try {
      await supabase.from('quests').upsert({
        user_id: user.id,
        quest_key: questKey,
        quest_type: questType,
        target: definition.target,
        progress: 0,
        expires_at: expiresAt,
      }, {
        onConflict: 'user_id,quest_key,created_at',
        ignoreDuplicates: true,
      });
    } catch (err) {
      console.error('Error initializing quest:', err);
    }
  };

  // Track a quest-related action (local-first approach)
  const trackAction = useCallback((trigger, amount = 1) => {
    // Update local progress
    const result = updateLocalQuestProgress(trigger, amount);

    // Reload quests to reflect changes
    loadLocalQuests();

    // Show completion notifications
    if (result.completed.length > 0) {
      setRecentlyCompleted(result.completed);
      // Clear after 5 seconds
      setTimeout(() => setRecentlyCompleted([]), 5000);
    }

    return result;
  }, [loadLocalQuests]);

  // Track streak progress
  const trackStreak = useCallback((currentStreak) => {
    const result = updateStreakProgress(currentStreak);
    loadLocalQuests();

    if (result.completed.length > 0) {
      setRecentlyCompleted(prev => [...prev, ...result.completed]);
      setTimeout(() => setRecentlyCompleted([]), 5000);
    }

    return result;
  }, [loadLocalQuests]);

  // Update quest progress (maintains backward compatibility)
  const updateQuestProgress = useCallback(async (questKey, incrementBy = 1) => {
    // Find the trigger for this quest
    const definition = QUEST_DEFINITIONS[questKey];
    if (definition?.trigger) {
      return trackAction(definition.trigger, incrementBy);
    }

    // Fallback to server-based update for quests without local triggers
    if (!isOnlineMode || !user?.id) return { error: { message: 'Offline mode' } };

    try {
      const allQuests = [...dailyQuests, ...weeklyQuests];
      const quest = allQuests.find(q => q.quest_key === questKey || q.key === questKey);

      if (!quest || quest.isComplete) return { completed: false };

      const newProgress = Math.min(quest.target, quest.progress + incrementBy);
      const isNowComplete = newProgress >= quest.target;

      const updateData = {
        progress: newProgress,
        ...(isNowComplete && { completed_at: new Date().toISOString() }),
      };

      const { error: updateError } = await supabase
        .from('quests')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('quest_key', questKey)
        .is('completed_at', null);

      if (updateError) throw updateError;

      // Update local state
      const updateQuestList = (quests) => quests.map(q => {
        if (q.quest_key !== questKey && q.key !== questKey) return q;
        return {
          ...q,
          progress: newProgress,
          percentComplete: (newProgress / q.target) * 100,
          isComplete: isNowComplete,
        };
      });

      setDailyQuests(updateQuestList);
      setWeeklyQuests(updateQuestList);

      if (isNowComplete) {
        await awardXp(quest.xp);
        setRecentlyCompleted([{ ...quest, type: quest.type }]);
        setTimeout(() => setRecentlyCompleted([]), 5000);
        return { completed: true, xpAwarded: quest.xp };
      }

      return { completed: false, progress: newProgress };

    } catch (err) {
      console.error('Error updating quest progress:', err);
      return { error: err };
    }
  }, [user?.id, dailyQuests, weeklyQuests, trackAction]);

  // Award XP to user
  const awardXp = async (xp) => {
    if (!isOnlineMode || !user?.id || !xp) return;

    try {
      const { data } = await supabase.rpc('add_user_xp', {
        p_user_id: user.id,
        p_xp: xp,
      });

      return data;
    } catch (err) {
      console.error('Error awarding XP:', err);
    }
  };

  // Claim quest rewards
  const claimRewards = useCallback(async (questId) => {
    if (!isOnlineMode || !user?.id) return;

    try {
      const { error: claimError } = await supabase
        .from('quests')
        .update({ rewards_claimed: true })
        .eq('id', questId)
        .eq('user_id', user.id);

      if (claimError) throw claimError;

      await fetchQuests();
      return { error: null };

    } catch (err) {
      console.error('Error claiming rewards:', err);
      return { error: err };
    }
  }, [user?.id, fetchQuests]);

  // Fetch achievements (using the legacy system for backward compatibility)
  const fetchAchievements = useCallback(async () => {
    if (!isOnlineMode || !user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAchievements(data || []);

    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  }, [user?.id]);

  // Check and award achievements (legacy - use AchievementContext for new system)
  const checkAchievements = useCallback(async (context) => {
    if (!isOnlineMode || !user?.id) return;

    // This function is kept for backward compatibility
    // The new achievement system uses AchievementContext.triggerAchievementCheck()
    //
    // Example context structure:
    // {
    //   journalCount: number,
    //   favoriteCount: number,
    //   friendCount: number,
    //   petCount: number,
    //   questsCompleted: number,
    //   battlesCompleted: number,
    //   battlesWon: number,
    //   gymsConquered: number,
    //   healthRecords: number,
    //   loginStreak: number,
    //   virtualPetLevel: number,
    //   breedCount: number,
    //   locationCount: number,
    //   reactionsGiven: number,
    //   activitiesCreated: number,
    //   seasonLevel: number,
    // }

    // Import and use the new achievement system
    // This is a bridge for code that still calls checkAchievements directly
    try {
      // The actual achievement checking is now handled by AchievementContext
      // We just refresh the local achievements list
      await fetchAchievements();
    } catch (err) {
      console.error('Error checking achievements:', err);
    }
  }, [user?.id, fetchAchievements]);

  // Get completed quests count for achievement tracking
  const getCompletedQuestsCount = useCallback(async () => {
    if (!isOnlineMode || !user?.id) return 0;

    try {
      const { count, error } = await supabase
        .from('quests')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error getting completed quests count:', err);
      return 0;
    }
  }, [user?.id]);

  // Fetch on mount - always load local quests, fetch server if authenticated
  useEffect(() => {
    // Always load local quests first
    loadLocalQuests();

    if (isAuthenticated) {
      fetchQuests();
      fetchAchievements();
    } else {
      setAchievements([]);
    }
  }, [isAuthenticated, fetchQuests, fetchAchievements, loadLocalQuests]);

  return {
    // State
    dailyQuests,
    weeklyQuests,
    achievements,
    questStats,
    userLevel,
    recentlyCompleted,
    loading,
    error,

    // Computed
    completedDailyCount: dailyQuests.filter(q => q.isComplete).length,
    completedWeeklyCount: weeklyQuests.filter(q => q.isComplete).length,
    totalDailyXp: dailyQuests.reduce((sum, q) => sum + (q.isComplete ? q.xp : 0), 0),
    totalXp: questStats.totalXp,
    level: userLevel.level,
    allQuestsComplete: dailyQuests.every(q => q.isComplete) && weeklyQuests.every(q => q.isComplete),

    // Actions
    fetchQuests,
    updateQuestProgress,
    trackAction,
    trackStreak,
    claimRewards,
    checkAchievements,
    getQuestDefinition,
    getCompletedQuestsCount,

    // Convenience action trackers
    trackViewImage: () => trackAction('view_image'),
    trackWriteJournal: () => trackAction('write_journal'),
    trackAddFavorite: () => trackAction('add_favorite'),
    trackPetAction: () => trackAction('pet_action'),
    trackNavigateDate: () => trackAction('navigate_date'),

    // Clear states
    clearError: () => setError(null),
    clearRecentlyCompleted: () => setRecentlyCompleted([]),
  };
}

// Helper functions
function getEndOfDay() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function getEndOfWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() + (7 - day);
  date.setDate(diff);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

// Re-export quest utilities for convenience
export { QUEST_DEFINITIONS, getQuestStats, calculateLevelFromXp };

export default useQuests;
