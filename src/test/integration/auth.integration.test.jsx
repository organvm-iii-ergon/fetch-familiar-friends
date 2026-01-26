/**
 * Auth Flow Integration Tests
 * Tests for user signup, login, logout, and protected route access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMockSupabaseClient,
  createMockUser,
  createMockProfile,
  resetIdCounter,
} from './setup';

// Mock the supabase module
let mockSupabase;

vi.mock('../../config/supabase', () => ({
  get supabase() {
    return mockSupabase;
  },
  isOnlineMode: true,
}));

// Import after mocking
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from '../../contexts/SubscriptionContext';

// Test component that displays auth state
const AuthTestComponent = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user-email">{auth.user?.email || 'none'}</div>
      <div data-testid="user-id">{auth.user?.id || 'none'}</div>
      <div data-testid="profile-username">{auth.profile?.username || 'none'}</div>
      <div data-testid="error">{auth.error || 'none'}</div>
      <div data-testid="online-mode">{auth.isOnlineMode ? 'online' : 'offline'}</div>

      <button
        data-testid="signup-btn"
        onClick={() => auth.signUp({
          email: 'newuser@example.com',
          password: 'password123', // allow-secret - test mock password // allow-secret - test mock password
          username: 'newuser',
          displayName: 'New User',
        })}
      >
        Sign Up
      </button>

      <button
        data-testid="signin-btn"
        onClick={() => auth.signIn({
          email: 'existing@example.com',
          password: 'password123', // allow-secret - test mock password // allow-secret - test mock password
        })}
      >
        Sign In
      </button>

      <button
        data-testid="signout-btn"
        onClick={() => auth.signOut()}
      >
        Sign Out
      </button>

      <button
        data-testid="oauth-google-btn"
        onClick={() => auth.signInWithOAuth('google')}
      >
        Sign In with Google
      </button>

      <button
        data-testid="reset-password-btn"
        onClick={() => auth.resetPassword('user@example.com')}
      >
        Reset Password
      </button>

      <button
        data-testid="update-profile-btn"
        onClick={() => auth.updateProfile({ display_name: 'Updated Name' })}
      >
        Update Profile
      </button>

      <button
        data-testid="clear-error-btn"
        onClick={() => auth.clearError()}
      >
        Clear Error
      </button>
    </div>
  );
};

// Test component for subscription integration
const SubscriptionTestComponent = () => {
  const subscription = useSubscription();
  const auth = useAuth();

  return (
    <div>
      <div data-testid="current-tier">{subscription.currentTier}</div>
      <div data-testid="has-social">{subscription.hasFeature('social') ? 'yes' : 'no'}</div>
      <div data-testid="ai-limit">{subscription.features.aiMessagesPerDay}</div>
      <div data-testid="checkout-loading">{subscription.checkoutLoading ? 'yes' : 'no'}</div>

      <button
        data-testid="upgrade-premium-btn"
        onClick={() => subscription.createCheckoutSession('premium')}
      >
        Upgrade to Premium
      </button>

      <button
        data-testid="manage-subscription-btn"
        onClick={() => subscription.createPortalSession()}
      >
        Manage Subscription
      </button>
    </div>
  );
};

// Wrapper for testing
const TestWrapper = ({ children }) => (
  <AuthProvider>
    <SubscriptionProvider>
      {children}
    </SubscriptionProvider>
  </AuthProvider>
);

describe('Auth Flow Integration Tests', () => {
  beforeEach(() => {
    resetIdCounter();
    mockSupabase = createMockSupabaseClient();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User Signup Flow', () => {
    it('should successfully sign up a new user', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Initially not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });

      // Click signup
      await user.click(screen.getByTestId('signup-btn'));

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      // Verify user data
      expect(screen.getByTestId('user-email')).toHaveTextContent('newuser@example.com');

      // Verify Supabase signUp was called with correct params
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123', // allow-secret - test mock password
        options: {
          data: {
            username: 'newuser',
            full_name: 'New User',
          },
        },
      });
    });

    it('should create a profile after signup', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('signup-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      // Profile should be fetched/created
      await waitFor(() => {
        expect(mockSupabase._data.profiles.length).toBeGreaterThan(0);
      });
    });

    it('should handle signup errors gracefully', async () => {
      // Override signUp to return an error
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email already registered' },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('signup-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already registered');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });
  });

  describe('User Login Flow', () => {
    it('should successfully log in an existing user', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Initially not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });

      // Click sign in
      await user.click(screen.getByTestId('signin-btn'));

      // Wait for authentication
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('existing@example.com');
    });

    it('should restore session from storage on mount', async () => {
      const existingUser = createMockUser({ email: 'stored@example.com' });
      const existingSession = { user: existingUser, access_token: 'stored-token' };
      const profile = createMockProfile(existingUser.id);

      // Pre-populate data
      mockSupabase._data.profiles.push(profile);

      // Mock getSession to return existing session
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: existingSession },
        error: null,
      });

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Should automatically be authenticated from stored session
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com');
    });

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('signin-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid login credentials');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully log out the user', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // First, sign in
      await user.click(screen.getByTestId('signin-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      // Now sign out
      await user.click(screen.getByTestId('signout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('none');
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should clear profile data on logout', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Sign in
      await user.click(screen.getByTestId('signin-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      // Sign out
      await user.click(screen.getByTestId('signout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('profile-username')).toHaveTextContent('none');
      });
    });
  });

  describe('Protected Route Access', () => {
    it('should deny access to premium features for free users', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
          <SubscriptionTestComponent />
        </TestWrapper>
      );

      // Sign in (default is free tier)
      await user.click(screen.getByTestId('signin-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      // Check feature gates
      expect(screen.getByTestId('current-tier')).toHaveTextContent('free');
      expect(screen.getByTestId('has-social')).toHaveTextContent('no');
      expect(screen.getByTestId('ai-limit')).toHaveTextContent('5');
    });

    it('should allow access to premium features for premium users', async () => {
      const premiumUser = createMockUser({ email: 'premium@example.com' });
      const premiumProfile = createMockProfile(premiumUser.id, {
        subscription_tier: 'premium',
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockSupabase._data.profiles.push(premiumProfile);

      // Mock session with premium user
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: premiumUser, access_token: 'token' } },
        error: null,
      });

      render(
        <TestWrapper>
          <AuthTestComponent />
          <SubscriptionTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-tier')).toHaveTextContent('premium');
      });

      expect(screen.getByTestId('has-social')).toHaveTextContent('yes');
      expect(screen.getByTestId('ai-limit')).toHaveTextContent('50');
    });
  });

  describe('OAuth Flow (Mock)', () => {
    it('should initiate OAuth flow for Google', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('oauth-google-btn'));

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: expect.objectContaining({
            redirectTo: expect.stringContaining('/auth/callback'),
          }),
        });
      });
    });

    it('should handle OAuth errors', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
        data: { url: null },
        error: { message: 'OAuth provider unavailable' },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('oauth-google-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('OAuth provider unavailable');
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate password reset', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('reset-password-btn'));

      await waitFor(() => {
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'user@example.com',
          expect.objectContaining({
            redirectTo: expect.stringContaining('/auth/reset-password'),
          })
        );
      });
    });
  });

  describe('Profile Management', () => {
    it('should update user profile when authenticated', async () => {
      const user = userEvent.setup();

      const existingUser = createMockUser();
      const profile = createMockProfile(existingUser.id);
      mockSupabase._data.profiles.push(profile);

      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: existingUser, access_token: 'token' } },
        error: null,
      });

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      await user.click(screen.getByTestId('update-profile-btn'));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });
    });

    it('should not allow profile update when not authenticated', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });

      await user.click(screen.getByTestId('update-profile-btn'));

      // Should return error without calling supabase
      // The updateProfile function should fail gracefully
    });
  });

  describe('Error Handling', () => {
    it('should clear errors when requested', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Test error' },
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Trigger an error
      await user.click(screen.getByTestId('signin-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });

      // Clear the error
      await user.click(screen.getByTestId('clear-error-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });
  });
});
