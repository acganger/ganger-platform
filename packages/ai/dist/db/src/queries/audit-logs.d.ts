import { BaseRepository } from '../utils/base-repository';
import type { AuditLog } from '../types/database';
declare class AuditLogRepository extends BaseRepository<AuditLog> {
    constructor();
    logAction(userId: string | undefined, action: string, resourceType: string, resourceId?: string, metadata?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<AuditLog>;
    getLogsByUser(userId: string, limit?: number): Promise<AuditLog[]>;
    getLogsByResource(resourceType: string, resourceId: string, limit?: number): Promise<AuditLog[]>;
    getLogsByAction(action: string, limit?: number): Promise<AuditLog[]>;
    getLogsByDateRange(startDate: string, endDate: string, limit?: number): Promise<AuditLog[]>;
    cleanupOldLogs(daysToKeep?: number): Promise<number>;
}
export declare const auditLogQueries: AuditLogRepository;
export declare const auditLogger: {
    login: (userId: string, ipAddress?: string, userAgent?: string) => Promise<AuditLog>;
    logout: (userId: string, ipAddress?: string) => Promise<AuditLog>;
    create: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) => Promise<AuditLog>;
    update: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) => Promise<AuditLog>;
    delete: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) => Promise<AuditLog>;
    view: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) => Promise<AuditLog>;
    export: (userId: string, resourceType: string, metadata?: Record<string, any>) => Promise<AuditLog>;
    import: (userId: string, resourceType: string, metadata?: Record<string, any>) => Promise<AuditLog>;
};
export {};
//# sourceMappingURL=audit-logs.d.ts.map