import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { 
  ApiErrors, 
  sendError, 
  sendSuccess, 
  withErrorHandler,
  validateRequiredFields 
} from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

// Factory function to create Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiErrors.internal('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

export default withErrorHandler(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  const userName = session.user.name || userEmail.split('@')[0];
  
  logger.logRequest(req, userEmail);

  switch (req.method) {
    case 'GET':
      await handleGet(req, res, userEmail);
      break;
    case 'POST':
      await handlePost(req, res, userEmail, userName);
      break;
    default:
      throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }
  
  const duration = Date.now() - startTime;
  logger.logResponse(req, res.statusCode, duration);
});

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  try {
    const { 
      status, 
      form_type, 
      priority,
      location,
      search,
      submitter,
      assigned_to,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc',
      view_all,
      limit = 20, 
      offset = 0 
    } = req.query;
    
    const supabase = getSupabaseClient();

    // First, check if user has manager or admin role
    const { data: userData } = await supabase
      .from('staff_user_profiles')
      .select('role')
      .eq('email', userEmail)
      .single();

    const isManagerOrAdmin = userData?.role === 'manager' || userData?.role === 'admin';
    const showAllTickets = view_all === 'true' && isManagerOrAdmin;

    let query = supabase
      .from('tickets')
      .select(`
        *,
        comments:ticket_comments(count),
        files:ticket_file_uploads(count)
      `, { count: 'exact' });

    // Apply user filter - managers/admins can see all, others see only their tickets
    if (!showAllTickets) {
      query = query.or(`submitter_email.eq.${userEmail},assigned_to_email.eq.${userEmail}`);
    }

    // Apply filters
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      query = query.in('status', statusArray);
    }

    if (form_type) {
      const formTypeArray = Array.isArray(form_type) ? form_type : [form_type];
      query = query.in('form_type', formTypeArray);
    }

    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority];
      query = query.in('priority', priorityArray);
    }

    if (location) {
      const locationArray = Array.isArray(location) ? location : [location];
      query = query.in('location', locationArray);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,ticket_number.ilike.%${search}%`);
    }

    if (submitter && isManagerOrAdmin) {
      query = query.eq('submitter_email', submitter);
    }

    if (assigned_to) {
      query = query.eq('assigned_to_email', assigned_to);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'priority', 'status', 'ticket_number'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by as string : 'created_at';
    const sortAscending = sort_order === 'asc';
    
    query = query.order(sortField, { ascending: sortAscending });

    // Apply pagination
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching tickets', error);
      throw ApiErrors.database('Failed to fetch tickets');
    }

    sendSuccess(res, {
      tickets: data || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset),
      isManagerOrAdmin
    });
  } catch (error) {
    throw error; // Re-throw to be handled by withErrorHandler
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string,
  userName: string
) {
  try {
    const { title, description, form_type, form_data, priority, location } = req.body;
    const supabase = getSupabaseClient();

    // Validate required fields
    validateRequiredFields(req.body, ['form_type', 'form_data']);

    // Determine if this form type requires approval
    const requiresApproval = ['time_off_request', 'expense_reimbursement'].includes(form_type);
    const initialStatus = requiresApproval ? 'pending_approval' : 'open';

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        form_type,
        submitter_email: userEmail,
        submitter_name: userName,
        status: initialStatus,
        priority: priority || 'normal',
        location,
        title: title || `New ${form_type.replace(/_/g, ' ')}`,
        description: description || '',
        form_data,
        requires_approval: requiresApproval
      })
      .select()
      .single();

    if (ticketError) {
      logger.error('Error creating ticket', ticketError);
      throw ApiErrors.database('Failed to create ticket');
    }

    // Add notification job to queue
    const { error: jobError } = await supabase
      .from('job_queue')
      .insert({
        handler: 'NotifyNewTicket',
        payload: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          form_type: ticket.form_type,
          priority: ticket.priority,
          submitter_email: ticket.submitter_email,
          submitter_name: ticket.submitter_name
        },
        priority: ticket.priority === 'urgent' ? 1 : 3
      });

    if (jobError) {
      logger.warn('Error creating notification job', jobError);
      // Don't fail the request if notification fails
    }

    sendSuccess(res, {
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        created_at: ticket.created_at
      }
    }, 201);
  } catch (error) {
    throw error; // Re-throw to be handled by withErrorHandler
  }
}