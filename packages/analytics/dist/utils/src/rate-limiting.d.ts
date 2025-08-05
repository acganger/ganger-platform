import { NextApiRequest, NextApiResponse } from 'next';
export interface RateLimitConfig {
    windowMs: number;
    max: number;
    keyGenerator?: (req: NextApiRequest) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onLimitReached?: (req: NextApiRequest, res: NextApiResponse) => void;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}
export interface RateLimitResult {
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}
/**
 * Initializes Redis-based rate limiting store for production use
 * @param redisClient - Redis client instance
 * @example
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * initializeRedisStore(redis);
 */
export declare function initializeRedisStore(redisClient: any): void;
/**
 * Checks if a request should be rate limited
 * @param req - Next.js API request object
 * @param config - Rate limiting configuration
 * @returns Rate limit result with allowed status and metadata
 * @example
 * const result = await checkRateLimit(req, {
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 100 // 100 requests per window
 * });
 * if (!result.allowed) {
 *   return res.status(429).json({ error: 'Too many requests' });
 * }
 */
export declare function checkRateLimit(req: NextApiRequest, config: RateLimitConfig): Promise<RateLimitResult>;
/**
 * Middleware wrapper that adds rate limiting to API endpoints
 * @param handler - The API handler function to protect
 * @param config - Rate limiting configuration
 * @returns Wrapped handler with rate limiting
 * @example
 * export default withRateLimit(
 *   async (req, res) => {
 *     // Your API logic here
 *     res.json({ data: 'protected' });
 *   },
 *   RateLimits.STANDARD
 * );
 */
export declare function withRateLimit(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>, config: RateLimitConfig): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
/**
 * Predefined rate limit configurations for common use cases
 * @example
 * // For authentication endpoints
 * export default withRateLimit(loginHandler, RateLimits.AUTH);
 *
 * // For standard API endpoints
 * export default withRateLimit(apiHandler, RateLimits.STANDARD);
 */
export declare const RateLimits: {
    /**
     * Very strict rate limiting for sensitive operations
     * 5 requests per 15 minutes
     */
    STRICT: {
        windowMs: number;
        max: number;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    /**
     * Standard rate limiting for API endpoints
     * 100 requests per 15 minutes
     */
    STANDARD: {
        windowMs: number;
        max: number;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    /**
     * Lenient rate limiting for public endpoints
     * 300 requests per 15 minutes
     */
    LENIENT: {
        windowMs: number;
        max: number;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    /**
     * Authentication-specific rate limiting
     * 10 login attempts per 15 minutes per IP + email combination
     */
    AUTH: {
        windowMs: number;
        max: number;
        standardHeaders: boolean;
        legacyHeaders: boolean;
        keyGenerator: (req: NextApiRequest) => string;
    };
    /**
     * High-frequency rate limiting for monitoring endpoints
     * 60 requests per minute
     */
    MONITORING: {
        windowMs: number;
        max: number;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    /**
     * Strict rate limiting for expensive AI/ML operations
     * 20 requests per 5 minutes
     */
    AI_PROCESSING: {
        windowMs: number;
        max: number;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
};
/**
 * Creates a user-based rate limit configuration
 * Rate limits are applied per authenticated user
 * @param config - Base rate limit configuration
 * @returns Configuration with user-based key generation
 * @example
 * export default withRateLimit(
 *   handler,
 *   createUserRateLimit({
 *     windowMs: 15 * 60 * 1000,
 *     max: 200 // 200 requests per user per 15 minutes
 *   })
 * );
 */
export declare function createUserRateLimit(config: RateLimitConfig): {
    keyGenerator: (req: NextApiRequest) => string;
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onLimitReached?: (req: NextApiRequest, res: NextApiResponse) => void;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
};
/**
 * Creates a combined IP + user rate limit configuration
 * Provides defense against both per-IP and per-user abuse
 * @param config - Base rate limit configuration
 * @returns Configuration with combined key generation
 * @example
 * export default withRateLimit(
 *   handler,
 *   createCombinedRateLimit({
 *     windowMs: 15 * 60 * 1000,
 *     max: 150
 *   })
 * );
 */
export declare function createCombinedRateLimit(config: RateLimitConfig): {
    keyGenerator: (req: NextApiRequest) => string;
    windowMs: number;
    max: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onLimitReached?: (req: NextApiRequest, res: NextApiResponse) => void;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
};
/**
 * Creates an API endpoint that returns rate limit status
 * Useful for monitoring and debugging rate limits
 * @returns API handler for rate limit status endpoint
 * @example
 * // pages/api/rate-limit-status.ts
 * export default createRateLimitStatusEndpoint();
 */
export declare function createRateLimitStatusEndpoint(): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
/**
 * Checks if a request would be rate limited without incrementing the counter
 * Useful for pre-flight checks or conditional logic
 * @param req - Next.js API request object
 * @param config - Rate limiting configuration
 * @returns True if the request would be rate limited
 * @example
 * const wouldBeRateLimited = await isRateLimited(req, RateLimits.STANDARD);
 * if (wouldBeRateLimited) {
 *   // Show warning to user before they make the request
 * }
 */
export declare function isRateLimited(req: NextApiRequest, config: RateLimitConfig): Promise<boolean>;
