/**
 * Pharmaceutical Scheduling Notification Service
 * Comprehensive communication system with Universal Communication Hub integration
 */

import { 
  PharmaSchedulingQueries, 
  PharmaAppointment, 
} from '@ganger/db';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'both';
  trigger: 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'reminder' | 'approval_required' | 'approval_granted' | 'approval_denied' | 'modification_request';
  subject?: string; // For email
  emailTemplate: string;
  smsTemplate?: string;
  variables: string[]; // Available template variables
  isActive: boolean;
  audienceType: 'rep' | 'staff' | 'approver' | 'admin';
}

export interface NotificationRequest {
  type: NotificationTemplate['trigger'];
  recipients: Array<{
    email: string;
    phone?: string;
    name?: string;
    role?: string;
  }>;
  appointmentId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: string; // ISO timestamp for scheduled notifications
  customData?: Record<string, any>;
  suppressDuplicates?: boolean;
  trackDelivery?: boolean;
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  emailResults?: Array<{
    recipient: string;
    status: 'sent' | 'failed' | 'bounced' | 'delivered';
    messageId?: string;
    error?: string;
  }>;
  smsResults?: Array<{
    recipient: string;
    status: 'sent' | 'failed' | 'delivered';
    messageId?: string;
    error?: string;
  }>;
  totalSent: number;
  totalFailed: number;
  scheduledFor?: string;
}

export interface ReminderSchedule {
  appointmentId: string;
  reminderType: 'confirmation' | 'day_before' | 'hour_before' | 'follow_up';
  scheduledTime: string;
  recipients: string[];
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attemptCount: number;
  lastAttempt?: string;
  nextRetry?: string;
}

export interface NotificationPreferences {
  email: string;
  enableEmail: boolean;
  enableSMS: boolean;
  phone?: string;
  timezone: string;
  reminderPreferences: {
    bookingConfirmation: boolean;
    dayBeforeReminder: boolean;
    hourBeforeReminder: boolean;
    cancellationNotice: boolean;
    rescheduleNotice: boolean;
  };
  frequencyLimits: {
    maxEmailsPerDay: number;
    maxSMSPerDay: number;
    quietHoursStart: string; // HH:MM
    quietHoursEnd: string; // HH:MM
  };
}

export interface CommunicationLog {
  id: string;
  appointmentId?: string;
  repId: string;
  communicationType: NotificationTemplate['trigger'];
  method: 'email' | 'sms';
  content: string;
  sentTo: string[];
  sentAt: string;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'bounced' | 'read';
  deliveryDetails?: Record<string, any>;
  complianceAuditId?: string;
  createdBy: string;
}

export class PharmaNotificationService {
  private db: PharmaSchedulingQueries;
  private templates: Map<string, NotificationTemplate>;
  private scheduledReminders: Map<string, ReminderSchedule[]>;
  private userPreferences: Map<string, NotificationPreferences>;
  
  // Integration with Universal Communication Hub would be added here
  // private communicationService: TwilioCommunicationService;

  constructor(dbQueries: PharmaSchedulingQueries) {
    this.db = dbQueries;
    this.templates = new Map();
    this.scheduledReminders = new Map();
    this.userPreferences = new Map();
    
    this.initializeTemplates();
    this.startBackgroundProcesses();
  }

  // =====================================================
  // MAIN NOTIFICATION METHODS
  // =====================================================

  async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    try {
      // Get appointment details
      const appointment = await this.db.getPharmaAppointmentById(request.appointmentId);
      if (!appointment) {
        throw new Error(`Appointment ${request.appointmentId} not found`);
      }

      // Get notification template
      const template = this.getTemplate(request.type);
      if (!template) {
        throw new Error(`Template for ${request.type} not found`);
      }

      // Check for duplicate notifications if requested
      if (request.suppressDuplicates) {
        const isDuplicate = await this.checkDuplicateNotification(request);
        if (isDuplicate) {
          return {
            success: true,
            notificationId: 'duplicate_suppressed',
            totalSent: 0,
            totalFailed: 0
          };
        }
      }

      // Prepare notification data
      const notificationData = await this.prepareNotificationData(appointment, request.customData);
      
      // Render templates
      const renderedEmail = this.renderTemplate(template.emailTemplate, notificationData);
      const renderedSMS = template.smsTemplate ? this.renderTemplate(template.smsTemplate, notificationData) : undefined;
      const renderedSubject = template.subject ? this.renderTemplate(template.subject, notificationData) : undefined;

      const result: NotificationResult = {
        success: false,
        notificationId: this.generateNotificationId(),
        emailResults: [],
        smsResults: [],
        totalSent: 0,
        totalFailed: 0
      };

      // Send notifications to each recipient
      for (const recipient of request.recipients) {
        // Check user preferences
        const preferences = this.getUserPreferences(recipient.email);
        
        // Send email if enabled and template supports it
        if (preferences.enableEmail && (template.type === 'email' || template.type === 'both')) {
          try {
            const emailResult = await this.sendEmail({
              to: recipient.email,
              subject: renderedSubject || `Pharmaceutical Appointment ${request.type}`,
              body: renderedEmail,
              priority: request.priority
            });

            result.emailResults?.push({
              recipient: recipient.email,
              status: emailResult.success ? 'sent' : 'failed',
              messageId: emailResult.messageId,
              error: emailResult.error
            });

            if (emailResult.success) {
              result.totalSent++;
            } else {
              result.totalFailed++;
            }
          } catch (error) {
            result.emailResults?.push({
              recipient: recipient.email,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            result.totalFailed++;
          }
        }

        // Send SMS if enabled, phone available, and template supports it
        if (preferences.enableSMS && recipient.phone && renderedSMS && 
            (template.type === 'sms' || template.type === 'both')) {
          try {
            const smsResult = await this.sendSMS({
              to: recipient.phone,
              message: renderedSMS,
              priority: request.priority
            });

            result.smsResults?.push({
              recipient: recipient.phone,
              status: smsResult.success ? 'sent' : 'failed',
              messageId: smsResult.messageId,
              error: smsResult.error
            });

            if (smsResult.success) {
              result.totalSent++;
            } else {
              result.totalFailed++;
            }
          } catch (error) {
            result.smsResults?.push({
              recipient: recipient.phone,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            result.totalFailed++;
          }
        }
      }

      // Log communication for compliance
      await this.logCommunication(appointment, request, result);

      result.success = result.totalFailed === 0;
      return result;

    } catch (error) {
      return {
        success: false,
        notificationId: 'error',
        totalSent: 0,
        totalFailed: request.recipients.length,
        emailResults: request.recipients.map(r => ({
          recipient: r.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      };
    }
  }

  // =====================================================
  // BOOKING LIFECYCLE NOTIFICATIONS
  // =====================================================

  async sendBookingConfirmation(appointmentId: string, customMessage?: string): Promise<NotificationResult> {
    const appointment = await this.db.getPharmaAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const rep = await this.db.getPharmaRepById(appointment.repId);
    if (!rep) {
      throw new Error('Representative not found');
    }

    return await this.sendNotification({
      type: 'booking_confirmed',
      recipients: [{
        email: rep.email,
        phone: rep.phoneNumber,
        name: `${rep.firstName} ${rep.lastName}`,
        role: 'representative'
      }],
      appointmentId,
      priority: 'medium',
      customData: {
        customMessage,
        confirmationNumber: this.generateConfirmationNumber(appointmentId)
      },
      trackDelivery: true
    });
  }

  async sendApprovalRequest(appointmentId: string, approverEmails: string[]): Promise<NotificationResult> {
    const recipients = approverEmails.map(email => ({
      email,
      name: 'Staff Member',
      role: 'approver'
    }));

    return await this.sendNotification({
      type: 'approval_required',
      recipients,
      appointmentId,
      priority: 'high',
      customData: {
        approvalUrl: `/admin/approvals/${appointmentId}`,
        urgency: 'Please review within 24 hours'
      },
      trackDelivery: true
    });
  }

  async sendApprovalDecision(
    appointmentId: string, 
    decision: 'approved' | 'denied', 
    reason?: string
  ): Promise<NotificationResult> {
    const appointment = await this.db.getPharmaAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const rep = await this.db.getPharmaRepById(appointment.repId);
    if (!rep) {
      throw new Error('Representative not found');
    }

    const notificationType = decision === 'approved' ? 'approval_granted' : 'approval_denied';

    return await this.sendNotification({
      type: notificationType,
      recipients: [{
        email: rep.email,
        phone: rep.phoneNumber,
        name: `${rep.firstName} ${rep.lastName}`,
        role: 'representative'
      }],
      appointmentId,
      priority: decision === 'denied' ? 'high' : 'medium',
      customData: {
        decision,
        reason,
        nextSteps: decision === 'approved' ? 
          'Your appointment is confirmed. Calendar invite attached.' :
          'Please contact us to discuss alternative arrangements.'
      },
      trackDelivery: true
    });
  }

  async sendCancellationNotice(
    appointmentId: string, 
    cancelledBy: string, 
    reason?: string
  ): Promise<NotificationResult> {
    const appointment = await this.db.getPharmaAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const rep = await this.db.getPharmaRepById(appointment.repId);
    if (!rep) {
      throw new Error('Representative not found');
    }

    // Get all participants
    const participants = await this.getAppointmentParticipants(appointmentId);
    const recipients = [
      {
        email: rep.email,
        phone: rep.phoneNumber,
        name: `${rep.firstName} ${rep.lastName}`,
        role: 'representative'
      },
      ...participants.map(p => ({
        email: p.staffEmail,
        name: p.staffName,
        role: 'staff'
      }))
    ];

    return await this.sendNotification({
      type: 'booking_cancelled',
      recipients,
      appointmentId,
      priority: 'high',
      customData: {
        cancelledBy,
        reason,
        cancellationDate: new Date().toISOString(),
        rebookingUrl: '/book/pharmaceutical'
      },
      trackDelivery: true
    });
  }

  // =====================================================
  // REMINDER SYSTEM
  // =====================================================

  async scheduleReminders(appointmentId: string): Promise<void> {
    const appointment = await this.db.getPharmaAppointmentById(appointmentId);
    if (!appointment || appointment.status !== 'confirmed') {
      return;
    }

    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
    const now = new Date();

    const reminders: ReminderSchedule[] = [];

    // 24-hour reminder
    const dayBeforeTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (dayBeforeTime > now) {
      reminders.push({
        appointmentId,
        reminderType: 'day_before',
        scheduledTime: dayBeforeTime.toISOString(),
        recipients: [appointment.repId],
        status: 'pending',
        attemptCount: 0
      });
    }

    // 2-hour reminder
    const hourBeforeTime = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
    if (hourBeforeTime > now) {
      reminders.push({
        appointmentId,
        reminderType: 'hour_before',
        scheduledTime: hourBeforeTime.toISOString(),
        recipients: [appointment.repId],
        status: 'pending',
        attemptCount: 0
      });
    }

    // Store scheduled reminders
    this.scheduledReminders.set(appointmentId, reminders);
  }

  async processScheduledReminders(): Promise<void> {
    const now = new Date();

    for (const [appointmentId, reminders] of this.scheduledReminders) {
      const dueReminders = reminders.filter(r => 
        r.status === 'pending' && 
        new Date(r.scheduledTime) <= now
      );

      for (const reminder of dueReminders) {
        try {
          await this.sendReminder(reminder);
          reminder.status = 'sent';
          reminder.lastAttempt = now.toISOString();
        } catch (error) {
          reminder.status = 'failed';
          reminder.attemptCount++;
          reminder.lastAttempt = now.toISOString();
          
          // Schedule retry in 1 hour if less than 3 attempts
          if (reminder.attemptCount < 3) {
            reminder.nextRetry = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            reminder.status = 'pending';
          }
          
          this.logError(`Failed to send reminder for appointment ${appointmentId}`, error);
        }
      }
    }
  }

  private async sendReminder(reminder: ReminderSchedule): Promise<void> {
    const appointment = await this.db.getPharmaAppointmentById(reminder.appointmentId);
    if (!appointment) return;

    const rep = await this.db.getPharmaRepById(appointment.repId);
    if (!rep) return;

    const reminderTypes = {
      'day_before': 'Your pharmaceutical appointment is tomorrow',
      'hour_before': 'Your pharmaceutical appointment is in 2 hours',
      'confirmation': 'Please confirm your pharmaceutical appointment',
      'follow_up': 'Thank you for your pharmaceutical meeting'
    };

    await this.sendNotification({
      type: 'reminder',
      recipients: [{
        email: rep.email,
        phone: rep.phoneNumber,
        name: `${rep.firstName} ${rep.lastName}`,
        role: 'representative'
      }],
      appointmentId: reminder.appointmentId,
      priority: reminder.reminderType === 'hour_before' ? 'high' : 'medium',
      customData: {
        reminderType: reminder.reminderType,
        reminderMessage: reminderTypes[reminder.reminderType]
      }
    });
  }

  // =====================================================
  // TEMPLATE MANAGEMENT
  // =====================================================

  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'booking_confirmed',
        name: 'Booking Confirmation',
        type: 'both',
        trigger: 'booking_confirmed',
        subject: 'Pharmaceutical Appointment Confirmed - {{activityName}}',
        emailTemplate: `
          <h2>Appointment Confirmed</h2>
          <p>Dear {{repName}},</p>
          <p>Your pharmaceutical appointment has been confirmed:</p>
          <ul>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{startTime}} - {{endTime}}</li>
            <li><strong>Location:</strong> {{location}}</li>
            <li><strong>Address:</strong> {{locationAddress}}</li>
            <li><strong>Activity:</strong> {{activityName}}</li>
          </ul>
          {{#if specialRequests}}
          <p><strong>Special Requests:</strong> {{specialRequests}}</p>
          {{/if}}
          <p><strong>Confirmation Number:</strong> {{confirmationNumber}}</p>
          <p>Please arrive 15 minutes early. If you need to cancel or reschedule, please provide at least 24 hours notice.</p>
          <p>Best regards,<br>Ganger Dermatology Team</p>
        `,
        smsTemplate: 'CONFIRMED: {{activityName}} on {{appointmentDate}} at {{startTime}}. Location: {{location}}. Confirmation: {{confirmationNumber}}',
        variables: ['repName', 'appointmentDate', 'startTime', 'endTime', 'location', 'locationAddress', 'activityName', 'specialRequests', 'confirmationNumber'],
        isActive: true,
        audienceType: 'rep'
      },
      {
        id: 'approval_required',
        name: 'Approval Required',
        type: 'email',
        trigger: 'approval_required',
        subject: 'Pharmaceutical Appointment Approval Required',
        emailTemplate: `
          <h2>Approval Required</h2>
          <p>A new pharmaceutical appointment requires your approval:</p>
          <ul>
            <li><strong>Representative:</strong> {{repName}} ({{companyName}})</li>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{startTime}} - {{endTime}}</li>
            <li><strong>Location:</strong> {{location}}</li>
            <li><strong>Activity:</strong> {{activityName}}</li>
          </ul>
          {{#if specialRequests}}
          <p><strong>Special Requests:</strong> {{specialRequests}}</p>
          {{/if}}
          <p><a href="{{approvalUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review & Approve</a></p>
          <p>{{urgency}}</p>
        `,
        variables: ['repName', 'companyName', 'appointmentDate', 'startTime', 'endTime', 'location', 'activityName', 'specialRequests', 'approvalUrl', 'urgency'],
        isActive: true,
        audienceType: 'approver'
      },
      {
        id: 'approval_granted',
        name: 'Approval Granted',
        type: 'both',
        trigger: 'approval_granted',
        subject: 'Pharmaceutical Appointment Approved - {{activityName}}',
        emailTemplate: `
          <h2>Appointment Approved!</h2>
          <p>Dear {{repName}},</p>
          <p>Great news! Your pharmaceutical appointment has been approved:</p>
          <ul>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{startTime}} - {{endTime}}</li>
            <li><strong>Location:</strong> {{location}}</li>
            <li><strong>Activity:</strong> {{activityName}}</li>
          </ul>
          <p>{{nextSteps}}</p>
          <p>We look forward to meeting with you!</p>
          <p>Best regards,<br>Ganger Dermatology Team</p>
        `,
        smsTemplate: 'APPROVED: {{activityName}} on {{appointmentDate}} at {{startTime}}. See email for details.',
        variables: ['repName', 'appointmentDate', 'startTime', 'endTime', 'location', 'activityName', 'nextSteps'],
        isActive: true,
        audienceType: 'rep'
      },
      {
        id: 'approval_denied',
        name: 'Approval Denied',
        type: 'both',
        trigger: 'approval_denied',
        subject: 'Pharmaceutical Appointment Request - Update Required',
        emailTemplate: `
          <h2>Appointment Request Update</h2>
          <p>Dear {{repName}},</p>
          <p>We're unable to accommodate your pharmaceutical appointment request at this time:</p>
          <ul>
            <li><strong>Requested Date:</strong> {{appointmentDate}}</li>
            <li><strong>Requested Time:</strong> {{startTime}} - {{endTime}}</li>
            <li><strong>Location:</strong> {{location}}</li>
          </ul>
          {{#if reason}}
          <p><strong>Reason:</strong> {{reason}}</p>
          {{/if}}
          <p>{{nextSteps}}</p>
          <p>Thank you for your understanding.</p>
          <p>Best regards,<br>Ganger Dermatology Team</p>
        `,
        smsTemplate: 'DECLINED: {{activityName}} request for {{appointmentDate}}. Please check email for details and alternatives.',
        variables: ['repName', 'appointmentDate', 'startTime', 'endTime', 'location', 'reason', 'nextSteps'],
        isActive: true,
        audienceType: 'rep'
      },
      {
        id: 'booking_cancelled',
        name: 'Booking Cancelled',
        type: 'both',
        trigger: 'booking_cancelled',
        subject: 'Pharmaceutical Appointment Cancelled - {{activityName}}',
        emailTemplate: `
          <h2>Appointment Cancelled</h2>
          <p>Your pharmaceutical appointment has been cancelled:</p>
          <ul>
            <li><strong>Date:</strong> {{appointmentDate}}</li>
            <li><strong>Time:</strong> {{startTime}} - {{endTime}}</li>
            <li><strong>Location:</strong> {{location}}</li>
          </ul>
          {{#if reason}}
          <p><strong>Reason:</strong> {{reason}}</p>
          {{/if}}
          <p><strong>Cancelled by:</strong> {{cancelledBy}}</p>
          <p><strong>Cancellation Date:</strong> {{cancellationDate}}</p>
          <p><a href="{{rebookingUrl}}">Schedule a new appointment</a></p>
          <p>We apologize for any inconvenience.</p>
        `,
        smsTemplate: 'CANCELLED: {{activityName}} on {{appointmentDate}}. Cancelled by {{cancelledBy}}. {{#if reason}}Reason: {{reason}}{{/if}}',
        variables: ['appointmentDate', 'startTime', 'endTime', 'location', 'reason', 'cancelledBy', 'cancellationDate', 'rebookingUrl'],
        isActive: true,
        audienceType: 'rep'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private getTemplate(trigger: NotificationTemplate['trigger']): NotificationTemplate | undefined {
    return Array.from(this.templates.values()).find(t => t.trigger === trigger && t.isActive);
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Simple template rendering - in production would use a proper template engine
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    });

    // Handle conditional blocks (simplified)
    rendered = rendered.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (_match, condition, content) => {
      return data[condition] ? content : '';
    });

    return rendered;
  }

  // =====================================================
  // COMMUNICATION METHODS
  // =====================================================

  private async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    priority: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Integration with Universal Communication Hub would go here
      console.log(`Sending email to ${params.to}: ${params.subject}`);
      
      return {
        success: true,
        messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendSMS(params: {
    to: string;
    message: string;
    priority: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Integration with Universal Communication Hub would go here
      console.log(`Sending SMS to ${params.to}: ${params.message}`);
      
      return {
        success: true,
        messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private async prepareNotificationData(
    appointment: PharmaAppointment,
    customData?: Record<string, any>
  ): Promise<Record<string, any>> {
    const rep = await this.db.getPharmaRepById(appointment.repId);

    const baseData = {
      // Appointment data
      appointmentId: appointment.id,
      appointmentDate: this.formatDate(appointment.appointmentDate),
      startTime: this.formatTime(appointment.startTime),
      endTime: this.formatTime(appointment.endTime),
      location: appointment.location,
      locationAddress: appointment.locationAddress,
      specialRequests: appointment.specialRequests,
      
      // Representative data
      repName: rep ? `${rep.firstName} ${rep.lastName}` : 'Unknown',
      repFirstName: rep?.firstName || 'Unknown',
      repLastName: rep?.lastName || 'Rep',
      companyName: rep?.companyName || 'Unknown Company',
      
      // Activity data
      // TODO: Add activityName and description to PharmaAppointment type when implementing activity types
      activityName: 'Pharmaceutical Meeting', // Default activity name
      activityDescription: '', // Will be populated from appointment metadata
      
      // System data
      currentDate: this.formatDate(new Date().toISOString().split('T')[0] || ''),
      currentTime: this.formatTime(new Date().toTimeString().split(' ')[0]?.substring(0, 5) || '')
    };

    return { ...baseData, ...customData };
  }

  private getUserPreferences(email: string): NotificationPreferences {
    const cached = this.userPreferences.get(email);
    if (cached) return cached;

    // Default preferences
    const defaultPrefs: NotificationPreferences = {
      email,
      enableEmail: true,
      enableSMS: false,
      timezone: 'America/Detroit',
      reminderPreferences: {
        bookingConfirmation: true,
        dayBeforeReminder: true,
        hourBeforeReminder: true,
        cancellationNotice: true,
        rescheduleNotice: true
      },
      frequencyLimits: {
        maxEmailsPerDay: 10,
        maxSMSPerDay: 5,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      }
    };

    this.userPreferences.set(email, defaultPrefs);
    return defaultPrefs;
  }

  private async checkDuplicateNotification(_request: NotificationRequest): Promise<boolean> {
    // Check if similar notification was sent recently (within 1 hour)
    // This would query the pharma_communications table
    return false;
  }

  private async logCommunication(
    appointment: PharmaAppointment,
    request: NotificationRequest,
    _result: NotificationResult
  ): Promise<void> {
    // Log to pharma_communications table for compliance
    console.log(`Communication logged for appointment ${appointment.id}: ${request.type}`);
  }

  private async getAppointmentParticipants(_appointmentId: string): Promise<any[]> {
    // This would query the appointment_participants table
    return [];
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConfirmationNumber(_appointmentId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `PH${timestamp}${random}`.toUpperCase();
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
    if (hours === undefined || minutes === undefined) {
      return timeStr;
    }
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private startBackgroundProcesses(): void {
    // Process scheduled reminders every 5 minutes
    setInterval(() => {
      this.processScheduledReminders();
    }, 5 * 60 * 1000);

    // Clean up old reminders daily
    setInterval(() => {
      this.cleanupOldReminders();
    }, 24 * 60 * 60 * 1000);
  }

  private cleanupOldReminders(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep reminders for 7 days

    for (const [appointmentId, reminders] of this.scheduledReminders) {
      const activeReminders = reminders.filter(r => 
        new Date(r.scheduledTime) > cutoffDate
      );
      
      if (activeReminders.length === 0) {
        this.scheduledReminders.delete(appointmentId);
      } else {
        this.scheduledReminders.set(appointmentId, activeReminders);
      }
    }
  }

  private logError(message: string, error?: any): void {
    console.error(`[PharmaNotificationService] ERROR: ${message}`, error || '');
  }
}