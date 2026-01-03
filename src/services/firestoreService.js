/**
 * Firestore Service
 *
 * Handles all database operations for DogTale Daily:
 * - User data (profile, preferences, stats)
 * - Journal entries (daily logs with moods and activities)
 * - Favorites (saved images)
 * - Pets (user's pets with status: active or memorial)
 * - Social features (posts, friends, feed)
 *
 * This service wraps Firestore operations and handles offline/online modes
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// ============================================================================
// User Profile Operations
// ============================================================================

/**
 * Get user profile data
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User profile or null
 */
export async function getUserProfile(uid) {
  if (!isFirebaseConfigured) {
    return null;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, updates) {
  if (!isFirebaseConfigured) {
    return;
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update user preferences
 * @param {string} uid - User ID
 * @param {Object} preferences - Preference updates
 * @returns {Promise<void>}
 */
export async function updateUserPreferences(uid, preferences) {
  if (!isFirebaseConfigured) {
    return;
  }

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      preferences: preferences,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

// ============================================================================
// Journal Operations
// ============================================================================

/**
 * Save journal entry
 * @param {string} uid - User ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} entry - Journal entry data
 * @returns {Promise<void>}
 */
export async function saveJournalEntry(uid, date, entry) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    const journals = JSON.parse(localStorage.getItem('dogtale-journal') || '{}');
    journals[date] = entry;
    localStorage.setItem('dogtale-journal', JSON.stringify(journals));
    return;
  }

  try {
    const journalRef = doc(db, 'users', uid, 'journal', date);
    await setDoc(journalRef, {
      ...entry,
      date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update user stats
    await updateJournalStats(uid);
  } catch (error) {
    console.error('Error saving journal entry:', error);
    throw error;
  }
}

/**
 * Get journal entry for a specific date
 * @param {string} uid - User ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Object|null>} Journal entry or null
 */
export async function getJournalEntry(uid, date) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    const journals = JSON.parse(localStorage.getItem('dogtale-journal') || '{}');
    return journals[date] || null;
  }

  try {
    const journalRef = doc(db, 'users', uid, 'journal', date);
    const journalSnap = await getDoc(journalRef);

    if (journalSnap.exists()) {
      return journalSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting journal entry:', error);
    throw error;
  }
}

/**
 * Get all journal entries for a user
 * @param {string} uid - User ID
 * @param {number} maxEntries - Maximum number of entries to fetch
 * @returns {Promise<Array>} Array of journal entries
 */
export async function getAllJournalEntries(uid, maxEntries = 100) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    const journals = JSON.parse(localStorage.getItem('dogtale-journal') || '{}');
    return Object.entries(journals).map(([date, entry]) => ({
      date,
      ...entry
    }));
  }

  try {
    const journalRef = collection(db, 'users', uid, 'journal');
    const q = query(journalRef, orderBy('date', 'desc'), limit(maxEntries));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting journal entries:', error);
    throw error;
  }
}

/**
 * Search journal entries
 * @param {string} uid - User ID
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching journal entries
 */
export async function searchJournalEntries(uid, searchTerm) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    const journals = JSON.parse(localStorage.getItem('dogtale-journal') || '{}');
    const results = [];

    Object.entries(journals).forEach(([date, entry]) => {
      const text = entry.entry?.toLowerCase() || '';
      if (text.includes(searchTerm.toLowerCase())) {
        results.push({ date, ...entry });
      }
    });

    return results;
  }

  try {
    // Note: Firestore doesn't support full-text search natively
    // For MVP, we fetch all entries and filter client-side
    // In production, use Algolia or Cloud Functions for better search
    const entries = await getAllJournalEntries(uid);

    return entries.filter(entry => {
      const text = entry.entry?.toLowerCase() || '';
      return text.includes(searchTerm.toLowerCase());
    });
  } catch (error) {
    console.error('Error searching journal entries:', error);
    throw error;
  }
}

/**
 * Delete journal entry
 * @param {string} uid - User ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<void>}
 */
export async function deleteJournalEntry(uid, date) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    const journals = JSON.parse(localStorage.getItem('dogtale-journal') || '{}');
    delete journals[date];
    localStorage.setItem('dogtale-journal', JSON.stringify(journals));
    return;
  }

  try {
    const journalRef = doc(db, 'users', uid, 'journal', date);
    await deleteDoc(journalRef);

    // Update user stats
    await updateJournalStats(uid);
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

// ============================================================================
// Favorites Operations
// ============================================================================

/**
 * Add image to favorites
 * @param {string} uid - User ID
 * @param {Object} favorite - Favorite data
 * @returns {Promise<string>} Favorite ID
 */
export async function addFavorite(uid, favorite) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    const favorites = JSON.parse(localStorage.getItem('dogtale-favorites') || '[]');
    const newFavorite = {
      id: Date.now().toString(),
      ...favorite,
      savedAt: new Date().toISOString()
    };
    favorites.push(newFavorite);
    localStorage.setItem('dogtale-favorites', JSON.stringify(favorites));
    return newFavorite.id;
  }

  try {
    const favoritesRef = collection(db, 'users', uid, 'favorites');
    const docRef = await addDoc(favoritesRef, {
      ...favorite,
      savedAt: serverTimestamp()
    });

    // Update user stats
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      'stats.favorites': increment(1)
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

/**
 * Get all favorites for a user
 * @param {string} uid - User ID
 * @returns {Promise<Array>} Array of favorites
 */
export async function getFavorites(uid) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('dogtale-favorites') || '[]');
  }

  try {
    const favoritesRef = collection(db, 'users', uid, 'favorites');
    const q = query(favoritesRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
  }
}

/**
 * Delete favorite
 * @param {string} uid - User ID
 * @param {string} favoriteId - Favorite ID
 * @returns {Promise<void>}
 */
export async function deleteFavorite(uid, favoriteId) {
  if (!isFirebaseConfigured) {
    // Fallback to localStorage
    const favorites = JSON.parse(localStorage.getItem('dogtale-favorites') || '[]');
    const filtered = favorites.filter(fav => fav.id !== favoriteId);
    localStorage.setItem('dogtale-favorites', JSON.stringify(filtered));
    return;
  }

  try {
    const favoriteRef = doc(db, 'users', uid, 'favorites', favoriteId);
    await deleteDoc(favoriteRef);

    // Update user stats
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      'stats.favorites': increment(-1)
    });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
}

// ============================================================================
// Pet Operations
// ============================================================================

/**
 * Add a pet
 * @param {string} uid - User ID
 * @param {Object} petData - Pet data
 * @returns {Promise<string>} Pet ID
 */
export async function addPet(uid, petData) {
  if (!isFirebaseConfigured) {
    return Date.now().toString();
  }

  try {
    const petsRef = collection(db, 'users', uid, 'pets');
    const docRef = await addDoc(petsRef, {
      ...petData,
      status: 'active',
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding pet:', error);
    throw error;
  }
}

/**
 * Get all pets for a user
 * @param {string} uid - User ID
 * @param {string} status - Filter by status ('active', 'memorial', or 'all')
 * @returns {Promise<Array>} Array of pets
 */
export async function getPets(uid, status = 'all') {
  if (!isFirebaseConfigured) {
    return [];
  }

  try {
    const petsRef = collection(db, 'users', uid, 'pets');
    let q;

    if (status === 'all') {
      q = query(petsRef, orderBy('createdAt', 'desc'));
    } else {
      q = query(petsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pets:', error);
    throw error;
  }
}

/**
 * Update pet
 * @param {string} uid - User ID
 * @param {string} petId - Pet ID
 * @param {Object} updates - Pet updates
 * @returns {Promise<void>}
 */
export async function updatePet(uid, petId, updates) {
  if (!isFirebaseConfigured) {
    return;
  }

  try {
    const petRef = doc(db, 'users', uid, 'pets', petId);
    await updateDoc(petRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    throw error;
  }
}

/**
 * Mark pet as memorial
 * @param {string} uid - User ID
 * @param {string} petId - Pet ID
 * @param {string} memorialDate - Date of passing (YYYY-MM-DD)
 * @returns {Promise<void>}
 */
export async function markPetAsMemorial(uid, petId, memorialDate) {
  if (!isFirebaseConfigured) {
    return;
  }

  try {
    const petRef = doc(db, 'users', uid, 'pets', petId);
    await updateDoc(petRef, {
      status: 'memorial',
      memorialDate,
      memorialActivatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking pet as memorial:', error);
    throw error;
  }
}

// ============================================================================
// Data Migration (localStorage to Firestore)
// ============================================================================

/**
 * Migrate user data from localStorage to Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Migration results
 */
export async function migrateLocalStorageToFirestore(uid) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured');
  }

  const results = {
    journalEntries: 0,
    favorites: 0,
    errors: []
  };

  try {
    // Migrate journal entries
    const journals = JSON.parse(localStorage.getItem('dogtale-journal') || '{}');
    for (const [date, entry] of Object.entries(journals)) {
      try {
        await saveJournalEntry(uid, date, entry);
        results.journalEntries++;
      } catch (error) {
        results.errors.push({ type: 'journal', date, error: error.message });
      }
    }

    // Migrate favorites
    const favorites = JSON.parse(localStorage.getItem('dogtale-favorites') || '[]');
    for (const favorite of favorites) {
      try {
        await addFavorite(uid, favorite);
        results.favorites++;
      } catch (error) {
        results.errors.push({ type: 'favorite', data: favorite, error: error.message });
      }
    }

    // Migrate preferences
    const theme = localStorage.getItem('dogtale-theme');
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const settings = JSON.parse(localStorage.getItem('dogtale-settings') || '{}');

    await updateUserPreferences(uid, {
      theme: theme || 'park',
      darkMode,
      ...settings
    });

    return results;
  } catch (error) {
    console.error('Error migrating data:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions (Private)
// ============================================================================

/**
 * Update journal statistics for user
 * @private
 */
async function updateJournalStats(uid) {
  try {
    const entries = await getAllJournalEntries(uid);

    // Calculate total word count
    const totalWords = entries.reduce((sum, entry) => {
      const words = entry.entry?.split(/\s+/).length || 0;
      return sum + words;
    }, 0);

    // Calculate streak
    const streak = calculateStreak(entries);

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      'stats.journalEntries': entries.length,
      'stats.totalWords': totalWords,
      'stats.streak': streak.current,
      'stats.longestStreak': Math.max(streak.current, streak.longest)
    });
  } catch (error) {
    console.error('Error updating journal stats:', error);
  }
}

/**
 * Calculate journal streak
 * @private
 */
function calculateStreak(entries) {
  if (entries.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Sort entries by date (newest first)
  const sorted = [...entries].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const entryDate = new Date(sorted[i].date);
    entryDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (entryDate.getTime() === expectedDate.getTime()) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      break;
    }
  }

  currentStreak = tempStreak;

  return { current: currentStreak, longest: longestStreak };
}
