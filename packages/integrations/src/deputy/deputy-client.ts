/**
 * Deputy API Integration Client
 * Staff availability, scheduling, and time tracking integration
 */

import { BaseIntegrationClient } from '../base/base-client';

export interface DeputyConfig {
  baseUrl: string; // e.g., 'https://your-company.deputy.com'
  accessToken: string;
  environment: 'sandbox' | 'production';
}

export interface DeputyEmployee {
  id: number;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  employeeId?: string;
  active: boolean;
  startDate: string;
  terminationDate?: string;
  company: number;
  locations: number[];
  roles: DeputyRole[];
  payRate?: number;
  employmentBasis: 'FullTime' | 'PartTime' | 'Casual' | 'Contract';
  photoLarge?: string;
  photoThumb?: string;
  created: string;
  modified: string;
}

export interface DeputyRole {
  id: number;
  name: string;
  description?: string;
  payRate?: number;
  colour?: string;
}

export interface DeputyLocation {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  timezone: string;
  active: boolean;
  company: number;
}

export interface DeputyAvailability {
  id: number;
  employee: number;
  start: string; // ISO datetime
  end: string; // ISO datetime
  unavailable: boolean;
  comment?: string;
  approved: boolean;
  created: string;
  modified: string;
}

export interface DeputyRoster {
  id: number;
  employee: number;
  location: number;
  start: string; // ISO datetime
  end: string; // ISO datetime
  confirmed: boolean;
  published: boolean;
  openingHours: boolean;
  comment?: string;
  warning?: string;
  cost?: number;
  created: string;
  modified: string;
}

export interface DeputyTimesheet {
  id: number;
  employee: number;
  start: string; // ISO datetime
  end: string; // ISO datetime
  totalTime: number; // seconds
  cost: number;
  approved: boolean;
  discrepancy: boolean;
  roster?: number; // Associated roster ID
  created: string;
  modified: string;
}

export interface DeputyLeave {
  id: number;
  employee: number;
  start: string; // ISO date
  end: string; // ISO date
  leaveRule: number;
  comment?: string;
  status: 'Pending' | 'Approved' | 'Declined';
  totalTime: number; // hours
  created: string;
  modified: string;
}

export interface SyncAvailabilityResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: Array<{
    employeeId?: number;
    error: string;
    details?: any;
  }>;
  lastSyncTime: string;
}

export class DeputyClient extends BaseIntegrationClient {
  private config: DeputyConfig;

  constructor(config: DeputyConfig) {
    super();
    this.config = config;
    this.validateConfig(config, ['baseUrl', 'accessToken']);
  }

  // =====================================================
  // HTTP REQUEST WRAPPER
  // =====================================================

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.config.baseUrl}/api/v1${endpoint}`;
    
    const response = await this.makeRequestWithRetry(url, {
      ...options,
      headers: {
        'Authorization': `OAuth ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'dp-meta-option': 'full-response', // Include metadata in response
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deputy API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // =====================================================
  // EMPLOYEE MANAGEMENT
  // =====================================================

  async getEmployees(locationId?: number): Promise<DeputyEmployee[]> {
    try {
      let endpoint = '/resource/Employee';
      
      if (locationId) {
        endpoint += `?search=${JSON.stringify({ company: locationId })}`;
      }
      
      const response = await this.makeRequest(endpoint);
      
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      this.logError('Failed to fetch employees from Deputy', error);
      throw error;
    }
  }

  async getEmployeeById(employeeId: number): Promise<DeputyEmployee | null> {
    try {
      const response = await this.makeRequest(`/resource/Employee/${employeeId}`);
      return response || null;
    } catch (error) {
      this.logError(`Failed to fetch employee ${employeeId} from Deputy`, error);
      return null;
    }
  }

  async createEmployee(employeeData: {
    displayName: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
    employeeId?: string;
    startDate: string;
    company: number;
    employmentBasis: 'FullTime' | 'PartTime' | 'Casual' | 'Contract';
    roles?: number[];
    locations?: number[];
  }): Promise<DeputyEmployee> {
    try {
      const response = await this.makeRequest('/resource/Employee', {
        method: 'POST',
        body: JSON.stringify(employeeData)
      });
      
      return response;
    } catch (error) {
      this.logError('Failed to create employee in Deputy', error);
      throw error;
    }
  }

  async updateEmployee(
    employeeId: number,
    updates: Partial<DeputyEmployee>
  ): Promise<DeputyEmployee> {
    try {
      const response = await this.makeRequest(`/resource/Employee/${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      return response;
    } catch (error) {
      this.logError(`Failed to update employee ${employeeId} in Deputy`, error);
      throw error;
    }
  }

  // =====================================================
  // AVAILABILITY MANAGEMENT
  // =====================================================

  async getAvailability(
    employeeId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<DeputyAvailability[]> {
    try {
      let endpoint = '/resource/EmployeeAvailability';
      const searchParams: any = {};
      
      if (employeeId) {
        searchParams.employee = employeeId;
      }
      
      if (startDate) {
        searchParams.start = { '$gte': startDate };
      }
      
      if (endDate) {
        searchParams.end = { '$lte': endDate };
      }
      
      if (Object.keys(searchParams).length > 0) {
        endpoint += `?search=${JSON.stringify(searchParams)}`;
      }
      
      const response = await this.makeRequest(endpoint);
      
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      this.logError('Failed to fetch availability from Deputy', error);
      throw error;
    }
  }

  async createAvailability(availabilityData: {
    employee: number;
    start: string; // ISO datetime
    end: string; // ISO datetime
    unavailable?: boolean;
    comment?: string;
  }): Promise<DeputyAvailability> {
    try {
      const response = await this.makeRequest('/resource/EmployeeAvailability', {
        method: 'POST',
        body: JSON.stringify(availabilityData)
      });
      
      return response;
    } catch (error) {
      this.logError('Failed to create availability in Deputy', error);
      throw error;
    }
  }

  async updateAvailability(
    availabilityId: number,
    updates: Partial<DeputyAvailability>
  ): Promise<DeputyAvailability> {
    try {
      const response = await this.makeRequest(`/resource/EmployeeAvailability/${availabilityId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      return response;
    } catch (error) {
      this.logError(`Failed to update availability ${availabilityId} in Deputy`, error);
      throw error;
    }
  }

  async deleteAvailability(availabilityId: number): Promise<void> {
    try {
      await this.makeRequest(`/resource/EmployeeAvailability/${availabilityId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      this.logError(`Failed to delete availability ${availabilityId} in Deputy`, error);
      throw error;
    }
  }

  // =====================================================
  // ROSTER MANAGEMENT
  // =====================================================

  async getRosters(
    locationId?: number,
    startDate?: string,
    endDate?: string,
    employeeId?: number
  ): Promise<DeputyRoster[]> {
    try {
      let endpoint = '/resource/Roster';
      const searchParams: any = {};
      
      if (locationId) {
        searchParams.location = locationId;
      }
      
      if (employeeId) {
        searchParams.employee = employeeId;
      }
      
      if (startDate) {
        searchParams.start = { '$gte': startDate };
      }
      
      if (endDate) {
        searchParams.end = { '$lte': endDate };
      }
      
      if (Object.keys(searchParams).length > 0) {
        endpoint += `?search=${JSON.stringify(searchParams)}`;
      }
      
      const response = await this.makeRequest(endpoint);
      
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      this.logError('Failed to fetch rosters from Deputy', error);
      throw error;
    }
  }

  async createRoster(rosterData: {
    employee: number;
    location: number;
    start: string; // ISO datetime
    end: string; // ISO datetime;
    comment?: string;
    openingHours?: boolean;
  }): Promise<DeputyRoster> {
    try {
      const response = await this.makeRequest('/resource/Roster', {
        method: 'POST',
        body: JSON.stringify(rosterData)
      });
      
      return response;
    } catch (error) {
      this.logError('Failed to create roster in Deputy', error);
      throw error;
    }
  }

  async updateRoster(
    rosterId: number,
    updates: Partial<DeputyRoster>
  ): Promise<DeputyRoster> {
    try {
      const response = await this.makeRequest(`/resource/Roster/${rosterId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      return response;
    } catch (error) {
      this.logError(`Failed to update roster ${rosterId} in Deputy`, error);
      throw error;
    }
  }

  async publishRoster(rosterId: number): Promise<DeputyRoster> {
    try {
      const response = await this.makeRequest(`/resource/Roster/${rosterId}`, {
        method: 'PUT',
        body: JSON.stringify({ published: true })
      });
      
      return response;
    } catch (error) {
      this.logError(`Failed to publish roster ${rosterId} in Deputy`, error);
      throw error;
    }
  }

  // =====================================================
  // TIMESHEET MANAGEMENT
  // =====================================================

  async getTimesheets(
    employeeId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<DeputyTimesheet[]> {
    try {
      let endpoint = '/resource/Timesheet';
      const searchParams: any = {};
      
      if (employeeId) {
        searchParams.employee = employeeId;
      }
      
      if (startDate) {
        searchParams.start = { '$gte': startDate };
      }
      
      if (endDate) {
        searchParams.end = { '$lte': endDate };
      }
      
      if (Object.keys(searchParams).length > 0) {
        endpoint += `?search=${JSON.stringify(searchParams)}`;
      }
      
      const response = await this.makeRequest(endpoint);
      
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      this.logError('Failed to fetch timesheets from Deputy', error);
      throw error;
    }
  }

  // =====================================================
  // LEAVE MANAGEMENT
  // =====================================================

  async getLeave(
    employeeId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<DeputyLeave[]> {
    try {
      let endpoint = '/resource/Leave';
      const searchParams: any = {};
      
      if (employeeId) {
        searchParams.employee = employeeId;
      }
      
      if (startDate) {
        searchParams.start = { '$gte': startDate };
      }
      
      if (endDate) {
        searchParams.end = { '$lte': endDate };
      }
      
      if (Object.keys(searchParams).length > 0) {
        endpoint += `?search=${JSON.stringify(searchParams)}`;
      }
      
      const response = await this.makeRequest(endpoint);
      
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      this.logError('Failed to fetch leave from Deputy', error);
      throw error;
    }
  }

  // =====================================================
  // LOCATIONS AND ROLES
  // =====================================================

  async getLocations(): Promise<DeputyLocation[]> {
    try {
      const response = await this.makeRequest('/resource/Company');
      
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      this.logError('Failed to fetch locations from Deputy', error);
      throw error;
    }
  }

  async getRoles(): Promise<DeputyRole[]> {
    try {
      const response = await this.makeRequest('/resource/OperationalUnit');
      
      return Array.isArray(response) ? response : [response];
    } catch (error) {
      this.logError('Failed to fetch roles from Deputy', error);
      throw error;
    }
  }

  // =====================================================
  // SYNCHRONIZATION OPERATIONS
  // =====================================================

  async syncEmployees(): Promise<SyncAvailabilityResult> {
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

    try {
      const employees = await this.getEmployees();
      result.recordsProcessed = employees.length;

      for (const employee of employees) {
        try {
          // Check if employee exists in our system
          const existingEmployee = await this.findExistingEmployee(employee.employeeId || employee.id.toString());
          
          if (existingEmployee) {
            // Update existing employee
            await this.updateStaffMember(existingEmployee.id, {
              first_name: employee.firstName,
              last_name: employee.lastName,
              email: employee.email,
              phone: employee.mobile,
              employee_status: employee.active ? 'active' : 'inactive',
              deputy_employee_id: employee.id.toString(),
              employment_type: this.mapEmploymentBasis(employee.employmentBasis),
              metadata: {
                ...existingEmployee.metadata,
                deputy_sync: {
                  last_sync: startTime,
                  employment_basis: employee.employmentBasis,
                  start_date: employee.startDate
                }
              }
            });
            result.recordsUpdated++;
          } else {
            // Create new staff member
            await this.createStaffMember({
              employee_id: employee.employeeId || `DEPUTY_${employee.id}`,
              first_name: employee.firstName,
              last_name: employee.lastName,
              email: employee.email,
              phone: employee.mobile,
              job_title: 'Staff Member',
              department: 'General',
              employment_type: this.mapEmploymentBasis(employee.employmentBasis),
              hire_date: employee.startDate.split('T')[0],
              employee_status: employee.active ? 'active' : 'inactive',
              deputy_employee_id: employee.id.toString(),
              metadata: {
                deputy_sync: {
                  last_sync: startTime,
                  employment_basis: employee.employmentBasis,
                  source: 'deputy_import'
                }
              }
            });
            result.recordsCreated++;
          }
        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            employeeId: employee.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: employee
          });
        }
      }

      result.success = result.recordsFailed === 0;
      return result;
    } catch (error) {
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return result;
    }
  }

  async syncAvailability(
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

    try {
      const availability = await this.getAvailability(employeeId, startDate, endDate);
      result.recordsProcessed = availability.length;

      for (const avail of availability) {
        try {
          // Find corresponding staff member
          const staffMember = await this.findStaffMemberByDeputyId(avail.employee.toString());
          
          if (!staffMember) {
            result.recordsFailed++;
            result.errors.push({
              employeeId: avail.employee,
              error: `Staff member not found for Deputy ID: ${avail.employee}`,
              details: avail
            });
            continue;
          }

          // Convert Deputy availability to our format
          const availabilityData = {
            staff_member_id: staffMember.id,
            date: avail.start.split('T')[0],
            start_time: new Date(avail.start).toTimeString().split(' ')[0],
            end_time: new Date(avail.end).toTimeString().split(' ')[0],
            availability_type: avail.unavailable ? 'unavailable' : 'available',
            reason: avail.comment,
            deputy_availability_id: avail.id.toString(),
            deputy_sync_status: 'synced',
            deputy_last_sync: startTime
          };

          // Check if availability already exists
          const existingAvailability = await this.findExistingAvailability(
            staffMember.id,
            avail.id.toString()
          );

          if (existingAvailability) {
            await this.updateStaffAvailability(existingAvailability.id, availabilityData);
            result.recordsUpdated++;
          } else {
            await this.createStaffAvailability(availabilityData);
            result.recordsCreated++;
          }
        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            employeeId: avail.employee,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: avail
          });
        }
      }

      result.success = result.recordsFailed === 0;
      return result;
    } catch (error) {
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return result;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private mapEmploymentBasis(basis: string): 'full_time' | 'part_time' | 'contract' | 'per_diem' {
    const mapping: Record<string, 'full_time' | 'part_time' | 'contract' | 'per_diem'> = {
      'FullTime': 'full_time',
      'PartTime': 'part_time',
      'Contract': 'contract',
      'Casual': 'per_diem'
    };
    
    return mapping[basis] || 'full_time';
  }

  private async findExistingEmployee(employeeId: string): Promise<any> {
    // This would query the database for existing staff member
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async findStaffMemberByDeputyId(deputyId: string): Promise<any> {
    // This would query the database for staff member by Deputy ID
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async findExistingAvailability(staffMemberId: string, deputyId: string): Promise<any> {
    // This would query the database for existing availability
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async createStaffMember(data: any): Promise<any> {
    // This would create a new staff member in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async updateStaffMember(id: string, data: any): Promise<any> {
    // This would update an existing staff member in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async createStaffAvailability(data: any): Promise<any> {
    // This would create new availability in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  private async updateStaffAvailability(id: string, data: any): Promise<any> {
    // This would update existing availability in the database
    // Implementation depends on the database client being used
    return null; // Placeholder
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Test basic API connectivity
      const response = await this.makeRequest('/resource/Employee?max=1');
      
      return {
        status: 'healthy',
        details: {
          recordCount: Array.isArray(response) ? response.length : 1,
          lastCheck: new Date().toISOString(),
          environment: this.config.environment
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString(),
          environment: this.config.environment
        }
      };
    }
  }
}