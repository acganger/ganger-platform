"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databasePerformanceMonitor = void 0;
exports.monitoredQuery = monitoredQuery;
exports.useDatabaseMonitoring = useDatabaseMonitoring;
const performance_monitor_1 = require("./performance-monitor");
const hipaa_compliant_error_tracking_1 = require("./hipaa-compliant-error-tracking");
const DEFAULT_QUERY_THRESHOLDS = {
    fast: 50,
    acceptable: 200,
    slow: 1000
};
const TABLE_THRESHOLDS = {
    'auth.users': { fast: 20, acceptable: 50, slow: 200 },
    'inventory_items': { fast: 100, acceptable: 300, slow: 1000 },
    'patient_handouts': { fast: 50, acceptable: 150, slow: 500 }
};
class DatabasePerformanceMonitor {
    constructor() {
        this.queryMetrics = [];
        this.tableStats = new Map();
        this.queryPatterns = new Map();
        this.connectionMetrics = {
            active: 0,
            idle: 0,
            waiting: 0,
            maxSize: 20
        };
        this.maxMetricsSize = 10000;
        this.patternCacheSize = 500;
        this.flushInterval = null;
        this.startFlushInterval();
        this.setupSupabaseInterceptor();
    }
    startFlushInterval() {
        // Flush metrics every 5 minutes
        this.flushInterval = setInterval(() => {
            this.flushMetrics();
            this.analyzePatterns();
        }, 300000);
    }
    setupSupabaseInterceptor() {
        // This would intercept Supabase queries if we had access to the client
        // In practice, this would be done at the Supabase client initialization
        console.log('Database performance monitoring initialized');
    }
    async trackQuery(operation, table, queryFn, queryDetails) {
        const startTime = performance.now();
        const startMark = `db-${operation}-${table}-${Date.now()}`;
        performance.mark(startMark);
        let result;
        let error = null;
        let rowCount = 0;
        try {
            result = await queryFn();
            // Try to extract row count
            if (Array.isArray(result)) {
                rowCount = result.length;
            }
            else if (result && typeof result === 'object' && 'count' in result) {
                rowCount = result.count;
            }
            return result;
        }
        catch (err) {
            error = err;
            throw err;
        }
        finally {
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Generate query representation for pattern matching
            const queryRepresentation = this.generateQueryRepresentation(operation, table, queryDetails?.query || '');
            const metrics = {
                query: queryRepresentation,
                operation,
                table,
                duration,
                rowCount,
                error: error?.message,
                timestamp: new Date().toISOString(),
                queryHash: this.hashQuery(queryRepresentation),
                ...queryDetails
            };
            // Record metrics
            this.recordQueryMetrics(metrics);
            // Performance mark
            performance.measure(`db-${operation}-${table}`, startMark);
            // Track in performance monitor
            performance_monitor_1.performanceMonitor.trackApiRequest(`db-${table}`, duration, !error);
            // Track slow queries
            if (duration > this.getThreshold(table).slow) {
                hipaa_compliant_error_tracking_1.hipaaErrorTracker.trackError({
                    message: `Slow database query: ${operation} on ${table}`,
                    duration,
                    query: queryRepresentation
                }, {
                    component: 'database-monitor',
                    action: 'slow-query',
                    tags: {
                        table,
                        operation,
                        duration: duration.toString()
                    }
                });
            }
        }
    }
    generateQueryRepresentation(operation, table, query) {
        // Remove specific values to create patterns
        let pattern = query;
        // Remove UUIDs
        pattern = pattern.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '?');
        // Remove numbers
        pattern = pattern.replace(/\b\d+\b/g, '?');
        // Remove quoted strings
        pattern = pattern.replace(/'[^']*'/g, '?');
        pattern = pattern.replace(/"[^"]*"/g, '?');
        return `${operation.toUpperCase()} ${table} ${pattern}`.trim();
    }
    hashQuery(query) {
        let hash = 0;
        for (let i = 0; i < query.length; i++) {
            const char = query.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    getThreshold(table) {
        return TABLE_THRESHOLDS[table] || DEFAULT_QUERY_THRESHOLDS;
    }
    recordQueryMetrics(metrics) {
        // Add to metrics array
        this.queryMetrics.push(metrics);
        // Maintain size limit
        if (this.queryMetrics.length > this.maxMetricsSize) {
            this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsSize);
        }
        // Update table stats
        this.updateTableStats(metrics);
        // Update query patterns
        this.updateQueryPattern(metrics);
    }
    updateTableStats(metrics) {
        if (!metrics.table)
            return;
        const stats = this.tableStats.get(metrics.table) || {
            tableName: metrics.table,
            totalQueries: 0,
            averageQueryTime: 0,
            slowQueries: 0,
            errorRate: 0,
            operations: {
                select: 0,
                insert: 0,
                update: 0,
                delete: 0
            }
        };
        stats.totalQueries++;
        stats.averageQueryTime = (stats.averageQueryTime * (stats.totalQueries - 1) + metrics.duration) / stats.totalQueries;
        if (metrics.duration > this.getThreshold(metrics.table).slow) {
            stats.slowQueries++;
        }
        if (metrics.error) {
            stats.errorRate = ((stats.errorRate * (stats.totalQueries - 1)) + 100) / stats.totalQueries;
        }
        else {
            stats.errorRate = (stats.errorRate * (stats.totalQueries - 1)) / stats.totalQueries;
        }
        // Update operation counts
        if (metrics.operation in stats.operations) {
            stats.operations[metrics.operation]++;
        }
        this.tableStats.set(metrics.table, stats);
    }
    updateQueryPattern(metrics) {
        const pattern = this.queryPatterns.get(metrics.queryHash) || {
            pattern: metrics.query,
            count: 0,
            averageDuration: 0,
            p95Duration: 0,
            errorRate: 0,
            lastSeen: metrics.timestamp,
            examples: []
        };
        pattern.count++;
        pattern.averageDuration = (pattern.averageDuration * (pattern.count - 1) + metrics.duration) / pattern.count;
        pattern.lastSeen = metrics.timestamp;
        if (metrics.error) {
            pattern.errorRate = ((pattern.errorRate * (pattern.count - 1)) + 100) / pattern.count;
        }
        else {
            pattern.errorRate = (pattern.errorRate * (pattern.count - 1)) / pattern.count;
        }
        // Keep a few examples
        if (pattern.examples.length < 3 && !pattern.examples.includes(metrics.query)) {
            pattern.examples.push(metrics.query);
        }
        this.queryPatterns.set(metrics.queryHash, pattern);
        // Maintain pattern cache size
        if (this.queryPatterns.size > this.patternCacheSize) {
            // Remove least used patterns
            const sortedPatterns = Array.from(this.queryPatterns.entries())
                .sort((a, b) => a[1].count - b[1].count);
            for (let i = 0; i < 50; i++) {
                const pattern = sortedPatterns[i]?.[0];
                if (pattern) {
                    this.queryPatterns.delete(pattern);
                }
            }
        }
    }
    analyzePatterns() {
        // Calculate p95 for patterns
        const patternMetrics = new Map();
        for (const metric of this.queryMetrics) {
            const durations = patternMetrics.get(metric.queryHash) || [];
            durations.push(metric.duration);
            patternMetrics.set(metric.queryHash, durations);
        }
        for (const [hash, durations] of patternMetrics) {
            const pattern = this.queryPatterns.get(hash);
            if (pattern && durations.length > 0) {
                const sorted = [...durations].sort((a, b) => a - b);
                const p95Index = Math.ceil(0.95 * sorted.length) - 1;
                pattern.p95Duration = sorted[Math.max(0, p95Index)] || 0;
            }
        }
    }
    getTableStats() {
        return Array.from(this.tableStats.values());
    }
    getSlowQueries(limit = 10) {
        return [...this.queryMetrics]
            .filter(m => !m.error)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    getErrorQueries(limit = 10) {
        return this.queryMetrics
            .filter(m => m.error)
            .slice(-limit)
            .reverse();
    }
    getQueryPatterns(minCount = 10) {
        return Array.from(this.queryPatterns.values())
            .filter(p => p.count >= minCount)
            .sort((a, b) => b.count - a.count);
    }
    getDatabaseHealth() {
        const totalQueries = this.queryMetrics.length;
        const errorQueries = this.queryMetrics.filter(m => m.error).length;
        const slowQueries = this.queryMetrics.filter(m => m.table && m.duration > this.getThreshold(m.table).slow).length;
        const avgQueryTime = totalQueries > 0 ?
            this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries : 0;
        const tableHealth = Array.from(this.tableStats.values()).map(stats => {
            const issues = [];
            let health = 'good';
            if (stats.errorRate > 5) {
                issues.push(`High error rate: ${stats.errorRate.toFixed(1)}%`);
                health = 'poor';
            }
            if (stats.slowQueries / stats.totalQueries > 0.1) {
                issues.push(`Many slow queries: ${((stats.slowQueries / stats.totalQueries) * 100).toFixed(1)}%`);
                health = health === 'poor' ? 'poor' : 'degraded';
            }
            if (stats.averageQueryTime > this.getThreshold(stats.tableName).acceptable) {
                issues.push(`High average query time: ${stats.averageQueryTime.toFixed(0)}ms`);
                health = health === 'poor' ? 'poor' : 'degraded';
            }
            return {
                table: stats.tableName,
                health,
                issues
            };
        });
        const recommendations = [];
        // Add recommendations based on patterns
        const slowPatterns = this.getQueryPatterns()
            .filter(p => p.averageDuration > 500);
        if (slowPatterns.length > 0) {
            recommendations.push(`Consider optimizing these slow query patterns: ${slowPatterns.slice(0, 3).map(p => p.pattern).join(', ')}`);
        }
        // Check for missing indexes
        const tablesWithHighSeqScans = Array.from(this.tableStats.values())
            .filter(stats => {
            const selectRatio = stats.operations.select / stats.totalQueries;
            return selectRatio > 0.5 && stats.averageQueryTime > 200;
        });
        if (tablesWithHighSeqScans.length > 0) {
            recommendations.push(`Consider adding indexes to: ${tablesWithHighSeqScans.map(s => s.tableName).join(', ')}`);
        }
        // Connection pool recommendations
        if (this.connectionMetrics.waiting > 0) {
            recommendations.push('Connection pool is saturated. Consider increasing pool size.');
        }
        return {
            connectionPoolHealth: {
                ...this.connectionMetrics,
                utilizationPercent: (this.connectionMetrics.active / this.connectionMetrics.maxSize) * 100
            },
            queryPerformance: {
                averageQueryTime: avgQueryTime,
                slowQueryRate: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
                errorRate: totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0
            },
            tableHealth,
            recommendations
        };
    }
    updateConnectionMetrics(metrics) {
        this.connectionMetrics = {
            ...this.connectionMetrics,
            ...metrics
        };
    }
    async flushMetrics() {
        if (this.queryMetrics.length === 0)
            return;
        const summary = {
            tableStats: this.getTableStats(),
            slowQueries: this.getSlowQueries(20),
            errorQueries: this.getErrorQueries(20),
            queryPatterns: this.getQueryPatterns(5),
            health: this.getDatabaseHealth(),
            timestamp: new Date().toISOString()
        };
        try {
            await fetch('/api/monitoring/database-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(summary)
            });
            // Clear old metrics after successful flush
            const oneHourAgo = new Date(Date.now() - 3600000);
            this.queryMetrics = this.queryMetrics.filter(m => new Date(m.timestamp) > oneHourAgo);
        }
        catch (error) {
            console.error('Failed to flush database metrics:', error);
        }
    }
    destroy() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        this.flushMetrics();
    }
}
// Global instance
exports.databasePerformanceMonitor = new DatabasePerformanceMonitor();
// Supabase query wrapper
async function monitoredQuery(table, queryBuilder) {
    const operation = queryBuilder._method || 'select';
    return exports.databasePerformanceMonitor.trackQuery(operation, table, async () => {
        const { data, error, count } = await queryBuilder;
        if (error)
            throw error;
        // Include count if available
        if (count !== undefined) {
            return { data, count };
        }
        return data;
    });
}
// React hook for database monitoring
// Usage: import React from 'react' in your component
function useDatabaseMonitoring() {
    // Example implementation - would use React hooks in actual component
    const getMonitoringData = () => {
        return {
            health: exports.databasePerformanceMonitor.getDatabaseHealth(),
            tableStats: exports.databasePerformanceMonitor.getTableStats()
        };
    };
    const trackQuery = async (operation, table, queryFn) => {
        return exports.databasePerformanceMonitor.trackQuery(operation, table, queryFn);
    };
    return {
        getMonitoringData,
        getSlowQueries: () => exports.databasePerformanceMonitor.getSlowQueries(),
        trackQuery
    };
}
//# sourceMappingURL=database-performance-monitor.js.map