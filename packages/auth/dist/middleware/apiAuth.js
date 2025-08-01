"use strict";
// API Authentication Middleware for Server-side routes
Object.defineProperty(exports, "__esModule", { value: true });
exports.HIPAAComplianceError = exports.AuthorizationError = exports.AuthenticationError = void 0;
exports.withAuth = withAuth;
exports.withStaffAuth = withStaffAuth;
exports.withManagerAuth = withManagerAuth;
exports.withAdminAuth = withAdminAuth;
exports.withHIPAACompliance = withHIPAACompliance;
exports.withRateLimitedAuth = withRateLimitedAuth;
const supabase_1 = require("../utils/supabase");
// Custom error classes
class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(message = 'Insufficient permissions') {
        super(message);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class HIPAAComplianceError extends Error {
    constructor(message = 'HIPAA compliance check failed') {
        super(message);
        this.name = 'HIPAAComplianceError';
    }
}
exports.HIPAAComplianceError = HIPAAComplianceError;
// Base authentication middleware
function withAuth(handler, options) {
    return async (req, res) => {
        try {
            // Extract and validate session
            const supabase = (0, supabase_1.createSupabaseServerClient)();
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
                .from('users')
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
function withStaffAuth(handler) {
    return withAuth(handler, { roles: ['staff', 'manager', 'superadmin'] });
}
function withManagerAuth(handler) {
    return withAuth(handler, { roles: ['manager', 'superadmin'] });
}
function withAdminAuth(handler) {
    return withAuth(handler, { roles: ['superadmin'] });
}
function withHIPAACompliance(handler) {
    return withAuth(handler, { requireHIPAA: true });
}
function withRateLimitedAuth(handler, rateLimit) {
    return withAuth(handler, { rateLimit });
}
