import type { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '../../../lib/auth-utils';
import { ApiResponse, ErrorCodes } from '../../../middleware/errorHandler';
import { withAuth, withMethods, withRateLimit, AuthenticatedRequest } from '../../../middleware/auth';
import { google } from 'googleapis';

// Runtime: nodejs (default) - uses Google Admin SDK

interface CleanupRequest {
  dryRun?: boolean;
  includeRecentlyTerminated?: boolean; // Include employees terminated in last 30 days
  departments?: string[];
}

interface TerminatedEmployee {
  id: string;
  email: string;
  name: string;
  terminated_date: string;
  department: string;
  google_account_status?: 'active' | 'suspended' | 'deleted' | 'not_found';
}

interface CleanupResponse {
  cleanupId: string;
  status: 'started' | 'completed' | 'failed';
  results: {
    employeesProcessed: number;
    accountsSuspended: number;
    accountsAlreadySuspended: number;
    accountsNotFound: number;
    errors: Array<{ email: string; error: string }>;
    terminatedEmployees?: TerminatedEmployee[]; // Only in dry run
  };
  startTime: string;
  endTime?: string;
  duration?: number;
  dryRun: boolean;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Google Admin SDK
async function getGoogleAdminClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
    },
    scopes: ['https://www.googleapis.com/auth/admin.directory.user']
  });

  const authClient = await auth.getClient();
  return google.admin({ version: 'directory_v1', auth: authClient });
}

async function cleanupHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<CleanupResponse>>
) {
  const { user } = req;
  const { dryRun = true, includeRecentlyTerminated = false, departments = [] }: CleanupRequest = req.body;

  const cleanupId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date().toISOString();

  try {
    // Create cleanup log entry
    const { error: logError } = await supabase
      .from('cleanup_logs')
      .insert({
        id: cleanupId,
        type: 'google_workspace_terminated',
        status: 'started',
        started_at: startTime,
        started_by: user.id,
        options: JSON.stringify({ dryRun, includeRecentlyTerminated, departments })
      });

    if (logError) {
      console.error('Failed to create cleanup log:', logError);
    }

    // Get terminated employees from database
    let query = supabase
      .from('employees')
      .select('id, email, first_name, last_name, department, terminated_date')
      .eq('status', 'terminated')
      .not('email', 'is', null);

    // Filter by termination date if not including recently terminated
    if (!includeRecentlyTerminated) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.lt('terminated_date', thirtyDaysAgo.toISOString());
    }

    // Filter by departments if specified
    if (departments.length > 0) {
      query = query.in('department', departments);
    }

    const { data: terminatedEmployees, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch terminated employees: ${fetchError.message}`);
    }

    // Initialize Google Admin client
    const adminClient = await getGoogleAdminClient();
    
    const results = {
      employeesProcessed: 0,
      accountsSuspended: 0,
      accountsAlreadySuspended: 0,
      accountsNotFound: 0,
      errors: [] as Array<{ email: string; error: string }>,
      terminatedEmployees: dryRun ? [] as TerminatedEmployee[] : undefined
    };

    // Process each terminated employee
    for (const employee of terminatedEmployees || []) {
      results.employeesProcessed++;
      
      const terminatedEmployee: TerminatedEmployee = {
        id: employee.id,
        email: employee.email,
        name: `${employee.first_name} ${employee.last_name}`,
        terminated_date: employee.terminated_date,
        department: employee.department
      };

      try {
        // Check Google account status
        const googleUser = await adminClient.users.get({
          userKey: employee.email
        }).catch(() => null);

        if (!googleUser) {
          terminatedEmployee.google_account_status = 'not_found';
          results.accountsNotFound++;
        } else if (googleUser.data.suspended) {
          terminatedEmployee.google_account_status = 'suspended';
          results.accountsAlreadySuspended++;
        } else {
          terminatedEmployee.google_account_status = 'active';
          
          if (!dryRun) {
            // Suspend the account
            await adminClient.users.update({
              userKey: employee.email,
              requestBody: {
                suspended: true,
                suspensionReason: `Employee terminated on ${new Date(employee.terminated_date).toLocaleDateString()}`
              }
            });
            
            results.accountsSuspended++;
            
            // Log the action
            await auditLog({
              action: 'google_account_suspended',
              userId: user.id,
              userEmail: user?.email,
              resourceType: 'google_workspace_user',
              resourceId: employee.email,
              metadata: {
                employeeId: employee.id,
                terminatedDate: employee.terminated_date,
                department: employee.department
              }
            });
          }
        }

        if (dryRun && results.terminatedEmployees) {
          results.terminatedEmployees.push(terminatedEmployee);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          email: employee.email,
          error: errorMessage
        });
        
        if (dryRun && results.terminatedEmployees) {
          terminatedEmployee.google_account_status = 'active'; // Assume active if error
          results.terminatedEmployees.push(terminatedEmployee);
        }
      }
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    // Update cleanup log
    await supabase
      .from('cleanup_logs')
      .update({
        status: 'completed',
        completed_at: endTime,
        results: JSON.stringify(results),
        duration_ms: duration
      })
      .eq('id', cleanupId);

    // Final audit log
    await auditLog({
      action: dryRun ? 'terminated_employees_cleanup_preview' : 'terminated_employees_cleanup_completed',
      userId: user.id,
      userEmail: user?.email,
      resourceType: 'google_workspace_cleanup',
      metadata: {
        cleanupId,
        dryRun,
        duration,
        results: {
          employeesProcessed: results.employeesProcessed,
          accountsSuspended: results.accountsSuspended,
          accountsAlreadySuspended: results.accountsAlreadySuspended,
          accountsNotFound: results.accountsNotFound,
          errorCount: results.errors.length
        }
      }
    });

    const response: CleanupResponse = {
      cleanupId,
      status: 'completed',
      results,
      startTime,
      endTime,
      duration,
      dryRun
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    // Update cleanup log with failure
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    await supabase
      .from('cleanup_logs')
      .update({
        status: 'failed',
        completed_at: endTime,
        error: error instanceof Error ? error.message : 'Unknown cleanup error',
        duration_ms: duration
      })
      .eq('id', cleanupId);

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Cleanup failed'
      }
    });
  }
}

export default withRateLimit(
  withMethods(
    withAuth(cleanupHandler, { requiredPermissions: ['admin:users'] }),
    ['POST']
  ),
  { maxRequests: 5, windowMs: 60000 } // 5 cleanup requests per minute
);