import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveData,
  loadData,
  removeData,
  clearBackups,
  hasData,
  getBackupCount,
  createBackup,
  restoreFromBackup,
  getStorageInfo,
  createNamespacedStorage,
  dogTaleStorage,
} from './resilientStorage';

describe('resilientStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveData', () => {
    it('should save data to localStorage', () => {
      const result = saveData('test-key', { foo: 'bar' });
      expect(result.success).toBe(true);
      expect(localStorage.getItem('test-key')).toBe('{"foo":"bar"}');
    });

    it('should create backups when saving', () => {
      // Save initial value
      saveData('test-key', { version: 1 });

      // Save new value (should backup the old one)
      saveData('test-key', { version: 2 });

      expect(localStorage.getItem('test-key')).toBe('{"version":2}');
      expect(localStorage.getItem('test-key_backup_0')).toBe('{"version":1}');
    });

    it('should rotate backups correctly', () => {
      saveData('test-key', { v: 1 });
      saveData('test-key', { v: 2 });
      saveData('test-key', { v: 3 });
      saveData('test-key', { v: 4 });

      // Current value should be 4
      expect(JSON.parse(localStorage.getItem('test-key'))).toEqual({ v: 4 });

      // Backups should be rotated (most recent first)
      expect(JSON.parse(localStorage.getItem('test-key_backup_0'))).toEqual({ v: 3 });
      expect(JSON.parse(localStorage.getItem('test-key_backup_1'))).toEqual({ v: 2 });
      expect(JSON.parse(localStorage.getItem('test-key_backup_2'))).toEqual({ v: 1 });
    });

    it('should limit backups to MAX_BACKUPS (3)', () => {
      // Save 5 values
      for (let i = 1; i <= 5; i++) {
        saveData('test-key', { v: i });
      }

      // Should only have 3 backups
      expect(getBackupCount('test-key')).toBe(3);

      // Oldest backup should be v: 2 (v: 1 was rotated out)
      expect(JSON.parse(localStorage.getItem('test-key_backup_2'))).toEqual({ v: 2 });
    });

    it('should skip backup creation when createBackup option is false', () => {
      saveData('test-key', { v: 1 });
      saveData('test-key', { v: 2 }, { createBackup: false });

      expect(localStorage.getItem('test-key')).toBe('{"v":2}');
      expect(localStorage.getItem('test-key_backup_0')).toBeNull();
    });
  });

  describe('loadData', () => {
    it('should load and parse data from localStorage', () => {
      localStorage.setItem('test-key', '{"foo":"bar"}');
      const result = loadData('test-key');

      expect(result.data).toEqual({ foo: 'bar' });
      expect(result.recovered).toBe(false);
    });

    it('should return default value for non-existent keys', () => {
      const result = loadData('non-existent', { default: true });
      expect(result.data).toEqual({ default: true });
      expect(result.recovered).toBe(false);
    });

    it('should recover from corrupted data using backups', () => {
      // Create a valid backup
      localStorage.setItem('test-key_backup_0', '{"valid":"data"}');

      // Set corrupted data as main value
      localStorage.setItem('test-key', 'not valid json{');

      const result = loadData('test-key', { default: true });

      expect(result.data).toEqual({ valid: 'data' });
      expect(result.recovered).toBe(true);

      // Main storage should be restored
      expect(localStorage.getItem('test-key')).toBe('{"valid":"data"}');
    });

    it('should try multiple backups if first is corrupted', () => {
      // First backup is corrupted
      localStorage.setItem('test-key_backup_0', 'corrupted');
      // Second backup is valid
      localStorage.setItem('test-key_backup_1', '{"from":"backup1"}');

      localStorage.setItem('test-key', 'corrupted main');

      const result = loadData('test-key', { default: true });

      expect(result.data).toEqual({ from: 'backup1' });
      expect(result.recovered).toBe(true);
    });

    it('should return default if all backups are corrupted', () => {
      localStorage.setItem('test-key', 'corrupted');
      localStorage.setItem('test-key_backup_0', 'also corrupted');
      localStorage.setItem('test-key_backup_1', 'still corrupted');
      localStorage.setItem('test-key_backup_2', 'very corrupted');

      const result = loadData('test-key', { fallback: 'value' });

      expect(result.data).toEqual({ fallback: 'value' });
      expect(result.recovered).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('removeData', () => {
    it('should remove data and all backups', () => {
      saveData('test-key', { v: 1 });
      saveData('test-key', { v: 2 });
      saveData('test-key', { v: 3 });

      expect(localStorage.getItem('test-key')).not.toBeNull();
      expect(localStorage.getItem('test-key_backup_0')).not.toBeNull();

      const result = removeData('test-key');

      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBeNull();
      expect(localStorage.getItem('test-key_backup_0')).toBeNull();
      expect(localStorage.getItem('test-key_backup_1')).toBeNull();
      expect(localStorage.getItem('test-key_backup_2')).toBeNull();
    });
  });

  describe('hasData', () => {
    it('should return true for existing keys', () => {
      saveData('test-key', 'value');
      expect(hasData('test-key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(hasData('non-existent')).toBe(false);
    });
  });

  describe('getBackupCount', () => {
    it('should return correct backup count', () => {
      expect(getBackupCount('test-key')).toBe(0);

      saveData('test-key', { v: 1 });
      expect(getBackupCount('test-key')).toBe(0);

      saveData('test-key', { v: 2 });
      expect(getBackupCount('test-key')).toBe(1);

      saveData('test-key', { v: 3 });
      expect(getBackupCount('test-key')).toBe(2);

      saveData('test-key', { v: 4 });
      expect(getBackupCount('test-key')).toBe(3);

      saveData('test-key', { v: 5 });
      expect(getBackupCount('test-key')).toBe(3); // Max is 3
    });
  });

  describe('createBackup', () => {
    it('should manually create a backup', () => {
      localStorage.setItem('test-key', '{"manual":"backup"}');
      const result = createBackup('test-key');

      expect(result).toBe(true);
      expect(localStorage.getItem('test-key_backup_0')).toBe('{"manual":"backup"}');
    });

    it('should return false if key does not exist', () => {
      const result = createBackup('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore data from backup', () => {
      localStorage.setItem('test-key_backup_0', '{"restored":"data"}');
      const result = restoreFromBackup('test-key');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ restored: 'data' });
      expect(localStorage.getItem('test-key')).toBe('{"restored":"data"}');
    });

    it('should return success false if no backups exist', () => {
      const result = restoreFromBackup('test-key');
      expect(result.success).toBe(false);
    });
  });

  describe('clearBackups', () => {
    it('should clear all backups for a key', () => {
      saveData('test-key', { v: 1 });
      saveData('test-key', { v: 2 });
      saveData('test-key', { v: 3 });

      expect(getBackupCount('test-key')).toBe(2);

      clearBackups('test-key');

      expect(getBackupCount('test-key')).toBe(0);
      // Main value should remain
      expect(localStorage.getItem('test-key')).not.toBeNull();
    });
  });

  describe('getStorageInfo', () => {
    it('should return complete storage info', () => {
      saveData('test-key', { v: 1 });
      saveData('test-key', { v: 2 });

      const info = getStorageInfo('test-key');

      expect(info.key).toBe('test-key');
      expect(info.exists).toBe(true);
      expect(info.size).toBeGreaterThan(0);
      expect(info.backupCount).toBe(1);
      expect(info.backups.length).toBe(3);
      expect(info.backups[0].exists).toBe(true);
      expect(info.backups[1].exists).toBe(false);
    });
  });

  describe('createNamespacedStorage', () => {
    it('should create storage with namespace prefix', () => {
      const storage = createNamespacedStorage('myapp');

      storage.save('settings', { theme: 'dark' });

      expect(localStorage.getItem('myapp-settings')).toBe('{"theme":"dark"}');
    });

    it('should handle namespace with trailing dash', () => {
      const storage = createNamespacedStorage('myapp-');

      storage.save('settings', { theme: 'dark' });

      expect(localStorage.getItem('myapp-settings')).toBe('{"theme":"dark"}');
    });

    it('should provide all storage methods', () => {
      const storage = createNamespacedStorage('test');

      expect(typeof storage.save).toBe('function');
      expect(typeof storage.load).toBe('function');
      expect(typeof storage.remove).toBe('function');
      expect(typeof storage.has).toBe('function');
      expect(typeof storage.createBackup).toBe('function');
      expect(typeof storage.restoreFromBackup).toBe('function');
      expect(typeof storage.getInfo).toBe('function');
      expect(typeof storage.getBackupCount).toBe('function');
      expect(typeof storage.clearBackups).toBe('function');
    });
  });

  describe('dogTaleStorage', () => {
    it('should be pre-configured with dogtale namespace', () => {
      dogTaleStorage.save('favorites', [1, 2, 3]);

      expect(localStorage.getItem('dogtale-favorites')).toBe('[1,2,3]');
    });

    it('should work with load method', () => {
      localStorage.setItem('dogtale-favorites', '[1,2,3]');

      const result = dogTaleStorage.load('favorites', []);

      expect(result.data).toEqual([1, 2, 3]);
    });
  });
});
