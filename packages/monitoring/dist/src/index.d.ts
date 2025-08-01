export { HealthAlertingService, healthAlertingService, type AlertChannel, type AlertRule } from './health-alerting';
export { IntegrationHealthMonitor, integrationHealthMonitor, type IntegrationHealthStatus } from './integration-health';
export { PerformanceMonitor, performanceMonitor, type PerformanceMetrics, type PerformanceTrend } from './performance-monitor';
export { initSentry, setSentryUser, captureError, captureMessage, trackEvent, startTransaction, Sentry } from './sentry';
export { PerformanceTracker, performanceTracker, usePerformanceTracking, trackWebVitals, type PerformanceMark, type PerformanceMeasure } from './performance-tracking';
export { alertManager, DEFAULT_ALERTS, type AlertConfig, type AlertThreshold } from './alerts-config';
export { errorTracking, type ErrorEvent, type PerformanceMetric } from './services/error-tracking';
import { type IntegrationHealthStatus } from './integration-health';
import { type PerformanceMetrics } from './performance-monitor';
export declare function startMonitoring(): Promise<void>;
export declare function getSystemHealth(): Promise<{
    integrations: IntegrationHealthStatus[];
    performance: PerformanceMetrics;
    overall_status: 'healthy' | 'degraded' | 'critical';
}>;
