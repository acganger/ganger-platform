import { NextApiRequest, NextApiResponse } from 'next';
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
export interface ValidationErrorResponse extends StandardErrorResponse {
    code: 'VALIDATION_ERROR';
    details: {
        field: string;
        message: string;
        code: string;
        value?: any;
    }[];
}
export declare enum ErrorCodes {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_FORMAT = "INVALID_FORMAT",
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
    PHI_ACCESS_DENIED = "PHI_ACCESS_DENIED",
    AUDIT_LOG_REQUIRED = "AUDIT_LOG_REQUIRED",
    CONSENT_REQUIRED = "CONSENT_REQUIRED"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
export declare function createErrorResponse(error: Error | string, statusCode: number, code: ErrorCodes, req: NextApiRequest, details?: any): StandardErrorResponse;
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
export declare function createSuccessResponse<T>(data: T, statusCode: number | undefined, req: NextApiRequest, meta?: StandardSuccessResponse<T>['meta']): StandardSuccessResponse<T>;
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
export declare function createValidationErrorResponse(validationErrors: {
    field: string;
    message: string;
    code: string;
    value?: any;
}[], req: NextApiRequest): ValidationErrorResponse;
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
export declare function withStandardErrorHandling(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
export declare class ApiError extends Error {
    statusCode: number;
    code: ErrorCodes;
    details?: any | undefined;
    severity: ErrorSeverity;
    constructor(message: string, statusCode: number, code: ErrorCodes, details?: any | undefined, severity?: ErrorSeverity);
}
export declare class ValidationError extends Error {
    errors: {
        field: string;
        message: string;
        code: string;
        value?: any;
    }[];
    constructor(errors: {
        field: string;
        message: string;
        code: string;
        value?: any;
    }[]);
}
export declare class AuthenticationError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class AuthorizationError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class NotFoundError extends ApiError {
    constructor(resource?: string, details?: any);
}
export declare class ConflictError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class RateLimitError extends ApiError {
    constructor(retryAfter?: number);
}
export declare class DatabaseError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class ExternalServiceError extends ApiError {
    constructor(service: string, message?: string, details?: any);
}
export declare class HIPAAError extends ApiError {
    constructor(message: string, code: ErrorCodes, details?: any);
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
export declare function respondWithSuccess<T>(res: NextApiResponse, data: T, req: NextApiRequest, statusCode?: number, meta?: StandardSuccessResponse<T>['meta']): void;
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
export declare function respondWithError(res: NextApiResponse, error: Error | string, statusCode: number, code: ErrorCodes, req: NextApiRequest, details?: any): void;
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
export declare function respondWithValidationError(res: NextApiResponse, validationErrors: {
    field: string;
    message: string;
    code: string;
    value?: any;
}[], req: NextApiRequest): void;
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
export declare function transformZodErrors(zodError: any): ValidationError;
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
export declare function transformSupabaseError(supabaseError: any): ApiError;
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
export declare function handleMethodNotAllowed(req: NextApiRequest, res: NextApiResponse, allowedMethods: string[]): void;
