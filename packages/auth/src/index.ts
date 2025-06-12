// Hooks
export { useAuth } from './hooks/useAuth';

// Providers
export { AuthProvider, useAuthContext } from './providers/AuthProvider';

// Middleware & HOCs (Client-side React components)
export { 
  withAuth as withAuthComponent, 
  withRoles, 
  withPermissions, 
  withManagerAccess, 
  withAdminAccess, 
  withStaffAccess 
} from './middleware/withAuth';

// API Middleware (Server-side Next.js API routes)
export {
  withAuth,
  withStaffAuth,
  withManagerAuth,
  withAdminAuth,
  withHIPAACompliance,
  withRateLimitedAuth,
  AuthenticationError,
  AuthorizationError,
  HIPAAComplianceError
} from './middleware/apiAuth';
export type {
  AuthenticatedRequest,
  AuthMiddlewareOptions
} from './middleware/apiAuth';

// Utilities
export { 
  createSupabaseBrowserClient, 
  createSupabaseServerClient, 
  createSupabaseAdminClient 
} from './utils/supabase';
export { 
  hasPermission, 
  hasRole, 
  hasLocationAccess, 
  canAccessRoute, 
  requirePermission, 
  requireRole,
  ROLE_PERMISSIONS 
} from './utils/permissions';

// Types
export type { 
  User, 
  UserRole, 
  Permission, 
  AuthSession, 
  AuthError, 
  LoginCredentials, 
  SignUpData, 
  AuthConfig,
  RolePermissions 
} from './types';
export type { Database } from './types/database';