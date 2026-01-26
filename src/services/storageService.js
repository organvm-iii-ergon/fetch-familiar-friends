/**
 * Storage service for file uploads to Supabase Storage
 */

import { supabase, isOnlineMode, getStorageUrl, STORAGE_BUCKETS } from '../config/supabase';

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path within the bucket
 * @param {Object} options - Upload options
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadFile(file, bucket, path, options = {}) {
  if (!isOnlineMode) {
    return { url: null, error: new Error('Storage requires online mode') };
  }

  try {
    // Validate file size (max 5MB by default)
    const maxSize = options.maxSize || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    // Validate file type if specified
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = options.filename || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const fullPath = `${path}/${filename}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: options.upsert || false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const url = getStorageUrl(bucket, fullPath);

    return { url, path: fullPath, error: null };

  } catch (err) {
    console.error('Error uploading file:', err);
    return { url: null, path: null, error: err };
  }
}

/**
 * Upload a pet photo
 * @param {File} file - The image file
 * @param {string} userId - The user's ID
 * @param {string} petId - The pet's ID
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadPetPhoto(file, userId, petId) {
  return uploadFile(file, STORAGE_BUCKETS.PET_PHOTOS, `${userId}/${petId}`, {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: 10 * 1024 * 1024, // 10MB for photos
  });
}

/**
 * Upload a user avatar
 * @param {File} file - The image file
 * @param {string} userId - The user's ID
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadAvatar(file, userId) {
  return uploadFile(file, STORAGE_BUCKETS.AVATARS, userId, {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 2 * 1024 * 1024, // 2MB for avatars
    upsert: true,
    filename: 'avatar',
  });
}

/**
 * Upload a journal image
 * @param {File} file - The image file
 * @param {string} userId - The user's ID
 * @param {string} date - The journal date (YYYY-MM-DD)
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadJournalImage(file, userId, date) {
  return uploadFile(file, STORAGE_BUCKETS.JOURNAL_IMAGES, `${userId}/${date}`, {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
  });
}

/**
 * Upload a health document
 * @param {File} file - The document file
 * @param {string} userId - The user's ID
 * @param {string} petId - The pet's ID
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadHealthDocument(file, userId, petId) {
  return uploadFile(file, STORAGE_BUCKETS.HEALTH_DOCUMENTS, `${userId}/${petId}`, {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024,
  });
}

/**
 * Delete a file from storage
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The file path
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteFile(bucket, path) {
  if (!isOnlineMode) {
    return { error: new Error('Storage requires online mode') };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('Error deleting file:', err);
    return { error: err };
  }
}

/**
 * List files in a storage path
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path to list
 * @returns {Promise<{files: Array, error: Error|null}>}
 */
export async function listFiles(bucket, path) {
  if (!isOnlineMode) {
    return { files: [], error: new Error('Storage requires online mode') };
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).list(path);
    if (error) throw error;
    return { files: data || [], error: null };
  } catch (err) {
    console.error('Error listing files:', err);
    return { files: [], error: err };
  }
}

/**
 * Compress an image before upload
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob),
        file.type || 'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload with compression
 * @param {File} file - The image file
 * @param {string} bucket - The storage bucket
 * @param {string} path - The storage path
 * @param {Object} options - Upload and compression options
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadWithCompression(file, bucket, path, options = {}) {
  try {
    // Compress if it's an image
    let fileToUpload = file;
    if (file.type.startsWith('image/') && !file.type.includes('gif')) {
      const compressed = await compressImage(file, options);
      fileToUpload = new File([compressed], file.name, { type: file.type });
    }

    return uploadFile(fileToUpload, bucket, path, options);
  } catch (err) {
    console.error('Error compressing/uploading:', err);
    return { url: null, error: err };
  }
}
