/**
 * Google Calendar Integration for Pharmaceutical Scheduling
 * Staff availability synchronization and calendar event management
 */

import { PharmaSchedulingQueries, PharmaAppointment, AppointmentParticipant } from '@ganger/db';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  serviceAccountEmail?: string;
  privateKey?: string;
  calendarId?: string; // Primary calendar ID
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private';
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  conferenceData?: {
    conferenceSolution?: {
      type: string;
    };
    createRequest?: {
      requestId: string;
    };
  };
}

export interface StaffMember {
  email: string;
  name: string;
  department: string;
  calendarId?: string;
  timezone: string;
  workingHours: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  isActive: boolean;
}

export interface AvailabilityCheck {
  staffEmail: string;
  date: string;
  timeSlots: Array<{
    start: string;
    end: string;
    isAvailable: boolean;
    conflictReason?: string;
    conflictingEvent?: CalendarEvent;
  }>;
  lastChecked: string;
}

export interface CalendarSyncResult {
  success: boolean;
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: Array<{
    eventId?: string;
    error: string;
    details?: any;
  }>;
  lastSyncTime: string;
}

export interface BusyTime {
  start: string;
  end: string;
  summary?: string;
  type: 'busy' | 'tentative' | 'outOfOffice';
}

export class GoogleCalendarService {
  private config: GoogleCalendarConfig;
  private db: PharmaSchedulingQueries;
  private accessTokens: Map<string, { token: string; expiresAt: number }>;
  private staffMembers: Map<string, StaffMember>;

  constructor(config: GoogleCalendarConfig, dbQueries: PharmaSchedulingQueries) {
    this.config = config;
    this.db = dbQueries;
    this.accessTokens = new Map();
    this.staffMembers = new Map();
    
    this.initializeStaffMembers();
  }

  // =====================================================
  // CALENDAR EVENT MANAGEMENT
  // =====================================================

  async createAppointmentEvent(appointment: PharmaAppointment): Promise<string> {
    try {
      // Get appointment details with rep information
      const rep = await this.db.getPharmaRepById(appointment.repId);
      const activity = await this.db.getSchedulingActivityById(appointment.activityId);
      
      if (!rep || !activity) {
        throw new Error('Missing appointment details for calendar event creation');
      }

      const event: CalendarEvent = {
        id: `pharma_${appointment.id}`,
        summary: `Pharmaceutical Meeting - ${rep.companyName}`,
        description: this.buildEventDescription(appointment, rep, activity),
        location: appointment.locationAddress,
        start: {
          dateTime: `${appointment.appointmentDate}T${appointment.startTime}:00`,
          timeZone: 'America/Detroit'
        },
        end: {
          dateTime: `${appointment.appointmentDate}T${appointment.endTime}:00`,
          timeZone: 'America/Detroit'
        },
        attendees: [
          {
            email: rep.email,
            displayName: `${rep.firstName} ${rep.lastName}`,
            responseStatus: 'accepted'
          }
        ],
        status: 'confirmed',
        visibility: 'private',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      };

      // Add staff participants if any
      const participants = await this.getAppointmentParticipants(appointment.id);
      for (const participant of participants) {
        event.attendees?.push({
          email: participant.staffEmail,
          displayName: participant.staffName,
          responseStatus: 'needsAction'
        });
      }

      // Create event in Google Calendar
      const calendarEventId = await this.createCalendarEvent(event);
      
      // Update appointment with calendar event ID
      await this.db.updatePharmaAppointment(appointment.id, {
        googleCalendarEventId: calendarEventId
      });

      return calendarEventId;

    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateAppointmentEvent(appointment: PharmaAppointment): Promise<void> {
    try {
      if (!appointment.googleCalendarEventId) {
        // Create event if it doesn't exist
        await this.createAppointmentEvent(appointment);
        return;
      }

      const rep = await this.db.getPharmaRepById(appointment.repId);
      const activity = await this.db.getSchedulingActivityById(appointment.activityId);
      
      if (!rep || !activity) {
        throw new Error('Missing appointment details for calendar event update');
      }

      const updatedEvent: Partial<CalendarEvent> = {
        summary: `Pharmaceutical Meeting - ${rep.companyName}`,
        description: this.buildEventDescription(appointment, rep, activity),
        location: appointment.locationAddress,
        start: {
          dateTime: `${appointment.appointmentDate}T${appointment.startTime}:00`,
          timeZone: 'America/Detroit'
        },
        end: {
          dateTime: `${appointment.appointmentDate}T${appointment.endTime}:00`,
          timeZone: 'America/Detroit'
        },
        status: appointment.status === 'cancelled' ? 'cancelled' : 'confirmed'
      };

      await this.updateCalendarEvent(appointment.googleCalendarEventId, updatedEvent);

    } catch (error) {
      throw new Error(`Failed to update calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelAppointmentEvent(appointment: PharmaAppointment): Promise<void> {
    try {
      if (!appointment.googleCalendarEventId) {
        return; // No calendar event to cancel
      }

      await this.updateCalendarEvent(appointment.googleCalendarEventId, {
        status: 'cancelled'
      });

    } catch (error) {
      throw new Error(`Failed to cancel calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // STAFF AVAILABILITY CHECKING
  // =====================================================

  async checkStaffAvailability(
    staffEmails: string[],
    date: string,
    startTime: string,
    endTime: string
  ): Promise<Map<string, boolean>> {
    const availability = new Map<string, boolean>();

    for (const email of staffEmails) {
      try {
        const isAvailable = await this.checkSingleStaffAvailability(email, date, startTime, endTime);
        availability.set(email, isAvailable);
      } catch (error) {
        // Default to unavailable if check fails
        availability.set(email, false);
        this.logError(`Failed to check availability for ${email}`, error);
      }
    }

    return availability;
  }

  async checkSingleStaffAvailability(
    staffEmail: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const staff = this.staffMembers.get(staffEmail);
      if (!staff || !staff.isActive) {
        return false;
      }

      // Check working hours
      const dayOfWeek = this.getDayOfWeek(date);
      const workingHours = staff.workingHours[dayOfWeek];
      
      if (!workingHours) {
        return false; // Not a working day
      }

      // Check if requested time is within working hours
      if (startTime < workingHours.start || endTime > workingHours.end) {
        return false;
      }

      // Check calendar for conflicts
      const busyTimes = await this.getStaffBusyTimes(staffEmail, date);
      
      const requestedStart = this.timeToMinutes(startTime);
      const requestedEnd = this.timeToMinutes(endTime);

      for (const busyTime of busyTimes) {
        const busyStart = this.timeToMinutes(busyTime.start.split('T')[1].substring(0, 5));
        const busyEnd = this.timeToMinutes(busyTime.end.split('T')[1].substring(0, 5));

        // Check for overlap
        if (requestedStart < busyEnd && requestedEnd > busyStart) {
          return false; // Conflict found
        }
      }

      return true;

    } catch (error) {
      this.logError(`Failed to check availability for ${staffEmail}`, error);
      return false;
    }
  }

  async getStaffBusyTimes(staffEmail: string, date: string): Promise<BusyTime[]> {
    try {
      const timeMin = `${date}T00:00:00-05:00`;
      const timeMax = `${date}T23:59:59-05:00`;

      const events = await this.getCalendarEvents(staffEmail, timeMin, timeMax);
      
      return events
        .filter(event => event.status !== 'cancelled')
        .map(event => ({
          start: event.start.dateTime,
          end: event.end.dateTime,
          summary: event.summary,
          type: this.getEventType(event)
        }));

    } catch (error) {
      this.logError(`Failed to get busy times for ${staffEmail}`, error);
      return [];
    }
  }

  async getBulkStaffAvailability(
    staffEmails: string[],
    startDate: string,
    endDate: string
  ): Promise<Map<string, AvailabilityCheck[]>> {
    const availability = new Map<string, AvailabilityCheck[]>();

    for (const email of staffEmails) {
      try {
        const staffAvailability = await this.getStaffAvailabilityRange(email, startDate, endDate);
        availability.set(email, staffAvailability);
      } catch (error) {
        this.logError(`Failed to get bulk availability for ${email}`, error);
        availability.set(email, []);
      }
    }

    return availability;
  }

  // =====================================================
  // CALENDAR SYNCHRONIZATION
  // =====================================================

  async syncAppointmentsToCalendar(): Promise<CalendarSyncResult> {
    const result: CalendarSyncResult = {
      success: false,
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: [],
      lastSyncTime: new Date().toISOString()
    };

    try {
      // Get all confirmed appointments from the last 30 days forward
      const startDate = this.addDays(new Date().toISOString().split('T')[0], -30);
      const endDate = this.addDays(new Date().toISOString().split('T')[0], 90);

      const appointments = await this.db.getPharmaAppointments({
        startDate,
        endDate,
        status: 'confirmed'
      });

      result.eventsProcessed = appointments.length;

      for (const appointment of appointments) {
        try {
          if (!appointment.googleCalendarEventId) {
            // Create new calendar event
            await this.createAppointmentEvent(appointment);
            result.eventsCreated++;
          } else {
            // Update existing calendar event
            await this.updateAppointmentEvent(appointment);
            result.eventsUpdated++;
          }
        } catch (error) {
          result.errors.push({
            eventId: appointment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: appointment
          });
        }
      }

      // Handle cancelled appointments
      const cancelledAppointments = await this.db.getPharmaAppointments({
        startDate,
        endDate,
        status: 'cancelled'
      });

      for (const appointment of cancelledAppointments) {
        if (appointment.googleCalendarEventId) {
          try {
            await this.cancelAppointmentEvent(appointment);
            result.eventsDeleted++;
          } catch (error) {
            result.errors.push({
              eventId: appointment.id,
              error: error instanceof Error ? error.message : 'Unknown error',
              details: appointment
            });
          }
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return result;
    }
  }

  // =====================================================
  // GOOGLE CALENDAR API INTEGRATION
  // =====================================================

  private async createCalendarEvent(event: CalendarEvent): Promise<string> {
    try {
      // This would use the Google Calendar API
      // For now, returning a mock event ID
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.logInfo(`Created calendar event: ${event.summary} on ${event.start.dateTime}`);
      return eventId;

    } catch (error) {
      throw new Error(`Google Calendar API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    try {
      // This would use the Google Calendar API to update the event
      this.logInfo(`Updated calendar event: ${eventId}`);

    } catch (error) {
      throw new Error(`Google Calendar API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getCalendarEvents(
    userEmail: string,
    timeMin: string,
    timeMax: string
  ): Promise<CalendarEvent[]> {
    try {
      // This would use the Google Calendar API to fetch events
      // For now, returning mock data
      return [];

    } catch (error) {
      throw new Error(`Google Calendar API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getAccessToken(userEmail: string): Promise<string> {
    const cached = this.accessTokens.get(userEmail);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    // This would implement OAuth flow or service account authentication
    // For now, returning mock token
    const token = `mock_token_${Date.now()}`;
    this.accessTokens.set(userEmail, {
      token,
      expiresAt: Date.now() + 3600000 // 1 hour
    });

    return token;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private buildEventDescription(
    appointment: PharmaAppointment,
    rep: any,
    activity: any
  ): string {
    const lines = [
      `Pharmaceutical Representative Meeting`,
      ``,
      `Representative: ${rep.firstName} ${rep.lastName}`,
      `Company: ${rep.companyName}`,
      `Phone: ${rep.phoneNumber || 'Not provided'}`,
      `Email: ${rep.email}`,
      ``,
      `Activity: ${activity.activityName}`,
      `Duration: ${activity.durationMinutes} minutes`,
      ``,
      `Special Requests: ${appointment.specialRequests || 'None'}`,
      ``,
      `Confirmation Number: PH${appointment.id.slice(-8).toUpperCase()}`,
      ``,
      `Generated by Ganger Dermatology Pharmaceutical Scheduling System`
    ];

    return lines.join('\n');
  }

  private async getAppointmentParticipants(appointmentId: string): Promise<AppointmentParticipant[]> {
    // This would query the appointment_participants table
    // For now, returning empty array
    return [];
  }

  private getEventType(event: CalendarEvent): BusyTime['type'] {
    if (event.summary?.toLowerCase().includes('out of office') || 
        event.summary?.toLowerCase().includes('vacation')) {
      return 'outOfOffice';
    }
    
    if (event.status === 'tentative') {
      return 'tentative';
    }
    
    return 'busy';
  }

  private async getStaffAvailabilityRange(
    staffEmail: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityCheck[]> {
    const availability: AvailabilityCheck[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      const staff = this.staffMembers.get(staffEmail);
      if (!staff) continue;

      const dayOfWeek = this.getDayOfWeek(dateStr);
      const workingHours = staff.workingHours[dayOfWeek];
      
      if (!workingHours) {
        // No working hours for this day
        continue;
      }

      const busyTimes = await this.getStaffBusyTimes(staffEmail, dateStr);
      const timeSlots = this.generateTimeSlots(workingHours.start, workingHours.end, 30); // 30-minute slots

      const availabilityCheck: AvailabilityCheck = {
        staffEmail,
        date: dateStr,
        timeSlots: timeSlots.map(slot => {
          const isAvailable = !this.hasConflict(slot, busyTimes);
          const conflict = busyTimes.find(busy => this.slotsOverlap(slot, busy));
          
          return {
            start: slot.start,
            end: slot.end,
            isAvailable,
            conflictReason: conflict ? conflict.summary : undefined
          };
        }),
        lastChecked: new Date().toISOString()
      };

      availability.push(availabilityCheck);
    }

    return availability;
  }

  private generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = [];
    
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
      const slotStart = this.minutesToTime(minutes);
      const slotEnd = this.minutesToTime(minutes + intervalMinutes);
      
      slots.push({ start: slotStart, end: slotEnd });
    }
    
    return slots;
  }

  private hasConflict(slot: { start: string; end: string }, busyTimes: BusyTime[]): boolean {
    return busyTimes.some(busy => this.slotsOverlap(slot, busy));
  }

  private slotsOverlap(
    slot: { start: string; end: string },
    busy: { start: string; end: string }
  ): boolean {
    const slotStart = this.timeToMinutes(slot.start);
    const slotEnd = this.timeToMinutes(slot.end);
    const busyStart = this.timeToMinutes(busy.start.split('T')[1].substring(0, 5));
    const busyEnd = this.timeToMinutes(busy.end.split('T')[1].substring(0, 5));
    
    return slotStart < busyEnd && slotEnd > busyStart;
  }

  private initializeStaffMembers(): void {
    // This would load staff members from database or directory
    // For now, setting up default staff
    const defaultStaff: StaffMember[] = [
      {
        email: 'dr.ganger@gangerdermatology.com',
        name: 'Dr. Ganger',
        department: 'Dermatology',
        timezone: 'America/Detroit',
        workingHours: {
          monday: { start: '08:00', end: '17:00' },
          tuesday: { start: '08:00', end: '17:00' },
          wednesday: { start: '08:00', end: '17:00' },
          thursday: { start: '08:00', end: '17:00' },
          friday: { start: '08:00', end: '17:00' }
        },
        isActive: true
      },
      {
        email: 'manager@gangerdermatology.com',
        name: 'Practice Manager',
        department: 'Administration',
        timezone: 'America/Detroit',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        },
        isActive: true
      }
    ];

    defaultStaff.forEach(staff => {
      this.staffMembers.set(staff.email, staff);
    });
  }

  private getDayOfWeek(dateStr: string): keyof StaffMember['workingHours'] {
    const days: Array<keyof StaffMember['workingHours']> = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    return days[new Date(dateStr).getDay()];
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private logInfo(message: string): void {
    console.log(`[GoogleCalendarService] ${message}`);
  }

  private logError(message: string, error?: any): void {
    console.error(`[GoogleCalendarService] ERROR: ${message}`, error || '');
  }
}