// pages/api/integrations/[id]/test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../../types/database';
import { HealthCheckService } from '../../../../lib/services/health-check-service';

interface HealthCheckResult {
  health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  response_time_ms: number;
  status_code: number | null;
  is_successful: boolean;
  error_message: string | null;
  tested_at: Date;
}

interface ApiResponse {
  success: boolean;
  result?: HealthCheckResult;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Authentication check
  const supabase = createServerSupabaseClient<Database>({ req, res });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Check user permissions
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['staff', 'manager', 'superadmin'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }

  try {
    const { id: integrationId } = req.query;

    if (!integrationId || typeof integrationId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Integration ID is required'
      });
    }

    // Get integration details
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (fetchError || !integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    // Perform health check
    const healthCheckService = new HealthCheckService();
    const checkResult = await healthCheckService.performHealthCheck(integration);

    // Store the health check result
    const { error: insertError } = await supabase
      .from('integration_health_checks')
      .insert({
        integration_id: integrationId,
        response_time_ms: checkResult.responseTime,
        status_code: checkResult.statusCode,
        response_body: checkResult.responseBody?.substring(0, 1000), // Limit size
        error_message: checkResult.error,
        is_successful: checkResult.isSuccessful,
        health_status: checkResult.healthStatus,
        check_type: 'manual',
        triggered_by: user.id,
        availability_score: checkResult.isSuccessful ? 1.0000 : 0.0000,
        performance_score: checkResult.responseTime ? Math.max(0, Math.min(1, (5000 - checkResult.responseTime) / 5000)) : null
      });

    if (insertError) {
      // Continue with the response even if storage fails
    }

    // Update integration status if it changed
    if (integration.current_health_status !== checkResult.healthStatus) {
      const updateData: any = {
        current_health_status: checkResult.healthStatus,
        last_health_check: new Date().toISOString(),
        consecutive_failures: checkResult.isSuccessful ? 0 : integration.consecutive_failures + 1
      };

      if (checkResult.isSuccessful) {
        updateData.last_successful_check = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('integrations')
        .update(updateData)
        .eq('id', integrationId);

      if (updateError) {
      }

      // Broadcast status update via real-time (if configured)
      try {
        const channel = supabase.channel('integration-status');
        await channel.send({
          type: 'broadcast',
          event: 'status_update',
          payload: {
            integration_id: integrationId,
            health_status: checkResult.healthStatus,
            previous_status: integration.current_health_status,
            display_name: integration.display_name,
            updated_at: new Date().toISOString()
          }
        });
      } catch (broadcastError) {
      }
    }

    // Log the manual test
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        action: 'integration_manual_test',
        resource_type: 'integration',
        resource_id: integrationId,
        metadata: {
          integration_name: integration.name,
          health_status: checkResult.healthStatus,
          response_time: checkResult.responseTime,
          is_successful: checkResult.isSuccessful,
          test_type: 'manual'
        }
      });

    return res.status(200).json({
      success: true,
      result: {
        health_status: checkResult.healthStatus,
        response_time_ms: checkResult.responseTime,
        status_code: checkResult.statusCode,
        is_successful: checkResult.isSuccessful,
        error_message: checkResult.error,
        tested_at: new Date()
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to test integration'
    });
  }
}