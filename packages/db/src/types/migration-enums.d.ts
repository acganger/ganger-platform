/**
 * Migration Enums and Types
 * Backward-compatible enums for database schema migration
 * Phase 2: Shared Package Migration
 */
export declare const StatusMapping: {
    readonly TICKET_STATUS: {
        readonly 'Pending Approval': "pending";
        readonly pending_approval: "pending";
        readonly 'In Progress': "in_progress";
        readonly in_progress: "in_progress";
        readonly Completed: "completed";
        readonly completed: "completed";
        readonly Stalled: "in_progress";
        readonly stalled: "in_progress";
        readonly Open: "open";
        readonly open: "open";
        readonly Resolved: "completed";
        readonly resolved: "completed";
        readonly Closed: "completed";
        readonly closed: "completed";
        readonly approved: "approved";
        readonly denied: "denied";
        readonly cancelled: "cancelled";
    };
    readonly EMPLOYEE_STATUS: {
        readonly active: "active";
        readonly inactive: "inactive";
        readonly terminated: "terminated";
        readonly on_leave: "on_leave";
    };
    readonly SCHEDULE_STATUS: {
        readonly scheduled: "scheduled";
        readonly confirmed: "confirmed";
        readonly in_progress: "in_progress";
        readonly completed: "completed";
        readonly cancelled: "cancelled";
        readonly no_show: "no_show";
    };
    readonly AVAILABILITY_TYPE: {
        readonly available: "available";
        readonly unavailable: "unavailable";
        readonly preferred: "preferred";
        readonly conditional: "conditional";
    };
};
export declare const TableMapping: {
    readonly staff_tickets: "tickets";
    readonly staff_notifications: "notifications";
    readonly staff_user_profiles: "profiles";
    readonly staff_members: "profiles";
    readonly staff_availability: "staff_availability";
    readonly staff_schedules: "staff_schedules";
    readonly staff_permissions: "app_permissions";
};
export declare const ColumnMapping: {
    readonly employee_status: "status";
    readonly submitter_email: "created_by";
    readonly form_type: "type";
    readonly assigned_to_email: "assigned_to";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export declare const ReverseStatusMapping: {
    readonly TICKET_STATUS: {
        [k: string]: string;
    };
    readonly EMPLOYEE_STATUS: {
        [k: string]: string;
    };
    readonly SCHEDULE_STATUS: {
        [k: string]: string;
    };
    readonly AVAILABILITY_TYPE: {
        [k: string]: string;
    };
};
export type OldTicketStatus = keyof typeof StatusMapping.TICKET_STATUS;
export type NewTicketStatus = typeof StatusMapping.TICKET_STATUS[OldTicketStatus];
export type OldEmployeeStatus = keyof typeof StatusMapping.EMPLOYEE_STATUS;
export type NewEmployeeStatus = typeof StatusMapping.EMPLOYEE_STATUS[OldEmployeeStatus];
export type OldScheduleStatus = keyof typeof StatusMapping.SCHEDULE_STATUS;
export type NewScheduleStatus = typeof StatusMapping.SCHEDULE_STATUS[OldScheduleStatus];
export type OldAvailabilityType = keyof typeof StatusMapping.AVAILABILITY_TYPE;
export type NewAvailabilityType = typeof StatusMapping.AVAILABILITY_TYPE[OldAvailabilityType];
export type OldTableName = keyof typeof TableMapping;
export type NewTableName = typeof TableMapping[OldTableName];
export declare class MigrationHelpers {
    /**
     * Convert old status value to new status value
     */
    static convertTicketStatus(oldStatus: string): string;
    static convertEmployeeStatus(oldStatus: string): string;
    static convertScheduleStatus(oldStatus: string): string;
    static convertAvailabilityType(oldType: string): string;
    /**
     * Convert new status value back to old status value (for backward compatibility)
     */
    static revertTicketStatus(newStatus: string): string;
    static revertEmployeeStatus(newStatus: string): string;
    static revertScheduleStatus(newStatus: string): string;
    static revertAvailabilityType(newType: string): string;
    /**
     * Convert old table name to new table name
     */
    static convertTableName(oldTable: string): string;
    /**
     * Check if table name is being migrated
     */
    static isTableBeingMigrated(tableName: string): boolean;
    /**
     * Get all status values that need migration for a given type
     */
    static getStatusValuesForMigration(type: 'ticket' | 'employee' | 'schedule' | 'availability'): {
        old: string;
        new: string;
    }[];
    /**
     * Validate that a status value is valid for the new schema
     */
    static isValidNewStatus(status: string, type: 'ticket' | 'employee' | 'schedule' | 'availability'): boolean;
    /**
     * Generate migration SQL for status value updates
     */
    static generateStatusMigrationSQL(tableName: string, columnName: string, type: 'ticket' | 'employee' | 'schedule' | 'availability'): string;
}
export declare function isOldTicketStatus(status: string): status is OldTicketStatus;
export declare function isNewTicketStatus(status: string): status is NewTicketStatus;
export declare function isOldEmployeeStatus(status: string): status is OldEmployeeStatus;
export declare function isNewEmployeeStatus(status: string): status is NewEmployeeStatus;
