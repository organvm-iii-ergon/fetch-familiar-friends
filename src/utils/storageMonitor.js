/**
 * Storage Quota Monitoring Utility
 *
 * Provides utilities to monitor localStorage usage and warn when approaching quota limits.
 */

// Warning threshold (80% of quota)
const WARNING_THRESHOLD = 0.8;

// Default quota estimate (5MB) when navigator.storage.estimate is not available
const DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024;

/**
 * Check storage quota using the Storage API
 * @returns {Promise<{ usage: number, quota: number, percentUsed: number, isWarning: boolean }>}
 */
export async function checkStorageQuota() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || DEFAULT_QUOTA_BYTES;
      const percentUsed = quota > 0 ? usage / quota : 0;

      return {
        usage,
        quota,
        percentUsed,
        isWarning: percentUsed >= WARNING_THRESHOLD,
        available: quota - usage,
      };
    }
  } catch (error) {
    console.error('Error checking storage quota:', error);
  }

  // Fallback: estimate based on localStorage
  return getLocalStorageUsage();
}

/**
 * Calculate current localStorage usage
 * @returns {{ usage: number, quota: number, percentUsed: number, isWarning: boolean }}
 */
export function getLocalStorageUsage() {
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        // Each character is 2 bytes in JavaScript strings
        totalSize += (key.length + value.length) * 2;
      }
    }
  } catch (error) {
    console.error('Error calculating localStorage usage:', error);
  }

  // Estimate quota based on browser (most browsers allow 5-10MB)
  const estimatedQuota = DEFAULT_QUOTA_BYTES;
  const percentUsed = totalSize / estimatedQuota;

  return {
    usage: totalSize,
    quota: estimatedQuota,
    percentUsed,
    isWarning: percentUsed >= WARNING_THRESHOLD,
    available: estimatedQuota - totalSize,
  };
}

/**
 * Get DogTale-specific storage usage
 * @returns {{ usage: number, items: { key: string, size: number }[] }}
 */
export function getDogTaleStorageUsage() {
  const items = [];
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dogtale-')) {
        const value = localStorage.getItem(key) || '';
        const size = (key.length + value.length) * 2;
        items.push({ key, size });
        totalSize += size;
      }
    }
  } catch (error) {
    console.error('Error calculating DogTale storage usage:', error);
  }

  // Sort by size (largest first)
  items.sort((a, b) => b.size - a.size);

  return {
    usage: totalSize,
    items,
    itemCount: items.length,
  };
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const factor = 1024;
  let unitIndex = 0;
  let size = bytes;

  while (size >= factor && unitIndex < units.length - 1) {
    size /= factor;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Test if localStorage has enough space for a value
 * @param {string} value - Value to test
 * @returns {boolean} True if there's enough space
 */
export function hasSpaceFor(value) {
  const testKey = '__storage_test__';
  try {
    localStorage.setItem(testKey, value);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get storage quota warning message if applicable
 * @returns {Promise<string|null>} Warning message or null
 */
export async function getStorageWarning() {
  const quota = await checkStorageQuota();

  if (quota.percentUsed >= 0.95) {
    return `Storage is almost full (${Math.round(quota.percentUsed * 100)}% used). Please clear some data in Settings.`;
  } else if (quota.isWarning) {
    return `Storage is getting full (${Math.round(quota.percentUsed * 100)}% used). Consider clearing cached images.`;
  }

  return null;
}

/**
 * Subscribe to storage changes
 * @param {Function} callback - Called with updated storage info
 * @returns {Function} Unsubscribe function
 */
export function subscribeToStorageChanges(callback) {
  const handler = (event) => {
    if (event.key?.startsWith('dogtale-') || event.key === null) {
      // Get updated storage info
      getLocalStorageUsage().then?.(callback) || callback(getLocalStorageUsage());
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}
