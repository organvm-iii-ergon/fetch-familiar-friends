import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';
import {
  ACTIONS,
  MOODS,
  PET_TYPES,
  TIME_CONSTANTS,
  createDefaultPet,
  calculateDecay,
  calculateMood,
  canPerformAction,
  applyAction,
  getPetSound,
  getMoodInfo,
  loadPet,
  savePet,
  recordAction,
  getCareTips,
  calculateWellbeing,
  calculateLevel,
} from '../utils/petMechanics';

// Re-export for convenience
export { ACTIONS, MOODS, PET_TYPES };

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
  const [lastActionResult, setLastActionResult] = useState(null);
  const [careTips, setCareTips] = useState([]);

  const decayIntervalRef = useRef(null);

  // Update care tips when pet changes
  const updateCareTips = useCallback((petData) => {
    if (petData) {
      setCareTips(getCareTips(petData));
    }
  }, []);

  // Fetch virtual pet
  const fetchPet = useCallback(async () => {
    // Always try local first
    let localPetData = loadPet();

    if (!isOnlineMode || !user?.id) {
      if (localPetData) {
        setPet(localPetData);
        updateCareTips(localPetData);
      } else {
        // Create default pet
        const defaultPet = createDefaultPet();
        savePet(defaultPet);
        setPet(defaultPet);
        updateCareTips(defaultPet);
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

      if (fetchError) {
        // If no server pet, use local or create default
        if (localPetData) {
          setPet(localPetData);
          updateCareTips(localPetData);
        } else {
          const defaultPet = createDefaultPet();
          savePet(defaultPet);
          setPet(defaultPet);
          updateCareTips(defaultPet);
        }
        return;
      }

      const processedPet = calculateDecay(data, data.pet_type);
      setPet(processedPet);
      savePet(processedPet);
      updateCareTips(processedPet);

    } catch (err) {
      console.error('Error fetching virtual pet:', err);
      // Fall back to local
      if (localPetData) {
        setPet(localPetData);
        updateCareTips(localPetData);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, updateCareTips]);

  // Save pet state (local + server if available)
  const savePetState = useCallback(async (newPet) => {
    if (!newPet) return;

    // Always save locally
    savePet(newPet);
    setPet(newPet);
    updateCareTips(newPet);

    // Also sync to server if available
    if (isOnlineMode && user?.id) {
      try {
        await supabase
          .from('virtual_pets')
          .upsert({
            user_id: user.id,
            ...newPet,
          });
      } catch (err) {
        console.error('Error syncing pet to server:', err);
        // Local save succeeded, so don't throw
      }
    }
  }, [user?.id, updateCareTips]);

  // Perform an action on the pet
  const performAction = useCallback(async (actionKey) => {
    if (!pet) return { error: { message: 'No pet found' } };

    const actionDef = ACTIONS[actionKey];
    if (!actionDef) return { error: { message: 'Invalid action' } };

    // Check cooldown
    const cooldown = actionCooldowns[actionKey];
    if (cooldown && cooldown > Date.now()) {
      const remainingSeconds = Math.ceil((cooldown - Date.now()) / 1000);
      return { error: { message: `Please wait ${remainingSeconds}s` } };
    }

    // Check if action can be performed
    const canDo = canPerformAction(pet, actionKey);
    if (!canDo.canPerform) {
      return { error: { message: canDo.reason } };
    }

    // Apply the action using utility
    const { pet: newPet, result } = applyAction(pet, actionKey);

    if (result.error) {
      return { error: { message: result.error } };
    }

    // Set cooldown
    const cooldownTime = actionDef.cooldown || 5000;
    setActionCooldowns(prev => ({
      ...prev,
      [actionKey]: Date.now() + cooldownTime,
    }));

    // Save updated pet
    await savePetState(newPet);

    // Record action to history
    recordAction(actionKey, result.xpGained);

    // Store last action result for UI feedback
    setLastActionResult({
      ...result,
      sound: getPetSound(pet.pet_type),
      timestamp: Date.now(),
    });

    // Clear result after 3 seconds
    setTimeout(() => setLastActionResult(null), 3000);

    return result;
  }, [pet, actionCooldowns, savePetState]);

  // Rename pet
  const renamePet = useCallback(async (newName) => {
    if (!newName?.trim()) return { error: { message: 'Name is required' } };
    if (!pet) return { error: { message: 'No pet found' } };

    const newPet = { ...pet, pet_name: newName.trim() };
    await savePetState(newPet);
    return { error: null };
  }, [pet, savePetState]);

  // Change pet type
  const changePetType = useCallback(async (newType) => {
    if (!['dog', 'cat'].includes(newType)) {
      return { error: { message: 'Invalid pet type' } };
    }
    if (!pet) return { error: { message: 'No pet found' } };

    const newPet = { ...pet, pet_type: newType };
    await savePetState(newPet);
    return { error: null };
  }, [pet, savePetState]);

  // Update customization
  const updateCustomization = useCallback(async (customization) => {
    if (!pet) return { error: { message: 'No pet found' } };

    const newCustomization = {
      ...(pet.customization || {}),
      ...customization,
    };

    const newPet = { ...pet, customization: newCustomization };
    await savePetState(newPet);
    return { error: null };
  }, [pet, savePetState]);

  // Reset pet (create new default pet)
  const resetPet = useCallback(async (name, type) => {
    const newPet = createDefaultPet(name || 'Buddy', type || 'dog');
    await savePetState(newPet);
    return { error: null, pet: newPet };
  }, [savePetState]);

  // Set up decay interval
  useEffect(() => {
    decayIntervalRef.current = setInterval(() => {
      setPet(prev => {
        if (!prev) return null;
        const decayed = calculateDecay(prev, prev.pet_type);
        // Update care tips when stats change
        setCareTips(getCareTips(decayed));
        // Also persist the decayed state
        savePet(decayed);
        return decayed;
      });
    }, TIME_CONSTANTS.MINUTE);

    return () => {
      if (decayIntervalRef.current) {
        clearInterval(decayIntervalRef.current);
      }
    };
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPet();
    }
  }, [isAuthenticated, fetchPet]);

  // Get remaining cooldown time
  const getCooldownRemaining = useCallback((actionKey) => {
    const cooldown = actionCooldowns[actionKey];
    if (!cooldown || cooldown <= Date.now()) return 0;
    return Math.ceil((cooldown - Date.now()) / 1000);
  }, [actionCooldowns]);

  // Check if action is on cooldown
  const isOnCooldown = useCallback((actionKey) => {
    return getCooldownRemaining(actionKey) > 0;
  }, [getCooldownRemaining]);

  return {
    // State
    pet,
    loading,
    error,
    actionCooldowns,
    lastActionResult,
    careTips,

    // Computed
    mood: pet?.mood || 'neutral',
    moodInfo: getMoodInfo(pet?.mood || 'neutral'),
    level: pet?.level || 1,
    levelInfo: pet ? calculateLevel(pet.experience || 0) : null,
    isHungry: (pet?.hunger || 0) > 70,
    isTired: (pet?.energy || 0) < 30,
    isSad: (pet?.happiness || 0) < 30,
    isSick: (pet?.health || 100) < 30,
    needsAttention: (pet?.hunger || 0) > 70 || (pet?.happiness || 0) < 30 || (pet?.health || 100) < 30,
    wellbeing: pet ? calculateWellbeing(pet) : 0,
    petType: PET_TYPES[pet?.pet_type] || PET_TYPES.dog,
    hasPet: !!pet,

    // Actions
    fetchPet,
    performAction,
    renamePet,
    changePetType,
    updateCustomization,
    resetPet,

    // Convenience actions
    feed: () => performAction('feed'),
    play: () => performAction('play'),
    rest: () => performAction('rest'),
    treat: () => performAction('treat'),
    groom: () => performAction('groom'),
    walk: () => performAction('walk'),
    train: () => performAction('train'),
    vet: () => performAction('vet'),

    // Cooldown helpers
    getCooldownRemaining,
    isOnCooldown,

    // Utilities
    getSound: () => pet ? getPetSound(pet.pet_type) : '',
    canPerform: (action) => pet ? canPerformAction(pet, action) : { canPerform: false },

    // Clear states
    clearError: () => setError(null),
    clearLastAction: () => setLastActionResult(null),
  };
}

export default useVirtualPet;
