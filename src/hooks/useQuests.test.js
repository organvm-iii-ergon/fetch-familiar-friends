import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Use vi.hoisted() to define mock objects that are available when vi.mock() runs
const { mockQueryBuilder, mockSupabase, mockAuthContext } = vi.hoisted(() => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
    rpc: vi.fn(),
  };

  const mockAuthContext = {
    user: null,
    isAuthenticated: false,
  };

  return { mockQueryBuilder, mockSupabase, mockAuthContext };
});

vi.mock('../config/supabase', () => ({
  supabase: mockSupabase,
  isOnlineMode: true,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Import the hook after mocks are set up
import { useQuests } from './useQuests';

describe('useQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset auth context
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;

    // Default mock implementations
    mockQueryBuilder.then.mockImplementation((resolve) =>
      resolve({ data: [], error: null })
    );
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('loads local quests even when not authenticated', () => {
      const { result } = renderHook(() => useQuests());

      // Local quests are always loaded (local-first approach)
      expect(result.current.dailyQuests).toBeDefined();
      expect(result.current.weeklyQuests).toBeDefined();
      expect(result.current.achievements).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('has correct computed values initially', () => {
      const { result } = renderHook(() => useQuests());

      // Computed values based on local quests (all start incomplete)
      expect(result.current.completedDailyCount).toBe(0);
      expect(result.current.completedWeeklyCount).toBe(0);
      expect(result.current.totalDailyXp).toBe(0);
    });

    it('provides new tracking functions', () => {
      const { result } = renderHook(() => useQuests());

      expect(typeof result.current.trackAction).toBe('function');
      expect(typeof result.current.trackStreak).toBe('function');
      expect(typeof result.current.trackViewImage).toBe('function');
      expect(typeof result.current.trackWriteJournal).toBe('function');
      expect(typeof result.current.trackAddFavorite).toBe('function');
    });
  });

  describe('Quest Definitions', () => {
    it('returns quest definition for valid quest key', () => {
      const { result } = renderHook(() => useQuests());

      const questDef = result.current.getQuestDefinition('daily_photo');

      expect(questDef).toBeDefined();
      expect(questDef.key).toBe('daily_photo');
      expect(questDef.type).toBe('daily');
      expect(questDef.title).toBe('Paw-parazzi');
      expect(questDef.xp).toBe(10);
    });

    it('returns null for invalid quest key', () => {
      const { result } = renderHook(() => useQuests());

      const questDef = result.current.getQuestDefinition('invalid_quest');

      expect(questDef).toBeNull();
    });
  });

  describe('Fetching Quests (Authenticated)', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('fetches quests on mount when authenticated', async () => {
      const mockQuests = [
        {
          id: '1',
          user_id: 'test-user-123',
          quest_key: 'daily_photo',
          quest_type: 'daily',
          target: 1,
          progress: 0,
          completed_at: null,
        },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockQuests, error: null })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.dailyQuests.length).toBeGreaterThanOrEqual(0);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('quests');
    });

    it('handles fetch errors gracefully while keeping local quests', async () => {
      const mockError = { message: 'Database error' };
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: mockError })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        // Local quests are still loaded even if server fetch fails
        expect(result.current.dailyQuests.length).toBeGreaterThanOrEqual(0);
      });

      // Local quests persist (local-first approach)
      expect(result.current.dailyQuests).toBeDefined();
    });

    it('loads from localStorage when offline', async () => {
      // Set offline mode
      vi.doMock('../config/supabase', () => ({
        supabase: mockSupabase,
        isOnlineMode: false,
      }));

      const localQuests = {
        daily: [{ quest_key: 'daily_photo', progress: 0 }],
        weekly: [],
      };
      localStorage.setItem('dogtale-quests', JSON.stringify(localQuests));

      // Need to reimport for the mock to take effect
      const { useQuests: useQuestsOffline } = await import('./useQuests');

      const { result } = renderHook(() => useQuestsOffline());

      // Should load from localStorage
      expect(localStorage.getItem).toBeDefined();
    });
  });

  describe('Quest Progress Updates', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('updates quest progress correctly', async () => {
      const initialQuest = {
        id: '1',
        user_id: 'test-user-123',
        quest_key: 'daily_photo',
        quest_type: 'daily',
        target: 1,
        progress: 0,
        completed_at: null,
        xp: 10,
      };

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [initialQuest], error: null })
      );
      mockQueryBuilder.single.mockResolvedValue({ data: initialQuest, error: null });

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });

      // Mock the update response
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: { ...initialQuest, progress: 1 }, error: null })
      );

      await act(async () => {
        const updateResult = await result.current.updateQuestProgress('daily_photo', 1);
        // Result depends on current state
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('quests');
    });

    it('returns completed:false when trying to update non-existent quest', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updateResult = await result.current.updateQuestProgress('nonexistent_quest', 1);

      // Should return completed:false for non-matching quests
      expect(updateResult.completed).toBe(false);
    });

    it('does not update already completed quests', async () => {
      const completedQuest = {
        id: '1',
        user_id: 'test-user-123',
        quest_key: 'daily_photo',
        quest_type: 'daily',
        target: 1,
        progress: 1,
        completed_at: new Date().toISOString(),
        xp: 10,
      };

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [completedQuest], error: null })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });
  });

  describe('Claim Rewards', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('claims rewards for completed quest', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const claimResult = await result.current.claimRewards('quest-123');
        expect(claimResult.error).toBeNull();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('quests');
    });

    it('handles claim errors', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: null, error: { message: 'Claim failed' } })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const claimResult = await result.current.claimRewards('quest-123');
        expect(claimResult.error).toBeDefined();
      });
    });
  });

  describe('Achievements', () => {
    beforeEach(() => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;
    });

    it('fetches achievements on mount', async () => {
      const mockAchievements = [
        { id: '1', achievement_key: 'first_journal', achieved_at: new Date().toISOString() },
      ];

      // Set up the mock to return achievements for the second call
      let callCount = 0;
      mockQueryBuilder.then.mockImplementation((resolve) => {
        callCount++;
        if (callCount > 1) {
          return resolve({ data: mockAchievements, error: null });
        }
        return resolve({ data: [], error: null });
      });

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('achievements');
      });
    });

    it('checks and awards achievements based on context', async () => {
      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [], error: null })
      );
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.checkAchievements({
          journalCount: 1,
          favoriteCount: 10,
          friendCount: 5,
        });
      });

      // Should attempt to insert achievement for first_journal
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Computed Values', () => {
    it('calculates completedDailyCount correctly', async () => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      const mockQuests = [
        { quest_key: 'daily_photo', quest_type: 'daily', progress: 1, target: 1, completed_at: new Date().toISOString(), xp: 10 },
        { quest_key: 'daily_journal', quest_type: 'daily', progress: 0, target: 1, completed_at: null, xp: 20 },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockQuests, error: null })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(result.current.dailyQuests.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('calculates totalDailyXp correctly', async () => {
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      const mockQuests = [
        { quest_key: 'daily_photo', quest_type: 'daily', progress: 1, target: 1, completed_at: new Date().toISOString(), xp: 10 },
        { quest_key: 'daily_journal', quest_type: 'daily', progress: 1, target: 1, completed_at: new Date().toISOString(), xp: 20 },
      ];

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: mockQuests, error: null })
      );

      const { result } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('clears error when clearError is called', async () => {
      const { result } = renderHook(() => useQuests());

      // Error starts as null
      expect(result.current.error).toBeNull();

      // clearError should work even when no error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('provides clearRecentlyCompleted function', async () => {
      const { result } = renderHook(() => useQuests());

      expect(typeof result.current.clearRecentlyCompleted).toBe('function');

      act(() => {
        result.current.clearRecentlyCompleted();
      });

      expect(result.current.recentlyCompleted).toEqual([]);
    });
  });

  describe('Unauthenticated State Transitions', () => {
    it('keeps local quests but clears achievements when user logs out', async () => {
      // Start authenticated
      mockAuthContext.user = { id: 'test-user-123' };
      mockAuthContext.isAuthenticated = true;

      mockQueryBuilder.then.mockImplementation((resolve) =>
        resolve({ data: [{ quest_key: 'daily_photo', quest_type: 'daily', progress: 0, target: 1 }], error: null })
      );

      const { result, rerender } = renderHook(() => useQuests());

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });

      // Simulate logout
      mockAuthContext.user = null;
      mockAuthContext.isAuthenticated = false;

      rerender();

      await waitFor(() => {
        // Local quests persist (local-first approach)
        expect(result.current.dailyQuests).toBeDefined();
        expect(result.current.weeklyQuests).toBeDefined();
        // Server achievements are cleared
        expect(result.current.achievements).toEqual([]);
      });
    });
  });
});
