/**
 * Image API Service
 *
 * Centralized management for dog.ceo and thecatapi.com APIs with:
 * - Rate limiting (50 req/min)
 * - Retry logic with exponential backoff (max 3 attempts)
 * - 10s timeout handling
 * - Multiple provider fallbacks
 */

// Configuration
const CONFIG = {
  dogApi: {
    baseUrl: import.meta.env.VITE_DOG_API_URL || 'https://dog.ceo/api',
    randomEndpoint: '/breeds/image/random',
    breedEndpoint: (breed) => `/breed/${breed}/images/random`,
  },
  catApi: {
    baseUrl: import.meta.env.VITE_CAT_API_URL || 'https://api.thecatapi.com/v1',
    randomEndpoint: '/images/search',
  },
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000, // 1 minute
  },
  retryDelays: [1000, 2000, 4000], // Exponential backoff delays
};

// Fallback image paths
const FALLBACK_IMAGES = {
  dog: '/fallback-dog.svg',
  cat: '/fallback-cat.svg',
};

// Rate limiter state
const rateLimiter = {
  requests: [],
  isLimited: false,
};

/**
 * Check if we're rate limited
 * @returns {boolean} True if rate limited
 */
function isRateLimited() {
  const now = Date.now();
  const windowStart = now - CONFIG.rateLimit.windowMs;

  // Remove old requests outside the window
  rateLimiter.requests = rateLimiter.requests.filter(time => time > windowStart);

  // Check if we're over the limit
  return rateLimiter.requests.length >= CONFIG.rateLimit.maxRequests;
}

/**
 * Record a request for rate limiting
 */
function recordRequest() {
  rateLimiter.requests.push(Date.now());
}

/**
 * Get time until rate limit resets
 * @returns {number} Milliseconds until reset
 */
function getResetTime() {
  if (rateLimiter.requests.length === 0) return 0;

  const oldestRequest = Math.min(...rateLimiter.requests);
  const resetTime = oldestRequest + CONFIG.rateLimit.windowMs - Date.now();

  return Math.max(0, resetTime);
}

/**
 * Sleep for a given duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch with retry logic
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}) {
  let lastError;

  for (let attempt = 0; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);

      // Don't retry on abort errors
      if (error.name === 'AbortError' || error.message.includes('timed out')) {
        if (attempt < CONFIG.maxRetries) {
          const delay = CONFIG.retryDelays[attempt] || CONFIG.retryDelays[CONFIG.retryDelays.length - 1];
          await sleep(delay);
        }
        continue;
      }

      // Retry after delay for other errors
      if (attempt < CONFIG.maxRetries) {
        const delay = CONFIG.retryDelays[attempt] || CONFIG.retryDelays[CONFIG.retryDelays.length - 1];
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Fetch a random dog image
 * @param {string} breed - Optional specific breed
 * @returns {Promise<{ url: string, breed: string | null }>}
 */
async function fetchDogImage(breed = null) {
  if (isRateLimited()) {
    throw new Error(`Rate limited. Try again in ${Math.ceil(getResetTime() / 1000)}s`);
  }

  const endpoint = breed
    ? `${CONFIG.dogApi.baseUrl}${CONFIG.dogApi.breedEndpoint(breed)}`
    : `${CONFIG.dogApi.baseUrl}${CONFIG.dogApi.randomEndpoint}`;

  recordRequest();

  const response = await fetchWithRetry(endpoint, {
    headers: { Accept: 'application/json' },
  });

  const data = await response.json();

  if (!data.message) {
    throw new Error('Invalid response: no image URL');
  }

  // Extract breed from URL
  let extractedBreed = null;
  if (data.message.includes('/breeds/')) {
    const breedMatch = data.message.match(/\/breeds\/([^/]+)\//);
    if (breedMatch) {
      const breedSlug = breedMatch[1];
      const breedParts = breedSlug.split('-');
      extractedBreed = breedParts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
  }

  return {
    url: data.message,
    breed: extractedBreed || breed,
    provider: 'dog.ceo',
  };
}

/**
 * Fetch a random cat image
 * @returns {Promise<{ url: string, breed: string | null }>}
 */
async function fetchCatImage() {
  if (isRateLimited()) {
    throw new Error(`Rate limited. Try again in ${Math.ceil(getResetTime() / 1000)}s`);
  }

  const endpoint = `${CONFIG.catApi.baseUrl}${CONFIG.catApi.randomEndpoint}`;

  recordRequest();

  const response = await fetchWithRetry(endpoint, {
    headers: { Accept: 'application/json' },
  });

  const data = await response.json();

  if (!Array.isArray(data) || !data[0]?.url) {
    throw new Error('Invalid response: no image URL');
  }

  const catData = data[0];

  return {
    url: catData.url,
    breed: catData.breeds?.[0]?.name || null,
    provider: 'thecatapi.com',
  };
}

/**
 * Fetch a pet image with fallback support
 * @param {string} type - 'dog' or 'cat'
 * @param {Object} options - Options
 * @param {string} options.breed - Specific breed (dogs only)
 * @param {boolean} options.useFallback - Use fallback image on error (default: true)
 * @returns {Promise<{ url: string, breed: string | null, type: string, isFallback: boolean }>}
 */
export async function fetchPetImage(type = 'dog', options = {}) {
  const { breed = null, useFallback = true } = options;

  try {
    const result = type === 'cat'
      ? await fetchCatImage()
      : await fetchDogImage(breed);

    return {
      ...result,
      type,
      isFallback: false,
    };
  } catch (error) {
    console.error(`Error fetching ${type} image:`, error);

    if (useFallback) {
      return {
        url: FALLBACK_IMAGES[type] || FALLBACK_IMAGES.dog,
        breed: null,
        type,
        isFallback: true,
        error: error.message,
      };
    }

    throw error;
  }
}

/**
 * Prefetch multiple pet images
 * @param {Array<{ type: string, breed?: string }>} requests - Array of image requests
 * @returns {Promise<Array<{ url: string, breed: string | null, type: string }>>}
 */
export async function prefetchPetImages(requests) {
  const results = await Promise.allSettled(
    requests.map(req => fetchPetImage(req.type, { breed: req.breed }))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // Return fallback for failed requests
    return {
      url: FALLBACK_IMAGES[requests[index].type] || FALLBACK_IMAGES.dog,
      breed: null,
      type: requests[index].type,
      isFallback: true,
      error: result.reason?.message,
    };
  });
}

/**
 * Get rate limit status
 * @returns {{ isLimited: boolean, remaining: number, resetTime: number }}
 */
export function getRateLimitStatus() {
  const now = Date.now();
  const windowStart = now - CONFIG.rateLimit.windowMs;

  // Clean up old requests
  rateLimiter.requests = rateLimiter.requests.filter(time => time > windowStart);

  return {
    isLimited: isRateLimited(),
    remaining: Math.max(0, CONFIG.rateLimit.maxRequests - rateLimiter.requests.length),
    resetTime: getResetTime(),
    limit: CONFIG.rateLimit.maxRequests,
  };
}

/**
 * Reset rate limiter (for testing)
 */
export function resetRateLimiter() {
  rateLimiter.requests = [];
}

// Export config for testing
export const imageApiConfig = CONFIG;
