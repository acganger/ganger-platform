import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';
import { 
  ApiErrors, 
  sendSuccess, 
  withErrorHandler
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
  if (req.method !== 'GET') {
    throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    throw ApiErrors.validation('Invalid user ID');
  }

  const userEmail = session.user.email;
  logger.logRequest(req, userEmail);

  const startTime = Date.now();

  // Create Supabase client inside handler
  const supabase = getSupabaseClient();
  
  // Get current user's profile to check permissions
  const { data: currentUser, error: userError } = await supabase
    .from('staff_user_profiles')
    .select('id, role')
    .eq('email', userEmail)
    .single();

  if (userError || !currentUser) {
    logger.error('Failed to fetch user profile', userError, { userEmail });
    throw ApiErrors.database('Failed to fetch user profile');
  }

  // Check permissions: users can view their own activity, managers/admins can view all
  const canView = 
    currentUser.id === id || 
    ['admin', 'manager'].includes(currentUser.role);

  if (!canView) {
    throw ApiErrors.forbidden('You do not have permission to view this activity log');
  }

  logger.debug('Fetching activity log', { userId: id, requestedBy: userEmail });

  // Fetch activity log from analytics table
  const { data: activities, error } = await supabase
    .from('staff_analytics')
    .select('*')
    .or(`user_id.eq.${id},metadata->>updated_user_id.eq.${id},metadata->>deleted_user_id.eq.${id}`)
    .in('event_type', ['user_created', 'user_updated', 'user_deleted', 'profile_updated', 'role_changed', 'status_changed'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('Failed to fetch activity log', error, { userId: id });
    throw ApiErrors.database('Failed to fetch activity log');
  }

  logger.logDatabase('SELECT', 'staff_analytics', Date.now() - startTime);

  // Transform activities for the frontend
  const formattedActivities = (activities || []).map(activity => ({
    id: activity.id,
    action: activity.event_type,
    timestamp: activity.created_at,
    details: activity.metadata
  }));

  sendSuccess(res, { activities: formattedActivities });
});