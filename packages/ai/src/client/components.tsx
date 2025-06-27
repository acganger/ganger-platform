/**
 * @fileoverview React components for AI functionality
 * Provides pre-built UI components for AI features across the Ganger Platform
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, LoadingSpinner, Badge } from '@ganger/ui';
import { useAIChat, useAI, useAIUsage } from './hooks';
import type {
  AIChatComponentProps,
  AIUsageMonitorProps,
  ApplicationContext,
  ChatMessage
} from '../shared/types';

/**
 * AI Chat Component
 * Complete chat interface with AI integration
 */
export function AIChatComponent({
  config,
  placeholder = "Type your message here...",
  className = "",
  onMessage,
  maxMessages = 50,
  enableVoice = false,
  enableFileUpload = false
}: AIChatComponentProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    sendMessage,
    clearHistory,
    loading,
    error,
    usage
  } = useAIChat({ ...config, maxMessages });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendMessage(messageContent);
      
      if (onMessage) {
        const userMessage: ChatMessage = {
          role: 'user',
          content: messageContent,
          metadata: { timestamp: new Date() }
        };
        onMessage(userMessage, { 
          success: true, 
          data: response.content,
          meta: {
            requestId: 'chat-component',
            timestamp: new Date().toISOString(),
            model: 'llama-3.3-70b-instruct-fp8-fast'
          }
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className={`flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <div className="flex items-center gap-2">
          <Badge variant={usage.remainingBudget > 0 ? 'success' : 'warning'}>
            Budget: ${usage.remainingBudget.toFixed(2)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with the AI assistant.</p>
            <p className="text-sm mt-2">Ask questions about medical procedures, scheduling, or general assistance.</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <ChatBubble key={index} message={message} />
        ))}
        
        {(loading || isTyping) && (
          <div className="flex items-center gap-2 text-gray-500">
            <LoadingSpinner size="sm" />
            <span>AI is thinking...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 text-sm">{error.message}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading}
          >
            Send
          </Button>
        </div>
        
        {enableVoice && (
          <div className="mt-2 text-center">
            <Button variant="outline" size="sm" disabled>
              🎤 Voice (Coming Soon)
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Chat Bubble Component
 * Individual message display
 */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  if (isSystem) return null; // Don't display system messages

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.metadata?.timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.metadata.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * AI Usage Monitor Component
 * Displays real-time usage statistics and cost tracking
 */
export function AIUsageMonitor({
  app,
  timeframe = 'day',
  showCosts = true,
  showModels = true,
  className = ""
}: AIUsageMonitorProps) {
  const { stats, loading, error, refresh } = useAIUsage(app);

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2">Loading usage statistics...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Failed to load usage statistics</p>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          AI Usage {app && `- ${app}`}
        </h3>
        <Button variant="outline" size="sm" onClick={refresh}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <UsageStatCard
          title="Total Requests"
          value={stats.requests.toLocaleString()}
          subtitle={`Today (${timeframe})`}
        />
        
        {showCosts && (
          <UsageStatCard
            title="Total Cost"
            value={`$${stats.cost.toFixed(2)}`}
            subtitle="Today"
            color={stats.remainingBudget < 5 ? 'red' : 'green'}
          />
        )}
        
        {showCosts && (
          <UsageStatCard
            title="Remaining Budget"
            value={`$${stats.remainingBudget.toFixed(2)}`}
            subtitle="Today"
            color={stats.remainingBudget < 5 ? 'red' : 'green'}
          />
        )}
      </div>

      {showModels && stats.topModels.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Top Models Used</h4>
          <div className="space-y-2">
            {stats.topModels.slice(0, 5).map((model, index) => (
              <div key={model.model} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">{model.model}</span>
                <Badge variant="outline">
                  {model.requests} requests
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Usage Stat Card Component
 */
function UsageStatCard({
  title,
  value,
  subtitle,
  color = 'blue'
}: {
  title: string;
  value: string;
  subtitle: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50'
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

/**
 * AI Safety Indicator Component
 * Shows safety status for content
 */
export function AISafetyIndicator({
  content,
  className = ""
}: {
  content: string;
  className?: string;
}) {
  const [safetyStatus, setSafetyStatus] = useState<{
    safe: boolean;
    score: number;
    checking: boolean;
  }>({ safe: true, score: 1, checking: false });

  useEffect(() => {
    if (!content.trim()) {
      setSafetyStatus({ safe: true, score: 1, checking: false });
      return;
    }

    const checkSafety = async () => {
      setSafetyStatus(prev => ({ ...prev, checking: true }));
      
      try {
        const response = await fetch('/api/ai/safety', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });

        if (response.ok) {
          const result = await response.json();
          setSafetyStatus({
            safe: result.data?.safe || false,
            score: result.data?.score || 0,
            checking: false
          });
        }
      } catch (error) {
        setSafetyStatus({ safe: false, score: 0, checking: false });
      }
    };

    const timeoutId = setTimeout(checkSafety, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [content]);

  if (!content.trim()) return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {safetyStatus.checking ? (
        <>
          <LoadingSpinner size="sm" />
          <span className="text-gray-500">Checking safety...</span>
        </>
      ) : (
        <>
          <div
            className={`w-3 h-3 rounded-full ${
              safetyStatus.safe ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={safetyStatus.safe ? 'text-green-700' : 'text-red-700'}>
            {safetyStatus.safe ? 'Safe' : 'Safety Warning'}
          </span>
          <span className="text-gray-500">
            ({Math.round(safetyStatus.score * 100)}%)
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Quick AI Assistant Button
 * Floating action button for quick AI access
 */
export function QuickAIButton({
  app,
  position = 'bottom-right',
  className = ""
}: {
  app: ApplicationContext;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg"
          aria-label="Open AI Assistant"
        >
          🤖
        </Button>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="h-96">
              <AIChatComponent
                config={{ app }}
                className="h-full border-0 rounded-none"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * AI Feature Availability Indicator
 * Shows whether AI features are available and budget status
 */
export function AIAvailabilityStatus({
  app,
  className = ""
}: {
  app: ApplicationContext;
  className?: string;
}) {
  const { stats, loading } = useAIUsage(app);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <LoadingSpinner size="sm" />
        <span>Checking AI availability...</span>
      </div>
    );
  }

  const isAvailable = stats.remainingBudget > 0;
  const isLowBudget = stats.remainingBudget < 5;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${
          isAvailable ? (isLowBudget ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'
        }`}
      />
      <span className={
        isAvailable ? (isLowBudget ? 'text-yellow-700' : 'text-green-700') : 'text-red-700'
      }>
        AI {isAvailable ? 'Available' : 'Unavailable'}
      </span>
      {isAvailable && (
        <span className="text-gray-500">
          (${stats.remainingBudget.toFixed(2)} remaining)
        </span>
      )}
    </div>
  );
}