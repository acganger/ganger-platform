// API Authentication Middleware for App Router (Next.js 13+)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
// Get Supabase client for server-side operations
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
    }
    return createClient(supabaseUrl, supabaseKey);
}
// Extract token from request
function extractToken(request) {
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check cookies
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('sb-auth-token');
    if (sessionCookie) {
        return sessionCookie.value;
    }
    return null;
}
// Base authentication wrapper for App Router
export function withAuth(handler, options) {
    return async (request, context) => {
        try {
            const token = extractToken(request);
            if (!token) {
                return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            const supabase = getSupabaseClient();
            // Verify the JWT token
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user) {
                return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
            // Get full user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .eq('is_active', true)
                .single();
            if (userError || !userData) {
                return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
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
                return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    };
}
// Role-specific middleware helpers
export function withStaffAuth(handler) {
    return withAuth(handler, { roles: ['staff', 'manager', 'admin', 'superadmin'] });
}
export function withManagerAuth(handler) {
    return withAuth(handler, { roles: ['manager', 'admin', 'superadmin'] });
}
export function withAdminAuth(handler) {
    return withAuth(handler, { roles: ['admin', 'superadmin'] });
}
export function withSuperAdminAuth(handler) {
    return withAuth(handler, { roles: ['superadmin'] });
}
export function withHIPAACompliance(handler) {
    return withAuth(handler, { requireHIPAA: true });
}
// Helper to create authenticated API routes
export function createAuthenticatedRoute(handlers, options) {
    const authenticatedHandlers = {};
    for (const [method, handler] of Object.entries(handlers)) {
        if (handler) {
            authenticatedHandlers[method] = withAuth(handler, options);
        }
    }
    return authenticatedHandlers;
}
