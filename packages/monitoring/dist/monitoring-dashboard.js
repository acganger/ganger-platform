"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringDashboard = exports.MonitoringDashboard = void 0;
exports.handleMonitoringDashboardRequest = handleMonitoringDashboardRequest;
exports.default = createMonitoringDashboardRoute;
const performance_monitor_1 = require("./performance-monitor");
const integration_health_1 = require("./integration-health");
const hipaa_compliant_error_tracking_1 = require("./hipaa-compliant-error-tracking");
const api_latency_monitor_1 = require("./api-latency-monitor");
const database_performance_monitor_1 = require("./database-performance-monitor");
const uptime_monitor_1 = require("./uptime-monitor");
const custom_metrics_1 = require("./custom-metrics");
const web_vitals_1 = require("./web-vitals");
class MonitoringDashboard {
    constructor() {
        this.refreshInterval = null;
        this.cachedData = null;
        this.cacheExpiry = 30000; // 30 seconds
        this.lastRefresh = 0;
        // Start periodic refresh
        this.refreshInterval = setInterval(() => {
            this.refreshCache();
        }, this.cacheExpiry);
    }
    async refreshCache() {
        try {
            this.cachedData = await this.collectAllMetrics();
            this.lastRefresh = Date.now();
        }
        catch (error) {
            console.error('Failed to refresh monitoring cache:', error);
        }
    }
    async getDashboardData(forceRefresh = false) {
        // Check cache
        if (!forceRefresh &&
            this.cachedData &&
            Date.now() - this.lastRefresh < this.cacheExpiry) {
            return this.cachedData;
        }
        // Collect fresh data
        const data = await this.collectAllMetrics();
        this.cachedData = data;
        this.lastRefresh = Date.now();
        return data;
    }
    async collectAllMetrics() {
        // Collect all metrics in parallel
        const [performanceMetrics, performanceTrends, uptimeSummary, uptimeStats, uptimeIncidents, apiSummary, apiEndpoints, apiHealth, databaseHealth, tableStats, slowQueries, errorMetrics, integrationHealth, customMetricsSnapshot] = await Promise.allSettled([
            performance_monitor_1.performanceMonitor.getCurrentMetrics(),
            performance_monitor_1.performanceMonitor.getPerformanceTrends(),
            uptime_monitor_1.uptimeMonitor.getSummary(),
            uptime_monitor_1.uptimeMonitor.getCheckStats(),
            uptime_monitor_1.uptimeMonitor.getIncidents(false),
            api_latency_monitor_1.apiLatencyMonitor.getSummary(),
            api_latency_monitor_1.apiLatencyMonitor.getEndpointStats(),
            api_latency_monitor_1.apiLatencyMonitor.getHealthStatus(),
            database_performance_monitor_1.databasePerformanceMonitor.getDatabaseHealth(),
            database_performance_monitor_1.databasePerformanceMonitor.getTableStats(),
            database_performance_monitor_1.databasePerformanceMonitor.getSlowQueries(10),
            hipaa_compliant_error_tracking_1.hipaaErrorTracker.getErrorMetrics(),
            integration_health_1.integrationHealthMonitor.getAllHealth(),
            custom_metrics_1.customMetrics.getSnapshot()
        ]);
        // Calculate overall health
        const overview = this.calculateOverview({
            performanceMetrics: this.getSettledValue(performanceMetrics),
            uptimeSummary: this.getSettledValue(uptimeSummary),
            apiHealth: this.getSettledValue(apiHealth),
            databaseHealth: this.getSettledValue(databaseHealth),
            errorMetrics: this.getSettledValue(errorMetrics),
            integrationHealth: this.getSettledValue(integrationHealth)
        });
        // Get Web Vitals if available (client-side only)
        const webVitals = typeof window !== 'undefined' && web_vitals_1.webVitalsTracker ?
            web_vitals_1.webVitalsTracker.getSummary() : null;
        // Separate custom metrics
        const customMetricsData = this.getSettledValue(customMetricsSnapshot) || [];
        const businessMetrics = customMetricsData.filter(m => ['appointments_scheduled', 'appointments_cancelled', 'patient_wait_time',
            'inventory_stock_level', 'prescription_processing_time'].includes(m.metric));
        const technicalMetrics = customMetricsData.filter(m => !businessMetrics.some(b => b.metric === m.metric));
        return {
            timestamp: new Date().toISOString(),
            overview,
            performance: {
                current: this.getSettledValue(performanceMetrics),
                trends: this.getSettledValue(performanceTrends) || [],
                webVitals
            },
            uptime: {
                summary: this.getSettledValue(uptimeSummary),
                checks: this.getSettledValue(uptimeStats) || [],
                incidents: this.getSettledValue(uptimeIncidents) || []
            },
            api: {
                summary: this.getSettledValue(apiSummary),
                endpoints: this.getSettledValue(apiEndpoints) || [],
                health: this.getSettledValue(apiHealth)
            },
            database: {
                health: this.getSettledValue(databaseHealth),
                tableStats: this.getSettledValue(tableStats) || [],
                slowQueries: this.getSettledValue(slowQueries) || []
            },
            errors: {
                metrics: this.getSettledValue(errorMetrics),
                recentErrors: [] // Would fetch from error tracking
            },
            integrations: {
                health: this.getSettledValue(integrationHealth) || [],
                status: this.calculateIntegrationStatus(this.getSettledValue(integrationHealth) || [])
            },
            customMetrics: {
                business: businessMetrics,
                technical: technicalMetrics
            }
        };
    }
    getSettledValue(result) {
        return result.status === 'fulfilled' ? result.value : null;
    }
    calculateOverview(data) {
        let healthScore = 100;
        let status = 'healthy';
        let activeAlerts = 0;
        let activeIncidents = 0;
        // Performance impact
        if (data.performanceMetrics) {
            activeAlerts += data.performanceMetrics.alerts?.length || 0;
            if (data.performanceMetrics.alerts?.some((a) => a.severity === 'critical')) {
                healthScore -= 30;
                status = 'critical';
            }
            else if (data.performanceMetrics.alerts?.some((a) => a.severity === 'high')) {
                healthScore -= 20;
                // Only degrade if not already critical
                status = status === 'critical' ? 'critical' : 'degraded';
            }
        }
        // Uptime impact
        if (data.uptimeSummary) {
            activeIncidents = data.uptimeSummary.activeIncidents || 0;
            if (data.uptimeSummary.overallUptime < 95) {
                healthScore -= 25;
                status = 'critical';
            }
            else if (data.uptimeSummary.overallUptime < 99) {
                healthScore -= 15;
                // Only degrade if not already critical
                status = status === 'critical' ? 'critical' : 'degraded';
            }
        }
        // API health impact
        if (data.apiHealth && !data.apiHealth.healthy) {
            healthScore -= data.apiHealth.degraded ? 15 : 10;
            if (data.apiHealth.degraded && status === 'healthy') {
                status = 'degraded';
            }
        }
        // Database health impact
        if (data.databaseHealth) {
            const poorTables = data.databaseHealth.tableHealth?.filter((t) => t.health === 'poor').length || 0;
            if (poorTables > 0) {
                healthScore -= poorTables * 10;
                status = 'critical';
            }
        }
        // Error rate impact
        if (data.errorMetrics) {
            if (data.errorMetrics.bySeverity?.critical > 0) {
                healthScore -= 20;
                status = 'critical';
            }
            if (data.errorMetrics.bySeverity?.high > 5) {
                healthScore -= 10;
                // Only degrade if not already critical
                status = status === 'critical' ? 'critical' : 'degraded';
            }
        }
        // Integration health impact
        if (data.integrationHealth) {
            const downIntegrations = data.integrationHealth.filter((i) => i.status === 'down').length;
            if (downIntegrations > 0) {
                healthScore -= downIntegrations * 15;
                status = 'critical';
            }
        }
        return {
            status,
            healthScore: Math.max(0, healthScore),
            activeAlerts,
            activeIncidents
        };
    }
    calculateIntegrationStatus(integrations) {
        const total = integrations.length;
        const healthy = integrations.filter(i => i.status === 'healthy').length;
        const degraded = integrations.filter(i => i.status === 'degraded').length;
        const down = integrations.filter(i => i.status === 'down').length;
        return {
            total,
            healthy,
            degraded,
            down,
            healthPercentage: total > 0 ? (healthy / total) * 100 : 100
        };
    }
    async getMetricHistory(metricType, metricName, hours = 24) {
        switch (metricType) {
            case 'performance':
                return performance_monitor_1.performanceMonitor.getMetricsHistory(hours);
            case 'api':
                const endTime = new Date();
                const startTime = new Date(endTime.getTime() - hours * 3600000);
                return api_latency_monitor_1.apiLatencyMonitor.getMetricsByTimeRange(startTime, endTime);
            case 'database':
                // Database metrics don't have a time range method yet
                return [];
            case 'custom':
                return custom_metrics_1.customMetrics.query({
                    metric: metricName,
                    startTime: new Date(Date.now() - hours * 3600000)
                });
            default:
                return [];
        }
    }
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}
exports.MonitoringDashboard = MonitoringDashboard;
// Global instance
exports.monitoringDashboard = new MonitoringDashboard();
// Express/Next.js API endpoint handler
async function handleMonitoringDashboardRequest(req, res) {
    try {
        const { refresh = false, metricType, metricName, hours = 24 } = req.query || {};
        // Handle metric history requests
        if (metricType && metricName) {
            const history = await exports.monitoringDashboard.getMetricHistory(metricType, metricName, parseInt(hours));
            res.status(200).json({
                success: true,
                data: history,
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Get dashboard data
        const data = await exports.monitoringDashboard.getDashboardData(refresh === 'true');
        res.status(200).json({
            success: true,
            data,
            cached: !refresh && Date.now() - exports.monitoringDashboard['lastRefresh'] < 30000
        });
    }
    catch (error) {
        console.error('Monitoring dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch monitoring data',
            timestamp: new Date().toISOString()
        });
    }
}
// Next.js API route export
function createMonitoringDashboardRoute() {
    return async (req, res) => {
        // Add CORS headers for dashboard access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        return handleMonitoringDashboardRequest(req, res);
    };
}
//# sourceMappingURL=monitoring-dashboard.js.map