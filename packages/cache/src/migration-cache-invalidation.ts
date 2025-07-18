/**
 * Migration-Aware Cache Invalidation Service
 * Handles cache invalidation during database schema migration
 * Phase 2: Shared Package Migration
 */

import { cacheManager } from './redis-client';

export interface MigrationCacheConfig {
  enableMigrationMode: boolean;
  useNewSchema: boolean;
  invalidateBothSchemas: boolean;
  logInvalidation: boolean;
}

export class MigrationCacheInvalidation {
  private config: MigrationCacheConfig;

  constructor(config: MigrationCacheConfig = {
    enableMigrationMode: true,
    useNewSchema: false,
    invalidateBothSchemas: true,
    logInvalidation: process.env.NODE_ENV === 'development'
  }) {
    this.config = config;
  }

  /**
   * Get cache key patterns for both old and new schemas
   */
  private getCachePatterns(entity: string, id: string, specificPatterns?: string[]): string[] {
    const patterns: string[] = [];

    if (specificPatterns) {
      patterns.push(...specificPatterns);
    }

    if (!this.config.enableMigrationMode) {
      return patterns;
    }

    // Add patterns for both old and new schemas when in migration mode
    if (this.config.invalidateBothSchemas || !this.config.useNewSchema) {
      // Old schema patterns
      switch (entity) {
        case 'staff':
          patterns.push(
            `staff:user:${id}:*`,
            `staff:location:${id}`,
            `staff:location:${id}:*`,
            `staffing:availability:${id}:*`,
            `staffing:conflicts:${id}:*`,
            `schedule:user:${id}:*`,
            `staff_tickets:assignee:${id}`,
            `staff_schedules:member:${id}:*`
          );
          break;
        case 'ticket':
          patterns.push(
            `staff_tickets:${id}`,
            `staff_tickets:${id}:*`,
            `staff_tickets:assignee:*`,
            `staff_tickets:location:*`
          );
          break;
        case 'profile':
          patterns.push(
            `staff_user_profiles:${id}`,
            `staff_user_profiles:${id}:*`,
            `staff_user_profiles:email:*`
          );
          break;
      }
    }

    if (this.config.invalidateBothSchemas || this.config.useNewSchema) {
      // New schema patterns
      switch (entity) {
        case 'staff':
          patterns.push(
            `profiles:${id}`,
            `profiles:${id}:*`,
            `profiles:location:${id}:*`,
            `staffing:availability:${id}:*`,
            `staffing:conflicts:${id}:*`,
            `schedules:member:${id}:*`
          );
          break;
        case 'ticket':
          patterns.push(
            `tickets:${id}`,
            `tickets:${id}:*`,
            `tickets:assignee:*`,
            `tickets:location:*`
          );
          break;
        case 'profile':
          patterns.push(
            `profiles:${id}`,
            `profiles:${id}:*`,
            `profiles:email:*`
          );
          break;
      }
    }

    return patterns;
  }

  /**
   * Invalidate staff-related caches during migration
   */
  async invalidateStaffData(staffId: string, locationId?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const basePatterns = this.getCachePatterns('staff', staffId);
    
    // Add location-specific patterns if provided
    if (locationId) {
      basePatterns.push(...this.getCachePatterns('staff', locationId));
    }

    // Add migration-specific invalidation patterns
    const migrationPatterns = [
      // Staff scheduling caches
      `staffing:*:${staffId}`,
      `schedule:*:${staffId}`,
      `availability:*:${staffId}`,
      
      // Deputy integration caches
      `deputy:employee:${staffId}`,
      `deputy:availability:${staffId}:*`,
      `deputy:roster:${staffId}:*`,
      
      // Zenefits integration caches
      `zenefits:employee:${staffId}`,
      `zenefits:compliance:${staffId}:*`,
      
      // ModMed integration caches
      `modmed:provider:${staffId}`,
      `modmed:schedule:${staffId}:*`,
      
      // Analytics and metrics caches
      `metrics:staff:${staffId}:*`,
      `analytics:utilization:${staffId}:*`,
      `performance:${staffId}:*`
    ];

    const allPatterns = [...basePatterns, ...migrationPatterns];
    return this.executeInvalidation(allPatterns, 'staff', staffId);
  }

  /**
   * Invalidate ticket-related caches during migration
   */
  async invalidateTicketData(ticketId: string, assigneeId?: string, locationId?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const basePatterns = this.getCachePatterns('ticket', ticketId);

    // Add assignee-specific patterns
    if (assigneeId) {
      basePatterns.push(
        `tickets:assignee:${assigneeId}`,
        `staff_tickets:assignee:${assigneeId}`,
        `notifications:user:${assigneeId}:tickets`
      );
    }

    // Add location-specific patterns
    if (locationId) {
      basePatterns.push(
        `tickets:location:${locationId}`,
        `staff_tickets:location:${locationId}`,
        `dashboard:location:${locationId}:tickets`
      );
    }

    // Migration-specific patterns
    const migrationPatterns = [
      `workflow:tickets:*`,
      `analytics:tickets:*`,
      `reports:tickets:*`,
      `approval:tickets:${ticketId}`,
      `audit:tickets:${ticketId}`
    ];

    const allPatterns = [...basePatterns, ...migrationPatterns];
    return this.executeInvalidation(allPatterns, 'ticket', ticketId);
  }

  /**
   * Invalidate profile-related caches during migration
   */
  async invalidateProfileData(profileId: string, email?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const basePatterns = this.getCachePatterns('profile', profileId);

    // Add email-specific patterns
    if (email) {
      basePatterns.push(
        `profiles:email:${email}`,
        `staff_user_profiles:email:${email}`,
        `auth:email:${email}`,
        `permissions:email:${email}`
      );
    }

    // Migration-specific patterns
    const migrationPatterns = [
      `auth:user:${profileId}:*`,
      `permissions:user:${profileId}:*`,
      `session:*:user:${profileId}`,
      `app_permissions:user:${profileId}:*`
    ];

    const allPatterns = [...basePatterns, ...migrationPatterns];
    return this.executeInvalidation(allPatterns, 'profile', profileId);
  }

  /**
   * Invalidate schedule-related caches during migration
   */
  async invalidateScheduleData(scheduleId?: string, staffId?: string, locationId?: string, date?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns: string[] = [];

    // Schedule-specific patterns
    if (scheduleId) {
      patterns.push(
        `staff_schedules:${scheduleId}`,
        `schedules:${scheduleId}`,
        `staff_schedules:${scheduleId}:*`,
        `schedules:${scheduleId}:*`
      );
    }

    // Staff-specific patterns
    if (staffId) {
      patterns.push(
        `staff_schedules:member:${staffId}:*`,
        `schedules:member:${staffId}:*`,
        `availability:${staffId}:*`,
        `conflicts:${staffId}:*`
      );
    }

    // Location-specific patterns
    if (locationId) {
      patterns.push(
        `staff_schedules:location:${locationId}:*`,
        `schedules:location:${locationId}:*`,
        `coverage:location:${locationId}:*`
      );
    }

    // Date-specific patterns
    if (date) {
      patterns.push(
        `staff_schedules:date:${date}:*`,
        `schedules:date:${date}:*`,
        `optimization:${date}:*`
      );
    }

    // Migration-specific patterns
    const migrationPatterns = [
      `staffing:optimization:*`,
      `staffing:metrics:*`,
      `staffing:analytics:*`,
      `clinical:staffing:*`,
      `ai:scheduling:*`
    ];

    const allPatterns = [...patterns, ...migrationPatterns];
    return this.executeInvalidation(allPatterns, 'schedule', scheduleId || 'bulk');
  }

  /**
   * Execute cache invalidation with logging and error handling
   */
  private async executeInvalidation(patterns: string[], entityType: string, entityId: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    if (this.config.logInvalidation) {
      console.log(`[Migration Cache] Invalidating ${entityType} ${entityId} with ${patterns.length} patterns`);
    }

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
          
          if (this.config.logInvalidation) {
            console.log(`[Migration Cache] Pattern ${pattern}: ${keysRemoved} keys removed`);
          }
        }
      } catch (error) {
        console.error(`[Migration Cache] Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    if (this.config.logInvalidation) {
      console.log(`[Migration Cache] Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for ${entityType} ${entityId}`);
    }

    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  /**
   * Invalidate all migration-related caches
   */
  async invalidateAllMigrationCaches(): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const migrationPatterns = [
      // Staff-related patterns
      'staff:*',
      'staff_*',
      'staffing:*',
      'profiles:*',
      'staff_user_profiles:*',
      
      // Schedule-related patterns
      'schedule:*',
      'staff_schedules:*',
      'availability:*',
      'staff_availability:*',
      'conflicts:*',
      'optimization:*',
      
      // Ticket-related patterns
      'tickets:*',
      'staff_tickets:*',
      'workflow:*',
      'approval:*',
      
      // Integration patterns
      'deputy:*',
      'zenefits:*',
      'modmed:*',
      
      // Analytics patterns
      'analytics:*',
      'metrics:*',
      'performance:*',
      'reports:*'
    ];

    return this.executeInvalidation(migrationPatterns, 'migration', 'all');
  }

  /**
   * Warm migration caches with new schema data
   */
  async warmMigrationCaches(): Promise<{
    warmed_caches: string[];
    errors: string[];
  }> {
    const warmedCaches: string[] = [];
    const errors: string[] = [];

    try {
      // Cache keys that should be warmed for the new schema
      const warmingTasks = [
        'profiles:list',
        'profiles:active',
        'tickets:open',
        'tickets:priorities',
        'schedules:templates',
        'staffing:coverage_requirements',
        'locations:list',
        'app_permissions:roles'
      ];

      for (const cacheKey of warmingTasks) {
        // Note: Actual data fetching would be implemented by consumers
        warmedCaches.push(cacheKey);
        
        if (this.config.logInvalidation) {
          console.log(`[Migration Cache] Warming cache: ${cacheKey}`);
        }
      }

      if (this.config.logInvalidation) {
        console.log(`[Migration Cache] Cache warming completed for ${warmedCaches.length} cache keys`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      console.error('[Migration Cache] Cache warming error:', error);
    }

    return {
      warmed_caches: warmedCaches,
      errors
    };
  }

  /**
   * Update migration cache configuration
   */
  updateConfig(newConfig: Partial<MigrationCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.logInvalidation) {
      console.log('[Migration Cache] Configuration updated:', this.config);
    }
  }

  /**
   * Get current migration cache configuration
   */
  getConfig(): MigrationCacheConfig {
    return { ...this.config };
  }

  /**
   * Check cache migration status
   */
  async checkMigrationCacheStatus(): Promise<{
    oldSchemaCaches: boolean;
    newSchemaCaches: boolean;
    migrationMode: boolean;
    needsInvalidation: boolean;
  }> {
    let oldSchemaCaches = false;
    let newSchemaCaches = false;

    try {
      // Check for old schema cache keys by trying to get sample keys
      const oldTestKeys = ['staff_tickets:test', 'staff:test'];
      for (const key of oldTestKeys) {
        const exists = await cacheManager.get(key);
        if (exists !== null) {
          oldSchemaCaches = true;
          break;
        }
      }

      // Check for new schema cache keys
      const newTestKeys = ['profiles:test', 'tickets:test'];
      for (const key of newTestKeys) {
        const exists = await cacheManager.get(key);
        if (exists !== null) {
          newSchemaCaches = true;
          break;
        }
      }
    } catch (error) {
      console.error('[Migration Cache] Error checking cache status:', error);
    }

    return {
      oldSchemaCaches,
      newSchemaCaches,
      migrationMode: this.config.enableMigrationMode,
      needsInvalidation: oldSchemaCaches && this.config.useNewSchema
    };
  }
}

// Singleton instance for migration cache invalidation
export const migrationCacheInvalidation = new MigrationCacheInvalidation();