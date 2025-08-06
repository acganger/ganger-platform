export interface APIMetrics {
    endpoint: string;
    method: string;
    status: number;
    duration: number;
    timestamp: string;
    size?: {
        request: number;
        response: number;
    };
    cache?: {
        hit: boolean;
        strategy?: string;
    };
    retries?: number;
    error?: string;
}
export interface EndpointStats {
    endpoint: string;
    method: string;
    calls: number;
    averageLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    minLatency: number;
    maxLatency: number;
    errorRate: number;
    successRate: number;
    totalDataTransferred: {
        sent: number;
        received: number;
    };
    cacheHitRate: number;
    lastUpdated: string;
}
export interface APIHealthStatus {
    healthy: boolean;
    degraded: boolean;
    issues: Array<{
        endpoint: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
        metric: string;
        value: number;
        threshold: number;
    }>;
}
declare class APILatencyMonitor {
    private metricsBuffer;
    private endpointStats;
    private latencyHistogram;
    private readonly maxBufferSize;
    private readonly histogramSize;
    private flushInterval;
    private aggregationInterval;
    constructor();
    private startIntervals;
    trackAPICall(endpoint: string, method: string, execute: () => Promise<Response>): Promise<Response>;
    private normalizeEndpoint;
    private recordMetrics;
    private updateEndpointStats;
    private calculatePercentile;
    private aggregateStats;
    private flushMetrics;
    getEndpointStats(endpoint?: string, method?: string): EndpointStats[];
    getSummary(): {
        totalEndpoints: number;
        totalCalls: number;
        averageLatency: number;
        errorRate: number;
        cacheHitRate: number;
        slowestEndpoints: {
            endpoint: string;
            method: string;
            p95Latency: number;
        }[];
        errorProneEndpoints: {
            endpoint: string;
            method: string;
            errorRate: number;
        }[];
        busiestEndpoints: {
            endpoint: string;
            method: string;
            calls: number;
        }[];
    };
    getHealthStatus(): APIHealthStatus;
    getMetricsByTimeRange(startTime: Date, endTime: Date): APIMetrics[];
    clearStats(): void;
    destroy(): void;
}
export declare const apiLatencyMonitor: APILatencyMonitor;
export declare function monitoredFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
export declare function useAPIMonitoring(): {
    getStats: () => {
        stats: EndpointStats[];
        health: APIHealthStatus;
    };
    getHealth: () => APIHealthStatus;
    getSummary: () => {
        totalEndpoints: number;
        totalCalls: number;
        averageLatency: number;
        errorRate: number;
        cacheHitRate: number;
        slowestEndpoints: {
            endpoint: string;
            method: string;
            p95Latency: number;
        }[];
        errorProneEndpoints: {
            endpoint: string;
            method: string;
            errorRate: number;
        }[];
        busiestEndpoints: {
            endpoint: string;
            method: string;
            calls: number;
        }[];
    };
    monitoredCall: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
};
export {};
//# sourceMappingURL=api-latency-monitor.d.ts.map