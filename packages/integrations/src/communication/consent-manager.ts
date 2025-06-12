// Patient Consent Management for HIPAA Compliance
// Universal consent tracking for all communication types

import { createClient } from '@supabase/supabase-js';
import { ConsentRecord, PatientContact } from './types';

export class PatientConsentManager {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Record patient consent for communications
   */
  async recordConsent(
    patientId: string,
    consentType: 'sms' | 'email' | 'both',
    consented: boolean,
    consentMethod: 'verbal' | 'written' | 'digital' | 'kiosk',
    staffId?: string,
    ipAddress?: string,
    userAgent?: string,
    notes?: string
  ): Promise<ConsentRecord> {
    
    const consentRecord: Omit<ConsentRecord, 'id'> = {
      patient_id: patientId,
      consent_type: consentType,
      consented,
      consent_date: new Date(),
      consent_method: consentMethod,
      ip_address: ipAddress,
      user_agent: userAgent,
      staff_id: staffId,
      notes,
      created_at: new Date()
    };

    const { data, error } = await this.supabase
      .from('patient_communication_consent')
      .insert(consentRecord)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record consent: ${error.message}`);
    }

    // Update patient contact preferences
    await this.updateContactPreferences(patientId, consentType, consented);

    return data;
  }

  /**
   * Check if patient has valid consent for communication type
   */
  async hasValidConsent(patientId: string, consentType: 'sms' | 'email'): Promise<boolean> {
    const { data: latestConsent } = await this.supabase
      .from('patient_communication_consent')
      .select('*')
      .eq('patient_id', patientId)
      .in('consent_type', [consentType, 'both'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (!latestConsent || latestConsent.length === 0) {
      return false;
    }

    return latestConsent[0].consented === true;
  }

  /**
   * Get consent history for a patient (audit purposes)
   */
  async getConsentHistory(patientId: string): Promise<ConsentRecord[]> {
    const { data: history } = await this.supabase
      .from('patient_communication_consent')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    return history || [];
  }

  /**
   * Revoke patient consent
   */
  async revokeConsent(
    patientId: string,
    consentType: 'sms' | 'email' | 'both',
    staffId?: string,
    reason?: string
  ): Promise<ConsentRecord> {
    return this.recordConsent(
      patientId,
      consentType,
      false, // consented = false
      'digital',
      staffId,
      undefined,
      undefined,
      reason ? `Consent revoked: ${reason}` : 'Consent revoked'
    );
  }

  /**
   * Update patient contact preferences based on consent
   */
  private async updateContactPreferences(
    patientId: string, 
    consentType: 'sms' | 'email' | 'both', 
    consented: boolean
  ): Promise<void> {
    
    const updateData: any = {
      updated_at: new Date()
    };

    if (consentType === 'sms' || consentType === 'both') {
      updateData.sms_consent = consented;
      updateData.consent_date = new Date();
    }

    if (consentType === 'email' || consentType === 'both') {
      updateData.email_consent = consented;
      updateData.consent_date = new Date();
    }

    // Update existing contact record or create new one
    const { data: existingContact } = await this.supabase
      .from('patient_contacts')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (existingContact) {
      await this.supabase
        .from('patient_contacts')
        .update(updateData)
        .eq('patient_id', patientId);
    } else {
      // Create new contact record
      await this.supabase
        .from('patient_contacts')
        .insert({
          patient_id: patientId,
          phone_number: '', // Will be updated when phone is provided
          email: '', // Will be updated when email is provided
          preferred_method: consentType === 'both' ? 'both' : consentType,
          sms_consent: consentType === 'sms' || consentType === 'both' ? consented : false,
          email_consent: consentType === 'email' || consentType === 'both' ? consented : false,
          consent_date: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
    }
  }

  /**
   * Update patient contact information
   */
  async updatePatientContact(
    patientId: string,
    phoneNumber?: string,
    email?: string,
    preferredMethod?: 'sms' | 'email' | 'both'
  ): Promise<PatientContact> {
    
    const updateData: any = {
      updated_at: new Date()
    };

    if (phoneNumber) updateData.phone_number = phoneNumber;
    if (email) updateData.email = email;
    if (preferredMethod) updateData.preferred_method = preferredMethod;

    const { data: existingContact } = await this.supabase
      .from('patient_contacts')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (existingContact) {
      const { data, error } = await this.supabase
        .from('patient_contacts')
        .update(updateData)
        .eq('patient_id', patientId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update contact: ${error.message}`);
      }

      return data;
    } else {
      // Create new contact record
      const { data, error } = await this.supabase
        .from('patient_contacts')
        .insert({
          patient_id: patientId,
          phone_number: phoneNumber || '',
          email: email || '',
          preferred_method: preferredMethod || 'sms',
          sms_consent: false, // Must be explicitly consented
          email_consent: false, // Must be explicitly consented
          consent_date: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create contact: ${error.message}`);
      }

      return data;
    }
  }

  /**
   * Get patient contact information
   */
  async getPatientContact(patientId: string): Promise<PatientContact | null> {
    const { data: contact } = await this.supabase
      .from('patient_contacts')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    return contact;
  }

  /**
   * Bulk consent check for multiple patients
   */
  async checkBulkConsent(
    patientIds: string[], 
    consentType: 'sms' | 'email'
  ): Promise<Record<string, boolean>> {
    
    const { data: consents } = await this.supabase
      .from('patient_communication_consent')
      .select('patient_id, consent_type, consented, created_at')
      .in('patient_id', patientIds)
      .in('consent_type', [consentType, 'both']);

    // Get latest consent for each patient
    const consentMap: Record<string, boolean> = {};
    
    patientIds.forEach(patientId => {
      const patientConsents = consents
        ?.filter((c: any) => c.patient_id === patientId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      consentMap[patientId] = patientConsents?.[0]?.consented === true;
    });

    return consentMap;
  }

  /**
   * Generate consent audit report
   */
  async generateConsentAuditReport(
    startDate?: Date, 
    endDate?: Date
  ): Promise<{
    total_consent_records: number;
    consents_granted: number;
    consents_revoked: number;
    by_type: Record<string, number>;
    by_method: Record<string, number>;
  }> {
    
    let query = this.supabase
      .from('patient_communication_consent')
      .select('*');

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: records } = await query;

    if (!records) {
      return {
        total_consent_records: 0,
        consents_granted: 0,
        consents_revoked: 0,
        by_type: {},
        by_method: {}
      };
    }

    const byType: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    let consentsGranted = 0;
    let consentsRevoked = 0;

    records.forEach((record: any) => {
      // Count by type
      byType[record.consent_type] = (byType[record.consent_type] || 0) + 1;
      
      // Count by method
      byMethod[record.consent_method] = (byMethod[record.consent_method] || 0) + 1;
      
      // Count granted vs revoked
      if (record.consented) {
        consentsGranted++;
      } else {
        consentsRevoked++;
      }
    });

    return {
      total_consent_records: records.length,
      consents_granted: consentsGranted,
      consents_revoked: consentsRevoked,
      by_type: byType,
      by_method: byMethod
    };
  }
}