// pages/api/tickets/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';
import { validateRequest, updateTicketSchema } from '../../../lib/validation-schemas';

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: 'pending' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  form_type: string;
  form_data: Record<string, unknown>;
  submitter_id: string;
  assigned_to?: string;
  location?: string;
  due_date?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  submitter?: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  comments?: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
    is_internal: boolean;
    created_at: string;
  }>;
}

interface ApiResponse {
  success: boolean;
  data?: {
    ticket?: Ticket;
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
  const { id: ticketId } = req.query;

  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TICKET_ID',
        message: 'Valid ticket ID is required',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

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
  const email = session.user.email;
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
      return await handleGetTicket(req, res, supabase, userProfile, ticketId, requestId);
    } else if (req.method === 'PUT') {
      return await handleUpdateTicket(req, res, supabase, userProfile, ticketId, requestId);
    } else if (req.method === 'DELETE') {
      return await handleDeleteTicket(req, res, supabase, userProfile, ticketId, requestId);
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
    console.error('Ticket API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Ticket service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetTicket(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  ticketId: string,
  requestId: string
) {
  // Get ticket with related data (RLS will handle permissions)
  const { data: ticket, error } = await supabase
    .from('staff_tickets')
    .select(`
      *,
      submitter:staff_user_profiles!staff_tickets_submitter_id_fkey(id, full_name, email),
      assignee:staff_user_profiles!staff_tickets_assigned_to_fkey(id, full_name, email),
      comments:staff_ticket_comments(
        id,
        content,
        is_internal,
        created_at,
        author:staff_user_profiles!staff_ticket_comments_author_id_fkey(id, full_name, email)
      )
    `)
    .eq('id', ticketId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
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

    console.error('Ticket fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch ticket',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response
  const formattedTicket: Ticket = {
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    form_type: ticket.form_type,
    form_data: ticket.form_data || {},
    submitter_id: ticket.submitter_id,
    assigned_to: ticket.assigned_to,
    location: ticket.location,
    due_date: ticket.due_date,
    completed_at: ticket.completed_at,
    metadata: ticket.metadata || {},
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    submitter: ticket.submitter ? {
      id: ticket.submitter.id,
      name: ticket.submitter.full_name,
      email: ticket.submitter.email
    } : undefined,
    assignee: ticket.assignee ? {
      id: ticket.assignee.id,
      name: ticket.assignee.full_name,
      email: ticket.assignee.email
    } : undefined,
    comments: (ticket.comments || []).map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      is_internal: comment.is_internal,
      created_at: comment.created_at,
      author: {
        id: comment.author.id,
        name: comment.author.full_name,
        email: comment.author.email
      }
    }))
  };

  return res.status(200).json({
    success: true,
    data: {
      ticket: formattedTicket
    }
  });
}

async function handleUpdateTicket(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  ticketId: string,
  requestId: string
) {
  const validation = validateRequest(updateTicketSchema, req.body);
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

  // Get current ticket to check permissions and track changes
  const { data: currentTicket, error: fetchError } = await supabase
    .from('staff_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
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
        code: 'FETCH_ERROR',
        message: 'Failed to fetch ticket for update',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check permissions
  const isSubmitter = currentTicket.submitter_id === userProfile.id;
  const isAssignee = currentTicket.assigned_to === userProfile.id;
  const isAdmin = userProfile.role === 'admin';
  const isManager = userProfile.role === 'manager';

  if (!isSubmitter && !isAssignee && !isAdmin && !isManager) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to update this ticket',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Handle assigned_to email resolution
  if (updates.assigned_to !== undefined) {
    if (updates.assigned_to) {
      const { data: assignee } = await supabase
        .from('staff_user_profiles')
        .select('id')
        .eq('email', updates.assigned_to)
        .eq('is_active', true)
        .single();

      if (!assignee) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ASSIGNEE',
            message: 'Assigned user not found or inactive',
            timestamp: new Date().toISOString(),
            request_id: requestId
          }
        });
      }

      updates.assigned_to = assignee.id;
    } else {
      updates.assigned_to = null;
    }
  }

  // Handle status transitions
  if (updates.status && updates.status !== currentTicket.status) {
    if (updates.status === 'completed' && !currentTicket.completed_at) {
      updates.completed_at = new Date().toISOString();
    } else if (updates.status !== 'completed' && currentTicket.completed_at) {
      updates.completed_at = null;
    }
  }

  // Prepare update data
  const updateData: any = {};
  const changes: Record<string, { from: any; to: any }> = {};

  // Track and apply changes
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== currentTicket[key]) {
      changes[key] = { from: currentTicket[key], to: value };
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

  // Update the ticket
  const { data: updatedTicket, error: updateError } = await supabase
    .from('staff_tickets')
    .update(updateData)
    .eq('id', ticketId)
    .select(`
      *,
      submitter:staff_user_profiles!staff_tickets_submitter_id_fkey(id, full_name, email),
      assignee:staff_user_profiles!staff_tickets_assigned_to_fkey(id, full_name, email)
    `)
    .single();

  if (updateError) {
    console.error('Ticket update error:', updateError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update ticket',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'ticket_updated',
      user_id: userProfile.id,
      metadata: {
        ticket_id: ticketId,
        ticket_number: currentTicket.ticket_number,
        changes,
        request_id: requestId
      }
    });

  // Format response
  const formattedTicket: Ticket = {
    id: updatedTicket.id,
    ticket_number: updatedTicket.ticket_number,
    title: updatedTicket.title,
    description: updatedTicket.description,
    status: updatedTicket.status,
    priority: updatedTicket.priority,
    form_type: updatedTicket.form_type,
    form_data: updatedTicket.form_data || {},
    submitter_id: updatedTicket.submitter_id,
    assigned_to: updatedTicket.assigned_to,
    location: updatedTicket.location,
    due_date: updatedTicket.due_date,
    completed_at: updatedTicket.completed_at,
    metadata: updatedTicket.metadata || {},
    created_at: updatedTicket.created_at,
    updated_at: updatedTicket.updated_at,
    submitter: updatedTicket.submitter ? {
      id: updatedTicket.submitter.id,
      name: updatedTicket.submitter.full_name,
      email: updatedTicket.submitter.email
    } : undefined,
    assignee: updatedTicket.assignee ? {
      id: updatedTicket.assignee.id,
      name: updatedTicket.assignee.full_name,
      email: updatedTicket.assignee.email
    } : undefined
  };

  return res.status(200).json({
    success: true,
    data: {
      ticket: formattedTicket
    }
  });
}

async function handleDeleteTicket(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  ticketId: string,
  requestId: string
) {
  // Get current ticket to check permissions
  const { data: currentTicket, error: fetchError } = await supabase
    .from('staff_tickets')
    .select('submitter_id, ticket_number, status')
    .eq('id', ticketId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
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
        code: 'FETCH_ERROR',
        message: 'Failed to fetch ticket for deletion',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Only allow admins or submitters to delete tickets
  const isSubmitter = currentTicket.submitter_id === userProfile.id;
  const isAdmin = userProfile.role === 'admin';

  if (!isSubmitter && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only ticket submitters and administrators can delete tickets',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Prevent deletion of completed tickets (soft delete instead)
  if (currentTicket.status === 'completed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'CANNOT_DELETE_COMPLETED',
        message: 'Completed tickets cannot be deleted',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Soft delete by setting status to cancelled
  const { error: deleteError } = await supabase
    .from('staff_tickets')
    .update({
      status: 'cancelled',
      metadata: {
        deleted_by: userProfile.id,
        deleted_at: new Date().toISOString(),
        deleted_reason: 'User deletion'
      }
    })
    .eq('id', ticketId);

  if (deleteError) {
    console.error('Ticket deletion error:', deleteError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETION_ERROR',
        message: 'Failed to delete ticket',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'ticket_deleted',
      user_id: userProfile.id,
      metadata: {
        ticket_id: ticketId,
        ticket_number: currentTicket.ticket_number,
        request_id: requestId
      }
    });

  return res.status(200).json({
    success: true,
    data: {}
  });
}