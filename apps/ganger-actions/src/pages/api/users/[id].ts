// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';
import { validateRequest, updateUserSchema } from '../../../lib/validation-schemas';

interface UserProfile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role: 'staff' | 'manager' | 'admin';
  location: string;
  hire_date?: string;
  phone_number?: string;
  is_active: boolean;
  google_user_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    user?: UserProfile;
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
  const { id: userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_USER_ID',
        message: 'Valid user ID is required',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Authentication check
  const supabase = createServerSupabaseClient<Database>({ req, res });
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session) {
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
  const email = session.user?.email;
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
    .eq('id', session.user.id)
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

  try {
    if (req.method === 'GET') {
      return await handleGetUser(req, res, supabase, userProfile, userId, requestId);
    } else if (req.method === 'PUT') {
      return await handleUpdateUser(req, res, supabase, userProfile, userId, requestId);
    } else if (req.method === 'DELETE') {
      return await handleDeleteUser(req, res, supabase, userProfile, userId, requestId);
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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
    console.error('User API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'User service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetUser(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  userId: string,
  requestId: string
) {
  // Get user with permission checks
  const { data: targetUser, error } = await supabase
    .from('staff_user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
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

    console.error('User fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch user',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check permissions (users can view themselves, managers can view staff/managers, admins can view all)
  const isSelf = targetUser.id === userProfile.id;
  const canView = isSelf || 
    (userProfile.role === 'manager' && ['staff', 'manager'].includes(targetUser.role)) ||
    userProfile.role === 'admin';

  if (!canView) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to view this user',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response (exclude sensitive data for non-admins)
  const formattedUser: UserProfile = {
    id: targetUser.id,
    employee_id: targetUser.employee_id || '',
    full_name: targetUser.full_name,
    email: targetUser.email,
    department: targetUser.department || 'General',
    role: targetUser.role,
    location: targetUser.location || 'Multiple',
    hire_date: targetUser.hire_date,
    phone_number: targetUser.phone_number,
    is_active: targetUser.is_active,
    google_user_data: (userProfile.role === 'admin' || isSelf) ? targetUser.google_user_data : undefined,
    created_at: targetUser.created_at,
    updated_at: targetUser.updated_at
  };

  return res.status(200).json({
    success: true,
    data: {
      user: formattedUser
    }
  });
}

async function handleUpdateUser(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  userId: string,
  requestId: string
) {
  const validation = validateRequest(updateUserSchema, req.body);
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

  const updates = validation.data;

  // Get current user to check permissions and track changes
  const { data: currentUser, error: fetchError } = await supabase
    .from('staff_user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
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

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch user for update',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check permissions
  const isSelf = currentUser.id === userProfile.id;
  const isAdmin = userProfile.role === 'admin';
  const isManager = userProfile.role === 'manager';
  
  // Users can edit their own basic info, managers can edit staff/managers, admins can edit all
  const canEdit = isSelf || 
    (isManager && ['staff', 'manager'].includes(currentUser.role)) ||
    isAdmin;

  if (!canEdit) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to update this user',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Restrict certain fields based on permissions
  if (!isAdmin) {
    // Non-admins cannot change role or is_active status
    delete updates.role;
    delete updates.is_active;
    
    // Only self or managers can change department/location
    if (!isSelf && !isManager) {
      delete updates.department;
      delete updates.location;
    }
  }

  // Prepare update data
  const updateData: any = {};
  const changes: Record<string, { from: any; to: any }> = {};

  // Track and apply changes
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== currentUser[key]) {
      changes[key] = { from: currentUser[key], to: value };
      updateData[key] = value;
    }
  });

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_CHANGES',
        message: 'No changes detected',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Update the user
  const { data: updatedUser, error: updateError } = await supabase
    .from('staff_user_profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error('User update error:', updateError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update user',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'user_updated',
      user_id: userProfile.id,
      metadata: {
        updated_user_id: userId,
        updated_user_email: currentUser.email,
        changes,
        request_id: requestId
      }
    });

  // Format response
  const formattedUser: UserProfile = {
    id: updatedUser.id,
    employee_id: updatedUser.employee_id || '',
    full_name: updatedUser.full_name,
    email: updatedUser.email,
    department: updatedUser.department || 'General',
    role: updatedUser.role,
    location: updatedUser.location || 'Multiple',
    hire_date: updatedUser.hire_date,
    phone_number: updatedUser.phone_number,
    is_active: updatedUser.is_active,
    google_user_data: (userProfile.role === 'admin' || isSelf) ? updatedUser.google_user_data : undefined,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at
  };

  return res.status(200).json({
    success: true,
    data: {
      user: formattedUser
    }
  });
}

async function handleDeleteUser(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  userId: string,
  requestId: string
) {
  // Only admins can delete users
  if (userProfile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only administrators can delete users',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Get current user to check constraints
  const { data: currentUser, error: fetchError } = await supabase
    .from('staff_user_profiles')
    .select('id, email, role, is_active')
    .eq('id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
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

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch user for deletion',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Prevent self-deletion
  if (currentUser.id === userProfile.id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CANNOT_DELETE_SELF',
        message: 'Cannot delete your own account',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Soft delete by setting is_active to false
  const { error: deleteError } = await supabase
    .from('staff_user_profiles')
    .update({
      is_active: false,
      google_user_data: {
        ...currentUser.google_user_data,
        deleted_by: userProfile.id,
        deleted_at: new Date().toISOString(),
        deleted_reason: 'Admin deletion'
      }
    })
    .eq('id', userId);

  if (deleteError) {
    console.error('User deletion error:', deleteError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETION_ERROR',
        message: 'Failed to delete user',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'user_deleted',
      user_id: userProfile.id,
      metadata: {
        deleted_user_id: userId,
        deleted_user_email: currentUser.email,
        request_id: requestId
      }
    });

  return res.status(200).json({
    success: true,
    data: {}
  });
}