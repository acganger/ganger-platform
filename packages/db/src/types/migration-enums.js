/**
 * Migration Enums and Types
 * Backward-compatible enums for database schema migration
 * Phase 2: Shared Package Migration
 */
// Status value mappings for backward compatibility
export const StatusMapping = {
    // Ticket Status Migration
    TICKET_STATUS: {
        // Old values -> New values
        'Pending Approval': 'pending',
        'pending_approval': 'pending',
        'In Progress': 'in_progress',
        'in_progress': 'in_progress',
        'Completed': 'completed',
        'completed': 'completed',
        'Stalled': 'in_progress',
        'stalled': 'in_progress',
        'Open': 'open',
        'open': 'open',
        'Resolved': 'completed',
        'resolved': 'completed',
        'Closed': 'completed',
        'closed': 'completed',
        'approved': 'approved',
        'denied': 'denied',
        'cancelled': 'cancelled'
    },
    // Staff Status Migration  
    EMPLOYEE_STATUS: {
        'active': 'active',
        'inactive': 'inactive',
        'terminated': 'terminated',
        'on_leave': 'on_leave'
    },
    // Schedule Status Migration
    SCHEDULE_STATUS: {
        'scheduled': 'scheduled',
        'confirmed': 'confirmed',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'no_show': 'no_show'
    },
    // Availability Type Migration
    AVAILABILITY_TYPE: {
        'available': 'available',
        'unavailable': 'unavailable',
        'preferred': 'preferred',
        'conditional': 'conditional'
    }
};
// Table name mappings for migration
export const TableMapping = {
    // Old table names -> New table names
    'staff_tickets': 'tickets',
    'staff_notifications': 'notifications', // Will be removed
    'staff_user_profiles': 'profiles',
    'staff_members': 'profiles', // Consolidated into profiles
    'staff_availability': 'staff_availability', // Keeping same name
    'staff_schedules': 'staff_schedules', // Keeping same name
    'staff_permissions': 'app_permissions'
};
// Column mappings for migration
export const ColumnMapping = {
    // Common column name standardizations
    'employee_status': 'status',
    'submitter_email': 'created_by',
    'form_type': 'type',
    'assigned_to_email': 'assigned_to',
    'created_at': 'created_at',
    'updated_at': 'updated_at'
};
// Reverse mappings for backward compatibility
export const ReverseStatusMapping = {
    TICKET_STATUS: Object.fromEntries(Object.entries(StatusMapping.TICKET_STATUS).map(([old, new_]) => [new_, old])),
    EMPLOYEE_STATUS: Object.fromEntries(Object.entries(StatusMapping.EMPLOYEE_STATUS).map(([old, new_]) => [new_, old])),
    SCHEDULE_STATUS: Object.fromEntries(Object.entries(StatusMapping.SCHEDULE_STATUS).map(([old, new_]) => [new_, old])),
    AVAILABILITY_TYPE: Object.fromEntries(Object.entries(StatusMapping.AVAILABILITY_TYPE).map(([old, new_]) => [new_, old]))
};
// Migration helper functions
export class MigrationHelpers {
    /**
     * Convert old status value to new status value
     */
    static convertTicketStatus(oldStatus) {
        return StatusMapping.TICKET_STATUS[oldStatus] || oldStatus;
    }
    static convertEmployeeStatus(oldStatus) {
        return StatusMapping.EMPLOYEE_STATUS[oldStatus] || oldStatus;
    }
    static convertScheduleStatus(oldStatus) {
        return StatusMapping.SCHEDULE_STATUS[oldStatus] || oldStatus;
    }
    static convertAvailabilityType(oldType) {
        return StatusMapping.AVAILABILITY_TYPE[oldType] || oldType;
    }
    /**
     * Convert new status value back to old status value (for backward compatibility)
     */
    static revertTicketStatus(newStatus) {
        return ReverseStatusMapping.TICKET_STATUS[newStatus] || newStatus;
    }
    static revertEmployeeStatus(newStatus) {
        return ReverseStatusMapping.EMPLOYEE_STATUS[newStatus] || newStatus;
    }
    static revertScheduleStatus(newStatus) {
        return ReverseStatusMapping.SCHEDULE_STATUS[newStatus] || newStatus;
    }
    static revertAvailabilityType(newType) {
        return ReverseStatusMapping.AVAILABILITY_TYPE[newType] || newType;
    }
    /**
     * Convert old table name to new table name
     */
    static convertTableName(oldTable) {
        return TableMapping[oldTable] || oldTable;
    }
    /**
     * Check if table name is being migrated
     */
    static isTableBeingMigrated(tableName) {
        return Object.keys(TableMapping).includes(tableName);
    }
    /**
     * Get all status values that need migration for a given type
     */
    static getStatusValuesForMigration(type) {
        switch (type) {
            case 'ticket':
                return Object.entries(StatusMapping.TICKET_STATUS).map(([old, new_]) => ({ old, new: new_ }));
            case 'employee':
                return Object.entries(StatusMapping.EMPLOYEE_STATUS).map(([old, new_]) => ({ old, new: new_ }));
            case 'schedule':
                return Object.entries(StatusMapping.SCHEDULE_STATUS).map(([old, new_]) => ({ old, new: new_ }));
            case 'availability':
                return Object.entries(StatusMapping.AVAILABILITY_TYPE).map(([old, new_]) => ({ old, new: new_ }));
            default:
                return [];
        }
    }
    /**
     * Validate that a status value is valid for the new schema
     */
    static isValidNewStatus(status, type) {
        switch (type) {
            case 'ticket':
                return Object.values(StatusMapping.TICKET_STATUS).includes(status);
            case 'employee':
                return Object.values(StatusMapping.EMPLOYEE_STATUS).includes(status);
            case 'schedule':
                return Object.values(StatusMapping.SCHEDULE_STATUS).includes(status);
            case 'availability':
                return Object.values(StatusMapping.AVAILABILITY_TYPE).includes(status);
            default:
                return false;
        }
    }
    /**
     * Generate migration SQL for status value updates
     */
    static generateStatusMigrationSQL(tableName, columnName, type) {
        const mappings = this.getStatusValuesForMigration(type);
        const cases = mappings.map(({ old, new: new_ }) => `WHEN '${old}' THEN '${new_}'`).join('\n        ');
        return `
-- Update ${columnName} values in ${tableName} table
UPDATE ${tableName} 
SET ${columnName} = CASE ${columnName}
        ${cases}
        ELSE ${columnName}
    END
WHERE ${columnName} IN (${mappings.map(({ old }) => `'${old}'`).join(', ')});
`;
    }
}
// Export type guards
export function isOldTicketStatus(status) {
    return Object.keys(StatusMapping.TICKET_STATUS).includes(status);
}
export function isNewTicketStatus(status) {
    return Object.values(StatusMapping.TICKET_STATUS).includes(status);
}
export function isOldEmployeeStatus(status) {
    return Object.keys(StatusMapping.EMPLOYEE_STATUS).includes(status);
}
export function isNewEmployeeStatus(status) {
    return Object.values(StatusMapping.EMPLOYEE_STATUS).includes(status);
}
