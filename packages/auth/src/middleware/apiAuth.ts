import { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { createSupabaseServerClient } from '../utils/supabase';
import { hasRole, hasPermission } from '../utils/permissions';
import type { UserRole } from '../types';

// Extend NextApiRequest to include user
export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: UserRole;
    locations: string[];
    permissions: string[];
    sessionId: string;
  };
}

// Authentication middleware options
export interface AuthMiddlewareOptions {
  roles?: UserRole[];
  permissions?: Array<{ permission: string; resource?: string }>;
  locations?: string[];
  requireMFA?: boolean;
  requireActive?: boolean;
  auditLog?: boolean;
  hipaaCompliant?: boolean;
  allowServiceRole?: boolean;
}

// HIPAA compliance tracking
interface PHIAccessRequest {
  userId: string;
  patientId?: string;
  operation: string;
  accessReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Session management
interface UserSession {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
}

// Error types
export class AuthenticationError extends Error {
  constructor(message: string, public code: string = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code: string = 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class HIPAAComplianceError extends Error {
  constructor(message: string, public code: string = 'HIPAA_VIOLATION') {
    super(message);
    this.name = 'HIPAAComplianceError';
  }
}

// Get client IP address
function getClientIP(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    (req.headers['cf-connecting-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}

// Validate user session
async function validateSession(
  sessionToken: string,
  ipAddress: string,
  userAgent: string
): Promise<UserSession | null> {
  const supabase = createSupabaseServerClient();
  
  try {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !session) {
      return null;
    }
    
    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionToken);
    
    return {
      id: session.id,
      userId: session.user_id,
      expiresAt: new Date(session.expires_at),
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      lastActivity: new Date()
    };
    
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// Get user by ID with role and permissions
async function getUserWithPermissions(userId: string) {
  const supabase = createSupabaseServerClient();
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        permissions (
          action,
          resource
        )
      `)
      .eq('id', userId)
      .eq('active', true)
      .single();
    
    if (error || !user) {
      return null;
    }
    
    const permissions = user.permissions?.map((p: any) => ({
      action: p.action,
      resource: p.resource
    })) || [];
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role as UserRole,
      locations: user.locations || [],
      permissions,
      created_at: user.created_at,
      updated_at: user.updated_at,
      active: user.is_active,
      mfaEnabled: user.mfa_enabled || false
    };
    
  } catch (error) {
    console.error('User fetch error:', error);
    return null;
  }
}

// Log audit trail for HIPAA compliance
async function auditLog(entry: {
  action: string;
  userId: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  phiAccessed?: boolean;
  accessReason?: string;
  result: 'success' | 'failure';
  error?: string;
}) {
  const supabase = createSupabaseServerClient();
  
  try {
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      phi_accessed: entry.phiAccessed || false,
      access_reason: entry.accessReason,
      result: entry.result,
      error_message: entry.error,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

// Check HIPAA compliance requirements
async function checkHIPAACompliance(
  request: PHIAccessRequest,
  options: AuthMiddlewareOptions
): Promise<boolean> {
  if (!options.hipaaCompliant) {
    return true;
  }
  
  // Check if accessing PHI requires explicit reason
  if (request.patientId && !request.accessReason) {
    throw new HIPAAComplianceError('Access reason required for PHI access');
  }
  
  // Log PHI access attempt
  await auditLog({
    action: request.operation,
    userId: request.userId,
    resource: 'patient_data',
    resourceId: request.patientId,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    phiAccessed: !!request.patientId,
    accessReason: request.accessReason,
    result: 'success'
  });
  
  return true;
}

// Rate limiting check
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(userId: string, req: NextApiRequest): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  const key = `${userId}:${req.url}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime <= now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  return { allowed: true };
}

// Generate session ID
function generateSessionId(req: NextApiRequest): string {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const timestamp = Date.now();
  
  return randomUUID();
}

// Main authentication middleware
export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    
    try {
      // 1. Extract authentication token
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '') || req.cookies.auth_token;
      
      if (!token) {
        throw new AuthenticationError('Authentication token required');
      }
      
      // 2. Validate session
      const session = await validateSession(token, ipAddress, userAgent);
      if (!session) {
        throw new AuthenticationError('Invalid or expired session');
      }
      
      // 3. Get user with permissions
      const user = await getUserWithPermissions(session.userId);
      if (!user) {
        throw new AuthenticationError('User not found or inactive');
      }
      
      // 4. Check if user is active
      if (options.requireActive !== false && !user.active) {
        throw new AuthorizationError('User account is inactive');
      }
      
      // 5. Check role requirements
      if (options.roles && !hasRole(user, options.roles)) {
        throw new AuthorizationError('Insufficient role permissions');
      }
      
      // 6. Check permission requirements
      if (options.permissions) {
        const hasAllPermissions = options.permissions.every(({ permission, resource }) =>
          hasPermission(user, permission, resource)
        );
        
        if (!hasAllPermissions) {
          throw new AuthorizationError('Insufficient permissions');
        }
      }
      
      // 7. Check location access
      if (options.locations) {
        const hasLocationAccess = options.locations.some(location =>
          user.locations.includes(location) || user.role === 'superadmin'
        );
        
        if (!hasLocationAccess) {
          throw new AuthorizationError('Location access denied');
        }
      }
      
      // 8. Check MFA requirement
      if (options.requireMFA && !user.mfaEnabled) {
        throw new AuthorizationError('MFA required for this operation');
      }
      
      // 9. Rate limiting
      const rateLimitResult = await checkRateLimit(user.id, req);
      if (!rateLimitResult.allowed) {
        res.setHeader('Retry-After', rateLimitResult.retryAfter || 60);
        throw new AuthorizationError('Rate limit exceeded');
      }
      
      // 10. HIPAA compliance check
      if (options.hipaaCompliant) {
        await checkHIPAACompliance({
          userId: user.id,
          operation: `${req.method} ${req.url}`,
          ipAddress,
          userAgent
        }, options);
      }
      
      // 11. Audit logging
      if (options.auditLog) {
        await auditLog({
          action: `api_access:${req.method}:${req.url}`,
          userId: user.id,
          ipAddress,
          userAgent,
          result: 'success'
        });
      }
      
      // 12. Attach user to request
      (req as AuthenticatedRequest).user = {
        ...user,
        sessionId: session.id
      };
      
      // 13. Execute handler
      await handler(req as AuthenticatedRequest, res);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Log authentication/authorization failures
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        if (options.auditLog) {
          await auditLog({
            action: `auth_failure:${req.method}:${req.url}`,
            userId: 'unknown',
            ipAddress,
            userAgent,
            result: 'failure',
            error: error.message
          });
        }
        
        const statusCode = error instanceof AuthenticationError ? 401 : 403;
        return res.status(statusCode).json({
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString(),
          processingTime
        });
      }
      
      // Log other errors
      console.error('Authentication middleware error:', error);
      
      return res.status(500).json({
        error: 'Internal authentication error',
        code: 'AUTH_INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        processingTime
      });
    }
  };
}

// Convenience middleware factories
export function withStaffAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return withAuth(handler, {
    roles: ['staff', 'manager', 'superadmin'],
    auditLog: true,
    hipaaCompliant: true
  });
}

export function withManagerAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return withAuth(handler, {
    roles: ['manager', 'superadmin'],
    auditLog: true,
    hipaaCompliant: true
  });
}

export function withAdminAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return withAuth(handler, {
    roles: ['superadmin'],
    auditLog: true,
    hipaaCompliant: true,
    requireMFA: true
  });
}

export function withHIPAACompliance(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  additionalOptions: Omit<AuthMiddlewareOptions, 'hipaaCompliant' | 'auditLog'> = {}
) {
  return withAuth(handler, {
    ...additionalOptions,
    hipaaCompliant: true,
    auditLog: true
  });
}

// Rate limited middleware
export function withRateLimitedAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options: AuthMiddlewareOptions = {}
) {
  return withAuth(handler, {
    ...options,
    auditLog: true
  });
}