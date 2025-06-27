/**
 * @fileoverview Core GangerAI server-side client class
 * Provides healthcare-optimized AI capabilities with HIPAA compliance, cost controls, and monitoring
 */

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { User } from '@ganger/types';
import { db } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

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
  AIError,
  RateLimitError,
  BudgetExceededError,
  SafetyViolationError,
  ModelUnavailableError,
  HIPAAComplianceLevel
} from '../shared/types';

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
  }

  /**
   * Main chat interface for AI interactions
   */
  async chat(request: AIChatRequest): Promise<AIResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      // Validate request
      const validatedRequest = this.validateRequest(request);
      
      // Select optimal model
      const selectedModel = this.selectModel(validatedRequest);
      
      // Pre-flight checks
      await this.performPreflightChecks(validatedRequest, selectedModel, requestId);
      
      // Safety filtering (if enabled and HIPAA required)
      if (this.config.enableSafetyFiltering && this.config.hipaaCompliant) {
        await this.performSafetyCheck(validatedRequest.messages, requestId);
      }
      
      // Execute AI request
      const response = await this.executeAIRequest(validatedRequest, selectedModel, requestId);
      
      // Post-processing
      await this.postProcessResponse(response, requestId, startTime);
      
      return response;

    } catch (error) {
      return this.handleError(error, requestId, startTime);
    }
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
      
      const isSafe = safetyScore >= HIPAA_SAFETY_CONFIG.minimumSafetyScore && !containsPHI;

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

      const totalRequests = usage.reduce((sum, row) => sum + parseInt(row.requests), 0);
      const totalCost = usage.reduce((sum, row) => sum + parseFloat(row.total_cost || '0'), 0);
      
      const appLimits = APP_RATE_LIMITS[this.config.app!];
      const remainingBudget = appLimits.dailyBudget - totalCost;

      const topModels = usage.map(row => ({
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
      return chatRequestSchema.parse(request);
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
    // This would integrate with Cloudflare Workers AI
    // For now, return a mock response for development
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
      return `AI response from ${model}: Processed ${messages.length} messages`;
    }

    // Production implementation would call Cloudflare Workers AI API
    throw new Error('Cloudflare Workers AI integration not yet implemented');
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

  private handleError(error: any, requestId: string, startTime: number): AIResponse {
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
    if (scoreMatch) {
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
      await auditLog({
        action: `ai_${event.action}`,
        resourceId: event.requestId,
        userId: this.config.user?.id,
        details: {
          app: this.config.app,
          model: event.model,
          result: event.result,
          cost: event.cost,
          responseTime: event.responseTime,
          safetyScore: event.safetyScore,
          containsPHI: event.containsPHI
        }
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}

/**
 * Factory function to create GangerAI instances
 * Follows the pattern specified in the PRD
 */
export function createGangerAI(env: any, config: Partial<GangerAIConfig>): GangerAI {
  const fullConfig: GangerAIConfig = {
    // Extract from environment
    cloudflareToken: env.CLOUDFLARE_AI_TOKEN || env.AI_TOKEN,
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