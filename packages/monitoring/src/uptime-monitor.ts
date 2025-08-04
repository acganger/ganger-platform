import { performanceMonitor } from './performance-monitor';
import { hipaaErrorTracker } from './hipaa-compliant-error-tracking';

export interface UptimeCheck {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus?: number;
  expectedText?: string;
  timeout: number;
  interval: number;
  retries: number;
  headers?: Record<string, string>;
  enabled: boolean;
  tags?: string[];
}

export interface UptimeCheckResult {
  checkId: string;
  checkName: string;
  timestamp: string;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  contentMatch?: boolean;
  retryCount: number;
}

export interface UptimeStats {
  checkId: string;
  checkName: string;
  uptime: number; // Percentage
  avgResponseTime: number;
  lastCheck: string;
  lastSuccess: string;
  lastFailure?: string;
  consecutiveFailures: number;
  totalChecks: number;
  successfulChecks: number;
  status: 'up' | 'down' | 'degraded';
  incidents: UptimeIncident[];
}

export interface UptimeIncident {
  id: string;
  checkId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  reason: string;
  resolved: boolean;
  severity: 'minor' | 'major' | 'critical';
}

export interface UptimeSummary {
  overallUptime: number;
  totalChecks: number;
  failedChecks: number;
  avgResponseTime: number;
  activeIncidents: number;
  checksByStatus: {
    up: number;
    down: number;
    degraded: number;
  };
  recentIncidents: UptimeIncident[];
}

// Default checks for Ganger Platform
const DEFAULT_CHECKS: UptimeCheck[] = [
  {
    id: 'main-app',
    name: 'Ganger Staff Platform',
    url: 'https://staff.gangerdermatology.com/api/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    interval: 60000, // 1 minute
    retries: 3,
    enabled: true,
    tags: ['critical', 'platform']
  },
  {
    id: 'inventory-app',
    name: 'Inventory Management',
    url: 'https://ganger-inventory.vercel.app/api/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    interval: 300000, // 5 minutes
    retries: 2,
    enabled: true,
    tags: ['app']
  },
  {
    id: 'kiosk-app',
    name: 'Check-in Kiosk',
    url: 'https://kiosk.gangerdermatology.com/api/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    interval: 300000, // 5 minutes
    retries: 2,
    enabled: true,
    tags: ['app', 'public']
  },
  {
    id: 'supabase-db',
    name: 'Supabase Database',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/',
    method: 'HEAD',
    expectedStatus: 200,
    timeout: 5000,
    interval: 60000, // 1 minute
    retries: 3,
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    },
    enabled: true,
    tags: ['critical', 'infrastructure']
  }
];

class UptimeMonitor {
  private checks: Map<string, UptimeCheck> = new Map();
  private checkResults: Map<string, UptimeCheckResult[]> = new Map();
  private checkStats: Map<string, UptimeStats> = new Map();
  private incidents: Map<string, UptimeIncident> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly maxResultsPerCheck = 1440; // 24 hours of minute checks
  
  constructor() {
    // Initialize with default checks
    DEFAULT_CHECKS.forEach(check => {
      this.addCheck(check);
    });
  }

  public addCheck(check: UptimeCheck): void {
    this.checks.set(check.id, check);
    
    // Initialize stats
    if (!this.checkStats.has(check.id)) {
      this.checkStats.set(check.id, {
        checkId: check.id,
        checkName: check.name,
        uptime: 100,
        avgResponseTime: 0,
        lastCheck: new Date().toISOString(),
        lastSuccess: new Date().toISOString(),
        consecutiveFailures: 0,
        totalChecks: 0,
        successfulChecks: 0,
        status: 'up',
        incidents: []
      });
    }
    
    // Start monitoring if enabled
    if (check.enabled) {
      this.startMonitoring(check.id);
    }
  }

  public removeCheck(checkId: string): void {
    this.stopMonitoring(checkId);
    this.checks.delete(checkId);
    this.checkResults.delete(checkId);
    this.checkStats.delete(checkId);
  }

  public updateCheck(checkId: string, updates: Partial<UptimeCheck>): void {
    const check = this.checks.get(checkId);
    if (!check) return;
    
    const wasEnabled = check.enabled;
    const updatedCheck = { ...check, ...updates };
    this.checks.set(checkId, updatedCheck);
    
    // Handle enable/disable changes
    if (wasEnabled && !updatedCheck.enabled) {
      this.stopMonitoring(checkId);
    } else if (!wasEnabled && updatedCheck.enabled) {
      this.startMonitoring(checkId);
    } else if (updatedCheck.enabled && updates.interval) {
      // Restart with new interval
      this.stopMonitoring(checkId);
      this.startMonitoring(checkId);
    }
  }

  private startMonitoring(checkId: string): void {
    const check = this.checks.get(checkId);
    if (!check || !check.enabled) return;
    
    // Perform immediate check
    this.performCheck(checkId);
    
    // Set up interval
    const interval = setInterval(() => {
      this.performCheck(checkId);
    }, check.interval);
    
    this.checkIntervals.set(checkId, interval);
  }

  private stopMonitoring(checkId: string): void {
    const interval = this.checkIntervals.get(checkId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(checkId);
    }
  }

  private async performCheck(checkId: string): Promise<void> {
    const check = this.checks.get(checkId);
    if (!check) return;
    
    let attempt = 0;
    let result: UptimeCheckResult | null = null;
    
    while (attempt <= check.retries && !result?.success) {
      result = await this.executeCheck(check, attempt);
      
      if (!result.success && attempt < check.retries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
      
      attempt++;
    }
    
    if (result) {
      this.recordResult(check, result);
    }
  }

  private async executeCheck(check: UptimeCheck, retryCount: number): Promise<UptimeCheckResult> {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), check.timeout);
    
    try {
      const response = await fetch(check.url, {
        method: check.method,
        headers: check.headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      // Check status code
      const statusMatch = check.expectedStatus ? 
        response.status === check.expectedStatus : 
        response.ok;
      
      // Check content if needed
      let contentMatch = true;
      if (check.expectedText && check.method === 'GET') {
        const text = await response.text();
        contentMatch = text.includes(check.expectedText);
      }
      
      const success = statusMatch && contentMatch;
      
      return {
        checkId: check.id,
        checkName: check.name,
        timestamp: new Date().toISOString(),
        success,
        responseTime,
        statusCode: response.status,
        contentMatch,
        retryCount,
        error: success ? undefined : 
          `Status: ${response.status}, Content match: ${contentMatch}`
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      return {
        checkId: check.id,
        checkName: check.name,
        timestamp: new Date().toISOString(),
        success: false,
        responseTime,
        retryCount,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private recordResult(check: UptimeCheck, result: UptimeCheckResult): void {
    // Add to results
    if (!this.checkResults.has(check.id)) {
      this.checkResults.set(check.id, []);
    }
    
    const results = this.checkResults.get(check.id)!;
    results.push(result);
    
    // Maintain max results
    if (results.length > this.maxResultsPerCheck) {
      results.shift();
    }
    
    // Update stats
    this.updateStats(check, result);
    
    // Handle incidents
    this.handleIncident(check, result);
    
    // Track in performance monitor
    performanceMonitor.trackApiRequest(
      `uptime-${check.id}`,
      result.responseTime,
      result.success
    );
    
    // Log failures
    if (!result.success) {
      hipaaErrorTracker.trackError({
        message: `Uptime check failed: ${check.name}`,
        error: result.error,
        checkId: check.id,
        retryCount: result.retryCount
      }, {
        component: 'uptime-monitor',
        action: 'check-failed',
        tags: {
          checkId: check.id,
          ...Object.fromEntries((check.tags || []).map(tag => [tag, 'true']))
        }
      });
    }
  }

  private updateStats(check: UptimeCheck, result: UptimeCheckResult): void {
    const stats = this.checkStats.get(check.id)!;
    
    stats.totalChecks++;
    stats.lastCheck = result.timestamp;
    
    if (result.success) {
      stats.successfulChecks++;
      stats.lastSuccess = result.timestamp;
      stats.consecutiveFailures = 0;
    } else {
      stats.consecutiveFailures++;
      stats.lastFailure = result.timestamp;
    }
    
    // Update uptime percentage
    stats.uptime = (stats.successfulChecks / stats.totalChecks) * 100;
    
    // Update average response time (only for successful checks)
    const successfulResults = this.checkResults.get(check.id)!
      .filter(r => r.success);
    
    if (successfulResults.length > 0) {
      stats.avgResponseTime = successfulResults
        .reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
    }
    
    // Update status
    if (stats.consecutiveFailures === 0) {
      stats.status = 'up';
    } else if (stats.consecutiveFailures >= 3) {
      stats.status = 'down';
    } else {
      stats.status = 'degraded';
    }
  }

  private handleIncident(check: UptimeCheck, result: UptimeCheckResult): void {
    const stats = this.checkStats.get(check.id)!;
    
    // Check for incident start
    if (!result.success && stats.consecutiveFailures === 1) {
      const incident: UptimeIncident = {
        id: `incident-${Date.now()}-${check.id}`,
        checkId: check.id,
        startTime: result.timestamp,
        reason: result.error || 'Check failed',
        resolved: false,
        severity: check.tags?.includes('critical') ? 'critical' : 
                  stats.consecutiveFailures >= 5 ? 'major' : 'minor'
      };
      
      this.incidents.set(incident.id, incident);
      stats.incidents.push(incident);
      
      // Alert for critical services
      if (incident.severity === 'critical') {
        this.sendAlert(check, incident);
      }
    }
    
    // Check for incident resolution
    if (result.success && stats.consecutiveFailures === 0) {
      // Find and resolve open incidents
      const openIncidents = stats.incidents.filter(i => !i.resolved);
      
      for (const incident of openIncidents) {
        const fullIncident = this.incidents.get(incident.id);
        if (fullIncident) {
          fullIncident.resolved = true;
          fullIncident.endTime = result.timestamp;
          fullIncident.duration = new Date(result.timestamp).getTime() - 
                                 new Date(fullIncident.startTime).getTime();
        }
      }
    }
  }

  private async sendAlert(check: UptimeCheck, incident: UptimeIncident): Promise<void> {
    // In a real implementation, this would send alerts via email, SMS, Slack, etc.
    console.error(`CRITICAL ALERT: ${check.name} is down!`, incident);
    
    // Track alert
    hipaaErrorTracker.trackError({
      message: `Critical service down: ${check.name}`,
      incident
    }, {
      component: 'uptime-monitor',
      action: 'critical-alert',
      feature: 'alerting'
    });
  }

  public getCheckStats(checkId?: string): UptimeStats[] {
    if (checkId) {
      const stats = this.checkStats.get(checkId);
      return stats ? [stats] : [];
    }
    
    return Array.from(this.checkStats.values());
  }

  public getCheckResults(checkId: string, hours = 24): UptimeCheckResult[] {
    const results = this.checkResults.get(checkId) || [];
    const cutoff = new Date(Date.now() - hours * 3600000);
    
    return results.filter(r => new Date(r.timestamp) > cutoff);
  }

  public getSummary(): UptimeSummary {
    const allStats = Array.from(this.checkStats.values());
    const allResults = Array.from(this.checkResults.values()).flat();
    
    const totalChecks = allResults.length;
    const failedChecks = allResults.filter(r => !r.success).length;
    const successfulResults = allResults.filter(r => r.success);
    
    const checksByStatus = {
      up: allStats.filter(s => s.status === 'up').length,
      down: allStats.filter(s => s.status === 'down').length,
      degraded: allStats.filter(s => s.status === 'degraded').length
    };
    
    const activeIncidents = Array.from(this.incidents.values())
      .filter(i => !i.resolved);
    
    const recentIncidents = Array.from(this.incidents.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
    
    return {
      overallUptime: totalChecks > 0 ? 
        ((totalChecks - failedChecks) / totalChecks) * 100 : 100,
      totalChecks,
      failedChecks,
      avgResponseTime: successfulResults.length > 0 ?
        successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length : 0,
      activeIncidents: activeIncidents.length,
      checksByStatus,
      recentIncidents
    };
  }

  public getIncidents(resolved?: boolean): UptimeIncident[] {
    const incidents = Array.from(this.incidents.values());
    
    if (resolved !== undefined) {
      return incidents.filter(i => i.resolved === resolved);
    }
    
    return incidents;
  }

  public destroy(): void {
    // Stop all monitoring
    for (const checkId of this.checkIntervals.keys()) {
      this.stopMonitoring(checkId);
    }
  }
}

// Global instance
export const uptimeMonitor = new UptimeMonitor();

// React hook for uptime monitoring
// Usage: import React from 'react' in your component
export function useUptimeMonitoring() {
  // Example implementation - would use React hooks in actual component
  const getMonitoringData = () => {
    return {
      stats: uptimeMonitor.getCheckStats(),
      summary: uptimeMonitor.getSummary(),
      activeIncidents: uptimeMonitor.getIncidents(false)
    };
  };
  
  const addCheck = (check: UptimeCheck) => {
    uptimeMonitor.addCheck(check);
  };
  
  const removeCheck = (checkId: string) => {
    uptimeMonitor.removeCheck(checkId);
  };
  
  const updateCheck = (checkId: string, updates: Partial<UptimeCheck>) => {
    uptimeMonitor.updateCheck(checkId, updates);
  };
  
  return {
    getMonitoringData,
    addCheck,
    removeCheck,
    updateCheck,
    getCheckResults: uptimeMonitor.getCheckResults.bind(uptimeMonitor)
  };
}