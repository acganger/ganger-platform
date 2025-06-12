import { ZenefitsComplianceSync } from '../../../server/zenefits/ZenefitsComplianceSync';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
};
(createClient as jest.Mock).mockReturnValue(mockSupabase);

// Mock external HTTP requests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock audit logging
jest.mock('@ganger/utils/server', () => ({
  auditLog: jest.fn()
}));

describe('ZenefitsComplianceSync Integration Tests', () => {
  let zenefitsSync: ZenefitsComplianceSync;

  beforeEach(() => {
    jest.clearAllMocks();
    zenefitsSync = new ZenefitsComplianceSync();
    
    // Set up environment variables
    process.env.ZENEFITS_API_TOKEN = 'test-zenefits-token';
    process.env.ZENEFITS_API_BASE_URL = 'https://api.zenefits.com/core';
  });

  describe('API Authentication', () => {
    it('should include correct authorization headers in API requests', async () => {
      const mockEmployeesResponse = {
        data: [],
        next_url: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployeesResponse,
        status: 200,
        statusText: 'OK'
      } as Response);

      // Mock sync log update
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      await zenefitsSync.syncEmployees('sync-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.zenefits.com/core/people'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-zenefits-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle authentication errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid token' })
      } as Response);

      // Mock sync log update for failure
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      await expect(zenefitsSync.syncEmployees('sync-123')).rejects.toThrow('Zenefits API Error (401): Invalid token');
    });

    it('should handle rate limiting with retry logic', async () => {
      // First request: rate limited
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({ 'Retry-After': '2' }),
        json: async () => ({ error: 'Rate limit exceeded' })
      } as Response);

      // Second request: successful
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], next_url: null }),
        status: 200,
        statusText: 'OK'
      } as Response);

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      const result = await zenefitsSync.syncEmployees('sync-123');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.processed).toBe(0);
    });
  });

  describe('Employee Data Synchronization', () => {
    it('should successfully sync employee data from Zenefits API', async () => {
      const mockZenefitsEmployees = [
        {
          id: 'zenefits-emp-1',
          first_name: 'John',
          last_name: 'Doe',
          personal_email: 'john.doe@personal.com',
          work_email: 'john@gangerdermatology.com',
          department: { name: 'Dermatology' },
          location: { name: 'Main Office' },
          title: 'Dermatologist',
          start_date: '2024-01-15',
          employment_status: { name: 'Active' },
          manager: { id: 'manager-123' }
        },
        {
          id: 'zenefits-emp-2',
          first_name: 'Jane',
          last_name: 'Smith',
          personal_email: 'jane.smith@personal.com',
          work_email: 'jane@gangerdermatology.com',
          department: { name: 'Administration' },
          location: { name: 'Main Office' },
          title: 'Office Manager',
          start_date: '2023-06-01',
          employment_status: { name: 'Active' },
          manager: null
        }
      ];

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockZenefitsEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      // Mock database operations
      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [
            { id: 'emp-1', zenefits_id: 'zenefits-emp-1' },
            { id: 'emp-2', zenefits_id: 'zenefits-emp-2' }
          ],
          error: null
        })
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return { upsert: mockUpsert };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      const result = await zenefitsSync.syncEmployees('sync-123');

      expect(result.processed).toBe(2);
      expect(result.total).toBe(2);
      expect(result.errors).toEqual([]);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            zenefits_id: 'zenefits-emp-1',
            email: 'john@gangerdermatology.com',
            first_name: 'John',
            last_name: 'Doe',
            department: 'Dermatology',
            location: 'Main Office',
            job_title: 'Dermatologist',
            start_date: '2024-01-15',
            status: 'active'
          }),
          expect.objectContaining({
            zenefits_id: 'zenefits-emp-2',
            email: 'jane@gangerdermatology.com',
            first_name: 'Jane',
            last_name: 'Smith',
            department: 'Administration',
            location: 'Main Office',
            job_title: 'Office Manager',
            start_date: '2023-06-01',
            status: 'active'
          })
        ]),
        expect.objectContaining({
          onConflict: 'zenefits_id'
        })
      );
    });

    it('should handle paginated API responses', async () => {
      const mockPage1Response = {
        data: [
          {
            id: 'zenefits-emp-1',
            first_name: 'John',
            last_name: 'Doe',
            work_email: 'john@gangerdermatology.com',
            department: { name: 'Dermatology' },
            employment_status: { name: 'Active' }
          }
        ],
        next_url: 'https://api.zenefits.com/core/people?page=2'
      };

      const mockPage2Response = {
        data: [
          {
            id: 'zenefits-emp-2',
            first_name: 'Jane',
            last_name: 'Smith',
            work_email: 'jane@gangerdermatology.com',
            department: { name: 'Administration' },
            employment_status: { name: 'Active' }
          }
        ],
        next_url: null
      };

      // Mock paginated API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage1Response,
          status: 200,
          statusText: 'OK'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPage2Response,
          status: 200,
          statusText: 'OK'
        } as Response);

      // Mock database operations
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                data: [
                  { id: 'emp-1', zenefits_id: 'zenefits-emp-1' },
                  { id: 'emp-2', zenefits_id: 'zenefits-emp-2' }
                ],
                error: null
              })
            })
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      const result = await zenefitsSync.syncEmployees('sync-123');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.processed).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should handle employees with missing required fields', async () => {
      const mockZenefitsEmployees = [
        {
          id: 'zenefits-emp-1',
          first_name: 'John',
          last_name: 'Doe',
          work_email: 'john@gangerdermatology.com',
          department: { name: 'Dermatology' },
          employment_status: { name: 'Active' },
          start_date: '2024-01-15'
        },
        {
          id: 'zenefits-emp-2',
          first_name: 'Jane',
          last_name: 'Smith',
          // Missing work_email
          department: { name: 'Administration' },
          employment_status: { name: 'Active' }
        },
        {
          id: 'zenefits-emp-3',
          first_name: 'Bob',
          // Missing last_name
          work_email: 'bob@gangerdermatology.com',
          department: { name: 'IT' },
          employment_status: { name: 'Active' }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockZenefitsEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                data: [{ id: 'emp-1', zenefits_id: 'zenefits-emp-1' }],
                error: null
              })
            })
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      const result = await zenefitsSync.syncEmployees('sync-123');

      expect(result.processed).toBe(1); // Only valid employee processed
      expect(result.total).toBe(3);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Missing required field: work_email'),
          expect.stringContaining('Missing required field: last_name')
        ])
      );
    });

    it('should handle terminated employees correctly', async () => {
      const mockZenefitsEmployees = [
        {
          id: 'zenefits-emp-1',
          first_name: 'Former',
          last_name: 'Employee',
          work_email: 'former@gangerdermatology.com',
          department: { name: 'Dermatology' },
          employment_status: { name: 'Terminated' },
          start_date: '2023-01-01',
          termination_date: '2024-06-15'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockZenefitsEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const mockUpsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          data: [{ id: 'emp-1', zenefits_id: 'zenefits-emp-1' }],
          error: null
        })
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return { upsert: mockUpsert };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      const result = await zenefitsSync.syncEmployees('sync-123');

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            zenefits_id: 'zenefits-emp-1',
            status: 'terminated',
            termination_date: '2024-06-15'
          })
        ]),
        expect.any(Object)
      );
      expect(result.processed).toBe(1);
    });

    it('should handle database errors during upsert operations', async () => {
      const mockZenefitsEmployees = [
        {
          id: 'zenefits-emp-1',
          first_name: 'John',
          last_name: 'Doe',
          work_email: 'john@gangerdermatology.com',
          department: { name: 'Dermatology' },
          employment_status: { name: 'Active' }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockZenefitsEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      // Mock database error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                data: null,
                error: { message: 'Database constraint violation' }
              })
            })
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      await expect(zenefitsSync.syncEmployees('sync-123')).rejects.toThrow('Database constraint violation');
    });
  });

  describe('Batch Processing', () => {
    it('should process employees in configurable batches', async () => {
      const mockEmployees = Array.from({ length: 250 }, (_, i) => ({
        id: `zenefits-emp-${i + 1}`,
        first_name: `Employee`,
        last_name: `${i + 1}`,
        work_email: `employee${i + 1}@gangerdermatology.com`,
        department: { name: 'Dermatology' },
        employment_status: { name: 'Active' }
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      let batchCount = 0;
      const mockUpsert = jest.fn().mockImplementation((employees) => {
        batchCount++;
        return {
          select: jest.fn().mockReturnValue({
            data: employees.map((emp: any, i: number) => ({ 
              id: `emp-${batchCount}-${i + 1}`, 
              zenefits_id: emp.zenefits_id 
            })),
            error: null
          })
        };
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return { upsert: mockUpsert };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      const result = await zenefitsSync.syncEmployees('sync-123', {
        batchSize: 50
      });

      expect(batchCount).toBe(5); // 250 employees / 50 batch size = 5 batches
      expect(result.processed).toBe(250);
      expect(result.total).toBe(250);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should continue processing after partial batch failures', async () => {
      const mockEmployees = [
        {
          id: 'zenefits-emp-1',
          first_name: 'Good',
          last_name: 'Employee',
          work_email: 'good@gangerdermatology.com',
          department: { name: 'Dermatology' },
          employment_status: { name: 'Active' }
        },
        {
          id: 'zenefits-emp-2',
          first_name: 'Bad',
          last_name: 'Employee',
          work_email: 'bad@gangerdermatology.com',
          department: { name: 'Dermatology' },
          employment_status: { name: 'Active' }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      let callCount = 0;
      const mockUpsert = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First employee fails
          return {
            select: jest.fn().mockReturnValue({
              data: null,
              error: { message: 'Constraint violation for first employee' }
            })
          };
        } else {
          // Second employee succeeds
          return {
            select: jest.fn().mockReturnValue({
              data: [{ id: 'emp-2', zenefits_id: 'zenefits-emp-2' }],
              error: null
            })
          };
        }
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return { upsert: mockUpsert };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      const result = await zenefitsSync.syncEmployees('sync-123', {
        batchSize: 1, // Process one at a time to test individual failures
        continueOnError: true
      });

      expect(result.processed).toBe(1); // One succeeded
      expect(result.total).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Constraint violation for first employee');
    });

    it('should respect sync cancellation', async () => {
      const mockEmployees = Array.from({ length: 100 }, (_, i) => ({
        id: `zenefits-emp-${i + 1}`,
        first_name: `Employee`,
        last_name: `${i + 1}`,
        work_email: `employee${i + 1}@gangerdermatology.com`,
        department: { name: 'Dermatology' },
        employment_status: { name: 'Active' }
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      // Mock sync cancellation after first batch
      let batchCount = 0;
      const mockUpsert = jest.fn().mockImplementation(() => {
        batchCount++;
        if (batchCount === 2) {
          // Simulate cancellation signal
          throw new Error('Sync cancelled by user');
        }
        return {
          select: jest.fn().mockReturnValue({
            data: [{ id: `emp-${batchCount}`, zenefits_id: `zenefits-emp-${batchCount}` }],
            error: null
          })
        };
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return { upsert: mockUpsert };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      await expect(zenefitsSync.syncEmployees('sync-123', {
        batchSize: 50
      })).rejects.toThrow('Sync cancelled by user');

      expect(batchCount).toBe(2); // Should stop after cancellation
    });
  });

  describe('New Hire Training Assignment', () => {
    it('should automatically assign required trainings to new employees', async () => {
      const mockNewEmployee = {
        id: 'zenefits-emp-new',
        first_name: 'New',
        last_name: 'Employee',
        work_email: 'new@gangerdermatology.com',
        department: { name: 'Dermatology' },
        employment_status: { name: 'Active' },
        start_date: new Date().toISOString().split('T')[0] // Today
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockNewEmployee],
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const mockTrainingAssignment = jest.fn().mockReturnValue({
        data: [
          { module_id: 'module-1', employee_id: 'emp-new' },
          { module_id: 'module-2', employee_id: 'emp-new' }
        ],
        error: null
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                data: [{ id: 'emp-new', zenefits_id: 'zenefits-emp-new', is_new_hire: true }],
                error: null
              })
            })
          };
        }
        if (table === 'training_completions') {
          return { insert: mockTrainingAssignment };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      // Mock required training modules query
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: [
          { module_id: 'module-1', module_name: 'HIPAA Training' },
          { module_id: 'module-2', module_name: 'Safety Training' }
        ],
        error: null
      });

      const result = await zenefitsSync.syncEmployees('sync-123', {
        assignNewHireTraining: true
      });

      expect(result.newHires).toBe(1);
      expect(mockTrainingAssignment).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            employee_id: 'emp-new',
            module_id: 'module-1',
            status: 'not_started'
          }),
          expect.objectContaining({
            employee_id: 'emp-new',
            module_id: 'module-2',
            status: 'not_started'
          })
        ])
      );
    });
  });

  describe('Sync Logging and Monitoring', () => {
    it('should properly update sync logs throughout the process', async () => {
      const mockEmployees = [
        {
          id: 'zenefits-emp-1',
          first_name: 'Test',
          last_name: 'Employee',
          work_email: 'test@gangerdermatology.com',
          department: { name: 'Dermatology' },
          employment_status: { name: 'Active' }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockEmployees,
          next_url: null
        }),
        status: 200,
        statusText: 'OK'
      } as Response);

      const mockUpdateSyncLog = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: null,
          error: null
        })
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                data: [{ id: 'emp-1', zenefits_id: 'zenefits-emp-1' }],
                error: null
              })
            })
          };
        }
        if (table === 'sync_logs') {
          return { update: mockUpdateSyncLog };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        };
      });

      await zenefitsSync.syncEmployees('sync-123');

      // Should update sync log with progress and final results
      expect(mockUpdateSyncLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          records_processed: 1,
          records_total: 1,
          end_time: expect.any(String),
          summary: expect.any(Object)
        })
      );
    });
  });
});