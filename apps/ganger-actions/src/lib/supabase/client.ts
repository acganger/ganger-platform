import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Singleton pattern to prevent multiple client instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Factory function to create/get Supabase client
export const getSupabase = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  
  return supabaseInstance;
};

// Export supabase as a getter for backward compatibility
export const supabase = getSupabase();

// Alternative client for components that need auth helpers
export const createSupabaseClient = () => createClientComponentClient();

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  return !!user;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const client = getSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};