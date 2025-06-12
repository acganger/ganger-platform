import { NextApiRequest, NextApiResponse } from 'next';

// In-memory store for rate limiting (for development)
// In production, this should use Redis for distributed rate limiting
class MemoryRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of Array.from(this.store.entries())) {
        if (value.resetTime <= now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const current = this.store.get(key);
    
    if (!current || current.resetTime <= now) {
      // Create new window
      const value = { count: 1, resetTime: now + windowMs };
      this.store.set(key, value);
      return value;
    } else {
      // Increment existing window
      current.count++;
      this.store.set(key, current);
      return current;
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Redis-based rate limiting store (for production)
class RedisRateLimitStore {
  private redisClient: any;

  constructor(redisClient: any) {
    this.redisClient = redisClient;
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    try {
      const result = await this.redisClient.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    try {
      const ttl = Math.max(1, Math.ceil((value.resetTime - Date.now()) / 1000));
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    try {
      const now = Date.now();
      const resetTime = now + windowMs;
      
      const pipeline = this.redisClient.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = results[0][1];
      
      return { count, resetTime };
    } catch (error) {
      console.error('Redis increment error:', error);
      // Fallback to allowing the request
      return { count: 1, resetTime: Date.now() + windowMs };
    }
  }
}

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests per window
  keyGenerator?: (req: NextApiRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: NextApiRequest, res: NextApiResponse) => void;
  standardHeaders?: boolean; // Add standard rate limit headers
  legacyHeaders?: boolean;   // Add X-RateLimit-* headers
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Global store instance
let store: MemoryRateLimitStore | RedisRateLimitStore = new MemoryRateLimitStore();

// Initialize Redis store if available
export function initializeRedisStore(redisClient: any) {
  if (store instanceof MemoryRateLimitStore) {
    store.destroy();
  }
  store = new RedisRateLimitStore(redisClient);
}

// Default key generator - uses IP address
function defaultKeyGenerator(req: NextApiRequest): string {
  // Get client IP from various possible headers
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  
  let ip = req.socket.remoteAddress || 'unknown';
  
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (typeof realIp === 'string') {
    ip = realIp;
  } else if (typeof cfConnectingIp === 'string') {
    ip = cfConnectingIp;
  }
  
  // Include endpoint in key for per-endpoint limits
  const endpoint = req.url?.split('?')[0] || 'unknown';
  return `rate_limit:${ip}:${endpoint}`;
}

// Core rate limiting function
export async function checkRateLimit(
  req: NextApiRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const {
    windowMs,
    max,
    keyGenerator = defaultKeyGenerator
  } = config;

  const key = keyGenerator(req);
  const current = await store.increment(key, windowMs);
  
  const allowed = current.count <= max;
  const remaining = Math.max(0, max - current.count);
  const retryAfter = allowed ? undefined : Math.ceil((current.resetTime - Date.now()) / 1000);

  return {
    allowed,
    count: current.count,
    remaining,
    resetTime: current.resetTime,
    retryAfter
  };
}

// Rate limiting middleware
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  config: RateLimitConfig
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const result = await checkRateLimit(req, config);
      
      // Add rate limit headers
      if (config.standardHeaders !== false) {
        res.setHeader('RateLimit-Limit', config.max);
        res.setHeader('RateLimit-Remaining', result.remaining);
        res.setHeader('RateLimit-Reset', new Date(result.resetTime).toISOString());
      }
      
      if (config.legacyHeaders !== false) {
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
      }
      
      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter);
        }
        
        if (config.onLimitReached) {
          config.onLimitReached(req, res);
        }
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter || 'a few'} seconds.`,
          retryAfter: result.retryAfter
        });
      }
      
      // Request is allowed, continue to handler
      return handler(req, res);
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On rate limiting errors, allow the request to continue
      return handler(req, res);
    }
  };
}

// Predefined rate limit configurations
export const RateLimits = {
  // Very strict for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: true
  },
  
  // Standard API endpoints
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: true
  },
  
  // More lenient for public endpoints
  LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: true
  },
  
  // For authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: true,
    keyGenerator: (req: NextApiRequest) => {
      // Use IP + email for auth endpoints
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const email = req.body?.email || 'no-email';
      return `auth_limit:${ip}:${email}`;
    }
  },
  
  // For health checks and monitoring
  MONITORING: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    standardHeaders: false,
    legacyHeaders: false
  },
  
  // For AI/ML endpoints (more expensive)
  AI_PROCESSING: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests per 5 minutes
    standardHeaders: true,
    legacyHeaders: true
  }
};

// User-based rate limiting (requires authentication)
export function createUserRateLimit(config: RateLimitConfig) {
  return {
    ...config,
    keyGenerator: (req: NextApiRequest) => {
      const userId = (req as any).user?.id || 'anonymous';
      const endpoint = req.url?.split('?')[0] || 'unknown';
      return `user_rate_limit:${userId}:${endpoint}`;
    }
  };
}

// IP + User combined rate limiting
export function createCombinedRateLimit(config: RateLimitConfig) {
  return {
    ...config,
    keyGenerator: (req: NextApiRequest) => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const userId = (req as any).user?.id || 'anonymous';
      const endpoint = req.url?.split('?')[0] || 'unknown';
      return `combined_rate_limit:${ip}:${userId}:${endpoint}`;
    }
  };
}

// Rate limit status endpoint
export function createRateLimitStatusEndpoint() {
  return withRateLimit(
    async (req: NextApiRequest, res: NextApiResponse) => {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const key = defaultKeyGenerator(req);
      const current = await store.get(key);
      
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        rate_limit_status: {
          key: key.split(':').slice(0, -1).join(':'), // Remove endpoint for security
          current_count: current?.count || 0,
          reset_time: current?.resetTime ? new Date(current.resetTime).toISOString() : null,
          rate_limiting_active: true
        }
      });
    },
    RateLimits.MONITORING
  );
}

// Utility to check if request is rate limited without incrementing
export async function isRateLimited(
  req: NextApiRequest,
  config: RateLimitConfig
): Promise<boolean> {
  const key = (config.keyGenerator || defaultKeyGenerator)(req);
  const current = await store.get(key);
  
  if (!current || current.resetTime <= Date.now()) {
    return false; // No current limit or expired
  }
  
  return current.count >= config.max;
}