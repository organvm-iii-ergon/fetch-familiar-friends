/**
 * Storage Utility
 * AsyncStorage wrapper with type safety and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'dogtale-';

export const storage = {
  /**
   * Get a value from storage
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (value === null) {
        return defaultValue;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return defaultValue;
    }
  },

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_PREFIX}${key}`,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
      return false;
    }
  },

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  /**
   * Get all keys with the app prefix
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => key.replace(STORAGE_PREFIX, ''));
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },

  /**
   * Clear all app storage
   */
  async clear(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

export default storage;
