"use strict";
/**
 * @fileoverview TypeScript type definitions for the Ganger AI Workers system
 * Provides comprehensive type safety for all AI operations across the platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUnavailableError = exports.SafetyViolationError = exports.BudgetExceededError = exports.RateLimitError = exports.AIError = void 0;
/**
 * Error Types
 */
class AIError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AIError';
    }
}
exports.AIError = AIError;
class RateLimitError extends AIError {
    constructor(message, retryAfter) {
        super(message, 'RATE_LIMIT_EXCEEDED');
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
class BudgetExceededError extends AIError {
    constructor(message, currentUsage, limit) {
        super(message, 'BUDGET_EXCEEDED');
        this.currentUsage = currentUsage;
        this.limit = limit;
    }
}
exports.BudgetExceededError = BudgetExceededError;
class SafetyViolationError extends AIError {
    constructor(message, safetyScore) {
        super(message, 'SAFETY_VIOLATION');
        this.safetyScore = safetyScore;
    }
}
exports.SafetyViolationError = SafetyViolationError;
class ModelUnavailableError extends AIError {
    constructor(message, model) {
        super(message, 'MODEL_UNAVAILABLE');
        this.model = model;
    }
}
exports.ModelUnavailableError = ModelUnavailableError;
