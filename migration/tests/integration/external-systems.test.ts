/**
 * External System Integration Tests
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';
import { migrationAdapter } from '@ganger/db';
import { migrationDeputyAdapter } from '@ganger/integrations/deputy';
import { migrationZenefitsAdapter } from '@ganger/integrations/zenefits';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TEST_TIMEOUT = 60000; // 60 seconds for integration tests

describe('External System Integration Tests', () => {
  let supabase: any;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Configure migration adapter
    migrationAdapter.updateConfig({
      enableMigrationMode: true,
      useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
      logMigrationQueries: true
    });
  });

  describe('Deputy HR Integration', () => {
    test('should sync employee data with new staff tables', async () => {
      // Mock Deputy API response
      const mockDeputyEmployees = [
        {
          Id: 123,
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john.doe@gangerdermatology.com',
          JobTitle: 'Clinical Assistant',
          EmployeeId: 'EMP001',
          Active: true,
          StartDate: '2023-01-15',
          Location: 1 // Deputy location ID
        }
      ];

      // Test employee sync with migration adapter
      const syncResult = await migrationDeputyAdapter.syncEmployeesWithMigration();
      
      expect(syncResult).toBeDefined();
      expect(syncResult.synced).toBeDefined();
      expect(syncResult.failed).toBeDefined();
      expect(syncResult.errors).toBeDefined();
      
      // Verify employee data was properly mapped
      if (syncResult.synced.length > 0) {
        const syncedEmployee = syncResult.synced[0];
        expect(syncedEmployee.employee_status).toMatch(/active|inactive/);
        expect(syncedEmployee.deputy_id).toBeDefined();
      }
    }, TEST_TIMEOUT);

    test('should sync availability with new schema', async () => {
      const startDate = '2025-07-20';
      const endDate = '2025-07-26';
      
      const availabilityResult = await migrationDeputyAdapter.syncAvailabilityWithMigration(
        startDate,
        endDate
      );
      
      expect(availabilityResult).toBeDefined();
      expect(availabilityResult.synced).toBeDefined();
      expect(Array.isArray(availabilityResult.synced)).toBe(true);
      
      // Check availability data mapping
      if (availabilityResult.synced.length > 0) {
        const availability = availabilityResult.synced[0];
        expect(availability.availability_type).toMatch(/available|unavailable|preferred/);
      }
    }, TEST_TIMEOUT);

    test('should handle location mapping correctly', async () => {
      // Test location ID mapping from Deputy to new schema
      const locationMappings = {
        1: 'loc-wixom-001',      // Wixom
        2: 'loc-annarbor-001',   // Ann Arbor
        3: 'loc-plymouth-001'    // Plymouth
      };

      for (const [deputyId, gangerLocationId] of Object.entries(locationMappings)) {
        const mappedLocation = await migrationDeputyAdapter.mapDeputyLocationToGanger(Number(deputyId));
        expect(mappedLocation).toBe(gangerLocationId);
      }
    });
  });

  describe('Zenefits Integration', () => {
    test('should sync employee compliance data', async () => {
      // Mock Zenefits compliance data
      const mockZenefitsData = {
        people: [
          {
            id: 'zen-123',
            first_name: 'Jane',
            last_name: 'Smith',
            work_email: 'jane.smith@gangerdermatology.com',
            department: 'Clinical',
            status: 'active',
            hire_date: '2023-03-01'
          }
        ]
      };

      // Test Zenefits sync with migration adapter
      const syncResult = await migrationZenefitsAdapter.syncEmployeeDataWithMigration();
      
      expect(syncResult).toBeDefined();
      expect(syncResult.synced).toBeDefined();
      expect(syncResult.errors).toBeDefined();
      
      // Verify compliance data mapping
      if (syncResult.synced.length > 0) {
        const employee = syncResult.synced[0];
        expect(employee.zenefits_id).toBeDefined();
        expect(employee.department).toBeDefined();
      }
    }, TEST_TIMEOUT);

    test('should update training completion records', async () => {
      const trainingData = {
        employee_id: 'test-emp-123',
        training_module_id: 'hipaa-2025',
        completed_at: new Date().toISOString(),
        score: 95,
        certificate_url: 'https://zenefits.com/certs/12345'
      };

      const result = await migrationZenefitsAdapter.updateTrainingCompletionWithMigration(
        trainingData
      );
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      if (result.success) {
        expect(result.completion.status).toBe('completed');
      }
    }, TEST_TIMEOUT);
  });

  describe('Google Workspace Integration', () => {
    test('should authenticate users with migration-aware profile lookup', async () => {
      const mockGoogleUser = {
        email: 'test.user@gangerdermatology.com',
        name: 'Test User',
        picture: 'https://lh3.googleusercontent.com/test',
        hd: 'gangerdermatology.com'
      };

      // Simulate Google auth callback
      const userProfile = await migrationAdapter.select(
        'staff_user_profiles',
        '*',
        { email: mockGoogleUser.email },
        { limit: 1 }
      );

      if (userProfile.length > 0) {
        expect(userProfile[0].email).toBe(mockGoogleUser.email);
        expect(userProfile[0].google_user_data).toBeDefined();
      }
    });

    test('should sync Google Classroom training data', async () => {
      // Mock Google Classroom course completion
      const courseCompletion = {
        courseId: 'compliance-training-2025',
        userId: 'test.user@gangerdermatology.com',
        courseWorkId: 'hipaa-module-1',
        state: 'TURNED_IN',
        submissionHistory: [{
          stateHistory: {
            state: 'TURNED_IN',
            stateTimestamp: new Date().toISOString()
          }
        }]
      };

      // Map to training completion
      const mappedCompletion = {
        employee_email: courseCompletion.userId,
        training_module_id: courseCompletion.courseWorkId,
        status: 'completed',
        completed_at: courseCompletion.submissionHistory[0].stateHistory.stateTimestamp,
        google_classroom_id: courseCompletion.courseId
      };

      const [completion] = await migrationAdapter.insert(
        'training_completions',
        mappedCompletion
      );

      expect(completion).toBeDefined();
      expect(completion.status).toBe('completed');
    });
  });

  describe('Webhook Integration', () => {
    test('should handle Deputy webhook with new schema', async () => {
      const webhookPayload = {
        topic: 'employee.modified',
        data: {
          Id: 123,
          FirstName: 'John',
          LastName: 'Updated',
          Active: true
        }
      };

      // Process webhook with migration adapter
      const result = await migrationDeputyAdapter.processWebhookWithMigration(
        webhookPayload
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
    });

    test('should handle Zenefits webhook events', async () => {
      const webhookPayload = {
        event_type: 'person.changed',
        person: {
          id: 'zen-123',
          first_name: 'Jane',
          last_name: 'UpdatedName',
          status: 'active'
        }
      };

      const result = await migrationZenefitsAdapter.processWebhookWithMigration(
        webhookPayload
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Data Consistency Validation', () => {
    test('should maintain referential integrity across systems', async () => {
      // Check that all staff members have valid location references
      const staffMembers = await migrationAdapter.select(
        'staff_members',
        'id, email, base_location_id',
        { is_active: true },
        { limit: 100 }
      );

      const locationIds = new Set(staffMembers.map(s => s.base_location_id).filter(Boolean));
      
      if (locationIds.size > 0) {
        const locations = await migrationAdapter.select(
          'locations',
          'id',
          { id: Array.from(locationIds) }
        );

        const validLocationIds = new Set(locations.map(l => l.id));
        
        // All staff location IDs should be valid
        for (const staff of staffMembers) {
          if (staff.base_location_id) {
            expect(validLocationIds.has(staff.base_location_id)).toBe(true);
          }
        }
      }
    });

    test('should sync status values consistently across integrations', async () => {
      const statusMappings = {
        // Deputy status -> Ganger status
        deputy: {
          active: 'active',
          terminated: 'inactive',
          onLeave: 'on_leave'
        },
        // Zenefits status -> Ganger status
        zenefits: {
          active: 'active',
          inactive: 'inactive',
          terminated: 'terminated'
        }
      };

      // Verify status mappings work correctly
      expect(migrationDeputyAdapter.mapEmployeeStatus('active')).toBe('active');
      expect(migrationZenefitsAdapter.mapEmployeeStatus('terminated')).toBe('terminated');
    });
  });
});

// Export test utilities
export const integrationTestUtils = {
  mockDeputySync: async () => {
    return await migrationDeputyAdapter.syncEmployeesWithMigration();
  },
  
  mockZenefitsSync: async () => {
    return await migrationZenefitsAdapter.syncEmployeeDataWithMigration();
  },
  
  validateDataConsistency: async () => {
    const results = {
      staffProfiles: 0,
      validLocations: 0,
      validManagers: 0,
      errors: []
    };

    try {
      // Check staff profiles
      const staff = await migrationAdapter.select('staff_members', 'id', {}, { limit: 1000 });
      results.staffProfiles = staff.length;

      // Check locations
      const locations = await migrationAdapter.select('locations', 'id', { is_active: true });
      results.validLocations = locations.length;

      // Validate manager relationships
      const managers = await migrationAdapter.select(
        'staff_members',
        'id',
        { role: 'manager', is_active: true }
      );
      results.validManagers = managers.length;

    } catch (error) {
      results.errors.push(error.message);
    }

    return results;
  }
};