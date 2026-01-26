import React from 'react';
import { vi } from 'vitest';

// Mock AuthContext value
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: null,
  migrationStatus: null,
  isOnlineMode: true,
  isAuthenticated: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updateProfile: vi.fn(),
  fetchProfile: vi.fn(),
  clearError: vi.fn(),
  ...overrides,
});

// Mock authenticated user
export const mockAuthenticatedUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    username: 'testuser',
    full_name: 'Test User',
  },
};

export const mockUserProfile = {
  id: 'test-user-123',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  xp: 100,
  level: 5,
  streak_days: 7,
  subscription_tier: 'free',
  subscription_expires_at: null,
};

// Mock SubscriptionContext value
export const createMockSubscriptionContext = (overrides = {}) => ({
  currentTier: 'free',
  features: {
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
  loading: false,
  checkoutLoading: false,
  isSubscriptionActive: true,
  expiresAt: null,
  hasFeature: vi.fn((feature) => overrides.features?.[feature] ?? false),
  isWithinLimit: vi.fn(() => true),
  getRemainingQuota: vi.fn(() => 5),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  cancelSubscription: vi.fn(),
  refreshSubscription: vi.fn(),
  needsUpgrade: vi.fn(() => false),
  ...overrides,
});

// Create contexts with mock values
export const AuthContext = React.createContext(null);
export const SubscriptionContext = React.createContext(null);

// Test wrapper component that provides mock contexts
export function TestWrapper({
  children,
  authContext = {},
  subscriptionContext = {},
}) {
  const authValue = createMockAuthContext(authContext);
  const subscriptionValue = createMockSubscriptionContext(subscriptionContext);

  return (
    <AuthContext.Provider value={authValue}>
      <SubscriptionContext.Provider value={subscriptionValue}>
        {children}
      </SubscriptionContext.Provider>
    </AuthContext.Provider>
  );
}

// Hook to use mock auth context
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    return createMockAuthContext();
  }
  return context;
}

// Hook to use mock subscription context
export function useSubscription() {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    return createMockSubscriptionContext();
  }
  return context;
}
