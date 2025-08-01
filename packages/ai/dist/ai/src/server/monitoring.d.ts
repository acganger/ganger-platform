/**
 * @fileoverview AI Usage Monitoring and Cost Tracking System
 * Provides comprehensive monitoring, reporting, and cost control for AI operations
 */
import type { AIUsageEvent, DailyUsageReport, ApplicationContext, AIModel, EmergencyState } from '../shared/types';
/**
 * Usage Statistics Interface
 */
export interface UsageStats {
    totalRequests: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    timeframe: string;
    periodStart: Date;
    periodEnd: Date;
}
/**
 * Cost Breakdown Interface
 */
export interface CostBreakdown {
    byApp: Record<ApplicationContext, number>;
    byModel: Record<AIModel, number>;
    byHour: Array<{
        hour: string;
        cost: number;
        requests: number;
    }>;
    projectedDaily: number;
    projectedMonthly: number;
}
/**
 * Alert Configuration
 */
export interface AlertConfig {
    type: 'budget' | 'usage' | 'error' | 'performance';
    threshold: number;
    enabled: boolean;
    recipients: string[];
    cooldownMinutes: number;
}
/**
 * AI Usage Monitor Class
 * Handles real-time monitoring, cost tracking, and alert generation
 */
export declare class AIUsageMonitor {
    private config;
    private alertCache;
    private emergencyState;
    constructor(config?: {
        enableRealTimeAlerts?: boolean;
        enableCostProjections?: boolean;
        enablePerformanceTracking?: boolean;
    });
    /**
     * Log AI usage event to database
     */
    logUsage(event: AIUsageEvent): Promise<void>;
    /**
     * Get usage statistics for a specific timeframe
     */
    getUsageStats(app?: ApplicationContext, timeframe?: 'hour' | 'day' | 'week' | 'month'): Promise<UsageStats>;
    /**
     * Get detailed cost breakdown
     */
    getCostBreakdown(timeframe?: 'day' | 'week' | 'month'): Promise<CostBreakdown>;
    /**
     * Generate comprehensive daily usage report
     */
    generateDailyReport(date?: Date): Promise<DailyUsageReport>;
    /**
     * Check budget status and get remaining budget
     */
    getBudgetStatus(app: ApplicationContext): Promise<{
        dailyBudget: number;
        usedToday: number;
        remainingToday: number;
        monthlyProjection: number;
        status: 'healthy' | 'warning' | 'critical' | 'exceeded';
    }>;
    /**
     * Set emergency state for the system
     */
    setEmergencyState(state: EmergencyState): void;
    /**
     * Get current emergency state
     */
    getEmergencyState(): EmergencyState;
    /**
     * Private helper methods
     */
    private getTimeRange;
    private calculateDailyProjection;
    private getPrimaryModel;
    private getModelStats;
    private generateAlerts;
    private calculateBudgetStatus;
    private checkRealTimeAlerts;
    private triggerAlert;
}
/**
 * Export factory function for creating monitor instances
 */
export declare function createUsageMonitor(config?: {
    enableRealTimeAlerts?: boolean;
    enableCostProjections?: boolean;
    enablePerformanceTracking?: boolean;
}): AIUsageMonitor;
/**
 * Database schema setup (run this during deployment)
 */
export declare const AI_USAGE_SCHEMA = "\n  CREATE TABLE IF NOT EXISTS ai_usage_events (\n    id UUID PRIMARY KEY,\n    timestamp TIMESTAMPTZ NOT NULL,\n    app TEXT NOT NULL,\n    model TEXT NOT NULL,\n    user_id UUID,\n    request_id TEXT NOT NULL,\n    tokens_used INTEGER NOT NULL DEFAULT 0,\n    cost DECIMAL(10,6) NOT NULL DEFAULT 0,\n    response_time INTEGER NOT NULL DEFAULT 0,\n    success BOOLEAN NOT NULL DEFAULT true,\n    error_code TEXT,\n    safety_score DECIMAL(3,2),\n    contains_phi BOOLEAN NOT NULL DEFAULT false,\n    created_at TIMESTAMPTZ DEFAULT NOW()\n  );\n\n  CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage_events(timestamp);\n  CREATE INDEX IF NOT EXISTS idx_ai_usage_app ON ai_usage_events(app);\n  CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_events(model);\n  CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_events(user_id);\n  CREATE INDEX IF NOT EXISTS idx_ai_usage_success ON ai_usage_events(success);\n";
//# sourceMappingURL=monitoring.d.ts.map