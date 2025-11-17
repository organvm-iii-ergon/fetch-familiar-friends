/**
 * Data Freshness Monitoring Utility
 *
 * Tracks and reports on data age and freshness:
 * - Check when data was last updated
 * - Alert on stale data
 * - Suggest refresh actions
 * - Track data health metrics
 */

const FRESHNESS_THRESHOLDS = {
  breeds: 30 * 24 * 60 * 60 * 1000,    // 30 days
  content: 60 * 24 * 60 * 60 * 1000,   // 60 days
  cache: 7 * 24 * 60 * 60 * 1000,      // 7 days
  documents: 90 * 24 * 60 * 60 * 1000  // 90 days
};

/**
 * Calculate age of data in milliseconds
 * @param {string|Date} timestamp - Timestamp to check
 * @returns {number} - Age in milliseconds
 */
export function getDataAge(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();

  if (isNaN(date.getTime())) {
    return Infinity; // Invalid date = infinitely old
  }

  return now.getTime() - date.getTime();
}

/**
 * Check if data is stale based on threshold
 * @param {string|Date} timestamp - Timestamp to check
 * @param {number} threshold - Threshold in milliseconds
 * @returns {boolean} - True if stale
 */
export function isStale(timestamp, threshold) {
  const age = getDataAge(timestamp);
  return age > threshold;
}

/**
 * Get freshness status for data
 * @param {string|Date} timestamp - Timestamp to check
 * @param {number} threshold - Threshold in milliseconds
 * @returns {Object} - Freshness status object
 */
export function getFreshnessStatus(timestamp, threshold) {
  const age = getDataAge(timestamp);
  const ageInDays = Math.floor(age / (24 * 60 * 60 * 1000));

  const percentStale = (age / threshold) * 100;

  let status = 'fresh';
  let level = 'success';

  if (percentStale >= 100) {
    status = 'stale';
    level = 'error';
  } else if (percentStale >= 80) {
    status = 'aging';
    level = 'warning';
  } else if (percentStale >= 50) {
    status = 'good';
    level = 'info';
  }

  return {
    age,
    ageInDays,
    percentStale: Math.min(percentStale, 100),
    status,
    level,
    isStale: status === 'stale',
    needsRefresh: percentStale >= 80
  };
}

/**
 * Check breed data freshness
 * @param {Object} breedData - Breed database
 * @returns {Object} - Freshness report
 */
export function checkBreedDataFreshness(breedData) {
  if (!breedData || !breedData.meta) {
    return {
      status: 'unknown',
      level: 'error',
      message: 'No breed data found'
    };
  }

  const lastUpdate = breedData.meta.completedAt || breedData.meta.lastUpdated;

  if (!lastUpdate) {
    return {
      status: 'unknown',
      level: 'error',
      message: 'No timestamp found in breed data'
    };
  }

  const freshness = getFreshnessStatus(lastUpdate, FRESHNESS_THRESHOLDS.breeds);

  return {
    ...freshness,
    lastUpdate,
    totalBreeds: (breedData.meta.totalDogs || 0) + (breedData.meta.totalCats || 0),
    message: getStatusMessage(freshness, 'breed data')
  };
}

/**
 * Check cache freshness
 * @param {Object} cacheStats - Cache statistics object
 * @returns {Object} - Freshness report
 */
export function checkCacheFreshness(cacheStats) {
  if (!cacheStats || cacheStats.total === 0) {
    return {
      status: 'empty',
      level: 'info',
      message: 'Cache is empty'
    };
  }

  const oldestAge = cacheStats.oldestAge || 0;
  const oldestAgeMs = oldestAge * 24 * 60 * 60 * 1000; // Convert days to ms

  const freshness = getFreshnessStatus(
    new Date(Date.now() - oldestAgeMs),
    FRESHNESS_THRESHOLDS.cache
  );

  return {
    ...freshness,
    totalCached: cacheStats.total,
    oldestEntry: oldestAge,
    newestEntry: cacheStats.newestAge || 0,
    message: getStatusMessage(freshness, 'cache')
  };
}

/**
 * Check document freshness
 * @param {Array} documents - Array of document metadata
 * @returns {Object} - Freshness report
 */
export function checkDocumentFreshness(documents) {
  if (!documents || documents.length === 0) {
    return {
      status: 'empty',
      level: 'info',
      message: 'No documents found'
    };
  }

  const now = Date.now();
  const threshold = FRESHNESS_THRESHOLDS.documents;

  const staleDocuments = [];
  const agingDocuments = [];

  for (const doc of documents) {
    if (!doc.lastModified) continue;

    const freshness = getFreshnessStatus(doc.lastModified, threshold);

    if (freshness.status === 'stale') {
      staleDocuments.push({
        path: doc.path,
        ageInDays: freshness.ageInDays
      });
    } else if (freshness.status === 'aging') {
      agingDocuments.push({
        path: doc.path,
        ageInDays: freshness.ageInDays
      });
    }
  }

  const totalDocs = documents.length;
  const percentStale = (staleDocuments.length / totalDocs) * 100;

  let status = 'fresh';
  let level = 'success';

  if (percentStale >= 50) {
    status = 'stale';
    level = 'error';
  } else if (percentStale >= 25 || agingDocuments.length > 0) {
    status = 'aging';
    level = 'warning';
  }

  return {
    status,
    level,
    totalDocuments: totalDocs,
    staleCount: staleDocuments.length,
    agingCount: agingDocuments.length,
    percentStale,
    staleDocuments: staleDocuments.slice(0, 10), // Limit to top 10
    agingDocuments: agingDocuments.slice(0, 10),
    message: `${staleDocuments.length} stale, ${agingDocuments.length} aging out of ${totalDocs} documents`
  };
}

/**
 * Get overall data health status
 * @param {Object} checks - Object with various freshness checks
 * @returns {Object} - Overall health status
 */
export function getOverallHealth(checks) {
  const levels = {
    error: 3,
    warning: 2,
    info: 1,
    success: 0
  };

  let worstLevel = 'success';
  let worstLevelValue = 0;

  const issues = [];
  const warnings = [];

  for (const [name, check] of Object.entries(checks)) {
    const levelValue = levels[check.level] || 0;

    if (levelValue > worstLevelValue) {
      worstLevel = check.level;
      worstLevelValue = levelValue;
    }

    if (check.level === 'error') {
      issues.push(`${name}: ${check.message || check.status}`);
    } else if (check.level === 'warning') {
      warnings.push(`${name}: ${check.message || check.status}`);
    }
  }

  let overallStatus = 'healthy';
  if (worstLevel === 'error') {
    overallStatus = 'unhealthy';
  } else if (worstLevel === 'warning') {
    overallStatus = 'needs attention';
  }

  return {
    status: overallStatus,
    level: worstLevel,
    issues,
    warnings,
    summary: `${issues.length} issues, ${warnings.length} warnings`
  };
}

/**
 * Get a human-readable status message
 * @param {Object} freshness - Freshness status object
 * @param {string} dataType - Type of data
 * @returns {string} - Status message
 */
function getStatusMessage(freshness, dataType) {
  const { status, ageInDays } = freshness;

  switch (status) {
    case 'fresh':
      return `${dataType} is fresh (${ageInDays} days old)`;
    case 'good':
      return `${dataType} is in good condition (${ageInDays} days old)`;
    case 'aging':
      return `${dataType} is aging and should be refreshed soon (${ageInDays} days old)`;
    case 'stale':
      return `${dataType} is stale and needs refresh (${ageInDays} days old)`;
    default:
      return `${dataType} status unknown`;
  }
}

/**
 * Format age in human-readable form
 * @param {number} ageInMs - Age in milliseconds
 * @returns {string} - Formatted age
 */
export function formatAge(ageInMs) {
  const seconds = Math.floor(ageInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

/**
 * Get recommended refresh interval for data type
 * @param {string} dataType - Type of data (breeds, content, cache, documents)
 * @returns {number} - Recommended interval in milliseconds
 */
export function getRefreshInterval(dataType) {
  return FRESHNESS_THRESHOLDS[dataType] || FRESHNESS_THRESHOLDS.content;
}

/**
 * Calculate next refresh date
 * @param {string|Date} lastUpdate - Last update timestamp
 * @param {string} dataType - Type of data
 * @returns {Date} - Next recommended refresh date
 */
export function getNextRefreshDate(lastUpdate, dataType) {
  const date = typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate;
  const interval = getRefreshInterval(dataType);

  return new Date(date.getTime() + interval);
}

/**
 * Export freshness thresholds for external use
 */
export const thresholds = FRESHNESS_THRESHOLDS;
