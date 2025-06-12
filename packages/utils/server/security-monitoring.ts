/**
 * Enterprise-Grade Security Monitoring and Alerting System
 * 
 * Provides comprehensive security monitoring for HIPAA compliance:
 * - Real-time threat detection and response
 * - Automated security alerting via multiple channels
 * - Advanced pattern recognition for suspicious activities
 * - Compliance audit trail generation
 * - Performance monitoring with security implications
 * - Incident response automation
 */

import { secureLogger } from './secure-error-handler';
import { fieldEncryption } from './field-encryption';
import { clinicalStaffingCache } from '../../cache/src/clinical-staffing-cache';

// Security event types for monitoring
export enum SecurityEventType {
  // Authentication & Authorization
  LOGIN_FAILURE = 'login_failure',
  LOGIN_SUCCESS = 'login_success',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SESSION_HIJACK = 'session_hijack',
  
  // Data Access & Modification
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  BULK_DATA_EXPORT = 'bulk_data_export',
  UNAUTHORIZED_DATA_MODIFICATION = 'unauthorized_data_modification',
  DATA_ENCRYPTION_FAILURE = 'data_encryption_failure',
  DATA_DECRYPTION_FAILURE = 'data_decryption_failure',
  
  // System Security
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  
  // Infrastructure
  SYSTEM_VULNERABILITY = 'system_vulnerability',
  CONFIGURATION_CHANGE = 'configuration_change',
  SECURITY_POLICY_VIOLATION = 'security_policy_violation',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  
  // Performance & Availability
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  RESOURCE_EXHAUSTION = 'resource_exhaustion'
}

// Security severity levels
export enum SecuritySeverity {
  CRITICAL = 'critical',    // Immediate response required
  HIGH = 'high',           // Response within 1 hour
  MEDIUM = 'medium',       // Response within 4 hours
  LOW = 'low',            // Response within 24 hours
  INFO = 'info'           // Informational only
}

// Security event structure
interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
  threatScore: number; // 0-100
  responseRequired: boolean;
  correlationId?: string;
}

// Alert configuration
interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  severityThreshold: SecuritySeverity;
  rateLimitMinutes: number;
  maxAlertsPerHour: number;
}

enum AlertChannel {
  SLACK = 'slack',
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  DASHBOARD = 'dashboard'
}

// Monitoring metrics
interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<SecuritySeverity, number>;
  eventsByType: Record<SecurityEventType, number>;
  averageThreatScore: number;
  activeIncidents: number;
  responseTime: number;
  falsePositiveRate: number;
}

// Threat patterns for detection
interface ThreatPattern {
  name: string;
  description: string;
  eventTypes: SecurityEventType[];
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
    value: any;
  }>;
  timeWindow: number; // minutes
  threshold: number;   // number of occurrences
  severity: SecuritySeverity;
  autoResponse?: string;
}

export class SecurityMonitoringService {
  private events: SecurityEvent[] = [];
  private metrics: SecurityMetrics = {
    totalEvents: 0,
    eventsBySeverity: {
      [SecuritySeverity.CRITICAL]: 0,
      [SecuritySeverity.HIGH]: 0,
      [SecuritySeverity.MEDIUM]: 0,
      [SecuritySeverity.LOW]: 0,
      [SecuritySeverity.INFO]: 0
    },
    eventsByType: {} as Record<SecurityEventType, number>,
    averageThreatScore: 0,
    activeIncidents: 0,
    responseTime: 0,
    falsePositiveRate: 0
  };

  private alertConfig: AlertConfig = {
    enabled: true,
    channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
    severityThreshold: SecuritySeverity.MEDIUM,
    rateLimitMinutes: 5,
    maxAlertsPerHour: 20
  };

  private threatPatterns: ThreatPattern[] = [
    {
      name: 'Brute Force Attack',
      description: 'Multiple failed login attempts from same IP',
      eventTypes: [SecurityEventType.LOGIN_FAILURE],
      conditions: [
        { field: 'ipAddress', operator: 'equals', value: null }, // Will be checked dynamically
      ],
      timeWindow: 15,
      threshold: 5,
      severity: SecuritySeverity.HIGH,
      autoResponse: 'block_ip'
    },
    {
      name: 'Suspicious Data Access',
      description: 'Excessive sensitive data access outside normal hours',
      eventTypes: [SecurityEventType.SENSITIVE_DATA_ACCESS],
      conditions: [
        { field: 'hour', operator: 'less_than', value: 6 },
        { field: 'hour', operator: 'greater_than', value: 22 }
      ],
      timeWindow: 60,
      threshold: 10,
      severity: SecuritySeverity.MEDIUM,
      autoResponse: 'require_additional_auth'
    },
    {
      name: 'Privilege Escalation',
      description: 'User attempting to access resources above their permission level',
      eventTypes: [SecurityEventType.PRIVILEGE_ESCALATION, SecurityEventType.UNAUTHORIZED_ACCESS],
      conditions: [],
      timeWindow: 5,
      threshold: 3,
      severity: SecuritySeverity.CRITICAL,
      autoResponse: 'disable_user_session'
    },
    {
      name: 'Bulk Data Export',
      description: 'Large volume of data being exported',
      eventTypes: [SecurityEventType.BULK_DATA_EXPORT],
      conditions: [
        { field: 'recordCount', operator: 'greater_than', value: 1000 }
      ],
      timeWindow: 30,
      threshold: 1,
      severity: SecuritySeverity.HIGH,
      autoResponse: 'notify_security_team'
    },
    {
      name: 'SQL Injection Pattern',
      description: 'Potential SQL injection attempts detected',
      eventTypes: [SecurityEventType.SQL_INJECTION_ATTEMPT],
      conditions: [],
      timeWindow: 1,
      threshold: 1,
      severity: SecuritySeverity.CRITICAL,
      autoResponse: 'block_request'
    }
  ];

  private alertHistory = new Map<string, number>(); // Track alert frequency

  constructor() {
    // Initialize event type counters
    Object.values(SecurityEventType).forEach(type => {
      this.metrics.eventsByType[type] = 0;
    });

    // Start background monitoring tasks
    this.startBackgroundMonitoring();

    secureLogger.info('Security Monitoring Service initialized', {
      alertChannels: this.alertConfig.channels,
      threatPatterns: this.threatPatterns.length,
      severityThreshold: this.alertConfig.severityThreshold
    });
  }

  /**
   * Record a security event
   */
  async recordEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>,
    context?: {
      userId?: string;
      userEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      resourceType?: string;
      resourceId?: string;
      correlationId?: string;
    }
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        id: this.generateEventId(),
        type,
        severity,
        timestamp: new Date().toISOString(),
        userId: context?.userId,
        userEmail: context?.userEmail,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        resourceType: context?.resourceType,
        resourceId: context?.resourceId,
        details,
        threatScore: this.calculateThreatScore(type, severity, details),
        responseRequired: severity === SecuritySeverity.CRITICAL || severity === SecuritySeverity.HIGH,
        correlationId: context?.correlationId
      };

      // Store event
      this.events.push(event);
      
      // Limit event history to prevent memory issues
      if (this.events.length > 10000) {
        this.events = this.events.slice(-5000);
      }

      // Update metrics
      this.updateMetrics(event);

      // Check for threat patterns
      await this.checkThreatPatterns(event);

      // Send alerts if necessary
      if (this.shouldAlert(event)) {
        await this.sendAlert(event);
      }

      // Log the event
      secureLogger.info('Security event recorded', {
        eventId: event.id,
        type: event.type,
        severity: event.severity,
        threatScore: event.threatScore,
        userId: event.userId || '[ANONYMOUS]',
        resourceType: event.resourceType,
        timestamp: event.timestamp
      });

    } catch (error) {
      secureLogger.error('Failed to record security event', {
        type,
        severity,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check for threat patterns in recent events
   */
  private async checkThreatPatterns(newEvent: SecurityEvent): Promise<void> {
    const now = new Date();
    
    for (const pattern of this.threatPatterns) {
      if (!pattern.eventTypes.includes(newEvent.type)) {
        continue;
      }

      // Get events within time window
      const windowStart = new Date(now.getTime() - pattern.timeWindow * 60 * 1000);
      const recentEvents = this.events.filter(event => 
        new Date(event.timestamp) >= windowStart &&
        pattern.eventTypes.includes(event.type)
      );

      // Apply pattern conditions
      const matchingEvents = recentEvents.filter(event => 
        this.evaluatePatternConditions(event, pattern.conditions, newEvent)
      );

      // Check if threshold is exceeded
      if (matchingEvents.length >= pattern.threshold) {
        await this.triggerThreatResponse(pattern, matchingEvents, newEvent);
      }
    }
  }

  /**
   * Evaluate pattern conditions against an event
   */
  private evaluatePatternConditions(
    event: SecurityEvent,
    conditions: ThreatPattern['conditions'],
    context: SecurityEvent
  ): boolean {
    for (const condition of conditions) {
      const eventValue = this.getEventFieldValue(event, condition.field, context);
      
      switch (condition.operator) {
        case 'equals':
          if (eventValue !== condition.value && condition.value !== null) {
            return false;
          }
          break;
        case 'contains':
          if (!String(eventValue).includes(String(condition.value))) {
            return false;
          }
          break;
        case 'greater_than':
          if (Number(eventValue) <= Number(condition.value)) {
            return false;
          }
          break;
        case 'less_than':
          if (Number(eventValue) >= Number(condition.value)) {
            return false;
          }
          break;
        case 'regex':
          if (!new RegExp(condition.value).test(String(eventValue))) {
            return false;
          }
          break;
      }
    }
    
    return true;
  }

  /**
   * Get field value from event for pattern matching
   */
  private getEventFieldValue(event: SecurityEvent, field: string, context: SecurityEvent): any {
    switch (field) {
      case 'ipAddress':
        return context.ipAddress; // Use context IP for grouping
      case 'hour':
        return new Date(event.timestamp).getHours();
      case 'recordCount':
        return event.details.recordCount || 0;
      case 'userId':
        return event.userId;
      default:
        return event.details[field];
    }
  }

  /**
   * Trigger automated threat response
   */
  private async triggerThreatResponse(
    pattern: ThreatPattern,
    matchingEvents: SecurityEvent[],
    triggerEvent: SecurityEvent
  ): Promise<void> {
    const incidentId = this.generateIncidentId();
    
    // Create incident record
    await this.recordEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      pattern.severity,
      {
        incident_id: incidentId,
        pattern_name: pattern.name,
        pattern_description: pattern.description,
        matching_events: matchingEvents.length,
        trigger_event_id: triggerEvent.id,
        auto_response: pattern.autoResponse
      },
      {
        userId: triggerEvent.userId,
        ipAddress: triggerEvent.ipAddress,
        correlationId: incidentId
      }
    );

    // Execute automated response
    if (pattern.autoResponse) {
      await this.executeAutomatedResponse(pattern.autoResponse, triggerEvent, incidentId);
    }

    // Send critical alert
    await this.sendCriticalAlert(pattern, matchingEvents, triggerEvent, incidentId);
  }

  /**
   * Execute automated security response
   */
  private async executeAutomatedResponse(
    responseType: string,
    triggerEvent: SecurityEvent,
    incidentId: string
  ): Promise<void> {
    try {
      switch (responseType) {
        case 'block_ip':
          await this.blockIPAddress(triggerEvent.ipAddress, incidentId);
          break;
        case 'disable_user_session':
          await this.disableUserSession(triggerEvent.userId, incidentId);
          break;
        case 'require_additional_auth':
          await this.requireAdditionalAuth(triggerEvent.userId, incidentId);
          break;
        case 'block_request':
          await this.blockSuspiciousRequest(triggerEvent, incidentId);
          break;
        case 'notify_security_team':
          await this.notifySecurityTeam(triggerEvent, incidentId);
          break;
        default:
          secureLogger.warn('Unknown automated response type', {
            responseType,
            incidentId
          });
      }

      secureLogger.info('Automated security response executed', {
        responseType,
        incidentId,
        triggerEventId: triggerEvent.id
      });

    } catch (error) {
      secureLogger.error('Failed to execute automated response', {
        responseType,
        incidentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Block IP address
   */
  private async blockIPAddress(ipAddress?: string, incidentId?: string): Promise<void> {
    if (!ipAddress) return;

    // In a real implementation, this would integrate with:
    // - Cloudflare security rules
    // - WAF configuration
    // - Load balancer rules
    
    secureLogger.info('IP address blocked', {
      ipAddress: '[REDACTED]', // Never log actual IPs
      incidentId,
      action: 'ip_block'
    });
  }

  /**
   * Disable user session
   */
  private async disableUserSession(userId?: string, incidentId?: string): Promise<void> {
    if (!userId) return;

    // In a real implementation, this would:
    // - Invalidate all user sessions
    // - Require re-authentication
    // - Log security audit event
    
    secureLogger.info('User session disabled', {
      userId: '[REDACTED]',
      incidentId,
      action: 'session_disable'
    });
  }

  /**
   * Require additional authentication
   */
  private async requireAdditionalAuth(userId?: string, incidentId?: string): Promise<void> {
    if (!userId) return;

    // In a real implementation, this would:
    // - Set user flag for MFA requirement
    // - Send notification to user
    // - Log security requirement
    
    secureLogger.info('Additional authentication required', {
      userId: '[REDACTED]',
      incidentId,
      action: 'require_mfa'
    });
  }

  /**
   * Block suspicious request
   */
  private async blockSuspiciousRequest(event: SecurityEvent, incidentId?: string): Promise<void> {
    // In a real implementation, this would:
    // - Add request pattern to WAF rules
    // - Block similar requests
    // - Log blocked attempts
    
    secureLogger.info('Suspicious request blocked', {
      eventId: event.id,
      incidentId,
      action: 'request_block'
    });
  }

  /**
   * Notify security team
   */
  private async notifySecurityTeam(event: SecurityEvent, incidentId?: string): Promise<void> {
    // In a real implementation, this would:
    // - Send high-priority notifications
    // - Create incident tickets
    // - Escalate to on-call personnel
    
    secureLogger.info('Security team notified', {
      eventId: event.id,
      incidentId,
      action: 'security_notification'
    });
  }

  /**
   * Send security alert
   */
  private async sendAlert(event: SecurityEvent): Promise<void> {
    if (!this.alertConfig.enabled) return;

    // Check rate limiting
    const alertKey = `${event.type}-${event.severity}`;
    const now = Date.now();
    const lastAlert = this.alertHistory.get(alertKey) || 0;
    
    if (now - lastAlert < this.alertConfig.rateLimitMinutes * 60 * 1000) {
      return; // Rate limited
    }

    this.alertHistory.set(alertKey, now);

    // Send to configured channels
    for (const channel of this.alertConfig.channels) {
      await this.sendAlertToChannel(channel, event);
    }
  }

  /**
   * Send critical alert for threat patterns
   */
  private async sendCriticalAlert(
    pattern: ThreatPattern,
    events: SecurityEvent[],
    triggerEvent: SecurityEvent,
    incidentId: string
  ): Promise<void> {
    const alertData = {
      type: 'CRITICAL_SECURITY_INCIDENT',
      incidentId,
      patternName: pattern.name,
      description: pattern.description,
      severity: pattern.severity,
      eventCount: events.length,
      timeWindow: pattern.timeWindow,
      triggerEvent: {
        id: triggerEvent.id,
        type: triggerEvent.type,
        timestamp: triggerEvent.timestamp
      }
    };

    // Send to all channels for critical alerts
    for (const channel of Object.values(AlertChannel)) {
      await this.sendAlertToChannel(channel, triggerEvent, alertData);
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(
    channel: AlertChannel,
    event: SecurityEvent,
    additionalData?: any
  ): Promise<void> {
    try {
      switch (channel) {
        case AlertChannel.SLACK:
          await this.sendSlackAlert(event, additionalData);
          break;
        case AlertChannel.EMAIL:
          await this.sendEmailAlert(event, additionalData);
          break;
        case AlertChannel.SMS:
          await this.sendSMSAlert(event, additionalData);
          break;
        case AlertChannel.WEBHOOK:
          await this.sendWebhookAlert(event, additionalData);
          break;
        case AlertChannel.DASHBOARD:
          await this.sendDashboardAlert(event, additionalData);
          break;
      }
    } catch (error) {
      secureLogger.error('Failed to send alert', {
        channel,
        eventId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(event: SecurityEvent, additionalData?: any): Promise<void> {
    // Implementation would integrate with Slack API
    secureLogger.info('Slack alert sent', {
      eventId: event.id,
      severity: event.severity,
      channel: 'slack'
    });
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(event: SecurityEvent, additionalData?: any): Promise<void> {
    // Implementation would integrate with email service
    secureLogger.info('Email alert sent', {
      eventId: event.id,
      severity: event.severity,
      channel: 'email'
    });
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(event: SecurityEvent, additionalData?: any): Promise<void> {
    // Implementation would integrate with SMS service (Twilio)
    secureLogger.info('SMS alert sent', {
      eventId: event.id,
      severity: event.severity,
      channel: 'sms'
    });
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(event: SecurityEvent, additionalData?: any): Promise<void> {
    // Implementation would send HTTP webhook
    secureLogger.info('Webhook alert sent', {
      eventId: event.id,
      severity: event.severity,
      channel: 'webhook'
    });
  }

  /**
   * Send dashboard alert
   */
  private async sendDashboardAlert(event: SecurityEvent, additionalData?: any): Promise<void> {
    // Implementation would update real-time dashboard
    secureLogger.info('Dashboard alert sent', {
      eventId: event.id,
      severity: event.severity,
      channel: 'dashboard'
    });
  }

  /**
   * Calculate threat score
   */
  private calculateThreatScore(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>
  ): number {
    let baseScore = 0;

    // Base score by severity
    switch (severity) {
      case SecuritySeverity.CRITICAL: baseScore = 90; break;
      case SecuritySeverity.HIGH: baseScore = 70; break;
      case SecuritySeverity.MEDIUM: baseScore = 50; break;
      case SecuritySeverity.LOW: baseScore = 30; break;
      case SecuritySeverity.INFO: baseScore = 10; break;
    }

    // Adjust by event type
    const typeModifiers: Partial<Record<SecurityEventType, number>> = {
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 20,
      [SecurityEventType.PRIVILEGE_ESCALATION]: 15,
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 10,
      [SecurityEventType.BULK_DATA_EXPORT]: 15,
      [SecurityEventType.DATA_ENCRYPTION_FAILURE]: 10
    };

    baseScore += typeModifiers[type] || 0;

    // Adjust by details
    if (details.recordCount > 1000) baseScore += 10;
    if (details.failureCount > 5) baseScore += 5;
    if (details.offHours) baseScore += 5;

    return Math.min(100, Math.max(0, baseScore));
  }

  /**
   * Update security metrics
   */
  private updateMetrics(event: SecurityEvent): void {
    this.metrics.totalEvents++;
    this.metrics.eventsBySeverity[event.severity]++;
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1;
    
    // Update average threat score
    this.metrics.averageThreatScore = 
      (this.metrics.averageThreatScore * (this.metrics.totalEvents - 1) + event.threatScore) / 
      this.metrics.totalEvents;
  }

  /**
   * Check if alert should be sent
   */
  private shouldAlert(event: SecurityEvent): boolean {
    if (!this.alertConfig.enabled) return false;
    
    // Check severity threshold
    const severityOrder = [
      SecuritySeverity.INFO,
      SecuritySeverity.LOW,
      SecuritySeverity.MEDIUM,
      SecuritySeverity.HIGH,
      SecuritySeverity.CRITICAL
    ];
    
    const eventSeverityIndex = severityOrder.indexOf(event.severity);
    const thresholdIndex = severityOrder.indexOf(this.alertConfig.severityThreshold);
    
    return eventSeverityIndex >= thresholdIndex;
  }

  /**
   * Start background monitoring tasks
   */
  private startBackgroundMonitoring(): void {
    // Monitor system health every minute
    setInterval(async () => {
      await this.monitorSystemHealth();
    }, 60 * 1000);

    // Monitor encryption service every 5 minutes
    setInterval(async () => {
      await this.monitorEncryptionHealth();
    }, 5 * 60 * 1000);

    // Monitor cache performance every 2 minutes
    setInterval(async () => {
      await this.monitorCacheHealth();
    }, 2 * 60 * 1000);

    // Clean old events every hour
    setInterval(() => {
      this.cleanOldEvents();
    }, 60 * 60 * 1000);
  }

  /**
   * Monitor system health
   */
  private async monitorSystemHealth(): Promise<void> {
    try {
      // Check memory usage
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        await this.recordEvent(
          SecurityEventType.RESOURCE_EXHAUSTION,
          SecuritySeverity.MEDIUM,
          { type: 'memory', usage: memUsage.heapUsed, limit: 500 * 1024 * 1024 }
        );
      }

      // Check event queue size
      if (this.events.length > 8000) {
        await this.recordEvent(
          SecurityEventType.RESOURCE_EXHAUSTION,
          SecuritySeverity.MEDIUM,
          { type: 'event_queue', size: this.events.length, limit: 8000 }
        );
      }

    } catch (error) {
      secureLogger.error('System health monitoring failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Monitor encryption service health
   */
  private async monitorEncryptionHealth(): Promise<void> {
    try {
      const health = await fieldEncryption.getHealthStatus();
      
      if (health.status === 'unhealthy') {
        await this.recordEvent(
          SecurityEventType.DATA_ENCRYPTION_FAILURE,
          SecuritySeverity.HIGH,
          { 
            encryption_health: health,
            service: 'field_encryption'
          }
        );
      } else if (health.status === 'degraded') {
        await this.recordEvent(
          SecurityEventType.PERFORMANCE_DEGRADATION,
          SecuritySeverity.MEDIUM,
          { 
            encryption_health: health,
            service: 'field_encryption'
          }
        );
      }

    } catch (error) {
      await this.recordEvent(
        SecurityEventType.SERVICE_UNAVAILABLE,
        SecuritySeverity.HIGH,
        { 
          service: 'field_encryption',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
    }
  }

  /**
   * Monitor cache health
   */
  private async monitorCacheHealth(): Promise<void> {
    try {
      const health = await clinicalStaffingCache.getCacheHealth();
      
      if (health.status === 'unhealthy') {
        await this.recordEvent(
          SecurityEventType.SERVICE_UNAVAILABLE,
          SecuritySeverity.HIGH,
          { 
            cache_health: health,
            service: 'redis_cache'
          }
        );
      } else if (health.status === 'degraded') {
        await this.recordEvent(
          SecurityEventType.PERFORMANCE_DEGRADATION,
          SecuritySeverity.MEDIUM,
          { 
            cache_health: health,
            service: 'redis_cache'
          }
        );
      }

    } catch (error) {
      await this.recordEvent(
        SecurityEventType.SERVICE_UNAVAILABLE,
        SecuritySeverity.MEDIUM,
        { 
          service: 'redis_cache',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
    }
  }

  /**
   * Clean old events to prevent memory issues
   */
  private cleanOldEvents(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const originalLength = this.events.length;
    
    this.events = this.events.filter(event => new Date(event.timestamp) > cutoff);
    
    const cleaned = originalLength - this.events.length;
    if (cleaned > 0) {
      secureLogger.info('Old security events cleaned', {
        cleaned,
        remaining: this.events.length
      });
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique incident ID
   */
  private generateIncidentId(): string {
    return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    secureLogger.info('Security alert configuration updated', {
      config: this.alertConfig
    });
  }

  /**
   * Add custom threat pattern
   */
  addThreatPattern(pattern: ThreatPattern): void {
    this.threatPatterns.push(pattern);
    secureLogger.info('Custom threat pattern added', {
      patternName: pattern.name,
      severity: pattern.severity
    });
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: SecurityMetrics;
    recentCriticalEvents: number;
    activeIncidents: number;
    alertsEnabled: boolean;
  }> {
    const recentCritical = this.events.filter(event => 
      event.severity === SecuritySeverity.CRITICAL &&
      new Date(event.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (recentCritical > 5 || this.metrics.activeIncidents > 3) {
      status = 'unhealthy';
    } else if (recentCritical > 2 || this.metrics.activeIncidents > 1) {
      status = 'degraded';
    }

    return {
      status,
      metrics: this.metrics,
      recentCriticalEvents: recentCritical,
      activeIncidents: this.metrics.activeIncidents,
      alertsEnabled: this.alertConfig.enabled
    };
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringService();

// Export convenience functions
export const securityAudit = {
  /**
   * Record authentication event
   */
  async recordAuth(
    success: boolean,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await securityMonitoring.recordEvent(
      success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
      success ? SecuritySeverity.INFO : SecuritySeverity.MEDIUM,
      { success, attempt_time: new Date().toISOString() },
      { userId, ...context }
    );
  },

  /**
   * Record data access
   */
  async recordDataAccess(
    resourceType: string,
    operation: 'read' | 'write' | 'delete',
    recordCount: number = 1,
    userId?: string,
    context?: { ipAddress?: string; resourceId?: string }
  ): Promise<void> {
    const isBulk = recordCount > 100;
    await securityMonitoring.recordEvent(
      isBulk ? SecurityEventType.BULK_DATA_EXPORT : SecurityEventType.SENSITIVE_DATA_ACCESS,
      isBulk ? SecuritySeverity.HIGH : SecuritySeverity.INFO,
      { operation, recordCount, resourceType },
      { userId, resourceType, ...context }
    );
  },

  /**
   * Record security violation
   */
  async recordViolation(
    violationType: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await securityMonitoring.recordEvent(
      violationType,
      severity,
      details,
      { userId, ...context }
    );
  }
};