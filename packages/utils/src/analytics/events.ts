// Analytics event tracking utilities

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

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private currentSession: UserSession | null = null;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSession();
      this.setupActivityTracking();
    }
  }

  private initSession() {
    const sessionId = this.generateSessionId();
    this.currentSession = {
      sessionId,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      pageViews: 0,
      events: [],
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupActivityTracking() {
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', 'navigation');
      } else {
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

  private updateLastActivity() {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date().toISOString();
    }
  }

  private isSessionExpired(): boolean {
    if (!this.currentSession) return true;
    
    const lastActivity = new Date(this.currentSession.lastActivity);
    const now = new Date();
    return (now.getTime() - lastActivity.getTime()) > this.sessionTimeout;
  }

  init(config: { app: string; version: string; userId?: string }) {
    if (this.currentSession) {
      this.currentSession.userId = config.userId;
    }
    
    this.track('app_init', 'system', {
      app: config.app,
      version: config.version,
    });
  }

  setUserId(userId: string) {
    if (this.currentSession) {
      this.currentSession.userId = userId;
    }
  }

  track(eventName: string, category: string, properties?: Record<string, any>) {
    if (this.isSessionExpired()) {
      this.initSession();
    }

    const event: AnalyticsEvent = {
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
  trackPageView(path: string, title?: string) {
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
  trackClick(element: string, properties?: Record<string, any>) {
    this.track('click', 'interaction', {
      element,
      ...properties,
    });
  }

  trackFormSubmit(formName: string, properties?: Record<string, any>) {
    this.track('form_submit', 'interaction', {
      formName,
      ...properties,
    });
  }

  trackSearch(query: string, resultsCount?: number, filters?: Record<string, any>) {
    this.track('search', 'interaction', {
      query,
      resultsCount,
      filters,
    });
  }

  // Business-specific tracking
  trackPatientLookup(searchMethod: 'mrn' | 'name' | 'dob' | 'qr_code', found: boolean) {
    this.track('patient_lookup', 'medical', {
      searchMethod,
      found,
    });
  }

  trackHandoutGeneration(templateId: string, patientId: string, deliveryMethod: 'print' | 'email' | 'sms') {
    this.track('handout_generated', 'medical', {
      templateId,
      patientId,
      deliveryMethod,
    });
  }

  trackInventoryScan(method: 'barcode' | 'manual', itemFound: boolean, sku?: string) {
    this.track('inventory_scan', 'inventory', {
      method,
      itemFound,
      sku,
    });
  }

  trackAppointmentScheduled(appointmentType: string, provider: string, duration: number) {
    this.track('appointment_scheduled', 'scheduling', {
      appointmentType,
      provider,
      duration,
    });
  }

  trackError(error: string, context?: Record<string, any>) {
    this.track('error', 'system', {
      error,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  trackPerformance(metric: string, value: number, unit: string) {
    this.track('performance', 'system', {
      metric,
      value,
      unit,
    });
  }

  // Get analytics data
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  getSessionSummary(): Record<string, any> {
    if (!this.currentSession) return {};

    const sessionDuration = new Date().getTime() - new Date(this.currentSession.startTime).getTime();
    const eventsByCategory = this.currentSession.events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // In a real implementation, you would send to your analytics service
      // await this.sendToAnalyticsService(eventsToSend);
      console.log('Analytics events:', eventsToSend);
    } catch (error) {
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

// Singleton instance
export const analytics = new AnalyticsTracker();

// Convenience functions
export const trackEvent = (name: string, category: string, properties?: Record<string, any>) => {
  analytics.track(name, category, properties);
};

export const trackPageView = (path: string, title?: string) => {
  analytics.trackPageView(path, title);
};

export const trackError = (error: string, context?: Record<string, any>) => {
  analytics.trackError(error, context);
};

export const setUserId = (userId: string) => {
  analytics.setUserId(userId);
};

// Performance tracking helpers
export const measurePerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    analytics.trackPerformance(name, duration, 'ms');
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    analytics.trackPerformance(`${name}_error`, duration, 'ms');
    throw error;
  }
};

// React Hook for analytics
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