import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

// Quest definitions
const QUEST_DEFINITIONS = {
  // Daily quests
  daily_photo: {
    key: 'daily_photo',
    type: 'daily',
    title: 'Paw-parazzi',
    description: 'View today\'s daily pet image',
    target: 1,
    xp: 10,
    icon: '📷',
  },
  daily_journal: {
    key: 'daily_journal',
    type: 'daily',
    title: 'Pet Chronicler',
    description: 'Write a journal entry today',
    target: 1,
    xp: 20,
    icon: '📝',
  },
  daily_favorite: {
    key: 'daily_favorite',
    type: 'daily',
    title: 'Picture Purrfect',
    description: 'Add an image to favorites',
    target: 1,
    xp: 10,
    icon: '❤️',
  },
  daily_social: {
    key: 'daily_social',
    type: 'daily',
    title: 'Social Butterfly',
    description: 'React to a friend\'s activity',
    target: 1,
    xp: 15,
    icon: '🦋',
  },
  daily_virtual_pet: {
    key: 'daily_virtual_pet',
    type: 'daily',
    title: 'Virtual Caretaker',
    description: 'Feed and play with your virtual pet',
    target: 2,
    xp: 15,
    icon: '🐕',
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
  },
  weekly_explorer: {
    key: 'weekly_explorer',
    type: 'weekly',
    title: 'Breed Explorer',
    description: 'Learn about 5 different breeds',
    target: 5,
    xp: 75,
    icon: '🔍',
  },
  weekly_journalist: {
    key: 'weekly_journalist',
    type: 'weekly',
    title: 'Master Journalist',
    description: 'Write 5 journal entries this week',
    target: 5,
    xp: 80,
    icon: '📚',
  },

  // Seasonal/story quests are defined dynamically
};

/**
 * Hook for managing quests and achievements
 * @returns {Object} Quest state and methods
 */
export function useQuests() {
  const { user, isAuthenticated } = useAuth();

  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyQuests, setWeeklyQuests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get quest definition
  const getQuestDefinition = useCallback((questKey) => {
    return QUEST_DEFINITIONS[questKey] || null;
  }, []);

  // Fetch current quests
  const fetchQuests = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load from localStorage as fallback
      const localQuests = localStorage.getItem('dogtale-quests');
      if (localQuests) {
        const parsed = JSON.parse(localQuests);
        setDailyQuests(parsed.daily || []);
        setWeeklyQuests(parsed.weekly || []);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch active quests
      const { data: quests, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .or(`expires_at.is.null,expires_at.gte.${today}`);

      if (questError) throw questError;

      // Separate by type and add definitions
      const daily = [];
      const weekly = [];

      quests?.forEach(quest => {
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

      // Initialize any missing daily quests
      const missingDaily = Object.values(QUEST_DEFINITIONS)
        .filter(q => q.type === 'daily')
        .filter(def => !daily.some(q => q.quest_key === def.key));

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

      // Cache locally
      localStorage.setItem('dogtale-quests', JSON.stringify({ daily, weekly }));

    } catch (err) {
      console.error('Error fetching quests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, getQuestDefinition]);

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

  // Update quest progress
  const updateQuestProgress = useCallback(async (questKey, incrementBy = 1) => {
    if (!isOnlineMode || !user?.id) return;

    try {
      // Find the quest
      const allQuests = [...dailyQuests, ...weeklyQuests];
      const quest = allQuests.find(q => q.quest_key === questKey);

      if (!quest || quest.isComplete) return;

      const newProgress = Math.min(quest.target, quest.progress + incrementBy);
      const isNowComplete = newProgress >= quest.target;

      // Update in database
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
        if (q.quest_key !== questKey) return q;
        return {
          ...q,
          progress: newProgress,
          percentComplete: (newProgress / q.target) * 100,
          isComplete: isNowComplete,
        };
      });

      setDailyQuests(updateQuestList);
      setWeeklyQuests(updateQuestList);

      // If completed, award XP
      if (isNowComplete) {
        await awardXp(quest.xp);
        return { completed: true, xpAwarded: quest.xp };
      }

      return { completed: false, progress: newProgress };

    } catch (err) {
      console.error('Error updating quest progress:', err);
      return { error: err };
    }
  }, [user?.id, dailyQuests, weeklyQuests]);

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

  // Fetch achievements
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

  // Check and award achievements
  const checkAchievements = useCallback(async (context) => {
    if (!isOnlineMode || !user?.id) return;

    // Achievement definitions would be checked here
    // This is a simplified example
    const achievementChecks = [
      { key: 'first_journal', condition: () => context.journalCount >= 1 },
      { key: 'journal_master', condition: () => context.journalCount >= 100 },
      { key: 'collector', condition: () => context.favoriteCount >= 50 },
      { key: 'social_star', condition: () => context.friendCount >= 10 },
    ];

    for (const check of achievementChecks) {
      if (check.condition() && !achievements.some(a => a.achievement_key === check.key)) {
        try {
          await supabase.from('achievements').insert({
            user_id: user.id,
            achievement_key: check.key,
          });
        } catch {
          // Already exists, ignore
        }
      }
    }

    await fetchAchievements();
  }, [user?.id, achievements, fetchAchievements]);

  // Fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchQuests();
      fetchAchievements();
    } else {
      setDailyQuests([]);
      setWeeklyQuests([]);
      setAchievements([]);
    }
  }, [isAuthenticated, fetchQuests, fetchAchievements]);

  return {
    // State
    dailyQuests,
    weeklyQuests,
    achievements,
    loading,
    error,

    // Computed
    completedDailyCount: dailyQuests.filter(q => q.isComplete).length,
    completedWeeklyCount: weeklyQuests.filter(q => q.isComplete).length,
    totalDailyXp: dailyQuests.reduce((sum, q) => sum + (q.isComplete ? q.xp : 0), 0),

    // Actions
    fetchQuests,
    updateQuestProgress,
    claimRewards,
    checkAchievements,
    getQuestDefinition,

    // Clear error
    clearError: () => setError(null),
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

export default useQuests;
