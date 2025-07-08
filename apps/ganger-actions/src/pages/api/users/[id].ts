import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest, updateUserSchema } from '../../../lib/validation-schemas';
import { 
  ApiErrors, 
  sendSuccess, 
  withErrorHandler,
  validateRequiredFields,
  requireRole
} from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

// Factory function to create Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiErrors.internal('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

export default withErrorHandler(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Use @ganger/auth for authentication
  const authSupabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await authSupabase.auth.getSession();
  const { id: userId } = req.query;

  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  if (!userId || typeof userId !== 'string') {
    throw ApiErrors.validation('Valid user ID is required');
  }

  const userEmail = session.user.email;
  logger.logRequest(req, userEmail);

  // Create Supabase client with service role
  const supabase = getSupabaseClient();

  // Get current user's profile to check permissions
  const { data: userProfile, error: profileError } = await supabase
    .from('staff_user_profiles')
    .select('id, role, email, full_name')
    .eq('email', userEmail)
    .single();

  if (profileError || !userProfile) {
    logger.error('Failed to fetch user profile', profileError, { userEmail });
    throw ApiErrors.database('Failed to fetch user profile');
  }

  switch (req.method) {
    case 'GET':
      await handleGetUser(req, res, supabase, userProfile, userId);
      break;
    case 'PUT':
      await handleUpdateUser(req, res, supabase, userProfile, userId);
      break;
    case 'DELETE':
      await handleDeleteUser(req, res, supabase, userProfile, userId);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }
});

async function handleGetUser(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  userProfile: any,
  userId: string
) {
  const startTime = Date.now();

  // Get user with permission checks
  const { data: targetUser, error } = await supabase
    .from('staff_user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiErrors.notFound('User');
    }

    logger.error('Failed to fetch user', error, { userId });
    throw ApiErrors.database('Failed to fetch user');
  }

  logger.logDatabase('SELECT', 'staff_user_profiles', Date.now() - startTime);

  // Check permissions (users can view themselves, managers can view staff/managers, admins can view all)
  const isSelf = targetUser.id === userProfile.id;
  const canView = isSelf || 
    (userProfile.role === 'manager' && ['staff', 'manager'].includes(targetUser.role)) ||
    userProfile.role === 'admin';

  if (!canView) {
    throw ApiErrors.forbidden('You do not have permission to view this user');
  }

  // Format response (exclude sensitive data for non-admins)
  const formattedUser = {
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

  sendSuccess(res, { user: formattedUser });
}

async function handleUpdateUser(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  userProfile: any,
  userId: string
) {
  const startTime = Date.now();

  const validation = validateRequest(updateUserSchema, req.body);
  if (!validation.success) {
    throw ApiErrors.validation('Request validation failed', validation.errors);
  }

  const updates = validation.data;

  logger.info('Updating user', { userEmail: userProfile.email, targetUserId: userId });

  // Get current user to check permissions and track changes
  const { data: currentUser, error: fetchError } = await supabase
    .from('staff_user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiErrors.notFound('User');
    }

    logger.error('Failed to fetch user for update', fetchError, { userId });
    throw ApiErrors.database('Failed to fetch user for update');
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
    throw ApiErrors.forbidden('You do not have permission to update this user');
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
    throw ApiErrors.validation('No changes detected');
  }

  // Update the user
  const { data: updatedUser, error: updateError } = await supabase
    .from('staff_user_profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to update user', updateError, { userId });
    throw ApiErrors.database('Failed to update user');
  }

  logger.logDatabase('UPDATE', 'staff_user_profiles', Date.now() - startTime);

  // Log analytics event
  const { error: analyticsError } = await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'user_updated',
      user_id: userProfile.id,
      metadata: {
        updated_user_id: userId,
        updated_user_email: currentUser.email,
        changes
      }
    });

  if (analyticsError) {
    logger.warn('Failed to log analytics', { error: analyticsError });
    // Non-critical error, continue
  }

  // Format response
  const formattedUser = {
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

  sendSuccess(res, { user: formattedUser });
}

async function handleDeleteUser(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  userProfile: any,
  userId: string
) {
  const startTime = Date.now();

  // Only admins can delete users
  requireRole(userProfile.role, ['admin']);

  logger.info('Deleting user', { userEmail: userProfile.email, targetUserId: userId });

  // Get current user to check constraints
  const { data: currentUser, error: fetchError } = await supabase
    .from('staff_user_profiles')
    .select('id, email, role, is_active, google_user_data')
    .eq('id', userId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiErrors.notFound('User');
    }

    logger.error('Failed to fetch user for deletion', fetchError, { userId });
    throw ApiErrors.database('Failed to fetch user for deletion');
  }

  // Prevent self-deletion
  if (currentUser.id === userProfile.id) {
    throw ApiErrors.validation('Cannot delete your own account');
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
    logger.error('Failed to delete user', deleteError, { userId });
    throw ApiErrors.database('Failed to delete user');
  }

  logger.logDatabase('UPDATE', 'staff_user_profiles', Date.now() - startTime);

  // Log analytics event
  const { error: analyticsError } = await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'user_deleted',
      user_id: userProfile.id,
      metadata: {
        deleted_user_id: userId,
        deleted_user_email: currentUser.email
      }
    });

  if (analyticsError) {
    logger.warn('Failed to log analytics', { error: analyticsError });
    // Non-critical error, continue
  }

  sendSuccess(res, { message: 'User deleted successfully' });
}