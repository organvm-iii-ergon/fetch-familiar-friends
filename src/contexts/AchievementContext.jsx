/**
 * Achievement Context for DogTale Daily
 * Manages achievement state, triggers, and notifications
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';
import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementDefinition,
  calculateAchievementXp,
  ACHIEVEMENT_KEYS,
} from '../config/achievements';

// Context
const AchievementContext = createContext(null);

// Local storage key
const ACHIEVEMENTS_CACHE_KEY = 'dogtale-achievements';
const ACHIEVEMENT_STATS_KEY = 'dogtale-achievement-stats';

/**
 * Achievement Provider Component
 */
export function AchievementProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // State
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [achievementStats, setAchievementStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Refs for avoiding duplicate checks
  const checkInProgressRef = useRef(new Set());
  const lastStatsRef = useRef({});

  /**
   * Load unlocked achievements from database or cache
   */
  const loadAchievements = useCallback(async () => {
    if (!user?.id) {
      // Load from localStorage for offline mode
      const cached = localStorage.getItem(ACHIEVEMENTS_CACHE_KEY);
      if (cached) {
        setUnlockedAchievements(JSON.parse(cached));
      }
      return;
    }

    setLoading(true);

    try {
      if (isOnlineMode) {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', user.id)
          .order('achieved_at', { ascending: false });

        if (error) throw error;

        const achievements = data || [];
        setUnlockedAchievements(achievements);
        localStorage.setItem(ACHIEVEMENTS_CACHE_KEY, JSON.stringify(achievements));
      } else {
        const cached = localStorage.getItem(ACHIEVEMENTS_CACHE_KEY);
        if (cached) {
          setUnlockedAchievements(JSON.parse(cached));
        }
      }
    } catch (err) {
      console.error('Error loading achievements:', err);
      // Fall back to cache
      const cached = localStorage.getItem(ACHIEVEMENTS_CACHE_KEY);
      if (cached) {
        setUnlockedAchievements(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Load local stats from localStorage (for offline mode)
   */
  const loadLocalStats = useCallback(() => {
    try {
      // Journal entries count
      const journalData = localStorage.getItem('dogtale-journal');
      const journal = journalData ? JSON.parse(journalData) : {};
      const journalCount = Object.keys(journal).length;

      // Favorites count and unique breeds
      const favoritesData = localStorage.getItem('dogtale-favorites');
      const favorites = favoritesData ? JSON.parse(favoritesData) : [];
      const favoriteCount = favorites.length;
      const uniqueBreeds = new Set(favorites.map(f => f.breed).filter(Boolean));

      // Pets count
      const petsData = localStorage.getItem('dogtale-pets');
      const pets = petsData ? JSON.parse(petsData) : [];
      const petCount = pets.length;

      // Login streak (from settings or local tracking)
      const streakData = localStorage.getItem('dogtale-login-streak');
      let loginStreak = 0;
      if (streakData) {
        const streak = JSON.parse(streakData);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (streak.lastDate === today || streak.lastDate === yesterday) {
          loginStreak = streak.count;
        }
      }

      // Virtual pet level
      const virtualPetData = localStorage.getItem('dogtale-virtual-pet');
      const virtualPet = virtualPetData ? JSON.parse(virtualPetData) : null;

      // Quests completed
      const questsData = localStorage.getItem('dogtale-quests-completed');
      const questsCompleted = questsData ? JSON.parse(questsData).length : 0;

      // Memorials (from memorial storage)
      const memorialsData = localStorage.getItem('dogtale-memorials');
      const memorials = memorialsData ? JSON.parse(memorialsData) : [];

      const stats = {
        journal_count: journalCount,
        favorite_count: favoriteCount,
        breed_count: uniqueBreeds.size,
        pet_count: petCount,
        login_streak: loginStreak,
        virtual_pet_level: virtualPet?.level || 0,
        has_virtual_pet: virtualPet ? 1 : 0,
        quests_completed: questsCompleted,
        friend_count: 0, // Social features need backend
        health_records: 0,
        activities_created: 0,
        reactions_given: 0,
        battles_completed: 0,
        battles_won: 0,
        gyms_conquered: 0,
        season_level: 0,
        achievement_count: unlockedAchievements.length,
      };

      return stats;
    } catch (err) {
      console.error('Error loading local stats:', err);
      return null;
    }
  }, [unlockedAchievements.length]);

  /**
   * Load achievement stats from database or local storage
   */
  const loadStats = useCallback(async () => {
    // Always try to load local stats first for immediate display
    const localStats = loadLocalStats();
    if (localStats) {
      setAchievementStats(localStats);
      localStorage.setItem(ACHIEVEMENT_STATS_KEY, JSON.stringify(localStats));
    }

    // If offline or no user, we're done
    if (!user?.id || !isOnlineMode) {
      return;
    }

    try {
      // Fetch all stats in parallel
      const [
        journalResult,
        friendsResult,
        petsResult,
        healthResult,
        profileResult,
        questsResult,
        battleResult,
        activityResult,
        reactionsResult,
      ] = await Promise.all([
        // Journal count
        supabase.from('journal_entries').select('id', { count: 'exact' }).eq('user_id', user.id),
        // Friends count
        supabase.from('friendships').select('id', { count: 'exact' }).or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status', 'accepted'),
        // Pets count
        supabase.from('pets').select('id', { count: 'exact' }).eq('owner_id', user.id),
        // Health records count
        supabase.from('health_records').select('id', { count: 'exact' }),
        // Profile data (for streak, level, etc.)
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        // Completed quests
        supabase.from('quests').select('id', { count: 'exact' }).eq('user_id', user.id).not('completed_at', 'is', null),
        // Battle history
        supabase.from('battle_results').select('*').or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`),
        // Activities created
        supabase.from('activities').select('id', { count: 'exact' }).eq('user_id', user.id),
        // Reactions given
        supabase.from('activity_reactions').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      // Process battle results
      const battleData = battleResult.data || [];
      const battlesWon = battleData.filter(b => b.winner_id === user.id).length;
      const battlesCompleted = battleData.length;

      // Get gym badges count
      const { count: gymBadgeCount } = await supabase
        .from('achievements')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .like('achievement_key', 'gym_badge_%');

      // Get virtual pet level
      const { data: virtualPet } = await supabase
        .from('virtual_pets')
        .select('level')
        .eq('user_id', user.id)
        .single();

      // Get favorites count from localStorage (client-side data)
      const favoritesData = localStorage.getItem('dogtale-favorites');
      const favorites = favoritesData ? JSON.parse(favoritesData) : [];

      // Get breed and location counts from collections
      const { data: breedData } = await supabase
        .from('favorites')
        .select('breed')
        .eq('user_id', user.id)
        .not('breed', 'is', null);

      const uniqueBreeds = new Set((breedData || []).map(b => b.breed).filter(Boolean));

      const stats = {
        journal_count: journalResult.count || 0,
        friend_count: friendsResult.count || 0,
        pet_count: petsResult.count || 0,
        health_records: healthResult.count || 0,
        login_streak: profileResult.data?.streak || 0,
        quests_completed: questsResult.count || 0,
        battles_completed: battlesCompleted,
        battles_won: battlesWon,
        gyms_conquered: gymBadgeCount || 0,
        activities_created: activityResult.count || 0,
        reactions_given: reactionsResult.count || 0,
        favorite_count: favorites.length,
        breed_count: uniqueBreeds.size,
        virtual_pet_level: virtualPet?.level || 0,
        has_virtual_pet: virtualPet ? 1 : 0,
        season_level: profileResult.data?.season_level || 0,
        achievement_count: unlockedAchievements.length,
      };

      setAchievementStats(stats);
      lastStatsRef.current = stats;
      localStorage.setItem(ACHIEVEMENT_STATS_KEY, JSON.stringify(stats));
    } catch (err) {
      console.error('Error loading achievement stats:', err);
    }
  }, [user?.id, unlockedAchievements.length, loadLocalStats]);

  /**
   * Check if an achievement should be unlocked
   */
  const checkAchievement = useCallback((achievementKey, currentValue) => {
    const achievement = getAchievementDefinition(achievementKey);
    if (!achievement) return false;

    // Check if already unlocked
    if (unlockedAchievements.some(a => a.achievement_key === achievementKey)) {
      return false;
    }

    // Check threshold
    return currentValue >= achievement.threshold;
  }, [unlockedAchievements]);

  /**
   * Unlock an achievement
   */
  const unlockAchievement = useCallback(async (achievementKey) => {
    const achievement = getAchievementDefinition(achievementKey);
    if (!achievement) return null;

    // Prevent duplicate unlocks
    if (unlockedAchievements.some(a => a.achievement_key === achievementKey)) {
      return null;
    }

    // Prevent concurrent checks for the same achievement
    if (checkInProgressRef.current.has(achievementKey)) {
      return null;
    }

    checkInProgressRef.current.add(achievementKey);

    try {
      const xpReward = calculateAchievementXp(achievement);
      const now = new Date().toISOString();

      const newAchievement = {
        achievement_key: achievementKey,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xp_awarded: xpReward,
        achieved_at: now,
        category: achievement.category,
        rarity: achievement.rarity.name,
      };

      // Save to database if online
      if (isOnlineMode && user?.id) {
        const { error } = await supabase.from('achievements').insert({
          user_id: user.id,
          achievement_key: achievementKey,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          xp_awarded: xpReward,
        });

        if (error) {
          // Check if it's a duplicate error (already exists)
          if (error.code === '23505') {
            checkInProgressRef.current.delete(achievementKey);
            return null;
          }
          throw error;
        }

        // Award XP
        await supabase.rpc('add_user_xp', {
          p_user_id: user.id,
          p_xp: xpReward,
        });
      }

      // Update local state
      setUnlockedAchievements(prev => {
        const updated = [newAchievement, ...prev];
        localStorage.setItem(ACHIEVEMENTS_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      // Add to pending notifications
      setPendingNotifications(prev => [...prev, {
        ...newAchievement,
        id: `${achievementKey}-${Date.now()}`,
      }]);

      return newAchievement;
    } catch (err) {
      console.error('Error unlocking achievement:', err);
      return null;
    } finally {
      checkInProgressRef.current.delete(achievementKey);
    }
  }, [user?.id, unlockedAchievements]);

  /**
   * Trigger achievement check for a specific type
   * This is called by other hooks when actions occur
   */
  const triggerAchievementCheck = useCallback(async (checkType, value) => {
    // Find all achievements that use this check type
    const relevantAchievements = Object.values(ACHIEVEMENT_DEFINITIONS).filter(
      a => a.checkType === checkType
    );

    const unlocked = [];

    for (const achievement of relevantAchievements) {
      if (checkAchievement(achievement.key, value)) {
        const result = await unlockAchievement(achievement.key);
        if (result) {
          unlocked.push(result);
        }
      }
    }

    // Also check meta achievements (like completionist)
    if (checkType !== 'achievement_count') {
      const achievementCount = unlockedAchievements.length + unlocked.length;
      const completionistAchievements = Object.values(ACHIEVEMENT_DEFINITIONS).filter(
        a => a.checkType === 'achievement_count'
      );

      for (const achievement of completionistAchievements) {
        if (checkAchievement(achievement.key, achievementCount)) {
          const result = await unlockAchievement(achievement.key);
          if (result) {
            unlocked.push(result);
          }
        }
      }
    }

    return unlocked;
  }, [checkAchievement, unlockAchievement, unlockedAchievements.length]);

  /**
   * Batch check all achievements against current stats
   */
  const checkAllAchievements = useCallback(async () => {
    if (!achievementStats || Object.keys(achievementStats).length === 0) {
      return;
    }

    const unlocked = [];

    for (const achievement of Object.values(ACHIEVEMENT_DEFINITIONS)) {
      const currentValue = achievementStats[achievement.checkType];

      if (currentValue !== undefined && checkAchievement(achievement.key, currentValue)) {
        const result = await unlockAchievement(achievement.key);
        if (result) {
          unlocked.push(result);
        }
      }
    }

    return unlocked;
  }, [achievementStats, checkAchievement, unlockAchievement]);

  /**
   * Dismiss a notification
   */
  const dismissNotification = useCallback((notificationId) => {
    setPendingNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setPendingNotifications([]);
  }, []);

  /**
   * Get progress for a specific achievement
   */
  const getAchievementProgress = useCallback((achievementKey) => {
    const achievement = getAchievementDefinition(achievementKey);
    if (!achievement) return null;

    const isUnlocked = unlockedAchievements.some(a => a.achievement_key === achievementKey);
    const currentValue = achievementStats[achievement.checkType] || 0;
    const progress = Math.min(100, (currentValue / achievement.threshold) * 100);

    return {
      ...achievement,
      isUnlocked,
      currentValue,
      progress,
      xpReward: calculateAchievementXp(achievement),
    };
  }, [unlockedAchievements, achievementStats]);

  /**
   * Get all achievements with progress
   */
  const getAllAchievementsWithProgress = useCallback(() => {
    return ACHIEVEMENT_KEYS.map(key => getAchievementProgress(key)).filter(Boolean);
  }, [getAchievementProgress]);

  // Load achievements on mount and auth change
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Load stats periodically
  useEffect(() => {
    if (isAuthenticated) {
      loadStats();

      // Refresh stats every 5 minutes
      const interval = setInterval(loadStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadStats]);

  // Check achievements when stats change
  useEffect(() => {
    if (Object.keys(achievementStats).length > 0) {
      checkAllAchievements();
    }
  }, [achievementStats, checkAllAchievements]);

  // Subscribe to real-time achievement updates
  useEffect(() => {
    if (!isOnlineMode || !user?.id) return;

    const subscription = supabase
      .channel(`achievements-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Achievement was unlocked (possibly from another device)
          const newAchievement = payload.new;
          setUnlockedAchievements(prev => {
            if (prev.some(a => a.achievement_key === newAchievement.achievement_key)) {
              return prev;
            }
            const updated = [newAchievement, ...prev];
            localStorage.setItem(ACHIEVEMENTS_CACHE_KEY, JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  /**
   * Update login streak (call on app load)
   */
  const updateLoginStreak = useCallback(() => {
    try {
      const today = new Date().toDateString();
      const streakData = localStorage.getItem('dogtale-login-streak');
      let streak = streakData ? JSON.parse(streakData) : { count: 0, lastDate: null };

      if (streak.lastDate === today) {
        // Already logged in today
        return streak.count;
      }

      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (streak.lastDate === yesterday) {
        // Continuing streak
        streak.count += 1;
      } else {
        // Streak broken, start new
        streak.count = 1;
      }

      streak.lastDate = today;
      localStorage.setItem('dogtale-login-streak', JSON.stringify(streak));

      // Trigger achievement check for streak
      triggerAchievementCheck('login_streak', streak.count);

      return streak.count;
    } catch (err) {
      console.error('Error updating login streak:', err);
      return 0;
    }
  }, [triggerAchievementCheck]);

  /**
   * Increment a local stat and trigger achievement check
   */
  const incrementLocalStat = useCallback((statType, amount = 1) => {
    const newStats = { ...achievementStats };
    newStats[statType] = (newStats[statType] || 0) + amount;
    setAchievementStats(newStats);
    localStorage.setItem(ACHIEVEMENT_STATS_KEY, JSON.stringify(newStats));

    // Trigger achievement check
    triggerAchievementCheck(statType, newStats[statType]);

    return newStats[statType];
  }, [achievementStats, triggerAchievementCheck]);

  // Track login streak on mount
  useEffect(() => {
    updateLoginStreak();
  }, [updateLoginStreak]);

  const value = {
    // State
    unlockedAchievements,
    pendingNotifications,
    achievementStats,
    loading,

    // Computed
    totalUnlocked: unlockedAchievements.length,
    totalAchievements: ACHIEVEMENT_KEYS.length,
    completionPercentage: Math.round((unlockedAchievements.length / ACHIEVEMENT_KEYS.length) * 100),
    hasNotifications: pendingNotifications.length > 0,

    // Actions
    triggerAchievementCheck,
    checkAllAchievements,
    loadAchievements,
    loadStats,
    dismissNotification,
    clearAllNotifications,
    updateLoginStreak,
    incrementLocalStat,

    // Helpers
    getAchievementProgress,
    getAllAchievementsWithProgress,
    isAchievementUnlocked: (key) => unlockedAchievements.some(a => a.achievement_key === key),
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

/**
 * Hook to use achievement context
 */
export function useAchievements() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
}

export default AchievementContext;
