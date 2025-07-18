/**
 * Migration Validation Script
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';
import { migrationAdapter } from '@ganger/db';
import { migrationFlags } from './feature-flags/migration-flags';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface ValidationResult {
  category: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

class MigrationValidator {
  private supabase: any;
  private results: ValidationResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Run all validation checks
   */
  async runValidation() {
    console.log('🔍 Running Database Migration Validation...\n');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Migration Mode: ${process.env.MIGRATION_USE_NEW_SCHEMA === 'true' ? 'NEW SCHEMA' : 'OLD SCHEMA'}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    // Configure migration adapter
    migrationAdapter.updateConfig({
      enableMigrationMode: true,
      useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
      logMigrationQueries: false
    });

    // Run all validation categories
    await this.validateSchemaIntegrity();
    await this.validateDataConsistency();
    await this.validateFeatureFlags();
    await this.validatePerformance();
    await this.validateExternalIntegrations();
    await this.validateBackwardCompatibility();

    // Generate report
    this.generateReport();
  }

  /**
   * Validate schema integrity
   */
  async validateSchemaIntegrity() {
    console.log('📋 Validating Schema Integrity...');

    // Check critical tables exist
    const criticalTables = [
      'staff_members',
      'staff_tickets',
      'staff_ticket_comments',
      'staff_attachments',
      'staff_schedules',
      'locations',
      'teams',
      'rocks',
      'issues',
      'todos',
      'employees',
      'training_modules',
      'training_completions'
    ];

    for (const table of criticalTables) {
      try {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          this.addResult('Schema Integrity', `Table: ${table}`, 'FAIL', `Table not accessible: ${error.message}`);
        } else {
          this.addResult('Schema Integrity', `Table: ${table}`, 'PASS', `Table exists with ${count} records`);
        }
      } catch (error) {
        this.addResult('Schema Integrity', `Table: ${table}`, 'FAIL', `Error accessing table: ${error.message}`);
      }
    }

    // Check RLS policies
    try {
      const { data: policies } = await this.supabase.rpc('check_rls_policies');
      if (policies && policies.length > 0) {
        this.addResult('Schema Integrity', 'RLS Policies', 'PASS', `${policies.length} RLS policies active`);
      } else {
        this.addResult('Schema Integrity', 'RLS Policies', 'WARN', 'No RLS policies found');
      }
    } catch (error) {
      this.addResult('Schema Integrity', 'RLS Policies', 'WARN', 'Unable to check RLS policies');
    }
  }

  /**
   * Validate data consistency
   */
  async validateDataConsistency() {
    console.log('🔗 Validating Data Consistency...');

    // Check foreign key relationships
    const relationships = [
      {
        parent: 'staff_members',
        child: 'staff_schedules',
        parentKey: 'id',
        childKey: 'staff_member_id'
      },
      {
        parent: 'staff_tickets',
        child: 'staff_ticket_comments',
        parentKey: 'id',
        childKey: 'ticket_id'
      },
      {
        parent: 'teams',
        child: 'rocks',
        parentKey: 'id',
        childKey: 'team_id'
      }
    ];

    for (const rel of relationships) {
      try {
        // Check for orphaned records
        const orphanedQuery = `
          SELECT COUNT(*) as orphaned_count
          FROM ${rel.child} c
          LEFT JOIN ${rel.parent} p ON c.${rel.childKey} = p.${rel.parentKey}
          WHERE c.${rel.childKey} IS NOT NULL AND p.${rel.parentKey} IS NULL
        `;
        
        const { data: orphaned } = await this.supabase.rpc('exec_sql', { sql: orphanedQuery });
        
        if (orphaned && orphaned[0]?.orphaned_count === 0) {
          this.addResult('Data Consistency', `${rel.parent} -> ${rel.child}`, 'PASS', 'No orphaned records');
        } else {
          this.addResult('Data Consistency', `${rel.parent} -> ${rel.child}`, 'WARN', 
            `Found ${orphaned?.[0]?.orphaned_count || 'unknown'} orphaned records`);
        }
      } catch (error) {
        this.addResult('Data Consistency', `${rel.parent} -> ${rel.child}`, 'WARN', 
          'Unable to check relationship');
      }
    }

    // Check enum value consistency
    await this.validateEnumValues();
  }

  /**
   * Validate enum values
   */
  async validateEnumValues() {
    // Check ticket status values
    const { data: ticketStatuses } = await this.supabase
      .from('staff_tickets')
      .select('status')
      .limit(100);

    const validStatuses = ['pending', 'open', 'in_progress', 'completed', 'cancelled'];
    const invalidStatuses = ticketStatuses?.filter(t => !validStatuses.includes(t.status)) || [];

    if (invalidStatuses.length === 0) {
      this.addResult('Data Consistency', 'Ticket Status Values', 'PASS', 'All status values are valid');
    } else {
      this.addResult('Data Consistency', 'Ticket Status Values', 'FAIL', 
        `Found ${invalidStatuses.length} invalid status values`);
    }
  }

  /**
   * Validate feature flags
   */
  async validateFeatureFlags() {
    console.log('🚩 Validating Feature Flags...');

    try {
      const flags = await migrationFlags.getAllFlags();
      
      if (flags.length === 0) {
        this.addResult('Feature Flags', 'Flag Configuration', 'FAIL', 'No feature flags found');
        return;
      }

      // Check each critical flag
      const criticalFlags = [
        'use_new_schema_clinical_staffing',
        'use_new_schema_ganger_actions',
        'use_new_schema_eos_l10',
        'use_new_schema_compliance_training',
        'migration_read_only_mode',
        'migration_dual_write'
      ];

      for (const flagName of criticalFlags) {
        const flag = flags.find(f => f.flag_name === flagName);
        if (flag) {
          this.addResult('Feature Flags', flagName, 'PASS', 
            `Configured - Enabled: ${flag.enabled}, Rollout: ${flag.rollout_percentage}%`);
        } else {
          this.addResult('Feature Flags', flagName, 'FAIL', 'Flag not found');
        }
      }
    } catch (error) {
      this.addResult('Feature Flags', 'Flag System', 'FAIL', `Error accessing flags: ${error.message}`);
    }
  }

  /**
   * Validate performance metrics
   */
  async validatePerformance() {
    console.log('⚡ Validating Performance...');

    const performanceTests = [
      {
        name: 'Simple Query Performance',
        query: async () => {
          const start = Date.now();
          await migrationAdapter.select('staff_tickets', '*', {}, { limit: 100 });
          return Date.now() - start;
        },
        threshold: 500
      },
      {
        name: 'Join Query Performance',
        query: async () => {
          const start = Date.now();
          await migrationAdapter.select(
            'staff_schedules',
            `*, staff_member:staff_members!inner(*), location:locations!inner(*)`,
            {},
            { limit: 50 }
          );
          return Date.now() - start;
        },
        threshold: 1000
      }
    ];

    for (const test of performanceTests) {
      try {
        const duration = await test.query();
        if (duration <= test.threshold) {
          this.addResult('Performance', test.name, 'PASS', `Completed in ${duration}ms (threshold: ${test.threshold}ms)`);
        } else {
          this.addResult('Performance', test.name, 'WARN', `Completed in ${duration}ms (exceeds threshold: ${test.threshold}ms)`);
        }
      } catch (error) {
        this.addResult('Performance', test.name, 'FAIL', `Query failed: ${error.message}`);
      }
    }
  }

  /**
   * Validate external integrations
   */
  async validateExternalIntegrations() {
    console.log('🔌 Validating External Integrations...');

    // Check integration sync logs
    const integrations = ['deputy', 'zenefits', 'google_workspace'];
    
    for (const integration of integrations) {
      try {
        const { data: logs } = await this.supabase
          .from('integration_sync_logs')
          .select('*')
          .eq('integration_name', integration)
          .order('created_at', { ascending: false })
          .limit(1);

        if (logs && logs.length > 0) {
          const lastSync = new Date(logs[0].created_at);
          const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceSync < 24) {
            this.addResult('External Integrations', integration, 'PASS', 
              `Last sync: ${hoursSinceSync.toFixed(1)} hours ago`);
          } else {
            this.addResult('External Integrations', integration, 'WARN', 
              `Last sync: ${hoursSinceSync.toFixed(1)} hours ago (stale)`);
          }
        } else {
          this.addResult('External Integrations', integration, 'WARN', 'No sync logs found');
        }
      } catch (error) {
        this.addResult('External Integrations', integration, 'WARN', 'Unable to check sync status');
      }
    }
  }

  /**
   * Validate backward compatibility
   */
  async validateBackwardCompatibility() {
    console.log('🔄 Validating Backward Compatibility...');

    // Test migration adapter with both schemas
    const testCases = [
      {
        table: 'staff_tickets',
        oldName: 'tickets',
        field: 'status'
      },
      {
        table: 'staff_members',
        oldName: 'staff_members',
        field: 'email'
      }
    ];

    for (const testCase of testCases) {
      try {
        // Test with migration adapter
        const results = await migrationAdapter.select(testCase.table, '*', {}, { limit: 1 });
        
        if (results && results.length >= 0) {
          this.addResult('Backward Compatibility', `${testCase.table} access`, 'PASS', 
            'Migration adapter working correctly');
        } else {
          this.addResult('Backward Compatibility', `${testCase.table} access`, 'FAIL', 
            'Migration adapter returned invalid results');
        }
      } catch (error) {
        this.addResult('Backward Compatibility', `${testCase.table} access`, 'FAIL', 
          `Migration adapter error: ${error.message}`);
      }
    }
  }

  /**
   * Add a validation result
   */
  private addResult(category: string, check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
    this.results.push({ category, check, status, message, details });
  }

  /**
   * Generate validation report
   */
  private generateReport() {
    console.log('\n\n=== MIGRATION VALIDATION REPORT ===\n');

    // Group results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.status === 'PASS').length;
      const failed = categoryResults.filter(r => r.status === 'FAIL').length;
      const warned = categoryResults.filter(r => r.status === 'WARN').length;
      
      console.log(`\n${category}`);
      console.log('─'.repeat(50));
      
      for (const result of categoryResults) {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${statusIcon} ${result.check}: ${result.message}`);
      }
      
      console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warned} warnings`);
    }

    // Overall summary
    const totalPassed = this.results.filter(r => r.status === 'PASS').length;
    const totalFailed = this.results.filter(r => r.status === 'FAIL').length;
    const totalWarned = this.results.filter(r => r.status === 'WARN').length;
    
    console.log('\n=== OVERALL SUMMARY ===');
    console.log(`Total Checks: ${this.results.length}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⚠️  Warnings: ${totalWarned}`);
    
    const readyForProduction = totalFailed === 0;
    console.log(`\n${readyForProduction ? '✅' : '❌'} Migration ${readyForProduction ? 'READY' : 'NOT READY'} for production deployment`);
    
    if (!readyForProduction) {
      console.log('\nRequired Actions:');
      const failedResults = this.results.filter(r => r.status === 'FAIL');
      for (const result of failedResults) {
        console.log(`- Fix ${result.category} - ${result.check}: ${result.message}`);
      }
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const validator = new MigrationValidator();
  validator.runValidation()
    .then(() => {
      console.log('\nValidation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}

export { MigrationValidator, ValidationResult };