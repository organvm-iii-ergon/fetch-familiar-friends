import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

const SubscriptionContext = createContext(null);

// Feature gates configuration
export const FEATURE_GATES = {
  free: {
    maxFavorites: 10,
    maxPets: 1,
    aiMessagesPerDay: 5,
    social: false,
    healthTracking: false,
    virtualPet: true,
    quests: true,
    leaderboards: false,
    storyGeneration: false,
    photoUpload: false,
    exportData: false,
    adFree: false,
  },
  premium: {
    maxFavorites: 100,
    maxPets: 5,
    aiMessagesPerDay: 50,
    social: true,
    healthTracking: true,
    virtualPet: true,
    quests: true,
    leaderboards: true,
    storyGeneration: true,
    photoUpload: true,
    exportData: true,
    adFree: true,
  },
  luxury: {
    maxFavorites: Infinity,
    maxPets: Infinity,
    aiMessagesPerDay: 500,
    social: true,
    healthTracking: true,
    virtualPet: true,
    quests: true,
    leaderboards: true,
    storyGeneration: true,
    photoUpload: true,
    exportData: true,
    adFree: true,
    physicalProducts: true,
    prioritySupport: true,
    earlyAccess: true,
  },
};

// Pricing information
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    description: 'Perfect for getting started',
    features: [
      'Daily dog & cat images',
      'Basic journal entries',
      'Up to 10 favorites',
      '5 AI messages per day',
      'Virtual pet companion',
      'Daily quests',
    ],
  },
  premium: {
    name: 'Premium',
    price: 4.99,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
    description: 'For dedicated pet parents',
    features: [
      'Everything in Free, plus:',
      'Unlimited favorites',
      '50 AI messages per day',
      'Social features (friends, activity feed)',
      'Health tracking & reminders',
      'AI story generation',
      'Photo uploads',
      'Leaderboards',
      'Ad-free experience',
    ],
  },
  luxury: {
    name: 'Luxury',
    price: 14.99,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_LUXURY_PRICE_ID,
    description: 'The ultimate pet experience',
    features: [
      'Everything in Premium, plus:',
      '500 AI messages per day',
      'Unlimited pets',
      'Physical welcome kit',
      'Priority support',
      'Early access to new features',
      'Exclusive seasonal content',
    ],
  },
};

export function SubscriptionProvider({ children }) {
  const { profile, isAuthenticated, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Get current subscription tier
  const currentTier = profile?.subscription_tier || 'free';
  const features = FEATURE_GATES[currentTier] || FEATURE_GATES.free;

  // Check if subscription is active
  const isSubscriptionActive = useCallback(() => {
    if (currentTier === 'free') return true;

    const expiresAt = profile?.subscription_expires_at;
    if (!expiresAt) return false;

    return new Date(expiresAt) > new Date();
  }, [currentTier, profile?.subscription_expires_at]);

  // Check if user has access to a feature
  const hasFeature = useCallback((featureName) => {
    return features[featureName] ?? false;
  }, [features]);

  // Check if user is within limit for a feature
  const isWithinLimit = useCallback((featureName, currentValue) => {
    const limit = features[featureName];
    if (limit === Infinity || limit === true) return true;
    if (typeof limit !== 'number') return true;
    return currentValue < limit;
  }, [features]);

  // Get remaining quota for a feature
  const getRemainingQuota = useCallback((featureName, currentValue) => {
    const limit = features[featureName];
    if (limit === Infinity) return Infinity;
    if (typeof limit !== 'number') return null;
    return Math.max(0, limit - currentValue);
  }, [features]);

  // Create Stripe checkout session
  const createCheckoutSession = useCallback(async (tier) => {
    if (!isOnlineMode || !isAuthenticated) {
      return { error: { message: 'Must be signed in to subscribe' } };
    }

    const tierInfo = SUBSCRIPTION_TIERS[tier];
    if (!tierInfo || tier === 'free') {
      return { error: { message: 'Invalid subscription tier' } };
    }

    setCheckoutLoading(true);
    try {
      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: tierInfo.stripePriceId,
          tier,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      }

      return { data, error: null };
    } catch (err) {
      console.error('Checkout error:', err);
      return { data: null, error: err };
    } finally {
      setCheckoutLoading(false);
    }
  }, [isAuthenticated]);

  // Create Stripe customer portal session (for managing subscription)
  const createPortalSession = useCallback(async () => {
    if (!isOnlineMode || !isAuthenticated) {
      return { error: { message: 'Must be signed in' } };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: window.location.href,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }

      return { data, error: null };
    } catch (err) {
      console.error('Portal error:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cancel subscription (downgrades to free at end of period)
  const cancelSubscription = useCallback(async () => {
    // This would be handled through the Stripe customer portal
    return createPortalSession();
  }, [createPortalSession]);

  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    if (!isOnlineMode || !isAuthenticated || !profile?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at, stripe_customer_id')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      // Update profile in auth context
      if (data) {
        await updateProfile({
          subscription_tier: data.subscription_tier,
          subscription_expires_at: data.subscription_expires_at,
          stripe_customer_id: data.stripe_customer_id,
        });
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, profile?.id, updateProfile]);

  // Listen for subscription changes via realtime
  useEffect(() => {
    if (!isOnlineMode || !isAuthenticated || !profile?.id) return;

    const subscription = supabase
      .channel(`profile-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.new.subscription_tier !== currentTier) {
            refreshSubscription();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated, profile?.id, currentTier, refreshSubscription]);

  const value = {
    // Current state
    currentTier,
    features,
    loading,
    checkoutLoading,
    isSubscriptionActive: isSubscriptionActive(),
    expiresAt: profile?.subscription_expires_at,

    // Tier info
    SUBSCRIPTION_TIERS,
    FEATURE_GATES,

    // Methods
    hasFeature,
    isWithinLimit,
    getRemainingQuota,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    refreshSubscription,

    // Helper to check if upgrade needed
    needsUpgrade: (featureName) => !hasFeature(featureName) || currentTier === 'free',
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

SubscriptionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
