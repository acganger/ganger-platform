// Call Center Operations Dashboard - 3CX Data Sync API
// Manages manual and automated synchronization of CDR data from 3CX

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@ganger/auth';
import { z } from 'zod';
import { CallCenterApiResponse } from '../../../types/call-center';
import { threeCXIntegration } from '../../../lib/services/threecx-integration';

// Request validation schemas
const CDRSyncRequestSchema = z.object({
  start_date: z.string().date('Valid start date required (YYYY-MM-DD)'),
  end_date: z.string().date('Valid end date required (YYYY-MM-DD)'),
  location: z.enum(['Ann Arbor', 'Wixom', 'Plymouth']).optional(),
  batch_size: z.number().int().min(1).max(5000).default(1000),
  force_refresh: z.boolean().default(false),
  sync_type: z.enum(['historical', 'incremental', 'full']).default('incremental')
});

const AgentStatusSyncRequestSchema = z.object({
  location: z.enum(['Ann Arbor', 'Wixom', 'Plymouth']).optional(),
  force_refresh: z.boolean().default(true)
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

// Validate date range
function validateDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (start > end) {
    throw new Error('Start date cannot be after end date');
  }
  
  if (start > now) {
    throw new Error('Start date cannot be in the future');
  }
  
  const maxRangeMs = 90 * 24 * 60 * 60 * 1000; // 90 days
  if (end.getTime() - start.getTime() > maxRangeMs) {
    throw new Error('Date range cannot exceed 90 days');
  }
}

// POST /api/3cx/sync - Trigger CDR data synchronization
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { action } = req.query;
    
    if (action === 'cdr') {
      return await handleCDRSync(req, res, user);
    } else if (action === 'agent-status') {
      return await handleAgentStatusSync(req, res, user);
    } else {
      return res.status(400).json(errorResponse(
        'INVALID_ACTION',
        'Action must be either "cdr" or "agent-status"'
      ));
    }
    
  } catch (error) {
    res.status(500).json(errorResponse('SYNC_FAILED', 'Synchronization failed'));
  }
}

// Handle CDR synchronization
async function handleCDRSync(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const syncRequest = CDRSyncRequestSchema.parse(req.body);
    const startTime = Date.now();
    
    // Validate permissions
    if (user.role === 'staff') {
      return res.status(403).json(errorResponse(
        'ACCESS_DENIED',
        'CDR sync requires supervisor level access or higher'
      ));
    }
    
    // Validate date range
    validateDateRange(syncRequest.start_date, syncRequest.end_date);
    
    
    // Check if sync is already in progress
    const activeSyncs = await getActiveSyncJobs('cdr_sync');
    if (activeSyncs.length > 0 && !syncRequest.force_refresh) {
      return res.status(409).json(errorResponse(
        'SYNC_IN_PROGRESS',
        'CDR sync is already in progress. Use force_refresh=true to override.',
        { active_syncs: activeSyncs }
      ));
    }
    
    // Create sync job record
    const syncJobId = await createSyncJob({
      sync_type: 'cdr_sync',
      start_date: syncRequest.start_date,
      end_date: syncRequest.end_date,
      location: syncRequest.location,
      batch_size: syncRequest.batch_size,
      initiated_by: user.email,
      status: 'running'
    });
    
    try {
      // Perform the synchronization
      const stats = await threeCXIntegration.syncHistoricalCDR({
        startDate: syncRequest.start_date,
        endDate: syncRequest.end_date,
        location: syncRequest.location,
        batchSize: syncRequest.batch_size
      });
      
      // Update sync job with results
      await updateSyncJob(syncJobId, {
        status: 'completed',
        records_processed: stats.processed,
        records_skipped: stats.skipped,
        errors_count: stats.errors,
        completed_at: new Date().toISOString()
      });
      
      const syncTime = Date.now() - startTime;
      
      res.status(200).json(successResponse({
        sync_job_id: syncJobId,
        statistics: stats,
        performance: {
          sync_time_ms: syncTime,
          records_per_second: Math.round(stats.processed / (syncTime / 1000))
        }
      }, {
        sync_type: 'cdr_sync',
        date_range: {
          start_date: syncRequest.start_date,
          end_date: syncRequest.end_date
        },
        location: syncRequest.location
      }));
      
    } catch (syncError) {
      // Update sync job with error
      await updateSyncJob(syncJobId, {
        status: 'failed',
        error_message: syncError instanceof Error ? syncError.message : String(syncError),
        completed_at: new Date().toISOString()
      });
      throw syncError;
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid sync request', error.errors));
    } else {
      res.status(500).json(errorResponse('CDR_SYNC_FAILED', error instanceof Error ? error.message : String(error)));
    }
  }
}

// Handle agent status synchronization
async function handleAgentStatusSync(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const syncRequest = AgentStatusSyncRequestSchema.parse(req.body);
    const startTime = Date.now();
    
    
    // Fetch current agent status from 3CX
    const agentStatuses = await threeCXIntegration.fetchAgentStatus({
      location: syncRequest.location,
      forceRefresh: syncRequest.force_refresh
    });
    
    // Update our database with current status
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const status of agentStatuses) {
      try {
        // Map location
        const location = mapLocation(status.Location);
        
        // Upsert agent status
        await upsertAgentStatus({
          agent_email: status.Email,
          agent_name: status.Name,
          extension: status.Extension,
          queue_name: status.Queue,
          location: location,
          status: status.Status.toLowerCase(),
          current_call_id: status.CurrentCall || null,
          last_activity: status.LastActivity
        });
        
        updatedCount++;
        
      } catch (error) {
        errorCount++;
      }
    }
    
    const syncTime = Date.now() - startTime;
    
    res.status(200).json(successResponse({
      agents_fetched: agentStatuses.length,
      agents_updated: updatedCount,
      errors: errorCount,
      performance: {
        sync_time_ms: syncTime
      }
    }, {
      sync_type: 'agent_status_sync',
      location: syncRequest.location,
      force_refresh: syncRequest.force_refresh
    }));
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid sync request', error.errors));
    } else {
      res.status(500).json(errorResponse('AGENT_STATUS_SYNC_FAILED', error instanceof Error ? error.message : String(error)));
    }
  }
}

// GET /api/3cx/sync - Get sync job status and history
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { job_id, limit = '20', status } = req.query;
    
    if (job_id) {
      // Get specific sync job details
      const syncJob = await getSyncJobDetails(job_id as string);
      
      if (!syncJob) {
        return res.status(404).json(errorResponse('SYNC_JOB_NOT_FOUND', 'Sync job not found'));
      }
      
      res.status(200).json(successResponse(syncJob));
      
    } else {
      // Get sync job history
      const syncHistory = await getSyncJobHistory({
        limit: parseInt(limit as string),
        status: status as string,
        user_role: user.role,
        user_email: user.email
      });
      
      res.status(200).json(successResponse(syncHistory));
    }
    
  } catch (error) {
    res.status(500).json(errorResponse('QUERY_FAILED', 'Failed to fetch sync job data'));
  }
}

// Database helper functions
async function createSyncJob(jobData: any): Promise<string> {
  const { db } = require('@ganger/db');
  
  const insertQuery = `
    INSERT INTO sync_jobs (
      sync_type, start_date, end_date, location, batch_size,
      initiated_by, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    RETURNING id
  `;
  
  const result = await db.query(insertQuery, [
    jobData.sync_type,
    jobData.start_date,
    jobData.end_date,
    jobData.location,
    jobData.batch_size,
    jobData.initiated_by,
    jobData.status
  ]);
  
  return result[0].id;
}

async function updateSyncJob(jobId: string, updateData: any): Promise<void> {
  const { db } = require('@ganger/db');
  
  const updateQuery = `
    UPDATE sync_jobs 
    SET 
      status = COALESCE($2, status),
      records_processed = COALESCE($3, records_processed),
      records_skipped = COALESCE($4, records_skipped),
      errors_count = COALESCE($5, errors_count),
      error_message = COALESCE($6, error_message),
      completed_at = COALESCE($7, completed_at),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `;
  
  await db.query(updateQuery, [
    jobId,
    updateData.status,
    updateData.records_processed,
    updateData.records_skipped,
    updateData.errors_count,
    updateData.error_message,
    updateData.completed_at
  ]);
}

async function getActiveSyncJobs(syncType: string): Promise<any[]> {
  const { db } = require('@ganger/db');
  
  const query = `
    SELECT id, sync_type, start_date, end_date, initiated_by, created_at
    FROM sync_jobs 
    WHERE sync_type = $1 AND status = 'running'
    ORDER BY created_at DESC
  `;
  
  return await db.query(query, [syncType]);
}

async function getSyncJobDetails(jobId: string): Promise<any> {
  const { db } = require('@ganger/db');
  
  const query = `
    SELECT * FROM sync_jobs WHERE id = $1
  `;
  
  const result = await db.query(query, [jobId]);
  return result[0] || null;
}

async function getSyncJobHistory(options: any): Promise<any[]> {
  const { db } = require('@ganger/db');
  
  let whereClause = '';
  const params: any[] = [];
  let paramIndex = 1;
  
  if (options.status) {
    whereClause += `WHERE status = $${paramIndex}`;
    params.push(options.status);
    paramIndex++;
  }
  
  if (options.user_role === 'staff' || options.user_role === 'staff') {
    whereClause += (whereClause ? ' AND ' : 'WHERE ') + `initiated_by = $${paramIndex}`;
    params.push(options.user_email);
    paramIndex++;
  }
  
  const query = `
    SELECT 
      id, sync_type, start_date, end_date, location,
      records_processed, records_skipped, errors_count,
      status, initiated_by, created_at, completed_at,
      EXTRACT(EPOCH FROM (COALESCE(completed_at, CURRENT_TIMESTAMP) - created_at)) as duration_seconds
    FROM sync_jobs 
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT $${paramIndex}
  `;
  
  params.push(options.limit);
  
  return await db.query(query, params);
}

async function upsertAgentStatus(statusData: any): Promise<void> {
  const { db } = require('@ganger/db');
  
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
  
  await db.query(upsertQuery, [
    statusData.agent_email,
    statusData.agent_name,
    statusData.extension,
    statusData.queue_name,
    statusData.location,
    statusData.status,
    statusData.current_call_id,
    statusData.last_activity
  ]);
}

function mapLocation(threeCXLocation: string): 'Ann Arbor' | 'Wixom' | 'Plymouth' {
  const locationMap: Record<string, 'Ann Arbor' | 'Wixom' | 'Plymouth'> = {
    'aa': 'Ann Arbor',
    'ann_arbor': 'Ann Arbor',
    'annarbor': 'Ann Arbor',
    'wixom': 'Wixom',
    'wx': 'Wixom',
    'plymouth': 'Plymouth',
    'ply': 'Plymouth',
    'plym': 'Plymouth'
  };
  
  const normalized = threeCXLocation.toLowerCase().replace(/[^a-z]/g, '');
  return locationMap[normalized] || 'Ann Arbor';
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