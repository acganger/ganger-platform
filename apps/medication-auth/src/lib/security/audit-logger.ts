import { supabase } from '../database/supabase-client';

/**
 * HIPAA-Compliant Audit Logging Service
 * Provides comprehensive audit trail for all system access and modifications
 */

export interface AuditLogEntry {
  action: string;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  resource: string;
  resourceId?: string;
  tableName?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  accessReason?: string;
  complianceNote?: string;
  phiAccessed?: boolean;
  error?: string;
  details?: Record<string, any>;
  created_at?: string; // Database timestamp field
  [key: string]: any; // Allow dynamic property access for Supabase queries
}

export interface AuditSearchCriteria {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  phiAccessed?: boolean;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  entries: AuditLogEntry[];
  summary: {
    totalEntries: number;
    phiAccessCount: number;
    uniqueUsers: number;
    mostCommonActions: Array<{ action: string; count: number }>;
    riskEvents: number;
  };
  complianceMetrics: {
    accessibilityCompliance: number;
    dataIntegrityScore: number;
    auditTrailCompleteness: number;
  };
}

export class AuditLogger {
  private static instance: AuditLogger;
  private readonly batchSize = 100;
  private logQueue: AuditLogEntry[] = [];
  private flushTimeout?: NodeJS.Timeout;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Enhance entry with additional metadata
      const enhancedEntry = this.enhanceLogEntry(entry);
      
      // Add to queue for batch processing
      this.logQueue.push(enhancedEntry);
      
      // Flush immediately for critical events
      if (this.isCriticalEvent(entry)) {
        await this.flush();
      } else {
        // Schedule batch flush
        this.scheduleBatchFlush();
      }
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Store failed entries for retry
      await this.handleLoggingFailure(entry, error);
    }
  }

  /**
   * Flush pending audit logs
   */
  async flush(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const entriesToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      const { error } = await supabase
        .from('authorization_audit_logs')
        .insert(entriesToFlush.map(entry => this.formatForDatabase(entry)));

      if (error) {
        throw error;
      }

      console.log(`Flushed ${entriesToFlush.length} audit log entries`);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-queue failed entries
      this.logQueue.unshift(...entriesToFlush);
      throw error;
    }
  }

  /**
   * Search audit logs with filters
   */
  async search(criteria: AuditSearchCriteria): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('authorization_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (criteria.startDate) {
        query = query.gte('created_at', criteria.startDate.toISOString());
      }
      
      if (criteria.endDate) {
        query = query.lte('created_at', criteria.endDate.toISOString());
      }
      
      if (criteria.userId) {
        query = query.eq('user_id', criteria.userId);
      }
      
      if (criteria.action) {
        query = query.eq('action', criteria.action);
      }
      
      if (criteria.resource) {
        query = query.eq('table_name', criteria.resource);
      }
      
      if (criteria.phiAccessed !== undefined) {
        query = query.eq('phi_accessed', criteria.phiAccessed);
      }
      
      if (criteria.ipAddress) {
        query = query.eq('ip_address', criteria.ipAddress);
      }

      // Apply pagination
      if (criteria.limit) {
        query = query.limit(criteria.limit);
      }
      
      if (criteria.offset) {
        query = query.range(criteria.offset, criteria.offset + (criteria.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      throw new Error('Audit log search failed');
    }
  }

  /**
   * Generate HIPAA compliance audit report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<AuditReport> {
    try {
      const entries = await this.search({ startDate, endDate, limit: 10000 });
      
      // Calculate summary statistics
      const summary = {
        totalEntries: entries.length,
        phiAccessCount: entries.filter(e => e.phiAccessed).length,
        uniqueUsers: new Set(entries.map(e => e.userId).filter(Boolean)).size,
        mostCommonActions: this.calculateActionFrequency(entries),
        riskEvents: this.identifyRiskEvents(entries).length
      };

      // Calculate compliance metrics
      const complianceMetrics = {
        accessibilityCompliance: this.calculateAccessibilityCompliance(entries),
        dataIntegrityScore: this.calculateDataIntegrityScore(entries),
        auditTrailCompleteness: this.calculateAuditCompleteness(entries)
      };

      return {
        entries: entries.slice(0, 1000), // Limit entries in response
        summary,
        complianceMetrics
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw new Error('Compliance report generation failed');
    }
  }

  /**
   * Monitor for suspicious activity patterns
   */
  async detectSuspiciousActivity(timeWindow: number = 24): Promise<Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    userId?: string;
    count: number;
    timeframe: string;
  }>> {
    const startTime = new Date(Date.now() - (timeWindow * 60 * 60 * 1000));
    const entries = await this.search({ startDate: startTime });

    const suspicious = [];

    // Detect unusual access patterns
    const accessCounts = this.groupBy(entries, 'userId');
    Object.entries(accessCounts).forEach(([userId, userEntries]) => {
      if (userEntries.length > 100) { // More than 100 actions in timeframe
        suspicious.push({
          type: 'excessive_access',
          description: `User performed ${userEntries.length} actions in ${timeWindow} hours`,
          severity: 'medium' as const,
          userId,
          count: userEntries.length,
          timeframe: `${timeWindow}h`
        });
      }
    });

    // Detect failed authentication attempts
    const failedLogins = entries.filter(e => e.action.includes('failed_login'));
    const failedByIP = this.groupBy(failedLogins, 'ipAddress');
    Object.entries(failedByIP).forEach(([ip, failures]) => {
      if (failures.length > 5) {
        suspicious.push({
          type: 'brute_force_attempt',
          description: `Multiple failed login attempts from IP ${ip}`,
          severity: 'high' as const,
          count: failures.length,
          timeframe: `${timeWindow}h`
        });
      }
    });

    // Detect unusual PHI access
    const phiAccess = entries.filter(e => e.phiAccessed);
    const phiByUser = this.groupBy(phiAccess, 'user_id');
    Object.entries(phiByUser).forEach(([userId, accesses]) => {
      if (accesses.length > 50) {
        suspicious.push({
          type: 'excessive_phi_access',
          description: `User accessed PHI ${accesses.length} times in ${timeWindow} hours`,
          severity: 'high' as const,
          userId,
          count: accesses.length,
          timeframe: `${timeWindow}h`
        });
      }
    });

    // Detect access outside normal hours
    const outsideHours = entries.filter(e => {
      const hour = new Date(e.created_at || new Date()).getHours();
      return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
    });
    
    if (outsideHours.length > 10) {
      suspicious.push({
        type: 'off_hours_access',
        description: `${outsideHours.length} system accesses outside normal business hours`,
        severity: 'medium' as const,
        count: outsideHours.length,
        timeframe: `${timeWindow}h`
      });
    }

    return suspicious;
  }

  /**
   * Validate audit trail integrity
   */
  async validateAuditIntegrity(startDate: Date, endDate: Date): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const entries = await this.search({ startDate, endDate, limit: 10000 });
    const issues = [];
    const recommendations = [];

    // Check for gaps in audit trail
    const sortedEntries = entries.sort((a, b) => 
      new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
    );

    let previousTime = startDate.getTime();
    for (const entry of sortedEntries) {
      const entryTime = new Date(entry.created_at || new Date()).getTime();
      const gap = entryTime - previousTime;
      
      // Flag gaps longer than 4 hours during business hours
      if (gap > 4 * 60 * 60 * 1000) {
        const hour = new Date(previousTime).getHours();
        if (hour >= 8 && hour <= 18) {
          issues.push(`${Math.round(gap / (60 * 60 * 1000))} hour gap in audit trail detected`);
        }
      }
      
      previousTime = entryTime;
    }

    // Check for missing required fields
    const missingFields = entries.filter(e => 
      !e.userId || !e.action || !e.created_at
    );
    
    if (missingFields.length > 0) {
      issues.push(`${missingFields.length} audit entries missing required fields`);
      recommendations.push('Review audit logging implementation for completeness');
    }

    // Check PHI access documentation
    const phiAccess = entries.filter(e => e.phiAccessed);
    const undocumentedPHI = phiAccess.filter(e => !e.accessReason);
    
    if (undocumentedPHI.length > 0) {
      issues.push(`${undocumentedPHI.length} PHI access events without documented reason`);
      recommendations.push('Require access reason documentation for all PHI access');
    }

    // Validate user identification
    const missingUserInfo = entries.filter(e => e.userId && !e.userEmail);
    if (missingUserInfo.length > 0) {
      issues.push(`${missingUserInfo.length} entries missing complete user identification`);
      recommendations.push('Ensure both user ID and email are logged for accountability');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Private helper methods
   */

  private enhanceLogEntry(entry: AuditLogEntry): AuditLogEntry {
    return {
      ...entry,
      created_at: new Date().toISOString(),
      sessionId: entry.sessionId || this.generateSessionId(),
      phiAccessed: entry.phiAccessed || this.determineIfPHIAccessed(entry),
      complianceNote: entry.complianceNote || this.generateComplianceNote(entry)
    };
  }

  private isCriticalEvent(entry: AuditLogEntry): boolean {
    const criticalActions = [
      'failed_login',
      'security_violation',
      'unauthorized_access',
      'data_breach',
      'system_compromise',
      'admin_access',
      'bulk_phi_access'
    ];
    
    return criticalActions.some(action => entry.action.includes(action)) ||
           entry.phiAccessed === true ||
           entry.error !== undefined;
  }

  private scheduleBatchFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(async () => {
      try {
        await this.flush();
      } catch (error) {
        console.error('Scheduled flush failed:', error);
      }
    }, 5000); // Flush every 5 seconds

    // Force flush if queue is full
    if (this.logQueue.length >= this.batchSize) {
      clearTimeout(this.flushTimeout);
      this.flush().catch(error => 
        console.error('Forced flush failed:', error)
      );
    }
  }

  private async handleLoggingFailure(entry: AuditLogEntry, error: any): Promise<void> {
    // Store failed entries in local storage or alternative location
    console.error('Audit logging failure:', {
      entry: JSON.stringify(entry),
      error: error.message
    });
    
    // In production, you might want to:
    // 1. Store in local file system
    // 2. Send to external logging service
    // 3. Alert administrators
  }

  private formatForDatabase(entry: AuditLogEntry): any {
    return {
      authorization_id: entry.resourceId,
      user_id: entry.userId,
      user_email: entry.userEmail,
      session_id: entry.sessionId,
      action: entry.action,
      table_name: entry.tableName || entry.resource,
      record_id: entry.resourceId,
      old_values: entry.oldValues,
      new_values: entry.newValues,
      changed_fields: entry.changedFields || [],
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      request_path: entry.requestPath,
      request_method: entry.requestMethod,
      access_reason: entry.accessReason,
      compliance_note: entry.complianceNote,
      phi_accessed: entry.phiAccessed || false,
      created_at: entry.created_at || new Date().toISOString()
    };
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private determineIfPHIAccessed(entry: AuditLogEntry): boolean {
    const phiResources = [
      'patients',
      'patient',
      'authorization',
      'medication_authorization'
    ];
    
    return phiResources.some(resource => 
      entry.resource.toLowerCase().includes(resource) ||
      entry.action.toLowerCase().includes('patient')
    );
  }

  private generateComplianceNote(entry: AuditLogEntry): string {
    if (entry.phiAccessed) {
      return 'PHI access logged for HIPAA compliance monitoring';
    }
    
    if (entry.action.includes('admin')) {
      return 'Administrative action logged for security audit';
    }
    
    return 'System action logged for operational audit trail';
  }

  private calculateActionFrequency(entries: AuditLogEntry[]): Array<{ action: string; count: number }> {
    const frequency = entries.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private identifyRiskEvents(entries: AuditLogEntry[]): AuditLogEntry[] {
    return entries.filter(entry =>
      entry.error ||
      entry.action.includes('failed') ||
      entry.action.includes('denied') ||
      entry.action.includes('violation')
    );
  }

  private calculateAccessibilityCompliance(entries: AuditLogEntry[]): number {
    const requiredFields = ['user_id', 'action', 'created_at'];
    const compliantEntries = entries.filter(entry =>
      requiredFields.every(field => entry[field])
    );
    
    return entries.length > 0 ? (compliantEntries.length / entries.length) * 100 : 100;
  }

  private calculateDataIntegrityScore(entries: AuditLogEntry[]): number {
    let score = 100;
    
    // Deduct points for various integrity issues
    const missingUsers = entries.filter(e => !e.user_id).length;
    const missingActions = entries.filter(e => !e.action).length;
    const missingTimestamps = entries.filter(e => !e.created_at).length;
    
    score -= (missingUsers / entries.length) * 30;
    score -= (missingActions / entries.length) * 30;
    score -= (missingTimestamps / entries.length) * 40;
    
    return Math.max(0, score);
  }

  private calculateAuditCompleteness(entries: AuditLogEntry[]): number {
    const phiEntries = entries.filter(e => e.phiAccessed);
    const documentedPHI = phiEntries.filter(e => e.accessReason);
    
    const phiCompleteness = phiEntries.length > 0 ? 
      (documentedPHI.length / phiEntries.length) * 100 : 100;
    
    const overallCompleteness = entries.filter(e => 
      e.userId && e.action && e.created_at && e.ipAddress
    ).length / entries.length * 100;
    
    return (phiCompleteness + overallCompleteness) / 2;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key] || 'unknown');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience function for simple audit logging
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  return auditLogger.log(entry);
}