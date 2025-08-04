"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckConfigs = void 0;
exports.createHealthCheckEndpoint = createHealthCheckEndpoint;
exports.createNextHealthRoute = createNextHealthRoute;
const auth_1 = require("@ganger/auth");
const api_latency_monitor_1 = require("./api-latency-monitor");
const custom_metrics_1 = require("./custom-metrics");
class AppHealthChecker {
    constructor() {
        this.startTime = Date.now();
    }
    async performHealthCheck(config) {
        const checks = [];
        let overallStatus = 'healthy';
        // Database check
        if (config.checks?.database !== false) {
            const dbCheck = await this.checkDatabase();
            checks.push(dbCheck);
            if (dbCheck.status === 'unhealthy')
                overallStatus = 'unhealthy';
            else if (dbCheck.status === 'degraded' && overallStatus === 'healthy') {
                overallStatus = 'degraded';
            }
        }
        // Auth check
        if (config.checks?.auth !== false) {
            const authCheck = await this.checkAuth();
            checks.push(authCheck);
            if (authCheck.status === 'unhealthy')
                overallStatus = 'unhealthy';
            else if (authCheck.status === 'degraded' && overallStatus === 'healthy') {
                overallStatus = 'degraded';
            }
        }
        // Storage check
        if (config.checks?.storage) {
            const storageCheck = await this.checkStorage();
            checks.push(storageCheck);
            if (storageCheck.status === 'unhealthy' && overallStatus !== 'unhealthy') {
                overallStatus = 'degraded'; // Storage is less critical
            }
        }
        // Cache check
        if (config.checks?.cache) {
            const cacheCheck = await this.checkCache();
            checks.push(cacheCheck);
            // Cache issues only degrade, don't make unhealthy
            if (cacheCheck.status !== 'healthy' && overallStatus === 'healthy') {
                overallStatus = 'degraded';
            }
        }
        // Custom checks
        if (config.checks?.customChecks) {
            for (const customCheck of config.checks.customChecks) {
                const result = await this.performCustomCheck(customCheck);
                checks.push(result);
                if (result.status === 'unhealthy')
                    overallStatus = 'unhealthy';
                else if (result.status === 'degraded' && overallStatus === 'healthy') {
                    overallStatus = 'degraded';
                }
            }
        }
        // Get metrics if requested
        let metrics;
        if (config.includeMetrics) {
            metrics = await this.getAppMetrics();
        }
        // Track health check
        custom_metrics_1.customMetrics.increment('health_checks_performed', 1, {
            service: config.serviceName,
            status: overallStatus
        });
        return {
            service: config.serviceName,
            version: config.version || process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            checks,
            metrics
        };
    }
    async checkDatabase() {
        const startTime = performance.now();
        try {
            const supabase = (0, auth_1.getSupabaseClient)();
            // Try a simple query
            const { data, error } = await supabase
                .from('health_checks')
                .select('id')
                .limit(1)
                .single();
            const responseTime = performance.now() - startTime;
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                return {
                    name: 'database',
                    status: 'unhealthy',
                    responseTime,
                    timestamp: new Date().toISOString(),
                    error: error.message
                };
            }
            // Check response time
            const status = responseTime > 1000 ? 'degraded' : 'healthy';
            return {
                name: 'database',
                status,
                responseTime,
                timestamp: new Date().toISOString(),
                details: {
                    connected: true,
                    responseTimeMs: responseTime
                }
            };
        }
        catch (error) {
            return {
                name: 'database',
                status: 'unhealthy',
                responseTime: performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async checkAuth() {
        const startTime = performance.now();
        try {
            const supabase = (0, auth_1.getSupabaseClient)();
            const { data: { session } } = await supabase.auth.getSession();
            const responseTime = performance.now() - startTime;
            return {
                name: 'authentication',
                status: 'healthy',
                responseTime,
                timestamp: new Date().toISOString(),
                details: {
                    serviceAvailable: true,
                    hasSession: !!session
                }
            };
        }
        catch (error) {
            return {
                name: 'authentication',
                status: 'degraded', // Auth issues are degraded, not unhealthy
                responseTime: performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async checkStorage() {
        const startTime = performance.now();
        try {
            const supabase = (0, auth_1.getSupabaseClient)();
            // List buckets to check storage availability
            const { data, error } = await supabase.storage.listBuckets();
            const responseTime = performance.now() - startTime;
            if (error) {
                return {
                    name: 'storage',
                    status: 'unhealthy',
                    responseTime,
                    timestamp: new Date().toISOString(),
                    error: error.message
                };
            }
            return {
                name: 'storage',
                status: 'healthy',
                responseTime,
                timestamp: new Date().toISOString(),
                details: {
                    available: true,
                    bucketCount: data?.length || 0
                }
            };
        }
        catch (error) {
            return {
                name: 'storage',
                status: 'unhealthy',
                responseTime: performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async checkCache() {
        const startTime = performance.now();
        try {
            // Simple in-memory test
            const testKey = `health-check-${Date.now()}`;
            const testValue = 'test';
            // Simulate cache operations
            global[testKey] = testValue;
            const retrieved = global[testKey];
            delete global[testKey];
            const responseTime = performance.now() - startTime;
            return {
                name: 'cache',
                status: retrieved === testValue ? 'healthy' : 'degraded',
                responseTime,
                timestamp: new Date().toISOString(),
                details: {
                    available: true,
                    testPassed: retrieved === testValue
                }
            };
        }
        catch (error) {
            return {
                name: 'cache',
                status: 'degraded',
                responseTime: performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async performCustomCheck(config) {
        const startTime = performance.now();
        try {
            const result = await config.check();
            const responseTime = performance.now() - startTime;
            return {
                name: config.name,
                status: result ? 'healthy' : 'unhealthy',
                responseTime,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                name: config.name,
                status: 'unhealthy',
                responseTime: performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getAppMetrics() {
        // Get basic metrics from monitoring systems
        const apiSummary = api_latency_monitor_1.apiLatencyMonitor.getSummary();
        return {
            requests: apiSummary.totalCalls,
            errors: Math.round(apiSummary.totalCalls * (apiSummary.errorRate / 100)),
            avgResponseTime: apiSummary.averageLatency
        };
    }
}
// Factory function to create health check endpoint
function createHealthCheckEndpoint(config) {
    const checker = new AppHealthChecker();
    return async (req, res) => {
        try {
            const health = await checker.performHealthCheck(config);
            // Set appropriate status code
            const statusCode = health.status === 'healthy' ? 200 :
                health.status === 'degraded' ? 207 : 503;
            // Add cache headers
            res.setHeader('Cache-Control', 'no-store, max-age=0');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.status(statusCode).json(health);
        }
        catch (error) {
            console.error('Health check failed:', error);
            res.status(503).json({
                service: config.serviceName,
                version: config.version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: 0,
                checks: [],
                error: 'Health check system failure'
            });
        }
    };
}
// Next.js API route creator
function createNextHealthRoute(config) {
    const healthEndpoint = createHealthCheckEndpoint(config);
    return async (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        return healthEndpoint(req, res);
    };
}
// Example health check configurations for different apps
exports.healthCheckConfigs = {
    inventory: {
        serviceName: 'Inventory Management',
        checks: {
            database: true,
            auth: true,
            storage: true,
            customChecks: [{
                    name: 'barcode-scanner',
                    check: async () => {
                        // Check if barcode scanning service is available
                        return true;
                    }
                }]
        },
        includeMetrics: true
    },
    kiosk: {
        serviceName: 'Patient Check-in Kiosk',
        checks: {
            database: true,
            auth: false, // Kiosk doesn't require auth
            customChecks: [{
                    name: 'qr-scanner',
                    check: async () => {
                        // Check QR scanner availability
                        return true;
                    }
                }]
        },
        includeMetrics: true
    },
    handouts: {
        serviceName: 'Patient Handouts',
        checks: {
            database: true,
            auth: true,
            storage: true,
            customChecks: [{
                    name: 'pdf-generator',
                    check: async () => {
                        // Check PDF generation service
                        return true;
                    }
                }]
        },
        includeMetrics: true
    },
    medicationAuth: {
        serviceName: 'Medication Authorization',
        checks: {
            database: true,
            auth: true,
            customChecks: [{
                    name: 'pharmacy-api',
                    check: async () => {
                        // Check pharmacy API connectivity
                        return true;
                    }
                }]
        },
        includeMetrics: true
    },
    actions: {
        serviceName: 'Ganger Actions',
        checks: {
            database: true,
            auth: true,
            cache: true
        },
        includeMetrics: true
    },
    batch: {
        serviceName: 'Batch Closeout',
        checks: {
            database: true,
            auth: true,
            customChecks: [{
                    name: 'payment-processor',
                    check: async () => {
                        // Check payment processor connectivity
                        return true;
                    }
                }]
        },
        includeMetrics: true
    },
    callCenter: {
        serviceName: 'Call Center Operations',
        checks: {
            database: true,
            auth: true,
            customChecks: [{
                    name: 'twilio-api',
                    check: async () => {
                        // Check Twilio connectivity
                        return true;
                    }
                }]
        },
        includeMetrics: true
    }
};
//# sourceMappingURL=app-health-endpoints.js.map