// pages/api/tickets/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';
import { validateRequest, validateQuery, ticketQuerySchema, createTicketSchema } from '../../../lib/validation-schemas';

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
}

interface ApiResponse {
  success: boolean;
  data?: {
    tickets?: Ticket[];
    ticket?: Ticket;
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
      return await handleGetTickets(req, res, supabase, userProfile, requestId);
    } else if (req.method === 'POST') {
      return await handleCreateTicket(req, res, supabase, userProfile, requestId);
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
    console.error('Tickets API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Tickets service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetTickets(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateQuery(ticketQuerySchema, req.query);
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
    status,
    priority,
    assigned_to,
    submitter_id,
    form_type,
    location,
    search,
    sort_by,
    sort_order,
    limit,
    offset,
    created_after,
    created_before,
    due_after,
    due_before
  } = validation.data;

  // Build query with RLS handling permissions
  let query = supabase
    .from('staff_tickets')
    .select(`
      *,
      submitter:staff_user_profiles!staff_tickets_submitter_id_fkey(id, full_name, email),
      assignee:staff_user_profiles!staff_tickets_assigned_to_fkey(id, full_name, email)
    `);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  if (assigned_to) {
    query = query.eq('assigned_to', assigned_to);
  }

  if (submitter_id) {
    query = query.eq('submitter_id', submitter_id);
  }

  if (form_type) {
    query = query.eq('form_type', form_type);
  }

  if (location) {
    query = query.eq('location', location);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,ticket_number.ilike.%${search}%`);
  }

  if (created_after) {
    query = query.gte('created_at', created_after);
  }

  if (created_before) {
    query = query.lte('created_at', created_before);
  }

  if (due_after) {
    query = query.gte('due_date', due_after);
  }

  if (due_before) {
    query = query.lte('due_date', due_before);
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('staff_tickets')
    .select('id', { count: 'exact', head: true });

  // Execute main query with pagination
  const { data: tickets, error } = await query
    .range(offset!, offset! + limit! - 1);

  if (error) {
    console.error('Tickets fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tickets',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response data
  const formattedTickets: Ticket[] = (tickets || []).map((ticket: any) => ({
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
    } : undefined
  }));

  return res.status(200).json({
    success: true,
    data: {
      tickets: formattedTickets,
      pagination: {
        total: totalCount || 0,
        limit: limit!,
        offset: offset!,
        has_more: (offset! + limit!) < (totalCount || 0)
      }
    }
  });
}

async function handleCreateTicket(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateRequest(createTicketSchema, req.body);
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
    title,
    description,
    form_type,
    form_data,
    priority,
    assigned_to,
    due_date,
    location,
    metadata
  } = validation.data;

  try {
    // Generate ticket number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('staff_tickets')
      .select('id', { count: 'exact', head: true })
      .like('ticket_number', `${year}-%`);

    const ticketNumber = `${year}-${String((count || 0) + 1).padStart(4, '0')}`;

    // Resolve assigned_to email to user ID if provided
    let assignedToId = null;
    if (assigned_to) {
      const { data: assignee } = await supabase
        .from('staff_user_profiles')
        .select('id')
        .eq('email', assigned_to)
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

      assignedToId = assignee.id;
    }

    // Create ticket
    const ticketData = {
      ticket_number: ticketNumber,
      title: title.trim(),
      description: description.trim(),
      status: 'pending' as const,
      priority,
      form_type,
      form_data: form_data || {},
      submitter_id: userProfile.id,
      assigned_to: assignedToId,
      location,
      due_date,
      metadata: {
        ...metadata,
        created_by: userProfile.email,
        request_id: requestId
      }
    };

    const { data: newTicket, error } = await supabase
      .from('staff_tickets')
      .insert(ticketData)
      .select(`
        *,
        submitter:staff_user_profiles!staff_tickets_submitter_id_fkey(id, full_name, email),
        assignee:staff_user_profiles!staff_tickets_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Ticket creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: 'Failed to create ticket',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'ticket_created',
        user_id: userProfile.id,
        metadata: {
          ticket_id: newTicket.id,
          ticket_number: ticketNumber,
          form_type,
          priority,
          assigned_to: assigned_to || null,
          request_id: requestId
        }
      });

    // Format response
    const formattedTicket: Ticket = {
      id: newTicket.id,
      ticket_number: newTicket.ticket_number,
      title: newTicket.title,
      description: newTicket.description,
      status: newTicket.status,
      priority: newTicket.priority,
      form_type: newTicket.form_type,
      form_data: newTicket.form_data || {},
      submitter_id: newTicket.submitter_id,
      assigned_to: newTicket.assigned_to,
      location: newTicket.location,
      due_date: newTicket.due_date,
      completed_at: newTicket.completed_at,
      metadata: newTicket.metadata || {},
      created_at: newTicket.created_at,
      updated_at: newTicket.updated_at,
      submitter: newTicket.submitter ? {
        id: newTicket.submitter.id,
        name: newTicket.submitter.full_name,
        email: newTicket.submitter.email
      } : undefined,
      assignee: newTicket.assignee ? {
        id: newTicket.assignee.id,
        name: newTicket.assignee.full_name,
        email: newTicket.assignee.email
      } : undefined
    };

    return res.status(201).json({
      success: true,
      data: {
        ticket: formattedTicket
      }
    });

  } catch (error) {
    console.error('Ticket creation process error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_PROCESS_ERROR',
        message: 'Ticket creation process failed',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}