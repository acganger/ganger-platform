"use strict";
// 🩺 Ganger Platform - Centralized Health Check System
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthChecker = void 0;
exports.createHealthEndpoint = createHealthEndpoint;
exports.createNextHealthRoute = createNextHealthRoute;
class HealthChecker {
    constructor(supabase, serviceName) {
        this.supabase = supabase;
        this.serviceName = serviceName;
    }
    async checkHealth() {
        const startTime = performance.now();
        try {
            // 🗄️ Database Health Check
            const dbCheck = await this.checkDatabase();
            // 🔐 Authentication Health Check  
            const authCheck = await this.checkAuthentication();
            // 🌐 External APIs Health Check
            const apiCheck = await this.checkExternalAPIs();
            // 📊 System Resources
            const memoryUsage = this.getMemoryUsage();
            const cpuUsage = await this.getCPUUsage();
            const responseTime = performance.now() - startTime;
            // ✅ Determine overall health
            const isHealthy = dbCheck && authCheck && apiCheck && memoryUsage < 90 && cpuUsage < 90;
            const isDegraded = (!dbCheck || !authCheck || !apiCheck) || (memoryUsage > 70 || cpuUsage > 70);
            return {
                service: this.serviceName,
                status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
                timestamp: new Date().toISOString(),
                response_time: Math.round(responseTime),
                checks: {
                    database: dbCheck,
                    authentication: authCheck,
                    external_apis: apiCheck,
                    memory_usage: memoryUsage,
                    cpu_usage: cpuUsage
                },
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            };
        }
        catch (error) {
            console.error(`Health check failed for ${this.serviceName}:`, error);
            return {
                service: this.serviceName,
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                response_time: performance.now() - startTime,
                checks: {
                    database: false,
                    authentication: false,
                    external_apis: false,
                    memory_usage: 0,
                    cpu_usage: 0
                },
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            };
        }
    }
    async checkDatabase() {
        try {
            const { data, error } = await this.supabase
                .from('health_checks')
                .select('id')
                .limit(1);
            return !error;
        }
        catch {
            return false;
        }
    }
    async checkAuthentication() {
        try {
            const { data: user } = await this.supabase.auth.getUser();
            return true; // If no error, auth service is responding
        }
        catch {
            return false;
        }
    }
    async checkExternalAPIs() {
        try {
            // Check critical external services
            const checks = await Promise.allSettled([
                fetch('https://api.stripe.com/v1/ping', { method: 'HEAD' }),
                fetch('https://api.twilio.com/2010-04-01/.json', { method: 'HEAD' })
            ]);
            const successfulChecks = checks.filter(check => check.status === 'fulfilled');
            return successfulChecks.length >= checks.length * 0.7; // 70% success rate
        }
        catch {
            return false;
        }
    }
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            return Math.round((usage.heapUsed / usage.heapTotal) * 100);
        }
        return 0;
    }
    async getCPUUsage() {
        // Simplified CPU usage estimation
        if (typeof process !== 'undefined' && process.cpuUsage) {
            const startUsage = process.cpuUsage();
            await new Promise(resolve => setTimeout(resolve, 100));
            const endUsage = process.cpuUsage(startUsage);
            const totalUsage = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds
            return Math.min(Math.round((totalUsage / 100) * 100), 100); // Cap at 100%
        }
        return 0;
    }
}
exports.HealthChecker = HealthChecker;
// 🚀 Express.js Health Check Endpoint Factory
function createHealthEndpoint(serviceName) {
    return async (req, res) => {
        try {
            const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
            const healthChecker = new HealthChecker(supabase, serviceName);
            const health = await healthChecker.checkHealth();
            // Set appropriate HTTP status code
            const statusCode = health.status === 'healthy' ? 200 :
                health.status === 'degraded' ? 207 : 503;
            res.status(statusCode).json({
                ...health,
                _links: {
                    self: `${req.protocol}://${req.get('host')}/api/health`,
                    platform: 'https://staff.gangerdermatology.com/api/health/platform'
                }
            });
        }
        catch (error) {
            res.status(503).json({
                service: serviceName,
                status: 'unhealthy',
                error: 'Health check system failure',
                timestamp: new Date().toISOString()
            });
        }
    };
}
// 🌐 Next.js API Route Factory
function createNextHealthRoute(serviceName) {
    return async (req, res) => {
        const healthEndpoint = createHealthEndpoint(serviceName);
        return healthEndpoint(req, res);
    };
}
//# sourceMappingURL=health-check.js.map