/**
 * Pharmaceutical Scheduling Booking Engine
 * Main orchestrator for pharmaceutical rep appointment booking system
 */

import { 
  PharmaSchedulingQueries, 
  PharmaAppointment, 
  PharmaRepresentative, 
  SchedulingActivity,
  ConflictCheck 
} from '@ganger/db';
import { AvailabilityEngine, AvailabilityRequest, OptimizedSlot } from './availability-engine';
import { ApprovalWorkflowEngine, ApprovalRequest } from './approval-workflow';

export interface BookingRequest {
  // Rep Information
  repId?: string; // If existing rep
  repEmail: string;
  repFirstName?: string;
  repLastName?: string;
  repPhone?: string;
  companyName: string;
  
  // Appointment Details
  activityId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  participantCount?: number;
  specialRequests?: string;
  
  // Booking Context
  bookingSource?: string;
  submittedBy?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  preferredTimes?: string[];
  alternativeDates?: string[];
  
  // Contact Information
  contactEmail?: string;
  contactPhone?: string;
  emergencyContact?: string;
}

export interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  appointment?: PharmaAppointment;
  conflicts?: ConflictCheck;
  availableAlternatives?: OptimizedSlot[];
  approvalRequired: boolean;
  estimatedApprovalTime?: string;
  confirmationNumber?: string;
  nextSteps: string[];
  errors?: string[];
  warnings?: string[];
}

export interface BookingValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface BookingModification {
  appointmentId: string;
  changes: Partial<BookingRequest>;
  modificationReason: string;
  modifiedBy: string;
  requiresReapproval?: boolean;
}

export interface BookingCancellation {
  appointmentId: string;
  cancelledBy: string;
  cancellationReason: string;
  notifyParticipants: boolean;
  refundRequired?: boolean;
}

export interface BookingConfirmation {
  appointmentId: string;
  confirmationType: 'initial' | 'reminder' | 'final' | 'modification';
  sendTo: string[];
  includeCalendarInvite: boolean;
  includeLocationDetails: boolean;
  customMessage?: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  successfulBookings: number;
  cancelledBookings: number;
  averageApprovalTime: number;
  popularTimeSlots: Array<{ time: string; count: number }>;
  repPerformance: Array<{ repId: string; metrics: any }>;
  locationUtilization: Array<{ location: string; utilization: number }>;
  conversionRate: number;
}

export interface BookingSettings {
  allowSameDayBooking: boolean;
  maxAdvanceBookingDays: number;
  autoApprovalThreshold: number;
  requireRepVerification: boolean;
  enableWaitlist: boolean;
  defaultMeetingDuration: number;
  reminderSchedule: Array<{ hours: number; type: 'email' | 'sms' }>;
  cancellationPolicy: {
    minimumHours: number;
    allowFreeCancellation: boolean;
    penaltyPercentage: number;
  };
}

export class PharmaceuticalBookingEngine {
  private db: PharmaSchedulingQueries;
  private availabilityEngine: AvailabilityEngine;
  private approvalEngine: ApprovalWorkflowEngine;
  private settings: BookingSettings;

  constructor(
    dbQueries: PharmaSchedulingQueries,
    availabilityEngine: AvailabilityEngine,
    approvalEngine: ApprovalWorkflowEngine
  ) {
    this.db = dbQueries;
    this.availabilityEngine = availabilityEngine;
    this.approvalEngine = approvalEngine;
    this.settings = this.getDefaultSettings();
  }

  // =====================================================
  // MAIN BOOKING OPERATIONS
  // =====================================================

  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    const startTime = Date.now();

    try {
      // 1. Validate booking request
      const validation = await this.validateBookingRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: ['Fix validation errors and resubmit'],
          errors: validation.errors.map(e => e.message),
          warnings: validation.warnings.map(w => w.message)
        };
      }

      // 2. Get or create pharmaceutical representative
      const rep = await this.getOrCreateRep(request);

      // 3. Get activity details
      const activity = await this.db.getSchedulingActivityById(request.activityId);
      if (!activity) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: ['Contact support'],
          errors: [`Activity ${request.activityId} not found`]
        };
      }

      // 4. Check for conflicts
      const conflicts = await this.checkBookingConflicts(request, rep.id);
      if (conflicts.hasConflicts) {
        const alternatives = await this.findAlternatives(request);
        return {
          success: false,
          conflicts,
          availableAlternatives: alternatives,
          approvalRequired: false,
          nextSteps: ['Choose an alternative time slot', 'Contact location directly'],
          errors: conflicts.conflictReasons
        };
      }

      // 5. Create appointment record
      const appointment = await this.createAppointmentRecord(request, rep.id, activity);

      // 6. Initiate approval workflow if required
      let approvalRequired = false;
      let estimatedApprovalTime: string | undefined;
      
      if (activity.requiresApproval) {
        approvalRequired = true;
        const approvalRequest: ApprovalRequest = {
          appointmentId: appointment.id,
          requestingRepId: rep.id,
          submittedBy: request.submittedBy || request.repEmail,
          submissionNotes: request.specialRequests,
          priority: request.priority || 'medium'
        };

        const workflowStatus = await this.approvalEngine.initiateApproval(approvalRequest);
        estimatedApprovalTime = workflowStatus.estimatedCompletionTime;
      } else {
        // Auto-approve if no approval required
        await this.db.approveAppointment(appointment.id, 'system');
      }

      // 7. Send confirmation notifications
      await this.sendBookingConfirmation({
        appointmentId: appointment.id,
        confirmationType: 'initial',
        sendTo: [request.repEmail],
        includeCalendarInvite: !approvalRequired,
        includeLocationDetails: true
      });

      // 8. Log booking analytics
      await this.logBookingEvent(appointment.id, 'booking_created', {
        processingTimeMs: Date.now() - startTime,
        approvalRequired,
        bookingSource: request.bookingSource
      });

      return {
        success: true,
        appointmentId: appointment.id,
        appointment,
        approvalRequired,
        estimatedApprovalTime,
        confirmationNumber: this.generateConfirmationNumber(appointment.id),
        nextSteps: this.generateNextSteps(appointment, approvalRequired),
        warnings: validation.warnings.map(w => w.message)
      };

    } catch (error) {
      return {
        success: false,
        approvalRequired: false,
        nextSteps: ['Contact support for assistance'],
        errors: [`Booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async modifyBooking(modification: BookingModification): Promise<BookingResponse> {
    try {
      // Get existing appointment
      const existingAppointment = await this.db.getPharmaAppointmentById(modification.appointmentId);
      if (!existingAppointment) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: ['Contact support'],
          errors: ['Appointment not found']
        };
      }

      // Check if modification is allowed
      const modificationAllowed = await this.isModificationAllowed(existingAppointment);
      if (!modificationAllowed.allowed) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: modificationAllowed.alternatives,
          errors: [modificationAllowed.reason]
        };
      }

      // Validate new booking details
      const newRequest = this.mergeBookingChanges(existingAppointment, modification.changes);
      const validation = await this.validateBookingRequest(newRequest);
      
      if (!validation.isValid) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: ['Fix validation errors and resubmit'],
          errors: validation.errors.map(e => e.message)
        };
      }

      // Check for conflicts with new time
      const rep = await this.db.getPharmaRepById(existingAppointment.repId);
      if (!rep) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: ['Contact support'],
          errors: ['Representative not found']
        };
      }

      const conflicts = await this.checkBookingConflicts(newRequest, rep.id, modification.appointmentId);
      if (conflicts.hasConflicts) {
        const alternatives = await this.findAlternatives(newRequest);
        return {
          success: false,
          conflicts,
          availableAlternatives: alternatives,
          approvalRequired: false,
          nextSteps: ['Choose an alternative time slot'],
          errors: conflicts.conflictReasons
        };
      }

      // Apply modifications
      const updatedAppointment = await this.applyBookingModifications(
        modification.appointmentId,
        modification.changes
      );

      // Handle reapproval if required
      let approvalRequired = false;
      if (modification.requiresReapproval) {
        const approvalRequest: ApprovalRequest = {
          appointmentId: modification.appointmentId,
          requestingRepId: rep.id,
          submittedBy: modification.modifiedBy,
          submissionNotes: `Modification: ${modification.modificationReason}`,
          priority: 'medium'
        };

        await this.approvalEngine.initiateApproval(approvalRequest);
        approvalRequired = true;
      }

      // Send modification notification
      await this.sendBookingConfirmation({
        appointmentId: modification.appointmentId,
        confirmationType: 'modification',
        sendTo: [rep.email],
        includeCalendarInvite: !approvalRequired,
        includeLocationDetails: true,
        customMessage: `Your appointment has been modified. ${modification.modificationReason}`
      });

      // Log modification
      await this.logBookingEvent(modification.appointmentId, 'booking_modified', {
        changes: modification.changes,
        modifiedBy: modification.modifiedBy,
        reason: modification.modificationReason
      });

      return {
        success: true,
        appointmentId: modification.appointmentId,
        appointment: updatedAppointment,
        approvalRequired,
        nextSteps: this.generateNextSteps(updatedAppointment, approvalRequired)
      };

    } catch (error) {
      return {
        success: false,
        approvalRequired: false,
        nextSteps: ['Contact support for assistance'],
        errors: [`Modification failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  async cancelBooking(cancellation: BookingCancellation): Promise<BookingResponse> {
    try {
      // Get existing appointment
      const appointment = await this.db.getPharmaAppointmentById(cancellation.appointmentId);
      if (!appointment) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: ['Contact support'],
          errors: ['Appointment not found']
        };
      }

      // Check cancellation policy
      const cancellationAllowed = await this.isCancellationAllowed(appointment);
      if (!cancellationAllowed.allowed) {
        return {
          success: false,
          approvalRequired: false,
          nextSteps: cancellationAllowed.alternatives,
          errors: [cancellationAllowed.reason],
          warnings: cancellationAllowed.penalties
        };
      }

      // Cancel the appointment
      await this.db.cancelAppointment(
        cancellation.appointmentId,
        cancellation.cancelledBy,
        cancellation.cancellationReason
      );

      // Send cancellation notifications
      if (cancellation.notifyParticipants) {
        await this.sendCancellationNotifications(appointment, cancellation.cancellationReason);
      }

      // Log cancellation
      await this.logBookingEvent(cancellation.appointmentId, 'booking_cancelled', {
        cancelledBy: cancellation.cancelledBy,
        reason: cancellation.cancellationReason,
        notificationsent: cancellation.notifyParticipants
      });

      return {
        success: true,
        appointmentId: cancellation.appointmentId,
        approvalRequired: false,
        nextSteps: ['Cancellation confirmed', 'You may book a new appointment anytime']
      };

    } catch (error) {
      return {
        success: false,
        approvalRequired: false,
        nextSteps: ['Contact support for assistance'],
        errors: [`Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // =====================================================
  // BOOKING SEARCH AND AVAILABILITY
  // =====================================================

  async searchAvailableSlots(
    activityId: string,
    startDate: string,
    endDate: string,
    preferences?: {
      preferredTimes?: string[];
      excludeWeekends?: boolean;
      minLeadTimeHours?: number;
      maxResults?: number;
    }
  ): Promise<OptimizedSlot[]> {
    const request: AvailabilityRequest = {
      activityId,
      startDate,
      endDate,
      preferredTimes: preferences?.preferredTimes,
      excludeWeekends: preferences?.excludeWeekends,
      minLeadTimeHours: preferences?.minLeadTimeHours
    };

    const availableSlots = await this.availabilityEngine.findOptimalSlots(
      request,
      preferences?.maxResults || 20
    );

    return availableSlots;
  }

  async getBookingRecommendations(
    repId: string,
    activityId: string,
    preferences?: {
      preferredDays?: number[];
      preferredTimes?: string[];
      maxTravelDistance?: number;
    }
  ): Promise<{
    recommendedSlots: OptimizedSlot[];
    reasoning: string[];
    alternatives: OptimizedSlot[];
  }> {
    try {
      // Get rep preferences and history
      const rep = await this.db.getPharmaRepById(repId);
      if (!rep) {
        throw new Error('Representative not found');
      }

      // Get historical booking patterns
      const historicalBookings = await this.db.getPharmaAppointments({
        repId,
        limit: 20
      });

      // Analyze patterns and generate recommendations
      const recommendations = await this.generateIntelligentRecommendations(
        rep,
        activityId,
        historicalBookings,
        preferences
      );

      return recommendations;

    } catch (error) {
      throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // BOOKING VALIDATION
  // =====================================================

  private async validateBookingRequest(request: BookingRequest): Promise<BookingValidation> {
    const errors: BookingValidation['errors'] = [];
    const warnings: BookingValidation['warnings'] = [];

    // Required fields validation
    if (!request.repEmail) {
      errors.push({
        field: 'repEmail',
        message: 'Representative email is required',
        severity: 'error',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.companyName) {
      errors.push({
        field: 'companyName',
        message: 'Company name is required',
        severity: 'error',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.activityId) {
      errors.push({
        field: 'activityId',
        message: 'Activity selection is required',
        severity: 'error',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.appointmentDate) {
      errors.push({
        field: 'appointmentDate',
        message: 'Appointment date is required',
        severity: 'error',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.startTime) {
      errors.push({
        field: 'startTime',
        message: 'Start time is required',
        severity: 'error',
        code: 'REQUIRED_FIELD'
      });
    }

    // Email format validation
    if (request.repEmail && !this.isValidEmail(request.repEmail)) {
      errors.push({
        field: 'repEmail',
        message: 'Invalid email format',
        severity: 'error',
        code: 'INVALID_FORMAT'
      });
    }

    // Date and time validation
    if (request.appointmentDate) {
      const appointmentDate = new Date(request.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        errors.push({
          field: 'appointmentDate',
          message: 'Appointment date cannot be in the past',
          severity: 'error',
          code: 'INVALID_DATE'
        });
      }

      // Check maximum advance booking
      const maxAdvanceDays = this.settings.maxAdvanceBookingDays;
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
      
      if (appointmentDate > maxDate) {
        errors.push({
          field: 'appointmentDate',
          message: `Appointments can only be booked ${maxAdvanceDays} days in advance`,
          severity: 'error',
          code: 'DATE_TOO_FAR'
        });
      }

      // Same day booking check
      if (appointmentDate.toDateString() === today.toDateString() && !this.settings.allowSameDayBooking) {
        errors.push({
          field: 'appointmentDate',
          message: 'Same-day booking is not allowed',
          severity: 'error',
          code: 'SAME_DAY_RESTRICTED'
        });
      }
    }

    // Time format validation
    if (request.startTime && !this.isValidTime(request.startTime)) {
      errors.push({
        field: 'startTime',
        message: 'Invalid time format (use HH:MM)',
        severity: 'error',
        code: 'INVALID_TIME_FORMAT'
      });
    }

    if (request.endTime && !this.isValidTime(request.endTime)) {
      errors.push({
        field: 'endTime',
        message: 'Invalid time format (use HH:MM)',
        severity: 'error',
        code: 'INVALID_TIME_FORMAT'
      });
    }

    // Participant count validation
    if (request.participantCount && request.participantCount < 1) {
      errors.push({
        field: 'participantCount',
        message: 'Participant count must be at least 1',
        severity: 'error',
        code: 'INVALID_COUNT'
      });
    }

    // Business rule validations
    const businessRuleValidation = await this.validateBusinessRules(request);
    errors.push(...businessRuleValidation.errors);
    warnings.push(...businessRuleValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateBusinessRules(request: BookingRequest): Promise<{
    errors: BookingValidation['errors'];
    warnings: BookingValidation['warnings'];
  }> {
    const errors: BookingValidation['errors'] = [];
    const warnings: BookingValidation['warnings'] = [];

    // Check activity-specific rules
    if (request.activityId) {
      const activity = await this.db.getSchedulingActivityById(request.activityId);
      if (activity) {
        // Check participant limit
        if (request.participantCount && request.participantCount > activity.maxParticipants) {
          errors.push({
            field: 'participantCount',
            message: `Maximum ${activity.maxParticipants} participants allowed for this activity`,
            severity: 'error',
            code: 'PARTICIPANT_LIMIT_EXCEEDED'
          });
        }

        // Check booking window
        if (request.appointmentDate) {
          const appointmentDate = new Date(request.appointmentDate);
          const leadTimeHours = (appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60);
          
          if (leadTimeHours < activity.cancellationHours) {
            errors.push({
              field: 'appointmentDate',
              message: `Minimum ${activity.cancellationHours} hours advance booking required`,
              severity: 'error',
              code: 'INSUFFICIENT_LEAD_TIME'
            });
          }
        }
      }
    }

    return { errors, warnings };
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async getOrCreateRep(request: BookingRequest): Promise<PharmaRepresentative> {
    // Try to find existing rep
    if (request.repId) {
      const existingRep = await this.db.getPharmaRepById(request.repId);
      if (existingRep) return existingRep;
    }

    // Try to find by email
    let rep = await this.db.getPharmaRepByEmail(request.repEmail);
    
    if (!rep) {
      // Create new rep
      rep = await this.db.createPharmaRep({
        email: request.repEmail,
        firstName: request.repFirstName || 'Unknown',
        lastName: request.repLastName || 'Rep',
        phoneNumber: request.repPhone,
        companyName: request.companyName,
        isActive: true,
        accountCreatedAt: new Date().toISOString(),
        preferredLocations: [],
        specialties: []
      });
    }

    return rep;
  }

  private async checkBookingConflicts(
    request: BookingRequest,
    repId: string,
    excludeAppointmentId?: string
  ): Promise<ConflictCheck> {
    if (!request.startTime || !request.endTime) {
      return {
        hasConflicts: true,
        conflictingAppointments: [],
        conflictReasons: ['Missing time information']
      };
    }

    return await this.db.checkAppointmentConflicts(
      repId,
      request.appointmentDate,
      request.startTime,
      request.endTime,
      excludeAppointmentId
    );
  }

  private async findAlternatives(request: BookingRequest): Promise<OptimizedSlot[]> {
    const expandedStartDate = this.addDays(request.appointmentDate, -3);
    const expandedEndDate = this.addDays(request.appointmentDate, 14);

    const availabilityRequest: AvailabilityRequest = {
      activityId: request.activityId,
      startDate: expandedStartDate,
      endDate: expandedEndDate,
      preferredTimes: request.preferredTimes,
      excludeWeekends: true,
      minLeadTimeHours: 24
    };

    return await this.availabilityEngine.findOptimalSlots(availabilityRequest, 10);
  }

  private async createAppointmentRecord(
    request: BookingRequest,
    repId: string,
    activity: SchedulingActivity
  ): Promise<PharmaAppointment> {
    return await this.db.createPharmaAppointment({
      activityId: request.activityId,
      repId,
      appointmentDate: request.appointmentDate,
      startTime: request.startTime,
      endTime: request.endTime || this.calculateEndTime(request.startTime, activity.durationMinutes),
      status: 'pending',
      location: activity.location,
      locationAddress: activity.locationAddress,
      participantCount: request.participantCount || 1,
      approvalStatus: activity.requiresApproval ? 'pending' : 'approved',
      specialRequests: request.specialRequests,
      bookingSource: request.bookingSource || 'web',
      confirmationSent: false,
      reminderSent: false
    });
  }

  private generateNextSteps(appointment: PharmaAppointment, approvalRequired: boolean): string[] {
    console.log(`[BookingEngine] Generating next steps for appointment ${appointment.id}`);
    const steps: string[] = [];

    if (approvalRequired) {
      steps.push('Await approval confirmation (typically within 24 hours)');
      steps.push('Check email for approval status updates');
    } else {
      steps.push('Appointment confirmed - check email for details');
      steps.push('Add to your calendar using the attached invite');
    }

    steps.push('Contact location if you have questions');
    steps.push('Arrive 15 minutes early on appointment day');

    return steps;
  }

  private generateConfirmationNumber(appointmentId: string): string {
    console.log(`[BookingEngine] Generating confirmation number for appointment: ${appointmentId}`);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `PH${timestamp}${random}`.toUpperCase();
  }

  // Utility methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const parts = startTime.split(':');
    if (parts.length !== 2) return startTime;
    
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return startTime;
    
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private getDefaultSettings(): BookingSettings {
    return {
      allowSameDayBooking: false,
      maxAdvanceBookingDays: 90,
      autoApprovalThreshold: 72,
      requireRepVerification: true,
      enableWaitlist: true,
      defaultMeetingDuration: 60,
      reminderSchedule: [
        { hours: 24, type: 'email' },
        { hours: 2, type: 'sms' }
      ],
      cancellationPolicy: {
        minimumHours: 24,
        allowFreeCancellation: true,
        penaltyPercentage: 0
      }
    };
  }

  // Placeholder methods that would be fully implemented
  private async isModificationAllowed(appointment: PharmaAppointment): Promise<{
    allowed: boolean;
    reason: string;
    alternatives: string[];
  }> {
    return {
      allowed: true,
      reason: '',
      alternatives: []
    };
  }

  private mergeBookingChanges(
    existing: PharmaAppointment,
    changes: Partial<BookingRequest>
  ): BookingRequest {
    return {
      repEmail: '', // Would be populated from existing appointment
      companyName: '', // Would be populated from existing appointment
      activityId: existing.activityId,
      appointmentDate: changes.appointmentDate || existing.appointmentDate,
      startTime: changes.startTime || existing.startTime,
      endTime: changes.endTime || existing.endTime,
      participantCount: changes.participantCount || existing.participantCount,
      specialRequests: changes.specialRequests || existing.specialRequests,
      ...changes
    };
  }

  private async applyBookingModifications(
    appointmentId: string,
    changes: Partial<BookingRequest>
  ): Promise<PharmaAppointment> {
    const updates: any = {};
    
    if (changes.appointmentDate) updates.appointmentDate = changes.appointmentDate;
    if (changes.startTime) updates.startTime = changes.startTime;
    if (changes.endTime) updates.endTime = changes.endTime;
    if (changes.participantCount) updates.participantCount = changes.participantCount;
    if (changes.specialRequests) updates.specialRequests = changes.specialRequests;

    return await this.db.updatePharmaAppointment(appointmentId, updates);
  }

  private async isCancellationAllowed(appointment: PharmaAppointment): Promise<{
    allowed: boolean;
    reason: string;
    alternatives: string[];
    penalties: string[];
  }> {
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
    const hoursUntilAppointment = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < this.settings.cancellationPolicy.minimumHours) {
      return {
        allowed: false,
        reason: `Cancellation requires ${this.settings.cancellationPolicy.minimumHours} hours notice`,
        alternatives: ['Contact location directly for emergency cancellation'],
        penalties: []
      };
    }

    return {
      allowed: true,
      reason: '',
      alternatives: [],
      penalties: []
    };
  }

  private async sendBookingConfirmation(confirmation: BookingConfirmation): Promise<void> {
    // Would integrate with Universal Communication Hub
    console.log(`Sending ${confirmation.confirmationType} confirmation for appointment ${confirmation.appointmentId}`);
  }

  private async sendCancellationNotifications(
    appointment: PharmaAppointment,
    reason: string
  ): Promise<void> {
    // Would send notifications to all participants
    console.log(`Sending cancellation notifications for appointment ${appointment.id}: ${reason}`);
  }

  private async logBookingEvent(
    appointmentId: string,
    event: string,
    details: Record<string, any>
  ): Promise<void> {
    // Would log to pharma_communications table
    console.log(`Booking event ${event} for appointment ${appointmentId}:`, details);
  }

  private async generateIntelligentRecommendations(
    rep: PharmaRepresentative,
    activityId: string,
    historicalBookings: PharmaAppointment[],
    preferences?: any
  ): Promise<{
    recommendedSlots: OptimizedSlot[];
    reasoning: string[];
    alternatives: OptimizedSlot[];
  }> {
    // Would analyze patterns and generate intelligent recommendations
    return {
      recommendedSlots: [],
      reasoning: [],
      alternatives: []
    };
  }
}