// pages/api/comments/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { Database } from '../../../types/database';
import { validateRequest, updateCommentSchema } from '../../../lib/validation-schemas';

interface Comment {
  id: string;
  ticket_id: string;
  content: string;
  is_internal: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  ticket: {
    id: string;
    ticket_number: string;
    title: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    comment?: Comment;
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
  const { id: commentId } = req.query;

  if (!commentId || typeof commentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COMMENT_ID',
        message: 'Valid comment ID is required',
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
      return await handleGetComment(req, res, supabase, userProfile, commentId, requestId);
    } else if (req.method === 'PUT') {
      return await handleUpdateComment(req, res, supabase, userProfile, commentId, requestId);
    } else if (req.method === 'DELETE') {
      return await handleDeleteComment(req, res, supabase, userProfile, commentId, requestId);
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
    console.error('Comment API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Comment service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetComment(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  commentId: string,
  requestId: string
) {
  // Get comment with related data (RLS will handle permissions)
  const { data: comment, error } = await supabase
    .from('staff_ticket_comments')
    .select(`
      *,
      author:staff_user_profiles!staff_ticket_comments_author_id_fkey(id, full_name, email),
      ticket:staff_tickets!staff_ticket_comments_ticket_id_fkey(id, ticket_number, title)
    `)
    .eq('id', commentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found or access denied',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    console.error('Comment fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch comment',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Additional permission check for internal comments
  if (comment.is_internal && 
      comment.author_id !== userProfile.id && 
      !['admin', 'manager'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Access denied to internal comment',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response
  const formattedComment: Comment = {
    id: comment.id,
    ticket_id: comment.ticket_id,
    content: comment.content,
    is_internal: comment.is_internal,
    author_id: comment.author_id,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    author: {
      id: comment.author.id,
      name: comment.author.full_name,
      email: comment.author.email
    },
    ticket: {
      id: comment.ticket.id,
      ticket_number: comment.ticket.ticket_number,
      title: comment.ticket.title
    }
  };

  return res.status(200).json({
    success: true,
    data: {
      comment: formattedComment
    }
  });
}

async function handleUpdateComment(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  commentId: string,
  requestId: string
) {
  const validation = validateRequest(updateCommentSchema, req.body);
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

  // Get current comment to check permissions and track changes
  const { data: currentComment, error: fetchError } = await supabase
    .from('staff_ticket_comments')
    .select(`
      *,
      ticket:staff_tickets!staff_ticket_comments_ticket_id_fkey(id, ticket_number, title)
    `)
    .eq('id', commentId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found or access denied',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch comment for update',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check permissions - only author or admin can edit comments
  const isAuthor = currentComment.author_id === userProfile.id;
  const isAdmin = userProfile.role === 'admin';

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only edit your own comments',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Only admin can change is_internal status
  if (updates.is_internal !== undefined && !isAdmin) {
    delete updates.is_internal;
  }

  // Prepare update data
  const updateData: any = {};
  const changes: Record<string, { from: any; to: any }> = {};

  // Track and apply changes
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== currentComment[key]) {
      changes[key] = { from: currentComment[key], to: value };
      updateData[key] = value;
    }
  });

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

  // Update the comment
  const { data: updatedComment, error: updateError } = await supabase
    .from('staff_ticket_comments')
    .update(updateData)
    .eq('id', commentId)
    .select(`
      *,
      author:staff_user_profiles!staff_ticket_comments_author_id_fkey(id, full_name, email),
      ticket:staff_tickets!staff_ticket_comments_ticket_id_fkey(id, ticket_number, title)
    `)
    .single();

  if (updateError) {
    console.error('Comment update error:', updateError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update comment',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'comment_updated',
      user_id: userProfile.id,
      metadata: {
        comment_id: commentId,
        ticket_id: currentComment.ticket_id,
        ticket_number: currentComment.ticket.ticket_number,
        changes,
        request_id: requestId
      }
    });

  // Format response
  const formattedComment: Comment = {
    id: updatedComment.id,
    ticket_id: updatedComment.ticket_id,
    content: updatedComment.content,
    is_internal: updatedComment.is_internal,
    author_id: updatedComment.author_id,
    created_at: updatedComment.created_at,
    updated_at: updatedComment.updated_at,
    author: {
      id: updatedComment.author.id,
      name: updatedComment.author.full_name,
      email: updatedComment.author.email
    },
    ticket: {
      id: updatedComment.ticket.id,
      ticket_number: updatedComment.ticket.ticket_number,
      title: updatedComment.ticket.title
    }
  };

  return res.status(200).json({
    success: true,
    data: {
      comment: formattedComment
    }
  });
}

async function handleDeleteComment(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  commentId: string,
  requestId: string
) {
  // Get current comment to check permissions
  const { data: currentComment, error: fetchError } = await supabase
    .from('staff_ticket_comments')
    .select(`
      id,
      author_id,
      ticket_id,
      content,
      is_internal,
      ticket:staff_tickets!staff_ticket_comments_ticket_id_fkey(ticket_number)
    `)
    .eq('id', commentId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found or access denied',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch comment for deletion',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Only author or admin can delete comments
  const isAuthor = currentComment.author_id === userProfile.id;
  const isAdmin = userProfile.role === 'admin';

  if (!isAuthor && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only delete your own comments',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Delete the comment (hard delete for comments)
  const { error: deleteError } = await supabase
    .from('staff_ticket_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    console.error('Comment deletion error:', deleteError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETION_ERROR',
        message: 'Failed to delete comment',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'comment_deleted',
      user_id: userProfile.id,
      metadata: {
        comment_id: commentId,
        ticket_id: currentComment.ticket_id,
        ticket_number: currentComment.ticket.ticket_number,
        was_internal: currentComment.is_internal,
        content_length: currentComment.content.length,
        request_id: requestId
      }
    });

  return res.status(200).json({
    success: true,
    data: {}
  });
}