export interface IntegrationHealthStatus {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    last_check: string;
    response_time_ms?: number;
    error_message?: string;
    metrics?: {
        uptime?: number;
        error_rate?: number;
        avg_response_time?: number;
    };
    details?: any;
}
export declare class IntegrationHealthMonitor {
    private healthCache;
    private lastCheckTimes;
    private readonly CACHE_TTL_MS;
    getAllHealth(): Promise<IntegrationHealthStatus[]>;
    checkServiceHealth(service: string): Promise<IntegrationHealthStatus>;
    private checkDatabaseHealth;
    private checkStripeHealth;
    private checkTwilioHealth;
    private checkGoogleApisHealth;
    private checkCloudflareHealth;
    private cleanupCache;
    startPeriodicCleanup(): void;
    checkAllIntegrations(): Promise<IntegrationHealthStatus[]>;
    generateHealthAlerts(): Promise<{
        criticalAlerts: any[];
        warningAlerts: any[];
        infoAlerts: any[];
    }>;
    getHealthSummary(): Promise<{
        totalServices: number;
        healthyServices: number;
        degradedServices: number;
        downServices: number;
        overallStatus: 'healthy' | 'degraded' | 'down';
    }>;
}
export declare const integrationHealthMonitor: IntegrationHealthMonitor;
//# sourceMappingURL=integration-health.d.ts.map