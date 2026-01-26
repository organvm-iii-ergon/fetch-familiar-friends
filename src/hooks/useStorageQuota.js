import { useState, useEffect, useCallback } from 'react';
import {
  checkStorageQuota,
  getDogTaleStorageUsage,
  formatBytes,
  subscribeToStorageChanges,
} from '../utils/storageMonitor';

/**
 * Hook for monitoring storage quota and usage
 * @param {Object} options
 * @param {boolean} options.autoRefresh - Auto refresh on storage changes (default: true)
 * @param {number} options.refreshInterval - Refresh interval in ms (default: null, no interval)
 * @returns {Object} Storage quota state and methods
 */
export function useStorageQuota(options = {}) {
  const { autoRefresh = true, refreshInterval = null } = options;

  const [quotaInfo, setQuotaInfo] = useState({
    usage: 0,
    quota: 0,
    percentUsed: 0,
    isWarning: false,
    available: 0,
  });

  const [dogTaleUsage, setDogTaleUsage] = useState({
    usage: 0,
    items: [],
    itemCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refresh quota information
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [quota, dtUsage] = await Promise.all([
        checkStorageQuota(),
        Promise.resolve(getDogTaleStorageUsage()),
      ]);

      setQuotaInfo(quota);
      setDogTaleUsage(dtUsage);
    } catch (err) {
      console.error('Error checking storage quota:', err);
      setError(err.message || 'Failed to check storage quota');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to storage changes
  useEffect(() => {
    if (!autoRefresh) return;

    const unsubscribe = subscribeToStorageChanges(() => {
      refresh();
    });

    return unsubscribe;
  }, [autoRefresh, refresh]);

  // Optional interval refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const intervalId = setInterval(refresh, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, refresh]);

  // Compute formatted values
  const formatted = {
    usage: formatBytes(quotaInfo.usage),
    quota: formatBytes(quotaInfo.quota),
    available: formatBytes(quotaInfo.available),
    dogTaleUsage: formatBytes(dogTaleUsage.usage),
    percentUsed: `${Math.round(quotaInfo.percentUsed * 100)}%`,
  };

  // Get warning message if applicable
  const warningMessage = quotaInfo.percentUsed >= 0.95
    ? `Storage is almost full (${formatted.percentUsed}). Please clear some data.`
    : quotaInfo.isWarning
      ? `Storage is getting full (${formatted.percentUsed}). Consider clearing cached images.`
      : null;

  return {
    // Raw values
    usage: quotaInfo.usage,
    quota: quotaInfo.quota,
    available: quotaInfo.available,
    percentUsed: quotaInfo.percentUsed,
    isWarning: quotaInfo.isWarning,

    // DogTale-specific
    dogTaleUsage: dogTaleUsage.usage,
    dogTaleItems: dogTaleUsage.items,
    dogTaleItemCount: dogTaleUsage.itemCount,

    // Formatted values
    formatted,

    // Warning
    warningMessage,

    // State
    isLoading,
    error,

    // Actions
    refresh,
  };
}

export default useStorageQuota;
