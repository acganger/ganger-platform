// lib/services/alert-engine.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';
import { HealthCheckResult, Integration } from './health-check-service';

interface AlertRule {
  id: string;
  integration_id: string;
  rule_name: string;
  rule_description: string | null;
  alert_type: string;
  condition_metric: string;
  condition_operator: string;
  condition_threshold: number;
  condition_duration_minutes: number;
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  auto_resolve: boolean;
  cooldown_minutes: number;
  notification_channels: string[];
  notification_recipients: string[];
  escalation_enabled: boolean;
  escalation_after_minutes: number;
  escalation_recipients: string[];
  is_active: boolean;
  last_triggered: string | null;
  trigger_count: number;
  business_hours_only: boolean;
  business_hours_start: string;
  business_hours_end: string;
  business_days: number[];
}

// interface AlertIncident {
//   id: string;
//   alert_rule_id: string;
//   integration_id: string;
//   triggered_at: string;
//   resolved_at: string | null;
//   alert_message: string;
//   severity: string;
//   trigger_value: number;
//   threshold_value: number;
//   status: 'open' | 'acknowledged' | 'resolved' | 'suppressed';
//   acknowledged_by: string | null;
//   acknowledged_at: string | null;
//   resolved_by: string | null;
//   resolution_note: string | null;
//   escalation_level: number;
//   notifications_sent: any;
// }

export class AlertEngine {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async evaluateAlerts(integration: Integration, healthCheckResult: HealthCheckResult): Promise<void> {
    try {
      // Get active alert rules for this integration
      const { data: alertRules, error } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('integration_id', integration.id)
        .eq('is_active', true);

      if (error) {
        return;
      }

      if (!alertRules || alertRules.length === 0) {
        return;
      }

      // Evaluate each rule
      for (const rule of alertRules) {
        await this.evaluateRule(rule as AlertRule, integration, healthCheckResult);
      }

    } catch (error) {
    }
  }

  private async evaluateRule(
    rule: AlertRule, 
    integration: Integration, 
    healthCheckResult: HealthCheckResult
  ): Promise<void> {
    try {
      // Get current metric value
      const metricValue = await this.getMetricValue(rule.condition_metric, integration, healthCheckResult);
      
      if (metricValue === null) {
        return;
      }

      // Check if condition is met
      const conditionMet = this.evaluateCondition(
        metricValue,
        rule.condition_operator,
        rule.condition_threshold
      );

      if (conditionMet) {
        await this.handleTriggeredRule(rule, integration, metricValue);
      } else {
        await this.handleResolvedRule(rule, integration);
      }

    } catch (error) {
    }
  }

  private async getMetricValue(
    metric: string, 
    integration: Integration, 
    healthCheckResult?: HealthCheckResult
  ): Promise<number | null> {
    try {
      switch (metric) {
        case 'uptime_percentage':
          const { data: recentMetrics } = await this.supabase
            .from('integration_metrics')
            .select('uptime_percentage')
            .eq('integration_id', integration.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          return recentMetrics?.uptime_percentage || null;

        case 'response_time':
          return healthCheckResult?.responseTime || null;

        case 'consecutive_failures':
          const { data: integrationData } = await this.supabase
            .from('integrations')
            .select('consecutive_failures')
            .eq('id', integration.id)
            .single();
          return integrationData?.consecutive_failures || 0;

        case 'error_rate':
          const { data: errorMetrics } = await this.supabase
            .from('integration_metrics')
            .select('error_rate')
            .eq('integration_id', integration.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          return errorMetrics?.error_rate || null;

        case 'availability_score':
          return healthCheckResult?.isSuccessful ? 1.0 : 0.0;

        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: 
        return false;
    }
  }

  private async handleTriggeredRule(
    rule: AlertRule, 
    integration: Integration, 
    triggerValue: number
  ): Promise<void> {
    try {
      // Check if we're in cooldown period
      if (rule.last_triggered) {
        const lastTriggered = new Date(rule.last_triggered);
        const cooldownEnd = new Date(lastTriggered.getTime() + rule.cooldown_minutes * 60000);
        if (new Date() < cooldownEnd) {
          return; // Still in cooldown
        }
      }

      // Check business hours if required
      if (rule.business_hours_only && !this.isBusinessHours(rule)) {
        return;
      }

      // Check if there's already an open incident for this rule
      const { data: existingIncident } = await this.supabase
        .from('alert_incidents')
        .select('*')
        .eq('alert_rule_id', rule.id)
        .in('status', ['open', 'acknowledged'])
        .single();

      if (existingIncident) {
        // Update existing incident
        await this.supabase
          .from('alert_incidents')
          .update({
            trigger_value: triggerValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingIncident.id);
      } else {
        // Create new incident
        const alertMessage = this.buildAlertMessage(rule, integration, triggerValue);
        
        const { data: incident, error } = await this.supabase
          .from('alert_incidents')
          .insert({
            alert_rule_id: rule.id,
            integration_id: integration.id,
            alert_message: alertMessage,
            severity: rule.severity,
            trigger_value: triggerValue,
            threshold_value: rule.condition_threshold,
            status: 'open'
          })
          .select()
          .single();

        if (error) {
          return;
        }

        // Send notifications
        await this.sendNotifications(rule, integration, incident);

        // Broadcast alert via real-time
        await this.broadcastAlert({
          type: 'new_alert',
          data: {
            id: incident.id,
            integration_id: integration.id,
            integration_name: integration.name,
            message: alertMessage,
            severity: rule.severity,
            triggered_at: incident.triggered_at
          }
        });
      }

      // Update rule last triggered
      await this.supabase
        .from('alert_rules')
        .update({
          last_triggered: new Date().toISOString(),
          trigger_count: rule.trigger_count + 1
        })
        .eq('id', rule.id);

    } catch (error) {
    }
  }

  private async handleResolvedRule(rule: AlertRule, integration: Integration): Promise<void> {
    if (!rule.auto_resolve) return;

    try {
      // Find open incidents for this rule
      const { data: openIncidents, error } = await this.supabase
        .from('alert_incidents')
        .select('*')
        .eq('alert_rule_id', rule.id)
        .in('status', ['open', 'acknowledged']);

      if (error) {
        return;
      }

      for (const incident of openIncidents || []) {
        // Calculate duration
        const triggeredAt = new Date(incident.triggered_at);
        const now = new Date();
        const durationMinutes = Math.floor((now.getTime() - triggeredAt.getTime()) / 60000);

        // Resolve the incident
        await this.supabase
          .from('alert_incidents')
          .update({
            status: 'resolved',
            resolved_at: now.toISOString(),
            resolution_note: 'Auto-resolved: condition no longer met',
            duration_minutes: durationMinutes
          })
          .eq('id', incident.id);

        // Send resolution notification
        await this.sendResolutionNotification(rule, integration, incident);

        // Broadcast resolution
        await this.broadcastAlert({
          type: 'alert_resolved',
          data: {
            alertId: incident.id,
            integration_id: integration.id,
            integration_name: integration.name,
            resolved_at: now.toISOString()
          }
        });
      }

    } catch (error) {
    }
  }

  private buildAlertMessage(rule: AlertRule, integration: Integration, triggerValue: number): string {
    const thresholdText = `${rule.condition_metric} ${rule.condition_operator} ${rule.condition_threshold}`;
    return `${integration.name}: ${rule.rule_name} - ${thresholdText} (current: ${triggerValue})`;
  }

  private async sendNotifications(
    rule: AlertRule, 
    integration: Integration, 
    incident: any
  ): Promise<void> {
    const notificationData = {
      integration_name: integration.name,
      alert_message: incident.alert_message,
      severity: rule.severity,
      incident_id: incident.id,
      trigger_value: incident.trigger_value,
      threshold_value: incident.threshold_value,
      triggered_at: incident.triggered_at
    };

    const notificationsSent: any = {};

    for (const channel of rule.notification_channels) {
      try {
        switch (channel) {
          case 'email':
            const emailSuccess = await this.sendEmailNotification(rule, notificationData);
            notificationsSent.email = { sent: emailSuccess, timestamp: new Date().toISOString() };
            break;

          case 'slack':
            const slackSuccess = await this.sendSlackNotification(rule, notificationData);
            notificationsSent.slack = { sent: slackSuccess, timestamp: new Date().toISOString() };
            break;

          case 'sms':
            if (['urgent', 'critical'].includes(rule.severity)) {
              const smsSuccess = await this.sendSMSNotification(rule, notificationData);
              notificationsSent.sms = { sent: smsSuccess, timestamp: new Date().toISOString() };
            }
            break;

          case 'webhook':
            const webhookSuccess = await this.sendWebhookNotification(rule, notificationData);
            notificationsSent.webhook = { sent: webhookSuccess, timestamp: new Date().toISOString() };
            break;

          default:
        }
      } catch (error) {
        notificationsSent[channel] = { sent: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() };
      }
    }

    // Update incident with notification status
    await this.supabase
      .from('alert_incidents')
      .update({ notifications_sent: notificationsSent })
      .eq('id', incident.id);
  }

  private async sendEmailNotification(_rule: AlertRule, _data: any): Promise<boolean> {
    return true; // Mock success
  }

  private async sendSlackNotification(_rule: AlertRule, _data: any): Promise<boolean> {
    return true; // Mock success
  }

  private async sendSMSNotification(_rule: AlertRule, _data: any): Promise<boolean> {
    return true; // Mock success
  }

  private async sendWebhookNotification(_rule: AlertRule, _data: any): Promise<boolean> {
    return true; // Mock success
  }

  private async sendResolutionNotification(
    rule: AlertRule, 
    integration: Integration, 
    incident: any
  ): Promise<void> {
    const resolutionData = {
      integration_name: integration.name,
      alert_message: `RESOLVED: ${incident.alert_message}`,
      severity: 'info',
      incident_id: incident.id,
      resolved_at: new Date().toISOString()
    };

    // Send resolution notifications through same channels
    for (const channel of rule.notification_channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(rule, resolutionData);
            break;
          case 'slack':
            await this.sendSlackNotification(rule, resolutionData);
            break;
          // Skip SMS for resolutions unless it was urgent/critical
        }
      } catch (error) {
      }
    }
  }

  private async broadcastAlert(alertData: any): Promise<void> {
    try {
      const channel = this.supabase.channel('integration-alerts');
      await channel.send({
        type: 'broadcast',
        event: alertData.type,
        payload: alertData.data
      });
    } catch (error) {
    }
  }

  private isBusinessHours(rule: AlertRule): boolean {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const startTime = this.parseTime(rule.business_hours_start);
    const endTime = this.parseTime(rule.business_hours_end);

    return rule.business_days.includes(currentDay) &&
           currentTime >= startTime &&
           currentTime <= endTime;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours || 0) * 100 + (minutes || 0);
  }

  // Public methods for external use

  async createAlertRule(ruleData: Partial<AlertRule>): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('alert_rules')
        .insert(ruleData)
        .select('id')
        .single();

      if (error) {
        return null;
      }

      return data.id;
    } catch (error) {
      return null;
    }
  }

  async acknowledgeIncident(incidentId: string, userId: string, note?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('alert_incidents')
        .update({
          status: 'acknowledged',
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
          resolution_note: note || null
        })
        .eq('id', incidentId)
        .eq('status', 'open');

      return !error;
    } catch (error) {
      return false;
    }
  }

  async resolveIncident(incidentId: string, userId: string, note: string): Promise<boolean> {
    try {
      // Get incident details for duration calculation
      const { data: incident } = await this.supabase
        .from('alert_incidents')
        .select('triggered_at')
        .eq('id', incidentId)
        .single();

      if (!incident) return false;

      const durationMinutes = Math.floor(
        (new Date().getTime() - new Date(incident.triggered_at).getTime()) / 60000
      );

      const { error } = await this.supabase
        .from('alert_incidents')
        .update({
          status: 'resolved',
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
          resolution_note: note,
          duration_minutes: durationMinutes
        })
        .eq('id', incidentId)
        .in('status', ['open', 'acknowledged']);

      return !error;
    } catch (error) {
      return false;
    }
  }
}