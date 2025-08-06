/**
 * @fileoverview Enhanced error handling system for AI operations
 * Provides comprehensive error recovery, user-friendly messages, and diagnostic tools
 */

import type { AIModel, ApplicationContext } from '../shared/types';

/**
 * Enhanced error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error category for better handling
 */
export type ErrorCategory = 
  | 'authentication'
  | 'validation'
  | 'safety'
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'budget'
  | 'model'
  | 'configuration'
  | 'unknown';

/**
 * Error context for better diagnostics
 */
interface ErrorContext {
  app: ApplicationContext;
  model?: AIModel;
  userId?: string;
  requestId?: string;
  timestamp: number;
  userAgent?: string;
  ipAddress?: string;
  retryCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Recovery action that can be suggested to users
 */
interface RecoveryAction {
  label: string;
  action: 'retry' | 'refresh' | 'navigate' | 'contact' | 'wait' | 'modify';
  params?: Record<string, any>;
  priority: number; // Lower = higher priority
}

/**
 * Diagnostic information for error analysis
 */
interface DiagnosticInfo {
  errorId: string;
  timestamp: number;
  stackTrace?: string;
  browserInfo?: {
    userAgent: string;
    url: string;
    viewport: string;
  };
  networkInfo?: {
    connectionType: string;
    downlink?: number;
    rtt?: number;
  };
  systemInfo?: {
    memory?: number;
    storage?: number;
    cpuCores?: number;
  };
}

/**
 * Enhanced AI Error class with recovery capabilities
 */
export class EnhancedAIError extends Error {
  public readonly errorId: string;
  public readonly timestamp: number;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly recoverable: boolean;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly context: ErrorContext;
  public readonly recoveryActions: RecoveryAction[];
  public readonly diagnostics: DiagnosticInfo;
  public retryAfter?: number;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context: ErrorContext,
    options: {
      recoverable?: boolean;
      userMessage?: string;
      retryAfter?: number;
      cause?: Error;
      metadata?: Record<string, any>;
    } = {}
  ) {
    super(message);
    
    this.name = 'EnhancedAIError';
    this.errorId = this.generateErrorId();
    this.timestamp = Date.now();
    this.category = category;
    this.severity = severity;
    this.recoverable = options.recoverable ?? this.isRecoverableByDefault(category);
    this.technicalMessage = message;
    this.userMessage = options.userMessage ?? this.generateUserMessage(category, message);
    this.context = context;
    this.retryAfter = options.retryAfter;
    this.recoveryActions = this.generateRecoveryActions(category);
    this.diagnostics = this.generateDiagnostics(options.cause);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnhancedAIError);
    }
  }

  /**
   * Generate unique error ID for tracking
   */
  private generateErrorId(): string {
    return `ai_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine if error is recoverable by default
   */
  private isRecoverableByDefault(category: ErrorCategory): boolean {
    const recoverableCategories: ErrorCategory[] = [
      'network', 'timeout', 'rate_limit', 'model', 'validation'
    ];
    return recoverableCategories.includes(category);
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(category: ErrorCategory, technicalMessage: string): string {
    // Log technical message for debugging
    console.debug(`[ErrorHandler] Technical message for ${category}:`, technicalMessage);
    const messages: Record<ErrorCategory, string> = {
      authentication: 'Please log in to continue using AI features.',
      validation: 'Please check your input and try again.',
      safety: 'Your message contains sensitive information that cannot be processed. Please remove personal details.',
      network: 'Unable to connect to AI service. Please check your internet connection.',
      timeout: 'AI request is taking longer than expected. Please try again.',
      rate_limit: 'Too many requests. Please wait a moment before trying again.',
      budget: 'AI usage budget has been exceeded. Please contact your administrator.',
      model: 'AI model is temporarily unavailable. Please try again later.',
      configuration: 'AI service is misconfigured. Please contact technical support.',
      unknown: 'An unexpected error occurred. Please try again.'
    };

    return messages[category] || messages.unknown;
  }

  /**
   * Generate context-appropriate recovery actions
   */
  private generateRecoveryActions(category: ErrorCategory): RecoveryAction[] {
    const actionMap: Record<ErrorCategory, RecoveryAction[]> = {
      authentication: [
        { label: 'Log In', action: 'navigate', params: { url: '/login' }, priority: 1 },
        { label: 'Refresh Page', action: 'refresh', priority: 2 }
      ],
      validation: [
        { label: 'Check Input', action: 'modify', priority: 1 },
        { label: 'Try Again', action: 'retry', priority: 2 }
      ],
      safety: [
        { label: 'Remove Personal Info', action: 'modify', priority: 1 },
        { label: 'Rephrase Message', action: 'modify', priority: 2 }
      ],
      network: [
        { label: 'Check Connection', action: 'wait', params: { duration: 5000 }, priority: 1 },
        { label: 'Try Again', action: 'retry', priority: 2 },
        { label: 'Refresh Page', action: 'refresh', priority: 3 }
      ],
      timeout: [
        { label: 'Shorten Message', action: 'modify', priority: 1 },
        { label: 'Try Again', action: 'retry', priority: 2 }
      ],
      rate_limit: [
        { label: 'Wait and Retry', action: 'wait', params: { duration: this.retryAfter || 60000 }, priority: 1 }
      ],
      budget: [
        { label: 'Contact Admin', action: 'contact', params: { type: 'admin' }, priority: 1 }
      ],
      model: [
        { label: 'Try Again', action: 'retry', priority: 1 },
        { label: 'Wait 1 Minute', action: 'wait', params: { duration: 60000 }, priority: 2 }
      ],
      configuration: [
        { label: 'Contact Support', action: 'contact', params: { type: 'support' }, priority: 1 }
      ],
      unknown: [
        { label: 'Try Again', action: 'retry', priority: 1 },
        { label: 'Refresh Page', action: 'refresh', priority: 2 },
        { label: 'Contact Support', action: 'contact', params: { type: 'support' }, priority: 3 }
      ]
    };

    return actionMap[category] || actionMap.unknown;
  }

  /**
   * Generate diagnostic information
   */
  private generateDiagnostics(cause?: Error): DiagnosticInfo {
    const diagnostics: DiagnosticInfo = {
      errorId: this.errorId,
      timestamp: this.timestamp,
      stackTrace: this.stack
    };
    
    // Log cause information if available
    if (cause) {
      console.debug(`[ErrorHandler] Error cause:`, {
        message: cause.message,
        name: cause.name,
        stack: cause.stack
      });
    }

    // Add browser information if available
    if (typeof window !== 'undefined') {
      diagnostics.browserInfo = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };

      // Add network information if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        diagnostics.networkInfo = {
          connectionType: connection.effectiveType || 'unknown',
          downlink: connection.downlink,
          rtt: connection.rtt
        };
      }

      // Add system information if available
      if ('deviceMemory' in navigator) {
        diagnostics.systemInfo = {
          memory: (navigator as any).deviceMemory,
          cpuCores: navigator.hardwareConcurrency
        };
      }
    }

    return diagnostics;
  }

  /**
   * Get prioritized recovery action
   */
  getPrimaryRecoveryAction(): RecoveryAction | null {
    return this.recoveryActions.sort((a, b) => a.priority - b.priority)[0] || null;
  }

  /**
   * Convert to API response format
   */
  toAPIResponse() {
    return {
      success: false,
      error: {
        id: this.errorId,
        category: this.category,
        severity: this.severity,
        message: this.userMessage,
        recoverable: this.recoverable,
        retryAfter: this.retryAfter,
        recoveryActions: this.recoveryActions,
        timestamp: this.timestamp
      }
    };
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      errorId: this.errorId,
      timestamp: this.timestamp,
      category: this.category,
      severity: this.severity,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      recoverable: this.recoverable,
      context: this.context,
      recoveryActions: this.recoveryActions,
      diagnostics: this.diagnostics,
      retryAfter: this.retryAfter,
      stack: this.stack
    };
  }

  /**
   * Send error to monitoring service
   */
  async report(): Promise<void> {
    try {
      // In a real implementation, this would send to your monitoring service
      console.error('AI Error Report:', this.toJSON());
      
      // Could integrate with services like:
      // - Sentry
      // - LogRocket
      // - Datadog
      // - Custom logging endpoint
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

/**
 * Error factory for creating specific error types
 */
export class AIErrorFactory {
  /**
   * Create authentication error
   */
  static authentication(context: ErrorContext, message?: string): EnhancedAIError {
    return new EnhancedAIError(
      message || 'Authentication required',
      'authentication',
      'medium',
      context,
      { recoverable: true }
    );
  }

  /**
   * Create validation error
   */
  static validation(context: ErrorContext, field?: string, value?: any): EnhancedAIError {
    const message = field 
      ? `Validation failed for field: ${field}` 
      : 'Input validation failed';
    
    return new EnhancedAIError(
      message,
      'validation',
      'low',
      context,
      { 
        recoverable: true,
        userMessage: field 
          ? `Please check the ${field} field and try again.`
          : 'Please check your input and try again.',
        metadata: { field, value }
      }
    );
  }

  /**
   * Create safety violation error
   */
  static safety(context: ErrorContext, phiTypes: string[] = [], safetyScore?: number): EnhancedAIError {
    const message = `Safety violation detected${phiTypes.length ? `: ${phiTypes.join(', ')}` : ''}`;
    
    return new EnhancedAIError(
      message,
      'safety',
      'high',
      context,
      { 
        recoverable: true,
        metadata: { phiTypes, safetyScore }
      }
    );
  }

  /**
   * Create network error
   */
  static network(context: ErrorContext, cause?: Error): EnhancedAIError {
    return new EnhancedAIError(
      `Network error: ${cause?.message || 'Connection failed'}`,
      'network',
      'medium',
      context,
      { 
        recoverable: true,
        cause,
        retryAfter: 5000 // 5 seconds
      }
    );
  }

  /**
   * Create timeout error
   */
  static timeout(context: ErrorContext, timeoutMs: number): EnhancedAIError {
    return new EnhancedAIError(
      `Request timed out after ${timeoutMs}ms`,
      'timeout',
      'medium',
      context,
      { 
        recoverable: true,
        metadata: { timeoutMs },
        retryAfter: 3000 // 3 seconds
      }
    );
  }

  /**
   * Create rate limit error
   */
  static rateLimit(context: ErrorContext, resetTime?: number): EnhancedAIError {
    const retryAfter = resetTime ? resetTime - Date.now() : 60000;
    
    return new EnhancedAIError(
      'Rate limit exceeded',
      'rate_limit',
      'medium',
      context,
      { 
        recoverable: true,
        retryAfter,
        userMessage: `Too many requests. Please wait ${Math.ceil(retryAfter / 1000)} seconds.`,
        metadata: { resetTime }
      }
    );
  }

  /**
   * Create budget exceeded error
   */
  static budget(context: ErrorContext, budgetType: 'daily' | 'monthly', used: number, limit: number): EnhancedAIError {
    return new EnhancedAIError(
      `${budgetType} budget exceeded: $${used}/$${limit}`,
      'budget',
      'critical',
      context,
      { 
        recoverable: false,
        metadata: { budgetType, used, limit }
      }
    );
  }

  /**
   * Create model unavailable error
   */
  static modelUnavailable(context: ErrorContext, model: AIModel, fallbackUsed?: AIModel): EnhancedAIError {
    return new EnhancedAIError(
      `Model ${model} is unavailable`,
      'model',
      'medium',
      context,
      { 
        recoverable: true,
        userMessage: fallbackUsed 
          ? `AI model switched to ${fallbackUsed} due to availability.`
          : 'AI model is temporarily unavailable. Please try again later.',
        metadata: { model, fallbackUsed }
      }
    );
  }

  /**
   * Create configuration error
   */
  static configuration(context: ErrorContext, configField?: string): EnhancedAIError {
    return new EnhancedAIError(
      `Configuration error${configField ? ` in ${configField}` : ''}`,
      'configuration',
      'critical',
      context,
      { 
        recoverable: false,
        metadata: { configField }
      }
    );
  }

  /**
   * Create unknown error
   */
  static unknown(context: ErrorContext, cause?: Error): EnhancedAIError {
    return new EnhancedAIError(
      `Unknown error: ${cause?.message || 'Unexpected error occurred'}`,
      'unknown',
      'medium',
      context,
      { 
        recoverable: true,
        cause
      }
    );
  }
}

/**
 * Error handler for graceful error management
 */
export class AIErrorHandler {
  private errorReporters: Array<(error: EnhancedAIError) => Promise<void>> = [];
  private errorCounts = new Map<string, number>();
  private lastErrorTimes = new Map<string, number>();

  /**
   * Add error reporter (e.g., logging service)
   */
  addReporter(reporter: (error: EnhancedAIError) => Promise<void>): void {
    this.errorReporters.push(reporter);
  }

  /**
   * Handle error with automatic reporting and recovery
   */
  async handleError(error: Error, context: ErrorContext): Promise<EnhancedAIError> {
    let enhancedError: EnhancedAIError;

    // Convert to enhanced error if needed
    if (error instanceof EnhancedAIError) {
      enhancedError = error;
    } else {
      enhancedError = this.convertToEnhancedError(error, context);
    }

    // Track error frequency
    this.trackErrorFrequency(enhancedError);

    // Report to all registered reporters
    await this.reportError(enhancedError);

    return enhancedError;
  }

  /**
   * Convert regular error to enhanced error
   */
  private convertToEnhancedError(error: Error, context: ErrorContext): EnhancedAIError {
    // Detect error type from message and properties
    if (error.message.includes('timeout')) {
      return AIErrorFactory.timeout(context, 30000);
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return AIErrorFactory.network(context, error);
    }
    if (error.message.includes('auth')) {
      return AIErrorFactory.authentication(context, error.message);
    }
    if (error.message.includes('rate limit')) {
      return AIErrorFactory.rateLimit(context);
    }

    // Default to unknown error
    return AIErrorFactory.unknown(context, error);
  }

  /**
   * Track error frequency for pattern detection
   */
  private trackErrorFrequency(error: EnhancedAIError): void {
    const key = `${error.category}_${error.context.app}`;
    const now = Date.now();
    
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    this.lastErrorTimes.set(key, now);

    // Alert if error frequency is high
    const count = this.errorCounts.get(key) || 0;
    const lastTime = this.lastErrorTimes.get(key) || 0;
    const timeDiff = now - lastTime;

    if (count > 10 && timeDiff < 60000) { // 10 errors in 1 minute
      console.warn(`High error frequency detected: ${key} - ${count} errors in ${timeDiff}ms`);
    }
  }

  /**
   * Report error to all registered reporters
   */
  private async reportError(error: EnhancedAIError): Promise<void> {
    const reportPromises = this.errorReporters.map(reporter => {
      return reporter(error).catch(reportingError => {
        console.error('Error reporter failed:', reportingError);
      });
    });

    await Promise.allSettled(reportPromises);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, { count: number; lastSeen: number }> {
    const stats: Record<string, { count: number; lastSeen: number }> = {};
    
    for (const [key, count] of this.errorCounts.entries()) {
      stats[key] = {
        count,
        lastSeen: this.lastErrorTimes.get(key) || 0
      };
    }

    return stats;
  }

  /**
   * Clear error statistics
   */
  clearStats(): void {
    this.errorCounts.clear();
    this.lastErrorTimes.clear();
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new AIErrorHandler();

/**
 * Utility function to wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const enhancedError = await globalErrorHandler.handleError(error as Error, context);
    throw enhancedError;
  }
}

/**
 * Error boundary hook for React components
 */
export function useErrorBoundary() {
  const [error, setError] = useState<EnhancedAIError | null>(null);

  const captureError = useCallback(async (error: Error, context: Partial<ErrorContext>) => {
    const fullContext: ErrorContext = {
      app: 'platform-dashboard', // default
      timestamp: Date.now(),
      ...context
    };

    const enhancedError = await globalErrorHandler.handleError(error, fullContext);
    setError(enhancedError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, captureError, clearError };
}

// React hooks import
import { useState, useCallback } from 'react';