/**
 * Utilities Server Index
 * 
 * Re-exports all server-side utility functions for easy importing
 * across the clinical staffing system.
 */

// Import existing utilities (assuming they exist)
// export * from './audit-log'; // TODO: Create audit-log.ts file

// Secure Error Handling System
export {
  withSecureErrorHandler,
  generateRequestId,
  secureLogger,
  auditSecurityEvent,
  createValidationError,
  createBusinessRuleError,
  createRateLimitError,
  errorToResponse,
  redactSensitiveData,
  createStructuredError,
  type StructuredError,
  type ErrorResponse,
  ErrorSeverity,
  ErrorCategory
} from './secure-error-handler';

// Clinical Staffing Validation Utilities
export {
  validateStaffingData,
  validateScheduleConflicts,
  validateWorkingHoursLimits,
  validateRestTimeBetweenShifts,
  validateAvailabilityAlignment,
  validateScheduleBusinessRules,
  
  // Validation Schemas
  StaffMemberSchema,
  StaffScheduleSchema,
  StaffAvailabilitySchema,
  PhysicianSupportRequirementsSchema,
  ProviderScheduleCacheSchema,
  StaffingOptimizationRulesSchema,
  StaffingAnalyticsSchema,
  
  // Base Schemas
  TimeSchema,
  DateSchema,
  UUIDSchema,
  DaysOfWeekSchema,
  EmploymentStatusSchema,
  ScheduleTypeSchema,
  ScheduleStatusSchema,
  RoleTypeSchema,
  SkillLevelSchema,
  
  // Types
  type StaffMember,
  type StaffSchedule,
  type StaffAvailability,
  type PhysicianSupportRequirements,
  type ProviderScheduleCache,
  type StaffingOptimizationRules,
  type StaffingAnalytics
} from './staffing-validation';

// Clinical Staffing Business Logic Utilities
export {
  calculateOptimalStaffing,
  calculateStaffingMetrics,
  generateOptimizationSuggestions,
  autoApproveSchedules,
  calculateShiftPremium,
  generateStaffingForecast
} from './staffing-business-logic';

// Migration-Aware Staffing Business Logic
export {
  MigrationStaffingBusinessLogic,
  createMigrationStaffingBusinessLogic,
  migrationStaffingBusinessLogic,
  type MigrationStaffingConfig
} from './migration-staffing-business-logic';

// API Templates and Patterns
export {
  createApiRoute,
  createCrudRoutes,
  type ApiConfig,
  type ApiContext,
  type ApiHandler
} from './api-templates';

// API Error Handling
export {
  ApiError,
  ErrorCodes,
  CommonErrors,
  createErrorResponse,
  handleValidationError,
  mapDatabaseError,
  withErrorHandler
} from './api-error-handler';

// API Handler Utilities
export {
  createApiHandler,
  ApiErrors,
  validateBody,
  validateQuery,
  successResponse,
  errorResponse,
  type ApiRequest,
  type ApiResponse,
  type ApiHandlerOptions
} from './api-handler';

// Helper function for audit logging (placeholder if it doesn't exist)
export async function auditLog(params: {
  action: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
}): Promise<void> {
  try {
    // This would typically insert into an audit_logs table
    console.log('Audit Log:', {
      ...params,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}