"use strict";
/**
 * @fileoverview AI Usage Monitoring and Cost Tracking System
 * Provides comprehensive monitoring, reporting, and cost control for AI operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_USAGE_SCHEMA = exports.AIUsageMonitor = void 0;
exports.createUsageMonitor = createUsageMonitor;
const db_1 = require("@ganger/db");
const constants_1 = require("../shared/constants");
/**
 * AI Usage Monitor Class
 * Handles real-time monitoring, cost tracking, and alert generation
 */
class AIUsageMonitor {
    constructor(config = {}) {
        this.config = config;
        this.alertCache = new Map(); // Track alert cooldowns
        this.emergencyState = 'normal';
        this.config = {
            enableRealTimeAlerts: true,
            enableCostProjections: true,
            enablePerformanceTracking: true,
            ...config
        };
    }
    /**
     * Log AI usage event to database
     */
    async logUsage(event) {
        try {
            // Insert into database
            await db_1.db.query(`
        INSERT INTO ai_usage_events (
          id, timestamp, app, model, user_id, request_id,
          tokens_used, cost, response_time, success, error_code,
          safety_score, contains_phi
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
                event.id,
                event.timestamp.toISOString(),
                event.app,
                event.model,
                event.userId || null,
                event.requestId,
                event.tokensUsed,
                event.cost,
                event.responseTime,
                event.success,
                event.errorCode || null,
                event.safetyScore || null,
                event.containsPHI
            ]);
            // Check for real-time alerts if enabled
            if (this.config.enableRealTimeAlerts) {
                await this.checkRealTimeAlerts(event);
            }
        }
        catch (error) {
            console.error('Failed to log AI usage event:', error);
            // Don't throw error to avoid breaking AI operations
        }
    }
    /**
     * Get usage statistics for a specific timeframe
     */
    async getUsageStats(app, timeframe = 'day') {
        const { startTime, endTime } = this.getTimeRange(timeframe);
        try {
            const query = `
        SELECT 
          COUNT(*) as total_requests,
          COALESCE(SUM(cost), 0) as total_cost,
          COALESCE(AVG(response_time), 0) as avg_response_time,
          COALESCE(COUNT(*) FILTER (WHERE success = true)::float / COUNT(*), 0) as success_rate
        FROM ai_usage_events 
        WHERE timestamp >= $1 AND timestamp <= $2
        ${app ? 'AND app = $3' : ''}
      `;
            const params = [startTime.toISOString(), endTime.toISOString()];
            if (app)
                params.push(app);
            const result = await db_1.db.query(query, params);
            const row = result[0] || {};
            return {
                totalRequests: parseInt(row.total_requests) || 0,
                totalCost: parseFloat(row.total_cost) || 0,
                averageResponseTime: parseFloat(row.avg_response_time) || 0,
                successRate: parseFloat(row.success_rate) || 0,
                timeframe,
                periodStart: startTime,
                periodEnd: endTime
            };
        }
        catch (error) {
            console.error('Failed to get usage stats:', error);
            return {
                totalRequests: 0,
                totalCost: 0,
                averageResponseTime: 0,
                successRate: 0,
                timeframe,
                periodStart: startTime,
                periodEnd: endTime
            };
        }
    }
    /**
     * Get detailed cost breakdown
     */
    async getCostBreakdown(timeframe = 'day') {
        const { startTime, endTime } = this.getTimeRange(timeframe);
        try {
            // Cost by app
            const appCosts = await db_1.db.query(`
        SELECT app, COALESCE(SUM(cost), 0) as total_cost
        FROM ai_usage_events 
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY app
      `, [startTime.toISOString(), endTime.toISOString()]);
            // Cost by model
            const modelCosts = await db_1.db.query(`
        SELECT model, COALESCE(SUM(cost), 0) as total_cost
        FROM ai_usage_events 
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY model
      `, [startTime.toISOString(), endTime.toISOString()]);
            // Hourly breakdown
            const hourlyCosts = await db_1.db.query(`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COALESCE(SUM(cost), 0) as cost,
          COUNT(*) as requests
        FROM ai_usage_events 
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour DESC
        LIMIT 24
      `, [startTime.toISOString(), endTime.toISOString()]);
            // Build cost breakdown
            const byApp = {};
            appCosts.forEach(row => {
                byApp[row.app] = parseFloat(row.total_cost);
            });
            const byModel = {};
            modelCosts.forEach(row => {
                byModel[row.model] = parseFloat(row.total_cost);
            });
            const byHour = hourlyCosts.map(row => ({
                hour: row.hour,
                cost: parseFloat(row.cost),
                requests: parseInt(row.requests)
            }));
            // Calculate projections
            const totalCost = Object.values(byApp).reduce((sum, cost) => sum + cost, 0);
            const projectedDaily = this.calculateDailyProjection(totalCost, timeframe);
            const projectedMonthly = projectedDaily * 30;
            return {
                byApp,
                byModel,
                byHour,
                projectedDaily,
                projectedMonthly
            };
        }
        catch (error) {
            console.error('Failed to get cost breakdown:', error);
            return {
                byApp: {},
                byModel: {},
                byHour: [],
                projectedDaily: 0,
                projectedMonthly: 0
            };
        }
    }
    /**
     * Generate comprehensive daily usage report
     */
    async generateDailyReport(date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        try {
            // Get overall stats
            const overallStats = await this.getUsageStats(undefined, 'day');
            // Get cost breakdown
            const costBreakdown = await this.getCostBreakdown('day');
            // Get usage by app
            const usageByApp = {};
            for (const app of Object.keys(constants_1.APP_RATE_LIMITS)) {
                const appStats = await this.getUsageStats(app, 'day');
                const primaryModel = await this.getPrimaryModel(app, startOfDay, endOfDay);
                usageByApp[app] = {
                    requests: appStats.totalRequests,
                    cost: appStats.totalCost,
                    primaryModel,
                    avgResponseTime: appStats.averageResponseTime
                };
            }
            // Get model performance
            const modelPerformance = {};
            for (const model of Object.keys(constants_1.AI_MODELS)) {
                const modelStats = await this.getModelStats(model, startOfDay, endOfDay);
                modelPerformance[model] = modelStats;
            }
            // Generate alerts
            const alerts = await this.generateAlerts(overallStats, costBreakdown);
            return {
                date: date.toISOString().split('T')[0],
                totalRequests: overallStats.totalRequests,
                totalCost: overallStats.totalCost,
                averageResponseTime: overallStats.averageResponseTime,
                successRate: overallStats.successRate,
                usageByApp,
                modelPerformance,
                alerts,
                projections: {
                    dailyAverage: costBreakdown.projectedDaily,
                    monthlyProjection: costBreakdown.projectedMonthly,
                    budgetStatus: this.calculateBudgetStatus(costBreakdown.projectedMonthly)
                }
            };
        }
        catch (error) {
            console.error('Failed to generate daily report:', error);
            throw new Error('Failed to generate usage report');
        }
    }
    /**
     * Check budget status and get remaining budget
     */
    async getBudgetStatus(app) {
        const appLimits = constants_1.APP_RATE_LIMITS[app];
        const usageStats = await this.getUsageStats(app, 'day');
        const costBreakdown = await this.getCostBreakdown('day');
        const usedToday = usageStats.totalCost;
        const remainingToday = Math.max(0, appLimits.dailyBudget - usedToday);
        const monthlyProjection = costBreakdown.projectedMonthly;
        let status = 'healthy';
        if (usedToday >= appLimits.dailyBudget) {
            status = 'exceeded';
        }
        else if (usedToday >= appLimits.dailyBudget * 0.9) {
            status = 'critical';
        }
        else if (usedToday >= appLimits.dailyBudget * 0.75) {
            status = 'warning';
        }
        return {
            dailyBudget: appLimits.dailyBudget,
            usedToday,
            remainingToday,
            monthlyProjection,
            status
        };
    }
    /**
     * Set emergency state for the system
     */
    setEmergencyState(state) {
        this.emergencyState = state;
        console.log(`AI Usage Monitor: Emergency state set to ${state}`);
    }
    /**
     * Get current emergency state
     */
    getEmergencyState() {
        return this.emergencyState;
    }
    /**
     * Private helper methods
     */
    getTimeRange(timeframe) {
        const endTime = new Date();
        const startTime = new Date();
        switch (timeframe) {
            case 'hour':
                startTime.setHours(endTime.getHours() - 1);
                break;
            case 'day':
                startTime.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startTime.setDate(endTime.getDate() - 7);
                startTime.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startTime.setMonth(endTime.getMonth() - 1);
                startTime.setHours(0, 0, 0, 0);
                break;
        }
        return { startTime, endTime };
    }
    calculateDailyProjection(cost, timeframe) {
        switch (timeframe) {
            case 'hour':
                return cost * 24;
            case 'day':
                return cost;
            case 'week':
                return cost / 7;
            case 'month':
                return cost / 30;
            default:
                return cost;
        }
    }
    async getPrimaryModel(app, startTime, endTime) {
        try {
            const result = await db_1.db.query(`
        SELECT model, COUNT(*) as usage_count
        FROM ai_usage_events 
        WHERE app = $1 AND timestamp >= $2 AND timestamp <= $3
        GROUP BY model
        ORDER BY usage_count DESC
        LIMIT 1
      `, [app, startTime.toISOString(), endTime.toISOString()]);
            return result[0]?.model || 'llama-3.3-70b-instruct-fp8-fast';
        }
        catch {
            return 'llama-3.3-70b-instruct-fp8-fast';
        }
    }
    async getModelStats(model, startTime, endTime) {
        try {
            const result = await db_1.db.query(`
        SELECT 
          COUNT(*) as requests,
          COALESCE(COUNT(*) FILTER (WHERE success = true)::float / COUNT(*), 0) as success_rate,
          COALESCE(AVG(cost), 0) as avg_cost_per_request
        FROM ai_usage_events 
        WHERE model = $1 AND timestamp >= $2 AND timestamp <= $3
      `, [model, startTime.toISOString(), endTime.toISOString()]);
            const row = result[0] || {};
            return {
                requests: parseInt(row.requests) || 0,
                successRate: parseFloat(row.success_rate) || 0,
                avgCostPerRequest: parseFloat(row.avg_cost_per_request) || 0
            };
        }
        catch {
            return { requests: 0, successRate: 0, avgCostPerRequest: 0 };
        }
    }
    async generateAlerts(stats, costBreakdown) {
        const alerts = [];
        // Budget alerts
        if (costBreakdown.projectedDaily > constants_1.DEFAULT_BUDGETS.normalDaily * 1.2) {
            alerts.push({
                type: 'warning',
                message: `Daily cost projection (${costBreakdown.projectedDaily.toFixed(2)}) exceeds normal budget`,
                app: undefined
            });
        }
        // Performance alerts
        if (stats.averageResponseTime > 5000) { // 5 seconds
            alerts.push({
                type: 'warning',
                message: 'Average response time is unusually high',
                app: undefined
            });
        }
        // Success rate alerts
        if (stats.successRate < 0.95) { // Less than 95%
            alerts.push({
                type: 'error',
                message: `Success rate (${(stats.successRate * 100).toFixed(1)}%) is below threshold`,
                app: undefined
            });
        }
        // Usage spike alerts
        if (stats.totalRequests > 10000) { // Arbitrary high threshold
            alerts.push({
                type: 'info',
                message: 'Unusually high request volume detected',
                app: undefined
            });
        }
        return alerts;
    }
    calculateBudgetStatus(monthlyProjection) {
        return monthlyProjection / constants_1.DEFAULT_BUDGETS.normalMonthly;
    }
    async checkRealTimeAlerts(event) {
        try {
            // Check cost per request alert
            if (event.cost > 1.0) { // $1 per request is unusually high
                await this.triggerAlert('high_cost_request', {
                    app: event.app,
                    cost: event.cost,
                    model: event.model
                });
            }
            // Check response time alert
            if (event.responseTime > 10000) { // 10 seconds
                await this.triggerAlert('slow_response', {
                    app: event.app,
                    responseTime: event.responseTime,
                    model: event.model
                });
            }
            // Check safety score alert
            if (event.safetyScore && event.safetyScore < 0.7) {
                await this.triggerAlert('low_safety_score', {
                    app: event.app,
                    safetyScore: event.safetyScore,
                    containsPHI: event.containsPHI
                });
            }
        }
        catch (error) {
            console.error('Failed to check real-time alerts:', error);
        }
    }
    async triggerAlert(alertType, data) {
        const alertKey = `${alertType}-${data.app}`;
        const now = Date.now();
        // Check cooldown (default 15 minutes)
        const lastAlert = this.alertCache.get(alertKey);
        if (lastAlert && now - lastAlert < 15 * 60 * 1000) {
            return; // Still in cooldown
        }
        // Update cache
        this.alertCache.set(alertKey, now);
        // Log alert (in production, this would send notifications)
        console.warn(`AI Alert [${alertType}]:`, data);
    }
}
exports.AIUsageMonitor = AIUsageMonitor;
/**
 * Export factory function for creating monitor instances
 */
function createUsageMonitor(config) {
    return new AIUsageMonitor(config);
}
/**
 * Database schema setup (run this during deployment)
 */
exports.AI_USAGE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ai_usage_events (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    app TEXT NOT NULL,
    model TEXT NOT NULL,
    user_id UUID,
    request_id TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0,
    response_time INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT true,
    error_code TEXT,
    safety_score DECIMAL(3,2),
    contains_phi BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_ai_usage_app ON ai_usage_events(app);
  CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_events(model);
  CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_ai_usage_success ON ai_usage_events(success);
`;
