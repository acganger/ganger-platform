import { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { supabase } from '../database/supabase-client';
import { auditLog } from '../security/audit-logger';
import { HIPAAComplianceService } from '../security/hipaa-compliance';
import { withRateLimit, RateLimits } from '@ganger/utils';

/**
 * Authentication and Authorization Middleware
 * Provides HIPAA-compliant access control for API endpoints
 */

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
  };
}

export interface AuthorizationOptions {
  requireAuth?: boolean;
  requiredRole?: string;
  requiredPermissions?: string[];
  allowBreakGlass?: boolean;
  requireBusinessJustification?: boolean;
  logPHIAccess?: boolean;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: AuthorizationOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const {
      requireAuth = true,
      requiredRole,
      requiredPermissions = [],
      allowBreakGlass = false,
      requireBusinessJustification = false,
      logPHIAccess = false
    } = options;

    try {
      // Skip auth for health checks and public endpoints
      if (!requireAuth) {
        return handler(req as AuthenticatedRequest, res);
      }

      // Extract and validate token
      const token = extractToken(req);
      if (!token) {
        await logAuthFailure('missing_token', req);
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify token and get user
      const user = await verifyToken(token, req);
      if (!user) {
        await logAuthFailure('invalid_token', req);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }

      // Check role-based access
      if (requiredRole && !hasRequiredRole(user, requiredRole)) {
        await logAuthFailure('insufficient_role', req, user.id);
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredRole,
          current: user.role
        });
      }

      // Check specific permissions
      if (requiredPermissions.length > 0 && !hasRequiredPermissions(user, requiredPermissions)) {
        await logAuthFailure('insufficient_permissions', req, user.id);
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermissions,
          current: user.permissions
        });
      }

      // HIPAA compliance checks
      if (logPHIAccess || isPHIEndpoint(req)) {
        const complianceService = new HIPAAComplianceService();
        
        const phiAccessRequest = {
          userId: user.id,
          userRole: user.role,
          resourceType: extractResourceType(req),
          resourceId: extractResourceId(req),
          accessReason: extractAccessReason(req, requireBusinessJustification),
          minimumNecessary: true, // Assume minimum necessary for now
          businessJustification: req.headers['x-business-justification'] as string
        };

        const accessValidation = await complianceService.validatePHIAccess(phiAccessRequest);
        
        if (!accessValidation.authorized) {
          await logAuthFailure('phi_access_denied', req, user.id, {
            reason: accessValidation.reason,
            resourceType: phiAccessRequest.resourceType,
            resourceId: phiAccessRequest.resourceId
          });
          
          return res.status(403).json({
            error: 'PHI access denied',
            reason: accessValidation.reason,
            complianceNote: 'Access denied per HIPAA minimum necessary standard'
          });
        }

        // Log authorized PHI access
        await auditLog({
          action: 'phi_access_granted',
          userId: user.id,
          userEmail: user.email,
          resource: phiAccessRequest.resourceType,
          resourceId: phiAccessRequest.resourceId,
          accessReason: phiAccessRequest.accessReason,
          phiAccessed: true,
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent'],
          requestPath: req.url,
          requestMethod: req.method,
          complianceNote: 'PHI access authorized and logged per HIPAA requirements'
        });
      }

      // Check for break-glass access
      const isBreakGlass = req.headers['x-break-glass'] === 'true';
      if (isBreakGlass) {
        if (!allowBreakGlass) {
          await logAuthFailure('break_glass_not_allowed', req, user.id);
          return res.status(403).json({ error: 'Break-glass access not permitted for this endpoint' });
        }

        const breakGlassReason = req.headers['x-break-glass-reason'] as string;
        if (!breakGlassReason) {
          return res.status(400).json({ error: 'Break-glass reason required' });
        }

        await auditLog({
          action: 'break_glass_access',
          userId: user.id,
          userEmail: user.email,
          resource: extractResourceType(req),
          resourceId: extractResourceId(req),
          accessReason: breakGlassReason,
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent'],
          requestPath: req.url,
          requestMethod: req.method,
          complianceNote: 'Emergency break-glass access granted - requires immediate review'
        });
      }

      // Rate limiting check
      const rateLimitResult = await checkRateLimit(user.id, req);
      if (!rateLimitResult.allowed) {
        await logAuthFailure('rate_limit_exceeded', req, user.id);
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        });
      }

      // Session validation
      const sessionValid = await validateSession(user.sessionId, req);
      if (!sessionValid) {
        await logAuthFailure('invalid_session', req, user.id);
        return res.status(401).json({ error: 'Session expired or invalid' });
      }

      // Update last activity
      await updateUserActivity(user.id, req);

      // Attach user to request
      (req as AuthenticatedRequest).user = user;

      // Log successful authentication
      await auditLog({
        action: 'api_access_authorized',
        userId: user.id,
        userEmail: user.email,
        resource: extractResourceType(req),
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'],
        requestPath: req.url,
        requestMethod: req.method,
        details: {
          role: user.role,
          permissions: user.permissions,
          breakGlass: isBreakGlass
        }
      });

      // Execute the handler
      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      
      await auditLog({
        action: 'auth_middleware_error',
        resource: 'authentication',
        error: error instanceof Error ? error.message : 'Unknown auth error',
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'],
        requestPath: req.url,
        requestMethod: req.method
      });

      return res.status(500).json({ 
        error: 'Authentication system error',
        message: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
      });
    }
  };
}

/**
 * Helper functions
 */

function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies as fallback
  const cookieToken = req.cookies.auth_token;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

async function verifyToken(token: string, req: NextApiRequest): Promise<{
  id: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
} | null> {
  try {
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile and permissions
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id, email, role,
        user_permissions(permission)
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    const permissions = profile.user_permissions?.map((p: any) => p.permission) || [];
    
    return {
      id: user.id,
      email: user.email || profile.email,
      role: profile.role,
      permissions,
      sessionId: generateSessionId(req)
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

function hasRequiredRole(user: any, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    'admin': 100,
    'manager': 80,
    'provider': 70,
    'nurse': 60,
    'medical_assistant': 50,
    'pharmacy_tech': 40,
    'billing': 30,
    'user': 10
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

function hasRequiredPermissions(user: any, requiredPermissions: string[]): boolean {
  if (user.role === 'admin') return true; // Admins have all permissions
  
  return requiredPermissions.every(permission => 
    user.permissions.includes(permission) || user.permissions.includes('*')
  );
}

function isPHIEndpoint(req: NextApiRequest): boolean {
  const phiEndpoints = [
    '/api/patients',
    '/api/authorizations',
    '/api/medical-records'
  ];
  
  return phiEndpoints.some(endpoint => req.url?.startsWith(endpoint));
}

function extractResourceType(req: NextApiRequest): string {
  const path = req.url?.split('?')[0] || '';
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length >= 2) {
    return pathParts[1]; // e.g., /api/patients -> patients
  }
  
  return 'unknown';
}

function extractResourceId(req: NextApiRequest): string {
  const path = req.url?.split('?')[0] || '';
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length >= 3) {
    return pathParts[2]; // e.g., /api/patients/123 -> 123
  }
  
  return '';
}

function extractAccessReason(req: NextApiRequest, required: boolean): string {
  const reason = req.headers['x-access-reason'] as string || 
                req.query.access_reason as string ||
                'API access for authorized business purpose';
  
  if (required && !req.headers['x-access-reason']) {
    throw new Error('Business justification required for this endpoint');
  }
  
  return reason;
}

function getClientIP(req: NextApiRequest): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}

function generateSessionId(req: NextApiRequest): string {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const timestamp = Date.now();
  
  return randomUUID();
}

async function checkRateLimit(userId: string, req: NextApiRequest): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  // Implement rate limiting logic
  // For now, return allowed
  return { allowed: true };
}

async function validateSession(sessionId: string, req: NextApiRequest): Promise<boolean> {
  // Implement session validation logic
  // Check if session is still valid, not expired, etc.
  return true;
}

async function updateUserActivity(userId: string, req: NextApiRequest): Promise<void> {
  try {
    await supabase
      .from('user_profiles')
      .update({ 
        last_activity: new Date().toISOString(),
        last_ip_address: getClientIP(req)
      })
      .eq('id', userId);
  } catch (error) {
    console.warn('Failed to update user activity:', error);
  }
}

async function logAuthFailure(
  reason: string, 
  req: NextApiRequest, 
  userId?: string,
  additionalDetails?: any
): Promise<void> {
  await auditLog({
    action: `auth_failure_${reason}`,
    userId,
    resource: 'authentication',
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'],
    requestPath: req.url,
    requestMethod: req.method,
    error: `Authentication failed: ${reason}`,
    details: additionalDetails,
    complianceNote: 'Authentication failure logged for security monitoring'
  });
}

/**
 * Role-based access control decorators
 */

export function requireRole(role: string) {
  return (options: AuthorizationOptions = {}) => 
    withAuth((req, res) => Promise.resolve(), { ...options, requiredRole: role });
}

export function requirePermissions(permissions: string[]) {
  return (options: AuthorizationOptions = {}) => 
    withAuth((req, res) => Promise.resolve(), { ...options, requiredPermissions: permissions });
}

export function requirePHIAccess(options: AuthorizationOptions = {}) {
  return withAuth((req, res) => Promise.resolve(), { 
    ...options, 
    logPHIAccess: true,
    requireBusinessJustification: true 
  });
}