/**
 * Analytics event tracking utilities for the Ganger Platform
 * Provides client-side event tracking, session management, and performance monitoring
 */
export interface AnalyticsEvent {
    name: string;
    category: string;
    properties?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    timestamp?: string;
}
export interface UserSession {
    sessionId: string;
    userId?: string;
    startTime: string;
    lastActivity: string;
    pageViews: number;
    events: AnalyticsEvent[];
}
declare class AnalyticsTracker {
    private events;
    private currentSession;
    private sessionTimeout;
    constructor();
    private initSession;
    private generateSessionId;
    private setupActivityTracking;
    private updateLastActivity;
    private isSessionExpired;
    init(config: {
        app: string;
        version: string;
        userId?: string;
    }): void;
    setUserId(userId: string): void;
    track(eventName: string, category: string, properties?: Record<string, any>): void;
    trackPageView(path: string, title?: string): void;
    trackClick(element: string, properties?: Record<string, any>): void;
    trackFormSubmit(formName: string, properties?: Record<string, any>): void;
    trackSearch(query: string, resultsCount?: number, filters?: Record<string, any>): void;
    trackPatientLookup(searchMethod: 'mrn' | 'name' | 'dob' | 'qr_code', found: boolean): void;
    trackHandoutGeneration(templateId: string, patientId: string, deliveryMethod: 'print' | 'email' | 'sms'): void;
    trackInventoryScan(method: 'barcode' | 'manual', itemFound: boolean, sku?: string): void;
    trackAppointmentScheduled(appointmentType: string, provider: string, duration: number): void;
    trackError(error: string, context?: Record<string, any>): void;
    trackPerformance(metric: string, value: number, unit: string): void;
    getEvents(): AnalyticsEvent[];
    getCurrentSession(): UserSession | null;
    getSessionSummary(): Record<string, any>;
    flush(): Promise<void>;
    clear(): void;
}
/**
 * Singleton analytics tracker instance
 * @example
 * import { analytics } from '@ganger/utils';
 * analytics.trackPageView('/inventory');
 */
export declare const analytics: AnalyticsTracker;
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
export declare const trackEvent: (name: string, category: string, properties?: Record<string, any>) => void;
/**
 * Tracks a page view event
 * @param path - Page path (e.g., '/inventory', '/handouts')
 * @param title - Optional page title (defaults to document.title)
 * @example
 * trackPageView('/inventory', 'Inventory Management');
 */
export declare const trackPageView: (path: string, title?: string) => void;
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
export declare const trackError: (error: string, context?: Record<string, any>) => void;
/**
 * Sets the user ID for all subsequent analytics events
 * @param userId - User identifier (e.g., email, staff ID)
 * @example
 * setUserId('john.doe@gangerdermatology.com');
 */
export declare const setUserId: (userId: string) => void;
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
export declare const measurePerformance: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
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
export declare const useAnalytics: () => {
    track: (name: string, category: string, properties?: Record<string, any>) => void;
    trackPageView: (path: string, title?: string) => void;
    trackError: (error: string, context?: Record<string, any>) => void;
    setUserId: (userId: string) => void;
    measurePerformance: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
    getEvents: () => AnalyticsEvent[];
    getCurrentSession: () => UserSession | null;
    getSessionSummary: () => Record<string, any>;
    flush: () => Promise<void>;
};
export {};
