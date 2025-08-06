// HIPAA-Compliant SMS Service using Twilio MCP
// Universal SMS service for all Ganger Platform applications

import { createClient } from '@supabase/supabase-js';
import { 
  CommunicationConfig, 
  CommunicationLog, 
  SMSDeliveryResult,
  CommunicationRequest 
} from './types';
import { TwilioMCPService, createTwilioMCPService, TwilioMCPConfig } from './twilio-mcp-service';

export class HIPAACompliantSMSService {
  private config: CommunicationConfig;
  private supabase: any;
  private twilioMCP: TwilioMCPService;

  constructor(
    config: CommunicationConfig, 
    supabaseUrl: string, 
    supabaseKey: string,
    twilioConfig: TwilioMCPConfig
  ) {
    this.config = config;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.twilioMCP = createTwilioMCPService(twilioConfig);
  }

  /**
   * Send HIPAA-compliant SMS using Twilio MCP
   * This method will be enhanced with actual Twilio MCP integration
   */
  async sendSMS(request: CommunicationRequest): Promise<SMSDeliveryResult> {
    try {
      // 1. Validate recipient consent
      if (request.require_consent !== false) {
        const hasConsent = await this.verifyPatientConsent(request.patient_id!, 'sms');
        if (!hasConsent) {
          throw new Error('Patient SMS consent required but not found');
        }
      }

      // 2. Get patient phone number
      const recipient = request.recipient || await this.getPatientPhone(request.patient_id!);
      if (!recipient) {
        throw new Error('No phone number found for patient');
      }

      // 3. Load and process template
      const template = await this.getTemplate(request.template_name, 'sms');
      const processedContent = this.processTemplate(template.content, request.variables);

      // 4. Send via Twilio (MCP integration point)
      // TODO: Replace with actual Twilio MCP call
      const messageResult = await this.sendViaTwilio(recipient, processedContent);

      // 5. Log communication for HIPAA audit trail
      await this.logCommunication({
        patient_id: request.patient_id,
        staff_id: request.staff_id,
        template_id: template.id,
        channel: 'sms',
        recipient: recipient,
        content: await this.encryptContent(processedContent),
        status: messageResult.success ? 'sent' : 'failed',
        external_id: messageResult.message_id,
        error_message: messageResult.error,
        sent_at: new Date(),
        created_at: new Date()
      });

      return messageResult;

    } catch (error) {
      console.error('SMS sending failed:', error);
      
      // Log failed attempt for audit trail
      if (request.patient_id) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.logCommunication({
          patient_id: request.patient_id,
          staff_id: request.staff_id,
          template_id: 'unknown',
          channel: 'sms',
          recipient: request.recipient || 'unknown',
          content: await this.encryptContent(`Failed: ${errorMessage}`),
          status: 'failed',
          error_message: errorMessage,
          created_at: new Date()
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed',
        timestamp: new Date()
      };
    }
  }

  /**
   * Verify patient has consented to SMS communications
   */
  private async verifyPatientConsent(patientId: string, type: 'sms' | 'email'): Promise<boolean> {
    const { data: consent } = await this.supabase
      .from('patient_communication_consent')
      .select('*')
      .eq('patient_id', patientId)
      .eq('consent_type', type)
      .eq('consented', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return !!consent;
  }

  /**
   * Get patient's preferred phone number
   */
  private async getPatientPhone(patientId: string): Promise<string | null> {
    const { data: contact } = await this.supabase
      .from('patient_contacts')
      .select('phone_number')
      .eq('patient_id', patientId)
      .eq('sms_consent', true)
      .single();

    return contact?.phone_number || null;
  }

  /**
   * Load communication template
   */
  private async getTemplate(templateName: string, channel: 'sms' | 'email') {
    const { data: template } = await this.supabase
      .from('communication_templates')
      .select('*')
      .eq('name', templateName)
      .eq('channel', channel)
      .eq('hipaa_compliant', true)
      .single();

    if (!template) {
      throw new Error(`Template not found: ${templateName} for ${channel}`);
    }

    return template;
  }

  /**
   * Process template with variables
   */
  private processTemplate(content: string, variables: Record<string, string>): string {
    let processed = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), value);
    });

    return processed;
  }

  /**
   * Send SMS via Twilio MCP server
   * Real SMS delivery using Twilio MCP integration
   */
  private async sendViaTwilio(to: string, message: string): Promise<SMSDeliveryResult> {
    try {
      // Use Twilio MCP service for real SMS delivery
      const result = await this.twilioMCP.sendSMS(to, message);
      
      console.log(`[Twilio MCP] SMS sent to: ${to}, Status: ${result.status}, ID: ${result.message_id}`);
      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed',
        timestamp: new Date()
      };
    }
  }

  /**
   * Encrypt content for HIPAA compliance
   */
  private async encryptContent(content: string): Promise<string> {
    // TODO: Implement AES encryption with config.encryption_key
    // For now, return base64 encoded (NOT secure for production)
    return Buffer.from(content).toString('base64');
  }

  /**
   * Log communication for HIPAA audit trail
   */
  private async logCommunication(log: Omit<CommunicationLog, 'id'>): Promise<void> {
    await this.supabase
      .from('communication_logs')
      .insert(log);
  }

  /**
   * Get communication history for a patient (for audit purposes)
   */
  async getPatientCommunicationHistory(patientId: string, limit: number = 50): Promise<CommunicationLog[]> {
    const { data: logs } = await this.supabase
      .from('communication_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return logs || [];
  }

  /**
   * Update message delivery status (webhook from Twilio)
   */
  async updateDeliveryStatus(messageId: string, status: string, deliveredAt?: Date): Promise<void> {
    await this.supabase
      .from('communication_logs')
      .update({
        status: status,
        delivered_at: deliveredAt
      })
      .eq('external_id', messageId);
  }
}

// Convenience functions for common message types
export class MedicalSMSTemplates {
  private smsService: HIPAACompliantSMSService;

  constructor(smsService: HIPAACompliantSMSService) {
    this.smsService = smsService;
  }

  /**
   * Send handout delivery notification
   */
  async sendHandoutDelivery(patientId: string, handoutTitle: string, handoutUrl: string, providerName: string): Promise<SMSDeliveryResult> {
    return this.smsService.sendSMS({
      patient_id: patientId,
      template_name: 'handout_delivery',
      channel: 'sms',
      variables: {
        handout_title: handoutTitle,
        handout_url: handoutUrl,
        provider_name: providerName,
        clinic_name: 'Ganger Dermatology'
      },
      priority: 'normal'
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    patientId: string, 
    appointmentDate: Date, 
    appointmentTime: string, 
    providerName: string
  ): Promise<SMSDeliveryResult> {
    return this.smsService.sendSMS({
      patient_id: patientId,
      template_name: 'appointment_reminder',
      channel: 'sms',
      variables: {
        appointment_date: appointmentDate.toLocaleDateString(),
        appointment_time: appointmentTime,
        provider_name: providerName,
        clinic_name: 'Ganger Dermatology',
        clinic_phone: '(555) 123-4567' // TODO: Get from config
      },
      priority: 'normal'
    });
  }

  /**
   * Send medication authorization update
   */
  async sendMedicationUpdate(
    patientId: string, 
    medicationName: string, 
    status: string, 
    providerName: string
  ): Promise<SMSDeliveryResult> {
    return this.smsService.sendSMS({
      patient_id: patientId,
      template_name: 'medication_update',
      channel: 'sms',
      variables: {
        medication_name: medicationName,
        authorization_status: status,
        provider_name: providerName,
        clinic_phone: '(555) 123-4567'
      },
      priority: 'high'
    });
  }
}