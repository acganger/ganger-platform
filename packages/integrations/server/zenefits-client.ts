import { db } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

/**
 * Zenefits API Client for Employee Status and HR Data Integration
 * 
 * Integrates with Zenefits API to sync employee status, time off requests,
 * and HR information for clinical staffing optimization.
 */

interface ZenefitsConfig {
  baseUrl: string;
  apiKey: string;
  companyId?: string;
}

interface ZenefitsEmployee {
  id: string;
  url: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  work_email: string;
  phone_number: string;
  employment_status: 'active' | 'inactive' | 'terminated';
  employment_type: 'full_time' | 'part_time' | 'contractor' | 'intern';
  start_date: string; // ISO date
  termination_date?: string; // ISO date
  department: {
    id: string;
    name: string;
  };
  location: {
    id: string;
    name: string;
  };
  manager: {
    id: string;
    first_name: string;
    last_name: string;
  };
  job_title: string;
  work_schedule: {
    hours_per_week: number;
    days_per_week: number;
  };
  created_at: string;
  updated_at: string;
}

interface TimeOffRequest {
  id: string;
  url: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
  };
  time_off_type: {
    id: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  start_date: string; // ISO date
  end_date: string;   // ISO date
  hours_requested: number;
  hours_used: number;
  notes: string;
  requested_at: string;
  approved_at?: string;
  denied_at?: string;
  approved_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

interface ZenefitsDepartment {
  id: string;
  url: string;
  name: string;
  parent_department?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface ZenefitsLocation {
  id: string;
  url: string;
  name: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export class ZenefitsAPIClient {
  private config: ZenefitsConfig;
  private readonly baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  constructor(config: ZenefitsConfig) {
    this.config = config;

    if (!this.config.baseUrl || !this.config.apiKey) {
      throw new Error('Zenefits API client requires baseUrl and apiKey');
    }
  }

  /**
   * Make authenticated Zenefits API request
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.baseHeaders,
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zenefits API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get paginated results from Zenefits API
   */
  private async getPaginatedResults<T>(
    endpoint: string, 
    options: { limit?: number; filters?: Record<string, any> } = {}
  ): Promise<T[]> {
    const { limit = 100, filters = {} } = options;
    const results: T[] = [];
    let nextUrl: string | null = null;
    let isFirstRequest = true;

    do {
      let url: string;
      
      if (isFirstRequest) {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...filters
        });
        url = `${endpoint}?${params.toString()}`;
        isFirstRequest = false;
      } else {
        url = nextUrl!;
      }

      const response = await this.makeRequest<{
        results: T[];
        next: string | null;
        count: number;
      }>(url);

      results.push(...response.results);
      nextUrl = response.next;
    } while (nextUrl);

    return results;
  }

  /**
   * Get all employees from Zenefits
   */
  async getEmployees(filters: { 
    employment_status?: string;
    department_id?: string;
    location_id?: string;
  } = {}): Promise<ZenefitsEmployee[]> {
    try {
      const employees = await this.getPaginatedResults<ZenefitsEmployee>(
        '/core/people',
        { filters }
      );
      
      console.log(`Retrieved ${employees.length} employees from Zenefits`);
      return employees;
    } catch (error) {
      console.error('Failed to fetch employees from Zenefits:', error);
      throw error;
    }
  }

  /**
   * Get specific employee by ID
   */
  async getEmployee(employeeId: string): Promise<ZenefitsEmployee> {
    try {
      return await this.makeRequest<ZenefitsEmployee>(`/core/people/${employeeId}`);
    } catch (error) {
      console.error(`Failed to fetch employee ${employeeId} from Zenefits:`, error);
      throw error;
    }
  }

  /**
   * Get time off requests for an employee
   */
  async getTimeOffRequests(
    employeeId: string, 
    filters: {
      status?: string;
      start_date?: string;
      end_date?: string;
    } = {}
  ): Promise<TimeOffRequest[]> {
    try {
      const timeOffRequests = await this.getPaginatedResults<TimeOffRequest>(
        '/time_off/time_off_requests',
        { 
          filters: {
            employee: employeeId,
            ...filters
          }
        }
      );
      
      console.log(`Retrieved ${timeOffRequests.length} time off requests for employee ${employeeId}`);
      return timeOffRequests;
    } catch (error) {
      console.error(`Failed to fetch time off requests for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<ZenefitsDepartment[]> {
    try {
      const departments = await this.getPaginatedResults<ZenefitsDepartment>('/core/departments');
      
      console.log(`Retrieved ${departments.length} departments from Zenefits`);
      return departments;
    } catch (error) {
      console.error('Failed to fetch departments from Zenefits:', error);
      throw error;
    }
  }

  /**
   * Get all locations
   */
  async getLocations(): Promise<ZenefitsLocation[]> {
    try {
      const locations = await this.getPaginatedResults<ZenefitsLocation>('/core/locations');
      
      console.log(`Retrieved ${locations.length} locations from Zenefits`);
      return locations;
    } catch (error) {
      console.error('Failed to fetch locations from Zenefits:', error);
      throw error;
    }
  }

  /**
   * Test connection to Zenefits API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest<any>('/core/companies');
      
      if (response && Array.isArray(response.results)) {
        return {
          success: true,
          message: `Zenefits API connection successful. Found ${response.results.length} companies.`
        };
      } else {
        return {
          success: false,
          message: 'Unexpected response from Zenefits API'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Zenefits API connection failed: ${error.message}`
      };
    }
  }
}

export class ZenefitsClient {
  private apiClient: ZenefitsAPIClient;
  private departmentMapping: Map<string, string> = new Map();
  private locationMapping: Map<string, string> = new Map();

  constructor() {
    const config: ZenefitsConfig = {
      baseUrl: process.env.ZENEFITS_API_URL || 'https://api.zenefits.com/core',
      apiKey: process.env.ZENEFITS_API_KEY || '',
      companyId: process.env.ZENEFITS_COMPANY_ID || ''
    };

    this.apiClient = new ZenefitsAPIClient(config);
  }

  /**
   * Initialize mappings between Zenefits and Ganger systems
   */
  private async initializeMappings(): Promise<void> {
    try {
      const [zenefitsDepartments, zenefitsLocations, gangerLocations] = await Promise.all([
        this.apiClient.getDepartments(),
        this.apiClient.getLocations(),
        db.locations.findMany({ where: { is_active: true } })
      ]);

      // Map departments (this would typically be stored in a mapping table)
      zenefitsDepartments.forEach(dept => {
        // Simple name-based mapping - in production, this would be more sophisticated
        const mappedDept = this.mapDepartmentName(dept.name);
        this.departmentMapping.set(dept.id, mappedDept);
      });

      // Map locations
      zenefitsLocations.forEach(zenefitsLoc => {
        const gangerLoc = gangerLocations.find(gl => 
          gl.name.toLowerCase().includes(zenefitsLoc.name.toLowerCase()) ||
          zenefitsLoc.name.toLowerCase().includes(gl.name.toLowerCase()) ||
          gl.address?.toLowerCase().includes(zenefitsLoc.address.city.toLowerCase())
        );
        
        if (gangerLoc) {
          this.locationMapping.set(zenefitsLoc.id, gangerLoc.id);
        }
      });

      console.log(`Initialized ${this.departmentMapping.size} department mappings and ${this.locationMapping.size} location mappings`);
    } catch (error) {
      console.error('Failed to initialize Zenefits mappings:', error);
    }
  }

  /**
   * Map Zenefits department name to Ganger department
   */
  private mapDepartmentName(zenefitsDepartment: string): string {
    const departmentMapping: Record<string, string> = {
      'Medical': 'Clinical',
      'Clinical': 'Clinical',
      'Administration': 'Administrative',
      'Administrative': 'Administrative',
      'Operations': 'Operations',
      'IT': 'Administrative',
      'Human Resources': 'Administrative',
      'HR': 'Administrative'
    };

    return departmentMapping[zenefitsDepartment] || 'Administrative';
  }

  /**
   * Map Zenefits employment status to Ganger employment status
   */
  private mapZenefitsStatus(zenefitsStatus: string): 'active' | 'inactive' | 'on_leave' | 'terminated' {
    switch (zenefitsStatus.toLowerCase()) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'inactive';
      case 'terminated':
        return 'terminated';
      default:
        return 'inactive';
    }
  }

  /**
   * Check if employee has active time off
   */
  private hasActiveTimeOff(timeOffRequests: TimeOffRequest[]): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return timeOffRequests.some(request => {
      if (request.status !== 'approved') return false;
      
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      
      return startDate <= today && endDate >= today;
    });
  }

  /**
   * Sync employee status from Zenefits
   */
  async syncEmployeeStatus(): Promise<void> {
    try {
      console.log('Starting Zenefits employee status sync...');
      
      // Initialize mappings
      await this.initializeMappings();

      // Get all employees from Zenefits
      const employees = await this.apiClient.getEmployees();
      
      if (employees.length === 0) {
        console.warn('No employees found in Zenefits');
        return;
      }

      let syncedCount = 0;
      let errorsCount = 0;

      // Process each employee
      for (const employee of employees) {
        try {
          // Get time off information
          const timeOffRequests = await this.apiClient.getTimeOffRequests(employee.id, {
            status: 'approved',
            start_date: new Date().toISOString().split('T')[0]
          });

          // Update staff member status
          await this.updateStaffMemberFromZenefits(employee, timeOffRequests);
          syncedCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (employeeError) {
          console.error(`Failed to sync employee ${employee.id}:`, employeeError);
          errorsCount++;
        }
      }

      // Audit log the sync
      await auditLog({
        action: 'zenefits_employee_sync_completed',
        userId: 'system',
        resourceType: 'staff_members',
        resourceId: `zenefits_sync_${new Date().toISOString()}`,
        metadata: {
          employees_processed: employees.length,
          successful_syncs: syncedCount,
          errors: errorsCount
        }
      });

      console.log(`Zenefits employee sync completed: ${syncedCount} successful, ${errorsCount} errors out of ${employees.length} employees`);
    } catch (error) {
      console.error('Zenefits sync error:', error);
      
      // Audit log the error
      await auditLog({
        action: 'zenefits_employee_sync_failed',
        userId: 'system',
        resourceType: 'staff_members',
        resourceId: `zenefits_sync_error_${new Date().toISOString()}`,
        metadata: {
          error_message: error.message
        }
      });
      
      throw new Error(`Failed to sync employee status: ${error.message}`);
    }
  }

  /**
   * Update staff member from Zenefits data
   */
  private async updateStaffMemberFromZenefits(
    employee: ZenefitsEmployee,
    timeOffRequests: TimeOffRequest[]
  ): Promise<void> {
    try {
      // Find staff member by Zenefits employee ID
      const staffMember = await db.staff_members.findFirst({
        where: { zenefits_employee_id: employee.id }
      });

      if (!staffMember) {
        // Check if we can match by email
        const emailMatch = await db.staff_members.findFirst({
          where: { 
            OR: [
              { email: employee.work_email },
              { email: employee.personal_email }
            ]
          }
        });

        if (emailMatch) {
          // Update with Zenefits ID
          await db.staff_members.update({
            where: { id: emailMatch.id },
            data: { zenefits_employee_id: employee.id }
          });
          
          console.log(`Linked staff member ${emailMatch.id} with Zenefits employee ${employee.id}`);
        } else {
          console.warn(`Staff member not found for Zenefits employee ${employee.id} (${employee.first_name} ${employee.last_name})`);
          return;
        }
      }

      // Map employment status based on Zenefits data and time off
      const baseEmploymentStatus = this.mapZenefitsStatus(employee.employment_status);
      const hasActiveTimeOff = this.hasActiveTimeOff(timeOffRequests);
      const finalEmploymentStatus = hasActiveTimeOff ? 'on_leave' : baseEmploymentStatus;

      // Map department and location
      const mappedDepartment = this.departmentMapping.get(employee.department.id) || employee.department.name;
      const mappedLocationId = this.locationMapping.get(employee.location.id);

      // Prepare update data
      const updateData: any = {
        employment_status: finalEmploymentStatus,
        department: mappedDepartment,
        last_sync_at: new Date()
      };

      // Update location if mapping exists
      if (mappedLocationId) {
        updateData.primary_location_id = mappedLocationId;
      }

      // Update basic info if changed
      if (employee.work_email && employee.work_email !== staffMember?.email) {
        updateData.email = employee.work_email;
      }

      if (employee.phone_number) {
        updateData.phone = employee.phone_number;
      }

      // Update max hours per week if available
      if (employee.work_schedule?.hours_per_week) {
        updateData.max_hours_per_week = employee.work_schedule.hours_per_week;
      }

      // Determine preferred schedule type
      if (employee.employment_type) {
        switch (employee.employment_type) {
          case 'full_time':
            updateData.preferred_schedule_type = 'full_time';
            break;
          case 'part_time':
            updateData.preferred_schedule_type = 'part_time';
            break;
          case 'contractor':
            updateData.preferred_schedule_type = 'per_diem';
            break;
          default:
            updateData.preferred_schedule_type = 'flexible';
        }
      }

      // Update staff member
      await db.staff_members.update({
        where: { 
          zenefits_employee_id: employee.id 
        },
        data: updateData
      });

      // Update availability if on leave
      if (hasActiveTimeOff) {
        await this.updateAvailabilityForTimeOff(staffMember?.id || '', timeOffRequests);
      }

      console.log(`Updated staff member for Zenefits employee ${employee.id} (${employee.first_name} ${employee.last_name})`);
    } catch (error) {
      console.error(`Failed to update staff member for Zenefits employee ${employee.id}:`, error);
      throw error;
    }
  }

  /**
   * Update availability for time off periods
   */
  private async updateAvailabilityForTimeOff(
    staffMemberId: string,
    timeOffRequests: TimeOffRequest[]
  ): Promise<void> {
    try {
      const approvedTimeOff = timeOffRequests.filter(request => request.status === 'approved');
      
      for (const timeOff of approvedTimeOff) {
        const startDate = new Date(timeOff.start_date);
        const endDate = new Date(timeOff.end_date);
        
        // Check if there's an overlapping availability record
        const existingAvailability = await db.staff_availability.findFirst({
          where: {
            staff_member_id: staffMemberId,
            date_range_start: { lte: endDate },
            date_range_end: { gte: startDate }
          }
        });

        if (existingAvailability) {
          // Add unavailable dates to existing availability
          const unavailableDates = [...(existingAvailability.unavailable_dates || [])];
          
          // Add each day of time off to unavailable dates
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            unavailableDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }

          await db.staff_availability.update({
            where: { id: existingAvailability.id },
            data: {
              unavailable_dates: unavailableDates,
              notes: `${existingAvailability.notes || ''}\nTime off: ${timeOff.time_off_type.name} (${timeOff.start_date} to ${timeOff.end_date})`.trim(),
              updated_at: new Date()
            }
          });
        }
      }
    } catch (error) {
      console.error(`Failed to update availability for time off:`, error);
    }
  }

  /**
   * Get employee status summary
   */
  async getEmployeeStatusSummary(): Promise<{
    total_employees: number;
    active_employees: number;
    on_leave_employees: number;
    recent_changes: number;
  }> {
    try {
      const employees = await this.apiClient.getEmployees();
      const activeEmployees = employees.filter(emp => emp.employment_status === 'active');
      
      // Get recent time off requests (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      let onLeaveCount = 0;
      let recentChanges = 0;

      for (const employee of activeEmployees) {
        try {
          const timeOffRequests = await this.apiClient.getTimeOffRequests(employee.id, {
            status: 'approved',
            start_date: weekAgo.toISOString().split('T')[0]
          });
          
          if (this.hasActiveTimeOff(timeOffRequests)) {
            onLeaveCount++;
          }
          
          // Check for recent changes
          const updatedAt = new Date(employee.updated_at);
          if (updatedAt >= weekAgo) {
            recentChanges++;
          }
        } catch (error) {
          console.error(`Failed to check status for employee ${employee.id}:`, error);
        }
      }

      return {
        total_employees: employees.length,
        active_employees: activeEmployees.length,
        on_leave_employees: onLeaveCount,
        recent_changes: recentChanges
      };
    } catch (error) {
      console.error('Failed to get employee status summary:', error);
      throw error;
    }
  }

  /**
   * Test Zenefits API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return this.apiClient.testConnection();
  }
}

export default ZenefitsClient;