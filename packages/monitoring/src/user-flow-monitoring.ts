import { performanceTracker } from './performance-tracking';
import { hipaaErrorTracker } from './hipaa-compliant-error-tracking';
import { customMetrics } from './custom-metrics';
import { apiLatencyMonitor } from './api-latency-monitor';

export interface UserFlowStep {
  name: string;
  type: 'user_action' | 'api_call' | 'navigation' | 'form_submission' | 'data_load';
  required: boolean;
  timeout?: number;
}

export interface UserFlowConfig {
  flowId: string;
  flowName: string;
  description: string;
  steps: UserFlowStep[];
  expectedDuration: number; // ms
  criticalPath: boolean;
}

export interface FlowExecution {
  flowId: string;
  sessionId: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'in_progress' | 'completed' | 'abandoned' | 'failed';
  currentStep?: string;
  completedSteps: string[];
  failedSteps: Array<{
    step: string;
    error: string;
    timestamp: string;
  }>;
  metadata?: Record<string, any>;
}

export interface FlowMetrics {
  flowId: string;
  totalExecutions: number;
  completedExecutions: number;
  abandonedExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
  abandonmentRate: number;
  stepMetrics: Map<string, {
    attempts: number;
    completions: number;
    failures: number;
    averageDuration: number;
  }>;
}

// Pre-defined critical user flows for Ganger Platform
export const CRITICAL_USER_FLOWS: UserFlowConfig[] = [
  {
    flowId: 'patient-checkin',
    flowName: 'Patient Check-in',
    description: 'Patient self-service check-in via kiosk',
    criticalPath: true,
    expectedDuration: 120000, // 2 minutes
    steps: [
      { name: 'kiosk-home', type: 'navigation', required: true },
      { name: 'enter-info', type: 'form_submission', required: true },
      { name: 'verify-insurance', type: 'api_call', required: true },
      { name: 'update-forms', type: 'form_submission', required: false },
      { name: 'confirm-appointment', type: 'user_action', required: true },
      { name: 'checkin-complete', type: 'api_call', required: true }
    ]
  },
  {
    flowId: 'inventory-reorder',
    flowName: 'Inventory Reorder',
    description: 'Staff reordering medical supplies',
    criticalPath: true,
    expectedDuration: 300000, // 5 minutes
    steps: [
      { name: 'scan-item', type: 'user_action', required: true },
      { name: 'check-levels', type: 'api_call', required: true },
      { name: 'select-quantity', type: 'form_submission', required: true },
      { name: 'approve-order', type: 'user_action', required: true },
      { name: 'submit-order', type: 'api_call', required: true },
      { name: 'order-confirmation', type: 'navigation', required: true }
    ]
  },
  {
    flowId: 'medication-auth',
    flowName: 'Prior Authorization',
    description: 'Submit medication prior authorization',
    criticalPath: true,
    expectedDuration: 600000, // 10 minutes
    steps: [
      { name: 'patient-search', type: 'form_submission', required: true },
      { name: 'load-patient', type: 'api_call', required: true },
      { name: 'select-medication', type: 'form_submission', required: true },
      { name: 'check-formulary', type: 'api_call', required: true },
      { name: 'complete-pa-form', type: 'form_submission', required: true },
      { name: 'attach-documents', type: 'user_action', required: false },
      { name: 'submit-authorization', type: 'api_call', required: true },
      { name: 'confirmation', type: 'navigation', required: true }
    ]
  },
  {
    flowId: 'appointment-schedule',
    flowName: 'Schedule Appointment',
    description: 'Schedule new patient appointment',
    criticalPath: true,
    expectedDuration: 180000, // 3 minutes
    steps: [
      { name: 'select-provider', type: 'user_action', required: true },
      { name: 'check-availability', type: 'api_call', required: true },
      { name: 'select-time', type: 'user_action', required: true },
      { name: 'enter-patient-info', type: 'form_submission', required: true },
      { name: 'verify-insurance', type: 'api_call', required: false },
      { name: 'confirm-appointment', type: 'api_call', required: true },
      { name: 'send-confirmation', type: 'api_call', required: true }
    ]
  },
  {
    flowId: 'batch-closeout',
    flowName: 'Daily Batch Closeout',
    description: 'Close daily payment batch',
    criticalPath: true,
    expectedDuration: 600000, // 10 minutes
    steps: [
      { name: 'load-transactions', type: 'data_load', required: true },
      { name: 'review-summary', type: 'navigation', required: true },
      { name: 'verify-totals', type: 'user_action', required: true },
      { name: 'apply-adjustments', type: 'form_submission', required: false },
      { name: 'manager-approval', type: 'user_action', required: true },
      { name: 'submit-batch', type: 'api_call', required: true },
      { name: 'generate-report', type: 'api_call', required: true }
    ]
  }
];

class UserFlowMonitor {
  private flows: Map<string, UserFlowConfig> = new Map();
  private activeExecutions: Map<string, FlowExecution> = new Map();
  private flowMetrics: Map<string, FlowMetrics> = new Map();
  private abandonmentTimeout = 1800000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Register critical flows
    CRITICAL_USER_FLOWS.forEach(flow => {
      this.registerFlow(flow);
    });

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupAbandonedFlows();
    }, 300000); // Every 5 minutes
  }

  public registerFlow(config: UserFlowConfig): void {
    this.flows.set(config.flowId, config);
    
    // Initialize metrics
    if (!this.flowMetrics.has(config.flowId)) {
      this.flowMetrics.set(config.flowId, {
        flowId: config.flowId,
        totalExecutions: 0,
        completedExecutions: 0,
        abandonedExecutions: 0,
        failedExecutions: 0,
        averageDuration: 0,
        successRate: 100,
        abandonmentRate: 0,
        stepMetrics: new Map()
      });
    }

    // Register custom metrics
    customMetrics.register({
      name: `user_flow_${config.flowId}_duration`,
      type: 'histogram',
      description: `Duration of ${config.flowName} flow`,
      unit: 'ms',
      buckets: [1000, 5000, 10000, 30000, 60000, 120000, 300000]
    });

    customMetrics.register({
      name: `user_flow_${config.flowId}_completions`,
      type: 'counter',
      description: `Completions of ${config.flowName} flow`
    });

    customMetrics.register({
      name: `user_flow_${config.flowId}_failures`,
      type: 'counter',
      description: `Failures in ${config.flowName} flow`
    });
  }

  public startFlow(
    flowId: string, 
    sessionId: string, 
    userId?: string,
    metadata?: Record<string, any>
  ): FlowExecution {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow ${flowId} not registered`);
    }

    const execution: FlowExecution = {
      flowId,
      sessionId,
      userId,
      startTime: new Date().toISOString(),
      status: 'in_progress',
      completedSteps: [],
      failedSteps: [],
      metadata
    };

    const executionId = `${flowId}-${sessionId}`;
    this.activeExecutions.set(executionId, execution);

    // Track metrics
    const metrics = this.flowMetrics.get(flowId)!;
    metrics.totalExecutions++;

    // Custom metric
    customMetrics.increment(`user_flow_${flowId}_starts`);

    // Performance tracking
    performanceTracker.mark(`flow-${executionId}-start`);

    // Track critical flows
    if (flow.criticalPath) {
      hipaaErrorTracker.trackError({
        message: `Critical flow started: ${flow.flowName}`,
        flowId,
        sessionId
      }, {
        component: 'user-flow-monitor',
        action: 'flow-start',
        feature: flow.flowName
      });
    }

    return execution;
  }

  public recordStep(
    flowId: string,
    sessionId: string,
    stepName: string,
    success: boolean,
    duration?: number,
    error?: string
  ): void {
    const executionId = `${flowId}-${sessionId}`;
    const execution = this.activeExecutions.get(executionId);
    
    if (!execution) {
      console.warn(`No active execution for ${executionId}`);
      return;
    }

    const flow = this.flows.get(flowId);
    if (!flow) return;

    // Update execution
    execution.currentStep = stepName;
    
    if (success) {
      execution.completedSteps.push(stepName);
    } else {
      execution.failedSteps.push({
        step: stepName,
        error: error || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Update step metrics
    const metrics = this.flowMetrics.get(flowId)!;
    let stepMetric = metrics.stepMetrics.get(stepName);
    
    if (!stepMetric) {
      stepMetric = {
        attempts: 0,
        completions: 0,
        failures: 0,
        averageDuration: 0
      };
      metrics.stepMetrics.set(stepName, stepMetric);
    }

    stepMetric.attempts++;
    if (success) {
      stepMetric.completions++;
    } else {
      stepMetric.failures++;
    }
    
    if (duration) {
      stepMetric.averageDuration = 
        (stepMetric.averageDuration * (stepMetric.attempts - 1) + duration) / 
        stepMetric.attempts;
    }

    // Performance tracking
    if (duration) {
      performanceTracker.measure(
        `flow-${executionId}-step-${stepName}`,
        `flow-${executionId}-start`
      );
    }

    // Check if flow is complete
    const requiredSteps = flow.steps.filter(s => s.required).map(s => s.name);
    const completedRequired = requiredSteps.every(s => 
      execution.completedSteps.includes(s)
    );

    if (completedRequired) {
      this.completeFlow(flowId, sessionId, 'completed');
    }

    // Track step failures
    if (!success) {
      hipaaErrorTracker.trackError({
        message: `Flow step failed: ${flow.flowName} - ${stepName}`,
        error,
        flowId,
        sessionId,
        stepName
      }, {
        component: 'user-flow-monitor',
        action: 'step-failure',
        feature: flow.flowName
      });
    }
  }

  public completeFlow(
    flowId: string,
    sessionId: string,
    status: 'completed' | 'abandoned' | 'failed'
  ): void {
    const executionId = `${flowId}-${sessionId}`;
    const execution = this.activeExecutions.get(executionId);
    
    if (!execution || execution.status !== 'in_progress') {
      return;
    }

    const flow = this.flows.get(flowId);
    if (!flow) return;

    // Update execution
    execution.status = status;
    execution.endTime = new Date().toISOString();
    execution.duration = new Date(execution.endTime).getTime() - 
                        new Date(execution.startTime).getTime();

    // Update metrics
    const metrics = this.flowMetrics.get(flowId)!;
    
    switch (status) {
      case 'completed':
        metrics.completedExecutions++;
        customMetrics.increment(`user_flow_${flowId}_completions`);
        break;
      case 'abandoned':
        metrics.abandonedExecutions++;
        customMetrics.increment(`user_flow_${flowId}_abandonments`);
        break;
      case 'failed':
        metrics.failedExecutions++;
        customMetrics.increment(`user_flow_${flowId}_failures`);
        break;
    }

    // Update average duration (only for completed flows)
    if (status === 'completed' && execution.duration) {
      metrics.averageDuration = 
        (metrics.averageDuration * (metrics.completedExecutions - 1) + execution.duration) / 
        metrics.completedExecutions;
      
      customMetrics.observe(`user_flow_${flowId}_duration`, execution.duration);
    }

    // Update rates
    metrics.successRate = 
      (metrics.completedExecutions / metrics.totalExecutions) * 100;
    metrics.abandonmentRate = 
      (metrics.abandonedExecutions / metrics.totalExecutions) * 100;

    // Performance measurement
    performanceTracker.measure(
      `flow-${executionId}-total`,
      `flow-${executionId}-start`
    );

    // Alert on flow issues
    if (flow.criticalPath && status !== 'completed') {
      customMetrics.createAlert({
        id: `flow-${flowId}-failure`,
        metric: `user_flow_${flowId}_failures`,
        condition: 'above',
        threshold: 5,
        duration: 300000, // 5 minutes
        severity: 'critical',
        message: `Critical flow ${flow.flowName} has high failure rate`,
        enabled: true
      });
    }

    // Clean up
    this.activeExecutions.delete(executionId);
  }

  public abandonFlow(flowId: string, sessionId: string): void {
    this.completeFlow(flowId, sessionId, 'abandoned');
  }

  private cleanupAbandonedFlows(): void {
    const now = Date.now();
    
    for (const [executionId, execution] of this.activeExecutions) {
      if (execution.status === 'in_progress') {
        const startTime = new Date(execution.startTime).getTime();
        
        if (now - startTime > this.abandonmentTimeout) {
          const [flowId, sessionId] = executionId.split('-');
          this.abandonFlow(flowId, sessionId);
        }
      }
    }
  }

  public getFlowMetrics(flowId?: string): FlowMetrics[] {
    if (flowId) {
      const metrics = this.flowMetrics.get(flowId);
      return metrics ? [metrics] : [];
    }
    
    return Array.from(this.flowMetrics.values());
  }

  public getActiveExecutions(flowId?: string): FlowExecution[] {
    const executions = Array.from(this.activeExecutions.values());
    
    if (flowId) {
      return executions.filter(e => e.flowId === flowId);
    }
    
    return executions;
  }

  public getFlowHealth(): Array<{
    flowId: string;
    flowName: string;
    health: 'good' | 'degraded' | 'poor';
    issues: string[];
  }> {
    const health: Array<{
      flowId: string;
      flowName: string;
      health: 'good' | 'degraded' | 'poor';
      issues: string[];
    }> = [];

    for (const [flowId, metrics] of this.flowMetrics) {
      const flow = this.flows.get(flowId)!;
      const issues: string[] = [];
      let healthStatus: 'good' | 'degraded' | 'poor' = 'good';

      // Check success rate
      if (metrics.successRate < 80) {
        issues.push(`Low success rate: ${metrics.successRate.toFixed(1)}%`);
        healthStatus = metrics.successRate < 60 ? 'poor' : 'degraded';
      }

      // Check abandonment rate
      if (metrics.abandonmentRate > 20) {
        issues.push(`High abandonment rate: ${metrics.abandonmentRate.toFixed(1)}%`);
        healthStatus = healthStatus === 'poor' ? 'poor' : 'degraded';
      }

      // Check duration
      if (metrics.averageDuration > flow.expectedDuration * 1.5) {
        issues.push(`Slow performance: ${(metrics.averageDuration / 1000).toFixed(1)}s average`);
        healthStatus = healthStatus === 'poor' ? 'poor' : 'degraded';
      }

      // Check step failures
      for (const [stepName, stepMetrics] of metrics.stepMetrics) {
        const stepFailureRate = 
          (stepMetrics.failures / stepMetrics.attempts) * 100;
        
        if (stepFailureRate > 10) {
          issues.push(`Step "${stepName}" failing: ${stepFailureRate.toFixed(1)}%`);
          healthStatus = 'poor';
        }
      }

      health.push({
        flowId,
        flowName: flow.flowName,
        health: healthStatus,
        issues
      });
    }

    return health;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global instance
export const userFlowMonitor = new UserFlowMonitor();

// React hook for flow monitoring
export function useFlowMonitoring(flowId: string) {
  const startFlow = (sessionId: string, userId?: string, metadata?: any) => {
    return userFlowMonitor.startFlow(flowId, sessionId, userId, metadata);
  };

  const recordStep = (
    sessionId: string,
    stepName: string,
    success: boolean,
    duration?: number,
    error?: string
  ) => {
    userFlowMonitor.recordStep(flowId, sessionId, stepName, success, duration, error);
  };

  const completeFlow = (sessionId: string, status: 'completed' | 'abandoned' | 'failed') => {
    userFlowMonitor.completeFlow(flowId, sessionId, status);
  };

  const getMetrics = () => {
    return userFlowMonitor.getFlowMetrics(flowId)[0];
  };

  return {
    startFlow,
    recordStep,
    completeFlow,
    getMetrics
  };
}

// Middleware for automatic flow tracking
export function createFlowTrackingMiddleware(flowId: string) {
  return (req: any, res: any, next: any) => {
    const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';
    const userId = req.user?.id;

    // Start flow
    const execution = userFlowMonitor.startFlow(flowId, sessionId, userId, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Track response
    const originalSend = res.send;
    res.send = function(data: any) {
      const success = res.statusCode < 400;
      userFlowMonitor.completeFlow(
        flowId, 
        sessionId, 
        success ? 'completed' : 'failed'
      );
      return originalSend.call(this, data);
    };

    next();
  };
}