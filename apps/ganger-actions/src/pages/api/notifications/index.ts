// pages/api/notifications/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { Database } from '../../../types/database';
import { validateRequest, validateQuery, notificationQuerySchema, createNotificationSchema } from '../../../lib/validation-schemas';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'ticket' | 'user' | 'system' | 'reminder';
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string;
  recipient?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    notifications?: Notification[];
    notification?: Notification;
    unread_count?: number;
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

  try {
    if (req.method === 'GET') {
      return await handleGetNotifications(req, res, supabase, userProfile, requestId);
    } else if (req.method === 'POST') {
      return await handleCreateNotification(req, res, supabase, userProfile, requestId);
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
    console.error('Notifications API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Notifications service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetNotifications(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateQuery(notificationQuerySchema, req.query);
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
    read,
    type,
    category,
    priority,
    related_entity_type,
    related_entity_id,
    search,
    sort_by,
    sort_order,
    limit,
    offset,
    created_after,
    created_before,
    include_unread_count
  } = validation.data;

  // Build query - users can only see their own notifications
  let query = supabase
    .from('staff_notifications')
    .select(`
      *,
      recipient:staff_user_profiles!staff_notifications_user_id_fkey(id, full_name, email)
    `)
    .eq('user_id', userProfile.id);

  // Apply filters
  if (read !== undefined) {
    query = query.eq('read', read);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  if (related_entity_type) {
    query = query.eq('related_entity_type', related_entity_type);
  }

  if (related_entity_id) {
    query = query.eq('related_entity_id', related_entity_id);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
  }

  if (created_after) {
    query = query.gte('created_at', created_after);
  }

  if (created_before) {
    query = query.lte('created_at', created_before);
  }

  // Filter out expired notifications
  query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('staff_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userProfile.id);

  // Get unread count if requested
  let unreadCount = undefined;
  if (include_unread_count) {
    const { count } = await supabase
      .from('staff_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userProfile.id)
      .eq('read', false)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
    
    unreadCount = count || 0;
  }

  // Execute main query with pagination
  const { data: notifications, error } = await query
    .range(offset!, offset! + limit! - 1);

  if (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notifications',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response data
  const formattedNotifications: Notification[] = (notifications || []).map((notification: any) => ({
    id: notification.id,
    user_id: notification.user_id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    category: notification.category,
    read: notification.read,
    priority: notification.priority,
    related_entity_type: notification.related_entity_type,
    related_entity_id: notification.related_entity_id,
    action_url: notification.action_url,
    expires_at: notification.expires_at,
    metadata: notification.metadata || {},
    created_at: notification.created_at,
    read_at: notification.read_at,
    recipient: {
      id: notification.recipient.id,
      name: notification.recipient.full_name,
      email: notification.recipient.email
    }
  }));

  return res.status(200).json({
    success: true,
    data: {
      notifications: formattedNotifications,
      unread_count: unreadCount,
      pagination: {
        total: totalCount || 0,
        limit: limit!,
        offset: offset!,
        has_more: (offset! + limit!) < (totalCount || 0)
      }
    }
  });
}

async function handleCreateNotification(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  // Only admin and managers can create notifications for other users
  if (!['admin', 'manager'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only managers and administrators can create notifications',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const validation = validateRequest(createNotificationSchema, req.body);
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
    user_id,
    title,
    message,
    type,
    category,
    priority,
    related_entity_type,
    related_entity_id,
    action_url,
    expires_at,
    metadata
  } = validation.data;

  try {
    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('staff_user_profiles')
      .select('id, email, full_name, is_active')
      .eq('id', user_id)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TARGET_USER_NOT_FOUND',
          message: 'Target user not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    if (!targetUser.is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TARGET_USER_INACTIVE',
          message: 'Cannot send notification to inactive user',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Create notification
    const notificationData = {
      user_id,
      title: title.trim(),
      message: message.trim(),
      type,
      category,
      priority,
      related_entity_type,
      related_entity_id,
      action_url,
      expires_at,
      read: false,
      metadata: {
        ...metadata,
        created_by: userProfile.id,
        created_by_email: userProfile.email,
        request_id: requestId
      }
    };

    const { data: newNotification, error } = await supabase
      .from('staff_notifications')
      .insert(notificationData)
      .select(`
        *,
        recipient:staff_user_profiles!staff_notifications_user_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Notification creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: 'Failed to create notification',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'notification_created',
        user_id: userProfile.id,
        metadata: {
          notification_id: newNotification.id,
          target_user_id: user_id,
          target_user_email: targetUser.email,
          type,
          category,
          priority,
          related_entity_type,
          related_entity_id,
          request_id: requestId
        }
      });

    // Format response
    const formattedNotification: Notification = {
      id: newNotification.id,
      user_id: newNotification.user_id,
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      category: newNotification.category,
      read: newNotification.read,
      priority: newNotification.priority,
      related_entity_type: newNotification.related_entity_type,
      related_entity_id: newNotification.related_entity_id,
      action_url: newNotification.action_url,
      expires_at: newNotification.expires_at,
      metadata: newNotification.metadata || {},
      created_at: newNotification.created_at,
      read_at: newNotification.read_at,
      recipient: {
        id: newNotification.recipient.id,
        name: newNotification.recipient.full_name,
        email: newNotification.recipient.email
      }
    };

    return res.status(201).json({
      success: true,
      data: {
        notification: formattedNotification
      }
    });

  } catch (error) {
    console.error('Notification creation process error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_PROCESS_ERROR',
        message: 'Notification creation process failed',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}