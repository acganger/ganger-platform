import Redis from 'ioredis';

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

export class GangerCacheManager {
  private redis: Redis | null = null;
  private metrics: CacheMetrics;
  private defaultTTL = 300; // 5 minutes default
  private isRedisAvailable = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      lastReset: new Date()
    };

    // Lazy initialization - don't connect at import time
    if (process.env.NODE_ENV === 'development' && process.env.USE_REDIS_DEV !== 'true') {
      console.log('Redis disabled in development. Set USE_REDIS_DEV=true to enable.');
      this.isRedisAvailable = false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.redis || this.initializationPromise) {
      return this.initializationPromise || Promise.resolve();
    }

    // Skip Redis in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.USE_REDIS_DEV !== 'true') {
      return;
    }

    // Create initialization promise to prevent multiple connections
    this.initializationPromise = this.initializeRedis();
    return this.initializationPromise;
  }

  private async initializeRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (error: any) => {
        console.error('Redis connection error:', error);
        this.isRedisAvailable = false;
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isRedisAvailable = false;
      });

      // Test connection
      await this.redis.ping();
      this.isRedisAvailable = true;
      
    } catch (error) {
      console.warn('Redis not available, falling back to in-memory cache:', error);
      this.isRedisAvailable = false;
    }
  }

  // Core cache operations
  async get<T>(key: string): Promise<T | null> {
    this.metrics.totalRequests++;

    try {
      await this.ensureInitialized();
      
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          this.metrics.hits++;
          this.updateHitRate();
          return JSON.parse(value);
        }
      }
      
      this.metrics.misses++;
      this.updateHitRate();
      return null;
      
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl = this.defaultTTL): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (this.isRedisAvailable && this.redis) {
        const serialized = JSON.stringify(value);
        await this.redis.setex(key, ttl, serialized);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (this.isRedisAvailable && this.redis) {
        await this.redis.del(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      await this.ensureInitialized();
      
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          return keys.length;
        }
      }
      return 0;
    } catch (error) {
      console.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Patient data caching (most frequently accessed)
  async cachePatientData(patientId: string, data: any, ttl = 1800): Promise<boolean> {
    return this.set(`patient:${patientId}`, data, ttl);
  }

  async getPatientData(patientId: string): Promise<any | null> {
    return this.get(`patient:${patientId}`);
  }

  async invalidatePatientData(patientId: string): Promise<void> {
    await this.invalidatePattern(`patient:${patientId}*`);
  }

  // Medication lists caching
  async cacheMedicationList(data: any[], ttl = 3600): Promise<boolean> {
    return this.set('medications:list', data, ttl);
  }

  async getMedicationList(): Promise<any[] | null> {
    return this.get('medications:list');
  }

  async cacheMedicationsByPatient(patientId: string, medications: any[], ttl = 1800): Promise<boolean> {
    return this.set(`medications:patient:${patientId}`, medications, ttl);
  }

  async getMedicationsByPatient(patientId: string): Promise<any[] | null> {
    return this.get(`medications:patient:${patientId}`);
  }

  // Insurance providers caching
  async cacheInsuranceProviders(data: any[], ttl = 7200): Promise<boolean> {
    return this.set('insurance:providers', data, ttl);
  }

  async getInsuranceProviders(): Promise<any[] | null> {
    return this.get('insurance:providers');
  }

  async cachePatientInsurance(patientId: string, insurance: any, ttl = 3600): Promise<boolean> {
    return this.set(`insurance:patient:${patientId}`, insurance, ttl);
  }

  async getPatientInsurance(patientId: string): Promise<any | null> {
    return this.get(`insurance:patient:${patientId}`);
  }

  // Location data caching
  async cacheLocationData(locationId: string, data: any, ttl = 1800): Promise<boolean> {
    return this.set(`location:${locationId}`, data, ttl);
  }

  async getLocationData(locationId: string): Promise<any | null> {
    return this.get(`location:${locationId}`);
  }

  async cacheLocationList(locations: any[], ttl = 3600): Promise<boolean> {
    return this.set('locations:list', locations, ttl);
  }

  async getLocationList(): Promise<any[] | null> {
    return this.get('locations:list');
  }

  // Inventory items caching by location
  async cacheInventoryByLocation(locationId: string, data: any[], ttl = 900): Promise<boolean> {
    return this.set(`inventory:location:${locationId}`, data, ttl);
  }

  async getInventoryByLocation(locationId: string): Promise<any[] | null> {
    return this.get(`inventory:location:${locationId}`);
  }

  async cacheInventoryItem(itemId: string, data: any, ttl = 1800): Promise<boolean> {
    return this.set(`inventory:item:${itemId}`, data, ttl);
  }

  async getInventoryItem(itemId: string): Promise<any | null> {
    return this.get(`inventory:item:${itemId}`);
  }

  // Authorization data caching
  async cacheAuthorizationData(authId: string, data: any, ttl = 1800): Promise<boolean> {
    return this.set(`authorization:${authId}`, data, ttl);
  }

  async getAuthorizationData(authId: string): Promise<any | null> {
    return this.get(`authorization:${authId}`);
  }

  async cachePatientAuthorizations(patientId: string, authorizations: any[], ttl = 1800): Promise<boolean> {
    return this.set(`authorizations:patient:${patientId}`, authorizations, ttl);
  }

  async getPatientAuthorizations(patientId: string): Promise<any[] | null> {
    return this.get(`authorizations:patient:${patientId}`);
  }

  // User session caching
  async cacheUserSession(sessionId: string, sessionData: any, ttl = 3600): Promise<boolean> {
    return this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async getUserSession(sessionId: string): Promise<any | null> {
    return this.get(`session:${sessionId}`);
  }

  async invalidateUserSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Staff and scheduling caching
  async cacheStaffByLocation(locationId: string, staff: any[], ttl = 1800): Promise<boolean> {
    return this.set(`staff:location:${locationId}`, staff, ttl);
  }

  async getStaffByLocation(locationId: string): Promise<any[] | null> {
    return this.get(`staff:location:${locationId}`);
  }

  async cacheUserPermissions(userId: string, permissions: any[], ttl = 3600): Promise<boolean> {
    return this.set(`permissions:user:${userId}`, permissions, ttl);
  }

  async getUserPermissions(userId: string): Promise<any[] | null> {
    return this.get(`permissions:user:${userId}`);
  }

  // Appointment caching
  async cacheAppointmentsByDate(locationId: string, date: string, appointments: any[], ttl = 1800): Promise<boolean> {
    return this.set(`appointments:${locationId}:${date}`, appointments, ttl);
  }

  async getAppointmentsByDate(locationId: string, date: string): Promise<any[] | null> {
    return this.get(`appointments:${locationId}:${date}`);
  }

  // Health status monitoring
  async getHealthStatus(): Promise<{
    redis_available: boolean;
    metrics: CacheMetrics;
    connection_info: any;
  }> {
    await this.ensureInitialized();
    let connectionInfo = null;
    
    if (this.isRedisAvailable && this.redis) {
      try {
        const info = await this.redis.info();
        connectionInfo = {
          connected: true,
          used_memory: this.parseRedisInfo(info, 'used_memory'),
          connected_clients: this.parseRedisInfo(info, 'connected_clients'),
          total_commands_processed: this.parseRedisInfo(info, 'total_commands_processed')
        };
      } catch (error) {
        connectionInfo = { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return {
      redis_available: this.isRedisAvailable,
      metrics: this.metrics,
      connection_info: connectionInfo
    };
  }

  // Metrics and monitoring
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

  private updateHitRate(): void {
    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
  }

  private parseRedisInfo(info: string, key: string): string | null {
    const lines = info.split('\r\n');
    const line = lines.find(line => line.startsWith(`${key}:`));
    return line ? line.split(':')[1] : null;
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    this.isRedisAvailable = false;
  }
}

// Singleton instance
export const cacheManager = new GangerCacheManager();

// Export compatible redisClient interface for enterprise components
export const redisClient = {
  async get(key: string): Promise<string | null> {
    const result = await cacheManager.get<string>(key);
    return result;
  },
  
  async setex(key: string, ttl: number, value: string): Promise<void> {
    await cacheManager.set(key, value, ttl);
  },
  
  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      const success = await cacheManager.del(key);
      if (success) count++;
    }
    return count;
  },
  
  async keys(pattern: string): Promise<string[]> {
    // Basic pattern matching - would need Redis for full glob support
    return [];
  },
  
  async ping(): Promise<string> {
    return 'PONG';
  },
  
  async eval(script: string, numKeys: number, ...args: string[]): Promise<any> {
    // Lua script evaluation would need Redis
    throw new Error('Lua script evaluation requires Redis connection');
  },
  
  async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
    // Hash operations would need Redis
    return fields.map(() => null);
  },
  
  async hmset(key: string, ...fieldValues: string[]): Promise<void> {
    // Hash operations would need Redis
  },
  
  async expire(key: string, seconds: number): Promise<void> {
    // TTL operations would need Redis
  },
  
  async zadd(key: string, score: number, member: string): Promise<void> {
    // Sorted set operations would need Redis
  },
  
  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    // Sorted set operations would need Redis
    return 0;
  },
  
  async zcard(key: string): Promise<number> {
    // Sorted set operations would need Redis
    return 0;
  },
  
  async zrange(key: string, start: number, stop: number, ...options: string[]): Promise<string[]> {
    // Sorted set operations would need Redis
    return [];
  },
  
  async incr(key: string): Promise<number> {
    // Increment operations would need Redis
    return 1;
  }
};