export interface QueryMetrics {
    query: string;
    operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'other';
    table?: string;
    duration: number;
    rowCount?: number;
    error?: string;
    timestamp: string;
    cached?: boolean;
    planTime?: number;
    executionTime?: number;
    affectedRows?: number;
    queryHash: string;
}
export interface TableStats {
    tableName: string;
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
    operations: {
        select: number;
        insert: number;
        update: number;
        delete: number;
    };
    indexUsage?: {
        indexScans: number;
        seqScans: number;
        indexHitRate: number;
    };
    cacheStats?: {
        hitRate: number;
        missRate: number;
    };
}
export interface QueryPattern {
    pattern: string;
    count: number;
    averageDuration: number;
    p95Duration: number;
    errorRate: number;
    lastSeen: string;
    examples: string[];
}
export interface DatabaseHealth {
    connectionPoolHealth: {
        active: number;
        idle: number;
        waiting: number;
        maxSize: number;
        utilizationPercent: number;
    };
    queryPerformance: {
        averageQueryTime: number;
        slowQueryRate: number;
        errorRate: number;
    };
    tableHealth: Array<{
        table: string;
        health: 'good' | 'degraded' | 'poor';
        issues: string[];
    }>;
    recommendations: string[];
}
declare class DatabasePerformanceMonitor {
    private queryMetrics;
    private tableStats;
    private queryPatterns;
    private connectionMetrics;
    private readonly maxMetricsSize;
    private readonly patternCacheSize;
    private flushInterval;
    constructor();
    private startFlushInterval;
    private setupSupabaseInterceptor;
    trackQuery<T>(operation: QueryMetrics['operation'], table: string, queryFn: () => Promise<T>, queryDetails?: Partial<QueryMetrics>): Promise<T>;
    private generateQueryRepresentation;
    private hashQuery;
    private getThreshold;
    private recordQueryMetrics;
    private updateTableStats;
    private updateQueryPattern;
    private analyzePatterns;
    getTableStats(): TableStats[];
    getSlowQueries(limit?: number): QueryMetrics[];
    getErrorQueries(limit?: number): QueryMetrics[];
    getQueryPatterns(minCount?: number): QueryPattern[];
    getDatabaseHealth(): DatabaseHealth;
    updateConnectionMetrics(metrics: {
        active: number;
        idle: number;
        waiting: number;
        maxSize?: number;
    }): void;
    private flushMetrics;
    destroy(): void;
}
export declare const databasePerformanceMonitor: DatabasePerformanceMonitor;
export declare function monitoredQuery<T>(table: string, queryBuilder: any): Promise<T>;
export declare function useDatabaseMonitoring(): {
    getMonitoringData: () => {
        health: DatabaseHealth;
        tableStats: TableStats[];
    };
    getSlowQueries: () => QueryMetrics[];
    trackQuery: <T>(operation: QueryMetrics["operation"], table: string, queryFn: () => Promise<T>) => Promise<T>;
};
export {};
//# sourceMappingURL=database-performance-monitor.d.ts.map