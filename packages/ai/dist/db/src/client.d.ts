export declare function getSupabaseClient(): any;
export declare function getSupabaseAdminClient(): any;
export declare const supabase: any;
export declare const supabaseAdmin: any;
export declare const dbConfig: {
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
    retryAttempts: number;
    retryDelay: number;
};
interface ConnectionMetrics {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    slowQueries: number;
    failedQueries: number;
    averageQueryTime: number;
    lastHealthCheck: Date;
    connectionErrors: number;
}
declare class ConnectionMonitor {
    private metrics;
    private queryTimes;
    private isMonitoring;
    private monitoringInterval?;
    constructor();
    startMonitoring(): void;
    stopMonitoring(): void;
    updateMetrics(): Promise<void>;
    trackQuery(queryTime: number, failed?: boolean): void;
    alertConnectionPoolHigh(): Promise<void>;
    getMetrics(): ConnectionMetrics;
    healthCheck(): Promise<{
        healthy: boolean;
        metrics: ConnectionMetrics;
        warnings: string[];
    }>;
}
export declare const connectionMonitor: ConnectionMonitor;
export declare function monitoredQuery<T>(queryFn: () => Promise<T>, queryName?: string): Promise<T>;
export declare function cachedQuery<T>(queryFn: () => Promise<T>, cacheKey: string, options?: {
    ttl?: number;
    queryName?: string;
    skipCache?: boolean;
}): Promise<T>;
export declare function getPatientCached(patientId: string): Promise<any>;
export declare function getLocationCached(locationId: string): Promise<any>;
export declare function getMedicationListCached(): Promise<any>;
export declare function getInsuranceProvidersCached(): Promise<any>;
export declare function getInventoryByLocationCached(locationId: string): Promise<any>;
export declare function getUserPermissionsCached(userId: string): Promise<any>;
export declare function getPatientMedicationsCached(patientId: string): Promise<any>;
export declare function updatePatientWithCacheInvalidation(patientId: string, updates: any): Promise<any>;
export declare function updateLocationWithCacheInvalidation(locationId: string, updates: any): Promise<any>;
export declare function updateInventoryWithCacheInvalidation(itemId: string, updates: any, locationId?: string): Promise<any>;
export declare function checkDatabaseHealth(): Promise<boolean>;
export {};
//# sourceMappingURL=client.d.ts.map