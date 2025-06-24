import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

// Request validation schema
const StartImpersonationSchema = z.object({
  target_user_id: z.string().uuid(),
  reason: z.string().min(10).max(500),
  location: z.string().optional(),
  max_duration_minutes: z.number().int().min(15).max(480).default(60) // Default 1 hour, max 8 hours
});

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
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method allowed'
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

    // Validate request body
    const bodyResult = StartImpersonationSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST_BODY',
          message: 'Invalid request body',
          details: bodyResult.error.issues
        }
      });
      return;
    }

    const { target_user_id, reason, location, max_duration_minutes } = bodyResult.data!;

    // Check if user has impersonation permissions
    const { data: userPermissions, error: permError } = await supabase
      .rpc('get_effective_permissions', { 
        p_user_id: user.id
      });

    if (permError) {
      console.error('Permission check error:', permError);
      res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to verify permissions'
        }
      });
    }

    // Require superadmin role for impersonation
    const canImpersonate = userPermissions?.some((perm: any) => 
      perm.role_name === 'superadmin'
    );

    if (!canImpersonate) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Impersonation requires superadmin privileges'
        }
      });
    }

    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', target_user_id)
      .single();

    if (userError || !targetUser) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TARGET_USER_NOT_FOUND',
          message: 'Target user not found'
        }
      });
      return;
    }

    // Prevent self-impersonation
    if (target_user_id === user.id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SELF_IMPERSONATION_FORBIDDEN',
          message: 'Cannot impersonate yourself'
        }
      });
    }

    // Check for existing active impersonation session
    const { data: existingSession, error: sessionError } = await supabase
      .from('user_impersonation_sessions')
      .select('id')
      .eq('impersonator_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Session check error:', sessionError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check existing sessions'
        }
      });
    }

    if (existingSession) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ACTIVE_SESSION_EXISTS',
          message: 'You already have an active impersonation session. End it first.'
        }
      });
    }

    // Calculate session expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + max_duration_minutes);

    // Create impersonation session
    const { data: impersonationSession, error: createError } = await supabase
      .from('user_impersonation_sessions')
      .insert([{
        impersonator_user_id: user.id,
        target_user_id,
        reason,
        location,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      }])
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
      .single();

    if (createError) {
      console.error('Impersonation session creation error:', createError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create impersonation session'
        }
      });
    }

    // Log the impersonation start action
    await supabase
      .from('config_change_audit')
      .insert([{
        user_id: user.id,
        action: 'IMPERSONATION_STARTED',
        description: `Started impersonating user ${targetUser.email} (${targetUser.name}). Reason: ${reason}`,
        metadata: {
          target_user_id,
          target_user_email: targetUser.email,
          target_user_name: targetUser.name,
          session_id: impersonationSession.id,
          max_duration_minutes,
          location
        },
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

    res.status(201).json({
      success: true,
      data: {
        session: impersonationSession,
        message: `Impersonation session started for ${targetUser.email}`,
        expires_at: expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Start impersonation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to start impersonation session'
      }
    });
  }
}
// Cloudflare Workers Edge Runtime
// export const runtime = 'edge'; // Removed for Vercel compatibility
