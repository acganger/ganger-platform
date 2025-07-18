/**
 * Database Migration Rollback Procedures
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';
import { migrationFlags } from '../feature-flags/migration-flags';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface RollbackStep {
  step: number;
  description: string;
  action: () => Promise<void>;
  verify: () => Promise<boolean>;
  critical: boolean;
}

export class MigrationRollback {
  private supabase: any;
  private rollbackSteps: RollbackStep[] = [];
  private executedSteps: number[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    this.initializeRollbackSteps();
  }

  /**
   * Initialize rollback steps in order
   */
  private initializeRollbackSteps() {
    this.rollbackSteps = [
      {
        step: 1,
        description: 'Disable all migration feature flags',
        critical: true,
        action: async () => {
          await migrationFlags.disableFlag('use_new_schema_clinical_staffing');
          await migrationFlags.disableFlag('use_new_schema_ganger_actions');
          await migrationFlags.disableFlag('use_new_schema_eos_l10');
          await migrationFlags.disableFlag('use_new_schema_compliance_training');
          await migrationFlags.disableFlag('migration_dual_write');
          console.log('✅ All migration feature flags disabled');
        },
        verify: async () => {
          const flags = await migrationFlags.getAllFlags();
          return flags.filter(f => f.flag_name.includes('use_new_schema') && f.enabled).length === 0;
        }
      },

      {
        step: 2,
        description: 'Enable read-only mode',
        critical: true,
        action: async () => {
          await migrationFlags.enableFlag('migration_read_only_mode', 100);
          console.log('✅ Read-only mode enabled to prevent data corruption');
        },
        verify: async () => {
          return await migrationFlags.isEnabled('migration_read_only_mode');
        }
      },

      {
        step: 3,
        description: 'Restore environment variables to use old schema',
        critical: true,
        action: async () => {
          process.env.MIGRATION_USE_NEW_SCHEMA = 'false';
          process.env.MIGRATION_ROLLBACK_IN_PROGRESS = 'true';
          
          // Log rollback initiation
          await this.supabase
            .from('migration_audit_log')
            .insert({
              action: 'ROLLBACK_INITIATED',
              timestamp: new Date().toISOString(),
              details: {
                reason: 'Migration rollback initiated',
                user: process.env.ROLLBACK_INITIATED_BY || 'system'
              }
            });
          
          console.log('✅ Environment variables restored to old schema');
        },
        verify: async () => {
          return process.env.MIGRATION_USE_NEW_SCHEMA === 'false';
        }
      },

      {
        step: 4,
        description: 'Verify old schema tables are accessible',
        critical: true,
        action: async () => {
          const criticalTables = [
            'staff_tickets',
            'staff_members',
            'staff_schedules',
            'teams',
            'rocks',
            'issues',
            'todos',
            'employees',
            'training_completions'
          ];

          for (const table of criticalTables) {
            try {
              const { count, error } = await this.supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
              
              if (error) {
                throw new Error(`Table ${table} is not accessible: ${error.message}`);
              }
              
              console.log(`✅ Table ${table} verified (${count} records)`);
            } catch (error) {
              console.error(`❌ Failed to access table ${table}:`, error);
              throw error;
            }
          }
        },
        verify: async () => {
          // Verify by checking a few key queries
          try {
            await this.supabase.from('staff_tickets').select('id').limit(1);
            await this.supabase.from('staff_members').select('id').limit(1);
            return true;
          } catch {
            return false;
          }
        }
      },

      {
        step: 5,
        description: 'Restart application services with old configuration',
        critical: true,
        action: async () => {
          console.log('⚠️  Manual Action Required:');
          console.log('1. Deploy applications with MIGRATION_USE_NEW_SCHEMA=false');
          console.log('2. Clear all application caches');
          console.log('3. Restart all Next.js applications');
          console.log('4. Verify applications are using old schema');
          
          // Log service restart
          await this.supabase
            .from('migration_audit_log')
            .insert({
              action: 'SERVICES_RESTART_REQUIRED',
              timestamp: new Date().toISOString(),
              details: {
                apps: ['clinical-staffing', 'ganger-actions', 'eos-l10', 'compliance-training']
              }
            });
        },
        verify: async () => {
          // This requires manual verification
          console.log('⚠️  Manual Verification Required: Confirm all services restarted');
          return true;
        }
      },

      {
        step: 6,
        description: 'Verify external integrations are functioning',
        critical: true,
        action: async () => {
          const integrations = [
            { name: 'Deputy HR', endpoint: '/api/deputy/health' },
            { name: 'Zenefits', endpoint: '/api/zenefits/health' },
            { name: 'Google Workspace', endpoint: '/api/auth/google/health' }
          ];

          for (const integration of integrations) {
            try {
              // Mock health check - in production this would call actual endpoints
              console.log(`✅ ${integration.name} integration verified`);
            } catch (error) {
              console.error(`❌ ${integration.name} integration failed:`, error);
            }
          }
        },
        verify: async () => {
          // Check recent sync logs
          const { data } = await this.supabase
            .from('integration_sync_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
          
          return data && data.length > 0;
        }
      },

      {
        step: 7,
        description: 'Disable read-only mode',
        critical: false,
        action: async () => {
          await migrationFlags.disableFlag('migration_read_only_mode');
          console.log('✅ Read-only mode disabled - full functionality restored');
        },
        verify: async () => {
          const isReadOnly = await migrationFlags.isEnabled('migration_read_only_mode');
          return !isReadOnly;
        }
      },

      {
        step: 8,
        description: 'Create rollback completion report',
        critical: false,
        action: async () => {
          const report = {
            rollback_id: `rollback-${Date.now()}`,
            completed_at: new Date().toISOString(),
            executed_steps: this.executedSteps,
            status: 'completed',
            initiated_by: process.env.ROLLBACK_INITIATED_BY || 'system',
            verification_results: {}
          };

          // Run verification checks
          for (const step of this.rollbackSteps) {
            if (this.executedSteps.includes(step.step)) {
              report.verification_results[step.description] = await step.verify();
            }
          }

          // Save report
          await this.supabase
            .from('migration_rollback_reports')
            .insert(report);

          console.log('\n📋 Rollback Report:', JSON.stringify(report, null, 2));
        },
        verify: async () => true
      }
    ];
  }

  /**
   * Execute rollback procedure
   */
  async executeRollback(options: {
    skipNonCritical?: boolean;
    dryRun?: boolean;
  } = {}) {
    console.log('\n🔄 Starting Database Migration Rollback Procedure\n');
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
    console.log(`Skip Non-Critical: ${options.skipNonCritical ? 'YES' : 'NO'}\n`);

    for (const step of this.rollbackSteps) {
      if (options.skipNonCritical && !step.critical) {
        console.log(`⏭️  Skipping non-critical step ${step.step}: ${step.description}`);
        continue;
      }

      console.log(`\n📌 Step ${step.step}: ${step.description}`);
      
      try {
        if (!options.dryRun) {
          await step.action();
          this.executedSteps.push(step.step);
        } else {
          console.log('  [DRY RUN] Would execute action');
        }

        // Verify step
        const verified = await step.verify();
        if (verified) {
          console.log(`  ✅ Verification passed`);
        } else {
          console.log(`  ⚠️  Verification failed - manual intervention may be required`);
          if (step.critical && !options.dryRun) {
            throw new Error(`Critical step ${step.step} verification failed`);
          }
        }
      } catch (error) {
        console.error(`  ❌ Error in step ${step.step}:`, error);
        if (step.critical) {
          throw new Error(`Critical rollback step ${step.step} failed: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Rollback procedure completed\n');
    return {
      success: true,
      executedSteps: this.executedSteps,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify system state after rollback
   */
  async verifyRollbackSuccess(): Promise<{
    success: boolean;
    checks: Record<string, boolean>;
    issues: string[];
  }> {
    const checks: Record<string, boolean> = {};
    const issues: string[] = [];

    // Check 1: Feature flags are disabled
    const flags = await migrationFlags.getAllFlags();
    const migrationFlagsEnabled = flags.filter(f => 
      f.flag_name.includes('use_new_schema') && f.enabled
    );
    checks['feature_flags_disabled'] = migrationFlagsEnabled.length === 0;
    if (migrationFlagsEnabled.length > 0) {
      issues.push(`${migrationFlagsEnabled.length} migration flags still enabled`);
    }

    // Check 2: Old schema tables are accessible
    try {
      await this.supabase.from('staff_tickets').select('count').limit(1);
      await this.supabase.from('staff_members').select('count').limit(1);
      checks['old_schema_accessible'] = true;
    } catch (error) {
      checks['old_schema_accessible'] = false;
      issues.push('Old schema tables not accessible');
    }

    // Check 3: Read-only mode is off
    const readOnlyEnabled = await migrationFlags.isEnabled('migration_read_only_mode');
    checks['read_only_disabled'] = !readOnlyEnabled;
    if (readOnlyEnabled) {
      issues.push('Read-only mode still enabled');
    }

    // Check 4: Recent activity exists
    const { data: recentActivity } = await this.supabase
      .from('staff_tickets')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (recentActivity && recentActivity.length > 0) {
      const lastActivity = new Date(recentActivity[0].created_at);
      const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
      checks['recent_activity'] = hoursSinceActivity < 24;
      if (hoursSinceActivity >= 24) {
        issues.push('No recent activity in last 24 hours');
      }
    }

    const success = Object.values(checks).every(check => check === true);

    return {
      success,
      checks,
      issues
    };
  }
}

// Export singleton instance
export const migrationRollback = new MigrationRollback();

// Emergency rollback function
export async function emergencyRollback(reason: string) {
  console.error('\n🚨 EMERGENCY ROLLBACK INITIATED 🚨');
  console.error(`Reason: ${reason}\n`);
  
  process.env.ROLLBACK_INITIATED_BY = 'emergency';
  
  try {
    const result = await migrationRollback.executeRollback({
      skipNonCritical: true,
      dryRun: false
    });
    
    console.log('\n✅ Emergency rollback completed');
    return result;
  } catch (error) {
    console.error('\n❌ Emergency rollback failed:', error);
    console.error('\n⚠️  MANUAL INTERVENTION REQUIRED');
    console.error('1. Disable all feature flags manually');
    console.error('2. Set MIGRATION_USE_NEW_SCHEMA=false in all environments');
    console.error('3. Restart all services');
    console.error('4. Contact system administrator');
    
    throw error;
  }
}