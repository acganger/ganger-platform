/**
 * @fileoverview TypeScript type definitions for the Ganger AI Workers system
 * Provides comprehensive type safety for all AI operations across the platform
 */

import type { User } from '@ganger/types';

/**
 * Supported AI Models Configuration
 * Based on PRD specifications for healthcare-optimized models
 */
export type AIModel = 
  // Tier 1 - Production Ready
  | 'llama-4-scout-17b-16e-instruct'    // Medical conversation & decision support
  | 'llama-3.3-70b-instruct-fp8-fast'  // Fast real-time chat
  | 'llama-guard-3-8b'                 // HIPAA safety & compliance
  // Tier 2 - Feature Enhancement
  | 'qwq-32b'                          // Complex business reasoning
  | 'llama-3.2-11b-vision-instruct'    // Document & image processing
  | 'whisper-large-v3-turbo'           // Speech-to-text
  | 'melotts'                          // Text-to-speech
  | 'bge-m3'                           // Embeddings
  | 'bge-reranker-base';               // Reranking

/**
 * Application Context Types
 * Maps to the 17 Ganger Platform applications
 */
export type ApplicationContext = 
  | 'ai-receptionist'
  | 'inventory'
  | 'handouts'
  | 'checkin-kiosk'
  | 'medication-auth'
  | 'eos-l10'
  | 'pharma-scheduling'
  | 'call-center-ops'
  | 'batch-closeout'
  | 'socials-reviews'
  | 'clinical-staffing'
  | 'compliance-training'
  | 'platform-dashboard'
  | 'config-dashboard'
  | 'component-showcase'
  | 'staff'
  | 'integration-status';

/**
 * Use Case Categories for Model Selection
 */
export type UseCase = 
  | 'patient_communication'
  | 'clinical_documentation'
  | 'business_intelligence'
  | 'document_processing'
  | 'voice_processing'
  | 'safety_filtering'
  | 'real_time_chat'
  | 'complex_reasoning';

/**
 * HIPAA Compliance Levels
 */
export type HIPAAComplianceLevel = 
  | 'none'        // No PHI involved
  | 'standard'    // Basic HIPAA compliance
  | 'strict'      // Enhanced PHI protection
  | 'audit';      // Full audit trail required

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
    budgetStatus: number; // Percentage of allocated budget used
  };
}

/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  dailyBudget: number; // USD
  burstLimit?: number;
  cooldownBetweenRequests?: number; // milliseconds
  dailyRequestLimit?: number;
}

/**
 * Model Configuration
 */
export interface ModelConfig {
  model: AIModel;
  maxTokens: number;
  costPerToken: number; // USD per token
  capabilities: UseCase[];
  tier: 1 | 2; // Tier 1 = Production Ready, Tier 2 = Feature Enhancement
  rateLimits: RateLimitConfig;
  hipaaCompliant: boolean;
}

/**
 * Budget Control Configuration
 */
export interface BudgetControls {
  dailyLimit: number;      // USD per day
  monthlyLimit: number;    // USD per month
  emergencyThreshold: number; // USD per hour that triggers emergency stop
  warningThresholds: {
    daily: number;         // Percentage of daily budget
    hourly: number;        // USD per hour
    consecutive: number;   // Number of consecutive failures
  };
}

/**
 * Emergency Control States
 */
export type EmergencyState = 
  | 'normal'
  | 'warning'
  | 'emergency_stop'
  | 'recovery';

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
  inputHash: string;      // Hashed input for audit without storing PHI
  outputHash: string;     // Hashed output for audit without storing PHI
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
  // Environment configuration
  cloudflareToken?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  
  // Default settings
  defaultModel?: AIModel;
  defaultTimeout?: number;
  
  // Feature flags
  enableUsageMonitoring?: boolean;
  enableSafetyFiltering?: boolean;
  enableRateLimiting?: boolean;
  enableAuditLogging?: boolean;
  
  // Emergency controls
  emergencyControls?: BudgetControls;
}

/**
 * Error Types
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class RateLimitError extends AIError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED');
  }
}

export class BudgetExceededError extends AIError {
  constructor(message: string, public currentUsage: number, public limit: number) {
    super(message, 'BUDGET_EXCEEDED');
  }
}

export class SafetyViolationError extends AIError {
  constructor(message: string, public safetyScore: number) {
    super(message, 'SAFETY_VIOLATION');
  }
}

export class ModelUnavailableError extends AIError {
  constructor(message: string, public model: AIModel) {
    super(message, 'MODEL_UNAVAILABLE');
  }
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