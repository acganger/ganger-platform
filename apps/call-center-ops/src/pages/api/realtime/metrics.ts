// Call Center Operations Dashboard - Real-time Metrics API
// Provides real-time metrics and live data for dashboard updates

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth';
import { db } from '@ganger/db';
import { z } from 'zod';
import { CallCenterApiResponse } from '../../../types/call-center';
import { realtimeProcessor } from '../../../lib/services/realtime-processor';

// Request validation schemas
const RealtimeMetricsSchema = z.object({
  locations: z.array(z.string()).optional(),
  metrics: z.array(z.enum([
    'live_dashboard',
    'agent_status',
    'call_volume',
    'queue_metrics',
    'performance_kpis',
    'alerts'
  ])).default(['live_dashboard']),
  refresh_interval: z.number().int().min(5).max(300).default(30), // 5 seconds to 5 minutes
  include_trends: z.boolean().default(false)
});

const EventStreamSchema = z.object({
  event_types: z.array(z.enum([
    'call_started',
    'call_ended', 
    'agent_status_changed',
    'metric_updated',
    'alert_triggered'
  ])).optional(),
  locations: z.array(z.string()).optional(),
  agent_emails: z.array(z.string()).optional()
});

// Utility functions
function successResponse<T>(data: T, meta?: any): CallCenterApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...meta
    }
  };
}

function errorResponse(code: string, message: string, details?: any): CallCenterApiResponse {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// GET /api/realtime/metrics - Get current real-time metrics
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const query = RealtimeMetricsSchema.parse(req.query);
    const startTime = Date.now();
    
    // Apply role-based filtering
    let allowedLocations = query.locations;
    
    if (user.role === 'staff') {
      // Agents can only see metrics for their location
      const agentLocation = await db.query(`
        SELECT location FROM agent_current_status 
        WHERE agent_email = $1
      `, [user.email]);
      
      if (agentLocation.length > 0) {
        allowedLocations = [agentLocation[0].location];
      } else {
        allowedLocations = []; // No location access
      }
    } else if (user.role === 'clinical_staff') {
      const userLocations = await db.query(`
        SELECT location_name FROM location_staff 
        WHERE user_id = $1 AND is_active = true
      `, [user.id]);
      
      const supervisorLocations = userLocations.map((l: any) => l.location_name);
      allowedLocations = allowedLocations 
        ? allowedLocations.filter(loc => supervisorLocations.includes(loc))
        : supervisorLocations;
    }
    
    const results: any = {};
    
    // Collect requested metrics
    for (const metricType of query.metrics) {
      switch (metricType) {
        case 'live_dashboard':
          results.live_dashboard = await realtimeProcessor.getLiveMetrics(allowedLocations);
          break;
          
        case 'agent_status':
          results.agent_status = await getCurrentAgentStatus(allowedLocations);
          break;
          
        case 'call_volume':
          results.call_volume = await getCurrentCallVolume(allowedLocations);
          break;
          
        case 'queue_metrics':
          results.queue_metrics = await getCurrentQueueMetrics(allowedLocations);
          break;
          
        case 'performance_kpis':
          results.performance_kpis = await getPerformanceKPIs(allowedLocations);
          break;
          
        case 'alerts':
          results.alerts = await getCurrentAlerts(allowedLocations);
          break;
      }
    }
    
    // Add trends if requested
    if (query.include_trends) {
      results.trends = await getMetricTrends(allowedLocations);
    }
    
    const queryTime = Date.now() - startTime;
    
    res.status(200).json(successResponse(results, {
      performance: {
        queryTime,
        totalTime: queryTime
      },
      refresh_interval: query.refresh_interval,
      locations: allowedLocations,
      metrics_count: query.metrics.length,
      last_updated: new Date().toISOString()
    }));
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid metrics request', error.errors));
    } else {
      res.status(500).json(errorResponse('METRICS_FAILED', 'Failed to fetch real-time metrics'));
    }
  }
}

// POST /api/realtime/metrics - Trigger metric calculations or updates
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { action, ...params } = req.body;
    
    // Only supervisors and above can trigger metric updates
    if (user.role === 'staff') {
      return res.status(403).json(errorResponse(
        'ACCESS_DENIED',
        'Insufficient permissions to trigger metric updates'
      ));
    }
    
    let result;
    
    switch (action) {
      case 'calculate_kpis':
        result = await realtimeProcessor.calculateRealtimeKPIs(params.location);
        break;
        
      case 'refresh_metrics':
        result = await realtimeProcessor.getLiveMetrics(params.locations);
        break;
        
      case 'process_queue_metrics':
        await realtimeProcessor.processQueueMetrics();
        result = { message: 'Queue metrics processing initiated' };
        break;
        
      default:
        return res.status(400).json(errorResponse(
          'INVALID_ACTION',
          'Invalid action specified'
        ));
    }
    
    res.status(200).json(successResponse(result));
    
  } catch (error) {
    res.status(500).json(errorResponse('ACTION_FAILED', 'Failed to process metrics action'));
  }
}

// Helper functions for metric collection

async function getCurrentAgentStatus(locations?: string[]) {
  const statusQuery = `
    SELECT 
      acs.*,
      -- Calculate time in current status
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - acs.updated_at))/60 as status_duration_minutes,
      -- Get current call info
      ac.call_id as current_call_id,
      ac.caller_number as current_caller,
      ac.call_start_time as current_call_start,
      -- Get today's stats
      COALESCE(daily_stats.calls_today, 0) as calls_today,
      COALESCE(daily_stats.talk_time_today, 0) as talk_time_today
    FROM agent_current_status acs
    LEFT JOIN active_calls ac ON acs.current_call_id = ac.call_id
    LEFT JOIN (
      SELECT 
        agent_email,
        COUNT(*) as calls_today,
        SUM(talk_duration_seconds) as talk_time_today
      FROM call_center_records 
      WHERE DATE(call_start_time) = CURRENT_DATE
      GROUP BY agent_email
    ) daily_stats ON acs.agent_email = daily_stats.agent_email
    ${locations ? 'WHERE acs.location = ANY($1)' : ''}
    ORDER BY acs.location, acs.agent_name
  `;
  
  const params = locations ? [locations] : [];
  const results = await db.query(statusQuery, params);
  
  return results.map((row: any) => ({
    agent_email: row.agent_email,
    agent_name: row.agent_name,
    extension: row.extension,
    location: row.location,
    status: row.status,
    status_duration_minutes: Math.round(parseFloat(row.status_duration_minutes) || 0),
    current_call: row.current_call_id ? {
      call_id: row.current_call_id,
      caller_number: row.current_caller,
      call_start_time: row.current_call_start
    } : null,
    today_stats: {
      calls_handled: parseInt(row.calls_today) || 0,
      total_talk_time_seconds: parseInt(row.talk_time_today) || 0
    },
    last_activity: row.last_activity,
    break_info: row.break_type ? {
      type: row.break_type,
      start_time: row.break_start_time,
      duration_minutes: row.break_start_time ? 
        Math.round((Date.now() - new Date(row.break_start_time).getTime()) / (1000 * 60)) : 0
    } : null
  }));
}

async function getCurrentCallVolume(locations?: string[]) {
  const volumeQuery = `
    WITH current_hour AS (
      SELECT 
        location,
        COUNT(*) as calls_current_hour,
        COUNT(*) FILTER (WHERE call_status = 'completed') as completed_current_hour,
        ROUND(AVG(talk_duration_seconds), 0) as avg_talk_time_current_hour
      FROM call_center_records
      WHERE call_start_time >= DATE_TRUNC('hour', CURRENT_TIMESTAMP)
        ${locations ? 'AND location = ANY($1)' : ''}
      GROUP BY location
    ),
    today_totals AS (
      SELECT 
        location,
        COUNT(*) as calls_today,
        COUNT(*) FILTER (WHERE call_status = 'completed') as completed_today,
        ROUND(AVG(talk_duration_seconds), 0) as avg_talk_time_today
      FROM call_center_records
      WHERE DATE(call_start_time) = CURRENT_DATE
        ${locations ? 'AND location = ANY($1)' : ''}
      GROUP BY location
    ),
    active_now AS (
      SELECT 
        location,
        COUNT(*) as active_calls,
        COUNT(*) FILTER (WHERE call_status = 'ringing') as calls_in_queue
      FROM active_calls
      ${locations ? 'WHERE location = ANY($1)' : ''}
      GROUP BY location
    )
    SELECT 
      COALESCE(ch.location, tt.location, an.location) as location,
      COALESCE(ch.calls_current_hour, 0) as calls_current_hour,
      COALESCE(ch.completed_current_hour, 0) as completed_current_hour,
      COALESCE(ch.avg_talk_time_current_hour, 0) as avg_talk_time_current_hour,
      COALESCE(tt.calls_today, 0) as calls_today,
      COALESCE(tt.completed_today, 0) as completed_today,
      COALESCE(tt.avg_talk_time_today, 0) as avg_talk_time_today,
      COALESCE(an.active_calls, 0) as active_calls,
      COALESCE(an.calls_in_queue, 0) as calls_in_queue
    FROM current_hour ch
    FULL OUTER JOIN today_totals tt ON ch.location = tt.location
    FULL OUTER JOIN active_now an ON COALESCE(ch.location, tt.location) = an.location
    ORDER BY location
  `;
  
  const params = locations ? [locations] : [];
  return await db.query(volumeQuery, params);
}

async function getCurrentQueueMetrics(locations?: string[]) {
  const queueQuery = `
    SELECT 
      location,
      COUNT(*) as total_in_queue,
      ROUND(AVG(current_queue_time_seconds), 0) as avg_queue_time_seconds,
      MAX(current_queue_time_seconds) as max_queue_time_seconds,
      COUNT(*) FILTER (WHERE current_queue_time_seconds > 30) as calls_waiting_over_30s,
      COUNT(*) FILTER (WHERE current_queue_time_seconds > 120) as calls_waiting_over_2min,
      -- Get the oldest call in queue
      MIN(call_start_time) as oldest_call_time
    FROM active_calls
    WHERE call_status = 'ringing'
      ${locations ? 'AND location = ANY($1)' : ''}
    GROUP BY location
    ORDER BY location
  `;
  
  const params = locations ? [locations] : [];
  const results = await db.query(queueQuery, params);
  
  return results.map((row: any) => ({
    location: row.location,
    total_in_queue: parseInt(row.total_in_queue) || 0,
    avg_queue_time_seconds: parseInt(row.avg_queue_time_seconds) || 0,
    max_queue_time_seconds: parseInt(row.max_queue_time_seconds) || 0,
    calls_waiting_over_30s: parseInt(row.calls_waiting_over_30s) || 0,
    calls_waiting_over_2min: parseInt(row.calls_waiting_over_2min) || 0,
    oldest_call_time: row.oldest_call_time,
    service_level_30s: row.total_in_queue > 0 ? 
      Math.round(((parseInt(row.total_in_queue) - parseInt(row.calls_waiting_over_30s)) / parseInt(row.total_in_queue)) * 100) : 100
  }));
}

async function getPerformanceKPIs(locations?: string[]) {
  const kpiResults: any = {};
  
  const targetLocations = locations || ['Ann Arbor', 'Wixom', 'Plymouth'];
  
  for (const location of targetLocations) {
    kpiResults[location] = await realtimeProcessor.calculateRealtimeKPIs(location);
  }
  
  return kpiResults;
}

async function getCurrentAlerts(locations?: string[]) {
  const alertsQuery = `
    SELECT 
      id,
      alert_type,
      severity,
      message,
      location,
      agent_email,
      metric_name,
      metric_value,
      threshold_value,
      created_at,
      acknowledged,
      acknowledged_by,
      acknowledged_at
    FROM performance_alerts
    WHERE status = 'active'
      ${locations ? 'AND location = ANY($1)' : ''}
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ORDER BY 
      CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'warning' THEN 2 
        ELSE 3 
      END,
      created_at DESC
    LIMIT 50
  `;
  
  const params = locations ? [locations] : [];
  const results = await db.query(alertsQuery, params);
  
  return results.map((row: any) => ({
    id: row.id,
    type: row.alert_type,
    severity: row.severity,
    message: row.message,
    location: row.location,
    agent_email: row.agent_email,
    metric: {
      name: row.metric_name,
      value: parseFloat(row.metric_value),
      threshold: parseFloat(row.threshold_value)
    },
    created_at: row.created_at,
    acknowledged: row.acknowledged,
    acknowledged_by: row.acknowledged_by,
    acknowledged_at: row.acknowledged_at,
    age_minutes: Math.round((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60))
  }));
}

async function getMetricTrends(locations?: string[]) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const trendsQuery = `
    WITH time_buckets AS (
      SELECT generate_series($1, $2, INTERVAL '5 minutes') as bucket_start
    ),
    call_trends AS (
      SELECT 
        tb.bucket_start,
        COALESCE(COUNT(ccr.call_start_time), 0) as call_count,
        COALESCE(COUNT(ccr.call_start_time) FILTER (WHERE ccr.call_status = 'completed'), 0) as completed_count,
        COALESCE(ROUND(AVG(ccr.ring_duration_seconds), 0), 0) as avg_ring_time
      FROM time_buckets tb
      LEFT JOIN call_center_records ccr ON ccr.call_start_time >= tb.bucket_start 
        AND ccr.call_start_time < tb.bucket_start + INTERVAL '5 minutes'
        ${locations ? 'AND ccr.location = ANY($3)' : ''}
      GROUP BY tb.bucket_start
      ORDER BY tb.bucket_start
    )
    SELECT 
      bucket_start,
      call_count,
      completed_count,
      avg_ring_time,
      CASE 
        WHEN call_count > 0 THEN ROUND((completed_count::DECIMAL / call_count) * 100, 1)
        ELSE 0 
      END as answer_rate
    FROM call_trends
  `;
  
  const params: any[] = [oneHourAgo.toISOString(), now.toISOString()];
  if (locations) params.push(locations);
  
  const results = await db.query(trendsQuery, params);
  
  return {
    time_period: '1_hour',
    interval: '5_minutes',
    data_points: results.map((row: any) => ({
      timestamp: row.bucket_start,
      call_volume: parseInt(row.call_count),
      completed_calls: parseInt(row.completed_count),
      answer_rate: parseFloat(row.answer_rate),
      avg_ring_time: parseInt(row.avg_ring_time)
    }))
  };
}

// Main handler with authentication
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const user = req.user; // Added by withAuth middleware
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, user);
        break;
      case 'POST':
        await handlePost(req, res, user);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
  }
};

export default withAuth(handler, {
  roles: ['staff', 'clinical_staff', 'manager', 'superadmin']
});