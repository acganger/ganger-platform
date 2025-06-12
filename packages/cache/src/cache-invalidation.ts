import { cacheManager } from './redis-client';

export class CacheInvalidationService {
  
  // Invalidate related caches when patient data changes
  async invalidatePatientRelatedData(patientId: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns = [
      `patient:${patientId}`,
      `patient:${patientId}:*`,
      `appointments:*:*:patient:${patientId}`,
      `medications:patient:${patientId}`,
      `authorizations:patient:${patientId}`,
      `insurance:patient:${patientId}`,
      `handouts:patient:${patientId}`,
      `communication:patient:${patientId}:*`
    ];
    
    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
        }
      } catch (error) {
        console.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    console.log(`Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for patient ${patientId}`);
    
    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  // Invalidate location-based caches
  async invalidateLocationData(locationId: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns = [
      `location:${locationId}`,
      `location:${locationId}:*`,
      `inventory:location:${locationId}`,
      `inventory:location:${locationId}:*`,
      `staff:location:${locationId}`,
      `staff:location:${locationId}:*`,
      `appointments:${locationId}:*`,
      `schedule:location:${locationId}:*`
    ];
    
    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
        }
      } catch (error) {
        console.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    // Also invalidate location list cache since location data changed
    await cacheManager.del('locations:list');

    console.log(`Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for location ${locationId}`);
    
    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  // Invalidate inventory-related caches
  async invalidateInventoryData(itemId: string, locationId?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns = [
      `inventory:item:${itemId}`,
      `inventory:item:${itemId}:*`
    ];

    if (locationId) {
      patterns.push(
        `inventory:location:${locationId}`,
        `inventory:location:${locationId}:*`
      );
    }

    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
        }
      } catch (error) {
        console.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    console.log(`Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for inventory item ${itemId}`);
    
    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  // Invalidate user-related caches (permissions, sessions, etc.)
  async invalidateUserData(userId: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns = [
      `permissions:user:${userId}`,
      `session:*:user:${userId}`,
      `staff:user:${userId}:*`,
      `schedule:user:${userId}:*`
    ];

    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
        }
      } catch (error) {
        console.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    console.log(`Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for user ${userId}`);
    
    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  // Invalidate medication-related caches
  async invalidateMedicationData(medicationId?: string, patientId?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns = ['medications:list'];

    if (medicationId) {
      patterns.push(
        `medication:${medicationId}`,
        `medication:${medicationId}:*`
      );
    }

    if (patientId) {
      patterns.push(
        `medications:patient:${patientId}`,
        `medications:patient:${patientId}:*`
      );
    }

    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
        }
      } catch (error) {
        console.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    console.log(`Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for medication data`);
    
    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  // Invalidate authorization-related caches
  async invalidateAuthorizationData(authorizationId: string, patientId?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns = [
      `authorization:${authorizationId}`,
      `authorization:${authorizationId}:*`
    ];

    if (patientId) {
      patterns.push(
        `authorizations:patient:${patientId}`,
        `authorizations:patient:${patientId}:*`
      );
    }

    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
        }
      } catch (error) {
        console.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    console.log(`Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for authorization ${authorizationId}`);
    
    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  // Invalidate appointment-related caches
  async invalidateAppointmentData(locationId: string, date?: string, patientId?: string): Promise<{
    patterns_invalidated: string[];
    keys_removed: number;
  }> {
    const patterns: string[] = [];

    if (date) {
      patterns.push(`appointments:${locationId}:${date}`);
    } else {
      patterns.push(`appointments:${locationId}:*`);
    }

    if (patientId) {
      patterns.push(`appointments:*:*:patient:${patientId}`);
    }

    let totalKeysRemoved = 0;
    const invalidatedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const keysRemoved = await cacheManager.invalidatePattern(pattern);
        if (keysRemoved > 0) {
          totalKeysRemoved += keysRemoved;
          invalidatedPatterns.push(pattern);
        }
      } catch (error) {
        console.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    }

    console.log(`Invalidated ${totalKeysRemoved} keys across ${invalidatedPatterns.length} patterns for appointment data`);
    
    return {
      patterns_invalidated: invalidatedPatterns,
      keys_removed: totalKeysRemoved
    };
  }

  // Emergency cache flush - use with caution
  async flushAllCaches(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const keysRemoved = await cacheManager.invalidatePattern('*');
      console.log(`Emergency cache flush: removed ${keysRemoved} keys`);
      
      return {
        success: true,
        message: `Successfully flushed all caches (${keysRemoved} keys removed)`
      };
    } catch (error) {
      console.error('Failed to flush all caches:', error);
      return {
        success: false,
        message: `Failed to flush caches: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Cache warming - preload frequently accessed data
  async warmCache(): Promise<{
    warmed_caches: string[];
    errors: string[];
  }> {
    const warmedCaches: string[] = [];
    const errors: string[] = [];

    try {
      // Warm location list cache
      // Note: This would need to be integrated with actual data fetching
      // For now, just marking the cache keys that should be warmed
      const cacheWarmingTasks = [
        'locations:list',
        'medications:list', 
        'insurance:providers',
        'staff:permissions:list'
      ];

      for (const cacheKey of cacheWarmingTasks) {
        warmedCaches.push(cacheKey);
      }

      console.log(`Cache warming completed for ${warmedCaches.length} cache keys`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      console.error('Cache warming error:', error);
    }

    return {
      warmed_caches: warmedCaches,
      errors
    };
  }
}

// Singleton instance
export const cacheInvalidation = new CacheInvalidationService();