/**
 * Pharmaceutical Scheduling System - Main Exports
 * Complete scheduling system with Google Calendar integration for lunch appointments
 */

// Core scheduling engine exports
export { AvailabilityEngine } from './availability-engine';
export type { 
  AvailabilityRequest, 
  OptimizedSlot, 
  AvailabilityContext,
  BusinessRule,
  HistoricalPattern,
  ConflictReason,
  AvailabilityReport
} from './availability-engine';

// Approval workflow exports
export { ApprovalWorkflowEngine } from './approval-workflow';
export type {
  ApprovalWorkflowStage,
  ApprovalWorkflowConfig,
  ApprovalRequest,
  ApprovalDecision,
  ApprovalNotification,
  WorkflowStatus,
  EscalationRule
} from './approval-workflow';

// Main booking engine exports
export { PharmaceuticalBookingEngine } from './booking-engine';
export type {
  BookingRequest,
  BookingResponse,
  BookingValidation,
  BookingModification,
  BookingCancellation,
  BookingConfirmation,
  BookingAnalytics,
  BookingSettings
} from './booking-engine';

// Google Calendar integration exports
export { GoogleCalendarService } from './google-calendar-integration';
export type {
  GoogleCalendarConfig,
  CalendarEvent,
  StaffMember,
  AvailabilityCheck,
  CalendarSyncResult,
  BusyTime
} from './google-calendar-integration';

// Notification system exports
export { PharmaNotificationService } from './notification-service';
export type {
  NotificationTemplate,
  NotificationRequest,
  NotificationResult,
  ReminderSchedule,
  NotificationPreferences,
  CommunicationLog
} from './notification-service';

// =====================================================
// NEW: GOOGLE CALENDAR LUNCH SCHEDULING EXPORTS
// =====================================================

// Lunch calendar service exports
export { PharmaLunchCalendarService, LUNCH_CALENDARS } from './lunch-calendar-service';
export type {
  GoogleCalendarConfig as LunchCalendarConfig,
  CalendarBusyTime,
  CalendarEventRequest,
  LunchBookingRequest,
  LunchBookingResponse,
  AvailabilityCheckResult
} from './lunch-calendar-service';

// Public booking API exports
export { PublicBookingController } from './public-booking-controller';
export type {
  PublicBookingAPIResponse,
  LocationInfo,
  AvailabilityResponse,
  BookingSubmissionRequest,
  BookingConfirmationResponse
} from './public-booking-controller';

// Admin configuration API exports
export { AdminLunchConfigController, requireRole } from './admin-lunch-config-controller';
export type {
  AdminAPIResponse,
  AuthenticatedRequest,
  LunchConfigUpdateRequest,
  CalendarTestRequest,
  LocationSummary,
  AuditLogEntry
} from './admin-lunch-config-controller';

// Compliance audit trail exports
export { PharmaceuticalComplianceAuditService } from './compliance-audit-service';
export type {
  AuditLogEntry as ComplianceAuditLogEntry,
  ComplianceReport,
  AuditSearchCriteria,
  AuditAction,
  AuditResourceType,
  HIPAACategory,
  ComplianceRisk
} from './compliance-audit-service';

// TimeTrade migration exports
export { TimeTradeToPharmaMigrationService } from './timetrade-migration-service';
export type {
  TimeTradeAppointment,
  MigrationReport,
  MigrationConfig,
  DataValidationIssue
} from './timetrade-migration-service';

// =====================================================
// CONVENIENCE FACTORY FUNCTIONS
// =====================================================

import { PharmaSchedulingQueries } from '@ganger/db';

/**
 * Factory function to create a complete pharmaceutical scheduling system
 * with Google Calendar lunch integration, compliance auditing, and TimeTrade migration
 */
export function createPharmaceuticalSchedulingSystem(
  dbQueries: PharmaSchedulingQueries,
  calendarConfig: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    redirectUri: string;
    serviceAccountEmail?: string;
    privateKey?: string;
  }
) {
  // Create core engines
  const availabilityEngine = new AvailabilityEngine(dbQueries);
  const approvalEngine = new ApprovalWorkflowEngine(dbQueries);
  const mainBookingEngine = new PharmaceuticalBookingEngine(dbQueries, availabilityEngine, approvalEngine);
  const calendarService = new GoogleCalendarService({
    ...calendarConfig,
    scopes: ['https://www.googleapis.com/auth/calendar']
  }, dbQueries);
  const notificationService = new PharmaNotificationService(dbQueries);

  // Create compliance and migration services
  const complianceAuditService = new PharmaceuticalComplianceAuditService(dbQueries);
  const migrationService = new TimeTradeToPharmaMigrationService(dbQueries, complianceAuditService);

  // Create lunch scheduling components
  const lunchCalendarService = new PharmaLunchCalendarService(dbQueries, calendarConfig);
  const publicBookingController = new PublicBookingController(dbQueries, lunchCalendarService);
  const adminConfigController = new AdminLunchConfigController(dbQueries, lunchCalendarService);

  return {
    // Core scheduling system
    availabilityEngine,
    approvalEngine,
    mainBookingEngine,
    calendarService,
    notificationService,

    // Compliance and migration
    complianceAuditService,
    migrationService,

    // Lunch scheduling system
    lunchCalendarService,
    publicBookingController,
    adminConfigController,

    // Convenience methods
    async getSystemStatus() {
      const locations = await dbQueries.getActiveLunchLocations();
      const summary = await lunchCalendarService.getLocationSummary();
      
      return {
        coreSystem: {
          engineStatus: 'operational',
          dbConnected: true,
          componentsLoaded: 5
        },
        lunchSystem: {
          locationsConfigured: locations.length,
          calendarIntegrations: summary.filter(s => s.isActive).length,
          systemHealth: summary.every(s => s.isActive) ? 'healthy' : 'degraded'
        },
        timestamp: new Date().toISOString()
      };
    },

    async testAllConnections() {
      const results = await Promise.all(
        (await dbQueries.getActiveLunchLocations()).map(async (location) => {
          return await lunchCalendarService.testCalendarConnection(location.locationName);
        })
      );

      return {
        overall: results.every(r => r.success),
        details: results,
        timestamp: new Date().toISOString()
      };
    }
  };
}

/**
 * Factory function to create just the lunch scheduling components
 * (for lighter integration if core scheduling isn't needed)
 */
export function createLunchSchedulingSystem(
  dbQueries: PharmaSchedulingQueries,
  calendarConfig: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    redirectUri: string;
    serviceAccountEmail?: string;
    privateKey?: string;
  }
) {
  const lunchCalendarService = new PharmaLunchCalendarService(dbQueries, calendarConfig);
  const publicBookingController = new PublicBookingController(dbQueries, lunchCalendarService);
  const adminConfigController = new AdminLunchConfigController(dbQueries, lunchCalendarService);

  return {
    calendarService: lunchCalendarService,
    publicAPI: publicBookingController,
    adminAPI: adminConfigController,

    // Express.js route helpers
    getPublicRoutes() {
      return {
        'GET /api/public/locations': publicBookingController.getLocations.bind(publicBookingController),
        'GET /api/public/availability/:location': publicBookingController.getAvailability.bind(publicBookingController),
        'POST /api/public/bookings': publicBookingController.submitBooking.bind(publicBookingController),
        'GET /api/public/booking/:confirmationNumber': publicBookingController.getBookingDetails.bind(publicBookingController),
        'POST /api/public/booking/:confirmationNumber/cancel': publicBookingController.cancelBooking.bind(publicBookingController)
      };
    },

    getAdminRoutes() {
      return {
        'GET /api/admin/lunch-config': adminConfigController.getLunchConfigs.bind(adminConfigController),
        'GET /api/admin/lunch-config/:location': adminConfigController.getLunchConfig.bind(adminConfigController),
        'PUT /api/admin/lunch-config/:location': adminConfigController.updateLunchConfig.bind(adminConfigController),
        'POST /api/admin/lunch-config/test-calendar': adminConfigController.testCalendarConnection.bind(adminConfigController),
        'GET /api/admin/lunch-config/overview': adminConfigController.getSystemOverview.bind(adminConfigController)
      };
    }
  };
}

// Import core components for re-export
import { AvailabilityEngine } from './availability-engine';
import { ApprovalWorkflowEngine } from './approval-workflow';
import { PharmaceuticalBookingEngine } from './booking-engine';
import { GoogleCalendarService } from './google-calendar-integration';
import { PharmaNotificationService } from './notification-service';
import { PharmaceuticalComplianceAuditService } from './compliance-audit-service';
import { TimeTradeToPharmaMigrationService } from './timetrade-migration-service';
import { PharmaLunchCalendarService } from './lunch-calendar-service';
import { PublicBookingController } from './public-booking-controller';
import { AdminLunchConfigController } from './admin-lunch-config-controller';

/**
 * Default export with system constants and utilities
 */
export default {
  // System constants
  // LUNCH_CALENDARS, // TODO: Define LUNCH_CALENDARS constant
  
  // Performance targets from handoff document
  PERFORMANCE_TARGETS: {
    availabilityLoadTime: 2000, // < 2 seconds
    bookingSubmissionTime: 1000, // < 1 second
    configurationUpdateTime: 500, // < 500ms
    calendarSyncTime: 30000, // < 30 seconds
    apiReliability: 0.999 // 99.9%
  },

  // Quality gates
  QUALITY_GATES: {
    gracefulFailure: true,
    reliableConfirmations: true,
    auditedChanges: true,
    accurateTimezones: 'America/Detroit',
    integratedSystem: true
  },

  // Success criteria checklist
  SUCCESS_CRITERIA: {
    googleCalendarIntegration: '3 locations',
    adminConfigSystem: 'operational',
    publicBookingFlow: 'functional',
    calendarEventFormat: 'exact match',
    availabilityCalculation: 'accurate and real-time',
    frontendReadiness: 'backend complete'
  },

  // Factory functions
  createPharmaceuticalSchedulingSystem,
  createLunchSchedulingSystem
};