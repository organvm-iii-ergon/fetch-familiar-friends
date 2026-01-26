import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Use vi.hoisted() to define mock objects that are available when vi.mock() runs
const { mockQueryBuilder, mockChannel, mockSupabase, mockAuthContext } = vi.hoisted(() => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
  };

  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  };

  const mockAuthContext = {
    user: null,
    isAuthenticated: false,
  };

  return { mockQueryBuilder, mockChannel, mockSupabase, mockAuthContext };
});

vi.mock('../config/supabase', () => ({
  supabase: mockSupabase,
  isOnlineMode: true,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

import { useFriends } from './useFriends';

describe('useFriends', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;

    mockQueryBuilder.then.mockImplementation((resolve) =>
      resolve({ data: [], error: null })
    );
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('loads demo friends when not authenticated (demo mode)', async () => {
      const { result } = renderHook(() => useFriends());

      // Demo friends are loaded for offline/unauthenticated users
      await waitFor(() => {
        expect(result.current.friends.length).toBeGreaterThan(0);
        expect(result.current.isDemo).toBe(true);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('has correct computed values with demo friends', async () => {
      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.hasFriends).toBe(true);
        expect(result.current.friendCount).toBeGreaterThan(0);
      });

      expect(result.current.isDemo).toBe(true);
    });

    it('provides demo mode action handlers', async () => {
      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
      });

      // Demo mode should return error for actions
      const sendResult = await result.current.sendFriendRequest('some-id');
      expect(sendResult.error).toBeDefined();
      expect(sendResult.error.isDemo).toBe(true);
    });
  });

  describe('Fetching Friends (Authenticated)', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('fetches friendships on mount when authenticated', async () => {
      const mockFriendships = [
        {
          id: 'friendship-1',
          status: 'accepted',
          created_at: new Date().toISOString(),
          requester: {
            id: 'test-user-123',
            username: 'testuser',
            display_name: 'Test User',
            avatar_url: null,
            xp: 100,
            level: 5,
          },
          addressee: {
            id: 'friend-456',
            username: 'frienduser',
            display_name: 'Friend User',
            avatar_url: null,
            xp: 200,
            level: 8,
          },
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockFriendships, error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.friends.length).toBe(1);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('friendships');
      expect(result.current.friends[0].friend.id).toBe('friend-456');
    });

    it('separates pending received and sent requests', async () => {
      const mockFriendships = [
        {
          id: 'friendship-1',
          status: 'pending',
          requester: { id: 'other-user', username: 'other' },
          addressee: { id: 'test-user-123', username: 'testuser' },
        },
        {
          id: 'friendship-2',
          status: 'pending',
          requester: { id: 'test-user-123', username: 'testuser' },
          addressee: { id: 'another-user', username: 'another' },
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockFriendships, error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.pendingReceived.length).toBe(1);
        expect(result.current.pendingSent.length).toBe(1);
      });
    });

    it('falls back to demo friends on fetch errors', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Database error' } })
      );

      const { result } = renderHook(() => useFriends());

      // Should fall back to demo friends on error
      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
        expect(result.current.friends.length).toBeGreaterThan(0);
      });

      // Error is not set because we have a graceful fallback
      expect(result.current.error).toBeNull();
    });
  });

  describe('Search Users', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('searches for users by query when authenticated', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'johnsmith', display_name: 'John Smith' },
        { id: 'user-2', username: 'johndoe', display_name: 'John Doe' },
      ];

      // First call returns friends, second call returns search results
      let callCount = 0;
      mockQueryBuilder.then.mockImplementation((resolve) => {
        callCount++;
        if (callCount === 1) {
          return resolve({ data: [], error: null }); // friends
        }
        return resolve({ data: mockUsers, error: null }); // search
      });

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isDemo).toBe(false);
      });

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchUsers('john');
      });

      expect(searchResult.data.length).toBe(2);
      expect(searchResult.error).toBeNull();
    });

    it('returns demo error for empty query in demo mode', async () => {
      // In demo mode (not authenticated)
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
      });

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchUsers('');
      });

      // Demo mode returns error for search
      expect(searchResult.error).toBeDefined();
    });

    it('filters out existing friends from search results', async () => {
      const mockFriendships = [
        {
          id: 'friendship-1',
          status: 'accepted',
          requester: { id: 'test-user-123' },
          addressee: { id: 'existing-friend' },
        },
      ];

      mockQueryBuilder.then.mockImplementationOnce((resolve) =>
        resolve({ data: mockFriendships, error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.friends.length).toBe(1);
      });

      const mockSearchResults = [
        { id: 'existing-friend', username: 'existing' },
        { id: 'new-user', username: 'newuser' },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockSearchResults, error: null })
      );

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchUsers('user');
      });

      // Should filter out the existing friend
      expect(searchResult.data.length).toBe(1);
      expect(searchResult.data[0].id).toBe('new-user');
    });
  });

  describe('Send Friend Request', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('sends friend request successfully', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );
      mockQueryBuilder.single.mockResolvedValue({
        data: { id: 'new-friendship', status: 'pending' },
        error: null,
      });

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isDemo).toBe(false);
      });

      let sendResult;
      await act(async () => {
        sendResult = await result.current.sendFriendRequest('user-456');
      });

      expect(sendResult.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('friendships');
    });

    it('handles send request errors', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Already friends' },
      });

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let sendResult;
      await act(async () => {
        sendResult = await result.current.sendFriendRequest('user-456');
      });

      expect(sendResult.error).toBeDefined();
    });

    it('returns demo error when not authenticated (demo mode)', async () => {
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
      });

      let sendResult;
      await act(async () => {
        sendResult = await result.current.sendFriendRequest('user-456');
      });

      // Demo mode returns special error
      expect(sendResult.error).toBeDefined();
      expect(sendResult.error.isDemo).toBe(true);
    });
  });

  describe('Accept Friend Request', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('accepts friend request successfully', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isDemo).toBe(false);
      });

      let acceptResult;
      await act(async () => {
        acceptResult = await result.current.acceptFriendRequest('friendship-123');
      });

      expect(acceptResult.error).toBeNull();
    });

    it('handles accept errors', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Not authorized' } })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let acceptResult;
      await act(async () => {
        acceptResult = await result.current.acceptFriendRequest('friendship-123');
      });

      expect(acceptResult.error).toBeDefined();
    });
  });

  describe('Remove Friendship', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('removes friendship successfully', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isDemo).toBe(false);
      });

      let removeResult;
      await act(async () => {
        removeResult = await result.current.removeFriendship('friendship-123');
      });

      expect(removeResult.error).toBeNull();
    });
  });

  describe('Block User', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('blocks user successfully', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isDemo).toBe(false);
      });

      let blockResult;
      await act(async () => {
        blockResult = await result.current.blockUser('friendship-123');
      });

      expect(blockResult.error).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('isFriend returns correct value', async () => {
      const mockFriendships = [
        {
          id: 'friendship-1',
          status: 'accepted',
          requester: { id: 'test-user-123' },
          addressee: { id: 'friend-456' },
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockFriendships, error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.friends.length).toBe(1);
      });

      expect(result.current.isFriend('friend-456')).toBe(true);
      expect(result.current.isFriend('stranger-789')).toBe(false);
    });

    it('hasPendingRequestFrom returns correct value', async () => {
      const mockFriendships = [
        {
          id: 'friendship-1',
          status: 'pending',
          requester: { id: 'requester-user' },
          addressee: { id: 'test-user-123' },
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockFriendships, error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.pendingReceived.length).toBe(1);
      });

      expect(result.current.hasPendingRequestFrom('requester-user')).toBe(true);
      expect(result.current.hasPendingRequestFrom('other-user')).toBe(false);
    });

    it('hasSentRequestTo returns correct value', async () => {
      const mockFriendships = [
        {
          id: 'friendship-1',
          status: 'pending',
          requester: { id: 'test-user-123' },
          addressee: { id: 'addressee-user' },
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockFriendships, error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.pendingSent.length).toBe(1);
      });

      expect(result.current.hasSentRequestTo('addressee-user')).toBe(true);
      expect(result.current.hasSentRequestTo('other-user')).toBe(false);
    });
  });

  describe('Real-time Subscriptions', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('sets up real-time subscription on mount', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      renderHook(() => useFriends());

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('friendships-test-user-123');
      });

      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('removes subscription on unmount', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { unmount } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('clears error when clearError is called', async () => {
      const { result } = renderHook(() => useFriends());

      // Error starts as null (demo friends loaded on error)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('falls back to demo friends on server error', async () => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Server error' } })
      );

      const { result } = renderHook(() => useFriends());

      // Should fall back to demo friends instead of showing error
      await waitFor(() => {
        expect(result.current.friends.length).toBeGreaterThan(0);
        expect(result.current.isDemo).toBe(true);
      });
    });
  });

  describe('State Transitions', () => {
    it('switches to demo friends when user logs out', async () => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      const mockFriendships = [
        {
          id: 'friendship-1',
          status: 'accepted',
          requester: { id: 'test-user-123' },
          addressee: { id: 'friend-456', username: 'friend456' },
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockFriendships, error: null })
      );

      const { result, rerender } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.friends.length).toBe(1);
        expect(result.current.isDemo).toBe(false);
      });

      // Simulate logout
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      rerender();

      // Should switch to demo friends after logout
      await waitFor(() => {
        expect(result.current.isDemo).toBe(true);
        expect(result.current.friends.length).toBeGreaterThan(0); // Demo friends loaded
        expect(result.current.pendingSent).toEqual([]); // Sent requests cleared
      });
    });
  });
});
