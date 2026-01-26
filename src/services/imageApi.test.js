import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  fetchPetImage,
  prefetchPetImages,
  getRateLimitStatus,
  resetRateLimiter,
  imageApiConfig,
} from './imageApi';

// Mock fetch globally
global.fetch = vi.fn();

describe('imageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPetImage', () => {
    it('should fetch a dog image successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: 'https://images.dog.ceo/breeds/retriever-golden/n02099601_1234.jpg',
          status: 'success',
        }),
      });

      const result = await fetchPetImage('dog');

      expect(result.url).toBe('https://images.dog.ceo/breeds/retriever-golden/n02099601_1234.jpg');
      expect(result.breed).toBe('Retriever Golden');
      expect(result.type).toBe('dog');
      expect(result.isFallback).toBe(false);
    });

    it('should fetch a cat image successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{
          url: 'https://cdn2.thecatapi.com/images/abc123.jpg',
          breeds: [{ name: 'Persian' }],
        }]),
      });

      const result = await fetchPetImage('cat');

      expect(result.url).toBe('https://cdn2.thecatapi.com/images/abc123.jpg');
      expect(result.breed).toBe('Persian');
      expect(result.type).toBe('cat');
      expect(result.isFallback).toBe(false);
    });

    it('should return fallback image on fetch error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchPetImage('dog', { useFallback: true });

      expect(result.url).toBe('/fallback-dog.jpg');
      expect(result.isFallback).toBe(true);
      expect(result.error).toBe('Network error');
    });

    it('should throw error when useFallback is false', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(
        fetchPetImage('dog', { useFallback: false })
      ).rejects.toThrow('Network error');
    });

    it('should extract breed from dog image URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: 'https://images.dog.ceo/breeds/poodle-standard/n02099601_1234.jpg',
        }),
      });

      const result = await fetchPetImage('dog');

      expect(result.breed).toBe('Poodle Standard');
    });

    it('should handle missing breed info gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{
          url: 'https://cdn2.thecatapi.com/images/abc123.jpg',
          // No breeds array
        }]),
      });

      const result = await fetchPetImage('cat');

      expect(result.breed).toBeNull();
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return initial rate limit status', () => {
      const status = getRateLimitStatus();

      expect(status.isLimited).toBe(false);
      expect(status.remaining).toBe(50);
      expect(status.limit).toBe(50);
    });

    it('should track requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'https://images.dog.ceo/breeds/retriever-golden/test.jpg',
        }),
      });

      await fetchPetImage('dog');

      const status = getRateLimitStatus();
      expect(status.remaining).toBe(49);
    });
  });

  describe('prefetchPetImages', () => {
    it('should prefetch multiple images', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            message: 'https://images.dog.ceo/breeds/retriever-golden/test1.jpg',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{
            url: 'https://cdn2.thecatapi.com/images/test2.jpg',
          }]),
        });

      const results = await prefetchPetImages([
        { type: 'dog' },
        { type: 'cat' },
      ]);

      expect(results.length).toBe(2);
      expect(results[0].type).toBe('dog');
      expect(results[1].type).toBe('cat');
    });

    it('should return fallback for failed requests in batch', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            message: 'https://images.dog.ceo/breeds/retriever-golden/test1.jpg',
          }),
        })
        .mockRejectedValueOnce(new Error('Failed'));

      const results = await prefetchPetImages([
        { type: 'dog' },
        { type: 'cat' },
      ]);

      expect(results[0].isFallback).toBe(false);
      expect(results[1].isFallback).toBe(true);
      expect(results[1].url).toBe('/fallback-cat.jpg');
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limit', async () => {
      // Mock successful responses
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'https://images.dog.ceo/breeds/retriever-golden/test.jpg',
        }),
      });

      // Make 50 requests (at the limit)
      for (let i = 0; i < 50; i++) {
        await fetchPetImage('dog');
      }

      // 51st request should fail with rate limit error when useFallback is false
      await expect(
        fetchPetImage('dog', { useFallback: false })
      ).rejects.toThrow('Rate limited');

      // With useFallback: true (default), should return fallback
      const result = await fetchPetImage('dog');
      expect(result.isFallback).toBe(true);
      expect(result.error).toContain('Rate limited');
    });
  });

  describe('resetRateLimiter', () => {
    it('should reset the rate limiter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          message: 'https://images.dog.ceo/breeds/retriever-golden/test.jpg',
        }),
      });

      // Make some requests
      await fetchPetImage('dog');
      await fetchPetImage('dog');

      let status = getRateLimitStatus();
      expect(status.remaining).toBe(48);

      // Reset
      resetRateLimiter();

      status = getRateLimitStatus();
      expect(status.remaining).toBe(50);
    });
  });
});
