/**
 * @fileoverview React components for AI functionality
 * Provides pre-built UI components for AI features across the Ganger Platform
 */
import type { AIChatComponentProps, AIUsageMonitorProps, ApplicationContext } from '../shared/types';
/**
 * AI Chat Component
 * Complete chat interface with AI integration
 */
export declare function AIChatComponent({ config, placeholder, className, onMessage, maxMessages, enableVoice, enableFileUpload }: AIChatComponentProps): import("react/jsx-runtime").JSX.Element;
/**
 * AI Usage Monitor Component
 * Displays real-time usage statistics and cost tracking
 */
export declare function AIUsageMonitor({ app, timeframe, showCosts, showModels, className }: AIUsageMonitorProps): import("react/jsx-runtime").JSX.Element;
/**
 * AI Safety Indicator Component
 * Shows safety status for content
 */
export declare function AISafetyIndicator({ content, className }: {
    content: string;
    className?: string;
}): import("react/jsx-runtime").JSX.Element | null;
/**
 * Quick AI Assistant Button
 * Floating action button for quick AI access
 */
export declare function QuickAIButton({ app, position, className }: {
    app: ApplicationContext;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * AI Feature Availability Indicator
 * Shows whether AI features are available and budget status
 */
export declare function AIAvailabilityStatus({ app, className }: {
    app: ApplicationContext;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=components.d.ts.map