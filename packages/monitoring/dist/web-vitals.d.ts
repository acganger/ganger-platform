export interface WebVitalsMetric {
    name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
    entries: PerformanceEntry[];
}
declare class WebVitalsTracker {
    private metrics;
    private observer;
    private reportingEndpoint;
    private bufferSize;
    private metricsBuffer;
    constructor();
    private initializeObservers;
    private observePaint;
    private observeLCP;
    private observeInteractions;
    private observeLayoutShifts;
    private observeNavigation;
    private recordMetric;
    private getRating;
    private getNavigationType;
    private generateId;
    private reportMetrics;
    private setupUnloadHandler;
    getMetrics(): Map<string, WebVitalsMetric>;
    getMetric(name: string): WebVitalsMetric | undefined;
    getSummary(): {
        metrics: {
            FCP: WebVitalsMetric | undefined;
            LCP: WebVitalsMetric | undefined;
            FID: WebVitalsMetric | undefined;
            CLS: WebVitalsMetric | undefined;
            TTFB: WebVitalsMetric | undefined;
            INP: WebVitalsMetric | undefined;
        };
        scores: {
            good: number;
            needsImprovement: number;
            poor: number;
        };
        overallRating: string;
    };
}
export declare const webVitalsTracker: WebVitalsTracker | null;
export declare function useWebVitals(): () => {
    metrics: {
        FCP: WebVitalsMetric | undefined;
        LCP: WebVitalsMetric | undefined;
        FID: WebVitalsMetric | undefined;
        CLS: WebVitalsMetric | undefined;
        TTFB: WebVitalsMetric | undefined;
        INP: WebVitalsMetric | undefined;
    };
    scores: {
        good: number;
        needsImprovement: number;
        poor: number;
    };
    overallRating: string;
} | null;
export declare function measureUserTiming(measureName: string, startMark: string, endMark?: string): void;
export {};
//# sourceMappingURL=web-vitals.d.ts.map