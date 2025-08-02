export interface PerformanceMetrics {
    timestamp: string;
    system: {
        memory_usage: {
            heapUsed: number;
            heapTotal: number;
            external: number;
            rss: number;
        };
        cpu_usage: number;
        uptime: number;
    };
    database: {
        active_connections: number;
        pool_utilization: number;
        query_performance: {
            total_queries: number;
            slow_queries: number;
            average_query_time: number;
            failed_queries: number;
        };
    };
    cache: {
        hit_rate: number;
        miss_rate: number;
        total_requests: number;
        memory_usage: number;
    };
    api: {
        total_requests: number;
        error_rate: number;
        average_response_time: number;
        endpoints: Map<string, {
            request_count: number;
            average_response_time: number;
            error_count: number;
        }>;
    };
    alerts: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        threshold: number;
        current_value: number;
    }>;
}
export interface PerformanceTrend {
    metric: string;
    timeframe: '1h' | '6h' | '24h' | '7d';
    data_points: Array<{
        timestamp: string;
        value: number;
    }>;
    trend_direction: 'up' | 'down' | 'stable';
    change_percentage: number;
}
export declare class PerformanceMonitor {
    private metricsHistory;
    private apiMetrics;
    private readonly MAX_HISTORY_ENTRIES;
    private readonly API_METRICS_TTL;
    getCurrentMetrics(): Promise<PerformanceMetrics>;
    private getSystemMetrics;
    private getDatabaseMetrics;
    private getCacheMetrics;
    private getApiMetrics;
    trackApiRequest(endpoint: string, responseTime: number, success: boolean): void;
    private generateAlerts;
    private storeMetricsHistory;
    getTrends(metric: string, timeframe: '1h' | '6h' | '24h' | '7d'): PerformanceTrend | null;
    private extractMetricValue;
    cleanupOldData(): void;
    startPeriodicCleanup(): void;
    collectSystemMetrics(): Promise<PerformanceMetrics>;
    getPerformanceTrends(period?: 'hour' | 'day' | 'week'): Promise<PerformanceTrend[]>;
    generatePerformanceAlerts(): Promise<Array<{
        id: string;
        metric: string;
        threshold: number;
        current_value: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        timestamp: string;
    }>>;
    getMetricsHistory(hours?: number): Promise<PerformanceMetrics[]>;
    getAverageMetrics(period?: 'hour' | 'day' | 'week'): Promise<Partial<PerformanceMetrics>>;
}
export declare const performanceMonitor: PerformanceMonitor;
