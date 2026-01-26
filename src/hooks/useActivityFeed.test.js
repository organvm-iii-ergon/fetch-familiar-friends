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
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
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

const mockAuthContext = {
  user: null,
  isAuthenticated: false,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

import { useActivityFeed } from './useActivityFeed';

describe('useActivityFeed', () => {
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
    it('initializes with empty activities when not authenticated', () => {
      const { result } = renderHook(() => useActivityFeed());

      expect(result.current.activities).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.loadingMore).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(true);
    });

    it('accepts custom options', () => {
      const { result } = renderHook(() =>
        useActivityFeed({ feedType: 'public', pageSize: 10 })
      );

      expect(result.current.activities).toEqual([]);
    });
  });

  describe('Fetching Activities (Authenticated)', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('fetches activities on mount when authenticated', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'test-user-123',
          activity_type: 'journal_entry',
          content: 'My dog had a great day!',
          created_at: new Date().toISOString(),
          user: {
            id: 'test-user-123',
            username: 'testuser',
            display_name: 'Test User',
            avatar_url: null,
            level: 5,
          },
          pet: { id: 'pet-1', name: 'Buddy', species: 'dog' },
          reactions: [],
          comments: [{ count: 0 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.activities.length).toBe(1);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
    });

    it('processes activities with computed fields', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'test-user-123',
          activity_type: 'photo',
          content: 'Check out this cute photo!',
          created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          user: { id: 'test-user-123', username: 'testuser' },
          pet: null,
          reactions: [{ id: 'r1', user_id: 'test-user-123', reaction_type: 'like' }],
          comments: [{ count: 5 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.activities.length).toBe(1);
      });

      const activity = result.current.activities[0];
      expect(activity.hasReacted).toBe(true);
      expect(activity.reactionCount).toBe(1);
      expect(activity.commentCount).toBe(5);
      expect(activity.isOwn).toBe(true);
      expect(activity.timeAgo).toBe('1m ago');
    });

    it('handles fetch errors gracefully', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Database error' } })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });

      expect(result.current.activities).toEqual([]);
    });
  });

  describe('Feed Types', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('filters by own activities when feedType is "own"', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      renderHook(() => useActivityFeed({ feedType: 'own' }));

      await waitFor(() => {
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-123');
      });
    });

    it('filters by public visibility when feedType is "public"', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      renderHook(() => useActivityFeed({ feedType: 'public' }));

      await waitFor(() => {
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('visibility', 'public');
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('loads more activities', async () => {
      const initialActivities = Array.from({ length: 20 }, (_, i) => ({
        id: `activity-${i}`,
        user_id: 'test-user-123',
        activity_type: 'journal_entry',
        content: `Activity ${i}`,
        created_at: new Date().toISOString(),
        user: { id: 'test-user-123' },
        pet: null,
        reactions: [],
        comments: [{ count: 0 }],
      }));

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: initialActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed({ pageSize: 20 }));

      await waitFor(() => {
        expect(result.current.activities.length).toBe(20);
      });

      expect(result.current.hasMore).toBe(true);

      // Load more
      const moreActivities = Array.from({ length: 10 }, (_, i) => ({
        id: `activity-more-${i}`,
        user_id: 'test-user-123',
        activity_type: 'photo',
        content: `More activity ${i}`,
        created_at: new Date().toISOString(),
        user: { id: 'test-user-123' },
        pet: null,
        reactions: [],
        comments: [{ count: 0 }],
      }));

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: moreActivities, error: null })
      );

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.activities.length).toBe(30);
    });

    it('sets hasMore to false when no more activities', async () => {
      const fewActivities = [
        {
          id: 'activity-1',
          user_id: 'test-user-123',
          activity_type: 'journal_entry',
          created_at: new Date().toISOString(),
          user: { id: 'test-user-123' },
          reactions: [],
          comments: [{ count: 0 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: fewActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed({ pageSize: 20 }));

      await waitFor(() => {
        expect(result.current.activities.length).toBe(1);
        expect(result.current.hasMore).toBe(false);
      });
    });
  });

  describe('Create Activity', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('creates activity successfully', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const newActivity = {
        id: 'new-activity',
        user_id: 'test-user-123',
        activity_type: 'journal_entry',
        content: 'New journal entry!',
        created_at: new Date().toISOString(),
        user: { id: 'test-user-123', username: 'testuser' },
        pet: null,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: newActivity,
        error: null,
      });

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createResult;
      await act(async () => {
        createResult = await result.current.createActivity({
          type: 'journal_entry',
          content: 'New journal entry!',
          visibility: 'friends',
        });
      });

      expect(createResult.error).toBeNull();
      expect(createResult.data).toBeDefined();
    });

    it('returns error when not authenticated', async () => {
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      const { result } = renderHook(() => useActivityFeed());

      let createResult;
      await act(async () => {
        createResult = await result.current.createActivity({
          type: 'journal_entry',
          content: 'Test',
        });
      });

      expect(createResult.error.message).toBe('Must be signed in');
    });
  });

  describe('Delete Activity', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('deletes activity successfully', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'test-user-123',
          activity_type: 'journal_entry',
          created_at: new Date().toISOString(),
          user: { id: 'test-user-123' },
          reactions: [],
          comments: [{ count: 0 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.activities.length).toBe(1);
      });

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: null })
      );

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteActivity('activity-1');
      });

      expect(deleteResult.error).toBeNull();
      expect(result.current.activities.length).toBe(0);
    });
  });

  describe('Reactions', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('toggles reaction on activity', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'other-user',
          activity_type: 'photo',
          created_at: new Date().toISOString(),
          user: { id: 'other-user' },
          reactions: [],
          comments: [{ count: 0 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.activities.length).toBe(1);
      });

      await act(async () => {
        await result.current.toggleReaction('activity-1', 'like');
      });

      // Should optimistically update the reaction
      expect(result.current.activities[0].hasReacted).toBe(true);
      expect(result.current.activities[0].reactionCount).toBe(1);
    });

    it('removes existing reaction', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'other-user',
          activity_type: 'photo',
          created_at: new Date().toISOString(),
          user: { id: 'other-user' },
          reactions: [{ id: 'reaction-1', user_id: 'test-user-123', reaction_type: 'like' }],
          comments: [{ count: 0 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.activities[0].hasReacted).toBe(true);
      });

      await act(async () => {
        await result.current.toggleReaction('activity-1', 'like');
      });

      expect(result.current.activities[0].hasReacted).toBe(false);
      expect(result.current.activities[0].reactionCount).toBe(0);
    });
  });

  describe('Comments', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('adds comment to activity', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'other-user',
          activity_type: 'photo',
          created_at: new Date().toISOString(),
          user: { id: 'other-user' },
          reactions: [],
          comments: [{ count: 0 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockActivities, error: null })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.activities.length).toBe(1);
      });

      mockQueryBuilder.single.mockResolvedValue({
        data: { id: 'comment-1', content: 'Nice photo!' },
        error: null,
      });

      let commentResult;
      await act(async () => {
        commentResult = await result.current.addComment('activity-1', 'Nice photo!');
      });

      expect(commentResult.error).toBeNull();
      expect(result.current.activities[0].commentCount).toBe(1);
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

      renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('activities-feed');
      });

      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('removes subscription on unmount', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { unmount } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('Refresh', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('refresh calls fetchActivities', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      // fetchActivities should be called again
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
    });
  });

  describe('Error Handling', () => {
    it('clears error when clearError is called', async () => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Test error' } })
      );

      const { result } = renderHook(() => useActivityFeed());

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
    it('clears activities when user logs out', async () => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'test-user-123',
          activity_type: 'journal_entry',
          created_at: new Date().toISOString(),
          user: { id: 'test-user-123' },
          reactions: [],
          comments: [{ count: 0 }],
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockActivities, error: null })
      );

      const { result, rerender } = renderHook(() => useActivityFeed());

      await waitFor(() => {
        expect(result.current.activities.length).toBe(1);
      });

      // Simulate logout
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      rerender();

      await waitFor(() => {
        expect(result.current.activities).toEqual([]);
      });
    });
  });
});
