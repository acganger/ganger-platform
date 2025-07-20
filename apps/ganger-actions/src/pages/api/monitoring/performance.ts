import { NextApiRequest, NextApiResponse } from 'next';
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

  const { name, value, unit, timestamp, tags } = req.body;

  // Validate required fields
  if (!name || value === undefined || !unit) {
    throw ApiErrors.validation('Missing required performance metric fields');
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Insert performance metric
    const { error: insertError } = await supabaseAdmin
      .from('performance_metrics')
      .insert({
        app_name: 'ganger-actions',
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
        tags: tags || {},
        created_at: timestamp || new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to log performance metric:', insertError);
      throw ApiErrors.database('Failed to log performance metric');
    }

    // Check for performance thresholds
    if (name === 'api_call_duration' && value > 5000) {
      // API call took more than 5 seconds
      await supabaseAdmin
        .from('monitoring_alerts')
        .insert({
          alert_type: 'slow_api',
          app_name: 'ganger-actions',
          message: `Slow API call detected: ${tags?.endpoint} took ${value}ms`,
          details: { name, value, unit, tags },
          created_at: new Date().toISOString()
        });
    }

    if (name === 'page_load_time' && value > 10000) {
      // Page load took more than 10 seconds
      await supabaseAdmin
        .from('monitoring_alerts')
        .insert({
          alert_type: 'slow_page_load',
          app_name: 'ganger-actions',
          message: `Slow page load detected: ${tags?.page} took ${value}ms`,
          details: { name, value, unit, tags },
          created_at: new Date().toISOString()
        });
    }

    sendSuccess(res, { logged: true });
  } catch (error) {
    // Don't throw here - we don't want performance logging to cause errors
    console.error('Performance logging error:', error);
    sendSuccess(res, { logged: false, error: 'Logging failed silently' });
  }
});