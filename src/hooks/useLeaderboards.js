import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch global leaderboard (top users by XP)
  const fetchGlobalLeaderboard = useCallback(async (limit = 50) => {
    if (!isOnlineMode) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, xp, level, streak_days')
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

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
      setError(err.message);
    }
  }, [user?.id]);

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

    await Promise.all([
      fetchGlobalLeaderboard(),
      fetchFriendsLeaderboard(),
      fetchWeeklyLeaderboard(),
    ]);

    setLoading(false);
  }, [fetchGlobalLeaderboard, fetchFriendsLeaderboard, fetchWeeklyLeaderboard]);

  // Fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAll();
    } else {
      setGlobalLeaderboard([]);
      setFriendsLeaderboard([]);
      setWeeklyLeaderboard([]);
      setUserRank(null);
    }
  }, [isAuthenticated, fetchAll]);

  return {
    // State
    globalLeaderboard,
    friendsLeaderboard,
    weeklyLeaderboard,
    userRank,
    loading,
    error,

    // Computed
    userGlobalPosition: userRank,
    userFriendsPosition: friendsLeaderboard.find(e => e.isCurrentUser)?.rank,
    topGlobalUser: globalLeaderboard[0],
    topFriend: friendsLeaderboard[0],

    // Actions
    fetchAll,
    fetchGlobalLeaderboard,
    fetchFriendsLeaderboard,
    fetchWeeklyLeaderboard,
    refresh: fetchAll,

    // Clear error
    clearError: () => setError(null),
  };
}

export default useLeaderboards;
