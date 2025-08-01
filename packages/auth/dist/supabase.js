"use strict";
// Universal Supabase Client for Ganger Platform Authentication
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.getSupabaseClient = getSupabaseClient;
exports.createAppSupabaseClient = createAppSupabaseClient;
exports.getTypedSupabaseClient = getTypedSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
const CookieStorage_1 = require("./utils/CookieStorage");
// Default configuration
const defaultConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfqtzmxxxhhsxmlddrta.supabase.co',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s',
    redirectUrl: 'https://staff.gangerdermatology.com/auth/callback',
    enableAuditLogging: true,
    sessionTimeout: 86400 // 24 hours
};
// Global Supabase client instance
let supabaseInstance = null;
/**
 * Get or create Supabase client instance
 */
function getSupabaseClient(config) {
    if (!supabaseInstance) {
        const finalConfig = { ...defaultConfig, ...config };
        supabaseInstance = (0, supabase_js_1.createClient)(finalConfig.supabaseUrl, finalConfig.supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: typeof window !== 'undefined' ? CookieStorage_1.gangerCookieStorage : undefined,
            },
            global: {
                headers: {
                    'X-Application': 'ganger-platform',
                    'X-Version': '1.0.0'
                }
            }
        });
    }
    return supabaseInstance;
}
/**
 * Default Supabase client for general use
 */
exports.supabase = getSupabaseClient();
/**
 * Create app-specific Supabase client with custom configuration
 */
function createAppSupabaseClient(appName, config) {
    const appConfig = {
        ...defaultConfig,
        ...config,
        redirectUrl: config?.redirectUrl || `https://staff.gangerdermatology.com/${appName}/auth/callback`
    };
    return (0, supabase_js_1.createClient)(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? CookieStorage_1.gangerCookieStorage : undefined,
        },
        global: {
            headers: {
                'X-Application': `ganger-platform-${appName}`,
                'X-Version': '1.0.0'
            }
        }
    });
}
/**
 * Get type-safe Supabase client
 */
function getTypedSupabaseClient(config) {
    return getSupabaseClient(config);
}
