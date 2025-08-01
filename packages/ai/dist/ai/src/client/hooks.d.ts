/**
 * @fileoverview React hooks for AI client-side integration
 * Provides easy-to-use hooks for AI functionality across all Ganger Platform apps
 */
import type { UseAIOptions, UseAIReturn, ApplicationContext, ChatMessage, AIError } from '../shared/types';
/**
 * Main AI hook for chat functionality
 * Provides AI capabilities with built-in error handling, rate limiting, and usage tracking
 */
export declare function useAI(options?: UseAIOptions): UseAIReturn;
/**
 * Hook for AI chat sessions with conversation history
 */
export declare function useAIChat(options?: UseAIOptions & {
    maxMessages?: number;
    persistHistory?: boolean;
}): {
    messages: ChatMessage[];
    sendMessage: (content: string) => Promise<ChatMessage>;
    clearHistory: () => void;
    removeMessage: (index: number) => void;
    sessionId: string;
    loading: boolean;
    error: AIError | null;
    usage: {
        requestsToday: number;
        costToday: number;
        remainingBudget: number;
    };
};
/**
 * Hook for AI usage monitoring
 */
export declare function useAIUsage(app?: ApplicationContext): {
    stats: {
        requests: number;
        cost: number;
        remainingBudget: number;
        topModels: Array<{
            model: string;
            requests: number;
        }>;
    };
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};
/**
 * Hook for checking AI safety
 */
export declare function useAISafety(): {
    checkSafety: (content: string, context?: string) => Promise<any>;
    checking: boolean;
};
//# sourceMappingURL=hooks.d.ts.map