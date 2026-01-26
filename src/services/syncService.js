/**
 * Offline Sync Service with IndexedDB
 * Handles offline data caching and synchronization with Supabase
 */

import { supabase, isOnlineMode } from '../config/supabase';

// Database constants
const DB_NAME = 'dogtale-offline';
const DB_VERSION = 1;

// Store names
const STORES = {
  PENDING_CHANGES: 'pendingChanges',
  CACHED_DATA: 'cachedData',
};

// Online state
let onlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;

/**
 * Get current online status
 * @returns {boolean}
 */
export function isOnline() {
  return onlineStatus;
}

/**
 * Open the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create pendingChanges store
      if (!db.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_CHANGES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        pendingStore.createIndex('tableName', 'tableName', { unique: false });
        pendingStore.createIndex('createdAt', 'createdAt', { unique: false });
        pendingStore.createIndex('status', 'status', { unique: false });
      }

      // Create cachedData store
      if (!db.objectStoreNames.contains(STORES.CACHED_DATA)) {
        const cacheStore = db.createObjectStore(STORES.CACHED_DATA, {
          keyPath: 'key',
        });
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        cacheStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

/**
 * Initialize the sync service and set up online/offline listeners
 * @returns {Promise<void>}
 */
export async function initSyncService() {
  try {
    // Open database to ensure it's created
    await openDatabase();

    // Set up online/offline event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    console.log('Sync service initialized');
  } catch (error) {
    console.error('Failed to initialize sync service:', error);
  }
}

/**
 * Handle coming back online
 */
async function handleOnline() {
  onlineStatus = true;
  console.log('Network connection restored');

  // Auto-sync pending changes
  try {
    const result = await syncPendingChanges();
    if (result.synced > 0) {
      console.log(`Synced ${result.synced} pending changes`);
    }
  } catch (error) {
    console.error('Error syncing on reconnect:', error);
  }
}

/**
 * Handle going offline
 */
function handleOffline() {
  onlineStatus = false;
  console.log('Network connection lost - changes will be queued');
}

// ============================================
// OFFLINE QUEUE OPERATIONS
// ============================================

/**
 * Queue a change for later sync when offline
 * @param {string} tableName - Supabase table name
 * @param {string} operation - 'insert', 'update', or 'delete'
 * @param {Object} data - The data for the operation
 * @param {Object} options - Additional options (filters for update/delete)
 * @returns {Promise<{id: number, error: Error|null}>}
 */
export async function queueChange(tableName, operation, data, options = {}) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.PENDING_CHANGES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHANGES);

    const change = {
      tableName,
      operation,
      data,
      options,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(change);

      request.onsuccess = () => {
        resolve({ id: request.result, error: null });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error queuing change:', error);
    return { id: null, error };
  }
}

/**
 * Get all pending changes
 * @param {Object} options - Filter options
 * @returns {Promise<{changes: Array, error: Error|null}>}
 */
export async function getPendingChanges(options = {}) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.PENDING_CHANGES], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_CHANGES);

    return new Promise((resolve, reject) => {
      const request = options.tableName
        ? store.index('tableName').getAll(options.tableName)
        : store.getAll();

      request.onsuccess = () => {
        let changes = request.result || [];

        // Filter by status if specified
        if (options.status) {
          changes = changes.filter((c) => c.status === options.status);
        }

        // Sort by createdAt
        changes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        resolve({ changes, error: null });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting pending changes:', error);
    return { changes: [], error };
  }
}

/**
 * Sync all pending changes to Supabase
 * @returns {Promise<{synced: number, failed: number, error: Error|null}>}
 */
export async function syncPendingChanges() {
  if (!isOnlineMode || !onlineStatus) {
    return { synced: 0, failed: 0, error: new Error('Cannot sync while offline') };
  }

  const { changes, error: getError } = await getPendingChanges({ status: 'pending' });

  if (getError) {
    return { synced: 0, failed: 0, error: getError };
  }

  if (changes.length === 0) {
    return { synced: 0, failed: 0, error: null };
  }

  let synced = 0;
  let failed = 0;
  const syncedIds = [];
  const failedIds = [];

  for (const change of changes) {
    try {
      let result;

      switch (change.operation) {
        case 'insert':
          result = await supabase.from(change.tableName).insert(change.data);
          break;
        case 'update':
          let updateQuery = supabase.from(change.tableName).update(change.data);
          if (change.options.filters) {
            for (const [key, value] of Object.entries(change.options.filters)) {
              updateQuery = updateQuery.eq(key, value);
            }
          }
          result = await updateQuery;
          break;
        case 'delete':
          let deleteQuery = supabase.from(change.tableName).delete();
          if (change.options.filters) {
            for (const [key, value] of Object.entries(change.options.filters)) {
              deleteQuery = deleteQuery.eq(key, value);
            }
          }
          result = await deleteQuery;
          break;
        default:
          throw new Error(`Unknown operation: ${change.operation}`);
      }

      if (result.error) {
        throw result.error;
      }

      syncedIds.push(change.id);
      synced++;
    } catch (syncError) {
      console.error(`Error syncing change ${change.id}:`, syncError);
      failedIds.push({ id: change.id, error: syncError.message });
      failed++;

      // Update retry count
      await updateChangeStatus(change.id, 'failed', change.retryCount + 1);
    }
  }

  // Clear successfully synced changes
  if (syncedIds.length > 0) {
    await clearSyncedChanges(syncedIds);
  }

  return { synced, failed, error: null };
}

/**
 * Update the status of a pending change
 * @param {number} id - Change ID
 * @param {string} status - New status
 * @param {number} retryCount - Updated retry count
 * @returns {Promise<void>}
 */
async function updateChangeStatus(id, status, retryCount) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.PENDING_CHANGES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHANGES);

    const request = store.get(id);

    request.onsuccess = () => {
      const change = request.result;
      if (change) {
        change.status = status;
        change.retryCount = retryCount;
        change.lastAttempt = new Date().toISOString();
        store.put(change);
      }
    };
  } catch (error) {
    console.error('Error updating change status:', error);
  }
}

/**
 * Clear synced changes from the queue
 * @param {number[]} ids - Array of change IDs to remove
 * @returns {Promise<{error: Error|null}>}
 */
export async function clearSyncedChanges(ids) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.PENDING_CHANGES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHANGES);

    for (const id of ids) {
      store.delete(id);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve({ error: null });
      };
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Error clearing synced changes:', error);
    return { error };
  }
}

// ============================================
// DATA CACHING OPERATIONS
// ============================================

/**
 * Cache data for offline access
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {Object} options - Cache options
 * @returns {Promise<{error: Error|null}>}
 */
export async function cacheData(key, data, options = {}) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.CACHED_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_DATA);

    const ttlMs = options.ttl || 24 * 60 * 60 * 1000; // Default 24 hours
    const now = new Date();

    const cacheEntry = {
      key,
      data,
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      metadata: options.metadata || {},
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        resolve({ error: null });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error caching data:', error);
    return { error };
  }
}

/**
 * Get cached data
 * @param {string} key - Cache key
 * @param {Object} options - Options (ignoreExpired to return expired data)
 * @returns {Promise<{data: any, expired: boolean, error: Error|null}>}
 */
export async function getCachedData(key, options = {}) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.CACHED_DATA], 'readonly');
    const store = transaction.objectStore(STORES.CACHED_DATA);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;

        if (!entry) {
          resolve({ data: null, expired: false, error: null });
          return;
        }

        const isExpired = new Date(entry.expiresAt) < new Date();

        if (isExpired && !options.ignoreExpired) {
          resolve({ data: null, expired: true, error: null });
          return;
        }

        resolve({ data: entry.data, expired: isExpired, error: null });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting cached data:', error);
    return { data: null, expired: false, error };
  }
}

/**
 * Clear all cached data
 * @returns {Promise<{error: Error|null}>}
 */
export async function clearCache() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.CACHED_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_DATA);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        resolve({ error: null });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return { error };
  }
}

/**
 * Clear expired cache entries
 * @returns {Promise<{cleared: number, error: Error|null}>}
 */
export async function clearExpiredCache() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.CACHED_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_DATA);
    const index = store.index('expiresAt');

    const now = new Date().toISOString();
    const range = IDBKeyRange.upperBound(now);

    return new Promise((resolve, reject) => {
      let cleared = 0;
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cleared++;
          cursor.continue();
        } else {
          resolve({ cleared, error: null });
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    return { cleared: 0, error };
  }
}

/**
 * Get all cache keys
 * @returns {Promise<{keys: string[], error: Error|null}>}
 */
export async function getCacheKeys() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.CACHED_DATA], 'readonly');
    const store = transaction.objectStore(STORES.CACHED_DATA);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve({ keys: request.result || [], error: null });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting cache keys:', error);
    return { keys: [], error };
  }
}

/**
 * Get cache statistics
 * @returns {Promise<{totalEntries: number, expiredEntries: number, error: Error|null}>}
 */
export async function getCacheStats() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.CACHED_DATA], 'readonly');
    const store = transaction.objectStore(STORES.CACHED_DATA);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result || [];
        const now = new Date();
        const expiredEntries = entries.filter(
          (e) => new Date(e.expiresAt) < now
        ).length;

        resolve({
          totalEntries: entries.length,
          expiredEntries,
          error: null,
        });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalEntries: 0, expiredEntries: 0, error };
  }
}

// ============================================
// CLEANUP
// ============================================

/**
 * Clean up the sync service (remove event listeners)
 */
export function cleanupSyncService() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }
}

export default {
  initSyncService,
  cleanupSyncService,
  isOnline,
  // Queue operations
  queueChange,
  getPendingChanges,
  syncPendingChanges,
  clearSyncedChanges,
  // Cache operations
  cacheData,
  getCachedData,
  clearCache,
  clearExpiredCache,
  getCacheKeys,
  getCacheStats,
};
