import { NextResponse } from 'next/server';
import { captureError } from '@ganger/monitoring/sentry';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Standard error codes for the platform
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_STATE: 'INVALID_STATE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

/**
 * Maps common database error codes to API errors
 */
export function mapDatabaseError(error: any): ApiError {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // unique_violation
      return new ApiError(
        'Resource already exists',
        409,
        ErrorCodes.ALREADY_EXISTS,
        { field: error.detail }
      );
      
    case '23503': // foreign_key_violation
      return new ApiError(
        'Referenced resource not found',
        400,
        ErrorCodes.INVALID_INPUT,
        { constraint: error.constraint }
      );
      
    case '23502': // not_null_violation
      return new ApiError(
        'Missing required field',
        400,
        ErrorCodes.MISSING_REQUIRED_FIELD,
        { field: error.column }
      );
      
    case 'PGRST116': // Supabase not found
      return new ApiError(
        'Resource not found',
        404,
        ErrorCodes.NOT_FOUND
      );
      
    default:
      return new ApiError(
        'Database operation failed',
        500,
        ErrorCodes.DATABASE_ERROR,
        { originalError: error.message }
      );
  }
}

/**
 * Handles Zod validation errors
 */
export function handleValidationError(error: z.ZodError): NextResponse {
  const formattedErrors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));
  
  return createErrorResponse(
    new ApiError(
      'Validation failed',
      400,
      ErrorCodes.VALIDATION_ERROR,
      { errors: formattedErrors }
    )
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: Error | ApiError,
  requestId?: string
): NextResponse<ErrorResponse> {
  const isApiError = error instanceof ApiError;
  const statusCode = isApiError ? error.statusCode : 500;
  const code = isApiError ? error.code : ErrorCodes.INTERNAL_ERROR;
  
  // Log to Sentry for server errors
  if (statusCode >= 500) {
    captureError(error, {
      requestId,
      statusCode,
      code
    });
  }
  
  const response: ErrorResponse = {
    success: false,
    error: {
      message: error.message,
      code,
      timestamp: new Date().toISOString(),
      requestId
    }
  };
  
  // Add details for API errors
  if (isApiError && error.details) {
    response.error.details = error.details;
  }
  
  // In production, sanitize internal errors
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    response.error.message = 'An unexpected error occurred';
    delete response.error.details;
  }
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error);
      }
      
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }
      
      // Check for database errors
      if ((error as any).code && typeof (error as any).code === 'string') {
        const dbError = mapDatabaseError(error);
        return createErrorResponse(dbError);
      }
      
      // Default error response
      return createErrorResponse(
        new ApiError(
          error instanceof Error ? error.message : 'Internal server error',
          500,
          ErrorCodes.INTERNAL_ERROR
        )
      );
    }
  }) as T;
}

/**
 * Common error responses
 */
export const CommonErrors = {
  unauthorized: () => new ApiError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED),
  forbidden: () => new ApiError('Forbidden', 403, ErrorCodes.FORBIDDEN),
  notFound: (resource = 'Resource') => new ApiError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND),
  conflict: (message = 'Resource conflict') => new ApiError(message, 409, ErrorCodes.CONFLICT),
  validationFailed: (details?: any) => new ApiError('Validation failed', 400, ErrorCodes.VALIDATION_ERROR, details),
  rateLimitExceeded: () => new ApiError('Rate limit exceeded', 429, ErrorCodes.RATE_LIMIT_EXCEEDED),
  internalError: () => new ApiError('Internal server error', 500, ErrorCodes.INTERNAL_ERROR),
};