// Pages Router (API Routes) Supabase client with cross-domain cookie support
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh';

// Cookie options for cross-domain SSO
const cookieOptions = {
  domain: '.gangerdermatology.com', // Allow cookies across all subdomains
  secure: true, // HTTPS only
  sameSite: 'lax' as const,
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
};

/**
 * Create a Supabase client for Pages Router API routes
 * This replaces the deprecated createServerSupabaseClient from @supabase/auth-helpers-nextjs
 */
export function createPagesRouterSupabaseClient<T = any>(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return createServerClient<T>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options?: CookieOptions) {
          const opts = { ...cookieOptions, ...options };
          // Serialize cookie properly
          const cookieStr = `${name}=${value}; Domain=${opts.domain}; Path=${opts.path}; ${
            opts.secure ? 'Secure; ' : ''
          }SameSite=${opts.sameSite}; ${
            opts.httpOnly ? 'HttpOnly; ' : ''
          }Max-Age=${opts.maxAge}`;
          
          // Set cookie in response header
          const existingCookies = res.getHeader('Set-Cookie');
          if (existingCookies) {
            if (Array.isArray(existingCookies)) {
              res.setHeader('Set-Cookie', [...existingCookies, cookieStr]);
            } else {
              res.setHeader('Set-Cookie', [existingCookies as string, cookieStr]);
            }
          } else {
            res.setHeader('Set-Cookie', cookieStr);
          }
        },
        remove(name: string, options?: CookieOptions) {
          const opts = { ...cookieOptions, ...options };
          const cookieStr = `${name}=; Domain=${opts.domain}; Path=${opts.path}; Max-Age=0; ${
            opts.httpOnly ? 'HttpOnly; ' : ''
          }`;
          
          // Set cookie removal in response header
          const existingCookies = res.getHeader('Set-Cookie');
          if (existingCookies) {
            if (Array.isArray(existingCookies)) {
              res.setHeader('Set-Cookie', [...existingCookies, cookieStr]);
            } else {
              res.setHeader('Set-Cookie', [existingCookies as string, cookieStr]);
            }
          } else {
            res.setHeader('Set-Cookie', cookieStr);
          }
        }
      }
    }
  );
}

// Export with backward-compatible name
export const createServerSupabaseClient = createPagesRouterSupabaseClient;