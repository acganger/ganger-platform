import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest, createSupabaseServerClient } from '@ganger/auth/server';

interface Metrics {
  timestamp: string;
  uptime_seconds: number;
  memory_usage: {
    heap_used_mb: number;
    heap_total_mb: number;
    external_mb: number;
    rss_mb: number;
  };
  database_metrics: {
    total_applications: number;
    total_configurations: number;
    total_permissions: number;
    total_audit_entries: number;
    active_impersonation_sessions: number;
    pending_approvals: number;
  };
  security_metrics: {
    failed_auth_attempts_24h: number;
    rate_limited_requests_24h: number;
    permission_violations_24h: number;
    impersonation_sessions_24h: number;
  };
  performance_metrics: {
    avg_response_time_ms: number;
    requests_per_minute: number;
    error_rate_percent: number;
    database_query_time_ms: number;
  };
  business_metrics: {
    active_users_24h: number;
    configuration_changes_24h: number;
    approvals_completed_24h: number;
    most_accessed_applications: Array<{
      app_name: string;
      access_count: number;
    }>;
  };
}

// In-memory metrics store (in production, use Redis or similar)
const metricsStore = {
  requests: [] as Array<{ timestamp: number; responseTime: number; error: boolean }>,
  authFailures: [] as Array<{ timestamp: number; ip: string }>,
  rateLimits: [] as Array<{ timestamp: number; userId: string }>,
  permissionViolations: [] as Array<{ timestamp: number; userId: string; action: string }>,
  
  // Add metrics
  addRequest(responseTime: number, error: boolean = false) {
    const now = Date.now();
    this.requests.push({ timestamp: now, responseTime, error });
    // Keep only last 24 hours
    this.requests = this.requests.filter(r => now - r.timestamp < 24 * 60 * 60 * 1000);
  },

  addAuthFailure(ip: string) {
    const now = Date.now();
    this.authFailures.push({ timestamp: now, ip });
    this.authFailures = this.authFailures.filter(f => now - f.timestamp < 24 * 60 * 60 * 1000);
  },

  addRateLimit(userId: string) {
    const now = Date.now();
    this.rateLimits.push({ timestamp: now, userId });
    this.rateLimits = this.rateLimits.filter(r => now - r.timestamp < 24 * 60 * 60 * 1000);
  },

  addPermissionViolation(userId: string, action: string) {
    const now = Date.now();
    this.permissionViolations.push({ timestamp: now, userId, action });
    this.permissionViolations = this.permissionViolations.filter(
      v => now - v.timestamp < 24 * 60 * 60 * 1000
    );
  }
};

async function gatherMetrics(): Promise<Metrics> {
  const supabase = createSupabaseServerClient();
  
  // Memory metrics
  const memUsage = process.memoryUsage();
  const memory_usage = {
    heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
    external_mb: Math.round(memUsage.external / 1024 / 1024),
    rss_mb: Math.round(memUsage.rss / 1024 / 1024)
  };

  // Database metrics
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const [
    applicationsCount,
    configurationsCount,
    permissionsCount,
    auditEntriesCount,
    activeImpersonations,
    pendingApprovals
  ] = await Promise.all([
    supabase.from('platform_applications').select('*', { count: 'exact', head: true }),
    supabase.from('app_configurations').select('*', { count: 'exact', head: true }),
    supabase.from('app_config_permissions').select('*', { count: 'exact', head: true }),
    supabase.from('config_change_audit').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_impersonation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('pending_config_changes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
  ]);

  const database_metrics = {
    total_applications: applicationsCount.count || 0,
    total_configurations: configurationsCount.count || 0,
    total_permissions: permissionsCount.count || 0,
    total_audit_entries: auditEntriesCount.count || 0,
    active_impersonation_sessions: activeImpersonations.count || 0,
    pending_approvals: pendingApprovals.count || 0
  };

  // Security metrics from in-memory store
  const security_metrics = {
    failed_auth_attempts_24h: metricsStore.authFailures.length,
    rate_limited_requests_24h: metricsStore.rateLimits.length,
    permission_violations_24h: metricsStore.permissionViolations.length,
    impersonation_sessions_24h: 0 // Would need to query database for this
  };

  // Performance metrics from in-memory store
  const recentRequests = metricsStore.requests;
  const errorRequests = recentRequests.filter(r => r.error);
  const successRequests = recentRequests.filter(r => !r.error);
  
  const performance_metrics = {
    avg_response_time_ms: successRequests.length > 0 
      ? Math.round(successRequests.reduce((sum, r) => sum + r.responseTime, 0) / successRequests.length)
      : 0,
    requests_per_minute: Math.round(recentRequests.length / (24 * 60)), // Approximate
    error_rate_percent: recentRequests.length > 0 
      ? Math.round((errorRequests.length / recentRequests.length) * 100)
      : 0,
    database_query_time_ms: 0 // Would need to implement query timing
  };

  // Business metrics
  const [
    activeUsersResult,
    configChangesResult,
    approvalsResult,
    accessPatternsResult
  ] = await Promise.all([
    // Active users in last 24h (from audit log)
    supabase
      .from('config_change_audit')
      .select('user_id', { count: 'exact' })
      .gte('created_at', yesterday.toISOString())
      .not('user_id', 'is', null),
    
    // Configuration changes in last 24h
    supabase
      .from('config_change_audit')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .in('action', ['CONFIGURATION_CREATED', 'CONFIGURATION_UPDATED', 'CONFIGURATION_DELETED']),
    
    // Approvals completed in last 24h
    supabase
      .from('config_change_audit')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .in('action', ['CHANGE_APPROVED', 'CHANGE_REJECTED']),
    
    // Most accessed applications (from audit log)
    supabase
      .from('config_change_audit')
      .select('app_id, platform_applications(app_name)')
      .gte('created_at', yesterday.toISOString())
      .not('app_id', 'is', null)
      .limit(100)
  ]);

  // Process most accessed applications
  const appAccessCounts = new Map<string, number>();
  if (accessPatternsResult.data) {
    accessPatternsResult.data.forEach((entry: any) => {
      if (entry.platform_applications?.app_name) {
        const appName = entry.platform_applications.app_name;
        appAccessCounts.set(appName, (appAccessCounts.get(appName) || 0) + 1);
      }
    });
  }

  const most_accessed_applications = Array.from(appAccessCounts.entries())
    .map(([app_name, access_count]) => ({ app_name, access_count }))
    .sort((a, b) => b.access_count - a.access_count)
    .slice(0, 5);

  // Count unique active users
  const uniqueUsers = new Set();
  if (activeUsersResult.data) {
    activeUsersResult.data.forEach((entry: any) => {
      if (entry.user_id) uniqueUsers.add(entry.user_id);
    });
  }

  const business_metrics = {
    active_users_24h: uniqueUsers.size,
    configuration_changes_24h: configChangesResult.count || 0,
    approvals_completed_24h: approvalsResult.count || 0,
    most_accessed_applications
  };

  return {
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    memory_usage,
    database_metrics,
    security_metrics,
    performance_metrics,
    business_metrics
  };
}

async function metricsHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<Metrics | { error: string }>
) {
  try {
    const metrics = await gatherMetrics();
    
    // Set caching headers (cache for 1 minute)
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.setHeader('Content-Type', 'application/json');
    
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Metrics gathering error:', error);
    res.status(500).json({ 
      error: 'Failed to gather metrics' 
    });
  }
}

// Export the metrics store for other modules to use
export { metricsStore };

// Export with auth middleware
export default withAuth(metricsHandler);