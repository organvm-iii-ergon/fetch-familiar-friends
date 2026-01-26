/**
 * Feature gates utility functions
 * Use these to check feature access throughout the app
 */

import { FEATURE_GATES } from '../contexts/SubscriptionContext';

/**
 * Check if a tier has access to a feature
 * @param {string} tier - 'free', 'premium', or 'luxury'
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean}
 */
export function tierHasFeature(tier, featureName) {
  const features = FEATURE_GATES[tier] || FEATURE_GATES.free;
  return features[featureName] ?? false;
}

/**
 * Get the limit for a feature at a given tier
 * @param {string} tier - 'free', 'premium', or 'luxury'
 * @param {string} featureName - Name of the feature
 * @returns {number|boolean|null}
 */
export function getTierLimit(tier, featureName) {
  const features = FEATURE_GATES[tier] || FEATURE_GATES.free;
  return features[featureName] ?? null;
}

/**
 * Get the minimum tier required for a feature
 * @param {string} featureName - Name of the feature
 * @returns {string} 'free', 'premium', or 'luxury'
 */
export function getMinimumTierForFeature(featureName) {
  if (tierHasFeature('free', featureName)) return 'free';
  if (tierHasFeature('premium', featureName)) return 'premium';
  if (tierHasFeature('luxury', featureName)) return 'luxury';
  return null;
}

/**
 * Get all features available at a tier
 * @param {string} tier - 'free', 'premium', or 'luxury'
 * @returns {Object}
 */
export function getTierFeatures(tier) {
  return FEATURE_GATES[tier] || FEATURE_GATES.free;
}

/**
 * Compare two tiers
 * @param {string} tier1
 * @param {string} tier2
 * @returns {number} -1 if tier1 < tier2, 0 if equal, 1 if tier1 > tier2
 */
export function compareTiers(tier1, tier2) {
  const tierOrder = { free: 0, premium: 1, luxury: 2 };
  const t1 = tierOrder[tier1] ?? 0;
  const t2 = tierOrder[tier2] ?? 0;
  return t1 - t2;
}

/**
 * Check if user should see upgrade prompt for a feature
 * @param {string} currentTier - User's current tier
 * @param {string} featureName - Feature they're trying to access
 * @returns {Object} { shouldPrompt: boolean, upgradeTo: string|null }
 */
export function shouldPromptUpgrade(currentTier, featureName) {
  if (tierHasFeature(currentTier, featureName)) {
    return { shouldPrompt: false, upgradeTo: null };
  }

  const minimumTier = getMinimumTierForFeature(featureName);
  if (!minimumTier) {
    return { shouldPrompt: false, upgradeTo: null };
  }

  return { shouldPrompt: true, upgradeTo: minimumTier };
}

/**
 * Get upgrade message for a feature
 * @param {string} featureName - Name of the feature
 * @param {string} requiredTier - Tier required for the feature
 * @returns {string}
 */
export function getUpgradeMessage(featureName, requiredTier) {
  const messages = {
    social: 'Connect with other pet parents and share your journey',
    healthTracking: 'Keep track of vaccinations, vet visits, and more',
    storyGeneration: 'Create personalized AI stories about your pet',
    photoUpload: 'Upload and save photos of your beloved pets',
    leaderboards: 'Compete with friends and see how you rank',
    aiMessagesPerDay: 'Chat more with our AI pet assistant',
    maxFavorites: 'Save more of your favorite daily images',
    maxPets: 'Add more pets to your profile',
  };

  const featureMessage = messages[featureName] || `Unlock ${featureName}`;
  const tierLabel = requiredTier === 'premium' ? 'Premium' : 'Luxury';

  return `${featureMessage}. Upgrade to ${tierLabel} to unlock this feature!`;
}

/**
 * Format feature limit for display
 * @param {string} featureName
 * @param {number|boolean} limit
 * @returns {string}
 */
export function formatFeatureLimit(featureName, limit) {
  if (limit === Infinity) return 'Unlimited';
  if (limit === true) return 'Included';
  if (limit === false) return 'Not included';
  if (typeof limit === 'number') {
    if (featureName.includes('PerDay')) return `${limit}/day`;
    return limit.toString();
  }
  return String(limit);
}

// Pre-defined feature gate checks for common use cases
export const FeatureChecks = {
  canUseSocial: (tier) => tierHasFeature(tier, 'social'),
  canUseHealthTracking: (tier) => tierHasFeature(tier, 'healthTracking'),
  canUploadPhotos: (tier) => tierHasFeature(tier, 'photoUpload'),
  canGenerateStories: (tier) => tierHasFeature(tier, 'storyGeneration'),
  canViewLeaderboards: (tier) => tierHasFeature(tier, 'leaderboards'),
  isAdFree: (tier) => tierHasFeature(tier, 'adFree'),

  getMaxFavorites: (tier) => getTierLimit(tier, 'maxFavorites'),
  getMaxPets: (tier) => getTierLimit(tier, 'maxPets'),
  getAiMessagesPerDay: (tier) => getTierLimit(tier, 'aiMessagesPerDay'),
};
