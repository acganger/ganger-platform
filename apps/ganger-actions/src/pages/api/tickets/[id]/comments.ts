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
  if (req.method !== 'POST') {
    throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }

  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  const userName = session.user.user_metadata?.full_name || userEmail;
  const ticketId = req.query.id as string;

  if (!ticketId) {
    throw ApiErrors.validation('Ticket ID is required');
  }

  logger.logRequest(req, userEmail);

  await handleCreateComment(req, res, ticketId, userEmail, userName);
});

async function handleCreateComment(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userEmail: string,
  userName: string
) {
  const startTime = Date.now();
  const supabase = getSupabaseClient();
  const { content, is_internal, comment_type = 'comment' } = req.body;

  // Validate required fields
  validateRequiredFields(req.body, ['content']);

  if (!content.trim()) {
    throw ApiErrors.validation('Comment content cannot be empty');
  }

  logger.info('Creating comment', { ticketId, userEmail });

  // Verify ticket exists and user has access
  const { data: ticket, error: ticketError } = await supabase
    .from('staff_tickets')
    .select('id, submitter_email, assigned_to')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    if (ticketError?.code === 'PGRST116') {
      throw ApiErrors.notFound('Ticket');
    }
    logger.error('Failed to fetch ticket', ticketError, { ticketId });
    throw ApiErrors.database('Failed to fetch ticket');
  }

  // Check if user has permission to comment
  const canComment = 
    ticket.submitter_email === userEmail ||
    ticket.assigned_to === userEmail ||
    userEmail.endsWith('@gangerdermatology.com'); // All staff can comment

  if (!canComment) {
    throw ApiErrors.forbidden('You do not have permission to comment on this ticket');
  }

  // Get user's auth ID from profiles
  const { data: userProfile, error: profileError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (profileError) {
    logger.warn('Failed to fetch user profile for comment author', { error: profileError, userEmail });
    // Continue without author_id
  }

  // Insert comment
  const { data: newComment, error: insertError } = await supabase
    .from('staff_ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_id: userProfile?.id,
      author_email: userEmail,
      author_name: userName,
      content: content.trim(),
      comment_type,
      is_internal: is_internal || false
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Failed to create comment', insertError, { ticketId });
    throw ApiErrors.database('Failed to create comment');
  }

  logger.logDatabase('INSERT', 'staff_ticket_comments', Date.now() - startTime);

  // Update ticket's updated_at timestamp
  const { error: updateError } = await supabase
    .from('staff_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (updateError) {
    logger.warn('Failed to update ticket timestamp', { error: updateError, ticketId });
    // Non-critical error, continue
  }

  // Add to job queue for notifications
  const { error: jobError } = await supabase.from('job_queue').insert({
    handler: 'NotifyNewComment',
    payload: {
      ticket_id: ticketId,
      comment_id: newComment.id,
      author_email: userEmail,
      is_internal: is_internal || false
    }
  });

  if (jobError) {
    logger.warn('Failed to queue notification job', { error: jobError, ticketId });
    // Non-critical error, continue
  }

  sendSuccess(res, { comment: newComment }, 201);
}
