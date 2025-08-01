"use strict";
/**
 * @fileoverview React components for AI functionality
 * Provides pre-built UI components for AI features across the Ganger Platform
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIChatComponent = AIChatComponent;
exports.AIUsageMonitor = AIUsageMonitor;
exports.AISafetyIndicator = AISafetyIndicator;
exports.QuickAIButton = QuickAIButton;
exports.AIAvailabilityStatus = AIAvailabilityStatus;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ui_1 = require("@ganger/ui");
const hooks_1 = require("./hooks");
/**
 * AI Chat Component
 * Complete chat interface with AI integration
 */
function AIChatComponent({ config, placeholder = "Type your message here...", className = "", onMessage, maxMessages = 50, enableVoice = false, enableFileUpload = false }) {
    const [inputValue, setInputValue] = (0, react_1.useState)('');
    const [isTyping, setIsTyping] = (0, react_1.useState)(false);
    const messagesEndRef = (0, react_1.useRef)(null);
    const { messages, sendMessage, clearHistory, loading, error, usage } = (0, hooks_1.useAIChat)({ ...config, maxMessages });
    // Auto-scroll to bottom
    (0, react_1.useEffect)(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleSendMessage = async () => {
        if (!inputValue.trim() || loading)
            return;
        const messageContent = inputValue.trim();
        setInputValue('');
        setIsTyping(true);
        try {
            const response = await sendMessage(messageContent);
            if (onMessage) {
                const userMessage = {
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
        }
        catch (err) {
            console.error('Chat error:', err);
        }
        finally {
            setIsTyping(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    return ((0, jsx_runtime_1.jsxs)(ui_1.Card, { className: `flex flex-col h-96 ${className}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 border-b", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold", children: "AI Assistant" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)(ui_1.Badge, { variant: usage.remainingBudget > 0 ? 'success' : 'warning', children: ["Budget: $", usage.remainingBudget.toFixed(2)] }), (0, jsx_runtime_1.jsx)(ui_1.Button, { variant: "outline", size: "sm", onClick: clearHistory, disabled: messages.length === 0, children: "Clear" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "text-center text-gray-500 py-8", children: [(0, jsx_runtime_1.jsx)("p", { children: "Start a conversation with the AI assistant." }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm mt-2", children: "Ask questions about medical procedures, scheduling, or general assistance." })] })), messages.map((message, index) => ((0, jsx_runtime_1.jsx)(ChatBubble, { message: message }, index))), (loading || isTyping) && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-gray-500", children: [(0, jsx_runtime_1.jsx)(ui_1.LoadingSpinner, { size: "sm" }), (0, jsx_runtime_1.jsx)("span", { children: "AI is thinking..." })] })), error && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-50 border border-red-200 rounded p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-700 text-sm", children: error.message }) })), (0, jsx_runtime_1.jsx)("div", { ref: messagesEndRef })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 border-t", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Input, { value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyPress: handleKeyPress, placeholder: placeholder, disabled: loading, className: "flex-1" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { onClick: handleSendMessage, disabled: !inputValue.trim() || loading, children: "Send" })] }), enableVoice && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2 text-center", children: (0, jsx_runtime_1.jsx)(ui_1.Button, { variant: "outline", size: "sm", disabled: true, children: "\uD83C\uDFA4 Voice (Coming Soon)" }) }))] })] }));
}
/**
 * Chat Bubble Component
 * Individual message display
 */
function ChatBubble({ message }) {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    if (isSystem)
        return null; // Don't display system messages
    return ((0, jsx_runtime_1.jsx)("div", { className: `flex ${isUser ? 'justify-end' : 'justify-start'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `max-w-[80%] rounded-lg p-3 ${isUser
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'}`, children: [(0, jsx_runtime_1.jsx)("p", { className: "whitespace-pre-wrap", children: message.content }), message.metadata?.timestamp && ((0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`, children: new Date(message.metadata.timestamp).toLocaleTimeString() }))] }) }));
}
/**
 * AI Usage Monitor Component
 * Displays real-time usage statistics and cost tracking
 */
function AIUsageMonitor({ app, timeframe = 'day', showCosts = true, showModels = true, className = "" }) {
    const { stats, loading, error, refresh } = (0, hooks_1.useAIUsage)(app);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(ui_1.Card, { className: `p-6 ${className}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center", children: [(0, jsx_runtime_1.jsx)(ui_1.LoadingSpinner, {}), (0, jsx_runtime_1.jsx)("span", { className: "ml-2", children: "Loading usage statistics..." })] }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(ui_1.Card, { className: `p-6 ${className}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center text-red-600", children: [(0, jsx_runtime_1.jsx)("p", { children: "Failed to load usage statistics" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { variant: "outline", size: "sm", onClick: refresh, className: "mt-2", children: "Retry" })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)(ui_1.Card, { className: `p-6 ${className}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold", children: ["AI Usage ", app && `- ${app}`] }), (0, jsx_runtime_1.jsx)(ui_1.Button, { variant: "outline", size: "sm", onClick: refresh, children: "Refresh" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [(0, jsx_runtime_1.jsx)(UsageStatCard, { title: "Total Requests", value: stats.requests.toLocaleString(), subtitle: `Today (${timeframe})` }), showCosts && ((0, jsx_runtime_1.jsx)(UsageStatCard, { title: "Total Cost", value: `$${stats.cost.toFixed(2)}`, subtitle: "Today", color: stats.remainingBudget < 5 ? 'red' : 'green' })), showCosts && ((0, jsx_runtime_1.jsx)(UsageStatCard, { title: "Remaining Budget", value: `$${stats.remainingBudget.toFixed(2)}`, subtitle: "Today", color: stats.remainingBudget < 5 ? 'red' : 'green' }))] }), showModels && stats.topModels.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium mb-3", children: "Top Models Used" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: stats.topModels.slice(0, 5).map((model, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-mono", children: model.model }), (0, jsx_runtime_1.jsxs)(ui_1.Badge, { variant: "outline", children: [model.requests, " requests"] })] }, model.model))) })] }))] }));
}
/**
 * Usage Stat Card Component
 */
function UsageStatCard({ title, value, subtitle, color = 'blue' }) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        red: 'text-red-600 bg-red-50',
        yellow: 'text-yellow-600 bg-yellow-50'
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${colorClasses[color]}`, children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-medium text-gray-600", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold mt-1", children: value }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 mt-1", children: subtitle })] }));
}
/**
 * AI Safety Indicator Component
 * Shows safety status for content
 */
function AISafetyIndicator({ content, className = "" }) {
    const [safetyStatus, setSafetyStatus] = (0, react_1.useState)({ safe: true, score: 1, checking: false });
    (0, react_1.useEffect)(() => {
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
            }
            catch (error) {
                setSafetyStatus({ safe: false, score: 0, checking: false });
            }
        };
        const timeoutId = setTimeout(checkSafety, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [content]);
    if (!content.trim())
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { className: `flex items-center gap-2 text-sm ${className}`, children: safetyStatus.checking ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(ui_1.LoadingSpinner, { size: "sm" }), (0, jsx_runtime_1.jsx)("span", { className: "text-gray-500", children: "Checking safety..." })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: `w-3 h-3 rounded-full ${safetyStatus.safe ? 'bg-green-500' : 'bg-red-500'}` }), (0, jsx_runtime_1.jsx)("span", { className: safetyStatus.safe ? 'text-green-700' : 'text-red-700', children: safetyStatus.safe ? 'Safe' : 'Safety Warning' }), (0, jsx_runtime_1.jsxs)("span", { className: "text-gray-500", children: ["(", Math.round(safetyStatus.score * 100), "%)"] })] })) }));
}
/**
 * Quick AI Assistant Button
 * Floating action button for quick AI access
 */
function QuickAIButton({ app, position = 'bottom-right', className = "" }) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const positionClasses = {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4'
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: `fixed ${positionClasses[position]} z-50 ${className}`, children: (0, jsx_runtime_1.jsx)(ui_1.Button, { onClick: () => setIsOpen(!isOpen), className: "rounded-full w-14 h-14 shadow-lg", "aria-label": "Open AI Assistant", children: "\uD83E\uDD16" }) }), isOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 border-b", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold", children: "AI Assistant" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { variant: "outline", size: "sm", onClick: () => setIsOpen(false), children: "\u2715" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-96", children: (0, jsx_runtime_1.jsx)(AIChatComponent, { config: { app }, className: "h-full border-0 rounded-none" }) })] }) }))] }));
}
/**
 * AI Feature Availability Indicator
 * Shows whether AI features are available and budget status
 */
function AIAvailabilityStatus({ app, className = "" }) {
    const { stats, loading } = (0, hooks_1.useAIUsage)(app);
    if (loading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-2 text-sm text-gray-500 ${className}`, children: [(0, jsx_runtime_1.jsx)(ui_1.LoadingSpinner, { size: "sm" }), (0, jsx_runtime_1.jsx)("span", { children: "Checking AI availability..." })] }));
    }
    const isAvailable = stats.remainingBudget > 0;
    const isLowBudget = stats.remainingBudget < 5;
    return ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-2 text-sm ${className}`, children: [(0, jsx_runtime_1.jsx)("div", { className: `w-2 h-2 rounded-full ${isAvailable ? (isLowBudget ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'}` }), (0, jsx_runtime_1.jsxs)("span", { className: isAvailable ? (isLowBudget ? 'text-yellow-700' : 'text-green-700') : 'text-red-700', children: ["AI ", isAvailable ? 'Available' : 'Unavailable'] }), isAvailable && ((0, jsx_runtime_1.jsxs)("span", { className: "text-gray-500", children: ["($", stats.remainingBudget.toFixed(2), " remaining)"] }))] }));
}
