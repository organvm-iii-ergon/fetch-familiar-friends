/**
 * Export Service
 * Handles exporting user data in various formats
 */

import { supabase, isOnlineMode } from '../config/supabase';

// Export formats
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  PDF: 'pdf',
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
    } else if (format === EXPORT_FORMATS.PDF) {
      formattedData = convertToPDF(exportData);
      filename = `dogtale-export-${dateStr}.pdf`;
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

  let mimeType;
  switch (format) {
    case EXPORT_FORMATS.CSV:
      mimeType = 'text/csv';
      break;
    case EXPORT_FORMATS.PDF:
      mimeType = 'application/pdf';
      break;
    default:
      mimeType = 'application/json';
  }

  // For PDF, data is already a Blob
  if (format === EXPORT_FORMATS.PDF) {
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    downloadExport(data, filename, mimeType);
  }

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

/**
 * Convert data to simple PDF format
 * Uses a lightweight approach without external libraries
 * @param {Object} exportData - Export data object
 * @returns {Blob} PDF blob
 */
function convertToPDF(exportData) {
  // Simple PDF generation without external dependencies
  // Creates a basic PDF structure
  const lines = [];

  // PDF Header
  lines.push('%PDF-1.4');
  lines.push('%âãÏÓ');

  // Content stream will be built here
  let content = [];
  let yPos = 800;
  const pageWidth = 595;
  const margin = 50;
  const lineHeight = 14;

  // Title
  content.push(`BT /F1 18 Tf ${margin} ${yPos} Td (DogTale Daily - Data Export) Tj ET`);
  yPos -= 30;
  content.push(`BT /F1 10 Tf ${margin} ${yPos} Td (Exported: ${exportData.exportedAt}) Tj ET`);
  yPos -= 20;
  content.push(`BT /F1 10 Tf ${margin} ${yPos} Td (Version: ${exportData.version}) Tj ET`);
  yPos -= 30;

  // Add each data section
  for (const [dataType, items] of Object.entries(exportData.data)) {
    if (yPos < 100) {
      yPos = 800; // New page would be needed
    }

    // Section header
    const sectionTitle = dataType.replace(/_/g, ' ').toUpperCase();
    content.push(`BT /F1 14 Tf ${margin} ${yPos} Td (${sectionTitle}) Tj ET`);
    yPos -= 20;

    if (Array.isArray(items)) {
      // Count for summary
      content.push(`BT /F1 10 Tf ${margin} ${yPos} Td (Total items: ${items.length}) Tj ET`);
      yPos -= lineHeight;

      // Add first few items as sample
      const sample = items.slice(0, 5);
      sample.forEach((item, idx) => {
        if (yPos < 100) return;

        let itemText = '';
        if (item.name) itemText += `Name: ${item.name}. `;
        if (item.date) itemText += `Date: ${item.date}. `;
        if (item.content) itemText += `Content: ${String(item.content).slice(0, 50)}...`;
        if (item.type) itemText += `Type: ${item.type}. `;

        if (itemText) {
          // Escape special characters
          itemText = itemText.replace(/[()\\]/g, '\\$&');
          content.push(`BT /F1 9 Tf ${margin + 10} ${yPos} Td (${idx + 1}. ${itemText.slice(0, 80)}) Tj ET`);
          yPos -= lineHeight;
        }
      });

      if (items.length > 5) {
        content.push(`BT /F1 9 Tf ${margin + 10} ${yPos} Td (... and ${items.length - 5} more items) Tj ET`);
        yPos -= lineHeight;
      }
    } else if (typeof items === 'object') {
      const keys = Object.keys(items).slice(0, 5);
      keys.forEach((key) => {
        if (yPos < 100) return;
        const value = String(items[key]).slice(0, 60).replace(/[()\\]/g, '\\$&');
        content.push(`BT /F1 9 Tf ${margin + 10} ${yPos} Td (${key}: ${value}) Tj ET`);
        yPos -= lineHeight;
      });
    }

    yPos -= 20;
  }

  // Build PDF structure
  const contentStream = content.join('\n');
  const streamLength = contentStream.length;

  // Object 1: Catalog
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj';

  // Object 2: Pages
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj';

  // Object 3: Page
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`;

  // Object 4: Content stream
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`;

  // Object 5: Font
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj';

  // Build PDF
  const pdfContent = [
    '%PDF-1.4',
    '%âãÏÓ',
    obj1,
    obj2,
    obj3,
    obj4,
    obj5,
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000015 00000 n ',
    '0000000066 00000 n ',
    '0000000123 00000 n ',
    '0000000266 00000 n ',
    `0000000${String(350 + streamLength).padStart(3, '0')} 00000 n `,
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    String(400 + streamLength),
    '%%EOF',
  ].join('\n');

  return new Blob([pdfContent], { type: 'application/pdf' });
}

/**
 * Import user data from a file
 * @param {File} file - File to import
 * @param {Object} options - Import options
 * @returns {Promise<{success: boolean, imported: Object, errors: string[], error: Error|null}>}
 */
export async function importUserData(file, options = {}) {
  const {
    merge = true, // If true, merge with existing data; if false, replace
    validate = true,
  } = options;

  try {
    const fileContent = await readFileContent(file);
    let importData;

    // Parse based on file type
    if (file.name.endsWith('.json')) {
      importData = JSON.parse(fileContent);
    } else if (file.name.endsWith('.csv')) {
      importData = parseCSVImport(fileContent);
    } else {
      throw new Error('Unsupported file format. Please use JSON or CSV.');
    }

    // Validate data structure
    if (validate && !validateImportData(importData)) {
      throw new Error('Invalid data format. Please ensure the file was exported from DogTale Daily.');
    }

    const imported = {};
    const errors = [];

    // Import each data type
    const data = importData.data || importData;

    for (const [dataType, items] of Object.entries(data)) {
      try {
        const result = await importDataByType(dataType, items, merge);
        if (result.success) {
          imported[dataType] = result.count;
        } else {
          errors.push(`Failed to import ${dataType}: ${result.error}`);
        }
      } catch (err) {
        errors.push(`Error importing ${dataType}: ${err.message}`);
      }
    }

    return { success: true, imported, errors, error: null };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, imported: {}, errors: [], error };
  }
}

/**
 * Read file content as text
 */
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CSV import data
 */
function parseCSVImport(csvContent) {
  const lines = csvContent.split('\n');
  const data = {};
  let currentSection = null;
  let headers = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('#')) {
      // New section
      currentSection = trimmed.substring(1).trim().toLowerCase();
      data[currentSection] = [];
      headers = [];
      continue;
    }

    if (!currentSection) continue;

    const values = parseCSVLine(trimmed);

    if (headers.length === 0) {
      // First row is headers
      headers = values;
      continue;
    }

    // Create object from values
    const item = {};
    headers.forEach((header, idx) => {
      let value = values[idx] || '';
      // Try to parse JSON for complex values
      try {
        if (value.startsWith('{') || value.startsWith('[')) {
          value = JSON.parse(value);
        }
      } catch {
        // Keep as string
      }
      item[header] = value;
    });
    data[currentSection].push(item);
  }

  return { data };
}

/**
 * Parse a single CSV line respecting quotes
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

/**
 * Validate import data structure
 */
function validateImportData(data) {
  if (!data) return false;

  // Check if it has the expected structure
  if (data.data && typeof data.data === 'object') {
    return true;
  }

  // Or if it's a direct data object
  const validKeys = Object.values(EXPORT_DATA_TYPES);
  const dataKeys = Object.keys(data);

  return dataKeys.some((key) => validKeys.includes(key) || key === 'data');
}

/**
 * Import data by type
 */
async function importDataByType(dataType, items, merge) {
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return { success: true, count: 0 };
  }

  switch (dataType) {
    case EXPORT_DATA_TYPES.JOURNAL_ENTRIES:
    case 'journal_entries':
      return importJournalEntries(items, merge);
    case EXPORT_DATA_TYPES.FAVORITES:
    case 'favorites':
      return importFavorites(items, merge);
    case EXPORT_DATA_TYPES.SETTINGS:
    case 'settings':
      return importSettings(items, merge);
    case EXPORT_DATA_TYPES.PETS:
    case 'pets':
      return importPets(items, merge);
    default:
      // For other types, just acknowledge
      return { success: true, count: Array.isArray(items) ? items.length : 1 };
  }
}

/**
 * Import journal entries
 */
function importJournalEntries(items, merge) {
  try {
    let existing = {};
    if (merge) {
      const stored = localStorage.getItem('dogtale-journal');
      existing = stored ? JSON.parse(stored) : {};
    }

    // Convert array to object format if needed
    const newEntries = {};
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const date = item.date || item.entry_date;
        if (date) {
          newEntries[date] = item.content || item;
        }
      });
    } else {
      Object.assign(newEntries, items);
    }

    const merged = merge ? { ...existing, ...newEntries } : newEntries;
    localStorage.setItem('dogtale-journal', JSON.stringify(merged));

    return { success: true, count: Object.keys(newEntries).length };
  } catch (error) {
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Import favorites
 */
function importFavorites(items, merge) {
  try {
    let existing = [];
    if (merge) {
      const stored = localStorage.getItem('dogtale-favorites');
      existing = stored ? JSON.parse(stored) : [];
    }

    const newItems = Array.isArray(items) ? items : [items];

    // Dedupe by URL
    const urlSet = new Set(existing.map((f) => f.url));
    const toAdd = newItems.filter((item) => !urlSet.has(item.url));

    const merged = merge ? [...existing, ...toAdd] : newItems;
    localStorage.setItem('dogtale-favorites', JSON.stringify(merged));

    return { success: true, count: toAdd.length };
  } catch (error) {
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Import settings
 */
function importSettings(items, merge) {
  try {
    let existing = {};
    if (merge) {
      const stored = localStorage.getItem('dogtale-settings');
      existing = stored ? JSON.parse(stored) : {};
    }

    const settings = items.settings || items;
    const merged = merge ? { ...existing, ...settings } : settings;
    localStorage.setItem('dogtale-settings', JSON.stringify(merged));

    if (items.theme) {
      localStorage.setItem('dogtale-theme', items.theme);
    }

    return { success: true, count: Object.keys(settings).length };
  } catch (error) {
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Import pets
 */
function importPets(items, merge) {
  try {
    let existing = [];
    if (merge) {
      const stored = localStorage.getItem('dogtale-pets');
      existing = stored ? JSON.parse(stored) : [];
    }

    const newItems = Array.isArray(items) ? items : [items];

    // Dedupe by ID
    const idSet = new Set(existing.map((p) => p.id));
    const toAdd = newItems.filter((item) => !idSet.has(item.id));

    const merged = merge ? [...existing, ...toAdd] : newItems;
    localStorage.setItem('dogtale-pets', JSON.stringify(merged));

    return { success: true, count: toAdd.length };
  } catch (error) {
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Prompt user to select file for import
 * @returns {Promise<File|null>}
 */
export function selectFileForImport() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';

    input.onchange = (e) => {
      const file = e.target.files?.[0];
      resolve(file || null);
    };

    input.oncancel = () => resolve(null);

    input.click();
  });
}

/**
 * Import from file with user file selection
 * @param {Object} options - Import options
 * @returns {Promise<{success: boolean, imported: Object, errors: string[], error: Error|null}>}
 */
export async function importFromFile(options = {}) {
  const file = await selectFileForImport();

  if (!file) {
    return { success: false, imported: {}, errors: ['No file selected'], error: null };
  }

  return importUserData(file, options);
}

export default {
  exportUserData,
  downloadExport,
  exportAndDownload,
  getExportSizeEstimate,
  formatBytes,
  importUserData,
  importFromFile,
  selectFileForImport,
  EXPORT_FORMATS,
  EXPORT_DATA_TYPES,
};
