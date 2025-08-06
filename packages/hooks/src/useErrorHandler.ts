import { useCallback, useRef } from 'react';
import { captureError, captureMessage } from '@ganger/monitoring';
import { useToast } from './useToast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  captureToSentry?: boolean;
  customMessage?: string;
  retryable?: boolean;
  onError?: (error: Error) => void;
}

interface ErrorWithRetry extends Error {
  canRetry?: boolean;
  retryCount?: number;
}

export function useErrorHandler() {
  const { toast } = useToast();
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const handleError = useCallback((
    error: unknown,
    context: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logToConsole = process.env.NODE_ENV === 'development',
      captureToSentry = true,
      customMessage,
      retryable = false,
      onError
    } = options;

    // Convert to Error object if needed
    const errorObj = error instanceof Error 
      ? error 
      : new Error(String(error));

    // Add retry information if applicable
    if (retryable) {
      const errorWithRetry = errorObj as ErrorWithRetry;
      const retryKey = `${context}-${errorObj.message}`;
      const currentRetries = retryCountRef.current.get(retryKey) || 0;
      
      errorWithRetry.canRetry = currentRetries < 3;
      errorWithRetry.retryCount = currentRetries;
      
      retryCountRef.current.set(retryKey, currentRetries + 1);
    }

    // Log to console in development
    if (logToConsole) {
      console.error(`[${context}]`, errorObj);
    }

    // Capture to Sentry
    if (captureToSentry) {
      captureError(errorObj, {
        context,
        retryable,
        customMessage
      });
    }

    // Show user-friendly toast
    if (showToast) {
      const message = customMessage || getUserFriendlyMessage(errorObj);
      toast({
        title: 'Error',
        description: message,
        type: 'error',
      });
    }

    // Call custom error handler
    if (onError) {
      onError(errorObj);
    }

    return errorObj;
  }, [toast]);

  const clearRetryCount = useCallback((context: string) => {
    // Clear retry counts for a specific context
    const keysToDelete: string[] = [];
    retryCountRef.current.forEach((_, key) => {
      if (key.startsWith(context)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => retryCountRef.current.delete(key));
  }, []);

  return { handleError, clearRetryCount };
}

// Async error handler hook
export function useAsyncErrorHandler() {
  const { handleError } = useErrorHandler();

  const handleAsyncError = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    context: string,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      handleError(error, context, options);
      return null;
    }
  }, [handleError]);

  return { handleAsyncError };
}

// Retry hook with exponential backoff
export function useRetry() {
  const { handleError } = useErrorHandler();

  const retry = useCallback(async <T,>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: boolean;
      context?: string;
    } = {}
  ): Promise<T> => {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = true,
      context = 'retry'
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts - 1) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const waitTime = backoff 
          ? delay * Math.pow(2, attempt)
          : delay;

        captureMessage(
          `Retry attempt ${attempt + 1}/${maxAttempts} for ${context}`,
          'warning',
          { error: lastError.message, waitTime }
        );

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }, [handleError]);

  return { retry };
}

// Helper function to get user-friendly error messages
function getUserFriendlyMessage(error: Error): string {
  // Check for common error patterns
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error.message.includes('unauthorized') || error.message.includes('401')) {
    return 'Your session has expired. Please sign in again.';
  }
  
  if (error.message.includes('forbidden') || error.message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.message.includes('not found') || error.message.includes('404')) {
    return 'The requested resource was not found.';
  }
  
  if (error.message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  
  if (error.message.includes('validation')) {
    return 'Please check your input and try again.';
  }

  // Default message
  return 'An unexpected error occurred. Please try again.';
}