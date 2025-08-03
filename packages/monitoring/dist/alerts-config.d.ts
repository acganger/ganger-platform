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
export declare const DEFAULT_ALERTS: AlertConfig[];
declare class AlertManager {
    private lastAlertTime;
    private alertConfigs;
    /**
     * Check if an alert should be triggered
     */
    private shouldAlert;
    /**
     * Send alert through configured channels
     */
    private sendAlert;
    /**
     * Evaluate a metric value against thresholds
     */
    private evaluateThresholds;
    /**
     * Check all alerts against current metrics
     */
    checkAlerts(): Promise<void>;
    /**
     * Update alert configuration
     */
    updateConfig(name: string, updates: Partial<AlertConfig>): void;
    /**
     * Add new alert configuration
     */
    addConfig(config: AlertConfig): void;
    /**
     * Start periodic alert checking
     */
    startMonitoring(intervalMinutes?: number): void;
}
export declare const alertManager: AlertManager;
export {};
//# sourceMappingURL=alerts-config.d.ts.map