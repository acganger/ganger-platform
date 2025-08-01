/**
 * Error tracking module - now using Vercel's free logging
 * This module maintains the same API as the previous Sentry implementation
 * but routes all logging to Vercel logs instead
 */
import { User } from '@supabase/supabase-js';
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
export declare function initSentry(config: SentryConfig): void;
/**
 * Set user context for error tracking
 */
export declare function setSentryUser(user: User | null): void;
/**
 * Capture custom errors with context
 */
export declare function captureError(error: Error, context?: Record<string, any>): void;
/**
 * Capture messages with level
 */
export declare function captureMessage(message: string, level?: 'fatal' | 'error' | 'warning' | 'info', context?: Record<string, any>): void;
/**
 * Track custom events
 */
export declare function trackEvent(eventName: string, data?: Record<string, any>): void;
/**
 * Performance monitoring
 */
export declare function startTransaction(name: string, op: string): {
    finish: () => void;
    setData: (key: string, value: any) => void;
};
/**
 * Export a mock Sentry object for compatibility
 * This allows code using Sentry.* methods to continue working
 */
export declare const Sentry: {
    init: typeof initSentry;
    setUser: typeof setSentryUser;
    captureException: typeof captureError;
    captureMessage: (msg: string, level?: any) => void;
    addBreadcrumb: (breadcrumb: {
        message?: string;
        category?: string;
        data?: any;
    }) => void;
    startTransaction: typeof startTransaction;
    configureScope: (callback: (scope: any) => void) => void;
    withScope: (callback: (scope: any) => void) => void;
    getCurrentHub: () => {
        getClient: () => null;
        captureException: typeof captureError;
        captureMessage: typeof captureMessage;
    };
};
export {};
