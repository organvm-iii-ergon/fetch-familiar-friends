import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

/**
 * Hook for managing friendships
 * @returns {Object} Friends state and methods
 */
export function useFriends() {
  const { user, isAuthenticated } = useAuth();

  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all friendships
  const fetchFriends = useCallback(async () => {
    if (!isOnlineMode || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch accepted friendships
      const { data: friendships, error: fetchError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          created_at,
          requester:profiles!friendships_requester_id_fkey(
            id, username, display_name, avatar_url, xp, level
          ),
          addressee:profiles!friendships_addressee_id_fkey(
            id, username, display_name, avatar_url, xp, level
          )
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (fetchError) throw fetchError;

      // Sort into categories
      const accepted = [];
      const receivedRequests = [];
      const sentRequests = [];

      friendships?.forEach(friendship => {
        const isRequester = friendship.requester.id === user.id;
        const friend = isRequester ? friendship.addressee : friendship.requester;

        if (friendship.status === 'accepted') {
          accepted.push({ ...friendship, friend });
        } else if (friendship.status === 'pending') {
          if (isRequester) {
            sentRequests.push({ ...friendship, friend });
          } else {
            receivedRequests.push({ ...friendship, friend });
          }
        }
      });

      setFriends(accepted);
      setPendingReceived(receivedRequests);
      setPendingSent(sentRequests);

    } catch (err) {
      console.error('Error fetching friends:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Search for users to add as friends
  const searchUsers = useCallback(async (query) => {
    if (!isOnlineMode || !user?.id || !query.trim()) {
      return { data: [], error: null };
    }

    try {
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, xp, level')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(20);

      if (searchError) throw searchError;

      // Filter out existing friends and pending requests
      const existingIds = new Set([
        ...friends.map(f => f.friend.id),
        ...pendingSent.map(f => f.friend.id),
        ...pendingReceived.map(f => f.friend.id),
      ]);

      const filtered = data.filter(u => !existingIds.has(u.id));
      return { data: filtered, error: null };

    } catch (err) {
      console.error('Error searching users:', err);
      return { data: [], error: err };
    }
  }, [user?.id, friends, pendingSent, pendingReceived]);

  // Send friend request
  const sendFriendRequest = useCallback(async (addresseeId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: requestError } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      await fetchFriends();
      return { data, error: null };

    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchFriends]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (friendshipId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: acceptError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .eq('addressee_id', user.id);

      if (acceptError) throw acceptError;

      await fetchFriends();
      return { error: null };

    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchFriends]);

  // Decline/cancel friend request
  const removeFriendship = useCallback(async (friendshipId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (deleteError) throw deleteError;

      await fetchFriends();
      return { error: null };

    } catch (err) {
      console.error('Error removing friendship:', err);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchFriends]);

  // Block a user
  const blockUser = useCallback(async (friendshipId) => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    try {
      const { error: blockError } = await supabase
        .from('friendships')
        .update({ status: 'blocked' })
        .eq('id', friendshipId);

      if (blockError) throw blockError;

      await fetchFriends();
      return { error: null };

    } catch (err) {
      console.error('Error blocking user:', err);
      return { error: err };
    }
  }, [user?.id, fetchFriends]);

  // Subscribe to real-time friendship updates
  useEffect(() => {
    if (!isOnlineMode || !isAuthenticated || !user?.id) return;

    const subscription = supabase
      .channel(`friendships-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${user.id}`,
        },
        () => fetchFriends()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`,
        },
        () => fetchFriends()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated, user?.id, fetchFriends]);

  // Fetch friends on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchFriends();
    } else {
      setFriends([]);
      setPendingReceived([]);
      setPendingSent([]);
    }
  }, [isAuthenticated, fetchFriends]);

  return {
    // State
    friends,
    pendingReceived,
    pendingSent,
    loading,
    error,

    // Computed
    friendCount: friends.length,
    pendingCount: pendingReceived.length,
    hasFriends: friends.length > 0,
    hasPendingRequests: pendingReceived.length > 0,

    // Actions
    fetchFriends,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendship,
    blockUser,

    // Helpers
    isFriend: (userId) => friends.some(f => f.friend.id === userId),
    hasPendingRequestFrom: (userId) => pendingReceived.some(f => f.friend.id === userId),
    hasSentRequestTo: (userId) => pendingSent.some(f => f.friend.id === userId),

    // Clear error
    clearError: () => setError(null),
  };
}

export default useFriends;
