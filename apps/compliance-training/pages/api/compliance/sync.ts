import type { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '../../../lib/auth-utils';
import { ApiResponse, ErrorCodes } from '../../../middleware/errorHandler';
import { withAuth, withMethods, withRateLimit, AuthenticatedRequest } from '../../../middleware/auth';
import { ZenefitsComplianceSync } from '../../../lib/integrations/zenefits';
import { GoogleClassroomComplianceSync } from '../../../lib/integrations/google-classroom';

interface SyncRequest {
  source: 'zenefits' | 'google-classroom' | 'all';
  options?: {
    fullSync?: boolean;
    department?: string;
    courseId?: string;
    dryRun?: boolean;
  };
}

interface SyncResponse {
  syncId: string;
  status: 'started' | 'completed' | 'failed';
  results?: {
    zenefits?: {
      employeesProcessed: number;
      employeesCreated: number;
      employeesUpdated: number;
      errors: string[];
    };
    googleClassroom?: {
      completionsProcessed: number;
      completionsCreated: number;
      completionsUpdated: number;
      errors: string[];
    };
  };
  startTime: string;
  endTime?: string;
  duration?: number;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<SyncResponse>>
) {
  const { user } = req;

    const { source, options = {} }: SyncRequest = req.body;

    if (!source) {
      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Source is required (zenefits, google-classroom, or all)'
        }
      });
    }

    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();

    // Create sync log entry
    const { error: syncLogError } = await supabase
      .from('sync_logs')
      .insert({
        id: syncId,
        source,
        status: 'started',
        started_at: startTime,
        started_by: user.id,
        options: JSON.stringify(options)
      })
      .select()
      .single();

    if (syncLogError) {
      throw new Error(`Failed to create sync log: ${syncLogError.message}`);
    }

    // Start sync operations
    const results: SyncResponse['results'] = {};

    try {
      if (source === 'zenefits' || source === 'all') {
        // Starting Zenefits sync
        const zenefitsSync = new ZenefitsComplianceSync();
        const zenefitsResult = await zenefitsSync.syncEmployees({
          fullSync: options.fullSync,
          department: options.department,
          dryRun: options.dryRun
        });

        results.zenefits = {
          employeesProcessed: zenefitsResult.processed,
          employeesCreated: zenefitsResult.created,
          employeesUpdated: zenefitsResult.updated,
          errors: zenefitsResult.errors || []
        };
      }

      if (source === 'google-classroom' || source === 'all') {
        // Starting Google Classroom sync
        const classroomSync = new GoogleClassroomComplianceSync();
        const classroomResult = await classroomSync.syncCompletions({
          courseId: options.courseId,
          incremental: !options.fullSync,
          dryRun: options.dryRun
        });

        results.googleClassroom = {
          completionsProcessed: classroomResult.processed,
          completionsCreated: classroomResult.created,
          completionsUpdated: classroomResult.updated,
          errors: classroomResult.errors || []
        };
      }

      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      // Update sync log with completion
      await supabase
        .from('sync_logs')
        .update({
          status: 'completed',
          completed_at: endTime,
          results: JSON.stringify(results),
          duration_ms: duration
        })
        .eq('id', syncId);

      // Audit log
      await auditLog({
        action: 'compliance_sync_completed',
        userId: user.id,
        userEmail: user.email,
        resourceType: 'compliance_sync',
        metadata: {
          syncId,
          source,
          duration,
          results
        }
      });

      const response: SyncResponse = {
        syncId,
        status: 'completed',
        results,
        startTime,
        endTime,
        duration
      };

      res.status(200).json({
        success: true,
        data: response
      });

    } catch (syncError) {
      // Update sync log with failure
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          completed_at: endTime,
          error: syncError instanceof Error ? syncError.message : 'Unknown sync error',
          duration_ms: duration
        })
        .eq('id', syncId);

      throw syncError;
    }

}

export default withRateLimit(
  withMethods(
    withAuth(syncHandler, { requiredPermissions: ['compliance:sync'] }),
    ['POST']
  ),
  { maxRequests: 10, windowMs: 60000 } // 10 sync requests per minute
);