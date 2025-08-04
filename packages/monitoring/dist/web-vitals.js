"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webVitalsTracker = void 0;
exports.useWebVitals = useWebVitals;
exports.measureUserTiming = measureUserTiming;
const performance_monitor_1 = require("./performance-monitor");
const error_tracking_1 = require("./services/error-tracking");
const THRESHOLDS = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 }
};
class WebVitalsTracker {
    constructor() {
        this.metrics = new Map();
        this.observer = null;
        this.reportingEndpoint = '/api/monitoring/web-vitals';
        this.bufferSize = 10;
        this.metricsBuffer = [];
        if (typeof window === 'undefined')
            return;
        this.initializeObservers();
        this.setupUnloadHandler();
    }
    initializeObservers() {
        try {
            // First Contentful Paint (FCP)
            this.observePaint();
            // Largest Contentful Paint (LCP)
            this.observeLCP();
            // First Input Delay (FID) and Interaction to Next Paint (INP)
            this.observeInteractions();
            // Cumulative Layout Shift (CLS)
            this.observeLayoutShifts();
            // Time to First Byte (TTFB)
            this.observeNavigation();
        }
        catch (error) {
            console.error('Failed to initialize Web Vitals observers:', error);
        }
    }
    observePaint() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.recordMetric({
                            name: 'FCP',
                            value: entry.startTime,
                            rating: this.getRating('FCP', entry.startTime),
                            delta: entry.startTime,
                            id: this.generateId(),
                            navigationType: this.getNavigationType(),
                            entries: [entry]
                        });
                    }
                }
            });
            observer.observe({ entryTypes: ['paint'] });
        }
        catch (error) {
            console.error('Failed to observe paint metrics:', error);
        }
    }
    observeLCP() {
        try {
            let lcpValue = 0;
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                lcpValue = lastEntry.startTime;
                this.recordMetric({
                    name: 'LCP',
                    value: lcpValue,
                    rating: this.getRating('LCP', lcpValue),
                    delta: lcpValue,
                    id: this.generateId(),
                    navigationType: this.getNavigationType(),
                    entries: [lastEntry]
                });
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
        catch (error) {
            console.error('Failed to observe LCP:', error);
        }
    }
    observeInteractions() {
        try {
            let fidReported = false;
            const inpValues = [];
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const eventEntry = entry;
                    // FID (First Input Delay)
                    if (!fidReported && entry.entryType === 'first-input') {
                        const fidValue = eventEntry.processingStart - eventEntry.startTime;
                        fidReported = true;
                        this.recordMetric({
                            name: 'FID',
                            value: fidValue,
                            rating: this.getRating('FID', fidValue),
                            delta: fidValue,
                            id: this.generateId(),
                            navigationType: this.getNavigationType(),
                            entries: [entry]
                        });
                    }
                    // INP (Interaction to Next Paint)
                    if (eventEntry.interactionId) {
                        const inputDelay = eventEntry.processingStart - eventEntry.startTime;
                        const processingTime = eventEntry.processingEnd - eventEntry.processingStart;
                        const presentationDelay = eventEntry.startTime + eventEntry.duration - eventEntry.processingEnd;
                        const totalDuration = inputDelay + processingTime + presentationDelay;
                        inpValues.push(totalDuration);
                        // Report 98th percentile as INP
                        if (inpValues.length >= 10) {
                            const sortedValues = [...inpValues].sort((a, b) => a - b);
                            const p98Index = Math.floor(sortedValues.length * 0.98);
                            const inpValue = sortedValues[p98Index];
                            this.recordMetric({
                                name: 'INP',
                                value: inpValue,
                                rating: this.getRating('INP', inpValue),
                                delta: inpValue,
                                id: this.generateId(),
                                navigationType: this.getNavigationType(),
                                entries: []
                            });
                            // Reset for next calculation
                            inpValues.length = 0;
                        }
                    }
                }
            });
            observer.observe({
                entryTypes: ['first-input', 'event'],
                buffered: true
            });
        }
        catch (error) {
            console.error('Failed to observe interaction metrics:', error);
        }
    }
    observeLayoutShifts() {
        try {
            let clsValue = 0;
            let clsEntries = [];
            let sessionValue = 0;
            let sessionEntries = [];
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    // Only count layout shifts without recent user input
                    if (!entry.hadRecentInput) {
                        const layoutShiftEntry = entry;
                        sessionValue += layoutShiftEntry.value;
                        sessionEntries.push(entry);
                        // Check if this is a new session
                        if (sessionValue > clsValue) {
                            clsValue = sessionValue;
                            clsEntries = [...sessionEntries];
                        }
                        this.recordMetric({
                            name: 'CLS',
                            value: clsValue,
                            rating: this.getRating('CLS', clsValue),
                            delta: layoutShiftEntry.value,
                            id: this.generateId(),
                            navigationType: this.getNavigationType(),
                            entries: clsEntries
                        });
                    }
                }
            });
            observer.observe({ entryTypes: ['layout-shift'] });
        }
        catch (error) {
            console.error('Failed to observe CLS:', error);
        }
    }
    observeNavigation() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const navEntry = entry;
                    const ttfb = navEntry.responseStart - navEntry.requestStart;
                    this.recordMetric({
                        name: 'TTFB',
                        value: ttfb,
                        rating: this.getRating('TTFB', ttfb),
                        delta: ttfb,
                        id: this.generateId(),
                        navigationType: this.getNavigationType(),
                        entries: [entry]
                    });
                }
            });
            observer.observe({ entryTypes: ['navigation'] });
        }
        catch (error) {
            console.error('Failed to observe navigation timing:', error);
        }
    }
    recordMetric(metric) {
        // Store metric
        this.metrics.set(metric.name, metric);
        // Add to buffer
        this.metricsBuffer.push(metric);
        // Track in performance monitor
        performance_monitor_1.performanceMonitor.trackApiRequest(`web-vitals-${metric.name}`, metric.value, metric.rating !== 'poor');
        // Report if buffer is full
        if (this.metricsBuffer.length >= this.bufferSize) {
            this.reportMetrics();
        }
        // Log poor performance
        if (metric.rating === 'poor') {
            console.warn(`Poor ${metric.name} performance:`, metric.value);
            // Track as error for critical metrics
            if (['LCP', 'FID', 'CLS'].includes(metric.name)) {
                error_tracking_1.errorTracking.trackEvent('poor_web_vital', {
                    metric: metric.name,
                    value: metric.value,
                    page: window.location.pathname,
                    userAgent: navigator.userAgent
                });
            }
        }
    }
    getRating(metricName, value) {
        const thresholds = THRESHOLDS[metricName];
        if (!thresholds)
            return 'good';
        if (value <= thresholds.good)
            return 'good';
        if (value <= thresholds.poor)
            return 'needs-improvement';
        return 'poor';
    }
    getNavigationType() {
        if (typeof window === 'undefined')
            return 'navigate';
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (!navEntry)
            return 'navigate';
        if (navEntry.type === 'reload')
            return 'reload';
        if (navEntry.type === 'back_forward')
            return 'back-forward';
        if (navEntry.type === 'prerender')
            return 'prerender';
        return 'navigate';
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async reportMetrics() {
        if (this.metricsBuffer.length === 0)
            return;
        const metrics = [...this.metricsBuffer];
        this.metricsBuffer = [];
        try {
            // Remove PII from entries before sending
            const sanitizedMetrics = metrics.map(metric => ({
                ...metric,
                entries: [] // Don't send raw performance entries to avoid PII
            }));
            await fetch(this.reportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    metrics: sanitizedMetrics,
                    page: window.location.pathname,
                    timestamp: new Date().toISOString()
                })
            });
        }
        catch (error) {
            console.error('Failed to report Web Vitals:', error);
            // Put metrics back in buffer for retry
            this.metricsBuffer.unshift(...metrics);
        }
    }
    setupUnloadHandler() {
        // Report metrics when page unloads
        const reportOnUnload = () => {
            this.reportMetrics();
        };
        window.addEventListener('pagehide', reportOnUnload);
        window.addEventListener('beforeunload', reportOnUnload);
        // Also report periodically
        setInterval(() => {
            this.reportMetrics();
        }, 30000); // Every 30 seconds
    }
    getMetrics() {
        return new Map(this.metrics);
    }
    getMetric(name) {
        return this.metrics.get(name);
    }
    getSummary() {
        const summary = {
            FCP: this.metrics.get('FCP'),
            LCP: this.metrics.get('LCP'),
            FID: this.metrics.get('FID'),
            CLS: this.metrics.get('CLS'),
            TTFB: this.metrics.get('TTFB'),
            INP: this.metrics.get('INP')
        };
        const scores = {
            good: 0,
            needsImprovement: 0,
            poor: 0
        };
        Object.values(summary).forEach(metric => {
            if (metric) {
                if (metric.rating === 'good')
                    scores.good++;
                else if (metric.rating === 'needs-improvement')
                    scores.needsImprovement++;
                else
                    scores.poor++;
            }
        });
        return {
            metrics: summary,
            scores,
            overallRating: scores.poor > 0 ? 'poor' : scores.needsImprovement > 2 ? 'needs-improvement' : 'good'
        };
    }
}
// Global instance
exports.webVitalsTracker = typeof window !== 'undefined' ? new WebVitalsTracker() : null;
// React hook for Web Vitals
function useWebVitals() {
    // This hook would need React imported in the consuming component
    // Example usage:
    // import React from 'react';
    // const [metrics, setMetrics] = React.useState<ReturnType<typeof webVitalsTracker.getSummary> | null>(null);
    // 
    // React.useEffect(() => {
    //   if (!webVitalsTracker) return;
    //   
    //   const updateMetrics = () => {
    //     setMetrics(webVitalsTracker.getSummary());
    //   };
    //   
    //   // Update every 5 seconds
    //   const interval = setInterval(updateMetrics, 5000);
    //   updateMetrics();
    //   
    //   return () => clearInterval(interval);
    // }, []);
    // 
    // return metrics;
    // For now, return a function that gets current metrics
    return () => exports.webVitalsTracker?.getSummary() || null;
}
// Utility to report custom user timing
function measureUserTiming(measureName, startMark, endMark) {
    try {
        if (typeof window === 'undefined')
            return;
        performance.measure(measureName, startMark, endMark);
        const measures = performance.getEntriesByName(measureName, 'measure');
        const measure = measures[measures.length - 1];
        if (measure) {
            error_tracking_1.errorTracking.trackPerformance({
                name: `user_timing_${measureName}`,
                value: measure.duration,
                unit: 'ms',
                timestamp: new Date().toISOString(),
                tags: {
                    page: window.location.pathname,
                    measure: measureName
                }
            });
        }
    }
    catch (error) {
        console.error('Failed to measure user timing:', error);
    }
}
//# sourceMappingURL=web-vitals.js.map