// pages/api/auth/user.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';

interface UserProfileResponse {
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
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    user?: UserProfileResponse;
  };
  error?: {
    code: string;
    message: string;
    timestamp: string;
    request_id: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const requestId = Math.random().toString(36).substring(7);

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
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

  try {
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

    // Get or create user profile
    let { data: userProfile, error } = await supabase
      .from('staff_user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create profile
      const newProfile = {
        id: session.user.id,
        employee_id: session.user.email?.split('@')[0] || session.user.id.substring(0, 8),
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Unknown User',
        email: session.user.email!,
        department: 'General',
        role: 'staff' as const,
        location: 'Multiple' as const,
        is_active: true,
        google_user_data: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
          picture: session.user.user_metadata?.avatar_url,
          verified_email: session.user.email_confirmed_at !== null,
          created_at: new Date().toISOString()
        }
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('staff_user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'PROFILE_CREATION_ERROR',
            message: 'Failed to create user profile',
            timestamp: new Date().toISOString(),
            request_id: requestId
          }
        });
      }

      userProfile = createdProfile;
    } else if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_FETCH_ERROR',
          message: 'Failed to fetch user profile',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Format response
    const formattedUser: UserProfileResponse = {
      id: userProfile.id,
      employee_id: userProfile.employee_id || '',
      full_name: userProfile.full_name,
      email: userProfile.email,
      department: userProfile.department || 'General',
      role: userProfile.role,
      location: userProfile.location || 'Multiple',
      hire_date: userProfile.hire_date,
      phone_number: userProfile.phone_number,
      is_active: userProfile.is_active,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    };

    return res.status(200).json({
      success: true,
      data: {
        user: formattedUser
      }
    });

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