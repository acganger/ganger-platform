// Health monitoring exports
export {
  HealthAlertingService,
  healthAlertingService,
  type AlertChannel,
  type AlertRule
} from './health-alerting';

export {
  IntegrationHealthMonitor,
  integrationHealthMonitor,
  type IntegrationHealthStatus
} from './integration-health';

// Performance monitoring exports
export {
  PerformanceMonitor,
  performanceMonitor,
  type PerformanceMetrics,
  type PerformanceTrend
} from './performance-monitor';

// Sentry error tracking exports
export {
  initSentry,
  setSentryUser,
  captureError,
  captureMessage,
  trackEvent,
  startTransaction,
  Sentry
} from './sentry';

// Performance tracking exports
export {
  PerformanceTracker,
  performanceTracker,
  usePerformanceTracking,
  trackWebVitals,
  type PerformanceMark,
  type PerformanceMeasure
} from './performance-tracking';

// Alert configuration exports
export {
  alertManager,
  DEFAULT_ALERTS,
  type AlertConfig,
  type AlertThreshold
} from './alerts-config';

// Import instances for convenience functions
import { integrationHealthMonitor, type IntegrationHealthStatus } from './integration-health';
import { performanceMonitor, type PerformanceMetrics } from './performance-monitor';
import { alertManager } from './alerts-config';

// Convenience function to start all monitoring services
export async function startMonitoring(): Promise<void> {
  // Start periodic cleanup tasks
  integrationHealthMonitor.startPeriodicCleanup();
  performanceMonitor.startPeriodicCleanup();
  
  // Start alert monitoring
  alertManager.startMonitoring(5); // Check every 5 minutes
  
  console.log('🔍 Ganger Platform monitoring services started');
  console.log('🚨 Alert monitoring active');
}

// Convenience function to get complete system health
export async function getSystemHealth(): Promise<{
  integrations: IntegrationHealthStatus[];
  performance: PerformanceMetrics;
  overall_status: 'healthy' | 'degraded' | 'critical';
}> {
  const [integrations, performance] = await Promise.all([
    integrationHealthMonitor.getAllHealth(),
    performanceMonitor.getCurrentMetrics()
  ]);

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
  
  // Check for any down services
  if (integrations.some((i: IntegrationHealthStatus) => i.status === 'down')) {
    overallStatus = 'critical';
  } else if (integrations.some((i: IntegrationHealthStatus) => i.status === 'degraded') || 
             performance.alerts.some((a: any) => a.severity === 'high' || a.severity === 'critical')) {
    overallStatus = 'degraded';
  }

  return {
    integrations,
    performance,
    overall_status: overallStatus
  };
}