import { describe, it, expect } from 'vitest';
import {
  getDateKey,
  parseDateKey,
  isValidDateKey,
  getTodayKey,
  getOffsetDateKey,
  formatDateDisplay,
  isSameDay,
  isToday,
  isFutureDate,
  isPastDate,
} from './dateUtils';

describe('dateUtils', () => {
  describe('getDateKey', () => {
    it('should return YYYY-MM-DD format', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(getDateKey(date)).toBe('2024-03-15');
    });

    it('should handle dates at different times consistently', () => {
      const morning = new Date('2024-03-15T06:00:00Z');
      const evening = new Date('2024-03-15T23:59:59Z');
      expect(getDateKey(morning)).toBe(getDateKey(evening));
    });

    it('should throw for invalid date', () => {
      expect(() => getDateKey(new Date('invalid'))).toThrow('Invalid date');
    });

    it('should throw for non-Date values', () => {
      expect(() => getDateKey('2024-03-15')).toThrow('Invalid date');
      expect(() => getDateKey(null)).toThrow();
    });

    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29T12:00:00Z');
      expect(getDateKey(leapDay)).toBe('2024-02-29');
    });

    it('should handle year boundaries', () => {
      const newYearsEve = new Date('2023-12-31T12:00:00Z');
      const newYearsDay = new Date('2024-01-01T12:00:00Z');
      expect(getDateKey(newYearsEve)).toBe('2023-12-31');
      expect(getDateKey(newYearsDay)).toBe('2024-01-01');
    });
  });

  describe('parseDateKey', () => {
    it('should parse valid date key', () => {
      const result = parseDateKey('2024-03-15');
      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(2); // 0-indexed
      expect(result.getUTCDate()).toBe(15);
    });

    it('should throw for invalid format', () => {
      expect(() => parseDateKey('03-15-2024')).toThrow('Invalid date key');
      expect(() => parseDateKey('2024/03/15')).toThrow('Invalid date key');
      expect(() => parseDateKey('invalid')).toThrow('Invalid date key');
    });

    it('should throw for invalid date values', () => {
      expect(() => parseDateKey('2024-13-01')).toThrow('Invalid date key'); // Invalid month
      expect(() => parseDateKey('2024-02-30')).toThrow('Invalid date key'); // Invalid day
    });

    it('should roundtrip with getDateKey', () => {
      const originalDate = new Date('2024-03-15T12:00:00Z');
      const key = getDateKey(originalDate);
      const parsedDate = parseDateKey(key);
      expect(getDateKey(parsedDate)).toBe(key);
    });
  });

  describe('isValidDateKey', () => {
    it('should return true for valid date keys', () => {
      expect(isValidDateKey('2024-03-15')).toBe(true);
      expect(isValidDateKey('2000-01-01')).toBe(true);
      expect(isValidDateKey('2099-12-31')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidDateKey('03-15-2024')).toBe(false);
      expect(isValidDateKey('2024/03/15')).toBe(false);
      expect(isValidDateKey('20240315')).toBe(false);
      expect(isValidDateKey('invalid')).toBe(false);
      expect(isValidDateKey('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidDateKey(null)).toBe(false);
      expect(isValidDateKey(undefined)).toBe(false);
      expect(isValidDateKey(12345)).toBe(false);
      expect(isValidDateKey({})).toBe(false);
    });

    it('should return false for invalid date values', () => {
      expect(isValidDateKey('2024-13-01')).toBe(false); // Invalid month
      expect(isValidDateKey('2024-02-30')).toBe(false); // Invalid day for February
      expect(isValidDateKey('2023-02-29')).toBe(false); // Invalid leap day (2023 not leap year)
    });

    it('should return true for valid leap day', () => {
      expect(isValidDateKey('2024-02-29')).toBe(true); // 2024 is a leap year
    });
  });

  describe('getTodayKey', () => {
    it('should return a valid date key', () => {
      const todayKey = getTodayKey();
      expect(isValidDateKey(todayKey)).toBe(true);
    });

    it('should match getDateKey for new Date()', () => {
      const now = new Date();
      // Note: There's a tiny chance these could differ if called at midnight
      expect(getTodayKey()).toBe(getDateKey(now));
    });
  });

  describe('getOffsetDateKey', () => {
    it('should return correct date for positive offset', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(getOffsetDateKey(date, 1)).toBe('2024-03-16');
      expect(getOffsetDateKey(date, 5)).toBe('2024-03-20');
    });

    it('should return correct date for negative offset', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(getOffsetDateKey(date, -1)).toBe('2024-03-14');
      expect(getOffsetDateKey(date, -15)).toBe('2024-02-29');
    });

    it('should handle zero offset', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(getOffsetDateKey(date, 0)).toBe('2024-03-15');
    });

    it('should handle month boundaries', () => {
      const endOfMonth = new Date('2024-03-31T12:00:00Z');
      expect(getOffsetDateKey(endOfMonth, 1)).toBe('2024-04-01');
    });

    it('should handle year boundaries', () => {
      const endOfYear = new Date('2024-12-31T12:00:00Z');
      expect(getOffsetDateKey(endOfYear, 1)).toBe('2025-01-01');
    });
  });

  describe('formatDateDisplay', () => {
    it('should format date with default options', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      const formatted = formatDateDisplay(date);
      // Just check it contains expected parts (locale may vary)
      expect(formatted).toContain('2024');
      expect(formatted).toContain('15');
    });

    it('should accept custom options', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      const formatted = formatDateDisplay(date, 'en-US', { weekday: 'short', month: 'short' });
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day different times', () => {
      const morning = new Date('2024-03-15T08:00:00Z');
      const evening = new Date('2024-03-15T20:00:00Z');
      expect(isSameDay(morning, evening)).toBe(true);
    });

    it('should return false for different days', () => {
      const day1 = new Date('2024-03-15T12:00:00Z');
      const day2 = new Date('2024-03-16T12:00:00Z');
      expect(isSameDay(day1, day2)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should return true for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isFutureDate(tomorrow)).toBe(true);
    });

    it('should return false for today', () => {
      expect(isFutureDate(new Date())).toBe(false);
    });

    it('should return false for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isFutureDate(yesterday)).toBe(false);
    });
  });

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isPastDate(yesterday)).toBe(true);
    });

    it('should return false for today', () => {
      expect(isPastDate(new Date())).toBe(false);
    });

    it('should return false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isPastDate(tomorrow)).toBe(false);
    });
  });
});
