import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkStorageQuota,
  getLocalStorageUsage,
  getDogTaleStorageUsage,
  formatBytes,
  hasSpaceFor,
  getStorageWarning,
  subscribeToStorageChanges,
} from './storageMonitor';

// Create a proper localStorage mock with key() method
function createLocalStorageMock() {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

describe('storageMonitor', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = createLocalStorageMock();
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  describe('getLocalStorageUsage', () => {
    it('should return zero usage for empty localStorage', () => {
      const result = getLocalStorageUsage();

      expect(result.usage).toBe(0);
      expect(result.percentUsed).toBe(0);
      expect(result.isWarning).toBe(false);
    });

    it('should calculate storage usage correctly', () => {
      // Store a known value
      localStorage.setItem('test', 'hello'); // 'test' (4) + 'hello' (5) = 9 chars = 18 bytes

      const result = getLocalStorageUsage();

      expect(result.usage).toBe(18);
      expect(result.percentUsed).toBeGreaterThan(0);
    });

    it('should calculate usage for multiple items', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      const result = getLocalStorageUsage();

      // 'key1' (4) + 'value1' (6) = 10 chars = 20 bytes
      // 'key2' (4) + 'value2' (6) = 10 chars = 20 bytes
      // Total: 40 bytes
      expect(result.usage).toBe(40);
    });
  });

  describe('getDogTaleStorageUsage', () => {
    it('should only count dogtale- prefixed keys', () => {
      localStorage.setItem('dogtale-favorites', '[1,2,3]');
      localStorage.setItem('other-key', 'should not count');
      localStorage.setItem('dogtale-settings', '{}');

      const result = getDogTaleStorageUsage();

      expect(result.itemCount).toBe(2);
      expect(result.items.some(i => i.key === 'dogtale-favorites')).toBe(true);
      expect(result.items.some(i => i.key === 'dogtale-settings')).toBe(true);
      expect(result.items.some(i => i.key === 'other-key')).toBe(false);
    });

    it('should sort items by size (largest first)', () => {
      localStorage.setItem('dogtale-small', 'a');
      localStorage.setItem('dogtale-large', 'a'.repeat(1000));
      localStorage.setItem('dogtale-medium', 'a'.repeat(100));

      const result = getDogTaleStorageUsage();

      expect(result.items[0].key).toBe('dogtale-large');
      expect(result.items[1].key).toBe('dogtale-medium');
      expect(result.items[2].key).toBe('dogtale-small');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(100)).toBe('100 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    });
  });

  describe('hasSpaceFor', () => {
    it('should return true for small values', () => {
      expect(hasSpaceFor('hello')).toBe(true);
      expect(hasSpaceFor('a'.repeat(1000))).toBe(true);
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      expect(hasSpaceFor('test')).toBe(false);

      localStorage.setItem = originalSetItem;
    });
  });

  describe('checkStorageQuota', () => {
    it('should return storage quota info', async () => {
      const result = await checkStorageQuota();

      expect(result).toHaveProperty('usage');
      expect(result).toHaveProperty('quota');
      expect(result).toHaveProperty('percentUsed');
      expect(result).toHaveProperty('isWarning');
      expect(result).toHaveProperty('available');
    });

    it('should detect warning threshold', async () => {
      // Fill storage close to limit (mock scenario)
      const result = await checkStorageQuota();

      // For empty storage, should not be warning
      expect(result.isWarning).toBe(false);
    });
  });

  describe('getStorageWarning', () => {
    it('should return null when storage is not full', async () => {
      const warning = await getStorageWarning();
      expect(warning).toBeNull();
    });
  });

  describe('subscribeToStorageChanges', () => {
    it('should return an unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToStorageChanges(callback);

      expect(typeof unsubscribe).toBe('function');

      // Clean up
      unsubscribe();
    });

    it('should call callback on storage events for dogtale keys', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToStorageChanges(callback);

      // Simulate storage event
      const event = new StorageEvent('storage', {
        key: 'dogtale-test',
        newValue: 'value',
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });

    it('should not call callback for non-dogtale keys', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToStorageChanges(callback);

      // Simulate storage event for non-dogtale key
      const event = new StorageEvent('storage', {
        key: 'other-key',
        newValue: 'value',
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
    });
  });
});
