import { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';

// Standard error response interface
export interface StandardErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId: string;
  path: string;
  method: string;
  statusCode: number;
}

// Standard success response interface
export interface StandardSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
  path: string;
  method: string;
  statusCode: number;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    performance?: {
      duration_ms: number;
      cached: boolean;
    };
  };
}

// Standard validation error response
export interface ValidationErrorResponse extends StandardErrorResponse {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
    code: string;
    value?: any;
  }[];
}

// Error codes enum
export enum ErrorCodes {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // HIPAA Specific
  PHI_ACCESS_DENIED = 'PHI_ACCESS_DENIED',
  AUDIT_LOG_REQUIRED = 'AUDIT_LOG_REQUIRED',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Generates a unique request ID for tracing
 * @returns UUID v4 string
 */
function generateRequestId(): string {
  return randomUUID();
}

/**
 * Extracts metadata from the request for logging and tracing
 * @param req - Next.js API request object
 * @returns Object containing request ID, timestamp, path, and method
 */
function getRequestMetadata(req: NextApiRequest) {
  return {
    requestId: generateRequestId(),
    timestamp: new Date().toISOString(),
    path: req.url || 'unknown',
    method: req.method || 'unknown'
  };
}

/**
 * Creates a standardized error response object
 * @param error - Error object or message string
 * @param statusCode - HTTP status code
 * @param code - Error code from ErrorCodes enum
 * @param req - Next.js API request object
 * @param details - Optional additional error details
 * @returns Standardized error response
 * @example
 * const errorResponse = createErrorResponse(
 *   new Error('User not found'),
 *   404,
 *   ErrorCodes.NOT_FOUND,
 *   req,
 *   { userId: '123' }
 * );
 */
export function createErrorResponse(
  error: Error | string,
  statusCode: number,
  code: ErrorCodes,
  req: NextApiRequest,
  details?: any
): StandardErrorResponse {
  const metadata = getRequestMetadata(req);
  
  return {
    error: typeof error === 'string' ? error : error.message,
    code,
    message: getErrorMessage(code),
    details,
    statusCode,
    ...metadata
  };
}

/**
 * Creates a standardized success response object
 * @param data - The response data
 * @param statusCode - HTTP status code (default: 200)
 * @param req - Next.js API request object
 * @param meta - Optional metadata (pagination, performance)
 * @returns Standardized success response
 * @example
 * const response = createSuccessResponse(
 *   { users: [{id: 1, name: 'John'}] },
 *   200,
 *   req,
 *   { pagination: { page: 1, limit: 10, total: 100, totalPages: 10 } }
 * );
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  req: NextApiRequest,
  meta?: StandardSuccessResponse<T>['meta']
): StandardSuccessResponse<T> {
  const metadata = getRequestMetadata(req);
  
  return {
    success: true,
    data,
    statusCode,
    meta,
    ...metadata
  };
}

/**
 * Creates a standardized validation error response
 * @param validationErrors - Array of field validation errors
 * @param req - Next.js API request object
 * @returns Validation error response with 400 status
 * @example
 * const response = createValidationErrorResponse([
 *   { field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' },
 *   { field: 'password', message: 'Too short', code: 'MIN_LENGTH' }
 * ], req);
 */
export function createValidationErrorResponse(
  validationErrors: { field: string; message: string; code: string; value?: any }[],
  req: NextApiRequest
): ValidationErrorResponse {
  const metadata = getRequestMetadata(req);
  
  return {
    error: 'Validation failed',
    code: ErrorCodes.VALIDATION_ERROR,
    message: 'One or more fields contain invalid values',
    details: validationErrors,
    statusCode: 400,
    ...metadata
  };
}

/**
 * Maps error codes to user-friendly messages
 * @param code - Error code from ErrorCodes enum
 * @returns Human-readable error message
 */
function getErrorMessage(code: ErrorCodes): string {
  const messages: Record<ErrorCodes, string> = {
    [ErrorCodes.UNAUTHORIZED]: 'Authentication required to access this resource',
    [ErrorCodes.FORBIDDEN]: 'You do not have permission to access this resource',
    [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
    [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid username or password',
    
    [ErrorCodes.VALIDATION_ERROR]: 'The provided data is invalid',
    [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ErrorCodes.INVALID_FORMAT]: 'Field format is invalid',
    
    [ErrorCodes.NOT_FOUND]: 'The requested resource was not found',
    [ErrorCodes.ALREADY_EXISTS]: 'Resource already exists',
    [ErrorCodes.RESOURCE_CONFLICT]: 'Resource conflict detected',
    
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
    
    [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
    [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
    [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service is unavailable',
    
    [ErrorCodes.BUSINESS_RULE_VIOLATION]: 'Operation violates business rules',
    [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this operation',
    [ErrorCodes.OPERATION_NOT_ALLOWED]: 'Operation is not allowed in current state',
    
    [ErrorCodes.PHI_ACCESS_DENIED]: 'Access to protected health information denied',
    [ErrorCodes.AUDIT_LOG_REQUIRED]: 'This operation requires audit logging',
    [ErrorCodes.CONSENT_REQUIRED]: 'Patient consent required for this operation'
  };
  
  return messages[code] || 'An unknown error occurred';
}

/**
 * Wraps API handlers with standardized error handling
 * Automatically catches and formats errors into standard responses
 * @param handler - The async API handler function
 * @returns Wrapped handler with error handling
 * @example
 * export default withStandardErrorHandling(async (req, res) => {
 *   if (!req.body.email) {
 *     throw new ValidationError([{
 *       field: 'email',
 *       message: 'Email is required',
 *       code: 'REQUIRED'
 *     }]);
 *   }
 *   // Handler logic...
 * });
 */
export function withStandardErrorHandling(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      // Check if response was already sent
      if (res.headersSent) {
        return;
      }
      
      let errorResponse: StandardErrorResponse;
      
      if (error instanceof ValidationError) {
        errorResponse = createValidationErrorResponse(error.errors, req);
      } else if (error instanceof ApiError) {
        errorResponse = createErrorResponse(
          error.message,
          error.statusCode,
          error.code,
          req,
          error.details
        );
      } else {
        // Unhandled error
        const isDevelopment = process.env.NODE_ENV === 'development';
        errorResponse = createErrorResponse(
          isDevelopment ? String(error) : 'Internal server error',
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR,
          req,
          isDevelopment ? { stack: (error as Error).stack } : undefined
        );
      }
      
      res.status(errorResponse.statusCode).json(errorResponse);
    }
  };
}

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: ErrorCodes,
    public details?: any,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: { field: string; message: string; code: string; value?: any }[]
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, ErrorCodes.UNAUTHORIZED, details, ErrorSeverity.MEDIUM);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, ErrorCodes.FORBIDDEN, details, ErrorSeverity.MEDIUM);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: any) {
    super(`${resource} not found`, 404, ErrorCodes.NOT_FOUND, details, ErrorSeverity.LOW);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, ErrorCodes.RESOURCE_CONFLICT, details, ErrorSeverity.MEDIUM);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded',
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      { retryAfter },
      ErrorSeverity.LOW
    );
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, ErrorCodes.DATABASE_ERROR, details, ErrorSeverity.HIGH);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message?: string, details?: any) {
    super(
      message || `${service} service is unavailable`,
      503,
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      { service, ...details },
      ErrorSeverity.HIGH
    );
    this.name = 'ExternalServiceError';
  }
}

export class HIPAAError extends ApiError {
  constructor(message: string, code: ErrorCodes, details?: any) {
    super(message, 403, code, details, ErrorSeverity.HIGH);
    this.name = 'HIPAAError';
  }
}

/**
 * Sends a standardized success response
 * @param res - Next.js API response object
 * @param data - The response data
 * @param req - Next.js API request object
 * @param statusCode - HTTP status code (default: 200)
 * @param meta - Optional metadata
 * @returns Next.js response object
 * @example
 * return respondWithSuccess(res, { user: userData }, req, 200);
 */
export function respondWithSuccess<T>(
  res: NextApiResponse,
  data: T,
  req: NextApiRequest,
  statusCode: number = 200,
  meta?: StandardSuccessResponse<T>['meta']
) {
  const response = createSuccessResponse(data, statusCode, req, meta);
  return res.status(statusCode).json(response);
}

/**
 * Sends a standardized error response
 * @param res - Next.js API response object
 * @param error - Error object or message
 * @param statusCode - HTTP status code
 * @param code - Error code from ErrorCodes enum
 * @param req - Next.js API request object
 * @param details - Optional error details
 * @returns Next.js response object
 * @example
 * return respondWithError(res, 'Not found', 404, ErrorCodes.NOT_FOUND, req);
 */
export function respondWithError(
  res: NextApiResponse,
  error: Error | string,
  statusCode: number,
  code: ErrorCodes,
  req: NextApiRequest,
  details?: any
) {
  const response = createErrorResponse(error, statusCode, code, req, details);
  return res.status(statusCode).json(response);
}

/**
 * Sends a standardized validation error response (400)
 * @param res - Next.js API response object
 * @param validationErrors - Array of validation errors
 * @param req - Next.js API request object
 * @returns Next.js response object with 400 status
 * @example
 * return respondWithValidationError(res, [
 *   { field: 'email', message: 'Invalid format', code: 'FORMAT' }
 * ], req);
 */
export function respondWithValidationError(
  res: NextApiResponse,
  validationErrors: { field: string; message: string; code: string; value?: any }[],
  req: NextApiRequest
) {
  const response = createValidationErrorResponse(validationErrors, req);
  return res.status(400).json(response);
}

/**
 * Transforms Zod validation errors into our ValidationError format
 * @param zodError - Zod error object
 * @returns ValidationError instance
 * @example
 * try {
 *   const data = schema.parse(req.body);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     throw transformZodErrors(error);
 *   }
 * }
 */
export function transformZodErrors(zodError: any): ValidationError {
  const errors = zodError.errors.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    value: err.received
  }));
  
  return new ValidationError(errors);
}

/**
 * Transforms Supabase/PostgreSQL errors into our ApiError format
 * @param supabaseError - Supabase error object
 * @returns Appropriate ApiError subclass
 * @example
 * const { data, error } = await supabase.from('users').insert(userData);
 * if (error) {
 *   throw transformSupabaseError(error);
 * }
 */
export function transformSupabaseError(supabaseError: any): ApiError {
  const message = supabaseError.message || 'Database operation failed';
  const code = supabaseError.code;
  
  // Map common PostgreSQL errors
  if (code === '23505') {
    return new ConflictError('Resource already exists', { postgresCode: code });
  }
  
  if (code === '23503') {
    return new ApiError(
      'Referenced resource does not exist',
      400,
      ErrorCodes.VALIDATION_ERROR,
      { postgresCode: code }
    );
  }
  
  return new DatabaseError(message, { postgresCode: code });
}

/**
 * Handles HTTP method not allowed errors (405)
 * Sets the Allow header with permitted methods
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 * @param allowedMethods - Array of allowed HTTP methods
 * @returns 405 error response
 * @example
 * if (req.method !== 'POST') {
 *   return handleMethodNotAllowed(req, res, ['POST']);
 * }
 */
export function handleMethodNotAllowed(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[]
) {
  res.setHeader('Allow', allowedMethods.join(', '));
  return respondWithError(
    res,
    `Method ${req.method} not allowed`,
    405,
    ErrorCodes.OPERATION_NOT_ALLOWED,
    req,
    { allowedMethods }
  );
}