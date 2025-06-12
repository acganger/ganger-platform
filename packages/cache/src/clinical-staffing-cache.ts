/**
 * Enterprise-Grade Redis Caching System for Clinical Staffing
 * 
 * Provides high-performance, distributed caching with:
 * - Role-based permission caching
 * - Schedule conflict prevention caching
 * - Location access optimization
 * - Cache invalidation strategies
 * - Performance monitoring
 */

import { redisClient } from './redis-client';
// Simple logger to avoid dependency cascade
const secureLogger = {
  info: (message: string, context: any = {}) => {
    console.info('[CACHE_LOG]', message, context);
  },
  warn: (message: string, context: any = {}) => {
    console.warn('[CACHE_LOG]', message, context);
  },
  error: (message: string, context: any = {}) => {
    console.error('[CACHE_LOG]', message, context);
  }
};
import * as crypto from 'crypto';

// Cache configuration constants
const CACHE_PREFIXES = {
  USER_ROLES: 'staffing:user_roles:',
  USER_PERMISSIONS: 'staffing:user_perms:',
  LOCATION_ACCESS: 'staffing:location_access:',
  SCHEDULE_CONFLICTS: 'staffing:conflicts:',
  STAFF_AVAILABILITY: 'staffing:availability:',
  BUSINESS_RULES: 'staffing:rules:',
  ANALYTICS: 'staffing:analytics:'
} as const;

const CACHE_TTL = {
  USER_ROLES: 300, // 5 minutes
  USER_PERMISSIONS: 300, // 5 minutes  
  LOCATION_ACCESS: 600, // 10 minutes
  SCHEDULE_CONFLICTS: 60, // 1 minute (frequently changing)
  STAFF_AVAILABILITY: 1800, // 30 minutes
  BUSINESS_RULES: 3600, // 1 hour
  ANALYTICS: 7200 // 2 hours
} as const;

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  averageLatency: number;
}

export class ClinicalStaffingCache {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0, 
    errors: 0,
    totalRequests: 0,
    averageLatency: 0
  };

  private latencyBuffer: number[] = [];

  /**
   * Generate secure cache key with proper namespacing
   */
  private generateCacheKey(prefix: string, identifier: string, suffix?: string): string {
    const base = `${prefix}${identifier}`;
    return suffix ? `${base}:${suffix}` : base;
  }

  /**
   * Create cache key hash for sensitive data
   */
  private hashSensitiveKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Execute cache operation with performance monitoring
   */
  private async withMetrics<T>(operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.metrics.totalRequests++;

    try {
      const result = await operation();
      const latency = Date.now() - start;
      
      this.latencyBuffer.push(latency);
      if (this.latencyBuffer.length > 100) {
        this.latencyBuffer = this.latencyBuffer.slice(-100);
      }
      
      this.metrics.averageLatency = this.latencyBuffer.reduce((a, b) => a + b, 0) / this.latencyBuffer.length;
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  // ================================================
  // USER ROLES AND PERMISSIONS CACHING
  // ================================================

  /**
   * Cache user roles with automatic invalidation
   */
  async cacheUserRoles(userId: string, roles: string[]): Promise<void> {
    const key = this.generateCacheKey(CACHE_PREFIXES.USER_ROLES, this.hashSensitiveKey(userId));
    
    await this.withMetrics(async () => {
      await redisClient.setex(key, CACHE_TTL.USER_ROLES, JSON.stringify({
        roles,
        cached_at: Date.now(),
        version: 1
      }));
      
      secureLogger.info('User roles cached', { 
        userId: '[REDACTED]', 
        rolesCount: roles.length,
        ttl: CACHE_TTL.USER_ROLES
      });
    });
  }

  /**
   * Get cached user roles
   */
  async getCachedUserRoles(userId: string): Promise<string[] | null> {
    const key = this.generateCacheKey(CACHE_PREFIXES.USER_ROLES, this.hashSensitiveKey(userId));
    
    return await this.withMetrics(async () => {
      const cached = await redisClient.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      const data = JSON.parse(cached);
      
      // Validate cache structure
      if (!data.roles || !Array.isArray(data.roles)) {
        secureLogger.warn('Invalid cached user roles structure', { userId: '[REDACTED]' });
        await redisClient.del(key);
        return null;
      }

      return data.roles;
    });
  }

  /**
   * Cache user permissions for specific resource
   */
  async cacheUserPermissions(userId: string, resourceType: string, permissions: string[]): Promise<void> {
    const key = this.generateCacheKey(
      CACHE_PREFIXES.USER_PERMISSIONS, 
      this.hashSensitiveKey(userId), 
      resourceType
    );
    
    await this.withMetrics(async () => {
      await redisClient.setex(key, CACHE_TTL.USER_PERMISSIONS, JSON.stringify({
        permissions,
        resource_type: resourceType,
        cached_at: Date.now(),
        version: 1
      }));
    });
  }

  /**
   * Get cached user permissions
   */
  async getCachedUserPermissions(userId: string, resourceType: string): Promise<string[] | null> {
    const key = this.generateCacheKey(
      CACHE_PREFIXES.USER_PERMISSIONS, 
      this.hashSensitiveKey(userId), 
      resourceType
    );
    
    return await this.withMetrics(async () => {
      const cached = await redisClient.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      const data = JSON.parse(cached);
      return data.permissions;
    });
  }

  // ================================================
  // LOCATION ACCESS CACHING
  // ================================================

  /**
   * Cache location access for user
   */
  async cacheLocationAccess(userId: string, locationAccess: Record<string, boolean>): Promise<void> {
    const key = this.generateCacheKey(CACHE_PREFIXES.LOCATION_ACCESS, this.hashSensitiveKey(userId));
    
    await this.withMetrics(async () => {
      await redisClient.setex(key, CACHE_TTL.LOCATION_ACCESS, JSON.stringify({
        locations: locationAccess,
        cached_at: Date.now(),
        version: 1
      }));
    });
  }

  /**
   * Get cached location access
   */
  async getCachedLocationAccess(userId: string): Promise<Record<string, boolean> | null> {
    const key = this.generateCacheKey(CACHE_PREFIXES.LOCATION_ACCESS, this.hashSensitiveKey(userId));
    
    return await this.withMetrics(async () => {
      const cached = await redisClient.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      const data = JSON.parse(cached);
      return data.locations;
    });
  }

  // ================================================
  // SCHEDULE CONFLICT CACHING
  // ================================================

  /**
   * Cache schedule conflicts for staff member on specific date
   */
  async cacheScheduleConflicts(staffMemberId: string, date: string, conflicts: any[]): Promise<void> {
    const key = this.generateCacheKey(
      CACHE_PREFIXES.SCHEDULE_CONFLICTS, 
      staffMemberId, 
      date
    );
    
    await this.withMetrics(async () => {
      await redisClient.setex(key, CACHE_TTL.SCHEDULE_CONFLICTS, JSON.stringify({
        conflicts,
        date,
        cached_at: Date.now(),
        version: 1
      }));
    });
  }

  /**
   * Get cached schedule conflicts
   */
  async getCachedScheduleConflicts(staffMemberId: string, date: string): Promise<any[] | null> {
    const key = this.generateCacheKey(
      CACHE_PREFIXES.SCHEDULE_CONFLICTS, 
      staffMemberId, 
      date
    );
    
    return await this.withMetrics(async () => {
      const cached = await redisClient.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      const data = JSON.parse(cached);
      return data.conflicts;
    });
  }

  // ================================================
  // STAFF AVAILABILITY CACHING
  // ================================================

  /**
   * Cache staff availability for date range
   */
  async cacheStaffAvailability(staffMemberId: string, dateRange: string, availability: any[]): Promise<void> {
    const key = this.generateCacheKey(
      CACHE_PREFIXES.STAFF_AVAILABILITY, 
      staffMemberId, 
      dateRange
    );
    
    await this.withMetrics(async () => {
      await redisClient.setex(key, CACHE_TTL.STAFF_AVAILABILITY, JSON.stringify({
        availability,
        date_range: dateRange,
        cached_at: Date.now(),
        version: 1
      }));
    });
  }

  /**
   * Get cached staff availability
   */
  async getCachedStaffAvailability(staffMemberId: string, dateRange: string): Promise<any[] | null> {
    const key = this.generateCacheKey(
      CACHE_PREFIXES.STAFF_AVAILABILITY, 
      staffMemberId, 
      dateRange
    );
    
    return await this.withMetrics(async () => {
      const cached = await redisClient.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      const data = JSON.parse(cached);
      return data.availability;
    });
  }

  // ================================================
  // BUSINESS RULES CACHING
  // ================================================

  /**
   * Cache business rules validation results
   */
  async cacheBusinessRuleValidation(ruleKey: string, validationResult: any): Promise<void> {
    const key = this.generateCacheKey(CACHE_PREFIXES.BUSINESS_RULES, ruleKey);
    
    await this.withMetrics(async () => {
      await redisClient.setex(key, CACHE_TTL.BUSINESS_RULES, JSON.stringify({
        result: validationResult,
        cached_at: Date.now(),
        version: 1
      }));
    });
  }

  /**
   * Get cached business rule validation
   */
  async getCachedBusinessRuleValidation(ruleKey: string): Promise<any | null> {
    const key = this.generateCacheKey(CACHE_PREFIXES.BUSINESS_RULES, ruleKey);
    
    return await this.withMetrics(async () => {
      const cached = await redisClient.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      const data = JSON.parse(cached);
      return data.result;
    });
  }

  // ================================================
  // ANALYTICS CACHING
  // ================================================

  /**
   * Cache analytics dashboard data
   */
  async cacheAnalytics(analyticsKey: string, data: any): Promise<void> {
    const key = this.generateCacheKey(CACHE_PREFIXES.ANALYTICS, analyticsKey);
    
    await this.withMetrics(async () => {
      await redisClient.setex(key, CACHE_TTL.ANALYTICS, JSON.stringify({
        data,
        cached_at: Date.now(),
        version: 1
      }));
    });
  }

  /**
   * Get cached analytics data
   */
  async getCachedAnalytics(analyticsKey: string): Promise<any | null> {
    const key = this.generateCacheKey(CACHE_PREFIXES.ANALYTICS, analyticsKey);
    
    return await this.withMetrics(async () => {
      const cached = await redisClient.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      const data = JSON.parse(cached);
      return data.data;
    });
  }

  // ================================================
  // CACHE INVALIDATION
  // ================================================

  /**
   * Invalidate all caches for a specific user
   */
  async invalidateUserCaches(userId: string): Promise<void> {
    const hashedUserId = this.hashSensitiveKey(userId);
    const patterns = [
      `${CACHE_PREFIXES.USER_ROLES}${hashedUserId}*`,
      `${CACHE_PREFIXES.USER_PERMISSIONS}${hashedUserId}*`,
      `${CACHE_PREFIXES.LOCATION_ACCESS}${hashedUserId}*`
    ];

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }

    secureLogger.info('User caches invalidated', { 
      userId: '[REDACTED]',
      patternsCleared: patterns.length
    });
  }

  /**
   * Invalidate schedule-related caches for staff member
   */
  async invalidateScheduleCaches(staffMemberId: string, date?: string): Promise<void> {
    const patterns = date 
      ? [`${CACHE_PREFIXES.SCHEDULE_CONFLICTS}${staffMemberId}:${date}*`]
      : [`${CACHE_PREFIXES.SCHEDULE_CONFLICTS}${staffMemberId}*`];

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  }

  /**
   * Invalidate all analytics caches
   */
  async invalidateAnalyticsCaches(): Promise<void> {
    const keys = await redisClient.keys(`${CACHE_PREFIXES.ANALYTICS}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }

  // ================================================
  // PERFORMANCE MONITORING
  // ================================================

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): CacheMetrics & { hitRate: number } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0,
      averageLatency: 0
    };
    this.latencyBuffer = [];
  }

  /**
   * Get cache health status
   */
  async getCacheHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis_connected: boolean;
    hit_rate: number;
    average_latency: number;
    error_rate: number;
  }> {
    const metrics = this.getCacheMetrics();
    const errorRate = metrics.totalRequests > 0 
      ? (metrics.errors / metrics.totalRequests) * 100 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 10 || metrics.averageLatency > 1000) {
      status = 'unhealthy';
    } else if (errorRate > 5 || metrics.averageLatency > 500 || metrics.hitRate < 50) {
      status = 'degraded';
    }

    try {
      await redisClient.ping();
      return {
        status,
        redis_connected: true,
        hit_rate: metrics.hitRate,
        average_latency: metrics.averageLatency,
        error_rate: errorRate
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        redis_connected: false,
        hit_rate: 0,
        average_latency: 0,
        error_rate: 100
      };
    }
  }
}

// Export singleton instance
export const clinicalStaffingCache = new ClinicalStaffingCache();

// Export cache utilities
export const cacheUtils = {
  /**
   * Generate cache key for complex queries
   */
  generateQueryCacheKey: (query: string, params: any[]): string => {
    const queryHash = crypto.createHash('md5').update(query).digest('hex');
    const paramsHash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
    return `query:${queryHash}:${paramsHash}`;
  },

  /**
   * Cache database query results
   */
  cacheQueryResult: async (key: string, result: any, ttl: number = 300): Promise<void> => {
    await redisClient.setex(`query:${key}`, ttl, JSON.stringify({
      result,
      cached_at: Date.now(),
      version: 1
    }));
  },

  /**
   * Get cached query result
   */
  getCachedQueryResult: async (key: string): Promise<any | null> => {
    const cached = await redisClient.get(`query:${key}`);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data.result;
  }
};