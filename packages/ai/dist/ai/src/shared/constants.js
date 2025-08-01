"use strict";
/**
 * @fileoverview AI Model configurations and constants for the Ganger Platform
 * Healthcare-optimized model selection and platform configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.PLATFORM_URLS = exports.SYSTEM_PROMPTS = exports.HIPAA_SAFETY_CONFIG = exports.DEFAULT_BUDGETS = exports.EMERGENCY_THRESHOLDS = exports.MODEL_SELECTION = exports.APP_RATE_LIMITS = exports.AI_MODELS = void 0;
/**
 * Primary AI Models Configuration
 * Based on PRD specifications for medical practice workflows
 */
exports.AI_MODELS = {
    // Tier 1 - Production Ready Models
    'llama-4-scout-17b-16e-instruct': {
        model: 'llama-4-scout-17b-16e-instruct',
        maxTokens: 2048,
        costPerToken: 0.000125, // $0.125 per 1M neurons
        capabilities: ['patient_communication', 'clinical_documentation', 'complex_reasoning'],
        tier: 1,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 20,
            requestsPerHour: 1000,
            dailyBudget: 50.00,
            cooldownBetweenRequests: 1000,
            dailyRequestLimit: 1000
        }
    },
    'llama-3.3-70b-instruct-fp8-fast': {
        model: 'llama-3.3-70b-instruct-fp8-fast',
        maxTokens: 1024,
        costPerToken: 0.000125,
        capabilities: ['real_time_chat', 'patient_communication'],
        tier: 1,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 50,
            requestsPerHour: 2000,
            dailyBudget: 25.00,
            cooldownBetweenRequests: 500,
            dailyRequestLimit: 2000
        }
    },
    'llama-guard-3-8b': {
        model: 'llama-guard-3-8b',
        maxTokens: 512,
        costPerToken: 0.000011,
        capabilities: ['safety_filtering'],
        tier: 1,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            dailyBudget: 10.00,
            cooldownBetweenRequests: 100,
            dailyRequestLimit: 10000
        }
    },
    // Tier 2 - Feature Enhancement Models
    'qwq-32b': {
        model: 'qwq-32b',
        maxTokens: 4096,
        costPerToken: 0.000087,
        capabilities: ['complex_reasoning', 'business_intelligence'],
        tier: 2,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 10,
            requestsPerHour: 500,
            dailyBudget: 20.00,
            cooldownBetweenRequests: 2000,
            dailyRequestLimit: 200
        }
    },
    'llama-3.2-11b-vision-instruct': {
        model: 'llama-3.2-11b-vision-instruct',
        maxTokens: 2048,
        costPerToken: 0.00008,
        capabilities: ['document_processing'],
        tier: 2,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 15,
            requestsPerHour: 400,
            dailyBudget: 15.00,
            cooldownBetweenRequests: 1500,
            dailyRequestLimit: 400
        }
    },
    'whisper-large-v3-turbo': {
        model: 'whisper-large-v3-turbo',
        maxTokens: 1024,
        costPerToken: 0.00006,
        capabilities: ['voice_processing'],
        tier: 2,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 30,
            requestsPerHour: 1000,
            dailyBudget: 10.00,
            cooldownBetweenRequests: 1000,
            dailyRequestLimit: 1000
        }
    },
    'melotts': {
        model: 'melotts',
        maxTokens: 512,
        costPerToken: 0.00005,
        capabilities: ['voice_processing'],
        tier: 2,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 30,
            requestsPerHour: 1000,
            dailyBudget: 8.00,
            cooldownBetweenRequests: 1000,
            dailyRequestLimit: 1000
        }
    },
    'bge-m3': {
        model: 'bge-m3',
        maxTokens: 512,
        costPerToken: 0.00004,
        capabilities: ['document_processing'],
        tier: 2,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 3000,
            dailyBudget: 5.00,
            cooldownBetweenRequests: 200,
            dailyRequestLimit: 5000
        }
    },
    'bge-reranker-base': {
        model: 'bge-reranker-base',
        maxTokens: 512,
        costPerToken: 0.00004,
        capabilities: ['document_processing'],
        tier: 2,
        hipaaCompliant: true,
        rateLimits: {
            requestsPerMinute: 100,
            requestsPerHour: 3000,
            dailyBudget: 5.00,
            cooldownBetweenRequests: 200,
            dailyRequestLimit: 5000
        }
    }
};
/**
 * Application-Specific Rate Limits
 * Per-application usage controls based on PRD specifications
 */
exports.APP_RATE_LIMITS = {
    'ai-receptionist': {
        requestsPerMinute: 100,
        requestsPerHour: 2000,
        dailyBudget: 50.00,
        burstLimit: 150,
        dailyRequestLimit: 2000
    },
    'clinical-staffing': {
        requestsPerMinute: 20,
        requestsPerHour: 500,
        dailyBudget: 20.00,
        dailyRequestLimit: 500
    },
    'checkin-kiosk': {
        requestsPerMinute: 50,
        requestsPerHour: 1000,
        dailyBudget: 25.00,
        dailyRequestLimit: 1000
    },
    'eos-l10': {
        requestsPerMinute: 15,
        requestsPerHour: 300,
        dailyBudget: 15.00,
        dailyRequestLimit: 300
    },
    'inventory': {
        requestsPerMinute: 10,
        requestsPerHour: 200,
        dailyBudget: 8.00,
        dailyRequestLimit: 200
    },
    'handouts': {
        requestsPerMinute: 15,
        requestsPerHour: 300,
        dailyBudget: 10.00,
        dailyRequestLimit: 300
    },
    'medication-auth': {
        requestsPerMinute: 25,
        requestsPerHour: 600,
        dailyBudget: 18.00,
        dailyRequestLimit: 600
    },
    'pharma-scheduling': {
        requestsPerMinute: 10,
        requestsPerHour: 200,
        dailyBudget: 8.00,
        dailyRequestLimit: 200
    },
    'call-center-ops': {
        requestsPerMinute: 30,
        requestsPerHour: 800,
        dailyBudget: 22.00,
        dailyRequestLimit: 800
    },
    'batch-closeout': {
        requestsPerMinute: 5,
        requestsPerHour: 100,
        dailyBudget: 5.00,
        dailyRequestLimit: 100
    },
    'socials-reviews': {
        requestsPerMinute: 8,
        requestsPerHour: 150,
        dailyBudget: 6.00,
        dailyRequestLimit: 150
    },
    'compliance-training': {
        requestsPerMinute: 12,
        requestsPerHour: 250,
        dailyBudget: 10.00,
        dailyRequestLimit: 250
    },
    'platform-dashboard': {
        requestsPerMinute: 20,
        requestsPerHour: 400,
        dailyBudget: 12.00,
        dailyRequestLimit: 400
    },
    'config-dashboard': {
        requestsPerMinute: 5,
        requestsPerHour: 100,
        dailyBudget: 4.00,
        dailyRequestLimit: 100
    },
    'component-showcase': {
        requestsPerMinute: 3,
        requestsPerHour: 50,
        dailyBudget: 2.00,
        dailyRequestLimit: 50
    },
    'staff': {
        requestsPerMinute: 25,
        requestsPerHour: 600,
        dailyBudget: 15.00,
        dailyRequestLimit: 600
    },
    'integration-status': {
        requestsPerMinute: 8,
        requestsPerHour: 150,
        dailyBudget: 5.00,
        dailyRequestLimit: 150
    }
};
/**
 * Model Selection Strategy
 * Automatic model selection based on use case and application context
 */
exports.MODEL_SELECTION = {
    patient_communication: [
        'llama-4-scout-17b-16e-instruct',
        'llama-3.3-70b-instruct-fp8-fast'
    ],
    clinical_documentation: [
        'llama-4-scout-17b-16e-instruct'
    ],
    business_intelligence: [
        'qwq-32b',
        'llama-4-scout-17b-16e-instruct'
    ],
    document_processing: [
        'llama-3.2-11b-vision-instruct',
        'bge-m3',
        'bge-reranker-base'
    ],
    voice_processing: [
        'whisper-large-v3-turbo',
        'melotts'
    ],
    safety_filtering: [
        'llama-guard-3-8b'
    ],
    real_time_chat: [
        'llama-3.3-70b-instruct-fp8-fast',
        'llama-4-scout-17b-16e-instruct'
    ],
    complex_reasoning: [
        'qwq-32b',
        'llama-4-scout-17b-16e-instruct'
    ]
};
/**
 * Emergency Control Thresholds
 * Platform-wide safety thresholds for cost and usage control
 */
exports.EMERGENCY_THRESHOLDS = {
    // Cost-based triggers
    costPerHour: 100, // Emergency stop if >$100/hour
    costPerDay: 1000, // Emergency stop if >$1000/day
    // Usage-based triggers
    requestsPerMinute: 500, // Emergency stop if >500 req/min platform-wide
    errorRate: 0.1, // Emergency stop if >10% error rate
    consecutiveFailures: 10, // Emergency stop after 10 consecutive failures
    // Budget thresholds
    dailyBudgetWarning: 0.8, // Warning at 80% of daily budget
    dailyBudgetEmergency: 0.95, // Emergency stop at 95% of daily budget
    monthlyBudgetWarning: 0.85, // Warning at 85% of monthly budget
    // Recovery conditions
    recoveryWaitTime: 900000, // 15 minutes before attempting recovery
    recoveryGradualLimit: 0.5, // Start recovery at 50% of normal limits
    fullRecoveryTime: 3600000 // 1 hour of normal operation before full restoration
};
/**
 * Default Budget Configuration
 * Conservative budget allocations per PRD specifications
 */
exports.DEFAULT_BUDGETS = {
    // Daily budgets (USD)
    conservativeDaily: 30.00,
    normalDaily: 50.00,
    growthDaily: 100.00,
    // Monthly budgets (USD)
    conservativeMonthly: 900.00,
    normalMonthly: 1500.00,
    growthMonthly: 3000.00,
    // Emergency thresholds (USD)
    emergencyDaily: 200.00,
    emergencyMonthly: 5000.00
};
/**
 * HIPAA Safety Configuration
 * Safety filtering and compliance settings
 */
exports.HIPAA_SAFETY_CONFIG = {
    // Safety score thresholds (0-1 scale)
    minimumSafetyScore: 0.8, // Minimum score to proceed
    warningThreshold: 0.9, // Issue warning below this score
    strictThreshold: 0.95, // Strict mode threshold
    // PHI detection sensitivity
    phiDetectionSensitivity: 'high', // 'low' | 'medium' | 'high' | 'strict'
    // Required audit fields
    auditRequired: [
        'patient_communication',
        'clinical_documentation'
    ],
    // Automatic safety filtering
    autoFilter: true,
    blockUnsafeContent: true,
    logAllInteractions: true
};
/**
 * Default System Prompts
 * Healthcare-optimized system prompts for different contexts
 */
exports.SYSTEM_PROMPTS = {
    patient_communication: `You are a professional medical assistant for Ganger Dermatology. Always maintain HIPAA compliance, be respectful and professional, and provide accurate medical information while encouraging patients to consult with their healthcare providers for specific medical advice.`,
    clinical_documentation: `You are assisting with clinical documentation for Ganger Dermatology. Maintain strict HIPAA compliance, ensure accuracy in all medical terminology, and follow proper medical documentation standards.`,
    business_intelligence: `You are a business intelligence assistant for Ganger Dermatology. Analyze data objectively, provide actionable insights, and maintain confidentiality of all business information.`,
    real_time_chat: `You are a helpful assistant for Ganger Dermatology staff. Be concise, professional, and efficient in your responses while maintaining patient privacy and confidentiality.`,
    safety_filtering: `Analyze the content for HIPAA compliance, safety concerns, and appropriateness. Flag any potential PHI, unsafe content, or policy violations.`
};
/**
 * Platform Integration URLs
 * For cross-app navigation and monitoring
 */
exports.PLATFORM_URLS = {
    STAFF_PORTAL: 'https://staff.gangerdermatology.com',
    AI_MONITORING: '/ai-monitoring',
    USAGE_DASHBOARD: '/platform-dashboard/ai-usage',
    COST_TRACKING: '/platform-dashboard/ai-costs',
    AUDIT_LOGS: '/platform-dashboard/ai-audit'
};
/**
 * Error Messages
 * Standardized error messages for consistent UX
 */
exports.ERROR_MESSAGES = {
    RATE_LIMIT_EXCEEDED: 'AI request rate limit exceeded. Please try again in a few moments.',
    BUDGET_EXCEEDED: 'Daily AI budget exceeded. Please contact your administrator.',
    SAFETY_VIOLATION: 'Content safety check failed. Please review your request.',
    MODEL_UNAVAILABLE: 'The requested AI model is currently unavailable. Trying alternative model.',
    AUTHENTICATION_REQUIRED: 'Authentication required for AI features.',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this AI operation.',
    EMERGENCY_STOP: 'AI services temporarily suspended due to usage limits. Please contact support.',
    HIPAA_VIOLATION: 'Request contains potential PHI and cannot be processed.',
    NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
    TIMEOUT_ERROR: 'AI request timed out. Please try again with a shorter request.'
};
