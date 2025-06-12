// Universal Patient Communication Hub
// Single entry point for all communication across Ganger Platform

import { HIPAACompliantSMSService, MedicalSMSTemplates } from './sms-service';
import { PatientConsentManager } from './consent-manager';
import { 
  CommunicationConfig, 
  CommunicationRequest, 
  SMSDeliveryResult,
  HandoutDeliveryMessage,
  AppointmentReminderMessage,
  MedicationUpdateMessage,
  TrainingNotificationMessage,
  StaffAlertMessage
} from './types';

export class PatientCommunicationHub {
  private smsService: HIPAACompliantSMSService;
  private smsTemplates: MedicalSMSTemplates;
  private consentManager: PatientConsentManager;
  private config: CommunicationConfig;

  constructor(
    config: CommunicationConfig,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.config = config;
    
    // Create Twilio MCP configuration from communication config
    const twilioMCPConfig = {
      accountSid: config.twilio_account_sid,
      apiKey: config.twilio_api_key,
      apiSecret: config.twilio_api_secret,
      fromNumber: config.twilio_phone_number
    };
    
    this.smsService = new HIPAACompliantSMSService(config, supabaseUrl, supabaseKey, twilioMCPConfig);
    this.smsTemplates = new MedicalSMSTemplates(this.smsService);
    this.consentManager = new PatientConsentManager(supabaseUrl, supabaseKey);
  }

  // ===========================================
  // HANDOUTS APPLICATION INTEGRATION
  // ===========================================

  /**
   * Send handout delivery notification (immediate integration with existing Handouts app)
   */
  async sendHandoutDelivery(message: HandoutDeliveryMessage): Promise<SMSDeliveryResult> {
    // Verify consent
    const hasConsent = await this.consentManager.hasValidConsent(message.patient_id, 'sms');
    if (!hasConsent) {
      return {
        success: false,
        error: 'Patient has not consented to SMS communications',
        status: 'failed',
        timestamp: new Date()
      };
    }

    return this.smsTemplates.sendHandoutDelivery(
      message.patient_id,
      message.handout_title,
      message.handout_url,
      message.provider_name
    );
  }

  // ===========================================
  // SCHEDULING APPLICATION INTEGRATION
  // ===========================================

  /**
   * Send appointment reminder (future Scheduling app integration)
   */
  async sendAppointmentReminder(message: AppointmentReminderMessage): Promise<SMSDeliveryResult> {
    const hasConsent = await this.consentManager.hasValidConsent(message.patient_id, 'sms');
    if (!hasConsent) {
      return {
        success: false,
        error: 'Patient has not consented to SMS communications',
        status: 'failed',
        timestamp: new Date()
      };
    }

    return this.smsTemplates.sendAppointmentReminder(
      message.patient_id,
      message.appointment_date,
      message.appointment_time,
      message.provider_name
    );
  }

  /**
   * Send bulk appointment reminders (for scheduling app)
   */
  async sendBulkAppointmentReminders(messages: AppointmentReminderMessage[]): Promise<{
    successful: number;
    failed: number;
    results: Array<{ patient_id: string; success: boolean; error?: string }>
  }> {
    
    const patientIds = messages.map(m => m.patient_id);
    const consentMap = await this.consentManager.checkBulkConsent(patientIds, 'sms');
    
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const message of messages) {
      if (!consentMap[message.patient_id]) {
        results.push({
          patient_id: message.patient_id,
          success: false,
          error: 'No SMS consent'
        });
        failed++;
        continue;
      }

      try {
        const result = await this.sendAppointmentReminder(message);
        results.push({
          patient_id: message.patient_id,
          success: result.success,
          error: result.error
        });
        
        if (result.success) successful++;
        else failed++;
        
      } catch (error) {
        results.push({
          patient_id: message.patient_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return { successful, failed, results };
  }

  // ===========================================
  // MEDICATION AUTHORIZATION INTEGRATION
  // ===========================================

  /**
   * Send medication authorization update (future Medications app integration)
   */
  async sendMedicationUpdate(message: MedicationUpdateMessage): Promise<SMSDeliveryResult> {
    const hasConsent = await this.consentManager.hasValidConsent(message.patient_id, 'sms');
    if (!hasConsent) {
      return {
        success: false,
        error: 'Patient has not consented to SMS communications',
        status: 'failed',
        timestamp: new Date()
      };
    }

    return this.smsTemplates.sendMedicationUpdate(
      message.patient_id,
      message.medication_name,
      message.authorization_status,
      message.provider_name
    );
  }

  // ===========================================
  // TRAINING PLATFORM INTEGRATION
  // ===========================================

  /**
   * Send training notification to staff (future Training app integration)
   */
  async sendTrainingNotification(message: TrainingNotificationMessage): Promise<SMSDeliveryResult> {
    // For staff notifications, we'll use a different consent mechanism
    // (staff consent during onboarding vs patient consent)
    
    return this.smsService.sendSMS({
      staff_id: message.staff_id,
      template_name: 'training_notification',
      channel: 'sms',
      variables: {
        training_title: message.training_title,
        due_date: message.due_date.toLocaleDateString(),
        completion_url: message.completion_url,
        manager_name: message.manager_name || 'Your Manager'
      },
      priority: 'normal',
      require_consent: false // Staff consent handled differently
    });
  }

  // ===========================================
  // CLINICAL STAFFING INTEGRATION
  // ===========================================

  /**
   * Send staff alert (future Staffing app integration)
   */
  async sendStaffAlert(message: StaffAlertMessage): Promise<{
    successful: number;
    failed: number;
    results: Array<{ staff_id: string; success: boolean; error?: string }>
  }> {
    
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const staffId of message.staff_ids) {
      try {
        const result = await this.smsService.sendSMS({
          staff_id: staffId,
          template_name: 'staff_alert',
          channel: 'sms',
          variables: {
            alert_type: message.alert_type,
            message: message.message,
            action_required: message.action_required.toString(),
            priority: message.priority
          },
          priority: message.priority,
          require_consent: false // Staff alerts are work-related
        });

        results.push({
          staff_id: staffId,
          success: result.success,
          error: result.error
        });

        if (result.success) successful++;
        else failed++;

      } catch (error) {
        results.push({
          staff_id: staffId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return { successful, failed, results };
  }

  // ===========================================
  // CHECK-IN KIOSK INTEGRATION
  // ===========================================

  /**
   * Send check-in confirmation (future Check-in Kiosk integration)
   */
  async sendCheckInConfirmation(
    patientId: string,
    appointmentTime: string,
    estimatedWaitTime: number,
    providerName: string
  ): Promise<SMSDeliveryResult> {
    
    const hasConsent = await this.consentManager.hasValidConsent(patientId, 'sms');
    if (!hasConsent) {
      return {
        success: false,
        error: 'Patient has not consented to SMS communications',
        status: 'failed',
        timestamp: new Date()
      };
    }

    return this.smsService.sendSMS({
      patient_id: patientId,
      template_name: 'checkin_confirmation',
      channel: 'sms',
      variables: {
        appointment_time: appointmentTime,
        estimated_wait: estimatedWaitTime.toString(),
        provider_name: providerName,
        clinic_name: 'Ganger Dermatology'
      },
      priority: 'normal'
    });
  }

  // ===========================================
  // CONSENT MANAGEMENT (All Apps)
  // ===========================================

  /**
   * Record patient communication consent (used by all patient-facing apps)
   */
  async recordPatientConsent(
    patientId: string,
    consentType: 'sms' | 'email' | 'both',
    consented: boolean,
    consentMethod: 'verbal' | 'written' | 'digital' | 'kiosk',
    staffId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.consentManager.recordConsent(
      patientId,
      consentType,
      consented,
      consentMethod,
      staffId,
      ipAddress,
      userAgent
    );
  }

  /**
   * Update patient contact information (used by all patient-facing apps)
   */
  async updatePatientContact(
    patientId: string,
    phoneNumber?: string,
    email?: string,
    preferredMethod?: 'sms' | 'email' | 'both'
  ) {
    return this.consentManager.updatePatientContact(
      patientId,
      phoneNumber,
      email,
      preferredMethod
    );
  }

  /**
   * Check if patient has valid consent (used by all apps before sending)
   */
  async hasPatientConsent(patientId: string, type: 'sms' | 'email'): Promise<boolean> {
    return this.consentManager.hasValidConsent(patientId, type);
  }

  /**
   * Get patient communication history (for audit and support)
   */
  async getPatientCommunicationHistory(patientId: string, limit?: number) {
    return this.smsService.getPatientCommunicationHistory(patientId, limit);
  }

  // ===========================================
  // ADMINISTRATIVE FUNCTIONS
  // ===========================================

  /**
   * Generate communication analytics (for all apps and admin dashboard)
   */
  async getCommunicationAnalytics(startDate?: Date, endDate?: Date) {
    // TODO: Implement comprehensive analytics
    const consentReport = await this.consentManager.generateConsentAuditReport(startDate, endDate);
    
    return {
      consent_analytics: consentReport,
      // TODO: Add message delivery analytics, cost analytics, etc.
    };
  }

  /**
   * Health check for communication services
   */
  async healthCheck(): Promise<{
    sms_service: boolean;
    database: boolean;
    consent_manager: boolean;
    overall: boolean;
  }> {
    
    try {
      // Test database connectivity
      const testConsent = await this.consentManager.hasValidConsent('test', 'sms');
      
      // Test SMS service configuration
      const smsHealthy = !!this.config.twilio_account_sid && !!this.config.twilio_auth_token;

      const status = {
        sms_service: smsHealthy,
        database: true, // If we got here, database is working
        consent_manager: true, // If consent check worked, manager is working
        overall: smsHealthy // Overall health depends on all services
      };

      return status;

    } catch (error) {
      return {
        sms_service: false,
        database: false,
        consent_manager: false,
        overall: false
      };
    }
  }
}