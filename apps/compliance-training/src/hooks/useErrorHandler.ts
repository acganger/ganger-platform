'use client'

import React, { useState, useCallback, useRef } from 'react';
import { useApiRetry } from './useRetry';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string;
  errorCode?: string;
  canRetry: boolean;
  retryCount: number;
  isRetrying: boolean;
}

export interface ErrorHandlerOptions {
  defaultErrorMessage?: string;
  maxRetries?: number;
  retryDelay?: number;
  logErrors?: boolean;
  showToast?: boolean;
  reportToService?: boolean;
}

const DEFAULT_OPTIONS: Required<ErrorHandlerOptions> = {
  defaultErrorMessage: 'An unexpected error occurred',
  maxRetries: 3,
  retryDelay: 1000,
  logErrors: true,
  showToast: true,
  reportToService: false
};

// Parse error to extract useful information
function parseError(error: unknown): {
  message: string;
  code?: string;
  canRetry: boolean;
  isNetworkError: boolean;
} {
  if (error instanceof Error) {
    const message = error.message;
    const isNetworkError = error.name === 'NetworkError' || 
                          message.includes('fetch') || 
                          message.includes('network');
    
    // Extract HTTP status codes
    const statusMatch = message.match(/(\d{3})/);
    const statusCode = statusMatch ? statusMatch[1] : undefined;
    
    // Determine if error is retryable
    const canRetry = Boolean(isNetworkError || 
                    (statusCode && ['429', '500', '502', '503', '504'].includes(statusCode)));

    return {
      message: error.message,
      code: statusCode,
      canRetry,
      isNetworkError
    };
  }
  
  return {
    message: String(error),
    canRetry: false,
    isNetworkError: false
  };
}

// User-friendly error messages
function getFriendlyErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  if (message.includes('timeout')) {
    return 'The request took too long to complete. Please try again.';
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'You are not authorized to perform this action. Please log in again.';
  }
  
  if (message.includes('403') || message.includes('forbidden')) {
    return 'You do not have permission to access this resource.';
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return 'The requested resource was not found.';
  }
  
  if (message.includes('429') || message.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (message.includes('500') || message.includes('internal server error')) {
    return 'A server error occurred. Please try again in a few moments.';
  }
  
  if (message.includes('503') || message.includes('service unavailable')) {
    return 'The service is temporarily unavailable. Please try again later.';
  }
  
  return error.message;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: '',
    canRetry: false,
    retryCount: 0,
    isRetrying: false
  });

  const lastErrorRef = useRef<Error | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logError = useCallback((error: Error, context?: string) => {
    if (!opts.logErrors) return;

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };


    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push(errorInfo);
      
      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(logs));
    } catch (storageError) {
    }
  }, [opts.logErrors]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: '',
      canRetry: false,
      retryCount: 0,
      isRetrying: false
    });
    lastErrorRef.current = null;
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const showErrorToast = useCallback((message: string) => {
    if (!opts.showToast) return;

    // Clear existing toast
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Create toast notification (you could integrate with a toast library here)
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('errorToast', { detail: { message } });
      window.dispatchEvent(event);
    }

    // Auto-hide after 5 seconds
    toastTimeoutRef.current = setTimeout(() => {
      clearError();
    }, 5000);
  }, [opts.showToast, clearError]);

  const reportError = useCallback(async (error: Error, context?: string) => {
    if (!opts.reportToService) return;

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: localStorage.getItem('userId') || 'anonymous'
        })
      });
    } catch (reportingError) {
    }
  }, [opts.reportToService]);

  const handleError = useCallback((error: unknown, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const parsedError = parseError(errorObj);
    const friendlyMessage = getFriendlyErrorMessage(errorObj);

    // Don't handle the same error multiple times
    if (lastErrorRef.current === errorObj) {
      return;
    }
    lastErrorRef.current = errorObj;

    setErrorState(prev => ({
      error: errorObj,
      isError: true,
      errorMessage: friendlyMessage,
      errorCode: parsedError.code,
      canRetry: parsedError.canRetry,
      retryCount: prev.retryCount,
      isRetrying: false
    }));

    // Log error
    logError(errorObj, context);

    // Show toast notification
    showErrorToast(friendlyMessage);

    // Report to external service
    reportError(errorObj, context);

  }, [logError, showErrorToast, reportError]);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!errorState.canRetry) {
      throw new Error('This error cannot be retried');
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }));

    try {
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      setErrorState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        isRetrying: false
      }));
      
      if (errorState.retryCount >= opts.maxRetries - 1) {
        handleError(error, 'Max retries exceeded');
      } else {
        handleError(error, `Retry attempt ${errorState.retryCount + 1}`);
      }
      
      throw error;
    }
  }, [errorState.canRetry, errorState.retryCount, opts.maxRetries, handleError, clearError]);

  return {
    ...errorState,
    handleError,
    clearError,
    retry
  };
}

// Specialized hook for async operations with error handling
export function useAsyncErrorHandler<T>(
  asyncOperation: () => Promise<T>,
  options: ErrorHandlerOptions = {}
) {
  const errorHandler = useErrorHandler(options);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (): Promise<T> => {
    setIsLoading(true);
    errorHandler.clearError();

    try {
      const result = await asyncOperation();
      setData(result);
      return result;
    } catch (error) {
      errorHandler.handleError(error, 'Async operation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncOperation, errorHandler, setIsLoading, setData]);

  // Create retry logic outside of callback to avoid hooks-in-callback violation
  const retryLogic = useApiRetry(asyncOperation, {
    maxAttempts: options.maxRetries || 3,
    baseDelay: options.retryDelay || 1000,
    onRetry: (attempt, error) => {
      errorHandler.handleError(error, `Retry attempt ${attempt}`);
    }
  });

  const executeWithRetry = useCallback(async (): Promise<T> => {
    setIsLoading(true);
    errorHandler.clearError();

    try {
      const result = await retryLogic.execute();
      setData(result);
      return result;
    } catch (error) {
      errorHandler.handleError(error, 'Async operation with retry');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [retryLogic, errorHandler, setIsLoading, setData]);

  return {
    ...errorHandler,
    execute,
    executeWithRetry,
    isLoading,
    data
  };
}

// Global error handler for unhandled errors
export function useGlobalErrorHandler() {
  const errorHandler = useErrorHandler({
    logErrors: true,
    showToast: true,
    reportToService: true
  });

  // Handle unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.handleError(event.reason, 'Unhandled promise rejection');
      event.preventDefault();
    };

    // Handle JavaScript errors
    const handleError = (event: ErrorEvent) => {
      errorHandler.handleError(event.error || new Error(event.message), 'JavaScript error');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [errorHandler]);

  return errorHandler;
}