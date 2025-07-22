import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { createClient } from '@supabase/supabase-js';
import { 
  ApiErrors, 
  sendError, 
  sendSuccess, 
  withErrorHandler 
} from '@/lib/api/errors';

// Factory function to create Supabase admin client
const getSupabaseAdmin = () => {
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

  // Optional: Verify user is authenticated
  let userId = null;
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
  } catch {
    // Continue without user ID
  }

  const { errors, ...singleError } = req.body;
  const errorEvents = errors || [singleError];

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Prepare error records for insertion
    const errorRecords = errorEvents.map((error: any) => ({
      app_name: 'ganger-actions',
      error_message: error.message || 'Unknown error',
      error_stack: error.stack,
      component_stack: error.componentStack,
      error_url: error.url,
      user_agent: error.userAgent,
      user_id: error.userId || userId,
      metadata: error.metadata || {},
      created_at: error.timestamp || new Date().toISOString()
    }));

    // Insert errors into monitoring table
    const { error: insertError } = await supabaseAdmin
      .from('error_logs')
      .insert(errorRecords);

    if (insertError) {
      console.error('Failed to log errors:', insertError);
      throw ApiErrors.database('Failed to log errors');
    }

    // Check for critical errors that need immediate alerts
    const criticalErrors = errorEvents.filter((error: any) => 
      error.message?.includes('Payment') || 
      error.message?.includes('Authentication') ||
      error.message?.includes('Database')
    );

    if (criticalErrors.length > 0) {
      // Create alert for critical errors
      await supabaseAdmin
        .from('monitoring_alerts')
        .insert({
          alert_type: 'critical_error',
          app_name: 'ganger-actions',
          message: `${criticalErrors.length} critical errors detected`,
          details: criticalErrors,
          created_at: new Date().toISOString()
        });
    }

    sendSuccess(res, { 
      logged: errorRecords.length,
      critical: criticalErrors.length 
    });
  } catch (error) {
    // Don't throw here - we don't want error logging to cause more errors
    console.error('Error logging service error:', error);
    sendSuccess(res, { logged: 0, error: 'Logging failed silently' });
  }
});
