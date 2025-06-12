/**
 * Base Integration Client
 * Shared functionality for all external system integrations
 */

export interface IntegrationConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface RetryOptions {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: any) => boolean;
}

export abstract class BaseIntegrationClient {
  protected defaultTimeout = 30000; // 30 seconds
  protected defaultRetryAttempts = 3;
  protected defaultRetryDelay = 1000; // 1 second

  constructor() {
    // Base constructor
  }

  // =====================================================
  // HTTP CLIENT WITH RETRY LOGIC
  // =====================================================

  protected async makeRequestWithRetry(
    url: string,
    options: RequestInit = {},
    retryOptions?: Partial<RetryOptions>
  ): Promise<Response> {
    const retry: RetryOptions = {
      attempts: retryOptions?.attempts || this.defaultRetryAttempts,
      delay: retryOptions?.delay || this.defaultRetryDelay,
      backoff: retryOptions?.backoff || 'exponential',
      shouldRetry: retryOptions?.shouldRetry || this.defaultShouldRetry
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= retry.attempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // If response is successful or non-retryable error, return it
        if (response.ok || !this.isRetryableHttpError(response.status)) {
          return response;
        }

        // Create error for retryable HTTP errors
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        if (!retry.shouldRetry || !retry.shouldRetry(lastError)) {
          throw lastError;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on abort or non-retryable errors
        if (lastError.name === 'AbortError' || !retry.shouldRetry || !retry.shouldRetry(lastError)) {
          throw lastError;
        }
      }

      // Wait before retrying (except on last attempt)
      if (attempt < retry.attempts) {
        const delay = this.calculateRetryDelay(attempt, retry.delay, retry.backoff || 'linear');
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private defaultShouldRetry = (error: any): boolean => {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.name === 'AbortError') return false;
    if (error.message?.includes('fetch')) return true; // Network errors
    if (error.message?.includes('HTTP 5')) return true; // 5xx errors
    if (error.message?.includes('HTTP 429')) return true; // Rate limiting
    return false;
  };

  private isRetryableHttpError(status: number): boolean {
    // Retry on 5xx errors and 429 (too many requests)
    return status >= 500 || status === 429;
  }

  private calculateRetryDelay(
    attempt: number, 
    baseDelay: number, 
    backoff: 'linear' | 'exponential'
  ): number {
    switch (backoff) {
      case 'linear':
        return baseDelay * attempt;
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      default:
        return baseDelay;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =====================================================
  // LOGGING AND ERROR HANDLING
  // =====================================================

  protected logInfo(message: string, data?: any): void {
    console.log(`[${this.constructor.name}] ${message}`, data || '');
  }

  protected logWarning(message: string, data?: any): void {
    console.warn(`[${this.constructor.name}] WARNING: ${message}`, data || '');
  }

  protected logError(message: string, error?: any): void {
    console.error(`[${this.constructor.name}] ERROR: ${message}`, error || '');
  }

  // =====================================================
  // DATA VALIDATION
  // =====================================================

  protected validateRequired(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => {
      const value = this.getNestedValue(data, field);
      return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected validatePhone(phone: string): boolean {
    // Basic phone validation (US format)
    const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // =====================================================
  // DATE AND TIME UTILITIES
  // =====================================================

  protected formatDateForApi(date: Date | string, format: 'iso' | 'date' | 'datetime' = 'iso'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'date':
        return d.toISOString().split('T')[0];
      case 'datetime':
        return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
      case 'iso':
      default:
        return d.toISOString();
    }
  }

  protected parseApiDate(dateString: string): Date {
    return new Date(dateString);
  }

  protected isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  // =====================================================
  // CONFIGURATION VALIDATION
  // =====================================================

  protected validateConfig(config: any, requiredFields: string[]): void {
    this.validateRequired(config, requiredFields);
    
    // Validate URLs
    if (config.baseUrl && !this.isValidUrl(config.baseUrl)) {
      throw new Error('Invalid baseUrl format');
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // =====================================================
  // RATE LIMITING
  // =====================================================

  private rateLimiters: Map<string, RateLimiter> = new Map();

  protected async withRateLimit<T>(
    key: string,
    maxRequests: number,
    windowMs: number,
    operation: () => Promise<T>
  ): Promise<T> {
    let limiter = this.rateLimiters.get(key);
    
    if (!limiter) {
      limiter = new RateLimiter(maxRequests, windowMs);
      this.rateLimiters.set(key, limiter);
    }

    await limiter.acquire();
    return operation();
  }

  // =====================================================
  // CACHING
  // =====================================================

  private cache: Map<string, CacheEntry> = new Map();

  protected async withCache<T>(
    key: string,
    operation: () => Promise<T>,
    ttlMs: number = 300000 // 5 minutes default
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    const result = await operation();
    
    this.cache.set(key, {
      data: result,
      expiresAt: Date.now() + ttlMs
    });

    return result;
  }

  protected clearCache(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(keyPattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // =====================================================
  // ABSTRACT METHODS
  // =====================================================

  abstract healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }>;
}

// =====================================================
// HELPER CLASSES
// =====================================================

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > windowStart);
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate how long to wait
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await this.sleep(waitTime);
        return this.acquire(); // Retry after waiting
      }
    }
    
    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}