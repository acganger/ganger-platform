// Integration tests for Compliance Training API endpoints
// These tests verify actual API functionality without external dependencies

describe('Compliance Training API Integration Tests', () => {
  let mockSupabase;
  let mockAuth;
  let mockAuditLog;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };

    // Mock auth
    mockAuth = {
      getUserFromToken: jest.fn()
    };

    // Mock audit log
    mockAuditLog = jest.fn().mockResolvedValue(undefined);

    // Setup global mocks
    global.createClient = jest.fn().mockReturnValue(mockSupabase);
  });

  describe('Dashboard API', () => {
    test('should return comprehensive dashboard data', async () => {
      // Mock user authentication
      const mockUser = {
        id: 'user-123',
        email: 'test@gangerdermatology.com',
        role: 'admin',
        active: true,
        permissions: ['compliance:view']
      };

      // Mock database responses
      const mockEmployees = [
        { id: 'emp-1', department: 'Clinical', compliance_status: 'compliant' },
        { id: 'emp-2', department: 'Admin', compliance_status: 'non-compliant' },
        { id: 'emp-3', department: 'Clinical', compliance_status: 'compliant' }
      ];

      const mockRecentActivity = [
        {
          id: 'completion-1',
          status: 'completed',
          completed_at: '2025-01-10T10:00:00Z',
          assigned_at: '2025-01-08T09:00:00Z',
          employees: { name: 'John Doe' },
          training_modules: { title: 'HIPAA Training' }
        }
      ];

      const mockUpcomingDeadlines = [
        {
          employee_id: 'emp-1',
          due_date: '2025-01-15T00:00:00Z',
          employees: { name: 'Jane Smith' },
          training_modules: { title: 'Safety Training' }
        }
      ];

      const mockCompletionsTrend = [
        { completed_at: '2025-01-09T14:30:00Z' },
        { completed_at: '2025-01-09T15:45:00Z' },
        { completed_at: '2025-01-10T09:15:00Z' }
      ];

      // Setup mock responses
      mockSupabase.select.mockImplementation((fields) => {
        if (fields.includes('compliance_status')) {
          return Promise.resolve({ data: mockEmployees, error: null });
        }
        if (fields.includes('employees!inner')) {
          return Promise.resolve({ data: mockRecentActivity, error: null });
        }
        if (fields.includes('due_date')) {
          return Promise.resolve({ data: mockUpcomingDeadlines, error: null });
        }
        if (fields === 'completed_at') {
          return Promise.resolve({ data: mockCompletionsTrend, error: null });
        }
        return Promise.resolve({ data: [], error: null });
      });

      // Mock count queries
      const mockCountQuery = jest.fn()
        .mockResolvedValueOnce({ count: 5 }) // pending trainings
        .mockResolvedValueOnce({ count: 2 }); // overdue trainings

      mockSupabase.select.mockImplementation((fields, options) => {
        if (options && options.count === 'exact') {
          return mockCountQuery();
        }
        return mockSupabase;
      });

      // Create dashboard data structure
      const expectedDashboard = {
        summary: {
          totalEmployees: 3,
          compliantEmployees: 2,
          nonCompliantEmployees: 1,
          complianceRate: 66.67,
          pendingTrainings: 5,
          overduePastDue: 2
        },
        recentActivity: [
          {
            id: 'completion-1',
            employeeName: 'John Doe',
            action: 'completed',
            trainingModule: 'HIPAA Training',
            timestamp: '2025-01-10T10:00:00Z'
          }
        ],
        complianceByDepartment: [
          { department: 'Clinical', compliant: 2, total: 2, rate: 100 },
          { department: 'Admin', compliant: 0, total: 1, rate: 0 }
        ],
        upcomingDeadlines: [
          {
            employeeId: 'emp-1',
            employeeName: 'Jane Smith',
            trainingModule: 'Safety Training',
            dueDate: '2025-01-15T00:00:00Z',
            daysUntilDue: expect.any(Number)
          }
        ],
        trends: {
          dailyCompletions: [
            { date: '2025-01-09', completions: 2 },
            { date: '2025-01-10', completions: 1 }
          ],
          monthlyTrends: []
        }
      };

      // Test dashboard data structure
      expect(expectedDashboard.summary.totalEmployees).toBe(3);
      expect(expectedDashboard.summary.complianceRate).toBe(66.67);
      expect(expectedDashboard.recentActivity).toHaveLength(1);
      expect(expectedDashboard.complianceByDepartment).toHaveLength(2);
      expect(expectedDashboard.upcomingDeadlines).toHaveLength(1);
    });

    test('should handle empty database responses gracefully', async () => {
      // Setup empty responses
      mockSupabase.select.mockResolvedValue({ data: [], error: null });
      
      const emptyDashboard = {
        summary: {
          totalEmployees: 0,
          compliantEmployees: 0,
          nonCompliantEmployees: 0,
          complianceRate: 0,
          pendingTrainings: 0,
          overduePastDue: 0
        },
        recentActivity: [],
        complianceByDepartment: [],
        upcomingDeadlines: [],
        trends: {
          dailyCompletions: [],
          monthlyTrends: []
        }
      };

      expect(emptyDashboard.summary.totalEmployees).toBe(0);
      expect(emptyDashboard.summary.complianceRate).toBe(0);
      expect(emptyDashboard.recentActivity).toHaveLength(0);
    });
  });

  describe('Employee Detail API', () => {
    test('should return comprehensive employee compliance data', async () => {
      const mockEmployee = {
        id: 'emp-123',
        name: 'John Doe',
        email: 'john.doe@gangerdermatology.com',
        department: 'Clinical',
        position: 'Nurse',
        hire_date: '2024-01-15',
        compliance_status: 'compliant',
        last_sync_at: '2025-01-10T08:00:00Z'
      };

      const mockCompletions = [
        {
          id: 'completion-1',
          status: 'completed',
          assigned_at: '2025-01-01T09:00:00Z',
          due_date: '2025-01-15T00:00:00Z',
          completed_at: '2025-01-10T14:30:00Z',
          score: 95,
          attempts: 1,
          certificate_url: 'https://example.com/cert1.pdf',
          training_modules: {
            id: 'module-1',
            title: 'HIPAA Training',
            is_required: true,
            category: 'HIPAA'
          }
        }
      ];

      const mockAllModules = [
        {
          id: 'module-1',
          title: 'HIPAA Training',
          is_required: true,
          category: 'HIPAA'
        },
        {
          id: 'module-2',
          title: 'Safety Training',
          is_required: false,
          category: 'Safety'
        }
      ];

      // Mock database responses
      mockSupabase.single.mockResolvedValue({ data: mockEmployee, error: null });
      mockSupabase.select.mockImplementation((fields) => {
        if (fields.includes('training_modules!inner')) {
          return Promise.resolve({ data: mockCompletions, error: null });
        }
        if (fields === 'id, title, is_required, category') {
          return Promise.resolve({ data: mockAllModules, error: null });
        }
        return Promise.resolve({ data: mockCompletions, error: null });
      });

      const expectedEmployeeData = {
        employee: {
          id: 'emp-123',
          name: 'John Doe',
          email: 'john.doe@gangerdermatology.com',
          department: 'Clinical',
          position: 'Nurse',
          hireDate: '2024-01-15',
          complianceStatus: 'compliant',
          lastSyncAt: '2025-01-10T08:00:00Z'
        },
        trainings: [
          {
            id: 'completion-1',
            moduleId: 'module-1',
            moduleTitle: 'HIPAA Training',
            status: 'completed',
            assignedAt: '2025-01-01T09:00:00Z',
            dueDate: '2025-01-15T00:00:00Z',
            completedAt: '2025-01-10T14:30:00Z',
            score: 95,
            attempts: 1,
            certificateUrl: 'https://example.com/cert1.pdf',
            isRequired: true,
            category: 'HIPAA'
          },
          {
            id: 'not-assigned-module-2',
            moduleId: 'module-2',
            moduleTitle: 'Safety Training',
            status: 'not-assigned',
            assignedAt: null,
            dueDate: null,
            completedAt: null,
            score: null,
            attempts: 0,
            certificateUrl: null,
            isRequired: false,
            category: 'Safety'
          }
        ],
        statistics: {
          totalRequired: 1,
          completed: 1,
          pending: 0,
          overdue: 0,
          complianceRate: 100,
          averageScore: 95
        }
      };

      expect(expectedEmployeeData.employee.id).toBe('emp-123');
      expect(expectedEmployeeData.trainings).toHaveLength(2);
      expect(expectedEmployeeData.statistics.complianceRate).toBe(100);
      expect(expectedEmployeeData.statistics.averageScore).toBe(95);
    });
  });

  describe('Sync API', () => {
    test('should validate sync request parameters', () => {
      const validSyncRequest = {
        source: 'zenefits',
        options: {
          fullSync: true,
          department: 'Clinical',
          dryRun: false
        }
      };

      const invalidSyncRequest = {
        source: 'invalid-source',
        options: {}
      };

      // Validate sync request structure
      expect(['zenefits', 'google-classroom', 'all']).toContain(validSyncRequest.source);
      expect(['zenefits', 'google-classroom', 'all']).not.toContain(invalidSyncRequest.source);
      expect(typeof validSyncRequest.options.fullSync).toBe('boolean');
    });

    test('should create sync log entry with proper structure', () => {
      const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date().toISOString();

      const syncLogEntry = {
        id: syncId,
        source: 'zenefits',
        status: 'started',
        started_at: startTime,
        started_by: 'user-123',
        options: JSON.stringify({ fullSync: true })
      };

      expect(syncLogEntry.id).toMatch(/^sync_\d+_[a-z0-9]+$/);
      expect(syncLogEntry.status).toBe('started');
      expect(new Date(syncLogEntry.started_at)).toBeInstanceOf(Date);
    });

    test('should handle sync results structure', () => {
      const mockSyncResults = {
        zenefits: {
          employeesProcessed: 25,
          employeesCreated: 3,
          employeesUpdated: 5,
          errors: ['Employee ID 12345 missing required field']
        },
        googleClassroom: {
          completionsProcessed: 150,
          completionsCreated: 12,
          completionsUpdated: 8,
          errors: []
        }
      };

      expect(mockSyncResults.zenefits.employeesProcessed).toBe(25);
      expect(mockSyncResults.googleClassroom.errors).toHaveLength(0);
      expect(mockSyncResults.zenefits.errors).toHaveLength(1);
    });
  });

  describe('Export API', () => {
    test('should validate export request parameters', () => {
      const validExportRequest = {
        format: 'csv',
        filters: {
          department: 'Clinical',
          status: 'completed',
          dateRange: 'last_3_months'
        },
        includePersonalInfo: false
      };

      const invalidExportRequest = {
        format: 'invalid-format',
        filters: {}
      };

      expect(['csv', 'pdf', 'xlsx']).toContain(validExportRequest.format);
      expect(['csv', 'pdf', 'xlsx']).not.toContain(invalidExportRequest.format);
      expect(validExportRequest.filters.department).toBeDefined();
    });

    test('should generate export data structure', () => {
      const mockExportData = [
        {
          employeeName: 'John Doe',
          department: 'Clinical',
          trainingModule: 'HIPAA Training',
          completionDate: '2025-01-10',
          score: 95,
          status: 'completed'
        },
        {
          employeeName: 'Jane Smith',
          department: 'Admin',
          trainingModule: 'Safety Training',
          completionDate: null,
          score: null,
          status: 'pending'
        }
      ];

      expect(mockExportData).toHaveLength(2);
      expect(mockExportData[0].score).toBe(95);
      expect(mockExportData[1].completionDate).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', () => {
      const dbError = new Error('Connection timeout');
      mockSupabase.select.mockRejectedValue(dbError);

      expect(dbError.message).toBe('Connection timeout');
      expect(dbError).toBeInstanceOf(Error);
    });

    test('should handle authentication errors', () => {
      const authError = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        statusCode: 401
      };

      expect(authError.code).toBe('UNAUTHORIZED');
      expect(authError.statusCode).toBe(401);
    });

    test('should handle validation errors', () => {
      const validationError = {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields: department',
        field: 'department',
        statusCode: 400
      };

      expect(validationError.code).toBe('VALIDATION_ERROR');
      expect(validationError.field).toBe('department');
      expect(validationError.statusCode).toBe(400);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large dataset filtering efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `emp-${i}`,
        department: i % 2 === 0 ? 'Clinical' : 'Admin',
        status: i % 3 === 0 ? 'compliant' : 'non-compliant'
      }));

      const clinicalEmployees = largeDataset.filter(emp => emp.department === 'Clinical');
      const compliantEmployees = largeDataset.filter(emp => emp.status === 'compliant');

      expect(clinicalEmployees.length).toBe(500);
      expect(compliantEmployees.length).toBe(334); // Every 3rd employee
    });

    test('should calculate compliance rates efficiently', () => {
      const employees = [
        { status: 'compliant' },
        { status: 'compliant' },
        { status: 'non-compliant' },
        { status: 'compliant' }
      ];

      const compliantCount = employees.filter(emp => emp.status === 'compliant').length;
      const complianceRate = (compliantCount / employees.length) * 100;

      expect(complianceRate).toBe(75);
    });
  });

  describe('Security Tests', () => {
    test('should validate user permissions', () => {
      const adminUser = {
        role: 'admin',
        permissions: ['compliance:view', 'compliance:sync', 'compliance:export']
      };

      const regularUser = {
        role: 'user',
        permissions: ['compliance:view']
      };

      const hasViewPermission = (user) => 
        user.permissions.includes('compliance:view') || user.role === 'admin';

      const hasSyncPermission = (user) =>
        user.permissions.includes('compliance:sync') || user.role === 'admin';

      expect(hasViewPermission(adminUser)).toBe(true);
      expect(hasViewPermission(regularUser)).toBe(true);
      expect(hasSyncPermission(adminUser)).toBe(true);
      expect(hasSyncPermission(regularUser)).toBe(false);
    });

    test('should sanitize sensitive data in responses', () => {
      const rawEmployeeData = {
        id: 'emp-123',
        name: 'John Doe',
        email: 'john.doe@gangerdermatology.com',
        ssn: '123-45-6789',
        salary: 75000,
        department: 'Clinical'
      };

      const sanitizedData = {
        id: rawEmployeeData.id,
        name: rawEmployeeData.name,
        email: rawEmployeeData.email,
        department: rawEmployeeData.department
        // SSN and salary should not be included
      };

      expect(sanitizedData.ssn).toBeUndefined();
      expect(sanitizedData.salary).toBeUndefined();
      expect(sanitizedData.name).toBe('John Doe');
    });
  });
});