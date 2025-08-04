import { NetworkError, GangerError } from '../utils/error-classes';
import { errorLogger } from '../utils/error-logger';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Retry failed operations with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      
      errorLogger.logInfo(`Retrying operation (attempt ${attempt}/${maxAttempts})`, {
        delay,
        error: error instanceof Error ? error.message : String(error),
      });

      onRetry?.(error, attempt);
      
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Default retry logic - retry on network errors and recoverable errors
 */
function defaultShouldRetry(error: unknown, _attempt: number): boolean {
  // Always retry network errors
  if (error instanceof NetworkError) {
    return true;
  }

  // Retry recoverable GangerErrors
  if (error instanceof GangerError && error.recoverable) {
    return error.recoveryStrategy === 'retry';
  }

  // Retry on specific error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      'network',
      'timeout',
      'connection',
      'econnrefused',
      'enotfound',
      'etimedout',
      'socket hang up',
    ];
    
    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  return false;
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000, // 1 minute
    private readonly onStateChange?: (state: 'closed' | 'open' | 'half-open') => void
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.setState('half-open');
      } else {
        throw new GangerError(
          'CIRCUIT_BREAKER_OPEN',
          'Circuit breaker is open',
          'Service temporarily unavailable. Please try again later.',
          'high',
          true,
          'retry'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.setState('closed');
    }
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.setState('open');
    }
  }

  private setState(state: 'closed' | 'open' | 'half-open'): void {
    this.state = state;
    this.onStateChange?.(state);
    
    errorLogger.logInfo(`Circuit breaker state changed to: ${state}`, {
      failures: this.failures,
      threshold: this.threshold,
    });
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.setState('closed');
  }
}

/**
 * Helper function to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper for operations
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new GangerError(
        'TIMEOUT_ERROR',
        errorMessage,
        'The operation took too long. Please try again.',
        'high',
        true,
        'retry'
      ));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
}