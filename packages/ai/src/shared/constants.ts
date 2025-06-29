/**
 * @fileoverview AI Model configurations and constants for the Ganger Platform
 * Healthcare-optimized model selection and platform configurations
 */

import type { AIModel, ModelConfig, RateLimitConfig, ApplicationContext, UseCase } from './types';

/**
 * Primary AI Models Configuration
 */
export const AI_MODELS: Record<AIModel, ModelConfig> = {
  'llama-4-scout-17b-16e-instruct': {
    model: 'llama-4-scout-17b-16e-instruct',
    maxTokens: 2048,
    costPerToken: 0.000125,
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
      cooldownBetweenRequests: 500,
      dailyRequestLimit: 1000
    }
  },
  'melotts': {
    model: 'melotts',
    maxTokens: 2048,
    costPerToken: 0.00005,
    capabilities: ['voice_processing'],
    tier: 2,
    hipaaCompliant: true,
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerHour: 800,
      dailyBudget: 8.00,
      cooldownBetweenRequests: 800,
      dailyRequestLimit: 800
    }
  },
  'llama-3.2-3b-instruct': {
    model: 'llama-3.2-3b-instruct',
    maxTokens: 4096,
    costPerToken: 0.00006,
    capabilities: ['patient_communication', 'document_generation', 'real_time_chat'],
    tier: 1,
    hipaaCompliant: true,
    rateLimits: {
      requestsPerMinute: 120,
      requestsPerHour: 3600,
      dailyBudget: 20.00,
      cooldownBetweenRequests: 100,
      dailyRequestLimit: 10000
    }
  },
  'llama-3.2-1b-instruct': {
    model: 'llama-3.2-1b-instruct',
    maxTokens: 2048,
    costPerToken: 0.00005,
    capabilities: ['patient_communication', 'real_time_chat'],
    tier: 1,
    hipaaCompliant: true,
    rateLimits: {
      requestsPerMinute: 150,
      requestsPerHour: 4000,
      dailyBudget: 15.00,
      cooldownBetweenRequests: 50,
      dailyRequestLimit: 12000
    }
  },
  'bge-m3': {
    model: 'bge-m3',
    maxTokens: 512,
    costPerToken: 0.00002,
    capabilities: ['embeddings'],
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
    costPerToken: 0.00003,
    capabilities: ['reranking'],
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
 */
export const APP_RATE_LIMITS: Record<ApplicationContext, RateLimitConfig> = {
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
 */
export const MODEL_SELECTION: Record<UseCase, AIModel[]> = {
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
  document_generation: [
    'llama-4-scout-17b-16e-instruct',
    'llama-3.2-3b-instruct'
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
  ],
  embeddings: [
    'bge-m3'
  ],
  reranking: [
    'bge-reranker-base'
  ]
};

/**
 * System Prompts for Different Use Cases
 */
export const SYSTEM_PROMPTS: Record<UseCase, string> = {
  patient_communication: `You are a professional medical assistant for Ganger Dermatology. Provide helpful, accurate, and empathetic responses to patient inquiries. Always maintain HIPAA compliance and patient privacy.`,
  clinical_documentation: `You are a clinical documentation assistant. Help create accurate, comprehensive medical documentation while maintaining professional standards and HIPAA compliance.`,
  business_intelligence: `You are a business intelligence assistant for healthcare operations. Analyze data, provide insights, and help optimize clinical and business processes.`,
  document_processing: `You are a document processing assistant. Extract, analyze, and process medical documents accurately while maintaining data integrity and compliance.`,
  document_generation: `You are a document generation assistant. Create professional medical documents, patient handouts, and educational materials while ensuring accuracy and compliance.`,
  voice_processing: `You are a voice processing assistant. Convert speech to text and text to speech accurately for medical communications.`,
  safety_filtering: `You are a safety and compliance assistant. Ensure all content meets HIPAA requirements and contains no PHI exposure risks.`,
  real_time_chat: `You are a real-time assistant for Ganger Dermatology staff. Provide quick, accurate responses to help with daily operations.`,
  complex_reasoning: `You are an advanced reasoning assistant. Analyze complex problems, provide detailed solutions, and help with strategic decision-making.`,
  embeddings: `You are an embedding generation assistant for semantic search and document retrieval.`,
  reranking: `You are a reranking assistant for optimizing search results and document relevance.`
};

/**
 * Emergency Thresholds
 */
export const EMERGENCY_THRESHOLDS = {
  costPerHour: 100,
  requestsPerMinute: 500,
  errorRate: 0.1,
  consecutiveFailures: 10
};

/**
 * HIPAA Safety Configuration
 */
export const HIPAA_SAFETY_CONFIG = {
  enableSafetyCheck: true,
  safetyModel: 'llama-guard-3-8b' as AIModel,
  phiPatterns: [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{10,}\b/, // Phone numbers
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email
  ],
  requiredSafetyScore: 0.9
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  RATE_LIMIT_EXCEEDED: 'Request rate limit exceeded. Please try again later.',
  BUDGET_EXCEEDED: 'Daily budget limit reached for this application.',
  SAFETY_VIOLATION: 'Content failed safety check. PHI exposure risk detected.',
  MODEL_UNAVAILABLE: 'The requested AI model is currently unavailable.',
  INVALID_REQUEST: 'Invalid request format or parameters.',
  INTERNAL_ERROR: 'An internal error occurred. Please try again.',
  EMERGENCY_STOP: 'Emergency stop activated due to unusual activity.',
  AUTHENTICATION_REQUIRED: 'Authentication required to use AI features.'
};