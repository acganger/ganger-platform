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

  async get<T>(_key: string): Promise<T | null> {
    // On client side, always return cache miss
    this.metrics.misses++;
    this.metrics.totalRequests++;
    return null;
  }

  async set<T>(_key: string, _value: T, _ttl?: number): Promise<boolean> {
    // On client side, no-op
    return false;
  }

  async del(_key: string): Promise<boolean> {
    // On client side, no-op
    return false;
  }

  async invalidatePattern(_pattern: string): Promise<number> {
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
  async get(_key: string): Promise<string | null> {
    return null;
  },
  
  async setex(_key: string, _ttl: number, _value: string): Promise<void> {
    // No-op
  },
  
  async del(..._keys: string[]): Promise<number> {
    return 0;
  },
  
  async keys(_pattern: string): Promise<string[]> {
    return [];
  },
  
  async ping(): Promise<string> {
    return 'PONG';
  },
  
  async eval(_script: string, _numKeys: number, ..._args: string[]): Promise<any> {
    throw new Error('Redis operations not available on client side');
  },
  
  async hmget(_key: string, ...fields: string[]): Promise<(string | null)[]> {
    return fields.map(() => null);
  },
  
  async hmset(_key: string, ..._fieldValues: string[]): Promise<void> {
    // No-op
  },
  
  async expire(_key: string, _seconds: number): Promise<void> {
    // No-op
  },
  
  async zadd(_key: string, _score: number, _member: string): Promise<void> {
    // No-op
  },
  
  async zremrangebyscore(_key: string, _min: number, _max: number): Promise<number> {
    return 0;
  },
  
  async zcard(_key: string): Promise<number> {
    return 0;
  },
  
  async zrange(_key: string, _start: number, _stop: number, ..._options: string[]): Promise<string[]> {
    return [];
  },
  
  async incr(_key: string): Promise<number> {
    return 1;
  }
};