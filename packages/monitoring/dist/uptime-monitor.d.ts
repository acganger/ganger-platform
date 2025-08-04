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
    uptime: number;
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
declare class UptimeMonitor {
    private checks;
    private checkResults;
    private checkStats;
    private incidents;
    private checkIntervals;
    private readonly maxResultsPerCheck;
    constructor();
    addCheck(check: UptimeCheck): void;
    removeCheck(checkId: string): void;
    updateCheck(checkId: string, updates: Partial<UptimeCheck>): void;
    private startMonitoring;
    private stopMonitoring;
    private performCheck;
    private executeCheck;
    private recordResult;
    private updateStats;
    private handleIncident;
    private sendAlert;
    getCheckStats(checkId?: string): UptimeStats[];
    getCheckResults(checkId: string, hours?: number): UptimeCheckResult[];
    getSummary(): UptimeSummary;
    getIncidents(resolved?: boolean): UptimeIncident[];
    destroy(): void;
}
export declare const uptimeMonitor: UptimeMonitor;
export declare function useUptimeMonitoring(): {
    getMonitoringData: () => {
        stats: UptimeStats[];
        summary: UptimeSummary;
        activeIncidents: UptimeIncident[];
    };
    addCheck: (check: UptimeCheck) => void;
    removeCheck: (checkId: string) => void;
    updateCheck: (checkId: string, updates: Partial<UptimeCheck>) => void;
    getCheckResults: (checkId: string, hours?: number) => UptimeCheckResult[];
};
export {};
//# sourceMappingURL=uptime-monitor.d.ts.map