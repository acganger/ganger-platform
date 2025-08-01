// Database client exports
export { supabase, supabaseAdmin, checkDatabaseHealth, dbConfig, connectionMonitor } from './client';
// Export a unified database interface for query operations
import { supabaseAdmin } from './client';
export const db = {
    query: async (text, params) => {
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
export { StandardizedProductsRepository, PurchaseRequestsRepository, VendorManagementRepository, VendorConfigurationsRepository, VendorPricesRepository, VendorContractsRepository, UsageHistoryRepository, ConsolidatedOrdersRepository, 
// Validation schemas
standardizedProductSchema, purchaseRequestItemSchema, createPurchaseRequestSchema, vendorConfigurationSchema, consolidatedOrderItemSchema, createConsolidatedOrderSchema } from './repositories/ai-purchasing';
// Validation schemas
export { baseEntitySchema, userSchema, createUserSchema, updateUserSchema, locationSchema, createLocationSchema, updateLocationSchema, auditLogSchema, createAuditLogSchema, notificationSchema, createNotificationSchema, fileUploadSchema, createFileUploadSchema, inventoryItemSchema, createInventoryItemSchema, handoutTemplateSchema, createHandoutTemplateSchema, patientSchema, createPatientSchema, appointmentSchema, createAppointmentSchema, queryOptionsSchema, validateOrThrow, validatePartial, } from './schemas/validation';
