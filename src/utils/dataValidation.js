/**
 * Data Validation Utilities
 *
 * Provides validation functions for various data types in the application:
 * - Breed data validation
 * - Content validation (facts, quotes, moods)
 * - Schema validation
 * - Type checking
 */

/**
 * Validate a required field exists and is not empty
 * @param {any} value - Value to check
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {Object} - Validation result
 */
export function validateRequired(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return {
      valid: false,
      error: `${fieldName} is required`
    };
  }
  return { valid: true };
}

/**
 * Validate a string field
 * @param {any} value - Value to check
 * @param {string} fieldName - Name of the field
 * @param {Object} options - Validation options (minLength, maxLength, pattern)
 * @returns {Object} - Validation result
 */
export function validateString(value, fieldName, options = {}) {
  const { minLength, maxLength, pattern } = options;

  // Check type
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `${fieldName} must be a string`
    };
  }

  // Check min length
  if (minLength && value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  // Check max length
  if (maxLength && value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be no more than ${maxLength} characters`
    };
  }

  // Check pattern
  if (pattern && !pattern.test(value)) {
    return {
      valid: false,
      error: `${fieldName} format is invalid`
    };
  }

  return { valid: true };
}

/**
 * Validate a number field
 * @param {any} value - Value to check
 * @param {string} fieldName - Name of the field
 * @param {Object} options - Validation options (min, max, integer)
 * @returns {Object} - Validation result
 */
export function validateNumber(value, fieldName, options = {}) {
  const { min, max, integer } = options;

  // Check type
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      valid: false,
      error: `${fieldName} must be a number`
    };
  }

  // Check integer
  if (integer && !Number.isInteger(value)) {
    return {
      valid: false,
      error: `${fieldName} must be an integer`
    };
  }

  // Check min
  if (min !== undefined && value < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min}`
    };
  }

  // Check max
  if (max !== undefined && value > max) {
    return {
      valid: false,
      error: `${fieldName} must be no more than ${max}`
    };
  }

  return { valid: true };
}

/**
 * Validate an array field
 * @param {any} value - Value to check
 * @param {string} fieldName - Name of the field
 * @param {Object} options - Validation options (minLength, maxLength, itemValidator)
 * @returns {Object} - Validation result
 */
export function validateArray(value, fieldName, options = {}) {
  const { minLength, maxLength, itemValidator } = options;

  // Check type
  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: `${fieldName} must be an array`
    };
  }

  // Check min length
  if (minLength && value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must have at least ${minLength} items`
    };
  }

  // Check max length
  if (maxLength && value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must have no more than ${maxLength} items`
    };
  }

  // Validate items
  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      const itemResult = itemValidator(value[i], `${fieldName}[${i}]`);
      if (!itemResult.valid) {
        return itemResult;
      }
    }
  }

  return { valid: true };
}

/**
 * Validate a date/timestamp
 * @param {any} value - Value to check
 * @param {string} fieldName - Name of the field
 * @returns {Object} - Validation result
 */
export function validateDate(value, fieldName) {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: `${fieldName} is not a valid date`
    };
  }

  return { valid: true };
}

/**
 * Validate breed data structure
 * @param {Object} breed - Breed data to validate
 * @param {string} type - 'dog' or 'cat'
 * @returns {Object} - Validation result with errors array
 */
export function validateBreed(breed, type = 'dog') {
  const errors = [];

  // Common required fields
  const nameCheck = validateRequired(breed.name, 'name');
  if (!nameCheck.valid) errors.push(nameCheck.error);

  const sourceCheck = validateRequired(breed.source, 'source');
  if (!sourceCheck.valid) errors.push(sourceCheck.error);

  const fetchedAtCheck = validateDate(breed.fetchedAt, 'fetchedAt');
  if (!fetchedAtCheck.valid) errors.push(fetchedAtCheck.error);

  // Type-specific validation
  if (type === 'dog') {
    const slugCheck = validateString(breed.slug, 'slug', { minLength: 1 });
    if (!slugCheck.valid) errors.push(slugCheck.error);

    const mainBreedCheck = validateString(breed.mainBreed, 'mainBreed', { minLength: 1 });
    if (!mainBreedCheck.valid) errors.push(mainBreedCheck.error);

  } else if (type === 'cat') {
    const descCheck = validateString(breed.description || '', 'description', { maxLength: 2000 });
    if (!descCheck.valid) errors.push(descCheck.error);

    if (breed.traits) {
      const traitFields = [
        'adaptability', 'affectionLevel', 'childFriendly', 'dogFriendly',
        'energyLevel', 'grooming', 'healthIssues', 'intelligence',
        'sheddingLevel', 'socialNeeds', 'strangerFriendly', 'vocalisation'
      ];

      for (const field of traitFields) {
        if (breed.traits[field] !== undefined) {
          const traitCheck = validateNumber(breed.traits[field], `traits.${field}`, { min: 0, max: 5, integer: true });
          if (!traitCheck.valid) errors.push(traitCheck.error);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate content item (fact, quote, mood)
 * @param {any} item - Content item to validate
 * @param {string} type - 'fact', 'quote', or 'mood'
 * @returns {Object} - Validation result
 */
export function validateContentItem(item, type) {
  const errors = [];

  if (type === 'fact' || type === 'quote') {
    // Should be a non-empty string
    if (typeof item !== 'string') {
      errors.push(`${type} must be a string`);
    } else {
      const lengthCheck = validateString(item, type, { minLength: 10, maxLength: 500 });
      if (!lengthCheck.valid) errors.push(lengthCheck.error);
    }

  } else if (type === 'mood') {
    // Should be an object with emoji, text, and description
    if (typeof item !== 'object' || item === null) {
      errors.push('Mood must be an object');
    } else {
      const emojiCheck = validateString(item.emoji, 'emoji', { minLength: 1, maxLength: 10 });
      if (!emojiCheck.valid) errors.push(emojiCheck.error);

      const textCheck = validateString(item.text, 'text', { minLength: 3, maxLength: 100 });
      if (!textCheck.valid) errors.push(textCheck.error);

      const descCheck = validateString(item.description, 'description', { minLength: 5, maxLength: 200 });
      if (!descCheck.valid) errors.push(descCheck.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check for duplicates in an array
 * @param {Array} items - Array to check
 * @param {Function} keyFn - Function to extract key from item (optional)
 * @returns {Object} - Result with duplicates array
 */
export function findDuplicates(items, keyFn = (item) => item) {
  const seen = new Map();
  const duplicates = [];

  items.forEach((item, index) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      duplicates.push({
        index,
        item,
        firstSeenAt: seen.get(key)
      });
    } else {
      seen.set(key, index);
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  };
}

/**
 * Validate content data (facts, quotes, moods)
 * @param {Object} content - Content data object
 * @returns {Object} - Validation result
 */
export function validateContentData(content) {
  const errors = [];

  // Validate dog facts
  if (content.dogFacts) {
    if (!Array.isArray(content.dogFacts)) {
      errors.push('dogFacts must be an array');
    } else {
      content.dogFacts.forEach((fact, i) => {
        const validation = validateContentItem(fact, 'fact');
        if (!validation.valid) {
          errors.push(`dogFacts[${i}]: ${validation.errors.join(', ')}`);
        }
      });

      // Check for duplicates
      const dupes = findDuplicates(content.dogFacts);
      if (dupes.hasDuplicates) {
        errors.push(`Found ${dupes.duplicates.length} duplicate dog facts`);
      }
    }
  }

  // Validate cat facts
  if (content.catFacts) {
    if (!Array.isArray(content.catFacts)) {
      errors.push('catFacts must be an array');
    } else {
      content.catFacts.forEach((fact, i) => {
        const validation = validateContentItem(fact, 'fact');
        if (!validation.valid) {
          errors.push(`catFacts[${i}]: ${validation.errors.join(', ')}`);
        }
      });

      // Check for duplicates
      const dupes = findDuplicates(content.catFacts);
      if (dupes.hasDuplicates) {
        errors.push(`Found ${dupes.duplicates.length} duplicate cat facts`);
      }
    }
  }

  // Validate quotes
  if (content.quotes) {
    if (!Array.isArray(content.quotes)) {
      errors.push('quotes must be an array');
    } else {
      content.quotes.forEach((quote, i) => {
        const validation = validateContentItem(quote, 'quote');
        if (!validation.valid) {
          errors.push(`quotes[${i}]: ${validation.errors.join(', ')}`);
        }
      });

      // Check for duplicates
      const dupes = findDuplicates(content.quotes);
      if (dupes.hasDuplicates) {
        errors.push(`Found ${dupes.duplicates.length} duplicate quotes`);
      }
    }
  }

  // Validate moods
  if (content.moods) {
    if (!Array.isArray(content.moods)) {
      errors.push('moods must be an array');
    } else {
      content.moods.forEach((mood, i) => {
        const validation = validateContentItem(mood, 'mood');
        if (!validation.valid) {
          errors.push(`moods[${i}]: ${validation.errors.join(', ')}`);
        }
      });

      // Check for duplicate moods by text
      const dupes = findDuplicates(content.moods, m => m.text);
      if (dupes.hasDuplicates) {
        errors.push(`Found ${dupes.duplicates.length} duplicate moods`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      dogFacts: content.dogFacts?.length || 0,
      catFacts: content.catFacts?.length || 0,
      quotes: content.quotes?.length || 0,
      moods: content.moods?.length || 0
    }
  };
}

/**
 * Sanitize user input for safety
 * @param {string} input - User input string
 * @returns {string} - Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  // Remove potential XSS attempts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Check if content is family-friendly (basic profanity filter)
 * @param {string} content - Content to check
 * @returns {boolean} - True if family-friendly
 */
export function isFamilyFriendly(content) {
  // Basic profanity list (extend as needed)
  const profanity = [
    'damn', 'hell', 'crap', 'ass', 'shit', 'fuck', 'bitch'
    // Add more as needed, but keep it reasonable
  ];

  const lowerContent = content.toLowerCase();

  for (const word of profanity) {
    if (lowerContent.includes(word)) {
      return false;
    }
  }

  return true;
}
