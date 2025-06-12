import { createClient } from '@supabase/supabase-js';
import { auditLog } from '@ganger/utils/server';
import type { Employee, SyncResult, ZenefitsEmployee, SyncLogEntry } from '@ganger/types';

export interface ZenefitsConfig {
  apiKey: string;
  baseUrl: string;
  companyId: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ZenefitsSyncOptions {
  fullSync?: boolean;
  department?: string;
  batchSize?: number;
  dryRun?: boolean;
}

export class ZenefitsComplianceSync {
  private config: ZenefitsConfig;
  private supabase;

  constructor(config?: Partial<ZenefitsConfig>) {
    this.config = {
      apiKey: process.env.ZENEFITS_API_KEY!,
      baseUrl: process.env.ZENEFITS_API_URL || 'https://api.zenefits.com/core',
      companyId: process.env.ZENEFITS_COMPANY_ID!,
      timeout: 30000,
      maxRetries: 3,
      ...config
    };

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!this.config.apiKey || !this.config.companyId) {
      throw new Error('Zenefits API key and company ID are required');
    }
  }

  async syncEmployees(syncLogId: string, options: ZenefitsSyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0, created = 0, updated = 0, failed = 0;
    const errors: string[] = [];

    try {
      await this.updateSyncLog(syncLogId, { status: 'in_progress' });

      // Fetch employees from Zenefits
      const zenefitsEmployees = await this.fetchZenefitsEmployees(options);
      
      if (options.dryRun) {
        return {
          success: true,
          processed: zenefitsEmployees.length,
          created: 0,
          updated: 0,
          failed: 0,
          duration: Date.now() - startTime,
          dryRun: true,
          preview: zenefitsEmployees.slice(0, 5)
        };
      }

      // Process employees in batches
      const batchSize = options.batchSize || 50;
      for (let i = 0; i < zenefitsEmployees.length; i += batchSize) {
        const batch = zenefitsEmployees.slice(i, i + batchSize);
        const batchResult = await this.processBatch(batch, syncLogId);
        
        processed += batchResult.processed;
        created += batchResult.created;
        updated += batchResult.updated;
        failed += batchResult.failed;
        errors.push(...batchResult.errors);
      }

      // Auto-assign training modules for new employees
      if (created > 0) {
        await this.assignNewHireTraining(syncLogId);
      }

      // Update sync log with final results
      await this.updateSyncLog(syncLogId, {
        status: failed > 0 ? 'partial' : 'completed',
        records_processed: processed,
        records_created: created,
        records_updated: updated,
        records_failed: failed,
        completed_at: new Date(),
        errors: errors.length > 0 ? errors : null
      });

      // Log audit trail
      await auditLog({
        action: 'zenefits_sync_completed',
        resourceType: 'employee_sync',
        resourceId: syncLogId,
        metadata: {
          processed, created, updated, failed,
          duration: Date.now() - startTime,
          options
        }
      });

      return {
        success: true,
        processed,
        created,
        updated,
        failed,
        duration: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Zenefits sync failed:', error);
      
      await this.updateSyncLog(syncLogId, {
        status: 'failed',
        completed_at: new Date(),
        errors: [error.message]
      });

      await auditLog({
        action: 'zenefits_sync_failed',
        resourceType: 'employee_sync',
        resourceId: syncLogId,
        metadata: { error: error.message, options }
      });

      throw error;
    }
  }

  private async fetchZenefitsEmployees(options: ZenefitsSyncOptions): Promise<ZenefitsEmployee[]> {
    const url = new URL(`${this.config.baseUrl}/people`);
    url.searchParams.set('company', this.config.companyId);
    url.searchParams.set('includes', 'department,location,manager,work_email');
    url.searchParams.set('employments__company', this.config.companyId);
    
    if (options.department) {
      url.searchParams.set('employments__department__name', options.department);
    }

    if (!options.fullSync) {
      // Incremental sync - only fetch employees modified in last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      url.searchParams.set('modified_since', since);
    }

    const response = await this.makeZenefitsRequest(url.toString());
    
    if (!response.ok) {
      throw new Error(`Zenefits API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  private async processBatch(employees: ZenefitsEmployee[], syncLogId: string): Promise<{
    processed: number;
    created: number;
    updated: number;
    failed: number;
    errors: string[];
  }> {
    let processed = 0, created = 0, updated = 0, failed = 0;
    const errors: string[] = [];

    for (const zenEmployee of employees) {
      try {
        const employeeData = await this.transformZenefitsEmployee(zenEmployee);
        
        const { data: existingEmployee } = await this.supabase
          .from('employees')
          .select('id, email, updated_at')
          .eq('zenefits_id', zenEmployee.id)
          .single();

        if (existingEmployee) {
          // Update existing employee
          const { error } = await this.supabase
            .from('employees')
            .update({
              ...employeeData,
              last_synced_at: new Date().toISOString(),
              sync_status: 'synced',
              sync_errors: null
            })
            .eq('id', existingEmployee.id);

          if (error) {
            throw error;
          }
          updated++;
        } else {
          // Create new employee
          const { data: newEmployee, error } = await this.supabase
            .from('employees')
            .insert({
              ...employeeData,
              zenefits_id: zenEmployee.id,
              last_synced_at: new Date().toISOString(),
              sync_status: 'synced'
            })
            .select('id')
            .single();

          if (error) {
            throw error;
          }

          created++;
          
          // Queue new hire training assignment
          await this.queueNewHireTraining(newEmployee.id, zenEmployee);
        }
        
        processed++;
      } catch (error) {
        console.error(`Failed to sync employee ${zenEmployee.id}:`, error);
        errors.push(`Employee ${zenEmployee.id}: ${error.message}`);
        
        // Update employee sync status to error
        await this.supabase
          .from('employees')
          .update({
            sync_status: 'error',
            sync_errors: [error.message],
            last_synced_at: new Date().toISOString()
          })
          .eq('zenefits_id', zenEmployee.id);
        
        failed++;
      }
    }

    return { processed, created, updated, failed, errors };
  }

  private transformZenefitsEmployee(zenEmployee: ZenefitsEmployee): Partial<Employee> {
    const employment = zenEmployee.employments?.[0];
    const department = employment?.department;
    const location = employment?.location;

    return {
      first_name: zenEmployee.first_name,
      last_name: zenEmployee.last_name,
      email: zenEmployee.work_email || zenEmployee.personal_email,
      department: department?.name,
      job_title: employment?.title,
      start_date: employment?.start_date ? new Date(employment.start_date) : new Date(),
      status: employment?.status === 'active' ? 'active' : 'inactive',
      manager_email: employment?.manager?.work_email,
      location: this.normalizeLocation(location?.name),
      zenefits_data: zenEmployee
    };
  }

  private normalizeLocation(locationName?: string): string | null {
    if (!locationName) return null;
    
    const normalized = locationName.toLowerCase().trim();
    
    if (normalized.includes('ann arbor')) return 'Ann Arbor';
    if (normalized.includes('wixom')) return 'Wixom';
    if (normalized.includes('plymouth')) return 'Plymouth';
    
    return locationName; // Return original if no match
  }

  private async queueNewHireTraining(employeeId: string, zenEmployee: ZenefitsEmployee): Promise<void> {
    // Get active new hire training modules
    const { data: newHireModules } = await this.supabase
      .from('training_modules')
      .select('id, month_key, due_date, grace_period_days')
      .eq('is_active', true)
      .eq('is_required_for_new_hires', true);

    if (!newHireModules || newHireModules.length === 0) {
      return;
    }

    // Create training assignments for new hire
    const trainingAssignments = newHireModules.map(module => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (module.grace_period_days || 7));
      
      return {
        employee_id: employeeId,
        module_id: module.id,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'not_started',
        is_required: true,
        sync_status: 'synced'
      };
    });

    const { error } = await this.supabase
      .from('training_completions')
      .insert(trainingAssignments);

    if (error && !error.message.includes('duplicate')) {
      console.error('Failed to create new hire training assignments:', error);
    }

    // Log new hire training assignment
    await auditLog({
      action: 'new_hire_training_assigned',
      resourceType: 'training_assignment',
      resourceId: employeeId,
      metadata: {
        employee_name: `${zenEmployee.first_name} ${zenEmployee.last_name}`,
        modules_assigned: newHireModules.length
      }
    });
  }

  private async assignNewHireTraining(syncLogId: string): Promise<void> {
    // Get employees created in this sync
    const { data: syncLog } = await this.supabase
      .from('compliance_sync_logs')
      .select('started_at')
      .eq('id', syncLogId)
      .single();

    if (!syncLog) return;

    const { data: newEmployees } = await this.supabase
      .from('employees')
      .select('id, first_name, last_name, department')
      .gte('created_at', syncLog.started_at)
      .eq('status', 'active');

    if (!newEmployees || newEmployees.length === 0) {
      return;
    }

    for (const employee of newEmployees) {
      // Check if training is already assigned
      const { data: existingAssignments } = await this.supabase
        .from('training_completions')
        .select('id')
        .eq('employee_id', employee.id)
        .limit(1);

      if (!existingAssignments || existingAssignments.length === 0) {
        await this.queueNewHireTraining(employee.id, {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name
        } as ZenefitsEmployee);
      }
    }
  }

  private async makeZenefitsRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const requestOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: this.config.timeout,
      ...options
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60');
          if (attempt < this.config.maxRetries!) {
            await this.delay(retryAfter * 1000);
            continue;
          }
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries!) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  private async updateSyncLog(syncLogId: string, updates: Partial<SyncLogEntry>): Promise<void> {
    const { error } = await this.supabase
      .from('compliance_sync_logs')
      .update(updates)
      .eq('id', syncLogId);

    if (error) {
      console.error('Failed to update sync log:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const url = `${this.config.baseUrl}/people?limit=1&company=${this.config.companyId}`;
      const response = await this.makeZenefitsRequest(url);
      
      if (response.ok) {
        return {
          healthy: true,
          latency: Date.now() - startTime
        };
      } else {
        return {
          healthy: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
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
      .eq('sync_source', 'zenefits')
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
}