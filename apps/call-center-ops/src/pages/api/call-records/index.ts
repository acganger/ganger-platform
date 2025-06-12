// Call Center Operations Dashboard - Call Records API
// Handles CRUD operations for call center records with filtering and analytics

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth';
import { db } from '@ganger/db';
import { z } from 'zod';
import { CallCenterApiResponse, CallCenterRecord, CallCenterFilters } from '../../../types/call-center';

// Request validation schemas
const CallRecordCreateSchema = z.object({
  call_id: z.string().min(1, 'Call ID is required'),
  location: z.enum(['Ann Arbor', 'Wixom', 'Plymouth']),
  queue_name: z.string().min(1, 'Queue name is required'),
  agent_extension: z.string().min(1, 'Agent extension is required'),
  agent_email: z.string().email('Valid agent email is required'),
  agent_name: z.string().min(1, 'Agent name is required'),
  caller_number: z.string().min(1, 'Caller number is required'),
  caller_name: z.string().optional(),
  called_number: z.string().min(1, 'Called number is required'),
  call_direction: z.enum(['inbound', 'outbound']),
  call_type: z.enum(['appointment', 'prescription', 'billing', 'general', 'follow_up']).optional(),
  call_start_time: z.string().datetime('Invalid start time format'),
  call_answer_time: z.string().datetime().optional(),
  call_end_time: z.string().datetime().optional(),
  call_status: z.enum(['completed', 'missed', 'abandoned', 'transferred', 'voicemail']),
  call_outcome: z.enum(['appointment_scheduled', 'information_provided', 'transfer_required', 'callback_scheduled']).optional(),
  customer_satisfaction_score: z.number().int().min(1).max(5).optional(),
  quality_score: z.number().int().min(1).max(100).optional(),
  patient_mrn: z.string().optional(),
  appointment_scheduled: z.boolean().default(false),
  appointment_date: z.string().date().optional(),
  appointment_type: z.string().optional(),
  provider_requested: z.string().optional(),
  first_call_resolution: z.boolean().default(false),
  escalation_required: z.boolean().default(false),
  complaint_call: z.boolean().default(false),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().date().optional(),
  recording_available: z.boolean().default(false),
  recording_url: z.string().url().optional(),
  compliance_notes: z.string().optional(),
  after_call_work_seconds: z.number().int().min(0).default(0),
  hold_time_seconds: z.number().int().min(0).default(0),
  transfer_count: z.number().int().min(0).default(0),
  shift_id: z.string().uuid().optional(),
  campaign_id: z.string().optional(),
  call_priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal')
});

const CallRecordUpdateSchema = CallRecordCreateSchema.partial().omit({ call_id: true });

const FilterSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  location: z.array(z.string()).optional(),
  agent: z.array(z.string()).optional(),
  callType: z.array(z.string()).optional(),
  callStatus: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
  sortBy: z.string().default('call_start_time'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
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

// GET /api/call-records - List call records with filtering and pagination
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const filters = FilterSchema.parse(req.query);
    const startTime = Date.now();

    // Build WHERE clause based on filters and user permissions
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'staff') {
      whereClause += `agent_email = $${paramIndex}`;
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
        whereClause += `location = ANY($${paramIndex})`;
        params.push(locationList);
        paramIndex++;
      }
    }
    // Managers and superadmins can see all records (no additional filter)

    // Apply additional filters
    if (filters.startDate) {
      whereClause += (whereClause ? ' AND ' : '') + `call_start_time >= $${paramIndex}`;
      params.push(filters.startDate + 'T00:00:00Z');
      paramIndex++;
    }

    if (filters.endDate) {
      whereClause += (whereClause ? ' AND ' : '') + `call_start_time <= $${paramIndex}`;
      params.push(filters.endDate + 'T23:59:59Z');
      paramIndex++;
    }

    if (filters.location && filters.location.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `location = ANY($${paramIndex})`;
      params.push(filters.location);
      paramIndex++;
    }

    if (filters.agent && filters.agent.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `agent_email = ANY($${paramIndex})`;
      params.push(filters.agent);
      paramIndex++;
    }

    if (filters.callType && filters.callType.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `call_type = ANY($${paramIndex})`;
      params.push(filters.callType);
      paramIndex++;
    }

    if (filters.callStatus && filters.callStatus.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `call_status = ANY($${paramIndex})`;
      params.push(filters.callStatus);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += (whereClause ? ' AND ' : '') + `(
        caller_number ILIKE $${paramIndex} OR 
        caller_name ILIKE $${paramIndex} OR 
        agent_name ILIKE $${paramIndex} OR
        patient_mrn ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM call_center_records 
      ${whereClause ? 'WHERE ' + whereClause : ''}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated results
    const offset = (filters.page - 1) * filters.limit;
    const dataQuery = `
      SELECT 
        id, call_id, location, queue_name, agent_extension, agent_email, agent_name,
        caller_number, caller_name, called_number, call_direction, call_type,
        call_start_time, call_answer_time, call_end_time, 
        ring_duration_seconds, talk_duration_seconds,
        call_status, call_outcome, customer_satisfaction_score, quality_score,
        patient_mrn, appointment_scheduled, appointment_date, appointment_type, provider_requested,
        first_call_resolution, escalation_required, complaint_call, follow_up_required, follow_up_date,
        recording_available, recording_url, recording_reviewed, compliance_notes,
        after_call_work_seconds, hold_time_seconds, transfer_count,
        shift_id, campaign_id, call_priority,
        created_at, updated_at
      FROM call_center_records 
      ${whereClause ? 'WHERE ' + whereClause : ''}
      ORDER BY ${filters.sortBy} ${filters.sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(filters.limit, offset);

    const records = await db.query(dataQuery, params);

    const queryTime = Date.now() - startTime;
    const pages = Math.ceil(total / filters.limit);

    res.status(200).json(successResponse(records, {
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages
      },
      performance: {
        queryTime,
        totalTime: queryTime
      }
    }));

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid filter parameters', error.errors));
    } else {
      res.status(500).json(errorResponse('QUERY_FAILED', 'Failed to fetch call records'));
    }
  }
}

// POST /api/call-records - Create new call record
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const validatedData = CallRecordCreateSchema.parse(req.body);
    
    // Check if call record already exists
    const existingRecord = await db.query(
      'SELECT id FROM call_center_records WHERE call_id = $1',
      [validatedData.call_id]
    );

    if (existingRecord.length > 0) {
      return res.status(409).json(errorResponse(
        'DUPLICATE_RECORD', 
        'Call record with this call ID already exists'
      ));
    }

    // Insert new call record
    const insertQuery = `
      INSERT INTO call_center_records (
        call_id, location, queue_name, agent_extension, agent_email, agent_name,
        caller_number, caller_name, called_number, call_direction, call_type,
        call_start_time, call_answer_time, call_end_time,
        call_status, call_outcome, customer_satisfaction_score, quality_score,
        patient_mrn, appointment_scheduled, appointment_date, appointment_type, provider_requested,
        first_call_resolution, escalation_required, complaint_call, follow_up_required, follow_up_date,
        recording_available, recording_url, compliance_notes,
        after_call_work_seconds, hold_time_seconds, transfer_count,
        shift_id, campaign_id, call_priority
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
      ) RETURNING *
    `;

    const values = [
      validatedData.call_id,
      validatedData.location,
      validatedData.queue_name,
      validatedData.agent_extension,
      validatedData.agent_email,
      validatedData.agent_name,
      validatedData.caller_number,
      validatedData.caller_name || null,
      validatedData.called_number,
      validatedData.call_direction,
      validatedData.call_type || null,
      validatedData.call_start_time,
      validatedData.call_answer_time || null,
      validatedData.call_end_time || null,
      validatedData.call_status,
      validatedData.call_outcome || null,
      validatedData.customer_satisfaction_score || null,
      validatedData.quality_score || null,
      validatedData.patient_mrn || null,
      validatedData.appointment_scheduled,
      validatedData.appointment_date || null,
      validatedData.appointment_type || null,
      validatedData.provider_requested || null,
      validatedData.first_call_resolution,
      validatedData.escalation_required,
      validatedData.complaint_call,
      validatedData.follow_up_required,
      validatedData.follow_up_date || null,
      validatedData.recording_available,
      validatedData.recording_url || null,
      validatedData.compliance_notes || null,
      validatedData.after_call_work_seconds,
      validatedData.hold_time_seconds,
      validatedData.transfer_count,
      validatedData.shift_id || null,
      validatedData.campaign_id || null,
      validatedData.call_priority
    ];

    const result = await db.query(insertQuery, values);
    const newRecord = result[0];

    // Log the creation activity
    await db.query(`
      INSERT INTO user_activity_log (user_id, user_email, action, resource_type, resource_id, metadata)
      VALUES ($1, $2, 'call_record_created', 'call_center_record', $3, $4)
    `, [
      user.id,
      user.email,
      newRecord.id,
      JSON.stringify({
        call_id: validatedData.call_id,
        location: validatedData.location,
        call_type: validatedData.call_type,
        agent_email: validatedData.agent_email
      })
    ]);

    res.status(201).json(successResponse(newRecord));

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid call record data', error.errors));
    } else {
      res.status(500).json(errorResponse('CREATION_FAILED', 'Failed to create call record'));
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