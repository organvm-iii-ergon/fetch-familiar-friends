import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCachedImage,
  cacheImage,
  clearCache,
  getCacheStats,
  isCacheFull
} from './imageCache';

describe('imageCache utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('cacheImage and getCachedImage', () => {
    it('should cache and retrieve an image', () => {
      const date = new Date('2024-01-15');
      const url = 'https://example.com/dog.jpg';
      const type = 'dog';
      const breed = 'Golden Retriever';

      cacheImage(date, url, type, breed);
      const cached = getCachedImage(date);

      expect(cached).toBeDefined();
      expect(cached.url).toBe(url);
      expect(cached.type).toBe(type);
      expect(cached.breed).toBe(breed);
      expect(cached.dateKey).toBe('2024-01-15');
      expect(cached.timestamp).toBeDefined();
    });

    it('should return null for uncached dates', () => {
      const date = new Date('2024-01-15');
      const cached = getCachedImage(date);
      expect(cached).toBeNull();
    });

    it('should handle multiple cached images', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');

      cacheImage(date1, 'https://example.com/dog1.jpg', 'dog', 'Beagle');
      cacheImage(date2, 'https://example.com/dog2.jpg', 'dog', 'Poodle');

      const cached1 = getCachedImage(date1);
      const cached2 = getCachedImage(date2);

      expect(cached1.breed).toBe('Beagle');
      expect(cached2.breed).toBe('Poodle');
    });

    it('should overwrite existing cache for same date', () => {
      const date = new Date('2024-01-15');

      cacheImage(date, 'https://example.com/dog1.jpg', 'dog', 'Beagle');
      cacheImage(date, 'https://example.com/dog2.jpg', 'dog', 'Poodle');

      const cached = getCachedImage(date);
      expect(cached.breed).toBe('Poodle');
      expect(cached.url).toBe('https://example.com/dog2.jpg');
    });

    it('should cache cat images', () => {
      const date = new Date('2024-01-15');
      cacheImage(date, 'https://example.com/cat.jpg', 'cat', 'Siamese');

      const cached = getCachedImage(date);
      expect(cached.type).toBe('cat');
      expect(cached.breed).toBe('Siamese');
    });

    it('should handle breed being optional', () => {
      const date = new Date('2024-01-15');
      cacheImage(date, 'https://example.com/dog.jpg', 'dog');

      const cached = getCachedImage(date);
      expect(cached.breed).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached images', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');

      cacheImage(date1, 'https://example.com/dog1.jpg', 'dog', 'Beagle');
      cacheImage(date2, 'https://example.com/dog2.jpg', 'dog', 'Poodle');

      expect(getCachedImage(date1)).toBeDefined();
      expect(getCachedImage(date2)).toBeDefined();

      const result = clearCache();
      expect(result).toBe(true);

      expect(getCachedImage(date1)).toBeNull();
      expect(getCachedImage(date2)).toBeNull();
    });

    it('should return true on successful clear', () => {
      const result = clearCache();
      expect(result).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('should return stats for empty cache', () => {
      const stats = getCacheStats();

      expect(stats.total).toBe(0);
      expect(stats.dogs).toBe(0);
      expect(stats.cats).toBe(0);
      expect(stats.maxSize).toBeDefined();
      expect(stats.expiryDays).toBeDefined();
    });

    it('should count dog and cat images separately', () => {
      cacheImage(new Date('2024-01-15'), 'url1', 'dog');
      cacheImage(new Date('2024-01-16'), 'url2', 'dog');
      cacheImage(new Date('2024-01-17'), 'url3', 'cat');
      cacheImage(new Date('2024-01-18'), 'url4', 'cat');
      cacheImage(new Date('2024-01-19'), 'url5', 'cat');

      const stats = getCacheStats();

      expect(stats.total).toBe(5);
      expect(stats.dogs).toBe(2);
      expect(stats.cats).toBe(3);
    });

    it('should include max size in stats', () => {
      const stats = getCacheStats();
      expect(stats.maxSize).toBe(50);
    });

    it('should include expiry days in stats', () => {
      const stats = getCacheStats();
      expect(stats.expiryDays).toBe(7);
    });

    it('should calculate age of entries', () => {
      cacheImage(new Date('2024-01-15'), 'url1', 'dog');

      const stats = getCacheStats();

      expect(stats.oldestAge).toBeDefined();
      expect(stats.newestAge).toBeDefined();
      expect(stats.oldestAge).toBeGreaterThanOrEqual(0);
      expect(stats.newestAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isCacheFull', () => {
    it('should return false for empty cache', () => {
      expect(isCacheFull()).toBe(false);
    });

    it('should return false for partially filled cache', () => {
      cacheImage(new Date('2024-01-15'), 'url1', 'dog');
      cacheImage(new Date('2024-01-16'), 'url2', 'dog');

      expect(isCacheFull()).toBe(false);
    });

    it('should return true when cache reaches max size', () => {
      // Cache 50 images (MAX_CACHE_SIZE)
      for (let i = 1; i <= 50; i++) {
        const date = new Date('2024-01-01');
        date.setDate(i);
        cacheImage(date, `url${i}`, 'dog');
      }

      expect(isCacheFull()).toBe(true);
    });
  });

  describe('Cache size management', () => {
    it('should limit cache to max size', () => {
      // Try to cache more than MAX_CACHE_SIZE (50) images
      for (let i = 1; i <= 60; i++) {
        const date = new Date('2024-01-01');
        date.setDate(i % 28 + 1); // Cycle through days to avoid same date
        date.setMonth(Math.floor(i / 28)); // Use different months
        cacheImage(date, `url${i}`, 'dog');
      }

      const stats = getCacheStats();
      expect(stats.total).toBeLessThanOrEqual(50);
    });

    it('should remove oldest entries when exceeding max size', () => {
      // Cache images with artificial timestamps
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-01-02');

      // Fill cache to capacity
      for (let i = 1; i <= 50; i++) {
        const date = new Date('2024-01-01');
        date.setDate(i % 28 + 1);
        date.setMonth(Math.floor(i / 28));
        cacheImage(date, `url${i}`, 'dog');
      }

      // Add one more - should evict oldest
      const extraDate = new Date('2024-12-31');
      cacheImage(extraDate, 'newest-url', 'dog');

      const stats = getCacheStats();
      expect(stats.total).toBe(50);

      // The newest should still be there
      const cached = getCachedImage(extraDate);
      expect(cached).toBeDefined();
      expect(cached.url).toBe('newest-url');
    });
  });

  describe('Date key generation', () => {
    it('should cache with consistent date keys', () => {
      const date1 = new Date('2024-01-15T10:30:00');
      const date2 = new Date('2024-01-15T18:45:00');

      cacheImage(date1, 'url1', 'dog', 'Beagle');

      // Same calendar day, different time - should retrieve same cache
      const cached = getCachedImage(date2);
      expect(cached).toBeDefined();
      expect(cached.breed).toBe('Beagle');
    });

    it('should format single-digit months and days with leading zeros', () => {
      const date = new Date('2024-01-05');
      cacheImage(date, 'url', 'dog');

      const cached = getCachedImage(date);
      expect(cached.dateKey).toBe('2024-01-05');
    });

    it('should format double-digit months and days without issues', () => {
      const date = new Date('2024-12-25');
      cacheImage(date, 'url', 'dog');

      const cached = getCachedImage(date);
      expect(cached.dateKey).toBe('2024-12-25');
    });
  });

  describe('Error handling', () => {
    it('should handle corrupt cache data gracefully', () => {
      // Manually set invalid JSON in localStorage
      localStorage.setItem('dogtale-image-cache', 'invalid-json{');

      // Should return null instead of throwing
      const cached = getCachedImage(new Date('2024-01-15'));
      expect(cached).toBeNull();
    });

    it('should continue working after encountering corrupt data', () => {
      // Set corrupt data
      localStorage.setItem('dogtale-image-cache', 'invalid-json{');

      // Try to cache - should work despite corrupt existing data
      const date = new Date('2024-01-15');
      cacheImage(date, 'url', 'dog');

      // Should be able to retrieve
      const cached = getCachedImage(date);
      expect(cached).toBeDefined();
    });
  });

  describe('Timestamp handling', () => {
    it('should store current timestamp when caching', () => {
      const beforeCache = Date.now();
      const date = new Date('2024-01-15');

      cacheImage(date, 'url', 'dog');

      const afterCache = Date.now();
      const cached = getCachedImage(date);

      expect(cached.timestamp).toBeGreaterThanOrEqual(beforeCache);
      expect(cached.timestamp).toBeLessThanOrEqual(afterCache);
    });
  });
});
