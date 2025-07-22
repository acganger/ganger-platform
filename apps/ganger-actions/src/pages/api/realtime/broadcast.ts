// pages/api/realtime/broadcast.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { Database } from '../../../types/database';
import { validateRequest } from '../../../lib/validation-schemas';
import { z } from 'zod';

const broadcastSchema = z.object({
  channel: z.string().min(1, 'Channel is required'),
  event: z.string().min(1, 'Event is required'),
  payload: z.record(z.unknown()).optional(),
  target_user_ids: z.array(z.string()).optional(),
  exclude_user_ids: z.array(z.string()).optional()
});

interface ApiResponse {
  success: boolean;
  data?: {
    message: string;
    channel: string;
    event: string;
    recipients_count?: number;
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

  // Only admin and managers can broadcast messages
  if (!['admin', 'manager'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only managers and administrators can broadcast real-time messages',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  try {
    const validation = validateRequest(broadcastSchema, req.body);
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
      channel,
      event,
      payload,
      target_user_ids,
      exclude_user_ids
    } = validation.data;

    // Prepare broadcast payload
    const broadcastPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      sender: {
        id: userProfile.id,
        name: userProfile.full_name,
        email: userProfile.email
      },
      request_id: requestId
    };

    // Determine recipient count for logging
    let recipientsCount = 0;
    if (target_user_ids && target_user_ids.length > 0) {
      recipientsCount = target_user_ids.length;
    } else {
      // Get count of active users (excluding those in exclude list)
      let countQuery = supabase
        .from('staff_user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (exclude_user_ids && exclude_user_ids.length > 0) {
        countQuery = countQuery.not('id', 'in', `(${exclude_user_ids.join(',')})`);
      }

      const { count } = await countQuery;
      recipientsCount = count || 0;
    }

    // Use Supabase realtime to broadcast the message
    const broadcastResult = await supabase.channel(channel)
      .send({
        type: 'broadcast',
        event,
        payload: broadcastPayload
      });

    // Create notification records for targeted broadcasts
    if (target_user_ids && target_user_ids.length > 0) {
      const notifications = target_user_ids.map(userId => ({
        user_id: userId,
        title: `Real-time update: ${event}`,
        message: `Broadcast message in channel ${channel}`,
        type: 'info' as const,
        category: 'system' as const,
        priority: 'normal' as const,
        is_read: false,
        related_entity_type: 'broadcast',
        related_entity_id: requestId,
        metadata: {
          channel,
          event,
          broadcast_payload: broadcastPayload,
          sender_id: userProfile.id,
          sender_email: userProfile.email
        }
      }));

      await supabase
        .from('staff_notifications')
        .insert(notifications);
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'realtime_broadcast',
        user_id: userProfile.id,
        metadata: {
          channel,
          event,
          recipients_count: recipientsCount,
          target_user_ids: target_user_ids || [],
          exclude_user_ids: exclude_user_ids || [],
          has_payload: !!payload,
          request_id: requestId
        }
      });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Broadcast sent successfully',
        channel,
        event,
        recipients_count: recipientsCount
      }
    });

  } catch (error) {
    console.error('Realtime broadcast error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BROADCAST_ERROR',
        message: error instanceof Error ? error.message : 'Broadcast service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}
