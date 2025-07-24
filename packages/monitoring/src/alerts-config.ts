import { captureMessage } from './sentry';
import { performanceMonitor } from './performance-monitor';
import { integrationHealthMonitor } from './integration-health';

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertConfig {
  name: string;
  description: string;
  enabled: boolean;
  thresholds: AlertThreshold[];
  cooldownMinutes: number;
  channels: ('sentry' | 'email' | 'slack')[];
}

export const DEFAULT_ALERTS: AlertConfig[] = [
  {
    name: 'api_response_time',
    description: 'API response time exceeds threshold',
    enabled: true,
    thresholds: [
      { metric: 'p95_response_time', operator: 'gt', value: 3000, severity: 'medium' },
      { metric: 'p95_response_time', operator: 'gt', value: 5000, severity: 'high' },
      { metric: 'p99_response_time', operator: 'gt', value: 10000, severity: 'critical' }
    ],
    cooldownMinutes: 15,
    channels: ['sentry']
  },
  {
    name: 'error_rate',
    description: 'Error rate exceeds threshold',
    enabled: true,
    thresholds: [
      { metric: 'error_rate', operator: 'gt', value: 0.05, severity: 'medium' },
      { metric: 'error_rate', operator: 'gt', value: 0.10, severity: 'high' },
      { metric: 'error_rate', operator: 'gt', value: 0.25, severity: 'critical' }
    ],
    cooldownMinutes: 10,
    channels: ['sentry', 'email']
  },
  {
    name: 'integration_health',
    description: 'Integration service is unhealthy',
    enabled: true,
    thresholds: [
      { metric: 'unhealthy_count', operator: 'gte', value: 1, severity: 'high' },
      { metric: 'down_count', operator: 'gte', value: 1, severity: 'critical' }
    ],
    cooldownMinutes: 30,
    channels: ['sentry', 'email']
  },
  {
    name: 'database_connections',
    description: 'Database connection pool usage',
    enabled: true,
    thresholds: [
      { metric: 'connection_usage', operator: 'gt', value: 0.80, severity: 'medium' },
      { metric: 'connection_usage', operator: 'gt', value: 0.90, severity: 'high' },
      { metric: 'connection_usage', operator: 'eq', value: 1.0, severity: 'critical' }
    ],
    cooldownMinutes: 5,
    channels: ['sentry']
  },
  {
    name: 'memory_usage',
    description: 'Server memory usage',
    enabled: true,
    thresholds: [
      { metric: 'memory_percent', operator: 'gt', value: 80, severity: 'medium' },
      { metric: 'memory_percent', operator: 'gt', value: 90, severity: 'high' },
      { metric: 'memory_percent', operator: 'gt', value: 95, severity: 'critical' }
    ],
    cooldownMinutes: 20,
    channels: ['sentry']
  },
  {
    name: 'authentication_failures',
    description: 'High rate of authentication failures',
    enabled: true,
    thresholds: [
      { metric: 'auth_failure_rate', operator: 'gt', value: 0.10, severity: 'medium' },
      { metric: 'auth_failure_rate', operator: 'gt', value: 0.25, severity: 'high' },
      { metric: 'auth_failure_rate', operator: 'gt', value: 0.50, severity: 'critical' }
    ],
    cooldownMinutes: 30,
    channels: ['sentry', 'email']
  },
  {
    name: 'payment_failures',
    description: 'Payment processing failures',
    enabled: true,
    thresholds: [
      { metric: 'payment_failure_rate', operator: 'gt', value: 0.02, severity: 'high' },
      { metric: 'payment_failure_rate', operator: 'gt', value: 0.05, severity: 'critical' }
    ],
    cooldownMinutes: 60,
    channels: ['sentry', 'email', 'slack']
  }
];

class AlertManager {
  private lastAlertTime: Map<string, Date> = new Map();
  private alertConfigs: AlertConfig[] = DEFAULT_ALERTS;

  /**
   * Check if an alert should be triggered
   */
  private shouldAlert(config: AlertConfig): boolean {
    const lastAlert = this.lastAlertTime.get(config.name);
    if (!lastAlert) return true;

    const cooldownMs = config.cooldownMinutes * 60 * 1000;
    return Date.now() - lastAlert.getTime() > cooldownMs;
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(
    config: AlertConfig,
    threshold: AlertThreshold,
    currentValue: number
  ): Promise<void> {
    const message = `Alert: ${config.description}
Metric: ${threshold.metric}
Current Value: ${currentValue}
Threshold: ${threshold.operator} ${threshold.value}
Severity: ${threshold.severity}`;

    // Send to Sentry
    if (config.channels.includes('sentry')) {
      captureMessage(message, threshold.severity as any, {
        alert: config.name,
        metric: threshold.metric,
        value: currentValue,
        threshold: threshold.value,
        operator: threshold.operator
      });
    }

    // Email and Slack would be implemented here with actual services
    if (config.channels.includes('email')) {
      console.log(`[Email Alert] ${message}`);
      // TODO: Implement email sending via @ganger/integrations
    }

    if (config.channels.includes('slack')) {
      console.log(`[Slack Alert] ${message}`);
      // TODO: Implement Slack webhook via @ganger/integrations
    }

    this.lastAlertTime.set(config.name, new Date());
  }

  /**
   * Evaluate a metric value against thresholds
   */
  private evaluateThresholds(
    value: number,
    thresholds: AlertThreshold[]
  ): AlertThreshold | null {
    // Sort by severity (critical first)
    const sorted = [...thresholds].sort((a, b) => {
      const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    for (const threshold of sorted) {
      let triggered = false;
      
      switch (threshold.operator) {
        case 'gt':
          triggered = value > threshold.value;
          break;
        case 'lt':
          triggered = value < threshold.value;
          break;
        case 'eq':
          triggered = value === threshold.value;
          break;
        case 'gte':
          triggered = value >= threshold.value;
          break;
        case 'lte':
          triggered = value <= threshold.value;
          break;
      }

      if (triggered) {
        return threshold;
      }
    }

    return null;
  }

  /**
   * Check all alerts against current metrics
   */
  async checkAlerts(): Promise<void> {
    // Get current metrics
    const [performanceMetrics, integrationHealth] = await Promise.all([
      performanceMonitor.getCurrentMetrics(),
      integrationHealthMonitor.getAllHealth()
    ]);

    // Prepare metric values
    const metrics: Record<string, number> = {
      p95_response_time: performanceMetrics.api.average_response_time * 1.5, // Approximation for p95
      p99_response_time: performanceMetrics.api.average_response_time * 2, // Approximation for p99
      error_rate: performanceMetrics.api.error_rate,
      unhealthy_count: integrationHealth.filter(i => i.status === 'degraded').length,
      down_count: integrationHealth.filter(i => i.status === 'down').length,
      // These would come from actual monitoring
      connection_usage: 0.65, // Placeholder
      memory_percent: 72, // Placeholder
      auth_failure_rate: 0.02, // Placeholder
      payment_failure_rate: 0.001 // Placeholder
    };

    // Check each alert
    for (const config of this.alertConfigs) {
      if (!config.enabled || !this.shouldAlert(config)) {
        continue;
      }

      // Get metrics for this alert
      const relevantMetrics = config.thresholds.map(t => ({
        threshold: t,
        value: metrics[t.metric] || 0
      }));

      // Check each metric
      for (const { threshold, value } of relevantMetrics) {
        const triggered = this.evaluateThresholds(value, [threshold]);
        if (triggered) {
          await this.sendAlert(config, triggered, value);
          break; // Only send one alert per config
        }
      }
    }
  }

  /**
   * Update alert configuration
   */
  updateConfig(name: string, updates: Partial<AlertConfig>): void {
    const index = this.alertConfigs.findIndex(c => c.name === name);
    if (index !== -1) {
      this.alertConfigs[index] = { ...this.alertConfigs[index], ...updates };
    }
  }

  /**
   * Add new alert configuration
   */
  addConfig(config: AlertConfig): void {
    this.alertConfigs.push(config);
  }

  /**
   * Start periodic alert checking
   */
  startMonitoring(intervalMinutes: number = 5): void {
    // Initial check
    this.checkAlerts().catch(console.error);

    // Periodic checks
    setInterval(() => {
      this.checkAlerts().catch(console.error);
    }, intervalMinutes * 60 * 1000);
  }
}

export const alertManager = new AlertManager();