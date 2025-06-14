/**
 * Comprehensive analytics and monitoring system for Compliance Training Frontend
 * 
 * This module provides enterprise-grade analytics, user behavior tracking,
 * business intelligence, and compliance reporting capabilities.
 */

// Analytics event types
export interface AnalyticsEvent {
  eventName: string;
  eventCategory: 'user_interaction' | 'compliance' | 'performance' | 'error' | 'business';
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  userRole?: string;
  location?: string;
  department?: string;
}

export interface ComplianceAnalytics {
  totalEmployees: number;
  totalTrainings: number;
  overallComplianceRate: number;
  overdueCount: number;
  dueSoonCount: number;
  completionsThisMonth: number;
  averageCompletionTime: number; // minutes
  topPerformingDepartments: Array<{ department: string; rate: number }>;
  riskAreas: Array<{ area: string; riskLevel: 'low' | 'medium' | 'high'; description: string }>;
  trends: {
    complianceRateChange: number; // percentage change from last period
    completionVelocity: number; // completions per day
    upcomingExpirations: number; // next 30 days
  };
}

export interface UserBehaviorMetrics {
  sessionDuration: number;
  pageViews: number;
  clickThroughRate: number;
  bounceRate: number;
  searchQueries: string[];
  mostUsedFeatures: Array<{ feature: string; usage: number }>;
  errorEncounters: number;
  helpSectionViews: number;
}

export interface BusinessIntelligence {
  costPerCompletion: number;
  timeToCompliance: number; // average days from hire to full compliance
  trainingEffectiveness: Array<{
    trainingId: string;
    completionRate: number;
    averageScore: number;
    retentionRate: number; // percentage who remain compliant after 1 year
  }>;
  departmentPerformance: Array<{
    department: string;
    efficiency: number;
    resourceUtilization: number;
    complianceScore: number;
  }>;
  predictiveInsights: {
    riskOfNonCompliance: Array<{ employeeId: string; riskScore: number; factors: string[] }>;
    optimalTrainingSchedule: Array<{ trainingId: string; recommendedFrequency: number }>;
    resourceNeeds: { additionalStaff: number; trainingBudget: number };
  };
}

/**
 * Enterprise analytics service with comprehensive tracking and reporting
 */
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private userRole?: string;
  private location?: string;
  private department?: string;
  private sessionStartTime: number;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.setupUserContext();
    this.startPeriodicReporting();
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupUserContext(): void {
    // In a real app, this would come from authentication context
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_context');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.userId = user.id;
          this.userRole = user.role;
          this.location = user.location;
          this.department = user.department;
        } catch (e) {
        }
      }
    }
  }

  /**
   * Track a custom event
   */
  public track(
    eventName: string,
    eventCategory: AnalyticsEvent['eventCategory'],
    properties: Record<string, any> = {}
  ): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      eventName,
      eventCategory,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      userRole: this.userRole,
      location: this.location,
      department: this.department
    };

    this.events.push(event);
    this.sendToAnalyticsService(event);
  }

  /**
   * Track user interactions
   */
  public trackUserInteraction(action: string, target: string, properties: Record<string, any> = {}): void {
    this.track(`user_${action}`, 'user_interaction', {
      target,
      ...properties
    });
  }

  /**
   * Track compliance-related events
   */
  public trackComplianceEvent(
    action: 'training_started' | 'training_completed' | 'training_expired' | 'compliance_check',
    properties: Record<string, any> = {}
  ): void {
    this.track(`compliance_${action}`, 'compliance', properties);
  }

  /**
   * Track business events
   */
  public trackBusinessEvent(
    event: 'export_generated' | 'report_viewed' | 'filter_applied' | 'search_performed',
    properties: Record<string, any> = {}
  ): void {
    this.track(`business_${event}`, 'business', properties);
  }

  /**
   * Track error events
   */
  public trackError(
    error: Error | string,
    context: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    properties: Record<string, any> = {}
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' && error.stack ? error.stack : undefined;

    this.track('error_encountered', 'error', {
      message: errorMessage,
      stack: errorStack,
      context,
      severity,
      ...properties
    });
  }

  /**
   * Generate compliance analytics report
   */
  public generateComplianceAnalytics(
    employees: any[],
    trainings: any[],
    completions: any[]
  ): ComplianceAnalytics {
    const totalEmployees = employees.length;
    const totalTrainings = trainings.length;
    
    // Calculate compliance rate
    const requiredTrainings = trainings.filter(t => t.isRequired);
    const totalRequired = totalEmployees * requiredTrainings.length;
    const completed = completions.filter(c => c.status === 'completed').length;
    const overallComplianceRate = totalRequired > 0 ? (completed / totalRequired) * 100 : 100;
    
    const overdueCount = completions.filter(c => c.status === 'overdue').length;
    const dueSoonCount = completions.filter(c => c.status === 'due_soon').length;
    
    // Completions this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const completionsThisMonth = completions.filter(c => 
      new Date(c.completedAt) >= thisMonth && c.status === 'completed'
    ).length;
    
    // Average completion time (mock calculation)
    const averageCompletionTime = trainings.reduce((acc, t) => acc + t.durationMinutes, 0) / trainings.length || 0;
    
    // Department performance
    const departmentStats = new Map();
    employees.forEach(emp => {
      if (!departmentStats.has(emp.department)) {
        departmentStats.set(emp.department, { total: 0, compliant: 0 });
      }
      const stats = departmentStats.get(emp.department);
      stats.total++;
      
      const empCompletions = completions.filter(c => c.employeeId === emp.id && c.status === 'completed');
      if (empCompletions.length === requiredTrainings.length) {
        stats.compliant++;
      }
    });
    
    const topPerformingDepartments = Array.from(departmentStats.entries())
      .map(([department, stats]) => ({
        department,
        rate: stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
    
    // Risk assessment
    const riskAreas = this.assessRiskAreas(employees, trainings, completions);
    
    // Trends (mock calculations - in real app, compare with historical data)
    const trends = {
      complianceRateChange: Math.random() * 10 - 5, // -5% to +5%
      completionVelocity: completionsThisMonth / 30, // per day
      upcomingExpirations: completions.filter(c => {
        const expiryDate = new Date(c.expiresAt);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
      }).length
    };

    return {
      totalEmployees,
      totalTrainings,
      overallComplianceRate: Math.round(overallComplianceRate),
      overdueCount,
      dueSoonCount,
      completionsThisMonth,
      averageCompletionTime: Math.round(averageCompletionTime),
      topPerformingDepartments,
      riskAreas,
      trends
    };
  }

  /**
   * Generate user behavior metrics
   */
  public generateUserBehaviorMetrics(): UserBehaviorMetrics {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const userEvents = this.events.filter(e => e.eventCategory === 'user_interaction');
    
    const pageViews = userEvents.filter(e => e.eventName === 'user_page_view').length;
    const clicks = userEvents.filter(e => e.eventName === 'user_click').length;
    const searches = userEvents.filter(e => e.eventName === 'user_search');
    
    const clickThroughRate = pageViews > 0 ? (clicks / pageViews) * 100 : 0;
    const bounceRate = pageViews <= 1 ? 100 : 0; // Simplified calculation
    
    const searchQueries = searches.map(e => e.properties.query).filter(Boolean);
    
    const featureUsage = new Map();
    userEvents.forEach(e => {
      const feature = e.properties.feature || e.properties.target || 'unknown';
      featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
    });
    
    const mostUsedFeatures = Array.from(featureUsage.entries())
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
    
    const errorEvents = this.events.filter(e => e.eventCategory === 'error');
    const helpViews = userEvents.filter(e => e.eventName.includes('help')).length;

    return {
      sessionDuration,
      pageViews,
      clickThroughRate: Math.round(clickThroughRate),
      bounceRate: Math.round(bounceRate),
      searchQueries,
      mostUsedFeatures,
      errorEncounters: errorEvents.length,
      helpSectionViews: helpViews
    };
  }

  /**
   * Generate business intelligence insights
   */
  public generateBusinessIntelligence(
    employees: any[],
    trainings: any[],
    completions: any[]
  ): BusinessIntelligence {
    // Cost per completion (estimated)
    const costPerCompletion = 150; // Base cost estimate
    
    // Time to compliance (average days from hire to full compliance)
    const timeToCompliance = this.calculateTimeToCompliance(employees, completions);
    
    // Training effectiveness
    const trainingEffectiveness = trainings.map(training => {
      const trainingCompletions = completions.filter(c => c.trainingId === training.id);
      const completed = trainingCompletions.filter(c => c.status === 'completed');
      const completionRate = trainingCompletions.length > 0 ? 
        (completed.length / trainingCompletions.length) * 100 : 0;
      
      const averageScore = completed.length > 0 ?
        completed.reduce((acc, c) => acc + (c.score || 0), 0) / completed.length : 0;
      
      const retentionRate = Math.random() * 20 + 80; // Mock: 80-100%
      
      return {
        trainingId: training.id,
        completionRate: Math.round(completionRate),
        averageScore: Math.round(averageScore),
        retentionRate: Math.round(retentionRate)
      };
    });
    
    // Department performance metrics
    const departmentPerformance = this.calculateDepartmentPerformance(employees, completions);
    
    // Predictive insights
    const predictiveInsights = this.generatePredictiveInsights(employees, trainings, completions);

    return {
      costPerCompletion,
      timeToCompliance,
      trainingEffectiveness,
      departmentPerformance,
      predictiveInsights
    };
  }

  /**
   * Export analytics data
   */
  public exportAnalyticsData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.convertToCSV(this.events);
    }
    
    return JSON.stringify({
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      eventCount: this.events.length,
      events: this.events
    }, null, 2);
  }

  /**
   * Clear analytics data (GDPR compliance)
   */
  public clearData(): void {
    this.events = [];
  }

  /**
   * Enable/disable analytics tracking
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  private assessRiskAreas(employees: any[], trainings: any[], completions: any[]): ComplianceAnalytics['riskAreas'] {
    const riskAreas = [];
    
    // Check for high overdue rates
    const overdueRate = completions.filter(c => c.status === 'overdue').length / completions.length;
    if (overdueRate > 0.1) {
      riskAreas.push({
        area: 'Overdue Trainings',
        riskLevel: (overdueRate > 0.2 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
        description: `${Math.round(overdueRate * 100)}% of training completions are overdue`
      });
    }
    
    // Check for departments with low compliance
    const departmentStats = new Map();
    employees.forEach(emp => {
      if (!departmentStats.has(emp.department)) {
        departmentStats.set(emp.department, { total: 0, compliant: 0 });
      }
      const stats = departmentStats.get(emp.department);
      stats.total++;
      
      const empCompletions = completions.filter(c => c.employeeId === emp.id && c.status === 'completed');
      const requiredTrainings = trainings.filter(t => t.isRequired);
      if (empCompletions.length === requiredTrainings.length) {
        stats.compliant++;
      }
    });
    
    Array.from(departmentStats.entries()).forEach(([department, stats]) => {
      const rate = stats.total > 0 ? stats.compliant / stats.total : 0;
      if (rate < 0.8) {
        riskAreas.push({
          area: `${department} Department`,
          riskLevel: (rate < 0.6 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
          description: `Only ${Math.round(rate * 100)}% compliance rate`
        });
      }
    });
    
    return riskAreas;
  }

  private calculateTimeToCompliance(employees: any[], completions: any[]): number {
    // Calculate average days from hire date to full compliance
    let totalDays = 0;
    let count = 0;
    
    employees.forEach(emp => {
      const empCompletions = completions.filter(c => c.employeeId === emp.id && c.status === 'completed');
      if (empCompletions.length > 0) {
        const latestCompletion = empCompletions.reduce((latest, c) => 
          new Date(c.completedAt) > new Date(latest.completedAt) ? c : latest
        );
        
        const hireDate = new Date(emp.hireDate);
        const complianceDate = new Date(latestCompletion.completedAt);
        const days = (complianceDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24);
        
        totalDays += days;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalDays / count) : 0;
  }

  private calculateDepartmentPerformance(employees: any[], completions: any[]): BusinessIntelligence['departmentPerformance'] {
    const departments = Array.from(new Set(employees.map(e => e.department)));
    
    return departments.map(department => {
      const deptEmployees = employees.filter(e => e.department === department);
      const deptCompletions = completions.filter(c => 
        deptEmployees.some(e => e.id === c.employeeId)
      );
      
      const completedCount = deptCompletions.filter(c => c.status === 'completed').length;
      const efficiency = deptCompletions.length > 0 ? (completedCount / deptCompletions.length) * 100 : 0;
      
      // Mock calculations for resource utilization and compliance score
      const resourceUtilization = Math.random() * 30 + 70; // 70-100%
      const complianceScore = Math.random() * 20 + 80; // 80-100%
      
      return {
        department,
        efficiency: Math.round(efficiency),
        resourceUtilization: Math.round(resourceUtilization),
        complianceScore: Math.round(complianceScore)
      };
    });
  }

  private generatePredictiveInsights(employees: any[], trainings: any[], completions: any[]): BusinessIntelligence['predictiveInsights'] {
    // Risk of non-compliance (simplified ML-like scoring)
    const riskOfNonCompliance = employees.map(emp => {
      const empCompletions = completions.filter(c => c.employeeId === emp.id);
      const overdueCount = empCompletions.filter(c => c.status === 'overdue').length;
      const dueSoonCount = empCompletions.filter(c => c.status === 'due_soon').length;
      
      let riskScore = 0;
      const factors = [];
      
      if (overdueCount > 0) {
        riskScore += overdueCount * 30;
        factors.push(`${overdueCount} overdue training(s)`);
      }
      
      if (dueSoonCount > 2) {
        riskScore += dueSoonCount * 10;
        factors.push(`${dueSoonCount} trainings due soon`);
      }
      
      // Time since hire factor
      const daysSinceHire = (Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceHire > 90 && empCompletions.length === 0) {
        riskScore += 40;
        factors.push('No completions after 90+ days');
      }
      
      return {
        employeeId: emp.id,
        riskScore: Math.min(riskScore, 100),
        factors
      };
    }).filter(risk => risk.riskScore > 20).sort((a, b) => b.riskScore - a.riskScore);
    
    // Optimal training schedule
    const optimalTrainingSchedule = trainings.map(training => ({
      trainingId: training.id,
      recommendedFrequency: training.validityPeriodDays || 365
    }));
    
    // Resource needs (mock calculations)
    const resourceNeeds = {
      additionalStaff: Math.max(0, Math.floor((employees.length - 50) / 25)),
      trainingBudget: employees.length * 200 // $200 per employee per year
    };
    
    return {
      riskOfNonCompliance,
      optimalTrainingSchedule,
      resourceNeeds
    };
  }

  private convertToCSV(events: AnalyticsEvent[]): string {
    if (events.length === 0) return '';
    
    const headers = ['timestamp', 'eventName', 'eventCategory', 'userId', 'sessionId', 'properties'];
    const rows = events.map(event => [
      new Date(event.timestamp).toISOString(),
      event.eventName,
      event.eventCategory,
      event.userId || '',
      event.sessionId,
      JSON.stringify(event.properties)
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  private sendToAnalyticsService(event: AnalyticsEvent): void {
    // In production, send to analytics service (Google Analytics, Mixpanel, etc.)
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to custom analytics endpoint
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        }).catch(() => {
          // Silent fail for analytics
        });
      } catch (e) {
        // Silent fail
      }
    }
  }

  private startPeriodicReporting(): void {
    // Send batch reports every 5 minutes
    setInterval(() => {
      if (this.events.length > 0) {
        this.sendBatchReport();
      }
    }, 5 * 60 * 1000);
  }

  private sendBatchReport(): void {
    if (process.env.NODE_ENV === 'production') {
      try {
        const report = {
          sessionId: this.sessionId,
          timestamp: Date.now(),
          eventCount: this.events.length,
          events: this.events.slice(-100) // Send last 100 events
        };
        
        fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        }).catch(() => {
          // Silent fail for batch analytics
        });
      } catch (e) {
        // Silent fail
      }
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsService();

// React hook for component-level analytics
export function useAnalytics(componentName: string) {
  const trackComponentEvent = (action: string, properties: Record<string, any> = {}) => {
    analytics.trackUserInteraction(action, componentName, {
      component: componentName,
      ...properties
    });
  };

  const trackComponentMount = () => {
    analytics.track(`${componentName}_mounted`, 'user_interaction', {
      component: componentName
    });
  };

  const trackComponentError = (error: Error | string, properties: Record<string, any> = {}) => {
    analytics.trackError(error, componentName, 'medium', {
      component: componentName,
      ...properties
    });
  };

  return {
    trackEvent: trackComponentEvent,
    trackMount: trackComponentMount,
    trackError: trackComponentError,
    trackClick: (target: string, properties?: Record<string, any>) => 
      trackComponentEvent('click', { target, ...properties }),
    trackSearch: (query: string, results: number) => 
      trackComponentEvent('search', { query, resultCount: results }),
    trackExport: (format: string, recordCount: number) => 
      trackComponentEvent('export', { format, recordCount })
  };
}

// Auto-start analytics in browser
if (typeof window !== 'undefined') {
  analytics.track('session_started', 'user_interaction', {
    timestamp: Date.now(),
    url: window.location.href
  });
}