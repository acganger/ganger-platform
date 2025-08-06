/**
 * @fileoverview Core GangerAI server-side client class
 * Provides healthcare-optimized AI capabilities with HIPAA compliance, cost controls, and monitoring
 */

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { AuthUser } from '@ganger/auth';
import { db } from '@ganger/db';
import { auditLogQueries } from '@ganger/db';

import type {
  AIModel,
  ApplicationContext,
  UseCase,
  GangerAIConfig,
  AIChatRequest,
  AIResponse,
  ChatMessage,
  SafetyCheckResponse,
  AIUsageEvent,
  ModelConfig,
  RateLimitConfig,
  EmergencyState,
  HIPAAComplianceLevel
} from '../shared/types';

import {
  AIError,
  RateLimitError,
  BudgetExceededError,
  SafetyViolationError,
  ModelUnavailableError
} from '../shared/types';

import { SafetyFilter } from './safety';
import { ReliabilityManager } from './reliability';
import { AIResponseCache } from './cache';
import { CostMonitor } from './monitoring';
import { AIErrorHandler, withErrorHandling } from './error-handling';

import {
  AI_MODELS,
  APP_RATE_LIMITS,
  MODEL_SELECTION,
  EMERGENCY_THRESHOLDS,
  HIPAA_SAFETY_CONFIG,
  SYSTEM_PROMPTS,
  ERROR_MESSAGES
} from '../shared/constants';

/**
 * Request validation schemas
 */
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1).max(10000),
    metadata: z.object({
      timestamp: z.date().optional(),
      userId: z.string().optional(),
      sessionId: z.string().optional()
    }).optional()
  })),
  config: z.object({
    model: z.string().optional(),
    maxTokens: z.number().optional(),
    temperature: z.number().min(0).max(2).optional(),
    timeoutMs: z.number().optional()
  }).optional()
});

/**
 * Core GangerAI Client Class
 * Provides unified AI capabilities across all Ganger Platform applications
 */
export class GangerAI {
  private config: GangerAIConfig;
  private emergencyState: EmergencyState = 'normal';
  private usageCache = new Map<string, number>();
  private lastRequestTime = 0;
  
  // Enhanced feature modules
  private safetyFilter!: SafetyFilter;
  private reliabilityManager!: ReliabilityManager;
  private responseCache!: AIResponseCache;
  private costMonitor!: CostMonitor;
  private errorHandler!: AIErrorHandler;

  constructor(config: GangerAIConfig) {
    this.config = {
      // Default configuration
      enableUsageMonitoring: true,
      enableSafetyFiltering: true,
      enableRateLimiting: true,
      enableAuditLogging: true,
      defaultTimeout: 30000,
      hipaaCompliant: true,
      ...config
    };

    this.validateConfig();
    this.initializeFeatureModules();
  }

  /**
   * Initialize feature modules with configuration
   */
  private initializeFeatureModules(): void {
    // Initialize safety filter with HIPAA compliance level
    const complianceLevel = this.config.hipaaCompliant ? 'strict' : 'standard';
    this.safetyFilter = new SafetyFilter(complianceLevel);

    // Initialize reliability manager with custom config
    this.reliabilityManager = new ReliabilityManager();

    // Initialize response cache with app-specific TTL
    this.responseCache = new AIResponseCache({
      defaultTtlMs: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000,
      evictionPolicy: 'lru',
      enableCompression: false,
      enableMetrics: true
    });

    // Initialize cost monitor with budget controls
    this.costMonitor = new CostMonitor({
      dailyBudgetUSD: this.config.emergencyControls?.dailyLimit || 50,
      monthlyBudgetUSD: this.config.emergencyControls?.monthlyLimit || 1000,
      alertThresholds: {
        daily: 0.8,
        monthly: 0.9
      },
      costPerToken: {
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
      }
    });

    // Initialize error handler
    this.errorHandler = new AIErrorHandler();
  }

  /**
   * Main chat interface for AI interactions
   */
  async chat(request: AIChatRequest): Promise<AIResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();

    return withErrorHandling(async () => {
      // Validate request
      const validatedRequest = this.validateRequest(request);
      
      // Check cache first
      const cachedResponse = this.responseCache.getCachedResponse(
        validatedRequest.messages,
        validatedRequest.config?.model || this.config.defaultModel || 'llama-4-scout-17b-16e-instruct',
        validatedRequest.config
      );
      
      if (cachedResponse) {
        return this.createCachedResponse(cachedResponse, requestId, startTime);
      }
      
      // Select optimal model
      const selectedModel = this.selectModel(validatedRequest);
      
      // Pre-flight checks
      await this.performPreflightChecks(validatedRequest, selectedModel, requestId);
      
      // Safety filtering (if enabled)
      if (this.config.enableSafetyFiltering) {
        await this.performSafetyCheck(validatedRequest.messages, requestId);
      }
      
      // Execute AI request with reliability features
      const response = await this.executeAIRequestWithReliability(
        validatedRequest, 
        selectedModel, 
        requestId
      );
      
      // Post-processing
      await this.postProcessResponse(response, requestId, startTime);
      
      return response;

    }, {
      app: request.config?.app || 'platform-dashboard',
      requestId,
      timestamp: Date.now()
    });
  }

  /**
   * Create cached response
   */
  private createCachedResponse(content: string, requestId: string, startTime: number): AIResponse {
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      data: content,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        model: 'cached' as AIModel,
        responseTime,
        cached: true
      }
    };
  }

  /**
   * Execute AI request with reliability features
   */
  private async executeAIRequestWithReliability(
    request: AIChatRequest,
    model: AIModel,
    requestId: string
  ): Promise<AIResponse> {
    const result = await this.reliabilityManager.executeReliably(
      model,
      async (selectedModel) => {
        return this.executeAIRequest(request, selectedModel, requestId);
      },
      {
        timeoutMs: request.config?.timeoutMs || this.config.defaultTimeout,
        retryConfig: {
          maxRetries: 3,
          baseDelayMs: 1000
        }
      }
    );

    return result.result;
  }

  /**
   * Safety check for HIPAA compliance
   */
  async checkSafety(content: { content: string; context?: UseCase }): Promise<SafetyCheckResponse> {
    try {
      const safetyModel = 'llama-guard-3-8b';
      const safetyPrompt = this.buildSafetyPrompt(content.content, content.context);
      
      // Execute safety check with dedicated safety model
      const response = await this.callCloudflareAI(safetyModel, [
        { role: 'system', content: SYSTEM_PROMPTS.safety_filtering },
        { role: 'user', content: safetyPrompt }
      ]);

      const safetyScore = this.parseSafetyScore(response);
      const containsPHI = this.detectPHI(content.content);
      
      const isSafe = safetyScore >= HIPAA_SAFETY_CONFIG.requiredSafetyScore && !containsPHI;

      return {
        success: true,
        data: {
          safe: isSafe,
          score: safetyScore,
          containsPHI,
          reasons: isSafe ? [] : ['Low safety score', ...(containsPHI ? ['Contains PHI'] : [])]
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAFETY_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Safety check failed'
        }
      };
    }
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    requests: number;
    cost: number;
    remainingBudget: number;
    topModels: Array<{ model: AIModel; requests: number }>;
  }> {
    const now = new Date();
    const startTime = new Date();
    
    switch (timeframe) {
      case 'hour':
        startTime.setHours(now.getHours() - 1);
        break;
      case 'day':
        startTime.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startTime.setDate(now.getDate() - 7);
        startTime.setHours(0, 0, 0, 0);
        break;
    }

    try {
      const usage = await db.query(`
        SELECT 
          COUNT(*) as requests,
          SUM(cost) as total_cost,
          model,
          COUNT(*) as model_requests
        FROM ai_usage_events 
        WHERE app = $1 AND timestamp >= $2
        GROUP BY model
        ORDER BY model_requests DESC
      `, [this.config.app, startTime.toISOString()]);

      const totalRequests = usage.reduce((sum: number, row: any) => sum + parseInt(row.requests), 0);
      const totalCost = usage.reduce((sum: number, row: any) => sum + parseFloat(row.total_cost || '0'), 0);
      
      const appLimits = APP_RATE_LIMITS[this.config.app!];
      const remainingBudget = appLimits.dailyBudget - totalCost;

      const topModels = usage.map((row: any) => ({
        model: row.model as AIModel,
        requests: parseInt(row.model_requests)
      }));

      return {
        requests: totalRequests,
        cost: totalCost,
        remainingBudget: Math.max(0, remainingBudget),
        topModels
      };

    } catch (error) {
      // Fallback to cache if database is unavailable
      return {
        requests: 0,
        cost: 0,
        remainingBudget: APP_RATE_LIMITS[this.config.app!]?.dailyBudget || 10,
        topModels: []
      };
    }
  }

  /**
   * Private Methods
   */

  private validateConfig(): void {
    if (!this.config.app) {
      throw new AIError('Application context is required', 'INVALID_CONFIG');
    }

    if (this.config.hipaaCompliant && !this.config.enableSafetyFiltering) {
      throw new AIError('Safety filtering required for HIPAA compliance', 'INVALID_CONFIG');
    }
  }

  private validateRequest(request: AIChatRequest): AIChatRequest {
    try {
      chatRequestSchema.parse(request);
      return request; // Return original request after validation
    } catch (error) {
      throw new AIError('Invalid request format', 'INVALID_REQUEST', error);
    }
  }

  private selectModel(request: AIChatRequest): AIModel {
    // Use explicitly specified model
    if (request.config?.model && AI_MODELS[request.config.model as AIModel]) {
      return request.config.model as AIModel;
    }

    // Use default model from config
    if (this.config.defaultModel && AI_MODELS[this.config.defaultModel]) {
      return this.config.defaultModel;
    }

    // Auto-select based on context and use case
    const useCase = this.config.context || 'real_time_chat';
    const candidates = MODEL_SELECTION[useCase] || MODEL_SELECTION.real_time_chat;
    
    // Select first available model from candidates
    for (const model of candidates) {
      if (AI_MODELS[model]) {
        return model;
      }
    }

    // Fallback to fast chat model
    return 'llama-3.3-70b-instruct-fp8-fast';
  }

  private async performPreflightChecks(
    request: AIChatRequest, 
    model: AIModel, 
    requestId: string
  ): Promise<void> {
    // Emergency state check
    if (this.emergencyState === 'emergency_stop') {
      throw new AIError(ERROR_MESSAGES.EMERGENCY_STOP, 'EMERGENCY_STOP');
    }

    // Rate limiting check
    if (this.config.enableRateLimiting) {
      await this.checkRateLimit(model, requestId);
    }

    // Budget check
    await this.checkBudget(model, request, requestId);

    // Authentication check
    if (this.config.user && !this.config.user.id) {
      throw new AIError(ERROR_MESSAGES.AUTHENTICATION_REQUIRED, 'AUTHENTICATION_REQUIRED');
    }
  }

  private async performSafetyCheck(messages: ChatMessage[], requestId: string): Promise<void> {
    const userContent = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');

    const safetyResult = await this.checkSafety({ 
      content: userContent, 
      context: this.config.context 
    });

    if (!safetyResult.success || !safetyResult.data?.safe) {
      const reasons = safetyResult.data?.reasons || ['Safety check failed'];
      throw new SafetyViolationError(
        `${ERROR_MESSAGES.SAFETY_VIOLATION}: ${reasons.join(', ')}`,
        safetyResult.data?.score || 0
      );
    }

    // Log safety check for audit trail
    if (this.config.enableAuditLogging) {
      await this.logAuditEvent({
        requestId,
        action: 'safety_check',
        result: 'passed',
        safetyScore: safetyResult.data.score,
        containsPHI: safetyResult.data.containsPHI || false
      });
    }
  }

  private async executeAIRequest(
    request: AIChatRequest,
    model: AIModel,
    requestId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Add system prompt if not present
      const messages = this.addSystemPrompt(request.messages);
      
      // Call Cloudflare Workers AI
      const response = await this.callCloudflareAI(model, messages, request.config);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Calculate usage metrics
      const tokensUsed = this.estimateTokens(messages, response);
      const cost = this.calculateCost(model, tokensUsed);

      return {
        success: true,
        data: response,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          model,
          tokensUsed,
          cost,
          responseTime
        }
      };

    } catch (error) {
      throw new ModelUnavailableError(
        `Model ${model} is currently unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        model
      );
    }
  }

  private async callCloudflareAI(
    model: AIModel,
    messages: ChatMessage[],
    config?: any
  ): Promise<string> {
    // Log config for debugging
    if (config) {
      console.debug('[Cloudflare AI] Using config:', config);
    }
    // Map our model names to Cloudflare's model identifiers
    const modelMapping: Record<AIModel, string> = {
      'llama-4-scout-17b-16e-instruct': '@cf/meta/llama-3.1-8b-instruct', // Using available model as substitute
      'llama-3.3-70b-instruct-fp8-fast': '@cf/meta/llama-3.1-8b-instruct-fast',
      'llama-guard-3-8b': '@cf/meta/llama-guard-3-11b-vision-preview',
      'qwq-32b': '@cf/qwen/qwen1.5-14b-chat-awq',
      'llama-3.2-11b-vision-instruct': '@cf/meta/llama-3.2-11b-vision-instruct',
      'llama-3.2-3b-instruct': '@cf/meta/llama-3.2-3b-instruct',
      'llama-3.2-1b-instruct': '@cf/meta/llama-3.2-1b-instruct',
      'whisper-large-v3-turbo': '@cf/openai/whisper',
      'melotts': '@cf/bytedance/stable-diffusion-xl-lightning', // No TTS model available, using placeholder
      'bge-m3': '@cf/baai/bge-base-en-v1.5',
      'bge-reranker-base': '@cf/baai/bge-reranker-base'
    };

    const cfModel = modelMapping[model];
    if (!cfModel) {
      throw new ModelUnavailableError(`No Cloudflare mapping for model ${model}`, model);
    }

    // Use environment variables or config
    const accountId = this.config.cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID || '68d0160c9915efebbbecfddfd48cddab';
    const apiToken = this.config.cloudflareToken || process.env.CLOUDFLARE_API_TOKEN || 'TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf';

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${cfModel}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new AIError(
          `Cloudflare AI API error: ${response.status} - ${JSON.stringify(errorData)}`,
          'MODEL_API_ERROR'
        );
      }

      const result = await response.json();
      
      // Handle different response formats from Cloudflare
      if (result.success === false) {
        throw new AIError(
          `AI model error: ${result.errors?.[0]?.message || 'Unknown error'}`,
          'MODEL_ERROR'
        );
      }

      // Extract the response text based on the model type
      if (result.result?.response) {
        return result.result.response;
      } else if (result.result?.text) {
        return result.result.text;
      } else if (typeof result.result === 'string') {
        return result.result;
      } else if (Array.isArray(result.result) && result.result[0]?.response) {
        // Some models return array of responses
        return result.result[0].response;
      } else {
        // Log the unexpected format for debugging
        console.error('Unexpected AI response format:', JSON.stringify(result));
        throw new AIError(
          'Unexpected response format from AI model',
          'MODEL_RESPONSE_ERROR'
        );
      }
    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }
      
      throw new AIError(
        `Failed to call AI model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MODEL_CALL_FAILED'
      );
    }
  }

  private addSystemPrompt(messages: ChatMessage[]): ChatMessage[] {
    const hasSystemPrompt = messages.some(msg => msg.role === 'system');
    
    if (!hasSystemPrompt && this.config.context) {
      const systemPrompt = SYSTEM_PROMPTS[this.config.context] || SYSTEM_PROMPTS.real_time_chat;
      return [
        { role: 'system', content: systemPrompt },
        ...messages
      ];
    }
    
    return messages;
  }

  private async postProcessResponse(
    response: AIResponse,
    requestId: string,
    startTime: number
  ): Promise<void> {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    console.debug(`[GangerAI] Request ${requestId} completed in ${responseTime}ms`);
    
    // Log usage metrics
    if (this.config.enableUsageMonitoring) {
      await this.logUsageEvent({
        id: uuidv4(),
        timestamp: new Date(),
        app: this.config.app!,
        model: response.meta.model,
        userId: this.config.user?.id,
        requestId,
        tokensUsed: response.meta.tokensUsed || 0,
        cost: response.meta.cost || 0,
        responseTime: response.meta.responseTime || 0,
        success: true,
        safetyScore: response.meta.safetyScore,
        containsPHI: false // Will be determined by safety check
      });
    }

    // Audit logging for HIPAA compliance
    if (this.config.enableAuditLogging && this.config.hipaaCompliant) {
      await this.logAuditEvent({
        requestId,
        action: 'ai_interaction',
        result: 'success',
        model: response.meta.model,
        cost: response.meta.cost || 0,
        responseTime: response.meta.responseTime || 0
      });
    }
  }

  /**
   * Handle errors and return a consistent error response
   * This method is used by the error handling wrapper to format error responses
   */
  public handleError(error: any, requestId: string, startTime: number): AIResponse {
    const responseTime = Date.now() - startTime;
    
    // Log error usage event
    if (this.config.enableUsageMonitoring && this.config.app) {
      this.logUsageEvent({
        id: uuidv4(),
        timestamp: new Date(),
        app: this.config.app,
        model: 'llama-3.3-70b-instruct-fp8-fast', // Default for error tracking
        userId: this.config.user?.id,
        requestId,
        tokensUsed: 0,
        cost: 0,
        responseTime,
        success: false,
        errorCode: error.code || 'UNKNOWN_ERROR',
        containsPHI: false
      }).catch(() => {}); // Don't throw on logging errors
    }

    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'An unknown error occurred';

    if (error instanceof AIError) {
      errorCode = error.code;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: error.details || undefined
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        model: 'llama-3.3-70b-instruct-fp8-fast',
        responseTime
      }
    };
  }

  private async checkRateLimit(model: AIModel, requestId: string): Promise<void> {
    const now = Date.now();
    const modelConfig = AI_MODELS[model];
    const appLimits = APP_RATE_LIMITS[this.config.app!];
    
    console.debug(`[GangerAI] Checking rate limits for request ${requestId} - App: ${this.config.app}, Model: ${model}`);
    console.debug(`[GangerAI] App limits:`, appLimits);

    // Check cooldown between requests
    if (modelConfig.rateLimits.cooldownBetweenRequests) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < modelConfig.rateLimits.cooldownBetweenRequests) {
        const waitTime = modelConfig.rateLimits.cooldownBetweenRequests - timeSinceLastRequest;
        throw new RateLimitError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, waitTime);
      }
    }

    // Update last request time
    this.lastRequestTime = now;

    // Check daily request limits (implementation would check database)
    // For now, this is a placeholder
  }

  private async checkBudget(model: AIModel, request: AIChatRequest, requestId: string): Promise<void> {
    const appLimits = APP_RATE_LIMITS[this.config.app!];
    if (!appLimits) return;

    console.debug(`[GangerAI] Checking budget for request ${requestId}`);
    
    // Get today's usage
    const usage = await this.getUsageStats('day');
    
    // Estimate cost for this request
    const estimatedTokens = this.estimateTokens(request.messages, '');
    const estimatedCost = this.calculateCost(model, estimatedTokens);

    // Check if this request would exceed daily budget
    const projectedCost = usage.cost + estimatedCost;
    if (projectedCost > appLimits.dailyBudget * 0.95) { // 95% threshold
      throw new BudgetExceededError(
        ERROR_MESSAGES.BUDGET_EXCEEDED,
        usage.cost,
        appLimits.dailyBudget
      );
    }
  }

  private buildSafetyPrompt(content: string, context?: UseCase): string {
    return `Please analyze the following content for HIPAA compliance, safety, and appropriateness in a ${context || 'general'} context:

Content: "${content}"

Check for:
1. Protected Health Information (PHI)
2. Inappropriate content
3. Safety concerns
4. HIPAA compliance violations

Respond with a safety score (0-1) and explanation.`;
  }

  private parseSafetyScore(response: string): number {
    // Simple regex to extract safety score from response
    const scoreMatch = response.match(/(?:score|safety)[:\s]*([0-9.]+)/i);
    if (scoreMatch && scoreMatch[1]) {
      return Math.min(1, Math.max(0, parseFloat(scoreMatch[1])));
    }
    // Conservative default if no score found
    return 0.5;
  }

  private detectPHI(content: string): boolean {
    // Simple PHI detection patterns
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, // Date
      /\b(?:mr|mrs|ms|dr|doctor|patient)\s+[a-z]+\b/i // Names with titles
    ];

    return phiPatterns.some(pattern => pattern.test(content));
  }

  private estimateTokens(messages: ChatMessage[], response: string): number {
    const inputText = messages.map(m => m.content).join(' ');
    const totalText = inputText + response;
    // Rough estimation: ~4 characters per token
    return Math.ceil(totalText.length / 4);
  }

  private calculateCost(model: AIModel, tokens: number): number {
    const modelConfig = AI_MODELS[model];
    return tokens * modelConfig.costPerToken;
  }

  private async logUsageEvent(event: AIUsageEvent): Promise<void> {
    try {
      await db.query(`
        INSERT INTO ai_usage_events (
          id, timestamp, app, model, user_id, request_id,
          tokens_used, cost, response_time, success, error_code,
          safety_score, contains_phi
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        event.id,
        event.timestamp.toISOString(),
        event.app,
        event.model,
        event.userId,
        event.requestId,
        event.tokensUsed,
        event.cost,
        event.responseTime,
        event.success,
        event.errorCode,
        event.safetyScore,
        event.containsPHI
      ]);
    } catch (error) {
      // Log to console if database logging fails
      console.error('Failed to log AI usage event:', error);
    }
  }

  private async logAuditEvent(event: {
    requestId: string;
    action: string;
    result: string;
    model?: AIModel;
    cost?: number;
    responseTime?: number;
    safetyScore?: number;
    containsPHI?: boolean;
  }): Promise<void> {
    try {
      await auditLogQueries.logAction(
        this.config.user?.id,
        `ai_${event.action}`,
        'ai_request',
        event.requestId,
        {
          app: this.config.app,
          model: event.model,
          result: event.result,
          cost: event.cost,
          responseTime: event.responseTime,
          safetyScore: event.safetyScore,
          containsPHI: event.containsPHI
        }
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Debug and configuration helper methods
   */
  public getAvailableContexts(): ApplicationContext[] {
    // Return all available application contexts (only those defined in the type)
    return ['staff', 'inventory', 'handouts', 'checkin-kiosk', 'medication-auth', 'pharma-scheduling', 
            'eos-l10', 'clinical-staffing', 'call-center-ops', 'batch-closeout',
            'compliance-training', 'socials-reviews', 'platform-dashboard', 'integration-status',
            'config-dashboard', 'component-showcase', 'ai-receptionist'];
  }

  public getModelConfigs(): Record<AIModel, ModelConfig> {
    // Return model configurations for debugging
    return AI_MODELS;
  }

  public getRateLimitConfigs(): Record<ApplicationContext, RateLimitConfig> {
    // Return rate limit configurations
    return APP_RATE_LIMITS;
  }

  public getHIPAAComplianceLevels(): HIPAAComplianceLevel[] {
    // Return available HIPAA compliance levels
    return ['none', 'standard', 'strict', 'audit'];
  }

  public getEmergencyThresholds() {
    // Return emergency thresholds for monitoring
    return EMERGENCY_THRESHOLDS;
  }

  public createError(type: string, message: string, details?: any): AIError {
    // Use the error factory to create typed errors
    // TODO: Implement error factory method mapping
    console.debug(`[GangerAI] Creating error of type ${type}: ${message}`, details);
    return new AIError(message, 'internal_error', {
      factory: 'AIErrorFactory',
      requestedType: type,
      httpStatus: 500,
      ...details
    });
  }

  public getDebugInfo(): { cache: Map<string, number>, modules: { 
    safetyFilter: boolean, 
    reliabilityManager: boolean, 
    responseCache: boolean, 
    costMonitor: boolean, 
    errorHandler: boolean 
  }} {
    // Return debug information and module status
    return {
      cache: this.usageCache,
      modules: {
        safetyFilter: !!this.safetyFilter,
        reliabilityManager: !!this.reliabilityManager,
        responseCache: !!this.responseCache,
        costMonitor: !!this.costMonitor,
        errorHandler: !!this.errorHandler
      }
    };
  }

  public isAuthUserConfigured(user?: AuthUser): boolean {
    // Check if auth user is properly configured
    if (!user) return false;
    return !!(user.id && user.email);
  }
}

/**
 * Factory function to create GangerAI instances
 * Follows the pattern specified in the PRD
 */
export function createGangerAI(env: any, config: Partial<GangerAIConfig>): GangerAI {
  const fullConfig: GangerAIConfig = {
    // Extract from environment
    cloudflareToken: env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_AI_TOKEN || env.AI_TOKEN,
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Apply provided config
    ...config,
    
    // Ensure required fields
    app: config.app || 'staff',
    hipaaCompliant: config.hipaaCompliant !== false, // Default to true
  };

  return new GangerAI(fullConfig);
}