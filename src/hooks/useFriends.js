import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

// Demo friends for offline/demo mode
const DEMO_FRIENDS = [
  {
    id: 'demo-friend-1',
    username: 'PawsomePete',
    display_name: 'Pete',
    avatar_url: null,
    xp: 2450,
    level: 12,
    bio: 'Dog dad of 3 golden retrievers',
    pet_name: 'Max',
    pet_type: 'dog',
    last_active: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'demo-friend-2',
    username: 'WhiskerWonder',
    display_name: 'Sarah',
    avatar_url: null,
    xp: 2100,
    level: 10,
    bio: 'Cat mom extraordinaire',
    pet_name: 'Mittens',
    pet_type: 'cat',
    last_active: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  },
  {
    id: 'demo-friend-3',
    username: 'FurryFriend42',
    display_name: 'Mike',
    avatar_url: null,
    xp: 1850,
    level: 9,
    bio: 'Rescue advocate',
    pet_name: 'Buddy',
    pet_type: 'dog',
    last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'demo-friend-4',
    username: 'DoggoMaster',
    display_name: 'Emma',
    avatar_url: null,
    xp: 1600,
    level: 8,
    bio: 'Training enthusiast',
    pet_name: 'Luna',
    pet_type: 'dog',
    last_active: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 'demo-friend-5',
    username: 'CatCraze',
    display_name: 'Alex',
    avatar_url: null,
    xp: 1400,
    level: 7,
    bio: 'Proud parent of a maine coon',
    pet_name: 'Whiskers',
    pet_type: 'cat',
    last_active: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
];

// Demo pending requests
const DEMO_PENDING_RECEIVED = [
  {
    id: 'demo-pending-1',
    friend: {
      id: 'demo-requester-1',
      username: 'NewPetPal',
      display_name: 'Jordan',
      avatar_url: null,
      xp: 500,
      level: 3,
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Hook for managing friendships
 * @returns {Object} Friends state and methods
 */
export function useFriends() {
  const { user, isAuthenticated } = useAuth();

  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load demo friends for offline mode
  const loadDemoFriends = useCallback(() => {
    setIsDemo(true);

    // Convert demo friends to the expected format
    const demoFriendsList = DEMO_FRIENDS.map(friend => ({
      id: `friendship-${friend.id}`,
      status: 'accepted',
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      friend,
    }));

    setFriends(demoFriendsList);
    setPendingReceived(DEMO_PENDING_RECEIVED);
    setPendingSent([]);
  }, []);

  // Fetch all friendships
  const fetchFriends = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load demo friends for offline mode
      loadDemoFriends();
      return;
    }

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

      // Server returned data (even if empty) - not demo mode
      setIsDemo(false);

      // If no friendships, set empty arrays (user has no friends yet)
      if (!friendships || friendships.length === 0) {
        setFriends([]);
        setPendingReceived([]);
        setPendingSent([]);
        setLoading(false);
        return;
      }

      // Sort into categories
      const accepted = [];
      const receivedRequests = [];
      const sentRequests = [];

      friendships.forEach(friendship => {
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
      // Fall back to demo on error
      loadDemoFriends();
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadDemoFriends]);

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

  // Fetch friends on mount - always show friends (demo if offline/unauthenticated)
  useEffect(() => {
    if (isAuthenticated && isOnlineMode) {
      fetchFriends();
    } else {
      // Load demo friends for offline/unauthenticated users
      loadDemoFriends();
    }
  }, [isAuthenticated, fetchFriends, loadDemoFriends]);

  // Get friend by ID
  const getFriend = useCallback((friendId) => {
    return friends.find(f => f.friend.id === friendId)?.friend || null;
  }, [friends]);

  // Get online friends (active in last 15 minutes)
  const getOnlineFriends = useCallback(() => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return friends.filter(f => {
      const lastActive = f.friend.last_active ? new Date(f.friend.last_active) : null;
      return lastActive && lastActive > fifteenMinutesAgo;
    });
  }, [friends]);

  // Get recently active friends (active in last 24 hours)
  const getRecentlyActiveFriends = useCallback(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return friends.filter(f => {
      const lastActive = f.friend.last_active ? new Date(f.friend.last_active) : null;
      return lastActive && lastActive > oneDayAgo;
    });
  }, [friends]);

  // Demo mode action handlers (show info message instead of actual action)
  const demoAction = useCallback((actionName) => {
    if (isDemo) {
      return {
        error: {
          message: `${actionName} is not available in demo mode. Sign in to connect with real friends!`,
          isDemo: true,
        }
      };
    }
    return null;
  }, [isDemo]);

  return {
    // State
    friends,
    pendingReceived,
    pendingSent,
    isDemo,
    loading,
    error,

    // Computed
    friendCount: friends.length,
    pendingCount: pendingReceived.length,
    hasFriends: friends.length > 0,
    hasPendingRequests: pendingReceived.length > 0,
    onlineFriends: getOnlineFriends(),
    onlineCount: getOnlineFriends().length,
    recentlyActiveFriends: getRecentlyActiveFriends(),

    // Actions
    fetchFriends,
    searchUsers: isDemo ? () => demoAction('Search') || searchUsers : searchUsers,
    sendFriendRequest: isDemo ? () => Promise.resolve(demoAction('Send friend request')) : sendFriendRequest,
    acceptFriendRequest: isDemo ? () => Promise.resolve(demoAction('Accept friend request')) : acceptFriendRequest,
    removeFriendship: isDemo ? () => Promise.resolve(demoAction('Remove friend')) : removeFriendship,
    blockUser: isDemo ? () => Promise.resolve(demoAction('Block user')) : blockUser,
    loadDemoFriends,

    // Helpers
    getFriend,
    getOnlineFriends,
    getRecentlyActiveFriends,
    isFriend: (userId) => friends.some(f => f.friend.id === userId),
    hasPendingRequestFrom: (userId) => pendingReceived.some(f => f.friend.id === userId),
    hasSentRequestTo: (userId) => pendingSent.some(f => f.friend.id === userId),

    // Clear error
    clearError: () => setError(null),
  };
}

export default useFriends;
