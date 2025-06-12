// Call Center Operations Dashboard - Call Journals API
// Handles CRUD operations for call journals and detailed call notes

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth';
import { db } from '@ganger/db';
import { z } from 'zod';
import { CallCenterApiResponse, CallJournal, CallJournalInput } from '../../../types/call-center';

// Request validation schemas
const CallJournalCreateSchema = z.object({
  call_record_id: z.string().uuid('Valid call record ID required'),
  call_summary: z.string().min(10, 'Call summary must be at least 10 characters').max(500, 'Call summary too long'),
  detailed_notes: z.string().max(2000, 'Detailed notes too long').optional(),
  patient_concern: z.string().max(500, 'Patient concern too long').optional(),
  resolution_provided: z.string().max(500, 'Resolution description too long').optional(),
  action_items: z.array(z.string().max(200, 'Action item too long')).default([]),
  follow_up_required: z.boolean().default(false),
  follow_up_type: z.enum(['callback', 'appointment', 'provider_review', 'billing']).optional(),
  follow_up_date: z.string().date().optional(),
  follow_up_notes: z.string().max(500, 'Follow-up notes too long').optional(),
  call_tags: z.array(z.string().max(50, 'Tag too long')).default([]),
  department_involved: z.array(z.string().max(100, 'Department name too long')).default([]),
  referral_made: z.boolean().default(false),
  referral_type: z.string().max(100, 'Referral type too long').optional(),
  coaching_notes: z.string().max(1000, 'Coaching notes too long').optional(),
  training_opportunities: z.array(z.string().max(200, 'Training opportunity too long')).default([]),
  commendation_worthy: z.boolean().default(false),
  improvement_areas: z.array(z.string().max(200, 'Improvement area too long')).default([])
});

const CallJournalUpdateSchema = CallJournalCreateSchema.partial();

const JournalFilterSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  agent: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'reviewed', 'approved']).optional(),
  followUpRequired: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
  sortBy: z.string().default('created_at'),
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

// GET /api/call-journals - List call journals with filtering
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const filters = JournalFilterSchema.parse(req.query);
    const startTime = Date.now();

    // Build WHERE clause based on filters and user permissions
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'staff') {
      whereClause += `cj.agent_email = $${paramIndex}`;
      params.push(user.email);
      paramIndex++;
    } else if (user.role === 'clinical_staff') {
      // Get user's managed locations for filtering
      const userLocations = await db.query(`
        SELECT location_name FROM location_staff 
        WHERE user_id = $1 AND is_active = true
      `, [user.id]);
      
      if (userLocations.length > 0) {
        const locationList = userLocations.map((l: any) => l.location_name);
        whereClause += `ccr.location = ANY($${paramIndex})`;
        params.push(locationList);
        paramIndex++;
      }
    }
    // Managers and superadmins can see all journals (no additional filter)

    // Apply additional filters
    if (filters.startDate) {
      whereClause += (whereClause ? ' AND ' : '') + `cj.created_at >= $${paramIndex}`;
      params.push(filters.startDate + 'T00:00:00Z');
      paramIndex++;
    }

    if (filters.endDate) {
      whereClause += (whereClause ? ' AND ' : '') + `cj.created_at <= $${paramIndex}`;
      params.push(filters.endDate + 'T23:59:59Z');
      paramIndex++;
    }

    if (filters.agent) {
      whereClause += (whereClause ? ' AND ' : '') + `cj.agent_email = $${paramIndex}`;
      params.push(filters.agent);
      paramIndex++;
    }

    if (filters.status) {
      whereClause += (whereClause ? ' AND ' : '') + `cj.journal_status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.followUpRequired !== undefined) {
      whereClause += (whereClause ? ' AND ' : '') + `cj.follow_up_required = $${paramIndex}`;
      params.push(filters.followUpRequired);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause += (whereClause ? ' AND ' : '') + `cj.call_tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += (whereClause ? ' AND ' : '') + `(
        cj.call_summary ILIKE $${paramIndex} OR 
        cj.detailed_notes ILIKE $${paramIndex} OR 
        cj.patient_concern ILIKE $${paramIndex} OR
        ccr.caller_name ILIKE $${paramIndex} OR
        ccr.caller_number ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM call_journals cj
      JOIN call_center_records ccr ON cj.call_record_id = ccr.id
      ${whereClause ? 'WHERE ' + whereClause : ''}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult[0].total);

    // Get paginated results with call record details
    const offset = (filters.page - 1) * filters.limit;
    const dataQuery = `
      SELECT 
        cj.id, cj.call_record_id, cj.agent_email,
        cj.call_summary, cj.detailed_notes, cj.patient_concern, cj.resolution_provided,
        cj.action_items, cj.follow_up_required, cj.follow_up_type, cj.follow_up_date, cj.follow_up_notes,
        cj.call_tags, cj.department_involved, cj.referral_made, cj.referral_type,
        cj.coaching_notes, cj.training_opportunities, cj.commendation_worthy, cj.improvement_areas,
        cj.journal_status, cj.submitted_at, cj.reviewed_by, cj.reviewed_at, cj.review_score,
        cj.created_at, cj.updated_at,
        ccr.call_id, ccr.caller_number, ccr.caller_name, ccr.call_start_time, ccr.call_type, ccr.location
      FROM call_journals cj
      JOIN call_center_records ccr ON cj.call_record_id = ccr.id
      ${whereClause ? 'WHERE ' + whereClause : ''}
      ORDER BY cj.${filters.sortBy} ${filters.sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(filters.limit, offset);

    const journals = await db.query(dataQuery, params);

    const queryTime = Date.now() - startTime;
    const pages = Math.ceil(total / filters.limit);

    res.status(200).json(successResponse(journals, {
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
      res.status(500).json(errorResponse('QUERY_FAILED', 'Failed to fetch call journals'));
    }
  }
}

// POST /api/call-journals - Create new call journal
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const validatedData = CallJournalCreateSchema.parse(req.body);
    
    // Verify the call record exists and user has access
    const callRecord = await db.query(`
      SELECT id, agent_email, location 
      FROM call_center_records 
      WHERE id = $1
    `, [validatedData.call_record_id]);

    if (callRecord.length === 0) {
      return res.status(404).json(errorResponse(
        'CALL_RECORD_NOT_FOUND', 
        'Call record not found'
      ));
    }

    const record = callRecord[0];

    // Check if user can create journal for this call
    if (user.role === 'staff') {
      if (record.agent_email !== user.email) {
        return res.status(403).json(errorResponse(
          'ACCESS_DENIED', 
          'You can only create journals for your own calls'
        ));
      }
    }

    // Check if journal already exists for this call
    const existingJournal = await db.query(
      'SELECT id FROM call_journals WHERE call_record_id = $1',
      [validatedData.call_record_id]
    );

    if (existingJournal.length > 0) {
      return res.status(409).json(errorResponse(
        'JOURNAL_EXISTS', 
        'Journal already exists for this call record'
      ));
    }

    // Insert new call journal
    const insertQuery = `
      INSERT INTO call_journals (
        call_record_id, agent_email, call_summary, detailed_notes, patient_concern, resolution_provided,
        action_items, follow_up_required, follow_up_type, follow_up_date, follow_up_notes,
        call_tags, department_involved, referral_made, referral_type,
        coaching_notes, training_opportunities, commendation_worthy, improvement_areas
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;

    const values = [
      validatedData.call_record_id,
      user.email, // Use authenticated user's email
      validatedData.call_summary,
      validatedData.detailed_notes || null,
      validatedData.patient_concern || null,
      validatedData.resolution_provided || null,
      validatedData.action_items,
      validatedData.follow_up_required,
      validatedData.follow_up_type || null,
      validatedData.follow_up_date || null,
      validatedData.follow_up_notes || null,
      validatedData.call_tags,
      validatedData.department_involved,
      validatedData.referral_made,
      validatedData.referral_type || null,
      validatedData.coaching_notes || null,
      validatedData.training_opportunities,
      validatedData.commendation_worthy,
      validatedData.improvement_areas
    ];

    const result = await db.query(insertQuery, values);
    const newJournal = result[0];

    // Log the creation activity
    await db.query(`
      INSERT INTO user_activity_log (user_id, user_email, action, resource_type, resource_id, metadata)
      VALUES ($1, $2, 'call_journal_created', 'call_journal', $3, $4)
    `, [
      user.id,
      user.email,
      newJournal.id,
      JSON.stringify({
        call_record_id: validatedData.call_record_id,
        follow_up_required: validatedData.follow_up_required,
        call_tags: validatedData.call_tags,
        action_items_count: validatedData.action_items.length
      })
    ]);

    res.status(201).json(successResponse(newJournal));

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid journal data', error.errors));
    } else {
      res.status(500).json(errorResponse('CREATION_FAILED', 'Failed to create call journal'));
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