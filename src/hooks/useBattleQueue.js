import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

/**
 * Queue status constants
 */
export const QUEUE_STATUS = {
  IDLE: 'idle',
  QUEUING: 'queuing',
  MATCHED: 'matched',
  IN_BATTLE: 'in_battle',
  COMPLETED: 'completed',
};

/**
 * Battle types supported
 */
export const BATTLE_TYPES = {
  PVP_1V1: '1v1',
  PVP_2V2: '2v2',
  RACE: 'race',
  COOP: 'coop',
};

/**
 * Hook for managing PvP battle queue and matchmaking
 * @returns {Object} Battle queue state and methods
 */
export function useBattleQueue() {
  const { user, isAuthenticated } = useAuth();

  // Queue state
  const [queueStatus, setQueueStatus] = useState(QUEUE_STATUS.IDLE);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [battleHistory, setBattleHistory] = useState([]);
  const [queuedBattleType, setQueuedBattleType] = useState(null);
  const [queueStartTime, setQueueStartTime] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for cleanup
  const queueChannelRef = useRef(null);
  const battleChannelRef = useRef(null);
  const matchmakingIntervalRef = useRef(null);

  /**
   * Join the matchmaking queue for a specific battle type
   */
  const joinQueue = useCallback(async (battleType, petId = null) => {
    if (!isOnlineMode || !user?.id) {
      setError('Must be signed in to join queue');
      return { error: { message: 'Must be signed in' } };
    }

    if (queueStatus !== QUEUE_STATUS.IDLE) {
      setError('Already in queue or battle');
      return { error: { message: 'Already in queue or battle' } };
    }

    setLoading(true);
    setError(null);

    try {
      // Create or find an available battle session
      const { data: existingSession, error: searchError } = await supabase
        .from('battle_sessions')
        .select(`
          *,
          participants:battle_participants(
            id, user_id, pet_id, team,
            user:profiles(id, username, display_name, avatar_url, level)
          )
        `)
        .eq('battle_type', battleType)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (searchError) throw searchError;

      let sessionId;
      let isNewSession = false;

      if (existingSession && existingSession.participants.length < getMaxParticipants(battleType)) {
        // Join existing session
        sessionId = existingSession.id;

        // Check if we're not joining our own session
        const alreadyJoined = existingSession.participants.some(p => p.user_id === user.id);
        if (alreadyJoined) {
          throw new Error('Already in this battle session');
        }
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('battle_sessions')
          .insert({
            battle_type: battleType,
            status: 'waiting',
          })
          .select()
          .single();

        if (createError) throw createError;
        sessionId = newSession.id;
        isNewSession = true;
      }

      // Add participant to session
      const team = isNewSession ? 'team_a' : 'team_b';
      const { error: joinError } = await supabase
        .from('battle_participants')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          pet_id: petId,
          team,
        });

      if (joinError) throw joinError;

      // Update queue state
      setQueueStatus(QUEUE_STATUS.QUEUING);
      setQueuedBattleType(battleType);
      setQueueStartTime(Date.now());

      // Subscribe to session updates for matchmaking
      subscribeToSession(sessionId);

      // Check if match is ready (for joining existing session)
      if (!isNewSession) {
        await checkMatchReady(sessionId);
      }

      return { data: { sessionId }, error: null };

    } catch (err) {
      console.error('Error joining queue:', err);
      setError(err.message);
      setQueueStatus(QUEUE_STATUS.IDLE);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, queueStatus]);

  /**
   * Leave the matchmaking queue
   */
  const leaveQueue = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      return { error: { message: 'Must be signed in' } };
    }

    if (queueStatus !== QUEUE_STATUS.QUEUING) {
      return { error: { message: 'Not currently in queue' } };
    }

    setLoading(true);
    setError(null);

    try {
      // Remove from any waiting sessions
      const { data: participation, error: findError } = await supabase
        .from('battle_participants')
        .select('session_id, battle_sessions!inner(status)')
        .eq('user_id', user.id)
        .eq('battle_sessions.status', 'waiting')
        .maybeSingle();

      if (findError) throw findError;

      if (participation) {
        // Remove participant
        await supabase
          .from('battle_participants')
          .delete()
          .eq('session_id', participation.session_id)
          .eq('user_id', user.id);

        // Check if session is now empty and should be cancelled
        const { data: remainingParticipants } = await supabase
          .from('battle_participants')
          .select('id')
          .eq('session_id', participation.session_id);

        if (!remainingParticipants || remainingParticipants.length === 0) {
          await supabase
            .from('battle_sessions')
            .update({ status: 'cancelled' })
            .eq('id', participation.session_id);
        }
      }

      // Clean up subscriptions
      cleanupSubscriptions();

      // Reset state
      setQueueStatus(QUEUE_STATUS.IDLE);
      setQueuedBattleType(null);
      setQueueStartTime(null);

      return { error: null };

    } catch (err) {
      console.error('Error leaving queue:', err);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, queueStatus]);

  /**
   * Submit battle result
   */
  const submitResult = useCallback(async (result) => {
    if (!isOnlineMode || !user?.id || !currentBattle) {
      return { error: { message: 'No active battle' } };
    }

    setLoading(true);
    setError(null);

    try {
      const { winnerId, loserId, xpAwarded = 100 } = result;

      // Record battle result
      const { data: battleResult, error: resultError } = await supabase
        .from('battle_results')
        .insert({
          session_id: currentBattle.id,
          winner_id: winnerId,
          loser_id: loserId,
          xp_awarded: xpAwarded,
        })
        .select()
        .single();

      if (resultError) throw resultError;

      // Update session status to completed
      await supabase
        .from('battle_sessions')
        .update({ status: 'completed' })
        .eq('id', currentBattle.id);

      // Award XP to winner via RPC (if function exists)
      if (winnerId) {
        await supabase.rpc('add_user_xp', { p_user_id: winnerId, p_xp: xpAwarded });
      }

      // Update state
      setQueueStatus(QUEUE_STATUS.COMPLETED);

      // Clean up subscriptions
      cleanupSubscriptions();

      return { data: battleResult, error: null };

    } catch (err) {
      console.error('Error submitting result:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentBattle]);

  /**
   * Fetch battle history
   */
  const fetchBattleHistory = useCallback(async () => {
    if (!isOnlineMode || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('battle_results')
        .select(`
          *,
          session:battle_sessions(id, battle_type, created_at),
          winner:profiles!battle_results_winner_id_fkey(id, username, display_name, avatar_url, level),
          loser:profiles!battle_results_loser_id_fkey(id, username, display_name, avatar_url, level)
        `)
        .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      // Process battle history with computed fields
      const processed = (data || []).map(battle => ({
        ...battle,
        isWinner: battle.winner_id === user.id,
        opponent: battle.winner_id === user.id ? battle.loser : battle.winner,
        timeAgo: getTimeAgo(battle.completed_at),
      }));

      setBattleHistory(processed);

    } catch (err) {
      console.error('Error fetching battle history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Reset battle state (after completion)
   */
  const resetBattle = useCallback(() => {
    setQueueStatus(QUEUE_STATUS.IDLE);
    setCurrentBattle(null);
    setOpponent(null);
    setQueuedBattleType(null);
    setQueueStartTime(null);
    cleanupSubscriptions();
  }, []);

  /**
   * Subscribe to session updates for real-time matchmaking
   */
  const subscribeToSession = useCallback((sessionId) => {
    if (!isOnlineMode) return;

    // Clean up any existing subscription
    if (queueChannelRef.current) {
      supabase.removeChannel(queueChannelRef.current);
    }

    const channel = supabase
      .channel(`battle-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          if (payload.new?.status === 'in_progress') {
            // Match started!
            await handleMatchStart(sessionId);
          } else if (payload.new?.status === 'cancelled') {
            // Match cancelled
            setQueueStatus(QUEUE_STATUS.IDLE);
            setQueuedBattleType(null);
            cleanupSubscriptions();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // New participant joined, check if match is ready
          await checkMatchReady(sessionId);
        }
      )
      .subscribe();

    queueChannelRef.current = channel;
  }, []);

  /**
   * Check if match has enough participants to start
   */
  const checkMatchReady = useCallback(async (sessionId) => {
    if (!isOnlineMode) return;

    try {
      const { data: session } = await supabase
        .from('battle_sessions')
        .select(`
          *,
          participants:battle_participants(
            id, user_id, pet_id, team,
            user:profiles(id, username, display_name, avatar_url, level)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (!session) return;

      const maxParticipants = getMaxParticipants(session.battle_type);
      const minParticipants = getMinParticipants(session.battle_type);

      if (session.participants.length >= minParticipants && session.status === 'waiting') {
        // Match is ready, update status
        await supabase
          .from('battle_sessions')
          .update({ status: 'in_progress' })
          .eq('id', sessionId);

        await handleMatchStart(sessionId);
      }
    } catch (err) {
      console.error('Error checking match ready:', err);
    }
  }, []);

  /**
   * Handle when match starts
   */
  const handleMatchStart = useCallback(async (sessionId) => {
    if (!isOnlineMode || !user?.id) return;

    try {
      const { data: session } = await supabase
        .from('battle_sessions')
        .select(`
          *,
          participants:battle_participants(
            id, user_id, pet_id, team,
            user:profiles(id, username, display_name, avatar_url, level)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (!session) return;

      // Find opponent
      const opponentParticipant = session.participants.find(p => p.user_id !== user.id);

      setCurrentBattle(session);
      setOpponent(opponentParticipant?.user || null);
      setQueueStatus(QUEUE_STATUS.MATCHED);

      // After brief delay, move to in_battle
      setTimeout(() => {
        setQueueStatus(QUEUE_STATUS.IN_BATTLE);
      }, 2000);

    } catch (err) {
      console.error('Error handling match start:', err);
    }
  }, [user?.id]);

  /**
   * Clean up all subscriptions
   */
  const cleanupSubscriptions = useCallback(() => {
    if (queueChannelRef.current) {
      supabase.removeChannel(queueChannelRef.current);
      queueChannelRef.current = null;
    }
    if (battleChannelRef.current) {
      supabase.removeChannel(battleChannelRef.current);
      battleChannelRef.current = null;
    }
    if (matchmakingIntervalRef.current) {
      clearInterval(matchmakingIntervalRef.current);
      matchmakingIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  // Fetch battle history on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBattleHistory();
    } else {
      setBattleHistory([]);
    }
  }, [isAuthenticated, fetchBattleHistory]);

  // Calculate queue time
  const queueTime = queueStartTime ? Math.floor((Date.now() - queueStartTime) / 1000) : 0;

  return {
    // State
    queueStatus,
    currentBattle,
    opponent,
    battleHistory,
    queuedBattleType,
    queueTime,
    loading,
    error,

    // Computed
    isQueuing: queueStatus === QUEUE_STATUS.QUEUING,
    isMatched: queueStatus === QUEUE_STATUS.MATCHED,
    isInBattle: queueStatus === QUEUE_STATUS.IN_BATTLE,
    isIdle: queueStatus === QUEUE_STATUS.IDLE,

    // Stats
    wins: battleHistory.filter(b => b.isWinner).length,
    losses: battleHistory.filter(b => !b.isWinner).length,
    winRate: battleHistory.length > 0
      ? Math.round((battleHistory.filter(b => b.isWinner).length / battleHistory.length) * 100)
      : 0,

    // Actions
    joinQueue,
    leaveQueue,
    submitResult,
    fetchBattleHistory,
    resetBattle,

    // Clear error
    clearError: () => setError(null),
  };
}

// Helper functions

function getMaxParticipants(battleType) {
  switch (battleType) {
    case BATTLE_TYPES.PVP_2V2:
      return 4;
    case BATTLE_TYPES.COOP:
      return 4;
    case BATTLE_TYPES.PVP_1V1:
    case BATTLE_TYPES.RACE:
    default:
      return 2;
  }
}

function getMinParticipants(battleType) {
  switch (battleType) {
    case BATTLE_TYPES.PVP_2V2:
      return 4;
    case BATTLE_TYPES.COOP:
      return 2;
    case BATTLE_TYPES.PVP_1V1:
    case BATTLE_TYPES.RACE:
    default:
      return 2;
  }
}

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

export default useBattleQueue;
