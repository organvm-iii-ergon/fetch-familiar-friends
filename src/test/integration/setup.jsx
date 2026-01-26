/**
 * Integration Test Setup
 * Provides full app rendering with all providers and realistic Supabase mocks
 */

import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { AuthProvider } from '../../contexts/AuthContext';
import { SubscriptionProvider } from '../../contexts/SubscriptionContext';

// ============================================================================
// Mock Data Generators
// ============================================================================

let idCounter = 1;
export const generateId = () => `test-id-${idCounter++}`;

export const createMockUser = (overrides = {}) => ({
  id: generateId(),
  email: `test-${Date.now()}@example.com`,
  created_at: new Date().toISOString(),
  user_metadata: {
    username: 'testuser',
    full_name: 'Test User',
  },
  ...overrides,
});

export const createMockProfile = (userId, overrides = {}) => ({
  id: userId,
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
  bio: 'Test bio',
  xp: 100,
  level: 2,
  streak_days: 5,
  subscription_tier: 'free',
  subscription_expires_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockPet = (ownerId, overrides = {}) => ({
  id: generateId(),
  owner_id: ownerId,
  name: 'Buddy',
  species: 'dog',
  breed: 'Labrador',
  birth_date: '2020-01-01',
  adoption_date: '2020-06-01',
  weight_kg: 25,
  gender: 'male',
  bio: 'A friendly dog',
  avatar_url: null,
  is_primary: true,
  is_deceased: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  photos: [],
  ...overrides,
});

export const createMockVirtualPet = (userId, overrides = {}) => ({
  id: generateId(),
  user_id: userId,
  pet_name: 'Pixel',
  pet_type: 'dog',
  happiness: 80,
  energy: 70,
  hunger: 30,
  experience: 50,
  level: 3,
  last_fed_at: new Date().toISOString(),
  last_played_at: new Date().toISOString(),
  last_rested_at: new Date().toISOString(),
  customization: {},
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockFriendship = (requesterId, addresseeId, overrides = {}) => ({
  id: generateId(),
  requester_id: requesterId,
  addressee_id: addresseeId,
  status: 'pending',
  created_at: new Date().toISOString(),
  requester: createMockProfile(requesterId, { username: 'requester' }),
  addressee: createMockProfile(addresseeId, { username: 'addressee' }),
  ...overrides,
});

export const createMockActivity = (userId, overrides = {}) => ({
  id: generateId(),
  user_id: userId,
  pet_id: null,
  activity_type: 'post',
  content: 'Test activity content',
  image_url: null,
  visibility: 'friends',
  metadata: {},
  created_at: new Date().toISOString(),
  user: createMockProfile(userId),
  pet: null,
  reactions: [],
  comments: [{ count: 0 }],
  ...overrides,
});

export const createMockQuest = (userId, overrides = {}) => ({
  id: generateId(),
  user_id: userId,
  quest_key: 'daily_photo',
  quest_type: 'daily',
  target: 1,
  progress: 0,
  completed_at: null,
  rewards_claimed: false,
  expires_at: getEndOfDay(),
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAchievement = (userId, overrides = {}) => ({
  id: generateId(),
  user_id: userId,
  achievement_key: 'first_journal',
  achieved_at: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// Mock Supabase Client
// ============================================================================

export const createMockSupabaseClient = (initialData = {}) => {
  const data = {
    profiles: initialData.profiles || [],
    pets: initialData.pets || [],
    virtual_pets: initialData.virtual_pets || [],
    friendships: initialData.friendships || [],
    activities: initialData.activities || [],
    activity_reactions: initialData.activity_reactions || [],
    comments: initialData.comments || [],
    quests: initialData.quests || [],
    achievements: initialData.achievements || [],
    ...initialData,
  };

  let currentSession = null;
  let currentUser = null;
  const authCallbacks = [];

  const triggerAuthChange = (event, session) => {
    authCallbacks.forEach(cb => cb(event, session));
  };

  // Build a chainable query object
  const createQueryBuilder = (tableName) => {
    let tableData = [...(data[tableName] || [])];
    let filters = [];
    let selectedFields = '*';
    let orderBy = null;
    let orderAsc = true;
    let limitCount = null;
    let rangeStart = null;
    let rangeEnd = null;
    let isSingle = false;
    let insertData = null;
    let updateData = null;
    let isDelete = false;

    const applyFilters = (records) => {
      return records.filter(record => {
        return filters.every(filter => {
          const { field, op, value } = filter;
          const recordValue = record[field];

          switch (op) {
            case 'eq': return recordValue === value;
            case 'neq': return recordValue !== value;
            case 'gt': return recordValue > value;
            case 'gte': return recordValue >= value;
            case 'lt': return recordValue < value;
            case 'lte': return recordValue <= value;
            case 'like': return String(recordValue).includes(value.replace(/%/g, ''));
            case 'ilike': return String(recordValue).toLowerCase().includes(value.replace(/%/g, '').toLowerCase());
            case 'is': return recordValue === value;
            case 'in': return value.includes(recordValue);
            case 'or': return true; // Simplified: or filters are complex
            default: return true;
          }
        });
      });
    };

    const execute = async () => {
      // Handle inserts
      if (insertData) {
        const newRecord = { id: generateId(), ...insertData, created_at: new Date().toISOString() };
        data[tableName].push(newRecord);
        return { data: isSingle ? newRecord : [newRecord], error: null };
      }

      // Handle updates
      if (updateData) {
        let filtered = applyFilters(data[tableName]);
        filtered.forEach(record => {
          Object.assign(record, updateData, { updated_at: new Date().toISOString() });
        });
        return { data: isSingle ? filtered[0] : filtered, error: null };
      }

      // Handle deletes
      if (isDelete) {
        const toDelete = applyFilters(data[tableName]);
        const idsToDelete = new Set(toDelete.map(r => r.id));
        data[tableName] = data[tableName].filter(r => !idsToDelete.has(r.id));
        return { data: toDelete, error: null };
      }

      // Handle selects
      let result = applyFilters(tableData);

      // Apply ordering
      if (orderBy) {
        result.sort((a, b) => {
          const aVal = a[orderBy];
          const bVal = b[orderBy];
          if (orderAsc) return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        });
      }

      // Apply range/limit
      if (rangeStart !== null && rangeEnd !== null) {
        result = result.slice(rangeStart, rangeEnd + 1);
      } else if (limitCount) {
        result = result.slice(0, limitCount);
      }

      if (isSingle) {
        return { data: result[0] || null, error: result[0] ? null : { message: 'No rows found' } };
      }

      return { data: result, error: null };
    };

    const builder = {
      select: (fields = '*') => {
        selectedFields = fields;
        return builder;
      },
      insert: (record) => {
        insertData = record;
        return builder;
      },
      update: (updates) => {
        updateData = updates;
        return builder;
      },
      delete: () => {
        isDelete = true;
        return builder;
      },
      upsert: (record, options = {}) => {
        insertData = record;
        return builder;
      },
      eq: (field, value) => {
        filters.push({ field, op: 'eq', value });
        return builder;
      },
      neq: (field, value) => {
        filters.push({ field, op: 'neq', value });
        return builder;
      },
      gt: (field, value) => {
        filters.push({ field, op: 'gt', value });
        return builder;
      },
      gte: (field, value) => {
        filters.push({ field, op: 'gte', value });
        return builder;
      },
      lt: (field, value) => {
        filters.push({ field, op: 'lt', value });
        return builder;
      },
      lte: (field, value) => {
        filters.push({ field, op: 'lte', value });
        return builder;
      },
      like: (field, value) => {
        filters.push({ field, op: 'like', value });
        return builder;
      },
      ilike: (field, value) => {
        filters.push({ field, op: 'ilike', value });
        return builder;
      },
      is: (field, value) => {
        filters.push({ field, op: 'is', value });
        return builder;
      },
      in: (field, values) => {
        filters.push({ field, op: 'in', value: values });
        return builder;
      },
      or: (condition) => {
        // Simplified OR handling
        return builder;
      },
      order: (field, options = {}) => {
        orderBy = field;
        orderAsc = options.ascending !== false;
        return builder;
      },
      limit: (count) => {
        limitCount = count;
        return builder;
      },
      range: (start, end) => {
        rangeStart = start;
        rangeEnd = end;
        return builder;
      },
      single: () => {
        isSingle = true;
        return builder;
      },
      maybeSingle: () => {
        isSingle = true;
        return builder;
      },
      then: (resolve) => execute().then(resolve),
    };

    return builder;
  };

  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: currentSession },
        error: null,
      })),
      getUser: vi.fn(async () => ({
        data: { user: currentUser },
        error: null,
      })),
      signUp: vi.fn(async ({ email, password, options }) => {
        const user = createMockUser({ email, user_metadata: options?.data });
        const session = { user, access_token: 'mock-token', refresh_token: 'mock-refresh' };
        currentUser = user;
        currentSession = session;

        // Create profile
        const profile = createMockProfile(user.id, {
          username: options?.data?.username,
          display_name: options?.data?.full_name,
        });
        data.profiles.push(profile);

        triggerAuthChange('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      }),
      signInWithPassword: vi.fn(async ({ email, password }) => {
        // Find user by email in profiles
        const profile = data.profiles.find(p => p.email === email);
        if (profile) {
          const user = createMockUser({ id: profile.id, email });
          const session = { user, access_token: 'mock-token', refresh_token: 'mock-refresh' };
          currentUser = user;
          currentSession = session;
          triggerAuthChange('SIGNED_IN', session);
          return { data: { user, session }, error: null };
        }
        // For testing, accept any credentials
        const user = createMockUser({ email });
        const session = { user, access_token: 'mock-token', refresh_token: 'mock-refresh' };
        currentUser = user;
        currentSession = session;

        const newProfile = createMockProfile(user.id);
        data.profiles.push(newProfile);

        triggerAuthChange('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      }),
      signInWithOAuth: vi.fn(async ({ provider }) => {
        // OAuth would redirect, so we simulate success
        return { data: { url: 'https://mock-oauth.com/authorize' }, error: null };
      }),
      signOut: vi.fn(async () => {
        currentUser = null;
        currentSession = null;
        triggerAuthChange('SIGNED_OUT', null);
        return { error: null };
      }),
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn((callback) => {
        authCallbacks.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const index = authCallbacks.indexOf(callback);
                if (index > -1) authCallbacks.splice(index, 1);
              },
            },
          },
        };
      }),
    },
    from: vi.fn((tableName) => createQueryBuilder(tableName)),
    rpc: vi.fn(async (fnName, params) => {
      if (fnName === 'add_user_xp') {
        const profile = data.profiles.find(p => p.id === params.p_user_id);
        if (profile) {
          profile.xp += params.p_xp;
          // Check for level up
          const xpForNextLevel = profile.level * 100;
          if (profile.xp >= xpForNextLevel) {
            profile.level += 1;
            profile.xp -= xpForNextLevel;
            return { data: { leveled_up: true, new_level: profile.level }, error: null };
          }
          return { data: { leveled_up: false, new_level: profile.level }, error: null };
        }
      }
      return { data: null, error: null };
    }),
    functions: {
      invoke: vi.fn(async (fnName, { body } = {}) => {
        if (fnName === 'create-checkout-session') {
          return { data: { url: 'https://checkout.stripe.com/mock-session' }, error: null };
        }
        if (fnName === 'create-portal-session') {
          return { data: { url: 'https://billing.stripe.com/mock-portal' }, error: null };
        }
        return { data: null, error: null };
      }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ data: { path: 'mock-path' }, error: null })),
        download: vi.fn(async () => ({ data: new Blob(), error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock-storage.com/file' } })),
        remove: vi.fn(async () => ({ data: null, error: null })),
        list: vi.fn(async () => ({ data: [], error: null })),
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn(function() { return this; }),
      subscribe: vi.fn(() => ({})),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),

    // Test utilities
    _data: data,
    _setUser: (user) => { currentUser = user; },
    _setSession: (session) => { currentSession = session; },
    _triggerAuthChange: triggerAuthChange,
  };
};

// ============================================================================
// Test Utilities
// ============================================================================

export const getEndOfDay = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const getEndOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() + (7 - day);
  date.setDate(diff);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForLoadingToFinish = async () => {
  await wait(0);
};

// ============================================================================
// Test Wrapper Component
// ============================================================================

export const TestWrapper = ({ children, mockSupabase }) => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </AuthProvider>
  );
};

export const renderWithProviders = (ui, options = {}) => {
  const { mockSupabase, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper mockSupabase={mockSupabase}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  });
};

// ============================================================================
// Reset utilities
// ============================================================================

export const resetIdCounter = () => {
  idCounter = 1;
};

// Reset between tests
beforeEach(() => {
  resetIdCounter();
  vi.clearAllMocks();
  localStorage.clear();
});
