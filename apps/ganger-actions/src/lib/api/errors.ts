import { NextApiResponse } from 'next';

/**
 * Standard error response format
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
}

/**
 * Standard success response format
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Common HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error codes
 */
export const ErrorCode = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

/**
 * API Error class for consistent error handling
 */
export class ApiErrorResponse extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    code: string = ErrorCode.INTERNAL_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Send standardized error response
 */
export function sendError(
  res: NextApiResponse,
  error: ApiErrorResponse | Error,
  path?: string
): void {
  if (error instanceof ApiErrorResponse) {
    const errorResponse: ApiError = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        path,
      },
    };
    
    res.status(error.statusCode).json(errorResponse);
  } else {
    // Generic error handling
    console.error('Unhandled error:', error);
    
    const errorResponse: ApiError = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path,
      },
    };
    
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}

/**
 * Send standardized success response
 */
export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = HttpStatus.OK
): void {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  res.status(statusCode).json(response);
}

/**
 * Common error factories
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') => 
    new ApiErrorResponse(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED),
    
  forbidden: (message = 'Access denied') => 
    new ApiErrorResponse(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN),
    
  notFound: (resource: string) => 
    new ApiErrorResponse(`${resource} not found`, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND),
    
  validation: (message: string, details?: any) => 
    new ApiErrorResponse(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, details),
    
  conflict: (message: string) => 
    new ApiErrorResponse(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT),
    
  internal: (message = 'Internal server error') => 
    new ApiErrorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR),
    
  database: (message = 'Database operation failed') => 
    new ApiErrorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR),
};

/**
 * Error handler middleware for API routes
 */
export function withErrorHandler(
  handler: (req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendError(res, error as Error, req.url);
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new ApiErrorResponse(
      `Missing required fields: ${missingFields.join(', ')}`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELD,
      { missingFields }
    );
  }
}

/**
 * Check if user has required role
 */
export function requireRole(
  userRole: string | undefined,
  allowedRoles: string[]
): void {
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw ApiErrors.forbidden('Insufficient permissions for this operation');
  }
}