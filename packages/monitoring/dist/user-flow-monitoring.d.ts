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
    expectedDuration: number;
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
export declare const CRITICAL_USER_FLOWS: UserFlowConfig[];
declare class UserFlowMonitor {
    private flows;
    private activeExecutions;
    private flowMetrics;
    private abandonmentTimeout;
    private cleanupInterval;
    constructor();
    registerFlow(config: UserFlowConfig): void;
    startFlow(flowId: string, sessionId: string, userId?: string, metadata?: Record<string, any>): FlowExecution;
    recordStep(flowId: string, sessionId: string, stepName: string, success: boolean, duration?: number, error?: string): void;
    completeFlow(flowId: string, sessionId: string, status: 'completed' | 'abandoned' | 'failed'): void;
    abandonFlow(flowId: string, sessionId: string): void;
    private cleanupAbandonedFlows;
    getFlowMetrics(flowId?: string): FlowMetrics[];
    getActiveExecutions(flowId?: string): FlowExecution[];
    getFlowHealth(): Array<{
        flowId: string;
        flowName: string;
        health: 'good' | 'degraded' | 'poor';
        issues: string[];
    }>;
    destroy(): void;
}
export declare const userFlowMonitor: UserFlowMonitor;
export declare function useFlowMonitoring(flowId: string): {
    startFlow: (sessionId: string, userId?: string, metadata?: any) => FlowExecution;
    recordStep: (sessionId: string, stepName: string, success: boolean, duration?: number, error?: string) => void;
    completeFlow: (sessionId: string, status: "completed" | "abandoned" | "failed") => void;
    getMetrics: () => FlowMetrics;
};
export declare function createFlowTrackingMiddleware(flowId: string): (req: any, res: any, next: any) => void;
export {};
//# sourceMappingURL=user-flow-monitoring.d.ts.map