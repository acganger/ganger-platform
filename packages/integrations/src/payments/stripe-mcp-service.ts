// Stripe MCP Integration Service
// Real Stripe API integration using Stripe Agent Toolkit MCP server

import Stripe from 'stripe';
import { 
  PaymentRequest, 
  PaymentResult, 
  RefundRequest, 
  RefundResult,
  PaymentMethod,
  PaymentAuditLog
} from './types';

export interface StripeMCPConfig {
  apiKey: string;
  publishableKey: string;
  webhookSecret?: string;
  account?: string; // For Stripe Connect
  mode?: 'live' | 'test';
}

export class StripeMCPService {
  private stripe: Stripe;
  private config: StripeMCPConfig;

  constructor(config: StripeMCPConfig) {
    this.config = config;
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: '2025-02-24.acacia',
      telemetry: false
    });
  }

  /**
   * Create a payment intent using Stripe API
   * This replaces the mock payment processing
   */
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Validate request
      this.validatePaymentRequest(request);

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount, // Amount in cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          patient_id: request.patient_id,
          payment_type: request.payment_type,
          description: request.description || '',
          facility: 'Ganger Dermatology',
          environment: this.config.mode || 'test'
        },
        description: `${request.payment_type}: ${request.description}`,
        statement_descriptor_suffix: 'GANGER DERM',
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);

      return {
        success: true,
        payment_id: paymentIntent.id,
        stripe_payment_intent_id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount,
        client_secret: paymentIntent.client_secret || undefined
      };

    } catch (error) {
      console.error('Stripe Payment Intent Creation Error:', error);
      
      const stripeError = error as Stripe.StripeRawError;
      return {
        success: false,
        status: 'failed',
        error: {
          code: stripeError.code || 'payment_processing_error',
          message: stripeError.message || 'Unknown payment error',
          type: this.mapStripeErrorType(stripeError.type) || 'api_error'
        }
      };
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: `${process.env.NEXT_PUBLIC_STAFF_URL}/payments/return`
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);

      return {
        success: paymentIntent.status === 'succeeded',
        payment_id: paymentIntent.id,
        stripe_payment_intent_id: paymentIntent.id,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount
      };

    } catch (error) {
      console.error('Stripe Payment Confirmation Error:', error);
      
      const stripeError = error as Stripe.StripeRawError;
      return {
        success: false,
        status: 'failed',
        error: {
          code: stripeError.code || 'payment_confirmation_error',
          message: stripeError.message || 'Payment confirmation failed',
          type: this.mapStripeErrorType(stripeError.type) || 'api_error'
        }
      };
    }
  }

  /**
   * Create a refund using Stripe API
   */
  async createRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      // Get the original payment intent to validate
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        request.payment_id,
        this.config.account ? { stripeAccount: this.config.account } : undefined
      );

      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'payment_not_refundable',
            message: 'Payment must be succeeded to create refund'
          }
        };
      }

      // Create the refund
      const refund = await this.stripe.refunds.create({
        payment_intent: request.payment_id,
        amount: request.amount || paymentIntent.amount, // Full refund if no amount specified
        reason: request.reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
        metadata: {
          refund_reason: request.reason || 'requested_by_customer',
          refunded_by: 'staff_portal',
          facility: 'Ganger Dermatology'
        }
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);

      return {
        success: true,
        refund_id: refund.id,
        stripe_refund_id: refund.id,
        amount: refund.amount,
        status: refund.status as 'pending' | 'succeeded' | 'failed'
      };

    } catch (error) {
      console.error('Stripe Refund Creation Error:', error);
      
      const stripeError = error as Stripe.StripeRawError;
      return {
        success: false,
        status: 'failed',
        error: {
          code: stripeError.code || 'refund_processing_error',
          message: stripeError.message || 'Unknown refund error'
        }
      };
    }
  }

  /**
   * Create a payment method for future use
   */
  async createPaymentMethod(patientId: string, paymentMethodData: {
    type: 'card';
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
  }): Promise<PaymentMethod | null> {
    try {
      // Create Stripe payment method
      const stripePaymentMethod = await this.stripe.paymentMethods.create({
        type: paymentMethodData.type,
        card: paymentMethodData.card,
        metadata: {
          patient_id: patientId,
          facility: 'Ganger Dermatology'
        }
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);

      // Create customer if needed and attach payment method
      let customer: Stripe.Customer;
      // Search for existing customer by patient_id in metadata
      const allCustomers = await this.stripe.customers.list({
        limit: 100
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);
      
      const existingCustomer = allCustomers.data.find(c => c.metadata?.patient_id === patientId);

      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        customer = await this.stripe.customers.create({
          metadata: {
            patient_id: patientId,
            facility: 'Ganger Dermatology'
          }
        }, this.config.account ? { stripeAccount: this.config.account } : undefined);
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(stripePaymentMethod.id, {
        customer: customer.id
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);

      return {
        id: stripePaymentMethod.id,
        patient_id: patientId,
        stripe_payment_method_id: stripePaymentMethod.id,
        type: (stripePaymentMethod.type === 'card' || stripePaymentMethod.type === 'us_bank_account') ? 
              (stripePaymentMethod.type === 'us_bank_account' ? 'bank_account' : 'card') : 'card',
        last_four: stripePaymentMethod.card?.last4 || '',
        brand: stripePaymentMethod.card?.brand || '',
        exp_month: stripePaymentMethod.card?.exp_month || 0,
        exp_year: stripePaymentMethod.card?.exp_year || 0,
        is_default: true,
        created_at: new Date()
      };

    } catch (error) {
      console.error('Stripe Payment Method Creation Error:', error);
      return null;
    }
  }

  /**
   * Get payment methods for a patient
   */
  async getPaymentMethods(patientId: string): Promise<PaymentMethod[]> {
    try {
      // Find customer by patient_id
      const allCustomers = await this.stripe.customers.list({
        limit: 100
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);

      const customer = allCustomers.data.find(c => c.metadata?.patient_id === patientId);

      if (!customer) {
        return [];
      }
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card'
      }, this.config.account ? { stripeAccount: this.config.account } : undefined);

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        patient_id: patientId,
        stripe_payment_method_id: pm.id,
        type: (pm.type === 'card' || pm.type === 'us_bank_account') ? 
              (pm.type === 'us_bank_account' ? 'bank_account' : 'card') : 'card',
        last_four: pm.card?.last4 || '',
        brand: pm.card?.brand || '',
        exp_month: pm.card?.exp_month || 0,
        exp_year: pm.card?.exp_year || 0,
        is_default: false, // Would need additional logic to determine default
        created_at: new Date(pm.created * 1000)
      }));

    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      return await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
        this.config.account ? { stripeAccount: this.config.account } : undefined
      );
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return null;
    }
  }

  /**
   * List recent payments
   */
  async listPayments(patientId?: string, limit: number = 10): Promise<Stripe.PaymentIntent[]> {
    try {
      const params: Stripe.PaymentIntentListParams = { limit };
      
      if (patientId) {
        // Search by metadata - note: this is a simple approach
        // For production, consider using a more efficient indexing system
        const allPayments = await this.stripe.paymentIntents.list(
          { limit: 100 }, // Get more to filter
          this.config.account ? { stripeAccount: this.config.account } : undefined
        );
        
        return allPayments.data.filter(pi => 
          pi.metadata?.patient_id === patientId
        ).slice(0, limit);
      }

      const payments = await this.stripe.paymentIntents.list(
        params,
        this.config.account ? { stripeAccount: this.config.account } : undefined
      );
      
      return payments.data;
    } catch (error) {
      console.error('Error listing payments:', error);
      return [];
    }
  }

  /**
   * Health check for Stripe connection
   */
  async healthCheck(): Promise<{
    stripe_connection: boolean;
    account_valid: boolean;
    overall_health: boolean;
  }> {
    try {
      // Try to retrieve account balance as a health check
      await this.stripe.balance.retrieve(
        this.config.account ? { stripeAccount: this.config.account } : undefined
      );
      
      return {
        stripe_connection: true,
        account_valid: true,
        overall_health: true
      };
    } catch (error) {
      console.error('Stripe health check failed:', error);
      return {
        stripe_connection: false,
        account_valid: false,
        overall_health: false
      };
    }
  }

  /**
   * Webhook signature verification
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event | null {
    if (!this.config.webhookSecret) {
      console.error('Webhook secret not configured');
      return null;
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return null;
    }
  }

  /**
   * Map Stripe payment intent status to our internal status
   */
  private mapStripeStatus(stripeStatus: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    switch (stripeStatus) {
      case 'succeeded':
        return 'completed';
      case 'processing':
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'requires_capture':
        return 'pending';
      case 'canceled':
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  /**
   * Map Stripe error types to our internal error types
   */
  private mapStripeErrorType(stripeErrorType?: string): 'card_error' | 'api_error' | 'validation_error' {
    switch (stripeErrorType) {
      case 'card_error':
        return 'card_error';
      case 'invalid_request_error':
        return 'validation_error';
      case 'api_error':
      case 'authentication_error':
      case 'rate_limit_error':
      default:
        return 'api_error';
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.patient_id) {
      throw new Error('Patient ID is required');
    }
    if (!request.amount || request.amount <= 0) {
      throw new Error('Valid payment amount is required');
    }
    if (request.amount < 50) { // Stripe minimum
      throw new Error('Payment amount must be at least $0.50');
    }
    if (!request.payment_type) {
      throw new Error('Payment type is required');
    }
    if (!request.description) {
      throw new Error('Payment description is required');
    }
  }
}

// Environment-based configuration
export const createStripeMCPService = (): StripeMCPService => {
  const config: StripeMCPConfig = {
    apiKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    mode: (process.env.NODE_ENV === 'production' ? 'live' : 'test') as 'live' | 'test'
  };

  if (!config.apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  return new StripeMCPService(config);
};

// Export singleton instance
export const stripeMCPService = createStripeMCPService();