import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get current user's profile to check permissions
  const { data: currentUser } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', session.user.email)
    .single();

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, session.user.email);
    
    case 'POST':
      // Only admins and managers can create users
      if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handlePost(req, res, session.user.email);
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  try {
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

    // Build query
    let query = supabase
      .from('user_profiles')
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
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Get departments and locations for filters
    const { data: departments } = await supabase
      .from('departments')
      .select('name')
      .order('name');

    const locations = ['Ann Arbor', 'Wixom', 'Plymouth', 'Remote', 'All'];
    const roles = ['admin', 'manager', 'staff', 'intern'];

    return res.status(200).json({
      users: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      filters: {
        departments: departments?.map(d => d.name) || [],
        locations,
        roles
      }
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  try {
    const {
      email,
      full_name,
      phone,
      department,
      position,
      role = 'staff',
      location,
      manager_id,
      hire_date,
      employee_id
    } = req.body;

    // Validate required fields
    if (!email || !full_name) {
      return res.status(400).json({ 
        error: 'Email and full name are required' 
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Create auth user first (if using Supabase Auth)
    // For now, we'll just create the profile
    // In production, you'd integrate with Google Workspace API here

    const { data: newUser, error } = await supabase
      .from('user_profiles')
      .insert({
        email,
        full_name,
        phone,
        department,
        position,
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
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Log the activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: newUser.id,
        action: 'user_created',
        details: {
          created_by: userEmail,
          initial_role: role,
          initial_department: department
        }
      });

    return res.status(201).json({
      user: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}