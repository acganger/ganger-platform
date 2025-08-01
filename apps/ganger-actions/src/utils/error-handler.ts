import { captureError, captureMessage } from '@ganger/monitoring';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ErrorInfo {
  message: string;
  type: 'error' | 'warning';
  context?: string;
}

export function handleApiError(error: unknown, context?: string): ErrorInfo {
  const apiError = error as ApiError;
  const errorMessage = apiError?.message || 'An unexpected error occurred';
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'API Error'}]`, error);
  }
  
  // Capture error with Sentry
  if (error instanceof Error) {
    captureError(error, {
      context,
      status: apiError.status,
      code: apiError.code,
      details: apiError.details,
    });
  } else {
    captureMessage(`Non-Error thrown: ${String(error)}`, 'error', { context });
  }
  
  // Return user-friendly error info
  const userMessage = getUserFriendlyMessage(apiError);
  return {
    message: userMessage,
    type: 'error',
    context
  };
}

function getUserFriendlyMessage(error: ApiError): string {
  // Handle specific error codes
  if (error.code === 'NETWORK_ERROR') {
    return 'Unable to connect. Please check your internet connection.';
  }
  
  // Handle HTTP status codes
  switch (error.status) {
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Our team has been notified.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

export function logFormError(formName: string, errors: Record<string, any>): void {
  captureMessage(`Form validation error: ${formName}`, 'warning', {
    formName,
    errors,
    timestamp: new Date().toISOString(),
  });
}

export function logApiPerformance(endpoint: string, duration: number): void {
  // Log slow API calls
  if (duration > 3000) {
    captureMessage(`Slow API call: ${endpoint}`, 'warning', {
      endpoint,
      duration,
      threshold: 3000,
    });
  }
}