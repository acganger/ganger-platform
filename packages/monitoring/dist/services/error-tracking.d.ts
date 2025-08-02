export interface ErrorEvent {
    message: string;
    stack?: string;
    componentStack?: string;
    timestamp: string;
    url: string;
    userAgent?: string;
    userId?: string;
    metadata?: Record<string, any>;
}
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: string;
    tags?: Record<string, string>;
}
declare class ErrorTrackingService {
    private queue;
    private flushInterval;
    private maxQueueSize;
    private flushIntervalMs;
    constructor();
    private startFlushInterval;
    trackError(error: Error | ErrorEvent, metadata?: Record<string, any>): Promise<void>;
    flush(): Promise<void>;
    trackEvent(eventName: string, properties?: Record<string, any>): Promise<void>;
    trackPerformance(metric: PerformanceMetric): Promise<void>;
    destroy(): void;
}
export declare const errorTracking: ErrorTrackingService;
export declare function logErrorToService(error: Error, errorInfo?: {
    componentStack?: string;
}): void;
export declare function measureApiCall(endpoint: string, duration: number, status: number): void;
export declare function measurePageLoad(): void;
export {};
