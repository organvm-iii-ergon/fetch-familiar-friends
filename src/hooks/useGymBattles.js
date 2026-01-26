import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

/**
 * Mock gym data for development/demo mode
 * Structure designed for future PostGIS integration
 */
const MOCK_GYMS = [
  {
    id: 'gym_central_park',
    name: 'Central Park Arena',
    gym_leader: 'Coach Marcus',
    badge_name: 'Park Master',
    badge_icon: '🌳',
    difficulty: 3,
    required_level: 10,
    xp_reward: 500,
    location: {
      lat: 40.7829,
      lng: -73.9654,
      name: 'Central Park, NY',
    },
    distance_miles: 0.5,
    challenges: [
      { id: 1, description: 'Fetch 10 balls in 5 minutes', icon: '🎾', type: 'fetch' },
      { id: 2, description: 'Navigate obstacle course', icon: '🦮', type: 'agility' },
      { id: 3, description: 'Team coordination with 3 dogs', icon: '🤝', type: 'social' },
    ],
  },
  {
    id: 'gym_beach_training',
    name: 'Beach Training Grounds',
    gym_leader: 'Captain Sarah',
    badge_name: 'Beach Champion',
    badge_icon: '🏖️',
    difficulty: 2,
    required_level: 5,
    xp_reward: 300,
    location: {
      lat: 40.5731,
      lng: -73.9712,
      name: 'Brighton Beach, NY',
    },
    distance_miles: 2.1,
    challenges: [
      { id: 1, description: 'Sprint 100 meters on sand', icon: '🏃', type: 'speed' },
      { id: 2, description: 'Water retrieval challenge', icon: '🌊', type: 'fetch' },
      { id: 3, description: 'Agility through beach obstacles', icon: '⚡', type: 'agility' },
    ],
  },
  {
    id: 'gym_mountain_peak',
    name: 'Mountain Peak Challenge',
    gym_leader: 'Trainer Alex',
    badge_name: 'Summit Master',
    badge_icon: '⛰️',
    difficulty: 5,
    required_level: 20,
    xp_reward: 1000,
    location: {
      lat: 41.0534,
      lng: -74.1310,
      name: 'Ramapo Mountains, NJ',
    },
    distance_miles: 8.7,
    challenges: [
      { id: 1, description: 'Complete 5-mile trail', icon: '🥾', type: 'endurance' },
      { id: 2, description: 'Climb steep terrain sections', icon: '🧗', type: 'strength' },
      { id: 3, description: 'Reach summit checkpoint', icon: '🏔️', type: 'endurance' },
    ],
  },
  {
    id: 'gym_urban_agility',
    name: 'Urban Agility Course',
    gym_leader: 'Coach Devon',
    badge_name: 'Street Champion',
    badge_icon: '🏙️',
    difficulty: 3,
    required_level: 8,
    xp_reward: 400,
    location: {
      lat: 40.7484,
      lng: -73.9857,
      name: 'Midtown Manhattan, NY',
    },
    distance_miles: 1.2,
    challenges: [
      { id: 1, description: 'Navigate city obstacles', icon: '🚧', type: 'agility' },
      { id: 2, description: 'Follow complex commands', icon: '🎯', type: 'obedience' },
      { id: 3, description: 'Stay calm in crowded areas', icon: '👥', type: 'focus' },
    ],
  },
  {
    id: 'gym_forest_trails',
    name: 'Forest Trail Academy',
    gym_leader: 'Ranger Luna',
    badge_name: 'Trail Blazer',
    badge_icon: '🌲',
    difficulty: 4,
    required_level: 15,
    xp_reward: 650,
    location: {
      lat: 41.1220,
      lng: -74.0071,
      name: 'Harriman State Park, NY',
    },
    distance_miles: 5.3,
    challenges: [
      { id: 1, description: 'Track scent through forest', icon: '👃', type: 'tracking' },
      { id: 2, description: 'Cross stream safely', icon: '🌊', type: 'endurance' },
      { id: 3, description: 'Find hidden checkpoints', icon: '🔍', type: 'search' },
    ],
  },
];

/**
 * Challenge status enum
 */
const CHALLENGE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Hook for managing gym battles and challenges
 * @returns {Object} Gym battle state and methods
 */
export function useGymBattles() {
  const { user, isAuthenticated, profile } = useAuth();

  // State
  const [gyms, setGyms] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lng1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lng2 - Longitude of point 2
   * @returns {number} Distance in miles
   */
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  /**
   * Fetch nearby gyms based on user location
   * @param {Object} userLocation - User's current location {lat, lng}
   * @returns {Promise<void>}
   */
  const fetchGyms = useCallback(async (userLocation = null) => {
    setLoading(true);
    setError(null);

    try {
      // If online mode and authenticated, try to fetch from database
      if (isOnlineMode && user?.id) {
        // Future: Use PostGIS for real gym data
        // const { data, error: fetchError } = await supabase
        //   .rpc('get_nearby_gyms', {
        //     user_lat: userLocation?.lat,
        //     user_lng: userLocation?.lng,
        //     radius_miles: 50
        //   });

        // For now, use mock data with calculated distances
        const gymsWithDistance = MOCK_GYMS.map(gym => ({
          ...gym,
          distance_miles: userLocation
            ? calculateDistance(
                userLocation.lat,
                userLocation.lng,
                gym.location.lat,
                gym.location.lng
              )
            : gym.distance_miles,
        })).sort((a, b) => a.distance_miles - b.distance_miles);

        setGyms(gymsWithDistance);
      } else {
        // Fallback to mock data
        setGyms(MOCK_GYMS);
      }

      // Also load from localStorage as cache
      const cached = localStorage.getItem('dogtale-gyms-cache');
      if (!gyms.length && cached) {
        setGyms(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Error fetching gyms:', err);
      setError(err.message);
      // Fallback to mock data on error
      setGyms(MOCK_GYMS);
    } finally {
      setLoading(false);
    }
  }, [user?.id, calculateDistance, gyms.length]);

  /**
   * Fetch user's earned gym badges
   * @returns {Promise<void>}
   */
  const fetchBadges = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load from localStorage
      const localBadges = localStorage.getItem('dogtale-gym-badges');
      if (localBadges) {
        setEarnedBadges(JSON.parse(localBadges));
      }
      return;
    }

    try {
      // Future: Fetch from gym_badges table
      // const { data, error: fetchError } = await supabase
      //   .from('gym_badges')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('earned_at', { ascending: false });

      // For now, fetch from achievements table with gym_ prefix
      const { data, error: fetchError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .like('achievement_key', 'gym_%');

      if (fetchError) throw fetchError;

      // Map achievements to badge format
      const badges = (data || []).map(achievement => {
        const gymId = achievement.achievement_key.replace('gym_badge_', '');
        const gym = MOCK_GYMS.find(g => g.id === gymId);
        return {
          id: achievement.id,
          gym_id: gymId,
          badge_name: gym?.badge_name || 'Unknown Badge',
          badge_icon: gym?.badge_icon || '🏅',
          gym_name: gym?.name || 'Unknown Gym',
          earned_at: achievement.achieved_at,
        };
      });

      setEarnedBadges(badges);

      // Cache locally
      localStorage.setItem('dogtale-gym-badges', JSON.stringify(badges));
    } catch (err) {
      console.error('Error fetching badges:', err);
      setError(err.message);
    }
  }, [user?.id]);

  /**
   * Start a gym challenge
   * @param {string} gymId - ID of the gym to challenge
   * @returns {Promise<Object>} Result with error or challenge data
   */
  const startChallenge = useCallback(async (gymId) => {
    const gym = gyms.find(g => g.id === gymId);
    if (!gym) {
      return { error: { message: 'Gym not found' } };
    }

    // Check if user meets level requirement
    const userLevel = profile?.level || 1;
    if (userLevel < gym.required_level) {
      return {
        error: {
          message: `You need to be level ${gym.required_level} to challenge this gym. Current level: ${userLevel}`,
        },
      };
    }

    // Check if already has badge for this gym
    const hasBadge = earnedBadges.some(b => b.gym_id === gymId);
    if (hasBadge) {
      return {
        error: { message: 'You have already conquered this gym!' },
      };
    }

    // Check if there's an active challenge
    if (activeChallenge) {
      return {
        error: { message: 'You already have an active challenge. Complete or abandon it first.' },
      };
    }

    const challenge = {
      gym_id: gymId,
      gym,
      status: CHALLENGE_STATUS.IN_PROGRESS,
      started_at: new Date().toISOString(),
      steps: gym.challenges.map((c, index) => ({
        ...c,
        step_index: index,
        completed: false,
        completed_at: null,
      })),
      current_step: 0,
    };

    setActiveChallenge(challenge);

    // Persist to localStorage
    localStorage.setItem('dogtale-active-challenge', JSON.stringify(challenge));

    // If online, record the challenge start
    if (isOnlineMode && user?.id) {
      try {
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          progress_type: 'gym_challenge',
          progress_key: gymId,
          value: 0,
          metadata: { started_at: challenge.started_at, status: 'in_progress' },
        }, {
          onConflict: 'user_id,progress_type,progress_key',
        });
      } catch (err) {
        console.error('Error recording challenge start:', err);
      }
    }

    return { data: challenge, error: null };
  }, [gyms, profile?.level, earnedBadges, activeChallenge, user?.id]);

  /**
   * Complete a challenge step
   * @param {number} stepIndex - Index of the step to complete
   * @returns {Promise<Object>} Result with updated challenge or error
   */
  const completeStep = useCallback(async (stepIndex) => {
    if (!activeChallenge) {
      return { error: { message: 'No active challenge' } };
    }

    if (stepIndex !== activeChallenge.current_step) {
      return { error: { message: 'Must complete steps in order' } };
    }

    if (stepIndex >= activeChallenge.steps.length) {
      return { error: { message: 'Invalid step index' } };
    }

    const updatedSteps = activeChallenge.steps.map((step, idx) => {
      if (idx === stepIndex) {
        return {
          ...step,
          completed: true,
          completed_at: new Date().toISOString(),
        };
      }
      return step;
    });

    const isLastStep = stepIndex === activeChallenge.steps.length - 1;
    const updatedChallenge = {
      ...activeChallenge,
      steps: updatedSteps,
      current_step: isLastStep ? stepIndex : stepIndex + 1,
      status: isLastStep ? CHALLENGE_STATUS.COMPLETED : CHALLENGE_STATUS.IN_PROGRESS,
    };

    setActiveChallenge(updatedChallenge);
    localStorage.setItem('dogtale-active-challenge', JSON.stringify(updatedChallenge));

    // Update progress in database
    if (isOnlineMode && user?.id) {
      try {
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          progress_type: 'gym_challenge',
          progress_key: activeChallenge.gym_id,
          value: stepIndex + 1,
          metadata: {
            started_at: activeChallenge.started_at,
            status: updatedChallenge.status,
            steps_completed: stepIndex + 1,
          },
        }, {
          onConflict: 'user_id,progress_type,progress_key',
        });
      } catch (err) {
        console.error('Error updating challenge progress:', err);
      }
    }

    return {
      data: updatedChallenge,
      isComplete: isLastStep,
      error: null,
    };
  }, [activeChallenge, user?.id]);

  /**
   * Finish the challenge and award badge
   * @returns {Promise<Object>} Result with badge info or error
   */
  const finishChallenge = useCallback(async () => {
    if (!activeChallenge) {
      return { error: { message: 'No active challenge' } };
    }

    if (activeChallenge.status !== CHALLENGE_STATUS.COMPLETED) {
      return { error: { message: 'Challenge not yet completed' } };
    }

    const gym = activeChallenge.gym;
    const badge = {
      id: `badge_${Date.now()}`,
      gym_id: gym.id,
      badge_name: gym.badge_name,
      badge_icon: gym.badge_icon,
      gym_name: gym.name,
      earned_at: new Date().toISOString(),
    };

    // Award badge
    const updatedBadges = [...earnedBadges, badge];
    setEarnedBadges(updatedBadges);
    localStorage.setItem('dogtale-gym-badges', JSON.stringify(updatedBadges));

    // Clear active challenge
    setActiveChallenge(null);
    localStorage.removeItem('dogtale-active-challenge');

    // If online, record the badge and award XP
    if (isOnlineMode && user?.id) {
      try {
        // Insert achievement
        await supabase.from('achievements').insert({
          user_id: user.id,
          achievement_key: `gym_badge_${gym.id}`,
        });

        // Award XP
        await supabase.rpc('add_user_xp', {
          p_user_id: user.id,
          p_xp: gym.xp_reward,
        });

        // Record activity
        await supabase.from('activities').insert({
          user_id: user.id,
          activity_type: 'achievement',
          content: `Conquered ${gym.name} and earned the ${gym.badge_name} badge!`,
          metadata: {
            badge_name: gym.badge_name,
            badge_icon: gym.badge_icon,
            gym_name: gym.name,
            xp_earned: gym.xp_reward,
          },
          visibility: 'friends',
        });

        // Clean up progress record
        await supabase.from('user_progress').delete()
          .eq('user_id', user.id)
          .eq('progress_type', 'gym_challenge')
          .eq('progress_key', gym.id);

      } catch (err) {
        console.error('Error completing challenge in database:', err);
      }
    }

    return {
      data: {
        badge,
        xp_awarded: gym.xp_reward,
      },
      error: null,
    };
  }, [activeChallenge, earnedBadges, user?.id]);

  /**
   * Abandon the current challenge
   * @returns {Promise<Object>} Result
   */
  const abandonChallenge = useCallback(async () => {
    if (!activeChallenge) {
      return { error: { message: 'No active challenge' } };
    }

    const gymId = activeChallenge.gym_id;

    setActiveChallenge(null);
    localStorage.removeItem('dogtale-active-challenge');

    // Clean up in database
    if (isOnlineMode && user?.id) {
      try {
        await supabase.from('user_progress').delete()
          .eq('user_id', user.id)
          .eq('progress_type', 'gym_challenge')
          .eq('progress_key', gymId);
      } catch (err) {
        console.error('Error abandoning challenge:', err);
      }
    }

    return { error: null };
  }, [activeChallenge, user?.id]);

  /**
   * Check if user can challenge a specific gym
   * @param {string} gymId - Gym ID to check
   * @returns {Object} Eligibility info
   */
  const canChallengeGym = useCallback((gymId) => {
    const gym = gyms.find(g => g.id === gymId);
    if (!gym) return { eligible: false, reason: 'Gym not found' };

    const userLevel = profile?.level || 1;
    if (userLevel < gym.required_level) {
      return {
        eligible: false,
        reason: `Requires level ${gym.required_level}`,
      };
    }

    if (earnedBadges.some(b => b.gym_id === gymId)) {
      return {
        eligible: false,
        reason: 'Already conquered',
        hasBadge: true,
      };
    }

    if (activeChallenge) {
      return {
        eligible: false,
        reason: 'Challenge in progress',
      };
    }

    return { eligible: true };
  }, [gyms, profile?.level, earnedBadges, activeChallenge]);

  // Subscribe to real-time updates for gym challenges
  useEffect(() => {
    if (!isOnlineMode || !isAuthenticated || !user?.id) return;

    const subscription = supabase
      .channel(`gym-battles-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievements',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Refresh badges when new achievement added
          if (payload.new?.achievement_key?.startsWith('gym_badge_')) {
            fetchBadges();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated, user?.id, fetchBadges]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      fetchGyms();
      fetchBadges();

      // Restore active challenge from localStorage
      const savedChallenge = localStorage.getItem('dogtale-active-challenge');
      if (savedChallenge) {
        const challenge = JSON.parse(savedChallenge);
        // Only restore if not already completed
        if (challenge.status !== CHALLENGE_STATUS.COMPLETED) {
          setActiveChallenge(challenge);
        }
      }
    } else {
      // Load mock data for demo mode
      setGyms(MOCK_GYMS);
      setEarnedBadges([]);
      setActiveChallenge(null);
    }
  }, [isAuthenticated, fetchGyms, fetchBadges]);

  return {
    // State
    gyms,
    activeChallenge,
    earnedBadges,
    loading,
    error,

    // Computed
    hasActiveChallenge: !!activeChallenge,
    badgeCount: earnedBadges.length,
    totalGyms: gyms.length,
    conqueredGyms: earnedBadges.length,

    // Actions
    fetchGyms,
    fetchBadges,
    startChallenge,
    completeStep,
    finishChallenge,
    abandonChallenge,

    // Helpers
    canChallengeGym,
    getGymById: (gymId) => gyms.find(g => g.id === gymId),
    hasBadgeForGym: (gymId) => earnedBadges.some(b => b.gym_id === gymId),

    // Clear error
    clearError: () => setError(null),

    // Constants
    CHALLENGE_STATUS,
  };
}

export default useGymBattles;
