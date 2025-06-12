// Handouts App Communication Service
// Client-side wrapper for Patient Communication Hub

interface HandoutDeliveryMessage {
  patient_id: string;
  handout_title: string;
  handout_url: string;
  provider_name: string;
  clinic_name: string;
}

export class HandoutsCommunicationService {
  constructor() {
    // Client-side service, no server dependencies
  }

  /**
   * Send handout delivery notification via SMS
   */
  async sendHandoutDelivery(
    patientId: string,
    handoutTitle: string,
    handoutUrl: string,
    providerName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const message: HandoutDeliveryMessage = {
        patient_id: patientId,
        handout_title: handoutTitle,
        handout_url: handoutUrl,
        provider_name: providerName,
        clinic_name: 'Ganger Dermatology'
      };

      const response = await fetch('/api/handouts/communication/send-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error('Communication service request failed');
      }

      const result = await response.json();
      
      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record patient consent for SMS communications
   */
  async recordPatientConsent(
    patientId: string,
    consentType: 'sms' | 'email' | 'both',
    consented: boolean,
    staffId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/handouts/communication/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          consentType,
          consented,
          method: 'digital',
          staffId,
          ipAddress,
          userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record consent');
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/handouts/communication/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          phoneNumber,
          email,
          preferredMethod
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update contact');
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if patient has consented to SMS communications
   */
  async hasPatientConsent(patientId: string, type: 'sms' | 'email'): Promise<boolean> {
    try {
      const response = await fetch(`/api/handouts/communication/consent/${patientId}?type=${type}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.hasConsent || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get patient communication history (for support/audit)
   */
  async getPatientCommunicationHistory(patientId: string, limit?: number) {
    try {
      const url = `/api/handouts/communication/history/${patientId}${limit ? `?limit=${limit}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  /**
   * Test communication service health
   */
  async healthCheck(): Promise<{
    sms_service: boolean;
    database: boolean;
    overall: boolean;
  }> {
    try {
      const response = await fetch('/api/handouts/communication/health');
      if (!response.ok) {
        return { sms_service: false, database: false, overall: false };
      }
      
      return await response.json();
    } catch (error) {
      return {
        sms_service: false,
        database: false,
        overall: false
      };
    }
  }
}

// Export singleton instance for use across handouts app
export const handoutsCommunication = new HandoutsCommunicationService();