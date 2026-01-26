/**
 * Centralized Date Utilities
 *
 * Provides consistent date key formatting across the application.
 * All date keys use YYYY-MM-DD format in UTC to ensure consistency across timezones.
 */

/**
 * Generate a date key from a Date object
 * Uses UTC to ensure consistent behavior across timezones
 * @param {Date} date - Date to convert
 * @returns {string} - Date key in YYYY-MM-DD format
 */
export function getDateKey(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to getDateKey');
  }
  return date.toISOString().split('T')[0];
}

/**
 * Parse a date key string into a Date object
 * @param {string} key - Date key in YYYY-MM-DD format
 * @returns {Date} - Parsed Date object (at midnight UTC)
 */
export function parseDateKey(key) {
  if (!isValidDateKey(key)) {
    throw new Error(`Invalid date key format: ${key}`);
  }
  // Parse as UTC to maintain consistency
  return new Date(key + 'T00:00:00.000Z');
}

/**
 * Validate a date key string
 * @param {string} key - String to validate
 * @returns {boolean} - True if valid YYYY-MM-DD format
 */
export function isValidDateKey(key) {
  if (typeof key !== 'string') {
    return false;
  }

  // Check format with regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(key)) {
    return false;
  }

  // Check if it's a valid date
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Get the date key for today
 * @returns {string} - Today's date key
 */
export function getTodayKey() {
  return getDateKey(new Date());
}

/**
 * Get date key offset by a number of days
 * @param {Date} date - Base date
 * @param {number} offset - Number of days to offset (positive or negative)
 * @returns {string} - Offset date key
 */
export function getOffsetDateKey(date, offset) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + offset);
  return getDateKey(newDate);
}

/**
 * Format a date for display purposes
 * @param {Date} date - Date to format
 * @param {string} locale - Locale string (default: 'en-US')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDateDisplay(date, locale = 'en-US', options = {}) {
  const defaultOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options
  };
  return date.toLocaleDateString(locale, defaultOptions);
}

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} - True if same day
 */
export function isSameDay(date1, date2) {
  return getDateKey(date1) === getDateKey(date2);
}

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean} - True if today
 */
export function isToday(date) {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is in the future
 * @param {Date} date - Date to check
 * @returns {boolean} - True if in the future
 */
export function isFutureDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
}

/**
 * Check if a date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} - True if in the past
 */
export function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}
