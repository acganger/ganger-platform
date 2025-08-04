'use client';

import { useCallback } from 'react';
import { useErrorContext } from '../components/ErrorContext';
import { serializeError } from '../utils/error-serializer';

/**
 * Hook for handling errors in async operations
 * Useful for handling errors in async callbacks where try-catch won't work
 */
export function useAsyncError() {
  const { addError } = useErrorContext();

  const throwError = useCallback((error: unknown) => {
    const serialized = serializeError(error);
    addError(serialized);
    
    // Create a promise rejection to trigger error boundaries
    Promise.reject(error).catch(() => {
      // Handled by error boundary
    });
  }, [addError]);

  return throwError;
}