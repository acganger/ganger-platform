"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFlowMonitor = exports.CRITICAL_USER_FLOWS = void 0;
exports.useFlowMonitoring = useFlowMonitoring;
exports.createFlowTrackingMiddleware = createFlowTrackingMiddleware;
const performance_tracking_1 = require("./performance-tracking");
const hipaa_compliant_error_tracking_1 = require("./hipaa-compliant-error-tracking");
const custom_metrics_1 = require("./custom-metrics");
// Pre-defined critical user flows for Ganger Platform
exports.CRITICAL_USER_FLOWS = [
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
    constructor() {
        this.flows = new Map();
        this.activeExecutions = new Map();
        this.flowMetrics = new Map();
        this.abandonmentTimeout = 1800000; // 30 minutes
        this.cleanupInterval = null;
        // Register critical flows
        exports.CRITICAL_USER_FLOWS.forEach(flow => {
            this.registerFlow(flow);
        });
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupAbandonedFlows();
        }, 300000); // Every 5 minutes
    }
    registerFlow(config) {
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
        custom_metrics_1.customMetrics.register({
            name: `user_flow_${config.flowId}_duration`,
            type: 'histogram',
            description: `Duration of ${config.flowName} flow`,
            unit: 'ms',
            buckets: [1000, 5000, 10000, 30000, 60000, 120000, 300000]
        });
        custom_metrics_1.customMetrics.register({
            name: `user_flow_${config.flowId}_completions`,
            type: 'counter',
            description: `Completions of ${config.flowName} flow`
        });
        custom_metrics_1.customMetrics.register({
            name: `user_flow_${config.flowId}_failures`,
            type: 'counter',
            description: `Failures in ${config.flowName} flow`
        });
    }
    startFlow(flowId, sessionId, userId, metadata) {
        const flow = this.flows.get(flowId);
        if (!flow) {
            throw new Error(`Flow ${flowId} not registered`);
        }
        const execution = {
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
        const metrics = this.flowMetrics.get(flowId);
        metrics.totalExecutions++;
        // Custom metric
        custom_metrics_1.customMetrics.increment(`user_flow_${flowId}_starts`);
        // Performance tracking
        performance_tracking_1.performanceTracker.mark(`flow-${executionId}-start`);
        // Track critical flows
        if (flow.criticalPath) {
            hipaa_compliant_error_tracking_1.hipaaErrorTracker.trackError({
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
    recordStep(flowId, sessionId, stepName, success, duration, error) {
        const executionId = `${flowId}-${sessionId}`;
        const execution = this.activeExecutions.get(executionId);
        if (!execution) {
            console.warn(`No active execution for ${executionId}`);
            return;
        }
        const flow = this.flows.get(flowId);
        if (!flow)
            return;
        // Update execution
        execution.currentStep = stepName;
        if (success) {
            execution.completedSteps.push(stepName);
        }
        else {
            execution.failedSteps.push({
                step: stepName,
                error: error || 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
        // Update step metrics
        const metrics = this.flowMetrics.get(flowId);
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
        }
        else {
            stepMetric.failures++;
        }
        if (duration) {
            stepMetric.averageDuration =
                (stepMetric.averageDuration * (stepMetric.attempts - 1) + duration) /
                    stepMetric.attempts;
        }
        // Performance tracking
        if (duration) {
            performance_tracking_1.performanceTracker.measure(`flow-${executionId}-step-${stepName}`, `flow-${executionId}-start`);
        }
        // Check if flow is complete
        const requiredSteps = flow.steps.filter(s => s.required).map(s => s.name);
        const completedRequired = requiredSteps.every(s => execution.completedSteps.includes(s));
        if (completedRequired) {
            this.completeFlow(flowId, sessionId, 'completed');
        }
        // Track step failures
        if (!success) {
            hipaa_compliant_error_tracking_1.hipaaErrorTracker.trackError({
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
    completeFlow(flowId, sessionId, status) {
        const executionId = `${flowId}-${sessionId}`;
        const execution = this.activeExecutions.get(executionId);
        if (!execution || execution.status !== 'in_progress') {
            return;
        }
        const flow = this.flows.get(flowId);
        if (!flow)
            return;
        // Update execution
        execution.status = status;
        execution.endTime = new Date().toISOString();
        execution.duration = new Date(execution.endTime).getTime() -
            new Date(execution.startTime).getTime();
        // Update metrics
        const metrics = this.flowMetrics.get(flowId);
        switch (status) {
            case 'completed':
                metrics.completedExecutions++;
                custom_metrics_1.customMetrics.increment(`user_flow_${flowId}_completions`);
                break;
            case 'abandoned':
                metrics.abandonedExecutions++;
                custom_metrics_1.customMetrics.increment(`user_flow_${flowId}_abandonments`);
                break;
            case 'failed':
                metrics.failedExecutions++;
                custom_metrics_1.customMetrics.increment(`user_flow_${flowId}_failures`);
                break;
        }
        // Update average duration (only for completed flows)
        if (status === 'completed' && execution.duration) {
            metrics.averageDuration =
                (metrics.averageDuration * (metrics.completedExecutions - 1) + execution.duration) /
                    metrics.completedExecutions;
            custom_metrics_1.customMetrics.observe(`user_flow_${flowId}_duration`, execution.duration);
        }
        // Update rates
        metrics.successRate =
            (metrics.completedExecutions / metrics.totalExecutions) * 100;
        metrics.abandonmentRate =
            (metrics.abandonedExecutions / metrics.totalExecutions) * 100;
        // Performance measurement
        performance_tracking_1.performanceTracker.measure(`flow-${executionId}-total`, `flow-${executionId}-start`);
        // Alert on flow issues
        if (flow.criticalPath && status !== 'completed') {
            custom_metrics_1.customMetrics.createAlert({
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
    abandonFlow(flowId, sessionId) {
        this.completeFlow(flowId, sessionId, 'abandoned');
    }
    cleanupAbandonedFlows() {
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
    getFlowMetrics(flowId) {
        if (flowId) {
            const metrics = this.flowMetrics.get(flowId);
            return metrics ? [metrics] : [];
        }
        return Array.from(this.flowMetrics.values());
    }
    getActiveExecutions(flowId) {
        const executions = Array.from(this.activeExecutions.values());
        if (flowId) {
            return executions.filter(e => e.flowId === flowId);
        }
        return executions;
    }
    getFlowHealth() {
        const health = [];
        for (const [flowId, metrics] of this.flowMetrics) {
            const flow = this.flows.get(flowId);
            const issues = [];
            let healthStatus = 'good';
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
                const stepFailureRate = (stepMetrics.failures / stepMetrics.attempts) * 100;
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
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
// Global instance
exports.userFlowMonitor = new UserFlowMonitor();
// React hook for flow monitoring
function useFlowMonitoring(flowId) {
    const startFlow = (sessionId, userId, metadata) => {
        return exports.userFlowMonitor.startFlow(flowId, sessionId, userId, metadata);
    };
    const recordStep = (sessionId, stepName, success, duration, error) => {
        exports.userFlowMonitor.recordStep(flowId, sessionId, stepName, success, duration, error);
    };
    const completeFlow = (sessionId, status) => {
        exports.userFlowMonitor.completeFlow(flowId, sessionId, status);
    };
    const getMetrics = () => {
        return exports.userFlowMonitor.getFlowMetrics(flowId)[0];
    };
    return {
        startFlow,
        recordStep,
        completeFlow,
        getMetrics
    };
}
// Middleware for automatic flow tracking
function createFlowTrackingMiddleware(flowId) {
    return (req, res, next) => {
        const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';
        const userId = req.user?.id;
        // Start flow
        const execution = exports.userFlowMonitor.startFlow(flowId, sessionId, userId, {
            userAgent: req.headers['user-agent'],
            ip: req.ip
        });
        // Track response
        const originalSend = res.send;
        res.send = function (data) {
            const success = res.statusCode < 400;
            exports.userFlowMonitor.completeFlow(flowId, sessionId, success ? 'completed' : 'failed');
            return originalSend.call(this, data);
        };
        next();
    };
}
//# sourceMappingURL=user-flow-monitoring.js.map