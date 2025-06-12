'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxAttemptsReached?: (error: Error) => void;
  onError?: (error: Error, attempt: number) => void;
}

export interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
  hasExceededMaxAttempts: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: () => true,
  onRetry: () => {},
  onMaxAttemptsReached: () => {},
  onError: () => {}
};

// Exponential backoff with jitter
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, backoffFactor: number): number {
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

// Determine if error is retryable
function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return true;
  }
  
  // Rate limiting (429)
  if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
    return true;
  }
  
  // Server errors (5xx)
  if (error.message.includes('500') || error.message.includes('502') || 
      error.message.includes('503') || error.message.includes('504')) {
    return true;
  }
  
  // AbortError (user cancelled - don't retry)
  if (error.name === 'AbortError') {
    return false;
  }
  
  // Client errors (4xx) - generally don't retry
  if (error.message.includes('400') || error.message.includes('401') || 
      error.message.includes('403') || error.message.includes('404')) {
    return false;
  }
  
  return true;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
) {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
    hasExceededMaxAttempts: false
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(async (): Promise<T> => {
    // Reset state
    setState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null,
      hasExceededMaxAttempts: false
    });

    let lastError: Error;
    
    for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
      try {
        setState(prev => ({ ...prev, attemptCount: attempt + 1, isRetrying: attempt > 0 }));
        
        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController();
        
        const result = await asyncFunction();
        
        // Success - reset state
        setState({
          isRetrying: false,
          attemptCount: attempt + 1,
          lastError: null,
          hasExceededMaxAttempts: false
        });
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({ 
          ...prev, 
          lastError,
          isRetrying: false
        }));

        // Check if we should retry this error
        const shouldRetry = opts.retryCondition(lastError) && isRetryableError(lastError);
        const isLastAttempt = attempt === opts.maxAttempts - 1;
        
        if (!shouldRetry || isLastAttempt) {
          if (isLastAttempt) {
            setState(prev => ({ ...prev, hasExceededMaxAttempts: true }));
            opts.onMaxAttemptsReached(lastError);
          }
          throw lastError;
        }

        // Call retry callback
        opts.onRetry(attempt + 1, lastError);
        
        // Wait before retrying (exponential backoff with jitter)
        const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay, opts.backoffFactor);
        
        setState(prev => ({ ...prev, isRetrying: true }));
        
        await new Promise<void>((resolve, reject) => {
          timeoutRef.current = setTimeout(() => {
            if (abortControllerRef.current?.signal.aborted) {
              reject(new Error('Retry aborted'));
            } else {
              resolve();
            }
          }, delay);
          
          // Listen for abort signal
          abortControllerRef.current?.signal.addEventListener('abort', () => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              reject(new Error('Retry aborted'));
            }
          });
        });
      }
    }
    
    throw lastError!;
  }, [asyncFunction, opts]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState(prev => ({ ...prev, isRetrying: false }));
  }, []);

  const reset = useCallback(() => {
    abort();
    setState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null,
      hasExceededMaxAttempts: false
    });
  }, [abort]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return {
    execute,
    abort,
    reset,
    ...state
  };
}

// Specialized retry hook for API calls
export function useApiRetry<T>(
  apiCall: () => Promise<T>,
  options: Omit<RetryOptions, 'retryCondition'> & {
    retryOn?: number[];
  } = {}
) {
  const { retryOn = [429, 500, 502, 503, 504], ...retryOptions } = options;
  
  return useRetry(apiCall, {
    ...retryOptions,
    retryCondition: (error: Error) => {
      // Check for specific HTTP status codes
      const statusMatch = retryOn.some(status => 
        error.message.includes(status.toString())
      );
      
      return statusMatch || isRetryableError(error);
    }
  });
}

// Circuit breaker pattern
interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

type CircuitState = 'closed' | 'open' | 'half-open';

export function useCircuitBreaker<T>(
  asyncFunction: () => Promise<T>,
  options: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringWindow: 60000
  }
) {
  const [state, setState] = useState<CircuitState>('closed');
  const [failureCount, setFailureCount] = useState(0);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);
  const failures = useRef<number[]>([]);

  const execute = useCallback(async (): Promise<T> => {
    const now = Date.now();
    
    // Clean old failures outside monitoring window
    failures.current = failures.current.filter(
      time => now - time < options.monitoringWindow
    );

    // Check if circuit should be half-open
    if (state === 'open' && lastFailureTime && 
        now - lastFailureTime > options.resetTimeout) {
      setState('half-open');
    }

    // Reject if circuit is open
    if (state === 'open') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await asyncFunction();
      
      // Success - reset circuit
      if (state === 'half-open') {
        setState('closed');
        setFailureCount(0);
        failures.current = [];
      }
      
      return result;
    } catch (error) {
      // Record failure
      failures.current.push(now);
      setFailureCount(failures.current.length);
      setLastFailureTime(now);

      // Open circuit if threshold exceeded
      if (failures.current.length >= options.failureThreshold) {
        setState('open');
      }

      throw error;
    }
  }, [asyncFunction, state, lastFailureTime, options]);

  const reset = useCallback(() => {
    setState('closed');
    setFailureCount(0);
    setLastFailureTime(null);
    failures.current = [];
  }, []);

  return {
    execute,
    reset,
    state,
    failureCount,
    isOpen: state === 'open',
    isHalfOpen: state === 'half-open'
  };
}

// Batched retry for multiple operations
export function useBatchRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
) {
  const [results, setResults] = useState<Array<T | Error>>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const execute = useCallback(async (): Promise<Array<T | Error>> => {
    setIsExecuting(true);
    setResults([]);
    setCompletedCount(0);

    const batchResults: Array<T | Error> = [];

    // Execute operations sequentially without using hooks inside the loop
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      // Manual retry logic without using hooks
      let attempts = 0;
      const maxAttempts = options.maxAttempts || 3;
      const baseDelay = options.baseDelay || 1000;
      
      while (attempts < maxAttempts) {
        try {
          const result = await operation();
          batchResults.push(result);
          break; // Success, exit retry loop
        } catch (error) {
          attempts++;
          
          if (attempts >= maxAttempts) {
            // All attempts failed
            const finalError = error instanceof Error ? error : new Error(String(error));
            batchResults.push(finalError);
            options.onError?.(finalError, attempts);
          } else {
            // Wait before retry
            const delay = baseDelay * Math.pow(2, attempts - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            options.onRetry?.(attempts, error instanceof Error ? error : new Error(String(error)));
          }
        }
      }

      setCompletedCount(i + 1);
      setResults([...batchResults]);
    }

    setIsExecuting(false);
    return batchResults;
  }, [operations, options]);

  return {
    execute,
    results,
    isExecuting,
    completedCount,
    progress: operations.length > 0 ? completedCount / operations.length : 0
  };
}