// pages/api/auth/google.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';

interface ApiResponse {
  success: boolean;
  data?: {
    url?: string;
    user?: any;
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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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

    // Initiate Google OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_STAFF_URL}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          hd: 'gangerdermatology.com' // Restrict to domain
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        url: data.url
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Authentication service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}