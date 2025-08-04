interface ErrorContext {
    component?: string;
    action?: string;
    feature?: string;
    tags?: Record<string, string>;
}
declare class HIPAACompliantErrorTracker {
    private errorQueue;
    private sessionId;
    private maxQueueSize;
    private flushInterval;
    private errorCounts;
    private rateLimitWindow;
    private maxErrorsPerWindow;
    constructor();
    private generateSessionId;
    private sanitizeError;
    private removePII;
    private checkFilters;
    private generateFingerprint;
    private determineSeverity;
    private categorizeError;
    private buildSafeMetadata;
    trackError(error: Error | ErrorEvent | any, context?: ErrorContext): Promise<void>;
    private checkRateLimit;
    private flush;
    private groupErrors;
    private startFlushInterval;
    private setupGlobalHandlers;
    logErrorBoundary(error: Error, errorInfo: {
        componentStack: string;
    }, componentName: string): void;
    getErrorMetrics(): Promise<{
        total: number;
        bySeverity: Record<string, number>;
        byCategory: Record<string, number>;
        recentErrors: number;
    }>;
}
export declare const hipaaErrorTracker: HIPAACompliantErrorTracker;
export declare function useErrorTracking(componentName: string): {
    trackError: (error: Error | any, action?: string) => void;
    trackApiError: (endpoint: string, status: number, error: any) => void;
};
export {};
//# sourceMappingURL=hipaa-compliant-error-tracking.d.ts.map