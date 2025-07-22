import * as Sentry from '@sentry/nextjs';
import { User } from '@supabase/supabase-js';

interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  debug?: boolean;
}

export function initSentry(config: SentryConfig) {
  if (!config.enabled || !config.dsn) {
    console.log('[Sentry] Monitoring disabled or DSN not provided');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate,
    debug: config.debug || false,
    
    // Performance Monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', 'gangerdermatology.com', /^\//],
        // Track route changes
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        // Mask all text and inputs for HIPAA compliance
        maskAllText: true,
        maskAllInputs: true,
        // Only capture errors, not sessions
        sessionSampleRate: 0,
        errorSampleRate: 1.0,
      }),
    ],

    // HIPAA Compliance: Scrub sensitive data
    beforeSend(event, hint) {
      // Remove any PII from the event
      if (event.user) {
        event.user = {
          id: event.user.id,
          // Don't send email or name
        };
      }

      // Scrub sensitive data from URLs
      if (event.request?.url) {
        event.request.url = scrubSensitiveData(event.request.url);
      }

      // Scrub sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          message: breadcrumb.message ? scrubSensitiveData(breadcrumb.message) : undefined,
          data: breadcrumb.data ? scrubObjectData(breadcrumb.data) : undefined,
        }));
      }

      // Scrub exception values
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map(exception => ({
          ...exception,
          value: exception.value ? scrubSensitiveData(exception.value) : undefined,
        }));
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random network errors
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      // Ignore harmless errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],

    // Don't send default PII
    sendDefaultPii: false,
  });
}

// Set user context for error tracking
export function setSentryUser(user: User | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      // Don't set email or username for HIPAA compliance
    });
  } else {
    Sentry.setUser(null);
  }
}

// Capture custom errors with context
export function captureError(error: Error, context?: Record<string, any>) {
  const sanitizedContext = context ? scrubObjectData(context) : undefined;
  
  Sentry.captureException(error, {
    contexts: {
      custom: sanitizedContext,
    },
  });
}

// Capture messages with level
export function captureMessage(
  message: string, 
  level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
  context?: Record<string, any>
) {
  const sanitizedContext = context ? scrubObjectData(context) : undefined;
  
  Sentry.captureMessage(message, {
    level: level as Sentry.SeverityLevel,
    contexts: {
      custom: sanitizedContext,
    },
  });
}

// Track custom events
export function trackEvent(eventName: string, data?: Record<string, any>) {
  const sanitizedData = data ? scrubObjectData(data) : undefined;
  
  Sentry.addBreadcrumb({
    category: 'custom',
    message: eventName,
    level: 'info',
    data: sanitizedData,
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

// Helper function to scrub sensitive data from strings
function scrubSensitiveData(str: string): string {
  // Remove email addresses
  str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  
  // Remove phone numbers
  str = str.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
  
  // Remove SSN patterns
  str = str.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
  
  // Remove potential patient names in common patterns
  str = str.replace(/patient[:\s]+\S+/gi, 'patient:[REDACTED]');
  
  // Remove dates of birth
  str = str.replace(/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, '[REDACTED_DOB]');
  
  return str;
}

// Helper function to scrub sensitive data from objects
function scrubObjectData(obj: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password', 'ssn', 'dob', 'dateOfBirth', 'email', 
    'phone', 'address', 'name', 'firstName', 'lastName',
    'patientName', 'patientId', 'medicalRecord', 'diagnosis',
    'medication', 'prescription', 'insurance', 'creditCard'
  ];

  const scrubbed: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      scrubbed[key] = scrubSensitiveData(value);
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = Array.isArray(value) 
        ? value.map(v => typeof v === 'object' ? scrubObjectData(v) : v)
        : scrubObjectData(value);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}

// Export Sentry instance for advanced usage
export { Sentry };