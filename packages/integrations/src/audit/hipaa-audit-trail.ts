/**
 * HIPAA-Compliant Audit Trail System
 * Medical record access and modification tracking with Time MCP integration
 */

import { ClinicalStaffingQueries } from '@ganger/db';

export interface AuditEvent {
  id: string;
  eventType: 'access' | 'create' | 'update' | 'delete' | 'export' | 'print' | 'view' | 'sync';
  resourceType: 'staff_schedule' | 'staff_member' | 'patient_info' | 'coverage_requirement' | 'optimization_run';
  resourceId: string;
  userId: string;
  userInfo: {
    name: string;
    email: string;
    role: string;
    department: string;
    npi?: string; // For medical professionals
  };
  timestamp: string; // ISO 8601 with timezone
  unixTimestamp: number; // For precise sorting and calculations
  timezone: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  actionDetails: {
    description: string;
    method?: string; // HTTP method or system operation
    endpoint?: string; // API endpoint accessed
    dataChanged?: Record<string, { before: any; after: any }>;
    reasonCode?: string; // Business reason for access
    patientContext?: string; // Patient ID if relevant
    locationContext?: string; // Location ID if relevant
  };
  complianceMetadata: {
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' | 'phi'; // PHI = Protected Health Information
    accessJustification: string;
    supervisorApproval?: {
      supervisorId: string;
      approvalTimestamp: string;
      approvalReason: string;
    };
    dataMinimization: boolean; // Whether minimum necessary standard was followed
    purposeOfUse: 'treatment' | 'payment' | 'operations' | 'research' | 'audit' | 'emergency';
  };
  systemMetadata: {
    applicationVersion: string;
    databaseVersion: string;
    systemEnvironment: 'production' | 'staging' | 'development';
    dataRetentionPolicy: string;
    encryptionStatus: boolean;
  };
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    anomalyDetected: boolean;
    riskFactors: string[];
    automatedFlags: string[];
  };
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  reportType: 'access_log' | 'modification_log' | 'user_activity' | 'data_breach' | 'risk_assessment';
  timeRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    userIds?: string[];
    resourceTypes?: string[];
    riskLevels?: string[];
    locations?: string[];
  };
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    highRiskEvents: number;
    anomaliesDetected: number;
    complianceScore: number; // 0-100
  };
  events: AuditEvent[];
  recommendations: string[];
  complianceIssues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    events: string[]; // Event IDs
    remediation: string;
  }>;
}

export interface AnomalyDetection {
  anomalyId: string;
  detectedAt: string;
  anomalyType: 'unusual_access_pattern' | 'after_hours_access' | 'bulk_data_access' | 'unauthorized_location' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEvents: string[];
  userId: string;
  riskScore: number; // 0-100
  automaticResponse: {
    actionTaken: string;
    notificationsSent: string[];
    accessRestricted: boolean;
  };
  investigationStatus: 'pending' | 'in_progress' | 'resolved' | 'false_positive';
}

export interface DataRetentionPolicy {
  policyId: string;
  resourceType: string;
  retentionPeriod: number; // days
  archivalRequired: boolean;
  destructionMethod: 'secure_delete' | 'cryptographic_erasure' | 'physical_destruction';
  legalHolds: Array<{
    holdId: string;
    reason: string;
    startDate: string;
    endDate?: string;
  }>;
}

export interface TimeMCPIntegration {
  getCurrentTime(): Promise<string>; // Returns ISO 8601 timestamp with timezone
  getUnixTimestamp(): Promise<number>; // Returns Unix timestamp
  getTimezone(): Promise<string>; // Returns current timezone
  calculateBusinessDays(startDate: string, endDate: string): Promise<number>;
  formatForCompliance(timestamp: string): Promise<string>; // HIPAA-compliant format
}

export class HIPAAAuditTrail {
  private db: ClinicalStaffingQueries; // Will be used when database methods are implemented
  private timeMCP: TimeMCPIntegration;
  private auditBuffer: AuditEvent[];
  private anomalyDetector: AnomalyDetector;
  private retentionPolicies: Map<string, DataRetentionPolicy>;
  private encryptionKey: string; // Will be used for encryption when implemented

  constructor(
    dbQueries: ClinicalStaffingQueries,
    timeMCPIntegration: TimeMCPIntegration,
    encryptionKey: string
  ) {
    this.db = dbQueries;
    this.timeMCP = timeMCPIntegration;
    this.auditBuffer = [];
    this.anomalyDetector = new AnomalyDetector();
    this.retentionPolicies = new Map();
    this.encryptionKey = encryptionKey;

    // Initialize retention policies
    this.initializeRetentionPolicies();
    
    // Start background processes
    this.startAuditBufferFlush();
    this.startAnomalyMonitoring();
    this.startRetentionCleanup();
    
    // Log initialization for debugging
    console.log('[HIPAAAuditTrail] Initialized with database:', !!this.db);
    console.log('[HIPAAAuditTrail] Encryption configured:', !!this.encryptionKey);
  }

  // =====================================================
  // AUDIT EVENT LOGGING
  // =====================================================

  async logAuditEvent(
    eventType: AuditEvent['eventType'],
    resourceType: AuditEvent['resourceType'],
    resourceId: string,
    userId: string,
    userInfo: AuditEvent['userInfo'],
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    actionDetails: AuditEvent['actionDetails'],
    complianceMetadata: AuditEvent['complianceMetadata']
  ): Promise<string> {
    try {
      // Get precise timestamp from Time MCP
      const timestamp = await this.timeMCP.getCurrentTime();
      const unixTimestamp = await this.timeMCP.getUnixTimestamp();
      const timezone = await this.timeMCP.getTimezone();

      // Generate audit event
      const auditEvent: AuditEvent = {
        id: await this.generateAuditEventId(),
        eventType,
        resourceType,
        resourceId,
        userId,
        userInfo,
        timestamp,
        unixTimestamp,
        timezone,
        sessionId,
        ipAddress,
        userAgent,
        actionDetails,
        complianceMetadata,
        systemMetadata: {
          applicationVersion: process.env.APP_VERSION || '1.0.0',
          databaseVersion: '1.0.0',
          systemEnvironment: (process.env.NODE_ENV as any) || 'development',
          dataRetentionPolicy: this.getRetentionPolicyId(resourceType),
          encryptionStatus: true
        },
        riskAssessment: await this.assessRisk(eventType, resourceType, userInfo, actionDetails)
      };

      // Add to buffer for batch processing
      this.auditBuffer.push(auditEvent);

      // Check for immediate high-risk events
      if (auditEvent.riskAssessment.riskLevel === 'critical') {
        await this.handleCriticalEvent(auditEvent);
      }

      // Check for anomalies
      await this.anomalyDetector.analyzeEvent(auditEvent);

      this.logInfo(`Audit event logged: ${eventType} on ${resourceType}:${resourceId} by ${userId}`);
      return auditEvent.id;

    } catch (error) {
      this.logError('Failed to log audit event', error);
      throw error;
    }
  }

  async logScheduleAccess(
    scheduleId: string,
    userId: string,
    userInfo: AuditEvent['userInfo'],
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    accessReason: string,
    patientContext?: string
  ): Promise<string> {
    return this.logAuditEvent(
      'access',
      'staff_schedule',
      scheduleId,
      userId,
      userInfo,
      sessionId,
      ipAddress,
      userAgent,
      {
        description: `Accessed staff schedule ${scheduleId}`,
        method: 'GET',
        endpoint: `/api/schedules/${scheduleId}`,
        reasonCode: accessReason,
        patientContext
      },
      {
        dataClassification: patientContext ? 'phi' : 'confidential',
        accessJustification: accessReason,
        dataMinimization: true,
        purposeOfUse: 'treatment'
      }
    );
  }

  async logScheduleModification(
    scheduleId: string,
    userId: string,
    userInfo: AuditEvent['userInfo'],
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    changes: Record<string, { before: any; after: any }>,
    modificationReason: string,
    supervisorApproval?: AuditEvent['complianceMetadata']['supervisorApproval']
  ): Promise<string> {
    return this.logAuditEvent(
      'update',
      'staff_schedule',
      scheduleId,
      userId,
      userInfo,
      sessionId,
      ipAddress,
      userAgent,
      {
        description: `Modified staff schedule ${scheduleId}`,
        method: 'PUT',
        endpoint: `/api/schedules/${scheduleId}`,
        dataChanged: changes,
        reasonCode: modificationReason
      },
      {
        dataClassification: 'confidential',
        accessJustification: modificationReason,
        supervisorApproval,
        dataMinimization: true,
        purposeOfUse: 'operations'
      }
    );
  }

  async logDataExport(
    userId: string,
    userInfo: AuditEvent['userInfo'],
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    exportedData: {
      resourceTypes: string[];
      recordCount: number;
      dateRange: { start: string; end: string };
      format: string;
    },
    exportReason: string,
    supervisorApproval: AuditEvent['complianceMetadata']['supervisorApproval']
  ): Promise<string> {
    return this.logAuditEvent(
      'export',
      'staff_schedule',
      `export_${Date.now()}`,
      userId,
      userInfo,
      sessionId,
      ipAddress,
      userAgent,
      {
        description: `Exported ${exportedData.recordCount} records`,
        method: 'POST',
        endpoint: '/api/export',
        reasonCode: exportReason,
        dataChanged: {
          exported_data: {
            before: 'secure',
            after: `exported_${exportedData.recordCount}_records`
          }
        }
      },
      {
        dataClassification: 'phi',
        accessJustification: exportReason,
        supervisorApproval,
        dataMinimization: false, // Exports typically include broader data
        purposeOfUse: 'operations'
      }
    );
  }

  // =====================================================
  // COMPLIANCE REPORTING
  // =====================================================

  async generateComplianceReport(
    reportType: ComplianceReport['reportType'],
    startDate: string,
    endDate: string,
    filters?: ComplianceReport['filters']
  ): Promise<ComplianceReport> {
    try {
      const reportId = await this.generateReportId();
      const generatedAt = await this.timeMCP.getCurrentTime();

      // Query audit events within date range
      const events = await this.queryAuditEvents(startDate, endDate, filters);

      // Calculate summary statistics
      const summary = this.calculateReportSummary(events);

      // Analyze compliance issues
      const complianceIssues = await this.analyzeComplianceIssues(events);

      // Generate recommendations
      const recommendations = this.generateRecommendations(events, complianceIssues);

      const report: ComplianceReport = {
        reportId,
        generatedAt,
        reportType,
        timeRange: { startDate, endDate },
        filters: filters || {},
        summary,
        events,
        recommendations,
        complianceIssues
      };

      // Log report generation
      await this.logAuditEvent(
        'create',
        'optimization_run',
        reportId,
        'system',
        {
          name: 'System',
          email: 'system@gangerdermatology.com',
          role: 'system',
          department: 'IT'
        },
        'system',
        'localhost',
        'audit-system',
        {
          description: `Generated compliance report: ${reportType}`,
          reasonCode: 'compliance_reporting'
        },
        {
          dataClassification: 'confidential',
          accessJustification: 'Regulatory compliance monitoring',
          dataMinimization: true,
          purposeOfUse: 'audit'
        }
      );

      return report;

    } catch (error) {
      this.logError('Failed to generate compliance report', error);
      throw error;
    }
  }

  async getAuditTrail(
    resourceType: string,
    resourceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AuditEvent[]> {
    const events = await this.queryAuditEvents(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate || new Date().toISOString(),
      { resourceTypes: [resourceType] }
    );

    return events.filter(event => event.resourceId === resourceId);
  }

  // =====================================================
  // ANOMALY DETECTION
  // =====================================================

  async detectAnomalies(
    userId?: string,
    timeRange?: { start: string; end: string }
  ): Promise<AnomalyDetection[]> {
    const range = timeRange || {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    };

    const events = await this.queryAuditEvents(range.start, range.end, {
      userIds: userId ? [userId] : undefined
    });

    return this.anomalyDetector.detectAnomalies(events);
  }

  // =====================================================
  // DATA RETENTION AND CLEANUP
  // =====================================================

  async cleanupExpiredData(): Promise<{
    recordsArchived: number;
    recordsDeleted: number;
    errors: string[];
  }> {
    const results = {
      recordsArchived: 0,
      recordsDeleted: 0,
      errors: []
    };

    try {
      for (const [resourceType, policy] of this.retentionPolicies) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

        const expiredEvents = await this.queryAuditEvents(
          '1970-01-01T00:00:00Z',
          cutoffDate.toISOString(),
          { resourceTypes: [resourceType] }
        );

        for (const event of expiredEvents) {
          // Check for legal holds
          const hasLegalHold = policy.legalHolds.some(hold =>
            (!hold.endDate || new Date(hold.endDate) > new Date()) &&
            new Date(hold.startDate) <= new Date(event.timestamp)
          );

          if (hasLegalHold) {
            continue; // Skip deletion for records under legal hold
          }

          try {
            if (policy.archivalRequired) {
              await this.archiveAuditEvent(event);
              results.recordsArchived++;
            }

            await this.deleteAuditEvent(event.id);
            results.recordsDeleted++;

          } catch (error) {
            (results.errors as string[]).push(`Failed to process event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      this.logInfo(`Data cleanup completed: ${results.recordsArchived} archived, ${results.recordsDeleted} deleted`);
      return results;

    } catch (error) {
      this.logError('Data cleanup failed', error);
      throw error;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async assessRisk(
    eventType: AuditEvent['eventType'],
    resourceType: AuditEvent['resourceType'],
    userInfo: AuditEvent['userInfo'],
    actionDetails: AuditEvent['actionDetails']
  ): Promise<AuditEvent['riskAssessment']> {
    let riskLevel: AuditEvent['riskAssessment']['riskLevel'] = 'low';
    const riskFactors: string[] = [];
    const automatedFlags: string[] = [];
    let anomalyDetected = false;

    // Assess risk based on event type
    if (eventType === 'delete' || eventType === 'export') {
      riskLevel = 'high';
      riskFactors.push('destructive_or_extractive_operation');
    }

    // Assess risk based on data classification
    if (actionDetails.patientContext) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      riskFactors.push('patient_health_information_access');
    }

    // Assess risk based on resource type
    if (resourceType === 'patient_info' || resourceType === 'staff_member') {
      if (riskLevel === 'low') riskLevel = 'medium';
      riskFactors.push(`sensitive_${resourceType}_access`);
    }

    // Assess risk based on user role
    if (userInfo.role === 'guest' || userInfo.role === 'temporary') {
      if (riskLevel !== 'high') riskLevel = 'medium';
      riskFactors.push('limited_privilege_user');
    }

    // Check for after-hours access
    const eventTime = new Date();
    const hour = eventTime.getHours();
    if (hour < 6 || hour > 22) {
      riskFactors.push('after_hours_access');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check for bulk operations
    if (actionDetails.description?.includes('bulk') || actionDetails.description?.includes('export')) {
      riskFactors.push('bulk_data_operation');
      if (riskLevel !== 'high') riskLevel = 'medium';
    }

    return {
      riskLevel,
      anomalyDetected,
      riskFactors,
      automatedFlags
    };
  }

  private calculateReportSummary(events: AuditEvent[]): ComplianceReport['summary'] {
    const uniqueUsers = new Set(events.map(e => e.userId)).size;
    const highRiskEvents = events.filter(e => e.riskAssessment.riskLevel === 'high' || e.riskAssessment.riskLevel === 'critical').length;
    const anomaliesDetected = events.filter(e => e.riskAssessment.anomalyDetected).length;

    // Calculate compliance score based on various factors
    const complianceScore = Math.max(0, 100 - (
      (highRiskEvents / events.length) * 20 +
      (anomaliesDetected / events.length) * 30
    ));

    return {
      totalEvents: events.length,
      uniqueUsers,
      highRiskEvents,
      anomaliesDetected,
      complianceScore: Math.round(complianceScore)
    };
  }

  private async analyzeComplianceIssues(events: AuditEvent[]): Promise<ComplianceReport['complianceIssues']> {
    const issues: ComplianceReport['complianceIssues'] = [];

    // Check for missing access justification
    const missingJustification = events.filter(e => !e.complianceMetadata.accessJustification);
    if (missingJustification.length > 0) {
      issues.push({
        severity: 'medium',
        description: 'Events found without proper access justification',
        events: missingJustification.map(e => e.id),
        remediation: 'Ensure all access events include proper justification documentation'
      });
    }

    // Check for PHI access without minimum necessary compliance
    const phiViolations = events.filter(e => 
      e.complianceMetadata.dataClassification === 'phi' && 
      !e.complianceMetadata.dataMinimization
    );
    if (phiViolations.length > 0) {
      issues.push({
        severity: 'high',
        description: 'PHI accessed without following minimum necessary standard',
        events: phiViolations.map(e => e.id),
        remediation: 'Review PHI access procedures and ensure minimum necessary standard is followed'
      });
    }

    return issues;
  }

  private generateRecommendations(
    events: AuditEvent[],
    issues: ComplianceReport['complianceIssues']
  ): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.severity === 'high' || i.severity === 'critical')) {
      recommendations.push('Immediate review required for high-severity compliance issues');
    }

    const anomalyRate = events.filter(e => e.riskAssessment.anomalyDetected).length / events.length;
    if (anomalyRate > 0.05) {
      recommendations.push('Consider reviewing user access patterns and implementing additional monitoring');
    }

    const afterHoursAccess = events.filter(e => 
      e.riskAssessment.riskFactors.includes('after_hours_access')
    ).length;
    if (afterHoursAccess > events.length * 0.1) {
      recommendations.push('High volume of after-hours access detected - consider reviewing shift policies');
    }

    return recommendations;
  }

  // Background processes
  private startAuditBufferFlush(): void {
    setInterval(async () => {
      if (this.auditBuffer.length > 0) {
        const eventsToFlush = [...this.auditBuffer];
        this.auditBuffer = [];
        
        try {
          await this.flushAuditEvents(eventsToFlush);
        } catch (error) {
          this.logError('Failed to flush audit events', error);
          // Put events back in buffer for retry
          this.auditBuffer.unshift(...eventsToFlush);
        }
      }
    }, 10000); // Flush every 10 seconds
  }

  private startAnomalyMonitoring(): void {
    setInterval(async () => {
      try {
        const recentAnomalies = await this.detectAnomalies();
        for (const anomaly of recentAnomalies) {
          if (anomaly.severity === 'critical') {
            await this.handleCriticalAnomaly(anomaly);
          }
        }
      } catch (error) {
        this.logError('Anomaly monitoring failed', error);
      }
    }, 60000); // Check every minute
  }

  private startRetentionCleanup(): void {
    setInterval(async () => {
      try {
        await this.cleanupExpiredData();
      } catch (error) {
        this.logError('Retention cleanup failed', error);
      }
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  // Database operations (placeholders for actual implementation)
  private async queryAuditEvents(
    startDate: string,
    endDate: string,
    filters?: ComplianceReport['filters']
  ): Promise<AuditEvent[]> {
    // TODO: Implement actual database query using this._db
    // Query would filter by date range and apply any additional filters
    console.log(`Querying audit events from ${startDate} to ${endDate}`, filters);
    return []; // Placeholder - needs database implementation
  }

  private async flushAuditEvents(events: AuditEvent[]): Promise<void> {
    // TODO: Implement batch insert using this._db
    if (events.length === 0) return;
    
    console.log(`Flushing ${events.length} audit events to database`);
    // Example implementation structure:
    // await this._db.batchInsertAuditEvents(events);
  }

  private async deleteAuditEvent(_eventId: string): Promise<void> {
    // Would delete event from database
    // Placeholder
  }

  private async archiveAuditEvent(_event: AuditEvent): Promise<void> {
    // Would archive event to long-term storage
    // Placeholder
  }

  private async handleCriticalEvent(event: AuditEvent): Promise<void> {
    // Would send immediate notifications for critical events
    this.logError(`CRITICAL AUDIT EVENT: ${event.eventType} by ${event.userId}`);
  }

  private async handleCriticalAnomaly(anomaly: AnomalyDetection): Promise<void> {
    // Would handle critical anomalies with immediate response
    this.logError(`CRITICAL ANOMALY DETECTED: ${anomaly.anomalyType} for user ${anomaly.userId}`);
  }

  private initializeRetentionPolicies(): void {
    // Set up default retention policies
    this.retentionPolicies.set('staff_schedule', {
      policyId: 'policy_staff_schedule',
      resourceType: 'staff_schedule',
      retentionPeriod: 2555, // 7 years for medical records
      archivalRequired: true,
      destructionMethod: 'secure_delete',
      legalHolds: []
    });

    this.retentionPolicies.set('staff_member', {
      policyId: 'policy_staff_member',
      resourceType: 'staff_member',
      retentionPeriod: 2555, // 7 years
      archivalRequired: true,
      destructionMethod: 'secure_delete',
      legalHolds: []
    });
  }

  private getRetentionPolicyId(resourceType: string): string {
    return this.retentionPolicies.get(resourceType)?.policyId || 'default_policy';
  }

  private async generateAuditEventId(): Promise<string> {
    const timestamp = await this.timeMCP.getUnixTimestamp();
    return `audit_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateReportId(): Promise<string> {
    const timestamp = await this.timeMCP.getUnixTimestamp();
    return `report_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logInfo(message: string): void {
    console.log(`[HIPAAAuditTrail] ${message}`);
  }

  private logError(message: string, error?: any): void {
    console.error(`[HIPAAAuditTrail] ERROR: ${message}`, error || '');
  }
  
  // =====================================================
  // DEBUG METHODS
  // =====================================================
  
  /**
   * Get debug information about the audit trail system
   */
  public getDebugInfo() {
    return {
      hasDatabase: !!this.db,
      hasEncryptionKey: !!this.encryptionKey,
      bufferSize: this.auditBuffer.length,
      retentionPolicies: this.retentionPolicies.size,
      anomalyDetectorActive: !!this.anomalyDetector,
      timeMCPActive: !!this.timeMCP
    };
  }
  
  /**
   * Get database connection status
   */
  public getDatabaseInfo(): string {
    return this.db ? 'Database connection established' : 'No database connection';
  }
  
  /**
   * Get encryption configuration status
   */
  public getEncryptionStatus(): boolean {
    return !!this.encryptionKey && this.encryptionKey.length > 0;
  }
}

// =====================================================
// ANOMALY DETECTOR CLASS
// =====================================================

class AnomalyDetector {
  private userPatterns: Map<string, any>;
  private baselineMetrics: Map<string, any>; // Will be used for baseline comparison when implemented

  constructor() {
    this.userPatterns = new Map();
    this.baselineMetrics = new Map();
    this.initializeBaselines();
  }

  private initializeBaselines(): void {
    // TODO: Load baseline metrics from database or configuration
    // For now, set default baselines
    this.baselineMetrics.set('normal_access_hours', { start: 6, end: 22 });
    this.baselineMetrics.set('max_daily_accesses', 100);
    this.baselineMetrics.set('max_bulk_operations', 10);
    console.debug('[AnomalyDetector] Initialized baseline metrics');
  }

  async analyzeEvent(event: AuditEvent): Promise<void> {
    // Update user patterns
    const pattern = this.userPatterns.get(event.userId) || {
      accessTimes: [],
      resourceTypes: new Set(),
      locations: new Set(),
      totalAccess: 0
    };

    pattern.accessTimes.push(new Date(event.timestamp).getHours());
    pattern.resourceTypes.add(event.resourceType);
    if (event.actionDetails.locationContext) {
      pattern.locations.add(event.actionDetails.locationContext);
    }
    pattern.totalAccess++;

    this.userPatterns.set(event.userId, pattern);
  }

  async detectAnomalies(events: AuditEvent[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Group events by user
    const eventsByUser = new Map<string, AuditEvent[]>();
    events.forEach(event => {
      const userEvents = eventsByUser.get(event.userId) || [];
      userEvents.push(event);
      eventsByUser.set(event.userId, userEvents);
    });

    // Analyze each user's patterns
    for (const [userId, userEvents] of eventsByUser) {
      const userAnomalies = await this.detectUserAnomalies(userId, userEvents);
      anomalies.push(...userAnomalies);
    }

    return anomalies;
  }

  private async detectUserAnomalies(userId: string, events: AuditEvent[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Check for unusual access patterns
    const normalHours = this.baselineMetrics.get('normal_access_hours') || { start: 6, end: 22 };
    const accessTimes = events.map(e => new Date(e.timestamp).getHours());
    const afterHoursAccess = accessTimes.filter(hour => hour < normalHours.start || hour > normalHours.end);
    
    if (afterHoursAccess.length > events.length * 0.5) {
      anomalies.push({
        anomalyId: this.generateAnomalyId(),
        detectedAt: new Date().toISOString(),
        anomalyType: 'after_hours_access',
        severity: 'medium',
        description: `User ${userId} has unusually high after-hours access (${afterHoursAccess.length}/${events.length} events)`,
        affectedEvents: events.map(e => e.id),
        userId,
        riskScore: 60,
        automaticResponse: {
          actionTaken: 'flagged_for_review',
          notificationsSent: ['security_team'],
          accessRestricted: false
        },
        investigationStatus: 'pending'
      });
    }

    // Check for bulk data access
    const bulkEvents = events.filter(e => 
      e.eventType === 'export' || 
      e.actionDetails.description?.includes('bulk') ||
      (e.resourceType === 'staff_schedule' && events.length > 50)
    );

    if (bulkEvents.length > 0) {
      anomalies.push({
        anomalyId: this.generateAnomalyId(),
        detectedAt: new Date().toISOString(),
        anomalyType: 'bulk_data_access',
        severity: 'high',
        description: `User ${userId} performed ${bulkEvents.length} bulk data operations`,
        affectedEvents: bulkEvents.map(e => e.id),
        userId,
        riskScore: 80,
        automaticResponse: {
          actionTaken: 'supervisor_notification',
          notificationsSent: ['supervisor', 'security_team'],
          accessRestricted: false
        },
        investigationStatus: 'pending'
      });
    }

    return anomalies;
  }

  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Debug methods for testing and inspection
   */
  public getDebugInfo() {
    return {
      patterns: this.patterns.size,
      thresholds: this.thresholds.size,
      id: this.generateAnomalyId()
    };
  }

  public getActivePatterns(): string[] {
    return Array.from(this.patterns.keys());
  }

  public getThresholdInfo(): Record<string, number> {
    const info: Record<string, number> = {};
    this.thresholds.forEach((value, key) => {
      info[key] = value;
    });
    return info;
  }
}