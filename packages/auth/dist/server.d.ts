export { withAuth, withStaffAuth, withManagerAuth, withAdminAuth, withHIPAACompliance, withRateLimitedAuth, AuthenticationError, AuthorizationError, HIPAAComplianceError } from './src/middleware/apiAuth';
export type { AuthenticatedRequest, AuthMiddlewareOptions } from './src/middleware/apiAuth';
export { createSupabaseServerClient, createSupabaseAdminClient } from './src/utils/supabase';
export { hasPermission, hasRole, hasLocationAccess, canAccessRoute, requirePermission, requireRole, ROLE_PERMISSIONS } from './src/utils/permissions';
export declare function getUserFromToken(req: any): Promise<{
    id: any;
    email: any;
    role: any;
    department: any;
    locations: any;
    active: any;
} | null>;
