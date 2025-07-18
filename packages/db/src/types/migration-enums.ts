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
  } as const,

  // Staff Status Migration  
  EMPLOYEE_STATUS: {
    'active': 'active',
    'inactive': 'inactive', 
    'terminated': 'terminated',
    'on_leave': 'on_leave'
  } as const,

  // Schedule Status Migration
  SCHEDULE_STATUS: {
    'scheduled': 'scheduled',
    'confirmed': 'confirmed',
    'in_progress': 'in_progress',
    'completed': 'completed', 
    'cancelled': 'cancelled',
    'no_show': 'no_show'
  } as const,

  // Availability Type Migration
  AVAILABILITY_TYPE: {
    'available': 'available',
    'unavailable': 'unavailable',
    'preferred': 'preferred',
    'conditional': 'conditional'
  } as const
} as const;

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
} as const;

// Column mappings for migration
export const ColumnMapping = {
  // Common column name standardizations
  'employee_status': 'status',
  'submitter_email': 'created_by',
  'form_type': 'type',
  'assigned_to_email': 'assigned_to',
  'created_at': 'created_at',
  'updated_at': 'updated_at'
} as const;

// Reverse mappings for backward compatibility
export const ReverseStatusMapping = {
  TICKET_STATUS: Object.fromEntries(
    Object.entries(StatusMapping.TICKET_STATUS).map(([old, new_]) => [new_, old])
  ),
  EMPLOYEE_STATUS: Object.fromEntries(
    Object.entries(StatusMapping.EMPLOYEE_STATUS).map(([old, new_]) => [new_, old])
  ),
  SCHEDULE_STATUS: Object.fromEntries(
    Object.entries(StatusMapping.SCHEDULE_STATUS).map(([old, new_]) => [new_, old])
  ),
  AVAILABILITY_TYPE: Object.fromEntries(
    Object.entries(StatusMapping.AVAILABILITY_TYPE).map(([old, new_]) => [new_, old])
  )
} as const;

// Migration utility types
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

// Migration helper functions
export class MigrationHelpers {
  /**
   * Convert old status value to new status value
   */
  static convertTicketStatus(oldStatus: string): string {
    return StatusMapping.TICKET_STATUS[oldStatus as OldTicketStatus] || oldStatus;
  }

  static convertEmployeeStatus(oldStatus: string): string {
    return StatusMapping.EMPLOYEE_STATUS[oldStatus as OldEmployeeStatus] || oldStatus;
  }

  static convertScheduleStatus(oldStatus: string): string {
    return StatusMapping.SCHEDULE_STATUS[oldStatus as OldScheduleStatus] || oldStatus;
  }

  static convertAvailabilityType(oldType: string): string {
    return StatusMapping.AVAILABILITY_TYPE[oldType as OldAvailabilityType] || oldType;
  }

  /**
   * Convert new status value back to old status value (for backward compatibility)
   */
  static revertTicketStatus(newStatus: string): string {
    return ReverseStatusMapping.TICKET_STATUS[newStatus as NewTicketStatus] || newStatus;
  }

  static revertEmployeeStatus(newStatus: string): string {
    return ReverseStatusMapping.EMPLOYEE_STATUS[newStatus as NewEmployeeStatus] || newStatus;
  }

  static revertScheduleStatus(newStatus: string): string {
    return ReverseStatusMapping.SCHEDULE_STATUS[newStatus as NewScheduleStatus] || newStatus;
  }

  static revertAvailabilityType(newType: string): string {
    return ReverseStatusMapping.AVAILABILITY_TYPE[newType as NewAvailabilityType] || newType;
  }

  /**
   * Convert old table name to new table name
   */
  static convertTableName(oldTable: string): string {
    return TableMapping[oldTable as OldTableName] || oldTable;
  }

  /**
   * Check if table name is being migrated
   */
  static isTableBeingMigrated(tableName: string): boolean {
    return Object.keys(TableMapping).includes(tableName);
  }

  /**
   * Get all status values that need migration for a given type
   */
  static getStatusValuesForMigration(type: 'ticket' | 'employee' | 'schedule' | 'availability'): { old: string; new: string }[] {
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
  static isValidNewStatus(status: string, type: 'ticket' | 'employee' | 'schedule' | 'availability'): boolean {
    switch (type) {
      case 'ticket':
        return Object.values(StatusMapping.TICKET_STATUS).includes(status as NewTicketStatus);
      case 'employee':
        return Object.values(StatusMapping.EMPLOYEE_STATUS).includes(status as NewEmployeeStatus);
      case 'schedule':
        return Object.values(StatusMapping.SCHEDULE_STATUS).includes(status as NewScheduleStatus);
      case 'availability':
        return Object.values(StatusMapping.AVAILABILITY_TYPE).includes(status as NewAvailabilityType);
      default:
        return false;
    }
  }

  /**
   * Generate migration SQL for status value updates
   */
  static generateStatusMigrationSQL(tableName: string, columnName: string, type: 'ticket' | 'employee' | 'schedule' | 'availability'): string {
    const mappings = this.getStatusValuesForMigration(type);
    const cases = mappings.map(({ old, new: new_ }) => 
      `WHEN '${old}' THEN '${new_}'`
    ).join('\n        ');

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
export function isOldTicketStatus(status: string): status is OldTicketStatus {
  return Object.keys(StatusMapping.TICKET_STATUS).includes(status);
}

export function isNewTicketStatus(status: string): status is NewTicketStatus {
  return Object.values(StatusMapping.TICKET_STATUS).includes(status as NewTicketStatus);
}

export function isOldEmployeeStatus(status: string): status is OldEmployeeStatus {
  return Object.keys(StatusMapping.EMPLOYEE_STATUS).includes(status);
}

export function isNewEmployeeStatus(status: string): status is NewEmployeeStatus {
  return Object.values(StatusMapping.EMPLOYEE_STATUS).includes(status as NewEmployeeStatus);
}