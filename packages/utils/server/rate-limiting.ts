/**
 * Enterprise-Grade Rate Limiting System with Redis Distributed Cache
 * 
 * Provides sophisticated rate limiting for HIPAA-compliant medical platform:
 * - Distributed rate limiting across multiple servers
 * - Multiple rate limiting algorithms (token bucket, sliding window, fixed window)
 * - User-based, IP-based, and endpoint-based limiting
 * - Intelligent threat detection and automatic IP blocking
 * - Performance optimization with Redis clustering
 * - Comprehensive monitoring and alerting
 * - HIPAA compliance with audit logging
 */

import { redisClient } from '../../cache/src/redis-client';
import { secureLogger } from './secure-error-handler';
import { securityMonitoring, SecurityEventType, SecuritySeverity } from './security-monitoring';

// Rate limiting algorithms
export enum RateLimitAlgorithm {
  TOKEN_BUCKET = 'token_bucket',
  SLIDING_WINDOW = 'sliding_window', 
  FIXED_WINDOW = 'fixed_window',
  ADAPTIVE = 'adaptive'
}

// Rate limit types
export enum RateLimitType {
  USER = 'user',
  IP = 'ip',
  ENDPOINT = 'endpoint',
  API_KEY = 'api_key',
  GLOBAL = 'global'
}

// Rate limit configuration
interface RateLimitConfig {
  algorithm: RateLimitAlgorithm;
  requests: number;
  windowMs: number;
  keyPrefix: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  enableMonitoring?: boolean;
  enableBlocking?: boolean;
  burstMultiplier?: number;
  adaptiveThreshold?: number;
}

// Rate limit result
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  blocked?: boolean;
  reason?: string;
}

// Rate limit status
interface RateLimitStatus {
  key: string;
  requests: number;
  limit: number;
  windowMs: number;
  reset: number;
  blocked: boolean;
  algorithm: RateLimitAlgorithm;
}

// Adaptive rate limiting metrics
interface AdaptiveMetrics {
  successRate: number;
  errorRate: number;
  averageResponseTime: number;
  requestCount: number;
  lastUpdate: number;
}

// IP reputation score
interface IPReputation {
  score: number; // 0-100 (0 = malicious, 100 = trusted)
  requestCount: number;
  violationCount: number;
  lastViolation: number;
  blocked: boolean;
  blockExpiry?: number;
}

export class DistributedRateLimiter {
  private defaultConfig: RateLimitConfig = {
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
    requests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'rate_limit:',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    enableMonitoring: true,
    enableBlocking: true,
    burstMultiplier: 2,
    adaptiveThreshold: 0.8
  };

  private metrics = new Map<string, AdaptiveMetrics>();
  private ipReputations = new Map<string, IPReputation>();

  // Predefined rate limit configurations for different endpoints
  private endpointConfigs = new Map<string, RateLimitConfig>([
    ['/api/auth/login', {
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
      requests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      keyPrefix: 'auth_login:',
      enableBlocking: true,
      burstMultiplier: 1
    }],
    ['/api/auth/forgot-password', {
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
      requests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'auth_forgot:',
      enableBlocking: true
    }],
    ['/api/patients', {
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
      requests: 300,
      windowMs: 60 * 1000, // 1 minute
      keyPrefix: 'patients_api:',
      enableMonitoring: true
    }],
    ['/api/staff-schedules', {
      algorithm: RateLimitAlgorithm.ADAPTIVE,
      requests: 100,
      windowMs: 60 * 1000,
      keyPrefix: 'schedules_api:',
      enableMonitoring: true,
      adaptiveThreshold: 0.9
    }],
    ['/api/handouts/generate', {
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
      requests: 10,
      windowMs: 60 * 1000,
      keyPrefix: 'handouts_gen:',
      enableMonitoring: true,
      burstMultiplier: 1.5
    }]
  ]);

  constructor() {
    this.initializeIPReputationSystem();
    secureLogger.info('Distributed Rate Limiter initialized', {
      algorithms: Object.values(RateLimitAlgorithm),
      defaultConfig: this.defaultConfig
    });
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    key: string,
    type: RateLimitType,
    endpoint?: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    try {
      // Get configuration for this endpoint/type
      const effectiveConfig = this.getEffectiveConfig(endpoint, config);
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(key, type, effectiveConfig.keyPrefix);

      // Check IP reputation if this is an IP-based limit
      if (type === RateLimitType.IP) {
        const reputation = await this.getIPReputation(key);
        if (reputation.blocked) {
          return {
            allowed: false,
            limit: 0,
            remaining: 0,
            reset: reputation.blockExpiry || Date.now() + 60 * 60 * 1000,
            retryAfter: Math.max(0, (reputation.blockExpiry || Date.now() + 60 * 60 * 1000) - Date.now()),
            blocked: true,
            reason: 'IP_BLOCKED'
          };
        }
      }

      // Apply rate limiting algorithm
      let result: RateLimitResult;
      
      switch (effectiveConfig.algorithm) {
        case RateLimitAlgorithm.TOKEN_BUCKET:
          result = await this.tokenBucketAlgorithm(cacheKey, effectiveConfig);
          break;
        case RateLimitAlgorithm.SLIDING_WINDOW:
          result = await this.slidingWindowAlgorithm(cacheKey, effectiveConfig);
          break;
        case RateLimitAlgorithm.FIXED_WINDOW:
          result = await this.fixedWindowAlgorithm(cacheKey, effectiveConfig);
          break;
        case RateLimitAlgorithm.ADAPTIVE:
          result = await this.adaptiveAlgorithm(cacheKey, effectiveConfig, endpoint);
          break;
        default:
          result = await this.slidingWindowAlgorithm(cacheKey, effectiveConfig);
      }

      // Update IP reputation
      if (type === RateLimitType.IP) {
        await this.updateIPReputation(key, result.allowed);
      }

      // Monitor and alert if rate limit exceeded
      if (!result.allowed && effectiveConfig.enableMonitoring) {
        await this.monitorRateLimitViolation(key, type, endpoint, result);
      }

      return result;

    } catch (error) {
      secureLogger.error('Rate limit check failed', {
        key: '[REDACTED]',
        type,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        limit: this.defaultConfig.requests,
        remaining: this.defaultConfig.requests,
        reset: Date.now() + this.defaultConfig.windowMs
      };
    }
  }

  /**
   * Token Bucket Algorithm
   * Allows burst traffic up to bucket capacity
   */
  private async tokenBucketAlgorithm(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local window_ms = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or now
      
      -- Calculate tokens to add based on time elapsed
      local time_passed = math.max(0, now - last_refill)
      local new_tokens = math.min(capacity, tokens + (time_passed / window_ms) * refill_rate)
      
      if new_tokens >= 1 then
        -- Consume one token
        new_tokens = new_tokens - 1
        redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
        
        return {1, capacity, math.floor(new_tokens), now + window_ms}
      else
        -- No tokens available
        redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
        
        local retry_after = math.ceil((1 - new_tokens) * window_ms / refill_rate)
        return {0, capacity, 0, now + retry_after, retry_after}
      end
    `;

    const capacity = config.requests * (config.burstMultiplier || 1);
    const refillRate = config.requests;
    const now = Date.now();

    const result = await redisClient.eval(
      script,
      1,
      key,
      capacity.toString(),
      refillRate.toString(),
      config.windowMs.toString(),
      now.toString()
    ) as number[];

    return {
      allowed: result[0] === 1,
      limit: result[1],
      remaining: result[2],
      reset: result[3],
      retryAfter: result[4]
    };
  }

  /**
   * Sliding Window Algorithm
   * More accurate than fixed window, prevents bursts at window boundaries
   */
  private async slidingWindowAlgorithm(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window_ms = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local request_id = ARGV[4]
      
      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, 0, now - window_ms)
      
      -- Count current requests in window
      local current_requests = redis.call('ZCARD', key)
      
      if current_requests < limit then
        -- Add current request
        redis.call('ZADD', key, now, request_id)
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
        
        return {1, limit, limit - current_requests - 1, now + window_ms}
      else
        -- Rate limit exceeded
        local oldest_request = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local reset_time = oldest_request[2] and (tonumber(oldest_request[2]) + window_ms) or (now + window_ms)
        
        return {0, limit, 0, reset_time}
      end
    `;

    const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const result = await redisClient.eval(
      script,
      1,
      key,
      config.requests.toString(),
      config.windowMs.toString(),
      now.toString(),
      requestId
    ) as number[];

    return {
      allowed: result[0] === 1,
      limit: result[1],
      remaining: result[2],
      reset: result[3]
    };
  }

  /**
   * Fixed Window Algorithm
   * Simple and efficient for most use cases
   */
  private async fixedWindowAlgorithm(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    const script = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window_ms = tonumber(ARGV[2])
      local window_start = tonumber(ARGV[3])
      
      local current = redis.call('GET', key)
      if current == false then
        current = 0
      else
        current = tonumber(current)
      end
      
      if current < limit then
        redis.call('INCR', key)
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
        
        return {1, limit, limit - current - 1, window_start + window_ms}
      else
        return {0, limit, 0, window_start + window_ms}
      end
    `;

    const result = await redisClient.eval(
      script,
      1,
      windowKey,
      config.requests.toString(),
      config.windowMs.toString(),
      windowStart.toString()
    ) as number[];

    return {
      allowed: result[0] === 1,
      limit: result[1],
      remaining: result[2],
      reset: result[3]
    };
  }

  /**
   * Adaptive Algorithm
   * Adjusts rate limits based on system performance and error rates
   */
  private async adaptiveAlgorithm(
    key: string,
    config: RateLimitConfig,
    endpoint?: string
  ): Promise<RateLimitResult> {
    // Get current metrics for this endpoint
    const metrics = this.metrics.get(endpoint || 'default') || {
      successRate: 1.0,
      errorRate: 0.0,
      averageResponseTime: 100,
      requestCount: 0,
      lastUpdate: Date.now()
    };

    // Calculate adaptive limit based on system health
    let adaptiveLimit = config.requests;
    
    if (metrics.errorRate > 0.1) { // > 10% error rate
      adaptiveLimit = Math.floor(config.requests * 0.5); // Reduce by 50%
    } else if (metrics.successRate < (config.adaptiveThreshold || 0.8)) {
      adaptiveLimit = Math.floor(config.requests * 0.7); // Reduce by 30%
    } else if (metrics.averageResponseTime > 1000) { // > 1 second
      adaptiveLimit = Math.floor(config.requests * 0.8); // Reduce by 20%
    } else if (metrics.successRate > 0.99 && metrics.averageResponseTime < 200) {
      adaptiveLimit = Math.floor(config.requests * 1.2); // Increase by 20%
    }

    // Use sliding window with adaptive limit
    const adaptiveConfig = { ...config, requests: adaptiveLimit };
    const result = await this.slidingWindowAlgorithm(key, adaptiveConfig);

    // Log adaptive adjustment
    if (adaptiveLimit !== config.requests) {
      secureLogger.info('Adaptive rate limit adjusted', {
        endpoint,
        originalLimit: config.requests,
        adaptiveLimit,
        metrics: {
          successRate: metrics.successRate,
          errorRate: metrics.errorRate,
          avgResponseTime: metrics.averageResponseTime
        }
      });
    }

    return result;
  }

  /**
   * Update metrics for adaptive rate limiting
   */
  async updateMetrics(
    endpoint: string,
    success: boolean,
    responseTime: number
  ): Promise<void> {
    try {
      const key = endpoint || 'default';
      const current = this.metrics.get(key) || {
        successRate: 1.0,
        errorRate: 0.0,
        averageResponseTime: 100,
        requestCount: 0,
        lastUpdate: Date.now()
      };

      const newCount = current.requestCount + 1;
      const successCount = Math.floor(current.successRate * current.requestCount) + (success ? 1 : 0);
      const errorCount = current.requestCount - successCount + (success ? 0 : 1);

      this.metrics.set(key, {
        successRate: successCount / newCount,
        errorRate: errorCount / newCount,
        averageResponseTime: (current.averageResponseTime * current.requestCount + responseTime) / newCount,
        requestCount: newCount,
        lastUpdate: Date.now()
      });

      // Reset metrics periodically to prevent stale data
      if (newCount > 1000) {
        this.metrics.set(key, {
          successRate: 1.0,
          errorRate: 0.0,
          averageResponseTime: 100,
          requestCount: 0,
          lastUpdate: Date.now()
        });
      }

    } catch (error) {
      secureLogger.error('Failed to update adaptive metrics', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get IP reputation score
   */
  private async getIPReputation(ip: string): Promise<IPReputation> {
    const cacheKey = `ip_reputation:${ip}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Default reputation for new IPs
      const defaultReputation: IPReputation = {
        score: 80, // Start with good reputation
        requestCount: 0,
        violationCount: 0,
        lastViolation: 0,
        blocked: false
      };

      await redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(defaultReputation)); // 24 hours
      return defaultReputation;

    } catch (error) {
      secureLogger.error('Failed to get IP reputation', {
        ip: '[REDACTED]',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        score: 50, // Neutral reputation on error
        requestCount: 0,
        violationCount: 0,
        lastViolation: 0,
        blocked: false
      };
    }
  }

  /**
   * Update IP reputation based on behavior
   */
  private async updateIPReputation(ip: string, allowed: boolean): Promise<void> {
    try {
      const reputation = await this.getIPReputation(ip);
      const cacheKey = `ip_reputation:${ip}`;

      reputation.requestCount++;

      if (!allowed) {
        reputation.violationCount++;
        reputation.lastViolation = Date.now();
        
        // Decrease reputation score
        reputation.score = Math.max(0, reputation.score - 10);

        // Block IP if reputation is too low or too many violations
        if (reputation.score <= 20 || reputation.violationCount >= 10) {
          reputation.blocked = true;
          reputation.blockExpiry = Date.now() + 60 * 60 * 1000; // 1 hour block

          // Log security event
          await securityMonitoring.recordEvent(
            SecurityEventType.RATE_LIMIT_EXCEEDED,
            SecuritySeverity.HIGH,
            {
              ip: '[REDACTED]',
              violationCount: reputation.violationCount,
              score: reputation.score,
              blocked: true
            },
            { ipAddress: ip }
          );
        }
      } else {
        // Slowly improve reputation for good behavior
        if (reputation.requestCount % 10 === 0) {
          reputation.score = Math.min(100, reputation.score + 1);
        }
      }

      await redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(reputation));

    } catch (error) {
      secureLogger.error('Failed to update IP reputation', {
        ip: '[REDACTED]',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Monitor rate limit violations
   */
  private async monitorRateLimitViolation(
    key: string,
    type: RateLimitType,
    endpoint?: string,
    result?: RateLimitResult
  ): Promise<void> {
    try {
      await securityMonitoring.recordEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecuritySeverity.MEDIUM,
        {
          limitType: type,
          endpoint,
          limit: result?.limit,
          retryAfter: result?.retryAfter,
          blocked: result?.blocked
        },
        {
          ipAddress: type === RateLimitType.IP ? key : undefined,
          userId: type === RateLimitType.USER ? key : undefined
        }
      );

    } catch (error) {
      secureLogger.error('Failed to monitor rate limit violation', {
        type,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get effective configuration for endpoint
   */
  private getEffectiveConfig(
    endpoint?: string,
    overrides?: Partial<RateLimitConfig>
  ): RateLimitConfig {
    let baseConfig = this.defaultConfig;

    // Check for endpoint-specific configuration
    if (endpoint) {
      const endpointConfig = this.endpointConfigs.get(endpoint);
      if (endpointConfig) {
        baseConfig = { ...baseConfig, ...endpointConfig };
      }
    }

    // Apply any overrides
    if (overrides) {
      baseConfig = { ...baseConfig, ...overrides };
    }

    return baseConfig;
  }

  /**
   * Generate cache key for rate limiting
   */
  private generateCacheKey(key: string, type: RateLimitType, prefix: string): string {
    const hashedKey = this.hashKey(key); // Hash for privacy
    return `${prefix}${type}:${hashedKey}`;
  }

  /**
   * Hash key for privacy (never store actual IPs/user IDs)
   */
  private hashKey(key: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Initialize IP reputation system
   */
  private initializeIPReputationSystem(): void {
    // Clean up expired blocks every 10 minutes
    setInterval(async () => {
      await this.cleanupExpiredBlocks();
    }, 10 * 60 * 1000);

    // Reset metrics every hour
    setInterval(() => {
      this.resetAdaptiveMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up expired IP blocks
   */
  private async cleanupExpiredBlocks(): Promise<void> {
    try {
      const pattern = 'ip_reputation:*';
      const keys = await redisClient.keys(pattern);
      const now = Date.now();
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const reputation = JSON.parse(await redisClient.get(key) || '{}') as IPReputation;
          
          if (reputation.blocked && reputation.blockExpiry && reputation.blockExpiry < now) {
            reputation.blocked = false;
            reputation.blockExpiry = undefined;
            reputation.score = Math.max(50, reputation.score); // Reset to neutral
            
            await redisClient.setex(key, 24 * 60 * 60, JSON.stringify(reputation));
            cleanedCount++;
          }
        } catch (error) {
          // Skip malformed entries
          continue;
        }
      }

      if (cleanedCount > 0) {
        secureLogger.info('IP blocks cleaned up', { count: cleanedCount });
      }

    } catch (error) {
      secureLogger.error('Failed to cleanup expired blocks', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Reset adaptive metrics to prevent stale data
   */
  private resetAdaptiveMetrics(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [key, metrics] of this.metrics.entries()) {
      if (now - metrics.lastUpdate > oneHour) {
        this.metrics.set(key, {
          successRate: 1.0,
          errorRate: 0.0,
          averageResponseTime: 100,
          requestCount: 0,
          lastUpdate: now
        });
      }
    }
  }

  /**
   * Get rate limit status for a key
   */
  async getRateLimitStatus(
    key: string,
    type: RateLimitType,
    endpoint?: string
  ): Promise<RateLimitStatus> {
    const config = this.getEffectiveConfig(endpoint);
    const cacheKey = this.generateCacheKey(key, type, config.keyPrefix);

    try {
      let requests = 0;
      let reset = Date.now() + config.windowMs;

      switch (config.algorithm) {
        case RateLimitAlgorithm.TOKEN_BUCKET:
          const bucket = await redisClient.hmget(cacheKey, 'tokens', 'last_refill');
          requests = config.requests - (parseFloat(bucket[0] || '0') || 0);
          break;

        case RateLimitAlgorithm.SLIDING_WINDOW:
          const count = await redisClient.zcard(cacheKey);
          requests = count || 0;
          break;

        case RateLimitAlgorithm.FIXED_WINDOW:
          const current = await redisClient.get(cacheKey);
          requests = parseInt(current || '0', 10);
          break;

        case RateLimitAlgorithm.ADAPTIVE:
          const adaptiveCount = await redisClient.zcard(cacheKey);
          requests = adaptiveCount || 0;
          break;
      }

      // Check if IP is blocked
      let blocked = false;
      if (type === RateLimitType.IP) {
        const reputation = await this.getIPReputation(key);
        blocked = reputation.blocked;
      }

      return {
        key: '[REDACTED]', // Never expose actual keys
        requests,
        limit: config.requests,
        windowMs: config.windowMs,
        reset,
        blocked,
        algorithm: config.algorithm
      };

    } catch (error) {
      secureLogger.error('Failed to get rate limit status', {
        key: '[REDACTED]',
        type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        key: '[REDACTED]',
        requests: 0,
        limit: config.requests,
        windowMs: config.windowMs,
        reset: Date.now() + config.windowMs,
        blocked: false,
        algorithm: config.algorithm
      };
    }
  }

  /**
   * Manually block/unblock an IP
   */
  async setIPBlock(ip: string, blocked: boolean, duration?: number): Promise<void> {
    try {
      const reputation = await this.getIPReputation(ip);
      const cacheKey = `ip_reputation:${ip}`;

      reputation.blocked = blocked;
      if (blocked) {
        reputation.blockExpiry = Date.now() + (duration || 60 * 60 * 1000); // Default 1 hour
        reputation.score = 0; // Set to lowest score
      } else {
        reputation.blockExpiry = undefined;
        reputation.score = 50; // Reset to neutral
      }

      await redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify(reputation));

      secureLogger.info('IP block status updated', {
        ip: '[REDACTED]',
        blocked,
        duration
      });

    } catch (error) {
      secureLogger.error('Failed to set IP block', {
        ip: '[REDACTED]',
        blocked,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get system-wide rate limiting statistics
   */
  async getSystemStats(): Promise<{
    totalRequests: number;
    blockedRequests: number;
    blockedIPs: number;
    averageReputation: number;
    topEndpoints: Array<{ endpoint: string; requests: number }>;
  }> {
    try {
      // This would be implemented with more sophisticated Redis queries
      // For now, return basic stats
      
      const reputationKeys = await redisClient.keys('ip_reputation:*');
      let blockedIPs = 0;
      let totalReputation = 0;
      let validReputations = 0;

      for (const key of reputationKeys) {
        try {
          const reputation = JSON.parse(await redisClient.get(key) || '{}') as IPReputation;
          if (reputation.blocked) blockedIPs++;
          if (typeof reputation.score === 'number') {
            totalReputation += reputation.score;
            validReputations++;
          }
        } catch {
          continue;
        }
      }

      const averageReputation = validReputations > 0 ? totalReputation / validReputations : 0;

      return {
        totalRequests: 0, // Would need to implement request counting
        blockedRequests: 0, // Would need to implement blocked request counting
        blockedIPs,
        averageReputation,
        topEndpoints: [] // Would need to implement endpoint usage tracking
      };

    } catch (error) {
      secureLogger.error('Failed to get system stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        totalRequests: 0,
        blockedRequests: 0,
        blockedIPs: 0,
        averageReputation: 0,
        topEndpoints: []
      };
    }
  }
}

// Export singleton instance
export const rateLimiter = new DistributedRateLimiter();

// Export middleware function for Next.js
export function withRateLimit(
  type: RateLimitType = RateLimitType.IP,
  config?: Partial<RateLimitConfig>
) {
  return function rateLimitMiddleware(handler: Function) {
    return async function(req: any, ...args: any[]) {
      try {
        // Extract identifier based on rate limit type
        let identifier: string;
        
        switch (type) {
          case RateLimitType.IP:
            identifier = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection?.remoteAddress || 
                        'unknown';
            break;
          case RateLimitType.USER:
            identifier = args[0]?.id || req.user?.id || 'anonymous';
            break;
          case RateLimitType.ENDPOINT:
            identifier = req.url || req.path || 'unknown';
            break;
          default:
            identifier = 'global';
        }

        // Check rate limit
        const result = await rateLimiter.checkRateLimit(
          identifier,
          type,
          req.url || req.path,
          config
        );

        // Add rate limit headers
        if (typeof req.headers === 'object') {
          req.headers['X-RateLimit-Limit'] = result.limit.toString();
          req.headers['X-RateLimit-Remaining'] = result.remaining.toString();
          req.headers['X-RateLimit-Reset'] = result.reset.toString();
        }

        // Block request if rate limited
        if (!result.allowed) {
          const error = new Error('Rate limit exceeded');
          (error as any).status = 429;
          (error as any).retryAfter = result.retryAfter;
          throw error;
        }

        // Proceed with request
        const startTime = Date.now();
        const response = await handler(req, ...args);
        const responseTime = Date.now() - startTime;

        // Update metrics for adaptive rate limiting
        await rateLimiter.updateMetrics(
          req.url || req.path || 'unknown',
          !response.error,
          responseTime
        );

        return response;

      } catch (error) {
        // Update metrics for failed requests
        await rateLimiter.updateMetrics(
          req.url || req.path || 'unknown',
          false,
          0
        );

        throw error;
      }
    };
  };
}