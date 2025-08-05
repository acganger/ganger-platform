// SSR-compatible Supabase client with cross-domain cookie support
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supa.gangerdermatology.com';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_q-yj56RH8zrMVH-4cRazWA_PI2pBoeh';
// Cookie options for cross-domain SSO
const cookieOptions = {
    domain: '.gangerdermatology.com', // Allow cookies across all subdomains
    secure: true, // HTTPS only
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
};
/**
 * Create a Supabase client for browser/client components
 */
export function createBrowserSupabaseClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                if (typeof document === 'undefined')
                    return undefined;
                const cookies = document.cookie.split('; ');
                const cookie = cookies.find(c => c.startsWith(`${name}=`));
                return cookie?.split('=')[1];
            },
            set(name, value, options) {
                if (typeof document === 'undefined')
                    return;
                const opts = { ...cookieOptions, ...options };
                const cookieStr = `${name}=${value}; Domain=${opts.domain}; Path=${opts.path}; ${opts.secure ? 'Secure;' : ''} SameSite=${opts.sameSite}; Max-Age=${opts.maxAge}`;
                document.cookie = cookieStr;
            },
            remove(name, options) {
                if (typeof document === 'undefined')
                    return;
                const opts = { ...cookieOptions, ...options };
                document.cookie = `${name}=; Domain=${opts.domain}; Path=${opts.path}; Max-Age=0`;
            }
        }
    });
}
/**
 * Create a Supabase client for server components/API routes
 */
export function createServerSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                return cookieStore.get(name)?.value;
            },
            set(name, value, options) {
                try {
                    const opts = { ...cookieOptions, ...options };
                    cookieStore.set(name, value, opts);
                }
                catch (error) {
                    // Cookies can only be set in Server Actions or API routes
                    // Ignore errors in server components
                }
            },
            remove(name, options) {
                try {
                    const opts = { ...cookieOptions, ...options };
                    cookieStore.set(name, '', { ...opts, maxAge: 0 });
                }
                catch (error) {
                    // Cookies can only be removed in Server Actions or API routes
                    // Ignore errors in server components
                }
            }
        }
    });
}
/**
 * Create a Supabase client for API routes with custom request/response
 */
export function createApiRouteSupabaseClient(req) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                const cookieHeader = req.headers.get('cookie');
                if (!cookieHeader)
                    return undefined;
                const cookies = cookieHeader.split('; ');
                const cookie = cookies.find(c => c.startsWith(`${name}=`));
                return cookie?.split('=')[1];
            },
            set(name, value, options) {
                // Cookies are set via response headers in API routes
                const opts = { ...cookieOptions, ...options };
                const cookieValue = `${name}=${value}; Domain=${opts.domain}; Path=${opts.path}; ${opts.secure ? 'Secure;' : ''} SameSite=${opts.sameSite}; Max-Age=${opts.maxAge}; ${opts.httpOnly ? 'HttpOnly;' : ''}`;
                // Store in a way that can be retrieved later for the response
                req._setCookies = req._setCookies || [];
                req._setCookies.push(cookieValue);
            },
            remove(name, options) {
                const opts = { ...cookieOptions, ...options };
                const cookieValue = `${name}=; Domain=${opts.domain}; Path=${opts.path}; Max-Age=0`;
                req._setCookies = req._setCookies || [];
                req._setCookies.push(cookieValue);
            }
        }
    });
}
/**
 * Helper to get cookies set during API route processing
 */
export function getCookiesToSet(req) {
    return req._setCookies || [];
}
