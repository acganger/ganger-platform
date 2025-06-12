import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { z } from 'zod';

// Request validation schema
const EndImpersonationSchema = z.object({
  session_id: z.string().uuid().optional(), // Optional - if not provided, ends the current active session
  reason: z.string().min(5).max(200).optional() // Optional reason for ending
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
    const bodyResult = EndImpersonationSchema.safeParse(req.body);
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

    const { session_id, reason } = bodyResult.data!;

    // Find the active impersonation session
    let sessionQuery = supabase
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
      .eq('is_active', true);

    if (session_id) {
      sessionQuery = sessionQuery.eq('id', session_id);
    }

    const { data: sessions, error: sessionError } = await sessionQuery;

    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch impersonation session'
        }
      });
      return;
    }

    if (!sessions || sessions.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_ACTIVE_SESSION',
          message: 'No active impersonation session found'
        }
      });
      return;
    }

    if (sessions.length > 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MULTIPLE_SESSIONS',
          message: 'Multiple active sessions found. Please specify session_id.'
        }
      });
      return;
    }

    const session = sessions[0];
    const endTime = new Date();

    // Calculate session duration
    const startTime = new Date(session.created_at);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // End the impersonation session
    const { data: updatedSession, error: updateError } = await supabase
      .from('user_impersonation_sessions')
      .update({
        is_active: false,
        ended_at: endTime.toISOString(),
        end_reason: reason || 'Manual termination',
        session_duration_minutes: durationMinutes
      })
      .eq('id', session.id)
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

    if (updateError) {
      console.error('Session update error:', updateError);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to end impersonation session'
        }
      });
    }

    // Log the impersonation end action
    await supabase
      .from('config_change_audit')
      .insert([{
        user_id: user.id,
        action: 'IMPERSONATION_ENDED',
        description: `Ended impersonation of user ${session.target_user.email} (${session.target_user.name}). Duration: ${durationMinutes} minutes. ${reason ? `Reason: ${reason}` : ''}`,
        metadata: {
          target_user_id: session.target_user_id,
          target_user_email: session.target_user.email,
          target_user_name: session.target_user.name,
          session_id: session.id,
          duration_minutes: durationMinutes,
          end_reason: reason || 'Manual termination',
          session_start: session.created_at,
          session_end: endTime.toISOString()
        },
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      }]);

    res.status(200).json({
      success: true,
      data: {
        session: updatedSession,
        message: `Impersonation session ended for ${session.target_user.email}`,
        duration_minutes: durationMinutes
      }
    });

  } catch (error) {
    console.error('End impersonation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to end impersonation session'
      }
    });
  }
}