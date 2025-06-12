import { NextApiRequest, NextApiResponse } from 'next';
import { cacheManager } from './redis-client';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: NextApiRequest) => string;
  skipCondition?: (req: NextApiRequest) => boolean;
  onHit?: (key: string, data: any) => void;
  onMiss?: (key: string) => void;
  onError?: (error: Error) => void;
}

interface CachedResponse {
  statusCode: number;
  data: any;
}

// Default key generator based on request URL and query params
function defaultKeyGenerator(req: NextApiRequest): string {
  const url = req.url || '';
  const method = req.method || 'GET';
  const queryString = Object.keys(req.query).length > 0 
    ? '?' + new URLSearchParams(req.query as Record<string, string>).toString()
    : '';
  
  return `api:${method}:${url}${queryString}`;
}

// Cache middleware for API responses
export function withCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: CacheMiddlewareOptions = {}
) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCondition = () => false,
    onHit,
    onMiss,
    onError
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' || skipCondition(req)) {
      return handler(req, res);
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache first
      const cachedResponse = await cacheManager.get(cacheKey) as CachedResponse | null;
      
      if (cachedResponse) {
        onHit?.(cacheKey, cachedResponse);
        
        // Set cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        // Return cached response
        return res.status(cachedResponse.statusCode).json(cachedResponse.data);
      }

      onMiss?.(cacheKey);

      // Cache miss - execute handler and capture response
      const originalJson = res.json;
      const originalStatus = res.status;
      let responseData: any;
      let statusCode = 200;

      // Override res.status to capture status code
      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      // Override res.json to capture response data
      res.json = function(data: any) {
        responseData = data;
        
        // Cache successful responses only (200-299)
        if (statusCode >= 200 && statusCode < 300) {
          cacheManager.set(cacheKey, {
            data,
            statusCode,
            timestamp: new Date().toISOString()
          }, ttl).catch(error => {
            console.error(`Failed to cache response for key ${cacheKey}:`, error);
            onError?.(error);
          });
        }

        // Set cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return originalJson.call(this, data);
      };

      // Execute the original handler
      await handler(req, res);

    } catch (error) {
      console.error(`Cache middleware error for key ${cacheKey}:`, error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      
      // Execute handler without caching on error
      return handler(req, res);
    }
  };
}

// Patient-specific caching middleware
export function withPatientCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: Omit<CacheMiddlewareOptions, 'keyGenerator'> & {
    patientIdParam?: string;
  } = {}
) {
  const { patientIdParam = 'patientId', ...cacheOptions } = options;

  return withCache(handler, {
    ...cacheOptions,
    keyGenerator: (req) => {
      const patientId = req.query[patientIdParam] as string;
      const baseKey = defaultKeyGenerator(req);
      return patientId ? `patient:${patientId}:${baseKey}` : baseKey;
    },
    ttl: options.ttl || 1800 // 30 minutes for patient data
  });
}

// Location-specific caching middleware
export function withLocationCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: Omit<CacheMiddlewareOptions, 'keyGenerator'> & {
    locationIdParam?: string;
  } = {}
) {
  const { locationIdParam = 'locationId', ...cacheOptions } = options;

  return withCache(handler, {
    ...cacheOptions,
    keyGenerator: (req) => {
      const locationId = req.query[locationIdParam] as string;
      const baseKey = defaultKeyGenerator(req);
      return locationId ? `location:${locationId}:${baseKey}` : baseKey;
    },
    ttl: options.ttl || 1800 // 30 minutes for location data
  });
}

// Inventory-specific caching middleware
export function withInventoryCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: CacheMiddlewareOptions = {}
) {
  return withCache(handler, {
    ...options,
    keyGenerator: (req) => {
      const baseKey = defaultKeyGenerator(req);
      return `inventory:${baseKey}`;
    },
    ttl: options.ttl || 900 // 15 minutes for inventory data
  });
}

// User-specific caching middleware
export function withUserCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: Omit<CacheMiddlewareOptions, 'keyGenerator'> & {
    userIdParam?: string;
  } = {}
) {
  const { userIdParam = 'userId', ...cacheOptions } = options;

  return withCache(handler, {
    ...cacheOptions,
    keyGenerator: (req) => {
      const userId = req.query[userIdParam] as string;
      const baseKey = defaultKeyGenerator(req);
      return userId ? `user:${userId}:${baseKey}` : baseKey;
    },
    ttl: options.ttl || 3600 // 1 hour for user data
  });
}

// Medication-specific caching middleware
export function withMedicationCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: CacheMiddlewareOptions = {}
) {
  return withCache(handler, {
    ...options,
    keyGenerator: (req) => {
      const baseKey = defaultKeyGenerator(req);
      return `medications:${baseKey}`;
    },
    ttl: options.ttl || 3600 // 1 hour for medication data
  });
}

// Cache busting middleware - for data modification endpoints
export function withCacheBusting(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: {
    invalidationPatterns: string[];
    onInvalidation?: (patterns: string[], keysRemoved: number) => void;
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Execute the handler first
    await handler(req, res);

    // If the operation was successful, invalidate related caches
    if (res.statusCode >= 200 && res.statusCode < 300) {
      let totalKeysRemoved = 0;

      for (const pattern of options.invalidationPatterns) {
        try {
          const keysRemoved = await cacheManager.invalidatePattern(pattern);
          totalKeysRemoved += keysRemoved;
        } catch (error) {
          console.error(`Failed to invalidate cache pattern ${pattern}:`, error);
        }
      }

      options.onInvalidation?.(options.invalidationPatterns, totalKeysRemoved);
      
      // Add header to indicate cache invalidation
      res.setHeader('X-Cache-Invalidated', options.invalidationPatterns.join(','));
      res.setHeader('X-Cache-Keys-Removed', totalKeysRemoved.toString());
    }
  };
}

// Smart cache middleware that handles both caching and invalidation
export function withSmartCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: {
    cache?: CacheMiddlewareOptions;
    invalidation?: {
      patterns: string[];
      methods?: string[];
    };
  } = {}
) {
  const { cache = {}, invalidation } = options;
  const modifyingMethods = invalidation?.methods || ['POST', 'PUT', 'PATCH', 'DELETE'];

  // For GET requests, use caching
  if (!invalidation || !modifyingMethods.includes('GET')) {
    const cachingHandler = withCache(handler, {
      skipCondition: (req) => modifyingMethods.includes(req.method || ''),
      ...cache
    });

    // For modifying requests, add cache busting
    if (invalidation) {
      return withCacheBusting(cachingHandler, {
        invalidationPatterns: invalidation.patterns
      });
    }

    return cachingHandler;
  }

  // For modifying requests only, just use cache busting
  return withCacheBusting(handler, {
    invalidationPatterns: invalidation.patterns
  });
}