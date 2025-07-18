/**
 * Compliance Training Migration Adapter
 * Handles compatibility during database schema migration
 */

import { migrationAdapter, MigrationHelpers } from '@ganger/db';

// Configure migration adapter for Compliance Training
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

// Compliance-specific table mappings
const COMPLIANCE_TABLE_MAPPING = {
  employees: 'employees', // Keep as is - app has its own employee system
  training_modules: 'training_modules',
  training_completions: 'training_completions',
  compliance_sync_logs: 'compliance_sync_logs',
  department_training_requirements: 'department_training_requirements'
} as const;

// Compliance status mappings
const COMPLIANCE_STATUS_MAPPING = {
  EMPLOYEE_STATUS: {
    'active': 'active',
    'inactive': 'inactive',
    'terminated': 'terminated'
  },
  COMPLIANCE_STATUS: {
    'compliant': 'compliant',
    'non_compliant': 'non_compliant',
    'pending': 'pending'
  },
  TRAINING_STATUS: {
    'assigned': 'assigned',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'overdue': 'overdue',
    'expired': 'expired'
  }
} as const;

export class ComplianceMigrationAdapter {
  /**
   * Map table names (currently no change needed)
   */
  private mapTableName(tableName: string): string {
    return COMPLIANCE_TABLE_MAPPING[tableName as keyof typeof COMPLIANCE_TABLE_MAPPING] || tableName;
  }

  /**
   * Convert status values based on context
   */
  private convertStatus(status: string, context: 'employee' | 'compliance' | 'training'): string {
    switch (context) {
      case 'employee':
        return COMPLIANCE_STATUS_MAPPING.EMPLOYEE_STATUS[status as keyof typeof COMPLIANCE_STATUS_MAPPING.EMPLOYEE_STATUS] || status;
      case 'compliance':
        return COMPLIANCE_STATUS_MAPPING.COMPLIANCE_STATUS[status as keyof typeof COMPLIANCE_STATUS_MAPPING.COMPLIANCE_STATUS] || status;
      case 'training':
        return COMPLIANCE_STATUS_MAPPING.TRAINING_STATUS[status as keyof typeof COMPLIANCE_STATUS_MAPPING.TRAINING_STATUS] || status;
      default:
        return status;
    }
  }

  /**
   * Query data with migration support
   */
  async select<T = any>(
    tableName: string,
    selectClause: string = '*',
    filters?: Record<string, any>,
    options?: { limit?: number; offset?: number; orderBy?: string }
  ): Promise<T[]> {
    const mappedTable = this.mapTableName(tableName);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Compliance Migration] Query ${tableName} → ${mappedTable}`);
    }
    
    // For compliance training, use the existing table structure
    // This app has its own employee system that doesn't need migration
    const results = await migrationAdapter.select<T>(
      mappedTable,
      selectClause,
      filters,
      options
    );
    
    return results;
  }

  /**
   * Insert data with migration support
   */
  async insert<T = any>(
    tableName: string,
    data: any,
    options?: { onConflict?: string; returning?: string }
  ): Promise<T[]> {
    const mappedTable = this.mapTableName(tableName);
    
    // Convert status values based on table context
    const convertedData = this.convertDataForInsert(data, tableName);
    
    const results = await migrationAdapter.insert<T>(
      mappedTable,
      convertedData,
      options
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Compliance Migration] Insert ${tableName} → ${mappedTable}`);
    }
    
    return results;
  }

  /**
   * Update data with migration support
   */
  async update<T = any>(
    tableName: string,
    data: any,
    filters: Record<string, any>,
    options?: { returning?: string }
  ): Promise<T[]> {
    const mappedTable = this.mapTableName(tableName);
    
    // Convert status values based on table context
    const convertedData = this.convertDataForUpdate(data, tableName);
    
    const results = await migrationAdapter.update<T>(
      mappedTable,
      convertedData,
      filters,
      options
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Compliance Migration] Update ${tableName} → ${mappedTable}`);
    }
    
    return results;
  }

  /**
   * Delete data with migration support
   */
  async delete<T = any>(
    tableName: string,
    filters: Record<string, any>,
    options?: { returning?: string }
  ): Promise<T[]> {
    const mappedTable = this.mapTableName(tableName);
    
    const results = await migrationAdapter.delete<T>(
      mappedTable,
      filters,
      options
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Compliance Migration] Delete ${tableName} → ${mappedTable}`);
    }
    
    return results;
  }

  /**
   * Convert data for insert operations
   */
  private convertDataForInsert(data: any, tableName: string): any {
    if (!data || typeof data !== 'object') return data;
    
    const converted = { ...data };
    
    // Convert status fields based on table type
    if (converted.status) {
      if (tableName === 'employees') {
        converted.status = this.convertStatus(converted.status, 'employee');
      } else if (tableName === 'training_completions') {
        converted.status = this.convertStatus(converted.status, 'training');
      }
    }
    
    // Handle compliance_status field
    if (converted.compliance_status) {
      converted.compliance_status = this.convertStatus(converted.compliance_status, 'compliance');
    }
    
    return converted;
  }

  /**
   * Convert data for update operations
   */
  private convertDataForUpdate(data: any, tableName: string): any {
    return this.convertDataForInsert(data, tableName);
  }

  /**
   * Ensure compliance with new schema requirements
   */
  ensureCompliance(data: any): any {
    // Add any necessary data transformations for compliance
    if (data && typeof data === 'object') {
      // Ensure timestamps are properly formatted
      if (data.created_at && typeof data.created_at === 'string') {
        data.created_at = new Date(data.created_at).toISOString();
      }
      if (data.updated_at && typeof data.updated_at === 'string') {
        data.updated_at = new Date(data.updated_at).toISOString();
      }
      
      // Ensure location mapping if needed
      if (data.location && typeof data.location === 'string') {
        // Map location names to IDs if needed in the future
        // For now, keep as string
      }
    }
    
    return data;
  }
}

// Export singleton instance
export const complianceMigrationAdapter = new ComplianceMigrationAdapter();