/**
 * Pharmaceutical Compliance Audit Trail Service
 * HIPAA-compliant audit logging for pharmaceutical interactions and scheduling
 * Tracks all user actions, data access, and system changes for compliance reporting
 */

import { PharmaSchedulingQueries } from '@ganger/db';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  details: Record<string, any>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    timestamp: string;
    timezone: string;
  };
  hipaaCategory: HIPAACategory;
  complianceRisk: ComplianceRisk;
  dataAccessed?: {
    patientData: boolean;
    pharmaRepData: boolean;
    scheduleData: boolean;
    sensitiveFields: string[];
  };
}

export enum AuditAction {
  // Authentication & Access
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  FAILED_LOGIN = 'failed_login',
  
  // Data Operations
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  
  // Pharmaceutical Scheduling
  BOOKING_REQUEST = 'booking_request',
  BOOKING_APPROVED = 'booking_approved',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_MODIFIED = 'booking_modified',
  
  // Calendar Integration
  CALENDAR_SYNC = 'calendar_sync',
  CALENDAR_EVENT_CREATED = 'calendar_event_created',
  CALENDAR_EVENT_UPDATED = 'calendar_event_updated',
  CALENDAR_EVENT_DELETED = 'calendar_event_deleted',
  
  // Configuration Changes
  CONFIG_UPDATED = 'config_updated',
  PERMISSIONS_CHANGED = 'permissions_changed',
  SYSTEM_SETTING_CHANGED = 'system_setting_changed',
  
  // Compliance-specific
  HIPAA_ACCESS = 'hipaa_access',
  AUDIT_LOG_ACCESSED = 'audit_log_accessed',
  COMPLIANCE_REPORT_GENERATED = 'compliance_report_generated'
}

export enum AuditResourceType {
  USER = 'user',
  PHARMA_REPRESENTATIVE = 'pharma_representative',
  APPOINTMENT = 'appointment',
  CALENDAR_EVENT = 'calendar_event',
  CONFIGURATION = 'configuration',
  AUDIT_LOG = 'audit_log',
  SYSTEM = 'system',
  PATIENT_DATA = 'patient_data'
}

export enum HIPAACategory {
  ADMINISTRATIVE = 'administrative',
  PHYSICAL = 'physical',
  TECHNICAL = 'technical',
  NOT_APPLICABLE = 'not_applicable'
}

export enum ComplianceRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  timeRange: {
    start: string;
    end: string;
  };
  summary: {
    totalEntries: number;
    highRiskEntries: number;
    failedAccessAttempts: number;
    dataAccessEvents: number;
    configurationChanges: number;
  };
  categories: {
    [key in HIPAACategory]: number;
  };
  riskDistribution: {
    [key in ComplianceRisk]: number;
  };
  flaggedActivities: AuditLogEntry[];
  recommendations: string[];
}

export interface AuditSearchCriteria {
  userId?: string;
  userEmail?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  hipaaCategory?: HIPAACategory;
  complianceRisk?: ComplianceRisk;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export class PharmaceuticalComplianceAuditService {
  private db: PharmaSchedulingQueries;

  constructor(dbQueries: PharmaSchedulingQueries) {
    this.db = dbQueries;
  }

  // =====================================================
  // AUDIT LOGGING METHODS
  // =====================================================

  async logAction(
    userId: string,
    userEmail: string,
    userRole: string,
    action: AuditAction,
    resourceType: AuditResourceType,
    details: Record<string, any>,
    metadata: {
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    },
    resourceId?: string
  ): Promise<string> {
    try {
      const auditEntry: Omit<AuditLogEntry, 'id'> = {
        userId,
        userEmail,
        userRole,
        action,
        resourceType,
        resourceId,
        details: this.sanitizeDetails(details),
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          timezone: 'America/Detroit'
        },
        hipaaCategory: this.categorizeHIPAAAction(action, resourceType),
        complianceRisk: this.assessComplianceRisk(action, resourceType, details),
        dataAccessed: this.analyzeDataAccess(action, resourceType, details)
      };

      // Store in database
      // TODO: Implement createAuditLogEntry in PharmaSchedulingQueries
      const auditId = 'temp-audit-id'; // await this.db.createAuditLogEntry(auditEntry);

      // Check for immediate compliance alerts
      await this.checkComplianceAlerts(auditEntry);

      return auditId;

    } catch (error) {
      // Even audit logging failures should be logged
      console.error('[ComplianceAudit] Failed to log audit entry:', error);
      throw new Error(`Audit logging failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async logBookingAction(
    userId: string,
    userEmail: string,
    userRole: string,
    action: AuditAction,
    appointmentId: string,
    bookingDetails: any,
    metadata: {
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<string> {
    return await this.logAction(
      userId,
      userEmail,
      userRole,
      action,
      AuditResourceType.APPOINTMENT,
      {
        appointmentId,
        repCompany: bookingDetails.companyName,
        repEmail: bookingDetails.repEmail,
        location: bookingDetails.location,
        appointmentDate: bookingDetails.appointmentDate,
        dataModified: this.extractModifiedFields(bookingDetails)
      },
      metadata,
      appointmentId
    );
  }

  async logCalendarAction(
    userId: string,
    userEmail: string,
    userRole: string,
    action: AuditAction,
    calendarEventId: string,
    calendarDetails: any,
    metadata: {
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<string> {
    return await this.logAction(
      userId,
      userEmail,
      userRole,
      action,
      AuditResourceType.CALENDAR_EVENT,
      {
        calendarEventId,
        calendarId: calendarDetails.calendarId,
        location: calendarDetails.location,
        eventTitle: calendarDetails.eventTitle,
        attendees: calendarDetails.attendees?.length || 0
      },
      metadata,
      calendarEventId
    );
  }

  async logConfigurationChange(
    userId: string,
    userEmail: string,
    userRole: string,
    configType: string,
    oldConfig: any,
    newConfig: any,
    metadata: {
      ipAddress: string;
      userAgent: string;
      sessionId: string;
    }
  ): Promise<string> {
    return await this.logAction(
      userId,
      userEmail,
      userRole,
      AuditAction.CONFIG_UPDATED,
      AuditResourceType.CONFIGURATION,
      {
        configType,
        changes: this.calculateConfigurationChanges(oldConfig, newConfig),
        oldValues: this.sanitizeConfiguration(oldConfig),
        newValues: this.sanitizeConfiguration(newConfig)
      },
      metadata,
      configType
    );
  }

  // =====================================================
  // AUDIT RETRIEVAL AND SEARCH
  // =====================================================

  async searchAuditLogs(criteria: AuditSearchCriteria): Promise<{
    entries: AuditLogEntry[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      // TODO: Implement searchAuditLogs in PharmaSchedulingQueries
      const entries = [] as any[]; // await this.db.searchAuditLogs(criteria);
      const totalCount = 0;
      
      return {
        entries,
        totalCount,
        hasMore: (criteria.offset || 0) + entries.length < totalCount
      };

    } catch (error) {
      throw new Error(`Audit log search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAuditLogById(auditId: string): Promise<AuditLogEntry | null> {
    try {
      // TODO: Implement getAuditLogById in PharmaSchedulingQueries
      return null; // await this.db.getAuditLogById(auditId);
    } catch (error) {
      throw new Error(`Failed to retrieve audit log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAuditLogsForResource(
    resourceType: AuditResourceType,
    resourceId: string,
    limit = 50
  ): Promise<AuditLogEntry[]> {
    try {
      // TODO: Implement getAuditLogsForResource in PharmaSchedulingQueries
      return []; // await this.db.getAuditLogsForResource(resourceType, resourceId, limit);
    } catch (error) {
      throw new Error(`Failed to retrieve resource audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // COMPLIANCE REPORTING
  // =====================================================

  async generateComplianceReport(
    startDate: string,
    endDate: string,
    generatedBy: string
  ): Promise<ComplianceReport> {
    try {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Get all audit logs in time range
      const { entries } = await this.searchAuditLogs({
        startDate,
        endDate,
        limit: 10000 // Large limit for comprehensive report
      });

      // Calculate summary statistics
      const summary = {
        totalEntries: entries.length,
        highRiskEntries: entries.filter(e => e.complianceRisk === ComplianceRisk.HIGH || e.complianceRisk === ComplianceRisk.CRITICAL).length,
        failedAccessAttempts: entries.filter(e => e.action === AuditAction.ACCESS_DENIED || e.action === AuditAction.FAILED_LOGIN).length,
        dataAccessEvents: entries.filter(e => e.dataAccessed && (e.dataAccessed.patientData || e.dataAccessed.pharmaRepData)).length,
        configurationChanges: entries.filter(e => e.action === AuditAction.CONFIG_UPDATED).length
      };

      // Calculate category distributions
      const categories = {
        [HIPAACategory.ADMINISTRATIVE]: entries.filter(e => e.hipaaCategory === HIPAACategory.ADMINISTRATIVE).length,
        [HIPAACategory.PHYSICAL]: entries.filter(e => e.hipaaCategory === HIPAACategory.PHYSICAL).length,
        [HIPAACategory.TECHNICAL]: entries.filter(e => e.hipaaCategory === HIPAACategory.TECHNICAL).length,
        [HIPAACategory.NOT_APPLICABLE]: entries.filter(e => e.hipaaCategory === HIPAACategory.NOT_APPLICABLE).length
      };

      const riskDistribution = {
        [ComplianceRisk.LOW]: entries.filter(e => e.complianceRisk === ComplianceRisk.LOW).length,
        [ComplianceRisk.MEDIUM]: entries.filter(e => e.complianceRisk === ComplianceRisk.MEDIUM).length,
        [ComplianceRisk.HIGH]: entries.filter(e => e.complianceRisk === ComplianceRisk.HIGH).length,
        [ComplianceRisk.CRITICAL]: entries.filter(e => e.complianceRisk === ComplianceRisk.CRITICAL).length
      };

      // Identify flagged activities
      const flaggedActivities = entries.filter(entry => 
        entry.complianceRisk === ComplianceRisk.HIGH || 
        entry.complianceRisk === ComplianceRisk.CRITICAL ||
        entry.action === AuditAction.FAILED_LOGIN ||
        entry.action === AuditAction.ACCESS_DENIED
      );

      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations(summary, flaggedActivities);

      const report: ComplianceReport = {
        reportId,
        generatedAt: new Date().toISOString(),
        generatedBy,
        timeRange: { start: startDate, end: endDate },
        summary,
        categories,
        riskDistribution,
        flaggedActivities,
        recommendations
      };

      // Log report generation
      await this.logAction(
        generatedBy,
        'system@gangerdermatology.com',
        'system',
        AuditAction.COMPLIANCE_REPORT_GENERATED,
        AuditResourceType.AUDIT_LOG,
        { reportId, timeRange: { start: startDate, end: endDate } },
        {
          ipAddress: 'system',
          userAgent: 'compliance-system',
          sessionId: 'compliance-report'
        }
      );

      return report;

    } catch (error) {
      throw new Error(`Compliance report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // COMPLIANCE ANALYSIS METHODS
  // =====================================================

  private categorizeHIPAAAction(action: AuditAction, resourceType: AuditResourceType): HIPAACategory {
    // Technical safeguards
    if ([
      AuditAction.LOGIN, AuditAction.LOGOUT, AuditAction.ACCESS_GRANTED, 
      AuditAction.ACCESS_DENIED, AuditAction.FAILED_LOGIN
    ].includes(action)) {
      return HIPAACategory.TECHNICAL;
    }

    // Administrative safeguards
    if ([
      AuditAction.PERMISSIONS_CHANGED, AuditAction.CONFIG_UPDATED,
      AuditAction.SYSTEM_SETTING_CHANGED, AuditAction.COMPLIANCE_REPORT_GENERATED
    ].includes(action)) {
      return HIPAACategory.ADMINISTRATIVE;
    }

    // Physical safeguards (calendar/location access)
    if (resourceType === AuditResourceType.CALENDAR_EVENT || action === AuditAction.CALENDAR_SYNC) {
      return HIPAACategory.PHYSICAL;
    }

    return HIPAACategory.NOT_APPLICABLE;
  }

  private assessComplianceRisk(
    action: AuditAction, 
    resourceType: AuditResourceType, 
    details: Record<string, any>
  ): ComplianceRisk {
    // Critical risk actions
    if ([
      AuditAction.FAILED_LOGIN, AuditAction.ACCESS_DENIED,
      AuditAction.HIPAA_ACCESS, AuditAction.EXPORT
    ].includes(action)) {
      return ComplianceRisk.CRITICAL;
    }

    // High risk actions
    if ([
      AuditAction.DELETE, AuditAction.PERMISSIONS_CHANGED,
      AuditAction.SYSTEM_SETTING_CHANGED
    ].includes(action)) {
      return ComplianceRisk.HIGH;
    }

    // Medium risk actions
    if ([
      AuditAction.UPDATE, AuditAction.CONFIG_UPDATED,
      AuditAction.BOOKING_REJECTED, AuditAction.BOOKING_CANCELLED
    ].includes(action)) {
      return ComplianceRisk.MEDIUM;
    }

    return ComplianceRisk.LOW;
  }

  private analyzeDataAccess(
    action: AuditAction, 
    resourceType: AuditResourceType, 
    details: Record<string, any>
  ): AuditLogEntry['dataAccessed'] {
    const dataAccessed = {
      patientData: false,
      pharmaRepData: false,
      scheduleData: false,
      sensitiveFields: [] as string[]
    };

    // Check for pharmaceutical rep data access
    if (resourceType === AuditResourceType.PHARMA_REPRESENTATIVE || details.repEmail) {
      dataAccessed.pharmaRepData = true;
      dataAccessed.sensitiveFields.push('pharma_rep_info');
    }

    // Check for schedule data access
    if (resourceType === AuditResourceType.APPOINTMENT || resourceType === AuditResourceType.CALENDAR_EVENT) {
      dataAccessed.scheduleData = true;
      dataAccessed.sensitiveFields.push('schedule_data');
    }

    // Check for specific sensitive fields
    if (details.repEmail) dataAccessed.sensitiveFields.push('email');
    if (details.repPhone) dataAccessed.sensitiveFields.push('phone');
    if (details.location) dataAccessed.sensitiveFields.push('location');

    return dataAccessed;
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove or mask sensitive data
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private extractModifiedFields(data: any): string[] {
    return Object.keys(data).filter(key => 
      !['id', 'createdAt', 'updatedAt'].includes(key)
    );
  }

  private calculateConfigurationChanges(oldConfig: any, newConfig: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    
    const allKeys = new Set([...Object.keys(oldConfig || {}), ...Object.keys(newConfig || {})]);
    
    for (const key of allKeys) {
      if (oldConfig?.[key] !== newConfig?.[key]) {
        changes[key] = {
          old: oldConfig?.[key],
          new: newConfig?.[key]
        };
      }
    }

    return changes;
  }

  private sanitizeConfiguration(config: any): any {
    const sanitized = { ...config };
    
    // Remove sensitive configuration values
    const sensitiveKeys = ['apiKey', 'secret', 'password', 'token'];
    
    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private async checkComplianceAlerts(auditEntry: Omit<AuditLogEntry, 'id'>): Promise<void> {
    // Check for immediate compliance violations that require alerts
    
    if (auditEntry.complianceRisk === ComplianceRisk.CRITICAL) {
      console.warn(`[ComplianceAlert] CRITICAL risk action detected:`, {
        userId: auditEntry.userId,
        action: auditEntry.action,
        timestamp: auditEntry.metadata.timestamp
      });
    }

    if (auditEntry.action === AuditAction.FAILED_LOGIN) {
      // Could implement failed login attempt tracking
      console.warn(`[ComplianceAlert] Failed login attempt:`, {
        userEmail: auditEntry.userEmail,
        ipAddress: auditEntry.metadata.ipAddress,
        timestamp: auditEntry.metadata.timestamp
      });
    }
  }

  private generateComplianceRecommendations(
    summary: ComplianceReport['summary'],
    flaggedActivities: AuditLogEntry[]
  ): string[] {
    const recommendations: string[] = [];

    if (summary.failedAccessAttempts > 10) {
      recommendations.push('Consider implementing account lockout policies after multiple failed login attempts');
    }

    if (summary.highRiskEntries > summary.totalEntries * 0.1) {
      recommendations.push('High percentage of high-risk activities detected - review user permissions and access controls');
    }

    if (summary.configurationChanges > 20) {
      recommendations.push('Frequent configuration changes detected - consider implementing change approval workflows');
    }

    const uniqueFailedUsers = new Set(
      flaggedActivities
        .filter(a => a.action === AuditAction.FAILED_LOGIN)
        .map(a => a.userEmail)
    );

    if (uniqueFailedUsers.size > 5) {
      recommendations.push('Multiple users experiencing authentication issues - review authentication system');
    }

    if (recommendations.length === 0) {
      recommendations.push('No immediate compliance concerns identified - continue monitoring');
    }

    return recommendations;
  }
}