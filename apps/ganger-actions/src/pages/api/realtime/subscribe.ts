// pages/api/realtime/subscribe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { Database } from '../../../types/database';

interface ApiResponse {
  success: boolean;
  data?: {
    message: string;
    user_id: string;
    channels: string[];
    connection_info: {
      supabase_url: string;
      anon_key: string;
      user_channels: string[];
    };
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

  // Authentication check
  const supabase = createSupabaseServerClient();
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

  // Get user profile
  const { data: userProfile } = await supabase
    .from('staff_user_profiles')
    .select('id, role, email, full_name, department, location')
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
    // Define channels based on user role and attributes
    const userChannels: string[] = [
      `user:${userProfile.id}`, // Personal channel
      'staff:general', // General staff updates
      `department:${userProfile.department}`, // Department-specific updates
      `location:${userProfile.location}` // Location-specific updates
    ];

    // Add role-based channels
    if (userProfile.role === 'admin') {
      userChannels.push('admin:alerts', 'system:notifications');
    } else if (userProfile.role === 'manager') {
      userChannels.push('manager:updates');
    }

    // Add ticket-related channels
    userChannels.push('tickets:updates', 'tickets:assignments');

    // Remove duplicates and clean channel names
    const cleanChannels = [...new Set(userChannels)]
      .filter(channel => channel && channel.trim().length > 0)
      .map(channel => channel.toLowerCase().replace(/\s+/g, '_'));

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'realtime_subscription',
        user_id: userProfile.id,
        metadata: {
          channels: cleanChannels,
          role: userProfile.role,
          department: userProfile.department,
          location: userProfile.location,
          request_id: requestId
        }
      });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Subscription information retrieved successfully',
        user_id: userProfile.id,
        channels: cleanChannels,
        connection_info: {
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          user_channels: cleanChannels
        }
      }
    });

  } catch (error) {
    console.error('Realtime subscription error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: error instanceof Error ? error.message : 'Subscription service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}
