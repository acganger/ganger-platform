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

// Re-export everything from submodules for easier imports
export * from './sentry';
export * from './performance-tracking';

// Alert configuration exports
export {
  alertManager,
  DEFAULT_ALERTS,
  type AlertConfig,
  type AlertThreshold
} from './alerts-config';

// Error tracking exports
export {
  errorTracking,
  type ErrorEvent,
  type PerformanceMetric
} from './services/error-tracking';

// Import instances for convenience functions
import { integrationHealthMonitor, type IntegrationHealthStatus } from './integration-health';
import { performanceMonitor, type PerformanceMetrics } from './performance-monitor';
import { alertManager } from './alerts-config';

// Web Vitals exports
export {
  webVitalsTracker,
  useWebVitals,
  measureUserTiming,
  type WebVitalsMetric
} from './web-vitals';

// HIPAA-compliant error tracking exports
export {
  hipaaErrorTracker,
  useErrorTracking
} from './hipaa-compliant-error-tracking';

// API latency monitoring exports
export {
  apiLatencyMonitor,
  monitoredFetch,
  useAPIMonitoring,
  type APIMetrics,
  type EndpointStats,
  type APIHealthStatus
} from './api-latency-monitor';

// Database performance monitoring exports
export {
  databasePerformanceMonitor,
  monitoredQuery,
  useDatabaseMonitoring,
  type QueryMetrics,
  type TableStats,
  type QueryPattern,
  type DatabaseHealth
} from './database-performance-monitor';

// Uptime monitoring exports
export {
  uptimeMonitor,
  useUptimeMonitoring,
  type UptimeCheck,
  type UptimeCheckResult,
  type UptimeStats,
  type UptimeIncident,
  type UptimeSummary
} from './uptime-monitor';

// Custom metrics exports
export {
  customMetrics,
  useCustomMetrics,
  BusinessMetrics,
  type MetricDefinition,
  type MetricValue,
  type MetricSnapshot,
  type MetricAlert
} from './custom-metrics';

// Monitoring dashboard exports
export {
  monitoringDashboard,
  handleMonitoringDashboardRequest,
  default as createMonitoringDashboardRoute,
  type MonitoringDashboardData
} from './monitoring-dashboard';

// App health check exports
export {
  createHealthCheckEndpoint,
  createNextHealthRoute,
  healthCheckConfigs,
  type AppHealthCheck,
  type AppHealthResponse,
  type HealthCheckConfig
} from './app-health-endpoints';

// User flow monitoring exports
export {
  userFlowMonitor,
  useFlowMonitoring,
  createFlowTrackingMiddleware,
  CRITICAL_USER_FLOWS,
  type UserFlowConfig,
  type FlowExecution,
  type FlowMetrics
} from './user-flow-monitoring';

// Convenience function to start all monitoring services
export async function startMonitoring(): Promise<void> {
  // Start periodic cleanup tasks
  integrationHealthMonitor.startPeriodicCleanup();
  performanceMonitor.startPeriodicCleanup();
  
  // Start alert monitoring
  alertManager.startMonitoring(5); // Check every 5 minutes
  
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