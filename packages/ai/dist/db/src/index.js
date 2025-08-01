"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePartial = exports.validateOrThrow = exports.queryOptionsSchema = exports.createAppointmentSchema = exports.appointmentSchema = exports.createPatientSchema = exports.patientSchema = exports.createHandoutTemplateSchema = exports.handoutTemplateSchema = exports.createInventoryItemSchema = exports.inventoryItemSchema = exports.createFileUploadSchema = exports.fileUploadSchema = exports.createNotificationSchema = exports.notificationSchema = exports.createAuditLogSchema = exports.auditLogSchema = exports.updateLocationSchema = exports.createLocationSchema = exports.locationSchema = exports.updateUserSchema = exports.createUserSchema = exports.userSchema = exports.baseEntitySchema = exports.PharmaSchedulingQueries = exports.ClinicalStaffingQueries = exports.auditLogger = exports.auditLogQueries = exports.locationQueries = exports.userQueries = exports.BaseRepository = exports.db = exports.connectionMonitor = exports.dbConfig = exports.checkDatabaseHealth = exports.supabaseAdmin = exports.supabase = void 0;
// Database client exports
var client_1 = require("./client");
Object.defineProperty(exports, "supabase", { enumerable: true, get: function () { return client_1.supabase; } });
Object.defineProperty(exports, "supabaseAdmin", { enumerable: true, get: function () { return client_1.supabaseAdmin; } });
Object.defineProperty(exports, "checkDatabaseHealth", { enumerable: true, get: function () { return client_1.checkDatabaseHealth; } });
Object.defineProperty(exports, "dbConfig", { enumerable: true, get: function () { return client_1.dbConfig; } });
Object.defineProperty(exports, "connectionMonitor", { enumerable: true, get: function () { return client_1.connectionMonitor; } });
// Export a unified database interface for query operations
const client_2 = require("./client");
exports.db = {
    query: async (text, params) => {
        const { data, error } = await client_2.supabaseAdmin.rpc('execute_query', {
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
var base_repository_1 = require("./utils/base-repository");
Object.defineProperty(exports, "BaseRepository", { enumerable: true, get: function () { return base_repository_1.BaseRepository; } });
// Query modules
var users_1 = require("./queries/users");
Object.defineProperty(exports, "userQueries", { enumerable: true, get: function () { return users_1.userQueries; } });
var locations_1 = require("./queries/locations");
Object.defineProperty(exports, "locationQueries", { enumerable: true, get: function () { return locations_1.locationQueries; } });
var audit_logs_1 = require("./queries/audit-logs");
Object.defineProperty(exports, "auditLogQueries", { enumerable: true, get: function () { return audit_logs_1.auditLogQueries; } });
Object.defineProperty(exports, "auditLogger", { enumerable: true, get: function () { return audit_logs_1.auditLogger; } });
// Additional query classes
var clinical_staffing_1 = require("./queries/clinical-staffing");
Object.defineProperty(exports, "ClinicalStaffingQueries", { enumerable: true, get: function () { return clinical_staffing_1.ClinicalStaffingQueries; } });
var pharmaceutical_scheduling_1 = require("./queries/pharmaceutical-scheduling");
Object.defineProperty(exports, "PharmaSchedulingQueries", { enumerable: true, get: function () { return pharmaceutical_scheduling_1.PharmaSchedulingQueries; } });
// Validation schemas
var validation_1 = require("./schemas/validation");
Object.defineProperty(exports, "baseEntitySchema", { enumerable: true, get: function () { return validation_1.baseEntitySchema; } });
Object.defineProperty(exports, "userSchema", { enumerable: true, get: function () { return validation_1.userSchema; } });
Object.defineProperty(exports, "createUserSchema", { enumerable: true, get: function () { return validation_1.createUserSchema; } });
Object.defineProperty(exports, "updateUserSchema", { enumerable: true, get: function () { return validation_1.updateUserSchema; } });
Object.defineProperty(exports, "locationSchema", { enumerable: true, get: function () { return validation_1.locationSchema; } });
Object.defineProperty(exports, "createLocationSchema", { enumerable: true, get: function () { return validation_1.createLocationSchema; } });
Object.defineProperty(exports, "updateLocationSchema", { enumerable: true, get: function () { return validation_1.updateLocationSchema; } });
Object.defineProperty(exports, "auditLogSchema", { enumerable: true, get: function () { return validation_1.auditLogSchema; } });
Object.defineProperty(exports, "createAuditLogSchema", { enumerable: true, get: function () { return validation_1.createAuditLogSchema; } });
Object.defineProperty(exports, "notificationSchema", { enumerable: true, get: function () { return validation_1.notificationSchema; } });
Object.defineProperty(exports, "createNotificationSchema", { enumerable: true, get: function () { return validation_1.createNotificationSchema; } });
Object.defineProperty(exports, "fileUploadSchema", { enumerable: true, get: function () { return validation_1.fileUploadSchema; } });
Object.defineProperty(exports, "createFileUploadSchema", { enumerable: true, get: function () { return validation_1.createFileUploadSchema; } });
Object.defineProperty(exports, "inventoryItemSchema", { enumerable: true, get: function () { return validation_1.inventoryItemSchema; } });
Object.defineProperty(exports, "createInventoryItemSchema", { enumerable: true, get: function () { return validation_1.createInventoryItemSchema; } });
Object.defineProperty(exports, "handoutTemplateSchema", { enumerable: true, get: function () { return validation_1.handoutTemplateSchema; } });
Object.defineProperty(exports, "createHandoutTemplateSchema", { enumerable: true, get: function () { return validation_1.createHandoutTemplateSchema; } });
Object.defineProperty(exports, "patientSchema", { enumerable: true, get: function () { return validation_1.patientSchema; } });
Object.defineProperty(exports, "createPatientSchema", { enumerable: true, get: function () { return validation_1.createPatientSchema; } });
Object.defineProperty(exports, "appointmentSchema", { enumerable: true, get: function () { return validation_1.appointmentSchema; } });
Object.defineProperty(exports, "createAppointmentSchema", { enumerable: true, get: function () { return validation_1.createAppointmentSchema; } });
Object.defineProperty(exports, "queryOptionsSchema", { enumerable: true, get: function () { return validation_1.queryOptionsSchema; } });
Object.defineProperty(exports, "validateOrThrow", { enumerable: true, get: function () { return validation_1.validateOrThrow; } });
Object.defineProperty(exports, "validatePartial", { enumerable: true, get: function () { return validation_1.validatePartial; } });
