"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthAlertingService = exports.HealthAlertingService = void 0;
const integration_health_1 = require("./integration-health");
class HealthAlertingService {
    constructor() {
        this.alertChannels = [];
        this.alertRules = [];
        this.alertHistory = new Map();
        this.initializeAlertChannels();
        this.initializeAlertRules();
    }
    initializeAlertChannels() {
        this.alertChannels = [
            {
                name: 'slack-alerts',
                enabled: !!process.env.SLACK_WEBHOOK_URL,
                webhook_url: process.env.SLACK_WEBHOOK_URL,
                severity_threshold: 'medium'
            },
            {
                name: 'email-critical',
                enabled: !!process.env.ALERT_EMAIL,
                email: process.env.ALERT_EMAIL,
                severity_threshold: 'high'
            }
        ];
    }
    initializeAlertRules() {
        this.alertRules = [
            {
                id: 'database_down',
                name: 'Database Connection Failed',
                condition: (integrations) => integrations.some(i => i.service === 'database' && i.status === 'down'),
                message: 'Database connection has failed. Critical system impact.',
                severity: 'critical',
                cooldown_minutes: 5
            },
            {
                id: 'high_api_error_rate',
                name: 'High API Error Rate',
                condition: (integrations) => integrations.some(i => i.metrics?.error_rate && i.metrics.error_rate > 10),
                message: 'API error rate exceeds 10%. Investigation required.',
                severity: 'high',
                cooldown_minutes: 15
            },
            {
                id: 'external_service_degraded',
                name: 'External Service Degraded',
                condition: (integrations) => integrations.some(i => ['stripe', 'twilio', 'google'].includes(i.service) && i.status === 'degraded'),
                message: 'External service experiencing degraded performance.',
                severity: 'medium',
                cooldown_minutes: 30
            }
        ];
    }
    async checkAndSendAlerts() {
        try {
            const integrations = await integration_health_1.integrationHealthMonitor.getAllHealth();
            for (const rule of this.alertRules) {
                if (this.shouldTriggerAlert(rule, integrations)) {
                    await this.sendAlert(rule);
                    this.alertHistory.set(rule.id, new Date());
                }
            }
        }
        catch (error) {
            console.error('Alert checking failed:', error);
        }
    }
    shouldTriggerAlert(rule, integrations) {
        // Check cooldown period
        const lastTriggered = this.alertHistory.get(rule.id);
        if (lastTriggered) {
            const cooldownMs = rule.cooldown_minutes * 60 * 1000;
            if (Date.now() - lastTriggered.getTime() < cooldownMs) {
                return false;
            }
        }
        // Check if condition is met
        return rule.condition(integrations);
    }
    async sendAlert(rule) {
        const eligibleChannels = this.alertChannels.filter(channel => channel.enabled && this.severityMeetsThreshold(rule.severity, channel.severity_threshold));
        for (const channel of eligibleChannels) {
            try {
                if (channel.webhook_url) {
                    await this.sendSlackAlert(channel.webhook_url, rule);
                }
                if (channel.email) {
                    await this.sendEmailAlert(channel.email, rule);
                }
            }
            catch (error) {
                console.error(`Failed to send alert via ${channel.name}:`, error);
            }
        }
    }
    severityMeetsThreshold(alertSeverity, channelThreshold) {
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        return severityLevels[alertSeverity] >=
            severityLevels[channelThreshold];
    }
    async sendSlackAlert(webhookUrl, rule) {
        const payload = {
            text: `🚨 ${rule.name}`,
            attachments: [{
                    color: this.getSeverityColor(rule.severity),
                    fields: [{
                            title: 'Alert Details',
                            value: rule.message,
                            short: false
                        }, {
                            title: 'Severity',
                            value: rule.severity.toUpperCase(),
                            short: true
                        }, {
                            title: 'Time',
                            value: new Date().toISOString(),
                            short: true
                        }]
                }]
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async sendEmailAlert(email, rule) {
        // Email implementation would depend on chosen email service
        console.log(`Email alert would be sent to ${email}: ${rule.message}`);
    }
    getSeverityColor(severity) {
        const colors = {
            low: '#36a64f', // green
            medium: '#ff9500', // orange  
            high: '#ff0000', // red
            critical: '#8b0000' // dark red
        };
        return colors[severity] || '#808080';
    }
}
exports.HealthAlertingService = HealthAlertingService;
exports.healthAlertingService = new HealthAlertingService();
//# sourceMappingURL=health-alerting.js.map