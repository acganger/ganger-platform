import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@ganger/auth/server';
import { captureError } from '@ganger/monitoring/sentry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthChecks = [];
  const startTime = Date.now();

  // Check database connection
  try {
    const supabase = getSupabaseClient(req, res);
    const dbStart = Date.now();
    const { error } = await supabase.from('patients').select('count').limit(1);
    
    healthChecks.push({
      name: 'database',
      status: error ? 'unhealthy' : 'healthy',
      responseTime: Date.now() - dbStart,
      error: error?.message || null
    });
  } catch (error) {
    healthChecks.push({
      name: 'database',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Check AI service (OpenAI)
  if (process.env.OPENAI_API_KEY) {
    try {
      const aiStart = Date.now();
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      healthChecks.push({
        name: 'openai-api',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - aiStart,
        statusCode: response.status
      });
    } catch (error) {
      healthChecks.push({
        name: 'openai-api',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }

  // Check FHIR integration if configured
  if (process.env.MODMED_FHIR_BASE_URL) {
    try {
      const fhirStart = Date.now();
      const response = await fetch(`${process.env.MODMED_FHIR_BASE_URL}/metadata`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      healthChecks.push({
        name: 'modmed-fhir',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - fhirStart,
        statusCode: response.status
      });
    } catch (error) {
      healthChecks.push({
        name: 'modmed-fhir',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }

  const overallStatus = healthChecks.every(check => check.status === 'healthy') ? 'healthy' : 'degraded';
  const totalTime = Date.now() - startTime;

  // Log unhealthy services
  if (overallStatus === 'degraded') {
    const unhealthyServices = healthChecks.filter(check => check.status !== 'healthy');
    captureError(new Error('Health check degraded'), {
      services: unhealthyServices,
      totalTime
    });
  }

  return res.status(200).json({
    service: 'medication-authorization',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: healthChecks,
    metadata: {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: totalTime
    }
  });
}