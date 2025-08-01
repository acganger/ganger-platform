"use strict";
// Server-side Supabase utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseServerClient = createSupabaseServerClient;
exports.createSupabaseAdminClient = createSupabaseAdminClient;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || 'https://pfqtzmxxxhhsxmlddrta.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Create server client for API routes
function createSupabaseServerClient() {
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
// Create admin client with service role key
function createSupabaseAdminClient() {
    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
