import { auditLog } from '@ganger/utils/server';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffFactor: number; // Exponential backoff multiplier
  jitter: boolean; // Add randomization to prevent thundering herd
  retryCondition?: (error: any) => boolean;
}

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  response?: any;
  retryable?: boolean;
  originalError?: Error;
}

export interface RetryableOperation<T> {
  (): Promise<T>;
}

export class ApiErrorHandler {
  private static defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    jitter: true,
    retryCondition: (error: any) => {
      // Default retry condition: retry on network errors and 5xx status codes
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return true;
      }
      if (error.statusCode >= 500 && error.statusCode < 600) {
        return true;
      }
      if (error.statusCode === 429) { // Rate limiting
        return true;
      }
      return false;
    }
  };

  /**
   * Execute an operation with retry logic
   */
  static async withRetry<T>(
    operation: RetryableOperation<T>,
    options: Partial<RetryOptions> = {},
    context?: {
      operationName?: string;
      service?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<T> {
    const config = { ...this.defaultRetryOptions, ...options };
    let lastError: ApiError;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
      try {
        const result = await operation();
        
        // Log successful retry if we had previous failures
        if (attempt > 0) {
          await auditLog({
            action: 'api_retry_success',
            resourceType: 'external_api',
            metadata: {
              service: context?.service,
              operation: context?.operationName,
              attempt,
              previousErrors: attempt,
              ...context?.metadata
            }
          });
        }

        return result;
      } catch (error) {
        lastError = this.normalizeError(error);
        attempt++;

        // Check if we should retry this error
        if (!config.retryCondition!(lastError) || attempt > config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        
        await auditLog({
          action: 'api_retry_attempt',
          resourceType: 'external_api',
          metadata: {
            service: context?.service,
            operation: context?.operationName,
            attempt,
            delay,
            error: {
              message: lastError.message,
              statusCode: lastError.statusCode,
              code: lastError.code
            },
            ...context?.metadata
          }
        });

        console.warn(`API operation failed, retrying in ${delay}ms (attempt ${attempt}/${config.maxRetries}):`, {
          service: context?.service,
          operation: context?.operationName,
          error: lastError.message
        });

        await this.sleep(delay);
      }
    }

    // All retries exhausted, log final failure
    await auditLog({
      action: 'api_retry_exhausted',
      resourceType: 'external_api',
      metadata: {
        service: context?.service,
        operation: context?.operationName,
        totalAttempts: attempt,
        finalError: {
          message: lastError.message,
          statusCode: lastError.statusCode,
          code: lastError.code,
          stack: lastError.stack
        },
        ...context?.metadata
      }
    });

    throw new ApiError(
      `Operation failed after ${config.maxRetries} retries: ${lastError.message}`,
      lastError.statusCode,
      lastError.code,
      lastError
    );
  }

  /**
   * Create a circuit breaker for API calls
   */
  static createCircuitBreaker(
    threshold: number = 5,
    timeout: number = 60000,
    resetTimeout: number = 300000
  ) {
    let failureCount = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    return async <T>(operation: RetryableOperation<T>, context?: any): Promise<T> => {
      const now = Date.now();

      // Check if circuit should be reset
      if (state === 'OPEN' && now - lastFailureTime > resetTimeout) {
        state = 'HALF_OPEN';
        failureCount = 0;
      }

      // Circuit is open, fail fast
      if (state === 'OPEN') {
        throw new ApiError(
          'Circuit breaker is OPEN - service is temporarily unavailable',
          503,
          'CIRCUIT_BREAKER_OPEN'
        );
      }

      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new ApiError('Operation timeout', 408, 'TIMEOUT')), timeout)
          )
        ]);

        // Success - reset failure count if in HALF_OPEN state
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failureCount = 0;
        }

        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        // Open circuit if threshold reached
        if (failureCount >= threshold) {
          state = 'OPEN';
          
          await auditLog({
            action: 'circuit_breaker_opened',
            resourceType: 'external_api',
            metadata: {
              service: context?.service,
              failureCount,
              threshold,
              resetTimeout
            }
          });
        }

        throw error;
      }
    };
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  static async handleRateLimit(
    response: Response,
    options: {
      maxWaitTime?: number;
      defaultWaitTime?: number;
    } = {}
  ): Promise<void> {
    const { maxWaitTime = 300000, defaultWaitTime = 60000 } = options;

    let waitTime = defaultWaitTime;

    // Check for Retry-After header
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const retryAfterSeconds = parseInt(retryAfter, 10);
      if (!isNaN(retryAfterSeconds)) {
        waitTime = retryAfterSeconds * 1000; // Convert to milliseconds
      }
    }

    // Check for X-RateLimit-Reset header (Unix timestamp)
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    if (rateLimitReset) {
      const resetTime = parseInt(rateLimitReset, 10) * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      if (resetTime > currentTime) {
        waitTime = resetTime - currentTime;
      }
    }

    // Cap the wait time
    waitTime = Math.min(waitTime, maxWaitTime);

    await auditLog({
      action: 'rate_limit_wait',
      resourceType: 'external_api',
      metadata: {
        waitTime,
        retryAfter,
        rateLimitReset,
        responseHeaders: Object.fromEntries(response.headers.entries())
      }
    });

    console.warn(`Rate limited, waiting ${waitTime}ms before retry`);
    await this.sleep(waitTime);
  }

  /**
   * Normalize different types of errors into a consistent format
   */
  private static normalizeError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    const normalizedError = new ApiError(error.message || 'Unknown error');
    
    // Handle fetch errors
    if (error.name === 'FetchError' || error.code) {
      normalizedError.code = error.code;
      normalizedError.retryable = ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code);
    }

    // Handle HTTP response errors
    if (error.response) {
      normalizedError.statusCode = error.response.status;
      normalizedError.response = error.response;
      normalizedError.retryable = error.response.status >= 500 || error.response.status === 429;
    }

    // Handle Axios errors
    if (error.isAxiosError) {
      normalizedError.statusCode = error.response?.status;
      normalizedError.code = error.code;
      normalizedError.response = error.response;
    }

    // Handle Google API errors
    if (error.errors && Array.isArray(error.errors)) {
      normalizedError.statusCode = error.code;
      normalizedError.message = error.errors.map((e: any) => e.message).join(', ');
      normalizedError.retryable = error.code >= 500 || error.code === 429;
    }

    normalizedError.originalError = error;
    return normalizedError;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private static calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
    
    // Cap at max delay
    delay = Math.min(delay, options.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create retry options for specific services
   */
  static createServiceRetryOptions(service: 'zenefits' | 'google-classroom' | 'generic'): RetryOptions {
    switch (service) {
      case 'zenefits':
        return {
          maxRetries: 3,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffFactor: 2,
          jitter: true,
          retryCondition: (error: ApiError) => {
            // Retry on network errors, 5xx errors, and rate limiting
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') return true;
            if (error.statusCode === 429) return true; // Rate limited
            if (error.statusCode >= 500) return true;
            return false;
          }
        };

      case 'google-classroom':
        return {
          maxRetries: 5, // Google APIs can be more flaky
          baseDelay: 1000,
          maxDelay: 120000, // Google may require longer waits
          backoffFactor: 2,
          jitter: true,
          retryCondition: (error: ApiError) => {
            // Retry on network errors, 5xx errors, rate limiting, and certain Google-specific errors
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') return true;
            if (error.statusCode === 429) return true; // Quota exceeded
            if (error.statusCode >= 500) return true;
            if (error.statusCode === 403 && error.message?.includes('quota')) return true;
            return false;
          }
        };

      default:
        return this.defaultRetryOptions;
    }
  }

  /**
   * Create a fault-tolerant wrapper for external API calls
   */
  static createFaultTolerantWrapper(service: string) {
    const retryOptions = this.createServiceRetryOptions(service as any);
    const circuitBreaker = this.createCircuitBreaker();

    return async <T>(
      operation: RetryableOperation<T>,
      operationName: string,
      metadata?: Record<string, any>
    ): Promise<T> => {
      return this.withRetry(
        () => circuitBreaker(operation, { service, operation: operationName }),
        retryOptions,
        {
          service,
          operationName,
          metadata
        }
      );
    };
  }
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode?: number;
  public code?: string;
  public response?: any;
  public retryable?: boolean;
  public originalError?: Error;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.originalError = originalError;
    this.retryable = false;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Health check utilities for external services
 */
export class ServiceHealthChecker {
  private static healthCache = new Map<string, { status: boolean; lastCheck: number; ttl: number }>();

  static async checkServiceHealth(
    serviceName: string,
    healthCheckFn: () => Promise<boolean>,
    cacheTtl: number = 60000 // 1 minute cache
  ): Promise<boolean> {
    const now = Date.now();
    const cached = this.healthCache.get(serviceName);

    // Return cached result if still valid
    if (cached && now - cached.lastCheck < cached.ttl) {
      return cached.status;
    }

    try {
      const isHealthy = await healthCheckFn();
      
      this.healthCache.set(serviceName, {
        status: isHealthy,
        lastCheck: now,
        ttl: cacheTtl
      });

      if (!isHealthy) {
        await auditLog({
          action: 'service_health_check_failed',
          resourceType: 'external_service',
          metadata: { serviceName }
        });
      }

      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${serviceName}:`, error);
      
      this.healthCache.set(serviceName, {
        status: false,
        lastCheck: now,
        ttl: cacheTtl
      });

      await auditLog({
        action: 'service_health_check_error',
        resourceType: 'external_service',
        metadata: {
          serviceName,
          error: error.message
        }
      });

      return false;
    }
  }

  static getServiceStatus(serviceName: string): { status: boolean; lastCheck?: number } | null {
    const cached = this.healthCache.get(serviceName);
    return cached ? { status: cached.status, lastCheck: cached.lastCheck } : null;
  }

  static clearHealthCache(serviceName?: string): void {
    if (serviceName) {
      this.healthCache.delete(serviceName);
    } else {
      this.healthCache.clear();
    }
  }
}