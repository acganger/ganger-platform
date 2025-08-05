// API Authentication Middleware for Server-side routes
import { createSupabaseServerClient } from '../utils/supabase';
// Custom error classes
export class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends Error {
    constructor(message = 'Insufficient permissions') {
        super(message);
        this.name = 'AuthorizationError';
    }
}
export class HIPAAComplianceError extends Error {
    constructor(message = 'HIPAA compliance check failed') {
        super(message);
        this.name = 'HIPAAComplianceError';
    }
}
// Base authentication middleware
export function withAuth(handler, options) {
    return async (req, res) => {
        try {
            // Extract and validate session
            const supabase = createSupabaseServerClient();
            const authHeader = req.headers.authorization;
            const token = authHeader?.replace('Bearer ', '') || req.cookies.auth_token;
            if (!token) {
                throw new AuthenticationError('No authentication token provided');
            }
            // Get user from session
            const { data: session, error: sessionError } = await supabase
                .from('user_sessions')
                .select('user_id')
                .eq('id', token)
                .gt('expires_at', new Date().toISOString())
                .single();
            if (sessionError || !session) {
                throw new AuthenticationError('Invalid or expired session');
            }
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user_id)
                .eq('is_active', true)
                .single();
            if (userError || !user) {
                throw new AuthenticationError('User not found or inactive');
            }
            // Attach user to request
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                department: user.department,
                locations: user.locations || [],
                active: user.is_active
            };
            // Check role authorization if specified
            if (options?.roles && !options.roles.includes(user.role)) {
                throw new AuthorizationError(`Required role: ${options.roles.join(' or ')}`);
            }
            // HIPAA compliance check
            if (options?.requireHIPAA) {
                // Log access for HIPAA compliance
                await supabase.from('audit_logs').insert({
                    user_id: user.id,
                    action: 'api_access',
                    resource_type: 'protected_endpoint',
                    resource_id: req.url,
                    metadata: {
                        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                        user_agent: req.headers['user-agent'],
                        timestamp: new Date().toISOString()
                    }
                });
            }
            // Continue to handler
            await handler(req, res);
        }
        catch (error) {
            if (error instanceof AuthenticationError) {
                res.status(401).json({ error: error.message });
            }
            else if (error instanceof AuthorizationError) {
                res.status(403).json({ error: error.message });
            }
            else if (error instanceof HIPAAComplianceError) {
                res.status(500).json({ error: error.message });
            }
            else {
                console.error('Auth middleware error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };
}
// Role-specific middleware
export function withStaffAuth(handler) {
    return withAuth(handler, { roles: ['staff', 'manager', 'superadmin'] });
}
export function withManagerAuth(handler) {
    return withAuth(handler, { roles: ['manager', 'superadmin'] });
}
export function withAdminAuth(handler) {
    return withAuth(handler, { roles: ['superadmin'] });
}
export function withHIPAACompliance(handler) {
    return withAuth(handler, { requireHIPAA: true });
}
export function withRateLimitedAuth(handler, rateLimit) {
    return withAuth(handler, { rateLimit });
}
