// Health monitoring exports
export { HealthAlertingService, healthAlertingService } from './health-alerting';
export { IntegrationHealthMonitor, integrationHealthMonitor } from './integration-health';
// Performance monitoring exports
export { PerformanceMonitor, performanceMonitor } from './performance-monitor';
// Sentry error tracking exports
export { initSentry, setSentryUser, captureError, captureMessage, trackEvent, startTransaction, Sentry } from './sentry';
// Performance tracking exports
export { PerformanceTracker, performanceTracker, usePerformanceTracking, trackWebVitals } from './performance-tracking';
// Alert configuration exports
export { alertManager, DEFAULT_ALERTS } from './alerts-config';
// Error tracking exports
export { errorTracking } from './services/error-tracking';
// Import instances for convenience functions
import { integrationHealthMonitor } from './integration-health';
import { performanceMonitor } from './performance-monitor';
import { alertManager } from './alerts-config';
// Convenience function to start all monitoring services
export async function startMonitoring() {
    // Start periodic cleanup tasks
    integrationHealthMonitor.startPeriodicCleanup();
    performanceMonitor.startPeriodicCleanup();
    // Start alert monitoring
    alertManager.startMonitoring(5); // Check every 5 minutes
    console.log('🔍 Ganger Platform monitoring services started');
    console.log('🚨 Alert monitoring active');
}
// Convenience function to get complete system health
export async function getSystemHealth() {
    const [integrations, performance] = await Promise.all([
        integrationHealthMonitor.getAllHealth(),
        performanceMonitor.getCurrentMetrics()
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
