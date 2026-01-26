import { vi } from 'vitest';

// Mock Supabase client for testing

// Create a chainable mock query builder
export function createMockQueryBuilder(mockData = [], mockError = null) {
  const builder = {
    data: mockData,
    error: mockError,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() =>
      Promise.resolve({
        data: Array.isArray(mockData) ? mockData[0] : mockData,
        error: mockError
      })
    ),
    maybeSingle: vi.fn().mockImplementation(() =>
      Promise.resolve({
        data: Array.isArray(mockData) ? mockData[0] : mockData,
        error: mockError
      })
    ),
    then: (resolve) => resolve({ data: mockData, error: mockError }),
  };

  // Make the builder thenable (for async/await)
  builder[Symbol.toStringTag] = 'Promise';
  builder.then = (resolve) => Promise.resolve({ data: mockData, error: mockError }).then(resolve);
  builder.catch = (reject) => Promise.resolve({ data: mockData, error: mockError }).catch(reject);
  builder.finally = (fn) => Promise.resolve({ data: mockData, error: mockError }).finally(fn);

  return builder;
}

// Create mock channel for realtime subscriptions
export function createMockChannel() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };
  return channel;
}

// Create the full mock supabase client
export function createMockSupabase(options = {}) {
  const {
    mockData = [],
    mockError = null,
    rpcResponse = { data: null, error: null },
  } = options;

  const mockChannel = createMockChannel();

  return {
    from: vi.fn().mockImplementation(() => createMockQueryBuilder(mockData, mockError)),
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue(rpcResponse),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.url/file.jpg' } }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
}

// Default mock instance
export const mockSupabase = createMockSupabase();

// Export for easy mocking of supabase module
export default mockSupabase;
