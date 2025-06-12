// Call Center Operations Dashboard - 3CX Webhook Handler
// Processes incoming CDR webhooks and agent status updates from 3CX VoIP system

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@ganger/db';
import { z } from 'zod';
import { CallCenterApiResponse, ThreeCXCallRecord, ThreeCXAgentStatus } from '../../../types/call-center';

// 3CX webhook validation schemas
const ThreeCXCallRecordSchema = z.object({
  CallId: z.string().min(1, 'Call ID is required'),
  CallType: z.string().min(1, 'Call type is required'),
  StartTime: z.string().datetime('Invalid start time format'),
  EndTime: z.string().datetime().optional(),
  AnswerTime: z.string().datetime().optional(),
  CallerNumber: z.string().min(1, 'Caller number is required'),
  CalledNumber: z.string().min(1, 'Called number is required'),
  AgentExtension: z.string().min(1, 'Agent extension is required'),
  AgentName: z.string().min(1, 'Agent name is required'),
  Duration: z.number().int().min(0, 'Duration must be non-negative'),
  TalkDuration: z.number().int().min(0, 'Talk duration must be non-negative'),
  HoldDuration: z.number().int().min(0, 'Hold duration must be non-negative'),
  QueueName: z.string().min(1, 'Queue name is required'),
  Recording: z.string().url().optional(),
  CallResult: z.string().min(1, 'Call result is required')
});

const ThreeCXAgentStatusSchema = z.object({
  Extension: z.string().min(1, 'Extension is required'),
  Name: z.string().min(1, 'Name is required'),
  Email: z.string().email('Valid email is required'),
  Status: z.enum(['Available', 'Busy', 'Away', 'Offline']),
  Queue: z.string().min(1, 'Queue is required'),
  Location: z.string().min(1, 'Location is required'),
  CurrentCall: z.string().optional(),
  LastActivity: z.string().datetime('Invalid last activity format')
});

const WebhookPayloadSchema = z.object({
  event_type: z.enum(['call_completed', 'agent_status_changed', 'call_started', 'call_answered']),
  timestamp: z.string().datetime('Invalid timestamp format'),
  data: z.union([ThreeCXCallRecordSchema, ThreeCXAgentStatusSchema])
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

// Map 3CX location codes to our standardized location names
function mapLocation(threeCXLocation: string): 'Ann Arbor' | 'Wixom' | 'Plymouth' {
  const locationMap: Record<string, 'Ann Arbor' | 'Wixom' | 'Plymouth'> = {
    'aa': 'Ann Arbor',
    'ann_arbor': 'Ann Arbor',
    'wixom': 'Wixom',
    'wx': 'Wixom',
    'plymouth': 'Plymouth',
    'ply': 'Plymouth',
    'plym': 'Plymouth'
  };
  
  const normalized = threeCXLocation.toLowerCase().replace(/[^a-z_]/g, '');
  return locationMap[normalized] || 'Ann Arbor'; // Default fallback
}

// Map 3CX call results to our call status enum
function mapCallStatus(callResult: string): 'completed' | 'missed' | 'abandoned' | 'transferred' | 'voicemail' {
  const statusMap: Record<string, 'completed' | 'missed' | 'abandoned' | 'transferred' | 'voicemail'> = {
    'answered': 'completed',
    'completed': 'completed',
    'no_answer': 'missed',
    'busy': 'missed',
    'failed': 'missed',
    'abandoned': 'abandoned',
    'hangup': 'abandoned',
    'transferred': 'transferred',
    'transfer': 'transferred',
    'voicemail': 'voicemail'
  };
  
  const normalized = callResult.toLowerCase().replace(/[^a-z]/g, '');
  return statusMap[normalized] || 'completed'; // Default fallback
}

// Determine call direction from 3CX data
function determineCallDirection(callerNumber: string, calledNumber: string): 'inbound' | 'outbound' {
  // Check if caller number matches our known extensions or if called number is external
  const internalExtensions = ['100', '101', '102', '103', '104', '105', '200', '201', '202', '203', '300', '301', '302'];
  const isInternalCaller = internalExtensions.includes(callerNumber);
  const isExternalCalled = !internalExtensions.includes(calledNumber);
  
  // If caller is internal and called is external, it's outbound
  if (isInternalCaller && isExternalCalled) {
    return 'outbound';
  }
  
  // Default to inbound for customer calls
  return 'inbound';
}

// Get agent email from extension mapping
async function getAgentEmailFromExtension(extension: string, agentName: string): Promise<string> {
  try {
    // First try to find by extension in agent_shifts table
    const agentQuery = await db.query(`
      SELECT DISTINCT agent_email 
      FROM agent_shifts 
      WHERE agent_email LIKE '%' || $1 || '%' 
         OR agent_name ILIKE '%' || $2 || '%'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [extension, agentName]);
    
    if (agentQuery.length > 0) {
      return agentQuery[0].agent_email;
    }
    
    // Fallback: create standardized email based on name
    const emailName = agentName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.');
    
    return `${emailName}@gangerdermatology.com`;
  } catch (error) {
    return `agent.${extension}@gangerdermatology.com`;
  }
}

// Process call completed webhook
async function processCallCompleted(callData: ThreeCXCallRecord): Promise<void> {
  try {
    // Check if call record already exists
    const existingCall = await db.query(
      'SELECT id FROM call_center_records WHERE call_id = $1',
      [callData.CallId]
    );
    
    if (existingCall.length > 0) {
      return;
    }
    
    // Get agent email from extension
    const agentEmail = await getAgentEmailFromExtension(callData.AgentExtension, callData.AgentName);
    
    // Calculate timing metrics
    const startTime = new Date(callData.StartTime);
    const answerTime = callData.AnswerTime ? new Date(callData.AnswerTime) : null;
    const endTime = callData.EndTime ? new Date(callData.EndTime) : null;
    
    const ringDuration = answerTime ? Math.round((answerTime.getTime() - startTime.getTime()) / 1000) : 0;
    const talkDuration = callData.TalkDuration;
    const holdDuration = callData.HoldDuration;
    
    // Map location and status
    const location = mapLocation(callData.QueueName);
    const callStatus = mapCallStatus(callData.CallResult);
    const callDirection = determineCallDirection(callData.CallerNumber, callData.CalledNumber);
    
    // Insert call record
    const insertQuery = `
      INSERT INTO call_center_records (
        call_id, location, queue_name, agent_extension, agent_email, agent_name,
        caller_number, called_number, call_direction,
        call_start_time, call_answer_time, call_end_time,
        ring_duration_seconds, talk_duration_seconds, hold_time_seconds,
        call_status, recording_available, recording_url,
        after_call_work_seconds, transfer_count, call_priority
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING id
    `;
    
    const values = [
      callData.CallId,
      location,
      callData.QueueName,
      callData.AgentExtension,
      agentEmail,
      callData.AgentName,
      callData.CallerNumber,
      callData.CalledNumber,
      callDirection,
      callData.StartTime,
      callData.AnswerTime || null,
      callData.EndTime || null,
      ringDuration,
      talkDuration,
      holdDuration,
      callStatus,
      !!callData.Recording,
      callData.Recording || null,
      0, // after_call_work_seconds - to be updated later
      0, // transfer_count - to be determined from 3CX data
      'normal' // call_priority - default
    ];
    
    const result = await db.query(insertQuery, values);
    
    // Log the webhook processing
    
    // Update agent shift data if applicable
    await updateAgentShiftMetrics(agentEmail, startTime, talkDuration);
    
  } catch (error) {
    throw error;
  }
}

// Process agent status change webhook
async function processAgentStatusChanged(statusData: ThreeCXAgentStatus): Promise<void> {
  try {
    // Update or insert agent status
    const upsertQuery = `
      INSERT INTO agent_current_status (
        agent_email, agent_name, extension, queue_name, location,
        status, current_call_id, last_activity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (agent_email) DO UPDATE SET
        agent_name = EXCLUDED.agent_name,
        extension = EXCLUDED.extension,
        queue_name = EXCLUDED.queue_name,
        location = EXCLUDED.location,
        status = EXCLUDED.status,
        current_call_id = EXCLUDED.current_call_id,
        last_activity = EXCLUDED.last_activity,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const location = mapLocation(statusData.Location);
    
    await db.query(upsertQuery, [
      statusData.Email,
      statusData.Name,
      statusData.Extension,
      statusData.Queue,
      location,
      statusData.Status.toLowerCase(),
      statusData.CurrentCall || null,
      statusData.LastActivity
    ]);
    
    
  } catch (error) {
    throw error;
  }
}

// Update agent shift metrics with call data
async function updateAgentShiftMetrics(agentEmail: string, callTime: Date, talkDuration: number): Promise<void> {
  try {
    const shiftDate = callTime.toISOString().split('T')[0];
    
    // Update or create today's shift record
    const upsertShiftQuery = `
      INSERT INTO agent_shifts (
        agent_email, shift_date, calls_handled, total_talk_time_seconds
      ) VALUES ($1, $2, 1, $3)
      ON CONFLICT (agent_email, shift_date) DO UPDATE SET
        calls_handled = agent_shifts.calls_handled + 1,
        total_talk_time_seconds = agent_shifts.total_talk_time_seconds + EXCLUDED.total_talk_time_seconds,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.query(upsertShiftQuery, [agentEmail, shiftDate, talkDuration]);
    
    // Recalculate utilization percentage for the shift
    const updateUtilizationQuery = `
      UPDATE agent_shifts 
      SET 
        calls_per_hour = CASE 
          WHEN total_available_time_seconds > 0 
          THEN ROUND((calls_handled::DECIMAL / (total_available_time_seconds / 3600.0)), 2)
          ELSE 0 
        END,
        utilization_percentage = CASE 
          WHEN total_available_time_seconds > 0 
          THEN ROUND((total_talk_time_seconds::DECIMAL / total_available_time_seconds) * 100, 2)
          ELSE 0 
        END
      WHERE agent_email = $1 AND shift_date = $2
    `;
    
    await db.query(updateUtilizationQuery, [agentEmail, shiftDate]);
    
  } catch (error) {
  }
}

// Main webhook handler
async function handleWebhook(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`));
    }
    
    // Validate webhook payload
    const webhookData = WebhookPayloadSchema.parse(req.body);
    
    // Process based on event type
    switch (webhookData.event_type) {
      case 'call_completed':
        await processCallCompleted(webhookData.data as ThreeCXCallRecord);
        break;
        
      case 'agent_status_changed':
        await processAgentStatusChanged(webhookData.data as ThreeCXAgentStatus);
        break;
        
      case 'call_started':
      case 'call_answered':
        // These events could be used for real-time monitoring
        break;
        
      default:
    }
    
    res.status(200).json(successResponse({ 
      message: 'Webhook processed successfully',
      event_type: webhookData.event_type,
      processed_at: new Date().toISOString()
    }));
    
  } catch (error) {
    
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid webhook payload', error.errors));
    } else {
      res.status(500).json(errorResponse('WEBHOOK_PROCESSING_FAILED', 'Failed to process webhook'));
    }
  }
}

export default handleWebhook;