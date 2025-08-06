/**
 * TimeTrade Migration Service
 * Migrates existing TimeTrade appointments to the new pharmaceutical scheduling system
 * Provides parallel operation during transition and data import capabilities
 */

import { PharmaSchedulingQueries } from '@ganger/db';
import { PharmaceuticalComplianceAuditService, AuditAction, AuditResourceType } from './compliance-audit-service';

export interface TimeTradeAppointment {
  id: string;
  repName: string;
  companyName: string;
  repEmail: string;
  repPhone?: string;
  location: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  notes?: string;
  attendeeCount?: number;
}

export interface MigrationReport {
  migrationId: string;
  startTime: string;
  endTime: string;
  totalRecords: number;
  successfulMigrations: number;
  failedMigrations: number;
  skippedRecords: number;
  errors: string[];
  warnings: string[];
  migratedAppointments: string[];
  duplicatesFound: number;
  dataQualityIssues: number;
}

export interface MigrationConfig {
  batchSize: number;
  validateDataQuality: boolean;
  skipDuplicates: boolean;
  createRepresentatives: boolean;
  preserveOriginalIds: boolean;
  migrationMode: 'import' | 'sync' | 'validate';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DataValidationIssue {
  recordId: string;
  field: string;
  issue: string;
  severity: 'error' | 'warning';
  originalValue: any;
  suggestedFix?: any;
}

export class TimeTradeToPharmaMigrationService {
  private db: PharmaSchedulingQueries;
  private auditService: PharmaceuticalComplianceAuditService;

  constructor(
    dbQueries: PharmaSchedulingQueries,
    auditService: PharmaceuticalComplianceAuditService
  ) {
    this.db = dbQueries;
    this.auditService = auditService;
  }

  // =====================================================
  // MAIN MIGRATION METHODS
  // =====================================================

  async migrateFromTimeTrade(
    timetradeData: TimeTradeAppointment[],
    config: MigrationConfig,
    performedBy: string
  ): Promise<MigrationReport> {
    const migrationId = `migration_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = new Date().toISOString();

    // Log migration start
    await this.auditService.logAction(
      'system',
      performedBy,
      'admin',
      AuditAction.IMPORT,
      AuditResourceType.SYSTEM,
      {
        migrationId,
        totalRecords: timetradeData.length,
        config
      },
      {
        ipAddress: 'system',
        userAgent: 'timetrade-migration',
        sessionId: migrationId
      }
    );

    const report: MigrationReport = {
      migrationId,
      startTime,
      endTime: '',
      totalRecords: timetradeData.length,
      successfulMigrations: 0,
      failedMigrations: 0,
      skippedRecords: 0,
      errors: [],
      warnings: [],
      migratedAppointments: [],
      duplicatesFound: 0,
      dataQualityIssues: 0
    };

    try {
      // Validate data quality if enabled
      if (config.validateDataQuality) {
        const validationIssues = await this.validateTimeTradeData(timetradeData);
        report.dataQualityIssues = validationIssues.length;
        
        const errors = validationIssues.filter(issue => issue.severity === 'error');
        const warnings = validationIssues.filter(issue => issue.severity === 'warning');
        
        report.errors.push(...errors.map(e => `${e.recordId}: ${e.field} - ${e.issue}`));
        report.warnings.push(...warnings.map(w => `${w.recordId}: ${w.field} - ${w.issue}`));

        if (config.migrationMode === 'validate') {
          report.endTime = new Date().toISOString();
          return report;
        }
      }

      // Process data in batches
      const batches = this.createBatches(timetradeData, config.batchSize);

      for (const batch of batches) {
        await this.processBatch(batch, config, report);
      }

      report.endTime = new Date().toISOString();

      // Log migration completion
      await this.auditService.logAction(
        'system',
        performedBy,
        'admin',
        AuditAction.IMPORT,
        AuditResourceType.SYSTEM,
        {
          migrationId,
          success: report.failedMigrations === 0,
          summary: {
            successful: report.successfulMigrations,
            failed: report.failedMigrations,
            skipped: report.skippedRecords
          }
        },
        {
          ipAddress: 'system',
          userAgent: 'timetrade-migration',
          sessionId: migrationId
        }
      );

      return report;

    } catch (error) {
      report.endTime = new Date().toISOString();
      report.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log migration failure
      await this.auditService.logAction(
        'system',
        performedBy,
        'admin',
        AuditAction.IMPORT,
        AuditResourceType.SYSTEM,
        {
          migrationId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        {
          ipAddress: 'system',
          userAgent: 'timetrade-migration',
          sessionId: migrationId
        }
      );

      throw error;
    }
  }

  async syncWithTimeTrade(
    timetradeData: TimeTradeAppointment[],
    lastSyncDate: string,
    performedBy: string
  ): Promise<{
    newAppointments: number;
    updatedAppointments: number;
    cancelledAppointments: number;
    errors: string[];
  }> {
    const syncResult = {
      newAppointments: 0,
      updatedAppointments: 0,
      cancelledAppointments: 0,
      errors: []
    };

    try {
      // Filter data to only changes since last sync
      const recentChanges = timetradeData.filter(appointment => 
        new Date(appointment.createdAt) > new Date(lastSyncDate)
      );

      for (const timetradeAppointment of recentChanges) {
        try {
          // Check if appointment already exists
          const existingAppointment = await this.findExistingAppointment(timetradeAppointment);

          if (existingAppointment) {
            // Update existing appointment
            const updated = await this.updateExistingAppointment(existingAppointment.id, timetradeAppointment);
            if (updated) {
              syncResult.updatedAppointments++;
            }
          } else {
            // Create new appointment
            const created = await this.createAppointmentFromTimeTrade(timetradeAppointment, {
              batchSize: 50,
              validateDataQuality: true,
              skipDuplicates: true,
              createRepresentatives: true,
              preserveOriginalIds: true,
              migrationMode: 'sync'
            });
            if (created) {
              syncResult.newAppointments++;
            }
          }

        } catch (error) {
          (syncResult.errors as string[]).push(`Failed to sync appointment ${timetradeAppointment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Log sync completion
      await this.auditService.logAction(
        'system',
        performedBy,
        'admin',
        AuditAction.CALENDAR_SYNC,
        AuditResourceType.SYSTEM,
        {
          syncType: 'timetrade_sync',
          recordsProcessed: recentChanges.length,
          newAppointments: syncResult.newAppointments,
          updatedAppointments: syncResult.updatedAppointments,
          errors: syncResult.errors.length
        },
        {
          ipAddress: 'system',
          userAgent: 'timetrade-sync',
          sessionId: `sync_${Date.now()}`
        }
      );

      return syncResult;

    } catch (error) {
      (syncResult.errors as string[]).push(`Sync operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return syncResult;
    }
  }

  // =====================================================
  // DATA PROCESSING METHODS
  // =====================================================

  private async processBatch(
    batch: TimeTradeAppointment[],
    config: MigrationConfig,
    report: MigrationReport
  ): Promise<void> {
    for (const timetradeAppointment of batch) {
      try {
        // Check for duplicates if enabled
        if (config.skipDuplicates) {
          const existing = await this.findExistingAppointment(timetradeAppointment);
          if (existing) {
            report.duplicatesFound++;
            report.skippedRecords++;
            continue;
          }
        }

        // Create or find pharmaceutical representative
        let _repId: string;
        if (config.createRepresentatives) {
          _repId = await this.createOrFindRepresentative(timetradeAppointment);
        } else {
          const existingRep = await this.db.getPharmaRepByEmail(timetradeAppointment.repEmail);
          if (!existingRep) {
            report.errors.push(`Representative not found: ${timetradeAppointment.repEmail}`);
            report.failedMigrations++;
            continue;
          }
          _repId = existingRep.id;
        }

        // Create appointment
        const appointmentId = await this.createAppointmentFromTimeTrade(timetradeAppointment, config);
        
        if (appointmentId) {
          report.successfulMigrations++;
          report.migratedAppointments.push(appointmentId);
        } else {
          report.failedMigrations++;
          report.errors.push(`Failed to create appointment for ${timetradeAppointment.repEmail}`);
        }

      } catch (error) {
        report.failedMigrations++;
        report.errors.push(`Error processing ${timetradeAppointment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async createAppointmentFromTimeTrade(
    timetradeAppointment: TimeTradeAppointment,
    _config: MigrationConfig
  ): Promise<string | null> {
    try {
      // Find or create representative
      const rep = await this.createOrFindRepresentative(timetradeAppointment);

      // Create appointment
      const appointmentData = {
        activityId: 'timetrade-migration-activity', // Default activity for migrated appointments
        repId: rep,
        location: this.normalizeLocation(timetradeAppointment.location),
        locationAddress: timetradeAppointment.location, // Use location as address fallback
        appointmentDate: timetradeAppointment.appointmentDate,
        startTime: timetradeAppointment.startTime,
        endTime: timetradeAppointment.endTime,
        status: this.mapTimeTradeStatus(timetradeAppointment.status),
        approvalStatus: 'approved' as 'pending' | 'approved' | 'denied', // TimeTrade appointments are pre-approved
        specialRequests: timetradeAppointment.notes,
        participantCount: timetradeAppointment.attendeeCount || 1,
        bookingSource: 'timetrade_migration',
        confirmationSent: true, // Assume TimeTrade already sent confirmations
        reminderSent: false
      };

      const appointment = await this.db.createPharmaAppointment(appointmentData);
      return appointment.id;

    } catch (error) {
      throw new Error(`Failed to create appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createOrFindRepresentative(timetradeAppointment: TimeTradeAppointment): Promise<string> {
    // Check if representative already exists
    const existingRep = await this.db.getPharmaRepByEmail(timetradeAppointment.repEmail);
    if (existingRep) {
      return existingRep.id;
    }

    // Create new representative
    const repData = {
      email: timetradeAppointment.repEmail,
      firstName: this.extractFirstName(timetradeAppointment.repName),
      lastName: this.extractLastName(timetradeAppointment.repName),
      phoneNumber: timetradeAppointment.repPhone,
      companyName: timetradeAppointment.companyName,
      isActive: true,
      accountCreatedAt: new Date().toISOString(),
      notes: 'Migrated from TimeTrade',
      preferredLocations: [timetradeAppointment.location || 'unknown'],
      specialties: ['general']
    };

    const rep = await this.db.createPharmaRep(repData);
    return rep.id;
  }

  // =====================================================
  // DATA VALIDATION METHODS
  // =====================================================

  private async validateTimeTradeData(timetradeData: TimeTradeAppointment[]): Promise<DataValidationIssue[]> {
    const issues: DataValidationIssue[] = [];

    for (const appointment of timetradeData) {
      // Validate required fields
      if (!appointment.repEmail) {
        issues.push({
          recordId: appointment.id,
          field: 'repEmail',
          issue: 'Missing required field',
          severity: 'error',
          originalValue: appointment.repEmail
        });
      }

      if (!appointment.repName) {
        issues.push({
          recordId: appointment.id,
          field: 'repName',
          issue: 'Missing required field',
          severity: 'error',
          originalValue: appointment.repName
        });
      }

      if (!appointment.companyName) {
        issues.push({
          recordId: appointment.id,
          field: 'companyName',
          issue: 'Missing required field',
          severity: 'error',
          originalValue: appointment.companyName
        });
      }

      // Validate email format
      if (appointment.repEmail && !this.isValidEmail(appointment.repEmail)) {
        issues.push({
          recordId: appointment.id,
          field: 'repEmail',
          issue: 'Invalid email format',
          severity: 'error',
          originalValue: appointment.repEmail
        });
      }

      // Validate date format
      if (!this.isValidDate(appointment.appointmentDate)) {
        issues.push({
          recordId: appointment.id,
          field: 'appointmentDate',
          issue: 'Invalid date format',
          severity: 'error',
          originalValue: appointment.appointmentDate
        });
      }

      // Validate location
      if (!this.isValidLocation(appointment.location)) {
        issues.push({
          recordId: appointment.id,
          field: 'location',
          issue: 'Unknown location',
          severity: 'warning',
          originalValue: appointment.location,
          suggestedFix: this.suggestLocationFix(appointment.location)
        });
      }

      // Check for appointments in the past
      const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
      if (appointmentDateTime < new Date()) {
        issues.push({
          recordId: appointment.id,
          field: 'appointmentDate',
          issue: 'Appointment is in the past',
          severity: 'warning',
          originalValue: appointment.appointmentDate
        });
      }
    }

    return issues;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private async findExistingAppointment(timetradeAppointment: TimeTradeAppointment): Promise<any> {
    // Try to find by original TimeTrade ID first
    const appointments = await this.db.getPharmaAppointments({ limit: 100 });
    
    return appointments.find(apt => 
      // apt.originalTimeTradeId === timetradeAppointment.id || // Field doesn't exist
      (apt.appointmentDate === timetradeAppointment.appointmentDate &&
       apt.startTime === timetradeAppointment.startTime &&
       apt.location === this.normalizeLocation(timetradeAppointment.location))
    );
  }

  private async updateExistingAppointment(appointmentId: string, timetradeAppointment: TimeTradeAppointment): Promise<boolean> {
    try {
      const updateData = {
        status: this.mapTimeTradeStatus(timetradeAppointment.status),
        specialRequests: timetradeAppointment.notes,
        participantCount: timetradeAppointment.attendeeCount || 1
      };

      await this.db.updatePharmaAppointment(appointmentId, updateData);
      return true;
    } catch (error) {
      return false;
    }
  }

  private normalizeLocation(location: string): string {
    const locationMap: Record<string, string> = {
      'ann arbor': 'Ann Arbor',
      'plymouth': 'Plymouth',
      'wixom': 'Wixom'
    };

    const normalized = location.toLowerCase().trim();
    return locationMap[normalized] || location;
  }

  private mapTimeTradeStatus(timetradeStatus: string): 'pending' | 'confirmed' | 'cancelled' | 'completed' {
    const statusMap: Record<string, string> = {
      'confirmed': 'confirmed',
      'cancelled': 'cancelled',
      'completed': 'completed'
    };

    return (statusMap[timetradeStatus] || 'pending') as 'pending' | 'confirmed' | 'cancelled' | 'completed';
  }

  private extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    return parts[0] || '';
  }

  private extractLastName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    return parts.slice(1).join(' ') || '';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  private isValidLocation(location: string): boolean {
    const validLocations = ['Ann Arbor', 'Plymouth', 'Wixom'];
    return validLocations.includes(this.normalizeLocation(location));
  }

  private suggestLocationFix(location: string): string {
    const suggestions: Record<string, string> = {
      'aa': 'Ann Arbor',
      'a2': 'Ann Arbor',
      'annarbor': 'Ann Arbor',
      'plymouth mi': 'Plymouth',
      'wixom mi': 'Wixom'
    };

    const key = location.toLowerCase().replace(/[^\w]/g, '');
    return suggestions[key] || 'Ann Arbor';
  }

  // =====================================================
  // EXPORT METHODS FOR BACKUP
  // =====================================================

  async exportToTimeTradeFormat(): Promise<TimeTradeAppointment[]> {
    try {
      const appointments = await this.db.getPharmaAppointments({ limit: 10000 });
      
      return appointments.map(appointment => ({
        id: appointment.id, // originalTimeTradeId field doesn't exist
        repName: `${appointment.repId}`, // Would need to join with rep data
        companyName: 'Unknown', // Would need to join with rep data
        repEmail: 'unknown@example.com', // Would need to join with rep data
        repPhone: undefined,
        location: appointment.location,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status as 'confirmed' | 'cancelled' | 'completed',
        createdAt: appointment.createdAt,
        notes: appointment.specialRequests,
        attendeeCount: appointment.participantCount
      }));

    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}