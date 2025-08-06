/**
 * Migration Deputy Adapter
 * Adapts Deputy integration to work during database schema migration
 * Phase 2: Shared Package Migration
 */

import { DeputyClient, type DeputyEmployee, type DeputyAvailability, type SyncAvailabilityResult } from './deputy-client';
import { MigrationHelpers, StatusMapping, type OldEmployeeStatus, type NewEmployeeStatus } from '@ganger/db';

export interface MigrationDeputyConfig {
  enableMigrationMode: boolean;
  useNewSchema: boolean;
  logMigrationOperations: boolean;
  fallbackToOldSchema: boolean;
}

/**
 * Deputy client adapter that handles database schema migration
 */
export class MigrationDeputyAdapter {
  private deputyClient: DeputyClient;
  private config: MigrationDeputyConfig;

  constructor(deputyClient: DeputyClient, config: MigrationDeputyConfig = {
    enableMigrationMode: true,
    useNewSchema: false,
    logMigrationOperations: process.env.NODE_ENV === 'development',
    fallbackToOldSchema: true
  }) {
    this.deputyClient = deputyClient;
    this.config = config;
  }

  /**
   * Map Deputy employment basis to internal status values with migration support
   */
  private mapEmploymentBasisWithMigration(deputyBasis: string): string {
    const internalMapping: Record<string, string> = {
      'FullTime': 'full_time',
      'PartTime': 'part_time',
      'Contract': 'contract',
      'Casual': 'per_diem'
    };

    const mappedValue = internalMapping[deputyBasis] || 'full_time';

    // During migration, we might need to convert to old format for backward compatibility
    if (this.config.enableMigrationMode && !this.config.useNewSchema) {
      // If still using old schema, maintain existing format
      return mappedValue;
    }

    return mappedValue;
  }

  /**
   * Map Deputy employee status with migration support
   */
  private mapEmployeeStatusWithMigration(active: boolean, terminationDate?: string): string {
    let status: string;

    if (!active) {
      status = terminationDate ? 'terminated' : 'inactive';
    } else {
      status = 'active';
    }

    // Apply migration mapping if needed
    if (this.config.enableMigrationMode && this.config.useNewSchema) {
      return MigrationHelpers.convertEmployeeStatus(status);
    }

    return status;
  }

  /**
   * Map availability type with migration support
   */
  private mapAvailabilityTypeWithMigration(deputyUnavailable: boolean): string {
    const availabilityType = deputyUnavailable ? 'unavailable' : 'available';

    if (this.config.enableMigrationMode && this.config.useNewSchema) {
      return MigrationHelpers.convertAvailabilityType(availabilityType);
    }

    return availabilityType;
  }

  /**
   * Get table name for staff operations based on migration state
   */
  private getStaffTableName(): string {
    if (!this.config.enableMigrationMode) {
      return 'staff_members';
    }

    return this.config.useNewSchema ? 'profiles' : 'staff_members';
  }

  /**
   * Get table name for availability operations based on migration state
   */
  private getAvailabilityTableName(): string {
    // Availability table name remains the same in both schemas
    return 'staff_availability';
  }

  /**
   * Sync employees with migration-aware data mapping
   */
  async syncEmployeesWithMigration(): Promise<SyncAvailabilityResult> {
    const startTime = new Date().toISOString();
    const result: SyncAvailabilityResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      lastSyncTime: startTime
    };

    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Starting employee sync using ${this.config.useNewSchema ? 'new' : 'old'} schema`);
    }

    try {
      const employees = await this.deputyClient.getEmployees();
      result.recordsProcessed = employees.length;

      for (const employee of employees) {
        try {
          const mappedEmployee = this.mapDeputyEmployeeForMigration(employee, startTime);
          
          // Check if employee exists (migration-aware lookup)
          const existingEmployee = await this.findExistingEmployeeWithMigration(
            employee.employeeId || employee.id.toString()
          );

          if (existingEmployee) {
            await this.updateStaffMemberWithMigration(existingEmployee.id, mappedEmployee);
            result.recordsUpdated++;
          } else {
            await this.createStaffMemberWithMigration(mappedEmployee);
            result.recordsCreated++;
          }

          if (this.config.logMigrationOperations) {
            console.log(`[Migration Deputy] ${existingEmployee ? 'Updated' : 'Created'} employee: ${employee.displayName}`);
          }

        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            employeeId: employee.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: { employee_name: employee.displayName, migration_mode: this.config.useNewSchema }
          });

          if (this.config.logMigrationOperations) {
            console.error(`[Migration Deputy] Failed to sync employee ${employee.displayName}:`, error);
          }
        }
      }

      result.success = result.recordsFailed === 0;

      if (this.config.logMigrationOperations) {
        console.log(`[Migration Deputy] Employee sync completed. Created: ${result.recordsCreated}, Updated: ${result.recordsUpdated}, Failed: ${result.recordsFailed}`);
      }

      return result;

    } catch (error) {
      result.errors.push({
        error: `Migration sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { migration_config: this.config }
      });
      
      if (this.config.logMigrationOperations) {
        console.error('[Migration Deputy] Employee sync failed:', error);
      }

      return result;
    }
  }

  /**
   * Sync availability with migration-aware data mapping
   */
  async syncAvailabilityWithMigration(
    startDate: string,
    endDate: string,
    employeeId?: number
  ): Promise<SyncAvailabilityResult> {
    const startTime = new Date().toISOString();
    const result: SyncAvailabilityResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      lastSyncTime: startTime
    };

    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Starting availability sync for ${startDate} to ${endDate}`);
    }

    try {
      const availability = await this.deputyClient.getAvailability(employeeId, startDate, endDate);
      result.recordsProcessed = availability.length;

      for (const avail of availability) {
        try {
          // Find staff member with migration-aware lookup
          const staffMember = await this.findStaffMemberByDeputyIdWithMigration(avail.employee.toString());
          
          if (!staffMember) {
            result.recordsFailed++;
            result.errors.push({
              employeeId: avail.employee,
              error: `Staff member not found for Deputy ID: ${avail.employee}`,
              details: { table_used: this.getStaffTableName() }
            });
            continue;
          }

          const mappedAvailability = this.mapDeputyAvailabilityForMigration(avail, staffMember.id, startTime);

          // Check if availability exists
          const existingAvailability = await this.findExistingAvailabilityWithMigration(
            staffMember.id,
            avail.id.toString()
          );

          if (existingAvailability) {
            await this.updateStaffAvailabilityWithMigration(existingAvailability.id, mappedAvailability);
            result.recordsUpdated++;
          } else {
            await this.createStaffAvailabilityWithMigration(mappedAvailability);
            result.recordsCreated++;
          }

        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            employeeId: avail.employee,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: { availability_id: avail.id }
          });
        }
      }

      result.success = result.recordsFailed === 0;
      return result;

    } catch (error) {
      result.errors.push({
        error: `Migration availability sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return result;
    }
  }

  /**
   * Map Deputy employee to internal format with migration support
   */
  private mapDeputyEmployeeForMigration(employee: DeputyEmployee, syncTime: string): any {
    const baseMapping = {
      first_name: employee.firstName,
      last_name: employee.lastName,
      email: employee.email,
      phone: employee.mobile,
      employee_status: this.mapEmployeeStatusWithMigration(employee.active, employee.terminationDate),
      deputy_employee_id: employee.id.toString(),
      employment_type: this.mapEmploymentBasisWithMigration(employee.employmentBasis),
      metadata: {
        deputy_sync: {
          last_sync: syncTime,
          employment_basis: employee.employmentBasis,
          start_date: employee.startDate,
          migration_mode: this.config.useNewSchema ? 'new_schema' : 'old_schema'
        }
      }
    };

    // Add schema-specific fields
    if (this.config.useNewSchema) {
      // New schema uses profiles table
      return {
        ...baseMapping,
        employee_id: employee.employeeId || `DEPUTY_${employee.id}`,
        role: 'staff', // Default role for new schema
        name: `${employee.firstName} ${employee.lastName}`,
        is_active: employee.active
      };
    } else {
      // Old schema uses staff_members table
      return {
        ...baseMapping,
        employee_id: employee.employeeId || `DEPUTY_${employee.id}`,
        job_title: 'Staff Member',
        department: 'General',
        hire_date: employee.startDate.split('T')[0],
        is_active: employee.active
      };
    }
  }

  /**
   * Map Deputy availability to internal format with migration support
   */
  private mapDeputyAvailabilityForMigration(availability: DeputyAvailability, staffMemberId: string, syncTime: string): any {
    return {
      staff_member_id: staffMemberId,
      date: availability.start.split('T')[0],
      start_time: new Date(availability.start).toTimeString().split(' ')[0],
      end_time: new Date(availability.end).toTimeString().split(' ')[0],
      availability_type: this.mapAvailabilityTypeWithMigration(availability.unavailable),
      reason: availability.comment,
      deputy_availability_id: availability.id.toString(),
      deputy_sync_status: 'synced',
      deputy_last_sync: syncTime,
      metadata: {
        migration_mode: this.config.useNewSchema ? 'new_schema' : 'old_schema',
        deputy_approved: availability.approved
      }
    };
  }

  /**
   * Migration-aware database operations (to be implemented by consumer)
   */
  private async findExistingEmployeeWithMigration(employeeId: string): Promise<any> {
    // Implementation would use migration-aware query adapter
    // This is a placeholder for the actual database integration
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Looking up employee ${employeeId} in ${this.getStaffTableName()}`);
    }
    return null; // Placeholder
  }

  private async findStaffMemberByDeputyIdWithMigration(deputyId: string): Promise<any> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Looking up staff by Deputy ID ${deputyId} in ${this.getStaffTableName()}`);
    }
    return null; // Placeholder
  }

  private async findExistingAvailabilityWithMigration(staffMemberId: string, deputyId: string): Promise<any> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Looking up availability for staff ${staffMemberId}, Deputy ID ${deputyId}`);
    }
    return null; // Placeholder
  }

  private async createStaffMemberWithMigration(data: any): Promise<any> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Creating staff member in ${this.getStaffTableName()}`);
    }
    return null; // Placeholder
  }

  private async updateStaffMemberWithMigration(id: string, data: any): Promise<any> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Updating staff member ${id} in ${this.getStaffTableName()}`);
    }
    return null; // Placeholder
  }

  private async createStaffAvailabilityWithMigration(data: any): Promise<any> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Creating availability in ${this.getAvailabilityTableName()}`);
    }
    return null; // Placeholder
  }

  private async updateStaffAvailabilityWithMigration(id: string, data: any): Promise<any> {
    if (this.config.logMigrationOperations) {
      console.log(`[Migration Deputy] Updating availability ${id} in ${this.getAvailabilityTableName()}`);
    }
    return null; // Placeholder
  }

  /**
   * Update migration configuration
   */
  updateConfig(newConfig: Partial<MigrationDeputyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.logMigrationOperations) {
      console.log('[Migration Deputy] Configuration updated:', this.config);
    }
  }

  /**
   * Get current migration configuration
   */
  getConfig(): MigrationDeputyConfig {
    return { ...this.config };
  }

  /**
   * Check Deputy integration migration status
   */
  async checkMigrationStatus(): Promise<{
    deputyIntegrationActive: boolean;
    lastSuccessfulSync: string | null;
    schemaInUse: 'old' | 'new';
    migrationMode: boolean;
    staffRecordsWithDeputyId: number;
    availabilityRecordsWithDeputyId: number;
  }> {
    try {
      const healthCheck = await this.deputyClient.healthCheck();
      
      return {
        deputyIntegrationActive: healthCheck.status === 'healthy',
        lastSuccessfulSync: null, // Would be fetched from database
        schemaInUse: this.config.useNewSchema ? 'new' : 'old',
        migrationMode: this.config.enableMigrationMode,
        staffRecordsWithDeputyId: 0, // Would be counted from database
        availabilityRecordsWithDeputyId: 0 // Would be counted from database
      };
    } catch (error) {
      return {
        deputyIntegrationActive: false,
        lastSuccessfulSync: null,
        schemaInUse: this.config.useNewSchema ? 'new' : 'old',
        migrationMode: this.config.enableMigrationMode,
        staffRecordsWithDeputyId: 0,
        availabilityRecordsWithDeputyId: 0
      };
    }
  }

  /**
   * Test Deputy integration with new schema
   */
  async testNewSchemaIntegration(): Promise<{
    success: boolean;
    testResults: Array<{
      test: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const testResults: Array<{ test: string; success: boolean; error?: string }> = [];

    // Test 1: Deputy API connectivity
    try {
      const healthCheck = await this.deputyClient.healthCheck();
      testResults.push({
        test: 'Deputy API connectivity',
        success: healthCheck.status === 'healthy'
      });
    } catch (error) {
      testResults.push({
        test: 'Deputy API connectivity',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Employee data mapping
    try {
      const employees = await this.deputyClient.getEmployees();
      const testEmployee = employees[0];
      if (testEmployee) {
        const mapped = this.mapDeputyEmployeeForMigration(testEmployee, new Date().toISOString());
        testResults.push({
          test: 'Employee data mapping',
          success: !!mapped.first_name && !!mapped.email
        });
      }
    } catch (error) {
      testResults.push({
        test: 'Employee data mapping',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const allSuccess = testResults.every(result => result.success);

    return {
      success: allSuccess,
      testResults
    };
  }
}

// Factory function to create migration-aware Deputy adapter
export function createMigrationDeputyAdapter(
  deputyClient: DeputyClient,
  config?: Partial<MigrationDeputyConfig>
): MigrationDeputyAdapter {
  const defaultConfig: MigrationDeputyConfig = {
    enableMigrationMode: true,
    useNewSchema: false,
    logMigrationOperations: process.env.NODE_ENV === 'development',
    fallbackToOldSchema: true
  };
  
  const mergedConfig = { ...defaultConfig, ...config };
  return new MigrationDeputyAdapter(deputyClient, mergedConfig);
}