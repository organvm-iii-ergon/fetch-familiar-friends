import { useAuth } from '../contexts/AuthContext';

// Re-export the useAuth hook for convenience
// This allows importing from hooks/ directory as well as contexts/
export { useAuth };

// Additional auth-related hooks can be added here

/**
 * Hook to check if user has a specific subscription tier
 * @param {string} requiredTier - The minimum tier required ('free', 'premium', 'luxury')
 * @returns {boolean} Whether the user has access
 */
export function useSubscriptionAccess(requiredTier = 'free') {
  const { profile, isAuthenticated } = useAuth();

  const tierLevels = {
    free: 0,
    premium: 1,
    luxury: 2,
  };

  if (!isAuthenticated || !profile) {
    return requiredTier === 'free';
  }

  const userTierLevel = tierLevels[profile.subscription_tier] ?? 0;
  const requiredTierLevel = tierLevels[requiredTier] ?? 0;

  return userTierLevel >= requiredTierLevel;
}

/**
 * Hook to get user's current XP and level info
 * @returns {Object} XP info including current level, XP, and XP needed for next level
 */
export function useUserProgress() {
  const { profile } = useAuth();

  if (!profile) {
    return {
      level: 1,
      xp: 0,
      xpForNextLevel: 100,
      xpProgress: 0,
      totalXp: 0,
    };
  }

  const level = profile.level || 1;
  const xp = profile.xp || 0;
  const xpForNextLevel = level * 100;
  const xpProgress = (xp / xpForNextLevel) * 100;

  // Calculate total XP earned (sum of all previous levels + current XP)
  const totalXp = ((level - 1) * level * 50) + xp;

  return {
    level,
    xp,
    xpForNextLevel,
    xpProgress,
    totalXp,
    streakDays: profile.streak_days || 0,
  };
}

/**
 * Hook to check if user profile is complete
 * @returns {Object} Profile completion status and missing fields
 */
export function useProfileCompletion() {
  const { profile, isAuthenticated } = useAuth();

  if (!isAuthenticated || !profile) {
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: ['username', 'display_name', 'avatar_url', 'bio'],
    };
  }

  const requiredFields = ['username', 'display_name'];
  const optionalFields = ['avatar_url', 'bio', 'location_name'];

  const missingRequired = requiredFields.filter(field => !profile[field]);
  const missingOptional = optionalFields.filter(field => !profile[field]);

  const totalFields = requiredFields.length + optionalFields.length;
  const completedFields = totalFields - missingRequired.length - missingOptional.length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  return {
    isComplete: missingRequired.length === 0,
    completionPercentage,
    missingFields: [...missingRequired, ...missingOptional],
    missingRequired,
    missingOptional,
  };
}
