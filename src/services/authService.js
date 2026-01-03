/**
 * Authentication Service
 *
 * Handles all authentication operations for DogTale Daily:
 * - Email/Password signup and login
 * - Google OAuth login
 * - Password reset
 * - Email verification
 * - User session management
 *
 * This service wraps Firebase Auth to provide a clean API for components
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../config/firebase';

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @param {string} displayName - User's display name
 * @returns {Promise<Object>} User object
 */
export async function signUpWithEmail(email, password, displayName) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await createUserDocument(user, { displayName });

    // Send email verification
    await sendEmailVerification(user);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL
    };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} User object
 */
export async function signInWithEmail(email, password) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login timestamp
    await updateUserDocument(user.uid, {
      lastLogin: serverTimestamp()
    });

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL
    };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<Object>} User object
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Check if this is a new user
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isNewUser = !userDoc.exists();

    if (isNewUser) {
      // Create user document for new Google users
      await createUserDocument(user, {
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } else {
      // Update last login for existing users
      await updateUserDocument(user.uid, {
        lastLogin: serverTimestamp()
      });
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
      isNewUser
    };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  if (!isFirebaseConfigured) {
    return; // Nothing to sign out from if Firebase isn't configured
  }

  try {
    await signOut(auth);
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Send email verification to current user
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  try {
    await sendEmailVerification(user);
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates { displayName, photoURL }
 * @returns {Promise<void>}
 */
export async function updateUserProfile(updates) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Update Firebase Auth profile
    await updateProfile(user, updates);

    // Update Firestore user document
    await updateUserDocument(user.uid, {
      displayName: updates.displayName,
      photoURL: updates.photoURL,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Update user email
 * @param {string} newEmail - New email address
 * @param {string} currentPassword - Current password for reauthentication
 * @returns {Promise<void>}
 */
export async function updateUserEmail(newEmail, currentPassword) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Reauthenticate user before sensitive operation
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update email
    await updateEmail(user, newEmail);

    // Send verification email to new address
    await sendEmailVerification(user);

    // Update Firestore document
    await updateUserDocument(user.uid, {
      email: newEmail,
      emailVerified: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Update user password
 * @param {string} currentPassword - Current password for reauthentication
 * @param {string} newPassword - New password (min 6 characters)
 * @returns {Promise<void>}
 */
export async function updateUserPassword(currentPassword, newPassword) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set up environment variables.');
  }

  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Reauthenticate user before sensitive operation
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function receiving user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  if (!isFirebaseConfigured) {
    // Call callback immediately with null if Firebase not configured
    callback(null);
    return () => {}; // Return no-op unsubscribe function
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Get current authenticated user
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
  if (!isFirebaseConfigured) {
    return null;
  }

  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL
  };
}

// ============================================================================
// Helper Functions (Private)
// ============================================================================

/**
 * Create user document in Firestore
 * @private
 */
async function createUserDocument(user, additionalData = {}) {
  const userRef = doc(db, 'users', user.uid);

  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: additionalData.displayName || user.displayName || '',
    photoURL: additionalData.photoURL || user.photoURL || '',
    emailVerified: user.emailVerified,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    preferences: {
      theme: 'park',
      darkMode: false,
      notifications: true,
      autoSave: true
    },
    stats: {
      journalEntries: 0,
      favorites: 0,
      streak: 0,
      longestStreak: 0
    }
  };

  await setDoc(userRef, userData);
}

/**
 * Update user document in Firestore
 * @private
 */
async function updateUserDocument(uid, updates) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);
}

/**
 * Convert Firebase Auth errors to user-friendly messages
 * @private
 */
function handleAuthError(error) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password must be at least 6 characters long.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
    'auth/cancelled-popup-request': 'Sign-in popup was cancelled.',
    'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
    'auth/network-request-failed': 'Network error. Please check your connection.'
  };

  const message = errorMessages[error.code] || error.message || 'An unexpected error occurred.';

  return new Error(message);
}
