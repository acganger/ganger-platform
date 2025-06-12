import type { NextApiRequest, NextApiResponse } from 'next';
// Error codes enum (since @ganger/types import is not working)
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SYNC_FAILED: 'SYNC_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    filters?: Record<string, any>;
    summary?: Record<string, any>;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
import { auditLog } from '../lib/auth-utils';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource already exists') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends Error {
  constructor(service: string, message?: string) {
    super(message || `${service} service error`);
    this.name = 'ExternalServiceError';
  }
}

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      await handleApiError(error, req, res);
    }
  };
}

export async function handleApiError(
  error: unknown,
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  let statusCode = 500;
  let errorCode: ErrorCode = ErrorCodes.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log the error for debugging
  console.error('API Error:', {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? '[REDACTED]' : undefined
    }
  });

  if (error instanceof ValidationError) {
    statusCode = 400;
    errorCode = ErrorCodes.VALIDATION_ERROR;
    message = error.message;
    details = error.field ? { field: error.field } : undefined;
  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    errorCode = ErrorCodes.UNAUTHORIZED;
    message = error.message;
  } else if (error instanceof AuthorizationError) {
    statusCode = 403;
    errorCode = ErrorCodes.INSUFFICIENT_PERMISSIONS;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorCode = ErrorCodes.RESOURCE_NOT_FOUND;
    message = error.message;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorCode = ErrorCodes.RESOURCE_ALREADY_EXISTS;
    message = error.message;
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED;
    message = error.message;
  } else if (error instanceof ExternalServiceError) {
    statusCode = 502;
    errorCode = ErrorCodes.EXTERNAL_SERVICE_ERROR;
    message = error.message;
  } else if (error instanceof Error) {
    // Handle specific error patterns
    if (error.message.includes('duplicate key value')) {
      statusCode = 409;
      errorCode = ErrorCodes.RESOURCE_ALREADY_EXISTS;
      message = 'Resource already exists';
    } else if (error.message.includes('foreign key constraint')) {
      statusCode = 400;
      errorCode = ErrorCodes.VALIDATION_ERROR;
      message = 'Invalid reference to related resource';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = ErrorCodes.RESOURCE_NOT_FOUND;
      message = 'Resource not found';
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      statusCode = 504;
      errorCode = ErrorCodes.EXTERNAL_SERVICE_ERROR;
      message = 'Request timeout';
    } else if (error.message.includes('permission denied') || error.message.includes('unauthorized')) {
      statusCode = 403;
      errorCode = ErrorCodes.INSUFFICIENT_PERMISSIONS;
      message = 'Permission denied';
    } else {
      // Generic error
      message = process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';
      details = process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined;
    }
  }

  // Audit log for errors
  try {
    await auditLog({
      action: 'api_error',
      userId: req.body?.userId || 'anonymous',
      metadata: {
        method: req.method,
        url: req.url,
        statusCode,
        errorCode,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userAgent: req.headers['user-agent']
      }
    });
  } catch (auditError) {
    console.error('Failed to log error audit:', auditError);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details
    }
  });
}

export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
}

export function validateEnum(value: string, allowedValues: string[], fieldName: string): void {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }
}

export function validateDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }
  
  if (start >= end) {
    throw new ValidationError('Start date must be before end date');
  }
}

export function validatePagination(page?: number, limit?: number): { page: number; limit: number } {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(Math.max(1, limit || 10), 100); // Max 100 items per page
  
  return { page: validatedPage, limit: validatedLimit };
}