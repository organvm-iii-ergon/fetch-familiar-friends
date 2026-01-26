import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase, isOnlineMode } from '../config/supabase';

// Season configuration
const CURRENT_SEASON = {
  id: 'spring_2024',
  name: 'Spring Awakening',
  startDate: '2024-03-01',
  endDate: '2024-05-31',
  maxLevel: 50,
  xpPerLevel: 500, // Base XP, increases with level
  premiumPrice: 9.99,
  premiumPriceId: import.meta.env.VITE_STRIPE_SEASON_PASS_PRICE_ID,
};

// XP sources configuration
export const XP_SOURCES = {
  quest_daily: { amount: 10, name: 'Daily Quest' },
  quest_weekly: { amount: 25, name: 'Weekly Quest' },
  journal_entry: { amount: 5, name: 'Journal Entry' },
  favorite_added: { amount: 2, name: 'Add Favorite' },
  friend_added: { amount: 10, name: 'New Friend' },
  gym_badge: { amount: 50, name: 'Gym Badge' },
  battle_win: { amount: 15, name: 'Battle Win' },
  login_streak: { amount: 5, name: 'Daily Login' },
  virtual_pet_action: { amount: 3, name: 'Pet Care' },
  health_record: { amount: 8, name: 'Health Record' },
};

// Season pass rewards for levels 1-50
export const SEASON_REWARDS = [
  { level: 1, free: { type: 'currency', value: 100, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'golden_collar', name: 'Golden Collar', icon: '✨' } },
  { level: 2, free: { type: 'currency', value: 50, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 200, name: 'Gems', icon: '💎' } },
  { level: 3, free: { type: 'xp_boost', value: 10, name: '10% XP Boost (1hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'spring_bandana', name: 'Spring Bandana', icon: '🌸' } },
  { level: 4, free: { type: 'currency', value: 75, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 150, name: 'Gems', icon: '💎' } },
  { level: 5, free: { type: 'badge', value: 'early_bird', name: 'Early Bird Badge', icon: '🐣' }, premium: { type: 'profile_frame', value: 'spring_flowers', name: 'Flower Frame', icon: '🌷' } },
  { level: 6, free: { type: 'currency', value: 100, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'butterfly_wings', name: 'Butterfly Wings', icon: '🦋' } },
  { level: 7, free: { type: 'currency', value: 50, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 250, name: 'Gems', icon: '💎' } },
  { level: 8, free: { type: 'xp_boost', value: 15, name: '15% XP Boost (1hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'rainbow_leash', name: 'Rainbow Leash', icon: '🌈' } },
  { level: 9, free: { type: 'currency', value: 100, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 200, name: 'Gems', icon: '💎' } },
  { level: 10, free: { type: 'badge', value: 'spring_explorer', name: 'Spring Explorer', icon: '🌿' }, premium: { type: 'profile_frame', value: 'gold_paws', name: 'Golden Paws Frame', icon: '🐾' } },
  { level: 11, free: { type: 'currency', value: 125, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'daisy_crown', name: 'Daisy Crown', icon: '🌼' } },
  { level: 12, free: { type: 'currency', value: 75, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 300, name: 'Gems', icon: '💎' } },
  { level: 13, free: { type: 'xp_boost', value: 20, name: '20% XP Boost (1hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'bee_costume', name: 'Bee Costume', icon: '🐝' } },
  { level: 14, free: { type: 'currency', value: 100, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 250, name: 'Gems', icon: '💎' } },
  { level: 15, free: { type: 'badge', value: 'halfway_hero', name: 'Halfway Hero', icon: '🎯' }, premium: { type: 'profile_frame', value: 'cherry_blossom', name: 'Cherry Blossom Frame', icon: '🌸' } },
  { level: 16, free: { type: 'currency', value: 150, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'sunflower_collar', name: 'Sunflower Collar', icon: '🌻' } },
  { level: 17, free: { type: 'currency', value: 75, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 350, name: 'Gems', icon: '💎' } },
  { level: 18, free: { type: 'xp_boost', value: 25, name: '25% XP Boost (2hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'ladybug_bow', name: 'Ladybug Bow', icon: '🐞' } },
  { level: 19, free: { type: 'currency', value: 125, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 300, name: 'Gems', icon: '💎' } },
  { level: 20, free: { type: 'badge', value: 'spring_veteran', name: 'Spring Veteran', icon: '⭐' }, premium: { type: 'profile_frame', value: 'rainbow_sparkle', name: 'Rainbow Sparkle Frame', icon: '🌈' } },
  { level: 21, free: { type: 'currency', value: 175, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'garden_hat', name: 'Garden Hat', icon: '🎩' } },
  { level: 22, free: { type: 'currency', value: 100, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 400, name: 'Gems', icon: '💎' } },
  { level: 23, free: { type: 'xp_boost', value: 30, name: '30% XP Boost (2hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'tulip_necklace', name: 'Tulip Necklace', icon: '🌷' } },
  { level: 24, free: { type: 'currency', value: 150, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 350, name: 'Gems', icon: '💎' } },
  { level: 25, free: { type: 'badge', value: 'quarter_champion', name: 'Quarter Champion', icon: '🏆' }, premium: { type: 'profile_frame', value: 'diamond_paws', name: 'Diamond Paws Frame', icon: '💎' } },
  { level: 26, free: { type: 'currency', value: 200, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'cloud_wings', name: 'Cloud Wings', icon: '☁️' } },
  { level: 27, free: { type: 'currency', value: 125, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 450, name: 'Gems', icon: '💎' } },
  { level: 28, free: { type: 'xp_boost', value: 35, name: '35% XP Boost (3hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'sparkle_collar', name: 'Sparkle Collar', icon: '✨' } },
  { level: 29, free: { type: 'currency', value: 175, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 400, name: 'Gems', icon: '💎' } },
  { level: 30, free: { type: 'badge', value: 'spring_master', name: 'Spring Master', icon: '🌟' }, premium: { type: 'profile_frame', value: 'aurora_glow', name: 'Aurora Glow Frame', icon: '🔮' } },
  { level: 31, free: { type: 'currency', value: 225, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'crystal_tiara', name: 'Crystal Tiara', icon: '👑' } },
  { level: 32, free: { type: 'currency', value: 150, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 500, name: 'Gems', icon: '💎' } },
  { level: 33, free: { type: 'xp_boost', value: 40, name: '40% XP Boost (3hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'phoenix_feathers', name: 'Phoenix Feathers', icon: '🔥' } },
  { level: 34, free: { type: 'currency', value: 200, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 450, name: 'Gems', icon: '💎' } },
  { level: 35, free: { type: 'badge', value: 'elite_explorer', name: 'Elite Explorer', icon: '🗺️' }, premium: { type: 'profile_frame', value: 'cosmic_swirl', name: 'Cosmic Swirl Frame', icon: '🌀' } },
  { level: 36, free: { type: 'currency', value: 250, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'starlight_cape', name: 'Starlight Cape', icon: '🌟' } },
  { level: 37, free: { type: 'currency', value: 175, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 550, name: 'Gems', icon: '💎' } },
  { level: 38, free: { type: 'xp_boost', value: 45, name: '45% XP Boost (4hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'moonbeam_collar', name: 'Moonbeam Collar', icon: '🌙' } },
  { level: 39, free: { type: 'currency', value: 225, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 500, name: 'Gems', icon: '💎' } },
  { level: 40, free: { type: 'badge', value: 'legendary_pet', name: 'Legendary Pet', icon: '🐉' }, premium: { type: 'profile_frame', value: 'mythic_portal', name: 'Mythic Portal Frame', icon: '🌌' } },
  { level: 41, free: { type: 'currency', value: 275, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'galaxy_wings', name: 'Galaxy Wings', icon: '🌌' } },
  { level: 42, free: { type: 'currency', value: 200, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 600, name: 'Gems', icon: '💎' } },
  { level: 43, free: { type: 'xp_boost', value: 50, name: '50% XP Boost (4hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'nebula_aura', name: 'Nebula Aura', icon: '🔮' } },
  { level: 44, free: { type: 'currency', value: 250, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 550, name: 'Gems', icon: '💎' } },
  { level: 45, free: { type: 'badge', value: 'season_elite', name: 'Season Elite', icon: '🎖️' }, premium: { type: 'profile_frame', value: 'eternal_flame', name: 'Eternal Flame Frame', icon: '🔥' } },
  { level: 46, free: { type: 'currency', value: 300, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'accessory', value: 'dragon_scales', name: 'Dragon Scales', icon: '🐲' } },
  { level: 47, free: { type: 'currency', value: 225, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 700, name: 'Gems', icon: '💎' } },
  { level: 48, free: { type: 'xp_boost', value: 100, name: '100% XP Boost (24hr)', icon: '⚡' }, premium: { type: 'accessory', value: 'celestial_crown', name: 'Celestial Crown', icon: '👑' } },
  { level: 49, free: { type: 'currency', value: 350, name: 'Bone Tokens', icon: '🦴' }, premium: { type: 'currency', value: 800, name: 'Gems', icon: '💎' } },
  { level: 50, free: { type: 'badge', value: 'season_champion', name: 'Season Champion', icon: '🏆' }, premium: { type: 'exclusive', value: 'spring_legendary_pet', name: 'Legendary Spring Pet', icon: '🌸' } },
];

/**
 * Hook for managing season pass state and progress
 * @returns {Object} Season pass state and methods
 */
export function useSeasonPass() {
  const { user, isAuthenticated } = useAuth();
  const { createCheckoutSession, checkoutLoading } = useSubscription();

  const [userProgress, setUserProgress] = useState(null);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate XP required for a specific level
  const getXpForLevel = useCallback((level) => {
    // Exponential scaling: each level requires more XP
    return Math.floor(CURRENT_SEASON.xpPerLevel * (1 + (level - 1) * 0.1));
  }, []);

  // Fetch user's season pass progress
  const fetchSeasonProgress = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load from localStorage as fallback
      const localProgress = localStorage.getItem('dogtale-season-pass');
      if (localProgress) {
        const parsed = JSON.parse(localProgress);
        setUserProgress(parsed.progress);
        setClaimedRewards(parsed.claimedRewards || []);
      } else {
        // Create default progress
        setUserProgress({
          level: 1,
          xp: 0,
          is_premium: false,
          season_id: CURRENT_SEASON.id,
        });
        setClaimedRewards([]);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user's season pass record
      let { data, error: fetchError } = await supabase
        .from('season_pass')
        .select('*')
        .eq('user_id', user.id)
        .eq('season_id', CURRENT_SEASON.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // No record exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('season_pass')
          .insert({
            user_id: user.id,
            season_id: CURRENT_SEASON.id,
            level: 1,
            xp: 0,
            is_premium: false,
            rewards_claimed: [],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (fetchError) {
        throw fetchError;
      }

      setUserProgress(data);
      setClaimedRewards(data?.rewards_claimed || []);

      // Cache locally
      localStorage.setItem('dogtale-season-pass', JSON.stringify({
        progress: data,
        claimedRewards: data?.rewards_claimed || [],
      }));

    } catch (err) {
      console.error('Error fetching season pass:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add XP from various sources
  const addXP = useCallback(async (amount, source = 'unknown') => {
    if (!userProgress) return { error: { message: 'No season pass found' } };

    const sourceConfig = XP_SOURCES[source];
    const xpToAdd = sourceConfig?.amount || amount;

    let newXp = userProgress.xp + xpToAdd;
    let newLevel = userProgress.level;
    let leveledUp = false;
    const levelsGained = [];

    // Check for level ups
    while (newLevel < CURRENT_SEASON.maxLevel) {
      const xpNeeded = getXpForLevel(newLevel);
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel++;
        leveledUp = true;
        levelsGained.push(newLevel);
      } else {
        break;
      }
    }

    // Cap at max level
    if (newLevel >= CURRENT_SEASON.maxLevel) {
      newLevel = CURRENT_SEASON.maxLevel;
    }

    const updates = {
      xp: newXp,
      level: newLevel,
    };

    if (isOnlineMode && user?.id) {
      try {
        const { error: updateError } = await supabase
          .from('season_pass')
          .update(updates)
          .eq('user_id', user.id)
          .eq('season_id', CURRENT_SEASON.id);

        if (updateError) throw updateError;
      } catch (err) {
        console.error('Error updating season pass XP:', err);
        return { error: err };
      }
    }

    // Update local state
    const newProgress = { ...userProgress, ...updates };
    setUserProgress(newProgress);
    localStorage.setItem('dogtale-season-pass', JSON.stringify({
      progress: newProgress,
      claimedRewards,
    }));

    return {
      success: true,
      xpGained: xpToAdd,
      newXp,
      newLevel,
      leveledUp,
      levelsGained,
    };
  }, [userProgress, user?.id, getXpForLevel, claimedRewards]);

  // Claim a reward at a specific level
  const claimReward = useCallback(async (level) => {
    if (!userProgress) return { error: { message: 'No season pass found' } };
    if (level > userProgress.level) return { error: { message: 'Level not reached' } };
    if (claimedRewards.includes(level)) return { error: { message: 'Already claimed' } };

    const reward = SEASON_REWARDS.find(r => r.level === level);
    if (!reward) return { error: { message: 'Invalid reward level' } };

    const newClaimedRewards = [...claimedRewards, level];

    if (isOnlineMode && user?.id) {
      try {
        const { error: updateError } = await supabase
          .from('season_pass')
          .update({ rewards_claimed: newClaimedRewards })
          .eq('user_id', user.id)
          .eq('season_id', CURRENT_SEASON.id);

        if (updateError) throw updateError;
      } catch (err) {
        console.error('Error claiming reward:', err);
        return { error: err };
      }
    }

    setClaimedRewards(newClaimedRewards);
    localStorage.setItem('dogtale-season-pass', JSON.stringify({
      progress: userProgress,
      claimedRewards: newClaimedRewards,
    }));

    // Return the claimed reward
    const claimedReward = userProgress.is_premium
      ? { free: reward.free, premium: reward.premium }
      : { free: reward.free };

    return {
      success: true,
      reward: claimedReward,
      level,
    };
  }, [userProgress, user?.id, claimedRewards]);

  // Upgrade to premium pass
  const upgradeToPremium = useCallback(async () => {
    if (!isAuthenticated) {
      return { error: { message: 'Must be signed in to upgrade' } };
    }

    // Use Stripe checkout for premium pass
    if (CURRENT_SEASON.premiumPriceId) {
      return createCheckoutSession('season_pass');
    }

    // Fallback: direct update (for testing/demo)
    if (isOnlineMode && user?.id) {
      try {
        const { error: updateError } = await supabase
          .from('season_pass')
          .update({ is_premium: true })
          .eq('user_id', user.id)
          .eq('season_id', CURRENT_SEASON.id);

        if (updateError) throw updateError;

        const newProgress = { ...userProgress, is_premium: true };
        setUserProgress(newProgress);
        localStorage.setItem('dogtale-season-pass', JSON.stringify({
          progress: newProgress,
          claimedRewards,
        }));

        return { success: true };
      } catch (err) {
        console.error('Error upgrading to premium:', err);
        return { error: err };
      }
    }

    return { error: { message: 'Unable to process upgrade' } };
  }, [isAuthenticated, user?.id, userProgress, claimedRewards, createCheckoutSession]);

  // Get available unclaimed rewards
  const getAvailableRewards = useCallback(() => {
    if (!userProgress) return [];

    return SEASON_REWARDS.filter(reward =>
      reward.level <= userProgress.level && !claimedRewards.includes(reward.level)
    );
  }, [userProgress, claimedRewards]);

  // Computed values
  const currentLevel = userProgress?.level || 1;
  const currentXp = userProgress?.xp || 0;
  const xpToNextLevel = currentLevel < CURRENT_SEASON.maxLevel
    ? getXpForLevel(currentLevel)
    : 0;
  const xpProgress = xpToNextLevel > 0
    ? Math.round((currentXp / xpToNextLevel) * 100)
    : 100;
  const isPremium = userProgress?.is_premium || false;
  const availableRewards = useMemo(() => getAvailableRewards(), [getAvailableRewards]);
  const nextReward = SEASON_REWARDS.find(r =>
    r.level > currentLevel || (r.level <= currentLevel && !claimedRewards.includes(r.level))
  );

  // Calculate time remaining in season
  const timeRemaining = useMemo(() => {
    const endDate = new Date(CURRENT_SEASON.endDate);
    const now = new Date();
    const diff = endDate - now;

    if (diff <= 0) return { days: 0, hours: 0, expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours, expired: false };
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSeasonProgress();
    } else {
      // Load offline/demo data
      fetchSeasonProgress();
    }
  }, [isAuthenticated, fetchSeasonProgress]);

  // Listen for realtime updates
  useEffect(() => {
    if (!isOnlineMode || !isAuthenticated || !user?.id) return;

    const subscription = supabase
      .channel(`season-pass-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'season_pass',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.season_id === CURRENT_SEASON.id) {
            setUserProgress(payload.new);
            setClaimedRewards(payload.new.rewards_claimed || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated, user?.id]);

  return {
    // State
    currentSeason: CURRENT_SEASON,
    userProgress,
    rewards: SEASON_REWARDS,
    claimedRewards,
    loading,
    error,
    checkoutLoading,

    // Computed
    currentLevel,
    currentXp,
    xpToNextLevel,
    xpProgress,
    isPremium,
    availableRewards,
    nextReward,
    timeRemaining,
    maxLevel: CURRENT_SEASON.maxLevel,

    // Actions
    fetchSeasonProgress,
    addXP,
    claimReward,
    upgradeToPremium,
    getAvailableRewards,
    getXpForLevel,

    // Clear error
    clearError: () => setError(null),
  };
}

export default useSeasonPass;
