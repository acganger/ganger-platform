import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { auditLog } from '@ganger/utils/server';
import type { SyncResult, GoogleClassroomSubmission, TrainingCompletion } from '@ganger/types';

export interface GoogleClassroomConfig {
  credentials: any;
  scopes: string[];
  timeout?: number;
  maxRetries?: number;
}

export interface ClassroomSyncOptions {
  courseId?: string;
  moduleId?: string;
  incremental?: boolean;
  batchSize?: number;
  dryRun?: boolean;
}

export class GoogleClassroomComplianceSync {
  private config: GoogleClassroomConfig;
  private supabase;
  private classroom;
  private auth;

  constructor(config?: Partial<GoogleClassroomConfig>) {
    this.config = {
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
        'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
        'https://www.googleapis.com/auth/classroom.profile.emails'
      ],
      timeout: 60000,
      maxRetries: 3,
      ...config
    };

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize Google Auth
    this.auth = new google.auth.GoogleAuth({
      credentials: this.config.credentials,
      scopes: this.config.scopes
    });

    this.classroom = google.classroom({ version: 'v1', auth: this.auth });

    if (!this.config.credentials) {
      throw new Error('Google service account credentials are required');
    }
  }

  async syncTrainingCompletions(syncLogId: string, options: ClassroomSyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0, updated = 0, failed = 0;
    const errors: string[] = [];

    try {
      await this.updateSyncLog(syncLogId, { status: 'in_progress' });

      // Get training modules with Classroom integration
      const modules = await this.getActiveTrainingModules(options);

      if (options.dryRun) {
        return {
          success: true,
          processed: modules.length,
          created: 0,
          updated: 0,
          failed: 0,
          duration: Date.now() - startTime,
          dryRun: true,
          preview: modules.slice(0, 3)
        };
      }

      // Process each module
      for (const module of modules) {
        try {
          const moduleResult = await this.syncModuleCompletions(module, options);
          processed += moduleResult.processed;
          updated += moduleResult.updated;
          failed += moduleResult.failed;
          errors.push(...moduleResult.errors);
        } catch (error) {
          console.error(`Failed to sync module ${module.id}:`, error);
          errors.push(`Module ${module.module_name}: ${error.message}`);
          failed++;
        }
      }

      // Update sync log with results
      await this.updateSyncLog(syncLogId, {
        status: failed > 0 ? 'partial' : 'completed',
        records_processed: processed,
        records_updated: updated,
        records_failed: failed,
        completed_at: new Date(),
        errors: errors.length > 0 ? errors : null
      });

      // Log audit trail
      await auditLog({
        action: 'classroom_sync_completed',
        resourceType: 'training_completion_sync',
        resourceId: syncLogId,
        metadata: {
          processed, updated, failed,
          duration: Date.now() - startTime,
          modules_synced: modules.length,
          options
        }
      });

      return {
        success: true,
        processed,
        created: 0, // Completions are updated, not created
        updated,
        failed,
        duration: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Google Classroom sync failed:', error);
      
      await this.updateSyncLog(syncLogId, {
        status: 'failed',
        completed_at: new Date(),
        errors: [error.message]
      });

      await auditLog({
        action: 'classroom_sync_failed',
        resourceType: 'training_completion_sync',
        resourceId: syncLogId,
        metadata: { error: error.message, options }
      });

      throw error;
    }
  }

  private async getActiveTrainingModules(options: ClassroomSyncOptions) {
    let query = this.supabase
      .from('training_modules')
      .select('id, module_name, classroom_course_id, classroom_coursework_id, due_date, last_synced_at')
      .eq('is_active', true)
      .not('classroom_course_id', 'is', null);

    if (options.courseId) {
      query = query.eq('classroom_course_id', options.courseId);
    }

    if (options.moduleId) {
      query = query.eq('id', options.moduleId);
    }

    if (options.incremental) {
      // Only sync modules modified in last 6 hours
      const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      query = query.or(`last_synced_at.is.null,last_synced_at.lt.${since}`);
    }

    const { data: modules, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch training modules: ${error.message}`);
    }

    return modules || [];
  }

  private async syncModuleCompletions(module: any, options: ClassroomSyncOptions): Promise<{
    processed: number;
    updated: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0, updated = 0, failed = 0;
    const errors: string[] = [];

    try {
      // Fetch submissions from Google Classroom
      const submissions = await this.fetchClassroomSubmissions(
        module.classroom_course_id,
        module.classroom_coursework_id
      );

      // Process submissions in batches
      const batchSize = options.batchSize || 20;
      for (let i = 0; i < submissions.length; i += batchSize) {
        const batch = submissions.slice(i, i + batchSize);
        const batchResult = await this.processSubmissionBatch(batch, module);
        
        processed += batchResult.processed;
        updated += batchResult.updated;
        failed += batchResult.failed;
        errors.push(...batchResult.errors);
      }

      // Update module sync timestamp
      await this.supabase
        .from('training_modules')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', module.id);

    } catch (error) {
      console.error(`Failed to sync module ${module.id}:`, error);
      errors.push(`Module sync error: ${error.message}`);
      failed++;
    }

    return { processed, updated, failed, errors };
  }

  private async fetchClassroomSubmissions(courseId: string, courseworkId: string): Promise<GoogleClassroomSubmission[]> {
    try {
      const response = await this.classroom.courses.courseWork.studentSubmissions.list({
        courseId,
        courseWorkId: courseworkId,
        pageSize: 1000,
        fields: 'studentSubmissions(id,userId,state,assignedGrade,submissionHistory,creationTime,updateTime)'
      });

      return response.data.studentSubmissions || [];
    } catch (error) {
      if (error.code === 403) {
        throw new Error(`Access denied to course ${courseId}. Check service account permissions.`);
      }
      if (error.code === 404) {
        throw new Error(`Course or coursework not found: ${courseId}/${courseworkId}`);
      }
      throw new Error(`Google Classroom API error: ${error.message}`);
    }
  }

  private async processSubmissionBatch(submissions: GoogleClassroomSubmission[], module: any): Promise<{
    processed: number;
    updated: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0, updated = 0, failed = 0;
    const errors: string[] = [];

    for (const submission of submissions) {
      try {
        // Find employee by Classroom user ID
        const employee = await this.findEmployeeByClassroomUserId(submission.userId);
        if (!employee) {
          errors.push(`No employee found for Classroom user ${submission.userId}`);
          failed++;
          continue;
        }

        // Transform submission data
        const completionData = await this.transformSubmissionToCompletion(submission, module, employee);

        // Update or create completion record
        const { error } = await this.supabase
          .from('training_completions')
          .upsert(completionData, {
            onConflict: 'employee_id,module_id,due_date'
          });

        if (error) {
          throw error;
        }

        updated++;
        processed++;

      } catch (error) {
        console.error(`Failed to process submission ${submission.id}:`, error);
        errors.push(`Submission ${submission.id}: ${error.message}`);
        failed++;
      }
    }

    return { processed, updated, failed, errors };
  }

  private async findEmployeeByClassroomUserId(userId: string): Promise<any> {
    // First try to find by cached classroom_user_id
    let { data: employee } = await this.supabase
      .from('employees')
      .select('id, email, full_name')
      .eq('classroom_user_id', userId)
      .eq('status', 'active')
      .single();

    if (employee) {
      return employee;
    }

    // If not found, fetch user profile from Classroom and match by email
    try {
      const profile = await this.getUserProfile(userId);
      
      if (profile.emailAddress) {
        const { data: employeeByEmail } = await this.supabase
          .from('employees')
          .select('id, email, full_name')
          .eq('email', profile.emailAddress)
          .eq('status', 'active')
          .single();

        if (employeeByEmail) {
          // Cache the classroom_user_id for future lookups
          await this.supabase
            .from('employees')
            .update({ classroom_user_id: userId })
            .eq('id', employeeByEmail.id);

          return employeeByEmail;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch user profile for ${userId}:`, error);
    }

    return null;
  }

  private async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await this.classroom.userProfiles.get({
        userId: userId,
        fields: 'id,name,emailAddress'
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  private async transformSubmissionToCompletion(
    submission: GoogleClassroomSubmission,
    module: any,
    employee: any
  ): Promise<Partial<TrainingCompletion>> {
    const submissionHistory = submission.submissionHistory || [];
    const latestSubmission = submissionHistory[submissionHistory.length - 1];
    
    // Determine completion status and date
    let status = 'not_started';
    let completionDate = null;
    let score = null;

    if (submission.state === 'TURNED_IN' || submission.state === 'RETURNED') {
      if (submission.assignedGrade !== undefined && submission.assignedGrade !== null) {
        score = parseFloat(submission.assignedGrade.toString());
        status = score >= 80 ? 'completed' : 'in_progress';
        completionDate = submission.updateTime || latestSubmission?.submissionTime;
      } else if (submission.state === 'TURNED_IN') {
        status = 'in_progress'; // Submitted but not graded
        completionDate = submission.updateTime || latestSubmission?.submissionTime;
      }
    } else if (submission.state === 'CREATED') {
      status = 'in_progress';
    }

    // Check if overdue
    const dueDate = new Date(module.due_date);
    if (status !== 'completed' && dueDate < new Date()) {
      status = 'overdue';
    }

    return {
      employee_id: employee.id,
      module_id: module.id,
      due_date: module.due_date,
      completion_date: completionDate ? new Date(completionDate).toISOString() : null,
      score,
      status,
      classroom_submission_id: submission.id,
      classroom_submission_data: submission,
      classroom_grade: submission.assignedGrade,
      attempts_count: submissionHistory.length,
      is_required: true,
      last_synced_at: new Date().toISOString(),
      sync_status: 'synced',
      sync_errors: null
    };
  }

  private async updateSyncLog(syncLogId: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from('compliance_sync_logs')
      .update(updates)
      .eq('id', syncLogId);

    if (error) {
      console.error('Failed to update sync log:', error);
    }
  }

  // Get available courses
  async getCourses(): Promise<any[]> {
    try {
      const response = await this.classroom.courses.list({
        pageSize: 100,
        courseStates: ['ACTIVE'],
        fields: 'courses(id,name,description,creationTime,updateTime)'
      });

      return response.data.courses || [];
    } catch (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  }

  // Get coursework for a specific course
  async getCoursework(courseId: string): Promise<any[]> {
    try {
      const response = await this.classroom.courses.courseWork.list({
        courseId,
        pageSize: 100,
        fields: 'courseWork(id,title,description,state,creationTime,updateTime,dueDate,dueTime)'
      });

      return response.data.courseWork || [];
    } catch (error) {
      throw new Error(`Failed to fetch coursework for course ${courseId}: ${error.message}`);
    }
  }

  // Health check method
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await this.classroom.courses.list({
        pageSize: 1,
        fields: 'courses(id)'
      });

      return {
        healthy: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // Get sync statistics
  async getSyncStatistics(days: number = 30): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    avgDuration: number;
    lastSync: Date | null;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data: syncLogs } = await this.supabase
      .from('compliance_sync_logs')
      .select('status, duration_seconds, started_at')
      .eq('sync_source', 'classroom')
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: false });

    if (!syncLogs || syncLogs.length === 0) {
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        avgDuration: 0,
        lastSync: null
      };
    }

    const successful = syncLogs.filter(log => log.status === 'completed').length;
    const failed = syncLogs.filter(log => log.status === 'failed').length;
    const avgDuration = syncLogs.reduce((sum, log) => sum + (log.duration_seconds || 0), 0) / syncLogs.length;

    return {
      totalSyncs: syncLogs.length,
      successfulSyncs: successful,
      failedSyncs: failed,
      avgDuration: Math.round(avgDuration),
      lastSync: syncLogs[0] ? new Date(syncLogs[0].started_at) : null
    };
  }

  // Validate classroom integration setup
  async validateClassroomIntegration(): Promise<{
    valid: boolean;
    issues: string[];
    coursesAccessible: number;
  }> {
    const issues: string[] = [];
    let coursesAccessible = 0;

    try {
      // Test basic access
      const courses = await this.getCourses();
      coursesAccessible = courses.length;

      if (courses.length === 0) {
        issues.push('No accessible courses found');
      }

      // Test if we have the required training modules configured
      const { data: modules } = await this.supabase
        .from('training_modules')
        .select('classroom_course_id')
        .eq('is_active', true)
        .not('classroom_course_id', 'is', null);

      if (!modules || modules.length === 0) {
        issues.push('No training modules configured with Classroom courses');
      } else {
        // Verify each configured course is accessible
        const courseIds = [...new Set(modules.map(m => m.classroom_course_id))];
        for (const courseId of courseIds) {
          const courseExists = courses.some(c => c.id === courseId);
          if (!courseExists) {
            issues.push(`Configured course ${courseId} is not accessible`);
          }
        }
      }

    } catch (error) {
      issues.push(`Authentication failed: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      coursesAccessible
    };
  }
}