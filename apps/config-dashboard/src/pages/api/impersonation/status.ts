import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';

// Standard API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method allowed'
      }
    });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Check for active impersonation session
    const { data: activeSession, error: sessionError } = await supabase
      .from('user_impersonation_sessions')
      .select(`
        *,
        impersonator:users!impersonator_user_id (
          email,
          name
        ),
        target_user:users!target_user_id (
          email,
          name
        )
      `)
      .eq('impersonator_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Session fetch error:', sessionError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check impersonation status'
        }
      });
    }

    // Check if user is currently being impersonated by someone else
    const { data: beingImpersonated, error: impersonatedError } = await supabase
      .from('user_impersonation_sessions')
      .select(`
        *,
        impersonator:users!impersonator_user_id (
          email,
          name
        )
      `)
      .eq('target_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (impersonatedError && impersonatedError.code !== 'PGRST116') {
      console.error('Impersonation check error:', impersonatedError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check if being impersonated'
        }
      });
    }

    // Get user's impersonation permissions
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id
      });

    if (permError) {
      console.error('Permission check error:', permError);
      // Don't fail the request for permission errors, just note lack of permissions
    }

    const canImpersonate = userPermissions?.some((perm: any) => 
      perm.role_name === 'superadmin'
    ) || false;

    // Calculate time remaining for active session
    let timeRemaining = null;
    if (activeSession) {
      const expiresAt = new Date(activeSession.expires_at);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();
      timeRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60))); // minutes
    }

    const response = {
      user_id: user.id,
      user_email: user?.email,
      can_impersonate: canImpersonate,
      is_impersonating: !!activeSession,
      is_being_impersonated: !!beingImpersonated,
      active_session: activeSession ? {
        id: activeSession.id,
        target_user: {
          id: activeSession.target_user_id,
          email: activeSession.target_user?.email,
          name: activeSession.target_user.name
        },
        started_at: activeSession.created_at,
        expires_at: activeSession.expires_at,
        time_remaining_minutes: timeRemaining,
        reason: activeSession.reason,
        location: activeSession.location
      } : null,
      impersonated_by: beingImpersonated ? {
        id: beingImpersonated.id,
        impersonator: {
          id: beingImpersonated.impersonator_user_id,
          email: beingImpersonated.impersonator.email,
          name: beingImpersonated.impersonator.name
        },
        started_at: beingImpersonated.created_at,
        expires_at: beingImpersonated.expires_at,
        reason: beingImpersonated.reason,
        location: beingImpersonated.location
      } : null
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Impersonation status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get impersonation status'
      }
    });
  }
}
// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
