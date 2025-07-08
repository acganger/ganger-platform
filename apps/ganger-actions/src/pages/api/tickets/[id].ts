import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { 
  ApiErrors, 
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
  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  const ticketId = req.query.id as string;

  if (!ticketId) {
    throw ApiErrors.validation('Ticket ID is required');
  }

  logger.logRequest(req, userEmail);

  switch (req.method) {
    case 'GET':
      await handleGet(req, res, ticketId, userEmail);
      break;
    case 'PUT':
      await handlePut(req, res, ticketId, userEmail);
      break;
    case 'DELETE':
      await handleDelete(req, res, ticketId, userEmail);
      break;
    default:
      throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }
});

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userEmail: string
) {
  const startTime = Date.now();
  const supabase = getSupabaseClient();

  logger.debug('Fetching ticket', { ticketId, userEmail });

  const { data: ticket, error } = await supabase
    .from('staff_tickets')
    .select(`
      *,
      comments:staff_ticket_comments(
        *,
        author:auth.users!staff_ticket_comments_author_id_fkey(
          id,
          raw_user_meta_data
        )
      ),
      files:staff_attachments(
        *,
        uploader:auth.users!staff_attachments_uploaded_by_fkey(
          id,
          raw_user_meta_data
        )
      ),
      approvals:staff_ticket_approvals(
        *,
        approver:auth.users!staff_ticket_approvals_approver_id_fkey(
          id,
          raw_user_meta_data
        )
      )
    `)
    .eq('id', ticketId)
    .or(`submitter_email.eq.${userEmail},assigned_to_email.eq.${userEmail}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiErrors.notFound('Ticket');
    }
    logger.error('Failed to fetch ticket', error, { ticketId });
    throw ApiErrors.database('Failed to fetch ticket');
  }

  logger.logDatabase('SELECT', 'staff_tickets', Date.now() - startTime);

  sendSuccess(res, { ticket });
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userEmail: string
) {
  const startTime = Date.now();
  const supabase = getSupabaseClient();
  const updates = req.body;

  logger.info('Updating ticket', { ticketId, userEmail });

  // First check if user has permission to update
  const { data: existingTicket, error: fetchError } = await supabase
    .from('staff_tickets')
    .select('submitter_email, assigned_to_email, status')
    .eq('id', ticketId)
    .single();

  if (fetchError || !existingTicket) {
    if (fetchError?.code === 'PGRST116') {
      throw ApiErrors.notFound('Ticket');
    }
    logger.error('Failed to fetch ticket for update', fetchError, { ticketId });
    throw ApiErrors.database('Failed to fetch ticket');
  }

  // Check permissions
  const canUpdate = 
    existingTicket.submitter_email === userEmail ||
    existingTicket.assigned_to_email === userEmail;

  if (!canUpdate) {
    throw ApiErrors.forbidden('You do not have permission to update this ticket');
  }

  // Perform the update
  const { data: updatedTicket, error: updateError } = await supabase
    .from('staff_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to update ticket', updateError, { ticketId });
    throw ApiErrors.database('Failed to update ticket');
  }

  logger.logDatabase('UPDATE', 'staff_tickets', Date.now() - startTime);

  // Add to job queue for notifications if status changed
  if (updates.status && updates.status !== existingTicket.status) {
    const { error: jobError } = await supabase.from('job_queue').insert({
      handler: 'NotifyTicketUpdate',
      payload: {
        ticket_id: ticketId,
        old_status: existingTicket.status,
        new_status: updates.status,
        updated_by: userEmail
      }
    });

    if (jobError) {
      logger.warn('Failed to queue notification job', { error: jobError, ticketId });
      // Non-critical error, continue
    }
  }

  sendSuccess(res, { ticket: updatedTicket });
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userEmail: string
) {
  const startTime = Date.now();
  const supabase = getSupabaseClient();

  logger.info('Deleting ticket', { ticketId, userEmail });

  // Check if user owns the ticket
  const { data: ticket, error: fetchError } = await supabase
    .from('staff_tickets')
    .select('submitter_email, status')
    .eq('id', ticketId)
    .single();

  if (fetchError || !ticket) {
    if (fetchError?.code === 'PGRST116') {
      throw ApiErrors.notFound('Ticket');
    }
    logger.error('Failed to fetch ticket for deletion', fetchError, { ticketId });
    throw ApiErrors.database('Failed to fetch ticket');
  }

  // Only allow deletion by submitter and only if ticket is still pending
  if (ticket.submitter_email !== userEmail) {
    throw ApiErrors.forbidden('Only the ticket submitter can delete tickets');
  }

  if (!['pending', 'open'].includes(ticket.status)) {
    throw ApiErrors.validation('Cannot delete ticket in current status');
  }

  // Soft delete by updating status
  const { error: deleteError } = await supabase
    .from('staff_tickets')
    .update({ status: 'cancelled' })
    .eq('id', ticketId);

  if (deleteError) {
    logger.error('Failed to delete ticket', deleteError, { ticketId });
    throw ApiErrors.database('Failed to delete ticket');
  }

  logger.logDatabase('UPDATE', 'staff_tickets', Date.now() - startTime);

  sendSuccess(res, { message: 'Ticket cancelled successfully' });
}