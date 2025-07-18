/**
 * Migration Dashboard - Real-time Migration Status Monitoring
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';
import { migrationFlags } from './feature-flags/migration-flags';
import { migrationRollback } from './rollback/rollback-procedures';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface MigrationMetrics {
  totalRecords: Record<string, number>;
  recentActivity: Record<string, any>;
  featureFlagStatus: any[];
  performanceMetrics: any[];
  integrationStatus: any[];
  errors: any[];
}

class MigrationDashboard {
  private supabase: any;
  private refreshInterval: number = 30000; // 30 seconds
  private isRunning: boolean = false;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Start the dashboard monitoring
   */
  async start() {
    this.isRunning = true;
    console.clear();
    console.log('🎯 Ganger Platform Database Migration Dashboard');
    console.log('=' .repeat(60));
    console.log('Press Ctrl+C to exit\n');

    // Initial display
    await this.displayDashboard();

    // Set up refresh interval
    const intervalId = setInterval(async () => {
      if (this.isRunning) {
        console.clear();
        await this.displayDashboard();
      } else {
        clearInterval(intervalId);
      }
    }, this.refreshInterval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.isRunning = false;
      console.log('\n\nShutting down dashboard...');
      process.exit(0);
    });
  }

  /**
   * Display the dashboard
   */
  async displayDashboard() {
    const metrics = await this.collectMetrics();
    const timestamp = new Date().toISOString();

    console.log('🎯 Ganger Platform Database Migration Dashboard');
    console.log('=' .repeat(60));
    console.log(`Last Updated: ${timestamp}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Migration Schema: ${process.env.MIGRATION_USE_NEW_SCHEMA === 'true' ? 'NEW' : 'OLD'}\n`);

    // Display sections
    this.displayFeatureFlags(metrics.featureFlagStatus);
    this.displayRecordCounts(metrics.totalRecords);
    this.displayRecentActivity(metrics.recentActivity);
    this.displayPerformanceMetrics(metrics.performanceMetrics);
    this.displayIntegrationStatus(metrics.integrationStatus);
    this.displayErrors(metrics.errors);
    this.displayMigrationProgress();
  }

  /**
   * Collect all metrics
   */
  async collectMetrics(): Promise<MigrationMetrics> {
    const metrics: MigrationMetrics = {
      totalRecords: {},
      recentActivity: {},
      featureFlagStatus: [],
      performanceMetrics: [],
      integrationStatus: [],
      errors: []
    };

    // Collect in parallel for efficiency
    await Promise.all([
      this.collectRecordCounts(metrics),
      this.collectFeatureFlags(metrics),
      this.collectRecentActivity(metrics),
      this.collectPerformanceMetrics(metrics),
      this.collectIntegrationStatus(metrics),
      this.collectErrors(metrics)
    ]);

    return metrics;
  }

  /**
   * Collect record counts
   */
  async collectRecordCounts(metrics: MigrationMetrics) {
    const tables = [
      'staff_members',
      'staff_tickets',
      'staff_schedules',
      'teams',
      'rocks',
      'issues',
      'todos',
      'employees',
      'training_completions'
    ];

    for (const table of tables) {
      try {
        const { count } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        metrics.totalRecords[table] = count || 0;
      } catch (error) {
        metrics.totalRecords[table] = -1;
      }
    }
  }

  /**
   * Collect feature flag status
   */
  async collectFeatureFlags(metrics: MigrationMetrics) {
    try {
      metrics.featureFlagStatus = await migrationFlags.getAllFlags();
    } catch (error) {
      metrics.errors.push({ type: 'feature_flags', error: error.message });
    }
  }

  /**
   * Collect recent activity
   */
  async collectRecentActivity(metrics: MigrationMetrics) {
    const activityQueries = [
      { table: 'staff_tickets', field: 'created_at', label: 'Latest Ticket' },
      { table: 'staff_schedules', field: 'created_at', label: 'Latest Schedule' },
      { table: 'training_completions', field: 'completed_at', label: 'Latest Training' }
    ];

    for (const query of activityQueries) {
      try {
        const { data } = await this.supabase
          .from(query.table)
          .select(query.field)
          .order(query.field, { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const timestamp = new Date(data[0][query.field]);
          const hoursAgo = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
          metrics.recentActivity[query.label] = {
            timestamp: timestamp.toISOString(),
            hoursAgo: hoursAgo.toFixed(1)
          };
        }
      } catch (error) {
        metrics.recentActivity[query.label] = { error: true };
      }
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics(metrics: MigrationMetrics) {
    // Simulate performance checks
    const queries = [
      { name: 'Simple Query', table: 'staff_tickets', complexity: 'simple' },
      { name: 'Join Query', table: 'staff_schedules', complexity: 'complex' }
    ];

    for (const query of queries) {
      const start = Date.now();
      try {
        if (query.complexity === 'simple') {
          await this.supabase.from(query.table).select('id').limit(100);
        } else {
          await this.supabase
            .from(query.table)
            .select('*, staff_member:staff_members!inner(*)')
            .limit(50);
        }
        const duration = Date.now() - start;
        metrics.performanceMetrics.push({
          query: query.name,
          duration: duration,
          status: duration < 500 ? 'good' : duration < 1000 ? 'ok' : 'slow'
        });
      } catch (error) {
        metrics.performanceMetrics.push({
          query: query.name,
          error: true
        });
      }
    }
  }

  /**
   * Collect integration status
   */
  async collectIntegrationStatus(metrics: MigrationMetrics) {
    const integrations = ['deputy', 'zenefits', 'google_workspace'];
    
    for (const integration of integrations) {
      try {
        const { data } = await this.supabase
          .from('integration_sync_logs')
          .select('*')
          .eq('integration_name', integration)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const lastSync = new Date(data[0].created_at);
          const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
          metrics.integrationStatus.push({
            name: integration,
            lastSync: lastSync.toISOString(),
            hoursSinceSync: hoursSinceSync.toFixed(1),
            status: hoursSinceSync < 24 ? 'active' : 'stale',
            success: data[0].success
          });
        } else {
          metrics.integrationStatus.push({
            name: integration,
            status: 'no_data'
          });
        }
      } catch (error) {
        metrics.integrationStatus.push({
          name: integration,
          status: 'error'
        });
      }
    }
  }

  /**
   * Collect recent errors
   */
  async collectErrors(metrics: MigrationMetrics) {
    try {
      const { data: migrationLogs } = await this.supabase
        .from('migration_audit_log')
        .select('*')
        .in('action', ['ERROR', 'ROLLBACK_INITIATED', 'VALIDATION_FAILED'])
        .order('timestamp', { ascending: false })
        .limit(5);

      if (migrationLogs) {
        metrics.errors.push(...migrationLogs);
      }
    } catch (error) {
      // Ignore errors in error collection
    }
  }

  /**
   * Display feature flags section
   */
  private displayFeatureFlags(flags: any[]) {
    console.log('🚩 Feature Flags');
    console.log('─'.repeat(60));
    
    const appFlags = flags.filter(f => f.flag_name.startsWith('use_new_schema'));
    const systemFlags = flags.filter(f => !f.flag_name.startsWith('use_new_schema'));

    console.log('App Migration Status:');
    for (const flag of appFlags) {
      const status = flag.enabled ? `✅ ${flag.rollout_percentage}%` : '❌ Disabled';
      const appName = flag.app_name || flag.flag_name.replace('use_new_schema_', '');
      console.log(`  ${appName.padEnd(20)} ${status}`);
    }

    console.log('\nSystem Flags:');
    for (const flag of systemFlags) {
      const status = flag.enabled ? '✅ Enabled' : '❌ Disabled';
      console.log(`  ${flag.flag_name.padEnd(30)} ${status}`);
    }
    console.log();
  }

  /**
   * Display record counts section
   */
  private displayRecordCounts(records: Record<string, number>) {
    console.log('📊 Record Counts');
    console.log('─'.repeat(60));
    
    const columns = 3;
    const entries = Object.entries(records);
    const rowCount = Math.ceil(entries.length / columns);
    
    for (let row = 0; row < rowCount; row++) {
      let line = '';
      for (let col = 0; col < columns; col++) {
        const index = row + col * rowCount;
        if (index < entries.length) {
          const [table, count] = entries[index];
          const countStr = count === -1 ? 'ERROR' : count.toLocaleString();
          line += `${table.padEnd(20)} ${countStr.padStart(8)}    `;
        }
      }
      console.log(line);
    }
    console.log();
  }

  /**
   * Display recent activity section
   */
  private displayRecentActivity(activity: Record<string, any>) {
    console.log('🕐 Recent Activity');
    console.log('─'.repeat(60));
    
    for (const [label, data] of Object.entries(activity)) {
      if (data.error) {
        console.log(`${label.padEnd(20)} ❌ Error`);
      } else {
        const status = parseFloat(data.hoursAgo) < 1 ? '🟢' : 
                      parseFloat(data.hoursAgo) < 24 ? '🟡' : '🔴';
        console.log(`${label.padEnd(20)} ${status} ${data.hoursAgo} hours ago`);
      }
    }
    console.log();
  }

  /**
   * Display performance metrics section
   */
  private displayPerformanceMetrics(metrics: any[]) {
    console.log('⚡ Performance Metrics');
    console.log('─'.repeat(60));
    
    for (const metric of metrics) {
      if (metric.error) {
        console.log(`${metric.query.padEnd(20)} ❌ Error`);
      } else {
        const icon = metric.status === 'good' ? '🟢' : 
                    metric.status === 'ok' ? '🟡' : '🔴';
        console.log(`${metric.query.padEnd(20)} ${icon} ${metric.duration}ms`);
      }
    }
    console.log();
  }

  /**
   * Display integration status section
   */
  private displayIntegrationStatus(integrations: any[]) {
    console.log('🔌 Integration Status');
    console.log('─'.repeat(60));
    
    for (const integration of integrations) {
      if (integration.status === 'no_data') {
        console.log(`${integration.name.padEnd(20)} ⚪ No sync data`);
      } else if (integration.status === 'error') {
        console.log(`${integration.name.padEnd(20)} ❌ Error`);
      } else {
        const icon = integration.status === 'active' ? '🟢' : '🔴';
        const successIcon = integration.success ? '✅' : '❌';
        console.log(`${integration.name.padEnd(20)} ${icon} Last sync: ${integration.hoursSinceSync}h ago ${successIcon}`);
      }
    }
    console.log();
  }

  /**
   * Display errors section
   */
  private displayErrors(errors: any[]) {
    if (errors.length === 0) return;
    
    console.log('❌ Recent Errors');
    console.log('─'.repeat(60));
    
    for (const error of errors.slice(0, 3)) {
      const timestamp = new Date(error.timestamp).toLocaleString();
      console.log(`${timestamp} - ${error.action}`);
      if (error.details?.reason) {
        console.log(`  Reason: ${error.details.reason}`);
      }
    }
    console.log();
  }

  /**
   * Display migration progress
   */
  private displayMigrationProgress() {
    console.log('📈 Migration Progress');
    console.log('─'.repeat(60));
    
    const phases = [
      { name: 'Phase 1: Foundation', status: 'completed', progress: 100 },
      { name: 'Phase 2: Shared Packages', status: 'completed', progress: 100 },
      { name: 'Phase 3: App Migration', status: 'completed', progress: 100 },
      { name: 'Phase 4: Validation', status: 'in_progress', progress: 85 },
      { name: 'Phase 5: Production', status: 'pending', progress: 0 }
    ];

    for (const phase of phases) {
      const icon = phase.status === 'completed' ? '✅' : 
                   phase.status === 'in_progress' ? '🔄' : '⏳';
      const progressBar = this.createProgressBar(phase.progress);
      console.log(`${icon} ${phase.name.padEnd(25)} ${progressBar} ${phase.progress}%`);
    }
    
    const totalProgress = phases.reduce((sum, p) => sum + p.progress, 0) / phases.length;
    console.log(`\nOverall Progress: ${this.createProgressBar(totalProgress)} ${totalProgress.toFixed(0)}%`);
  }

  /**
   * Create a progress bar
   */
  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }
}

// Run if executed directly
if (require.main === module) {
  const dashboard = new MigrationDashboard();
  dashboard.start().catch((error) => {
    console.error('Dashboard error:', error);
    process.exit(1);
  });
}

export { MigrationDashboard };