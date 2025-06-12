/**
 * Enterprise-Grade Secure Error Handling System
 * 
 * Provides secure error handling with proper logging, sanitization,
 * and structured error responses for the clinical staffing system.
 */

import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

// Error severity levels for proper escalation
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories for classification
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_RULE = 'business_rule',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  SYSTEM = 'system'
}

// Structured error interface
export interface StructuredError {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: string;
  requestId: string;
  userId?: string;
  context: Record<string, any>;
  originalError?: Error;
}

// Client-safe error response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    timestamp: string;
    details?: Record<string, any>;
  };
}

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /ssn/i,
  /social/i,
  /dob/i,
  /birth/i,
  /medical/i,
  /patient/i,
  /email/i,
  /phone/i
];

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Redact sensitive information from objects
 */
export function redactSensitiveData(obj: any, maxDepth = 3): any {
  if (maxDepth <= 0) return '[REDACTED: MAX_DEPTH]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Redact potential sensitive strings
    if (obj.length > 50) return '[REDACTED: LONG_STRING]';
    return obj;
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: '[REDACTED: STACK_TRACE]'
    };
  }
  
  if (Array.isArray(obj)) {
    return obj.slice(0, 10).map(item => redactSensitiveData(item, maxDepth - 1));
  }
  
  if (typeof obj === 'object') {
    const redacted: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if key contains sensitive information
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value, maxDepth - 1);
      }
    }
    
    return redacted;
  }
  
  return '[REDACTED: UNKNOWN_TYPE]';
}

/**
 * Secure logger that redacts sensitive information
 */
export const secureLogger = {
  error: (error: StructuredError) => {
    const sanitized = {
      ...error,
      context: redactSensitiveData(error.context),
      originalError: error.originalError ? {
        name: error.originalError.name,
        message: error.originalError.message
      } : undefined
    };
    
    console.error('[SECURE_LOG]', JSON.stringify(sanitized, null, 2));
  },
  
  warn: (message: string, context: any = {}) => {
    console.warn('[SECURE_LOG]', message, redactSensitiveData(context));
  },
  
  info: (message: string, context: any = {}) => {
    console.info('[SECURE_LOG]', message, redactSensitiveData(context));
  }
};

/**
 * Create structured error with automatic classification
 */
export function createStructuredError(
  code: string,
  message: string,
  originalError?: Error,
  context: Record<string, any> = {},
  userId?: string,
  requestId?: string
): StructuredError {
  // Auto-classify error severity based on code
  let severity = ErrorSeverity.MEDIUM;
  let category = ErrorCategory.SYSTEM;
  
  if (code.includes('VALIDATION')) {
    category = ErrorCategory.VALIDATION;
    severity = ErrorSeverity.LOW;
  } else if (code.includes('AUTH')) {
    category = ErrorCategory.AUTHENTICATION;
    severity = ErrorSeverity.HIGH;
  } else if (code.includes('PERMISSION')) {
    category = ErrorCategory.AUTHORIZATION;
    severity = ErrorSeverity.HIGH;
  } else if (code.includes('BUSINESS_RULE')) {
    category = ErrorCategory.BUSINESS_RULE;
    severity = ErrorSeverity.MEDIUM;
  } else if (code.includes('DATABASE')) {
    category = ErrorCategory.DATABASE;
    severity = ErrorSeverity.HIGH;
  } else if (code.includes('EXTERNAL')) {
    category = ErrorCategory.EXTERNAL_SERVICE;
    severity = ErrorSeverity.MEDIUM;
  } else if (code.includes('CRITICAL')) {
    severity = ErrorSeverity.CRITICAL;
  }
  
  return {
    id: crypto.randomUUID(),
    code,
    message,
    severity,
    category,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId(),
    userId,
    context: redactSensitiveData(context),
    originalError
  };
}

/**
 * Convert structured error to client-safe response
 */
export function errorToResponse(error: StructuredError): ErrorResponse {
  // Never expose internal error details to client
  const clientMessage = getClientSafeMessage(error);
  
  return {
    error: {
      code: error.code,
      message: clientMessage,
      requestId: error.requestId,
      timestamp: error.timestamp,
      ...(error.severity === ErrorSeverity.LOW && {
        details: getClientSafeDetails(error)
      })
    }
  };
}

/**
 * Get client-safe error message
 */
function getClientSafeMessage(error: StructuredError): string {
  // For validation errors, provide specific feedback
  if (error.category === ErrorCategory.VALIDATION) {
    return error.message;
  }
  
  // For business rule violations, provide specific feedback
  if (error.category === ErrorCategory.BUSINESS_RULE) {
    return error.message;
  }
  
  // For all other errors, provide generic messages
  switch (error.category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';
    case ErrorCategory.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    case ErrorCategory.DATABASE:
      return 'A database error occurred. Please try again later.';
    case ErrorCategory.EXTERNAL_SERVICE:
      return 'An external service is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Get client-safe error details (only for low severity errors)
 */
function getClientSafeDetails(error: StructuredError): Record<string, any> | undefined {
  if (error.category === ErrorCategory.VALIDATION && error.context.validationErrors) {
    return {
      validationErrors: error.context.validationErrors
    };
  }
  
  return undefined;
}

/**
 * Secure error handler middleware
 */
export function withSecureErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: { operation: string; userId?: string; requestId?: string } = { operation: 'unknown' }
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (originalError) {
      const error = originalError instanceof Error ? originalError : new Error(String(originalError));
      
      // Create structured error
      const structuredError = createStructuredError(
        `${context.operation.toUpperCase()}_ERROR`,
        error.message,
        error,
        { operation: context.operation },
        context.userId,
        context.requestId
      );
      
      // Log securely
      secureLogger.error(structuredError);
      
      // Return appropriate response
      if (args[0] && typeof args[0] === 'object' && 'url' in args[0]) {
        // This is likely a NextRequest, return NextResponse
        const response = errorToResponse(structuredError);
        return NextResponse.json(response, { 
          status: getHttpStatusCode(structuredError)
        });
      }
      
      // Re-throw for non-HTTP contexts
      throw structuredError;
    }
  };
}

/**
 * Get appropriate HTTP status code for error
 */
function getHttpStatusCode(error: StructuredError): number {
  switch (error.category) {
    case ErrorCategory.VALIDATION:
      return 400; // Bad Request
    case ErrorCategory.AUTHENTICATION:
      return 401; // Unauthorized
    case ErrorCategory.AUTHORIZATION:
      return 403; // Forbidden
    case ErrorCategory.BUSINESS_RULE:
      return 422; // Unprocessable Entity
    case ErrorCategory.EXTERNAL_SERVICE:
      return 502; // Bad Gateway
    case ErrorCategory.DATABASE:
      return 503; // Service Unavailable
    default:
      return 500; // Internal Server Error
  }
}

/**
 * HIPAA-compliant audit logging
 */
export async function auditSecurityEvent(
  event: 'access_attempt' | 'access_granted' | 'access_denied' | 'data_modification' | 'system_error',
  userId: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, any> = {},
  requestId?: string
): Promise<void> {
  try {
    const auditEntry = {
      event,
      userId,
      resourceType,
      resourceId,
      details: redactSensitiveData(details),
      requestId: requestId || generateRequestId(),
      timestamp: new Date().toISOString(),
      userAgent: details.userAgent || 'unknown',
      ipAddress: details.ipAddress ? '[REDACTED]' : undefined
    };
    
    // Log to secure audit system
    secureLogger.info('AUDIT_EVENT', auditEntry);
    
    // In production, this would also write to a separate audit database
    // that cannot be modified and has additional access controls
  } catch (auditError) {
    // Never let audit logging errors affect the main operation
    console.error('Audit logging failed:', auditError);
  }
}

/**
 * Rate limiting error
 */
export function createRateLimitError(requestId?: string): StructuredError {
  return createStructuredError(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests. Please try again later.',
    undefined,
    { rateLimitExceeded: true },
    undefined,
    requestId
  );
}

/**
 * Validation error
 */
export function createValidationError(
  validationErrors: string[],
  requestId?: string
): StructuredError {
  return createStructuredError(
    'VALIDATION_ERROR',
    'Request validation failed',
    undefined,
    { validationErrors },
    undefined,
    requestId
  );
}

/**
 * Business rule violation error
 */
export function createBusinessRuleError(
  rule: string,
  details: string,
  requestId?: string
): StructuredError {
  return createStructuredError(
    'BUSINESS_RULE_VIOLATION',
    `Business rule violation: ${rule}`,
    undefined,
    { rule, details },
    undefined,
    requestId
  );
}

// Types already exported above, no need to re-export