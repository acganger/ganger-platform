export interface AppHealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    timestamp: string;
    details?: Record<string, any>;
    error?: string;
}
export interface AppHealthResponse {
    service: string;
    version: string;
    environment: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: AppHealthCheck[];
    metrics?: {
        requests: number;
        errors: number;
        avgResponseTime: number;
    };
}
export interface HealthCheckConfig {
    serviceName: string;
    version?: string;
    checks?: {
        database?: boolean;
        cache?: boolean;
        storage?: boolean;
        auth?: boolean;
        customChecks?: Array<{
            name: string;
            check: () => Promise<boolean>;
        }>;
    };
    includeMetrics?: boolean;
}
export declare function createHealthCheckEndpoint(config: HealthCheckConfig): (req: any, res: any) => Promise<void>;
export declare function createNextHealthRoute(config: HealthCheckConfig): (req: any, res: any) => Promise<void>;
export declare const healthCheckConfigs: {
    inventory: {
        serviceName: string;
        checks: {
            database: boolean;
            auth: boolean;
            storage: boolean;
            customChecks: {
                name: string;
                check: () => Promise<boolean>;
            }[];
        };
        includeMetrics: boolean;
    };
    kiosk: {
        serviceName: string;
        checks: {
            database: boolean;
            auth: boolean;
            customChecks: {
                name: string;
                check: () => Promise<boolean>;
            }[];
        };
        includeMetrics: boolean;
    };
    handouts: {
        serviceName: string;
        checks: {
            database: boolean;
            auth: boolean;
            storage: boolean;
            customChecks: {
                name: string;
                check: () => Promise<boolean>;
            }[];
        };
        includeMetrics: boolean;
    };
    medicationAuth: {
        serviceName: string;
        checks: {
            database: boolean;
            auth: boolean;
            customChecks: {
                name: string;
                check: () => Promise<boolean>;
            }[];
        };
        includeMetrics: boolean;
    };
    actions: {
        serviceName: string;
        checks: {
            database: boolean;
            auth: boolean;
            cache: boolean;
        };
        includeMetrics: boolean;
    };
    batch: {
        serviceName: string;
        checks: {
            database: boolean;
            auth: boolean;
            customChecks: {
                name: string;
                check: () => Promise<boolean>;
            }[];
        };
        includeMetrics: boolean;
    };
    callCenter: {
        serviceName: string;
        checks: {
            database: boolean;
            auth: boolean;
            customChecks: {
                name: string;
                check: () => Promise<boolean>;
            }[];
        };
        includeMetrics: boolean;
    };
};
//# sourceMappingURL=app-health-endpoints.d.ts.map