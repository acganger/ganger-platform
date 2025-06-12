// Check-in Kiosk Payment Service
// Integration wrapper for Universal Payment Processing Hub

import { 
  universalPaymentHub, 
  CopayPaymentMessage, 
  PaymentResult,
  PaymentMethod 
} from '@ganger/integrations';

export class KioskPaymentService {
  /**
   * Process copay payment at kiosk
   * Immediate business value from Universal Payment Hub
   */
  async processCopayPayment(
    patientId: string,
    appointmentId: string,
    amount: number,
    providerName: string,
    appointmentDate: Date,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    const copayMessage: CopayPaymentMessage = {
      patient_id: patientId,
      appointment_id: appointmentId,
      amount: amount * 100, // Convert dollars to cents
      provider_name: providerName,
      appointment_date: appointmentDate,
      payment_method_id: paymentMethodId
    };

    return universalPaymentHub.processCopayPayment(copayMessage);
  }

  /**
   * Get patient's saved payment methods
   */
  async getPatientPaymentMethods(patientId: string): Promise<PaymentMethod[]> {
    return universalPaymentHub.getPaymentMethods(patientId);
  }

  /**
   * Save new payment method
   */
  async savePaymentMethod(patientId: string, paymentMethodData: Record<string, unknown>): Promise<PaymentMethod | null> {
    return universalPaymentHub.savePaymentMethod(patientId, paymentMethodData);
  }

  /**
   * Calculate processing fee for transparency
   */
  calculateProcessingFee(amount: number): number {
    return universalPaymentHub.calculateProcessingFee(amount * 100) / 100; // Convert back to dollars
  }

  /**
   * Health check for payment system
   */
  async healthCheck(): Promise<boolean> {
    const health = await universalPaymentHub.healthCheck();
    return health.overall_health;
  }
}

// Export singleton instance
export const kioskPaymentService = new KioskPaymentService();