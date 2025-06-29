/**
 * @fileoverview Cost tracking and monitoring system for AI usage
 * Provides detailed analytics, budget enforcement, and cost optimization
 */

import type { AIModel, ApplicationContext } from '../shared/types';

/**
 * Cost tracking configuration
 */
interface CostConfig {
  dailyBudgetUSD: number;
  monthlyBudgetUSD: number;
  alertThresholds: {
    daily: number;   // 0.8 = 80% of daily budget
    monthly: number; // 0.9 = 90% of monthly budget
  };
  costPerToken: Record<AIModel, { input: number; output: number }>;
}

/**
 * Usage statistics for a single request
 */
interface RequestStats {
  id: string;
  timestamp: number;
  app: ApplicationContext;
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  responseTimeMs: number;
  cacheHit: boolean;
  retryCount: number;
}

/**
 * Aggregated usage statistics
 */
interface UsageAggregates {
  requests: number;
  totalCostUSD: number;
  totalTokens: number;
  averageResponseTimeMs: number;
  cacheHitRate: number;
  modelDistribution: Record<AIModel, number>;
  appDistribution: Record<ApplicationContext, number>;
  errorRate: number;
}

/**
 * Budget status
 */
interface BudgetStatus {
  daily: {
    spent: number;
    budget: number;
    remaining: number;
    percentUsed: number;
    alertTriggered: boolean;
  };
  monthly: {
    spent: number;
    budget: number;
    remaining: number;
    percentUsed: number;
    alertTriggered: boolean;
  };
  shouldBlock: boolean;
  nextResetTime: number;
}

/**
 * Cost tracking and monitoring class
 */
export class CostMonitor {
  private requests: RequestStats[] = [];
  private config: CostConfig;
  private dailyBudgetResetTime = 0;
  private monthlyBudgetResetTime = 0;

  constructor(config?: Partial<CostConfig>) {
    this.config = {
      dailyBudgetUSD: 50,  // $50/day default
      monthlyBudgetUSD: 1000, // $1000/month default
      alertThresholds: {
        daily: 0.8,
        monthly: 0.9
      },
      costPerToken: {
        // Cloudflare Workers AI pricing (estimated)
        'llama-4-scout-17b-16e-instruct': { input: 0.0001, output: 0.0002 },
        'llama-3.3-70b-instruct-fp8-fast': { input: 0.00008, output: 0.00015 },
        'qwq-32b': { input: 0.00012, output: 0.00025 },
        'llama-3.2-11b-vision-instruct': { input: 0.00015, output: 0.0003 },
        'llama-3.2-1b-instruct': { input: 0.00005, output: 0.0001 },
        'llama-3.2-3b-instruct': { input: 0.00006, output: 0.00012 },
        'llama-guard-3-8b': { input: 0.00007, output: 0.00014 },
        'whisper-large-v3-turbo': { input: 0.00006, output: 0.00006 },
        'melotts': { input: 0.00005, output: 0.00005 },
        'bge-m3': { input: 0.00002, output: 0.00002 },
        'bge-reranker-base': { input: 0.00003, output: 0.00003 }
      },
      ...config
    };

    this.resetBudgetTimers();
  }

  /**
   * Record a request for cost tracking
   */
  recordRequest(stats: Omit<RequestStats, 'id' | 'timestamp' | 'costUSD'>): RequestStats {
    const timestamp = Date.now();
    const costUSD = this.calculateCost(stats.model, stats.inputTokens, stats.outputTokens);
    
    const requestStats: RequestStats = {
      ...stats,
      id: this.generateRequestId(),
      timestamp,
      costUSD
    };

    // Check budget before recording
    const budgetStatus = this.getBudgetStatus();
    if (budgetStatus.shouldBlock) {
      throw new Error('Budget exceeded - AI requests temporarily blocked');
    }

    this.requests.push(requestStats);
    
    // Clean old requests (keep last 30 days)
    this.cleanOldRequests();

    return requestStats;
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
    const modelCost = this.config.costPerToken[model];
    if (!modelCost) {
      // Default cost if model not found
      return (inputTokens * 0.0001) + (outputTokens * 0.0002);
    }

    return (inputTokens * modelCost.input) + (outputTokens * modelCost.output);
  }

  /**
   * Get current budget status
   */
  getBudgetStatus(): BudgetStatus {
    const now = Date.now();
    
    // Reset budgets if needed
    if (now > this.dailyBudgetResetTime) {
      this.resetDailyBudget();
    }
    if (now > this.monthlyBudgetResetTime) {
      this.resetMonthlyBudget();
    }

    const dailySpent = this.getTotalCostSince(this.getDayStart());
    const monthlySpent = this.getTotalCostSince(this.getMonthStart());

    const daily = {
      spent: dailySpent,
      budget: this.config.dailyBudgetUSD,
      remaining: Math.max(0, this.config.dailyBudgetUSD - dailySpent),
      percentUsed: dailySpent / this.config.dailyBudgetUSD,
      alertTriggered: dailySpent / this.config.dailyBudgetUSD >= this.config.alertThresholds.daily
    };

    const monthly = {
      spent: monthlySpent,
      budget: this.config.monthlyBudgetUSD,
      remaining: Math.max(0, this.config.monthlyBudgetUSD - monthlySpent),
      percentUsed: monthlySpent / this.config.monthlyBudgetUSD,
      alertTriggered: monthlySpent / this.config.monthlyBudgetUSD >= this.config.alertThresholds.monthly
    };

    return {
      daily,
      monthly,
      shouldBlock: daily.percentUsed >= 1.0 || monthly.percentUsed >= 1.0,
      nextResetTime: Math.min(this.dailyBudgetResetTime, this.monthlyBudgetResetTime)
    };
  }

  /**
   * Get usage statistics for a time period
   */
  getUsageStats(since: number = this.getDayStart()): UsageAggregates {
    const filteredRequests = this.requests.filter(r => r.timestamp >= since);
    
    if (filteredRequests.length === 0) {
      return this.getEmptyStats();
    }

    const totalCost = filteredRequests.reduce((sum, r) => sum + r.costUSD, 0);
    const totalTokens = filteredRequests.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);
    const totalResponseTime = filteredRequests.reduce((sum, r) => sum + r.responseTimeMs, 0);
    const cacheHits = filteredRequests.filter(r => r.cacheHit).length;
    const errors = filteredRequests.filter(r => r.retryCount > 0).length;

    // Model distribution
    const modelDistribution: Record<AIModel, number> = {} as Record<AIModel, number>;
    filteredRequests.forEach(r => {
      modelDistribution[r.model] = (modelDistribution[r.model] || 0) + 1;
    });

    // App distribution
    const appDistribution: Record<ApplicationContext, number> = {} as Record<ApplicationContext, number>;
    filteredRequests.forEach(r => {
      appDistribution[r.app] = (appDistribution[r.app] || 0) + 1;
    });

    return {
      requests: filteredRequests.length,
      totalCostUSD: totalCost,
      totalTokens,
      averageResponseTimeMs: totalResponseTime / filteredRequests.length,
      cacheHitRate: cacheHits / filteredRequests.length,
      modelDistribution,
      appDistribution,
      errorRate: errors / filteredRequests.length
    };
  }

  /**
   * Get cost breakdown by app
   */
  getCostByApp(since: number = this.getDayStart()): Array<{ app: ApplicationContext; cost: number; requests: number }> {
    const filteredRequests = this.requests.filter(r => r.timestamp >= since);
    const appStats = new Map<ApplicationContext, { cost: number; requests: number }>();

    filteredRequests.forEach(r => {
      const existing = appStats.get(r.app) || { cost: 0, requests: 0 };
      appStats.set(r.app, {
        cost: existing.cost + r.costUSD,
        requests: existing.requests + 1
      });
    });

    return Array.from(appStats.entries())
      .map(([app, stats]) => ({ app, ...stats }))
      .sort((a, b) => b.cost - a.cost);
  }

  /**
   * Get cost breakdown by model
   */
  getCostByModel(since: number = this.getDayStart()): Array<{ model: AIModel; cost: number; requests: number }> {
    const filteredRequests = this.requests.filter(r => r.timestamp >= since);
    const modelStats = new Map<AIModel, { cost: number; requests: number }>();

    filteredRequests.forEach(r => {
      const existing = modelStats.get(r.model) || { cost: 0, requests: 0 };
      modelStats.set(r.model, {
        cost: existing.cost + r.costUSD,
        requests: existing.requests + 1
      });
    });

    return Array.from(modelStats.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost);
  }

  /**
   * Get hourly cost trends
   */
  getHourlyCostTrend(hours: number = 24): Array<{ hour: string; cost: number; requests: number }> {
    const now = Date.now();
    const hourlyData: Array<{ hour: string; cost: number; requests: number }> = [];

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = now - (i * 60 * 60 * 1000);
      const hourEnd = hourStart + (60 * 60 * 1000);
      
      const hourRequests = this.requests.filter(r => 
        r.timestamp >= hourStart && r.timestamp < hourEnd
      );

      const cost = hourRequests.reduce((sum, r) => sum + r.costUSD, 0);
      
      hourlyData.push({
        hour: new Date(hourStart).toISOString().substr(0, 13) + ':00',
        cost,
        requests: hourRequests.length
      });
    }

    return hourlyData;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const dayStats = this.getUsageStats(this.getDayStart());
    const budgetStatus = this.getBudgetStatus();

    // Budget recommendations
    if (budgetStatus.daily.percentUsed > 0.8) {
      recommendations.push('Daily budget is nearly exhausted - consider increasing limit or optimizing usage');
    }

    // Cache recommendations
    if (dayStats.cacheHitRate < 0.3) {
      recommendations.push('Low cache hit rate - consider increasing cache TTL or improving cache key generation');
    }

    // Model recommendations
    const costByModel = this.getCostByModel();
    const expensiveModel = costByModel[0];
    if (expensiveModel && expensiveModel.cost > budgetStatus.daily.budget * 0.3) {
      recommendations.push(`Consider using cheaper models - ${expensiveModel.model} accounts for ${Math.round(expensiveModel.cost / budgetStatus.daily.spent * 100)}% of costs`);
    }

    // Error rate recommendations
    if (dayStats.errorRate > 0.1) {
      recommendations.push('High error rate detected - review AI request patterns and error handling');
    }

    // App usage recommendations
    const costByApp = this.getCostByApp();
    const topApp = costByApp[0];
    if (topApp && topApp.cost > budgetStatus.daily.budget * 0.4) {
      recommendations.push(`${topApp.app} app accounts for most AI costs - consider optimization`);
    }

    if (recommendations.length === 0) {
      recommendations.push('AI usage is well-optimized within budget');
    }

    return recommendations;
  }

  /**
   * Export usage data for external analysis
   */
  exportUsageData(since: number = this.getMonthStart()): {
    summary: UsageAggregates;
    requests: RequestStats[];
    budget: BudgetStatus;
    costByApp: Array<{ app: ApplicationContext; cost: number; requests: number }>;
    costByModel: Array<{ model: AIModel; cost: number; requests: number }>;
    recommendations: string[];
  } {
    const filteredRequests = this.requests.filter(r => r.timestamp >= since);
    
    return {
      summary: this.getUsageStats(since),
      requests: filteredRequests,
      budget: this.getBudgetStatus(),
      costByApp: this.getCostByApp(since),
      costByModel: this.getCostByModel(since),
      recommendations: this.getOptimizationRecommendations()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CostConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Private helper methods

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTotalCostSince(since: number): number {
    return this.requests
      .filter(r => r.timestamp >= since)
      .reduce((sum, r) => sum + r.costUSD, 0);
  }

  private getDayStart(): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }

  private getMonthStart(): number {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }

  private resetBudgetTimers(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    this.dailyBudgetResetTime = tomorrow.getTime();

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    this.monthlyBudgetResetTime = nextMonth.getTime();
  }

  private resetDailyBudget(): void {
    this.resetBudgetTimers();
  }

  private resetMonthlyBudget(): void {
    this.resetBudgetTimers();
  }

  private cleanOldRequests(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.requests = this.requests.filter(r => r.timestamp >= thirtyDaysAgo);
  }

  private getEmptyStats(): UsageAggregates {
    return {
      requests: 0,
      totalCostUSD: 0,
      totalTokens: 0,
      averageResponseTimeMs: 0,
      cacheHitRate: 0,
      modelDistribution: {} as Record<AIModel, number>,
      appDistribution: {} as Record<ApplicationContext, number>,
      errorRate: 0
    };
  }
}

/**
 * Cost alert system
 */
export class CostAlertManager {
  private alertCallbacks: Array<(alert: CostAlert) => void> = [];

  /**
   * Register callback for cost alerts
   */
  onAlert(callback: (alert: CostAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Check for alerts and trigger callbacks
   */
  checkAlerts(monitor: CostMonitor): void {
    const budget = monitor.getBudgetStatus();

    if (budget.daily.alertTriggered) {
      this.triggerAlert({
        type: 'budget_warning',
        level: 'warning',
        message: `Daily budget is ${Math.round(budget.daily.percentUsed * 100)}% used ($${budget.daily.spent.toFixed(2)}/$${budget.daily.budget})`,
        data: { budget: budget.daily }
      });
    }

    if (budget.monthly.alertTriggered) {
      this.triggerAlert({
        type: 'budget_warning',
        level: 'warning',
        message: `Monthly budget is ${Math.round(budget.monthly.percentUsed * 100)}% used ($${budget.monthly.spent.toFixed(2)}/$${budget.monthly.budget})`,
        data: { budget: budget.monthly }
      });
    }

    if (budget.shouldBlock) {
      this.triggerAlert({
        type: 'budget_exceeded',
        level: 'critical',
        message: 'Budget exceeded - AI requests are blocked',
        data: { budget }
      });
    }
  }

  private triggerAlert(alert: CostAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Cost alert callback error:', error);
      }
    });
  }
}

/**
 * Cost alert interface
 */
interface CostAlert {
  type: 'budget_warning' | 'budget_exceeded' | 'high_usage' | 'cost_spike';
  level: 'info' | 'warning' | 'critical';
  message: string;
  data: any;
}

/**
 * Singleton instances for easy access
 */
export const defaultCostMonitor = new CostMonitor();
export const defaultCostAlerts = new CostAlertManager();

// Set up automatic alert checking
setInterval(() => {
  defaultCostAlerts.checkAlerts(defaultCostMonitor);
}, 60000); // Check every minute