// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';
import { validateRequest, validateQuery, userQuerySchema, createUserSchema } from '../../../lib/validation-schemas';

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
    users?: UserProfile[];
    user?: UserProfile;
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
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
      return await handleGetUsers(req, res, supabase, userProfile, requestId);
    } else if (req.method === 'POST') {
      return await handleCreateUser(req, res, supabase, userProfile, requestId);
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
    console.error('Users API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Users service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetUsers(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateQuery(userQuerySchema, req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const {
    department,
    role,
    location,
    is_active,
    search,
    sort_by,
    sort_order,
    limit,
    offset,
    hired_after,
    hired_before
  } = validation.data;

  // Build query with permissions (staff can only see other staff, managers can see staff/managers, admins see all)
  let query = supabase
    .from('staff_user_profiles')
    .select('*');

  // Apply role-based filtering
  if (userProfile.role === 'staff') {
    query = query.eq('role', 'staff');
  } else if (userProfile.role === 'manager') {
    query = query.in('role', ['staff', 'manager']);
  }
  // Admins can see all users (no additional filter)

  // Apply filters
  if (department) {
    query = query.eq('department', department);
  }

  if (role) {
    query = query.eq('role', role);
  }

  if (location) {
    query = query.eq('location', location);
  }

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);
  }

  if (hired_after) {
    query = query.gte('hire_date', hired_after);
  }

  if (hired_before) {
    query = query.lte('hire_date', hired_before);
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('staff_user_profiles')
    .select('id', { count: 'exact', head: true });

  // Execute main query with pagination
  const { data: users, error } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Users fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch users',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response data (exclude sensitive google_user_data for non-admins)
  const formattedUsers: UserProfile[] = users.map(user => ({
    id: user.id,
    employee_id: user.employee_id || '',
    full_name: user.full_name,
    email: user.email,
    department: user.department || 'General',
    role: user.role,
    location: user.location || 'Multiple',
    hire_date: user.hire_date,
    phone_number: user.phone_number,
    is_active: user.is_active,
    google_user_data: userProfile.role === 'admin' ? user.google_user_data : undefined,
    created_at: user.created_at,
    updated_at: user.updated_at
  }));

  return res.status(200).json({
    success: true,
    data: {
      users: formattedUsers,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: (offset + limit) < (totalCount || 0)
      }
    }
  });
}

async function handleCreateUser(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  // Only admins can create users manually
  if (userProfile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only administrators can create user profiles',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const validation = validateRequest(createUserSchema, req.body);
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

  const {
    employee_id,
    full_name,
    email,
    department,
    role,
    location,
    hire_date,
    phone_number
  } = validation.data;

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('staff_user_profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Create user profile
    const userData = {
      employee_id: employee_id.trim(),
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      department,
      role,
      location,
      hire_date,
      phone_number: phone_number?.trim(),
      is_active: true,
      google_user_data: {
        created_manually: true,
        created_by: userProfile.email,
        created_at: new Date().toISOString(),
        request_id: requestId
      }
    };

    const { data: newUser, error } = await supabase
      .from('staff_user_profiles')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('User creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: 'Failed to create user',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'user_created',
        user_id: userProfile.id,
        metadata: {
          created_user_id: newUser.id,
          created_user_email: email,
          role,
          department,
          request_id: requestId
        }
      });

    // Format response
    const formattedUser: UserProfile = {
      id: newUser.id,
      employee_id: newUser.employee_id || '',
      full_name: newUser.full_name,
      email: newUser.email,
      department: newUser.department || 'General',
      role: newUser.role,
      location: newUser.location || 'Multiple',
      hire_date: newUser.hire_date,
      phone_number: newUser.phone_number,
      is_active: newUser.is_active,
      google_user_data: newUser.google_user_data,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at
    };

    return res.status(201).json({
      success: true,
      data: {
        user: formattedUser
      }
    });

  } catch (error) {
    console.error('User creation process error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_PROCESS_ERROR',
        message: 'User creation process failed',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}