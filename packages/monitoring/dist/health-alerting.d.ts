import { IntegrationHealthStatus } from './integration-health';
export interface AlertChannel {
    name: string;
    enabled: boolean;
    webhook_url?: string;
    email?: string;
    severity_threshold: 'low' | 'medium' | 'high' | 'critical';
}
export interface AlertRule {
    id: string;
    name: string;
    condition: (integrations: IntegrationHealthStatus[]) => boolean;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cooldown_minutes: number;
    last_triggered?: Date;
}
export declare class HealthAlertingService {
    private alertChannels;
    private alertRules;
    private alertHistory;
    constructor();
    private initializeAlertChannels;
    private initializeAlertRules;
    checkAndSendAlerts(): Promise<void>;
    private shouldTriggerAlert;
    private sendAlert;
    private severityMeetsThreshold;
    private sendSlackAlert;
    private sendEmailAlert;
    private getSeverityColor;
}
export declare const healthAlertingService: HealthAlertingService;
