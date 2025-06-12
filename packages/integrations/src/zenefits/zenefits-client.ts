/**
 * Zenefits API Integration Client
 * Employee verification, benefits, and leave tracking for staffing optimization
 */

import { BaseIntegrationClient } from '../base/base-client';

export interface ZenefitsConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  environment: 'sandbox' | 'production';
}

export interface ZenefitsEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobTitle: string;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  hireDate: string;
  terminationDate?: string;
  workLocation?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  payRate?: number;
  currency?: string;
  workSchedule?: {
    hoursPerWeek: number;
    workDays: string[];
  };
}

export interface ZenefitsLeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'parental' | 'medical';
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  startDate: string;
  endDate: string;
  totalHours: number;
  totalDays: number;
  reason?: string;
  approvedBy?: string;
  submittedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ZenefitsBenefits {
  employeeId: string;
  healthInsurance: {
    enrolled: boolean;
    plan?: string;
    effectiveDate?: string;
    dependents?: number;
  };
  dentalInsurance: {
    enrolled: boolean;
    plan?: string;
    effectiveDate?: string;
  };
  visionInsurance: {
    enrolled: boolean;
    plan?: string;
    effectiveDate?: string;
  };
  retirement: {
    enrolled: boolean;
    contributionPercentage?: number;
    matchPercentage?: number;
  };
  eligibilityDate: string;
  isEligible: boolean;
}

export interface ZenefitsTimeoff {
  employeeId: string;
  balances: {
    vacation: {
      accrued: number;
      used: number;
      available: number;
      carryover?: number;
    };
    sick: {
      accrued: number;
      used: number;
      available: number;
    };
    personal: {
      accrued: number;
      used: number;
      available: number;
    };
  };
  accrualRate: {
    vacation: number; // hours per pay period
    sick: number;
    personal: number;
  };
  lastUpdated: string;
}

export interface SyncEmployeeResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: Array<{
    employeeId?: string;
    error: string;
    details?: any;
  }>;
  lastSyncTime: string;
}

export interface EmployeeStatusCheck {
  employeeId: string;
  isActive: boolean;
  isEligible: boolean;
  currentStatus: string;
  leaveSchedule: ZenefitsLeaveRequest[];
  timeoffBalance: ZenefitsTimeoff;
  lastVerified: string;
}

export class ZenefitsClient extends BaseIntegrationClient {
  private config: ZenefitsConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: ZenefitsConfig) {
    super();
    this.config = config;
    this.validateConfig(config, ['baseUrl', 'clientId', 'clientSecret']);
  }

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await this.makeRequestWithRetry(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'employees:read benefits:read time_off:read'
        })
      });

      if (!response.ok) {
        throw new Error(`Zenefits authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new Error('No access token received from Zenefits');
      }
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

      return this.accessToken!;
    } catch (error) {
      this.logError('Zenefits authentication failed', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.authenticate();
    
    const response = await this.makeRequestWithRetry(`${this.config.baseUrl}/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zenefits API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // =====================================================
  // EMPLOYEE MANAGEMENT
  // =====================================================

  async getEmployees(
    filters?: {
      status?: 'active' | 'inactive' | 'terminated';
      department?: string;
      location?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ZenefitsEmployee[]> {
    try {
      let endpoint = '/employees';
      const params = new URLSearchParams();

      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.department) {
        params.append('department', filters.department);
      }
      if (filters?.location) {
        params.append('work_location', filters.location);
      }
      if (filters?.page) {
        params.append('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.makeRequest(endpoint);
      
      return response.data?.map((emp: any) => this.mapZenefitsEmployee(emp)) || [];
    } catch (error) {
      this.logError('Failed to fetch employees from Zenefits', error);
      throw error;
    }
  }

  async getEmployeeById(employeeId: string): Promise<ZenefitsEmployee | null> {
    try {
      const response = await this.makeRequest(`/employees/${employeeId}`);
      
      if (!response.data) return null;
      
      return this.mapZenefitsEmployee(response.data);
    } catch (error) {
      this.logError(`Failed to fetch employee ${employeeId} from Zenefits`, error);
      return null;
    }
  }

  async verifyEmployeeStatus(employeeId: string): Promise<EmployeeStatusCheck> {
    try {
      const [employee, leaveRequests, timeoffBalance] = await Promise.all([
        this.getEmployeeById(employeeId),
        this.getLeaveRequests(employeeId),
        this.getTimeoffBalance(employeeId)
      ]);

      if (!employee) {
        throw new Error(`Employee ${employeeId} not found in Zenefits`);
      }

      const isActive = employee.status === 'active';
      const isEligible = isActive && new Date(employee.hireDate) < new Date();

      // Get current and upcoming leave
      const now = new Date();
      const leaveSchedule = leaveRequests.filter(leave => 
        leave.status === 'approved' && 
        new Date(leave.endDate) >= now
      );

      return {
        employeeId,
        isActive,
        isEligible,
        currentStatus: employee.status,
        leaveSchedule,
        timeoffBalance,
        lastVerified: new Date().toISOString()
      };
    } catch (error) {
      this.logError(`Failed to verify employee status for ${employeeId}`, error);
      throw error;
    }
  }

  // =====================================================
  // LEAVE AND TIME OFF MANAGEMENT
  // =====================================================

  async getLeaveRequests(
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    status?: 'pending' | 'approved' | 'denied'
  ): Promise<ZenefitsLeaveRequest[]> {
    try {
      let endpoint = '/time_off_requests';
      const params = new URLSearchParams();

      if (employeeId) {
        params.append('employee_id', employeeId);
      }
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      if (status) {
        params.append('status', status);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.makeRequest(endpoint);
      
      return response.data?.map((leave: any) => this.mapZenefitsLeave(leave)) || [];
    } catch (error) {
      this.logError('Failed to fetch leave requests from Zenefits', error);
      throw error;
    }
  }

  async getTimeoffBalance(employeeId: string): Promise<ZenefitsTimeoff> {
    try {
      const response = await this.makeRequest(`/employees/${employeeId}/time_off_balances`);
      
      return this.mapZenefitsTimeoff(employeeId, response.data);
    } catch (error) {
      this.logError(`Failed to fetch timeoff balance for employee ${employeeId}`, error);
      throw error;
    }
  }

  async getUpcomingLeave(
    locationId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ZenefitsLeaveRequest[]> {
    try {
      const startDateFilter = startDate || new Date().toISOString().split('T')[0];
      const endDateFilter = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 days from now

      // Get all approved leave requests in the date range
      const leaveRequests = await this.getLeaveRequests(
        undefined, // all employees
        startDateFilter,
        endDateFilter,
        'approved'
      );

      // Filter by location if specified
      if (locationId) {
        const employees = await this.getEmployees({ location: locationId });
        const locationEmployeeIds = new Set(employees.map(emp => emp.id));
        
        return leaveRequests.filter(leave => 
          locationEmployeeIds.has(leave.employeeId)
        );
      }

      return leaveRequests;
    } catch (error) {
      this.logError('Failed to fetch upcoming leave from Zenefits', error);
      throw error;
    }
  }

  // =====================================================
  // BENEFITS MANAGEMENT
  // =====================================================

  async getBenefits(employeeId: string): Promise<ZenefitsBenefits> {
    try {
      const response = await this.makeRequest(`/employees/${employeeId}/benefits`);
      
      return this.mapZenefitsBenefits(employeeId, response.data);
    } catch (error) {
      this.logError(`Failed to fetch benefits for employee ${employeeId}`, error);
      throw error;
    }
  }

  async checkBenefitsEligibility(employeeId: string): Promise<boolean> {
    try {
      const benefits = await this.getBenefits(employeeId);
      return benefits.isEligible;
    } catch (error) {
      this.logError(`Failed to check benefits eligibility for employee ${employeeId}`, error);
      return false;
    }
  }

  // =====================================================
  // SYNCHRONIZATION OPERATIONS
  // =====================================================

  async syncEmployees(): Promise<SyncEmployeeResult> {
    const startTime = new Date().toISOString();
    const result: SyncEmployeeResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      lastSyncTime: startTime
    };

    try {
      // Get all active employees from Zenefits
      const employees = await this.getEmployees({ status: 'active' });
      result.recordsProcessed = employees.length;

      for (const employee of employees) {
        try {
          // Check if employee exists in our system
          const existingEmployee = await this.findExistingEmployee(employee.employeeId);
          
          if (existingEmployee) {
            // Update existing employee
            await this.updateStaffMember(existingEmployee.id, {
              first_name: employee.firstName,
              last_name: employee.lastName,
              email: employee.email,
              phone: employee.phone,
              job_title: employee.jobTitle,
              department: employee.department,
              employment_type: this.mapEmploymentType(employee.employmentType),
              employee_status: this.mapEmployeeStatus(employee.status),
              zenefits_employee_id: employee.id,
              metadata: {
                ...existingEmployee.metadata,
                zenefits_sync: {
                  last_sync: startTime,
                  hire_date: employee.hireDate,
                  work_location: employee.workLocation,
                  manager: employee.manager
                }
              }
            });
            result.recordsUpdated++;
          } else {
            // Create new staff member
            await this.createStaffMember({
              employee_id: employee.employeeId,
              first_name: employee.firstName,
              last_name: employee.lastName,
              email: employee.email,
              phone: employee.phone,
              job_title: employee.jobTitle,
              department: employee.department,
              employment_type: this.mapEmploymentType(employee.employmentType),
              hire_date: employee.hireDate.split('T')[0],
              employee_status: this.mapEmployeeStatus(employee.status),
              zenefits_employee_id: employee.id,
              metadata: {
                zenefits_sync: {
                  last_sync: startTime,
                  work_location: employee.workLocation,
                  manager: employee.manager,
                  source: 'zenefits_import'
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

  async syncLeaveSchedule(
    startDate: string,
    endDate: string,
    employeeId?: string
  ): Promise<SyncEmployeeResult> {
    const startTime = new Date().toISOString();
    const result: SyncEmployeeResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
      lastSyncTime: startTime
    };

    try {
      const leaveRequests = await this.getLeaveRequests(employeeId, startDate, endDate, 'approved');
      result.recordsProcessed = leaveRequests.length;

      for (const leave of leaveRequests) {
        try {
          // Find corresponding staff member
          const staffMember = await this.findStaffMemberByZenefitsId(leave.employeeId);
          
          if (!staffMember) {
            result.recordsFailed++;
            result.errors.push({
              employeeId: leave.employeeId,
              error: `Staff member not found for Zenefits ID: ${leave.employeeId}`,
              details: leave
            });
            continue;
          }

          // Create or update staff availability records for the leave period
          const leaveStartDate = new Date(leave.startDate);
          const leaveEndDate = new Date(leave.endDate);
          
          // Generate availability records for each day of leave
          for (let date = new Date(leaveStartDate); date <= leaveEndDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            
            const availabilityData = {
              staff_member_id: staffMember.id,
              date: dateStr,
              start_time: '00:00:00',
              end_time: '23:59:59',
              availability_type: 'unavailable',
              reason: `${leave.leaveType.toUpperCase()} Leave`,
              zenefits_leave_id: leave.id,
              zenefits_sync_status: 'synced',
              zenefits_last_sync: startTime
            };

            // Check if availability already exists
            const existingAvailability = await this.findExistingAvailability(
              staffMember.id,
              dateStr,
              leave.id
            );

            if (existingAvailability) {
              await this.updateStaffAvailability(existingAvailability.id, availabilityData);
              result.recordsUpdated++;
            } else {
              await this.createStaffAvailability(availabilityData);
              result.recordsCreated++;
            }
          }
        } catch (error) {
          result.recordsFailed++;
          result.errors.push({
            employeeId: leave.employeeId,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: leave
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

  private mapZenefitsEmployee(zenefitsData: any): ZenefitsEmployee {
    return {
      id: zenefitsData.id,
      employeeId: zenefitsData.employee_id || zenefitsData.id,
      firstName: zenefitsData.first_name,
      lastName: zenefitsData.last_name,
      email: zenefitsData.work_email || zenefitsData.personal_email,
      phone: zenefitsData.work_phone || zenefitsData.personal_phone,
      department: zenefitsData.department,
      jobTitle: zenefitsData.title,
      status: zenefitsData.status,
      hireDate: zenefitsData.start_date,
      terminationDate: zenefitsData.termination_date,
      workLocation: zenefitsData.work_location,
      manager: zenefitsData.manager ? {
        id: zenefitsData.manager.id,
        name: `${zenefitsData.manager.first_name} ${zenefitsData.manager.last_name}`,
        email: zenefitsData.manager.work_email
      } : undefined,
      employmentType: zenefitsData.employment_type,
      payRate: zenefitsData.pay_rate,
      currency: zenefitsData.pay_rate_currency,
      workSchedule: zenefitsData.work_schedule ? {
        hoursPerWeek: zenefitsData.work_schedule.hours_per_week,
        workDays: zenefitsData.work_schedule.work_days
      } : undefined
    };
  }

  private mapZenefitsLeave(zenefitsData: any): ZenefitsLeaveRequest {
    return {
      id: zenefitsData.id,
      employeeId: zenefitsData.employee_id,
      leaveType: zenefitsData.time_off_type,
      status: zenefitsData.status,
      startDate: zenefitsData.start_date,
      endDate: zenefitsData.end_date,
      totalHours: zenefitsData.total_hours,
      totalDays: zenefitsData.total_days,
      reason: zenefitsData.reason,
      approvedBy: zenefitsData.approved_by?.id,
      submittedAt: zenefitsData.submitted_at,
      updatedAt: zenefitsData.updated_at,
      notes: zenefitsData.notes
    };
  }

  private mapZenefitsTimeoff(employeeId: string, zenefitsData: any): ZenefitsTimeoff {
    return {
      employeeId,
      balances: {
        vacation: {
          accrued: zenefitsData.vacation?.accrued || 0,
          used: zenefitsData.vacation?.used || 0,
          available: zenefitsData.vacation?.available || 0,
          carryover: zenefitsData.vacation?.carryover
        },
        sick: {
          accrued: zenefitsData.sick?.accrued || 0,
          used: zenefitsData.sick?.used || 0,
          available: zenefitsData.sick?.available || 0
        },
        personal: {
          accrued: zenefitsData.personal?.accrued || 0,
          used: zenefitsData.personal?.used || 0,
          available: zenefitsData.personal?.available || 0
        }
      },
      accrualRate: {
        vacation: zenefitsData.accrual_rate?.vacation || 0,
        sick: zenefitsData.accrual_rate?.sick || 0,
        personal: zenefitsData.accrual_rate?.personal || 0
      },
      lastUpdated: zenefitsData.last_updated || new Date().toISOString()
    };
  }

  private mapZenefitsBenefits(employeeId: string, zenefitsData: any): ZenefitsBenefits {
    return {
      employeeId,
      healthInsurance: {
        enrolled: zenefitsData.health_insurance?.enrolled || false,
        plan: zenefitsData.health_insurance?.plan_name,
        effectiveDate: zenefitsData.health_insurance?.effective_date,
        dependents: zenefitsData.health_insurance?.dependents_count
      },
      dentalInsurance: {
        enrolled: zenefitsData.dental_insurance?.enrolled || false,
        plan: zenefitsData.dental_insurance?.plan_name,
        effectiveDate: zenefitsData.dental_insurance?.effective_date
      },
      visionInsurance: {
        enrolled: zenefitsData.vision_insurance?.enrolled || false,
        plan: zenefitsData.vision_insurance?.plan_name,
        effectiveDate: zenefitsData.vision_insurance?.effective_date
      },
      retirement: {
        enrolled: zenefitsData.retirement?.enrolled || false,
        contributionPercentage: zenefitsData.retirement?.contribution_percentage,
        matchPercentage: zenefitsData.retirement?.company_match_percentage
      },
      eligibilityDate: zenefitsData.eligibility_date,
      isEligible: zenefitsData.is_eligible || false
    };
  }

  private mapEmploymentType(zenefitsType: string): 'full_time' | 'part_time' | 'contract' | 'per_diem' {
    const mapping: Record<string, 'full_time' | 'part_time' | 'contract' | 'per_diem'> = {
      'full_time': 'full_time',
      'part_time': 'part_time',
      'contractor': 'contract',
      'intern': 'part_time'
    };
    
    return mapping[zenefitsType] || 'full_time';
  }

  private mapEmployeeStatus(zenefitsStatus: string): 'active' | 'inactive' | 'terminated' | 'on_leave' {
    const mapping: Record<string, 'active' | 'inactive' | 'terminated' | 'on_leave'> = {
      'active': 'active',
      'inactive': 'inactive',
      'terminated': 'terminated',
      'on_leave': 'on_leave'
    };
    
    return mapping[zenefitsStatus] || 'inactive';
  }

  // Database operation placeholders - will be implemented with actual database client
  private async findExistingEmployee(employeeId: string): Promise<any> {
    // Query database for existing staff member by employee_id
    return null; // Placeholder
  }

  private async findStaffMemberByZenefitsId(zenefitsId: string): Promise<any> {
    // Query database for staff member by zenefits_employee_id
    return null; // Placeholder
  }

  private async findExistingAvailability(staffMemberId: string, date: string, zenefitsLeaveId: string): Promise<any> {
    // Query database for existing availability record
    return null; // Placeholder
  }

  private async createStaffMember(data: any): Promise<any> {
    // Create new staff member in database
    return null; // Placeholder
  }

  private async updateStaffMember(id: string, data: any): Promise<any> {
    // Update existing staff member in database
    return null; // Placeholder
  }

  private async createStaffAvailability(data: any): Promise<any> {
    // Create new availability record in database
    return null; // Placeholder
  }

  private async updateStaffAvailability(id: string, data: any): Promise<any> {
    // Update existing availability record in database
    return null; // Placeholder
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      await this.authenticate();
      
      // Test basic API connectivity
      const response = await this.makeRequest('/employees?limit=1');
      
      return {
        status: 'healthy',
        details: {
          recordCount: response.data?.length || 0,
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