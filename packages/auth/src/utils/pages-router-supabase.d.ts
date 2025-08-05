import { NextApiRequest, NextApiResponse } from 'next';
/**
 * Create a Supabase client for Next.js Pages Router API routes.
 * Handles server-side authentication with cross-domain cookie support.
 * This replaces the deprecated createServerSupabaseClient from @supabase/auth-helpers-nextjs.
 *
 * @template T - Database type for type-safe queries
 * @param {NextApiRequest} req - Next.js API request object
 * @param {NextApiResponse} res - Next.js API response object
 * @returns {SupabaseClient<T>} Configured Supabase client for server-side use
 *
 * @example
 * // In an API route (pages/api/user.ts)
 * import { createPagesRouterSupabaseClient } from '@ganger/auth';
 *
 * export default async function handler(req, res) {
 *   const supabase = createPagesRouterSupabaseClient(req, res);
 *
 *   const { data: { user }, error } = await supabase.auth.getUser();
 *
 *   if (!user) {
 *     return res.status(401).json({ error: 'Unauthorized' });
 *   }
 *
 *   // Fetch user data
 *   const { data } = await supabase
 *     .from('profiles')
 *     .select('*')
 *     .eq('id', user.id)
 *     .single();
 *
 *   res.status(200).json(data);
 * }
 */
export declare function createPagesRouterSupabaseClient<T = any>(req: NextApiRequest, res: NextApiResponse): import("@supabase/supabase-js").SupabaseClient<T, "public" extends keyof T ? keyof T & "public" : string & keyof T, T["public" extends keyof T ? keyof T & "public" : string & keyof T] extends import("@supabase/supabase-js/dist/module/lib/types").GenericSchema ? T["public" extends keyof T ? keyof T & "public" : string & keyof T] : any>;
/**
 * Backward-compatible alias for createPagesRouterSupabaseClient.
 * Use createPagesRouterSupabaseClient for new code.
 *
 * @deprecated Use createPagesRouterSupabaseClient instead
 */
export declare const createServerSupabaseClient: typeof createPagesRouterSupabaseClient;
