import { performanceMonitor } from './performance-monitor';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  unit?: string;
  labels?: string[];
  buckets?: number[]; // For histograms
  percentiles?: number[]; // For summaries
  aggregationWindow?: number; // ms
}

export interface MetricValue {
  metric: string;
  value: number;
  timestamp: string;
  labels?: Record<string, string>;
}

export interface MetricSnapshot {
  metric: string;
  type: MetricType;
  value: number | MetricDistribution;
  labels?: Record<string, string>;
  timestamp: string;
}

export interface MetricDistribution {
  count: number;
  sum: number;
  min: number;
  max: number;
  mean: number;
  percentiles?: Record<string, number>;
  buckets?: Record<string, number>;
}

export interface MetricQuery {
  metric: string;
  labels?: Record<string, string>;
  startTime?: Date;
  endTime?: Date;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
  interval?: number; // ms
}

export interface MetricAlert {
  id: string;
  metric: string;
  condition: 'above' | 'below' | 'equals' | 'not_equals';
  threshold: number;
  duration: number; // How long condition must be true
  labels?: Record<string, string>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  enabled: boolean;
}

export interface AlertStatus {
  alertId: string;
  triggered: boolean;
  currentValue: number;
  triggeredAt?: string;
  resolvedAt?: string;
}

class CustomMetricsTracker {
  private metrics: Map<string, MetricDefinition> = new Map();
  private values: Map<string, MetricValue[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private alerts: Map<string, MetricAlert> = new Map();
  private alertStatuses: Map<string, AlertStatus> = new Map();
  private readonly maxValuesPerMetric = 10000;
  private flushInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startIntervals();
    this.registerDefaultMetrics();
  }

  private startIntervals() {
    // Flush metrics every 5 minutes
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 300000);

    // Check alerts every 30 seconds
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 30000);
  }

  private registerDefaultMetrics() {
    // Business metrics
    this.register({
      name: 'appointments_scheduled',
      type: 'counter',
      description: 'Total appointments scheduled',
      labels: ['type', 'provider']
    });

    this.register({
      name: 'appointments_cancelled',
      type: 'counter',
      description: 'Total appointments cancelled',
      labels: ['reason', 'provider']
    });

    this.register({
      name: 'patient_wait_time',
      type: 'histogram',
      description: 'Patient wait time in minutes',
      unit: 'minutes',
      buckets: [5, 10, 15, 20, 30, 45, 60],
      labels: ['location', 'provider']
    });

    this.register({
      name: 'inventory_stock_level',
      type: 'gauge',
      description: 'Current inventory stock level',
      labels: ['item_id', 'category']
    });

    this.register({
      name: 'prescription_processing_time',
      type: 'histogram',
      description: 'Time to process prescriptions',
      unit: 'seconds',
      buckets: [30, 60, 120, 300, 600],
      labels: ['type', 'pharmacy']
    });

    this.register({
      name: 'active_users',
      type: 'gauge',
      description: 'Currently active users',
      labels: ['role', 'department']
    });

    this.register({
      name: 'feature_usage',
      type: 'counter',
      description: 'Feature usage tracking',
      labels: ['feature', 'app', 'user_role']
    });

    this.register({
      name: 'form_completion_time',
      type: 'histogram',
      description: 'Time to complete forms',
      unit: 'seconds',
      buckets: [30, 60, 120, 300, 600, 1200],
      labels: ['form_type', 'app']
    });

    this.register({
      name: 'api_business_errors',
      type: 'counter',
      description: 'Business logic errors',
      labels: ['error_type', 'endpoint', 'app']
    });

    this.register({
      name: 'cache_size',
      type: 'gauge',
      description: 'Current cache size in MB',
      unit: 'MB',
      labels: ['cache_type']
    });
  }

  public register(definition: MetricDefinition): void {
    if (this.metrics.has(definition.name)) {
      throw new Error(`Metric ${definition.name} already registered`);
    }

    this.metrics.set(definition.name, definition);

    // Initialize storage based on type
    switch (definition.type) {
      case 'counter':
        this.counters.set(definition.name, 0);
        break;
      case 'gauge':
        this.gauges.set(definition.name, 0);
        break;
      case 'histogram':
      case 'summary':
        this.histograms.set(definition.name, []);
        break;
    }
  }

  public increment(
    metricName: string, 
    value = 1, 
    labels?: Record<string, string>
  ): void {
    const metric = this.metrics.get(metricName);
    if (!metric || metric.type !== 'counter') {
      console.error(`Metric ${metricName} is not a counter`);
      return;
    }

    const key = this.getMetricKey(metricName, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.recordValue({
      metric: metricName,
      value: current + value,
      timestamp: new Date().toISOString(),
      labels
    });
  }

  public set(
    metricName: string, 
    value: number, 
    labels?: Record<string, string>
  ): void {
    const metric = this.metrics.get(metricName);
    if (!metric || metric.type !== 'gauge') {
      console.error(`Metric ${metricName} is not a gauge`);
      return;
    }

    const key = this.getMetricKey(metricName, labels);
    this.gauges.set(key, value);

    this.recordValue({
      metric: metricName,
      value,
      timestamp: new Date().toISOString(),
      labels
    });
  }

  public observe(
    metricName: string, 
    value: number, 
    labels?: Record<string, string>
  ): void {
    const metric = this.metrics.get(metricName);
    if (!metric || !['histogram', 'summary'].includes(metric.type)) {
      console.error(`Metric ${metricName} is not a histogram or summary`);
      return;
    }

    const key = this.getMetricKey(metricName, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);

    // Maintain reasonable size
    if (values.length > this.maxValuesPerMetric) {
      values.shift();
    }

    this.histograms.set(key, values);

    this.recordValue({
      metric: metricName,
      value,
      timestamp: new Date().toISOString(),
      labels
    });
  }

  public time<T>(
    metricName: string,
    fn: () => T | Promise<T>,
    labels?: Record<string, string>
  ): T | Promise<T> {
    const start = performance.now();
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.observe(metricName, duration, labels);
      });
    } else {
      const duration = performance.now() - start;
      this.observe(metricName, duration, labels);
      return result;
    }
  }

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${sortedLabels}}`;
  }

  private recordValue(value: MetricValue): void {
    const key = this.getMetricKey(value.metric, value.labels);
    
    if (!this.values.has(key)) {
      this.values.set(key, []);
    }

    const values = this.values.get(key)!;
    values.push(value);

    // Maintain size limit
    if (values.length > this.maxValuesPerMetric) {
      values.shift();
    }
  }

  public query(query: MetricQuery): MetricValue[] {
    const results: MetricValue[] = [];

    // Find matching metrics
    for (const [key, values] of this.values) {
      if (!key.startsWith(query.metric)) continue;

      // Filter by labels if specified
      if (query.labels) {
        const matches = Object.entries(query.labels).every(([k, v]) => {
          return values.some(val => val.labels?.[k] === v);
        });
        if (!matches) continue;
      }

      // Filter by time range
      let filteredValues = values;
      if (query.startTime || query.endTime) {
        filteredValues = values.filter(v => {
          const time = new Date(v.timestamp);
          if (query.startTime && time < query.startTime) return false;
          if (query.endTime && time > query.endTime) return false;
          return true;
        });
      }

      results.push(...filteredValues);
    }

    return results;
  }

  public getSnapshot(metricName?: string): MetricSnapshot[] {
    const snapshots: MetricSnapshot[] = [];

    const metricsToSnapshot = metricName ? 
      [this.metrics.get(metricName)].filter(Boolean) : 
      Array.from(this.metrics.values());

    for (const metric of metricsToSnapshot) {
      if (!metric) continue;
      switch (metric.type) {
        case 'counter':
          for (const [key, value] of this.counters) {
            if (key.startsWith(metric.name)) {
              snapshots.push({
                metric: metric.name,
                type: metric.type,
                value,
                labels: this.parseLabelsFromKey(key),
                timestamp: new Date().toISOString()
              });
            }
          }
          break;

        case 'gauge':
          for (const [key, value] of this.gauges) {
            if (key.startsWith(metric.name)) {
              snapshots.push({
                metric: metric.name,
                type: metric.type,
                value,
                labels: this.parseLabelsFromKey(key),
                timestamp: new Date().toISOString()
              });
            }
          }
          break;

        case 'histogram':
        case 'summary':
          for (const [key, values] of this.histograms) {
            if (key.startsWith(metric.name)) {
              const distribution = this.calculateDistribution(
                values, 
                metric
              );
              snapshots.push({
                metric: metric.name,
                type: metric.type,
                value: distribution,
                labels: this.parseLabelsFromKey(key),
                timestamp: new Date().toISOString()
              });
            }
          }
          break;
      }
    }

    return snapshots;
  }

  private parseLabelsFromKey(key: string): Record<string, string> | undefined {
    const match = key.match(/\{(.+)\}$/);
    if (!match) return undefined;

    const labels: Record<string, string> = {};
    const labelPairs = match[1]?.split(',') || [];
    
    for (const pair of labelPairs) {
      const [k, v] = pair.split('=');
      if (k && v) {
        labels[k] = v.replace(/"/g, '');
      }
    }

    return labels;
  }

  private calculateDistribution(
    values: number[], 
    metric: MetricDefinition
  ): MetricDistribution {
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        mean: 0
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const distribution: MetricDistribution = {
      count: values.length,
      sum,
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      mean
    };

    // Calculate percentiles for summaries
    if (metric.type === 'summary' && metric.percentiles) {
      distribution.percentiles = {};
      for (const p of metric.percentiles) {
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        distribution.percentiles[`p${p}`] = sorted[Math.max(0, index)] || 0;
      }
    }

    // Calculate bucket counts for histograms
    if (metric.type === 'histogram' && metric.buckets) {
      distribution.buckets = {};
      for (const bucket of metric.buckets) {
        const count = values.filter(v => v <= bucket).length;
        distribution.buckets[`le_${bucket}`] = count;
      }
      distribution.buckets['le_inf'] = values.length;
    }

    return distribution;
  }

  public createAlert(alert: MetricAlert): void {
    this.alerts.set(alert.id, alert);
    this.alertStatuses.set(alert.id, {
      alertId: alert.id,
      triggered: false,
      currentValue: 0
    });
  }

  public deleteAlert(alertId: string): void {
    this.alerts.delete(alertId);
    this.alertStatuses.delete(alertId);
  }

  private checkAlerts(): void {
    for (const alert of this.alerts.values()) {
      if (!alert.enabled) continue;

      const snapshot = this.getSnapshot(alert.metric);
      const relevantSnapshots = snapshot.filter(s => {
        if (!alert.labels) return true;
        return Object.entries(alert.labels).every(([k, v]) => 
          s.labels?.[k] === v
        );
      });

      for (const snap of relevantSnapshots) {
        const value = typeof snap.value === 'number' ? 
          snap.value : 
          (snap.value as MetricDistribution).mean;

        const status = this.alertStatuses.get(alert.id)!;
        status.currentValue = value;

        const conditionMet = this.evaluateCondition(
          value, 
          alert.condition, 
          alert.threshold
        );

        if (conditionMet && !status.triggered) {
          status.triggered = true;
          status.triggeredAt = new Date().toISOString();
          this.sendAlert(alert, value);
        } else if (!conditionMet && status.triggered) {
          status.triggered = false;
          status.resolvedAt = new Date().toISOString();
        }
      }
    }
  }

  private evaluateCondition(
    value: number, 
    condition: MetricAlert['condition'], 
    threshold: number
  ): boolean {
    switch (condition) {
      case 'above':
        return value > threshold;
      case 'below':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.001;
      case 'not_equals':
        return Math.abs(value - threshold) >= 0.001;
    }
  }

  private sendAlert(alert: MetricAlert, value: number): void {
    console.warn(`METRIC ALERT: ${alert.message}`, {
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      severity: alert.severity
    });

    // Track alert in performance monitor
    performanceMonitor.trackApiRequest(
      `metric-alert-${alert.metric}`,
      0,
      false
    );
  }

  private async flushMetrics(): Promise<void> {
    const snapshots = this.getSnapshot();
    
    try {
      await fetch('/api/monitoring/custom-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: snapshots,
          timestamp: new Date().toISOString()
        })
      });

      // Clear old values
      const oneHourAgo = new Date(Date.now() - 3600000);
      for (const values of this.values.values()) {
        const filtered = values.filter(v => 
          new Date(v.timestamp) > oneHourAgo
        );
        values.length = 0;
        values.push(...filtered);
      }
    } catch (error) {
      console.error('Failed to flush custom metrics:', error);
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }
    this.flushMetrics();
  }
}

// Global instance
export const customMetrics = new CustomMetricsTracker();

// React hook for custom metrics
// Usage: import React from 'react' in your component
export function useCustomMetrics() {
  const increment = (
    metric: string, 
    value?: number, 
    labels?: Record<string, string>
  ) => {
    customMetrics.increment(metric, value, labels);
  };

  const set = (
    metric: string, 
    value: number, 
    labels?: Record<string, string>
  ) => {
    customMetrics.set(metric, value, labels);
  };

  const observe = (
    metric: string, 
    value: number, 
    labels?: Record<string, string>
  ) => {
    customMetrics.observe(metric, value, labels);
  };

  const time = <T>(
    metric: string,
    fn: () => T | Promise<T>,
    labels?: Record<string, string>
  ) => {
    return customMetrics.time(metric, fn, labels);
  };

  return {
    increment,
    set,
    observe,
    time,
    register: customMetrics.register.bind(customMetrics),
    query: customMetrics.query.bind(customMetrics),
    getSnapshot: customMetrics.getSnapshot.bind(customMetrics)
  };
}

// Common metric helpers
export const BusinessMetrics = {
  trackAppointment: (type: 'scheduled' | 'cancelled', provider: string, reason?: string) => {
    if (type === 'scheduled') {
      customMetrics.increment('appointments_scheduled', 1, { type, provider });
    } else {
      customMetrics.increment('appointments_cancelled', 1, { 
        reason: reason || 'unknown', 
        provider 
      });
    }
  },

  trackWaitTime: (minutes: number, location: string, provider: string) => {
    customMetrics.observe('patient_wait_time', minutes, { location, provider });
  },

  trackInventory: (itemId: string, category: string, level: number) => {
    customMetrics.set('inventory_stock_level', level, { 
      item_id: itemId, 
      category 
    });
  },

  trackFeatureUsage: (feature: string, app: string, userRole: string) => {
    customMetrics.increment('feature_usage', 1, { feature, app, user_role: userRole });
  },

  trackFormCompletion: async (formType: string, app: string, completeFn: () => Promise<void>) => {
    await customMetrics.time('form_completion_time', completeFn, { form_type: formType, app });
  }
};