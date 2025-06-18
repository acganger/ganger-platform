#!/usr/bin/env node

/**
 * Ganger Platform MCP Server
 * 
 * Provides testing and development support for the Ganger Platform medical applications.
 * Features include:
 * - Mock authentication for testing
 * - Test user management
 * - Application state simulation
 * - Database seeding and cleanup
 * - API endpoint testing helpers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { GangerPlatformAuth } from './auth/mockAuth.js';
import { TestDataManager } from './data/testDataManager.js';
import { ApplicationTester } from './testing/applicationTester.js';
import { DatabaseManager } from './database/databaseManager.js';

// Load environment variables
config();

/**
 * Main MCP Server implementation for Ganger Platform
 */
class GangerPlatformMCPServer {
  private server: Server;
  private auth: GangerPlatformAuth;
  private testData: TestDataManager;
  private appTester: ApplicationTester;
  private dbManager: DatabaseManager;

  constructor() {
    this.server = new Server(
      {
        name: 'ganger-platform-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.auth = new GangerPlatformAuth();
    this.testData = new TestDataManager();
    this.appTester = new ApplicationTester();
    this.dbManager = new DatabaseManager();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Authentication Tools
          case 'create_test_user':
            return await this.auth.createTestUser(args);
          case 'generate_test_token':
            return await this.auth.generateTestToken(args);
          case 'mock_google_oauth':
            return await this.auth.mockGoogleOAuth(args);
          case 'validate_test_session':
            return await this.auth.validateTestSession(args);
          case 'cleanup_test_users':
            return await this.auth.cleanupTestUsers();

          // Test Data Management
          case 'seed_test_data':
            return await this.testData.seedTestData(args || {});
          case 'create_test_appointments':
            return await this.testData.createTestAppointments(args);
          case 'create_test_patients':
            return await this.testData.createTestPatients(args);
          case 'create_test_inventory':
            return await this.testData.createTestInventory(args);
          case 'clear_test_data':
            return await this.testData.clearTestData(args);

          // Application Testing
          case 'test_app_authentication':
            return await this.appTester.testAuthentication(args);
          case 'test_api_endpoints':
            return await this.appTester.testApiEndpoints(args);
          case 'test_database_operations':
            return await this.appTester.testDatabaseOperations(args);
          case 'simulate_user_workflow':
            return await this.appTester.simulateUserWorkflow(args);

          // Database Management
          case 'reset_test_database':
            return await this.dbManager.resetTestDatabase();
          case 'backup_test_data':
            return await this.dbManager.backupTestData(args);
          case 'restore_test_data':
            return await this.dbManager.restoreTestData(args);
          case 'check_database_health':
            return await this.dbManager.checkDatabaseHealth();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getAvailableTools(): Tool[] {
    return [
      // Authentication Tools
      {
        name: 'create_test_user',
        description: 'Create a test user account for testing authentication flows',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Test user email (must end with @test.gangerdermatology.com)' },
            role: { type: 'string', enum: ['admin', 'staff', 'viewer'], description: 'User role for permissions testing' },
            department: { type: 'string', description: 'Department assignment' },
            permissions: { type: 'array', items: { type: 'string' }, description: 'App-specific permissions' }
          },
          required: ['email', 'role']
        }
      },
      {
        name: 'generate_test_token',
        description: 'Generate a valid JWT token for testing authenticated requests',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID to generate token for' },
            expiresIn: { type: 'string', default: '1h', description: 'Token expiration time' }
          },
          required: ['userId']
        }
      },
      {
        name: 'mock_google_oauth',
        description: 'Mock Google OAuth flow for testing authentication without real Google account',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Email to simulate OAuth with' },
            returnUrl: { type: 'string', description: 'Return URL after mock OAuth' }
          },
          required: ['email']
        }
      },
      {
        name: 'validate_test_session',
        description: 'Validate a test session token and return user information',
        inputSchema: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT token to validate' }
          },
          required: ['token']
        }
      },
      {
        name: 'cleanup_test_users',
        description: 'Remove all test user accounts and sessions',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // Test Data Management
      {
        name: 'seed_test_data',
        description: 'Populate database with realistic test data for all applications',
        inputSchema: {
          type: 'object',
          properties: {
            applications: { type: 'array', items: { type: 'string' }, description: 'Applications to seed data for' },
            recordCount: { type: 'number', default: 50, description: 'Number of records to create per type' }
          }
        }
      },
      {
        name: 'create_test_appointments',
        description: 'Create test appointment data for scheduling applications',
        inputSchema: {
          type: 'object',
          properties: {
            count: { type: 'number', default: 20, description: 'Number of appointments to create' },
            dateRange: { type: 'string', default: '30', description: 'Days from today to spread appointments' }
          }
        }
      },
      {
        name: 'create_test_patients',
        description: 'Create test patient records with realistic medical data',
        inputSchema: {
          type: 'object',
          properties: {
            count: { type: 'number', default: 100, description: 'Number of patients to create' },
            includeHistories: { type: 'boolean', default: true, description: 'Include medical histories' }
          }
        }
      },
      {
        name: 'create_test_inventory',
        description: 'Create test medical supply inventory data',
        inputSchema: {
          type: 'object',
          properties: {
            count: { type: 'number', default: 200, description: 'Number of inventory items to create' },
            locations: { type: 'array', items: { type: 'string' }, description: 'Locations to distribute inventory across' }
          }
        }
      },
      {
        name: 'clear_test_data',
        description: 'Remove test data from specified applications',
        inputSchema: {
          type: 'object',
          properties: {
            applications: { type: 'array', items: { type: 'string' }, description: 'Applications to clear data from' },
            confirmAction: { type: 'boolean', description: 'Confirmation that data should be deleted' }
          },
          required: ['confirmAction']
        }
      },

      // Application Testing
      {
        name: 'test_app_authentication',
        description: 'Test authentication flow for specific application',
        inputSchema: {
          type: 'object',
          properties: {
            appName: { type: 'string', description: 'Application to test (inventory, handouts, checkin-kiosk, etc.)' },
            testScenarios: { type: 'array', items: { type: 'string' }, description: 'Authentication scenarios to test' }
          },
          required: ['appName']
        }
      },
      {
        name: 'test_api_endpoints',
        description: 'Test all API endpoints for an application with various authentication levels',
        inputSchema: {
          type: 'object',
          properties: {
            appName: { type: 'string', description: 'Application to test' },
            endpoints: { type: 'array', items: { type: 'string' }, description: 'Specific endpoints to test' }
          },
          required: ['appName']
        }
      },
      {
        name: 'test_database_operations',
        description: 'Test database CRUD operations with proper authentication and permissions',
        inputSchema: {
          type: 'object',
          properties: {
            operation: { type: 'string', enum: ['create', 'read', 'update', 'delete', 'all'], description: 'Database operation to test' },
            table: { type: 'string', description: 'Database table to test operations on' }
          },
          required: ['operation']
        }
      },
      {
        name: 'simulate_user_workflow',
        description: 'Simulate complete user workflows for testing end-to-end functionality',
        inputSchema: {
          type: 'object',
          properties: {
            workflow: { type: 'string', description: 'Workflow to simulate (patient-checkin, inventory-scan, handout-generation, etc.)' },
            userType: { type: 'string', description: 'Type of user to simulate workflow for' },
            steps: { type: 'array', items: { type: 'string' }, description: 'Specific workflow steps to test' }
          },
          required: ['workflow', 'userType']
        }
      },

      // Database Management
      {
        name: 'reset_test_database',
        description: 'Reset test database to clean state with fresh migrations',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'backup_test_data',
        description: 'Create backup of current test data state',
        inputSchema: {
          type: 'object',
          properties: {
            backupName: { type: 'string', description: 'Name for the backup' },
            includeLogs: { type: 'boolean', default: false, description: 'Include audit logs in backup' }
          }
        }
      },
      {
        name: 'restore_test_data',
        description: 'Restore test data from a previous backup',
        inputSchema: {
          type: 'object',
          properties: {
            backupName: { type: 'string', description: 'Name of backup to restore' }
          },
          required: ['backupName']
        }
      },
      {
        name: 'check_database_health',
        description: 'Check database connectivity and table integrity for testing',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Ganger Platform MCP Server running on stdio');
  }
}

const server = new GangerPlatformMCPServer();
server.run().catch(console.error);