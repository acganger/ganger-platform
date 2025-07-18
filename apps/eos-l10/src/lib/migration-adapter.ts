/**
 * EOS L10 Migration Adapter
 * Handles table name mapping and status value conversion during database schema migration
 */

import { migrationAdapter, MigrationHelpers } from '@ganger/db';

// Configure migration adapter for EOS L10
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

// EOS L10 specific table mappings
const EOS_TABLE_MAPPING = {
  teams: 'l10_teams',
  team_members: 'l10_team_members',
  rocks: 'l10_rocks',
  issues: 'l10_issues',
  todos: 'l10_todos',
  scorecards: 'l10_scorecards',
  scorecard_metrics: 'l10_scorecard_metrics',
  scorecard_entries: 'l10_scorecard_entries',
  l10_meetings: 'l10_meetings', // Already prefixed correctly
  users: 'users' // Keep as is
} as const;

// EOS L10 specific status mappings
const EOS_STATUS_MAPPING = {
  // Rocks status mapping
  ROCK_STATUS: {
    'not_started': 'not_started',
    'on_track': 'on_track',
    'off_track': 'off_track',
    'complete': 'complete'
  },
  
  // Issues status mapping  
  ISSUE_STATUS: {
    'identified': 'identified',
    'discussing': 'discussing',
    'solved': 'solved',
    'dropped': 'dropped'
  },
  
  // Todos status mapping
  TODO_STATUS: {
    'pending': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'dropped': 'dropped'
  },
  
  // Meeting status mapping
  MEETING_STATUS: {
    'scheduled': 'scheduled',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
} as const;

export class EOSL10MigrationAdapter {
  /**
   * Map old table name to new table name
   */
  private mapTableName(oldTable: string): string {
    return EOS_TABLE_MAPPING[oldTable as keyof typeof EOS_TABLE_MAPPING] || oldTable;
  }

  /**
   * Convert status values based on context
   */
  private convertStatus(status: string, context: 'rock' | 'issue' | 'todo' | 'meeting'): string {
    switch (context) {
      case 'rock':
        return EOS_STATUS_MAPPING.ROCK_STATUS[status as keyof typeof EOS_STATUS_MAPPING.ROCK_STATUS] || status;
      case 'issue':
        return EOS_STATUS_MAPPING.ISSUE_STATUS[status as keyof typeof EOS_STATUS_MAPPING.ISSUE_STATUS] || status;
      case 'todo':
        return EOS_STATUS_MAPPING.TODO_STATUS[status as keyof typeof EOS_STATUS_MAPPING.TODO_STATUS] || status;
      case 'meeting':
        return EOS_STATUS_MAPPING.MEETING_STATUS[status as keyof typeof EOS_STATUS_MAPPING.MEETING_STATUS] || status;
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
    
    // Use migration adapter for the actual query
    const results = await migrationAdapter.select<T>(
      mappedTable,
      selectClause,
      filters,
      options
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EOS L10 Migration] Query ${tableName} → ${mappedTable}, returned ${results.length} rows`);
    }
    
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
      console.log(`[EOS L10 Migration] Insert ${tableName} → ${mappedTable}`);
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
      console.log(`[EOS L10 Migration] Update ${tableName} → ${mappedTable}`);
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
      console.log(`[EOS L10 Migration] Delete ${tableName} → ${mappedTable}`);
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
      if (tableName === 'rocks') {
        converted.status = this.convertStatus(converted.status, 'rock');
      } else if (tableName === 'issues') {
        converted.status = this.convertStatus(converted.status, 'issue');
      } else if (tableName === 'todos') {
        converted.status = this.convertStatus(converted.status, 'todo');
      } else if (tableName === 'l10_meetings') {
        converted.status = this.convertStatus(converted.status, 'meeting');
      }
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
   * Setup real-time subscriptions with migration support
   */
  setupRealtimeSubscription(
    tableName: string,
    callback: (payload: any) => void,
    eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ) {
    const mappedTable = this.mapTableName(tableName);
    
    // Use the migration adapter's raw query method to access Supabase client
    // This is a simplified approach - in practice, you'd need to access the underlying client
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EOS L10 Migration] Setting up realtime subscription ${tableName} → ${mappedTable}`);
    }
    
    // Return a mock subscription for now - this would need to be implemented
    // with the actual Supabase client
    return {
      unsubscribe: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[EOS L10 Migration] Unsubscribing from ${tableName}`);
        }
      }
    };
  }
}

// Export singleton instance
export const eosL10MigrationAdapter = new EOSL10MigrationAdapter();