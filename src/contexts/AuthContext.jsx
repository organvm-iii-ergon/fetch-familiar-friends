/**
 * Authentication Context
 *
 * Provides authentication state and methods to the entire app.
 * This context wraps the app and makes user data available to all components.
 *
 * Usage:
 * ```jsx
 * import { useAuth } from '../contexts/AuthContext';
 *
 * function MyComponent() {
 *   const { user, loading, signIn, signOut } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please sign in</div>;
 *
 *   return <div>Welcome, {user.displayName}!</div>;
 * }
 * ```
 */

import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logout,
  resetPassword,
  sendVerificationEmail,
  updateUserProfile as updateProfile,
  onAuthChange,
  getCurrentUser
} from '../services/authService';
import {
  getUserProfile,
  migrateLocalStorageToFirestore
} from '../services/firestoreService';
import { isFirebaseConfigured } from '../config/firebase';

// Create context
const AuthContext = createContext(null);

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to authentication state changes
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // If Firebase is not configured, run in offline mode
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Fetch user profile from Firestore
        try {
          const profile = await getUserProfile(authUser.uid);
          setUserProfile(profile);

          // Check if this is a new user and migrate localStorage data
          if (profile && !profile.migrated) {
            try {
              const migrationResults = await migrateLocalStorageToFirestore(authUser.uid);
              console.log('Data migration completed:', migrationResults);

              // Mark as migrated
              await updateProfile(authUser.uid, { migrated: true });
            } catch (migrationError) {
              console.error('Data migration failed:', migrationError);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('Failed to load user profile');
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = async (email, password, displayName) => {
    setError(null);
    setLoading(true);

    try {
      const user = await signUpWithEmail(email, password, displayName);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const user = await signInWithEmail(email, password);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with Google
   */
  const signInGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    setError(null);

    try {
      await logout();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Send password reset email
   */
  const forgotPassword = async (email) => {
    setError(null);

    try {
      await resetPassword(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Send email verification
   */
  const verifyEmail = async () => {
    setError(null);

    try {
      await sendVerificationEmail();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Update user profile
   */
  const updateUserProfile = async (updates) => {
    setError(null);

    try {
      await updateProfile(updates);
      // Refresh user profile
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Refresh user profile from Firestore
   */
  const refreshUserProfile = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  const value = {
    // State
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user,
    isFirebaseAvailable: isFirebaseConfigured,

    // Methods
    signUp,
    signIn,
    signInGoogle,
    signOut,
    forgotPassword,
    verifyEmail,
    updateUserProfile,
    refreshUserProfile,

    // Utility
    getCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
