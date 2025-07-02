import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = session.user.email;
  const ticketId = req.query.id as string;

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, ticketId, userEmail);
    case 'PUT':
      return handlePut(req, res, ticketId, userEmail);
    case 'DELETE':
      return handleDelete(req, res, ticketId, userEmail);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userEmail: string
) {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        comments:ticket_comments(
          *,
          author:auth.users!ticket_comments_author_id_fkey(
            id,
            raw_user_meta_data
          )
        ),
        files:ticket_file_uploads(
          *,
          uploader:auth.users!ticket_file_uploads_uploaded_by_id_fkey(
            id,
            raw_user_meta_data
          )
        ),
        approvals:ticket_approvals(
          *,
          approver:auth.users!ticket_approvals_approver_id_fkey(
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
        return res.status(404).json({ error: 'Ticket not found' });
      }
      console.error('Error fetching ticket:', error);
      return res.status(500).json({ error: 'Failed to fetch ticket' });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error('Error in GET /api/tickets/[id]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userEmail: string
) {
  try {
    const updates = req.body;

    // First check if user has permission to update
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('submitter_email, assigned_to_email, status')
      .eq('id', ticketId)
      .single();

    if (fetchError || !existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions
    const canUpdate = 
      existingTicket.submitter_email === userEmail ||
      existingTicket.assigned_to_email === userEmail;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Perform the update
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return res.status(500).json({ error: 'Failed to update ticket' });
    }

    // Add to job queue for notifications if status changed
    if (updates.status && updates.status !== existingTicket.status) {
      await supabase.from('job_queue').insert({
        handler: 'NotifyTicketUpdate',
        payload: {
          ticket_id: ticketId,
          old_status: existingTicket.status,
          new_status: updates.status,
          updated_by: userEmail
        }
      });
    }

    return res.status(200).json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Error in PUT /api/tickets/[id]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userEmail: string
) {
  try {
    // Check if user owns the ticket
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('submitter_email, status')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only allow deletion by submitter and only if ticket is still pending
    if (ticket.submitter_email !== userEmail) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (!['pending', 'open'].includes(ticket.status)) {
      return res.status(400).json({ error: 'Cannot delete ticket in current status' });
    }

    // Soft delete by updating status
    const { error: deleteError } = await supabase
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('id', ticketId);

    if (deleteError) {
      console.error('Error deleting ticket:', deleteError);
      return res.status(500).json({ error: 'Failed to delete ticket' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/tickets/[id]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}