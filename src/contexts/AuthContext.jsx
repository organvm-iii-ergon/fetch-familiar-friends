import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { supabase, isOnlineMode } from '../config/supabase';
import { migrateLocalDataToSupabase, hasLocalData } from '../utils/dataMigration';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId) => {
    if (!isOnlineMode || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!isOnlineMode || !user) {
      return { error: { message: 'Not authenticated or offline' } };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { data: null, error: err };
    }
  }, [user]);

  // Sign up with email
  const signUp = useCallback(async ({ email, password, username, displayName }) => {
    if (!isOnlineMode) {
      return { error: { message: 'Running in offline mode. Configure Supabase to enable authentication.' } };
    }

    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: displayName,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  }, []);

  // Sign in with email
  const signIn = useCallback(async ({ email, password }) => {
    if (!isOnlineMode) {
      return { error: { message: 'Running in offline mode. Configure Supabase to enable authentication.' } };
    }

    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  }, []);

  // Sign in with OAuth (Google, Apple)
  const signInWithOAuth = useCallback(async (provider) => {
    if (!isOnlineMode) {
      return { error: { message: 'Running in offline mode. Configure Supabase to enable OAuth.' } };
    }

    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      setSession(null);
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    if (!isOnlineMode) {
      return { error: { message: 'Running in offline mode.' } };
    }

    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  }, []);

  // Migrate local data on first login
  const handleDataMigration = useCallback(async (userId) => {
    if (!isOnlineMode || !userId) return;

    // Check if user has local data to migrate
    if (!hasLocalData()) return;

    setMigrationStatus('migrating');
    try {
      await migrateLocalDataToSupabase(userId);
      setMigrationStatus('completed');
    } catch (err) {
      console.error('Migration error:', err);
      setMigrationStatus('error');
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isOnlineMode) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const userProfile = await fetchProfile(initialSession.user.id);
        setProfile(userProfile);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await fetchProfile(newSession.user.id);
          setProfile(userProfile);

          // Handle data migration on sign in/sign up
          if (event === 'SIGNED_IN') {
            await handleDataMigration(newSession.user.id);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, handleDataMigration]);

  const value = {
    // State
    user,
    profile,
    session,
    loading,
    error,
    migrationStatus,
    isOnlineMode,
    isAuthenticated: !!user,

    // Actions
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updateProfile,
    fetchProfile,

    // Clear error
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
