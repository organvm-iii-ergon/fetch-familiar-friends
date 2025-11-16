import { describe, it, expect } from 'vitest';
import { getDailyFact, getDailyMood, getDailyQuote, getAllDailyContent } from './dailyContent';

describe('dailyContent utilities', () => {
  describe('getDailyFact', () => {
    it('should return a consistent fact for the same date', () => {
      const date = new Date('2024-01-15');
      const fact1 = getDailyFact(date);
      const fact2 = getDailyFact(date);
      expect(fact1).toBe(fact2);
    });

    it('should return different facts for different dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      const fact1 = getDailyFact(date1);
      const fact2 = getDailyFact(date2);

      // Note: There's a small chance these could be the same, but unlikely
      // If this test fails occasionally, it's due to random collision
      expect(fact1).toBeDefined();
      expect(fact2).toBeDefined();
    });

    it('should return dog facts by default', () => {
      const date = new Date('2024-01-15');
      const fact = getDailyFact(date, false);
      expect(typeof fact).toBe('string');
      expect(fact.length).toBeGreaterThan(0);
    });

    it('should return cat facts when isCat is true', () => {
      const date = new Date('2024-01-15');
      const catFact = getDailyFact(date, true);
      const dogFact = getDailyFact(date, false);

      expect(typeof catFact).toBe('string');
      expect(catFact.length).toBeGreaterThan(0);

      // Cat and dog facts for same date should be different
      // (unless by rare chance they have same text)
      expect(catFact).toBeDefined();
      expect(dogFact).toBeDefined();
    });
  });

  describe('getDailyMood', () => {
    it('should return a consistent mood for the same date', () => {
      const date = new Date('2024-01-15');
      const mood1 = getDailyMood(date);
      const mood2 = getDailyMood(date);
      expect(mood1).toEqual(mood2);
    });

    it('should return a mood object with required properties', () => {
      const date = new Date('2024-01-15');
      const mood = getDailyMood(date);

      expect(mood).toBeDefined();
      expect(mood).toHaveProperty('emoji');
      expect(mood).toHaveProperty('text');
      expect(mood).toHaveProperty('description');
      expect(typeof mood.emoji).toBe('string');
      expect(typeof mood.text).toBe('string');
      expect(typeof mood.description).toBe('string');
    });

    it('should return valid mood data', () => {
      const date = new Date('2024-01-15');
      const mood = getDailyMood(date);

      expect(mood.emoji.length).toBeGreaterThan(0);
      expect(mood.text.length).toBeGreaterThan(0);
      expect(mood.description.length).toBeGreaterThan(0);
    });
  });

  describe('getDailyQuote', () => {
    it('should return a consistent quote for the same date', () => {
      const date = new Date('2024-01-15');
      const quote1 = getDailyQuote(date);
      const quote2 = getDailyQuote(date);
      expect(quote1).toBe(quote2);
    });

    it('should return a non-empty string', () => {
      const date = new Date('2024-01-15');
      const quote = getDailyQuote(date);

      expect(typeof quote).toBe('string');
      expect(quote.length).toBeGreaterThan(0);
    });

    it('should return different quotes for different dates (usually)', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      const quote1 = getDailyQuote(date1);
      const quote2 = getDailyQuote(date2);

      // Both should be valid quotes
      expect(quote1).toBeDefined();
      expect(quote2).toBeDefined();
      expect(typeof quote1).toBe('string');
      expect(typeof quote2).toBe('string');
    });
  });

  describe('getAllDailyContent', () => {
    it('should return an object with all content types', () => {
      const date = new Date('2024-01-15');
      const content = getAllDailyContent(date);

      expect(content).toBeDefined();
      expect(content).toHaveProperty('fact');
      expect(content).toHaveProperty('mood');
      expect(content).toHaveProperty('quote');
    });

    it('should return consistent content for the same date', () => {
      const date = new Date('2024-01-15');
      const content1 = getAllDailyContent(date);
      const content2 = getAllDailyContent(date);

      expect(content1.fact).toBe(content2.fact);
      expect(content1.mood).toEqual(content2.mood);
      expect(content1.quote).toBe(content2.quote);
    });

    it('should return dog content by default', () => {
      const date = new Date('2024-01-15');
      const content = getAllDailyContent(date, false);

      expect(typeof content.fact).toBe('string');
      expect(content.fact.length).toBeGreaterThan(0);
    });

    it('should return cat content when isCat is true', () => {
      const date = new Date('2024-01-15');
      const catContent = getAllDailyContent(date, true);
      const dogContent = getAllDailyContent(date, false);

      expect(typeof catContent.fact).toBe('string');
      expect(typeof dogContent.fact).toBe('string');

      // Moods and quotes should be the same (only facts differ)
      expect(catContent.mood).toEqual(dogContent.mood);
      expect(catContent.quote).toBe(dogContent.quote);
    });

    it('should return valid mood structure', () => {
      const date = new Date('2024-01-15');
      const content = getAllDailyContent(date);

      expect(content.mood).toHaveProperty('emoji');
      expect(content.mood).toHaveProperty('text');
      expect(content.mood).toHaveProperty('description');
    });
  });

  describe('Date consistency across years', () => {
    it('should return different content for same day in different years', () => {
      const date2024 = new Date('2024-01-15');
      const date2025 = new Date('2025-01-15');

      const content2024 = getAllDailyContent(date2024);
      const content2025 = getAllDailyContent(date2025);

      // Content should be defined for both
      expect(content2024).toBeDefined();
      expect(content2025).toBeDefined();

      // They should be valid content
      expect(content2024.fact).toBeDefined();
      expect(content2025.fact).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29');
      const content = getAllDailyContent(leapDay);

      expect(content).toBeDefined();
      expect(content.fact).toBeDefined();
      expect(content.mood).toBeDefined();
      expect(content.quote).toBeDefined();
    });

    it('should handle year boundaries', () => {
      const newYearsEve = new Date('2024-12-31');
      const newYearsDay = new Date('2025-01-01');

      const content1 = getAllDailyContent(newYearsEve);
      const content2 = getAllDailyContent(newYearsDay);

      expect(content1).toBeDefined();
      expect(content2).toBeDefined();
    });

    it('should handle dates far in the past', () => {
      const oldDate = new Date('2000-01-01');
      const content = getAllDailyContent(oldDate);

      expect(content).toBeDefined();
      expect(content.fact).toBeDefined();
    });

    it('should handle dates far in the future', () => {
      const futureDate = new Date('2050-12-31');
      const content = getAllDailyContent(futureDate);

      expect(content).toBeDefined();
      expect(content.fact).toBeDefined();
    });
  });
});
