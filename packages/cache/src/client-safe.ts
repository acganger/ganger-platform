// Client-safe cache interface that doesn't import Redis
export interface CacheOptions {
  ttl?: number;
  skipCache?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  lastReset: Date;
}

// Mock cache manager for client-side
export class ClientSafeCacheManager {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    lastReset: new Date()
  };

  async get<T>(key: string): Promise<T | null> {
    // On client side, always return cache miss
    this.metrics.misses++;
    this.metrics.totalRequests++;
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    // On client side, no-op
    return false;
  }

  async del(key: string): Promise<boolean> {
    // On client side, no-op
    return false;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    // On client side, no-op
    return 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      lastReset: new Date()
    };
  }

  async disconnect(): Promise<void> {
    // No-op on client
  }
}

// Export a safe instance for client-side
export const cacheManager = new ClientSafeCacheManager();

// Export compatible redisClient interface for compatibility
export const redisClient = {
  async get(key: string): Promise<string | null> {
    return null;
  },
  
  async setex(key: string, ttl: number, value: string): Promise<void> {
    // No-op
  },
  
  async del(...keys: string[]): Promise<number> {
    return 0;
  },
  
  async keys(pattern: string): Promise<string[]> {
    return [];
  },
  
  async ping(): Promise<string> {
    return 'PONG';
  },
  
  async eval(script: string, numKeys: number, ...args: string[]): Promise<any> {
    throw new Error('Redis operations not available on client side');
  },
  
  async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    return fields.map(() => null);
  },
  
  async hmset(key: string, ...fieldValues: string[]): Promise<void> {
    // No-op
  },
  
  async expire(key: string, seconds: number): Promise<void> {
    // No-op
  },
  
  async zadd(key: string, score: number, member: string): Promise<void> {
    // No-op
  },
  
  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    return 0;
  },
  
  async zcard(key: string): Promise<number> {
    return 0;
  },
  
  async zrange(key: string, start: number, stop: number, ...options: string[]): Promise<string[]> {
    return [];
  },
  
  async incr(key: string): Promise<number> {
    return 1;
  }
};