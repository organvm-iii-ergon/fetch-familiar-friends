/**
 * Tests for Data Validation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateString,
  validateNumber,
  validateArray,
  validateDate,
  validateBreed,
  validateContentItem,
  findDuplicates,
  validateContentData,
  sanitizeInput,
  isFamilyFriendly
} from './dataValidation.js';

describe('validateRequired', () => {
  it('should validate non-empty values', () => {
    expect(validateRequired('test', 'field').valid).toBe(true);
    expect(validateRequired(123, 'field').valid).toBe(true);
    expect(validateRequired([], 'field').valid).toBe(true);
  });

  it('should fail for empty values', () => {
    expect(validateRequired('', 'field').valid).toBe(false);
    expect(validateRequired(null, 'field').valid).toBe(false);
    expect(validateRequired(undefined, 'field').valid).toBe(false);
  });
});

describe('validateString', () => {
  it('should validate correct strings', () => {
    expect(validateString('hello', 'field').valid).toBe(true);
    expect(validateString('hello world', 'field', { minLength: 5 }).valid).toBe(true);
  });

  it('should fail for non-strings', () => {
    expect(validateString(123, 'field').valid).toBe(false);
    expect(validateString([], 'field').valid).toBe(false);
  });

  it('should validate string length', () => {
    const result = validateString('hi', 'field', { minLength: 5 });
    expect(result.valid).toBe(false);

    const result2 = validateString('this is a very long string', 'field', { maxLength: 10 });
    expect(result2.valid).toBe(false);
  });

  it('should validate string patterns', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(validateString('test@example.com', 'email', { pattern: emailPattern }).valid).toBe(true);
    expect(validateString('invalid-email', 'email', { pattern: emailPattern }).valid).toBe(false);
  });
});

describe('validateNumber', () => {
  it('should validate correct numbers', () => {
    expect(validateNumber(123, 'field').valid).toBe(true);
    expect(validateNumber(0, 'field').valid).toBe(true);
    expect(validateNumber(-5, 'field').valid).toBe(true);
  });

  it('should fail for non-numbers', () => {
    expect(validateNumber('123', 'field').valid).toBe(false);
    expect(validateNumber(NaN, 'field').valid).toBe(false);
  });

  it('should validate number range', () => {
    expect(validateNumber(5, 'field', { min: 0, max: 10 }).valid).toBe(true);
    expect(validateNumber(-1, 'field', { min: 0 }).valid).toBe(false);
    expect(validateNumber(11, 'field', { max: 10 }).valid).toBe(false);
  });

  it('should validate integers', () => {
    expect(validateNumber(5, 'field', { integer: true }).valid).toBe(true);
    expect(validateNumber(5.5, 'field', { integer: true }).valid).toBe(false);
  });
});

describe('validateArray', () => {
  it('should validate arrays', () => {
    expect(validateArray([], 'field').valid).toBe(true);
    expect(validateArray([1, 2, 3], 'field').valid).toBe(true);
  });

  it('should fail for non-arrays', () => {
    expect(validateArray('not an array', 'field').valid).toBe(false);
    expect(validateArray({ length: 3 }, 'field').valid).toBe(false);
  });

  it('should validate array length', () => {
    expect(validateArray([1, 2], 'field', { minLength: 3 }).valid).toBe(false);
    expect(validateArray([1, 2, 3, 4], 'field', { maxLength: 3 }).valid).toBe(false);
  });
});

describe('validateDate', () => {
  it('should validate correct dates', () => {
    expect(validateDate(new Date(), 'field').valid).toBe(true);
    expect(validateDate('2025-11-17', 'field').valid).toBe(true);
    expect(validateDate('2025-11-17T00:00:00Z', 'field').valid).toBe(true);
  });

  it('should fail for invalid dates', () => {
    expect(validateDate('not a date', 'field').valid).toBe(false);
    expect(validateDate('2025-13-45', 'field').valid).toBe(false);
  });
});

describe('validateBreed', () => {
  it('should validate correct dog breed', () => {
    const dogBreed = {
      name: 'Golden Retriever',
      mainBreed: 'Retriever',
      subBreed: 'Golden',
      slug: 'retriever-golden',
      source: 'dog.ceo',
      fetchedAt: new Date().toISOString()
    };

    const result = validateBreed(dogBreed, 'dog');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate correct cat breed', () => {
    const catBreed = {
      name: 'Abyssinian',
      description: 'Active and playful cat breed',
      source: 'thecatapi.com',
      fetchedAt: new Date().toISOString(),
      traits: {
        adaptability: 5,
        affectionLevel: 4,
        childFriendly: 3
      }
    };

    const result = validateBreed(catBreed, 'cat');
    expect(result.valid).toBe(true);
  });

  it('should fail for missing required fields', () => {
    const invalidBreed = {
      name: 'Test Breed'
      // Missing source and fetchedAt
    };

    const result = validateBreed(invalidBreed, 'dog');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateContentItem', () => {
  it('should validate dog facts', () => {
    const fact = 'Dogs have an incredible sense of smell.';
    const result = validateContentItem(fact, 'fact');
    expect(result.valid).toBe(true);
  });

  it('should fail for too short facts', () => {
    const fact = 'Dogs.';
    const result = validateContentItem(fact, 'fact');
    expect(result.valid).toBe(false);
  });

  it('should validate moods', () => {
    const mood = {
      emoji: '😊',
      text: 'Happy',
      description: 'Feeling great today!'
    };
    const result = validateContentItem(mood, 'mood');
    expect(result.valid).toBe(true);
  });

  it('should fail for invalid mood structure', () => {
    const mood = {
      emoji: '😊'
      // Missing text and description
    };
    const result = validateContentItem(mood, 'mood');
    expect(result.valid).toBe(false);
  });
});

describe('findDuplicates', () => {
  it('should find no duplicates in unique array', () => {
    const items = [1, 2, 3, 4, 5];
    const result = findDuplicates(items);
    expect(result.hasDuplicates).toBe(false);
    expect(result.duplicates).toHaveLength(0);
  });

  it('should find duplicates in array', () => {
    const items = [1, 2, 3, 2, 4, 3];
    const result = findDuplicates(items);
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicates.length).toBeGreaterThan(0);
  });

  it('should use custom key function', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 1, name: 'C' }
    ];
    const result = findDuplicates(items, item => item.id);
    expect(result.hasDuplicates).toBe(true);
  });
});

describe('validateContentData', () => {
  it('should validate correct content data', () => {
    const content = {
      dogFacts: [
        'Dogs have an amazing sense of smell.',
        'Puppies are born blind and deaf.'
      ],
      catFacts: [
        'Cats spend 70% of their lives sleeping.'
      ],
      quotes: [
        'Dogs are a man\'s best friend.'
      ],
      moods: [
        { emoji: '😊', text: 'Happy', description: 'Feeling joyful today!' }
      ]
    };

    const result = validateContentData(content);
    expect(result.valid).toBe(true);
    expect(result.summary.dogFacts).toBe(2);
    expect(result.summary.catFacts).toBe(1);
  });

  it('should find duplicate facts', () => {
    const content = {
      dogFacts: [
        'Dogs have an amazing sense of smell.',
        'Dogs have an amazing sense of smell.'
      ]
    };

    const result = validateContentData(content);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('duplicate'))).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("xss")</script> world';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<script>');
    expect(result).toBe('Hello  world');
  });

  it('should remove iframe tags', () => {
    const input = 'Test <iframe src="evil.com"></iframe> content';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<iframe>');
  });

  it('should remove javascript: protocol', () => {
    const input = 'Click <a href="javascript:alert(1)">here</a>';
    const result = sanitizeInput(input);
    expect(result).not.toContain('javascript:');
  });

  it('should handle non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('');
  });
});

describe('isFamilyFriendly', () => {
  it('should pass family-friendly content', () => {
    expect(isFamilyFriendly('Dogs are wonderful pets!')).toBe(true);
    expect(isFamilyFriendly('Have a great day with your furry friend!')).toBe(true);
  });

  it('should flag profanity', () => {
    expect(isFamilyFriendly('This is shit')).toBe(false);
    expect(isFamilyFriendly('What the hell')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isFamilyFriendly('This is SHIT')).toBe(false);
    expect(isFamilyFriendly('What the HELL')).toBe(false);
  });
});
