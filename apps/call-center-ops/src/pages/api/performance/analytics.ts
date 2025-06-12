// Call Center Operations Dashboard - Performance Analytics API
// Handles performance metrics calculation and analytics reporting

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth';
import { db } from '@ganger/db';
import { z } from 'zod';
import { CallCenterApiResponse, AgentPerformanceMetrics, PerformanceTrend, CallVolumeMetrics } from '../../../types/call-center';

// Request validation schemas
const AnalyticsRequestSchema = z.object({
  startDate: z.string().date('Valid start date required'),
  endDate: z.string().date('Valid end date required'),
  location: z.array(z.string()).optional(),
  agent: z.array(z.string()).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  metrics: z.array(z.enum([
    'call_volume',
    'agent_performance', 
    'quality_scores',
    'appointment_conversion',
    'first_call_resolution',
    'customer_satisfaction',
    'productivity_trends'
  ])).optional()
});

const AgentPerformanceRequestSchema = z.object({
  agent_email: z.string().email('Valid agent email required'),
  startDate: z.string().date('Valid start date required'),
  endDate: z.string().date('Valid end date required'),
  includeGoals: z.boolean().default(true),
  includeTrends: z.boolean().default(true)
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

// Calculate agent performance metrics
async function calculateAgentPerformance(
  agentEmail: string,
  startDate: string,
  endDate: string,
  includeGoals: boolean = true,
  includeTrends: boolean = true
): Promise<AgentPerformanceMetrics> {
  
  // Get basic call metrics
  const callMetricsQuery = `
    SELECT 
      agent_email,
      agent_name,
      location,
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE call_status = 'completed') as calls_answered,
      COUNT(*) FILTER (WHERE call_status = 'missed') as calls_missed,
      ROUND(
        (COUNT(*) FILTER (WHERE call_status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
      ) as answer_rate,
      ROUND(AVG(talk_duration_seconds), 0) as average_talk_time,
      ROUND(AVG(hold_time_seconds), 0) as average_hold_time,
      ROUND(
        (COUNT(*) FILTER (WHERE first_call_resolution = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
      ) as first_call_resolution_rate,
      ROUND(AVG(customer_satisfaction_score), 2) as customer_satisfaction_average,
      ROUND(AVG(quality_score), 2) as quality_score_average,
      ROUND(
        (COUNT(*) FILTER (WHERE appointment_scheduled = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
        2
      ) as appointment_conversion_rate
    FROM call_center_records
    WHERE agent_email = $1 
      AND call_start_time BETWEEN $2 AND $3
    GROUP BY agent_email, agent_name, location
  `;

  const callMetrics = await db.query(callMetricsQuery, [agentEmail, startDate, endDate]);
  
  if (callMetrics.length === 0) {
    throw new Error('No call data found for agent in specified period');
  }

  const metrics = callMetrics[0];

  // Get shift-based productivity metrics
  const shiftMetricsQuery = `
    SELECT 
      AVG(utilization_percentage) as utilization_rate,
      AVG(calls_per_hour) as calls_per_hour,
      COUNT(*) as total_shifts,
      SUM(total_talk_time_seconds) as total_talk_time,
      SUM(total_available_time_seconds) as total_available_time
    FROM agent_shifts
    WHERE agent_email = $1 
      AND shift_date BETWEEN $2 AND $3
  `;

  const shiftMetrics = await db.query(shiftMetricsQuery, [agentEmail, startDate, endDate]);

  // Get goals and achievement if requested
  let goalsData = { goals_met: 0, total_goals: 0, goal_achievement_rate: 0 };
  if (includeGoals) {
    const goalsQuery = `
      SELECT 
        goals_met,
        total_goals,
        achievement_percentage as goal_achievement_rate
      FROM performance_goals
      WHERE agent_email = $1 
        AND period_start_date <= $3 
        AND period_end_date >= $2
        AND goal_status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const goals = await db.query(goalsQuery, [agentEmail, startDate, endDate]);
    if (goals.length > 0) {
      goalsData = goals[0];
    }
  }

  // Get QA reviews count
  const qaReviewsQuery = `
    SELECT COUNT(*) as qa_reviews_count
    FROM quality_assurance_reviews
    WHERE agent_email = $1 
      AND review_date BETWEEN $2 AND $3
  `;
  
  const qaReviews = await db.query(qaReviewsQuery, [agentEmail, startDate, endDate]);

  // Get coaching and training data
  const developmentQuery = `
    SELECT 
      COUNT(*) FILTER (WHERE coaching_notes IS NOT NULL) as coaching_sessions,
      SUM(0) as training_hours, -- Placeholder for training hours tracking
      ARRAY_AGG(DISTINCT unnest(improvement_areas)) FILTER (WHERE improvement_areas IS NOT NULL) as improvement_areas
    FROM call_journals
    WHERE agent_email = $1 
      AND created_at BETWEEN $2 AND $3
  `;
  
  const development = await db.query(developmentQuery, [agentEmail, startDate, endDate]);

  // Combine all metrics
  const performanceMetrics: AgentPerformanceMetrics = {
    agent_email: metrics.agent_email,
    agent_name: metrics.agent_name,
    location: metrics.location,
    period_start: startDate,
    period_end: endDate,
    
    // Call volume metrics
    total_calls: parseInt(metrics.total_calls),
    calls_answered: parseInt(metrics.calls_answered),
    calls_missed: parseInt(metrics.calls_missed),
    answer_rate: parseFloat(metrics.answer_rate) || 0,
    
    // Quality metrics
    average_talk_time: parseInt(metrics.average_talk_time) || 0,
    average_hold_time: parseInt(metrics.average_hold_time) || 0,
    first_call_resolution_rate: parseFloat(metrics.first_call_resolution_rate) || 0,
    customer_satisfaction_average: parseFloat(metrics.customer_satisfaction_average) || 0,
    quality_score_average: parseFloat(metrics.quality_score_average) || 0,
    
    // Productivity metrics
    utilization_rate: parseFloat(shiftMetrics[0]?.utilization_rate) || 0,
    calls_per_hour: parseFloat(shiftMetrics[0]?.calls_per_hour) || 0,
    appointment_conversion_rate: parseFloat(metrics.appointment_conversion_rate) || 0,
    
    // Goals and achievement
    goals_met: parseInt(String(goalsData.goals_met)),
    total_goals: parseInt(String(goalsData.total_goals)),
    goal_achievement_rate: parseFloat(String(goalsData.goal_achievement_rate)) || 0,
    
    // Coaching and development
    qa_reviews_count: parseInt(qaReviews[0]?.qa_reviews_count) || 0,
    coaching_sessions: parseInt(development[0]?.coaching_sessions) || 0,
    training_hours: parseInt(development[0]?.training_hours) || 0,
    improvement_areas: development[0]?.improvement_areas || []
  };

  return performanceMetrics;
}

// Calculate call volume metrics by location
async function calculateCallVolumeMetrics(
  startDate: string,
  endDate: string,
  locations?: string[]
): Promise<CallVolumeMetrics[]> {
  
  let whereClause = 'WHERE call_start_time BETWEEN $1 AND $2';
  const params: any[] = [startDate, endDate];
  
  if (locations && locations.length > 0) {
    whereClause += ' AND location = ANY($3)';
    params.push(locations);
  }

  const query = `
    SELECT 
      location,
      DATE($1) as period,
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE call_status = 'completed') as answered_calls,
      COUNT(*) FILTER (WHERE call_status = 'missed') as missed_calls,
      COUNT(*) FILTER (WHERE call_status = 'abandoned') as abandoned_calls,
      ROUND(AVG(ring_duration_seconds), 0) as average_wait_time,
      MAX(call_count_by_hour.hourly_count) as peak_hour_volume,
      peak_hour_data.peak_hour
    FROM call_center_records
    LEFT JOIN (
      SELECT 
        location as loc,
        EXTRACT(HOUR FROM call_start_time) as hour,
        COUNT(*) as hourly_count
      FROM call_center_records
      ${whereClause}
      GROUP BY location, EXTRACT(HOUR FROM call_start_time)
    ) call_count_by_hour ON location = call_count_by_hour.loc
    LEFT JOIN (
      SELECT 
        location as loc,
        EXTRACT(HOUR FROM call_start_time) as peak_hour,
        COUNT(*) as peak_count,
        ROW_NUMBER() OVER (PARTITION BY location ORDER BY COUNT(*) DESC) as rn
      FROM call_center_records
      ${whereClause}
      GROUP BY location, EXTRACT(HOUR FROM call_start_time)
    ) peak_hour_data ON location = peak_hour_data.loc AND peak_hour_data.rn = 1
    ${whereClause}
    GROUP BY location, peak_hour_data.peak_hour
    ORDER BY location
  `;

  const results = await db.query(query, params);
  
  return results.map((row: any) => ({
    location: row.location,
    period: row.period,
    total_calls: parseInt(row.total_calls),
    answered_calls: parseInt(row.answered_calls),
    missed_calls: parseInt(row.missed_calls),
    abandoned_calls: parseInt(row.abandoned_calls),
    average_wait_time: parseInt(row.average_wait_time) || 0,
    peak_hour_volume: parseInt(row.peak_hour_volume) || 0,
    peak_hour: row.peak_hour ? `${row.peak_hour}:00` : '00:00'
  }));
}

// GET /api/performance/analytics - Get comprehensive performance analytics
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const query = AnalyticsRequestSchema.parse(req.query);
    const startTime = Date.now();

    const results: any = {};

    // Apply role-based filtering
    let locationFilter = query.location;
    if (user.role === 'clinical_staff') {
      const userLocations = await db.query(`
        SELECT location_name FROM location_staff 
        WHERE user_id = $1 AND is_active = true
      `, [user.id]);
      
      const allowedLocations = userLocations.map((l: any) => l.location_name);
      locationFilter = locationFilter 
        ? locationFilter.filter(loc => allowedLocations.includes(loc))
        : allowedLocations;
    }

    // Calculate call volume metrics
    if (!query.metrics || query.metrics.includes('call_volume')) {
      results.call_volume = await calculateCallVolumeMetrics(
        query.startDate, 
        query.endDate, 
        locationFilter
      );
    }

    // Calculate agent performance if specific agent requested
    if (query.agent && query.agent.length > 0) {
      results.agent_performance = [];
      for (const agentEmail of query.agent) {
        try {
          const agentMetrics = await calculateAgentPerformance(
            agentEmail,
            query.startDate,
            query.endDate,
            true,
            true
          );
          results.agent_performance.push(agentMetrics);
        } catch (error) {
        }
      }
    }

    // Calculate team-level metrics
    if (!query.metrics || query.metrics.includes('quality_scores')) {
      const qualityQuery = `
        SELECT 
          location,
          ROUND(AVG(quality_score), 2) as average_quality_score,
          ROUND(AVG(customer_satisfaction_score), 2) as average_satisfaction_score,
          COUNT(*) FILTER (WHERE quality_score >= 80) as high_quality_calls,
          COUNT(*) as total_scored_calls
        FROM call_center_records
        WHERE call_start_time BETWEEN $1 AND $2
          AND quality_score IS NOT NULL
          ${locationFilter ? 'AND location = ANY($3)' : ''}
        GROUP BY location
      `;
      
      const qualityParams: any[] = [query.startDate, query.endDate];
      if (locationFilter) qualityParams.push(locationFilter);
      
      results.quality_metrics = await db.query(qualityQuery, qualityParams);
    }

    const queryTime = Date.now() - startTime;

    res.status(200).json(successResponse(results, {
      performance: {
        queryTime,
        totalTime: queryTime
      },
      filters: {
        startDate: query.startDate,
        endDate: query.endDate,
        location: locationFilter,
        period: query.period
      }
    }));

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid analytics request', error.errors));
    } else {
      res.status(500).json(errorResponse('CALCULATION_FAILED', 'Failed to calculate performance analytics'));
    }
  }
}

// POST /api/performance/analytics - Get specific agent performance metrics
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const request = AgentPerformanceRequestSchema.parse(req.body);
    
    // Check if user can access this agent's data
    if (user.role === 'staff') {
      if (request.agent_email !== user.email) {
        return res.status(403).json(errorResponse(
          'ACCESS_DENIED', 
          'You can only view your own performance metrics'
        ));
      }
    }

    const performanceMetrics = await calculateAgentPerformance(
      request.agent_email,
      request.startDate,
      request.endDate,
      request.includeGoals,
      request.includeTrends
    );

    res.status(200).json(successResponse(performanceMetrics));

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid performance request', error.errors));
    } else if (error instanceof Error && error.message.includes('No call data found')) {
      res.status(404).json(errorResponse('NO_DATA_FOUND', error.message));
    } else {
      res.status(500).json(errorResponse('CALCULATION_FAILED', error instanceof Error ? error.message : String(error)));
    }
  }
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