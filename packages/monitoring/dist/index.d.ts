export { HealthAlertingService, healthAlertingService, type AlertChannel, type AlertRule } from './health-alerting';
export { IntegrationHealthMonitor, integrationHealthMonitor, type IntegrationHealthStatus } from './integration-health';
export { PerformanceMonitor, performanceMonitor, type PerformanceMetrics, type PerformanceTrend } from './performance-monitor';
export * from './sentry';
export * from './performance-tracking';
export { alertManager, DEFAULT_ALERTS, type AlertConfig, type AlertThreshold } from './alerts-config';
export { errorTracking, type ErrorEvent, type PerformanceMetric } from './services/error-tracking';
import { type IntegrationHealthStatus } from './integration-health';
import { type PerformanceMetrics } from './performance-monitor';
export { webVitalsTracker, useWebVitals, measureUserTiming, type WebVitalsMetric } from './web-vitals';
export { hipaaErrorTracker, useErrorTracking } from './hipaa-compliant-error-tracking';
export { apiLatencyMonitor, monitoredFetch, useAPIMonitoring, type APIMetrics, type EndpointStats, type APIHealthStatus } from './api-latency-monitor';
export { databasePerformanceMonitor, monitoredQuery, useDatabaseMonitoring, type QueryMetrics, type TableStats, type QueryPattern, type DatabaseHealth } from './database-performance-monitor';
export { uptimeMonitor, useUptimeMonitoring, type UptimeCheck, type UptimeCheckResult, type UptimeStats, type UptimeIncident, type UptimeSummary } from './uptime-monitor';
export { customMetrics, useCustomMetrics, BusinessMetrics, type MetricDefinition, type MetricValue, type MetricSnapshot, type MetricAlert } from './custom-metrics';
export { monitoringDashboard, handleMonitoringDashboardRequest, default as createMonitoringDashboardRoute, type MonitoringDashboardData } from './monitoring-dashboard';
export { createHealthCheckEndpoint, createNextHealthRoute, healthCheckConfigs, type AppHealthCheck, type AppHealthResponse, type HealthCheckConfig } from './app-health-endpoints';
export { userFlowMonitor, useFlowMonitoring, createFlowTrackingMiddleware, CRITICAL_USER_FLOWS, type UserFlowConfig, type FlowExecution, type FlowMetrics } from './user-flow-monitoring';
export declare function startMonitoring(): Promise<void>;
export declare function getSystemHealth(): Promise<{
    integrations: IntegrationHealthStatus[];
    performance: PerformanceMetrics;
    overall_status: 'healthy' | 'degraded' | 'critical';
}>;
//# sourceMappingURL=index.d.ts.map