"use strict";
/**
 * @fileoverview Client-side AI exports
 * Main entry point for client-side AI functionality (React hooks and components)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAvailabilityStatus = exports.QuickAIButton = exports.AISafetyIndicator = exports.AIUsageMonitor = exports.AIChatComponent = exports.useAISafety = exports.useAIUsage = exports.useAIChat = exports.useAI = void 0;
// React hooks
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useAI", { enumerable: true, get: function () { return hooks_1.useAI; } });
Object.defineProperty(exports, "useAIChat", { enumerable: true, get: function () { return hooks_1.useAIChat; } });
Object.defineProperty(exports, "useAIUsage", { enumerable: true, get: function () { return hooks_1.useAIUsage; } });
Object.defineProperty(exports, "useAISafety", { enumerable: true, get: function () { return hooks_1.useAISafety; } });
// React components
var components_1 = require("./components");
Object.defineProperty(exports, "AIChatComponent", { enumerable: true, get: function () { return components_1.AIChatComponent; } });
Object.defineProperty(exports, "AIUsageMonitor", { enumerable: true, get: function () { return components_1.AIUsageMonitor; } });
Object.defineProperty(exports, "AISafetyIndicator", { enumerable: true, get: function () { return components_1.AISafetyIndicator; } });
Object.defineProperty(exports, "QuickAIButton", { enumerable: true, get: function () { return components_1.QuickAIButton; } });
Object.defineProperty(exports, "AIAvailabilityStatus", { enumerable: true, get: function () { return components_1.AIAvailabilityStatus; } });
