import { SerializedError } from '../types';
import { GangerError } from './error-classes';
import { createSafeErrorMessage, sanitizeObject } from './error-sanitizer';

/**
 * Serialize any error into a HIPAA-compliant format
 */
export function serializeError(
  error: unknown,
  defaultCode = 'UNKNOWN_ERROR',
  defaultUserMessage = 'An unexpected error occurred. Please try again.'
): SerializedError {
  // Handle GangerError instances
  if (error instanceof GangerError) {
    return error.toJSON();
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    const isNetworkError = error.message.toLowerCase().includes('fetch') || 
                          error.message.toLowerCase().includes('network');
    const isAuthError = error.message.toLowerCase().includes('unauthorized') ||
                       error.message.toLowerCase().includes('authentication');

    return {
      code: error.name || defaultCode,
      message: createSafeErrorMessage(error),
      userMessage: isNetworkError 
        ? 'Network error. Please check your connection.'
        : isAuthError
        ? 'Authentication required. Please sign in.'
        : defaultUserMessage,
      severity: isAuthError ? 'high' : 'medium',
      recoverable: true,
      metadata: {
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }

  // Handle serialized errors
  if (isSerializedError(error)) {
    return sanitizeObject(error);
  }

  // Handle API error responses
  if (isApiErrorResponse(error)) {
    return {
      code: error.error?.code || error.code || 'API_ERROR',
      message: error.error?.message || error.message || 'API request failed',
      userMessage: error.error?.userMessage || error.userMessage || 'Request failed. Please try again.',
      severity: 'medium',
      recoverable: true,
      metadata: {
        timestamp: new Date().toISOString(),
        statusCode: error.status || error.statusCode,
        ...sanitizeObject(error.metadata || {}),
      },
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: defaultCode,
      message: createSafeErrorMessage(error),
      userMessage: defaultUserMessage,
      severity: 'medium',
      recoverable: true,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Handle unknown errors
  return {
    code: defaultCode,
    message: 'An unknown error occurred',
    userMessage: defaultUserMessage,
    severity: 'medium',
    recoverable: true,
    metadata: {
      timestamp: new Date().toISOString(),
      type: typeof error,
      error: process.env.NODE_ENV === 'development' ? sanitizeObject(error as any) : undefined,
    },
  };
}

/**
 * Type guard for SerializedError
 */
function isSerializedError(error: unknown): error is SerializedError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error &&
    'severity' in error &&
    'recoverable' in error
  );
}

/**
 * Type guard for API error responses
 */
function isApiErrorResponse(error: unknown): error is {
  error?: { code?: string; message?: string; userMessage?: string };
  code?: string;
  message?: string;
  userMessage?: string;
  status?: number;
  statusCode?: number;
  metadata?: Record<string, any>;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('error' in error || 'message' in error || 'code' in error)
  );
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return createSafeErrorMessage(error);
  }
  
  if (typeof error === 'string') {
    return createSafeErrorMessage(error);
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return createSafeErrorMessage(String(error.message));
  }
  
  return 'An unexpected error occurred';
}

/**
 * Extract user-friendly message from unknown error
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof GangerError) {
    return error.userMessage;
  }
  
  const serialized = serializeError(error);
  return serialized.userMessage;
}