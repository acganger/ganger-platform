'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SerializedError, ErrorContextValue } from '../types';
import { serializeError } from '../utils/error-serializer';
import { errorLogger } from '../utils/error-logger';
import { GangerError } from '../utils/error-classes';

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export interface ErrorProviderProps {
  children: React.ReactNode;
  onError?: (error: SerializedError) => void;
  maxErrors?: number;
}

export function ErrorProvider({ 
  children, 
  onError,
  maxErrors = 5 
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<SerializedError[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);

  const addError = useCallback((error: Error | SerializedError) => {
    const serialized = error instanceof Error || error instanceof GangerError
      ? serializeError(error)
      : error;

    // Log the error
    errorLogger.logError(serialized);

    // Add to state
    setErrors(prev => {
      const newErrors = [...prev, serialized];
      // Keep only the most recent errors
      return newErrors.slice(-maxErrors);
    });

    // Call custom error handler
    onError?.(serialized);
  }, [maxErrors, onError]);

  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    setIsRecovering(false);
  }, []);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      addError(new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      addError(new Error(event.reason?.message || 'Unhandled promise rejection'));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addError]);

  const value: ErrorContextValue = {
    errors,
    addError,
    removeError,
    clearErrors,
    isRecovering,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext(): ErrorContextValue {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}