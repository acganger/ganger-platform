"use strict";
// API Authentication Middleware for App Router (Next.js 13+)
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = withAuth;
exports.withStaffAuth = withStaffAuth;
exports.withManagerAuth = withManagerAuth;
exports.withAdminAuth = withAdminAuth;
exports.withSuperAdminAuth = withSuperAdminAuth;
exports.withHIPAACompliance = withHIPAACompliance;
exports.createAuthenticatedRoute = createAuthenticatedRoute;
const server_1 = require("next/server");
const supabase_js_1 = require("@supabase/supabase-js");
const headers_1 = require("next/headers");
// Get Supabase client for server-side operations
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
}
// Extract token from request
function extractToken(request) {
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check cookies
    const cookieStore = (0, headers_1.cookies)();
    const sessionCookie = cookieStore.get('sb-auth-token');
    if (sessionCookie) {
        return sessionCookie.value;
    }
    return null;
}
// Base authentication wrapper for App Router
function withAuth(handler, options) {
    return async (request, context) => {
        try {
            const token = extractToken(request);
            if (!token) {
                return server_1.NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            const supabase = getSupabaseClient();
            // Verify the JWT token
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user) {
                return server_1.NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
            // Get full user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .eq('is_active', true)
                .single();
            if (userError || !userData) {
                return server_1.NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
            }
            const authUser = {
                id: userData.id,
                email: userData.email,
                role: userData.role,
                department: userData.department,
                locations: userData.locations || [],
                active: userData.is_active
            };
            // Check role authorization if specified
            if (options?.roles && !options.roles.includes(userData.role)) {
                return server_1.NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
            }
            // HIPAA compliance logging
            if (options?.requireHIPAA) {
                await supabase.from('audit_logs').insert({
                    user_id: userData.id,
                    action: 'api_access',
                    resource_type: 'protected_endpoint',
                    resource_id: request.url,
                    metadata: {
                        ip_address: request.headers.get('x-forwarded-for') ||
                            request.headers.get('x-real-ip') ||
                            'unknown',
                        user_agent: request.headers.get('user-agent'),
                        timestamp: new Date().toISOString()
                    }
                });
            }
            // Call the handler with authenticated context
            return await handler(request, { user: authUser, params: context?.params });
        }
        catch (error) {
            console.error('Auth middleware error:', error);
            return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    };
}
// Role-specific middleware helpers
function withStaffAuth(handler) {
    return withAuth(handler, { roles: ['staff', 'manager', 'admin', 'superadmin'] });
}
function withManagerAuth(handler) {
    return withAuth(handler, { roles: ['manager', 'admin', 'superadmin'] });
}
function withAdminAuth(handler) {
    return withAuth(handler, { roles: ['admin', 'superadmin'] });
}
function withSuperAdminAuth(handler) {
    return withAuth(handler, { roles: ['superadmin'] });
}
function withHIPAACompliance(handler) {
    return withAuth(handler, { requireHIPAA: true });
}
// Helper to create authenticated API routes
function createAuthenticatedRoute(handlers, options) {
    const authenticatedHandlers = {};
    for (const [method, handler] of Object.entries(handlers)) {
        if (handler) {
            authenticatedHandlers[method] = withAuth(handler, options);
        }
    }
    return authenticatedHandlers;
}
