// Database client exports
export { supabase, supabaseAdmin, checkDatabaseHealth, dbConfig, connectionMonitor } from './client';

// Export a unified database interface for query operations
import { supabaseAdmin } from './client';

export const db = {
  query: async (text: string, params?: any[]) => {
    const { data, error } = await supabaseAdmin.rpc('execute_query', {
      query_text: text,
      query_params: params || []
    });
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    return data || [];
  }
};

// Repository base class
export { BaseRepository } from './utils/base-repository';

// Query modules
export { userQueries } from './queries/users';
export { locationQueries } from './queries/locations';
export { auditLogQueries, auditLogger } from './queries/audit-logs';

// Additional query classes
export { ClinicalStaffingQueries } from './queries/clinical-staffing';
export { PharmaSchedulingQueries } from './queries/pharmaceutical-scheduling';

// AI Purchasing repositories
export {
  StandardizedProductsRepository,
  PurchaseRequestsRepository,
  VendorManagementRepository,
  ConsolidatedOrdersRepository,
  // Validation schemas
  standardizedProductSchema,
  purchaseRequestItemSchema,
  createPurchaseRequestSchema,
  vendorConfigurationSchema,
  consolidatedOrderItemSchema,
  createConsolidatedOrderSchema,
  // Types
  type CreateStandardizedProductInput
} from './repositories/ai-purchasing';

// Type definitions
export type {
  Database,
  BaseEntity,
  User,
  UserRole,
  Location,
  AuditLog,
  Permission,
  UserSession,
  FileUpload,
  Notification,
  NotificationType,
  InventoryItem,
  HandoutTemplate,
  Patient,
  Appointment,
  AppointmentStatus,
  QueryOptions,
  QueryResult,
  DatabaseError,
} from './types/database';

// Clinical Staffing Types
export type {
  StaffMember,
  StaffAvailability,
  StaffSchedule,
  ScheduleTemplate,
  CoverageRequirement,
  OptimizationRun,
  StaffMemberInsert,
  StaffAvailabilityInsert,
  StaffScheduleInsert,
  OptimalAssignment
} from './queries/clinical-staffing';

// Pharmaceutical Scheduling Types
export type {
  PharmaRepresentative,
  SchedulingActivity,
  LunchAvailabilityConfig,
  LunchTimeSlot,
  LunchBookingValidation,
  PharmaAppointment,
  AppointmentParticipant,
  AvailabilityOverride,
  PharmaAnalytics,
  AvailableSlot,
  ConflictCheck
} from './queries/pharmaceutical-scheduling';

// Validation schemas
export {
  baseEntitySchema,
  userSchema,
  createUserSchema,
  updateUserSchema,
  locationSchema,
  createLocationSchema,
  updateLocationSchema,
  auditLogSchema,
  createAuditLogSchema,
  notificationSchema,
  createNotificationSchema,
  fileUploadSchema,
  createFileUploadSchema,
  inventoryItemSchema,
  createInventoryItemSchema,
  handoutTemplateSchema,
  createHandoutTemplateSchema,
  patientSchema,
  createPatientSchema,
  appointmentSchema,
  createAppointmentSchema,
  queryOptionsSchema,
  validateOrThrow,
  validatePartial,
} from './schemas/validation';