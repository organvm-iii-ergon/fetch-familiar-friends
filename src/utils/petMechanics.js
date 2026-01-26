/**
 * Pet Mechanics Utility
 * Handles virtual pet stat calculations, care mechanics, and persistence
 */

const STORAGE_KEY = 'dogtale-virtual-pet';
const HISTORY_KEY = 'dogtale-pet-history';

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

// Stat decay rates (per minute)
export const DECAY_RATES = {
  hunger: 0.5,      // Increases 0.5 per minute (gets hungrier)
  energy: 0.3,      // Decreases 0.3 per minute (gets tired)
  happiness: 0.2,   // Decreases 0.2 per minute (gets sadder)
  health: 0.05,     // Decreases if other stats are critically low
};

// Action effects
export const ACTIONS = {
  feed: {
    name: 'Feed',
    icon: '🍖',
    effects: { hunger: -30, happiness: 5, energy: 5 },
    xp: 5,
    cooldown: 5000,
    requirements: { hunger: { min: 10 } },
    message: 'Yummy! {name} enjoyed the meal!',
  },
  play: {
    name: 'Play',
    icon: '🎾',
    effects: { happiness: 20, energy: -15, hunger: 5 },
    xp: 10,
    cooldown: 5000,
    requirements: { energy: { min: 15 } },
    message: '{name} had so much fun playing!',
  },
  rest: {
    name: 'Rest',
    icon: '😴',
    effects: { energy: 30, happiness: -5 },
    xp: 3,
    cooldown: 30000,
    requirements: {},
    message: '{name} is well-rested now!',
  },
  treat: {
    name: 'Treat',
    icon: '🦴',
    effects: { happiness: 15, hunger: -10 },
    xp: 8,
    cooldown: 10000,
    requirements: {},
    message: '{name} loves treats!',
  },
  groom: {
    name: 'Groom',
    icon: '✨',
    effects: { happiness: 10, health: 5 },
    xp: 5,
    cooldown: 15000,
    requirements: {},
    message: '{name} looks so clean and happy!',
  },
  walk: {
    name: 'Walk',
    icon: '🚶',
    effects: { happiness: 25, energy: -20, hunger: 10 },
    xp: 15,
    cooldown: 10000,
    requirements: { energy: { min: 20 } },
    message: '{name} loved the walk!',
  },
  train: {
    name: 'Train',
    icon: '🎯',
    effects: { happiness: 10, energy: -10 },
    xp: 20,
    cooldown: 20000,
    requirements: { energy: { min: 25 }, happiness: { min: 30 } },
    message: '{name} learned something new!',
  },
  vet: {
    name: 'Vet Visit',
    icon: '💉',
    effects: { health: 30, happiness: -10 },
    xp: 10,
    cooldown: 60000,
    requirements: {},
    message: '{name} is feeling healthier!',
  },
};

// Mood configurations
export const MOODS = {
  excited: { emoji: '🤩', threshold: { happiness: 80, energy: 50, hunger: -30 } },
  happy: { emoji: '😊', threshold: { happiness: 60, hunger: -50 } },
  content: { emoji: '😌', threshold: { happiness: 40 } },
  tired: { emoji: '😴', threshold: { energy: -20 } },
  hungry: { emoji: '😋', threshold: { hunger: 70 } },
  sad: { emoji: '😢', threshold: { happiness: -20 } },
  sick: { emoji: '🤒', threshold: { health: -30 } },
  neutral: { emoji: '😐', threshold: {} },
};

// Pet types with their characteristics
export const PET_TYPES = {
  dog: {
    name: 'Dog',
    emoji: '🐕',
    sounds: ['Woof!', 'Bark!', 'Arf!', '*tail wagging*'],
    favoriteAction: 'walk',
    hungerMultiplier: 1.2,
    energyMultiplier: 1.1,
  },
  cat: {
    name: 'Cat',
    emoji: '🐈',
    sounds: ['Meow!', 'Purr...', 'Mrrp?', '*stretches*'],
    favoriteAction: 'play',
    hungerMultiplier: 0.9,
    energyMultiplier: 0.8,
  },
};

// Level requirements (XP needed for each level)
export function getXpForLevel(level) {
  return level * 50;
}

// Calculate level from total XP
export function calculateLevel(totalXp) {
  let level = 1;
  let xpNeeded = getXpForLevel(1);
  let xpSpent = 0;

  while (totalXp >= xpSpent + xpNeeded) {
    xpSpent += xpNeeded;
    level++;
    xpNeeded = getXpForLevel(level);
  }

  return {
    level,
    currentXp: totalXp - xpSpent,
    xpForNextLevel: xpNeeded,
    progressPercent: ((totalXp - xpSpent) / xpNeeded) * 100,
    totalXp,
  };
}

/**
 * Create a default pet
 */
export function createDefaultPet(name = 'Buddy', type = 'dog') {
  const now = new Date().toISOString();
  return {
    id: `pet_${Date.now()}`,
    pet_name: name,
    pet_type: type,
    happiness: 80,
    energy: 80,
    hunger: 20,
    health: 100,
    experience: 0,
    level: 1,
    last_fed_at: now,
    last_played_at: now,
    last_rested_at: now,
    last_updated_at: now,
    created_at: now,
    customization: {
      accessory: null,
      background: 'default',
      color: 'default',
    },
    stats: {
      totalActions: 0,
      favoriteAction: null,
      daysActive: 1,
      maxStreak: 0,
      currentStreak: 0,
    },
  };
}

/**
 * Calculate stat decay based on time elapsed
 */
export function calculateDecay(pet, petType = 'dog') {
  if (!pet || !pet.last_updated_at) return pet;

  const now = new Date();
  const lastUpdate = new Date(pet.last_updated_at);
  const minutesElapsed = (now - lastUpdate) / TIME_CONSTANTS.MINUTE;

  // Cap decay calculation at 24 hours to prevent extreme values
  const cappedMinutes = Math.min(minutesElapsed, 24 * 60);

  const typeConfig = PET_TYPES[petType] || PET_TYPES.dog;

  // Calculate new stats with decay
  const newHunger = Math.min(100, pet.hunger + (cappedMinutes * DECAY_RATES.hunger * typeConfig.hungerMultiplier));
  const newEnergy = Math.max(0, pet.energy - (cappedMinutes * DECAY_RATES.energy * typeConfig.energyMultiplier));
  const newHappiness = Math.max(0, pet.happiness - (cappedMinutes * DECAY_RATES.happiness));

  // Health decays if other stats are critical
  let healthDecay = 0;
  if (newHunger > 90) healthDecay += cappedMinutes * DECAY_RATES.health;
  if (newHappiness < 10) healthDecay += cappedMinutes * DECAY_RATES.health;
  if (newEnergy < 10) healthDecay += cappedMinutes * DECAY_RATES.health;

  const newHealth = Math.max(0, Math.min(100, pet.health - healthDecay));

  return {
    ...pet,
    hunger: Math.round(newHunger),
    energy: Math.round(newEnergy),
    happiness: Math.round(newHappiness),
    health: Math.round(newHealth),
    mood: calculateMood({ happiness: newHappiness, hunger: newHunger, energy: newEnergy, health: newHealth }),
    last_updated_at: now.toISOString(),
  };
}

/**
 * Calculate pet's current mood based on stats
 */
export function calculateMood(stats) {
  const { happiness, hunger, energy, health } = stats;

  if (health < 30) return 'sick';
  if (hunger > 80) return 'hungry';
  if (energy < 20) return 'tired';
  if (happiness < 20) return 'sad';
  if (happiness > 80 && hunger < 30 && energy > 50) return 'excited';
  if (happiness > 60) return 'happy';
  if (happiness > 40) return 'content';

  return 'neutral';
}

/**
 * Check if an action can be performed
 */
export function canPerformAction(pet, actionKey) {
  const action = ACTIONS[actionKey];
  if (!action) return { canPerform: false, reason: 'Invalid action' };

  const requirements = action.requirements || {};

  for (const [stat, req] of Object.entries(requirements)) {
    if (req.min !== undefined && pet[stat] < req.min) {
      return {
        canPerform: false,
        reason: `${pet.pet_name} needs more ${stat} (${pet[stat]}/${req.min})`,
      };
    }
    if (req.max !== undefined && pet[stat] > req.max) {
      return {
        canPerform: false,
        reason: `${pet.pet_name}'s ${stat} is too high`,
      };
    }
  }

  return { canPerform: true, reason: null };
}

/**
 * Apply action effects to pet stats
 */
export function applyAction(pet, actionKey) {
  const action = ACTIONS[actionKey];
  if (!action) return { pet, result: { error: 'Invalid action' } };

  const canDo = canPerformAction(pet, actionKey);
  if (!canDo.canPerform) {
    return { pet, result: { error: canDo.reason } };
  }

  const now = new Date().toISOString();
  const newStats = { ...pet };

  // Apply effects
  for (const [stat, change] of Object.entries(action.effects)) {
    if (newStats[stat] !== undefined) {
      newStats[stat] = Math.max(0, Math.min(100, newStats[stat] + change));
    }
  }

  // Add XP
  const oldLevel = pet.level;
  newStats.experience = (pet.experience || 0) + action.xp;

  // Check for level up
  const levelInfo = calculateLevel(newStats.experience);
  const leveledUp = levelInfo.level > oldLevel;
  newStats.level = levelInfo.level;

  // Update timestamps
  newStats.last_updated_at = now;
  if (actionKey === 'feed') newStats.last_fed_at = now;
  if (actionKey === 'play' || actionKey === 'walk') newStats.last_played_at = now;
  if (actionKey === 'rest') newStats.last_rested_at = now;

  // Update stats tracking
  newStats.stats = {
    ...pet.stats,
    totalActions: (pet.stats?.totalActions || 0) + 1,
  };

  // Recalculate mood
  newStats.mood = calculateMood(newStats);

  // Generate message
  const message = action.message.replace('{name}', pet.pet_name);

  return {
    pet: newStats,
    result: {
      success: true,
      action: actionKey,
      xpGained: action.xp,
      leveledUp,
      newLevel: levelInfo.level,
      message,
    },
  };
}

/**
 * Get a random pet sound
 */
export function getPetSound(petType) {
  const config = PET_TYPES[petType] || PET_TYPES.dog;
  return config.sounds[Math.floor(Math.random() * config.sounds.length)];
}

/**
 * Get mood emoji and info
 */
export function getMoodInfo(mood) {
  return MOODS[mood] || MOODS.neutral;
}

/**
 * Load pet from localStorage
 */
export function loadPet() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const pet = JSON.parse(stored);
    return calculateDecay(pet, pet.pet_type);
  } catch (err) {
    console.error('Error loading pet:', err);
    return null;
  }
}

/**
 * Save pet to localStorage
 */
export function savePet(pet) {
  try {
    const toSave = {
      ...pet,
      last_updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (err) {
    console.error('Error saving pet:', err);
    return false;
  }
}

/**
 * Record action to history
 */
export function recordAction(actionKey, xpGained) {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const history = stored ? JSON.parse(stored) : { actions: [], totalXp: 0 };

    history.actions.push({
      action: actionKey,
      xp: xpGained,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 actions
    if (history.actions.length > 100) {
      history.actions = history.actions.slice(-100);
    }

    history.totalXp = (history.totalXp || 0) + xpGained;

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (err) {
    console.error('Error recording action:', err);
    return null;
  }
}

/**
 * Get care tips based on pet state
 */
export function getCareTips(pet) {
  const tips = [];

  if (pet.hunger > 70) {
    tips.push({ priority: 'high', action: 'feed', message: `${pet.pet_name} is hungry! Time to feed.` });
  }
  if (pet.energy < 30) {
    tips.push({ priority: 'high', action: 'rest', message: `${pet.pet_name} is tired. Let them rest.` });
  }
  if (pet.happiness < 40) {
    tips.push({ priority: 'medium', action: 'play', message: `${pet.pet_name} seems sad. Play with them!` });
  }
  if (pet.health < 50) {
    tips.push({ priority: 'high', action: 'vet', message: `${pet.pet_name} might need a vet visit.` });
  }
  if (tips.length === 0) {
    tips.push({ priority: 'low', action: null, message: `${pet.pet_name} is doing great!` });
  }

  return tips;
}

/**
 * Calculate pet's overall wellbeing score (0-100)
 */
export function calculateWellbeing(pet) {
  const hungerScore = 100 - pet.hunger; // Lower hunger is better
  const weights = {
    happiness: 0.3,
    energy: 0.2,
    health: 0.3,
    hunger: 0.2,
  };

  return Math.round(
    pet.happiness * weights.happiness +
    pet.energy * weights.energy +
    pet.health * weights.health +
    hungerScore * weights.hunger
  );
}

export default {
  TIME_CONSTANTS,
  DECAY_RATES,
  ACTIONS,
  MOODS,
  PET_TYPES,
  getXpForLevel,
  calculateLevel,
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
};
