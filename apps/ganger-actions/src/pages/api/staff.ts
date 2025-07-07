import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
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

  const userEmail = session.user.email;
  logger.logRequest(req, userEmail);

  const startTime = Date.now();
  const supabase = getSupabaseClient();
  
  logger.debug('Fetching staff list', { userEmail });

  // Fetch all active staff members
  const { data: staff, error } = await supabase
    .from('staff_user_profiles')
    .select('id, employee_id, full_name, email, department, role, location')
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    logger.error('Failed to fetch staff list', error, { userEmail });
    throw ApiErrors.database('Failed to fetch staff list');
  }

  logger.logDatabase('SELECT', 'staff_user_profiles', Date.now() - startTime);

  sendSuccess(res, { staff: staff || [] });
});