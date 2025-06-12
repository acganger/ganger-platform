// Universal Payment Processing Hub
// Central entry point for all payment operations across the Ganger Platform

import { MedicalPaymentService } from './stripe-service';
import { SubscriptionManager } from './subscription-manager';
import { 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult,
  CopayPaymentMessage,
  SubscriptionPaymentMessage,
  DepositPaymentMessage,
  FeePaymentMessage,
  BillingAnalytics,
  PatientSubscription,
  PaymentMethod,
  SubscriptionPlan
} from './types';

export class UniversalPaymentHub {
  private paymentService: MedicalPaymentService;
  private subscriptionManager: SubscriptionManager;

  constructor() {
    this.paymentService = new MedicalPaymentService({
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_default'
    });
    
    this.subscriptionManager = new SubscriptionManager({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_default'
    });
  }

  // ===== Check-in Kiosk Payment Methods =====

  /**
   * Process copay payment at check-in kiosk
   * Immediate business value for Check-in Kiosk PRD
   */
  async processCopayPayment(message: CopayPaymentMessage): Promise<PaymentResult> {
    const paymentRequest: PaymentRequest = {
      patient_id: message.patient_id,
      amount: message.amount,
      payment_type: 'copay',
      description: `Copay for appointment with ${message.provider_name} on ${message.appointment_date.toLocaleDateString()}`,
      appointment_id: message.appointment_id,
      payment_method_id: message.payment_method_id,
      metadata: {
        provider_name: message.provider_name,
        appointment_date: message.appointment_date.toISOString(),
        payment_source: 'kiosk'
      }
    };

    return this.paymentService.processPayment(paymentRequest);
  }

  /**
   * Process appointment deposit
   * For Scheduling PRD - secure appointment booking
   */
  async processAppointmentDeposit(message: DepositPaymentMessage): Promise<PaymentResult> {
    const paymentRequest: PaymentRequest = {
      patient_id: message.patient_id,
      amount: message.amount,
      payment_type: 'deposit',
      description: `Deposit for ${message.procedure_name} on ${message.appointment_date.toLocaleDateString()}`,
      appointment_id: message.appointment_id,
      metadata: {
        procedure_name: message.procedure_name,
        appointment_date: message.appointment_date.toISOString(),
        payment_source: 'scheduling'
      }
    };

    return this.paymentService.processPayment(paymentRequest);
  }

  // ===== Training Platform Subscription Methods =====

  /**
   * Create training subscription
   * For Training PRD - subscription billing
   */
  async createTrainingSubscription(message: SubscriptionPaymentMessage): Promise<PatientSubscription | null> {
    return this.subscriptionManager.createSubscription(message);
  }

  /**
   * Get available training plans
   * For Training PRD - plan selection
   */
  async getTrainingPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionManager.getAvailablePlans();
  }

  /**
   * Cancel training subscription
   * For Training PRD - subscription management
   */
  async cancelTrainingSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
    return this.subscriptionManager.cancelSubscription(subscriptionId, reason);
  }

  // ===== Provider Dashboard Analytics =====

  /**
   * Get billing analytics for provider dashboard
   * For Provider Dashboard PRD - revenue tracking
   */
  async getBillingAnalytics(startDate?: Date, endDate?: Date): Promise<BillingAnalytics> {
    // TODO: Implement actual analytics query
    // For now, return mock data
    return {
      total_revenue: 125000, // $1,250.00
      pending_payments: 5500, // $55.00
      failed_payments: 2300, // $23.00
      refunds_issued: 1200, // $12.00
      payment_method_breakdown: {
        card: 112300, // $1,123.00
        bank_account: 12700 // $127.00
      },
      payment_type_breakdown: {
        copay: 85000, // $850.00
        deductible: 25000, // $250.00
        subscription: 10000, // $100.00
        deposit: 3000, // $30.00
        fee: 2000 // $20.00
      },
      period_start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      period_end: endDate || new Date()
    };
  }

  // ===== Universal Payment Methods =====

  /**
   * Process any type of medical fee
   * For Call Center PRD - payment collection
   */
  async processFeePayment(message: FeePaymentMessage): Promise<PaymentResult> {
    const paymentRequest: PaymentRequest = {
      patient_id: message.patient_id,
      amount: message.amount,
      payment_type: 'fee',
      description: message.description,
      metadata: {
        fee_type: message.fee_type,
        staff_id: message.staff_id || '',
        payment_source: 'call_center'
      }
    };

    return this.paymentService.processPayment(paymentRequest);
  }

  /**
   * Process payment refund
   * Universal refund processing across all PRDs
   */
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    return this.paymentService.processRefund(request);
  }

  /**
   * Save payment method for future use
   * Universal payment method storage
   */
  async savePaymentMethod(patientId: string, paymentMethodData: any): Promise<PaymentMethod | null> {
    return this.paymentService.savePaymentMethod(patientId, paymentMethodData);
  }

  /**
   * Get patient's saved payment methods
   * Universal payment method retrieval
   */
  async getPaymentMethods(patientId: string): Promise<PaymentMethod[]> {
    return this.paymentService.getPaymentMethods(patientId);
  }

  /**
   * Get patient's subscriptions
   * Universal subscription retrieval
   */
  async getPatientSubscriptions(patientId: string): Promise<PatientSubscription[]> {
    return this.subscriptionManager.getPatientSubscriptions(patientId);
  }

  /**
   * Calculate processing fee
   * Universal fee calculation for transparency
   */
  calculateProcessingFee(amount: number): number {
    return this.paymentService.calculateProcessingFee(amount);
  }

  /**
   * Handle Stripe webhooks
   * Universal webhook processing for all payment events
   */
  async handleWebhook(event: any): Promise<void> {
    // Route to appropriate handler based on event type
    if (event.type.startsWith('customer.subscription')) {
      await this.subscriptionManager.handleSubscriptionWebhook(event);
    } else {
      // Handle other payment-related webhooks
      console.log(`Received webhook event: ${event.type}`);
    }
  }

  /**
   * Health check for payment system
   * Monitor payment infrastructure health
   */
  async healthCheck(): Promise<{ 
    payment_service: boolean; 
    subscription_service: boolean; 
    overall_health: boolean 
  }> {
    try {
      const paymentHealth = await this.paymentService.healthCheck();
      
      return {
        payment_service: paymentHealth.overall_health,
        subscription_service: true, // TODO: Implement subscription health check
        overall_health: paymentHealth.overall_health
      };
    } catch (error) {
      return {
        payment_service: false,
        subscription_service: false,
        overall_health: false
      };
    }
  }

  // ===== Cross-PRD Integration Methods =====

  /**
   * Process payment with automated receipt email
   * Integration with communication hub for receipts
   */
  async processPaymentWithReceipt(request: PaymentRequest, sendReceipt: boolean = true): Promise<PaymentResult> {
    const result = await this.paymentService.processPayment(request);
    
    if (result.success && sendReceipt) {
      // TODO: Integrate with communication hub to send receipt
      console.log(`Receipt would be sent for payment ${result.payment_id}`);
    }
    
    return result;
  }

  /**
   * Get revenue data for EOS platform
   * Financial management integration
   */
  async getRevenueData(periodStart: Date, periodEnd: Date): Promise<{
    total_revenue: number;
    revenue_by_type: Record<string, number>;
    revenue_by_provider: Record<string, number>;
  }> {
    // TODO: Implement actual revenue queries
    return {
      total_revenue: 125000,
      revenue_by_type: {
        copay: 85000,
        deductible: 25000,
        subscription: 10000,
        deposit: 3000,
        fee: 2000
      },
      revenue_by_provider: {
        'Dr. Ganger': 100000,
        'Dr. Smith': 25000
      }
    };
  }
}

// Export singleton instance
export const universalPaymentHub = new UniversalPaymentHub();