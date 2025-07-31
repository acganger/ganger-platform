/**
 * Error tracking module - now using Vercel's free logging
 * This module maintains the same API as the previous Sentry implementation
 * but routes all logging to Vercel logs instead
 */

import { User } from '@supabase/supabase-js';
import { 
  errorLogger, 
  captureException as logException,
  captureMessage as logMessage,
  setUser as setLoggerUser,
} from '@ganger/utils';

interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  debug?: boolean;
}

/**
 * Initialize error tracking (no-op for Vercel logging)
 * Kept for backwards compatibility
 */
export function initSentry(config: SentryConfig) {
  if (!config.enabled) {
    console.log('[ErrorTracking] Monitoring disabled');
    return;
  }

  console.log(`[ErrorTracking] Initialized for ${config.environment} environment`);
  
  if (config.debug) {
    console.log('[ErrorTracking] Debug mode enabled');
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: User | null) {
  setLoggerUser(user);
}

/**
 * Capture custom errors with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  logException(error, {
    action: 'custom_error',
    metadata: context,
  });
}

/**
 * Capture messages with level
 */
export function captureMessage(
  message: string, 
  level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
  context?: Record<string, any>
) {
  // Map Sentry severity levels to our logger
  const levelMap = {
    fatal: 'error',
    error: 'error',
    warning: 'warning',
    info: 'info',
  } as const;
  
  logMessage(message, levelMap[level], {
    action: 'custom_message',
    metadata: context,
  });
}

/**
 * Track custom events
 */
export function trackEvent(eventName: string, data?: Record<string, any>) {
  errorLogger.trackEvent(eventName, data);
}

/**
 * Performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return errorLogger.startTransaction(name, op);
}

/**
 * Export a mock Sentry object for compatibility
 * This allows code using Sentry.* methods to continue working
 */
export const Sentry = {
  init: initSentry,
  setUser: setSentryUser,
  captureException: captureError,
  captureMessage: (msg: string, level?: any) => {
    const severity = typeof level === 'string' ? level : 'info';
    captureMessage(msg, severity as any);
  },
  addBreadcrumb: (breadcrumb: { message?: string; category?: string; data?: any }) => {
    trackEvent(breadcrumb.message || breadcrumb.category || 'breadcrumb', breadcrumb.data);
  },
  startTransaction,
  configureScope: (callback: (scope: any) => void) => {
    // No-op for compatibility
    callback({
      setTag: () => {},
      setContext: () => {},
      setUser: setSentryUser,
    });
  },
  withScope: (callback: (scope: any) => void) => {
    // No-op for compatibility
    callback({
      setTag: () => {},
      setContext: () => {},
      setUser: setSentryUser,
    });
  },
  getCurrentHub: () => ({
    getClient: () => null,
    captureException: captureError,
    captureMessage,
  }),
};