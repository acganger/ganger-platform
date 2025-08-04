'use client';

import { useCallback, useState } from 'react';
import { SerializedError } from '../types';
import { serializeError, getUserMessage } from '../utils/error-serializer';
import { useErrorContext } from '../components/ErrorContext';
import { GangerError } from '../utils/error-classes';

export interface UseErrorReturn {
  error: SerializedError | null;
  isError: boolean;
  setError: (error: Error | SerializedError | string | null) => void;
  clearError: () => void;
  errorMessage: string | null;
  throwError: (error: Error | GangerError) => void;
}

/**
 * Hook for managing error state in components
 */
export function useError(): UseErrorReturn {
  const [error, setErrorState] = useState<SerializedError | null>(null);
  const errorContext = useErrorContext();

  const setError = useCallback((error: Error | SerializedError | string | null) => {
    if (!error) {
      setErrorState(null);
      return;
    }

    const serialized = typeof error === 'string'
      ? serializeError(new Error(error))
      : error instanceof Error
      ? serializeError(error)
      : error;

    setErrorState(serialized);
    
    // Don't add to global context for low severity errors
    if (serialized.severity !== 'low') {
      errorContext.addError(serialized);
    }
  }, [errorContext]);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const throwError = useCallback((error: Error | GangerError) => {
    const serialized = serializeError(error);
    setErrorState(serialized);
    errorContext.addError(serialized);
    
    // Re-throw for error boundaries
    throw error;
  }, [errorContext]);

  return {
    error,
    isError: error !== null,
    setError,
    clearError,
    errorMessage: error ? getUserMessage(error) : null,
    throwError,
  };
}