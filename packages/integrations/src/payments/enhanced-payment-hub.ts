// Enhanced Payment Hub with Supabase MCP Integration
// Real-time payment monitoring and automated financial operations

import { UniversalPaymentHub } from './payment-hub';
import { EnhancedDatabaseClient } from '../database/enhanced-database-client';
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
  PaymentMethod
} from './types';

export interface PaymentAnalytics {
  total_revenue: number;
  total_transactions: number;
  success_rate: number;
  average_transaction_amount: number;
  average_processing_time_ms: number;
  revenue_by_type: Record<string, number>;
  revenue_by_method: Record<string, number>;
  transaction_volume_trend: Array<{ date: string; count: number; amount: number }>;
  top_failure_reasons: Array<{ reason: string; count: number; amount_lost: number }>;
  refund_analytics: {
    total_refunds: number;
    total_refund_amount: number;
    refund_rate: number;
    top_refund_reasons: Array<{ reason: string; count: number }>;
  };
  subscription_analytics: {
    active_subscriptions: number;
    monthly_recurring_revenue: number;
    churn_rate: number;
    new_subscriptions: number;
  };
}

export interface RealTimePaymentEvent {
  event_id: string;
  event_type: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'refund_processed' | 'subscription_updated';
  timestamp: string;
  patient_id?: string;
  payment_id?: string;
  amount?: number;
  payment_type?: string;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface FraudDetectionResult {
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  recommended_action: 'approve' | 'review' | 'decline';
  details: {
    velocity_check: boolean;
    amount_check: boolean;
    pattern_check: boolean;
    blacklist_check: boolean;
  };
}

export class EnhancedPaymentHub extends UniversalPaymentHub {
  private dbClient: EnhancedDatabaseClient;
  private realtimeSubscriptions: string[] = [];
  private eventHandlers: Map<string, (event: RealTimePaymentEvent) => void> = new Map();
  private fraudDetectionEnabled: boolean = true;

  constructor(mcpEnabled: boolean = true) {
    super();
    
    // Initialize enhanced database client with MCP
    this.dbClient = new EnhancedDatabaseClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      projectRef: 'pfqtzmxxxhhsxmlddrta',
      enableMCP: mcpEnabled,
      mcpAccessToken: process.env.SUPABASE_ACCESS_TOKEN
    }, {
      enabled: true,
      notifyOnFailure: true,
      maxRetries: 3
    });

    if (mcpEnabled) {
      this.initializeRealtimeMonitoring();
    }
  }

  // ===========================================
  // REAL-TIME MONITORING SETUP
  // ===========================================

  /**
   * Initialize real-time payment monitoring with Supabase MCP
   */
  private async initializeRealtimeMonitoring(): Promise<void> {
    try {
      const mcpService = this.dbClient.getMCPService();
      if (!mcpService) {
        console.warn('MCP service not available for payment monitoring');
        return;
      }

      // Monitor payment transactions
      const paymentSub = mcpService.subscribeToTable('payment_transactions', '*', (payload) => {
        this.handlePaymentTransactionEvent(payload);
      });
      
      // Monitor refunds
      const refundSub = mcpService.subscribeToTable('payment_refunds', '*', (payload) => {
        this.handleRefundEvent(payload);
      });
      
      // Monitor subscriptions
      const subscriptionSub = mcpService.subscribeToTable('patient_subscriptions', '*', (payload) => {
        this.handleSubscriptionEvent(payload);
      });

      // Monitor fraud detection alerts
      const fraudSub = mcpService.subscribeToTable('fraud_detection_logs', '*', (payload) => {
        this.handleFraudDetectionEvent(payload);
      });

      this.realtimeSubscriptions.push(paymentSub, refundSub, subscriptionSub, fraudSub);
      
      console.log('✅ Enhanced Payment Hub real-time monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize payment monitoring:', error);
    }
  }

  // ===========================================
  // ENHANCED PAYMENT PROCESSING
  // ===========================================

  /**
   * Process copay with fraud detection and enhanced tracking
   */
  async processCopayPaymentEnhanced(message: CopayPaymentMessage): Promise<PaymentResult & {
    fraud_check?: FraudDetectionResult;
    processing_metrics?: {
      total_time_ms: number;
      fraud_check_time_ms: number;
      payment_processing_time_ms: number;
    };
  }> {
    const startTime = Date.now();
    let fraudCheckTime = 0;
    
    try {
      // Fraud detection check
      let fraudResult: FraudDetectionResult | undefined;
      if (this.fraudDetectionEnabled) {
        const fraudStartTime = Date.now();
        fraudResult = await this.performFraudDetection({
          patient_id: message.patient_id,
          amount: message.amount,
          payment_type: 'copay',
          payment_method_id: message.payment_method_id
        });
        fraudCheckTime = Date.now() - fraudStartTime;

        // Block high-risk transactions
        if (fraudResult.recommended_action === 'decline') {
          const fraudBlocked: PaymentResult = {
            success: false,
            error: {
              code: 'fraud_detected',
              message: 'Transaction blocked by fraud detection',
              type: 'validation_error'
            },
            status: 'declined',
            timestamp: new Date()
          };

          await this.logPaymentAttempt(message, fraudBlocked, fraudResult);
          
          return {
            ...fraudBlocked,
            fraud_check: fraudResult,
            processing_metrics: {
              total_time_ms: Date.now() - startTime,
              fraud_check_time_ms: fraudCheckTime,
              payment_processing_time_ms: 0
            }
          };
        }
      }

      // Log payment initiation
      const { data: paymentLog } = await this.dbClient.executeQuery(
        'payment_transactions',
        'insert',
        (query) => query.insert({
          patient_id: message.patient_id,
          amount: message.amount,
          payment_type: 'copay',
          status: 'processing',
          initiated_at: new Date().toISOString(),
          metadata: {
            appointment_id: message.appointment_id,
            provider_name: message.provider_name,
            appointment_date: message.appointment_date.toISOString(),
            fraud_score: fraudResult?.risk_score,
            fraud_flags: fraudResult?.flags
          }
        }).select().single(),
        { trackOperation: true }
      );

      const paymentLogId = paymentLog?.id;

      // Process payment with original method
      const paymentProcessingStart = Date.now();
      const paymentResult = await super.processCopayPayment(message);
      const paymentProcessingTime = Date.now() - paymentProcessingStart;

      // Update payment log with result
      await this.dbClient.executeQuery(
        'payment_transactions',
        'update',
        (query) => query
          .update({
            status: paymentResult.success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
            external_id: paymentResult.payment_id || null,
            error_message: typeof paymentResult.error === 'string' ? paymentResult.error : JSON.stringify(paymentResult.error) || null,
            stripe_fee: paymentResult.processing_fee || null
          })
          .eq('id', paymentLogId),
        { trackOperation: true }
      );

      // Emit real-time event
      this.emitEvent({
        event_id: `copay_${Date.now()}`,
        event_type: paymentResult.success ? 'payment_completed' : 'payment_failed',
        timestamp: new Date().toISOString(),
        patient_id: message.patient_id,
        payment_id: paymentResult.payment_id,
        amount: message.amount,
        payment_type: 'copay',
        success: paymentResult.success,
        error: paymentResult.error ? (typeof paymentResult.error === 'string' ? paymentResult.error : paymentResult.error.message) : undefined,
        metadata: {
          appointment_id: message.appointment_id,
          provider_name: message.provider_name,
          processing_time_ms: Date.now() - startTime
        }
      });

      return {
        ...paymentResult,
        fraud_check: fraudResult,
        processing_metrics: {
          total_time_ms: Date.now() - startTime,
          fraud_check_time_ms: fraudCheckTime,
          payment_processing_time_ms: paymentProcessingTime
        }
      };
    } catch (error) {
      console.error('Enhanced copay payment failed:', error);
      
      // Emit failure event
      this.emitEvent({
        event_id: `copay_error_${Date.now()}`,
        event_type: 'payment_failed',
        timestamp: new Date().toISOString(),
        patient_id: message.patient_id,
        amount: message.amount,
        payment_type: 'copay',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: {
          code: 'processing_failed',
          message: error instanceof Error ? error.message : 'Enhanced payment processing failed',
          type: 'api_error'
        },
        status: 'failed',
        timestamp: new Date(),
        processing_metrics: {
          total_time_ms: Date.now() - startTime,
          fraud_check_time_ms: fraudCheckTime,
          payment_processing_time_ms: 0
        }
      };
    }
  }

  /**
   * Process refund with enhanced tracking
   */
  async processRefundEnhanced(request: RefundRequest & {
    reason_code?: string;
    staff_id?: string;
    admin_notes?: string;
  }): Promise<RefundResult & {
    processing_metrics?: {
      total_time_ms: number;
      validation_time_ms: number;
      refund_processing_time_ms: number;
    };
  }> {
    const startTime = Date.now();
    
    try {
      // Validate refund eligibility
      const validationStart = Date.now();
      const isEligible = await this.validateRefundEligibility(request);
      const validationTime = Date.now() - validationStart;

      if (!isEligible) {
        return {
          success: false,
          status: 'failed',
          error: {
            code: 'refund_not_eligible',
            message: 'Refund not eligible - payment not found or already refunded'
          },
          timestamp: new Date(),
          processing_metrics: {
            total_time_ms: Date.now() - startTime,
            validation_time_ms: validationTime,
            refund_processing_time_ms: 0
          }
        };
      }

      // Log refund initiation
      const { data: refundLog } = await this.dbClient.executeQuery(
        'payment_refunds',
        'insert',
        (query) => query.insert({
          original_payment_id: request.payment_id,
          amount: request.amount,
          reason: request.reason,
          reason_code: (request as any).reason_code,
          staff_id: request.staff_id,
          admin_notes: (request as any).admin_notes,
          status: 'processing',
          initiated_at: new Date().toISOString()
        }).select().single(),
        { trackOperation: true }
      );

      const refundLogId = refundLog?.id;

      // Process refund with original method
      const refundProcessingStart = Date.now();
      const refundResult = await super.processRefund(request);
      const refundProcessingTime = Date.now() - refundProcessingStart;

      // Update refund log
      await this.dbClient.executeQuery(
        'payment_refunds',
        'update',
        (query) => query
          .update({
            status: refundResult.success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime,
            external_refund_id: refundResult.refund_id || null,
            error_message: typeof refundResult.error === 'string' ? refundResult.error : JSON.stringify(refundResult.error) || null
          })
          .eq('id', refundLogId),
        { trackOperation: true }
      );

      // Emit real-time event
      this.emitEvent({
        event_id: `refund_${Date.now()}`,
        event_type: 'refund_processed',
        timestamp: new Date().toISOString(),
        payment_id: request.payment_id,
        amount: request.amount,
        success: refundResult.success,
        error: refundResult.error ? (typeof refundResult.error === 'string' ? refundResult.error : refundResult.error.message) : undefined,
        metadata: {
          reason: request.reason,
          staff_id: request.staff_id,
          processing_time_ms: Date.now() - startTime
        }
      });

      return {
        ...refundResult,
        processing_metrics: {
          total_time_ms: Date.now() - startTime,
          validation_time_ms: validationTime,
          refund_processing_time_ms: refundProcessingTime
        }
      };
    } catch (error) {
      console.error('Enhanced refund processing failed:', error);
      return {
        success: false,
        status: 'failed',
        error: {
          code: 'refund_processing_failed',
          message: error instanceof Error ? error.message : 'Enhanced refund processing failed'
        },
        timestamp: new Date(),
        processing_metrics: {
          total_time_ms: Date.now() - startTime,
          validation_time_ms: 0,
          refund_processing_time_ms: 0
        }
      };
    }
  }

  // ===========================================
  // FRAUD DETECTION SYSTEM
  // ===========================================

  /**
   * Perform fraud detection analysis
   */
  private async performFraudDetection(paymentData: {
    patient_id: string;
    amount: number;
    payment_type: string;
    payment_method_id?: string;
  }): Promise<FraudDetectionResult> {
    try {
      let riskScore = 0;
      const flags: string[] = [];
      
      // Velocity check - multiple payments in short time
      const { data: recentPayments } = await this.dbClient.executeQuery(
        'payment_transactions',
        'select',
        (query) => query
          .select('*')
          .eq('patient_id', paymentData.patient_id)
          .gte('initiated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()), // Last hour
        { trackOperation: false }
      );

      const velocityCheck = (recentPayments?.length || 0) > 3;
      if (velocityCheck) {
        riskScore += 30;
        flags.push('High transaction velocity');
      }

      // Amount check - unusually high amount
      const { data: avgPayments } = await this.dbClient.executeQuery(
        'payment_transactions',
        'select',
        (query) => query
          .select('amount')
          .eq('patient_id', paymentData.patient_id)
          .eq('status', 'completed')
          .limit(10),
        { trackOperation: false }
      );

      const avgAmount = avgPayments?.length 
        ? avgPayments.reduce((sum: number, p: any) => sum + p.amount, 0) / avgPayments.length 
        : 0;

      const amountCheck = avgAmount > 0 && paymentData.amount > avgAmount * 3;
      if (amountCheck) {
        riskScore += 25;
        flags.push('Unusually high amount');
      }

      // Pattern check - same amount multiple times
      const sameAmountCount = recentPayments?.filter((p: any) => p.amount === paymentData.amount).length || 0;
      const patternCheck = sameAmountCount > 2;
      if (patternCheck) {
        riskScore += 20;
        flags.push('Repetitive amount pattern');
      }

      // Blacklist check (simplified)
      const blacklistCheck = false; // Would check against actual blacklist

      // Determine risk level and action
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      let recommendedAction: 'approve' | 'review' | 'decline';

      if (riskScore >= 70) {
        riskLevel = 'critical';
        recommendedAction = 'decline';
      } else if (riskScore >= 50) {
        riskLevel = 'high';
        recommendedAction = 'review';
      } else if (riskScore >= 25) {
        riskLevel = 'medium';
        recommendedAction = 'review';
      } else {
        riskLevel = 'low';
        recommendedAction = 'approve';
      }

      // Log fraud detection result
      await this.dbClient.executeQuery(
        'fraud_detection_logs',
        'insert',
        (query) => query.insert({
          patient_id: paymentData.patient_id,
          payment_amount: paymentData.amount,
          payment_type: paymentData.payment_type,
          risk_score: riskScore,
          risk_level: riskLevel,
          flags: flags,
          recommended_action: recommendedAction,
          velocity_check: velocityCheck,
          amount_check: amountCheck,
          pattern_check: patternCheck,
          blacklist_check: blacklistCheck,
          checked_at: new Date().toISOString()
        }),
        { trackOperation: false }
      );

      return {
        risk_score: riskScore,
        risk_level: riskLevel,
        flags,
        recommended_action: recommendedAction,
        details: {
          velocity_check: velocityCheck,
          amount_check: amountCheck,
          pattern_check: patternCheck,
          blacklist_check: blacklistCheck
        }
      };
    } catch (error) {
      console.error('Fraud detection failed:', error);
      
      // Return safe default
      return {
        risk_score: 0,
        risk_level: 'low',
        flags: [],
        recommended_action: 'approve',
        details: {
          velocity_check: false,
          amount_check: false,
          pattern_check: false,
          blacklist_check: false
        }
      };
    }
  }

  // ===========================================
  // PAYMENT ANALYTICS WITH MCP
  // ===========================================

  /**
   * Get comprehensive payment analytics
   */
  async getPaymentAnalytics(
    timeRange: { start: Date; end: Date }
  ): Promise<PaymentAnalytics> {
    try {
      // Get payment transaction data
      const { data: transactions } = await this.dbClient.executeQuery(
        'payment_transactions',
        'select',
        (query) => query
          .select('*')
          .gte('initiated_at', timeRange.start.toISOString())
          .lte('initiated_at', timeRange.end.toISOString()),
        { trackOperation: true }
      );

      // Get refund data
      const { data: refunds } = await this.dbClient.executeQuery(
        'payment_refunds',
        'select',
        (query) => query
          .select('*')
          .gte('initiated_at', timeRange.start.toISOString())
          .lte('initiated_at', timeRange.end.toISOString()),
        { trackOperation: true }
      );

      // Get subscription data
      const { data: subscriptions } = await this.dbClient.executeQuery(
        'patient_subscriptions',
        'select',
        (query) => query
          .select('*')
          .eq('status', 'active'),
        { trackOperation: true }
      );

      // Calculate basic metrics
      const totalTransactions = transactions?.length || 0;
      const successfulTransactions = transactions?.filter((t: any) => t.status === 'completed') || [];
      const failedTransactions = transactions?.filter((t: any) => t.status === 'failed') || [];
      
      const totalRevenue = successfulTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      const successRate = totalTransactions > 0 ? (successfulTransactions.length / totalTransactions) * 100 : 0;
      const avgTransactionAmount = successfulTransactions.length > 0 ? totalRevenue / successfulTransactions.length : 0;
      
      // Calculate processing times
      const avgProcessingTime = successfulTransactions
        .filter((t: any) => t.processing_time_ms)
        .reduce((sum: number, t: any) => sum + t.processing_time_ms, 0) / (successfulTransactions.length || 1);

      // Revenue by type and method
      const revenueByType: Record<string, number> = {};
      const revenueByMethod: Record<string, number> = {};

      successfulTransactions.forEach((t: any) => {
        revenueByType[t.payment_type] = (revenueByType[t.payment_type] || 0) + t.amount;
        revenueByMethod[t.payment_method || 'unknown'] = (revenueByMethod[t.payment_method || 'unknown'] || 0) + t.amount;
      });

      // Failure analysis
      const failureReasons: Record<string, number> = {};
      const failureLoss: Record<string, number> = {};

      failedTransactions.forEach((t: any) => {
        const reason = t.error_message || 'Unknown';
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
        failureLoss[reason] = (failureLoss[reason] || 0) + t.amount;
      });

      const topFailureReasons = Object.entries(failureReasons)
        .map(([reason, count]) => ({ 
          reason, 
          count, 
          amount_lost: failureLoss[reason] || 0 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Refund analytics
      const totalRefunds = refunds?.length || 0;
      const totalRefundAmount = refunds?.filter((r: any) => r.status === 'completed')
        .reduce((sum: number, r: any) => sum + r.amount, 0) || 0;
      const refundRate = totalRevenue > 0 ? (totalRefundAmount / totalRevenue) * 100 : 0;

      const refundReasons: Record<string, number> = {};
      refunds?.forEach((r: any) => {
        const reason = r.reason_code || r.reason || 'Unknown';
        refundReasons[reason] = (refundReasons[reason] || 0) + 1;
      });

      const topRefundReasons = Object.entries(refundReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Subscription analytics
      const activeSubscriptions = subscriptions?.length || 0;
      const monthlyRecurringRevenue = subscriptions?.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0;

      return {
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        success_rate: successRate,
        average_transaction_amount: avgTransactionAmount,
        average_processing_time_ms: avgProcessingTime,
        revenue_by_type: revenueByType,
        revenue_by_method: revenueByMethod,
        transaction_volume_trend: [], // TODO: Implement trend analysis
        top_failure_reasons: topFailureReasons,
        refund_analytics: {
          total_refunds: totalRefunds,
          total_refund_amount: totalRefundAmount,
          refund_rate: refundRate,
          top_refund_reasons: topRefundReasons
        },
        subscription_analytics: {
          active_subscriptions: activeSubscriptions,
          monthly_recurring_revenue: monthlyRecurringRevenue,
          churn_rate: 0, // TODO: Calculate churn rate
          new_subscriptions: 0 // TODO: Calculate new subscriptions in period
        }
      };
    } catch (error) {
      console.error('Failed to get payment analytics:', error);
      throw error;
    }
  }

  // ===========================================
  // REAL-TIME EVENT HANDLING
  // ===========================================

  /**
   * Handle payment transaction events
   */
  private handlePaymentTransactionEvent(payload: any): void {
    const event: RealTimePaymentEvent = {
      event_id: `payment_${payload.new?.id || Date.now()}`,
      event_type: payload.eventType === 'INSERT' ? 'payment_initiated' : 
                  payload.new?.status === 'completed' ? 'payment_completed' : 'payment_failed',
      timestamp: new Date().toISOString(),
      patient_id: payload.new?.patient_id,
      payment_id: payload.new?.external_id,
      amount: payload.new?.amount,
      payment_type: payload.new?.payment_type,
      success: payload.new?.status === 'completed',
      error: payload.new?.error_message,
      metadata: payload.new?.metadata
    };

    this.emitEvent(event);
  }

  /**
   * Handle refund events
   */
  private handleRefundEvent(payload: any): void {
    const event: RealTimePaymentEvent = {
      event_id: `refund_${payload.new?.id || Date.now()}`,
      event_type: 'refund_processed',
      timestamp: new Date().toISOString(),
      payment_id: payload.new?.original_payment_id,
      amount: payload.new?.amount,
      success: payload.new?.status === 'completed',
      error: payload.new?.error_message,
      metadata: {
        reason: payload.new?.reason,
        reason_code: payload.new?.reason_code,
        staff_id: payload.new?.staff_id
      }
    };

    this.emitEvent(event);
  }

  /**
   * Handle subscription events
   */
  private handleSubscriptionEvent(payload: any): void {
    const event: RealTimePaymentEvent = {
      event_id: `subscription_${payload.new?.id || Date.now()}`,
      event_type: 'subscription_updated',
      timestamp: new Date().toISOString(),
      patient_id: payload.new?.patient_id,
      success: true,
      metadata: {
        subscription_status: payload.new?.status,
        plan_id: payload.new?.plan_id,
        amount: payload.new?.amount
      }
    };

    this.emitEvent(event);
  }

  /**
   * Handle fraud detection events
   */
  private handleFraudDetectionEvent(payload: any): void {
    if (payload.new?.risk_level === 'high' || payload.new?.risk_level === 'critical') {
      console.warn(`🚨 FRAUD ALERT: High-risk transaction detected for patient ${payload.new?.patient_id}`);
      console.warn(`Risk Score: ${payload.new?.risk_score}, Flags: ${payload.new?.flags?.join(', ')}`);
    }
  }

  /**
   * Emit real-time event to registered handlers
   */
  private emitEvent(event: RealTimePaymentEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Payment event handler error:', error);
      }
    });
  }

  /**
   * Register event handler for real-time events
   */
  onPaymentEvent(
    handlerId: string, 
    handler: (event: RealTimePaymentEvent) => void
  ): void {
    this.eventHandlers.set(handlerId, handler);
  }

  /**
   * Unregister event handler
   */
  offPaymentEvent(handlerId: string): void {
    this.eventHandlers.delete(handlerId);
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private async logPaymentAttempt(
    message: CopayPaymentMessage, 
    result: PaymentResult, 
    fraudResult?: FraudDetectionResult
  ): Promise<void> {
    try {
      await this.dbClient.executeQuery(
        'payment_attempts',
        'insert',
        (query) => query.insert({
          patient_id: message.patient_id,
          amount: message.amount,
          payment_type: 'copay',
          success: result.success,
          error_message: result.error ? (typeof result.error === 'string' ? result.error : result.error.message) : null,
          fraud_score: fraudResult?.risk_score,
          fraud_flags: fraudResult?.flags,
          attempted_at: new Date().toISOString()
        }),
        { trackOperation: false }
      );
    } catch (error) {
      console.error('Failed to log payment attempt:', error);
    }
  }

  private async validateRefundEligibility(request: RefundRequest): Promise<boolean> {
    try {
      // Check if original payment exists and is eligible for refund
      const { data: payment } = await this.dbClient.executeQuery(
        'payment_transactions',
        'select',
        (query) => query
          .select('*')
          .eq('external_id', request.payment_id)
          .eq('status', 'completed')
          .single(),
        { trackOperation: false }
      );

      if (!payment) return false;

      // Check if already refunded
      const { data: existingRefund } = await this.dbClient.executeQuery(
        'payment_refunds',
        'select',
        (query) => query
          .select('*')
          .eq('original_payment_id', request.payment_id)
          .eq('status', 'completed')
          .single(),
        { trackOperation: false }
      );

      return !existingRefund;
    } catch (error) {
      console.error('Refund eligibility check failed:', error);
      return false;
    }
  }

  /**
   * Enhanced health check with MCP integration
   */
  async enhancedHealthCheck(): Promise<{
    payment_service: boolean;
    database_connection: boolean;
    mcp_service: boolean;
    fraud_detection: boolean;
    realtime_monitoring: boolean;
    recent_performance: {
      avg_processing_time_ms: number;
      success_rate: number;
      fraud_alerts: number;
    };
    overall_health: boolean;
  }> {
    try {
      // Get basic payment health
      const baseHealth = await super.healthCheck();
      
      // Get database health
      const dbHealth = await this.dbClient.healthCheck();
      
      // Get recent performance metrics
      const recentOps = this.dbClient.getOperationHistory(50);
      const paymentOps = recentOps.filter(op => op.operation_id.includes('payment'));
      
      const avgProcessingTime = paymentOps.length > 0 
        ? paymentOps.reduce((sum, op) => sum + op.duration_ms, 0) / paymentOps.length 
        : 0;
      
      const successRate = paymentOps.length > 0 
        ? (paymentOps.filter(op => op.success).length / paymentOps.length) * 100 
        : 100;

      // Check recent fraud alerts
      const { data: recentFraudAlerts } = await this.dbClient.executeQuery(
        'fraud_detection_logs',
        'select',
        (query) => query
          .select('*')
          .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .in('risk_level', ['high', 'critical']),
        { trackOperation: false }
      );

      const fraudAlerts = recentFraudAlerts?.length || 0;

      const overallHealth = baseHealth.overall_health && 
                           dbHealth.database_connection && 
                           dbHealth.mcp_service && 
                           fraudAlerts < 10;

      return {
        payment_service: baseHealth.payment_service,
        database_connection: dbHealth.database_connection,
        mcp_service: dbHealth.mcp_service,
        fraud_detection: this.fraudDetectionEnabled,
        realtime_monitoring: this.realtimeSubscriptions.length > 0,
        recent_performance: {
          avg_processing_time_ms: avgProcessingTime,
          success_rate: successRate,
          fraud_alerts: fraudAlerts
        },
        overall_health: overallHealth
      };
    } catch (error) {
      console.error('Enhanced payment health check failed:', error);
      return {
        payment_service: false,
        database_connection: false,
        mcp_service: false,
        fraud_detection: false,
        realtime_monitoring: false,
        recent_performance: {
          avg_processing_time_ms: 0,
          success_rate: 0,
          fraud_alerts: 0
        },
        overall_health: false
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      const mcpService = this.dbClient.getMCPService();
      if (mcpService) {
        this.realtimeSubscriptions.forEach(subId => {
          mcpService.unsubscribeFromTable(subId);
        });
      }
      
      this.eventHandlers.clear();
      console.log('✅ Enhanced Payment Hub cleanup completed');
    } catch (error) {
      console.error('Payment hub cleanup error:', error);
    }
  }
}