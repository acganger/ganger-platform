/**
 * Error tracking module - now using Vercel's free logging
 * This module maintains the same API as the previous Sentry implementation
 * but routes all logging to Vercel logs instead
 */
/**
 * Initialize error tracking (no-op for Vercel logging)
 * Kept for backwards compatibility
 */
export function initSentry(config) {
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
export function setSentryUser(user) {
    if (user && process.env.NODE_ENV === 'development') {
        console.log(`[ErrorTracking] User context set: ${user.id}`);
    }
}
/**
 * Capture custom errors with context
 */
export function captureError(error, context) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    if (process.env.NODE_ENV === 'development') {
        console.error(`🚨 [ErrorTracking] ${errorMessage}`, context || '', errorStack || '');
    }
    else {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: errorMessage,
            stack: errorStack,
            context,
            environment: process.env.NODE_ENV || 'development',
        }));
    }
}
/**
 * Capture messages with level
 */
export function captureMessage(message, level = 'info', context) {
    const levelMap = {
        fatal: 'error',
        error: 'error',
        warning: 'warn',
        info: 'log',
    };
    const method = levelMap[level];
    if (process.env.NODE_ENV === 'development') {
        const emoji = { error: '🚨', warn: '⚠️', log: 'ℹ️' }[method];
        console[method](`${emoji} [ErrorTracking] ${message}`, context || '');
    }
    else {
        console[method](JSON.stringify({
            timestamp: new Date().toISOString(),
            level: level === 'fatal' ? 'error' : level,
            message,
            context,
            environment: process.env.NODE_ENV || 'development',
        }));
    }
}
/**
 * Track custom events
 */
export function trackEvent(eventName, data) {
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERBOSE_LOGGING === 'true') {
        console.log(`📊 [ErrorTracking] Event: ${eventName}`, data || {});
    }
}
/**
 * Performance monitoring
 */
export function startTransaction(name, op) {
    const startTime = Date.now();
    const transactionData = {};
    return {
        setData: (key, value) => {
            transactionData[key] = value;
        },
        finish: () => {
            if (process.env.NODE_ENV === 'development') {
                const duration = Date.now() - startTime;
                console.log(`⏱️ [ErrorTracking] Transaction: ${name} (${op}) completed in ${duration}ms`, {
                    duration,
                    operation: op,
                    ...transactionData
                });
            }
        },
    };
}
/**
 * Export a mock Sentry object for compatibility
 * This allows code using Sentry.* methods to continue working
 */
export const Sentry = {
    init: initSentry,
    setUser: setSentryUser,
    captureException: captureError,
    captureMessage: (msg, level) => {
        const severity = typeof level === 'string' ? level : 'info';
        captureMessage(msg, severity);
    },
    addBreadcrumb: (breadcrumb) => {
        trackEvent(breadcrumb.message || breadcrumb.category || 'breadcrumb', breadcrumb.data);
    },
    startTransaction,
    configureScope: (callback) => {
        // No-op for compatibility
        callback({
            setTag: () => { },
            setContext: () => { },
            setUser: setSentryUser,
        });
    },
    withScope: (callback) => {
        // No-op for compatibility
        callback({
            setTag: () => { },
            setContext: () => { },
            setUser: setSentryUser,
        });
    },
    getCurrentHub: () => ({
        getClient: () => null,
        captureException: captureError,
        captureMessage,
    }),
};
//# sourceMappingURL=sentry.js.map