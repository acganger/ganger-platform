/**
 * Migration Query Adapter
 * Provides backward-compatible database queries during migration
 * Phase 2: Shared Package Migration
 */
export interface MigrationConfig {
    enableMigrationMode: boolean;
    useNewSchema: boolean;
    logMigrationQueries: boolean;
}
/**
 * Adapter class that provides backward compatibility during migration
 */
export declare class MigrationQueryAdapter {
    private config;
    constructor(config?: MigrationConfig);
    /**
     * Get Supabase client for database operations
     */
    private get client();
    /**
     * Adapt table name for queries based on migration state
     */
    private adaptTableName;
    /**
     * Adapt status values in query results
     */
    private adaptStatusValues;
    /**
     * Adapt status values in query inputs
     */
    private adaptInputStatusValues;
    /**
     * Execute a select query with migration adaptation
     */
    select<T = any>(originalTableName: string, selectClause?: string, filters?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
    }): Promise<T[]>;
    /**
     * Execute an insert query with migration adaptation
     */
    insert<T = any>(originalTableName: string, insertData: any | any[]): Promise<T[]>;
    /**
     * Execute an update query with migration adaptation
     */
    update<T = any>(originalTableName: string, updateData: any, filters: Record<string, any>): Promise<T[]>;
    /**
     * Execute a delete query with migration adaptation
     */
    delete(originalTableName: string, filters: Record<string, any>): Promise<void>;
    /**
     * Execute raw SQL with migration table name adaptation
     */
    rawQuery<T = any>(sql: string, params?: any[]): Promise<T[]>;
    /**
     * Check migration status and compatibility
     */
    checkMigrationStatus(): Promise<{
        migrationMode: boolean;
        usingNewSchema: boolean;
        tablesExist: Record<string, boolean>;
        statusMigrationNeeded: boolean;
    }>;
    /**
     * Update migration configuration
     */
    updateConfig(newConfig: Partial<MigrationConfig>): void;
    /**
     * Get current migration configuration
     */
    getConfig(): MigrationConfig;
}
export declare const migrationAdapter: MigrationQueryAdapter;
