/**
 * Pharmaceutical Scheduling Database Queries
 * Comprehensive data access layer for pharmaceutical rep scheduling system
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface PharmaRepresentative {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  companyName: string;
  territory?: string;
  title?: string;
  isActive: boolean;
  lastLogin?: string;
  accountCreatedAt: string;
  createdBy?: string;
  notes?: string;
  preferredLocations: string[];
  specialties: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SchedulingActivity {
  id: string;
  activityName: string;
  location: string;
  locationAddress: string;
  durationMinutes: number;
  blockOffMinutes: number;
  appointmentType: 'in_person' | 'virtual';
  maxParticipants: number;
  requiresApproval: boolean;
  isActive: boolean;
  availableDays: number[];
  availableTimes: Record<string, Array<{ start: string; end: string }>>;
  bookingWindowWeeks: number;
  cancellationHours: number;
  description?: string;
  specialInstructions?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LunchAvailabilityConfig {
  id: string;
  locationName: string;
  googleCalendarId: string;
  availableDays: number[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  bookingWindowWeeks: number;
  minAdvanceHours: number;
  locationAddress: string;
  specialInstructions?: string;
  maxAttendees: number;
  isActive: boolean;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LunchTimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  locationName: string;
  conflictReason?: string;
}

export interface LunchBookingValidation {
  isValid: boolean;
  errorMessage?: string;
  dayOfWeek: number;
  isAvailableDay: boolean;
  withinTimeWindow: boolean;
  meetsAdvanceNotice: boolean;
}

export interface PharmaAppointment {
  id: string;
  activityId: string;
  repId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  location: string;
  locationAddress: string;
  participantCount: number;
  approvalStatus: 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: string;
  denialReason?: string;
  specialRequests?: string;
  confirmationSent: boolean;
  reminderSent: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  completedAt?: string;
  googleCalendarEventId?: string;
  bookingSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentParticipant {
  id: string;
  appointmentId: string;
  staffEmail: string;
  staffName: string;
  participationStatus: 'invited' | 'confirmed' | 'declined' | 'attended';
  rsvpAt?: string;
  attendanceConfirmed: boolean;
  notes?: string;
  notificationSent: boolean;
  createdAt: string;
}

export interface AvailabilityOverride {
  id: string;
  activityId: string;
  overrideDate: string;
  overrideType: 'blackout' | 'special_hours' | 'closed';
  customTimes?: Record<string, Array<{ start: string; end: string }>>;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

export interface PharmaAnalytics {
  id: string;
  analyticsDate: string;
  location: string;
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  deniedAppointments: number;
  completedAppointments: number;
  totalParticipants: number;
  uniqueReps: number;
  uniqueCompanies: number;
  averageBookingLeadTimeDays?: number;
  averageApprovalTimeHours?: number;
  cancellationRate?: number;
  attendanceRate?: number;
  approvalRate?: number;
  mostPopularTimeSlot?: string;
  busiestDayOfWeek?: number;
  peakBookingHour?: number;
  totalCommunicationVolume: number;
  createdAt: string;
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflictReason?: string;
  existingAppointments?: PharmaAppointment[];
}

export interface ConflictCheck {
  hasConflicts: boolean;
  conflictingAppointments: PharmaAppointment[];
  conflictReasons: string[];
}

// =====================================================
// PHARMACEUTICAL SCHEDULING QUERIES CLASS
// =====================================================

export class PharmaSchedulingQueries {
  private db: any;

  constructor(supabaseClient: any) {
    this.db = supabaseClient;
  }

  // =====================================================
  // PHARMACEUTICAL REPRESENTATIVE QUERIES
  // =====================================================

  async createPharmaRep(repData: Omit<PharmaRepresentative, 'id' | 'createdAt' | 'updatedAt'>): Promise<PharmaRepresentative> {
    const { data, error } = await this.db
      .from('pharma_representatives')
      .insert([{
        email: repData.email,
        first_name: repData.firstName,
        last_name: repData.lastName,
        phone_number: repData.phoneNumber,
        company_name: repData.companyName,
        territory: repData.territory,
        title: repData.title,
        is_active: repData.isActive,
        created_by: repData.createdBy,
        notes: repData.notes,
        preferred_locations: repData.preferredLocations,
        specialties: repData.specialties
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapPharmaRep(data);
  }

  async getPharmaRepById(repId: string): Promise<PharmaRepresentative | null> {
    const { data, error } = await this.db
      .from('pharma_representatives')
      .select('*')
      .eq('id', repId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return this.mapPharmaRep(data);
  }

  async getPharmaRepByEmail(email: string): Promise<PharmaRepresentative | null> {
    const { data, error } = await this.db
      .from('pharma_representatives')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return this.mapPharmaRep(data);
  }

  async getActivePharmaReps(companyFilter?: string, territoryFilter?: string): Promise<PharmaRepresentative[]> {
    let query = this.db
      .from('pharma_representatives')
      .select('*')
      .eq('is_active', true)
      .order('company_name', { ascending: true })
      .order('last_name', { ascending: true });

    if (companyFilter) {
      query = query.ilike('company_name', `%${companyFilter}%`);
    }

    if (territoryFilter) {
      query = query.ilike('territory', `%${territoryFilter}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(this.mapPharmaRep);
  }

  async updatePharmaRep(repId: string, updates: Partial<PharmaRepresentative>): Promise<PharmaRepresentative> {
    const updateData: any = {};
    
    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName) updateData.last_name = updates.lastName;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.companyName) updateData.company_name = updates.companyName;
    if (updates.territory !== undefined) updateData.territory = updates.territory;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.preferredLocations) updateData.preferred_locations = updates.preferredLocations;
    if (updates.specialties) updateData.specialties = updates.specialties;

    const { data, error } = await this.db
      .from('pharma_representatives')
      .update(updateData)
      .eq('id', repId)
      .select()
      .single();

    if (error) throw error;
    return this.mapPharmaRep(data);
  }

  async updateRepLastLogin(repId: string): Promise<void> {
    const { error } = await this.db
      .from('pharma_representatives')
      .update({ last_login: new Date().toISOString() })
      .eq('id', repId);

    if (error) throw error;
  }

  // =====================================================
  // SCHEDULING ACTIVITY QUERIES
  // =====================================================

  async createSchedulingActivity(activityData: Omit<SchedulingActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<SchedulingActivity> {
    const { data, error } = await this.db
      .from('scheduling_activities')
      .insert([{
        activity_name: activityData.activityName,
        location: activityData.location,
        location_address: activityData.locationAddress,
        duration_minutes: activityData.durationMinutes,
        block_off_minutes: activityData.blockOffMinutes,
        appointment_type: activityData.appointmentType,
        max_participants: activityData.maxParticipants,
        requires_approval: activityData.requiresApproval,
        is_active: activityData.isActive,
        available_days: activityData.availableDays,
        available_times: activityData.availableTimes,
        booking_window_weeks: activityData.bookingWindowWeeks,
        cancellation_hours: activityData.cancellationHours,
        description: activityData.description,
        special_instructions: activityData.specialInstructions,
        created_by: activityData.createdBy
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapSchedulingActivity(data);
  }

  async getSchedulingActivities(locationFilter?: string, activeOnly = true): Promise<SchedulingActivity[]> {
    let query = this.db
      .from('scheduling_activities')
      .select('*')
      .order('location', { ascending: true })
      .order('activity_name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (locationFilter) {
      query = query.eq('location', locationFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(this.mapSchedulingActivity);
  }

  async getSchedulingActivityById(activityId: string): Promise<SchedulingActivity | null> {
    const { data, error } = await this.db
      .from('scheduling_activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return this.mapSchedulingActivity(data);
  }

  async updateSchedulingActivity(activityId: string, updates: Partial<SchedulingActivity>): Promise<SchedulingActivity> {
    const updateData: any = {};
    
    if (updates.activityName) updateData.activity_name = updates.activityName;
    if (updates.location) updateData.location = updates.location;
    if (updates.locationAddress) updateData.location_address = updates.locationAddress;
    if (updates.durationMinutes) updateData.duration_minutes = updates.durationMinutes;
    if (updates.blockOffMinutes !== undefined) updateData.block_off_minutes = updates.blockOffMinutes;
    if (updates.appointmentType) updateData.appointment_type = updates.appointmentType;
    if (updates.maxParticipants) updateData.max_participants = updates.maxParticipants;
    if (updates.requiresApproval !== undefined) updateData.requires_approval = updates.requiresApproval;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.availableDays) updateData.available_days = updates.availableDays;
    if (updates.availableTimes) updateData.available_times = updates.availableTimes;
    if (updates.bookingWindowWeeks) updateData.booking_window_weeks = updates.bookingWindowWeeks;
    if (updates.cancellationHours !== undefined) updateData.cancellation_hours = updates.cancellationHours;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.specialInstructions !== undefined) updateData.special_instructions = updates.specialInstructions;

    const { data, error } = await this.db
      .from('scheduling_activities')
      .update(updateData)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    return this.mapSchedulingActivity(data);
  }

  // =====================================================
  // PHARMACEUTICAL APPOINTMENT QUERIES
  // =====================================================

  async createPharmaAppointment(appointmentData: Omit<PharmaAppointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<PharmaAppointment> {
    const { data, error } = await this.db
      .from('pharma_appointments')
      .insert([{
        activity_id: appointmentData.activityId,
        rep_id: appointmentData.repId,
        appointment_date: appointmentData.appointmentDate,
        start_time: appointmentData.startTime,
        end_time: appointmentData.endTime,
        status: appointmentData.status,
        location: appointmentData.location,
        location_address: appointmentData.locationAddress,
        participant_count: appointmentData.participantCount,
        approval_status: appointmentData.approvalStatus,
        special_requests: appointmentData.specialRequests,
        booking_source: appointmentData.bookingSource || 'web'
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapPharmaAppointment(data);
  }

  async getPharmaAppointmentById(appointmentId: string): Promise<PharmaAppointment | null> {
    const { data, error } = await this.db
      .from('pharma_appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return this.mapPharmaAppointment(data);
  }

  async getPharmaAppointments(filters?: {
    repId?: string;
    activityId?: string;
    location?: string;
    status?: string;
    approvalStatus?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<PharmaAppointment[]> {
    let query = this.db
      .from('pharma_appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (filters?.repId) {
      query = query.eq('rep_id', filters.repId);
    }

    if (filters?.activityId) {
      query = query.eq('activity_id', filters.activityId);
    }

    if (filters?.location) {
      query = query.eq('location', filters.location);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.approvalStatus) {
      query = query.eq('approval_status', filters.approvalStatus);
    }

    if (filters?.startDate) {
      query = query.gte('appointment_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('appointment_date', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(this.mapPharmaAppointment);
  }

  async getUpcomingAppointments(days = 7): Promise<PharmaAppointment[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    return this.getPharmaAppointments({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'confirmed'
    });
  }

  async getPendingApprovals(): Promise<PharmaAppointment[]> {
    return this.getPharmaAppointments({
      approvalStatus: 'pending'
    });
  }

  async updatePharmaAppointment(appointmentId: string, updates: Partial<PharmaAppointment>): Promise<PharmaAppointment> {
    const updateData: any = {};
    
    if (updates.appointmentDate) updateData.appointment_date = updates.appointmentDate;
    if (updates.startTime) updateData.start_time = updates.startTime;
    if (updates.endTime) updateData.end_time = updates.endTime;
    if (updates.status) updateData.status = updates.status;
    if (updates.participantCount !== undefined) updateData.participant_count = updates.participantCount;
    if (updates.approvalStatus) updateData.approval_status = updates.approvalStatus;
    if (updates.approvedBy) updateData.approved_by = updates.approvedBy;
    if (updates.approvedAt) updateData.approved_at = updates.approvedAt;
    if (updates.denialReason !== undefined) updateData.denial_reason = updates.denialReason;
    if (updates.specialRequests !== undefined) updateData.special_requests = updates.specialRequests;
    if (updates.confirmationSent !== undefined) updateData.confirmation_sent = updates.confirmationSent;
    if (updates.reminderSent !== undefined) updateData.reminder_sent = updates.reminderSent;
    if (updates.cancelledAt) updateData.cancelled_at = updates.cancelledAt;
    if (updates.cancelledBy) updateData.cancelled_by = updates.cancelledBy;
    if (updates.cancellationReason) updateData.cancellation_reason = updates.cancellationReason;
    if (updates.completedAt) updateData.completed_at = updates.completedAt;
    if (updates.googleCalendarEventId) updateData.google_calendar_event_id = updates.googleCalendarEventId;

    const { data, error } = await this.db
      .from('pharma_appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return this.mapPharmaAppointment(data);
  }

  async approveAppointment(appointmentId: string, approvedBy: string): Promise<PharmaAppointment> {
    return this.updatePharmaAppointment(appointmentId, {
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
      status: 'confirmed'
    });
  }

  async denyAppointment(appointmentId: string, approvedBy: string, denialReason: string): Promise<PharmaAppointment> {
    return this.updatePharmaAppointment(appointmentId, {
      approvalStatus: 'denied',
      approvedBy,
      approvedAt: new Date().toISOString(),
      denialReason,
      status: 'cancelled'
    });
  }

  async cancelAppointment(appointmentId: string, cancelledBy: string, cancellationReason?: string): Promise<PharmaAppointment> {
    return this.updatePharmaAppointment(appointmentId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy,
      cancellationReason
    });
  }

  // =====================================================
  // AVAILABILITY AND CONFLICT CHECKING
  // =====================================================

  async checkAppointmentConflicts(
    repId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<ConflictCheck> {
    const { data, error } = await this.db
      .rpc('check_appointment_conflicts', {
        p_rep_id: repId,
        p_date: appointmentDate,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_appointment_id: excludeAppointmentId
      });

    if (error) throw error;

    return {
      hasConflicts: data[0]?.conflict_exists || false,
      conflictingAppointments: data[0]?.conflicting_appointments || [],
      conflictReasons: data[0]?.conflict_exists ? ['Time slot already booked'] : []
    };
  }

  async getAvailableSlots(
    activityId: string,
    startDate: string,
    endDate: string,
    includeBooked = false
  ): Promise<AvailableSlot[]> {
    // Get activity details
    const activity = await this.getSchedulingActivityById(activityId);
    if (!activity) {
      throw new Error(`Activity ${activityId} not found`);
    }

    // Get existing appointments in date range
    const existingAppointments = await this.getPharmaAppointments({
      activityId,
      startDate,
      endDate,
      status: 'confirmed'
    });

    // Get availability overrides
    const { data: overrides, error } = await this.db
      .from('availability_overrides')
      .select('*')
      .eq('activity_id', activityId)
      .gte('override_date', startDate)
      .lte('override_date', endDate);

    if (error) throw error;

    const slots: AvailableSlot[] = [];
    const overrideMap = new Map((overrides as AvailabilityOverride[])?.map((o: AvailabilityOverride) => [o.overrideDate, o]) || []);

    // Generate slots for each date in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert Sunday from 0 to 7
      
      // Check if activity is available on this day
      if (!activity.availableDays.includes(dayOfWeek)) {
        continue;
      }

      // Check for overrides
      const override = overrideMap.get(dateStr);
      if (override && (override.overrideType === 'blackout' || override.overrideType === 'closed')) {
        continue;
      }

      // Get available times for this day
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      let availableTimes = activity.availableTimes[dayName] || [];

      // Use override times if special hours
      if (override && override.overrideType === 'special_hours' && override.customTimes) {
        availableTimes = override.customTimes[dayName] || [];
      }

      // Generate time slots
      for (const timeRange of availableTimes) {
        const slotStart = timeRange.start;
        const slotEnd = timeRange.end;

        // Check for conflicts with existing appointments
        const conflictingAppointments = existingAppointments.filter(apt => 
          apt.appointmentDate === dateStr &&
          this.timeRangesOverlap(slotStart, slotEnd, apt.startTime, apt.endTime)
        );

        const isAvailable = conflictingAppointments.length === 0;

        if (isAvailable || includeBooked) {
          slots.push({
            date: dateStr,
            startTime: slotStart,
            endTime: slotEnd,
            isAvailable,
            conflictReason: isAvailable ? undefined : 'Time slot already booked',
            existingAppointments: conflictingAppointments.length > 0 ? conflictingAppointments : undefined
          });
        }
      }
    }

    return slots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  // =====================================================
  // ANALYTICS QUERIES
  // =====================================================

  async getAnalytics(
    startDate: string,
    endDate: string,
    location?: string
  ): Promise<PharmaAnalytics[]> {
    let query = this.db
      .from('pharma_analytics')
      .select('*')
      .gte('analytics_date', startDate)
      .lte('analytics_date', endDate)
      .order('analytics_date', { ascending: true });

    if (location) {
      query = query.eq('location', location);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(this.mapPharmaAnalytics);
  }

  async updateAnalytics(date: string, location: string): Promise<void> {
    const { error } = await this.db
      .rpc('update_pharma_analytics', {
        p_date: date,
        p_location: location
      });

    if (error) throw error;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  private mapPharmaRep(data: any): PharmaRepresentative {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phoneNumber: data.phone_number,
      companyName: data.company_name,
      territory: data.territory,
      title: data.title,
      isActive: data.is_active,
      lastLogin: data.last_login,
      accountCreatedAt: data.account_created_at,
      createdBy: data.created_by,
      notes: data.notes,
      preferredLocations: data.preferred_locations || [],
      specialties: data.specialties || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSchedulingActivity(data: any): SchedulingActivity {
    return {
      id: data.id,
      activityName: data.activity_name,
      location: data.location,
      locationAddress: data.location_address,
      durationMinutes: data.duration_minutes,
      blockOffMinutes: data.block_off_minutes,
      appointmentType: data.appointment_type,
      maxParticipants: data.max_participants,
      requiresApproval: data.requires_approval,
      isActive: data.is_active,
      availableDays: data.available_days || [],
      availableTimes: data.available_times || {},
      bookingWindowWeeks: data.booking_window_weeks,
      cancellationHours: data.cancellation_hours,
      description: data.description,
      specialInstructions: data.special_instructions,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapPharmaAppointment(data: any): PharmaAppointment {
    return {
      id: data.id,
      activityId: data.activity_id,
      repId: data.rep_id,
      appointmentDate: data.appointment_date,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status,
      location: data.location,
      locationAddress: data.location_address,
      participantCount: data.participant_count,
      approvalStatus: data.approval_status,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      denialReason: data.denial_reason,
      specialRequests: data.special_requests,
      confirmationSent: data.confirmation_sent,
      reminderSent: data.reminder_sent,
      cancelledAt: data.cancelled_at,
      cancelledBy: data.cancelled_by,
      cancellationReason: data.cancellation_reason,
      completedAt: data.completed_at,
      googleCalendarEventId: data.google_calendar_event_id,
      bookingSource: data.booking_source,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapPharmaAnalytics(data: any): PharmaAnalytics {
    return {
      id: data.id,
      analyticsDate: data.analytics_date,
      location: data.location,
      totalAppointments: data.total_appointments,
      confirmedAppointments: data.confirmed_appointments,
      cancelledAppointments: data.cancelled_appointments,
      deniedAppointments: data.denied_appointments,
      completedAppointments: data.completed_appointments,
      totalParticipants: data.total_participants,
      uniqueReps: data.unique_reps,
      uniqueCompanies: data.unique_companies,
      averageBookingLeadTimeDays: data.average_booking_lead_time_days,
      averageApprovalTimeHours: data.average_approval_time_hours,
      cancellationRate: data.cancellation_rate,
      attendanceRate: data.attendance_rate,
      approvalRate: data.approval_rate,
      mostPopularTimeSlot: data.most_popular_time_slot,
      busiestDayOfWeek: data.busiest_day_of_week,
      peakBookingHour: data.peak_booking_hour,
      totalCommunicationVolume: data.total_communication_volume,
      createdAt: data.created_at
    };
  }

  // =====================================================
  // LUNCH AVAILABILITY CONFIGURATION METHODS
  // =====================================================

  async getActiveLunchLocations(): Promise<Array<{
    locationName: string;
    locationAddress: string;
    durationMinutes: number;
    bookingWindowWeeks: number;
    availableDays: number[];
    startTime: string;
    endTime: string;
  }>> {
    const { data, error } = await this.db
      .rpc('get_active_lunch_locations');

    if (error) throw error;
    return data.map((item: any) => ({
      locationName: item.location_name,
      locationAddress: item.location_address,
      durationMinutes: item.duration_minutes,
      bookingWindowWeeks: item.booking_window_weeks,
      availableDays: item.available_days,
      startTime: item.start_time,
      endTime: item.end_time
    }));
  }

  async getLunchConfigByLocation(locationName: string): Promise<LunchAvailabilityConfig | null> {
    const { data, error } = await this.db
      .rpc('get_lunch_config_by_location', { p_location_name: locationName });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const item = data[0];
    return this.mapLunchConfig(item);
  }

  async getAllLunchConfigs(): Promise<LunchAvailabilityConfig[]> {
    const { data, error } = await this.db
      .from('lunch_availability_config')
      .select('*')
      .order('location_name');

    if (error) throw error;
    return data.map((item: any) => this.mapLunchConfig(item));
  }

  async updateLunchConfig(
    locationName: string,
    updates: Partial<LunchAvailabilityConfig>,
    updatedBy?: string
  ): Promise<boolean> {
    const { data, error } = await this.db
      .rpc('update_lunch_config', {
        p_location_name: locationName,
        p_available_days: updates.availableDays,
        p_start_time: updates.startTime,
        p_end_time: updates.endTime,
        p_duration_minutes: updates.durationMinutes,
        p_booking_window_weeks: updates.bookingWindowWeeks,
        p_min_advance_hours: updates.minAdvanceHours,
        p_location_address: updates.locationAddress,
        p_special_instructions: updates.specialInstructions,
        p_max_attendees: updates.maxAttendees,
        p_is_active: updates.isActive,
        p_updated_by: updatedBy
      });

    if (error) throw error;
    return data === true;
  }

  async validateLunchTimeSlot(
    locationName: string,
    appointmentDate: string,
    startTime: string
  ): Promise<LunchBookingValidation> {
    const { data, error } = await this.db
      .rpc('validate_lunch_time_slot', {
        p_location_name: locationName,
        p_appointment_date: appointmentDate,
        p_start_time: startTime
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Validation failed',
        dayOfWeek: 0,
        isAvailableDay: false,
        withinTimeWindow: false,
        meetsAdvanceNotice: false
      };
    }

    const result = data[0];
    return {
      isValid: result.is_valid,
      errorMessage: result.error_message,
      dayOfWeek: result.day_of_week,
      isAvailableDay: result.is_available_day,
      withinTimeWindow: result.within_time_window,
      meetsAdvanceNotice: result.meets_advance_notice
    };
  }

  // =====================================================
  // LUNCH APPOINTMENT MANAGEMENT
  // =====================================================

  async createLunchAppointment(appointmentData: {
    repName: string;
    companyName: string;
    repEmail: string;
    repPhone?: string;
    location: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    specialRequests?: string;
    confirmationNumber: string;
    googleCalendarEventId?: string;
  }): Promise<PharmaAppointment> {
    // First, get or create the rep
    let rep = await this.getPharmaRepByEmail(appointmentData.repEmail);
    if (!rep) {
      rep = await this.createPharmaRep({
        email: appointmentData.repEmail,
        firstName: appointmentData.repName.split(' ')[0] || 'Unknown',
        lastName: appointmentData.repName.split(' ').slice(1).join(' ') || 'Rep',
        phoneNumber: appointmentData.repPhone,
        companyName: appointmentData.companyName,
        isActive: true,
        accountCreatedAt: new Date().toISOString(),
        preferredLocations: [appointmentData.location],
        specialties: []
      });
    }

    // Create lunch appointment
    const { data, error } = await this.db
      .from('pharma_appointments')
      .insert([{
        activity_id: 'lunch-presentation', // Default lunch activity
        rep_id: rep.id,
        appointment_date: appointmentData.appointmentDate,
        start_time: appointmentData.startTime,
        end_time: appointmentData.endTime,
        status: 'confirmed', // Lunch appointments are auto-confirmed
        location: appointmentData.location,
        participant_count: 1,
        approval_status: 'approved',
        special_requests: appointmentData.specialRequests,
        booking_source: 'lunch_portal',
        google_calendar_event_id: appointmentData.googleCalendarEventId,
        confirmation_number: appointmentData.confirmationNumber
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapPharmaAppointment(data);
  }

  async getLunchAppointmentsByLocation(
    location: string,
    startDate?: string,
    endDate?: string
  ): Promise<PharmaAppointment[]> {
    let query = this.db
      .from('pharma_appointments')
      .select('*')
      .eq('location', location)
      .eq('booking_source', 'lunch_portal')
      .neq('status', 'cancelled');

    if (startDate) {
      query = query.gte('appointment_date', startDate);
    }
    if (endDate) {
      query = query.lte('appointment_date', endDate);
    }

    const { data, error } = await query.order('appointment_date', { ascending: true });
    
    if (error) throw error;
    return data.map((item: any) => this.mapPharmaAppointment(item));
  }

  async checkLunchSlotAvailability(
    location: string,
    appointmentDate: string,
    startTime: string,
    endTime: string
  ): Promise<{ isAvailable: boolean; conflictReason?: string }> {
    // Check configuration first
    const validation = await this.validateLunchTimeSlot(location, appointmentDate, startTime);
    if (!validation.isValid) {
      return {
        isAvailable: false,
        conflictReason: validation.errorMessage
      };
    }

    // Check for existing appointments
    const existingAppointments = await this.db
      .from('pharma_appointments')
      .select('*')
      .eq('location', location)
      .eq('appointment_date', appointmentDate)
      .neq('status', 'cancelled')
      .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

    if (existingAppointments.error) throw existingAppointments.error;

    if (existingAppointments.data && existingAppointments.data.length > 0) {
      return {
        isAvailable: false,
        conflictReason: 'Time slot already booked'
      };
    }

    return { isAvailable: true };
  }

  // =====================================================
  // PRIVATE MAPPING METHODS
  // =====================================================

  private mapLunchConfig(data: any): LunchAvailabilityConfig {
    return {
      id: data.id,
      locationName: data.location_name,
      googleCalendarId: data.google_calendar_id,
      availableDays: data.available_days,
      startTime: data.start_time,
      endTime: data.end_time,
      durationMinutes: data.duration_minutes,
      bookingWindowWeeks: data.booking_window_weeks,
      minAdvanceHours: data.min_advance_hours,
      locationAddress: data.location_address,
      specialInstructions: data.special_instructions,
      maxAttendees: data.max_attendees,
      isActive: data.is_active,
      lastUpdatedBy: data.last_updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}