/**
 * Firebase Configuration
 *
 * This file initializes Firebase services for DogTale Daily:
 * - Authentication (Email/Password + Google OAuth)
 * - Firestore Database (user data, journals, favorites, pets)
 * - Cloud Storage (user-uploaded pet photos)
 *
 * Environment variables are used for security (never commit API keys to git)
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration
// These values should be set in environment variables (.env file)
// Get these from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Development fallback configuration
// This allows the app to run locally without Firebase during development
const isDevelopment = import.meta.env.MODE === 'development';
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Validate configuration
const isConfigured = Object.values(firebaseConfig).every(value => value !== undefined);

let app;
let auth;
let db;
let storage;
let functions;
let googleProvider;

if (isConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);

    // Initialize Google Auth Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');

    // Enable offline persistence for Firestore
    // This allows the app to work offline and sync when back online
    if (!useEmulator) {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence not available in this browser');
        }
      });
    }

    // Connect to emulators if in development mode
    if (useEmulator && isDevelopment) {
      const { connectAuthEmulator } = await import('firebase/auth');
      const { connectFirestoreEmulator } = await import('firebase/firestore');
      const { connectStorageEmulator } = await import('firebase/storage');
      const { connectFunctionsEmulator } = await import('firebase/functions');

      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      connectFunctionsEmulator(functions, 'localhost', 5001);

      console.log('🔧 Connected to Firebase Emulators');
    }

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else {
  console.warn('⚠️ Firebase not configured - running in offline mode');
  console.warn('Set VITE_FIREBASE_* environment variables to enable cloud features');
}

// Export Firebase services
export {
  app,
  auth,
  db,
  storage,
  functions,
  googleProvider,
  isConfigured as isFirebaseConfigured
};

// Export utility function to check if Firebase is available
export function isFirebaseAvailable() {
  return isConfigured && app !== undefined;
}
