// apps/clinical-staffing/src/lib/supabase.ts
/**
 * Clinical Staffing Supabase Configuration
 * Direct Supabase setup for static export
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

// Create client-side Supabase instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export default client for compatibility
export default supabase;