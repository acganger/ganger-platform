// apps/clinical-staffing/src/lib/supabase.ts
/**
 * Clinical Staffing Supabase Configuration
 * Uses standardized Supabase setup from @ganger/config
 */

import { createClientSupabase, createServerSupabase } from '@ganger/config';

// Create client-side Supabase instance
export const supabase = createClientSupabase('clinical-staffing');

// Create server-side Supabase instance (for API routes)
export const supabaseServer = createServerSupabase('clinical-staffing');

// Export default client for compatibility
export default supabase;

// Re-export types for convenience
// export type { Database } from '@ganger/db';