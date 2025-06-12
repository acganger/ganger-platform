// Call Center Operations Dashboard - Analytics Dashboard API
// Comprehensive analytics and performance insights endpoint

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth';
import { db } from '@ganger/db';
import { z } from 'zod';
import { CallCenterApiResponse } from '../../../types/call-center';
import { performanceAnalytics } from '../../../lib/services/performance-analytics';

// Request validation schemas
const DashboardAnalyticsSchema = z.object({
  startDate: z.string().date('Valid start date required'),
  endDate: z.string().date('Valid end date required'),
  location: z.array(z.string()).optional(),
  agent: z.array(z.string()).optional(),
  granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  includeProjections: z.boolean().default(false),
  includeBenchmarks: z.boolean().default(false),
  includeInsights: z.boolean().default(true),
  metrics: z.array(z.enum([
    'call_volume',
    'agent_performance',
    'team_efficiency',
    'quality_scores',
    'customer_satisfaction',
    'operational_metrics',
    'predictive_analytics'
  ])).optional()
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

// GET /api/analytics/dashboard - Get comprehensive analytics dashboard data
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const query = DashboardAnalyticsSchema.parse(req.query);
    const startTime = Date.now();
    
    // Validate date range
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    if (start > end) {
      return res.status(400).json(errorResponse(
        'INVALID_DATE_RANGE',
        'Start date cannot be after end date'
      ));
    }
    
    // Apply role-based filtering
    let locationFilter = query.location;
    let agentFilter = query.agent;
    
    if (user.role === 'staff') {
      agentFilter = [user.email];
      locationFilter = undefined; // Will be determined by agent's location
    } else if (user.role === 'clinical_staff') {
      const userLocations = await db.query(`
        SELECT location_name FROM location_staff 
        WHERE user_id = $1 AND is_active = true
      `, [user.id]);
      
      const allowedLocations = userLocations.map((l: any) => l.location_name);
      locationFilter = locationFilter 
        ? locationFilter.filter(loc => allowedLocations.includes(loc))
        : allowedLocations;
    }
    
    const analyticsOptions = {
      startDate: query.startDate,
      endDate: query.endDate,
      location: locationFilter,
      agent: agentFilter,
      granularity: query.granularity,
      includeProjections: query.includeProjections,
      includeBenchmarks: query.includeBenchmarks
    };
    
    const results: any = {
      summary: {},
      metrics: {},
      insights: {},
      alerts: [],
      trends: {}
    };
    
    // Generate dashboard summary
    results.summary = await generateDashboardSummary(analyticsOptions);
    
    // Calculate requested metrics
    const requestedMetrics = query.metrics || [
      'call_volume', 
      'agent_performance', 
      'quality_scores', 
      'operational_metrics'
    ];
    
    for (const metric of requestedMetrics) {
      switch (metric) {
        case 'call_volume':
          results.metrics.call_volume = await performanceAnalytics.calculateCallVolumeMetrics(analyticsOptions);
          break;
          
        case 'agent_performance':
          if (agentFilter && agentFilter.length > 0) {
            results.metrics.agent_performance = [];
            for (const agentEmail of agentFilter) {
              const agentMetrics = await performanceAnalytics.calculateAgentPerformance(agentEmail, analyticsOptions);
              results.metrics.agent_performance.push(agentMetrics);
            }
          } else {
            results.metrics.agent_performance = await getTopPerformingAgents(analyticsOptions);
          }
          break;
          
        case 'team_efficiency':
          results.metrics.team_efficiency = await performanceAnalytics.calculateTeamPerformance(analyticsOptions);
          break;
          
        case 'quality_scores':
          results.metrics.quality_scores = await calculateQualityMetrics(analyticsOptions);
          break;
          
        case 'customer_satisfaction':
          results.metrics.customer_satisfaction = await calculateSatisfactionMetrics(analyticsOptions);
          break;
          
        case 'operational_metrics':
          results.metrics.operational_metrics = await calculateOperationalMetrics(analyticsOptions);
          break;
          
        case 'predictive_analytics':
          if (query.includeProjections) {
            results.metrics.predictive_analytics = await performanceAnalytics.generatePredictiveInsights(analyticsOptions);
          }
          break;
      }
    }
    
    // Generate insights and alerts
    if (query.includeInsights) {
      results.alerts = await performanceAnalytics.generatePerformanceAlerts(analyticsOptions);
      results.insights = await generateDashboardInsights(analyticsOptions, results.metrics);
    }
    
    // Generate performance trends
    results.trends = await generatePerformanceTrends(analyticsOptions);
    
    // Calculate benchmarks if requested
    if (query.includeBenchmarks) {
      results.benchmarks = await performanceAnalytics.calculatePerformanceBenchmarks(analyticsOptions);
    }
    
    const queryTime = Date.now() - startTime;
    
    res.status(200).json(successResponse(results, {
      performance: {
        queryTime,
        totalTime: queryTime,
        metricsCalculated: requestedMetrics.length
      },
      filters: analyticsOptions,
      coverage: {
        locations: locationFilter?.length || 3,
        agents: agentFilter?.length || 'all',
        dateRange: `${query.startDate} to ${query.endDate}`
      }
    }));
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid analytics request', error.errors));
    } else {
      res.status(500).json(errorResponse('ANALYTICS_FAILED', 'Failed to generate analytics dashboard'));
    }
  }
}

// Generate dashboard summary with key performance indicators
async function generateDashboardSummary(options: any) {
  const summaryQuery = `
    WITH current_period AS (
      SELECT 
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE call_status = 'completed') as completed_calls,
        COUNT(*) FILTER (WHERE call_status = 'missed') as missed_calls,
        COUNT(*) FILTER (WHERE call_status = 'abandoned') as abandoned_calls,
        ROUND(AVG(talk_duration_seconds), 0) as avg_talk_time,
        ROUND(AVG(ring_duration_seconds), 0) as avg_wait_time,
        ROUND(AVG(customer_satisfaction_score), 2) as avg_satisfaction,
        ROUND(AVG(quality_score), 2) as avg_quality,
        COUNT(*) FILTER (WHERE first_call_resolution = true) as fcr_calls,
        COUNT(*) FILTER (WHERE appointment_scheduled = true) as appointments_scheduled
      FROM call_center_records
      WHERE call_start_time BETWEEN $1 AND $2
        ${options.location ? 'AND location = ANY($3)' : ''}
        ${options.agent ? 'AND agent_email = ANY($4)' : ''}
    ),
    agent_summary AS (
      SELECT 
        COUNT(DISTINCT agent_email) as total_agents,
        COUNT(DISTINCT agent_email) FILTER (WHERE call_status = 'completed') as active_agents
      FROM call_center_records
      WHERE call_start_time BETWEEN $1 AND $2
        ${options.location ? 'AND location = ANY($3)' : ''}
        ${options.agent ? 'AND agent_email = ANY($4)' : ''}
    )
    SELECT 
      cp.*,
      ROUND((cp.completed_calls::DECIMAL / NULLIF(cp.total_calls, 0)) * 100, 2) as answer_rate,
      ROUND((cp.fcr_calls::DECIMAL / NULLIF(cp.total_calls, 0)) * 100, 2) as fcr_rate,
      ROUND((cp.appointments_scheduled::DECIMAL / NULLIF(cp.total_calls, 0)) * 100, 2) as appointment_rate,
      ags.total_agents,
      ags.active_agents
    FROM current_period cp
    CROSS JOIN agent_summary ags
  `;
  
  const params = [options.startDate + 'T00:00:00Z', options.endDate + 'T23:59:59Z'];
  if (options.location) params.push(options.location);
  if (options.agent) params.push(options.agent);
  
  const result = await db.query(summaryQuery, params);
  const summary = result[0] || {};
  
  return {
    total_calls: parseInt(summary.total_calls) || 0,
    completed_calls: parseInt(summary.completed_calls) || 0,
    missed_calls: parseInt(summary.missed_calls) || 0,
    abandoned_calls: parseInt(summary.abandoned_calls) || 0,
    answer_rate: parseFloat(summary.answer_rate) || 0,
    fcr_rate: parseFloat(summary.fcr_rate) || 0,
    appointment_rate: parseFloat(summary.appointment_rate) || 0,
    avg_talk_time: parseInt(summary.avg_talk_time) || 0,
    avg_wait_time: parseInt(summary.avg_wait_time) || 0,
    avg_satisfaction: parseFloat(summary.avg_satisfaction) || 0,
    avg_quality: parseFloat(summary.avg_quality) || 0,
    total_agents: parseInt(summary.total_agents) || 0,
    active_agents: parseInt(summary.active_agents) || 0,
    period: `${options.startDate} to ${options.endDate}`
  };
}

// Get top performing agents for the dashboard
async function getTopPerformingAgents(options: any) {
  const topAgentsQuery = `
    SELECT 
      agent_email,
      agent_name,
      location,
      COUNT(*) as total_calls,
      ROUND((COUNT(*) FILTER (WHERE call_status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as answer_rate,
      ROUND(AVG(customer_satisfaction_score), 2) as avg_satisfaction,
      ROUND(AVG(quality_score), 2) as avg_quality,
      COUNT(*) FILTER (WHERE first_call_resolution = true) as fcr_count,
      COUNT(*) FILTER (WHERE appointment_scheduled = true) as appointments_count
    FROM call_center_records
    WHERE call_start_time BETWEEN $1 AND $2
      ${options.location ? 'AND location = ANY($3)' : ''}
    GROUP BY agent_email, agent_name, location
    HAVING COUNT(*) >= 10  -- Minimum calls for inclusion
    ORDER BY 
      (answer_rate * 0.3 + COALESCE(avg_satisfaction, 0) * 20 * 0.3 + COALESCE(avg_quality, 0) * 0.4) DESC
    LIMIT 10
  `;
  
  const params = [options.startDate + 'T00:00:00Z', options.endDate + 'T23:59:59Z'];
  if (options.location) params.push(options.location);
  
  const results = await db.query(topAgentsQuery, params);
  
  return results.map((row: any) => ({
    agent_email: row.agent_email,
    agent_name: row.agent_name,
    location: row.location,
    total_calls: parseInt(row.total_calls),
    answer_rate: parseFloat(row.answer_rate) || 0,
    avg_satisfaction: parseFloat(row.avg_satisfaction) || 0,
    avg_quality: parseFloat(row.avg_quality) || 0,
    fcr_count: parseInt(row.fcr_count) || 0,
    appointments_count: parseInt(row.appointments_count) || 0,
    performance_score: Math.round(
      (parseFloat(row.answer_rate) || 0) * 0.3 + 
      (parseFloat(row.avg_satisfaction) || 0) * 20 * 0.3 + 
      (parseFloat(row.avg_quality) || 0) * 0.4
    )
  }));
}

// Calculate quality metrics
async function calculateQualityMetrics(options: any) {
  const qualityQuery = `
    SELECT 
      location,
      COUNT(*) FILTER (WHERE quality_score IS NOT NULL) as scored_calls,
      ROUND(AVG(quality_score), 2) as avg_quality_score,
      COUNT(*) FILTER (WHERE quality_score >= 90) as excellent_calls,
      COUNT(*) FILTER (WHERE quality_score >= 80 AND quality_score < 90) as good_calls,
      COUNT(*) FILTER (WHERE quality_score >= 70 AND quality_score < 80) as fair_calls,
      COUNT(*) FILTER (WHERE quality_score < 70) as poor_calls,
      COUNT(*) FILTER (WHERE customer_satisfaction_score >= 4) as satisfied_customers,
      COUNT(*) FILTER (WHERE customer_satisfaction_score <= 2) as dissatisfied_customers
    FROM call_center_records
    WHERE call_start_time BETWEEN $1 AND $2
      ${options.location ? 'AND location = ANY($3)' : ''}
      ${options.agent ? 'AND agent_email = ANY($4)' : ''}
    GROUP BY location
    ORDER BY location
  `;
  
  const params = [options.startDate + 'T00:00:00Z', options.endDate + 'T23:59:59Z'];
  if (options.location) params.push(options.location);
  if (options.agent) params.push(options.agent);
  
  const results = await db.query(qualityQuery, params);
  
  return results.map((row: any) => ({
    location: row.location,
    scored_calls: parseInt(row.scored_calls) || 0,
    avg_quality_score: parseFloat(row.avg_quality_score) || 0,
    quality_distribution: {
      excellent: parseInt(row.excellent_calls) || 0,
      good: parseInt(row.good_calls) || 0,
      fair: parseInt(row.fair_calls) || 0,
      poor: parseInt(row.poor_calls) || 0
    },
    satisfaction_metrics: {
      satisfied: parseInt(row.satisfied_customers) || 0,
      dissatisfied: parseInt(row.dissatisfied_customers) || 0
    }
  }));
}

// Calculate customer satisfaction metrics
async function calculateSatisfactionMetrics(options: any) {
  const satisfactionQuery = `
    WITH satisfaction_trends AS (
      SELECT 
        DATE(call_start_time) as call_date,
        location,
        ROUND(AVG(customer_satisfaction_score), 2) as daily_avg_satisfaction,
        COUNT(*) FILTER (WHERE customer_satisfaction_score IS NOT NULL) as scored_calls
      FROM call_center_records
      WHERE call_start_time BETWEEN $1 AND $2
        AND customer_satisfaction_score IS NOT NULL
        ${options.location ? 'AND location = ANY($3)' : ''}
        ${options.agent ? 'AND agent_email = ANY($4)' : ''}
      GROUP BY call_date, location
      ORDER BY call_date, location
    )
    SELECT 
      location,
      ARRAY_AGG(daily_avg_satisfaction ORDER BY call_date) as satisfaction_trend,
      ARRAY_AGG(call_date ORDER BY call_date) as trend_dates,
      AVG(daily_avg_satisfaction) as overall_avg,
      COUNT(*) as data_points
    FROM satisfaction_trends
    GROUP BY location
  `;
  
  const params = [options.startDate + 'T00:00:00Z', options.endDate + 'T23:59:59Z'];
  if (options.location) params.push(options.location);
  if (options.agent) params.push(options.agent);
  
  const results = await db.query(satisfactionQuery, params);
  
  return results.map((row: any) => ({
    location: row.location,
    overall_avg: parseFloat(row.overall_avg) || 0,
    trend_data: (row.satisfaction_trend || []).map((value: number, index: number) => ({
      date: row.trend_dates[index],
      satisfaction: value
    })),
    data_points: parseInt(row.data_points) || 0
  }));
}

// Calculate operational metrics
async function calculateOperationalMetrics(options: any) {
  const operationalQuery = `
    WITH shift_metrics AS (
      SELECT 
        location,
        COUNT(DISTINCT agent_email) as agents_scheduled,
        SUM(calls_handled) as total_calls_handled,
        AVG(utilization_percentage) as avg_utilization,
        AVG(calls_per_hour) as avg_calls_per_hour,
        SUM(total_break_time_minutes) as total_break_time,
        COUNT(*) FILTER (WHERE shift_status = 'completed') as completed_shifts,
        COUNT(*) FILTER (WHERE tardiness_minutes > 0) as late_arrivals
      FROM agent_shifts
      WHERE shift_date BETWEEN DATE($1) AND DATE($2)
        ${options.location ? 'AND location = ANY($3)' : ''}
        ${options.agent ? 'AND agent_email = ANY($4)' : ''}
      GROUP BY location
    )
    SELECT 
      sm.*,
      ROUND((sm.completed_shifts::DECIMAL / NULLIF(sm.agents_scheduled, 0)) * 100, 2) as attendance_rate,
      ROUND((sm.late_arrivals::DECIMAL / NULLIF(sm.completed_shifts, 0)) * 100, 2) as tardiness_rate
    FROM shift_metrics sm
  `;
  
  const params = [options.startDate, options.endDate];
  if (options.location) params.push(options.location);
  if (options.agent) params.push(options.agent);
  
  const results = await db.query(operationalQuery, params);
  
  return results.map((row: any) => ({
    location: row.location,
    agents_scheduled: parseInt(row.agents_scheduled) || 0,
    total_calls_handled: parseInt(row.total_calls_handled) || 0,
    avg_utilization: parseFloat(row.avg_utilization) || 0,
    avg_calls_per_hour: parseFloat(row.avg_calls_per_hour) || 0,
    attendance_rate: parseFloat(row.attendance_rate) || 0,
    tardiness_rate: parseFloat(row.tardiness_rate) || 0,
    total_break_time_hours: Math.round((parseInt(row.total_break_time) || 0) / 60 * 100) / 100
  }));
}

// Generate performance trends
async function generatePerformanceTrends(options: any) {
  const trends: any = {};
  
  // Generate call volume trends
  trends['call_volume'] = await performanceAnalytics.generatePerformanceTrends('call_volume', options);
  
  // Generate answer rate trends
  trends['answer_rate'] = await performanceAnalytics.generatePerformanceTrends('answer_rate', options);
  
  // Generate satisfaction trends
  trends['customer_satisfaction'] = await performanceAnalytics.generatePerformanceTrends('customer_satisfaction', options);
  
  return trends;
}

// Generate dashboard insights
async function generateDashboardInsights(options: any, metrics: any) {
  const insights: any = {
    key_findings: [],
    recommendations: [],
    performance_highlights: [],
    areas_for_improvement: []
  };
  
  // Analyze call volume trends
  if (metrics.call_volume) {
    const totalCalls = metrics.call_volume.reduce((sum: number, loc: any) => sum + loc.total_calls, 0);
    insights.key_findings.push(`Total calls processed: ${totalCalls.toLocaleString()}`);
    
    const avgWaitTime = metrics.call_volume.reduce((sum: number, loc: any) => sum + loc.average_wait_time, 0) / metrics.call_volume.length;
    if (avgWaitTime > 30) {
      insights.areas_for_improvement.push('Average wait time exceeds recommended threshold');
    }
  }
  
  // Analyze agent performance
  if (metrics.agent_performance && Array.isArray(metrics.agent_performance)) {
    const topPerformer = metrics.agent_performance.reduce((top: any, agent: any) => 
      agent.answer_rate > (top?.answer_rate || 0) ? agent : top, null);
    
    if (topPerformer) {
      insights.performance_highlights.push(
        `Top performer: ${topPerformer.agent_name} with ${topPerformer.answer_rate}% answer rate`
      );
    }
  }
  
  return insights;
}

// Main handler with authentication
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const user = req.user; // Added by withAuth middleware
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, user);
        break;
      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
  }
};

export default withAuth(handler, {
  roles: ['staff', 'clinical_staff', 'manager', 'superadmin']
});