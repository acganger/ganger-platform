// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';

interface ApiResponse {
  success: boolean;
  data?: {};
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

    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Logout service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}