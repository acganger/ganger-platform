/**
 * Enterprise-Grade API Validation Middleware
 * 
 * Provides comprehensive request validation, rate limiting, and security
 * controls for all API endpoints in the clinical staffing system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as crypto from 'crypto';
import { 
  createValidationError, 
  createRateLimitError, 
  createBusinessRuleError,
  errorToResponse,
  generateRequestId,
  auditSecurityEvent,
  secureLogger,
  type StructuredError
} from './secure-error-handler';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

// API validation configuration
interface ValidationConfig {
  maxRequestSize?: number; // Maximum request body size in bytes
  allowedMethods?: string[]; // Allowed HTTP methods
  requireAuth?: boolean; // Require authentication
  rateLimiting?: RateLimitConfig;
  customValidators?: ((request: NextRequest) => Promise<void>)[];
}

// Request context for validation
interface RequestContext {
  requestId: string;
  timestamp: Date;
  method: string;
  path: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  contentLength?: number;
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of Array.from(rateLimitStore.entries())) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limiting for a request
 */
function checkRateLimit(
  request: NextRequest, 
  config: RateLimitConfig,
  context: RequestContext
): boolean {
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupRateLimitStore();
  }

  const key = config.keyGenerator 
    ? config.keyGenerator(request)
    : context.ipAddress || 'unknown';

  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true;
  }
  
  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    return false;
  }
  
  // Increment counter
  current.count++;
  return true;
}

/**
 * Validate request size
 */
function validateRequestSize(
  request: NextRequest, 
  maxSize: number,
  context: RequestContext
): void {
  const contentLength = context.contentLength || 0;
  
  if (contentLength > maxSize) {
    throw createValidationError([
      `Request body too large: ${contentLength} bytes (max: ${maxSize} bytes)`
    ], context.requestId);
  }
}

/**
 * Validate HTTP method
 */
function validateMethod(
  request: NextRequest,
  allowedMethods: string[],
  context: RequestContext
): void {
  if (!allowedMethods.includes(request.method)) {
    throw createBusinessRuleError(
      'method_not_allowed',
      `HTTP method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      context.requestId
    );
  }
}

/**
 * Validate request headers for security
 */
function validateSecurityHeaders(
  request: NextRequest,
  context: RequestContext
): void {
  const contentType = request.headers.get('content-type');
  const userAgent = request.headers.get('user-agent');
  
  // Check for suspicious user agents
  if (userAgent) {
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /bot/i,
      /scanner/i,
      /crawler/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      secureLogger.warn('Suspicious user agent detected', {
        userAgent,
        requestId: context.requestId,
        path: context.path
      });
    }
  }
  
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (!contentType || !contentType.includes('application/json')) {
      throw createValidationError([
        'Content-Type must be application/json for write operations'
      ], context.requestId);
    }
  }
}

/**
 * Validate request origin and referrer
 */
function validateOrigin(
  request: NextRequest,
  context: RequestContext
): void {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // In production, validate against allowed origins
  const allowedOrigins = [
    'https://clinical-staffing.gangerdermatology.com',
    'https://staff.gangerdermatology.com',
    'http://localhost:3000', // Development
    'http://localhost:3001'  // Development
  ];
  
  if (origin && !allowedOrigins.includes(origin)) {
    secureLogger.warn('Request from disallowed origin', {
      origin,
      referer,
      requestId: context.requestId,
      path: context.path
    });
    
    throw createBusinessRuleError(
      'invalid_origin',
      'Request origin not allowed',
      context.requestId
    );
  }
}

/**
 * Check for common attack patterns in request
 */
function validateSecurityThreats(
  request: NextRequest,
  context: RequestContext
): void {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const pathname = url.pathname;
  
  // SQL injection patterns
  const sqlInjectionPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /'.*or.*'.*='/i
  ];
  
  // XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\s*\(/i
  ];
  
  // Path traversal patterns
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%252e%252e%252f/i
  ];
  
  const allPatterns = [
    ...sqlInjectionPatterns,
    ...xssPatterns,
    ...pathTraversalPatterns
  ];
  
  const testString = pathname + searchParams;
  
  for (const pattern of allPatterns) {
    if (pattern.test(testString)) {
      secureLogger.warn('Security threat detected in request', {
        pattern: pattern.toString(),
        requestId: context.requestId,
        path: context.path,
        threatType: 'pattern_match'
      });
      
      throw createBusinessRuleError(
        'security_threat_detected',
        'Request contains potentially malicious content',
        context.requestId
      );
    }
  }
}

/**
 * Create request context
 */
function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: generateRequestId(),
    timestamp: new Date(),
    method: request.method,
    path: new URL(request.url).pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    contentLength: parseInt(request.headers.get('content-length') || '0')
  };
}

/**
 * Enterprise API validation middleware
 */
export function withApiValidation(config: ValidationConfig = {}) {
  return function middleware<T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<R>
  ) {
    return async (request: NextRequest, ...args: T): Promise<R | NextResponse> => {
      const context = createRequestContext(request);
      
      try {
        // 1. Validate HTTP method
        if (config.allowedMethods) {
          validateMethod(request, config.allowedMethods, context);
        }
        
        // 2. Validate request size
        if (config.maxRequestSize) {
          validateRequestSize(request, config.maxRequestSize, context);
        }
        
        // 3. Security header validation
        validateSecurityHeaders(request, context);
        
        // 4. Origin validation
        validateOrigin(request, context);
        
        // 5. Security threat detection
        validateSecurityThreats(request, context);
        
        // 6. Rate limiting
        if (config.rateLimiting) {
          const allowed = checkRateLimit(request, config.rateLimiting, context);
          if (!allowed) {
            await auditSecurityEvent(
              'access_denied', 
              context.userId || 'anonymous', 
              'api_endpoint', 
              context.path,
              { reason: 'rate_limit_exceeded' },
              context.requestId
            );
            
            const error = createRateLimitError(context.requestId);
            return NextResponse.json(errorToResponse(error), { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil(config.rateLimiting.windowMs / 1000).toString(),
                'X-RateLimit-Limit': config.rateLimiting.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-Request-ID': context.requestId
              }
            });
          }
        }
        
        // 7. Custom validators
        if (config.customValidators) {
          for (const validator of config.customValidators) {
            await validator(request);
          }
        }
        
        // 8. Audit successful validation
        await auditSecurityEvent(
          'access_attempt',
          context.userId || 'anonymous',
          'api_endpoint',
          context.path,
          {
            method: context.method,
            userAgent: context.userAgent,
            contentLength: context.contentLength
          },
          context.requestId
        );
        
        // Add request ID to response headers
        const result = await handler(request, ...args);
        
        if (result instanceof NextResponse) {
          (result as NextResponse).headers.set('X-Request-ID', context.requestId);
          return result;
        }
        
        return result;
        
      } catch (error) {
        // Handle validation errors
        if (error instanceof Error && 'code' in error) {
          const structuredError = error as unknown as StructuredError;
          
          await auditSecurityEvent(
            'access_denied',
            context.userId || 'anonymous',
            'api_endpoint',
            context.path,
            {
              errorCode: structuredError.code,
              errorMessage: structuredError.message
            },
            context.requestId
          );
          
          return NextResponse.json(errorToResponse(structuredError), {
            status: getHttpStatusForError(structuredError),
            headers: {
              'X-Request-ID': context.requestId
            }
          });
        }
        
        // Handle unexpected errors
        const unexpectedError = createBusinessRuleError(
          'validation_error',
          'Request validation failed',
          context.requestId
        );
        
        return NextResponse.json(errorToResponse(unexpectedError), {
          status: 400,
          headers: {
            'X-Request-ID': context.requestId
          }
        });
      }
    };
  };
}

/**
 * Get HTTP status code for structured errors
 */
function getHttpStatusForError(error: StructuredError): number {
  if (error.code.includes('RATE_LIMIT')) return 429;
  if (error.code.includes('VALIDATION')) return 400;
  if (error.code.includes('AUTH')) return 401;
  if (error.code.includes('PERMISSION')) return 403;
  if (error.code.includes('BUSINESS_RULE')) return 422;
  if (error.code.includes('SECURITY_THREAT')) return 400;
  return 500;
}

/**
 * Predefined validation configurations
 */
export const ValidationConfigs = {
  // Standard CRUD API
  standard: {
    maxRequestSize: 1024 * 1024, // 1MB
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'] as string[],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },
  
  // High-frequency read operations
  readHeavy: {
    maxRequestSize: 64 * 1024, // 64KB
    allowedMethods: ['GET'] as string[],
    rateLimiting: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 60
    }
  },
  
  // Analytics and reporting
  analytics: {
    maxRequestSize: 512 * 1024, // 512KB
    allowedMethods: ['GET', 'POST'] as string[],
    rateLimiting: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20
    }
  },
  
  // File upload endpoints
  upload: {
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    allowedMethods: ['POST', 'PUT'] as string[],
    rateLimiting: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10
    }
  }
} as const;

/**
 * Medical data validation (HIPAA compliance)
 */
export function withMedicalDataValidation() {
  return withApiValidation({
    ...ValidationConfigs.standard,
    customValidators: [
      async (request: NextRequest) => {
        // Ensure HTTPS in production
        if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
          throw createBusinessRuleError(
            'insecure_connection',
            'HTTPS required for medical data',
            generateRequestId()
          );
        }
        
        // Additional medical data validation
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json') && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const body = await request.clone().text();
            if (body.length > 0) {
              JSON.parse(body); // Validate JSON
            }
          } catch {
            throw createValidationError([
              'Invalid JSON in request body'
            ], generateRequestId());
          }
        }
      }
    ]
  });
}

export {
  type RequestContext,
  type ValidationConfig,
  type RateLimitConfig
};