/**
 * Vercel-compatible error logger for the Ganger Platform
 * Replaces Sentry with free Vercel logging
 *
 * All errors are automatically captured in:
 * Vercel Dashboard → Functions → Logs
 */
import type { User } from '@supabase/supabase-js';
interface ErrorContext {
    userId?: string;
    userEmail?: string;
    action?: string;
    metadata?: Record<string, any>;
    url?: string;
    method?: string;
}
interface ErrorLogEntry {
    timestamp: string;
    level: 'error' | 'warn' | 'info';
    message: string;
    stack?: string;
    context?: ErrorContext;
    environment: string;
}
declare class ErrorLogger {
    private isDevelopment;
    private environment;
    /**
     * Log an error with context
     * In production, these appear in Vercel logs as structured JSON
     */
    logError(error: Error | unknown, context?: ErrorContext): void;
    /**
     * Log a warning
     */
    logWarning(message: string, context?: ErrorContext): void;
    /**
     * Log info (useful for tracking important events)
     */
    logInfo(message: string, context?: ErrorContext): void;
    /**
     * Set user context (replacement for Sentry.setUser)
     */
    setUser(user: User | null): void;
    /**
     * Track custom events (replacement for Sentry breadcrumbs)
     */
    trackEvent(eventName: string, data?: Record<string, any>): void;
    /**
     * Start a transaction (no-op for Vercel logging)
     */
    startTransaction(name: string, op: string): {
        finish: () => void;
        setData: (key: string, value: any) => void;
    };
    private output;
    /**
     * Scrub sensitive data from strings (HIPAA compliance)
     */
    private scrubSensitiveData;
    /**
     * Scrub sensitive data from context objects
     */
    private scrubContext;
    /**
     * Recursively scrub sensitive data from objects
     */
    private scrubObjectData;
}
export declare const errorLogger: ErrorLogger;
/**
 * Capture an exception (Sentry.captureException replacement)
 */
export declare function captureException(error: Error | unknown, context?: ErrorContext): void;
/**
 * Capture a message (Sentry.captureMessage replacement)
 */
export declare function captureMessage(message: string, level?: 'error' | 'warning' | 'info', context?: ErrorContext): void;
/**
 * Set user context (Sentry.setUser replacement)
 */
export declare function setUser(user: User | null): void;
/**
 * Helper for React error boundaries
 */
export declare function logErrorToService(error: Error, errorInfo: React.ErrorInfo): void;
/**
 * Helper for API route errors
 */
export declare function logApiError(error: Error | unknown, request: Request, context?: Record<string, any>): void;
export type { ErrorContext, ErrorLogEntry };
