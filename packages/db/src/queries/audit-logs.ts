import { BaseRepository } from '../utils/base-repository';
import type { AuditLog } from '../types/database';

class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('audit_logs', true); // Use admin client for audit logs
  }

  async logAction(
    userId: string | undefined,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
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

  async getLogsByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    const { data } = await this.findMany({
      filters: { user_id: userId },
      orderBy: { field: 'created_at', direction: 'desc' },
      limit,
    });
    return data;
  }

  async getLogsByResource(
    resourceType: string,
    resourceId: string,
    limit = 100
  ): Promise<AuditLog[]> {
    const { data } = await this.findMany({
      filters: { resource_type: resourceType, resource_id: resourceId },
      orderBy: { field: 'created_at', direction: 'desc' },
      limit,
    });
    return data;
  }

  async getLogsByAction(action: string, limit = 100): Promise<AuditLog[]> {
    const { data } = await this.findMany({
      filters: { action },
      orderBy: { field: 'created_at', direction: 'desc' },
      limit,
    });
    return data;
  }

  async getLogsByDateRange(
    startDate: string,
    endDate: string,
    limit = 1000
  ): Promise<AuditLog[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AuditLog[];
  }

  async cleanupOldLogs(daysToKeep = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { count, error } = await this.client
      .from(this.tableName)
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
    return count || 0;
  }
}

export const auditLogQueries = new AuditLogRepository();

// Audit logging helpers
export const auditLogger = {
  login: (userId: string, ipAddress?: string, userAgent?: string) =>
    auditLogQueries.logAction(userId, 'login', 'user', userId, undefined, ipAddress, userAgent),

  logout: (userId: string, ipAddress?: string) =>
    auditLogQueries.logAction(userId, 'logout', 'user', userId, undefined, ipAddress),

  create: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) =>
    auditLogQueries.logAction(userId, 'create', resourceType, resourceId, metadata),

  update: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) =>
    auditLogQueries.logAction(userId, 'update', resourceType, resourceId, metadata),

  delete: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) =>
    auditLogQueries.logAction(userId, 'delete', resourceType, resourceId, metadata),

  view: (userId: string, resourceType: string, resourceId: string, metadata?: Record<string, any>) =>
    auditLogQueries.logAction(userId, 'view', resourceType, resourceId, metadata),

  export: (userId: string, resourceType: string, metadata?: Record<string, any>) =>
    auditLogQueries.logAction(userId, 'export', resourceType, undefined, metadata),

  import: (userId: string, resourceType: string, metadata?: Record<string, any>) =>
    auditLogQueries.logAction(userId, 'import', resourceType, undefined, metadata),
};