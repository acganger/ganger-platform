"use strict";
// Universal Authentication Package for Ganger Platform
// Provides unified authentication across all applications
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_AUTH_CONFIG = exports.CrossAppSessionManager = exports.APP_URLS = exports.getAppAuthCallbackUrl = exports.getAppNavigationMenu = exports.universalLogout = exports.sessionManager = exports.isSSONavigation = exports.getCurrentApp = exports.navigateToApp = exports.supabase = exports.getTypedSupabaseClient = exports.createAppSupabaseClient = exports.getSupabaseClient = exports.withAuthCallback = exports.AuthCallback = exports.TeamLeaderOnly = exports.TeamMemberOnly = exports.AdminOnly = exports.StaffOnly = exports.ConditionalRender = exports.useAuthGuard = exports.withAuthComponent = exports.withAuthGuard = exports.AuthGuard = exports.useAppAuth = exports.useAuth = exports.AuthProvider = void 0;
// Core exports
var context_1 = require("./context");
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return context_1.AuthProvider; } });
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return context_1.useAuth; } });
Object.defineProperty(exports, "useAppAuth", { enumerable: true, get: function () { return context_1.useAppAuth; } });
var guards_1 = require("./guards");
Object.defineProperty(exports, "AuthGuard", { enumerable: true, get: function () { return guards_1.AuthGuard; } });
Object.defineProperty(exports, "withAuthGuard", { enumerable: true, get: function () { return guards_1.withAuthGuard; } });
Object.defineProperty(exports, "withAuthComponent", { enumerable: true, get: function () { return guards_1.withAuthComponent; } });
Object.defineProperty(exports, "useAuthGuard", { enumerable: true, get: function () { return guards_1.useAuthGuard; } });
Object.defineProperty(exports, "ConditionalRender", { enumerable: true, get: function () { return guards_1.ConditionalRender; } });
Object.defineProperty(exports, "StaffOnly", { enumerable: true, get: function () { return guards_1.StaffOnly; } });
Object.defineProperty(exports, "AdminOnly", { enumerable: true, get: function () { return guards_1.AdminOnly; } });
Object.defineProperty(exports, "TeamMemberOnly", { enumerable: true, get: function () { return guards_1.TeamMemberOnly; } });
Object.defineProperty(exports, "TeamLeaderOnly", { enumerable: true, get: function () { return guards_1.TeamLeaderOnly; } });
var callback_1 = require("./callback");
Object.defineProperty(exports, "AuthCallback", { enumerable: true, get: function () { return callback_1.AuthCallback; } });
Object.defineProperty(exports, "withAuthCallback", { enumerable: true, get: function () { return callback_1.withAuthCallback; } });
var supabase_1 = require("./supabase");
Object.defineProperty(exports, "getSupabaseClient", { enumerable: true, get: function () { return supabase_1.getSupabaseClient; } });
Object.defineProperty(exports, "createAppSupabaseClient", { enumerable: true, get: function () { return supabase_1.createAppSupabaseClient; } });
Object.defineProperty(exports, "getTypedSupabaseClient", { enumerable: true, get: function () { return supabase_1.getTypedSupabaseClient; } });
Object.defineProperty(exports, "supabase", { enumerable: true, get: function () { return supabase_1.supabase; } });
var cross_app_1 = require("./cross-app");
Object.defineProperty(exports, "navigateToApp", { enumerable: true, get: function () { return cross_app_1.navigateToApp; } });
Object.defineProperty(exports, "getCurrentApp", { enumerable: true, get: function () { return cross_app_1.getCurrentApp; } });
Object.defineProperty(exports, "isSSONavigation", { enumerable: true, get: function () { return cross_app_1.isSSONavigation; } });
Object.defineProperty(exports, "sessionManager", { enumerable: true, get: function () { return cross_app_1.sessionManager; } });
Object.defineProperty(exports, "universalLogout", { enumerable: true, get: function () { return cross_app_1.universalLogout; } });
Object.defineProperty(exports, "getAppNavigationMenu", { enumerable: true, get: function () { return cross_app_1.getAppNavigationMenu; } });
Object.defineProperty(exports, "getAppAuthCallbackUrl", { enumerable: true, get: function () { return cross_app_1.getAppAuthCallbackUrl; } });
Object.defineProperty(exports, "APP_URLS", { enumerable: true, get: function () { return cross_app_1.APP_URLS; } });
Object.defineProperty(exports, "CrossAppSessionManager", { enumerable: true, get: function () { return cross_app_1.CrossAppSessionManager; } });
// Utility functions
__exportStar(require("./utils"), exports);
// Staff portal authentication
__exportStar(require("./staff"), exports);
// Default configuration
exports.DEFAULT_AUTH_CONFIG = {
    supabaseUrl: 'https://pfqtzmxxxhhsxmlddrta.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXR6bXh4eGhoc3htbGRkcnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTg1MjQsImV4cCI6MjA2NDY3NDUyNH0.v14_9iozO98QoNQq8JcaI9qMM6KKTlcWMYTkXyCDc5s',
    redirectUrl: 'https://staff.gangerdermatology.com/auth/callback',
    enableAuditLogging: true,
    sessionTimeout: 86400
};
