/**
 * Analytics event tracking utilities for the Ganger Platform
 * Provides client-side event tracking, session management, and performance monitoring
 */
class AnalyticsTracker {
    constructor() {
        this.events = [];
        this.currentSession = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        if (typeof window !== 'undefined') {
            this.initSession();
            this.setupActivityTracking();
        }
    }
    initSession() {
        const sessionId = this.generateSessionId();
        this.currentSession = {
            sessionId,
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            pageViews: 0,
            events: [],
        };
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    setupActivityTracking() {
        if (typeof window === 'undefined')
            return;
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track('page_hidden', 'navigation');
            }
            else {
                this.track('page_visible', 'navigation');
                this.updateLastActivity();
            }
        });
        // Track user interactions
        ['click', 'keydown', 'scroll', 'mousemove'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.updateLastActivity();
            }, { passive: true });
        });
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.track('page_unload', 'navigation');
            this.flush();
        });
    }
    updateLastActivity() {
        if (this.currentSession) {
            this.currentSession.lastActivity = new Date().toISOString();
        }
    }
    isSessionExpired() {
        if (!this.currentSession)
            return true;
        const lastActivity = new Date(this.currentSession.lastActivity);
        const now = new Date();
        return (now.getTime() - lastActivity.getTime()) > this.sessionTimeout;
    }
    init(config) {
        if (this.currentSession) {
            this.currentSession.userId = config.userId;
        }
        this.track('app_init', 'system', {
            app: config.app,
            version: config.version,
        });
    }
    setUserId(userId) {
        if (this.currentSession) {
            this.currentSession.userId = userId;
        }
    }
    track(eventName, category, properties) {
        if (this.isSessionExpired()) {
            this.initSession();
        }
        const event = {
            name: eventName,
            category,
            properties,
            userId: this.currentSession?.userId,
            sessionId: this.currentSession?.sessionId,
            timestamp: new Date().toISOString(),
        };
        this.events.push(event);
        if (this.currentSession) {
            this.currentSession.events.push(event);
        }
        // Auto-flush events when buffer gets large
        if (this.events.length >= 50) {
            this.flush();
        }
    }
    // Page tracking
    trackPageView(path, title) {
        if (this.currentSession) {
            this.currentSession.pageViews++;
        }
        this.track('page_view', 'navigation', {
            path,
            title: title || document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        });
    }
    // User interaction tracking
    trackClick(element, properties) {
        this.track('click', 'interaction', {
            element,
            ...properties,
        });
    }
    trackFormSubmit(formName, properties) {
        this.track('form_submit', 'interaction', {
            formName,
            ...properties,
        });
    }
    trackSearch(query, resultsCount, filters) {
        this.track('search', 'interaction', {
            query,
            resultsCount,
            filters,
        });
    }
    // Business-specific tracking
    trackPatientLookup(searchMethod, found) {
        this.track('patient_lookup', 'medical', {
            searchMethod,
            found,
        });
    }
    trackHandoutGeneration(templateId, patientId, deliveryMethod) {
        this.track('handout_generated', 'medical', {
            templateId,
            patientId,
            deliveryMethod,
        });
    }
    trackInventoryScan(method, itemFound, sku) {
        this.track('inventory_scan', 'inventory', {
            method,
            itemFound,
            sku,
        });
    }
    trackAppointmentScheduled(appointmentType, provider, duration) {
        this.track('appointment_scheduled', 'scheduling', {
            appointmentType,
            provider,
            duration,
        });
    }
    trackError(error, context) {
        this.track('error', 'system', {
            error,
            context,
            url: window.location.href,
            userAgent: navigator.userAgent,
        });
    }
    trackPerformance(metric, value, unit) {
        this.track('performance', 'system', {
            metric,
            value,
            unit,
        });
    }
    // Get analytics data
    getEvents() {
        return [...this.events];
    }
    getCurrentSession() {
        return this.currentSession;
    }
    getSessionSummary() {
        if (!this.currentSession)
            return {};
        const sessionDuration = new Date().getTime() - new Date(this.currentSession.startTime).getTime();
        const eventsByCategory = this.currentSession.events.reduce((acc, event) => {
            acc[event.category] = (acc[event.category] || 0) + 1;
            return acc;
        }, {});
        return {
            sessionId: this.currentSession.sessionId,
            userId: this.currentSession.userId,
            duration: sessionDuration,
            pageViews: this.currentSession.pageViews,
            totalEvents: this.currentSession.events.length,
            eventsByCategory,
            startTime: this.currentSession.startTime,
            lastActivity: this.currentSession.lastActivity,
        };
    }
    // Send events to analytics service
    async flush() {
        if (this.events.length === 0)
            return;
        const eventsToSend = [...this.events];
        this.events = [];
        try {
            // In a real implementation, you would send to your analytics service
            // await this.sendToAnalyticsService(eventsToSend);
            console.log('Analytics events:', eventsToSend);
        }
        catch (error) {
            console.error('Failed to send analytics events:', error);
            // Re-add events back to queue on failure
            this.events.unshift(...eventsToSend);
        }
    }
    // Clear all data
    clear() {
        this.events = [];
        this.currentSession = null;
    }
}
/**
 * Singleton analytics tracker instance
 * @example
 * import { analytics } from '@ganger/utils';
 * analytics.trackPageView('/inventory');
 */
export const analytics = new AnalyticsTracker();
/**
 * Tracks a custom analytics event
 * @param name - Event name (e.g., 'button_click', 'form_submit')
 * @param category - Event category (e.g., 'interaction', 'navigation')
 * @param properties - Optional event properties
 * @example
 * trackEvent('save_button_click', 'interaction', {
 *   formName: 'patient_registration',
 *   formValid: true
 * });
 */
export const trackEvent = (name, category, properties) => {
    analytics.track(name, category, properties);
};
/**
 * Tracks a page view event
 * @param path - Page path (e.g., '/inventory', '/handouts')
 * @param title - Optional page title (defaults to document.title)
 * @example
 * trackPageView('/inventory', 'Inventory Management');
 */
export const trackPageView = (path, title) => {
    analytics.trackPageView(path, title);
};
/**
 * Tracks an error event for monitoring
 * @param error - Error message or description
 * @param context - Optional context about where/why the error occurred
 * @example
 * trackError('Failed to load patient data', {
 *   endpoint: '/api/patients',
 *   status: 500
 * });
 */
export const trackError = (error, context) => {
    analytics.trackError(error, context);
};
/**
 * Sets the user ID for all subsequent analytics events
 * @param userId - User identifier (e.g., email, staff ID)
 * @example
 * setUserId('john.doe@gangerdermatology.com');
 */
export const setUserId = (userId) => {
    analytics.setUserId(userId);
};
/**
 * Measures and tracks the performance of an async operation
 * @param name - Name of the operation being measured
 * @param fn - Async function to measure
 * @returns Result of the async function
 * @example
 * const data = await measurePerformance('fetch_patient_data', async () => {
 *   return await fetch('/api/patients/123').then(r => r.json());
 * });
 * // Automatically tracks duration in analytics
 */
export const measurePerformance = async (name, fn) => {
    const start = performance.now();
    try {
        const result = await fn();
        const duration = performance.now() - start;
        analytics.trackPerformance(name, duration, 'ms');
        return result;
    }
    catch (error) {
        const duration = performance.now() - start;
        analytics.trackPerformance(`${name}_error`, duration, 'ms');
        throw error;
    }
};
/**
 * React hook for accessing analytics functions
 * @returns Object with all analytics methods
 * @example
 * function MyComponent() {
 *   const { track, trackPageView } = useAnalytics();
 *
 *   useEffect(() => {
 *     trackPageView('/my-page');
 *   }, []);
 *
 *   const handleClick = () => {
 *     track('button_click', 'interaction', { buttonId: 'save' });
 *   };
 * }
 */
export const useAnalytics = () => {
    return {
        track: trackEvent,
        trackPageView,
        trackError,
        setUserId,
        measurePerformance,
        getEvents: () => analytics.getEvents(),
        getCurrentSession: () => analytics.getCurrentSession(),
        getSessionSummary: () => analytics.getSessionSummary(),
        flush: () => analytics.flush(),
    };
};
