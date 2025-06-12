// apps/checkin-kiosk/src/lib/supabase.ts
/**
 * Check-in Kiosk Supabase Configuration
 * Uses standardized Supabase setup from @ganger/config
 */

import { createClientSupabase, createServerSupabase } from '@ganger/config';

// Create client-side Supabase instance for kiosk
export const supabase = createClientSupabase('checkin-kiosk');

// Create server-side Supabase instance (for API routes)
export const supabaseServer = createServerSupabase('checkin-kiosk');

// Export default client for compatibility
export default supabase;

// Re-export types for convenience
export type { Database } from '@ganger/db';