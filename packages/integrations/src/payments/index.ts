// Universal Payment Processing Hub - Package Exports
// Infrastructure-first payment system for all Ganger Platform PRDs

// Main payment hub
export { UniversalPaymentHub, universalPaymentHub } from './payment-hub';
export { EnhancedPaymentHub } from './enhanced-payment-hub';

// Core services
export { MedicalPaymentService, medicalPaymentService } from './stripe-service';
export { StripeMCPService, stripeMCPService, createStripeMCPService } from './stripe-mcp-service';
export { SubscriptionManager, subscriptionManager } from './subscription-manager';

// Type definitions
export * from './types';

// Re-export for convenience
export type {
  PaymentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
  PatientPayment,
  PaymentMethod,
  SubscriptionPlan,
  PatientSubscription,
  BillingAnalytics,
  CopayPaymentMessage,
  SubscriptionPaymentMessage,
  DepositPaymentMessage,
  FeePaymentMessage
} from './types';

// Enhanced types for MCP integration
export type { PaymentAnalytics, RealTimePaymentEvent, FraudDetectionResult } from './enhanced-payment-hub';