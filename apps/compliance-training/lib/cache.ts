import Redis from 'ioredis';

interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  tags?: string[];
}

class ComplianceCache {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: unknown; expires: number; tags?: string[] }> = new Map();
  private isRedisEnabled: boolean = false;
  private keyPrefix: string = 'compliance:';

  constructor(config?: CacheConfig) {
    this.keyPrefix = config?.keyPrefix || 'compliance:';
    
    try {
      // Try to initialize Redis if configuration is available
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        this.initializeRedis(config);
      } else {
        // Redis not configured, using in-memory cache
      }
    } catch (_error) {
      // Failed to initialize Redis, falling back to memory cache
    }
  }

  private initializeRedis(config?: CacheConfig): void {
    try {
      const redisConfig: CacheConfig = {
        host: process.env.REDIS_HOST || config?.host || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379') || config?.port || 6379,
        password: process.env.REDIS_PASSWORD || config?.password,
        db: parseInt(process.env.REDIS_DB || '0') || config?.db || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        ...config
      };

      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
      } else {
        this.redis = new Redis(redisConfig);
      }

      this.redis.on('connect', () => {
        // Redis connected successfully
        this.isRedisEnabled = true;
      });

      this.redis.on('error', (error) => {
        // Redis error occurred
        this.isRedisEnabled = false;
      });

      this.redis.on('close', () => {
        // Redis connection closed, falling back to memory cache
        this.isRedisEnabled = false;
      });

    } catch (error) {
      // Failed to create Redis instance
      this.isRedisEnabled = false;
    }
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private serialize(value: unknown): string {
    return JSON.stringify(value);
  }

  private deserialize(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.getKey(key);

    try {
      // Try Redis first if available
      if (this.isRedisEnabled && this.redis) {
        const value = await this.redis.get(cacheKey);
        if (value !== null) {
          return this.deserialize(value) as T;
        }
      }

      // Fall back to memory cache
      const memEntry = this.memoryCache.get(cacheKey);
      if (memEntry && memEntry.expires > Date.now()) {
        return memEntry.value as T;
      }

      // Clean up expired memory cache entry
      if (memEntry && memEntry.expires <= Date.now()) {
        this.memoryCache.delete(cacheKey);
      }

      return null;
    } catch (_error) {
      // Cache get error occurred
      return null;
    }
  }

  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<boolean> {
    const cacheKey = this.getKey(key);
    const ttl = options.ttl || 300; // Default 5 minutes
    const serializedValue = this.serialize(value);

    try {
      // Try Redis first if available
      if (this.isRedisEnabled && this.redis) {
        await this.redis.setex(cacheKey, ttl, serializedValue);
        
        // Store tags for cache invalidation
        if (options.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            await this.redis.sadd(`${this.keyPrefix}tag:${tag}`, cacheKey);
            await this.redis.expire(`${this.keyPrefix}tag:${tag}`, ttl);
          }
        }
        
        return true;
      }

      // Fall back to memory cache
      this.memoryCache.set(cacheKey, {
        value,
        expires: Date.now() + (ttl * 1000),
        tags: options.tags
      });

      return true;
    } catch (_error) {
      // Cache set error occurred
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const cacheKey = this.getKey(key);

    try {
      // Delete from Redis if available
      if (this.isRedisEnabled && this.redis) {
        await this.redis.del(cacheKey);
      }

      // Delete from memory cache
      this.memoryCache.delete(cacheKey);

      return true;
    } catch (_error) {
      // Cache delete error occurred
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<boolean> {
    try {
      // Invalidate Redis cache by tag
      if (this.isRedisEnabled && this.redis) {
        const tagKey = `${this.keyPrefix}tag:${tag}`;
        const keys = await this.redis.smembers(tagKey);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(tagKey);
        }
      }

      // Invalidate memory cache by tag
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags && entry.tags.includes(tag)) {
          this.memoryCache.delete(key);
        }
      }

      return true;
    } catch (_error) {
      // Cache invalidate by tag error occurred
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      // Clear Redis cache with our prefix
      if (this.isRedisEnabled && this.redis) {
        const keys = await this.redis.keys(`${this.keyPrefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      // Clear memory cache
      this.memoryCache.clear();

      return true;
    } catch (_error) {
      // Cache clear error occurred
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const freshData = await fetchFn();
      await this.set(key, freshData, options);
      return freshData;
    } catch (_error) {
      // Error in getOrSet occurred
      throw _error;
    }
  }

  // Compliance-specific cache methods
  async cacheEmployeeData(employeeId: string, data: unknown, ttl: number = 600): Promise<boolean> {
    return this.set(`employee:${employeeId}`, data, {
      ttl,
      tags: ['employees', `employee:${employeeId}`]
    });
  }

  async getEmployeeData(employeeId: string): Promise<unknown> {
    return this.get(`employee:${employeeId}`);
  }

  async cacheComplianceDashboard(data: unknown, ttl: number = 300): Promise<boolean> {
    return this.set('dashboard', data, {
      ttl,
      tags: ['dashboard', 'compliance']
    });
  }

  async getComplianceDashboard(): Promise<unknown> {
    return this.get('dashboard');
  }

  async cacheTrainingCompletions(employeeId: string, completions: unknown[], ttl: number = 900): Promise<boolean> {
    return this.set(`completions:${employeeId}`, completions, {
      ttl,
      tags: ['completions', `employee:${employeeId}`, 'training']
    });
  }

  async getTrainingCompletions(employeeId: string): Promise<unknown[]> {
    const result = await this.get<any[]>(`completions:${employeeId}`);
    return result || [];
  }

  async invalidateEmployeeCache(employeeId: string): Promise<boolean> {
    await this.del(`employee:${employeeId}`);
    await this.del(`completions:${employeeId}`);
    await this.invalidateByTag(`employee:${employeeId}`);
    return true;
  }

  async invalidateDashboardCache(): Promise<boolean> {
    await this.invalidateByTag('dashboard');
    await this.invalidateByTag('compliance');
    return true;
  }

  // Cache statistics
  async getStats(): Promise<{
    memoryEntries: number;
    redisConnected: boolean;
    memoryUsage: number;
  }> {
    const memoryEntries = this.memoryCache.size;
    const memoryUsage = JSON.stringify([...this.memoryCache.entries()]).length;

    return {
      memoryEntries,
      redisConnected: this.isRedisEnabled,
      memoryUsage
    };
  }

  // Cleanup expired memory cache entries
  cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Start periodic cleanup
  startCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      this.cleanupMemoryCache();
    }, intervalMs);
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

// Singleton instance
export const cache = new ComplianceCache();

// Start cleanup on module load
cache.startCleanup();

// Cache middleware for API routes
export function withCache(
  handler: Function,
  cacheKey: string | ((req: any) => string),
  options: CacheOptions = {}
): Function {
  return async (req: any, res: any) => {
    try {
      // Generate cache key
      const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
      
      // Try to get cached response
      const cached = await cache.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Execute original handler and capture response
      const originalJson = res.json;
      let responseData: any;

      res.json = function (data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      const result = await handler(req, res);

      // Cache successful responses
      if (responseData && res.statusCode >= 200 && res.statusCode < 300) {
        await cache.set(key, responseData, options);
        res.setHeader('X-Cache', 'MISS');
      }

      return result;
    } catch (_error) {
      // Cache middleware error occurred
      return handler(req, res);
    }
  };
}

export default cache;