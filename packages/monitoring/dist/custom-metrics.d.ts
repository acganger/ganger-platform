export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
export interface MetricDefinition {
    name: string;
    type: MetricType;
    description: string;
    unit?: string;
    labels?: string[];
    buckets?: number[];
    percentiles?: number[];
    aggregationWindow?: number;
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
    interval?: number;
}
export interface MetricAlert {
    id: string;
    metric: string;
    condition: 'above' | 'below' | 'equals' | 'not_equals';
    threshold: number;
    duration: number;
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
declare class CustomMetricsTracker {
    private metrics;
    private values;
    private counters;
    private gauges;
    private histograms;
    private alerts;
    private alertStatuses;
    private readonly maxValuesPerMetric;
    private flushInterval;
    private alertCheckInterval;
    constructor();
    private startIntervals;
    private registerDefaultMetrics;
    register(definition: MetricDefinition): void;
    increment(metricName: string, value?: number, labels?: Record<string, string>): void;
    set(metricName: string, value: number, labels?: Record<string, string>): void;
    observe(metricName: string, value: number, labels?: Record<string, string>): void;
    time<T>(metricName: string, fn: () => T | Promise<T>, labels?: Record<string, string>): T | Promise<T>;
    private getMetricKey;
    private recordValue;
    query(query: MetricQuery): MetricValue[];
    getSnapshot(metricName?: string): MetricSnapshot[];
    private parseLabelsFromKey;
    private calculateDistribution;
    createAlert(alert: MetricAlert): void;
    deleteAlert(alertId: string): void;
    private checkAlerts;
    private evaluateCondition;
    private sendAlert;
    private flushMetrics;
    destroy(): void;
}
export declare const customMetrics: CustomMetricsTracker;
export declare function useCustomMetrics(): {
    increment: (metric: string, value?: number, labels?: Record<string, string>) => void;
    set: (metric: string, value: number, labels?: Record<string, string>) => void;
    observe: (metric: string, value: number, labels?: Record<string, string>) => void;
    time: <T>(metric: string, fn: () => T | Promise<T>, labels?: Record<string, string>) => T | Promise<T>;
    register: (definition: MetricDefinition) => void;
    query: (query: MetricQuery) => MetricValue[];
    getSnapshot: (metricName?: string) => MetricSnapshot[];
};
export declare const BusinessMetrics: {
    trackAppointment: (type: "scheduled" | "cancelled", provider: string, reason?: string) => void;
    trackWaitTime: (minutes: number, location: string, provider: string) => void;
    trackInventory: (itemId: string, category: string, level: number) => void;
    trackFeatureUsage: (feature: string, app: string, userRole: string) => void;
    trackFormCompletion: (formType: string, app: string, completeFn: () => Promise<void>) => Promise<void>;
};
export {};
//# sourceMappingURL=custom-metrics.d.ts.map