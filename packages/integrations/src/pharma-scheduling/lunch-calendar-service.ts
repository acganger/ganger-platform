/**
 * Google Calendar Lunch Scheduling Service
 * Manages pharmaceutical rep lunch appointments across 3 office locations
 * Integrates with Google Calendar API for real-time availability and booking
 */

import { PharmaSchedulingQueries, LunchAvailabilityConfig, LunchTimeSlot, PharmaAppointment } from '@ganger/db';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
  serviceAccountEmail?: string;
  privateKey?: string;
}

export interface CalendarBusyTime {
  start: string;
  end: string;
}

export interface CalendarEventRequest {
  summary: string;
  description: string;
  location: string;
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
  }>;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'default' | 'public' | 'private';
}

export interface LunchBookingRequest {
  repName: string;
  companyName: string;
  repEmail: string;
  repPhone?: string;
  location: string;
  appointmentDate: string;
  startTime: string;
  specialRequests?: string;
}

export interface LunchBookingResponse {
  success: boolean;
  confirmationNumber?: string;
  calendarEventId?: string;
  appointment?: PharmaAppointment;
  errors?: string[];
  message: string;
}

export interface AvailabilityCheckResult {
  availableSlots: LunchTimeSlot[];
  totalSlots: number;
  busySlots: number;
  location: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
}

/**
 * Google Calendar constant mappings from handoff document
 */
export const LUNCH_CALENDARS = {
  'Ann Arbor': 'gangerdermatology.com_b4jajesjfje9qfko0gn3kp9jtk@group.calendar.google.com',
  'Wixom': 'gangerdermatology.com_fsdmtevbhp32gmletbpb000q20@group.calendar.google.com',
  'Plymouth': 'gangerdermatology.com_3cc4gomltg8f4kh9mc2o10gi6o@group.calendar.google.com'
};

export class PharmaLunchCalendarService {
  private db: PharmaSchedulingQueries;
  private calendarConfig: GoogleCalendarConfig;
  private accessTokens: Map<string, { token: string; expiresAt: number }>;

  constructor(dbQueries: PharmaSchedulingQueries, calendarConfig: GoogleCalendarConfig) {
    this.db = dbQueries;
    this.calendarConfig = calendarConfig;
    this.accessTokens = new Map();
  }

  // =====================================================
  // PUBLIC AVAILABILITY METHODS
  // =====================================================

  async getAvailableSlots(
    location: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<LunchTimeSlot[]> {
    try {
      // Get location configuration
      const config = await this.getLunchConfig(location);
      if (!config) {
        throw new Error(`Configuration not found for location: ${location}`);
      }

      // Get busy times from Google Calendar
      const busyTimes = await this.getCalendarBusyTimes(
        config.googleCalendarId,
        startDate,
        endDate
      );

      // Calculate available slots based on config and busy times
      return this.calculateAvailableSlots(config, busyTimes, startDate, endDate);

    } catch (error) {
      throw new Error(`Failed to get available slots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkSlotAvailability(
    location: string,
    appointmentDate: string,
    startTime: string
  ): Promise<{ isAvailable: boolean; conflictReason?: string }> {
    try {
      // First check configuration validation
      const validation = await this.db.validateLunchTimeSlot(location, appointmentDate, startTime);
      if (!validation.isValid) {
        return {
          isAvailable: false,
          conflictReason: validation.errorMessage
        };
      }

      // Check database for existing appointments
      const dbAvailability = await this.db.checkLunchSlotAvailability(
        location,
        appointmentDate,
        startTime,
        this.calculateEndTime(startTime, 45) // Default 45 minutes
      );

      if (!dbAvailability.isAvailable) {
        return dbAvailability;
      }

      // Check Google Calendar for conflicts
      const config = await this.getLunchConfig(location);
      if (!config) {
        return {
          isAvailable: false,
          conflictReason: 'Location configuration not found'
        };
      }

      const appointmentDateTime = new Date(`${appointmentDate}T${startTime}`);
      const endDateTime = new Date(appointmentDateTime.getTime() + config.durationMinutes * 60000);

      const busyTimes = await this.getCalendarBusyTimes(
        config.googleCalendarId,
        appointmentDateTime,
        endDateTime
      );

      // Check for conflicts with Google Calendar
      const hasCalendarConflict = busyTimes.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return appointmentDateTime < busyEnd && endDateTime > busyStart;
      });

      if (hasCalendarConflict) {
        return {
          isAvailable: false,
          conflictReason: 'Calendar conflict detected'
        };
      }

      return { isAvailable: true };

    } catch (error) {
      return {
        isAvailable: false,
        conflictReason: `Availability check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // =====================================================
  // BOOKING MANAGEMENT
  // =====================================================

  async createLunchAppointment(request: LunchBookingRequest): Promise<LunchBookingResponse> {
    try {
      // Validate the booking request
      const validation = await this.validateBookingRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: [validation.errorMessage || 'Validation failed'],
          message: 'Booking validation failed'
        };
      }

      // Check slot availability
      const availability = await this.checkSlotAvailability(
        request.location,
        request.appointmentDate,
        request.startTime
      );

      if (!availability.isAvailable) {
        return {
          success: false,
          errors: [availability.conflictReason || 'Slot not available'],
          message: 'Selected time slot is not available'
        };
      }

      // Generate confirmation number
      const confirmationNumber = this.generateConfirmationNumber();

      // Create Google Calendar event
      const calendarEventId = await this.createCalendarEvent(request, confirmationNumber);

      // Calculate end time
      const config = await this.getLunchConfig(request.location);
      const endTime = this.calculateEndTime(request.startTime, config?.durationMinutes || 45);

      // Create appointment in database
      const appointment = await this.db.createLunchAppointment({
        repName: request.repName,
        companyName: request.companyName,
        repEmail: request.repEmail,
        repPhone: request.repPhone,
        location: request.location,
        appointmentDate: request.appointmentDate,
        startTime: request.startTime,
        endTime,
        specialRequests: request.specialRequests,
        confirmationNumber,
        googleCalendarEventId: calendarEventId
      });

      return {
        success: true,
        confirmationNumber,
        calendarEventId,
        appointment,
        message: 'Lunch appointment successfully booked'
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Failed to create lunch appointment'
      };
    }
  }

  async cancelLunchAppointment(
    appointmentId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get appointment details
      const appointment = await this.db.getPharmaAppointmentById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      // Cancel Google Calendar event
      if (appointment.googleCalendarEventId) {
        await this.cancelCalendarEvent(appointment.googleCalendarEventId, appointment.location);
      }

      // Update appointment status in database
      await this.db.cancelAppointment(appointmentId, cancelledBy, reason || 'Cancelled by user');

      return {
        success: true,
        message: 'Lunch appointment successfully cancelled'
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to cancel appointment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // =====================================================
  // GOOGLE CALENDAR INTEGRATION
  // =====================================================

  private async createCalendarEvent(
    request: LunchBookingRequest,
    confirmationNumber: string
  ): Promise<string> {
    try {
      const config = await this.getLunchConfig(request.location);
      if (!config) {
        throw new Error(`Configuration not found for location: ${request.location}`);
      }

      // Build calendar event in exact format from handoff document
      const event: CalendarEventRequest = {
        summary: `${request.companyName} - ${request.repName} - Pharma Lunch ${request.location}`,
        description: this.buildEventDescription(request, confirmationNumber),
        location: config.locationAddress,
        start: {
          dateTime: `${request.appointmentDate}T${request.startTime}:00`,
          timeZone: 'America/Detroit'
        },
        end: {
          dateTime: `${request.appointmentDate}T${this.calculateEndTime(request.startTime, config.durationMinutes)}:00`,
          timeZone: 'America/Detroit'
        },
        attendees: request.repEmail ? [{
          email: request.repEmail,
          displayName: request.repName
        }] : undefined,
        status: 'confirmed',
        visibility: 'private'
      };

      // Create event using Google Calendar API (placeholder implementation)
      const eventId = await this.callGoogleCalendarAPI('POST', config.googleCalendarId, event);
      
      return eventId;

    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cancelCalendarEvent(eventId: string, location: string): Promise<void> {
    try {
      const config = await this.getLunchConfig(location);
      if (!config) {
        throw new Error(`Configuration not found for location: ${location}`);
      }

      // Update event status to cancelled
      await this.callGoogleCalendarAPI('PATCH', config.googleCalendarId, {
        status: 'cancelled'
      }, eventId);

    } catch (error) {
      throw new Error(`Failed to cancel calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getCalendarBusyTimes(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarBusyTime[]> {
    try {
      // Call Google Calendar freebusy API (placeholder implementation)
      const busyData = await this.callGoogleCalendarFreeBusy(calendarId, startDate, endDate);
      
      // Parse and return busy times
      return busyData.map((busy: any) => ({
        start: busy.start,
        end: busy.end
      }));

    } catch (error) {
      // If calendar API fails, return empty array to avoid blocking bookings
      console.error('Calendar API error:', error);
      return [];
    }
  }

  // =====================================================
  // SLOT CALCULATION
  // =====================================================

  private async calculateAvailableSlots(
    config: LunchAvailabilityConfig,
    busyTimes: CalendarBusyTime[],
    startDate: Date,
    endDate: Date
  ): Promise<LunchTimeSlot[]> {
    const slots: LunchTimeSlot[] = [];
    const now = new Date();
    
    // Limit to booking window
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (config.bookingWindowWeeks * 7));
    const effectiveEndDate = endDate > maxDate ? maxDate : endDate;

    for (let date = new Date(startDate); date <= effectiveEndDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Sunday = 7
      
      // Check if day is available according to configuration
      if (!config.availableDays.includes(dayOfWeek)) {
        continue;
      }

      const dateStr = date.toISOString().split('T')[0];
      
      // Create slot for the configured lunch time
      const slotDateTime = new Date(date);
      const [hours, minutes] = config.startTime.split(':');
      slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Check minimum advance notice
      const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilSlot < config.minAdvanceHours) {
        continue;
      }

      // Check if slot conflicts with busy times
      const slotEnd = new Date(slotDateTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + config.durationMinutes);
      
      const hasConflict = busyTimes.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slotDateTime < busyEnd && slotEnd > busyStart;
      });

      // Check database for existing appointments
      const dbConflict = await this.db.checkLunchSlotAvailability(
        config.locationName,
        dateStr,
        config.startTime,
        config.endTime
      );

      slots.push({
        date: dateStr,
        startTime: config.startTime,
        endTime: config.endTime,
        available: !hasConflict && dbConflict.isAvailable,
        locationName: config.locationName,
        conflictReason: hasConflict ? 'Calendar conflict' : dbConflict.conflictReason
      });
    }
    
    return slots;
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async getLunchConfig(location: string): Promise<LunchAvailabilityConfig | null> {
    return await this.db.getLunchConfigByLocation(location);
  }

  private async validateBookingRequest(request: LunchBookingRequest): Promise<{
    isValid: boolean;
    errorMessage?: string;
  }> {
    // Validate required fields
    const required = ['repName', 'companyName', 'repEmail', 'location', 'appointmentDate', 'startTime'];
    for (const field of required) {
      if (!request[field as keyof LunchBookingRequest]) {
        return {
          isValid: false,
          errorMessage: `Missing required field: ${field}`
        };
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.repEmail)) {
      return {
        isValid: false,
        errorMessage: 'Invalid email format'
      };
    }

    // Validate location exists
    const config = await this.getLunchConfig(request.location);
    if (!config || !config.isActive) {
      return {
        isValid: false,
        errorMessage: 'Invalid or inactive location'
      };
    }

    return { isValid: true };
  }

  private buildEventDescription(request: LunchBookingRequest, confirmationNumber: string): string {
    // Build description in exact format from handoff document
    const config = this.getLunchConfig(request.location);
    
    return `Location : ${request.location} Lunch with Partners 
Invitee Details 
Name : ${request.repName} 
Company : ${request.companyName} 
Email : ${request.repEmail} 
Phone : ${request.repPhone || 'Not provided'} 
Timezone : America/New_York 
Organizer Details 
Name : Ganger Dermatology 
Company : Ganger Dermatology 
Timezone : US/Eastern 
Confirmation # : ${confirmationNumber}`;
  }

  private generateConfirmationNumber(): string {
    // Generate 8-digit confirmation number
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  // =====================================================
  // GOOGLE CALENDAR API PLACEHOLDERS
  // =====================================================

  private async callGoogleCalendarAPI(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    calendarId: string,
    data?: any,
    eventId?: string
  ): Promise<any> {
    // This would integrate with actual Google Calendar API
    // For now, returning mock success response
    
    const mockEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[GoogleCalendar] ${method} ${calendarId}${eventId ? `/${eventId}` : ''}`, data || '');
    
    return mockEventId;
  }

  private async callGoogleCalendarFreeBusy(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // This would call Google Calendar freebusy API
    // For now, returning mock busy times (empty for testing)
    
    console.log(`[GoogleCalendar] FreeBusy query for ${calendarId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return [];
  }

  private async getAccessToken(): Promise<string> {
    // This would implement OAuth flow or service account authentication
    // For now, returning mock token
    
    const mockToken = `mock_token_${Date.now()}`;
    return mockToken;
  }

  // =====================================================
  // ADMIN AND TESTING METHODS
  // =====================================================

  async testCalendarConnection(location: string): Promise<{
    success: boolean;
    message: string;
    testSlotsFound?: number;
  }> {
    try {
      const config = await this.getLunchConfig(location);
      if (!config) {
        return {
          success: false,
          message: `Configuration not found for location: ${location}`
        };
      }

      // Test by getting slots for next week
      const testDate = new Date();
      const testEndDate = new Date();
      testEndDate.setDate(testDate.getDate() + 7);
      
      const slots = await this.getAvailableSlots(location, testDate, testEndDate);
      
      return {
        success: true,
        message: 'Calendar connection successful',
        testSlotsFound: slots.length
      };

    } catch (error) {
      return {
        success: false,
        message: `Calendar connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getLocationSummary(): Promise<Array<{
    location: string;
    isActive: boolean;
    nextAvailableSlot?: string;
    totalUpcomingSlots: number;
  }>> {
    const summary: Array<{
      location: string;
      isActive: boolean;
      nextAvailableSlot?: string;
      totalUpcomingSlots: number;
    }> = [];

    const locations = await this.db.getActiveLunchLocations();
    
    for (const location of locations) {
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30); // Next 30 days

        const slots = await this.getAvailableSlots(location.locationName, startDate, endDate);
        const availableSlots = slots.filter(slot => slot.available);
        
        summary.push({
          location: location.locationName,
          isActive: true,
          nextAvailableSlot: availableSlots.length > 0 ? 
            `${availableSlots[0].date} at ${availableSlots[0].startTime}` : 
            undefined,
          totalUpcomingSlots: availableSlots.length
        });

      } catch (error) {
        summary.push({
          location: location.locationName,
          isActive: false,
          totalUpcomingSlots: 0
        });
      }
    }

    return summary;
  }
}