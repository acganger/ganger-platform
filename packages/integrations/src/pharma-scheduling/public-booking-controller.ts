/**
 * Public Booking Controller for Pharmaceutical Rep Lunch Scheduling
 * RESTful API endpoints for external pharmaceutical rep booking interface
 */

// Express types will be resolved at runtime
type Request = any;
type Response = any;
import { PharmaSchedulingQueries } from '@ganger/db';
import { PharmaLunchCalendarService, LunchBookingRequest, LUNCH_CALENDARS } from './lunch-calendar-service';

export interface PublicBookingAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface LocationInfo {
  locationName: string;
  locationAddress: string;
  durationMinutes: number;
  bookingWindowWeeks: number;
  availableDays: string[]; // Human-readable day names
  lunchTime: {
    start: string;
    end: string;
  };
  specialInstructions?: string;
}

export interface AvailabilityResponse {
  location: string;
  dateRange: {
    start: string;
    end: string;
  };
  availableSlots: Array<{
    date: string;
    time: string;
    available: boolean;
    displayDate: string; // Human-readable date
    displayTime: string; // Human-readable time
  }>;
  bookingInstructions: string;
  totalAvailable: number;
}

export interface BookingSubmissionRequest {
  // Representative information
  repName: string;
  companyName: string;
  repEmail: string;
  repPhone?: string;
  
  // Appointment details
  location: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  
  // Optional details
  specialRequests?: string;
  attendeeCount?: number;
  
  // Contact preferences
  preferredContactMethod?: 'email' | 'phone';
  emergencyContact?: string;
}

export interface BookingConfirmationResponse {
  confirmationNumber: string;
  appointment: {
    repName: string;
    companyName: string;
    location: string;
    appointmentDate: string;
    appointmentTime: string;
    displayDate: string;
    displayTime: string;
    duration: string;
    locationAddress: string;
  };
  nextSteps: string[];
  calendarInviteSent: boolean;
  contactInfo: {
    email: string;
    phone?: string;
  };
}

export class PublicBookingController {
  private db: PharmaSchedulingQueries;
  private calendarService: PharmaLunchCalendarService;

  constructor(dbQueries: PharmaSchedulingQueries, calendarService: PharmaLunchCalendarService) {
    this.db = dbQueries;
    this.calendarService = calendarService;
  }

  // =====================================================
  // PUBLIC API ENDPOINTS
  // =====================================================

  /**
   * GET /api/public/locations
   * Returns all available lunch locations with basic information
   */
  async getLocations(req: Request, res: Response): Promise<void> {
    try {
      const locations = await this.db.getActiveLunchLocations();
      
      const locationInfo: LocationInfo[] = locations.map(location => ({
        locationName: location.locationName,
        locationAddress: location.locationAddress,
        durationMinutes: location.durationMinutes,
        bookingWindowWeeks: location.bookingWindowWeeks,
        availableDays: this.formatAvailableDays(location.availableDays),
        lunchTime: {
          start: this.formatTime(location.startTime),
          end: this.formatTime(location.endTime)
        }
      }));

      const response: PublicBookingAPIResponse<{ locations: LocationInfo[] }> = {
        success: true,
        data: { locations: locationInfo },
        message: `Found ${locationInfo.length} available locations`,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      const response: PublicBookingAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve locations',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/public/availability/:location
   * Returns available time slots for a specific location
   * Query params: ?weeks=4 (optional, defaults to 12)
   */
  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { location } = req.params;
      const weeksAhead = parseInt(req.query.weeks as string) || 12;

      // Validate location exists
      const config = await this.db.getLunchConfigByLocation(location);
      if (!config) {
        const response: PublicBookingAPIResponse = {
          success: false,
          error: 'Location not found',
          message: `Location '${location}' is not available for booking`,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Calculate date range
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (weeksAhead * 7));

      // Get available slots from calendar service
      const slots = await this.calendarService.getAvailableSlots(location, startDate, endDate);

      // Format slots for public API
      const formattedSlots = slots.map(slot => ({
        date: slot.date,
        time: slot.startTime,
        available: slot.available,
        displayDate: this.formatDate(slot.date),
        displayTime: this.formatTime(slot.startTime)
      }));

      const availableCount = formattedSlots.filter(slot => slot.available).length;

      const response: PublicBookingAPIResponse<AvailabilityResponse> = {
        success: true,
        data: {
          location,
          dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          availableSlots: formattedSlots,
          bookingInstructions: `Select an available time slot for your lunch presentation in ${location}. Appointments are ${config.durationMinutes} minutes long.`,
          totalAvailable: availableCount
        },
        message: `Found ${availableCount} available slots in ${location}`,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      const response: PublicBookingAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve availability',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/public/bookings
   * Submit a new lunch appointment booking
   */
  async submitBooking(req: Request, res: Response): Promise<void> {
    try {
      const bookingData: BookingSubmissionRequest = req.body;

      // Validate booking request
      const validation = await this.validateBookingSubmission(bookingData);
      if (!validation.isValid) {
        const response: PublicBookingAPIResponse = {
          success: false,
          error: validation.errors?.join('; '),
          message: 'Booking validation failed',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      // Convert to calendar service format
      const lunchBookingRequest: LunchBookingRequest = {
        repName: bookingData.repName,
        companyName: bookingData.companyName,
        repEmail: bookingData.repEmail,
        repPhone: bookingData.repPhone,
        location: bookingData.location,
        appointmentDate: bookingData.appointmentDate,
        startTime: bookingData.startTime,
        specialRequests: bookingData.specialRequests
      };

      // Create booking through calendar service
      const bookingResult = await this.calendarService.createLunchAppointment(lunchBookingRequest);

      if (!bookingResult.success) {
        const response: PublicBookingAPIResponse = {
          success: false,
          error: bookingResult.errors?.join('; '),
          message: bookingResult.message,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      // Get location details for response
      const config = await this.db.getLunchConfigByLocation(bookingData.location);
      
      // Format confirmation response
      const confirmationResponse: BookingConfirmationResponse = {
        confirmationNumber: bookingResult.confirmationNumber!,
        appointment: {
          repName: bookingData.repName,
          companyName: bookingData.companyName,
          location: bookingData.location,
          appointmentDate: bookingData.appointmentDate,
          appointmentTime: bookingData.startTime,
          displayDate: this.formatDate(bookingData.appointmentDate),
          displayTime: this.formatTime(bookingData.startTime),
          duration: `${config?.durationMinutes || 45} minutes`,
          locationAddress: config?.locationAddress || ''
        },
        nextSteps: [
          'You will receive a calendar invitation via email',
          'Please arrive 10 minutes early for setup',
          'Bring any presentation materials or samples',
          'Contact us if you need to cancel or reschedule'
        ],
        calendarInviteSent: !!bookingResult.calendarEventId,
        contactInfo: {
          email: bookingData.repEmail,
          phone: bookingData.repPhone
        }
      };

      const response: PublicBookingAPIResponse<BookingConfirmationResponse> = {
        success: true,
        data: confirmationResponse,
        message: 'Lunch appointment successfully booked',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);

      // Log successful booking
      console.log(`[LunchBooking] Successfully booked appointment for ${bookingData.companyName} - ${bookingData.repName} at ${bookingData.location} on ${bookingData.appointmentDate}`);

    } catch (error) {
      const response: PublicBookingAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to submit booking',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/public/booking/:confirmationNumber
   * Retrieve booking details by confirmation number (for customer reference)
   */
  async getBookingDetails(req: Request, res: Response): Promise<void> {
    try {
      const { confirmationNumber } = req.params;

      // Search for appointment by confirmation number
      const appointments = await this.db.getPharmaAppointments({
        limit: 1,
        // offset: 0 // Not supported by query interface
      });

      const appointment = appointments.find(apt => 
        apt.id === confirmationNumber && 
        apt.bookingSource === 'lunch_portal'
      );

      if (!appointment) {
        const response: PublicBookingAPIResponse = {
          success: false,
          error: 'Booking not found',
          message: `No booking found with confirmation number: ${confirmationNumber}`,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Get representative details
      const rep = await this.db.getPharmaRepById(appointment.repId);
      const config = await this.db.getLunchConfigByLocation(appointment.location);

      const bookingDetails = {
        confirmationNumber: appointment.id,
        status: appointment.status,
        appointment: {
          repName: rep ? `${rep.firstName} ${rep.lastName}` : 'Unknown',
          companyName: rep?.companyName || 'Unknown',
          location: appointment.location,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.startTime,
          displayDate: this.formatDate(appointment.appointmentDate),
          displayTime: this.formatTime(appointment.startTime),
          duration: `${config?.durationMinutes || 45} minutes`,
          locationAddress: config?.locationAddress || '',
          specialRequests: appointment.specialRequests
        },
        contact: {
          email: rep?.email,
          phone: rep?.phoneNumber
        },
        createdAt: appointment.createdAt
      };

      const response: PublicBookingAPIResponse<typeof bookingDetails> = {
        success: true,
        data: bookingDetails,
        message: 'Booking details retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      const response: PublicBookingAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve booking details',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/public/booking/:confirmationNumber/cancel
   * Cancel a booking using confirmation number
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { confirmationNumber } = req.params;
      const { reason, contactEmail } = req.body;

      // Find appointment by confirmation number
      const appointments = await this.db.getPharmaAppointments({
        limit: 100
      });

      const appointment = appointments.find(apt => 
        apt.id === confirmationNumber && 
        apt.bookingSource === 'lunch_portal'
      );

      if (!appointment) {
        const response: PublicBookingAPIResponse = {
          success: false,
          error: 'Booking not found',
          message: `No booking found with confirmation number: ${confirmationNumber}`,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }

      // Check if cancellation is allowed (not in the past)
      const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
      const now = new Date();
      
      if (appointmentDateTime <= now) {
        const response: PublicBookingAPIResponse = {
          success: false,
          error: 'Cannot cancel past appointments',
          message: 'This appointment cannot be cancelled as it is in the past',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      // Cancel through calendar service
      const cancellationResult = await this.calendarService.cancelLunchAppointment(
        appointment.id,
        contactEmail || 'public_api',
        reason || 'Cancelled via public API'
      );

      if (!cancellationResult.success) {
        const response: PublicBookingAPIResponse = {
          success: false,
          error: cancellationResult.message,
          message: 'Failed to cancel appointment',
          timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
        return;
      }

      const response: PublicBookingAPIResponse = {
        success: true,
        message: 'Appointment successfully cancelled',
        timestamp: new Date().toISOString()
      };

      res.json(response);

      // Log cancellation
      console.log(`[LunchBooking] Cancelled appointment ${confirmationNumber} - Reason: ${reason || 'No reason provided'}`);

    } catch (error) {
      const response: PublicBookingAPIResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to cancel booking',
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  // =====================================================
  // VALIDATION AND UTILITY METHODS
  // =====================================================

  private async validateBookingSubmission(data: BookingSubmissionRequest): Promise<{
    isValid: boolean;
    errors?: string[];
  }> {
    const errors: string[] = [];

    // Required field validation
    const requiredFields: (keyof BookingSubmissionRequest)[] = [
      'repName', 'companyName', 'repEmail', 'location', 'appointmentDate', 'startTime'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Email format validation
    if (data.repEmail && !this.isValidEmail(data.repEmail)) {
      errors.push('Invalid email format');
    }

    // Phone format validation (if provided)
    if (data.repPhone && !this.isValidPhone(data.repPhone)) {
      errors.push('Invalid phone number format');
    }

    // Date format validation
    if (data.appointmentDate && !this.isValidDate(data.appointmentDate)) {
      errors.push('Invalid appointment date format (use YYYY-MM-DD)');
    }

    // Time format validation
    if (data.startTime && !this.isValidTime(data.startTime)) {
      errors.push('Invalid start time format (use HH:MM)');
    }

    // Location validation
    if (data.location) {
      const config = await this.db.getLunchConfigByLocation(data.location);
      if (!config || !config.isActive) {
        errors.push('Invalid or inactive location');
      }
    }

    // Business rules validation
    if (data.appointmentDate && data.startTime && data.location) {
      const validation = await this.db.validateLunchTimeSlot(
        data.location,
        data.appointmentDate,
        data.startTime
      );

      if (!validation.isValid) {
        errors.push(validation.errorMessage || 'Time slot validation failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private formatAvailableDays(days: number[]): string[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(day => {
      // Handle Monday = 1, Sunday = 7 format
      const index = day === 7 ? 0 : day;
      return dayNames[index];
    });
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}