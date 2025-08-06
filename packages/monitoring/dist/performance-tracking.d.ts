export interface PerformanceMark {
    name: string;
    timestamp: number;
}
export interface PerformanceMeasure {
    name: string;
    duration: number;
    startTime: number;
    endTime: number;
    metadata?: Record<string, any>;
}
export declare class PerformanceTracker {
    private marks;
    private measures;
    private serverTimings;
    /**
     * Mark the start of a performance measurement
     */
    mark(name: string): void;
    /**
     * Measure the duration between two marks
     */
    measure(name: string, startMark: string, endMark?: string, metadata?: Record<string, any>): PerformanceMeasure | null;
    /**
     * Track server-side timing
     */
    serverTiming(name: string, duration: number): void;
    /**
     * Get all measures
     */
    getMeasures(): PerformanceMeasure[];
    /**
     * Get measures by name pattern
     */
    getMeasuresByPattern(pattern: RegExp): PerformanceMeasure[];
    /**
     * Get average duration for measures matching a pattern
     */
    getAverageDuration(pattern: RegExp): number;
    /**
     * Clear all marks and measures
     */
    clear(): void;
    /**
     * Generate Server-Timing header value
     */
    getServerTimingHeader(): string;
}
export declare const performanceTracker: PerformanceTracker;
export declare function usePerformanceTracking(componentName: string): {
    trackRender: () => () => void;
    trackEffect: (effectName: string) => () => void;
    trackApiCall: <T>(apiName: string, apiCall: () => Promise<T>) => Promise<T>;
    getMetrics: () => PerformanceMeasure[];
};
export declare function trackWebVitals(): void;
//# sourceMappingURL=performance-tracking.d.ts.map