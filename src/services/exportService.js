/**
 * Export Service
 * Handles exporting user data in various formats
 */

import { supabase, isOnlineMode } from '../config/supabase';

// Export formats
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
};

// Data types that can be exported
export const EXPORT_DATA_TYPES = {
  JOURNAL_ENTRIES: 'journal_entries',
  PETS: 'pets',
  FAVORITES: 'favorites',
  ACHIEVEMENTS: 'achievements',
  HEALTH_RECORDS: 'health_records',
  ACTIVITIES: 'activities',
  SETTINGS: 'settings',
  ALL: 'all',
};

/**
 * Export user data in the specified format
 * @param {string} format - 'json' or 'csv'
 * @param {Object} options - Export options
 * @returns {Promise<{data: string|Object, filename: string, error: Error|null}>}
 */
export async function exportUserData(format = EXPORT_FORMATS.JSON, options = {}) {
  const {
    userId,
    dataTypes = [EXPORT_DATA_TYPES.ALL],
    includeLocalData = true,
  } = options;

  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {},
    };

    // Determine what to export
    const shouldExportAll = dataTypes.includes(EXPORT_DATA_TYPES.ALL);
    const typesToExport = shouldExportAll
      ? Object.values(EXPORT_DATA_TYPES).filter((t) => t !== EXPORT_DATA_TYPES.ALL)
      : dataTypes;

    // Fetch data for each type
    for (const dataType of typesToExport) {
      const fetchedData = await fetchDataByType(dataType, userId, includeLocalData);
      if (fetchedData && (Array.isArray(fetchedData) ? fetchedData.length > 0 : Object.keys(fetchedData).length > 0)) {
        exportData.data[dataType] = fetchedData;
      }
    }

    // Format the data
    let formattedData;
    let filename;
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === EXPORT_FORMATS.CSV) {
      formattedData = convertToCSV(exportData.data);
      filename = `dogtale-export-${dateStr}.csv`;
    } else {
      formattedData = JSON.stringify(exportData, null, 2);
      filename = `dogtale-export-${dateStr}.json`;
    }

    return { data: formattedData, filename, error: null };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { data: null, filename: null, error };
  }
}

/**
 * Fetch data by type
 * @param {string} dataType - Type of data to fetch
 * @param {string} userId - User ID
 * @param {boolean} includeLocal - Whether to include localStorage data
 * @returns {Promise<any>}
 */
async function fetchDataByType(dataType, userId, includeLocal) {
  switch (dataType) {
    case EXPORT_DATA_TYPES.JOURNAL_ENTRIES:
      return fetchJournalEntries(userId, includeLocal);
    case EXPORT_DATA_TYPES.PETS:
      return fetchPets(userId, includeLocal);
    case EXPORT_DATA_TYPES.FAVORITES:
      return fetchFavorites(userId, includeLocal);
    case EXPORT_DATA_TYPES.ACHIEVEMENTS:
      return fetchAchievements(userId);
    case EXPORT_DATA_TYPES.HEALTH_RECORDS:
      return fetchHealthRecords(userId);
    case EXPORT_DATA_TYPES.ACTIVITIES:
      return fetchActivities(userId);
    case EXPORT_DATA_TYPES.SETTINGS:
      return fetchSettings(includeLocal);
    default:
      return null;
  }
}

/**
 * Fetch journal entries
 */
async function fetchJournalEntries(userId, includeLocal) {
  let entries = [];

  // Fetch from localStorage
  if (includeLocal) {
    try {
      const localJournal = localStorage.getItem('dogtale-journal');
      if (localJournal) {
        const parsed = JSON.parse(localJournal);
        // Convert object to array format
        entries = Object.entries(parsed).map(([date, content]) => ({
          date,
          content,
          source: 'local',
        }));
      }
    } catch (error) {
      console.error('Error reading local journal:', error);
    }
  }

  // Fetch from Supabase
  if (isOnlineMode && userId) {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

      if (!error && data) {
        // Merge with local, preferring cloud data
        const cloudEntries = data.map((e) => ({
          date: e.entry_date,
          content: e.content,
          mood: e.mood,
          imageUrl: e.image_url,
          createdAt: e.created_at,
          source: 'cloud',
        }));

        // Dedupe by date, prefer cloud
        const dateMap = new Map();
        cloudEntries.forEach((e) => dateMap.set(e.date, e));
        entries.forEach((e) => {
          if (!dateMap.has(e.date)) {
            dateMap.set(e.date, e);
          }
        });

        entries = Array.from(dateMap.values());
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }
  }

  return entries;
}

/**
 * Fetch pets
 */
async function fetchPets(userId, includeLocal) {
  let pets = [];

  // Fetch from localStorage
  if (includeLocal) {
    try {
      const localPets = localStorage.getItem('dogtale-pets');
      if (localPets) {
        pets = JSON.parse(localPets).map((p) => ({ ...p, source: 'local' }));
      }
    } catch (error) {
      console.error('Error reading local pets:', error);
    }
  }

  // Fetch from Supabase
  if (isOnlineMode && userId) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const cloudPets = data.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          birthDate: p.birth_date,
          adoptionDate: p.adoption_date,
          weight: p.weight_kg,
          gender: p.gender,
          bio: p.bio,
          avatarUrl: p.avatar_url,
          isPrimary: p.is_primary,
          isDeceased: p.is_deceased,
          memorialMessage: p.memorial_message,
          createdAt: p.created_at,
          source: 'cloud',
        }));

        // Dedupe by ID, prefer cloud
        const idMap = new Map();
        cloudPets.forEach((p) => idMap.set(p.id, p));
        pets.forEach((p) => {
          if (!idMap.has(p.id)) {
            idMap.set(p.id, p);
          }
        });

        pets = Array.from(idMap.values());
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  }

  return pets;
}

/**
 * Fetch favorites
 */
async function fetchFavorites(userId, includeLocal) {
  let favorites = [];

  // Fetch from localStorage
  if (includeLocal) {
    try {
      const localFavorites = localStorage.getItem('dogtale-favorites');
      if (localFavorites) {
        favorites = JSON.parse(localFavorites).map((f) => ({ ...f, source: 'local' }));
      }
    } catch (error) {
      console.error('Error reading local favorites:', error);
    }
  }

  // Fetch from Supabase
  if (isOnlineMode && userId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const cloudFavorites = data.map((f) => ({
          id: f.id,
          url: f.image_url,
          type: f.image_type,
          breed: f.breed,
          savedAt: new Date(f.created_at).getTime(),
          source: 'cloud',
        }));

        // Dedupe by URL, prefer cloud
        const urlMap = new Map();
        cloudFavorites.forEach((f) => urlMap.set(f.url, f));
        favorites.forEach((f) => {
          if (!urlMap.has(f.url)) {
            urlMap.set(f.url, f);
          }
        });

        favorites = Array.from(urlMap.values());
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }

  return favorites;
}

/**
 * Fetch achievements
 */
async function fetchAchievements(userId) {
  if (!isOnlineMode || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((a) => ({
      key: a.achievement_key,
      achievedAt: a.achieved_at,
    }));
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
}

/**
 * Fetch health records
 */
async function fetchHealthRecords(userId) {
  if (!isOnlineMode || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('health_records')
      .select(`
        *,
        pet:pets(id, name)
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map((r) => ({
      id: r.id,
      petId: r.pet_id,
      petName: r.pet?.name,
      type: r.record_type,
      title: r.title,
      description: r.description,
      date: r.date,
      nextDueDate: r.next_due_date,
      vetName: r.vet_name,
      vetClinic: r.vet_clinic,
      cost: r.cost,
      createdAt: r.created_at,
    }));
  } catch (error) {
    console.error('Error fetching health records:', error);
    return [];
  }
}

/**
 * Fetch activities
 */
async function fetchActivities(userId) {
  if (!isOnlineMode || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    return (data || []).map((a) => ({
      id: a.id,
      type: a.activity_type,
      content: a.content,
      imageUrl: a.image_url,
      visibility: a.visibility,
      createdAt: a.created_at,
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Fetch settings
 */
function fetchSettings(includeLocal) {
  if (!includeLocal) return {};

  try {
    const localSettings = localStorage.getItem('dogtale-settings');
    const localTheme = localStorage.getItem('dogtale-theme');

    return {
      settings: localSettings ? JSON.parse(localSettings) : {},
      theme: localTheme || 'park',
    };
  } catch (error) {
    console.error('Error reading local settings:', error);
    return {};
  }
}

/**
 * Convert data to CSV format
 * @param {Object} data - Data object with different types
 * @returns {string} CSV string
 */
function convertToCSV(data) {
  const sections = [];

  for (const [dataType, items] of Object.entries(data)) {
    if (!Array.isArray(items) || items.length === 0) continue;

    // Add section header
    sections.push(`# ${dataType.toUpperCase()}`);

    // Get all unique keys from items
    const allKeys = new Set();
    items.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });
    const headers = Array.from(allKeys);

    // Add header row
    sections.push(headers.map(escapeCSV).join(','));

    // Add data rows
    items.forEach((item) => {
      const row = headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return escapeCSV(JSON.stringify(value));
        return escapeCSV(String(value));
      });
      sections.push(row.join(','));
    });

    sections.push(''); // Empty line between sections
  }

  return sections.join('\n');
}

/**
 * Escape a value for CSV
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Download exported data as a file
 * @param {string} data - Data to download
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export function downloadExport(data, filename, mimeType = 'application/json') {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export and download user data
 * @param {string} format - Export format
 * @param {Object} options - Export options
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function exportAndDownload(format = EXPORT_FORMATS.JSON, options = {}) {
  const { data, filename, error } = await exportUserData(format, options);

  if (error) {
    return { success: false, error };
  }

  const mimeType = format === EXPORT_FORMATS.CSV ? 'text/csv' : 'application/json';
  downloadExport(data, filename, mimeType);

  return { success: true, error: null };
}

/**
 * Get export size estimate
 * @param {Object} options - Export options
 * @returns {Promise<{sizeBytes: number, error: Error|null}>}
 */
export async function getExportSizeEstimate(options = {}) {
  try {
    const { data } = await exportUserData(EXPORT_FORMATS.JSON, options);
    const sizeBytes = new Blob([data || '']).size;
    return { sizeBytes, error: null };
  } catch (error) {
    return { sizeBytes: 0, error };
  }
}

/**
 * Format bytes to human readable
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  exportUserData,
  downloadExport,
  exportAndDownload,
  getExportSizeEstimate,
  formatBytes,
  EXPORT_FORMATS,
  EXPORT_DATA_TYPES,
};
