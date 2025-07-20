import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { 
  ApiErrors, 
  sendError, 
  sendSuccess, 
  withErrorHandler,
  validateRequiredFields 
} from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

// Configure migration adapter for backward compatibility
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

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
  
  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
  
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

    // Build filters for migration-aware query
    const filters: Record<string, any> = {};

    // Apply user filter - managers/admins can see all, others see only their tickets
    if (!showAllTickets) {
      // Use OR condition for tickets where user is submitter or assigned
      filters['or'] = [
        { submitter_email: userEmail },
        { assigned_to: userEmail }
      ];
    }

    // Apply filters
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      filters.status = statusArray.length === 1 ? statusArray[0] : statusArray;
    }

    if (form_type) {
      const formTypeArray = Array.isArray(form_type) ? form_type : [form_type];
      filters.form_type = formTypeArray.length === 1 ? formTypeArray[0] : formTypeArray;
    }

    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority];
      filters.priority = priorityArray.length === 1 ? priorityArray[0] : priorityArray;
    }

    if (location) {
      const locationArray = Array.isArray(location) ? location : [location];
      filters.location = locationArray.length === 1 ? locationArray[0] : locationArray;
    }

    if (submitter && isManagerOrAdmin) {
      filters.submitter_email = submitter;
    }

    if (assigned_to) {
      filters.assigned_to = assigned_to;
    }

    if (date_from) {
      filters.created_at = { gte: date_from };
    }

    if (date_to) {
      if (filters.created_at) {
        filters.created_at = { ...filters.created_at, lte: date_to };
      } else {
        filters.created_at = { lte: date_to };
      }
    }

    // Apply search filter at database level
    if (search) {
      const searchPattern = `%${search}%`;
      filters['or'] = filters['or'] ? [
        ...filters['or'],
        { title: { ilike: searchPattern } },
        { description: { ilike: searchPattern } },
        { ticket_number: { ilike: searchPattern } }
      ] : [
        { title: { ilike: searchPattern } },
        { description: { ilike: searchPattern } },
        { ticket_number: { ilike: searchPattern } }
      ];
    }

    // Get total count for pagination
    // Since migrationAdapter doesn't have count, we'll fetch with limit 0 to get count
    const countData = await migrationAdapter.select(
      'staff_tickets',
      'id',
      filters,
      { limit: 1000 } // Get reasonable count
    );
    const totalCount = countData.length;

    // Use migration adapter for backward-compatible queries
    const tickets = await migrationAdapter.select(
      'staff_tickets',
      `
        *,
        comments:staff_ticket_comments(count),
        files:staff_attachments(count)
      `,
      filters,
      {
        orderBy: `${sort_by === 'desc' ? '-' : ''}${sort_by || 'created_at'}`,
        limit: Number(limit),
        offset: Number(offset)
      }
    );

    // Total count is now calculated before fetching data

    sendSuccess(res, {
      tickets: tickets || [],
      total: totalCount,
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

    // Create the ticket using migration adapter
    const ticketData = {
      form_type,
      submitter_email: userEmail,
      submitter_name: userName,
      status: MigrationHelpers.convertTicketStatus(initialStatus),
      priority: priority || 'medium',
      location,
      title: title || `New ${form_type.replace(/_/g, ' ')}`,
      description: description || '',
      form_data,
      approval_required: requiresApproval,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const [ticket] = await migrationAdapter.insert('staff_tickets', ticketData);

    if (!ticket) {
      logger.error('Error creating ticket - no ticket returned');
      throw ApiErrors.database('Failed to create ticket');
    }

    // Add notification job to queue using migration adapter
    try {
      await migrationAdapter.insert('job_queue', {
        handler: 'NotifyNewTicket',
        payload: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          form_type: ticket.form_type,
          priority: ticket.priority,
          submitter_email: ticket.submitter_email,
          submitter_name: ticket.submitter_name
        },
        priority: ticket.priority === 'urgent' ? 1 : 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (jobError) {
      logger.warn('Error creating notification job', jobError as any);
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