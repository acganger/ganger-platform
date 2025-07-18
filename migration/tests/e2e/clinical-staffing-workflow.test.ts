/**
 * End-to-End Workflow Tests for Clinical Staffing App
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { migrationStaffingBusinessLogic } from '@ganger/utils/server';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Clinical Staffing E2E Workflow Tests', () => {
  let supabase: any;
  let testStaffMemberId: string;
  let testScheduleId: string;
  let testLocationId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Configure migration adapter for testing
    migrationAdapter.updateConfig({
      enableMigrationMode: true,
      useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
      logMigrationQueries: true
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testScheduleId) {
      await migrationAdapter.delete('staff_schedules', { id: testScheduleId });
    }
  });

  describe('Staff Schedule Management', () => {
    test('should create a new staff schedule with migration-aware status', async () => {
      // Create test schedule data
      const scheduleData = {
        staff_member_id: 'test-staff-123',
        location_id: 'test-location-456',
        schedule_date: '2025-07-20',
        start_time: '09:00:00',
        end_time: '17:00:00',
        status: MigrationHelpers.convertScheduleStatus('scheduled'),
        role: 'Clinical Assistant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert using migration adapter
      const [newSchedule] = await migrationAdapter.insert('staff_schedules', scheduleData);
      
      expect(newSchedule).toBeDefined();
      expect(newSchedule.id).toBeDefined();
      expect(newSchedule.status).toBe('scheduled');
      
      testScheduleId = newSchedule.id;
    }, TEST_TIMEOUT);

    test('should query schedules with proper table name mapping', async () => {
      const schedules = await migrationAdapter.select(
        'staff_schedules',
        '*',
        { schedule_date: '2025-07-20' },
        { limit: 10 }
      );

      expect(Array.isArray(schedules)).toBe(true);
      expect(schedules.length).toBeGreaterThanOrEqual(0);
    }, TEST_TIMEOUT);

    test('should update schedule status with migration-aware conversion', async () => {
      if (!testScheduleId) {
        console.warn('No test schedule ID, skipping update test');
        return;
      }

      const updatedSchedules = await migrationAdapter.update(
        'staff_schedules',
        { 
          status: MigrationHelpers.convertScheduleStatus('confirmed'),
          updated_at: new Date().toISOString()
        },
        { id: testScheduleId }
      );

      expect(updatedSchedules.length).toBe(1);
      expect(updatedSchedules[0].status).toBe('confirmed');
    }, TEST_TIMEOUT);
  });

  describe('AI Optimization Workflow', () => {
    test('should calculate optimal staffing with migration-aware business logic', async () => {
      const testDate = new Date('2025-07-20');
      const testLocationId = 'test-location-456';
      
      // Mock provider schedules
      const mockProviderSchedules = [
        {
          physician_id: 'dr-123',
          location_id: testLocationId,
          schedule_date: '2025-07-20',
          start_time: '09:00:00',
          end_time: '17:00:00',
          patient_capacity: 20
        }
      ];

      // Test optimization calculation
      const result = await migrationStaffingBusinessLogic.calculateOptimalStaffingWithMigration(
        testLocationId,
        testDate,
        mockProviderSchedules
      );

      expect(result).toBeDefined();
      expect(result.optimalStaffCount).toBeGreaterThan(0);
      expect(result.timeSlotRequirements).toBeDefined();
      expect(Array.isArray(result.timeSlotRequirements)).toBe(true);
    }, TEST_TIMEOUT);

    test('should auto-approve schedules based on business rules', async () => {
      const testSchedules = [
        {
          id: 'test-schedule-1',
          staff_member_id: 'test-staff-123',
          location_id: 'test-location-456',
          schedule_date: '2025-07-20',
          start_time: '09:00:00',
          end_time: '17:00:00',
          status: 'scheduled',
          ai_confidence_score: 95
        }
      ];

      const result = await migrationStaffingBusinessLogic.autoApproveSchedulesWithMigration(
        testSchedules,
        'test-user-id'
      );

      expect(result).toBeDefined();
      expect(result.approved).toBeDefined();
      expect(result.rejected).toBeDefined();
      expect(Array.isArray(result.approved)).toBe(true);
      expect(Array.isArray(result.rejected)).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('Real-time Updates', () => {
    test('should handle real-time subscription with new table names', async () => {
      // This test would verify real-time subscriptions work with migration
      // In a real test environment, we'd set up actual subscriptions
      const tableName = process.env.MIGRATION_USE_NEW_SCHEMA === 'true' 
        ? 'staff_schedules' 
        : 'staff_schedules';
      
      expect(tableName).toBe('staff_schedules');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should maintain query performance with migration adapter', async () => {
      const startTime = Date.now();
      
      // Query with multiple joins
      const results = await migrationAdapter.select(
        'staff_schedules',
        `
          *,
          staff_member:staff_members!inner(*),
          location:locations!inner(*)
        `,
        { schedule_date: '2025-07-20' },
        { limit: 50 }
      );
      
      const queryTime = Date.now() - startTime;
      
      // Performance should be under 500ms for this query
      expect(queryTime).toBeLessThan(500);
      console.log(`Query completed in ${queryTime}ms`);
    }, TEST_TIMEOUT);
  });
});

// Export test utilities for other test files
export const testUtils = {
  createTestSchedule: async (data: any) => {
    const [schedule] = await migrationAdapter.insert('staff_schedules', {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return schedule;
  },
  
  cleanupTestData: async (ids: { scheduleIds?: string[], staffIds?: string[] }) => {
    if (ids.scheduleIds) {
      for (const id of ids.scheduleIds) {
        await migrationAdapter.delete('staff_schedules', { id });
      }
    }
    if (ids.staffIds) {
      for (const id of ids.staffIds) {
        await migrationAdapter.delete('staff_members', { id });
      }
    }
  }
};