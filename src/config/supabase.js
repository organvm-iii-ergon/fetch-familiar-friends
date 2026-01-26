import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Running in offline mode.',
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables to enable cloud features.'
  );
}

// Create the Supabase client (or a mock for offline mode)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createOfflineClient();

// Offline mock client for development without Supabase
function createOfflineClient() {
  const mockAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: { message: 'Running in offline mode. Configure Supabase to enable authentication.' }
    }),
    signInWithOAuth: async () => ({
      data: { url: null },
      error: { message: 'Running in offline mode. Configure Supabase to enable OAuth.' }
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: { message: 'Running in offline mode. Configure Supabase to enable sign up.' }
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback) => {
      // Return unsubscribe function
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: null }, error: null }),
  };

  const mockQuery = () => ({
    select: () => mockQuery(),
    insert: () => mockQuery(),
    update: () => mockQuery(),
    delete: () => mockQuery(),
    eq: () => mockQuery(),
    neq: () => mockQuery(),
    gt: () => mockQuery(),
    gte: () => mockQuery(),
    lt: () => mockQuery(),
    lte: () => mockQuery(),
    like: () => mockQuery(),
    ilike: () => mockQuery(),
    is: () => mockQuery(),
    in: () => mockQuery(),
    order: () => mockQuery(),
    limit: () => mockQuery(),
    range: () => mockQuery(),
    single: () => mockQuery(),
    maybeSingle: () => mockQuery(),
    then: (resolve) => resolve({ data: [], error: null }),
  });

  return {
    auth: mockAuth,
    from: () => mockQuery(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Offline mode' } }),
        download: async () => ({ data: null, error: { message: 'Offline mode' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: null }),
        list: async () => ({ data: [], error: null }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
    rpc: async () => ({ data: null, error: { message: 'Offline mode' } }),
  };
}

// Check if we're in online mode
export const isOnlineMode = !!(supabaseUrl && supabaseAnonKey);

// Helper to get storage URL for uploaded files
export function getStorageUrl(bucket, path) {
  if (!isOnlineMode) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Storage buckets configuration
export const STORAGE_BUCKETS = {
  PET_PHOTOS: 'pet-photos',
  AVATARS: 'avatars',
  JOURNAL_IMAGES: 'journal-images',
  HEALTH_DOCUMENTS: 'health-documents',
};
