"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRITICAL_USER_FLOWS = exports.createFlowTrackingMiddleware = exports.useFlowMonitoring = exports.userFlowMonitor = exports.healthCheckConfigs = exports.createNextHealthRoute = exports.createHealthCheckEndpoint = exports.createMonitoringDashboardRoute = exports.handleMonitoringDashboardRequest = exports.monitoringDashboard = exports.BusinessMetrics = exports.useCustomMetrics = exports.customMetrics = exports.useUptimeMonitoring = exports.uptimeMonitor = exports.useDatabaseMonitoring = exports.monitoredQuery = exports.databasePerformanceMonitor = exports.useAPIMonitoring = exports.monitoredFetch = exports.apiLatencyMonitor = exports.useErrorTracking = exports.hipaaErrorTracker = exports.measureUserTiming = exports.useWebVitals = exports.webVitalsTracker = exports.errorTracking = exports.DEFAULT_ALERTS = exports.alertManager = exports.performanceMonitor = exports.PerformanceMonitor = exports.integrationHealthMonitor = exports.IntegrationHealthMonitor = exports.healthAlertingService = exports.HealthAlertingService = void 0;
exports.startMonitoring = startMonitoring;
exports.getSystemHealth = getSystemHealth;
// Health monitoring exports
var health_alerting_1 = require("./health-alerting");
Object.defineProperty(exports, "HealthAlertingService", { enumerable: true, get: function () { return health_alerting_1.HealthAlertingService; } });
Object.defineProperty(exports, "healthAlertingService", { enumerable: true, get: function () { return health_alerting_1.healthAlertingService; } });
var integration_health_1 = require("./integration-health");
Object.defineProperty(exports, "IntegrationHealthMonitor", { enumerable: true, get: function () { return integration_health_1.IntegrationHealthMonitor; } });
Object.defineProperty(exports, "integrationHealthMonitor", { enumerable: true, get: function () { return integration_health_1.integrationHealthMonitor; } });
// Performance monitoring exports
var performance_monitor_1 = require("./performance-monitor");
Object.defineProperty(exports, "PerformanceMonitor", { enumerable: true, get: function () { return performance_monitor_1.PerformanceMonitor; } });
Object.defineProperty(exports, "performanceMonitor", { enumerable: true, get: function () { return performance_monitor_1.performanceMonitor; } });
// Re-export everything from submodules for easier imports
__exportStar(require("./sentry"), exports);
__exportStar(require("./performance-tracking"), exports);
// Alert configuration exports
var alerts_config_1 = require("./alerts-config");
Object.defineProperty(exports, "alertManager", { enumerable: true, get: function () { return alerts_config_1.alertManager; } });
Object.defineProperty(exports, "DEFAULT_ALERTS", { enumerable: true, get: function () { return alerts_config_1.DEFAULT_ALERTS; } });
// Error tracking exports
var error_tracking_1 = require("./services/error-tracking");
Object.defineProperty(exports, "errorTracking", { enumerable: true, get: function () { return error_tracking_1.errorTracking; } });
// Import instances for convenience functions
const integration_health_2 = require("./integration-health");
const performance_monitor_2 = require("./performance-monitor");
const alerts_config_2 = require("./alerts-config");
// Web Vitals exports
var web_vitals_1 = require("./web-vitals");
Object.defineProperty(exports, "webVitalsTracker", { enumerable: true, get: function () { return web_vitals_1.webVitalsTracker; } });
Object.defineProperty(exports, "useWebVitals", { enumerable: true, get: function () { return web_vitals_1.useWebVitals; } });
Object.defineProperty(exports, "measureUserTiming", { enumerable: true, get: function () { return web_vitals_1.measureUserTiming; } });
// HIPAA-compliant error tracking exports
var hipaa_compliant_error_tracking_1 = require("./hipaa-compliant-error-tracking");
Object.defineProperty(exports, "hipaaErrorTracker", { enumerable: true, get: function () { return hipaa_compliant_error_tracking_1.hipaaErrorTracker; } });
Object.defineProperty(exports, "useErrorTracking", { enumerable: true, get: function () { return hipaa_compliant_error_tracking_1.useErrorTracking; } });
// API latency monitoring exports
var api_latency_monitor_1 = require("./api-latency-monitor");
Object.defineProperty(exports, "apiLatencyMonitor", { enumerable: true, get: function () { return api_latency_monitor_1.apiLatencyMonitor; } });
Object.defineProperty(exports, "monitoredFetch", { enumerable: true, get: function () { return api_latency_monitor_1.monitoredFetch; } });
Object.defineProperty(exports, "useAPIMonitoring", { enumerable: true, get: function () { return api_latency_monitor_1.useAPIMonitoring; } });
// Database performance monitoring exports
var database_performance_monitor_1 = require("./database-performance-monitor");
Object.defineProperty(exports, "databasePerformanceMonitor", { enumerable: true, get: function () { return database_performance_monitor_1.databasePerformanceMonitor; } });
Object.defineProperty(exports, "monitoredQuery", { enumerable: true, get: function () { return database_performance_monitor_1.monitoredQuery; } });
Object.defineProperty(exports, "useDatabaseMonitoring", { enumerable: true, get: function () { return database_performance_monitor_1.useDatabaseMonitoring; } });
// Uptime monitoring exports
var uptime_monitor_1 = require("./uptime-monitor");
Object.defineProperty(exports, "uptimeMonitor", { enumerable: true, get: function () { return uptime_monitor_1.uptimeMonitor; } });
Object.defineProperty(exports, "useUptimeMonitoring", { enumerable: true, get: function () { return uptime_monitor_1.useUptimeMonitoring; } });
// Custom metrics exports
var custom_metrics_1 = require("./custom-metrics");
Object.defineProperty(exports, "customMetrics", { enumerable: true, get: function () { return custom_metrics_1.customMetrics; } });
Object.defineProperty(exports, "useCustomMetrics", { enumerable: true, get: function () { return custom_metrics_1.useCustomMetrics; } });
Object.defineProperty(exports, "BusinessMetrics", { enumerable: true, get: function () { return custom_metrics_1.BusinessMetrics; } });
// Monitoring dashboard exports
var monitoring_dashboard_1 = require("./monitoring-dashboard");
Object.defineProperty(exports, "monitoringDashboard", { enumerable: true, get: function () { return monitoring_dashboard_1.monitoringDashboard; } });
Object.defineProperty(exports, "handleMonitoringDashboardRequest", { enumerable: true, get: function () { return monitoring_dashboard_1.handleMonitoringDashboardRequest; } });
Object.defineProperty(exports, "createMonitoringDashboardRoute", { enumerable: true, get: function () { return __importDefault(monitoring_dashboard_1).default; } });
// App health check exports
var app_health_endpoints_1 = require("./app-health-endpoints");
Object.defineProperty(exports, "createHealthCheckEndpoint", { enumerable: true, get: function () { return app_health_endpoints_1.createHealthCheckEndpoint; } });
Object.defineProperty(exports, "createNextHealthRoute", { enumerable: true, get: function () { return app_health_endpoints_1.createNextHealthRoute; } });
Object.defineProperty(exports, "healthCheckConfigs", { enumerable: true, get: function () { return app_health_endpoints_1.healthCheckConfigs; } });
// User flow monitoring exports
var user_flow_monitoring_1 = require("./user-flow-monitoring");
Object.defineProperty(exports, "userFlowMonitor", { enumerable: true, get: function () { return user_flow_monitoring_1.userFlowMonitor; } });
Object.defineProperty(exports, "useFlowMonitoring", { enumerable: true, get: function () { return user_flow_monitoring_1.useFlowMonitoring; } });
Object.defineProperty(exports, "createFlowTrackingMiddleware", { enumerable: true, get: function () { return user_flow_monitoring_1.createFlowTrackingMiddleware; } });
Object.defineProperty(exports, "CRITICAL_USER_FLOWS", { enumerable: true, get: function () { return user_flow_monitoring_1.CRITICAL_USER_FLOWS; } });
// Convenience function to start all monitoring services
async function startMonitoring() {
    // Start periodic cleanup tasks
    integration_health_2.integrationHealthMonitor.startPeriodicCleanup();
    performance_monitor_2.performanceMonitor.startPeriodicCleanup();
    // Start alert monitoring
    alerts_config_2.alertManager.startMonitoring(5); // Check every 5 minutes
    // Initialize uptime monitoring (already starts automatically)
    // Initialize dashboard refresh (already starts automatically)
    console.log('🔍 Ganger Platform monitoring services started');
    console.log('🚨 Alert monitoring active');
    console.log('📊 Web Vitals tracking enabled');
    console.log('🔒 HIPAA-compliant error tracking active');
    console.log('⚡ API latency monitoring enabled');
    console.log('🗄️ Database performance monitoring active');
    console.log('🟢 Uptime monitoring running');
    console.log('📈 Custom metrics tracking enabled');
}
// Convenience function to get complete system health
async function getSystemHealth() {
    const [integrations, performance] = await Promise.all([
        integration_health_2.integrationHealthMonitor.getAllHealth(),
        performance_monitor_2.performanceMonitor.getCurrentMetrics()
    ]);
    // Determine overall status
    let overallStatus = 'healthy';
    // Check for any down services
    if (integrations.some((i) => i.status === 'down')) {
        overallStatus = 'critical';
    }
    else if (integrations.some((i) => i.status === 'degraded') ||
        performance.alerts.some((a) => a.severity === 'high' || a.severity === 'critical')) {
        overallStatus = 'degraded';
    }
    return {
        integrations,
        performance,
        overall_status: overallStatus
    };
}
//# sourceMappingURL=index.js.map