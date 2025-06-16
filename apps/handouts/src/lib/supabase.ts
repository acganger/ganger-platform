// Mock client that can be used during build without calling createClient
const mockClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
        order: () => Promise.resolve({ data: [], error: null })
      }),
      order: () => Promise.resolve({ data: [], error: null })
    }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
    })
  })
} as any;

// Lazy-loaded Supabase client to avoid build-time issues
let _supabaseClient: any = null;

async function createSupabaseClient() {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time or when environment variables are missing
  if (!supabaseUrl || !supabaseAnonKey || typeof window === 'undefined') {
    console.warn('Supabase environment variables not found or running in build mode, using mock client');
    return mockClient;
  }

  // Dynamic import to avoid module-level evaluation
  const { createClient } = await import('@supabase/supabase-js');

  // Create and cache the real client
  _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return _supabaseClient;
}

// Export as property for backward compatibility - this will be lazy loaded
export const supabase = new Proxy(mockClient, {
  get(target, prop) {
    // For build-time, return the mock client properties
    if (typeof window === 'undefined') {
      return target[prop];
    }
    
    // For runtime, return a promise that resolves to the real client
    return new Proxy(() => {}, {
      apply: async (fn, thisArg, args) => {
        const client = await createSupabaseClient();
        return client[prop]?.apply(client, args);
      },
      get: async (fn, innerProp) => {
        const client = await createSupabaseClient();
        return client[prop]?.[innerProp];
      }
    });
  }
});

export default supabase;