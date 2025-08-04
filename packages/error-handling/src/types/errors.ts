/**
 * Error types for the Ganger Platform
 * HIPAA compliant - no PII in error messages
 */

export type ErrorRecoveryStrategy = 
  | 'retry'
  | 'reload'
  | 'redirect'
  | 'contact-support'
  | 'none';

export interface ErrorMetadata {
  timestamp: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  userId?: string; // Staff ID only, no patient data
  action?: string;
  component?: string;
  stack?: string; // Only in development
  recoveryStrategy?: ErrorRecoveryStrategy;
  [key: string]: any; // Allow additional metadata
}

export interface SerializedError {
  code: string;
  message: string;
  userMessage: string; // User-friendly message
  metadata?: ErrorMetadata;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface ErrorContextValue {
  errors: SerializedError[];
  addError: (error: Error | SerializedError) => void;
  removeError: (index: number) => void;
  clearErrors: () => void;
  isRecovering: boolean;
}