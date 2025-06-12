import { db } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

/**
 * Deputy API Client for Staff Availability and Schedule Synchronization
 * 
 * Integrates with Deputy API to sync staff availability, push schedules,
 * and maintain workforce management data synchronization.
 */

interface DeputyConfig {
  baseUrl: string;
  apiKey: string;
  domain?: string;
}

interface DeputyEmployee {
  Id: number;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Active: boolean;
  Company: number;
  Location: number;
  EmploymentStatus: string;
  Position: string;
  DateCreated: string;
  DateModified: string;
  Employee: string; // Employee ID
}

interface DeputyAvailability {
  Id: number;
  Employee: number;
  Comment: string;
  Mon: boolean;
  Tue: boolean;
  Wed: boolean;
  Thu: boolean;
  Fri: boolean;
  Sat: boolean;
  Sun: boolean;
  AllDay: boolean;
  StartTime: string; // HH:MM format
  EndTime: string;   // HH:MM format
  StartDate: string; // YYYY-MM-DD format
  EndDate: string;   // YYYY-MM-DD format
  Unavailable: string[]; // Array of unavailable dates
  Creator: number;
  Created: string;
  Modified: string;
}

interface DeputyRoster {
  Id?: number;
  Employee: number;
  StartTime: string; // Unix timestamp
  EndTime: string;   // Unix timestamp
  Memo?: string;
  OperationalUnit: number;
  ConfirmStatus: string;
  ConfirmBy: number;
  ConfirmComment: string;
  Cost: number;
  Creator: number;
  Created?: string;
  Modified?: string;
}

interface DeputyLocation {
  Id: number;
  Company: number;
  CompanyName: string;
  LocationName: string;
  Address: string;
  Contact: string;
  Active: boolean;
}

interface StaffAvailability {
  id?: string;
  staff_member_id: string;
  date_range_start: Date;
  date_range_end: Date;
  days_of_week: number[];
  available_start_time: string;
  available_end_time: string;
  location_preferences: string[];
  unavailable_dates: Date[];
  preferred_providers: string[];
  max_consecutive_days: number;
  min_hours_between_shifts: number;
  overtime_willing: boolean;
  cross_location_willing: boolean;
  notes?: string;
  deputy_availability_id?: string;
  last_updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface StaffSchedule {
  id: string;
  staff_member_id: string;
  schedule_date: Date;
  location_id: string;
  shift_start_time: string;
  shift_end_time: string;
  assigned_providers: string[];
  schedule_type: string;
  status: string;
  deputy_schedule_id?: string;
  staff_member: {
    deputy_user_id?: string;
    first_name: string;
    last_name: string;
  };
}

export class DeputyAPIClient {
  private config: DeputyConfig;
  private readonly baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  constructor(config: DeputyConfig) {
    this.config = config;

    if (!this.config.baseUrl || !this.config.apiKey) {
      throw new Error('Deputy API client requires baseUrl and apiKey');
    }
  }

  /**
   * Make authenticated Deputy API request
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.baseHeaders,
        'Authorization': `OAuth ${this.config.apiKey}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deputy API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get all employees from Deputy
   */
  async getEmployees(filters: { active?: boolean } = {}): Promise<DeputyEmployee[]> {
    try {
      let endpoint = '/resource/Employee';
      
      if (filters.active !== undefined) {
        endpoint += `?search=${JSON.stringify({ Active: filters.active })}`;
      }

      const employees = await this.makeRequest<DeputyEmployee[]>(endpoint);
      
      console.log(`Retrieved ${employees.length} employees from Deputy`);
      return employees;
    } catch (error) {
      console.error('Failed to fetch employees from Deputy:', error);
      throw error;
    }
  }

  /**
   * Get employee availability from Deputy
   */
  async getEmployeeAvailability(employeeId: number): Promise<DeputyAvailability[]> {
    try {
      const endpoint = `/resource/EmployeeAvailability?search=${JSON.stringify({ Employee: employeeId })}`;
      
      const availability = await this.makeRequest<DeputyAvailability[]>(endpoint);
      
      console.log(`Retrieved ${availability.length} availability records for employee ${employeeId}`);
      return availability;
    } catch (error) {
      console.error(`Failed to fetch availability for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get locations from Deputy
   */
  async getLocations(): Promise<DeputyLocation[]> {
    try {
      const locations = await this.makeRequest<DeputyLocation[]>('/resource/Location');
      
      console.log(`Retrieved ${locations.length} locations from Deputy`);
      return locations.filter(loc => loc.Active);
    } catch (error) {
      console.error('Failed to fetch locations from Deputy:', error);
      throw error;
    }
  }

  /**
   * Create roster entry in Deputy
   */
  async createRoster(rosterData: Omit<DeputyRoster, 'Id'>): Promise<DeputyRoster> {
    try {
      const response = await this.makeRequest<DeputyRoster>('/resource/Roster', {
        method: 'POST',
        body: JSON.stringify(rosterData)
      });
      
      console.log(`Created roster entry ${response.Id} in Deputy`);
      return response;
    } catch (error) {
      console.error('Failed to create roster in Deputy:', error);
      throw error;
    }
  }

  /**
   * Update roster entry in Deputy
   */
  async updateRoster(rosterId: string, rosterData: Partial<DeputyRoster>): Promise<DeputyRoster> {
    try {
      const response = await this.makeRequest<DeputyRoster>(`/resource/Roster/${rosterId}`, {
        method: 'POST',
        body: JSON.stringify(rosterData)
      });
      
      console.log(`Updated roster entry ${rosterId} in Deputy`);
      return response;
    } catch (error) {
      console.error(`Failed to update roster ${rosterId} in Deputy:`, error);
      throw error;
    }
  }

  /**
   * Delete roster entry in Deputy
   */
  async deleteRoster(rosterId: string): Promise<void> {
    try {
      await this.makeRequest(`/resource/Roster/${rosterId}`, {
        method: 'DELETE'
      });
      
      console.log(`Deleted roster entry ${rosterId} from Deputy`);
    } catch (error) {
      console.error(`Failed to delete roster ${rosterId} from Deputy:`, error);
      throw error;
    }
  }

  /**
   * Test connection to Deputy API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest<any>('/me');
      
      if (response && response.DisplayName) {
        return {
          success: true,
          message: `Deputy API connection successful for ${response.DisplayName}`
        };
      } else {
        return {
          success: false,
          message: 'Unexpected response from Deputy API'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Deputy API connection failed: ${error.message}`
      };
    }
  }
}

export class DeputyClient {
  private apiClient: DeputyAPIClient;
  private locationMapping: Map<number, string> = new Map();

  constructor() {
    const config: DeputyConfig = {
      baseUrl: process.env.DEPUTY_API_URL || 'https://api.deputy.com/v1',
      apiKey: process.env.DEPUTY_API_KEY || '',
      domain: process.env.DEPUTY_DOMAIN || ''
    };

    this.apiClient = new DeputyAPIClient(config);
  }

  /**
   * Initialize location mapping between Deputy and Ganger systems
   */
  private async initializeLocationMapping(): Promise<void> {
    try {
      const [deputyLocations, gangerLocations] = await Promise.all([
        this.apiClient.getLocations(),
        db.locations.findMany({ where: { is_active: true } })
      ]);

      // Create mapping based on location names or external IDs
      deputyLocations.forEach(deputyLoc => {
        const gangerLoc = gangerLocations.find(gl => 
          gl.name.toLowerCase().includes(deputyLoc.LocationName.toLowerCase()) ||
          deputyLoc.LocationName.toLowerCase().includes(gl.name.toLowerCase())
        );
        
        if (gangerLoc) {
          this.locationMapping.set(deputyLoc.Id, gangerLoc.id);
        }
      });

      console.log(`Initialized ${this.locationMapping.size} location mappings`);
    } catch (error) {
      console.error('Failed to initialize location mapping:', error);
    }
  }

  /**
   * Map Deputy availability to Ganger staff availability format
   */
  private mapDeputyAvailability(
    employee: DeputyEmployee, 
    availability: DeputyAvailability[]
  ): StaffAvailability[] {
    const staffMember = this.findStaffMemberByDeputyId(employee.Id);
    if (!staffMember) {
      console.warn(`No staff member found for Deputy employee ${employee.Id}`);
      return [];
    }

    return availability.map(avail => {
      // Convert Deputy day boolean flags to days_of_week array
      const daysOfWeek: number[] = [];
      if (avail.Sun) daysOfWeek.push(0);
      if (avail.Mon) daysOfWeek.push(1);
      if (avail.Tue) daysOfWeek.push(2);
      if (avail.Wed) daysOfWeek.push(3);
      if (avail.Thu) daysOfWeek.push(4);
      if (avail.Fri) daysOfWeek.push(5);
      if (avail.Sat) daysOfWeek.push(6);

      // Map Deputy location to Ganger location
      const locationPreferences: string[] = [];
      const gangerLocationId = this.locationMapping.get(employee.Location);
      if (gangerLocationId) {
        locationPreferences.push(gangerLocationId);
      }

      // Parse unavailable dates
      const unavailableDates = avail.Unavailable?.map(dateStr => new Date(dateStr)) || [];

      return {
        staff_member_id: staffMember.id,
        date_range_start: new Date(avail.StartDate),
        date_range_end: new Date(avail.EndDate),
        days_of_week: daysOfWeek,
        available_start_time: avail.AllDay ? '00:00:00' : avail.StartTime,
        available_end_time: avail.AllDay ? '23:59:59' : avail.EndTime,
        location_preferences: locationPreferences,
        unavailable_dates: unavailableDates,
        preferred_providers: [], // Deputy doesn't track provider preferences
        max_consecutive_days: 5, // Default value
        min_hours_between_shifts: 12, // Default value
        overtime_willing: false, // Default value
        cross_location_willing: locationPreferences.length === 0, // Willing if no specific preference
        notes: avail.Comment || null,
        deputy_availability_id: avail.Id.toString(),
        last_updated_by: 'deputy_sync',
        created_at: new Date(),
        updated_at: new Date()
      };
    });
  }

  /**
   * Find staff member by Deputy user ID
   */
  private async findStaffMemberByDeputyId(deputyUserId: number): Promise<any> {
    try {
      return await db.staff_members.findFirst({
        where: { deputy_user_id: deputyUserId.toString() }
      });
    } catch (error) {
      console.error(`Failed to find staff member for Deputy ID ${deputyUserId}:`, error);
      return null;
    }
  }

  /**
   * Sync staff availability from Deputy
   */
  async syncStaffAvailability(): Promise<StaffAvailability[]> {
    try {
      console.log('Starting Deputy staff availability sync...');
      
      // Initialize location mapping
      await this.initializeLocationMapping();

      // Get all active employees from Deputy
      const employees = await this.apiClient.getEmployees({ active: true });
      
      if (employees.length === 0) {
        console.warn('No active employees found in Deputy');
        return [];
      }

      const allAvailabilityRecords: StaffAvailability[] = [];

      // Process each employee
      for (const employee of employees) {
        try {
          // Get availability for employee
          const availability = await this.apiClient.getEmployeeAvailability(employee.Id);

          // Map to our staff availability format
          const staffAvailability = this.mapDeputyAvailability(employee, availability);
          allAvailabilityRecords.push(...staffAvailability);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (employeeError) {
          console.error(`Failed to sync availability for employee ${employee.Id}:`, employeeError);
          // Continue with other employees
        }
      }

      // Update database with synced availability
      await this.updateStaffAvailability(allAvailabilityRecords);

      // Audit log the sync
      await auditLog({
        action: 'deputy_availability_sync_completed',
        userId: 'system',
        resourceType: 'staff_availability',
        resourceId: `deputy_sync_${new Date().toISOString()}`,
        metadata: {
          employees_processed: employees.length,
          availability_records_synced: allAvailabilityRecords.length
        }
      });

      console.log(`Deputy availability sync completed: ${allAvailabilityRecords.length} records synced for ${employees.length} employees`);
      return allAvailabilityRecords;
    } catch (error) {
      console.error('Deputy sync error:', error);
      
      // Audit log the error
      await auditLog({
        action: 'deputy_availability_sync_failed',
        userId: 'system',
        resourceType: 'staff_availability',
        resourceId: `deputy_sync_error_${new Date().toISOString()}`,
        metadata: {
          error_message: error.message
        }
      });
      
      throw new Error(`Failed to sync staff availability: ${error.message}`);
    }
  }

  /**
   * Update staff availability in database
   */
  private async updateStaffAvailability(availabilityRecords: StaffAvailability[]): Promise<void> {
    try {
      for (const availability of availabilityRecords) {
        // Check if availability record already exists
        const existing = await db.staff_availability.findFirst({
          where: {
            staff_member_id: availability.staff_member_id,
            deputy_availability_id: availability.deputy_availability_id
          }
        });

        if (existing) {
          // Update existing record
          await db.staff_availability.update({
            where: { id: existing.id },
            data: {
              date_range_start: availability.date_range_start,
              date_range_end: availability.date_range_end,
              days_of_week: availability.days_of_week,
              available_start_time: availability.available_start_time,
              available_end_time: availability.available_end_time,
              location_preferences: availability.location_preferences,
              unavailable_dates: availability.unavailable_dates,
              notes: availability.notes,
              updated_at: new Date()
            }
          });
        } else {
          // Create new record
          await db.staff_availability.create({
            data: availability
          });
        }
      }
      
      console.log(`Updated ${availabilityRecords.length} staff availability records`);
    } catch (error) {
      console.error('Failed to update staff availability:', error);
      throw error;
    }
  }

  /**
   * Push schedules to Deputy
   */
  async pushSchedulesToDeputy(schedules: StaffSchedule[]): Promise<void> {
    try {
      console.log(`Pushing ${schedules.length} schedules to Deputy...`);
      
      for (const schedule of schedules) {
        try {
          if (!schedule.staff_member.deputy_user_id) {
            console.warn(`No Deputy user ID for staff member ${schedule.staff_member_id}`);
            continue;
          }

          // Map location to Deputy operational unit
          const operationalUnit = await this.mapLocationToDeputyOU(schedule.location_id);
          
          // Create or update Deputy roster entry
          const deputyRoster: Omit<DeputyRoster, 'Id'> = {
            Employee: parseInt(schedule.staff_member.deputy_user_id),
            StartTime: this.formatDeputyDateTime(schedule.schedule_date, schedule.shift_start_time),
            EndTime: this.formatDeputyDateTime(schedule.schedule_date, schedule.shift_end_time),
            Memo: `Providers: ${schedule.assigned_providers.join(', ')}`,
            OperationalUnit: operationalUnit,
            ConfirmStatus: 'Draft',
            ConfirmBy: 0,
            ConfirmComment: '',
            Cost: 0,
            Creator: 1 // System user ID
          };

          if (schedule.deputy_schedule_id) {
            // Update existing roster
            await this.apiClient.updateRoster(schedule.deputy_schedule_id, deputyRoster);
          } else {
            // Create new roster
            const response = await this.apiClient.createRoster(deputyRoster);
            
            // Update our schedule with Deputy ID
            await db.staff_schedules.update({
              where: { id: schedule.id },
              data: { deputy_schedule_id: response.Id?.toString() }
            });
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (scheduleError) {
          console.error(`Failed to push schedule ${schedule.id} to Deputy:`, scheduleError);
          // Continue with other schedules
        }
      }
      
      console.log(`Successfully pushed schedules to Deputy`);
    } catch (error) {
      console.error('Deputy push error:', error);
      throw new Error(`Failed to push schedules to Deputy: ${error.message}`);
    }
  }

  /**
   * Format date and time for Deputy API (Unix timestamp)
   */
  private formatDeputyDateTime(date: Date, time: string): string {
    const dateStr = date.toISOString().split('T')[0];
    const datetime = new Date(`${dateStr}T${time}`);
    return (datetime.getTime() / 1000).toString();
  }

  /**
   * Map Ganger location ID to Deputy operational unit
   */
  private async mapLocationToDeputyOU(locationId: string): Promise<number> {
    try {
      // Find the Deputy location ID for this Ganger location
      for (const [deputyLocId, gangerLocId] of this.locationMapping.entries()) {
        if (gangerLocId === locationId) {
          return deputyLocId;
        }
      }
      
      // Default operational unit if no mapping found
      return 1;
    } catch (error) {
      console.error('Failed to map location to Deputy OU:', error);
      return 1;
    }
  }

  /**
   * Cancel schedule in Deputy
   */
  async cancelScheduleInDeputy(deputyScheduleId: string): Promise<void> {
    try {
      await this.apiClient.deleteRoster(deputyScheduleId);
      console.log(`Cancelled schedule ${deputyScheduleId} in Deputy`);
    } catch (error) {
      console.error(`Failed to cancel schedule ${deputyScheduleId} in Deputy:`, error);
      throw error;
    }
  }

  /**
   * Test Deputy API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return this.apiClient.testConnection();
  }
}

export default DeputyClient;