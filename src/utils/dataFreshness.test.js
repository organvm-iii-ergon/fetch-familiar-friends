/**
 * Tests for Data Freshness Monitoring
 */

import { describe, it, expect } from 'vitest';
import {
  getDataAge,
  isStale,
  getFreshnessStatus,
  checkBreedDataFreshness,
  checkCacheFreshness,
  formatAge,
  getRefreshInterval,
  getNextRefreshDate,
  thresholds
} from './dataFreshness.js';

describe('getDataAge', () => {
  it('should calculate age correctly', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const age = getDataAge(oneHourAgo);
    expect(age).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000); // Allow 1s tolerance
    expect(age).toBeLessThan(60 * 60 * 1000 + 1000);
  });

  it('should handle string dates', () => {
    const timestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const age = getDataAge(timestamp);
    expect(age).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
  });

  it('should return Infinity for invalid dates', () => {
    expect(getDataAge('invalid-date')).toBe(Infinity);
    expect(getDataAge('not a timestamp')).toBe(Infinity);
  });
});

describe('isStale', () => {
  it('should detect stale data', () => {
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
    const threshold = 30 * 24 * 60 * 60 * 1000; // 30 days
    expect(isStale(oldDate, threshold)).toBe(true);
  });

  it('should detect fresh data', () => {
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const threshold = 30 * 24 * 60 * 60 * 1000; // 30 days
    expect(isStale(recentDate, threshold)).toBe(false);
  });
});

describe('getFreshnessStatus', () => {
  it('should return fresh status for new data', () => {
    const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const threshold = 30 * 24 * 60 * 60 * 1000;
    const status = getFreshnessStatus(recentDate, threshold);

    expect(status.status).toBe('fresh');
    expect(status.level).toBe('success');
    expect(status.isStale).toBe(false);
    expect(status.ageInDays).toBe(5);
  });

  it('should return good status for aging data', () => {
    const oldDate = new Date(Date.now() - 18 * 24 * 60 * 60 * 1000); // 60% of 30 days
    const threshold = 30 * 24 * 60 * 60 * 1000;
    const status = getFreshnessStatus(oldDate, threshold);

    expect(status.status).toBe('good');
    expect(status.level).toBe('info');
  });

  it('should return aging status for old data', () => {
    const oldDate = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000); // 83% of 30 days
    const threshold = 30 * 24 * 60 * 60 * 1000;
    const status = getFreshnessStatus(oldDate, threshold);

    expect(status.status).toBe('aging');
    expect(status.level).toBe('warning');
    expect(status.needsRefresh).toBe(true);
  });

  it('should return stale status for very old data', () => {
    const veryOldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // Beyond 30 days
    const threshold = 30 * 24 * 60 * 60 * 1000;
    const status = getFreshnessStatus(veryOldDate, threshold);

    expect(status.status).toBe('stale');
    expect(status.level).toBe('error');
    expect(status.isStale).toBe(true);
  });
});

describe('checkBreedDataFreshness', () => {
  it('should check breed data correctly', () => {
    const breedData = {
      dogs: {},
      cats: {},
      meta: {
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        totalDogs: 150,
        totalCats: 67
      }
    };

    const check = checkBreedDataFreshness(breedData);
    expect(check.status).toBe('fresh');
    expect(check.totalBreeds).toBe(217);
  });

  it('should handle missing meta', () => {
    const check = checkBreedDataFreshness({});
    expect(check.status).toBe('unknown');
    expect(check.level).toBe('error');
  });
});

describe('checkCacheFreshness', () => {
  it('should check cache correctly', () => {
    const cacheStats = {
      total: 50,
      oldestAge: 3,
      newestAge: 0
    };

    const check = checkCacheFreshness(cacheStats);
    expect(check.totalCached).toBe(50);
    expect(check.status).toBe('fresh');
  });

  it('should handle empty cache', () => {
    const check = checkCacheFreshness({ total: 0 });
    expect(check.status).toBe('empty');
    expect(check.level).toBe('info');
  });
});

describe('formatAge', () => {
  it('should format days', () => {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    expect(formatAge(threeDays)).toBe('3 days');
  });

  it('should format hours', () => {
    const fiveHours = 5 * 60 * 60 * 1000;
    expect(formatAge(fiveHours)).toBe('5 hours');
  });

  it('should format minutes', () => {
    const tenMinutes = 10 * 60 * 1000;
    expect(formatAge(tenMinutes)).toBe('10 minutes');
  });

  it('should format seconds', () => {
    const thirtySeconds = 30 * 1000;
    expect(formatAge(thirtySeconds)).toBe('30 seconds');
  });

  it('should use singular for 1', () => {
    const oneDay = 24 * 60 * 60 * 1000;
    expect(formatAge(oneDay)).toBe('1 day');
  });
});

describe('getRefreshInterval', () => {
  it('should return correct intervals', () => {
    expect(getRefreshInterval('breeds')).toBe(thresholds.breeds);
    expect(getRefreshInterval('content')).toBe(thresholds.content);
    expect(getRefreshInterval('cache')).toBe(thresholds.cache);
    expect(getRefreshInterval('documents')).toBe(thresholds.documents);
  });

  it('should return default for unknown type', () => {
    expect(getRefreshInterval('unknown')).toBe(thresholds.content);
  });
});

describe('getNextRefreshDate', () => {
  it('should calculate next refresh date', () => {
    const lastUpdate = new Date('2025-11-01');
    const nextRefresh = getNextRefreshDate(lastUpdate, 'breeds');
    const expectedDate = new Date(lastUpdate.getTime() + thresholds.breeds);

    expect(nextRefresh.getTime()).toBe(expectedDate.getTime());
  });

  it('should handle ISO string dates', () => {
    const lastUpdate = '2025-11-01T00:00:00Z';
    const nextRefresh = getNextRefreshDate(lastUpdate, 'cache');

    expect(nextRefresh).toBeInstanceOf(Date);
    expect(nextRefresh.getTime()).toBeGreaterThan(new Date(lastUpdate).getTime());
  });
});
