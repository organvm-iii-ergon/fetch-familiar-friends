/**
 * Image Caching Utility
 *
 * Implements localStorage-based image caching to reduce API calls
 * and improve performance. Stores up to 50 images with 7-day expiry.
 */

const CACHE_KEY = 'dogtale-image-cache';
const MAX_CACHE_SIZE = 50;
const CACHE_EXPIRY_DAYS = 7;

/**
 * Cache entry structure:
 * {
 *   url: string,           // Image URL
 *   type: 'dog' | 'cat',  // Image type
 *   breed: string,         // Breed name if available
 *   timestamp: number,     // When cached
 *   dateKey: string        // Date key (YYYY-MM-DD)
 * }
 */

/**
 * Get the cache from localStorage
 * @returns {Object} - Cache object with dateKey as keys
 */
function getCache() {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return {};

    const cache = JSON.parse(cacheStr);

    // Clean expired entries
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const cleanedCache = {};
    for (const [key, entry] of Object.entries(cache)) {
      if (now - entry.timestamp < expiryMs) {
        cleanedCache[key] = entry;
      }
    }

    return cleanedCache;
  } catch (error) {
    console.error('Error reading image cache:', error);
    return {};
  }
}

/**
 * Save the cache to localStorage
 * @param {Object} cache - Cache object to save
 */
function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving image cache:', error);

    // If quota exceeded, try to clear old entries
    if (error.name === 'QuotaExceededError') {
      try {
        clearOldestEntries(cache, 10);
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (retryError) {
        console.error('Failed to save cache even after clearing:', retryError);
      }
    }
  }
}

/**
 * Clear the oldest entries from cache
 * @param {Object} cache - Cache object
 * @param {number} count - Number of entries to remove
 */
function clearOldestEntries(cache, count) {
  const entries = Object.entries(cache);
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  const toRemove = entries.slice(0, count);
  toRemove.forEach(([key]) => {
    delete cache[key];
  });
}

/**
 * Generate a date key from a Date object
 * @param {Date} date - Date to convert
 * @returns {string} - Date key (YYYY-MM-DD)
 */
function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get cached image for a specific date
 * @param {Date} date - The date to check
 * @returns {Object|null} - Cached image data or null
 */
export function getCachedImage(date) {
  const cache = getCache();
  const dateKey = getDateKey(date);
  return cache[dateKey] || null;
}

/**
 * Cache an image for a specific date
 * @param {Date} date - The date to cache for
 * @param {string} url - Image URL
 * @param {string} type - Image type ('dog' or 'cat')
 * @param {string} breed - Breed name (optional)
 */
export function cacheImage(date, url, type, breed = null) {
  const cache = getCache();
  const dateKey = getDateKey(date);

  // Add new entry
  cache[dateKey] = {
    url,
    type,
    breed,
    timestamp: Date.now(),
    dateKey
  };

  // Enforce size limit
  const entries = Object.entries(cache);
  if (entries.length > MAX_CACHE_SIZE) {
    // Sort by timestamp and remove oldest
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.length - MAX_CACHE_SIZE;

    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
  }

  saveCache(cache);
}

/**
 * Clear all cached images
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export function getCacheStats() {
  const cache = getCache();
  const entries = Object.values(cache);

  const dogCount = entries.filter(e => e.type === 'dog').length;
  const catCount = entries.filter(e => e.type === 'cat').length;

  const now = Date.now();
  const oldestEntry = entries.reduce((oldest, entry) => {
    return !oldest || entry.timestamp < oldest.timestamp ? entry : oldest;
  }, null);

  const newestEntry = entries.reduce((newest, entry) => {
    return !newest || entry.timestamp > newest.timestamp ? entry : newest;
  }, null);

  return {
    total: entries.length,
    dogs: dogCount,
    cats: catCount,
    maxSize: MAX_CACHE_SIZE,
    expiryDays: CACHE_EXPIRY_DAYS,
    oldestAge: oldestEntry ? Math.floor((now - oldestEntry.timestamp) / (1000 * 60 * 60 * 24)) : 0,
    newestAge: newestEntry ? Math.floor((now - newestEntry.timestamp) / (1000 * 60 * 60 * 24)) : 0
  };
}

/**
 * Check if cache is full
 * @returns {boolean} - True if cache is at capacity
 */
export function isCacheFull() {
  const cache = getCache();
  return Object.keys(cache).length >= MAX_CACHE_SIZE;
}

/**
 * Preload images for nearby dates
 * This can be used to proactively cache images for better UX
 * @param {Date} centerDate - The center date
 * @param {number} daysAround - Number of days before/after to preload
 * @param {Function} fetchImageFn - Function to fetch images (async)
 */
export async function preloadNearbyDates(centerDate, daysAround = 3, fetchImageFn) {
  const cache = getCache();
  const promises = [];

  for (let offset = -daysAround; offset <= daysAround; offset++) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() + offset);
    const dateKey = getDateKey(date);

    // Skip if already cached
    if (cache[dateKey]) continue;

    // Don't cache future dates
    if (date > new Date()) continue;

    // Fetch and cache
    promises.push(
      fetchImageFn(date)
        .then(({ url, type, breed }) => {
          cacheImage(date, url, type, breed);
        })
        .catch(error => {
          console.warn(`Failed to preload image for ${dateKey}:`, error);
        })
    );
  }

  return Promise.allSettled(promises);
}
