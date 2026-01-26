import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';
import { calculateLevelFromXp } from '../utils/questProgress';

// Demo users for offline/demo mode
const DEMO_USERS = [
  { id: 'demo-1', username: 'PawsomePete', display_name: 'Pete', avatar_url: null, xp: 2450, level: 12, streak_days: 45 },
  { id: 'demo-2', username: 'WhiskerWonder', display_name: 'Sarah', avatar_url: null, xp: 2100, level: 10, streak_days: 30 },
  { id: 'demo-3', username: 'FurryFriend42', display_name: 'Mike', avatar_url: null, xp: 1850, level: 9, streak_days: 21 },
  { id: 'demo-4', username: 'DoggoMaster', display_name: 'Emma', avatar_url: null, xp: 1600, level: 8, streak_days: 14 },
  { id: 'demo-5', username: 'CatCraze', display_name: 'Alex', avatar_url: null, xp: 1400, level: 7, streak_days: 18 },
  { id: 'demo-6', username: 'PetPal2024', display_name: 'Jordan', avatar_url: null, xp: 1200, level: 6, streak_days: 12 },
  { id: 'demo-7', username: 'FluffyLover', display_name: 'Chris', avatar_url: null, xp: 950, level: 5, streak_days: 7 },
  { id: 'demo-8', username: 'BarkBuddy', display_name: 'Taylor', avatar_url: null, xp: 750, level: 4, streak_days: 10 },
  { id: 'demo-9', username: 'MeowMixer', display_name: 'Jamie', avatar_url: null, xp: 500, level: 3, streak_days: 5 },
  { id: 'demo-10', username: 'PupPro', display_name: 'Riley', avatar_url: null, xp: 300, level: 2, streak_days: 3 },
];

/**
 * Get local user stats from localStorage
 */
function getLocalUserStats() {
  try {
    // Get XP from quest history
    const questHistory = localStorage.getItem('dogtale-quest-history');
    const totalXp = questHistory ? JSON.parse(questHistory).totalXp || 0 : 0;

    // Get streak from login tracking
    const loginData = localStorage.getItem('dogtale-login-streak');
    const streak = loginData ? JSON.parse(loginData).currentStreak || 0 : 0;

    // Calculate level from XP
    const levelInfo = calculateLevelFromXp(totalXp);

    return {
      xp: totalXp,
      level: levelInfo.level,
      streak_days: streak,
    };
  } catch {
    return { xp: 0, level: 1, streak_days: 0 };
  }
}

/**
 * Generate demo leaderboard with user inserted at appropriate rank
 */
function generateDemoLeaderboard(userStats, userId) {
  const leaderboard = [...DEMO_USERS];

  // Create user entry
  const userEntry = {
    id: userId || 'local-user',
    username: 'You',
    display_name: 'You',
    avatar_url: null,
    xp: userStats.xp,
    level: userStats.level,
    streak_days: userStats.streak_days,
    isCurrentUser: true,
  };

  // Insert user at correct position based on XP
  leaderboard.push(userEntry);
  leaderboard.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.xp - a.xp;
  });

  // Add ranks
  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    isCurrentUser: entry.id === (userId || 'local-user'),
  }));
}

/**
 * Hook for managing leaderboards
 * @returns {Object} Leaderboard state and methods
 */
export function useLeaderboards() {
  const { user, isAuthenticated } = useAuth();

  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, streak_days: 0 });
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load demo leaderboard
  const loadDemoLeaderboard = useCallback(() => {
    const stats = getLocalUserStats();
    setUserStats(stats);
    setIsDemo(true);

    const demoBoard = generateDemoLeaderboard(stats, user?.id);
    setGlobalLeaderboard(demoBoard);

    // Set user rank from demo board
    const userEntry = demoBoard.find(e => e.isCurrentUser);
    setUserRank(userEntry?.rank || null);

    // Create demo friends leaderboard (subset + user)
    const demoFriends = [
      demoBoard.find(e => e.isCurrentUser),
      ...DEMO_USERS.slice(0, 5),
    ].filter(Boolean).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
    setFriendsLeaderboard(demoFriends);

    // Demo weekly (shuffled activities)
    const weeklyDemo = [...DEMO_USERS.slice(0, 8)].map(entry => ({
      ...entry,
      activityCount: Math.floor(Math.random() * 30) + 5,
    }));
    weeklyDemo.push({
      ...demoBoard.find(e => e.isCurrentUser),
      activityCount: Math.floor(Math.random() * 25) + 10,
    });
    weeklyDemo.sort((a, b) => b.activityCount - a.activityCount);
    setWeeklyLeaderboard(weeklyDemo.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })));
  }, [user?.id]);

  // Fetch global leaderboard (top users by XP)
  const fetchGlobalLeaderboard = useCallback(async (limit = 50) => {
    if (!isOnlineMode) {
      loadDemoLeaderboard();
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, xp, level, streak_days')
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      // If no data from server, use demo
      if (!data || data.length === 0) {
        loadDemoLeaderboard();
        return;
      }

      setIsDemo(false);

      // Add rank to each entry
      const ranked = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.id === user?.id,
      }));

      setGlobalLeaderboard(ranked);

      // Find user's rank if not in top results
      if (user?.id && !ranked.some(r => r.isCurrentUser)) {
        const rank = await getUserGlobalRank(user.id);
        setUserRank(rank);
      } else {
        const userEntry = ranked.find(r => r.isCurrentUser);
        setUserRank(userEntry?.rank || null);
      }

    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
      // Fall back to demo on error
      loadDemoLeaderboard();
    }
  }, [user?.id, loadDemoLeaderboard]);

  // Fetch friends leaderboard
  const fetchFriendsLeaderboard = useCallback(async () => {
    if (!isOnlineMode || !user?.id) return;

    try {
      // Get friend IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (!friendships || friendships.length === 0) {
        setFriendsLeaderboard([]);
        return;
      }

      // Extract friend IDs
      const friendIds = friendships.map(f =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      // Include current user
      friendIds.push(user.id);

      // Fetch profiles for friends
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, xp, level, streak_days')
        .in('id', friendIds)
        .order('level', { ascending: false })
        .order('xp', { ascending: false });

      if (fetchError) throw fetchError;

      // Add rank
      const ranked = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.id === user.id,
      }));

      setFriendsLeaderboard(ranked);

    } catch (err) {
      console.error('Error fetching friends leaderboard:', err);
      setError(err.message);
    }
  }, [user?.id]);

  // Fetch weekly activity leaderboard
  const fetchWeeklyLeaderboard = useCallback(async (limit = 50) => {
    if (!isOnlineMode) return;

    try {
      // Get start of current week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Count activities per user this week
      const { data, error: fetchError } = await supabase
        .from('activities')
        .select('user_id, user:profiles!activities_user_id_fkey(id, username, display_name, avatar_url, level)')
        .gte('created_at', startOfWeek.toISOString());

      if (fetchError) throw fetchError;

      // Count activities per user
      const activityCounts = {};
      (data || []).forEach(activity => {
        const userId = activity.user_id;
        if (!activityCounts[userId]) {
          activityCounts[userId] = {
            count: 0,
            user: activity.user,
          };
        }
        activityCounts[userId].count++;
      });

      // Convert to array and sort
      const sorted = Object.entries(activityCounts)
        .map(([userId, data]) => ({
          ...data.user,
          activityCount: data.count,
          isCurrentUser: userId === user?.id,
        }))
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, limit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setWeeklyLeaderboard(sorted);

    } catch (err) {
      console.error('Error fetching weekly leaderboard:', err);
      setError(err.message);
    }
  }, [user?.id]);

  // Get user's global rank
  const getUserGlobalRank = async (userId) => {
    try {
      // Get user's level and XP
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('level, xp')
        .eq('id', userId)
        .single();

      if (!userProfile) return null;

      // Count users with higher score
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or(`level.gt.${userProfile.level},and(level.eq.${userProfile.level},xp.gt.${userProfile.xp})`);

      return (count || 0) + 1;
    } catch {
      return null;
    }
  };

  // Fetch all leaderboards
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // In demo/offline mode, just load demo data
    if (!isOnlineMode) {
      loadDemoLeaderboard();
      setLoading(false);
      return;
    }

    await Promise.all([
      fetchGlobalLeaderboard(),
      fetchFriendsLeaderboard(),
      fetchWeeklyLeaderboard(),
    ]);

    setLoading(false);
  }, [fetchGlobalLeaderboard, fetchFriendsLeaderboard, fetchWeeklyLeaderboard, loadDemoLeaderboard]);

  // Fetch on mount - always show leaderboard (demo if offline/unauthenticated)
  useEffect(() => {
    if (isAuthenticated && isOnlineMode) {
      fetchAll();
    } else {
      // Load demo leaderboard for offline/unauthenticated users
      loadDemoLeaderboard();
    }
  }, [isAuthenticated, fetchAll, loadDemoLeaderboard]);

  return {
    // State
    globalLeaderboard,
    friendsLeaderboard,
    weeklyLeaderboard,
    userRank,
    userStats,
    isDemo,
    loading,
    error,

    // Computed
    userGlobalPosition: userRank,
    userFriendsPosition: friendsLeaderboard.find(e => e.isCurrentUser)?.rank,
    userWeeklyPosition: weeklyLeaderboard.find(e => e.isCurrentUser)?.rank,
    topGlobalUser: globalLeaderboard[0],
    topFriend: friendsLeaderboard[0],
    topWeekly: weeklyLeaderboard[0],
    userEntry: globalLeaderboard.find(e => e.isCurrentUser),
    totalPlayers: globalLeaderboard.length,

    // Actions
    fetchAll,
    fetchGlobalLeaderboard,
    fetchFriendsLeaderboard,
    fetchWeeklyLeaderboard,
    loadDemoLeaderboard,
    refresh: fetchAll,

    // Clear error
    clearError: () => setError(null),
  };
}

export default useLeaderboards;
