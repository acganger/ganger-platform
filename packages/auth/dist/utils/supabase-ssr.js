"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrowserSupabaseClient = createBrowserSupabaseClient;
exports.createServerSupabaseClient = createServerSupabaseClient;
exports.createApiRouteSupabaseClient = createApiRouteSupabaseClient;
exports.getCookiesToSet = getCookiesToSet;
// SSR-compatible Supabase client with cross-domain cookie support
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfqtzmxxxhhsxmlddrta.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s';
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
function createBrowserSupabaseClient() {
    return (0, ssr_1.createBrowserClient)(supabaseUrl, supabaseAnonKey, {
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
function createServerSupabaseClient() {
    const cookieStore = (0, headers_1.cookies)();
    return (0, ssr_1.createServerClient)(supabaseUrl, supabaseAnonKey, {
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
function createApiRouteSupabaseClient(req) {
    return (0, ssr_1.createServerClient)(supabaseUrl, supabaseAnonKey, {
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
function getCookiesToSet(req) {
    return req._setCookies || [];
}
