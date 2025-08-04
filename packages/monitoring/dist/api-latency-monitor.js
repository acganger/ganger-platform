"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLatencyMonitor = void 0;
exports.monitoredFetch = monitoredFetch;
exports.useAPIMonitoring = useAPIMonitoring;
const performance_monitor_1 = require("./performance-monitor");
const hipaa_compliant_error_tracking_1 = require("./hipaa-compliant-error-tracking");
const DEFAULT_THRESHOLDS = {
    good: 200,
    acceptable: 1000,
    slow: 3000
};
const ENDPOINT_THRESHOLDS = {
    '/api/auth': { good: 100, acceptable: 300, slow: 1000 },
    '/api/health': { good: 50, acceptable: 100, slow: 200 },
    '/api/search': { good: 300, acceptable: 1000, slow: 2000 },
    '/api/upload': { good: 1000, acceptable: 5000, slow: 10000 }
};
class APILatencyMonitor {
    constructor() {
        this.metricsBuffer = [];
        this.endpointStats = new Map();
        this.latencyHistogram = new Map();
        this.maxBufferSize = 1000;
        this.histogramSize = 1000;
        this.flushInterval = null;
        this.aggregationInterval = null;
        this.startIntervals();
    }
    startIntervals() {
        // Flush metrics every minute
        this.flushInterval = setInterval(() => {
            this.flushMetrics();
        }, 60000);
        // Aggregate stats every 5 minutes
        this.aggregationInterval = setInterval(() => {
            this.aggregateStats();
        }, 300000);
    }
    async trackAPICall(endpoint, method, execute) {
        const startTime = performance.now();
        const startMark = `api-${method}-${endpoint}-start-${Date.now()}`;
        performance.mark(startMark);
        let response = null;
        let error = null;
        let retries = 0;
        try {
            response = await execute();
            return response;
        }
        catch (err) {
            error = err;
            throw err;
        }
        finally {
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Create metrics
            const metrics = {
                endpoint: this.normalizeEndpoint(endpoint),
                method,
                status: response?.status || 0,
                duration,
                timestamp: new Date().toISOString(),
                retries,
                error: error?.message
            };
            // Add size information if available
            if (response) {
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    metrics.size = {
                        request: 0, // Would need to track from request
                        response: parseInt(contentLength)
                    };
                }
                // Check cache headers
                const cacheControl = response.headers.get('cache-control');
                const xCache = response.headers.get('x-cache');
                if (xCache) {
                    metrics.cache = {
                        hit: xCache.toLowerCase().includes('hit'),
                        strategy: cacheControl || undefined
                    };
                }
            }
            // Track the metrics
            this.recordMetrics(metrics);
            // Performance mark
            performance.measure(`api-${method}-${endpoint}`, startMark);
            // Track in performance monitor
            performance_monitor_1.performanceMonitor.trackApiRequest(endpoint, duration, !error && response !== null && response.status >= 200 && response.status < 300);
            // Track errors
            if (error || (response && response.status >= 400)) {
                hipaa_compliant_error_tracking_1.hipaaErrorTracker.trackError({
                    message: `API Error: ${method} ${endpoint}`,
                    status: response?.status || 0,
                    error: error?.message
                }, {
                    component: 'api-monitor',
                    action: 'api-call',
                    tags: {
                        endpoint,
                        method,
                        status: response?.status.toString() || '0'
                    }
                });
            }
        }
    }
    normalizeEndpoint(endpoint) {
        // Remove query parameters and IDs for grouping
        let normalized = endpoint.split('?')[0];
        // Replace UUIDs with placeholder
        normalized = normalized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
        // Replace numeric IDs with placeholder
        normalized = normalized.replace(/\/\d+/g, '/:id');
        return normalized;
    }
    recordMetrics(metrics) {
        // Add to buffer
        this.metricsBuffer.push(metrics);
        // Maintain buffer size
        if (this.metricsBuffer.length > this.maxBufferSize) {
            this.metricsBuffer.shift();
        }
        // Update histogram
        const key = `${metrics.method} ${metrics.endpoint}`;
        if (!this.latencyHistogram.has(key)) {
            this.latencyHistogram.set(key, []);
        }
        const histogram = this.latencyHistogram.get(key);
        histogram.push(metrics.duration);
        // Maintain histogram size
        if (histogram.length > this.histogramSize) {
            histogram.shift();
        }
        // Update real-time stats
        this.updateEndpointStats(metrics);
    }
    updateEndpointStats(metrics) {
        const key = `${metrics.method} ${metrics.endpoint}`;
        const existing = this.endpointStats.get(key);
        if (!existing) {
            this.endpointStats.set(key, {
                endpoint: metrics.endpoint,
                method: metrics.method,
                calls: 1,
                averageLatency: metrics.duration,
                p50Latency: metrics.duration,
                p95Latency: metrics.duration,
                p99Latency: metrics.duration,
                minLatency: metrics.duration,
                maxLatency: metrics.duration,
                errorRate: metrics.error || metrics.status >= 400 ? 100 : 0,
                successRate: !metrics.error && metrics.status < 400 ? 100 : 0,
                totalDataTransferred: {
                    sent: metrics.size?.request || 0,
                    received: metrics.size?.response || 0
                },
                cacheHitRate: metrics.cache?.hit ? 100 : 0,
                lastUpdated: metrics.timestamp
            });
        }
        else {
            // Update stats incrementally
            const isError = metrics.error || metrics.status >= 400;
            const isSuccess = !metrics.error && metrics.status < 400;
            existing.calls++;
            existing.averageLatency = (existing.averageLatency * (existing.calls - 1) + metrics.duration) / existing.calls;
            existing.minLatency = Math.min(existing.minLatency, metrics.duration);
            existing.maxLatency = Math.max(existing.maxLatency, metrics.duration);
            existing.errorRate = ((existing.errorRate * (existing.calls - 1)) + (isError ? 100 : 0)) / existing.calls;
            existing.successRate = ((existing.successRate * (existing.calls - 1)) + (isSuccess ? 100 : 0)) / existing.calls;
            if (metrics.size) {
                existing.totalDataTransferred.sent += metrics.size.request || 0;
                existing.totalDataTransferred.received += metrics.size.response || 0;
            }
            if (metrics.cache !== undefined) {
                existing.cacheHitRate = ((existing.cacheHitRate * (existing.calls - 1)) + (metrics.cache.hit ? 100 : 0)) / existing.calls;
            }
            existing.lastUpdated = metrics.timestamp;
        }
    }
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }
    aggregateStats() {
        // Update percentiles for all endpoints
        for (const [key, histogram] of this.latencyHistogram) {
            const stats = this.endpointStats.get(key);
            if (stats && histogram.length > 0) {
                stats.p50Latency = this.calculatePercentile(histogram, 50);
                stats.p95Latency = this.calculatePercentile(histogram, 95);
                stats.p99Latency = this.calculatePercentile(histogram, 99);
            }
        }
    }
    async flushMetrics() {
        if (this.metricsBuffer.length === 0)
            return;
        const metrics = [...this.metricsBuffer];
        this.metricsBuffer = [];
        try {
            await fetch('/api/monitoring/api-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    metrics,
                    summary: this.getSummary(),
                    timestamp: new Date().toISOString()
                })
            });
        }
        catch (error) {
            console.error('Failed to flush API metrics:', error);
            // Put metrics back if critical
            const criticalMetrics = metrics.filter(m => m.duration > 5000 || m.error || m.status >= 500);
            this.metricsBuffer.unshift(...criticalMetrics);
        }
    }
    getEndpointStats(endpoint, method) {
        if (endpoint && method) {
            const key = `${method} ${this.normalizeEndpoint(endpoint)}`;
            const stats = this.endpointStats.get(key);
            return stats ? [stats] : [];
        }
        return Array.from(this.endpointStats.values());
    }
    getSummary() {
        const stats = Array.from(this.endpointStats.values());
        if (stats.length === 0) {
            return {
                totalEndpoints: 0,
                totalCalls: 0,
                averageLatency: 0,
                errorRate: 0,
                cacheHitRate: 0,
                slowestEndpoints: [],
                errorProneEndpoints: [],
                busiestEndpoints: []
            };
        }
        const totalCalls = stats.reduce((sum, s) => sum + s.calls, 0);
        const totalLatency = stats.reduce((sum, s) => sum + (s.averageLatency * s.calls), 0);
        const totalErrors = stats.reduce((sum, s) => sum + (s.errorRate * s.calls / 100), 0);
        const totalCacheHits = stats.reduce((sum, s) => sum + (s.cacheHitRate * s.calls / 100), 0);
        return {
            totalEndpoints: stats.length,
            totalCalls,
            averageLatency: totalCalls > 0 ? totalLatency / totalCalls : 0,
            errorRate: totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0,
            cacheHitRate: totalCalls > 0 ? (totalCacheHits / totalCalls) * 100 : 0,
            slowestEndpoints: [...stats]
                .sort((a, b) => b.p95Latency - a.p95Latency)
                .slice(0, 5)
                .map(s => ({
                endpoint: s.endpoint,
                method: s.method,
                p95Latency: s.p95Latency
            })),
            errorProneEndpoints: [...stats]
                .filter(s => s.errorRate > 0)
                .sort((a, b) => b.errorRate - a.errorRate)
                .slice(0, 5)
                .map(s => ({
                endpoint: s.endpoint,
                method: s.method,
                errorRate: s.errorRate
            })),
            busiestEndpoints: [...stats]
                .sort((a, b) => b.calls - a.calls)
                .slice(0, 5)
                .map(s => ({
                endpoint: s.endpoint,
                method: s.method,
                calls: s.calls
            }))
        };
    }
    getHealthStatus() {
        const issues = [];
        const stats = Array.from(this.endpointStats.values());
        for (const stat of stats) {
            const thresholds = ENDPOINT_THRESHOLDS[stat.endpoint] || DEFAULT_THRESHOLDS;
            // Check latency
            if (stat.p95Latency > thresholds.slow) {
                issues.push({
                    endpoint: stat.endpoint,
                    issue: 'High latency',
                    severity: 'high',
                    metric: 'p95Latency',
                    value: stat.p95Latency,
                    threshold: thresholds.slow
                });
            }
            else if (stat.p95Latency > thresholds.acceptable) {
                issues.push({
                    endpoint: stat.endpoint,
                    issue: 'Elevated latency',
                    severity: 'medium',
                    metric: 'p95Latency',
                    value: stat.p95Latency,
                    threshold: thresholds.acceptable
                });
            }
            // Check error rate
            if (stat.errorRate > 10) {
                issues.push({
                    endpoint: stat.endpoint,
                    issue: 'High error rate',
                    severity: 'high',
                    metric: 'errorRate',
                    value: stat.errorRate,
                    threshold: 10
                });
            }
            else if (stat.errorRate > 5) {
                issues.push({
                    endpoint: stat.endpoint,
                    issue: 'Elevated error rate',
                    severity: 'medium',
                    metric: 'errorRate',
                    value: stat.errorRate,
                    threshold: 5
                });
            }
            // Check cache hit rate for cacheable endpoints
            if (stat.endpoint.includes('/api/static') && stat.cacheHitRate < 50) {
                issues.push({
                    endpoint: stat.endpoint,
                    issue: 'Low cache hit rate',
                    severity: 'low',
                    metric: 'cacheHitRate',
                    value: stat.cacheHitRate,
                    threshold: 50
                });
            }
        }
        const hasHighSeverity = issues.some(i => i.severity === 'high');
        const hasMediumSeverity = issues.some(i => i.severity === 'medium');
        return {
            healthy: issues.length === 0,
            degraded: hasMediumSeverity || hasHighSeverity,
            issues
        };
    }
    getMetricsByTimeRange(startTime, endTime) {
        return this.metricsBuffer.filter(m => {
            const metricTime = new Date(m.timestamp);
            return metricTime >= startTime && metricTime <= endTime;
        });
    }
    clearStats() {
        this.endpointStats.clear();
        this.latencyHistogram.clear();
        this.metricsBuffer = [];
    }
    destroy() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        if (this.aggregationInterval) {
            clearInterval(this.aggregationInterval);
        }
        this.flushMetrics();
    }
}
// Global instance
exports.apiLatencyMonitor = new APILatencyMonitor();
// Fetch wrapper with automatic monitoring
async function monitoredFetch(input, init) {
    const url = typeof input === 'string' ? input :
        input instanceof URL ? input.toString() :
            input.url;
    const method = init?.method || 'GET';
    return exports.apiLatencyMonitor.trackAPICall(url, method, () => fetch(input, init));
}
// React hook for API monitoring
// Usage: import React from 'react' in your component
function useAPIMonitoring() {
    // Example implementation - would use React hooks in actual component
    // const [stats, setStats] = React.useState<EndpointStats[]>([]);
    // const [health, setHealth] = React.useState<APIHealthStatus>({ 
    //   healthy: true, 
    //   degraded: false, 
    //   issues: [] 
    // });
    const getStats = () => {
        return {
            stats: exports.apiLatencyMonitor.getEndpointStats(),
            health: exports.apiLatencyMonitor.getHealthStatus()
        };
    };
    const monitoredCall = async (endpoint, options) => {
        const response = await monitoredFetch(endpoint, options);
        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }
        return response.json();
    };
    // Return functions instead of state for non-React usage
    return {
        getStats,
        getHealth: () => exports.apiLatencyMonitor.getHealthStatus(),
        getSummary: () => exports.apiLatencyMonitor.getSummary(),
        monitoredCall
    };
}
//# sourceMappingURL=api-latency-monitor.js.map