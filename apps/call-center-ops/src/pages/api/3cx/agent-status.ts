// Call Center Operations Dashboard - 3CX Agent Status API
// Manages real-time agent status monitoring and updates

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth';
import { db } from '@ganger/db';
import { z } from 'zod';
import { CallCenterApiResponse, ThreeCXAgentStatus } from '../../../types/call-center';

// Request validation schemas
const AgentStatusFilterSchema = z.object({
  location: z.array(z.string()).optional(),
  status: z.array(z.enum(['available', 'busy', 'away', 'offline'])).optional(),
  extension: z.array(z.string()).optional(),
  includeMetrics: z.boolean().default(false),
  realTime: z.boolean().default(true)
});

const AgentStatusUpdateSchema = z.object({
  agent_email: z.string().email('Valid agent email is required'),
  status: z.enum(['available', 'busy', 'away', 'offline']),
  reason_code: z.string().optional(),
  custom_status: z.string().max(100, 'Custom status too long').optional(),
  break_type: z.enum(['lunch', 'break', 'training', 'meeting', 'personal']).optional()
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

// Calculate real-time agent metrics
async function calculateAgentMetrics(agentEmail: string, currentDate: string): Promise<any> {
  const metricsQuery = `
    WITH daily_calls AS (
      SELECT 
        COUNT(*) as calls_today,
        COUNT(*) FILTER (WHERE call_status = 'completed') as calls_answered_today,
        ROUND(AVG(talk_duration_seconds), 0) as avg_talk_time_today,
        ROUND(AVG(customer_satisfaction_score), 2) as avg_satisfaction_today
      FROM call_center_records 
      WHERE agent_email = $1 
        AND DATE(call_start_time) = $2
    ),
    shift_data AS (
      SELECT 
        utilization_percentage,
        calls_per_hour,
        scheduled_start_time,
        actual_start_time,
        shift_status,
        calls_handled as shift_calls_handled
      FROM agent_shifts 
      WHERE agent_email = $1 
        AND shift_date = $2
    ),
    current_goals AS (
      SELECT 
        calls_per_day_target,
        customer_satisfaction_target,
        achievement_percentage
      FROM performance_goals 
      WHERE agent_email = $1 
        AND goal_status = 'active'
        AND period_start_date <= $2 
        AND period_end_date >= $2
      ORDER BY created_at DESC 
      LIMIT 1
    )
    SELECT 
      COALESCE(dc.calls_today, 0) as calls_today,
      COALESCE(dc.calls_answered_today, 0) as calls_answered_today,
      COALESCE(dc.avg_talk_time_today, 0) as avg_talk_time_today,
      COALESCE(dc.avg_satisfaction_today, 0) as avg_satisfaction_today,
      COALESCE(sd.utilization_percentage, 0) as utilization_percentage,
      COALESCE(sd.calls_per_hour, 0) as calls_per_hour,
      sd.scheduled_start_time,
      sd.actual_start_time,
      sd.shift_status,
      COALESCE(sd.shift_calls_handled, 0) as shift_calls_handled,
      cg.calls_per_day_target,
      cg.customer_satisfaction_target,
      COALESCE(cg.achievement_percentage, 0) as goal_achievement_percentage
    FROM daily_calls dc
    FULL OUTER JOIN shift_data sd ON TRUE
    FULL OUTER JOIN current_goals cg ON TRUE
  `;
  
  const result = await db.query(metricsQuery, [agentEmail, currentDate]);
  return result[0] || {};
}

// GET /api/3cx/agent-status - Get current agent status and metrics
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const filters = AgentStatusFilterSchema.parse(req.query);
    const startTime = Date.now();
    
    // Build WHERE clause based on filters and user permissions
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;
    
    // Role-based filtering
    if (user.role === 'staff') {
      whereClause += `acs.agent_email = $${paramIndex}`;
      params.push(user.email);
      paramIndex++;
    } else if (user.role === 'clinical_staff') {
      // Get user's managed locations
      const userLocations = await db.query(`
        SELECT location_name FROM location_staff 
        WHERE user_id = $1 AND is_active = true
      `, [user.id]);
      
      if (userLocations.length > 0) {
        const locationList = userLocations.map((l: any) => l.location_name);
        whereClause += `acs.location = ANY($${paramIndex})`;
        params.push(locationList);
        paramIndex++;
      }
    }
    
    // Apply additional filters
    if (filters.location && filters.location.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `acs.location = ANY($${paramIndex})`;
      params.push(filters.location);
      paramIndex++;
    }
    
    if (filters.status && filters.status.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `acs.status = ANY($${paramIndex})`;
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.extension && filters.extension.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `acs.extension = ANY($${paramIndex})`;
      params.push(filters.extension);
      paramIndex++;
    }
    
    // Main query to get agent status with optional metrics
    const baseQuery = `
      SELECT 
        acs.agent_email,
        acs.agent_name,
        acs.extension,
        acs.queue_name,
        acs.location,
        acs.status,
        acs.current_call_id,
        acs.last_activity,
        acs.status_reason,
        acs.custom_status_message,
        acs.break_start_time,
        acs.break_type,
        acs.updated_at as status_updated_at,
        ccr.call_start_time as current_call_start_time,
        ccr.caller_number as current_caller_number,
        ccr.call_type as current_call_type
      FROM agent_current_status acs
      LEFT JOIN call_center_records ccr ON acs.current_call_id = ccr.call_id
      ${whereClause ? 'WHERE ' + whereClause : ''}
      ORDER BY acs.agent_name
    `;
    
    const agentStatuses = await db.query(baseQuery, params);
    
    // Add metrics if requested
    if (filters.includeMetrics) {
      const currentDate = new Date().toISOString().split('T')[0];
      
      for (const agent of agentStatuses) {
        const metrics = await calculateAgentMetrics(agent.agent_email, currentDate);
        agent.today_metrics = metrics;
        
        // Calculate time in current status
        const statusDuration = Date.now() - new Date(agent.status_updated_at).getTime();
        agent.status_duration_minutes = Math.round(statusDuration / (1000 * 60));
        
        // Calculate break duration if on break
        if (agent.break_start_time) {
          const breakDuration = Date.now() - new Date(agent.break_start_time).getTime();
          agent.break_duration_minutes = Math.round(breakDuration / (1000 * 60));
        }
      }
    }
    
    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_agents,
        COUNT(*) FILTER (WHERE status = 'available') as available_agents,
        COUNT(*) FILTER (WHERE status = 'busy') as busy_agents,
        COUNT(*) FILTER (WHERE status = 'away') as away_agents,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_agents,
        COUNT(*) FILTER (WHERE current_call_id IS NOT NULL) as agents_on_calls
      FROM agent_current_status
      ${whereClause ? 'WHERE ' + whereClause : ''}
    `;
    
    const summary = await db.query(summaryQuery, params);
    
    const queryTime = Date.now() - startTime;
    
    res.status(200).json(successResponse({
      agents: agentStatuses,
      summary: summary[0]
    }, {
      performance: {
        queryTime,
        totalTime: queryTime
      },
      filters: {
        location: filters.location,
        status: filters.status,
        includeMetrics: filters.includeMetrics,
        realTime: filters.realTime
      },
      lastUpdated: new Date().toISOString()
    }));
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid filter parameters', error.errors));
    } else {
      res.status(500).json(errorResponse('QUERY_FAILED', 'Failed to fetch agent status'));
    }
  }
}

// PUT /api/3cx/agent-status - Update agent status (for manual status changes)
async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const statusUpdate = AgentStatusUpdateSchema.parse(req.body);
    
    // Check if user can update this agent's status
    if (user.role === 'staff') {
      if (statusUpdate.agent_email !== user.email) {
        return res.status(403).json(errorResponse(
          'ACCESS_DENIED', 
          'You can only update your own status'
        ));
      }
    }
    
    // Get current agent status
    const currentStatus = await db.query(
      'SELECT * FROM agent_current_status WHERE agent_email = $1',
      [statusUpdate.agent_email]
    );
    
    if (currentStatus.length === 0) {
      return res.status(404).json(errorResponse(
        'AGENT_NOT_FOUND', 
        'Agent status record not found'
      ));
    }
    
    const agent = currentStatus[0];
    
    // Prepare update data
    const updateData: any = {
      status: statusUpdate.status,
      status_reason: statusUpdate.reason_code || null,
      custom_status_message: statusUpdate.custom_status || null,
      updated_at: new Date().toISOString()
    };
    
    // Handle break status logic
    if (statusUpdate.status === 'away' && statusUpdate.break_type) {
      updateData.break_type = statusUpdate.break_type;
      updateData.break_start_time = new Date().toISOString();
    } else if (agent.status === 'away' && statusUpdate.status !== 'away') {
      // Ending break - calculate break duration
      if (agent.break_start_time) {
        const breakDuration = Date.now() - new Date(agent.break_start_time).getTime();
        const breakMinutes = Math.round(breakDuration / (1000 * 60));
        
        // Update today's shift with break time
        await db.query(`
          UPDATE agent_shifts 
          SET total_break_time_minutes = total_break_time_minutes + $1
          WHERE agent_email = $2 AND shift_date = CURRENT_DATE
        `, [breakMinutes, statusUpdate.agent_email]);
      }
      
      updateData.break_type = null;
      updateData.break_start_time = null;
    }
    
    // Update agent status
    const updateQuery = `
      UPDATE agent_current_status 
      SET 
        status = $1,
        status_reason = $2,
        custom_status_message = $3,
        break_type = $4,
        break_start_time = $5,
        updated_at = $6
      WHERE agent_email = $7
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [
      updateData.status,
      updateData.status_reason,
      updateData.custom_status_message,
      updateData.break_type,
      updateData.break_start_time,
      updateData.updated_at,
      statusUpdate.agent_email
    ]);
    
    // Log the status change activity
    await db.query(`
      INSERT INTO user_activity_log (user_id, user_email, action, resource_type, resource_id, metadata)
      VALUES ($1, $2, 'agent_status_changed', 'agent_status', $3, $4)
    `, [
      user.id,
      user.email,
      statusUpdate.agent_email,
      JSON.stringify({
        old_status: agent.status,
        new_status: statusUpdate.status,
        reason_code: statusUpdate.reason_code,
        break_type: statusUpdate.break_type
      })
    ]);
    
    res.status(200).json(successResponse(result[0]));
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid status update data', error.errors));
    } else {
      res.status(500).json(errorResponse('UPDATE_FAILED', 'Failed to update agent status'));
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
      case 'PUT':
        await handlePut(req, res, user);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
  }
};

export default withAuth(handler, {
  roles: ['staff', 'clinical_staff', 'manager', 'superadmin']
});