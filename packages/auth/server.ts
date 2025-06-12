// Server-side authentication exports for API routes
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
} from './src/middleware/apiAuth';

export type {
  AuthenticatedRequest,
  AuthMiddlewareOptions
} from './src/middleware/apiAuth';

export { 
  createSupabaseServerClient, 
  createSupabaseAdminClient 
} from './src/utils/supabase';

export { 
  hasPermission, 
  hasRole, 
  hasLocationAccess, 
  canAccessRoute, 
  requirePermission, 
  requireRole,
  ROLE_PERMISSIONS 
} from './src/utils/permissions';

// For compatibility with existing imports
export async function getUserFromToken(req: any) {
  // Extract token from request
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies.auth_token;
  
  if (!token) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  
  try {
    // Validate session and get user
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('id', token)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (sessionError || !session) {
      return null;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .eq('active', true)
      .single();
    
    if (userError || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      locations: user.locations || [],
      active: user.is_active
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

import { createSupabaseServerClient } from './src/utils/supabase';