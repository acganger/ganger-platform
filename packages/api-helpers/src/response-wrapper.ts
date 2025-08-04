/**
 * Standardized API Response Format for Ganger Platform
 * 
 * This module provides consistent response structures across all API endpoints
 * ensuring predictable client-side handling and better error management.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Base response types
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
  metadata?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error codes enum for consistency
export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
}

// HTTP status codes mapping
const errorCodeToStatus: Record<ApiErrorCode, number> = {
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.DATABASE_ERROR]: 500,
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ApiErrorCode.BUSINESS_RULE_VIOLATION]: 400,
  [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ApiErrorCode.RESOURCE_LOCKED]: 423,
  [ApiErrorCode.OPERATION_NOT_ALLOWED]: 405,
};

// Helper to generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Success response helper
export function apiSuccess<T = any>(
  data: T,
  options?: {
    message?: string;
    metadata?: ApiSuccessResponse['metadata'];
    status?: number;
    headers?: HeadersInit;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
    ...(options?.message && { message: options.message }),
    ...(options?.metadata && { metadata: options.metadata }),
  };

  return NextResponse.json(response, {
    status: options?.status || 200,
    headers: options?.headers,
  });
}

// Error response helper
export function apiError(
  code: ApiErrorCode,
  message: string,
  options?: {
    details?: any;
    field?: string;
    status?: number;
    headers?: HeadersInit;
  }
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...(options?.details && { details: options.details }),
      ...(options?.field && { field: options.field }),
    },
  };

  const status = options?.status || errorCodeToStatus[code] || 500;

  return NextResponse.json(response, {
    status,
    headers: options?.headers,
  });
}

// Common response helpers
export const responses = {
  // Success responses
  ok: <T = any>(data: T, message?: string) => 
    apiSuccess(data, { message }),
  
  created: <T = any>(data: T, message = 'Resource created successfully') => 
    apiSuccess(data, { message, status: 201 }),
  
  accepted: <T = any>(data: T, message = 'Request accepted') => 
    apiSuccess(data, { message, status: 202 }),
  
  noContent: () => 
    new NextResponse(null, { status: 204 }),
  
  // Error responses
  badRequest: (message = 'Bad request', details?: any) => 
    apiError(ApiErrorCode.BAD_REQUEST, message, { details }),
  
  unauthorized: (message = 'Authentication required') => 
    apiError(ApiErrorCode.UNAUTHORIZED, message),
  
  forbidden: (message = 'Access denied') => 
    apiError(ApiErrorCode.FORBIDDEN, message),
  
  notFound: (message = 'Resource not found') => 
    apiError(ApiErrorCode.NOT_FOUND, message),
  
  conflict: (message = 'Resource conflict', details?: any) => 
    apiError(ApiErrorCode.CONFLICT, message, { details }),
  
  validationError: (message: string, field?: string, details?: any) => 
    apiError(ApiErrorCode.VALIDATION_ERROR, message, { field, details }),
  
  rateLimitExceeded: (message = 'Rate limit exceeded') => 
    apiError(ApiErrorCode.RATE_LIMIT_EXCEEDED, message),
  
  internalError: (message = 'Internal server error', details?: any) => 
    apiError(ApiErrorCode.INTERNAL_ERROR, message, { details }),
  
  databaseError: (message = 'Database operation failed', details?: any) => 
    apiError(ApiErrorCode.DATABASE_ERROR, message, { details }),
  
  serviceUnavailable: (message = 'Service temporarily unavailable') => 
    apiError(ApiErrorCode.SERVICE_UNAVAILABLE, message),
};

// Paginated response helper
export function paginatedResponse<T = any>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  },
  message?: string
): NextResponse<ApiSuccessResponse<T[]>> {
  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
  
  return apiSuccess(data, {
    message,
    metadata: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: pagination.totalCount,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    },
  });
}

// Type guard helpers
export function isApiSuccess<T = any>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiError(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}

// Middleware for automatic response wrapping
export function withApiResponse(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse | Response>
) {
  return async (req: NextRequest, params?: any) => {
    try {
      const requestId = generateRequestId();
      
      // Add request ID to headers for tracking
      const headers = new Headers();
      headers.set('X-Request-ID', requestId);
      
      // Execute the handler
      const response = await handler(req, params);
      
      // If response is already a NextResponse, add headers and return
      if (response instanceof NextResponse) {
        response.headers.set('X-Request-ID', requestId);
        return response;
      }
      
      // Otherwise, wrap the response
      return NextResponse.json(response, {
        headers,
      });
    } catch (error) {
      // Log error for monitoring
      console.error('API Error:', error);
      
      // Handle known error types
      if (error instanceof ValidationError) {
        return responses.validationError(error.message, error.field, error.details);
      }
      
      if (error instanceof UnauthorizedError) {
        return responses.unauthorized(error.message);
      }
      
      if (error instanceof NotFoundError) {
        return responses.notFound(error.message);
      }
      
      // Default to internal error
      return responses.internalError(
        process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : (error as Error).message
      );
    }
  };
}

// Custom error classes for consistent error handling
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string, details?: any) {
    super(ApiErrorCode.VALIDATION_ERROR, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(ApiErrorCode.UNAUTHORIZED, message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(ApiErrorCode.NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(ApiErrorCode.CONFLICT, message, details);
    this.name = 'ConflictError';
  }
}

// Export all components for easy access
export default {
  apiSuccess,
  apiError,
  responses,
  paginatedResponse,
  withApiResponse,
  isApiSuccess,
  isApiError,
  ApiError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ApiErrorCode,
};