import type { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '../../../../lib/auth-utils';
import { ApiResponse, ErrorCodes } from '../../../../middleware/errorHandler';
import { withAuth, withMethods, withRateLimit, AuthenticatedRequest } from '../../../../middleware/auth';

// Runtime: nodejs (default) - uses auth-utils

interface EmployeeComplianceData {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    hireDate: string;
    complianceStatus: 'compliant' | 'non-compliant' | 'pending';
    lastSyncAt: string | null;
  };
  trainings: Array<{
    id: string;
    moduleId: string;
    moduleTitle: string;
    status: 'completed' | 'assigned' | 'overdue' | 'not-assigned';
    assignedAt: string | null;
    dueDate: string | null;
    completedAt: string | null;
    score: number | null;
    attempts: number;
    certificateUrl: string | null;
    isRequired: boolean;
    category: string;
  }>;
  complianceHistory: Array<{
    date: string;
    action: 'assigned' | 'completed' | 'overdue' | 'renewed';
    moduleTitle: string;
    details: string;
  }>;
  upcomingDeadlines: Array<{
    moduleTitle: string;
    dueDate: string;
    daysUntilDue: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  statistics: {
    totalRequired: number;
    completed: number;
    pending: number;
    overdue: number;
    complianceRate: number;
    averageScore: number;
  };
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function employeeHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<EmployeeComplianceData>>
) {
  const { user } = req;

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Employee ID is required'
        }
      });
    }

    // Get employee basic information
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select(`
        id,
        name,
        email,
        department,
        position,
        hire_date,
        compliance_status,
        last_sync_at,
        active
      `)
      .eq('id', id)
      .single();

    if (employeeError || !employee) {
      return res.status(404).json({
        success: false,
        error: {
          code: ErrorCodes.RESOURCE_NOT_FOUND,
          message: 'Employee not found'
        }
      });
    }

    // Check if user has permission to view this employee
    if (profile?.role !== 'admin' && !user.permissions?.includes('compliance:view-all')) {
      // Users can only view their own data unless they have special permissions
      if (user.id !== employee.id && user?.email !== employee.email) {
        return res.status(403).json({
          success: false,
          error: {
            code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
            message: 'Insufficient permissions to view this employee data'
          }
        });
      }
    }

    // Get all training completions for this employee
    const { data: completions, error: completionsError } = await supabase
      .from('training_completions')
      .select(`
        id,
        status,
        assigned_at,
        due_date,
        completed_at,
        score,
        attempts,
        certificate_url,
        training_modules!inner(
          id,
          title,
          is_required,
          category
        )
      `)
      .eq('employee_id', id)
      .order('assigned_at', { ascending: false });

    if (completionsError) {
      throw new Error(`Failed to fetch training completions: ${completionsError.message}`);
    }

    // Get all available training modules to identify not-assigned ones
    const { data: allModules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, is_required, category')
      .eq('active', true);

    if (modulesError) {
      throw new Error(`Failed to fetch training modules: ${modulesError.message}`);
    }

    // Create training data with not-assigned modules
    const assignedModuleIds = new Set(completions?.map(c => c.training_modules.id) || []);
    const notAssignedModules = allModules?.filter(module => !assignedModuleIds.has(module.id)) || [];

    const trainings = [
      ...(completions?.map(completion => ({
        id: completion.id,
        moduleId: completion.training_modules.id,
        moduleTitle: completion.training_modules.title,
        status: completion.status as 'completed' | 'assigned' | 'overdue' | 'not-assigned',
        assignedAt: completion.assigned_at,
        dueDate: completion.due_date,
        completedAt: completion.completed_at,
        score: completion.score,
        attempts: completion.attempts || 0,
        certificateUrl: completion.certificate_url,
        isRequired: completion.training_modules.is_required,
        category: completion.training_modules.category
      })) || []),
      ...notAssignedModules.map(module => ({
        id: `not-assigned-${module.id}`,
        moduleId: module.id,
        moduleTitle: module.title,
        status: 'not-assigned' as const,
        assignedAt: null,
        dueDate: null,
        completedAt: null,
        score: null,
        attempts: 0,
        certificateUrl: null,
        isRequired: module.is_required,
        category: module.category
      }))
    ];

    // Get compliance history (recent actions)
    const { data: history, error: historyError } = await supabase
      .from('training_completions')
      .select(`
        assigned_at,
        completed_at,
        due_date,
        status,
        training_modules!inner(title)
      `)
      .eq('employee_id', id)
      .not('assigned_at', 'is', null)
      .order('assigned_at', { ascending: false })
      .limit(20);

    if (historyError) {
      throw new Error(`Failed to fetch compliance history: ${historyError.message}`);
    }

    // Process compliance history
    const complianceHistory = history?.flatMap(item => {
      const events = [];
      
      if (item.assigned_at) {
        events.push({
          date: item.assigned_at,
          action: 'assigned' as const,
          moduleTitle: item.training_modules.title,
          details: `Training assigned`
        });
      }
      
      if (item.completed_at) {
        events.push({
          date: item.completed_at,
          action: 'completed' as const,
          moduleTitle: item.training_modules.title,
          details: `Training completed`
        });
      }
      
      if (item.status === 'overdue' && item.due_date) {
        events.push({
          date: item.due_date,
          action: 'overdue' as const,
          moduleTitle: item.training_modules.title,
          details: `Training became overdue`
        });
      }
      
      return events;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10) || [];

    // Calculate upcoming deadlines
    const today = new Date();
    const upcomingDeadlines = trainings
      .filter(t => t.dueDate && t.status !== 'completed')
      .map(t => {
        const dueDate = new Date(t.dueDate!);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: 'high' | 'medium' | 'low' = 'low';
        if (daysUntilDue < 0) priority = 'high'; // Overdue
        else if (daysUntilDue <= 7) priority = 'high'; // Due within a week
        else if (daysUntilDue <= 30) priority = 'medium'; // Due within a month
        
        return {
          moduleTitle: t.moduleTitle,
          dueDate: t.dueDate!,
          daysUntilDue,
          priority
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5);

    // Calculate statistics
    const requiredTrainings = trainings.filter(t => t.isRequired);
    const completedTrainings = trainings.filter(t => t.status === 'completed');
    const pendingTrainings = trainings.filter(t => t.status === 'assigned');
    const overdueTrainings = trainings.filter(t => t.status === 'overdue');
    
    const completedScores = completedTrainings
      .map(t => t.score)
      .filter(score => score !== null) as number[];
    
    const statistics = {
      totalRequired: requiredTrainings.length,
      completed: completedTrainings.length,
      pending: pendingTrainings.length,
      overdue: overdueTrainings.length,
      complianceRate: requiredTrainings.length > 0 
        ? Math.round((completedTrainings.filter(t => t.isRequired).length / requiredTrainings.length) * 100)
        : 100,
      averageScore: completedScores.length > 0
        ? Math.round((completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length) * 100) / 100
        : 0
    };

    const employeeData: EmployeeComplianceData = {
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        hireDate: employee.hire_date,
        complianceStatus: employee.compliance_status,
        lastSyncAt: employee.last_sync_at
      },
      trainings,
      complianceHistory,
      upcomingDeadlines,
      statistics
    };

    // Audit log
    await auditLog({
      action: 'employee_compliance_viewed',
      userId: user.id,
      userEmail: user?.email,
      resourceType: 'employee_compliance',
      resourceId: id,
      metadata: {
        viewedEmployeeName: employee.name,
        complianceStatus: employee.compliance_status
      }
    });

    res.status(200).json({
      success: true,
      data: employeeData
    });

  } catch (error) {
    // Log error for monitoring
    
    await auditLog({
      action: 'employee_compliance_error',
      userId: user.id,
      metadata: {
        employeeId: req.query.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Failed to fetch employee compliance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export default withRateLimit(
  withMethods(
    withAuth(employeeHandler, { allowSelf: true }),
    ['GET']
  ),
  { maxRequests: 100, windowMs: 60000 } // 100 requests per minute
);