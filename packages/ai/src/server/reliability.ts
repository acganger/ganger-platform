/**
 * @fileoverview Reliability and retry logic for AI API calls
 * Provides exponential backoff, circuit breaker, and failover mechanisms
 */

import type { AIModel, AIError } from '../shared/types';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitterMs: number;
}

/**
 * Circuit breaker states
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringPeriodMs: number;
}

/**
 * Retry statistics
 */
interface RetryStats {
  attempts: number;
  totalDelay: number;
  errors: string[];
  success: boolean;
}

/**
 * Circuit breaker for preventing cascading failures
 */
class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private successes = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
        this.state = 'half-open';
        this.successes = 0;
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= 3) { // Require 3 successes to fully close
        this.state = 'closed';
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Advanced retry handler with exponential backoff and jitter
 */
export class RetryHandler {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(
    private defaultConfig: RetryConfig = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      exponentialBase: 2,
      jitterMs: 100
    }
  ) {}

  /**
   * Execute function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: {
      config?: Partial<RetryConfig>;
      context?: string;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<{ result: T; stats: RetryStats }> {
    const config = { ...this.defaultConfig, ...options.config };
    const context = options.context || 'default';
    const shouldRetry = options.shouldRetry || this.defaultShouldRetry;

    const stats: RetryStats = {
      attempts: 0,
      totalDelay: 0,
      errors: [],
      success: false
    };

    // Get or create circuit breaker for this context
    if (!this.circuitBreakers.has(context)) {
      this.circuitBreakers.set(context, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeoutMs: 60000,
        monitoringPeriodMs: 300000
      }));
    }

    const circuitBreaker = this.circuitBreakers.get(context)!;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      stats.attempts = attempt + 1;

      try {
        const result = await circuitBreaker.execute(fn);
        stats.success = true;
        return { result, stats };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errors.push(`Attempt ${attempt + 1}: ${errorMessage}`);

        // Don't retry on final attempt
        if (attempt === config.maxRetries) {
          throw error;
        }

        // Check if we should retry this error
        if (!shouldRetry(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        stats.totalDelay += delay;

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Retry logic failed unexpectedly');
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt);
    const jitter = Math.random() * config.jitterMs;
    return Math.min(exponentialDelay + jitter, config.maxDelayMs);
  }

  /**
   * Default retry logic - retry on transient errors
   */
  private defaultShouldRetry(error: any): boolean {
    // Don't retry on authentication or validation errors
    if (error?.code === 'AUTHENTICATION_REQUIRED' || 
        error?.code === 'INVALID_REQUEST' ||
        error?.code === 'SAFETY_VIOLATION') {
      return false;
    }

    // Retry on network errors, timeouts, and 5xx HTTP errors
    if (error?.code === 'NETWORK_ERROR' ||
        error?.code === 'TIMEOUT' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network') ||
        error?.status >= 500) {
      return true;
    }

    // Retry on rate limiting with backoff
    if (error?.code === 'RATE_LIMIT_EXCEEDED') {
      return true;
    }

    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker stats for monitoring
   */
  getCircuitBreakerStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [context, breaker] of this.circuitBreakers.entries()) {
      stats[context] = breaker.getStats();
    }
    return stats;
  }
}

/**
 * Model fallback strategy
 */
export class ModelFallbackHandler {
  private fallbackChains: Map<AIModel, AIModel[]> = new Map();

  constructor() {
    this.setupDefaultFallbacks();
  }

  /**
   * Setup default fallback chains for models
   */
  private setupDefaultFallbacks(): void {
    // Medical conversation fallbacks
    this.fallbackChains.set('llama-4-scout-17b-16e-instruct', [
      'llama-3.3-70b-instruct-fp8-fast',
      'qwq-32b'
    ]);

    // Fast chat fallbacks
    this.fallbackChains.set('llama-3.3-70b-instruct-fp8-fast', [
      'llama-4-scout-17b-16e-instruct'
    ]);

    // Complex reasoning fallbacks
    this.fallbackChains.set('qwq-32b', [
      'llama-4-scout-17b-16e-instruct',
      'llama-3.3-70b-instruct-fp8-fast'
    ]);

    // Vision model fallbacks (limited options)
    this.fallbackChains.set('llama-3.2-11b-vision-instruct', [
      'llama-4-scout-17b-16e-instruct' // Fall back to text-only
    ]);
  }

  /**
   * Get fallback models for a given model
   */
  getFallbacks(model: AIModel): AIModel[] {
    return this.fallbackChains.get(model) || [];
  }

  /**
   * Execute with automatic fallback
   */
  async executeWithFallback<T>(
    primaryModel: AIModel,
    fn: (model: AIModel) => Promise<T>,
    retryHandler: RetryHandler
  ): Promise<{ result: T; modelUsed: AIModel; attempts: Array<{ model: AIModel; error?: string }> }> {
    const attempts: Array<{ model: AIModel; error?: string }> = [];
    const modelsToTry = [primaryModel, ...this.getFallbacks(primaryModel)];

    for (const model of modelsToTry) {
      try {
        const { result } = await retryHandler.executeWithRetry(
          () => fn(model),
          { context: `model_${model}` }
        );
        
        attempts.push({ model });
        return { result, modelUsed: model, attempts };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        attempts.push({ model, error: errorMessage });
        
        // If this is the last model, throw the error
        if (model === modelsToTry[modelsToTry.length - 1]) {
          throw error;
        }
      }
    }

    throw new Error('All models failed including fallbacks');
  }
}

/**
 * Timeout handler for API calls
 */
export class TimeoutHandler {
  /**
   * Execute function with timeout
   */
  static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ]);
  }
}

/**
 * Combined reliability handler
 */
export class ReliabilityManager {
  private retryHandler = new RetryHandler();
  private fallbackHandler = new ModelFallbackHandler();

  /**
   * Execute AI call with full reliability features
   */
  async executeReliably<T>(
    primaryModel: AIModel,
    fn: (model: AIModel) => Promise<T>,
    options: {
      timeoutMs?: number;
      retryConfig?: Partial<RetryConfig>;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<{ result: T; modelUsed: AIModel; stats: any }> {
    const timeoutMs = options.timeoutMs || 30000;

    const wrappedFn = (model: AIModel) => 
      TimeoutHandler.executeWithTimeout(
        () => fn(model), 
        timeoutMs, 
        `AI model ${model} timed out after ${timeoutMs}ms`
      );

    const { result, modelUsed, attempts } = await this.fallbackHandler.executeWithFallback(
      primaryModel,
      wrappedFn,
      this.retryHandler
    );

    return {
      result,
      modelUsed,
      stats: {
        attempts,
        circuitBreakers: this.retryHandler.getCircuitBreakerStats()
      }
    };
  }

  /**
   * Get reliability statistics
   */
  getStats() {
    return {
      circuitBreakers: this.retryHandler.getCircuitBreakerStats(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Singleton instance for easy access
 */
export const defaultReliabilityManager = new ReliabilityManager();