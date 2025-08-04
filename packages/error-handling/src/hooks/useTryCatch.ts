'use client';

import { useCallback } from 'react';
import { useError } from './useError';
import { errorLogger } from '../utils/error-logger';

export interface UseTryCatchOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  rethrow?: boolean;
  logError?: boolean;
}

/**
 * Hook for wrapping async operations with error handling
 */
export function useTryCatch(options: UseTryCatchOptions = {}) {
  const { setError } = useError();
  const { 
    onError, 
    onSuccess, 
    rethrow = false,
    logError = true 
  } = options;

  const execute = useCallback(async <T,>(
    operation: () => Promise<T>
  ): Promise<T | undefined> => {
    try {
      const result = await operation();
      onSuccess?.();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (logError) {
        errorLogger.logError(err);
      }
      
      setError(err);
      onError?.(err);
      
      if (rethrow) {
        throw error;
      }
      
      return undefined;
    }
  }, [setError, onError, onSuccess, rethrow, logError]);

  const executeSync = useCallback(<T,>(
    operation: () => T
  ): T | undefined => {
    try {
      const result = operation();
      onSuccess?.();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (logError) {
        errorLogger.logError(err);
      }
      
      setError(err);
      onError?.(err);
      
      if (rethrow) {
        throw error;
      }
      
      return undefined;
    }
  }, [setError, onError, onSuccess, rethrow, logError]);

  return { execute, executeSync };
}