import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { errorTracking } from '@ganger/monitoring';
import type { User } from '@supabase/supabase-js';

export interface ApiRequest extends NextApiRequest {
  user?: User;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  allowedMethods?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common API errors
export const ApiErrors = {
  badRequest: (message = 'Bad request') => new ApiError(400, message, 'BAD_REQUEST'),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, message, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => new ApiError(403, message, 'FORBIDDEN'),
  notFound: (message = 'Not found') => new ApiError(404, message, 'NOT_FOUND'),
  methodNotAllowed: (method: string) => new ApiError(405, `Method ${method} not allowed`, 'METHOD_NOT_ALLOWED'),
  conflict: (message = 'Conflict') => new ApiError(409, message, 'CONFLICT'),
  tooManyRequests: (message = 'Too many requests') => new ApiError(429, message, 'TOO_MANY_REQUESTS'),
  internal: (message = 'Internal server error') => new ApiError(500, message, 'INTERNAL_ERROR'),
  notImplemented: (message = 'Not implemented') => new ApiError(501, message, 'NOT_IMPLEMENTED'),
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Standard API handler wrapper with auth, error handling, and monitoring
 */
export function createApiHandler<T = any>(
  handler: (req: ApiRequest, res: NextApiResponse<ApiResponse<T>>) => Promise<void>,
  options: ApiHandlerOptions = {}
) {
  const {
    requireAuth = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
    rateLimit
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => {
    const startTime = performance.now();
    let statusCode = 200;

    try {
      // Check allowed methods
      if (!allowedMethods.includes(req.method || '')) {
        throw ApiErrors.methodNotAllowed(req.method || 'UNKNOWN');
      }

      // Apply rate limiting
      if (rateLimit && req.method !== 'GET') {
        const clientId = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const key = `${clientId}:${req.url}`;
        const now = Date.now();
        
        const limit = rateLimitStore.get(key);
        if (limit && limit.resetTime > now) {
          if (limit.count >= rateLimit.requests) {
            throw ApiErrors.tooManyRequests(
              `Rate limit exceeded. Try again in ${Math.ceil((limit.resetTime - now) / 1000)} seconds`
            );
          }
          limit.count++;
        } else {
          rateLimitStore.set(key, {
            count: 1,
            resetTime: now + rateLimit.windowMs
          });
        }
      }

      // Authentication
      let user: User | undefined;
      if (requireAuth) {
        const supabase = createSupabaseServerClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          throw ApiErrors.unauthorized('Authentication required');
        }
        
        user = session.user;
      }

      // Add user to request
      const apiReq = req as ApiRequest;
      apiReq.user = user;

      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Call the handler
      await handler(apiReq, res);
      
      statusCode = res.statusCode;
    } catch (error) {
      // Handle errors
      if (error instanceof ApiError) {
        statusCode = error.statusCode;
        res.status(statusCode).json({
          error: error.message,
          status: statusCode,
          ...(error.code && { code: error.code })
        });
      } else if (error instanceof Error) {
        console.error('Unhandled API error:', error);
        
        // Log to monitoring in production
        if (process.env.NODE_ENV === 'production') {
          errorTracking.trackError(error, {
            endpoint: req.url,
            method: req.method,
            userId: (req as ApiRequest).user?.id
          });
        }
        
        statusCode = 500;
        res.status(500).json({
          error: 'Internal server error',
          status: 500
        });
      } else {
        statusCode = 500;
        res.status(500).json({
          error: 'An unexpected error occurred',
          status: 500
        });
      }
    } finally {
      // Track performance metrics
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'production' && req.url) {
        errorTracking.trackPerformance({
          name: 'api_request_duration',
          value: duration,
          unit: 'ms',
          timestamp: new Date().toISOString(),
          tags: {
            endpoint: req.url,
            method: req.method || 'UNKNOWN',
            status: statusCode.toString(),
            authenticated: options.requireAuth ? 'true' : 'false'
          }
        });
      }
    }
  };
}

// Validation helpers
export function validateBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): T {
  const missing = requiredFields.filter(field => !body[field]);
  if (missing.length > 0) {
    throw ApiErrors.badRequest(`Missing required fields: ${missing.join(', ')}`);
  }
  return body as T;
}

export function validateQuery(
  query: NextApiRequest['query'],
  validParams: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (validParams.includes(key)) {
      result[key] = Array.isArray(value) ? value[0] : value;
    }
  }
  
  return result;
}

// Response helpers
export function successResponse<T>(
  res: NextApiResponse<ApiResponse<T>>,
  data: T,
  message?: string,
  statusCode = 200
) {
  res.status(statusCode).json({
    data,
    message,
    status: statusCode
  });
}

export function errorResponse(
  res: NextApiResponse,
  error: string | Error,
  statusCode = 500
) {
  const message = error instanceof Error ? error.message : error;
  res.status(statusCode).json({
    error: message,
    status: statusCode
  });
}