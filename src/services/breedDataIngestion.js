/**
 * Breed Data Ingestion Service
 *
 * Fetches comprehensive breed information from external APIs:
 * - Dog CEO API for dog breeds
 * - The Cat API for cat breeds
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Error handling and logging
 * - Data normalization and validation
 * - Cache management
 */

const DOG_API_BASE = 'https://dog.ceo/api';
const CAT_API_BASE = 'https://api.thecatapi.com/v1';
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retries remaining
 * @param {number} delay - Current delay in ms
 * @returns {Promise<any>} - Result of the function
 */
async function retryWithBackoff(fn, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    console.warn(`Retrying after ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * Fetch data from an API endpoint with retry logic
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function fetchWithRetry(url, options = {}) {
  return retryWithBackoff(async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  });
}

/**
 * Fetch all dog breeds from Dog CEO API
 * @returns {Promise<Object>} - Object with breed data
 */
export async function fetchDogBreeds() {
  console.log('Fetching dog breeds from Dog CEO API...');

  try {
    const data = await fetchWithRetry(`${DOG_API_BASE}/breeds/list/all`);

    if (!data.message) {
      throw new Error('Invalid response format from Dog CEO API');
    }

    const breeds = {};
    const breedList = data.message;

    // Process each breed
    for (const [breed, subBreeds] of Object.entries(breedList)) {
      const breedKey = breed.toLowerCase();

      // For breeds with sub-breeds
      if (subBreeds && subBreeds.length > 0) {
        for (const subBreed of subBreeds) {
          const subBreedKey = `${breed}-${subBreed}`.toLowerCase();
          const displayName = `${capitalize(subBreed)} ${capitalize(breed)}`;

          breeds[subBreedKey] = {
            name: displayName,
            mainBreed: capitalize(breed),
            subBreed: capitalize(subBreed),
            slug: subBreedKey,
            source: 'dog.ceo',
            fetchedAt: new Date().toISOString()
          };
        }
      } else {
        // Main breed without sub-breeds
        breeds[breedKey] = {
          name: capitalize(breed),
          mainBreed: capitalize(breed),
          subBreed: null,
          slug: breedKey,
          source: 'dog.ceo',
          fetchedAt: new Date().toISOString()
        };
      }
    }

    console.log(`✓ Fetched ${Object.keys(breeds).length} dog breeds`);
    return breeds;

  } catch (error) {
    console.error('Failed to fetch dog breeds:', error);
    throw error;
  }
}

/**
 * Fetch sample images for a specific dog breed
 * @param {string} breed - Breed slug (e.g., 'retriever-golden')
 * @param {number} count - Number of images to fetch
 * @returns {Promise<string[]>} - Array of image URLs
 */
export async function fetchDogBreedImages(breed, count = 5) {
  try {
    const endpoint = `${DOG_API_BASE}/breed/${breed}/images/random/${count}`;
    const data = await fetchWithRetry(endpoint);

    return data.message || [];
  } catch (error) {
    console.warn(`Failed to fetch images for breed ${breed}:`, error);
    return [];
  }
}

/**
 * Fetch all cat breeds from The Cat API
 * @returns {Promise<Object>} - Object with breed data
 */
export async function fetchCatBreeds() {
  console.log('Fetching cat breeds from The Cat API...');

  try {
    const data = await fetchWithRetry(`${CAT_API_BASE}/breeds`);

    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from Cat API');
    }

    const breeds = {};

    for (const breed of data) {
      const breedKey = breed.id.toLowerCase();

      breeds[breedKey] = {
        name: breed.name,
        description: breed.description || '',
        temperament: breed.temperament || '',
        origin: breed.origin || '',
        lifeSpan: breed.life_span || '',
        weight: breed.weight?.metric || '',
        wikipediaUrl: breed.wikipedia_url || null,
        cfaUrl: breed.cfa_url || null,
        slug: breedKey,
        source: 'thecatapi.com',
        traits: {
          adaptability: breed.adaptability || 0,
          affectionLevel: breed.affection_level || 0,
          childFriendly: breed.child_friendly || 0,
          dogFriendly: breed.dog_friendly || 0,
          energyLevel: breed.energy_level || 0,
          grooming: breed.grooming || 0,
          healthIssues: breed.health_issues || 0,
          intelligence: breed.intelligence || 0,
          sheddingLevel: breed.shedding_level || 0,
          socialNeeds: breed.social_needs || 0,
          strangerFriendly: breed.stranger_friendly || 0,
          vocalisation: breed.vocalisation || 0
        },
        fetchedAt: new Date().toISOString()
      };
    }

    console.log(`✓ Fetched ${Object.keys(breeds).length} cat breeds`);
    return breeds;

  } catch (error) {
    console.error('Failed to fetch cat breeds:', error);
    throw error;
  }
}

/**
 * Fetch all breed data (dogs and cats)
 * @returns {Promise<Object>} - Complete breed database
 */
export async function fetchAllBreeds() {
  console.log('Starting comprehensive breed data ingestion...\n');

  const results = {
    dogs: {},
    cats: {},
    meta: {
      startedAt: new Date().toISOString(),
      completedAt: null,
      totalDogs: 0,
      totalCats: 0,
      errors: [],
      version: '1.0.0'
    }
  };

  // Fetch dog breeds
  try {
    results.dogs = await fetchDogBreeds();
    results.meta.totalDogs = Object.keys(results.dogs).length;
  } catch (error) {
    results.meta.errors.push({
      source: 'dog.ceo',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Fetch cat breeds
  try {
    results.cats = await fetchCatBreeds();
    results.meta.totalCats = Object.keys(results.cats).length;
  } catch (error) {
    results.meta.errors.push({
      source: 'thecatapi.com',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  results.meta.completedAt = new Date().toISOString();

  console.log('\n✓ Breed data ingestion complete');
  console.log(`  - Dogs: ${results.meta.totalDogs} breeds`);
  console.log(`  - Cats: ${results.meta.totalCats} breeds`);
  console.log(`  - Errors: ${results.meta.errors.length}`);

  return results;
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validate breed data structure
 * @param {Object} breedData - Breed data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateBreedData(breedData) {
  const errors = [];

  // Check required top-level properties
  if (!breedData.dogs || typeof breedData.dogs !== 'object') {
    errors.push('Missing or invalid "dogs" property');
  }

  if (!breedData.cats || typeof breedData.cats !== 'object') {
    errors.push('Missing or invalid "cats" property');
  }

  if (!breedData.meta || typeof breedData.meta !== 'object') {
    errors.push('Missing or invalid "meta" property');
  }

  // Check meta properties
  if (breedData.meta) {
    const requiredMetaProps = ['startedAt', 'completedAt', 'totalDogs', 'totalCats', 'version'];
    for (const prop of requiredMetaProps) {
      if (!(prop in breedData.meta)) {
        errors.push(`Missing meta property: ${prop}`);
      }
    }
  }

  // Validate individual breed entries
  if (breedData.dogs) {
    for (const [key, breed] of Object.entries(breedData.dogs)) {
      if (!breed.name) {
        errors.push(`Dog breed ${key} missing name`);
      }
      if (!breed.source) {
        errors.push(`Dog breed ${key} missing source`);
      }
      if (!breed.fetchedAt) {
        errors.push(`Dog breed ${key} missing fetchedAt timestamp`);
      }
    }
  }

  if (breedData.cats) {
    for (const [key, breed] of Object.entries(breedData.cats)) {
      if (!breed.name) {
        errors.push(`Cat breed ${key} missing name`);
      }
      if (!breed.source) {
        errors.push(`Cat breed ${key} missing source`);
      }
      if (!breed.fetchedAt) {
        errors.push(`Cat breed ${key} missing fetchedAt timestamp`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    summary: {
      totalDogs: Object.keys(breedData.dogs || {}).length,
      totalCats: Object.keys(breedData.cats || {}).length,
      errorCount: errors.length
    }
  };
}

/**
 * Get breed data statistics
 * @param {Object} breedData - Breed database
 * @returns {Object} - Statistics object
 */
export function getBreedDataStats(breedData) {
  const stats = {
    dogs: {
      total: Object.keys(breedData.dogs || {}).length,
      withSubBreeds: 0,
      mainBreeds: new Set()
    },
    cats: {
      total: Object.keys(breedData.cats || {}).length,
      withDescription: 0,
      avgTraitScore: 0
    },
    meta: breedData.meta || {}
  };

  // Dog stats
  for (const breed of Object.values(breedData.dogs || {})) {
    if (breed.mainBreed) {
      stats.dogs.mainBreeds.add(breed.mainBreed);
    }
    if (breed.subBreed) {
      stats.dogs.withSubBreeds++;
    }
  }
  stats.dogs.mainBreeds = stats.dogs.mainBreeds.size;

  // Cat stats
  let totalTraitScores = 0;
  let traitCount = 0;

  for (const breed of Object.values(breedData.cats || {})) {
    if (breed.description && breed.description.length > 0) {
      stats.cats.withDescription++;
    }

    if (breed.traits) {
      for (const score of Object.values(breed.traits)) {
        if (typeof score === 'number') {
          totalTraitScores += score;
          traitCount++;
        }
      }
    }
  }

  if (traitCount > 0) {
    stats.cats.avgTraitScore = (totalTraitScores / traitCount).toFixed(2);
  }

  return stats;
}

// Export for use in Node.js scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchDogBreeds,
    fetchDogBreedImages,
    fetchCatBreeds,
    fetchAllBreeds,
    validateBreedData,
    getBreedDataStats
  };
}
