import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the supabase module
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

vi.mock('../config/supabase', () => ({
  supabase: mockSupabase,
  isOnlineMode: true,
}));

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
};

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
    it('initializes with empty arrays when not authenticated', () => {
      const { result } = renderHook(() => useFriends());

      expect(result.current.friends).toEqual([]);
      expect(result.current.pendingReceived).toEqual([]);
      expect(result.current.pendingSent).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('has correct computed values when empty', () => {
      const { result } = renderHook(() => useFriends());

      expect(result.current.friendCount).toBe(0);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.hasFriends).toBe(false);
      expect(result.current.hasPendingRequests).toBe(false);
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

    it('handles fetch errors gracefully', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Database error' } })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });

      expect(result.current.friends).toEqual([]);
    });
  });

  describe('Search Users', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('searches for users by query', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'johnsmith', display_name: 'John Smith' },
        { id: 'user-2', username: 'johndoe', display_name: 'John Doe' },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockUsers, error: null })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchUsers('john');
      });

      expect(searchResult.data.length).toBe(2);
      expect(searchResult.error).toBeNull();
    });

    it('returns empty array for empty query', async () => {
      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let searchResult;
      await act(async () => {
        searchResult = await result.current.searchUsers('');
      });

      expect(searchResult.data).toEqual([]);
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

    it('returns error when not authenticated', async () => {
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      const { result } = renderHook(() => useFriends());

      let sendResult;
      await act(async () => {
        sendResult = await result.current.sendFriendRequest('user-456');
      });

      expect(sendResult.error.message).toBe('Must be signed in');
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
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Test error' } })
      );

      const { result } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('State Transitions', () => {
    it('clears friends when user logs out', async () => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

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

      const { result, rerender } = renderHook(() => useFriends());

      await waitFor(() => {
        expect(result.current.friends.length).toBe(1);
      });

      // Simulate logout
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      rerender();

      await waitFor(() => {
        expect(result.current.friends).toEqual([]);
        expect(result.current.pendingReceived).toEqual([]);
        expect(result.current.pendingSent).toEqual([]);
      });
    });
  });
});
