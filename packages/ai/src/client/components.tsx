/**
 * @fileoverview React UI components for AI integration
 * Ready-to-use components for chat interfaces, cost monitoring, and AI status displays
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, AIModel, ApplicationContext } from '../shared/types';

/**
 * Chat interface component props
 */
interface AIChatInterfaceProps {
  app: ApplicationContext;
  model?: AIModel;
  placeholder?: string;
  maxHeight?: string;
  showCost?: boolean;
  showModel?: boolean;
  onMessage?: (message: string, response: string) => void;
  className?: string;
}

/**
 * Main AI chat interface component
 */
export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  app,
  model = 'llama-4-scout-17b-16e-instruct',
  placeholder = 'Ask me anything...',
  maxHeight = '400px',
  showCost = false,
  showModel = false,
  onMessage,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCost, setCurrentCost] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // This would integrate with the GangerAI client
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model,
          app,
          config: {
            includeMetadata: showCost
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.cost && showCost) {
        setCurrentCost(prev => prev + data.cost);
      }

      onMessage?.(userMessage.content, assistantMessage.content);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`ai-chat-interface bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="ai-chat-header p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">AI Assistant</h3>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {showModel && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {model}
              </span>
            )}
            {showCost && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                ${currentCost.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="ai-chat-messages p-4 space-y-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            Start a conversation with the AI assistant
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-message ${
              message.role === 'user' 
                ? 'ai-message-user ml-8' 
                : 'ai-message-assistant mr-8'
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white ml-auto'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        
        {isLoading && <AILoadingIndicator />}
        {error && (
          <AIErrorDisplay 
            error={error} 
            onRetry={() => setError(null)}
            onDismiss={() => setError(null)}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="ai-chat-input p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Loading indicator props
 */
interface AILoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * AI loading indicator component
 */
export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({
  message = 'AI is thinking...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`ai-loading-indicator flex items-center space-x-2 text-gray-500 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      <span className="text-sm">{message}</span>
    </div>
  );
};

/**
 * Error display props
 */
interface AIErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * AI error display component
 */
export const AIErrorDisplay: React.FC<AIErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = ''
}) => {
  return (
    <div className={`ai-error-display bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            AI Request Failed
          </h3>
          <div className="mt-1 text-sm text-red-700">
            {error}
          </div>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-sm bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded-md transition-colors"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Cost display props
 */
interface AICostDisplayProps {
  dailyCost: number;
  monthlyCost: number;
  dailyBudget: number;
  monthlyBudget: number;
  className?: string;
}

/**
 * AI cost display component
 */
export const AICostDisplay: React.FC<AICostDisplayProps> = ({
  dailyCost,
  monthlyCost,
  dailyBudget,
  monthlyBudget,
  className = ''
}) => {
  const dailyPercent = (dailyCost / dailyBudget) * 100;
  const monthlyPercent = (monthlyCost / monthlyBudget) * 100;

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 bg-red-100';
    if (percent >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className={`ai-cost-display bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">AI Usage Costs</h3>
      
      <div className="space-y-3">
        {/* Daily Cost */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Daily</span>
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(dailyPercent)}`}>
              ${dailyCost.toFixed(2)} / ${dailyBudget.toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                dailyPercent >= 90 ? 'bg-red-500' : 
                dailyPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(dailyPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Monthly Cost */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Monthly</span>
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(monthlyPercent)}`}>
              ${monthlyCost.toFixed(2)} / ${monthlyBudget.toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                monthlyPercent >= 90 ? 'bg-red-500' : 
                monthlyPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Model selector props
 */
interface AIModelSelectorProps {
  models: AIModel[];
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  showCost?: boolean;
  className?: string;
}

/**
 * AI model selector component
 */
export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  showCost = false,
  className = ''
}) => {
  const modelInfo = {
    'llama-4-scout-17b-16e-instruct': { name: 'Llama 4 Scout', cost: '$', speed: 'Medium', specialty: 'Medical' },
    'llama-3.3-70b-instruct-fp8-fast': { name: 'Llama 3.3 Fast', cost: '$', speed: 'Fast', specialty: 'General' },
    'qwq-32b': { name: 'QwQ Reasoning', cost: '$$', speed: 'Slow', specialty: 'Complex reasoning' },
    'llama-3.2-11b-vision-instruct': { name: 'Llama Vision', cost: '$$$', speed: 'Medium', specialty: 'Vision + Text' },
    'llama-3.2-1b-instruct': { name: 'Llama Micro', cost: '$', speed: 'Very Fast', specialty: 'Simple tasks' },
    'llama-3.2-3b-instruct': { name: 'Llama Small', cost: '$', speed: 'Fast', specialty: 'Quick responses' }
  };

  return (
    <div className={`ai-model-selector ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        AI Model
      </label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as AIModel)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {models.map((model) => {
          const info = modelInfo[model as keyof typeof modelInfo];
          return (
            <option key={model} value={model}>
              {info?.name || model} {showCost && `(${info?.cost})`}
            </option>
          );
        })}
      </select>
      
      {showCost && (
        <div className="mt-2 text-xs text-gray-500">
          {modelInfo[selectedModel as keyof typeof modelInfo]?.specialty} • 
          Speed: {modelInfo[selectedModel as keyof typeof modelInfo]?.speed}
        </div>
      )}
    </div>
  );
};

/**
 * Quick prompts props
 */
interface AIQuickPromptsProps {
  prompts: Array<{ label: string; prompt: string }>;
  onPromptSelect: (prompt: string) => void;
  className?: string;
}

/**
 * Quick prompts component for common AI requests
 */
export const AIQuickPrompts: React.FC<AIQuickPromptsProps> = ({
  prompts,
  onPromptSelect,
  className = ''
}) => {
  return (
    <div className={`ai-quick-prompts ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Quick Prompts
      </label>
      <div className="grid grid-cols-2 gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt.prompt)}
            className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 transition-colors"
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * AI status indicator props
 */
interface AIStatusIndicatorProps {
  status: 'available' | 'busy' | 'offline' | 'error';
  lastRequest?: Date;
  className?: string;
}

/**
 * AI status indicator component
 */
export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  status,
  lastRequest,
  className = ''
}) => {
  const statusConfig = {
    available: { color: 'bg-green-500', text: 'Available', textColor: 'text-green-700' },
    busy: { color: 'bg-yellow-500', text: 'Processing', textColor: 'text-yellow-700' },
    offline: { color: 'bg-gray-500', text: 'Offline', textColor: 'text-gray-700' },
    error: { color: 'bg-red-500', text: 'Error', textColor: 'text-red-700' }
  };

  const config = statusConfig[status];

  return (
    <div className={`ai-status-indicator flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className={`text-sm ${config.textColor}`}>
        {config.text}
      </span>
      {lastRequest && (
        <span className="text-xs text-gray-500">
          Last: {lastRequest.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

/**
 * Usage analytics component props
 */
interface AIUsageAnalyticsProps {
  requests: number;
  tokens: number;
  cost: number;
  cacheHitRate: number;
  averageResponseTime: number;
  className?: string;
}

/**
 * Usage analytics display component
 */
export const AIUsageAnalytics: React.FC<AIUsageAnalyticsProps> = ({
  requests,
  tokens,
  cost,
  cacheHitRate,
  averageResponseTime,
  className = ''
}) => {
  return (
    <div className={`ai-usage-analytics bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Usage Analytics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{requests}</div>
          <div className="text-xs text-gray-500">Requests</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">${cost.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Cost</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{(tokens / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-500">Tokens</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{Math.round(cacheHitRate * 100)}%</div>
          <div className="text-xs text-gray-500">Cache Hit</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700">{averageResponseTime.toFixed(0)}ms</div>
          <div className="text-xs text-gray-500">Avg Response Time</div>
        </div>
      </div>
    </div>
  );
};