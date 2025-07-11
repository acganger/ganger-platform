// scripts/migrate-legacy-data.ts
import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import * as crypto from 'crypto';

interface LegacyUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  location: string;
  hire_date: string;
  phone_number: string;
  is_active: boolean;
  manager_id: number;
  google_user_data: any;
  emergency_contact: any;
  created_at: string;
  updated_at: string;
}

interface LegacyTicket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  form_type: string;
  form_data: any;
  submitter_id: number;
  assigned_to: number;
  location: string;
  due_date: string;
  completed_at: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface LegacyComment {
  id: number;
  ticket_id: number;
  author_id: number;
  content: string;
  is_internal: boolean;
  mentioned_users: any;
  created_at: string;
  updated_at: string;
}

interface LegacyAttachment {
  id: number;
  ticket_id: number;
  uploaded_by: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  virus_scan_status: string;
  description: string;
  created_at: string;
}

interface MigrationConfig {
  legacyDb: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
  };
  supabase: {
    url: string;
    serviceKey: string;
  };
  batchSize: number;
  dryRun: boolean;
}

interface MigrationResult {
  table: string;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  errors: Array<{ record: any; error: string }>;
  duration: number;
}

export class LegacyDataMigrator {
  private legacyDb!: mysql.Connection;
  private supabase;
  private config: MigrationConfig;
  private userIdMapping: Map<number, string> = new Map();

  constructor(config: MigrationConfig) {
    this.config = config;
    this.supabase = createClient<Database>(config.supabase.url, config.supabase.serviceKey);
  }

  async connect(): Promise<void> {
    this.legacyDb = await mysql.createConnection(this.config.legacyDb);
    console.log('Connected to legacy MySQL database');
  }

  async disconnect(): Promise<void> {
    if (this.legacyDb) {
      await this.legacyDb.end();
      console.log('Disconnected from legacy MySQL database');
    }
  }

  async migrateAll(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    console.log(`Starting migration ${this.config.dryRun ? '(DRY RUN)' : ''}`);
    
    try {
      // Step 1: Migrate users first (needed for foreign key relationships)
      results.push(await this.migrateUsers());
      
      // Step 2: Migrate tickets
      results.push(await this.migrateTickets());
      
      // Step 3: Migrate comments
      results.push(await this.migrateComments());
      
      // Step 4: Migrate attachments
      results.push(await this.migrateAttachments());
      
      // Step 5: Create default form definitions if needed
      await this.createDefaultFormDefinitions();
      
      console.log('Migration completed successfully');
      this.printMigrationSummary(results);
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
    
    return results;
  }

  async migrateUsers(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      table: 'staff_user_profiles',
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('Migrating users...');
      
      // Get legacy users
      const [rows] = await this.legacyDb.execute(`
        SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id
      `);
      const legacyUsers = rows as LegacyUser[];
      
      result.totalRecords = legacyUsers.length;
      console.log(`Found ${legacyUsers.length} users to migrate`);

      // Process in batches
      for (let i = 0; i < legacyUsers.length; i += this.config.batchSize) {
        const batch = legacyUsers.slice(i, i + this.config.batchSize);
        
        for (const legacyUser of batch) {
          try {
            const newUserId = crypto.randomUUID();
            this.userIdMapping.set(legacyUser.id, newUserId);

            const userData = {
              id: newUserId,
              employee_id: legacyUser.username || `emp_${legacyUser.id}`,
              full_name: legacyUser.full_name,
              email: legacyUser.email,
              department: legacyUser.department || 'General',
              role: this.mapUserRole(legacyUser.role),
              location: this.mapLocation(legacyUser.location),
              hire_date: legacyUser.hire_date || null,
              phone_number: legacyUser.phone_number || null,
              manager_id: null, // Will be updated in second pass
              is_active: legacyUser.is_active,
              google_user_data: {
                ...legacyUser.google_user_data,
                migrated_from_legacy: true,
                legacy_id: legacyUser.id,
                migration_date: new Date().toISOString()
              },
              emergency_contact: legacyUser.emergency_contact || null,
              created_at: legacyUser.created_at,
              updated_at: legacyUser.updated_at
            };

            if (!this.config.dryRun) {
              const { error } = await this.supabase
                .from('staff_user_profiles')
                .insert(userData);

              if (error) {
                throw error;
              }
            }

            result.migratedRecords++;
            
          } catch (error) {
            result.failedRecords++;
            result.errors.push({
              record: legacyUser,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(`Failed to migrate user ${legacyUser.id}:`, error);
          }
        }
        
        console.log(`Migrated ${Math.min(i + this.config.batchSize, legacyUsers.length)}/${legacyUsers.length} users`);
      }

      // Second pass: Update manager relationships
      if (!this.config.dryRun) {
        await this.updateManagerRelationships(legacyUsers);
      }

    } catch (error) {
      console.error('User migration failed:', error);
      throw error;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async migrateTickets(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      table: 'staff_tickets',
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('Migrating tickets...');
      
      // Get legacy tickets
      const [rows] = await this.legacyDb.execute(`
        SELECT * FROM tickets WHERE deleted_at IS NULL ORDER BY id
      `);
      const legacyTickets = rows as LegacyTicket[];
      
      result.totalRecords = legacyTickets.length;
      console.log(`Found ${legacyTickets.length} tickets to migrate`);

      // Process in batches
      for (let i = 0; i < legacyTickets.length; i += this.config.batchSize) {
        const batch = legacyTickets.slice(i, i + this.config.batchSize);
        
        for (const legacyTicket of batch) {
          try {
            const submitterId = this.userIdMapping.get(legacyTicket.submitter_id);
            const assignedToId = legacyTicket.assigned_to ? this.userIdMapping.get(legacyTicket.assigned_to) : null;

            if (!submitterId) {
              throw new Error(`Submitter ID ${legacyTicket.submitter_id} not found in user mapping`);
            }

            const ticketData = {
              id: crypto.randomUUID(),
              ticket_number: legacyTicket.ticket_number,
              title: legacyTicket.title,
              description: legacyTicket.description,
              status: this.mapTicketStatus(legacyTicket.status),
              priority: this.mapTicketPriority(legacyTicket.priority),
              form_type: legacyTicket.form_type || 'general_request',
              form_data: legacyTicket.form_data || {},
              submitter_id: submitterId,
              assigned_to: assignedToId,
              location: this.mapLocation(legacyTicket.location),
              due_date: legacyTicket.due_date || null,
              completed_at: legacyTicket.completed_at || null,
              metadata: {
                ...legacyTicket.metadata,
                migrated_from_legacy: true,
                legacy_id: legacyTicket.id,
                migration_date: new Date().toISOString()
              },
              created_at: legacyTicket.created_at,
              updated_at: legacyTicket.updated_at
            };

            if (!this.config.dryRun) {
              const { error } = await this.supabase
                .from('staff_tickets')
                .insert(ticketData);

              if (error) {
                throw error;
              }
            }

            result.migratedRecords++;
            
          } catch (error) {
            result.failedRecords++;
            result.errors.push({
              record: legacyTicket,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(`Failed to migrate ticket ${legacyTicket.id}:`, error);
          }
        }
        
        console.log(`Migrated ${Math.min(i + this.config.batchSize, legacyTickets.length)}/${legacyTickets.length} tickets`);
      }

    } catch (error) {
      console.error('Ticket migration failed:', error);
      throw error;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async migrateComments(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      table: 'staff_ticket_comments',
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('Migrating comments...');
      
      // Get legacy comments with ticket mapping
      const [rows] = await this.legacyDb.execute(`
        SELECT c.*, t.ticket_number 
        FROM comments c
        JOIN tickets t ON c.ticket_id = t.id
        WHERE c.deleted_at IS NULL 
        ORDER BY c.id
      `);
      const legacyComments = rows as (LegacyComment & { ticket_number: string })[];
      
      result.totalRecords = legacyComments.length;
      console.log(`Found ${legacyComments.length} comments to migrate`);

      // Get ticket ID mapping
      const { data: tickets } = await this.supabase
        .from('staff_tickets')
        .select('id, ticket_number');
      
      const ticketMapping = new Map<string, string>();
      tickets?.forEach(ticket => {
        ticketMapping.set(ticket.ticket_number, ticket.id);
      });

      // Process in batches
      for (let i = 0; i < legacyComments.length; i += this.config.batchSize) {
        const batch = legacyComments.slice(i, i + this.config.batchSize);
        
        for (const legacyComment of batch) {
          try {
            const authorId = this.userIdMapping.get(legacyComment.author_id);
            const ticketId = ticketMapping.get(legacyComment.ticket_number);

            if (!authorId) {
              throw new Error(`Author ID ${legacyComment.author_id} not found in user mapping`);
            }

            if (!ticketId) {
              throw new Error(`Ticket ID for ticket number ${legacyComment.ticket_number} not found`);
            }

            const commentData = {
              id: crypto.randomUUID(),
              ticket_id: ticketId,
              author_id: authorId,
              content: legacyComment.content,
              is_internal: legacyComment.is_internal || false,
              mentioned_users: legacyComment.mentioned_users || [],
              created_at: legacyComment.created_at,
              updated_at: legacyComment.updated_at
            };

            if (!this.config.dryRun) {
              const { error } = await this.supabase
                .from('staff_ticket_comments')
                .insert(commentData);

              if (error) {
                throw error;
              }
            }

            result.migratedRecords++;
            
          } catch (error) {
            result.failedRecords++;
            result.errors.push({
              record: legacyComment,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(`Failed to migrate comment ${legacyComment.id}:`, error);
          }
        }
        
        console.log(`Migrated ${Math.min(i + this.config.batchSize, legacyComments.length)}/${legacyComments.length} comments`);
      }

    } catch (error) {
      console.error('Comment migration failed:', error);
      throw error;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async migrateAttachments(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      table: 'staff_attachments',
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log('Migrating attachments...');
      
      // Get legacy attachments with ticket mapping
      const [rows] = await this.legacyDb.execute(`
        SELECT a.*, t.ticket_number 
        FROM attachments a
        JOIN tickets t ON a.ticket_id = t.id
        WHERE a.deleted_at IS NULL 
        ORDER BY a.id
      `);
      const legacyAttachments = rows as (LegacyAttachment & { ticket_number: string })[];
      
      result.totalRecords = legacyAttachments.length;
      console.log(`Found ${legacyAttachments.length} attachments to migrate`);

      // Get ticket ID mapping
      const { data: tickets } = await this.supabase
        .from('staff_tickets')
        .select('id, ticket_number');
      
      const ticketMapping = new Map<string, string>();
      tickets?.forEach(ticket => {
        ticketMapping.set(ticket.ticket_number, ticket.id);
      });

      // Process in batches
      for (let i = 0; i < legacyAttachments.length; i += this.config.batchSize) {
        const batch = legacyAttachments.slice(i, i + this.config.batchSize);
        
        for (const legacyAttachment of batch) {
          try {
            const uploadedById = this.userIdMapping.get(legacyAttachment.uploaded_by);
            const ticketId = ticketMapping.get(legacyAttachment.ticket_number);

            if (!uploadedById) {
              throw new Error(`Uploader ID ${legacyAttachment.uploaded_by} not found in user mapping`);
            }

            if (!ticketId) {
              throw new Error(`Ticket ID for ticket number ${legacyAttachment.ticket_number} not found`);
            }

            const attachmentData = {
              id: crypto.randomUUID(),
              ticket_id: ticketId,
              uploaded_by: uploadedById,
              file_name: legacyAttachment.file_name,
              file_path: legacyAttachment.file_path, // Will need to migrate files to Supabase Storage
              file_size: legacyAttachment.file_size,
              file_type: legacyAttachment.file_type,
              virus_scan_status: legacyAttachment.virus_scan_status || 'pending',
              description: legacyAttachment.description || null,
              storage_provider: 'legacy', // Mark as legacy until files are migrated
              created_at: legacyAttachment.created_at
            };

            if (!this.config.dryRun) {
              const { error } = await this.supabase
                .from('staff_attachments')
                .insert(attachmentData);

              if (error) {
                throw error;
              }
            }

            result.migratedRecords++;
            
          } catch (error) {
            result.failedRecords++;
            result.errors.push({
              record: legacyAttachment,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(`Failed to migrate attachment ${legacyAttachment.id}:`, error);
          }
        }
        
        console.log(`Migrated ${Math.min(i + this.config.batchSize, legacyAttachments.length)}/${legacyAttachments.length} attachments`);
      }

    } catch (error) {
      console.error('Attachment migration failed:', error);
      throw error;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  // Helper methods for data mapping

  private mapUserRole(legacyRole: string): 'staff' | 'manager' | 'admin' {
    const roleMap: Record<string, 'staff' | 'manager' | 'admin'> = {
      'employee': 'staff',
      'staff': 'staff',
      'supervisor': 'manager',
      'manager': 'manager',
      'administrator': 'admin',
      'admin': 'admin'
    };
    
    return roleMap[legacyRole?.toLowerCase()] || 'staff';
  }

  private mapLocation(legacyLocation: string): 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple' {
    const locationMap: Record<string, 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple'> = {
      'northfield': 'Northfield',
      'woodbury': 'Woodbury',
      'burnsville': 'Burnsville',
      'multiple': 'Multiple',
      'all': 'Multiple'
    };
    
    return locationMap[legacyLocation?.toLowerCase()] || 'Multiple';
  }

  private mapTicketStatus(legacyStatus: string): 'pending' | 'open' | 'in_progress' | 'completed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'open' | 'in_progress' | 'completed' | 'cancelled'> = {
      'new': 'pending',
      'pending': 'pending',
      'open': 'open',
      'in_progress': 'in_progress',
      'working': 'in_progress',
      'resolved': 'completed',
      'completed': 'completed',
      'closed': 'completed',
      'cancelled': 'cancelled',
      'rejected': 'cancelled'
    };
    
    return statusMap[legacyStatus?.toLowerCase()] || 'pending';
  }

  private mapTicketPriority(legacyPriority: string): 'low' | 'normal' | 'high' | 'urgent' {
    const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
      '1': 'low',
      '2': 'normal',
      '3': 'high',
      '4': 'urgent',
      'low': 'low',
      'normal': 'normal',
      'medium': 'normal',
      'high': 'high',
      'urgent': 'urgent',
      'critical': 'urgent'
    };
    
    return priorityMap[legacyPriority?.toLowerCase()] || 'normal';
  }

  private async updateManagerRelationships(legacyUsers: LegacyUser[]): Promise<void> {
    console.log('Updating manager relationships...');
    
    for (const legacyUser of legacyUsers) {
      if (legacyUser.manager_id) {
        const userId = this.userIdMapping.get(legacyUser.id);
        const managerId = this.userIdMapping.get(legacyUser.manager_id);
        
        if (userId && managerId) {
          await this.supabase
            .from('staff_user_profiles')
            .update({ manager_id: managerId })
            .eq('id', userId);
        }
      }
    }
  }

  private async createDefaultFormDefinitions(): Promise<void> {
    if (this.config.dryRun) return;
    
    console.log('Creating default form definitions...');
    
    const defaultForms = [
      {
        form_type: 'general_request',
        display_name: 'General Request',
        description: 'General support request form',
        category: 'general',
        form_schema: {
          type: 'object',
          properties: {
            description: { type: 'string', title: 'Description' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], title: 'Priority' }
          },
          required: ['description']
        },
        is_active: true,
        requires_manager_approval: false,
        requires_admin_approval: false,
        sla_hours: 48
      },
      {
        form_type: 'it_support',
        display_name: 'IT Support Request',
        description: 'Technical support and IT issues',
        category: 'it',
        form_schema: {
          type: 'object',
          properties: {
            issue_type: { type: 'string', enum: ['hardware', 'software', 'network', 'account'], title: 'Issue Type' },
            description: { type: 'string', title: 'Description' },
            urgency: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], title: 'Urgency' }
          },
          required: ['issue_type', 'description']
        },
        is_active: true,
        requires_manager_approval: false,
        requires_admin_approval: false,
        sla_hours: 24
      }
    ];

    for (const form of defaultForms) {
      const { error } = await this.supabase
        .from('staff_form_definitions')
        .upsert({
          id: crypto.randomUUID(),
          ...form,
          created_by: 'migration-script'
        });

      if (error) {
        console.error(`Failed to create form ${form.form_type}:`, error);
      }
    }
  }

  private printMigrationSummary(results: MigrationResult[]): void {
    console.log('\n=== MIGRATION SUMMARY ===');
    
    let totalRecords = 0;
    let totalMigrated = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    for (const result of results) {
      totalRecords += result.totalRecords;
      totalMigrated += result.migratedRecords;
      totalFailed += result.failedRecords;
      totalDuration += result.duration;

      console.log(`\n${result.table}:`);
      console.log(`  Total: ${result.totalRecords}`);
      console.log(`  Migrated: ${result.migratedRecords}`);
      console.log(`  Failed: ${result.failedRecords}`);
      console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);
      
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        result.errors.slice(0, 5).forEach(error => {
          console.log(`    - ${error.error}`);
        });
        if (result.errors.length > 5) {
          console.log(`    ... and ${result.errors.length - 5} more errors`);
        }
      }
    }

    console.log(`\nOVERALL:`);
    console.log(`  Total Records: ${totalRecords}`);
    console.log(`  Successfully Migrated: ${totalMigrated}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalMigrated / totalRecords) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  }
}

// CLI script to run migration
export async function runMigration(options: {
  dryRun?: boolean;
  batchSize?: number;
}): Promise<void> {
  const config: MigrationConfig = {
    legacyDb: {
      host: process.env.LEGACY_DB_HOST!,
      user: process.env.LEGACY_DB_USER!,
      password: process.env.LEGACY_DB_PASS!,
      database: process.env.LEGACY_DB_NAME!,
      port: parseInt(process.env.LEGACY_DB_PORT || '3306')
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    },
    batchSize: options.batchSize || 50,
    dryRun: options.dryRun || false
  };

  // Validate required environment variables
  const requiredVars = [
    'LEGACY_DB_HOST', 'LEGACY_DB_USER', 'LEGACY_DB_PASS', 'LEGACY_DB_NAME',
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  const migrator = new LegacyDataMigrator(config);

  try {
    await migrator.connect();
    await migrator.migrateAll();
  } finally {
    await migrator.disconnect();
  }
}

// If running directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 50;

  runMigration({ dryRun, batchSize })
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}