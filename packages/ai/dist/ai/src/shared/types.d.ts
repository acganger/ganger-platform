/**
 * @fileoverview TypeScript type definitions for the Ganger AI Workers system
 * Provides comprehensive type safety for all AI operations across the platform
 */
import type { User } from '@ganger/types';
/**
 * Supported AI Models Configuration
 * Based on PRD specifications for healthcare-optimized models
 */
export type AIModel = 'llama-4-scout-17b-16e-instruct' | 'llama-3.3-70b-instruct-fp8-fast' | 'llama-guard-3-8b' | 'qwq-32b' | 'llama-3.2-11b-vision-instruct' | 'whisper-large-v3-turbo' | 'melotts' | 'bge-m3' | 'bge-reranker-base';
/**
 * Application Context Types
 * Maps to the 17 Ganger Platform applications
 */
export type ApplicationContext = 'ai-receptionist' | 'inventory' | 'handouts' | 'checkin-kiosk' | 'medication-auth' | 'eos-l10' | 'pharma-scheduling' | 'call-center-ops' | 'batch-closeout' | 'socials-reviews' | 'clinical-staffing' | 'compliance-training' | 'platform-dashboard' | 'config-dashboard' | 'component-showcase' | 'staff' | 'integration-status';
/**
 * Use Case Categories for Model Selection
 */
export type UseCase = 'patient_communication' | 'clinical_documentation' | 'business_intelligence' | 'document_processing' | 'voice_processing' | 'safety_filtering' | 'real_time_chat' | 'complex_reasoning';
/**
 * HIPAA Compliance Levels
 */
export type HIPAAComplianceLevel = 'none' | 'standard' | 'strict' | 'audit';
/**
 * AI Request Configuration
 */
export interface AIRequestConfig {
    app: ApplicationContext;
    context?: UseCase;
    hipaaCompliant?: boolean;
    user?: User;
    model?: AIModel;
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
}
/**
 * Chat Message Structure
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    metadata?: {
        timestamp?: Date;
        userId?: string;
        sessionId?: string;
    };
}
/**
 * AI Chat Request
 */
export interface AIChatRequest {
    messages: ChatMessage[];
    config?: Partial<AIRequestConfig>;
}
/**
 * AI Response Structure
 */
export interface AIResponse<T = string> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta: {
        requestId: string;
        timestamp: string;
        model: AIModel;
        tokensUsed?: number;
        cost?: number;
        responseTime?: number;
        safetyScore?: number;
    };
}
/**
 * Safety Check Response
 */
export interface SafetyCheckResponse {
    success: boolean;
    data?: {
        safe: boolean;
        score: number;
        reasons?: string[];
        containsPHI?: boolean;
    };
    error?: {
        code: string;
        message: string;
    };
}
/**
 * Usage Monitoring Types
 */
export interface AIUsageEvent {
    id: string;
    timestamp: Date;
    app: ApplicationContext;
    model: AIModel;
    userId?: string;
    requestId: string;
    tokensUsed: number;
    cost: number;
    responseTime: number;
    success: boolean;
    errorCode?: string;
    safetyScore?: number;
    containsPHI: boolean;
}
export interface DailyUsageReport {
    date: string;
    totalRequests: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    usageByApp: Record<ApplicationContext, {
        requests: number;
        cost: number;
        primaryModel: AIModel;
        avgResponseTime: number;
    }>;
    modelPerformance: Record<AIModel, {
        requests: number;
        successRate: number;
        avgCostPerRequest: number;
    }>;
    alerts: Array<{
        type: 'warning' | 'error' | 'info';
        message: string;
        app?: ApplicationContext;
    }>;
    projections: {
        dailyAverage: number;
        monthlyProjection: number;
        budgetStatus: number;
    };
}
/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    dailyBudget: number;
    burstLimit?: number;
    cooldownBetweenRequests?: number;
    dailyRequestLimit?: number;
}
/**
 * Model Configuration
 */
export interface ModelConfig {
    model: AIModel;
    maxTokens: number;
    costPerToken: number;
    capabilities: UseCase[];
    tier: 1 | 2;
    rateLimits: RateLimitConfig;
    hipaaCompliant: boolean;
}
/**
 * Budget Control Configuration
 */
export interface BudgetControls {
    dailyLimit: number;
    monthlyLimit: number;
    emergencyThreshold: number;
    warningThresholds: {
        daily: number;
        hourly: number;
        consecutive: number;
    };
}
/**
 * Emergency Control States
 */
export type EmergencyState = 'normal' | 'warning' | 'emergency_stop' | 'recovery';
/**
 * Audit Log Entry for HIPAA Compliance
 */
export interface AIAuditLog {
    id: string;
    timestamp: Date;
    requestId: string;
    application: ApplicationContext;
    model: AIModel;
    userId?: string;
    patientId?: string;
    inputHash: string;
    outputHash: string;
    safetyScore: number;
    containsPHI: boolean;
    responseTime: number;
    cost: number;
    success: boolean;
    errorCode?: string;
    complianceLevel: HIPAAComplianceLevel;
}
/**
 * GangerAI Main Client Configuration
 */
export interface GangerAIConfig extends AIRequestConfig {
    cloudflareToken?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
    defaultModel?: AIModel;
    defaultTimeout?: number;
    enableUsageMonitoring?: boolean;
    enableSafetyFiltering?: boolean;
    enableRateLimiting?: boolean;
    enableAuditLogging?: boolean;
    emergencyControls?: BudgetControls;
}
/**
 * Error Types
 */
export declare class AIError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class RateLimitError extends AIError {
    retryAfter?: number | undefined;
    constructor(message: string, retryAfter?: number | undefined);
}
export declare class BudgetExceededError extends AIError {
    currentUsage: number;
    limit: number;
    constructor(message: string, currentUsage: number, limit: number);
}
export declare class SafetyViolationError extends AIError {
    safetyScore: number;
    constructor(message: string, safetyScore: number);
}
export declare class ModelUnavailableError extends AIError {
    model: AIModel;
    constructor(message: string, model: AIModel);
}
/**
 * React Hook Types for Client-Side Usage
 */
export interface UseAIOptions extends Partial<AIRequestConfig> {
    onSuccess?: (response: AIResponse) => void;
    onError?: (error: AIError) => void;
    autoRetry?: boolean;
    retryAttempts?: number;
}
export interface UseAIReturn {
    chat: (request: AIChatRequest) => Promise<AIResponse>;
    loading: boolean;
    error: AIError | null;
    lastResponse: AIResponse | null;
    usage: {
        requestsToday: number;
        costToday: number;
        remainingBudget: number;
    };
}
/**
 * Component Props for AI UI Components
 */
export interface AIChatComponentProps {
    config?: Partial<AIRequestConfig>;
    placeholder?: string;
    className?: string;
    onMessage?: (message: ChatMessage, response: AIResponse) => void;
    maxMessages?: number;
    enableVoice?: boolean;
    enableFileUpload?: boolean;
}
export interface AIUsageMonitorProps {
    app?: ApplicationContext;
    timeframe?: 'hour' | 'day' | 'week' | 'month';
    showCosts?: boolean;
    showModels?: boolean;
    className?: string;
}
//# sourceMappingURL=types.d.ts.map