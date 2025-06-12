import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '../lib/auth-utils';
import { AuthenticationError, AuthorizationError, withErrorHandler } from './errorHandler';
import { auditLog } from '../lib/auth-utils';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    department?: string;
    active: boolean;
  };
}

export interface AuthOptions {
  requiredPermissions?: string[];
  requiredRole?: string;
  allowSelf?: boolean; // Allow users to access their own data
  bypassAuth?: boolean; // For public endpoints
}

type AuthenticatedHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function withAuth(handler: AuthenticatedHandler, options: AuthOptions = {}): Handler {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    // Bypass authentication for public endpoints
    if (options.bypassAuth) {
      return handler(req as AuthenticatedRequest, res);
    }

    // Extract user from token
    const user = await getUserFromToken(req);
    
    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!user.active) {
      throw new AuthenticationError('Account is disabled');
    }

    // Check role requirements
    if (options.requiredRole && user.role !== options.requiredRole && user.role !== 'admin') {
      throw new AuthorizationError(`Required role: ${options.requiredRole}`);
    }

    // Get user metadata with defaults
    const userMeta = user as any;
    const userPermissions = userMeta.permissions || [];
    const userName = userMeta.name || user.email;
    
    // Check permission requirements
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasRequiredPermissions = options.requiredPermissions.every(permission => 
        userPermissions.includes(permission) || user.role === 'admin'
      );
      
      if (!hasRequiredPermissions) {
        throw new AuthorizationError(`Required permissions: ${options.requiredPermissions.join(', ')}`);
      }
    }

    // Handle self-access for user-specific resources
    if (options.allowSelf && req.query.id) {
      const resourceId = req.query.id as string;
      const canAccessSelf = user.id === resourceId || user.email === resourceId;
      const hasGeneralAccess = user.role === 'admin' || userPermissions.includes('compliance:view-all');
      
      if (!canAccessSelf && !hasGeneralAccess) {
        throw new AuthorizationError('Can only access your own data');
      }
    }

    // Audit log for authenticated requests
    await auditLog({
      action: 'api_access',
      userId: user.id,
      userEmail: user.email,
      metadata: {
        method: req.method,
        url: req.url,
        userRole: user.role,
        userPermissions: userPermissions
      }
    });

    // Attach user to request with proper typing
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      name: userName,
      role: user.role,
      permissions: userPermissions,
      department: user.department,
      active: user.active
    };
    
    return handler(req as AuthenticatedRequest, res);
  });
}

// Specific auth wrappers for common scenarios
export function withAdminAuth(handler: AuthenticatedHandler): Handler {
  return withAuth(handler, { requiredRole: 'admin' });
}

export function withComplianceViewAuth(handler: AuthenticatedHandler): Handler {
  return withAuth(handler, { requiredPermissions: ['compliance:view'] });
}

export function withComplianceSyncAuth(handler: AuthenticatedHandler): Handler {
  return withAuth(handler, { requiredPermissions: ['compliance:sync'] });
}

export function withSelfOrAdminAuth(handler: AuthenticatedHandler): Handler {
  return withAuth(handler, { allowSelf: true });
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: Handler,
  options: { maxRequests: number; windowMs: number; keyGenerator?: (req: NextApiRequest) => string }
): Handler {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : 
      req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown';
    
    const now = Date.now();
    const limit = rateLimitMap.get(key);
    
    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
    } else {
      // Increment count
      limit.count++;
      rateLimitMap.set(key, limit);
      
      if (limit.count > options.maxRequests) {
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', limit.resetTime.toString());
        
        throw new Error('Rate limit exceeded');
      }
    }
    
    // Set rate limit headers
    const remaining = Math.max(0, options.maxRequests - (limit?.count || 0));
    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', (limit?.resetTime || now + options.windowMs).toString());
    
    return handler(req, res);
  });
}

// Method validation middleware
export function withMethods(handler: Handler, allowedMethods: string[]): Handler {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    if (!allowedMethods.includes(req.method || '')) {
      res.setHeader('Allow', allowedMethods.join(', '));
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
        }
      });
    }
    
    return handler(req, res);
  });
}

// CORS middleware for API endpoints
export function withCORS(handler: Handler, origins: string[] = ['*']): Handler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const origin = req.headers.origin as string;
    
    if (origins.includes('*') || origins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    return handler(req, res);
  };
}

// Request validation middleware
export function withValidation<T>(
  handler: Handler,
  schema: (data: any) => T,
  target: 'body' | 'query' = 'body'
): Handler {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const data = target === 'body' ? req.body : req.query;
      req[target] = schema(data);
    } catch (error) {
      throw new Error(`Validation error: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
    
    return handler(req, res);
  });
}