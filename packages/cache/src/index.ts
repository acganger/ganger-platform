// Export main cache manager
export { cacheManager, GangerCacheManager } from './redis-client';
export type { CacheOptions, CacheMetrics } from './redis-client';

// Export cache invalidation service
export { cacheInvalidation, CacheInvalidationService } from './cache-invalidation';

// Export cache middleware
export {
  withCache,
  withPatientCache,
  withLocationCache,
  withInventoryCache,
  withUserCache,
  withMedicationCache,
  withCacheBusting,
  withSmartCache
} from './cache-middleware';
export type { CacheMiddlewareOptions } from './cache-middleware';

// Export migration cache invalidation
export {
  MigrationCacheInvalidation,
  migrationCacheInvalidation,
  type MigrationCacheConfig
} from './migration-cache-invalidation';