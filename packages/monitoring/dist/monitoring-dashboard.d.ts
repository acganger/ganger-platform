export interface MonitoringDashboardData {
    timestamp: string;
    overview: {
        status: 'healthy' | 'degraded' | 'critical';
        healthScore: number;
        activeAlerts: number;
        activeIncidents: number;
    };
    performance: {
        current: any;
        trends: any[];
        webVitals?: any;
    };
    uptime: {
        summary: any;
        checks: any[];
        incidents: any[];
    };
    api: {
        summary: any;
        endpoints: any[];
        health: any;
    };
    database: {
        health: any;
        tableStats: any[];
        slowQueries: any[];
    };
    errors: {
        metrics: any;
        recentErrors: any[];
    };
    integrations: {
        health: any[];
        status: any;
    };
    customMetrics: {
        business: any[];
        technical: any[];
    };
}
export declare class MonitoringDashboard {
    private refreshInterval;
    private cachedData;
    private cacheExpiry;
    private lastRefresh;
    constructor();
    private refreshCache;
    getDashboardData(forceRefresh?: boolean): Promise<MonitoringDashboardData>;
    private collectAllMetrics;
    private getSettledValue;
    private calculateOverview;
    private calculateIntegrationStatus;
    getMetricHistory(metricType: 'performance' | 'api' | 'database' | 'errors' | 'custom', metricName: string, hours?: number): Promise<any[]>;
    destroy(): void;
}
export declare const monitoringDashboard: MonitoringDashboard;
export declare function handleMonitoringDashboardRequest(req: any, res: any): Promise<void>;
export default function createMonitoringDashboardRoute(): (req: any, res: any) => Promise<void>;
//# sourceMappingURL=monitoring-dashboard.d.ts.map