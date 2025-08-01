export interface HealthStatus {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    response_time: number;
    checks: {
        database: boolean;
        authentication: boolean;
        external_apis: boolean;
        memory_usage: number;
        cpu_usage: number;
    };
    version: string;
    environment: string;
}
export interface PlatformHealth {
    overall_status: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthStatus[];
    total_services: number;
    healthy_services: number;
    degraded_services: number;
    unhealthy_services: number;
    last_updated: string;
}
export declare class HealthChecker {
    private supabase;
    private serviceName;
    constructor(supabase: any, serviceName: string);
    checkHealth(): Promise<HealthStatus>;
    private checkDatabase;
    private checkAuthentication;
    private checkExternalAPIs;
    private getMemoryUsage;
    private getCPUUsage;
}
export declare function createHealthEndpoint(serviceName: string): (req: any, res: any) => Promise<void>;
export declare function createNextHealthRoute(serviceName: string): (req: any, res: any) => Promise<void>;
