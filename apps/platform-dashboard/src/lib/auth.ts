// Real Auth Implementation for Platform Dashboard
// Production-ready authentication with Supabase JWT validation

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'staff' | 'manager' | 'superadmin' | 'clinical_staff' | 'pharma_rep' | 'patient' | 'vinya_tech';
    locations: string[];
    permissions: string[];
    sessionId: string;
    avatar_url?: string;
  };
}

export interface AuthMiddlewareOptions {
  roles?: string[];
  requireAll?: boolean;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Extract token from Authorization header or cookie
      let token: string | null = null;
      
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
      } else if (req.headers.cookie) {
        // Extract token from cookie (simplified)
        const match = req.headers.cookie.match(/sb-access-token=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' }
        });
      }
      
      // Get user profile with role and permissions
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError || !userProfile) {
        return res.status(403).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User profile not found' }
        });
      }
      
      // Check if user is active
      if (!userProfile.is_active) {
        return res.status(403).json({
          success: false,
          error: { code: 'USER_INACTIVE', message: 'User account is inactive' }
        });
      }
      
      // Check role permissions
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(userProfile.role)) {
          return res.status(403).json({
            success: false,
            error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions' }
          });
        }
      }
      
      // Create authenticated user object
      const authenticatedUser = {
        id: user.id,
        email: user.email!,
        name: userProfile.name || user.user_metadata?.name,
        role: userProfile.role,
        locations: userProfile.locations || ['unknown'],
        permissions: userProfile.permissions || [],
        sessionId: generateSessionId(),
        avatar_url: user.user_metadata?.avatar_url || userProfile.avatar_url
      };
      
      // Add user to request
      (req as AuthenticatedRequest).user = authenticatedUser;
      
      // Log authentication for audit trail
      await logAuthEvent(authenticatedUser.id, req.method || 'GET', req.url || '');
      
      return handler(req as AuthenticatedRequest, res);
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Authentication system error' }
      });
    }
  };
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function logAuthEvent(userId: string, method: string, url: string) {
  try {
    await supabaseAdmin
      .from('user_activity_log')
      .insert({
        user_id: userId,
        activity_type: 'api_access',
        target_action: `${method} ${url}`,
        metadata: {
          timestamp: new Date().toISOString(),
          method,
          url
        }
      });
  } catch (error) {
    // Silently fail - don't break the request for logging issues
  }
}