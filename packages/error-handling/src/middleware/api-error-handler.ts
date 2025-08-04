import { NextRequest, NextResponse } from 'next/server';
import { serializeError } from '../utils/error-serializer';
import { errorLogger } from '../utils/error-logger';
import { GangerError, AuthError, ValidationError, RateLimitError } from '../utils/error-classes';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    userMessage: string;
    severity: string;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Wrap API route handlers with error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, args[0] as NextRequest);
    }
  };
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(
  error: unknown,
  request?: NextRequest
): NextResponse<ApiErrorResponse> {
  const serialized = serializeError(error);
  const requestId = request?.headers.get('x-request-id') || crypto.randomUUID();

  // Log the error with request context
  errorLogger.logError(serialized, {
    requestId,
    method: request?.method,
    url: request?.url,
    userAgent: request?.headers.get('user-agent'),
  });

  // Determine status code
  let statusCode = 500;
  if (error instanceof GangerError) {
    if (error instanceof AuthError) {
      statusCode = error.code === 'UNAUTHORIZED' ? 401 : 403;
    } else if (error instanceof ValidationError) {
      statusCode = 400;
    } else if (error instanceof RateLimitError) {
      statusCode = 429;
    } else if (error.code === 'NOT_FOUND') {
      statusCode = 404;
    }
  } else if (serialized.metadata?.statusCode) {
    statusCode = serialized.metadata.statusCode;
  }

  const response: ApiErrorResponse = {
    error: {
      code: serialized.code,
      message: process.env.NODE_ENV === 'development' ? serialized.message : 'An error occurred',
      userMessage: serialized.userMessage,
      severity: serialized.severity,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'X-Request-Id': requestId,
    },
  });
}

/**
 * Extract error from API response
 */
export async function extractApiError(response: Response): Promise<Error> {
  let errorData: ApiErrorResponse | null = null;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      errorData = await response.json();
    }
  } catch {
    // Failed to parse JSON
  }

  if (errorData?.error) {
    const { code, message, userMessage } = errorData.error;
    
    // Return appropriate error type based on status
    switch (response.status) {
      case 401:
      case 403:
        return new AuthError(message, code);
      case 400:
        return new ValidationError(message);
      case 429:
        return new RateLimitError();
      default:
        return new GangerError(
          code,
          message,
          userMessage,
          'high',
          true,
          'retry',
          { statusCode: response.status }
        );
    }
  }

  // Fallback for non-JSON responses
  return new GangerError(
    'API_ERROR',
    `API request failed with status ${response.status}`,
    'Request failed. Please try again.',
    'high',
    true,
    'retry',
    { statusCode: response.status }
  );
}