// pages/api/comments/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';
import { validateRequest, validateQuery, commentQuerySchema, createCommentSchema } from '../../../lib/validation-schemas';

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
  ticket?: {
    id: string;
    ticket_number: string;
    title: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    comments?: Comment[];
    comment?: Comment;
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
  const supabase = createServerSupabaseClient<Database>({ req, res });
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
      return await handleGetComments(req, res, supabase, userProfile, requestId);
    } else if (req.method === 'POST') {
      return await handleCreateComment(req, res, supabase, userProfile, requestId);
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
    console.error('Comments API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Comments service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetComments(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateQuery(commentQuerySchema, req.query);
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
    ticket_id,
    is_internal,
    author_id,
    search,
    sort_by,
    sort_order,
    limit,
    offset,
    created_after,
    created_before
  } = validation.data;

  // Build query with RLS handling permissions automatically
  let query = supabase
    .from('staff_ticket_comments')
    .select(`
      *,
      author:staff_user_profiles!staff_ticket_comments_author_id_fkey(id, full_name, email),
      ticket:staff_tickets!staff_ticket_comments_ticket_id_fkey(id, ticket_number, title)
    `);

  // Apply filters
  if (ticket_id) {
    query = query.eq('ticket_id', ticket_id);
  }

  if (is_internal !== undefined) {
    // Non-admin/manager users can't see internal comments unless they're the author
    if (!['admin', 'manager'].includes(userProfile.role) && is_internal) {
      query = query.eq('author_id', userProfile.id);
    } else {
      query = query.eq('is_internal', is_internal);
    }
  } else {
    // Filter out internal comments for non-privileged users unless they're the author
    if (!['admin', 'manager'].includes(userProfile.role)) {
      query = query.or(`is_internal.eq.false,author_id.eq.${userProfile.id}`);
    }
  }

  if (author_id) {
    query = query.eq('author_id', author_id);
  }

  if (search) {
    query = query.ilike('content', `%${search}%`);
  }

  if (created_after) {
    query = query.gte('created_at', created_after);
  }

  if (created_before) {
    query = query.lte('created_at', created_before);
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('staff_ticket_comments')
    .select('id', { count: 'exact', head: true });

  // Execute main query with pagination
  const { data: comments, error } = await query
    .range(offset!, offset! + limit! - 1);

  if (error) {
    console.error('Comments fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch comments',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response data
  const formattedComments: Comment[] = (comments || []).map((comment: any) => ({
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
    ticket: comment.ticket ? {
      id: comment.ticket.id,
      ticket_number: comment.ticket.ticket_number,
      title: comment.ticket.title
    } : undefined
  }));

  return res.status(200).json({
    success: true,
    data: {
      comments: formattedComments,
      pagination: {
        total: totalCount || 0,
        limit: limit!,
        offset: offset!,
        has_more: (offset! + limit!) < (totalCount || 0)
      }
    }
  });
}

async function handleCreateComment(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateRequest(createCommentSchema, req.body);
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
    ticket_id,
    content,
    is_internal
  } = validation.data;

  try {
    // Verify ticket exists and user has access (RLS will handle this)
    const { data: ticket, error: ticketError } = await supabase
      .from('staff_tickets')
      .select('id, ticket_number, title, status')
      .eq('id', ticket_id)
      .single();

    if (ticketError) {
      if (ticketError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TICKET_NOT_FOUND',
            message: 'Ticket not found or access denied',
            timestamp: new Date().toISOString(),
            request_id: requestId
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'TICKET_FETCH_ERROR',
          message: 'Failed to verify ticket access',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Only admin/manager can create internal comments
    if (is_internal && !['admin', 'manager'].includes(userProfile.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only managers and administrators can create internal comments',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Create comment
    const commentData = {
      ticket_id,
      content: content.trim(),
      is_internal: is_internal || false,
      author_id: userProfile.id
    };

    const { data: newComment, error } = await supabase
      .from('staff_ticket_comments')
      .insert(commentData)
      .select(`
        *,
        author:staff_user_profiles!staff_ticket_comments_author_id_fkey(id, full_name, email),
        ticket:staff_tickets!staff_ticket_comments_ticket_id_fkey(id, ticket_number, title)
      `)
      .single();

    if (error) {
      console.error('Comment creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: 'Failed to create comment',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'comment_created',
        user_id: userProfile.id,
        metadata: {
          comment_id: newComment.id,
          ticket_id,
          ticket_number: ticket.ticket_number,
          is_internal: is_internal || false,
          content_length: content.length,
          request_id: requestId
        }
      });

    // Format response
    const formattedComment: Comment = {
      id: newComment.id,
      ticket_id: newComment.ticket_id,
      content: newComment.content,
      is_internal: newComment.is_internal,
      author_id: newComment.author_id,
      created_at: newComment.created_at,
      updated_at: newComment.updated_at,
      author: {
        id: newComment.author.id,
        name: newComment.author.full_name,
        email: newComment.author.email
      },
      ticket: {
        id: newComment.ticket.id,
        ticket_number: newComment.ticket.ticket_number,
        title: newComment.ticket.title
      }
    };

    return res.status(201).json({
      success: true,
      data: {
        comment: formattedComment
      }
    });

  } catch (error) {
    console.error('Comment creation process error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_PROCESS_ERROR',
        message: 'Comment creation process failed',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}