// pages/api/notifications/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { Database } from '../../../types/database';
import { validateRequest, updateNotificationSchema } from '../../../lib/validation-schemas';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'ticket' | 'user' | 'system' | 'reminder';
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  read_at?: string;
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    notification?: Notification;
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
  const { id: notificationId } = req.query;

  if (!notificationId || typeof notificationId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_NOTIFICATION_ID',
        message: 'Valid notification ID is required',
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

  try {
    if (req.method === 'GET') {
      return await handleGetNotification(req, res, supabase, userProfile, notificationId, requestId);
    } else if (req.method === 'PUT') {
      return await handleUpdateNotification(req, res, supabase, userProfile, notificationId, requestId);
    } else if (req.method === 'DELETE') {
      return await handleDeleteNotification(req, res, supabase, userProfile, notificationId, requestId);
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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
    console.error('Notification API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Notification service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetNotification(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  notificationId: string,
  requestId: string
) {
  // Get notification with related data
  const { data: notification, error } = await supabase
    .from('staff_notifications')
    .select(`
      *,
      recipient:staff_user_profiles!staff_notifications_user_id_fkey(id, full_name, email)
    `)
    .eq('id', notificationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    console.error('Notification fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notification',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check permissions - users can only see their own notifications, admins can see all
  if (notification.user_id !== userProfile.id && userProfile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only view your own notifications',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response
  const formattedNotification: Notification = {
    id: notification.id,
    user_id: notification.user_id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    category: notification.category,
    is_read: notification.is_read,
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
  };

  return res.status(200).json({
    success: true,
    data: {
      notification: formattedNotification
    }
  });
}

async function handleUpdateNotification(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  notificationId: string,
  requestId: string
) {
  const validation = validateRequest(updateNotificationSchema, req.body);
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

  const updates = validation.data;

  // Get current notification to check permissions
  const { data: currentNotification, error: fetchError } = await supabase
    .from('staff_notifications')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notification for update',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check permissions
  const isOwner = currentNotification.user_id === userProfile.id;
  const isAdmin = userProfile.role === 'admin';

  // Users can only mark their own notifications as read, admins can update any notification
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only update your own notifications',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Non-admin users can only update is_read status
  if (!isAdmin) {
    const allowedFields = ['is_read'];
    const updateKeys = Object.keys(updates);
    const unauthorizedFields = updateKeys.filter(key => !allowedFields.includes(key));
    
    if (unauthorizedFields.length > 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only mark notifications as read',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }
  }

  // Prepare update data
  const updateData: any = {};
  const changes: Record<string, { from: any; to: any }> = {};

  // Track and apply changes
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== currentNotification[key]) {
      changes[key] = { from: currentNotification[key], to: value };
      updateData[key] = value;
    }
  });

  // Handle read status change
  if (updateData.is_read === true && !currentNotification.is_read) {
    updateData.read_at = new Date().toISOString();
  } else if (updateData.is_read === false && currentNotification.is_read) {
    updateData.read_at = null;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_CHANGES',
        message: 'No changes detected',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Update the notification
  const { data: updatedNotification, error: updateError } = await supabase
    .from('staff_notifications')
    .update(updateData)
    .eq('id', notificationId)
    .select(`
      *,
      recipient:staff_user_profiles!staff_notifications_user_id_fkey(id, full_name, email)
    `)
    .single();

  if (updateError) {
    console.error('Notification update error:', updateError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update notification',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'notification_updated',
      user_id: userProfile.id,
      metadata: {
        notification_id: notificationId,
        target_user_id: currentNotification.user_id,
        changes,
        request_id: requestId
      }
    });

  // Format response
  const formattedNotification: Notification = {
    id: updatedNotification.id,
    user_id: updatedNotification.user_id,
    title: updatedNotification.title,
    message: updatedNotification.message,
    type: updatedNotification.type,
    category: updatedNotification.category,
    is_read: updatedNotification.is_read,
    priority: updatedNotification.priority,
    related_entity_type: updatedNotification.related_entity_type,
    related_entity_id: updatedNotification.related_entity_id,
    action_url: updatedNotification.action_url,
    expires_at: updatedNotification.expires_at,
    metadata: updatedNotification.metadata || {},
    created_at: updatedNotification.created_at,
    read_at: updatedNotification.read_at,
    recipient: {
      id: updatedNotification.recipient.id,
      name: updatedNotification.recipient.full_name,
      email: updatedNotification.recipient.email
    }
  };

  return res.status(200).json({
    success: true,
    data: {
      notification: formattedNotification
    }
  });
}

async function handleDeleteNotification(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  notificationId: string,
  requestId: string
) {
  // Get current notification to check permissions
  const { data: currentNotification, error: fetchError } = await supabase
    .from('staff_notifications')
    .select('id, user_id, title, category')
    .eq('id', notificationId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notification for deletion',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check permissions - users can delete their own notifications, admins can delete any
  const isOwner = currentNotification.user_id === userProfile.id;
  const isAdmin = userProfile.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only delete your own notifications',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Delete the notification
  const { error: deleteError } = await supabase
    .from('staff_notifications')
    .delete()
    .eq('id', notificationId);

  if (deleteError) {
    console.error('Notification deletion error:', deleteError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETION_ERROR',
        message: 'Failed to delete notification',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'notification_deleted',
      user_id: userProfile.id,
      metadata: {
        notification_id: notificationId,
        target_user_id: currentNotification.user_id,
        category: currentNotification.category,
        title: currentNotification.title,
        request_id: requestId
      }
    });

  return res.status(200).json({
    success: true,
    data: {}
  });
}
