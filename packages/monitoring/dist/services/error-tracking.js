"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorTracking = void 0;
exports.logErrorToService = logErrorToService;
exports.measureApiCall = measureApiCall;
exports.measurePageLoad = measurePageLoad;
const auth_1 = require("@ganger/auth");
class ErrorTrackingService {
    constructor() {
        this.queue = [];
        this.flushInterval = null;
        this.maxQueueSize = 50;
        this.flushIntervalMs = 30000; // 30 seconds
        // Start flush interval
        if (typeof window !== 'undefined') {
            this.startFlushInterval();
            // Flush on page unload
            window.addEventListener('beforeunload', () => {
                this.flush();
            });
        }
    }
    startFlushInterval() {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.flushIntervalMs);
    }
    async trackError(error, metadata) {
        const errorEvent = {
            message: error instanceof Error ? error.message : error.message,
            stack: error instanceof Error ? error.stack : error.stack,
            componentStack: error instanceof Error ? undefined : error.componentStack,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            metadata
        };
        // Add user ID if available
        if (typeof window !== 'undefined') {
            try {
                const supabase = (0, auth_1.getSupabaseClient)();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    errorEvent.userId = user.id;
                }
            }
            catch (err) {
                console.error('Failed to get user for error tracking:', err);
            }
        }
        this.queue.push(errorEvent);
        // Flush if queue is full
        if (this.queue.length >= this.maxQueueSize) {
            this.flush();
        }
    }
    async flush() {
        if (this.queue.length === 0)
            return;
        const errors = [...this.queue];
        this.queue = [];
        try {
            const response = await fetch('/api/monitoring/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ errors })
            });
            if (!response.ok) {
                console.error('Failed to send errors to monitoring service');
                // Put errors back in queue for retry
                this.queue.unshift(...errors);
            }
        }
        catch (err) {
            console.error('Error tracking service error:', err);
            // Put errors back in queue for retry
            this.queue.unshift(...errors);
        }
    }
    // Track custom events
    async trackEvent(eventName, properties) {
        const event = {
            name: eventName,
            properties,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : ''
        };
        try {
            await fetch('/api/monitoring/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
        }
        catch (err) {
            console.error('Failed to track event:', err);
        }
    }
    // Track performance metrics
    async trackPerformance(metric) {
        try {
            await fetch('/api/monitoring/performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metric)
            });
        }
        catch (err) {
            console.error('Failed to track performance metric:', err);
        }
    }
    destroy() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        this.flush();
    }
}
// Singleton instance
exports.errorTracking = new ErrorTrackingService();
// React Error Boundary integration
function logErrorToService(error, errorInfo) {
    exports.errorTracking.trackError({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    });
}
// Performance monitoring helpers
function measureApiCall(endpoint, duration, status) {
    exports.errorTracking.trackPerformance({
        name: 'api_call_duration',
        value: duration,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        tags: {
            endpoint,
            status: status.toString(),
            success: (status >= 200 && status < 300).toString()
        }
    });
}
function measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
        const ttfb = perfData.responseStart - perfData.navigationStart;
        exports.errorTracking.trackPerformance({
            name: 'page_load_time',
            value: pageLoadTime,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: {
                page: window.location.pathname
            }
        });
        exports.errorTracking.trackPerformance({
            name: 'dom_ready_time',
            value: domReadyTime,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: {
                page: window.location.pathname
            }
        });
        exports.errorTracking.trackPerformance({
            name: 'time_to_first_byte',
            value: ttfb,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            tags: {
                page: window.location.pathname
            }
        });
    }
}
//# sourceMappingURL=error-tracking.js.map