import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

// Time constants
const STAT_DECAY_INTERVAL = 60 * 1000; // Check every minute
const HUNGER_RATE = 0.5; // Per minute
const ENERGY_DECAY_RATE = 0.3; // Per minute
const HAPPINESS_DECAY_RATE = 0.2; // Per minute

// Action rewards
const ACTIONS = {
  feed: { hunger: -30, happiness: 5, energy: 5, xp: 5 },
  play: { happiness: 20, energy: -15, hunger: 5, xp: 10 },
  rest: { energy: 30, happiness: -5, xp: 3 },
  treat: { happiness: 15, hunger: -10, xp: 8 },
  groom: { happiness: 10, xp: 5 },
  walk: { happiness: 25, energy: -20, hunger: 10, xp: 15 },
};

/**
 * Hook for managing virtual pet state
 * @returns {Object} Virtual pet state and methods
 */
export function useVirtualPet() {
  const { user, isAuthenticated } = useAuth();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionCooldowns, setActionCooldowns] = useState({});

  const decayIntervalRef = useRef(null);

  // Calculate stat changes based on time elapsed
  const calculateDecay = useCallback((pet) => {
    if (!pet) return pet;

    const now = new Date();
    const lastFed = new Date(pet.last_fed_at);
    const lastPlayed = new Date(pet.last_played_at);
    const lastRested = new Date(pet.last_rested_at);

    // Calculate minutes since last action
    const minutesSinceFed = (now - lastFed) / 60000;
    const minutesSincePlayed = (now - lastPlayed) / 60000;
    const minutesSinceRested = (now - lastRested) / 60000;

    // Calculate new stats with decay
    const newHunger = Math.min(100, pet.hunger + (minutesSinceFed * HUNGER_RATE));
    const newHappiness = Math.max(0, pet.happiness - (minutesSincePlayed * HAPPINESS_DECAY_RATE));
    const newEnergy = Math.max(0, pet.energy - (minutesSinceRested * ENERGY_DECAY_RATE));

    return {
      ...pet,
      hunger: Math.round(newHunger),
      happiness: Math.round(newHappiness),
      energy: Math.round(newEnergy),
      mood: calculateMood(newHappiness, newHunger, newEnergy),
    };
  }, []);

  // Fetch virtual pet
  const fetchPet = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load from localStorage
      const localPet = localStorage.getItem('dogtale-virtual-pet');
      if (localPet) {
        const parsed = JSON.parse(localPet);
        setPet(calculateDecay(parsed));
      } else {
        // Create default pet
        setPet(createDefaultPet());
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('virtual_pets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const processedPet = calculateDecay(data);
      setPet(processedPet);

      // Cache locally
      localStorage.setItem('dogtale-virtual-pet', JSON.stringify(data));

    } catch (err) {
      console.error('Error fetching virtual pet:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, calculateDecay]);

  // Save pet state
  const savePet = useCallback(async (updates) => {
    if (!isOnlineMode || !user?.id || !pet) return;

    try {
      const { error: updateError } = await supabase
        .from('virtual_pets')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      const newPet = { ...pet, ...updates };
      setPet(newPet);
      localStorage.setItem('dogtale-virtual-pet', JSON.stringify(newPet));

    } catch (err) {
      console.error('Error saving virtual pet:', err);
    }
  }, [user?.id, pet]);

  // Perform an action on the pet
  const performAction = useCallback(async (action) => {
    if (!pet) return { error: { message: 'No pet found' } };

    const actionDef = ACTIONS[action];
    if (!actionDef) return { error: { message: 'Invalid action' } };

    // Check cooldown
    const cooldown = actionCooldowns[action];
    if (cooldown && cooldown > Date.now()) {
      const remainingSeconds = Math.ceil((cooldown - Date.now()) / 1000);
      return { error: { message: `Please wait ${remainingSeconds}s` } };
    }

    // Check if pet has enough stats
    if (action === 'play' && pet.energy < 15) {
      return { error: { message: 'Pet is too tired to play!' } };
    }
    if (action === 'walk' && pet.energy < 20) {
      return { error: { message: 'Pet is too tired for a walk!' } };
    }

    // Calculate new stats
    const newStats = {
      happiness: Math.max(0, Math.min(100, pet.happiness + (actionDef.happiness || 0))),
      energy: Math.max(0, Math.min(100, pet.energy + (actionDef.energy || 0))),
      hunger: Math.max(0, Math.min(100, pet.hunger + (actionDef.hunger || 0))),
      experience: pet.experience + (actionDef.xp || 0),
    };

    // Check for level up
    let leveledUp = false;
    let newLevel = pet.level;
    const xpForNextLevel = pet.level * 50;

    if (newStats.experience >= xpForNextLevel) {
      newLevel = pet.level + 1;
      newStats.experience = newStats.experience - xpForNextLevel;
      leveledUp = true;
    }

    // Update timestamps
    const now = new Date().toISOString();
    const updates = {
      ...newStats,
      level: newLevel,
      ...(action === 'feed' && { last_fed_at: now }),
      ...(action === 'play' || action === 'walk' && { last_played_at: now }),
      ...(action === 'rest' && { last_rested_at: now }),
    };

    // Set cooldown
    const cooldownTime = action === 'rest' ? 30000 : 5000; // 30s for rest, 5s for others
    setActionCooldowns(prev => ({
      ...prev,
      [action]: Date.now() + cooldownTime,
    }));

    await savePet(updates);

    return {
      success: true,
      leveledUp,
      newLevel,
      xpGained: actionDef.xp,
    };
  }, [pet, actionCooldowns, savePet]);

  // Rename pet
  const renamePet = useCallback(async (newName) => {
    if (!newName?.trim()) return { error: { message: 'Name is required' } };

    await savePet({ pet_name: newName.trim() });
    return { error: null };
  }, [savePet]);

  // Change pet type
  const changePetType = useCallback(async (newType) => {
    if (!['dog', 'cat'].includes(newType)) {
      return { error: { message: 'Invalid pet type' } };
    }

    await savePet({ pet_type: newType });
    return { error: null };
  }, [savePet]);

  // Update customization
  const updateCustomization = useCallback(async (customization) => {
    const newCustomization = {
      ...(pet?.customization || {}),
      ...customization,
    };

    await savePet({ customization: newCustomization });
    return { error: null };
  }, [pet?.customization, savePet]);

  // Set up decay interval
  useEffect(() => {
    decayIntervalRef.current = setInterval(() => {
      setPet(prev => prev ? calculateDecay(prev) : null);
    }, STAT_DECAY_INTERVAL);

    return () => {
      if (decayIntervalRef.current) {
        clearInterval(decayIntervalRef.current);
      }
    };
  }, [calculateDecay]);

  // Fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPet();
    }
  }, [isAuthenticated, fetchPet]);

  return {
    // State
    pet,
    loading,
    error,
    actionCooldowns,

    // Computed
    mood: pet?.mood || 'neutral',
    level: pet?.level || 1,
    isHungry: (pet?.hunger || 0) > 70,
    isTired: (pet?.energy || 0) < 30,
    isSad: (pet?.happiness || 0) < 30,
    needsAttention: (pet?.hunger || 0) > 70 || (pet?.happiness || 0) < 30,

    // Actions
    fetchPet,
    performAction,
    renamePet,
    changePetType,
    updateCustomization,

    // Convenience actions
    feed: () => performAction('feed'),
    play: () => performAction('play'),
    rest: () => performAction('rest'),
    treat: () => performAction('treat'),
    groom: () => performAction('groom'),
    walk: () => performAction('walk'),

    // Clear error
    clearError: () => setError(null),
  };
}

// Helper functions
function createDefaultPet() {
  return {
    pet_name: 'Buddy',
    pet_type: 'dog',
    happiness: 80,
    energy: 80,
    hunger: 20,
    experience: 0,
    level: 1,
    last_fed_at: new Date().toISOString(),
    last_played_at: new Date().toISOString(),
    last_rested_at: new Date().toISOString(),
    customization: {},
    mood: 'happy',
  };
}

function calculateMood(happiness, hunger, energy) {
  if (happiness < 20 || hunger > 80) return 'sad';
  if (energy < 20) return 'tired';
  if (happiness > 80 && hunger < 30 && energy > 50) return 'excited';
  if (happiness > 60) return 'happy';
  return 'neutral';
}

export default useVirtualPet;
