// pages/api/admin/google-sync.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { getGoogleWorkspaceService, validateGoogleWorkspaceConfig } from '../../../lib/google-workspace-service';
import { validateRequest } from '../../../lib/validation-schemas';
import { z } from 'zod';

const syncUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID')
});

const bulkSyncSchema = z.object({
  user_ids: z.array(z.string().uuid()).max(50, 'Cannot sync more than 50 users at once').optional(),
  sync_all_active: z.boolean().optional()
}).refine(
  data => data.user_ids || data.sync_all_active,
  { message: 'Either user_ids or sync_all_active must be provided' }
);

const createWorkspaceUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  send_welcome_email: z.boolean().default(true)
});

interface ApiResponse {
  success: boolean;
  data?: {
    sync_result?: {
      successful: number;
      failed: number;
      errors: Array<{ email: string; error: string }>;
    };
    user?: unknown;
    validation_result?: {
      valid: boolean;
      error?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    request_id: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const requestId = Math.random().toString(36).substring(7);

  // Authentication check using @ganger/auth
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session?.user?.email) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check domain restriction
  const email = session.user.email;
  if (!email?.endsWith('@gangerdermatology.com')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'DOMAIN_RESTRICTED',
        message: 'Access restricted to Ganger Dermatology domain',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Get user profile for permissions
  const { data: userProfile } = await supabase
    .from('staff_user_profiles')
    .select('id, role, email, full_name')
    .eq('email', session.user.email)
    .single();

  if (!userProfile) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PROFILE_NOT_FOUND',
        message: 'User profile not found',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Only admins can access Google Workspace sync
  if (userProfile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only administrators can access Google Workspace sync',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  try {
    if (req.method === 'GET') {
      return await handleValidateConfig(req, res, requestId);
    } else if (req.method === 'POST') {
      const { action } = req.query;
      
      switch (action) {
        case 'sync-user':
          return await handleSyncUser(req, res, supabase, userProfile, requestId);
        case 'bulk-sync':
          return await handleBulkSync(req, res, supabase, userProfile, requestId);
        case 'create-workspace-user':
          return await handleCreateWorkspaceUser(req, res, supabase, userProfile, requestId);
        default:
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Valid action is required (sync-user, bulk-sync, create-workspace-user)',
              timestamp: new Date().toISOString(),
              request_id: requestId
            }
          });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }
  } catch (error) {
    console.error('Google Workspace sync API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Google Workspace sync service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleValidateConfig(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  requestId: string
) {
  try {
    const validationResult = await validateGoogleWorkspaceConfig();
    
    return res.status(200).json({
      success: true,
      data: {
        validation_result: validationResult
      }
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate Google Workspace configuration',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleSyncUser(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateRequest(syncUserSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const { user_id } = validation.data;

  try {
    // Get user data from database
    const { data: user, error: userError } = await supabase
      .from('staff_user_profiles')
      .select(`
        *,
        manager:staff_user_profiles!staff_user_profiles_manager_id_fkey(email)
      `)
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Sync to Google Workspace
    const googleService = getGoogleWorkspaceService();
    const syncResult = await googleService.syncUserToWorkspace(
      {
        full_name: user.full_name,
        email: user?.email,
        department: user.department,
        location: user.location,
        phone_number: user.phone_number,
        is_active: user.is_active
      },
      user.manager?.email
    );

    if (!syncResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: `Failed to sync user to Google Workspace: ${syncResult.error}`,
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Update user's Google sync status
    await supabase
      .from('staff_user_profiles')
      .update({
        google_user_data: {
          ...user.google_user_data,
          workspace_synced: true,
          last_synced: new Date().toISOString(),
          workspace_user_id: syncResult.user.id
        }
      })
      .eq('id', user_id);

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'google_workspace_sync',
        user_id: userProfile.id,
        metadata: {
          synced_user_id: user_id,
          synced_user_email: user?.email,
          request_id: requestId
        }
      });

    return res.status(200).json({
      success: true,
      data: {
        user: syncResult.user
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_ERROR',
        message: 'Failed to sync user',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleBulkSync(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateRequest(bulkSyncSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const { user_ids, sync_all_active } = validation.data;

  try {
    let query = supabase
      .from('staff_user_profiles')
      .select(`
        *,
        manager:staff_user_profiles!staff_user_profiles_manager_id_fkey(email)
      `);

    if (user_ids) {
      query = query.in('id', user_ids);
    } else if (sync_all_active) {
      query = query.eq('is_active', true);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch users for sync',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_USERS',
          message: 'No users found to sync',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Prepare user data for bulk sync
    const usersToSync = users.map((user: any) => ({
      full_name: user.full_name,
      email: user?.email,
      department: user.department,
      location: user.location,
      phone_number: user.phone_number,
      manager_email: user.manager?.email,
      is_active: user.is_active
    }));

    // Perform bulk sync
    const googleService = getGoogleWorkspaceService();
    const syncResult = await googleService.bulkSyncUsers(usersToSync);

    // Update sync status for successful users
    const successfulEmails = usersToSync
      .filter((_: any, index: number) => !syncResult.errors.some(error => error.email === usersToSync[index].email))
      .map((user: any) => user?.email);

    if (successfulEmails.length > 0) {
      await supabase
        .from('staff_user_profiles')
        .update({
          google_user_data: supabase.raw(`
            COALESCE(google_user_data, '{}'::jsonb) || 
            '{"workspace_synced": true, "last_synced": "${new Date().toISOString()}"}'::jsonb
          `)
        })
        .in('email', successfulEmails);
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'google_workspace_bulk_sync',
        user_id: userProfile.id,
        metadata: {
          total_users: users.length,
          successful: syncResult.successful,
          failed: syncResult.failed,
          sync_all_active: !!sync_all_active,
          request_id: requestId
        }
      });

    return res.status(200).json({
      success: true,
      data: {
        sync_result: syncResult
      }
    });

  } catch (error) {
    console.error('Bulk sync error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BULK_SYNC_ERROR',
        message: 'Failed to perform bulk sync',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleCreateWorkspaceUser(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateRequest(createWorkspaceUserSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const { user_id, send_welcome_email } = validation.data;

  try {
    // Get user data from database
    const { data: user, error: userError } = await supabase
      .from('staff_user_profiles')
      .select(`
        *,
        manager:staff_user_profiles!staff_user_profiles_manager_id_fkey(email)
      `)
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Create user in Google Workspace
    const googleService = getGoogleWorkspaceService();
    const [firstName, ...lastNameParts] = user.full_name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const createResult = await googleService.createUser({
      firstName,
      lastName,
      email: user?.email,
      department: user.department,
      location: user.location,
      phone: user.phone_number,
      manager: user.manager?.email,
      suspended: !user.is_active,
      orgUnitPath: process.env.GOOGLE_TARGET_OU || '/Google Cloud Identity'
    });

    if (!createResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: `Failed to create Google Workspace user: ${createResult.error}`,
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Update user's Google data
    await supabase
      .from('staff_user_profiles')
      .update({
        google_user_data: {
          ...user.google_user_data,
          workspace_created: true,
          workspace_user_id: (createResult.user as { id?: string })?.id,
          created_at: new Date().toISOString(),
          welcome_email_sent: send_welcome_email
        }
      })
      .eq('id', user_id);

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'google_workspace_user_created',
        user_id: userProfile.id,
        metadata: {
          created_user_id: user_id,
          created_user_email: user?.email,
          welcome_email_sent: send_welcome_email,
          request_id: requestId
        }
      });

    return res.status(201).json({
      success: true,
      data: {
        user: createResult.user
      }
    });

  } catch (error) {
    console.error('Workspace user creation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_ERROR',
        message: 'Failed to create Google Workspace user',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}