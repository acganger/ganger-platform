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
    console.debug(`[ClientCache] Get request for key: ${key}`);
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.updateHitRate();
    // TODO: Consider implementing localStorage or sessionStorage caching for client-side
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    // On client side, log the attempt but don't store
    console.debug(`[ClientCache] Set request for key: ${key}, value type: ${typeof value}, TTL: ${ttl || 'no expiry'}`);
    // TODO: Implement client-side storage with localStorage
    // Example implementation:
    // try {
    //   const data = { value, expires: ttl ? Date.now() + (ttl * 1000) : null };
    //   localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    //   return true;
    // } catch (e) {
    //   console.warn('Failed to store in localStorage:', e);
    //   return false;
    // }
    return false;
  }

  async del(key: string): Promise<boolean> {
    // On client side, log deletion attempt
    console.debug(`[ClientCache] Delete request for key: ${key}`);
    // TODO: Remove from localStorage when implemented
    // localStorage.removeItem(`cache_${key}`);
    return false;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    // On client side, log pattern invalidation attempt
    console.debug(`[ClientCache] Invalidate pattern request: ${pattern}`);
    // TODO: Implement pattern matching for localStorage keys
    // Example:
    // let count = 0;
    // const regex = new RegExp(pattern.replace('*', '.*'));
    // Object.keys(localStorage).forEach(key => {
    //   if (key.startsWith('cache_') && regex.test(key)) {
    //     localStorage.removeItem(key);
    //     count++;
    //   }
    // });
    // return count;
    return 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  private updateHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
    }
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
    console.debug(`[RedisClient Mock] GET ${key}`);
    // TODO: Integrate with ClientSafeCacheManager for consistency
    return null;
  },
  
  async setex(key: string, ttl: number, value: string): Promise<void> {
    console.debug(`[RedisClient Mock] SETEX ${key} ${ttl} (value length: ${value.length})`);
    // TODO: Store in localStorage with expiry when client-side caching is implemented
  },
  
  async del(...keys: string[]): Promise<number> {
    console.debug(`[RedisClient Mock] DEL ${keys.join(' ')}`);
    // TODO: Remove from localStorage when implemented
    return keys.length; // Pretend all keys were deleted
  },
  
  async keys(pattern: string): Promise<string[]> {
    console.debug(`[RedisClient Mock] KEYS ${pattern}`);
    // TODO: Implement pattern matching against localStorage keys
    // Example: return Object.keys(localStorage).filter(k => k.match(pattern));
    return [];
  },
  
  async ping(): Promise<string> {
    return 'PONG';
  },
  
  async eval(script: string, numKeys: number, ...args: string[]): Promise<any> {
    console.warn(`[RedisClient Mock] EVAL called with ${numKeys} keys and ${args.length} args`);
    console.debug(`Script preview: ${script.substring(0, 100)}...`);
    // Lua scripts cannot be executed on client side
    throw new Error('Redis EVAL operations not available on client side');
  },
  
  async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    console.debug(`[RedisClient Mock] HMGET ${key} ${fields.join(' ')}`);
    // TODO: Implement hash storage in localStorage
    // Return null for each requested field
    return fields.map(() => null);
  },
  
  async hmset(key: string, ...fieldValues: string[]): Promise<void> {
    console.debug(`[RedisClient Mock] HMSET ${key} (${fieldValues.length / 2} fields)`);
    // TODO: Store hash fields in localStorage as JSON object
    // Example: const hash = {}; for(let i=0; i<fieldValues.length; i+=2) hash[fieldValues[i]] = fieldValues[i+1];
  },
  
  async expire(key: string, seconds: number): Promise<void> {
    console.debug(`[RedisClient Mock] EXPIRE ${key} ${seconds}`);
    // TODO: Update expiry time in localStorage metadata
  },
  
  async zadd(key: string, score: number, member: string): Promise<void> {
    console.debug(`[RedisClient Mock] ZADD ${key} ${score} ${member}`);
    // TODO: Implement sorted set storage in localStorage
    // Could use an array of {score, member} objects sorted by score
  },
  
  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    console.debug(`[RedisClient Mock] ZREMRANGEBYSCORE ${key} ${min} ${max}`);
    // TODO: Remove members with scores between min and max from sorted set
    return 0; // Return number of removed members
  },
  
  async zcard(key: string): Promise<number> {
    console.debug(`[RedisClient Mock] ZCARD ${key}`);
    // TODO: Return the number of members in the sorted set
    return 0;
  },
  
  async zrange(key: string, start: number, stop: number, ...options: string[]): Promise<string[]> {
    console.debug(`[RedisClient Mock] ZRANGE ${key} ${start} ${stop} ${options.join(' ')}`);
    // TODO: Return range of members from sorted set
    // options might include 'WITHSCORES'
    return [];
  },
  
  async incr(key: string): Promise<number> {
    console.debug(`[RedisClient Mock] INCR ${key}`);
    // TODO: Implement counter in localStorage
    // Example: const current = parseInt(localStorage.getItem(key) || '0'); 
    // const newVal = current + 1; localStorage.setItem(key, newVal.toString());
    return 1; // Always return 1 for now
  }
};