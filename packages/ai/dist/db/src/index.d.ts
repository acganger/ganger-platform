export { supabase, supabaseAdmin, checkDatabaseHealth, dbConfig, connectionMonitor } from './client';
export declare const db: {
    query: (text: string, params?: any[]) => Promise<any>;
};
export { BaseRepository } from './utils/base-repository';
export { userQueries } from './queries/users';
export { locationQueries } from './queries/locations';
export { auditLogQueries, auditLogger } from './queries/audit-logs';
export { ClinicalStaffingQueries } from './queries/clinical-staffing';
export { PharmaSchedulingQueries } from './queries/pharmaceutical-scheduling';
export type { Database, BaseEntity, User, UserRole, Location, AuditLog, Permission, UserSession, FileUpload, Notification, NotificationType, InventoryItem, HandoutTemplate, Patient, Appointment, AppointmentStatus, QueryOptions, QueryResult, DatabaseError, } from './types/database';
export type { StaffMember, StaffAvailability, StaffSchedule, ScheduleTemplate, CoverageRequirement, OptimizationRun, StaffMemberInsert, StaffAvailabilityInsert, StaffScheduleInsert, OptimalAssignment } from './queries/clinical-staffing';
export type { PharmaRepresentative, SchedulingActivity, LunchAvailabilityConfig, LunchTimeSlot, LunchBookingValidation, PharmaAppointment, AppointmentParticipant, AvailabilityOverride, PharmaAnalytics, AvailableSlot, ConflictCheck } from './queries/pharmaceutical-scheduling';
export { baseEntitySchema, userSchema, createUserSchema, updateUserSchema, locationSchema, createLocationSchema, updateLocationSchema, auditLogSchema, createAuditLogSchema, notificationSchema, createNotificationSchema, fileUploadSchema, createFileUploadSchema, inventoryItemSchema, createInventoryItemSchema, handoutTemplateSchema, createHandoutTemplateSchema, patientSchema, createPatientSchema, appointmentSchema, createAppointmentSchema, queryOptionsSchema, validateOrThrow, validatePartial, } from './schemas/validation';
//# sourceMappingURL=index.d.ts.map