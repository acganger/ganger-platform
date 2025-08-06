/**
 * @fileoverview React hooks for AI client-side integration
 * Provides easy-to-use hooks for AI functionality across all Ganger Platform apps
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@ganger/auth';
import type {
  AIChatRequest,
  AIResponse,
  UseAIOptions,
  UseAIReturn,
  ApplicationContext,
  ChatMessage,
  AIError,
  RateLimitError,
  BudgetExceededError
} from '../shared/types';

/**
 * Main AI hook for chat functionality
 * Provides AI capabilities with built-in error handling, rate limiting, and usage tracking
 */
export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [usage, setUsage] = useState({
    requestsToday: 0,
    costToday: 0,
    remainingBudget: 0
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const requestCountRef = useRef(0);

  // Configuration with defaults
  const config = {
    app: 'staff' as ApplicationContext,
    hipaaCompliant: true,
    autoRetry: true,
    retryAttempts: 3,
    ...options,
    user: user || undefined
  };

  /**
   * Main chat function
   */
  const chat = useCallback(async (request: AIChatRequest): Promise<AIResponse> => {
    if (!user) {
      const authError = new Error('Authentication required for AI features') as AIError;
      authError.code = 'AUTHENTICATION_REQUIRED';
      setError(authError);
      throw authError;
    }

    setLoading(true);
    setError(null);
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Prepare request with configuration
      const fullRequest: AIChatRequest = {
        ...request,
        config: {
          ...config,
          ...request.config
        }
      };

      // Make API call
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify(fullRequest)
      });

      if (!response.ok) {
        throw await handleAPIError(response);
      }

      const result: AIResponse = await response.json();
      
      if (!result.success) {
        throw createErrorFromResponse(result);
      }

      // Update state
      setLastResponse(result);
      requestCountRef.current += 1;
      
      // Update usage stats
      await updateUsageStats();
      
      // Call success callback
      if (config.onSuccess) {
        config.onSuccess(result);
      }

      return result;

    } catch (err) {
      const aiError = err instanceof Error ? err as AIError : new Error('Unknown error') as AIError;
      setError(aiError);
      
      // Handle retry logic
      if (config.autoRetry && shouldRetry(aiError) && requestCountRef.current < (config.retryAttempts || 3)) {
        return await retryWithBackoff(request, aiError);
      }
      
      // Call error callback
      if (config.onError) {
        config.onError(aiError);
      }
      
      throw aiError;
    } finally {
      setLoading(false);
    }
  }, [user, config]);

  /**
   * Update usage statistics
   */
  const updateUsageStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai/usage?app=${config.app}`);
      if (response.ok) {
        const stats = await response.json();
        setUsage({
          requestsToday: stats.requests || 0,
          costToday: stats.cost || 0,
          remainingBudget: stats.remainingBudget || 0
        });
      }
    } catch (error) {
      console.warn('Failed to update usage stats:', error);
    }
  }, [config.app]);

  /**
   * Retry with exponential backoff
   */
  const retryWithBackoff = useCallback(async (
    request: AIChatRequest, 
    lastError: AIError
  ): Promise<AIResponse> => {
    // Log retry attempt with error context
    console.debug('[useChat] Retrying after error:', lastError.message);
    const retryDelay = Math.min(1000 * Math.pow(2, requestCountRef.current), 10000);
    
    return new Promise((resolve, reject) => {
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await chat(request);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, retryDelay);
    });
  }, [chat]);

  // Load initial usage stats
  useEffect(() => {
    if (user) {
      updateUsageStats();
    }
  }, [user, updateUsageStats]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    chat,
    loading,
    error,
    lastResponse,
    usage
  };
}

/**
 * Hook for AI chat sessions with conversation history
 */
export function useAIChat(options: UseAIOptions & { 
  maxMessages?: number;
  persistHistory?: boolean; 
} = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const ai = useAI(options);

  const maxMessages = options.maxMessages || 50;

  /**
   * Send a message and get AI response
   */
  const sendMessage = useCallback(async (content: string): Promise<ChatMessage> => {
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      metadata: {
        timestamp: new Date(),
        userId: ai.usage.requestsToday > 0 ? 'current-user' : undefined,
        sessionId
      }
    };

    // Add user message to history
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      return newMessages.slice(-maxMessages);
    });

    try {
      // Send to AI
      const response = await ai.chat({
        messages: [...messages, userMessage].slice(-10), // Send last 10 messages for context
        config: options
      });

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.data || 'Sorry, I could not generate a response.',
        metadata: {
          timestamp: new Date(),
          sessionId
        }
      };

      // Add AI response to history
      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        return newMessages.slice(-maxMessages);
      });

      return aiMessage;

    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        metadata: {
          timestamp: new Date(),
          sessionId
        }
      };

      setMessages(prev => {
        const newMessages = [...prev, errorMessage];
        return newMessages.slice(-maxMessages);
      });

      throw error;
    }
  }, [ai, messages, sessionId, maxMessages, options]);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Remove a specific message
   */
  const removeMessage = useCallback((index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    messages,
    sendMessage,
    clearHistory,
    removeMessage,
    sessionId,
    loading: ai.loading,
    error: ai.error,
    usage: ai.usage
  };
}

/**
 * Hook for AI usage monitoring
 */
export function useAIUsage(app?: ApplicationContext) {
  const [stats, setStats] = useState({
    requests: 0,
    cost: 0,
    remainingBudget: 0,
    topModels: [] as Array<{ model: string; requests: number }>
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/api/ai/usage${app ? `?app=${app}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage stats');
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => {
    fetchStats();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchStats, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}

/**
 * Hook for checking AI safety
 */
export function useAISafety() {
  const [checking, setChecking] = useState(false);

  const checkSafety = useCallback(async (content: string, context?: string) => {
    setChecking(true);
    
    try {
      const response = await fetch('/api/ai/safety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, context })
      });

      if (!response.ok) {
        throw new Error(`Safety check failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } finally {
      setChecking(false);
    }
  }, []);

  return {
    checkSafety,
    checking
  };
}

/**
 * Helper functions
 */

async function handleAPIError(response: Response): Promise<AIError> {
  const contentType = response.headers.get('content-type');
  let errorData: any = {};
  
  if (contentType && contentType.includes('application/json')) {
    try {
      errorData = await response.json();
    } catch {
      // Fallback to status text if JSON parsing fails
    }
  }

  const error = new Error(
    errorData.error?.message || 
    errorData.message || 
    response.statusText || 
    'AI request failed'
  ) as AIError;

  error.code = errorData.error?.code || `HTTP_${response.status}`;

  // Handle specific error types
  if (response.status === 429) {
    const rateLimitError = error as RateLimitError;
    rateLimitError.retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    return rateLimitError;
  }

  if (response.status === 402 || errorData.error?.code === 'BUDGET_EXCEEDED') {
    const budgetError = error as BudgetExceededError;
    budgetError.currentUsage = errorData.currentUsage || 0;
    budgetError.limit = errorData.limit || 0;
    return budgetError;
  }

  return error;
}

function createErrorFromResponse(response: AIResponse): AIError {
  const error = new Error(response.error?.message || 'AI request failed') as AIError;
  error.code = response.error?.code || 'UNKNOWN_ERROR';
  return error;
}

function shouldRetry(error: AIError): boolean {
  // Don't retry authentication or budget errors
  if (['AUTHENTICATION_REQUIRED', 'BUDGET_EXCEEDED', 'SAFETY_VIOLATION'].includes(error.code)) {
    return false;
  }
  
  // Retry network errors and temporary failures
  if (['NETWORK_ERROR', 'TIMEOUT_ERROR', 'MODEL_UNAVAILABLE'].includes(error.code)) {
    return true;
  }
  
  // Retry HTTP 5xx errors
  if (error.code.startsWith('HTTP_5')) {
    return true;
  }
  
  return false;
}