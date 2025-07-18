/**
 * Performance Benchmarking for Database Migration
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';
import { migrationAdapter } from '@ganger/db';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface BenchmarkResult {
  testName: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
  percentile95: number;
  errorRate: number;
}

class MigrationBenchmark {
  private supabase: any;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Run a benchmark test multiple times and collect statistics
   */
  async runBenchmark(
    testName: string,
    testFunction: () => Promise<any>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    let errors = 0;

    console.log(`Running benchmark: ${testName} (${iterations} iterations)`);

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = process.hrtime.bigint();
        await testFunction();
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        times.push(duration);
      } catch (error) {
        errors++;
        console.error(`Error in iteration ${i + 1}:`, error);
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write('.');
      }
    }
    console.log('\n');

    // Calculate statistics
    times.sort((a, b) => a - b);
    const result: BenchmarkResult = {
      testName,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: times[0] || 0,
      maxTime: times[times.length - 1] || 0,
      iterations: iterations,
      percentile95: times[Math.floor(times.length * 0.95)] || 0,
      errorRate: (errors / iterations) * 100
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark tests for Clinical Staffing queries
   */
  async benchmarkClinicalStaffing() {
    console.log('\n=== Clinical Staffing Performance Benchmarks ===\n');

    // Test 1: Simple staff schedule query
    await this.runBenchmark(
      'Simple Staff Schedule Query',
      async () => {
        await migrationAdapter.select(
          'staff_schedules',
          '*',
          { schedule_date: '2025-07-20' },
          { limit: 50 }
        );
      },
      50
    );

    // Test 2: Complex query with joins
    await this.runBenchmark(
      'Staff Schedule with Joins',
      async () => {
        await migrationAdapter.select(
          'staff_schedules',
          `
            *,
            staff_member:staff_members!inner(*),
            location:locations!inner(*)
          `,
          { schedule_date: '2025-07-20' },
          { limit: 20 }
        );
      },
      50
    );

    // Test 3: Aggregation query
    await this.runBenchmark(
      'Staff Analytics Aggregation',
      async () => {
        await this.supabase.rpc('calculate_staff_metrics', {
          start_date: '2025-07-01',
          end_date: '2025-07-31',
          location_id: 'test-location-123'
        });
      },
      30
    );
  }

  /**
   * Benchmark tests for Ganger Actions queries
   */
  async benchmarkGangerActions() {
    console.log('\n=== Ganger Actions Performance Benchmarks ===\n');

    // Test 1: Ticket listing query
    await this.runBenchmark(
      'Ticket Listing Query',
      async () => {
        await migrationAdapter.select(
          'staff_tickets',
          `
            *,
            comments:staff_ticket_comments(count),
            files:staff_attachments(count)
          `,
          { status: ['open', 'in_progress'] },
          { limit: 50, orderBy: '-created_at' }
        );
      },
      50
    );

    // Test 2: Ticket search query
    await this.runBenchmark(
      'Ticket Search Query',
      async () => {
        const searchTerm = 'test';
        const tickets = await migrationAdapter.select(
          'staff_tickets',
          '*',
          {},
          { limit: 100 }
        );
        // Post-filter for search (simulating ILIKE)
        tickets.filter(t => 
          t.title?.toLowerCase().includes(searchTerm) ||
          t.description?.toLowerCase().includes(searchTerm)
        );
      },
      30
    );
  }

  /**
   * Benchmark tests for EOS L10 queries
   */
  async benchmarkEOSL10() {
    console.log('\n=== EOS L10 Performance Benchmarks ===\n');

    // Test 1: Real-time data loading
    await this.runBenchmark(
      'EOS L10 Data Loading',
      async () => {
        const teamId = 'test-team-123';
        // Simulate the multiple queries in useRealtimeData
        await Promise.all([
          migrationAdapter.select('rocks', '*', { team_id: teamId }, { orderBy: 'priority' }),
          migrationAdapter.select('issues', '*', { team_id: teamId }, { orderBy: '-created_at' }),
          migrationAdapter.select('todos', '*', { team_id: teamId }, { orderBy: 'due_date' }),
          migrationAdapter.select('l10_meetings', '*', { team_id: teamId }, { orderBy: '-scheduled_date' })
        ]);
      },
      30
    );
  }

  /**
   * Benchmark comparison: Old vs New Schema
   */
  async benchmarkSchemaComparison() {
    console.log('\n=== Schema Migration Comparison ===\n');

    // Test with old schema simulation
    process.env.MIGRATION_USE_NEW_SCHEMA = 'false';
    migrationAdapter.updateConfig({
      enableMigrationMode: true,
      useNewSchema: false,
      logMigrationQueries: false
    });

    const oldSchemaResult = await this.runBenchmark(
      'Query Performance - Old Schema',
      async () => {
        await migrationAdapter.select(
          'staff_tickets',
          '*',
          { status: 'open' },
          { limit: 100 }
        );
      },
      50
    );

    // Test with new schema
    process.env.MIGRATION_USE_NEW_SCHEMA = 'true';
    migrationAdapter.updateConfig({
      enableMigrationMode: true,
      useNewSchema: true,
      logMigrationQueries: false
    });

    const newSchemaResult = await this.runBenchmark(
      'Query Performance - New Schema',
      async () => {
        await migrationAdapter.select(
          'staff_tickets',
          '*',
          { status: 'open' },
          { limit: 100 }
        );
      },
      50
    );

    // Calculate performance difference
    const performanceDiff = ((newSchemaResult.averageTime - oldSchemaResult.averageTime) / oldSchemaResult.averageTime) * 100;
    console.log(`\nPerformance difference: ${performanceDiff.toFixed(2)}% ${performanceDiff > 0 ? 'slower' : 'faster'} with new schema`);
  }

  /**
   * Generate benchmark report
   */
  generateReport() {
    console.log('\n=== PERFORMANCE BENCHMARK REPORT ===\n');
    console.log('Test Name                          | Avg (ms) | Min (ms) | Max (ms) | 95% (ms) | Error % |');
    console.log('-----------------------------------|----------|----------|----------|----------|---------|');
    
    for (const result of this.results) {
      console.log(
        `${result.testName.padEnd(34)} | ${result.averageTime.toFixed(2).padStart(8)} | ` +
        `${result.minTime.toFixed(2).padStart(8)} | ${result.maxTime.toFixed(2).padStart(8)} | ` +
        `${result.percentile95.toFixed(2).padStart(8)} | ${result.errorRate.toFixed(1).padStart(7)} |`
      );
    }

    console.log('\n=== PERFORMANCE THRESHOLDS ===\n');
    
    // Check against performance thresholds
    const thresholds = [
      { name: 'Simple queries', maxTime: 50 },
      { name: 'Complex queries with joins', maxTime: 200 },
      { name: 'Aggregation queries', maxTime: 500 },
      { name: 'Search queries', maxTime: 300 }
    ];

    for (const threshold of thresholds) {
      const relevantTests = this.results.filter(r => 
        r.testName.toLowerCase().includes(threshold.name.split(' ')[0].toLowerCase())
      );
      
      const passedTests = relevantTests.filter(r => r.percentile95 <= threshold.maxTime);
      const status = passedTests.length === relevantTests.length ? '✅ PASS' : '❌ FAIL';
      
      console.log(`${threshold.name}: ${status} (Threshold: ${threshold.maxTime}ms)`);
      if (passedTests.length < relevantTests.length) {
        const failedTests = relevantTests.filter(r => r.percentile95 > threshold.maxTime);
        failedTests.forEach(test => {
          console.log(`  - ${test.testName}: ${test.percentile95.toFixed(2)}ms (exceeds threshold)`);
        });
      }
    }
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks() {
    console.log('Starting Database Migration Performance Benchmarks...\n');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Migration Mode: ${process.env.MIGRATION_USE_NEW_SCHEMA === 'true' ? 'NEW SCHEMA' : 'OLD SCHEMA'}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    try {
      await this.benchmarkClinicalStaffing();
      await this.benchmarkGangerActions();
      await this.benchmarkEOSL10();
      await this.benchmarkSchemaComparison();
      
      this.generateReport();
    } catch (error) {
      console.error('Benchmark failed:', error);
    }
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  const benchmark = new MigrationBenchmark();
  benchmark.runAllBenchmarks()
    .then(() => {
      console.log('\nBenchmarks completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Benchmark error:', error);
      process.exit(1);
    });
}

export { MigrationBenchmark };
export type { BenchmarkResult };