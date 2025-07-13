import { describe, it, expect } from '@jest/globals';

describe('@ganger/monitoring exports', () => {
  it('should export performanceMonitor', async () => {
    const { performanceMonitor } = await import('../index');
    expect(performanceMonitor).toBeDefined();
    expect(typeof performanceMonitor.getCurrentMetrics).toBe('function');
    expect(typeof performanceMonitor.collectSystemMetrics).toBe('function');
    expect(typeof performanceMonitor.getPerformanceTrends).toBe('function');
    expect(typeof performanceMonitor.generatePerformanceAlerts).toBe('function');
  });

  it('should export integrationHealthMonitor', async () => {
    const { integrationHealthMonitor } = await import('../index');
    expect(integrationHealthMonitor).toBeDefined();
    expect(typeof integrationHealthMonitor.checkService).toBe('function');
    expect(typeof integrationHealthMonitor.getHealthMetrics).toBe('function');
  });

  it('should export healthAlertingService', async () => {
    const { healthAlertingService } = await import('../index');
    expect(healthAlertingService).toBeDefined();
    expect(typeof healthAlertingService.checkAndAlert).toBe('function');
  });

  it('should successfully import from @ganger/db', async () => {
    // This test verifies that the import from @ganger/db works
    const module = await import('../performance-monitor');
    expect(module.performanceMonitor).toBeDefined();
  });
});