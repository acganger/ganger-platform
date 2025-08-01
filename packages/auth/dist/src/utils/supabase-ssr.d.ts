/**
 * Create a Supabase client for browser/client components
 */
export declare function createBrowserSupabaseClient(): import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
/**
 * Create a Supabase client for server components/API routes
 */
export declare function createServerSupabaseClient(): import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
/**
 * Create a Supabase client for API routes with custom request/response
 */
export declare function createApiRouteSupabaseClient(req: Request): import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
/**
 * Helper to get cookies set during API route processing
 */
export declare function getCookiesToSet(req: Request): string[];
