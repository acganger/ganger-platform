/**
 * End-to-End Workflow Tests for Ganger Actions App
 * Phase 4: Validation & Production Deployment
 */

import { createClient } from '@supabase/supabase-js';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://supa.gangerdermatology.com';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Ganger Actions E2E Workflow Tests', () => {
  let supabase: any;
  let testTicketId: string;
  let testCommentId: string;

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
    if (testCommentId) {
      await migrationAdapter.delete('staff_ticket_comments', { id: testCommentId });
    }
    if (testTicketId) {
      await migrationAdapter.delete('staff_tickets', { id: testTicketId });
    }
  });

  describe('Ticket Lifecycle Management', () => {
    test('should create a new ticket with proper status mapping', async () => {
      // Create test ticket data
      const ticketData = {
        form_type: 'support_request',
        submitter_email: 'test@gangerdermatology.com',
        submitter_name: 'Test User',
        status: MigrationHelpers.convertTicketStatus('pending_approval'),
        priority: 'medium',
        location: 'Wixom',
        title: 'Test Support Request',
        description: 'Testing migration-aware ticket creation',
        form_data: {
          category: 'IT Support',
          urgency: 'normal',
          details: 'Test ticket for migration validation'
        },
        approval_required: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert using migration adapter
      const [newTicket] = await migrationAdapter.insert('staff_tickets', ticketData);
      
      expect(newTicket).toBeDefined();
      expect(newTicket.id).toBeDefined();
      expect(newTicket.ticket_number).toBeDefined();
      expect(newTicket.status).toBe('pending');
      
      testTicketId = newTicket.id;
    }, TEST_TIMEOUT);

    test('should query tickets with correct table names', async () => {
      const tickets = await migrationAdapter.select(
        'staff_tickets',
        `
          *,
          comments:staff_ticket_comments(count),
          files:staff_attachments(count)
        `,
        { 
          submitter_email: 'test@gangerdermatology.com',
          status: ['pending', 'open', 'in_progress']
        },
        { limit: 10, orderBy: '-created_at' }
      );

      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBeGreaterThanOrEqual(0);
      
      // Check if our test ticket is in the results
      const testTicket = tickets.find(t => t.id === testTicketId);
      if (testTicket) {
        expect(testTicket.comments).toBeDefined();
        expect(testTicket.files).toBeDefined();
      }
    }, TEST_TIMEOUT);

    test('should handle status transitions correctly', async () => {
      if (!testTicketId) {
        console.warn('No test ticket ID, skipping status transition test');
        return;
      }

      // Test status progression: pending → open → in_progress → completed
      const statusTransitions = [
        { from: 'pending', to: 'open', mapped: 'open' },
        { from: 'open', to: 'in_progress', mapped: 'in_progress' },
        { from: 'in_progress', to: 'completed', mapped: 'completed' }
      ];

      for (const transition of statusTransitions) {
        const [updated] = await migrationAdapter.update(
          'staff_tickets',
          { 
            status: MigrationHelpers.convertTicketStatus(transition.to),
            updated_at: new Date().toISOString()
          },
          { id: testTicketId }
        );

        expect(updated.status).toBe(transition.mapped);
      }
    }, TEST_TIMEOUT);
  });

  describe('Comments and Attachments', () => {
    test('should add comments to tickets with proper table references', async () => {
      if (!testTicketId) {
        console.warn('No test ticket ID, skipping comment test');
        return;
      }

      const commentData = {
        ticket_id: testTicketId,
        content: 'Test comment for migration validation',
        is_internal: false,
        author_id: 'test-user-123',
        author_email: 'test@gangerdermatology.com',
        author_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const [newComment] = await migrationAdapter.insert('staff_ticket_comments', commentData);
      
      expect(newComment).toBeDefined();
      expect(newComment.id).toBeDefined();
      expect(newComment.ticket_id).toBe(testTicketId);
      
      testCommentId = newComment.id;
    }, TEST_TIMEOUT);

    test('should handle file attachments with new table structure', async () => {
      if (!testTicketId) {
        console.warn('No test ticket ID, skipping attachment test');
        return;
      }

      const attachmentData = {
        ticket_id: testTicketId,
        file_name: 'test-document.pdf',
        file_size: 1024000, // 1MB
        file_type: 'application/pdf',
        mime_type: 'application/pdf',
        storage_path: 'tickets/test-ticket-123/test-document.pdf',
        storage_bucket: 'ticket-attachments',
        is_image: false,
        uploaded_by: 'test@gangerdermatology.com',
        created_at: new Date().toISOString()
      };

      const [newAttachment] = await migrationAdapter.insert('staff_attachments', attachmentData);
      
      expect(newAttachment).toBeDefined();
      expect(newAttachment.id).toBeDefined();
      expect(newAttachment.ticket_id).toBe(testTicketId);
    }, TEST_TIMEOUT);
  });

  describe('Location Field Validation', () => {
    test('should handle location values consistently', async () => {
      const validLocations = ['Wixom', 'Ann Arbor', 'Plymouth', 'Multiple'];
      
      for (const location of validLocations) {
        const ticketData = {
          form_type: 'location_test',
          submitter_email: 'test@gangerdermatology.com',
          submitter_name: 'Location Tester',
          status: 'open',
          priority: 'low',
          location: location,
          title: `Location Test - ${location}`,
          form_data: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const [ticket] = await migrationAdapter.insert('staff_tickets', ticketData);
        expect(ticket.location).toBe(location);
        
        // Clean up
        await migrationAdapter.delete('staff_tickets', { id: ticket.id });
      }
    });
  });

  describe('Notification System', () => {
    test('should create job queue entries for notifications', async () => {
      const jobData = {
        handler: 'NotifyNewTicket',
        payload: {
          ticket_id: testTicketId || 'test-ticket-123',
          ticket_number: 'TEST-001',
          form_type: 'support_request',
          priority: 'medium',
          submitter_email: 'test@gangerdermatology.com',
          submitter_name: 'Test User'
        },
        priority: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const [job] = await migrationAdapter.insert('job_queue', jobData);
      
      expect(job).toBeDefined();
      expect(job.handler).toBe('NotifyNewTicket');
      expect(job.payload.ticket_id).toBeDefined();
      
      // Clean up
      await migrationAdapter.delete('job_queue', { id: job.id });
    });
  });

  describe('Performance Validation', () => {
    test('should maintain acceptable query performance', async () => {
      const startTime = Date.now();
      
      // Complex query with joins and filters
      const results = await migrationAdapter.select(
        'staff_tickets',
        `
          *,
          comments:staff_ticket_comments(count),
          files:staff_attachments(count)
        `,
        { 
          status: ['open', 'in_progress'],
          created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
        },
        { limit: 100, orderBy: '-created_at' }
      );
      
      const queryTime = Date.now() - startTime;
      
      // Performance should be under 1000ms for this query
      expect(queryTime).toBeLessThan(1000);
      console.log(`Complex query completed in ${queryTime}ms`);
    }, TEST_TIMEOUT);
  });
});

// Export test utilities
export const gangerActionsTestUtils = {
  createTestTicket: async (data: any) => {
    const [ticket] = await migrationAdapter.insert('staff_tickets', {
      form_type: 'test_request',
      submitter_email: 'test@gangerdermatology.com',
      submitter_name: 'Test User',
      status: 'open',
      priority: 'medium',
      title: 'Test Ticket',
      form_data: {},
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return ticket;
  },
  
  cleanupTestTickets: async (ticketIds: string[]) => {
    for (const id of ticketIds) {
      // Delete comments first
      await migrationAdapter.delete('staff_ticket_comments', { ticket_id: id });
      // Delete attachments
      await migrationAdapter.delete('staff_attachments', { ticket_id: id });
      // Delete ticket
      await migrationAdapter.delete('staff_tickets', { id });
    }
  }
};