/**
 * Image API Service
 *
 * Centralized management for dog.ceo and thecatapi.com APIs with:
 * - Rate limiting (50 req/min)
 * - Retry logic with exponential backoff (max 3 attempts)
 * - 10s timeout handling
 * - Fallback support
 */

// Configuration
const CONFIG = {
  dogApi: {
    baseUrl: 'https://dog.ceo/api',
    randomEndpoint: '/breeds/image/random',
    breedEndpoint: (breed: string) => `/breed/${breed}/images/random`,
  },
  catApi: {
    baseUrl: 'https://api.thecatapi.com/v1',
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

// Rate limiter state
const rateLimiter = {
  requests: [] as number[],
};

/**
 * Check if we're rate limited
 */
function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - CONFIG.rateLimit.windowMs;

  // Remove old requests outside the window
  rateLimiter.requests = rateLimiter.requests.filter(
    (time) => time > windowStart
  );

  // Check if we're over the limit
  return rateLimiter.requests.length >= CONFIG.rateLimit.maxRequests;
}

/**
 * Record a request for rate limiting
 */
function recordRequest(): void {
  rateLimiter.requests.push(Date.now());
}

/**
 * Get time until rate limit resets
 */
function getResetTime(): number {
  if (rateLimiter.requests.length === 0) return 0;

  const oldestRequest = Math.min(...rateLimiter.requests);
  const resetTime = oldestRequest + CONFIG.rateLimit.windowMs - Date.now();

  return Math.max(0, resetTime);
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = CONFIG.timeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return response;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Fetch attempt ${attempt + 1} failed:`, lastError.message);

      // Retry after delay for errors
      if (attempt < CONFIG.maxRetries) {
        const delay =
          CONFIG.retryDelays[attempt] ||
          CONFIG.retryDelays[CONFIG.retryDelays.length - 1];
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

export interface PetImageResult {
  url: string;
  breed: string | null;
  type: 'dog' | 'cat';
  provider: string;
  isFallback: boolean;
  error?: string;
}

/**
 * Fetch a random dog image
 */
async function fetchDogImage(
  breed: string | null = null
): Promise<PetImageResult> {
  if (isRateLimited()) {
    throw new Error(
      `Rate limited. Try again in ${Math.ceil(getResetTime() / 1000)}s`
    );
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
  let extractedBreed: string | null = null;
  if (data.message.includes('/breeds/')) {
    const breedMatch = data.message.match(/\/breeds\/([^/]+)\//);
    if (breedMatch) {
      const breedSlug = breedMatch[1];
      const breedParts = breedSlug.split('-');
      extractedBreed = breedParts
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
  }

  return {
    url: data.message,
    breed: extractedBreed || breed,
    type: 'dog',
    provider: 'dog.ceo',
    isFallback: false,
  };
}

/**
 * Fetch a random cat image
 */
async function fetchCatImage(): Promise<PetImageResult> {
  if (isRateLimited()) {
    throw new Error(
      `Rate limited. Try again in ${Math.ceil(getResetTime() / 1000)}s`
    );
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
    type: 'cat',
    provider: 'thecatapi.com',
    isFallback: false,
  };
}

export interface FetchPetImageOptions {
  breed?: string | null;
  useFallback?: boolean;
}

/**
 * Fetch a pet image with fallback support
 */
export async function fetchPetImage(
  type: 'dog' | 'cat' = 'dog',
  options: FetchPetImageOptions = {}
): Promise<PetImageResult> {
  const { breed = null, useFallback = true } = options;

  try {
    const result =
      type === 'cat' ? await fetchCatImage() : await fetchDogImage(breed);

    return result;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching ${type} image:`, errorMessage);

    if (useFallback) {
      // Return a placeholder result when fallback is enabled
      return {
        url: '', // Will need to use a bundled asset or placeholder
        breed: null,
        type,
        provider: 'fallback',
        isFallback: true,
        error: errorMessage,
      };
    }

    throw error;
  }
}

/**
 * Get rate limit status
 */
export interface RateLimitStatus {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export function getRateLimitStatus(): RateLimitStatus {
  const now = Date.now();
  const windowStart = now - CONFIG.rateLimit.windowMs;

  // Clean up old requests
  rateLimiter.requests = rateLimiter.requests.filter(
    (time) => time > windowStart
  );

  return {
    isLimited: isRateLimited(),
    remaining: Math.max(
      0,
      CONFIG.rateLimit.maxRequests - rateLimiter.requests.length
    ),
    resetTime: getResetTime(),
    limit: CONFIG.rateLimit.maxRequests,
  };
}

/**
 * Reset rate limiter (for testing)
 */
export function resetRateLimiter(): void {
  rateLimiter.requests = [];
}
