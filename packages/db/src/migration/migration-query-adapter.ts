/**
 * Migration Query Adapter
 * Provides backward-compatible database queries during migration
 * Phase 2: Shared Package Migration
 */

import { supabaseAdmin } from '../client';
import { MigrationHelpers, TableMapping, StatusMapping } from '../types/migration-enums';
import type { Database } from '../types/database';

export interface MigrationConfig {
  enableMigrationMode: boolean;
  useNewSchema: boolean;
  logMigrationQueries: boolean;
}

/**
 * Adapter class that provides backward compatibility during migration
 */
export class MigrationQueryAdapter {
  private config: MigrationConfig;

  constructor(config: MigrationConfig = {
    enableMigrationMode: true,
    useNewSchema: false,
    logMigrationQueries: process.env.NODE_ENV === 'development'
  }) {
    this.config = config;
  }

  /**
   * Get Supabase client for database operations
   */
  private get client() {
    return supabaseAdmin;
  }

  /**
   * Adapt table name for queries based on migration state
   */
  private adaptTableName(tableName: string): string {
    if (!this.config.enableMigrationMode) {
      return tableName;
    }

    if (this.config.useNewSchema) {
      return MigrationHelpers.convertTableName(tableName);
    }

    return tableName;
  }

  /**
   * Adapt status values in query results
   */
  private adaptStatusValues(data: any[], tableName: string): any[] {
    if (!this.config.enableMigrationMode || !data) {
      return data;
    }

    return data.map(record => {
      const adapted = { ...record };

      // Adapt different status fields based on table
      switch (tableName) {
        case 'staff_tickets':
        case 'tickets':
          if (adapted.status) {
            adapted.status = this.config.useNewSchema 
              ? MigrationHelpers.convertTicketStatus(adapted.status)
              : MigrationHelpers.revertTicketStatus(adapted.status);
          }
          break;

        case 'staff_members':
        case 'profiles':
          if (adapted.employee_status) {
            adapted.employee_status = this.config.useNewSchema
              ? MigrationHelpers.convertEmployeeStatus(adapted.employee_status)
              : MigrationHelpers.revertEmployeeStatus(adapted.employee_status);
          }
          break;

        case 'staff_schedules':
          if (adapted.status) {
            adapted.status = this.config.useNewSchema
              ? MigrationHelpers.convertScheduleStatus(adapted.status)
              : MigrationHelpers.revertScheduleStatus(adapted.status);
          }
          break;

        case 'staff_availability':
          if (adapted.availability_type) {
            adapted.availability_type = this.config.useNewSchema
              ? MigrationHelpers.convertAvailabilityType(adapted.availability_type)
              : MigrationHelpers.revertAvailabilityType(adapted.availability_type);
          }
          break;
      }

      return adapted;
    });
  }

  /**
   * Adapt status values in query inputs
   */
  private adaptInputStatusValues(data: any, tableName: string): any {
    if (!this.config.enableMigrationMode || !data) {
      return data;
    }

    const adapted = { ...data };

    switch (tableName) {
      case 'staff_tickets':
      case 'tickets':
        if (adapted.status) {
          adapted.status = this.config.useNewSchema 
            ? MigrationHelpers.convertTicketStatus(adapted.status)
            : adapted.status;
        }
        break;

      case 'staff_members':
      case 'profiles':
        if (adapted.employee_status) {
          adapted.employee_status = this.config.useNewSchema
            ? MigrationHelpers.convertEmployeeStatus(adapted.employee_status)
            : adapted.employee_status;
        }
        break;

      case 'staff_schedules':
        if (adapted.status) {
          adapted.status = this.config.useNewSchema
            ? MigrationHelpers.convertScheduleStatus(adapted.status)
            : adapted.status;
        }
        break;

      case 'staff_availability':
        if (adapted.availability_type) {
          adapted.availability_type = this.config.useNewSchema
            ? MigrationHelpers.convertAvailabilityType(adapted.availability_type)
            : adapted.availability_type;
        }
        break;
    }

    return adapted;
  }

  /**
   * Execute a select query with migration adaptation
   */
  async select<T = any>(
    originalTableName: string,
    selectClause: string = '*',
    filters?: Record<string, any>,
    options?: { limit?: number; offset?: number; orderBy?: string }
  ): Promise<T[]> {
    const tableName = this.adaptTableName(originalTableName);
    
    if (this.config.logMigrationQueries) {
      console.log(`[Migration] SELECT from ${originalTableName} -> ${tableName}`);
    }

    let query = this.client
      .from(tableName)
      .select(selectClause);

    // Apply filters with status adaptation
    if (filters) {
      const adaptedFilters = this.adaptInputStatusValues(filters, originalTableName);
      Object.entries(adaptedFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply options
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, (options.offset || 0) + (options.limit || 100) - 1);
    }
    if (options?.orderBy) {
      query = query.order(options.orderBy);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Migration query failed: ${error.message}`);
    }

    return this.adaptStatusValues(data || [], originalTableName) as T[];
  }

  /**
   * Execute an insert query with migration adaptation
   */
  async insert<T = any>(
    originalTableName: string,
    insertData: any | any[]
  ): Promise<T[]> {
    const tableName = this.adaptTableName(originalTableName);
    
    if (this.config.logMigrationQueries) {
      console.log(`[Migration] INSERT into ${originalTableName} -> ${tableName}`);
    }

    const dataToInsert = Array.isArray(insertData) 
      ? insertData.map(item => this.adaptInputStatusValues(item, originalTableName))
      : this.adaptInputStatusValues(insertData, originalTableName);

    const { data, error } = await this.client
      .from(tableName)
      .insert(dataToInsert)
      .select();

    if (error) {
      throw new Error(`Migration insert failed: ${error.message}`);
    }

    return this.adaptStatusValues(data || [], originalTableName) as T[];
  }

  /**
   * Execute an update query with migration adaptation
   */
  async update<T = any>(
    originalTableName: string,
    updateData: any,
    filters: Record<string, any>
  ): Promise<T[]> {
    const tableName = this.adaptTableName(originalTableName);
    
    if (this.config.logMigrationQueries) {
      console.log(`[Migration] UPDATE ${originalTableName} -> ${tableName}`);
    }

    const adaptedUpdateData = this.adaptInputStatusValues(updateData, originalTableName);
    const adaptedFilters = this.adaptInputStatusValues(filters, originalTableName);

    let query = this.client
      .from(tableName)
      .update(adaptedUpdateData);

    // Apply filters
    Object.entries(adaptedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.select();

    if (error) {
      throw new Error(`Migration update failed: ${error.message}`);
    }

    return this.adaptStatusValues(data || [], originalTableName) as T[];
  }

  /**
   * Execute a delete query with migration adaptation
   */
  async delete(
    originalTableName: string,
    filters: Record<string, any>
  ): Promise<void> {
    const tableName = this.adaptTableName(originalTableName);
    
    if (this.config.logMigrationQueries) {
      console.log(`[Migration] DELETE from ${originalTableName} -> ${tableName}`);
    }

    const adaptedFilters = this.adaptInputStatusValues(filters, originalTableName);

    let query = this.client
      .from(tableName)
      .delete();

    // Apply filters
    Object.entries(adaptedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { error } = await query;

    if (error) {
      throw new Error(`Migration delete failed: ${error.message}`);
    }
  }

  /**
   * Execute raw SQL with migration table name adaptation
   */
  async rawQuery<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (this.config.logMigrationQueries) {
      console.log(`[Migration] Raw query: ${sql.substring(0, 100)}...`);
    }

    // Adapt table names in SQL
    let adaptedSQL = sql;
    if (this.config.enableMigrationMode && this.config.useNewSchema) {
      Object.entries(TableMapping).forEach(([oldTable, newTable]) => {
        const regex = new RegExp(`\\b${oldTable}\\b`, 'gi');
        adaptedSQL = adaptedSQL.replace(regex, newTable);
      });
    }

    const { data, error } = await this.client.rpc('execute_query', {
      query_text: adaptedSQL,
      query_params: params || []
    });

    if (error) {
      throw new Error(`Migration raw query failed: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check migration status and compatibility
   */
  async checkMigrationStatus(): Promise<{
    migrationMode: boolean;
    usingNewSchema: boolean;
    tablesExist: Record<string, boolean>;
    statusMigrationNeeded: boolean;
  }> {
    const tablesExist: Record<string, boolean> = {};

    // Check if old tables exist
    for (const oldTable of Object.keys(TableMapping)) {
      try {
        const { error } = await this.client
          .from(oldTable)
          .select('count')
          .limit(1);
        
        tablesExist[oldTable] = !error;
      } catch {
        tablesExist[oldTable] = false;
      }
    }

    // Check if new tables exist
    for (const newTable of Object.values(TableMapping)) {
      try {
        const { error } = await this.client
          .from(newTable)
          .select('count')
          .limit(1);
        
        tablesExist[newTable] = !error;
      } catch {
        tablesExist[newTable] = false;
      }
    }

    // Check if status migration is needed (look for old status values)
    let statusMigrationNeeded = false;
    try {
      const { data } = await this.client
        .from('staff_tickets')
        .select('status')
        .in('status', Object.keys(StatusMapping.TICKET_STATUS))
        .limit(1);
      
      statusMigrationNeeded = (data && data.length > 0) || false;
    } catch {
      // Table might not exist, which is fine
    }

    return {
      migrationMode: this.config.enableMigrationMode,
      usingNewSchema: this.config.useNewSchema,
      tablesExist,
      statusMigrationNeeded
    };
  }

  /**
   * Update migration configuration
   */
  updateConfig(newConfig: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.logMigrationQueries) {
      console.log('[Migration] Configuration updated:', this.config);
    }
  }

  /**
   * Get current migration configuration
   */
  getConfig(): MigrationConfig {
    return { ...this.config };
  }
}

// Singleton instance for global use
export const migrationAdapter = new MigrationQueryAdapter();