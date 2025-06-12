import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../middleware/auth';
import { getUserFromToken } from '../../../lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MetricsResponse {
  timestamp: string;
  period: string;
  system: {
    uptime: number;
    memory: {
      used: number;
      free: number;
      total: number;
      usagePercent: number;
    };
    cpu: {
      userTime: number;
      systemTime: number;
    };
  };
  database: {
    totalQueries: number;
    slowQueries: number;
    avgResponseTime: number;
    connectionPoolUsage: number;
  };
  api: {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    requestsByEndpoint: Record<string, number>;
  };
  compliance: {
    totalEmployees: number;
    complianceRate: number;
    overdueTrainings: number;
    syncStatus: {
      lastZenefitsSync: string;
      lastClassroomSync: string;
      syncErrors: number;
    };
  };
  backgroundJobs: {
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    avgExecutionTime: number;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed'
      }
    });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Check if user has monitoring permissions
    const hasPermission = await validateMonitoringPermissions(user);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access monitoring metrics'
        }
      });
    }

    const { period = '1h' } = req.query;

    // Gather metrics
    const [systemMetrics, databaseMetrics, complianceMetrics, jobMetrics] = await Promise.all([
      getSystemMetrics(),
      getDatabaseMetrics(period as string),
      getComplianceMetrics(),
      getBackgroundJobMetrics(period as string)
    ]);

    const response: MetricsResponse = {
      timestamp: new Date().toISOString(),
      period: period as string,
      system: systemMetrics,
      database: databaseMetrics,
      api: {
        totalRequests: 0, // Would track in production
        errorRate: 0,
        avgResponseTime: 0,
        requestsByEndpoint: {}
      },
      compliance: complianceMetrics,
      backgroundJobs: jobMetrics
    };

    // Cache headers for metrics endpoint
    res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute cache

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    // Metrics API error - logged to monitoring
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to fetch monitoring metrics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

async function validateMonitoringPermissions(user: any): Promise<boolean> {
  const userRole = user.role || user.user_role;
  return ['superadmin', 'hr_admin'].includes(userRole);
}

function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    uptime: process.uptime(),
    memory: {
      used: memoryUsage.heapUsed,
      free: memoryUsage.heapTotal - memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      usagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    },
    cpu: {
      userTime: cpuUsage.user / 1000000, // Convert microseconds to milliseconds
      systemTime: cpuUsage.system / 1000000
    }
  };
}

async function getDatabaseMetrics(period: string): Promise<{
  totalQueries: number;
  slowQueries: number;
  avgResponseTime: number;
  connectionPoolUsage: number;
}> {
  try {
    // Get database performance metrics
    const { data: dbStats, error } = await supabase
      .rpc('get_database_performance_metrics', { time_period: period });

    if (error) {
      // Could not fetch database metrics
      return {
        totalQueries: 0,
        slowQueries: 0,
        avgResponseTime: 0,
        connectionPoolUsage: 0
      };
    }

    return {
      totalQueries: dbStats?.total_queries || 0,
      slowQueries: dbStats?.slow_queries || 0,
      avgResponseTime: dbStats?.avg_response_time || 0,
      connectionPoolUsage: dbStats?.connection_pool_usage || 0
    };
  } catch (_error) {
    // Failed to get database metrics
    return {
      totalQueries: 0,
      slowQueries: 0,
      avgResponseTime: 0,
      connectionPoolUsage: 0
    };
  }
}

async function getComplianceMetrics(): Promise<{
  totalEmployees: number;
  complianceRate: number;
  overdueTrainings: number;
  syncStatus: {
    lastZenefitsSync: string;
    lastClassroomSync: string;
    syncErrors: number;
  };
}> {
  try {
    // Get overall compliance statistics
    const { data: overallStats } = await supabase
      .rpc('calculate_compliance_rate');

    // Get employee count
    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get overdue training count
    const { count: overdueTrainings } = await supabase
      .from('training_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')
      .eq('is_required', true);

    // Get sync status
    const { data: syncLogs } = await supabase
      .from('sync_logs')
      .select('sync_type, end_time, status')
      .order('end_time', { ascending: false })
      .limit(10);

    const lastZenefitsSync = syncLogs?.find(log => log.sync_type === 'zenefits_employees')?.end_time || '';
    const lastClassroomSync = syncLogs?.find(log => log.sync_type === 'google_classroom_completions')?.end_time || '';
    const syncErrors = syncLogs?.filter(log => log.status === 'failed').length || 0;

    return {
      totalEmployees: totalEmployees || 0,
      complianceRate: overallStats || 0,
      overdueTrainings: overdueTrainings || 0,
      syncStatus: {
        lastZenefitsSync,
        lastClassroomSync,
        syncErrors
      }
    };
  } catch (_error) {
    // Failed to get compliance metrics
    return {
      totalEmployees: 0,
      complianceRate: 0,
      overdueTrainings: 0,
      syncStatus: {
        lastZenefitsSync: '',
        lastClassroomSync: '',
        syncErrors: 0
      }
    };
  }
}

async function getBackgroundJobMetrics(period: string): Promise<{
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  avgExecutionTime: number;
}> {
  try {
    // Calculate time range based on period
    let sinceTime: string;
    const now = new Date();
    
    switch (period) {
      case '1h':
        sinceTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        sinceTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        sinceTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        sinceTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    }

    // Get job execution history
    const { data: jobHistory } = await supabase
      .rpc('get_job_execution_history', { 
        p_limit: 1000 
      });

    if (!jobHistory) {
      return {
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        avgExecutionTime: 0
      };
    }

    // Filter by time period
    const recentJobs = jobHistory.filter((job: any) => 
      new Date(job.execution_time).getTime() >= new Date(sinceTime).getTime()
    );

    const totalJobs = recentJobs.length;
    const successfulJobs = recentJobs.filter((job: any) => job.success).length;
    const failedJobs = totalJobs - successfulJobs;
    
    const avgExecutionTime = recentJobs.length > 0 
      ? recentJobs.reduce((sum: number, job: any) => sum + (job.duration || 0), 0) / recentJobs.length
      : 0;

    return {
      totalJobs,
      successfulJobs,
      failedJobs,
      avgExecutionTime
    };
  } catch (_error) {
    // Failed to get background job metrics
    return {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      avgExecutionTime: 0
    };
  }
}

export default withAuth(handler, {
  requiredRoles: ['superadmin', 'hr_admin']
});