import { supabase, isOnlineMode } from '../config/supabase';

/**
 * Check if user has local data that needs to be migrated
 * @returns {boolean}
 */
export function hasLocalData() {
  const favorites = localStorage.getItem('dogtale-favorites');
  const journal = localStorage.getItem('dogtale-journal');

  const hasFavorites = favorites && JSON.parse(favorites).length > 0;
  const hasJournal = journal && Object.keys(JSON.parse(journal)).length > 0;

  return hasFavorites || hasJournal;
}

/**
 * Get all local data that can be migrated
 * @returns {Object} Local data object
 */
export function getLocalData() {
  try {
    return {
      favorites: JSON.parse(localStorage.getItem('dogtale-favorites') || '[]'),
      journalEntries: JSON.parse(localStorage.getItem('dogtale-journal') || '{}'),
      theme: localStorage.getItem('dogtale-theme') || 'park',
      settings: JSON.parse(localStorage.getItem('dogtale-settings') || '{}'),
    };
  } catch (error) {
    console.error('Error reading local data:', error);
    return {
      favorites: [],
      journalEntries: {},
      theme: 'park',
      settings: {},
    };
  }
}

/**
 * Migrate local favorites to Supabase
 * @param {string} userId - User ID to migrate data for
 * @param {Array} favorites - Array of favorite objects
 */
async function migrateFavorites(userId, favorites) {
  if (!favorites || favorites.length === 0) return { migrated: 0, errors: [] };

  const errors = [];
  let migrated = 0;

  // Transform favorites to database format
  const dbFavorites = favorites.map(fav => ({
    user_id: userId,
    image_url: fav.url,
    image_type: fav.type || 'dog',
    breed: fav.breed || null,
    created_at: fav.savedAt ? new Date(fav.savedAt).toISOString() : new Date().toISOString(),
  }));

  // Insert in batches to avoid timeout
  const batchSize = 50;
  for (let i = 0; i < dbFavorites.length; i += batchSize) {
    const batch = dbFavorites.slice(i, i + batchSize);

    const { error } = await supabase
      .from('favorites')
      .upsert(batch, {
        onConflict: 'user_id,image_url',
        ignoreDuplicates: true
      });

    if (error) {
      errors.push({ batch: i / batchSize, error: error.message });
    } else {
      migrated += batch.length;
    }
  }

  return { migrated, errors };
}

/**
 * Migrate local journal entries to Supabase
 * @param {string} userId - User ID to migrate data for
 * @param {Object} journalEntries - Object of date -> entry content
 */
async function migrateJournalEntries(userId, journalEntries) {
  if (!journalEntries || Object.keys(journalEntries).length === 0) {
    return { migrated: 0, errors: [] };
  }

  const errors = [];
  let migrated = 0;

  // Transform journal entries to database format
  // Handle both old format (dateString -> content) and new format (YYYY-MM-DD -> content)
  const dbEntries = Object.entries(journalEntries).map(([dateKey, content]) => {
    // Try to parse the date key
    let date;
    try {
      // Handle various date formats
      if (dateKey.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in YYYY-MM-DD format
        date = dateKey;
      } else {
        // Try parsing as Date string (e.g., "Mon Jan 15 2024")
        const parsed = new Date(dateKey);
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString().split('T')[0];
        } else {
          // Skip invalid dates
          return null;
        }
      }
    } catch {
      return null;
    }

    return {
      user_id: userId,
      date,
      content: typeof content === 'string' ? content : content.text || JSON.stringify(content),
      mood: typeof content === 'object' ? content.mood : null,
      is_private: true,
    };
  }).filter(Boolean);

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < dbEntries.length; i += batchSize) {
    const batch = dbEntries.slice(i, i + batchSize);

    const { error } = await supabase
      .from('journal_entries')
      .upsert(batch, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false // Update if exists
      });

    if (error) {
      errors.push({ batch: i / batchSize, error: error.message });
    } else {
      migrated += batch.length;
    }
  }

  return { migrated, errors };
}

/**
 * Migrate user settings to profile
 * @param {string} userId - User ID
 * @param {string} theme - Theme preference
 * @param {Object} settings - App settings
 */
async function migrateSettings(userId, theme, settings) {
  const { error } = await supabase
    .from('profiles')
    .update({
      settings: {
        ...settings,
        theme,
        migratedFromLocal: true,
        migratedAt: new Date().toISOString(),
      },
    })
    .eq('id', userId);

  return { success: !error, error: error?.message };
}

/**
 * Main migration function - migrates all local data to Supabase
 * @param {string} userId - User ID to migrate data for
 * @returns {Object} Migration results
 */
export async function migrateLocalDataToSupabase(userId) {
  if (!isOnlineMode) {
    throw new Error('Cannot migrate data in offline mode');
  }

  const results = {
    favorites: { migrated: 0, errors: [] },
    journal: { migrated: 0, errors: [] },
    settings: { success: false, error: null },
    completed: false,
  };

  try {
    const localData = getLocalData();

    // Migrate favorites
    results.favorites = await migrateFavorites(userId, localData.favorites);

    // Migrate journal entries
    results.journal = await migrateJournalEntries(userId, localData.journalEntries);

    // Migrate settings
    results.settings = await migrateSettings(userId, localData.theme, localData.settings);

    // Mark migration as complete in localStorage
    localStorage.setItem('dogtale-migrated', JSON.stringify({
      migratedAt: new Date().toISOString(),
      userId,
      results,
    }));

    results.completed = true;

    console.log('Migration completed:', results);
    return results;

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Check if data has already been migrated for this user
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
export function hasBeenMigrated(userId) {
  try {
    const migrated = localStorage.getItem('dogtale-migrated');
    if (!migrated) return false;

    const data = JSON.parse(migrated);
    return data.userId === userId && data.results?.completed;
  } catch {
    return false;
  }
}

/**
 * Clear local data after successful migration (optional)
 * User should be prompted before calling this
 */
export function clearLocalDataAfterMigration() {
  const keysToKeep = ['dogtale-migrated', 'dogtale-seen-landing', 'darkMode'];
  const keysToRemove = [
    'dogtale-favorites',
    'dogtale-journal',
    'dogtale-theme',
    'dogtale-settings',
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('Local data cleared after migration');
}

/**
 * Sync cloud data back to localStorage (for offline support)
 * @param {string} userId - User ID
 */
export async function syncCloudToLocal(userId) {
  if (!isOnlineMode) return;

  try {
    // Fetch favorites from cloud
    const { data: cloudFavorites } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cloudFavorites) {
      const localFormat = cloudFavorites.map(fav => ({
        id: fav.id,
        url: fav.image_url,
        type: fav.image_type,
        breed: fav.breed,
        savedAt: new Date(fav.created_at).getTime(),
      }));
      localStorage.setItem('dogtale-favorites', JSON.stringify(localFormat));
    }

    // Fetch journal entries from cloud
    const { data: cloudJournal } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId);

    if (cloudJournal) {
      const localFormat = {};
      cloudJournal.forEach(entry => {
        localFormat[entry.date] = entry.content;
      });
      localStorage.setItem('dogtale-journal', JSON.stringify(localFormat));
    }

    // Fetch profile settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (profile?.settings) {
      if (profile.settings.theme) {
        localStorage.setItem('dogtale-theme', profile.settings.theme);
      }
      localStorage.setItem('dogtale-settings', JSON.stringify(profile.settings));
    }

    console.log('Synced cloud data to local storage');
  } catch (error) {
    console.error('Error syncing cloud to local:', error);
  }
}
