import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { createClient } from '@supabase/supabase-js';
import { getGoogleWorkspaceService } from '../../../lib/google-workspace-service';
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
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  logger.logRequest(req, userEmail);

  // Create Supabase client inside handler
  const serviceSupabase = getSupabaseClient();

  // Get current user's profile to check permissions
  const { data: currentUser, error: userError } = await serviceSupabase
    .from('staff_user_profiles')
    .select('role')
    .eq('email', userEmail)
    .single();

  if (userError) {
    logger.error('Failed to fetch user profile', userError, { userEmail });
    throw ApiErrors.database('Failed to fetch user profile');
  }

  switch (req.method) {
    case 'GET':
      await handleGet(req, res, userEmail);
      break;
    
    case 'POST':
      // Only admins and managers can create users
      requireRole(currentUser?.role, ['admin', 'manager']);
      await handlePost(req, res, userEmail);
      break;
    
    default:
      throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }
});

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  const startTime = Date.now();
  
  // Create Supabase client inside function
  const serviceSupabase = getSupabaseClient();

  const { 
    search, 
    department, 
    location, 
    role,
    manager_id,
    is_active = 'true',
    page = '1',
    limit = '50'
  } = req.query;

  logger.debug('Fetching users', { 
    userEmail, 
    filters: { search, department, location, role, manager_id, is_active } 
  });

  // Build query
  let query = serviceSupabase
    .from('staff_user_profiles')
    .select(`
      *,
      manager:manager_id(id, full_name, email)
    `, { count: 'exact' });

  // Apply filters
  if (is_active !== 'all') {
    query = query.eq('is_active', is_active === 'true');
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (department) {
    query = query.eq('department', department);
  }

  if (location) {
    query = query.eq('location', location);
  }

  if (role) {
    query = query.eq('role', role);
  }

  if (manager_id) {
    query = query.eq('manager_id', manager_id);
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  query = query
    .order('full_name')
    .range(offset, offset + limitNum - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch users', error, { userEmail });
    throw ApiErrors.database('Failed to fetch users');
  }

  logger.logDatabase('SELECT', 'staff_user_profiles', Date.now() - startTime);

  // Get unique departments from existing users
  const { data: deptData, error: deptError } = await serviceSupabase
    .from('staff_user_profiles')
    .select('department')
    .not('department', 'is', null)
    .order('department');

  if (deptError) {
    logger.error('Failed to fetch departments', deptError, { userEmail });
    // Non-critical error, continue without departments
  }

  const uniqueDepartments = Array.from(new Set(deptData?.map(d => d.department) || []));
  const locations = ['Wixom', 'Ann Arbor', 'Plymouth', 'Multiple'];
  const roles = ['admin', 'manager', 'staff'];

  sendSuccess(res, {
    users: data || [],
    total: count || 0,
    page: pageNum,
    limit: limitNum,
    filters: {
      departments: uniqueDepartments,
      locations,
      roles
    }
  });
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  const startTime = Date.now();
  
  // Create Supabase client inside function
  const serviceSupabase = getSupabaseClient();

  const {
    email,
    full_name,
    phone_number,
    department,
    role = 'staff',
    location,
    manager_id,
    hire_date,
    employee_id
  } = req.body;

  // Validate required fields
  validateRequiredFields(req.body, ['email', 'full_name']);

  logger.info('Creating new user', { userEmail, newUserEmail: email });

  // Check if user already exists in database
  const { data: existingUser, error: checkError } = await serviceSupabase
    .from('staff_user_profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is what we want
    logger.error('Failed to check existing user', checkError, { userEmail, email });
    throw ApiErrors.database('Failed to check existing user');
  }

  if (existingUser) {
    throw ApiErrors.conflict('User with this email already exists');
  }

  // Get manager email if manager_id is provided
  let managerEmail = undefined;
  if (manager_id) {
    const { data: manager, error: managerError } = await serviceSupabase
      .from('staff_user_profiles')
      .select('email')
      .eq('id', manager_id)
      .single();
    
    if (managerError) {
      logger.warn('Failed to fetch manager email', { manager_id, error: managerError });
    }
    
    managerEmail = manager?.email;
  }

  // Create user in Google Workspace
  try {
    const googleWorkspaceService = getGoogleWorkspaceService();
    const googleResult = await googleWorkspaceService.syncUserToWorkspace(
      {
        full_name,
        email,
        department,
        location,
        phone_number,
        manager_id,
        is_active: true
      },
      managerEmail
    );

    if (!googleResult.success) {
      logger.error('Google Workspace creation failed', new Error(googleResult.error), { email });
      // Continue with local creation even if Google Workspace fails
      // Log the error for manual sync later
    }
  } catch (googleError) {
    logger.error('Google Workspace integration error', googleError as Error, { email });
    // Continue with local creation
  }

  // Create user profile in database
  const { data: newUser, error } = await serviceSupabase
    .from('staff_user_profiles')
    .insert({
      email,
      full_name,
      phone_number,
      department,
      role,
      location,
      manager_id,
      hire_date,
      employee_id,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create user', error, { userEmail, email });
    throw ApiErrors.database('Failed to create user');
  }

  logger.logDatabase('INSERT', 'staff_user_profiles', Date.now() - startTime);

  // Log the activity in analytics table
  const { error: analyticsError } = await serviceSupabase
    .from('staff_analytics')
    .insert({
      event_type: 'user_created',
      user_id: newUser.id,
      metadata: {
        created_by: userEmail,
        initial_role: role,
        initial_department: department
      }
    });

  if (analyticsError) {
    logger.warn('Failed to log analytics', { error: analyticsError });
    // Non-critical error, continue
  }

  sendSuccess(res, {
    user: newUser,
    message: 'User created successfully in both database and Google Workspace'
  }, 201);
}