import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
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

  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  logger.logRequest(req, userEmail);

  const startTime = Date.now();
  const serviceSupabase = getSupabaseClient();
  
  logger.debug('Fetching staff list', { userEmail });

  // Fetch all active staff members
  const { data: staff, error } = await serviceSupabase
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