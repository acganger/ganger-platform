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
  const userName = session.user.name || userEmail.split('@')[0];

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, userEmail);
    case 'POST':
      return handlePost(req, res, userEmail, userName);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userEmail: string
) {
  try {
    const { status, form_type, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('tickets')
      .select(`
        *,
        comments:ticket_comments(count),
        files:ticket_file_uploads(count)
      `)
      .or(`submitter_email.eq.${userEmail},assigned_to_email.eq.${userEmail}`)
      .order('created_at', { ascending: false })
      .limit(Number(limit))
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (form_type) {
      query = query.eq('form_type', form_type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }

    return res.status(200).json({
      tickets: data || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error in GET /api/tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

    // Validate required fields
    if (!form_type || !form_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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
      console.error('Error creating ticket:', ticketError);
      return res.status(500).json({ error: 'Failed to create ticket' });
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
      console.error('Error creating notification job:', jobError);
      // Don't fail the request if notification fails
    }

    return res.status(201).json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        created_at: ticket.created_at
      }
    });
  } catch (error) {
    console.error('Error in POST /api/tickets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}