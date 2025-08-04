import { DeputyClient, DeputyAvailability, DeputyEmployee, DeputyTimesheet } from '@ganger/integrations';
import { StaffMember } from '@/types/staffing';
import { formatDate } from '@ganger/utils';

export interface StaffAvailabilityData {
  staffMemberId: string;
  deputyEmployeeId: number;
  date: string;
  isAvailable: boolean;
  availableStart?: string;
  availableEnd?: string;
  currentHours: number;
  weeklyHours: number;
  maxWeeklyHours: number;
  overtimeApproved: boolean;
}

export interface WeeklyHoursSummary {
  staffMemberId: string;
  weekStartDate: string;
  weekEndDate: string;
  scheduledHours: number;
  workedHours: number;
  totalHours: number;
  remainingHours: number;
  requiresApproval: boolean;
}

export class DeputyService {
  private client: DeputyClient;
  private deputyStaffMap: Map<string, number> = new Map(); // Maps our staff IDs to Deputy employee IDs

  constructor() {
    // Initialize Deputy client with environment variables
    this.client = new DeputyClient({
      baseUrl: process.env.DEPUTY_BASE_URL || 'https://gangerdermatology.deputy.com',
      accessToken: process.env.DEPUTY_ACCESS_TOKEN || '',
      environment: (process.env.DEPUTY_ENVIRONMENT as 'sandbox' | 'production') || 'production'
    });
  }

  /**
   * Get staff availability from Deputy for a specific date range
   */
  async getStaffAvailability(
    staffMembers: StaffMember[],
    startDate: Date,
    endDate: Date
  ): Promise<StaffAvailabilityData[]> {
    const availabilityData: StaffAvailabilityData[] = [];

    try {
      // First, sync staff member mappings
      await this.syncStaffMappings(staffMembers);

      // Get availability for all staff members
      const deputyAvailability = await this.client.getAvailability(
        undefined,
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Get timesheets to calculate weekly hours
      const weekStart = this.getWeekStart(startDate);
      const weekEnd = this.getWeekEnd(endDate);
      const timesheets = await this.client.getTimesheets(
        undefined,
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

      // Process each staff member
      for (const staff of staffMembers) {
        const deputyId = this.deputyStaffMap.get(staff.id);
        if (!deputyId) continue;

        // Calculate availability for each date in range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = formatDate(currentDate);
          
          // Find availability records for this date
          const dayAvailability = deputyAvailability.filter(a => 
            a.employee === deputyId &&
            formatDate(new Date(a.start)) === dateStr
          );

          // Calculate weekly hours
          const weeklyHours = this.calculateWeeklyHours(
            deputyId,
            timesheets,
            currentDate
          );

          // Determine if available
          const isAvailable = dayAvailability.length > 0 && 
            !dayAvailability.some(a => a.unavailable);

          // Get available time range
          let availableStart: string | undefined;
          let availableEnd: string | undefined;
          
          if (isAvailable && dayAvailability.length > 0) {
            // Find earliest start and latest end
            availableStart = dayAvailability
              .map(a => new Date(a.start))
              .sort((a, b) => a.getTime() - b.getTime())[0]
              .toTimeString().split(' ')[0];
              
            availableEnd = dayAvailability
              .map(a => new Date(a.end))
              .sort((a, b) => b.getTime() - a.getTime())[0]
              .toTimeString().split(' ')[0];
          }

          availabilityData.push({
            staffMemberId: staff.id,
            deputyEmployeeId: deputyId,
            date: dateStr,
            isAvailable,
            availableStart: availableStart || staff.availability_start_time,
            availableEnd: availableEnd || staff.availability_end_time,
            currentHours: 0, // Will be calculated based on existing schedules
            weeklyHours: weeklyHours.totalHours,
            maxWeeklyHours: staff.max_hours_per_week || 40,
            overtimeApproved: weeklyHours.totalHours > 40 && weeklyHours.overtimeApproved
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      return availabilityData;
    } catch (error) {
      console.error('Failed to fetch staff availability from Deputy:', error);
      
      // Fallback to local data if Deputy is unavailable
      return this.getFallbackAvailability(staffMembers, startDate, endDate);
    }
  }

  /**
   * Check if adding a shift would exceed weekly hour limits
   */
  async checkWeeklyHourLimit(
    staffMemberId: string,
    proposedDate: Date,
    proposedHours: number
  ): Promise<{
    allowed: boolean;
    currentHours: number;
    proposedTotal: number;
    maxHours: number;
    requiresApproval: boolean;
    message?: string;
  }> {
    const deputyId = this.deputyStaffMap.get(staffMemberId);
    if (!deputyId) {
      return {
        allowed: true,
        currentHours: 0,
        proposedTotal: proposedHours,
        maxHours: 40,
        requiresApproval: false
      };
    }

    try {
      const weekStart = this.getWeekStart(proposedDate);
      const weekEnd = this.getWeekEnd(proposedDate);
      
      // Get current week's timesheets
      const timesheets = await this.client.getTimesheets(
        deputyId,
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

      const currentHours = timesheets.reduce((total, ts) => 
        total + (ts.totalTime / 3600), 0 // Convert seconds to hours
      );

      const proposedTotal = currentHours + proposedHours;
      const maxHours = 40; // Standard maximum, can be overridden

      return {
        allowed: proposedTotal <= maxHours,
        currentHours,
        proposedTotal,
        maxHours,
        requiresApproval: proposedTotal > maxHours,
        message: proposedTotal > maxHours 
          ? `This would exceed the 40-hour weekly limit (${proposedTotal.toFixed(1)}h total). Manager approval required.`
          : undefined
      };
    } catch (error) {
      console.error('Failed to check weekly hour limit:', error);
      
      // Allow with warning if Deputy check fails
      return {
        allowed: true,
        currentHours: 0,
        proposedTotal: proposedHours,
        maxHours: 40,
        requiresApproval: false,
        message: 'Unable to verify weekly hours. Please check manually.'
      };
    }
  }

  /**
   * Get weekly hours summary for all staff
   */
  async getWeeklyHoursSummary(
    staffMembers: StaffMember[],
    weekDate: Date
  ): Promise<WeeklyHoursSummary[]> {
    const summaries: WeeklyHoursSummary[] = [];
    const weekStart = this.getWeekStart(weekDate);
    const weekEnd = this.getWeekEnd(weekDate);

    try {
      await this.syncStaffMappings(staffMembers);

      const allTimesheets = await this.client.getTimesheets(
        undefined,
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

      for (const staff of staffMembers) {
        const deputyId = this.deputyStaffMap.get(staff.id);
        if (!deputyId) continue;

        const staffTimesheets = allTimesheets.filter(ts => ts.employee === deputyId);
        const workedHours = staffTimesheets.reduce((total, ts) => 
          total + (ts.totalTime / 3600), 0
        );

        // TODO: Get scheduled hours from our system
        const scheduledHours = 0;
        const totalHours = workedHours + scheduledHours;
        const maxHours = staff.max_hours_per_week || 40;

        summaries.push({
          staffMemberId: staff.id,
          weekStartDate: formatDate(weekStart),
          weekEndDate: formatDate(weekEnd),
          scheduledHours,
          workedHours,
          totalHours,
          remainingHours: Math.max(0, maxHours - totalHours),
          requiresApproval: totalHours > maxHours
        });
      }

      return summaries;
    } catch (error) {
      console.error('Failed to get weekly hours summary:', error);
      return [];
    }
  }

  /**
   * Sync staff member mappings with Deputy
   */
  private async syncStaffMappings(staffMembers: StaffMember[]): Promise<void> {
    try {
      const deputyEmployees = await this.client.getEmployees();
      
      for (const staff of staffMembers) {
        // Try to match by email first
        const deputyEmployee = deputyEmployees.find(e => 
          e.email.toLowerCase() === staff.email.toLowerCase()
        );

        if (deputyEmployee) {
          this.deputyStaffMap.set(staff.id, deputyEmployee.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync staff mappings:', error);
    }
  }

  /**
   * Calculate weekly hours for a Deputy employee
   */
  private calculateWeeklyHours(
    deputyEmployeeId: number,
    timesheets: DeputyTimesheet[],
    date: Date
  ): { totalHours: number; overtimeApproved: boolean } {
    const weekStart = this.getWeekStart(date);
    const weekEnd = this.getWeekEnd(date);

    const weekTimesheets = timesheets.filter(ts => {
      const tsDate = new Date(ts.start);
      return ts.employee === deputyEmployeeId &&
        tsDate >= weekStart &&
        tsDate <= weekEnd;
    });

    const totalHours = weekTimesheets.reduce((total, ts) => 
      total + (ts.totalTime / 3600), 0
    );

    // Check if any overtime has been approved
    const overtimeApproved = weekTimesheets.some(ts => 
      ts.approved && ts.totalTime > 8 * 3600 // More than 8 hours in a day
    );

    return { totalHours, overtimeApproved };
  }

  /**
   * Get week start date (Sunday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  /**
   * Get week end date (Saturday)
   */
  private getWeekEnd(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 6;
    return new Date(d.setDate(diff));
  }

  /**
   * Fallback availability when Deputy is unavailable
   */
  private getFallbackAvailability(
    staffMembers: StaffMember[],
    startDate: Date,
    endDate: Date
  ): StaffAvailabilityData[] {
    const availabilityData: StaffAvailabilityData[] = [];

    for (const staff of staffMembers) {
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        const dayOfWeek = currentDate.getDay();
        
        // Assume unavailable on weekends
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Check if date is in unavailable dates
        const isUnavailable = staff.unavailable_dates.includes(dateStr);

        availabilityData.push({
          staffMemberId: staff.id,
          deputyEmployeeId: 0,
          date: dateStr,
          isAvailable: !isWeekend && !isUnavailable,
          availableStart: staff.availability_start_time,
          availableEnd: staff.availability_end_time,
          currentHours: 0,
          weeklyHours: 0,
          maxWeeklyHours: staff.max_hours_per_week || 40,
          overtimeApproved: false
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return availabilityData;
  }
}