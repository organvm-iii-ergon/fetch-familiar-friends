/**
 * Resilient Storage Utility
 *
 * Provides localStorage access with:
 * - Versioned backups (max 3) with rotation
 * - Write verification before returning success
 * - Automatic recovery from corrupted data
 * - Fallback to backups on parse errors
 */

const MAX_BACKUPS = 3;
const BACKUP_SUFFIX = '_backup';

/**
 * Get the backup keys for a given storage key
 * @param {string} key - Base storage key
 * @returns {string[]} Array of backup key names
 */
function getBackupKeys(key) {
  return Array.from({ length: MAX_BACKUPS }, (_, i) => `${key}${BACKUP_SUFFIX}_${i}`);
}

/**
 * Rotate backups - shift all backups down and create new backup from current value
 * @param {string} key - Storage key
 * @param {string} currentValue - Current value to backup
 */
function rotateBackups(key, currentValue) {
  if (!currentValue) return;

  const backupKeys = getBackupKeys(key);

  try {
    // Shift backups: 2 -> delete, 1 -> 2, 0 -> 1
    for (let i = MAX_BACKUPS - 1; i > 0; i--) {
      const prevBackup = localStorage.getItem(backupKeys[i - 1]);
      if (prevBackup !== null) {
        localStorage.setItem(backupKeys[i], prevBackup);
      } else {
        localStorage.removeItem(backupKeys[i]);
      }
    }

    // Save current value as newest backup (index 0)
    localStorage.setItem(backupKeys[0], currentValue);
  } catch (error) {
    console.error('Error rotating backups:', error);
  }
}

/**
 * Try to recover data from backups
 * @param {string} key - Storage key
 * @returns {string|null} Recovered value or null
 */
function recoverFromBackups(key) {
  const backupKeys = getBackupKeys(key);

  for (const backupKey of backupKeys) {
    try {
      const backup = localStorage.getItem(backupKey);
      if (backup !== null) {
        // Verify backup is valid JSON
        JSON.parse(backup);
        console.info(`Recovered ${key} from backup: ${backupKey}`);
        return backup;
      }
    } catch (e) {
      // This backup is also corrupted, try next one
      continue;
    }
  }

  return null;
}

/**
 * Verify a write operation was successful
 * @param {string} key - Storage key
 * @param {string} value - Expected value
 * @returns {boolean} True if verification passed
 */
function verifyWrite(key, value) {
  try {
    const stored = localStorage.getItem(key);
    return stored === value;
  } catch (error) {
    return false;
  }
}

/**
 * Save data to localStorage with resilience features
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @param {Object} options - Options
 * @param {boolean} options.createBackup - Whether to create a backup (default: true)
 * @returns {{ success: boolean, error?: Error }} Result object
 */
export function saveData(key, value, options = { createBackup: true }) {
  try {
    const stringValue = JSON.stringify(value);

    // Create backup of existing value before overwriting
    if (options.createBackup) {
      const existingValue = localStorage.getItem(key);
      if (existingValue !== null) {
        rotateBackups(key, existingValue);
      }
    }

    // Write new value
    localStorage.setItem(key, stringValue);

    // Verify write
    if (!verifyWrite(key, stringValue)) {
      throw new Error('Write verification failed');
    }

    return { success: true };
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);

    // If quota exceeded, try to clear old backups and retry
    if (error.name === 'QuotaExceededError') {
      try {
        clearBackups(key);
        const stringValue = JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        if (verifyWrite(key, stringValue)) {
          return { success: true };
        }
      } catch (retryError) {
        return { success: false, error: retryError };
      }
    }

    return { success: false, error };
  }
}

/**
 * Load data from localStorage with automatic recovery
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist or recovery fails
 * @returns {{ data: *, recovered: boolean, error?: Error }} Result object
 */
export function loadData(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return { data: defaultValue, recovered: false };
    }

    const parsed = JSON.parse(value);
    return { data: parsed, recovered: false };
  } catch (parseError) {
    console.error(`Error parsing ${key} from storage:`, parseError);

    // Try to recover from backups
    const recovered = recoverFromBackups(key);
    if (recovered !== null) {
      try {
        const parsed = JSON.parse(recovered);
        // Restore the recovered value to main storage
        localStorage.setItem(key, recovered);
        return { data: parsed, recovered: true };
      } catch (e) {
        // Recovery also failed
      }
    }

    // All recovery attempts failed, return default
    return { data: defaultValue, recovered: false, error: parseError };
  }
}

/**
 * Remove data from localStorage including all backups
 * @param {string} key - Storage key
 * @returns {boolean} True if removal was successful
 */
export function removeData(key) {
  try {
    localStorage.removeItem(key);
    clearBackups(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
    return false;
  }
}

/**
 * Clear all backups for a key
 * @param {string} key - Storage key
 */
export function clearBackups(key) {
  const backupKeys = getBackupKeys(key);
  backupKeys.forEach(backupKey => {
    try {
      localStorage.removeItem(backupKey);
    } catch (e) {
      // Ignore errors during backup cleanup
    }
  });
}

/**
 * Check if a key exists in storage
 * @param {string} key - Storage key
 * @returns {boolean} True if key exists
 */
export function hasData(key) {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get the number of available backups for a key
 * @param {string} key - Storage key
 * @returns {number} Number of backups
 */
export function getBackupCount(key) {
  const backupKeys = getBackupKeys(key);
  return backupKeys.filter(backupKey => {
    try {
      return localStorage.getItem(backupKey) !== null;
    } catch (e) {
      return false;
    }
  }).length;
}

/**
 * Manually trigger a backup for a key
 * @param {string} key - Storage key
 * @returns {boolean} True if backup was created
 */
export function createBackup(key) {
  try {
    const currentValue = localStorage.getItem(key);
    if (currentValue !== null) {
      rotateBackups(key, currentValue);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error creating backup for ${key}:`, error);
    return false;
  }
}

/**
 * Restore data from the most recent valid backup
 * @param {string} key - Storage key
 * @returns {{ success: boolean, data?: * }} Result object
 */
export function restoreFromBackup(key) {
  const recovered = recoverFromBackups(key);
  if (recovered !== null) {
    try {
      localStorage.setItem(key, recovered);
      const parsed = JSON.parse(recovered);
      return { success: true, data: parsed };
    } catch (e) {
      return { success: false };
    }
  }
  return { success: false };
}

/**
 * Get storage info for a key including backups
 * @param {string} key - Storage key
 * @returns {Object} Storage info
 */
export function getStorageInfo(key) {
  const backupKeys = getBackupKeys(key);
  const mainValue = localStorage.getItem(key);

  const backups = backupKeys.map((backupKey, index) => {
    const value = localStorage.getItem(backupKey);
    return {
      key: backupKey,
      index,
      exists: value !== null,
      size: value ? value.length : 0,
    };
  });

  return {
    key,
    exists: mainValue !== null,
    size: mainValue ? mainValue.length : 0,
    backups,
    totalBackupSize: backups.reduce((sum, b) => sum + b.size, 0),
    backupCount: backups.filter(b => b.exists).length,
  };
}

/**
 * Create a namespaced storage instance
 * @param {string} namespace - Namespace prefix (e.g., 'dogtale')
 * @returns {Object} Storage interface with namespaced methods
 */
export function createNamespacedStorage(namespace) {
  const prefix = namespace.endsWith('-') ? namespace : `${namespace}-`;

  return {
    save: (key, value, options) => saveData(`${prefix}${key}`, value, options),
    load: (key, defaultValue) => loadData(`${prefix}${key}`, defaultValue),
    remove: (key) => removeData(`${prefix}${key}`),
    has: (key) => hasData(`${prefix}${key}`),
    createBackup: (key) => createBackup(`${prefix}${key}`),
    restoreFromBackup: (key) => restoreFromBackup(`${prefix}${key}`),
    getInfo: (key) => getStorageInfo(`${prefix}${key}`),
    getBackupCount: (key) => getBackupCount(`${prefix}${key}`),
    clearBackups: (key) => clearBackups(`${prefix}${key}`),
  };
}

// Export pre-configured storage for DogTale app
export const dogTaleStorage = createNamespacedStorage('dogtale');
