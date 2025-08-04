import type { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '../../../lib/auth-utils';
import { ApiResponse, ErrorCodes } from '../../../middleware/errorHandler';
import { withAuth, withMethods, withRateLimit, AuthenticatedRequest } from '../../../middleware/auth';
import { google } from 'googleapis';

// Runtime: nodejs (default) - uses Google Admin SDK

interface SyncRequest {
  dryRun?: boolean;
  departments?: string[];
  locations?: string[];
  forceUpdate?: boolean; // Force update even if no changes detected
}

interface ActiveEmployee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string;
  job_title: string;
  location: string;
  start_date: string;
  google_account_status?: 'active' | 'not_found' | 'needs_creation' | 'needs_update';
  google_account_details?: any;
}

interface SyncResponse {
  syncId: string;
  status: 'started' | 'completed' | 'failed';
  results: {
    employeesProcessed: number;
    accountsCreated: number;
    accountsUpdated: number;
    accountsAlreadyExist: number;
    accountsSkipped: number;
    errors: Array<{ email: string; error: string }>;
    activeEmployees?: ActiveEmployee[]; // Only in dry run
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

// Generate random password that meets Google requirements
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Map department to organizational unit
function getOrgUnitPath(department: string): string {
  const orgUnitMap: Record<string, string> = {
    'Clinical': '/Clinical Staff',
    'Front Desk': '/Front Desk',
    'Call Center': '/Call Center',
    'Administration': '/Administration',
    'Management': '/Management',
    'Providers': '/Providers',
    'Nurses': '/Clinical Staff/Nurses',
    'Medical Assistants': '/Clinical Staff/Medical Assistants'
  };
  
  return orgUnitMap[department] || '/Staff';
}

async function syncHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<SyncResponse>>
) {
  const { user } = req;
  const { dryRun = true, departments = [], locations = [], forceUpdate = false }: SyncRequest = req.body;

  const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date().toISOString();

  try {
    // Create sync log entry
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        id: syncId,
        type: 'google_workspace_active',
        status: 'started',
        started_at: startTime,
        started_by: user.id,
        options: JSON.stringify({ dryRun, departments, locations, forceUpdate })
      });

    if (logError) {
      console.error('Failed to create sync log:', logError);
    }

    // Get active employees from database
    let query = supabase
      .from('employees')
      .select('id, email, first_name, last_name, department, job_title, location, start_date')
      .eq('status', 'active')
      .not('email', 'is', null);

    // Filter by departments if specified
    if (departments.length > 0) {
      query = query.in('department', departments);
    }

    // Filter by locations if specified
    if (locations.length > 0) {
      query = query.in('location', locations);
    }

    const { data: activeEmployees, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch active employees: ${fetchError.message}`);
    }

    // Initialize Google Admin client
    const adminClient = await getGoogleAdminClient();
    
    const results = {
      employeesProcessed: 0,
      accountsCreated: 0,
      accountsUpdated: 0,
      accountsAlreadyExist: 0,
      accountsSkipped: 0,
      errors: [] as Array<{ email: string; error: string }>,
      activeEmployees: dryRun ? [] as ActiveEmployee[] : undefined
    };

    // Process each active employee
    for (const employee of activeEmployees || []) {
      results.employeesProcessed++;
      
      const activeEmployee: ActiveEmployee = {
        id: employee.id,
        email: employee.email,
        first_name: employee.first_name,
        last_name: employee.last_name,
        department: employee.department,
        job_title: employee.job_title,
        location: employee.location,
        start_date: employee.start_date
      };

      try {
        // Check if Google account exists
        const googleUser = await adminClient.users.get({
          userKey: employee.email
        }).catch(() => null);

        if (!googleUser) {
          // Account doesn't exist - need to create
          activeEmployee.google_account_status = 'needs_creation';
          
          if (!dryRun) {
            // Create new Google account
            const newUserData = {
              primaryEmail: employee.email,
              name: {
                givenName: employee.first_name,
                familyName: employee.last_name
              },
              password: generateSecurePassword(),
              changePasswordAtNextLogin: true,
              orgUnitPath: getOrgUnitPath(employee.department),
              customSchemas: {
                EmployeeInfo: {
                  department: employee.department,
                  jobTitle: employee.job_title,
                  location: employee.location,
                  startDate: employee.start_date
                }
              }
            };

            await adminClient.users.insert({
              requestBody: newUserData
            });
            
            results.accountsCreated++;
            
            // Log the action
            await auditLog({
              action: 'google_account_created',
              userId: user.id,
              userEmail: user?.email,
              resourceType: 'google_workspace_user',
              resourceId: employee.email,
              metadata: {
                employeeId: employee.id,
                department: employee.department,
                jobTitle: employee.job_title,
                location: employee.location
              }
            });
          }
        } else {
          // Account exists - check if needs update
          const googleUserData = googleUser.data;
          activeEmployee.google_account_details = {
            suspended: googleUserData.suspended,
            orgUnitPath: googleUserData.orgUnitPath,
            lastLoginTime: googleUserData.lastLoginTime
          };

          // Check if account is suspended
          if (googleUserData.suspended) {
            activeEmployee.google_account_status = 'needs_update';
            
            if (!dryRun) {
              // Reactivate suspended account
              await adminClient.users.update({
                userKey: employee.email,
                requestBody: {
                  suspended: false
                }
              });
              
              results.accountsUpdated++;
            }
          } else {
            // Check if department/job info needs update
            const needsUpdate = forceUpdate ||
              googleUserData.orgUnitPath !== getOrgUnitPath(employee.department) ||
              googleUserData.customSchemas?.EmployeeInfo?.department !== employee.department ||
              googleUserData.customSchemas?.EmployeeInfo?.jobTitle !== employee.job_title ||
              googleUserData.customSchemas?.EmployeeInfo?.location !== employee.location;

            if (needsUpdate) {
              activeEmployee.google_account_status = 'needs_update';
              
              if (!dryRun) {
                // Update account information
                await adminClient.users.update({
                  userKey: employee.email,
                  requestBody: {
                    orgUnitPath: getOrgUnitPath(employee.department),
                    customSchemas: {
                      EmployeeInfo: {
                        department: employee.department,
                        jobTitle: employee.job_title,
                        location: employee.location,
                        startDate: employee.start_date
                      }
                    }
                  }
                });
                
                results.accountsUpdated++;
                
                // Log the action
                await auditLog({
                  action: 'google_account_updated',
                  userId: user.id,
                  userEmail: user?.email,
                  resourceType: 'google_workspace_user',
                  resourceId: employee.email,
                  metadata: {
                    employeeId: employee.id,
                    updates: {
                      department: employee.department,
                      jobTitle: employee.job_title,
                      location: employee.location,
                      orgUnitPath: getOrgUnitPath(employee.department)
                    }
                  }
                });
              }
            } else {
              activeEmployee.google_account_status = 'active';
              results.accountsAlreadyExist++;
            }
          }
        }

        if (dryRun && results.activeEmployees) {
          results.activeEmployees.push(activeEmployee);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          email: employee.email,
          error: errorMessage
        });
        
        if (dryRun && results.activeEmployees) {
          activeEmployee.google_account_status = 'not_found';
          results.activeEmployees.push(activeEmployee);
        }
      }
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    // Update sync log
    await supabase
      .from('sync_logs')
      .update({
        status: 'completed',
        completed_at: endTime,
        results: JSON.stringify(results),
        duration_ms: duration
      })
      .eq('id', syncId);

    // Final audit log
    await auditLog({
      action: dryRun ? 'active_employees_sync_preview' : 'active_employees_sync_completed',
      userId: user.id,
      userEmail: user?.email,
      resourceType: 'google_workspace_sync',
      metadata: {
        syncId,
        dryRun,
        duration,
        results: {
          employeesProcessed: results.employeesProcessed,
          accountsCreated: results.accountsCreated,
          accountsUpdated: results.accountsUpdated,
          accountsAlreadyExist: results.accountsAlreadyExist,
          accountsSkipped: results.accountsSkipped,
          errorCount: results.errors.length
        }
      }
    });

    const response: SyncResponse = {
      syncId,
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
    // Update sync log with failure
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

    await supabase
      .from('sync_logs')
      .update({
        status: 'failed',
        completed_at: endTime,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        duration_ms: duration
      })
      .eq('id', syncId);

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Sync failed'
      }
    });
  }
}

export default withRateLimit(
  withMethods(
    withAuth(syncHandler, { requiredPermissions: ['admin:users'] }),
    ['POST']
  ),
  { maxRequests: 10, windowMs: 60000 } // 10 sync requests per minute
);