import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

/**
 * Hook for managing activity feed with real-time updates
 * @param {Object} options
 * @param {'friends' | 'public' | 'own'} options.feedType - Type of feed to display
 * @param {number} options.pageSize - Number of items per page
 * @returns {Object} Activity feed state and methods
 */
export function useActivityFeed(options = {}) {
  const { feedType = 'friends', pageSize = 20 } = options;
  const { user, isAuthenticated } = useAuth();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const offsetRef = useRef(0);

  // Build query based on feed type
  const buildQuery = useCallback((offset = 0) => {
    let query = supabase
      .from('activities')
      .select(`
        *,
        user:profiles!activities_user_id_fkey(
          id, username, display_name, avatar_url, level
        ),
        pet:pets(id, name, species, avatar_url),
        reactions:activity_reactions(id, user_id, reaction_type),
        comments:comments(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (feedType === 'own') {
      query = query.eq('user_id', user.id);
    } else if (feedType === 'public') {
      query = query.eq('visibility', 'public');
    }
    // For 'friends', RLS will handle filtering

    return query;
  }, [feedType, user?.id, pageSize]);

  // Fetch initial activities
  const fetchActivities = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Return mock data for offline/unauthenticated
      return;
    }

    setLoading(true);
    setError(null);
    offsetRef.current = 0;

    try {
      const { data, error: fetchError } = await buildQuery(0);

      if (fetchError) throw fetchError;

      // Process activities to add computed fields
      const processed = processActivities(data || [], user.id);
      setActivities(processed);
      setHasMore((data?.length || 0) >= pageSize);

    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, buildQuery, pageSize]);

  // Load more activities (pagination)
  const loadMore = useCallback(async () => {
    if (!isOnlineMode || !user?.id || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const newOffset = offsetRef.current + pageSize;

    try {
      const { data, error: fetchError } = await buildQuery(newOffset);

      if (fetchError) throw fetchError;

      const processed = processActivities(data || [], user.id);
      setActivities(prev => [...prev, ...processed]);
      setHasMore((data?.length || 0) >= pageSize);
      offsetRef.current = newOffset;

    } catch (err) {
      console.error('Error loading more activities:', err);
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.id, loadingMore, hasMore, pageSize, buildQuery]);

  // Create a new activity post
  const createActivity = useCallback(async (activityData) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { data, error: createError } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          pet_id: activityData.petId,
          activity_type: activityData.type,
          content: activityData.content,
          image_url: activityData.imageUrl,
          metadata: activityData.metadata || {},
          visibility: activityData.visibility || 'friends',
        })
        .select(`
          *,
          user:profiles!activities_user_id_fkey(
            id, username, display_name, avatar_url, level
          ),
          pet:pets(id, name, species, avatar_url)
        `)
        .single();

      if (createError) throw createError;

      // Add to beginning of feed
      const processed = processActivities([data], user.id);
      setActivities(prev => [...processed, ...prev]);

      return { data, error: null };

    } catch (err) {
      console.error('Error creating activity:', err);
      return { data: null, error: err };
    }
  }, [user?.id]);

  // Delete an activity
  const deleteActivity = useCallback(async (activityId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setActivities(prev => prev.filter(a => a.id !== activityId));
      return { error: null };

    } catch (err) {
      console.error('Error deleting activity:', err);
      return { error: err };
    }
  }, [user?.id]);

  // React to an activity
  const toggleReaction = useCallback(async (activityId, reactionType = 'like') => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      // Check if already reacted
      const activity = activities.find(a => a.id === activityId);
      const existingReaction = activity?.reactions?.find(r => r.user_id === user.id);

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('activity_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add reaction
        await supabase
          .from('activity_reactions')
          .insert({
            activity_id: activityId,
            user_id: user.id,
            reaction_type: reactionType,
          });
      }

      // Update local state optimistically
      setActivities(prev => prev.map(a => {
        if (a.id !== activityId) return a;

        const reactions = existingReaction
          ? a.reactions.filter(r => r.id !== existingReaction.id)
          : [...(a.reactions || []), { id: 'temp', user_id: user.id, reaction_type: reactionType }];

        return {
          ...a,
          reactions,
          hasReacted: !existingReaction,
          reactionCount: reactions.length,
        };
      }));

      return { error: null };

    } catch (err) {
      console.error('Error toggling reaction:', err);
      return { error: err };
    }
  }, [user?.id, activities]);

  // Add a comment
  const addComment = useCallback(async (activityId, content) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { data, error: commentError } = await supabase
        .from('comments')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Update comment count in local state
      setActivities(prev => prev.map(a => {
        if (a.id !== activityId) return a;
        return {
          ...a,
          commentCount: (a.commentCount || 0) + 1,
        };
      }));

      return { data, error: null };

    } catch (err) {
      console.error('Error adding comment:', err);
      return { data: null, error: err };
    }
  }, [user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isOnlineMode || !isAuthenticated || !user?.id) return;

    const subscription = supabase
      .channel('activities-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          // Only add if it matches our feed criteria
          if (feedType === 'own' && payload.new.user_id !== user.id) return;
          if (feedType === 'public' && payload.new.visibility !== 'public') return;

          // Fetch full activity with relations
          fetchActivityById(payload.new.id).then(activity => {
            if (activity) {
              const processed = processActivities([activity], user.id);
              setActivities(prev => [...processed, ...prev]);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated, user?.id, feedType]);

  // Fetch activities on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchActivities();
    } else {
      setActivities([]);
    }
  }, [isAuthenticated, fetchActivities]);

  return {
    // State
    activities,
    loading,
    loadingMore,
    error,
    hasMore,

    // Actions
    fetchActivities,
    loadMore,
    createActivity,
    deleteActivity,
    toggleReaction,
    addComment,
    refresh: fetchActivities,

    // Clear error
    clearError: () => setError(null),
  };
}

// Helper to fetch a single activity by ID
async function fetchActivityById(activityId) {
  const { data } = await supabase
    .from('activities')
    .select(`
      *,
      user:profiles!activities_user_id_fkey(
        id, username, display_name, avatar_url, level
      ),
      pet:pets(id, name, species, avatar_url),
      reactions:activity_reactions(id, user_id, reaction_type),
      comments:comments(count)
    `)
    .eq('id', activityId)
    .single();

  return data;
}

// Helper to process activities and add computed fields
function processActivities(activities, userId) {
  return activities.map(activity => ({
    ...activity,
    hasReacted: activity.reactions?.some(r => r.user_id === userId) || false,
    reactionCount: activity.reactions?.length || 0,
    commentCount: activity.comments?.[0]?.count || 0,
    isOwn: activity.user_id === userId,
    timeAgo: getTimeAgo(activity.created_at),
  }));
}

// Helper to format time ago
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default useActivityFeed;
