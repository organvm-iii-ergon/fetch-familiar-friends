/**
 * Memorial Storage Utility
 * Handles localStorage persistence for pet memorials with backup/recovery support
 */

import { dogTaleStorage } from './resilientStorage';

const MEMORIALS_KEY = 'memorials';
const CANDLES_KEY = 'memorial-candles';
const TRIBUTES_KEY = 'memorial-tributes';
const LOCKED_DATES_KEY = 'memorial-locked-dates';

/**
 * Memorial data structure
 * @typedef {Object} Memorial
 * @property {string} id - Unique identifier
 * @property {string} name - Pet's name
 * @property {string} breed - Pet's breed
 * @property {string} species - 'dog' or 'cat'
 * @property {string} startDate - Birth date or when they entered your life (YYYY-MM-DD)
 * @property {string} endDate - Date they crossed the rainbow bridge (YYYY-MM-DD)
 * @property {string} photo - Photo URL or emoji fallback
 * @property {string} tribute - Main tribute message
 * @property {string[]} memories - Array of memory snippets
 * @property {string[]} personalityTraits - Array of personality traits
 * @property {string[]} quirks - Array of quirks
 * @property {number} candlesLit - Number of candles lit by the community
 * @property {number} tributeCount - Number of tributes received
 * @property {number} createdAt - Timestamp when memorial was created
 * @property {number} updatedAt - Timestamp of last update
 * @property {boolean} isPublic - Whether memorial is shared with community
 */

/**
 * Load all memorials from storage
 * @returns {Memorial[]} Array of memorials
 */
export function loadMemorials() {
  const result = dogTaleStorage.load(MEMORIALS_KEY, []);
  if (result.recovered) {
    console.info('Memorials recovered from backup');
  }
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Save memorials to storage
 * @param {Memorial[]} memorials - Array of memorials to save
 * @returns {boolean} Success status
 */
export function saveMemorials(memorials) {
  const result = dogTaleStorage.save(MEMORIALS_KEY, memorials);
  return result.success;
}

/**
 * Create a new memorial
 * @param {Partial<Memorial>} memorialData - Memorial data (without id, timestamps)
 * @returns {Memorial} The created memorial with generated id and timestamps
 */
export function createMemorial(memorialData) {
  const memorials = loadMemorials();

  const newMemorial = {
    id: `memorial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: memorialData.name || 'Beloved Pet',
    breed: memorialData.breed || 'Unknown',
    species: memorialData.species || 'dog',
    startDate: memorialData.startDate || '',
    endDate: memorialData.endDate || '',
    photo: memorialData.photo || (memorialData.species === 'cat' ? '🐱' : '🐕'),
    tribute: memorialData.tribute || '',
    memories: memorialData.memories || [],
    personalityTraits: memorialData.personalityTraits || [],
    quirks: memorialData.quirks || [],
    candlesLit: 0,
    tributeCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublic: memorialData.isPublic ?? false,
  };

  memorials.unshift(newMemorial);
  saveMemorials(memorials);

  return newMemorial;
}

/**
 * Update an existing memorial
 * @param {string} id - Memorial ID
 * @param {Partial<Memorial>} updates - Fields to update
 * @returns {Memorial|null} Updated memorial or null if not found
 */
export function updateMemorial(id, updates) {
  const memorials = loadMemorials();
  const index = memorials.findIndex(m => m.id === id);

  if (index === -1) {
    return null;
  }

  memorials[index] = {
    ...memorials[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveMemorials(memorials);
  return memorials[index];
}

/**
 * Delete a memorial
 * @param {string} id - Memorial ID
 * @returns {boolean} Success status
 */
export function deleteMemorial(id) {
  const memorials = loadMemorials();
  const filtered = memorials.filter(m => m.id !== id);

  if (filtered.length === memorials.length) {
    return false; // Not found
  }

  return saveMemorials(filtered);
}

/**
 * Get a single memorial by ID
 * @param {string} id - Memorial ID
 * @returns {Memorial|null} Memorial or null if not found
 */
export function getMemorial(id) {
  const memorials = loadMemorials();
  return memorials.find(m => m.id === id) || null;
}

/**
 * Add a memory to a memorial
 * @param {string} memorialId - Memorial ID
 * @param {string} memory - Memory text to add
 * @returns {Memorial|null} Updated memorial or null if not found
 */
export function addMemory(memorialId, memory) {
  const memorial = getMemorial(memorialId);
  if (!memorial) return null;

  return updateMemorial(memorialId, {
    memories: [...memorial.memories, memory],
  });
}

/**
 * Remove a memory from a memorial
 * @param {string} memorialId - Memorial ID
 * @param {number} memoryIndex - Index of memory to remove
 * @returns {Memorial|null} Updated memorial or null if not found
 */
export function removeMemory(memorialId, memoryIndex) {
  const memorial = getMemorial(memorialId);
  if (!memorial) return null;

  const memories = [...memorial.memories];
  memories.splice(memoryIndex, 1);

  return updateMemorial(memorialId, { memories });
}

// ============ Candle Management ============

/**
 * Load candle data
 * @returns {Object} Map of memorial ID to candle count
 */
export function loadCandles() {
  const result = dogTaleStorage.load(CANDLES_KEY, {});
  return typeof result.data === 'object' ? result.data : {};
}

/**
 * Light a candle for a memorial
 * @param {string} memorialId - Memorial ID
 * @returns {number} New candle count
 */
export function lightCandle(memorialId) {
  const candles = loadCandles();
  candles[memorialId] = (candles[memorialId] || 0) + 1;
  dogTaleStorage.save(CANDLES_KEY, candles);

  // Also update the memorial's candle count
  const memorial = getMemorial(memorialId);
  if (memorial) {
    updateMemorial(memorialId, { candlesLit: memorial.candlesLit + 1 });
  }

  return candles[memorialId];
}

/**
 * Get candle count for a memorial
 * @param {string} memorialId - Memorial ID
 * @returns {number} Candle count
 */
export function getCandleCount(memorialId) {
  const candles = loadCandles();
  return candles[memorialId] || 0;
}

// ============ Community Tributes ============

/**
 * Tribute data structure
 * @typedef {Object} Tribute
 * @property {string} id
 * @property {string} memorialId
 * @property {string} author
 * @property {string} message
 * @property {number} createdAt
 */

/**
 * Load tributes
 * @returns {Object} Map of memorial ID to tributes array
 */
export function loadTributes() {
  const result = dogTaleStorage.load(TRIBUTES_KEY, {});
  return typeof result.data === 'object' ? result.data : {};
}

/**
 * Add a tribute to a memorial
 * @param {string} memorialId - Memorial ID
 * @param {string} author - Author name
 * @param {string} message - Tribute message
 * @returns {Tribute} The created tribute
 */
export function addTribute(memorialId, author, message) {
  const tributes = loadTributes();

  const newTribute = {
    id: `tribute_${Date.now()}`,
    memorialId,
    author: author || 'Anonymous',
    message,
    createdAt: Date.now(),
  };

  if (!tributes[memorialId]) {
    tributes[memorialId] = [];
  }
  tributes[memorialId].push(newTribute);
  dogTaleStorage.save(TRIBUTES_KEY, tributes);

  // Update tribute count on memorial
  const memorial = getMemorial(memorialId);
  if (memorial) {
    updateMemorial(memorialId, { tributeCount: memorial.tributeCount + 1 });
  }

  return newTribute;
}

/**
 * Get tributes for a memorial
 * @param {string} memorialId - Memorial ID
 * @returns {Tribute[]} Array of tributes
 */
export function getTributes(memorialId) {
  const tributes = loadTributes();
  return tributes[memorialId] || [];
}

// ============ Date Locking ============

/**
 * Lock a date in the calendar to preserve the pet's image
 * @param {string} dateString - Date to lock (YYYY-MM-DD)
 * @param {string} memorialId - Associated memorial ID
 * @param {Object} imageData - Image data to preserve
 * @returns {boolean} Success status
 */
export function lockDate(dateString, memorialId, imageData) {
  const result = dogTaleStorage.load(LOCKED_DATES_KEY, {});
  const lockedDates = typeof result.data === 'object' ? result.data : {};

  lockedDates[dateString] = {
    memorialId,
    imageData,
    lockedAt: Date.now(),
  };

  return dogTaleStorage.save(LOCKED_DATES_KEY, lockedDates).success;
}

/**
 * Unlock a previously locked date
 * @param {string} dateString - Date to unlock (YYYY-MM-DD)
 * @returns {boolean} Success status
 */
export function unlockDate(dateString) {
  const result = dogTaleStorage.load(LOCKED_DATES_KEY, {});
  const lockedDates = typeof result.data === 'object' ? result.data : {};

  if (!lockedDates[dateString]) {
    return false;
  }

  delete lockedDates[dateString];
  return dogTaleStorage.save(LOCKED_DATES_KEY, lockedDates).success;
}

/**
 * Check if a date is locked
 * @param {string} dateString - Date to check (YYYY-MM-DD)
 * @returns {Object|null} Lock data or null if not locked
 */
export function getLockedDate(dateString) {
  const result = dogTaleStorage.load(LOCKED_DATES_KEY, {});
  const lockedDates = typeof result.data === 'object' ? result.data : {};
  return lockedDates[dateString] || null;
}

/**
 * Get all locked dates
 * @returns {Object} Map of date strings to lock data
 */
export function getAllLockedDates() {
  const result = dogTaleStorage.load(LOCKED_DATES_KEY, {});
  return typeof result.data === 'object' ? result.data : {};
}

/**
 * Get all locked dates for a specific memorial
 * @param {string} memorialId - Memorial ID
 * @returns {string[]} Array of locked date strings
 */
export function getLockedDatesForMemorial(memorialId) {
  const allLocked = getAllLockedDates();
  return Object.entries(allLocked)
    .filter(([, data]) => data.memorialId === memorialId)
    .map(([date]) => date);
}

// ============ Export for backup ============

/**
 * Export all memorial data for backup
 * @returns {Object} All memorial-related data
 */
export function exportMemorialData() {
  return {
    memorials: loadMemorials(),
    candles: loadCandles(),
    tributes: loadTributes(),
    lockedDates: getAllLockedDates(),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import memorial data from backup
 * @param {Object} data - Previously exported data
 * @returns {boolean} Success status
 */
export function importMemorialData(data) {
  try {
    if (data.memorials) {
      saveMemorials(data.memorials);
    }
    if (data.candles) {
      dogTaleStorage.save(CANDLES_KEY, data.candles);
    }
    if (data.tributes) {
      dogTaleStorage.save(TRIBUTES_KEY, data.tributes);
    }
    if (data.lockedDates) {
      dogTaleStorage.save(LOCKED_DATES_KEY, data.lockedDates);
    }
    return true;
  } catch (error) {
    console.error('Error importing memorial data:', error);
    return false;
  }
}

export default {
  loadMemorials,
  saveMemorials,
  createMemorial,
  updateMemorial,
  deleteMemorial,
  getMemorial,
  addMemory,
  removeMemory,
  lightCandle,
  getCandleCount,
  addTribute,
  getTributes,
  lockDate,
  unlockDate,
  getLockedDate,
  getAllLockedDates,
  getLockedDatesForMemorial,
  exportMemorialData,
  importMemorialData,
};
