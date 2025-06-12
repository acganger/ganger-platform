import type { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '../../../lib/auth-utils';
import { ApiResponse } from '../../../middleware/errorHandler';
import { withAuth, withMethods, withRateLimit, AuthenticatedRequest } from '../../../middleware/auth';
import { cache } from '../../../lib/cache';

interface DashboardData {
  summary: {
    totalEmployees: number;
    compliantEmployees: number;
    nonCompliantEmployees: number;
    complianceRate: number;
    pendingTrainings: number;
    overduePastDue: number;
  };
  recentActivity: Array<{
    id: string;
    employeeName: string;
    action: 'completed' | 'assigned' | 'overdue';
    trainingModule: string;
    timestamp: string;
  }>;
  complianceByDepartment: Array<{
    department: string;
    compliant: number;
    total: number;
    rate: number;
  }>;
  upcomingDeadlines: Array<{
    employeeId: string;
    employeeName: string;
    trainingModule: string;
    dueDate: string;
    daysUntilDue: number;
  }>;
  trends: {
    dailyCompletions: Array<{
      date: string;
      completions: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      complianceRate: number;
    }>;
  };
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function dashboardHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<DashboardData>>
) {
  const { user } = req;

  // Try to get cached dashboard data first
  const cachedData = await cache.getComplianceDashboard();
  if (cachedData) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json({
      success: true,
      data: cachedData
    });
  }

  // Get summary statistics
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, department, compliance_status')
    .eq('active', true);

    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    const totalEmployees = employees?.length || 0;
    const compliantEmployees = employees?.filter(e => e.compliance_status === 'compliant').length || 0;
    const nonCompliantEmployees = totalEmployees - compliantEmployees;
    const complianceRate = totalEmployees > 0 ? (compliantEmployees / totalEmployees) * 100 : 0;

    // Get pending trainings count
    const { count: pendingCount } = await supabase
      .from('training_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'assigned')
      .is('completed_at', null);

    // Get overdue trainings
    const { count: overdueCount } = await supabase
      .from('training_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')
      .is('completed_at', null);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('training_completions')
      .select(`
        id,
        status,
        completed_at,
        assigned_at,
        employees!inner(name),
        training_modules!inner(title)
      `)
      .order('updated_at', { ascending: false })
      .limit(10);

    // Get compliance by department
    const departmentStats = employees?.reduce((acc: Record<string, { total: number; compliant: number; overdue: number }>, emp) => {
      const dept = emp.department || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = { compliant: 0, total: 0 };
      }
      acc[dept].total++;
      if (emp.compliance_status === 'compliant') {
        acc[dept].compliant++;
      }
      return acc;
    }, {}) || {};

    const complianceByDepartment = Object.entries(departmentStats).map(([dept, stats]: [string, any]) => ({
      department: dept,
      compliant: stats.compliant,
      total: stats.total,
      rate: stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0
    }));

    // Get upcoming deadlines
    const { data: upcomingDeadlines } = await supabase
      .from('training_completions')
      .select(`
        employee_id,
        due_date,
        employees!inner(name),
        training_modules!inner(title)
      `)
      .eq('status', 'assigned')
      .is('completed_at', null)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true })
      .limit(10);

    // Get daily completions for trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completionsTrend } = await supabase
      .from('training_completions')
      .select('completed_at')
      .not('completed_at', 'is', null)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: true });

    // Process daily completions
    const dailyCompletions = completionsTrend?.reduce((acc: Record<string, number>, completion) => {
      const date = new Date(completion.completed_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    const dailyCompletionsArray = Object.entries(dailyCompletions).map(([date, count]) => ({
      date,
      completions: count as number
    }));

    // Compile dashboard data
    const dashboardData: DashboardData = {
      summary: {
        totalEmployees,
        compliantEmployees,
        nonCompliantEmployees,
        complianceRate: Math.round(complianceRate * 100) / 100,
        pendingTrainings: pendingCount || 0,
        overduePastDue: overdueCount || 0
      },
      recentActivity: recentActivity?.map(activity => ({
        id: activity.id,
        employeeName: activity.employees.name,
        action: activity.completed_at ? 'completed' : (activity.status === 'overdue' ? 'overdue' : 'assigned'),
        trainingModule: activity.training_modules.title,
        timestamp: activity.completed_at || activity.assigned_at
      })) || [],
      complianceByDepartment,
      upcomingDeadlines: upcomingDeadlines?.map(deadline => {
        const dueDate = new Date(deadline.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          employeeId: deadline.employee_id,
          employeeName: deadline.employees.name,
          trainingModule: deadline.training_modules.title,
          dueDate: deadline.due_date,
          daysUntilDue
        };
      }) || [],
      trends: {
        dailyCompletions: dailyCompletionsArray,
        monthlyTrends: [] // Would need more complex aggregation for monthly trends
      }
    };

    // Cache the dashboard data for 5 minutes
    await cache.cacheComplianceDashboard(dashboardData, 300);

    // Audit log
    await auditLog({
      action: 'compliance_dashboard_accessed',
      userId: user.id,
      userEmail: user.email,
      resourceType: 'compliance_dashboard',
      metadata: {
        totalEmployees,
        complianceRate: dashboardData.summary.complianceRate,
        cached: false
      }
    });

    res.setHeader('X-Cache', 'MISS');
    res.status(200).json({
      success: true,
      data: dashboardData
    });

}

export default withRateLimit(
  withMethods(
    withAuth(dashboardHandler, { requiredPermissions: ['compliance:view'] }),
    ['GET']
  ),
  { maxRequests: 100, windowMs: 60000 } // 100 requests per minute
);