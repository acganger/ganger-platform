import { BaseRepository } from '../utils/base-repository';
class AuditLogRepository extends BaseRepository {
    constructor() {
        super('audit_logs', true); // Use admin client for audit logs
    }
    async logAction(userId, action, resourceType, resourceId, metadata, ipAddress, userAgent) {
        return this.create({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            metadata,
            ip_address: ipAddress,
            user_agent: userAgent,
        });
    }
    async getLogsByUser(userId, limit = 100) {
        const { data } = await this.findMany({
            filters: { user_id: userId },
            orderBy: { field: 'created_at', direction: 'desc' },
            limit,
        });
        return data;
    }
    async getLogsByResource(resourceType, resourceId, limit = 100) {
        const { data } = await this.findMany({
            filters: { resource_type: resourceType, resource_id: resourceId },
            orderBy: { field: 'created_at', direction: 'desc' },
            limit,
        });
        return data;
    }
    async getLogsByAction(action, limit = 100) {
        const { data } = await this.findMany({
            filters: { action },
            orderBy: { field: 'created_at', direction: 'desc' },
            limit,
        });
        return data;
    }
    async getLogsByDateRange(startDate, endDate, limit = 1000) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return (data || []);
    }
    async cleanupOldLogs(daysToKeep = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const { count, error } = await this.client
            .from(this.tableName)
            .delete({ count: 'exact' })
            .lt('created_at', cutoffDate.toISOString());
        if (error)
            throw error;
        return count || 0;
    }
}
export const auditLogQueries = new AuditLogRepository();
// Audit logging helpers
export const auditLogger = {
    login: (userId, ipAddress, userAgent) => auditLogQueries.logAction(userId, 'login', 'user', userId, undefined, ipAddress, userAgent),
    logout: (userId, ipAddress) => auditLogQueries.logAction(userId, 'logout', 'user', userId, undefined, ipAddress),
    create: (userId, resourceType, resourceId, metadata) => auditLogQueries.logAction(userId, 'create', resourceType, resourceId, metadata),
    update: (userId, resourceType, resourceId, metadata) => auditLogQueries.logAction(userId, 'update', resourceType, resourceId, metadata),
    delete: (userId, resourceType, resourceId, metadata) => auditLogQueries.logAction(userId, 'delete', resourceType, resourceId, metadata),
    view: (userId, resourceType, resourceId, metadata) => auditLogQueries.logAction(userId, 'view', resourceType, resourceId, metadata),
    export: (userId, resourceType, metadata) => auditLogQueries.logAction(userId, 'export', resourceType, undefined, metadata),
    import: (userId, resourceType, metadata) => auditLogQueries.logAction(userId, 'import', resourceType, undefined, metadata),
};
