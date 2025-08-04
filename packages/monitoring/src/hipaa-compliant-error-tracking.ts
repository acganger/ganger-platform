import { getSupabaseClient } from '@ganger/auth';
import { performanceMonitor } from './performance-monitor';

interface SanitizedError {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent?: string;
  sessionId: string; // Use session ID instead of user ID for HIPAA compliance
  metadata?: Record<string, any>;
  fingerprint: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'api' | 'network' | 'security' | 'validation' | 'unknown';
}

interface ErrorContext {
  component?: string;
  action?: string;
  feature?: string;
  tags?: Record<string, string>;
}

interface ErrorFilter {
  patterns: RegExp[];
  action: 'ignore' | 'sanitize' | 'alert';
}

// HIPAA-compliant error sanitization patterns
const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
  /\b\d{16}\b/g, // Credit card
  /patient[_\s]?(?:id|name|info)[:\s]*[^\s,;]+/gi, // Patient info
  /\b(?:DOB|dob|birthdate|date[_\s]?of[_\s]?birth)[:\s]*[^\s,;]+/gi, // Birth dates
  /\b(?:MRN|mrn|medical[_\s]?record)[:\s]*[^\s,;]+/gi, // Medical Record Numbers
];

const ERROR_FILTERS: ErrorFilter[] = [
  {
    patterns: [/ResizeObserver loop limit exceeded/i],
    action: 'ignore'
  },
  {
    patterns: [/Non-Error promise rejection captured/i],
    action: 'sanitize'
  },
  {
    patterns: [/auth.*fail|unauthorized|forbidden/i],
    action: 'alert'
  }
];

class HIPAACompliantErrorTracker {
  private errorQueue: SanitizedError[] = [];
  private sessionId: string;
  private maxQueueSize = 100;
  private flushInterval = 60000; // 1 minute
  private errorCounts = new Map<string, number>();
  private rateLimitWindow = 300000; // 5 minutes
  private maxErrorsPerWindow = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
    this.setupGlobalHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeError(error: Error | ErrorEvent | any, context?: ErrorContext): SanitizedError | null {
    // Extract basic error info
    let message = error instanceof Error ? error.message : 
                  error.message || 'Unknown error';
    let stack = error instanceof Error ? error.stack :
                error.stack || '';
    
    // Check filters
    const filterResult = this.checkFilters(message + stack);
    if (filterResult === 'ignore') return null;
    
    // Sanitize PII from message and stack
    message = this.removePII(message);
    stack = this.removePII(stack);
    
    // Sanitize URL to remove query params that might contain PII
    const url = typeof window !== 'undefined' ? 
      window.location.pathname : '';
    
    // Generate fingerprint for deduplication
    const fingerprint = this.generateFingerprint(message, stack);
    
    // Determine severity
    const severity = this.determineSeverity(error, context);
    
    // Categorize error
    const category = this.categorizeError(error, message);
    
    // Build sanitized metadata
    const metadata = this.buildSafeMetadata(error, context);
    
    return {
      message,
      stack: stack ? stack.substring(0, 5000) : undefined, // Limit stack trace size
      componentStack: error.componentStack ? 
        this.removePII(error.componentStack).substring(0, 5000) : undefined,
      timestamp: new Date().toISOString(),
      url,
      userAgent: typeof navigator !== 'undefined' ? 
        navigator.userAgent : undefined,
      sessionId: this.sessionId,
      metadata,
      fingerprint,
      severity,
      category
    };
  }

  private removePII(text: string): string {
    if (!text) return text;
    
    let sanitized = text;
    for (const pattern of PII_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    return sanitized;
  }

  private checkFilters(errorText: string): 'ignore' | 'sanitize' | 'alert' | null {
    for (const filter of ERROR_FILTERS) {
      for (const pattern of filter.patterns) {
        if (pattern.test(errorText)) {
          return filter.action;
        }
      }
    }
    return null;
  }

  private generateFingerprint(message: string, stack?: string): string {
    const key = message + (stack ? stack.split('\n')[0] : '');
    
    // Simple hash function for fingerprinting
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private determineSeverity(
    error: any, 
    context?: ErrorContext
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Auth failures, security issues, data loss risks
    if (error.name === 'SecurityError' || 
        error.message?.includes('auth') ||
        error.message?.includes('forbidden') ||
        context?.tags?.critical === 'true') {
      return 'critical';
    }
    
    // High: API failures, database errors, payment issues
    if (error.name === 'NetworkError' ||
        error.message?.includes('database') ||
        error.message?.includes('payment') ||
        error.message?.includes('API') ||
        error.status >= 500) {
      return 'high';
    }
    
    // Medium: Validation errors, component errors
    if (error.name === 'ValidationError' ||
        error.componentStack ||
        error.status >= 400) {
      return 'medium';
    }
    
    // Low: Everything else
    return 'low';
  }

  private categorizeError(error: any, message: string): SanitizedError['category'] {
    if (error.name === 'NetworkError' || message.includes('fetch')) {
      return 'network';
    }
    if (error.name === 'SecurityError' || message.includes('auth')) {
      return 'security';
    }
    if (message.includes('API') || error.status) {
      return 'api';
    }
    if (error.name === 'ValidationError' || message.includes('valid')) {
      return 'validation';
    }
    if (error.stack || error instanceof Error) {
      return 'javascript';
    }
    return 'unknown';
  }

  private buildSafeMetadata(error: any, context?: ErrorContext): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Add safe context info
    if (context) {
      metadata.component = context.component;
      metadata.action = context.action;
      metadata.feature = context.feature;
      metadata.tags = context.tags;
    }
    
    // Add safe error properties
    if (error.status) metadata.status = error.status;
    if (error.statusText) metadata.statusText = error.statusText;
    if (error.code) metadata.code = error.code;
    
    // Add browser info
    if (typeof window !== 'undefined') {
      metadata.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      metadata.screen = {
        width: window.screen.width,
        height: window.screen.height
      };
    }
    
    return metadata;
  }

  public async trackError(
    error: Error | ErrorEvent | any, 
    context?: ErrorContext
  ): Promise<void> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.warn('Error tracking rate limit exceeded');
        return;
      }
      
      // Sanitize error
      const sanitizedError = this.sanitizeError(error, context);
      if (!sanitizedError) return; // Filtered out
      
      // Add to queue
      this.errorQueue.push(sanitizedError);
      
      // Track in performance monitor
      performanceMonitor.trackApiRequest(
        'error-tracking',
        0,
        false
      );
      
      // Immediate flush for critical errors
      if (sanitizedError.severity === 'critical') {
        await this.flush();
      } else if (this.errorQueue.length >= this.maxQueueSize) {
        await this.flush();
      }
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.rateLimitWindow;
    
    // Clean old entries
    for (const [timestamp] of this.errorCounts) {
      if (parseInt(timestamp) < windowStart) {
        this.errorCounts.delete(timestamp);
      }
    }
    
    // Check count
    if (this.errorCounts.size >= this.maxErrorsPerWindow) {
      return false;
    }
    
    // Add new entry
    this.errorCounts.set(now.toString(), 1);
    return true;
  }

  private async flush(): Promise<void> {
    if (this.errorQueue.length === 0) return;
    
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    try {
      // Group errors by fingerprint for deduplication
      const groupedErrors = this.groupErrors(errors);
      
      // Send to monitoring endpoint
      const response = await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({
          errors: groupedErrors,
          sessionInfo: {
            id: this.sessionId,
            timestamp: new Date().toISOString(),
            errorCount: groupedErrors.length
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send errors: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to flush errors:', error);
      // Put critical errors back in queue
      const criticalErrors = errors.filter(e => e.severity === 'critical');
      this.errorQueue.unshift(...criticalErrors);
    }
  }

  private groupErrors(errors: SanitizedError[]): Array<SanitizedError & { count: number }> {
    const grouped = new Map<string, SanitizedError & { count: number }>();
    
    for (const error of errors) {
      const existing = grouped.get(error.fingerprint);
      if (existing) {
        existing.count++;
        // Update to latest timestamp
        existing.timestamp = error.timestamp;
      } else {
        grouped.set(error.fingerprint, { ...error, count: 1 });
      }
    }
    
    return Array.from(grouped.values());
  }

  private startFlushInterval(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;
    
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error || event, {
        component: 'window',
        action: 'unhandled-error'
      });
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack
      }, {
        component: 'promise',
        action: 'unhandled-rejection'
      });
    });
  }

  // React Error Boundary helper
  public logErrorBoundary(
    error: Error, 
    errorInfo: { componentStack: string },
    componentName: string
  ): void {
    this.trackError({
      ...error,
      componentStack: errorInfo.componentStack
    }, {
      component: componentName,
      action: 'error-boundary',
      tags: {
        react: 'true'
      }
    });
  }

  // Custom metrics for errors
  public async getErrorMetrics(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    recentErrors: number;
  }> {
    const now = Date.now();
    const recentWindow = 3600000; // 1 hour
    
    let total = 0;
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    const byCategory: Record<string, number> = {};
    let recentErrors = 0;
    
    for (const error of this.errorQueue) {
      total++;
      bySeverity[error.severity]++;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      
      if (new Date(error.timestamp).getTime() > now - recentWindow) {
        recentErrors++;
      }
    }
    
    return {
      total,
      bySeverity,
      byCategory,
      recentErrors
    };
  }
}

// Singleton instance
export const hipaaErrorTracker = new HIPAACompliantErrorTracker();

// React hook for error tracking
// Usage: import React from 'react' in your component
export function useErrorTracking(componentName: string) {
  const trackError = (error: Error | any, action?: string) => {
    hipaaErrorTracker.trackError(error, {
      component: componentName,
      action
    });
  };
  
  const trackApiError = (
    endpoint: string, 
    status: number, 
    error: any
  ) => {
    hipaaErrorTracker.trackError({
      message: `API Error: ${endpoint}`,
      status,
      statusText: error.message || error
    }, {
      component: componentName,
      action: 'api-call',
      tags: {
        endpoint,
        status: status.toString()
      }
    });
  };
  
  return {
    trackError,
    trackApiError
  };
}

// Error boundary helper function for React components
// Usage in your React app:
// import React from 'react';
// import { hipaaErrorTracker } from '@ganger/monitoring';
//
// class ErrorBoundary extends React.Component {
//   componentDidCatch(error, errorInfo) {
//     hipaaErrorTracker.logErrorBoundary(error, errorInfo, 'AppErrorBoundary');
//   }
//   render() {
//     if (this.state.hasError) {
//       return <div>Something went wrong</div>;
//     }
//     return this.props.children;
//   }
// }