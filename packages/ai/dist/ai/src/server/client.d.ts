/**
 * @fileoverview Core GangerAI server-side client class
 * Provides healthcare-optimized AI capabilities with HIPAA compliance, cost controls, and monitoring
 */
import type { AIModel, UseCase, GangerAIConfig, AIChatRequest, AIResponse, SafetyCheckResponse } from '../shared/types';
/**
 * Core GangerAI Client Class
 * Provides unified AI capabilities across all Ganger Platform applications
 */
export declare class GangerAI {
    private config;
    private emergencyState;
    private usageCache;
    private lastRequestTime;
    constructor(config: GangerAIConfig);
    /**
     * Main chat interface for AI interactions
     */
    chat(request: AIChatRequest): Promise<AIResponse>;
    /**
     * Safety check for HIPAA compliance
     */
    checkSafety(content: {
        content: string;
        context?: UseCase;
    }): Promise<SafetyCheckResponse>;
    /**
     * Get current usage statistics
     */
    getUsageStats(timeframe?: 'hour' | 'day' | 'week'): Promise<{
        requests: number;
        cost: number;
        remainingBudget: number;
        topModels: Array<{
            model: AIModel;
            requests: number;
        }>;
    }>;
    /**
     * Private Methods
     */
    private validateConfig;
    private validateRequest;
    private selectModel;
    private performPreflightChecks;
    private performSafetyCheck;
    private executeAIRequest;
    private callCloudflareAI;
    private addSystemPrompt;
    private postProcessResponse;
    private handleError;
    private checkRateLimit;
    private checkBudget;
    private buildSafetyPrompt;
    private parseSafetyScore;
    private detectPHI;
    private estimateTokens;
    private calculateCost;
    private logUsageEvent;
    private logAuditEvent;
}
/**
 * Factory function to create GangerAI instances
 * Follows the pattern specified in the PRD
 */
export declare function createGangerAI(env: any, config: Partial<GangerAIConfig>): GangerAI;
//# sourceMappingURL=client.d.ts.map