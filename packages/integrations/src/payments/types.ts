// Universal Payment Processing Types
// Infrastructure-first approach for medical billing across all PRDs

export interface PatientPayment {
  id: string;
  patient_id: string;
  appointment_id?: string;
  amount: number;
  currency: 'usd';
  payment_type: 'copay' | 'deductible' | 'subscription' | 'deposit' | 'fee';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method_id?: string;
  stripe_payment_intent_id?: string;
  created_at: Date;
  processed_at?: Date;
  failure_reason?: string;
}

export interface PaymentMethod {
  id: string;
  patient_id: string;
  stripe_payment_method_id: string;
  type: 'card' | 'bank_account';
  last_four: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: Date;
}

export interface PaymentRequest {
  patient_id: string;
  amount: number;
  payment_type: 'copay' | 'deductible' | 'subscription' | 'deposit' | 'fee';
  description: string;
  appointment_id?: string;
  course_id?: string;
  staff_id?: string;
  payment_method_id?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  payment_id?: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'declined';
  amount?: number;
  error?: {
    code: string;
    message: string;
    type: 'card_error' | 'api_error' | 'validation_error';
  };
  requires_action?: boolean;
  client_secret?: string;
  processing_fee?: number;
  timestamp?: Date;
}

export interface RefundRequest {
  payment_id: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'error';
  metadata?: Record<string, string>;
}

export interface RefundResult {
  success: boolean;
  refund_id?: string;
  stripe_refund_id?: string;
  amount?: number;
  status: 'pending' | 'succeeded' | 'failed';
  error?: {
    code: string;
    message: string;
  };
  timestamp?: Date;
}

// Subscription-specific types for Training platform
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  interval: 'month' | 'year';
  stripe_price_id: string;
  features: string[];
  active: boolean;
}

export interface PatientSubscription {
  id: string;
  patient_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  current_period_start: Date;
  current_period_end: Date;
  created_at: Date;
  canceled_at?: Date;
}

// Billing summary for Provider Dashboard
export interface BillingAnalytics {
  total_revenue: number;
  pending_payments: number;
  failed_payments: number;
  refunds_issued: number;
  payment_method_breakdown: {
    card: number;
    bank_account: number;
  };
  payment_type_breakdown: {
    copay: number;
    deductible: number;
    subscription: number;
    deposit: number;
    fee: number;
  };
  period_start: Date;
  period_end: Date;
}

// Payment audit trail for HIPAA compliance
export interface PaymentAuditLog {
  id: string;
  payment_id: string;
  action: 'created' | 'processed' | 'failed' | 'refunded' | 'disputed' | 'canceled' | 'plan_changed' | 'webhook_created' | 'webhook_updated' | 'webhook_deleted' | 'payment_succeeded' | 'payment_failed' | 'webhook_received' | 'refund_failed' | 'payment_method_created' | 'payment_method_creation_failed' | 'confirmed' | 'confirmation_failed';
  details: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

// Cross-PRD payment message types
export interface CopayPaymentMessage {
  patient_id: string;
  appointment_id: string;
  amount: number;
  provider_name: string;
  appointment_date: Date;
  payment_method_id?: string;
}

export interface SubscriptionPaymentMessage {
  patient_id: string;
  plan_id: string;
  staff_id?: string;
  training_course_id?: string;
}

export interface DepositPaymentMessage {
  patient_id: string;
  appointment_id: string;
  amount: number;
  procedure_name: string;
  appointment_date: Date;
}

export interface FeePaymentMessage {
  patient_id: string;
  fee_type: string;
  amount: number;
  description: string;
  staff_id?: string;
}

// Payment configuration
export interface PaymentConfig {
  stripe_publishable_key: string;
  default_currency: 'usd';
  allowed_payment_methods: ('card' | 'bank_account')[];
  require_cvv: boolean;
  enable_receipts: boolean;
  receipt_email_template?: string;
}

// Health check for payment system
export interface PaymentHealthCheck {
  stripe_connection: boolean;
  database_connection: boolean;
  audit_logging: boolean;
  overall_health: boolean;
  last_check: Date;
}