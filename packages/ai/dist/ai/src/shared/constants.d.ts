/**
 * @fileoverview AI Model configurations and constants for the Ganger Platform
 * Healthcare-optimized model selection and platform configurations
 */
import type { AIModel, ModelConfig, RateLimitConfig, ApplicationContext, UseCase } from './types';
/**
 * Primary AI Models Configuration
 * Based on PRD specifications for medical practice workflows
 */
export declare const AI_MODELS: Record<AIModel, ModelConfig>;
/**
 * Application-Specific Rate Limits
 * Per-application usage controls based on PRD specifications
 */
export declare const APP_RATE_LIMITS: Record<ApplicationContext, RateLimitConfig>;
/**
 * Model Selection Strategy
 * Automatic model selection based on use case and application context
 */
export declare const MODEL_SELECTION: Record<UseCase, AIModel[]>;
/**
 * Emergency Control Thresholds
 * Platform-wide safety thresholds for cost and usage control
 */
export declare const EMERGENCY_THRESHOLDS: {
    costPerHour: number;
    costPerDay: number;
    requestsPerMinute: number;
    errorRate: number;
    consecutiveFailures: number;
    dailyBudgetWarning: number;
    dailyBudgetEmergency: number;
    monthlyBudgetWarning: number;
    recoveryWaitTime: number;
    recoveryGradualLimit: number;
    fullRecoveryTime: number;
};
/**
 * Default Budget Configuration
 * Conservative budget allocations per PRD specifications
 */
export declare const DEFAULT_BUDGETS: {
    conservativeDaily: number;
    normalDaily: number;
    growthDaily: number;
    conservativeMonthly: number;
    normalMonthly: number;
    growthMonthly: number;
    emergencyDaily: number;
    emergencyMonthly: number;
};
/**
 * HIPAA Safety Configuration
 * Safety filtering and compliance settings
 */
export declare const HIPAA_SAFETY_CONFIG: {
    minimumSafetyScore: number;
    warningThreshold: number;
    strictThreshold: number;
    phiDetectionSensitivity: string;
    auditRequired: string[];
    autoFilter: boolean;
    blockUnsafeContent: boolean;
    logAllInteractions: boolean;
};
/**
 * Default System Prompts
 * Healthcare-optimized system prompts for different contexts
 */
export declare const SYSTEM_PROMPTS: {
    patient_communication: string;
    clinical_documentation: string;
    business_intelligence: string;
    real_time_chat: string;
    safety_filtering: string;
};
/**
 * Platform Integration URLs
 * For cross-app navigation and monitoring
 */
export declare const PLATFORM_URLS: {
    readonly STAFF_PORTAL: "https://staff.gangerdermatology.com";
    readonly AI_MONITORING: "/ai-monitoring";
    readonly USAGE_DASHBOARD: "/platform-dashboard/ai-usage";
    readonly COST_TRACKING: "/platform-dashboard/ai-costs";
    readonly AUDIT_LOGS: "/platform-dashboard/ai-audit";
};
/**
 * Error Messages
 * Standardized error messages for consistent UX
 */
export declare const ERROR_MESSAGES: {
    readonly RATE_LIMIT_EXCEEDED: "AI request rate limit exceeded. Please try again in a few moments.";
    readonly BUDGET_EXCEEDED: "Daily AI budget exceeded. Please contact your administrator.";
    readonly SAFETY_VIOLATION: "Content safety check failed. Please review your request.";
    readonly MODEL_UNAVAILABLE: "The requested AI model is currently unavailable. Trying alternative model.";
    readonly AUTHENTICATION_REQUIRED: "Authentication required for AI features.";
    readonly INSUFFICIENT_PERMISSIONS: "Insufficient permissions for this AI operation.";
    readonly EMERGENCY_STOP: "AI services temporarily suspended due to usage limits. Please contact support.";
    readonly HIPAA_VIOLATION: "Request contains potential PHI and cannot be processed.";
    readonly NETWORK_ERROR: "Network error occurred. Please check your connection and try again.";
    readonly TIMEOUT_ERROR: "AI request timed out. Please try again with a shorter request.";
};
//# sourceMappingURL=constants.d.ts.map