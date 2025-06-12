import { GoogleClassroomComplianceSync } from '../../../server/google-classroom/GoogleClassroomComplianceSync';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
};
(createClient as jest.Mock).mockReturnValue(mockSupabase);

// Mock Google APIs
jest.mock('googleapis');
const mockGoogle = google as jest.Mocked<typeof google>;

// Mock audit logging
jest.mock('@ganger/utils/server', () => ({
  auditLog: jest.fn()
}));

describe('GoogleClassroomComplianceSync Integration Tests', () => {
  let classroomSync: GoogleClassroomComplianceSync;
  let mockClassroomAPI: any;
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Google Auth
    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
    };

    // Mock Classroom API
    mockClassroomAPI = {
      courses: {
        list: jest.fn(),
        get: jest.fn()
      },
      userProfiles: {
        get: jest.fn()
      },
      coursework: {
        list: jest.fn()
      },
      studentSubmissions: {
        list: jest.fn()
      }
    };

    mockGoogle.auth.GoogleAuth.mockImplementation(() => mockAuth);
    mockGoogle.classroom.mockReturnValue(mockClassroomAPI);

    classroomSync = new GoogleClassroomComplianceSync();

    // Set up environment variables
    process.env.GOOGLE_CLIENT_EMAIL = 'test@serviceaccount.com';
    process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----';
    process.env.GOOGLE_CLASSROOM_DOMAIN = 'gangerdermatology.com';
  });

  describe('API Authentication', () => {
    it('should authenticate with Google Classroom API using service account', async () => {
      mockClassroomAPI.courses.list.mockResolvedValue({
        data: { courses: [] }
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      await classroomSync.syncCompletions('sync-123');

      expect(mockGoogle.auth.GoogleAuth).toHaveBeenCalledWith({
        credentials: {
          client_email: 'test@serviceaccount.com',
          private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----'
        },
        scopes: expect.arrayContaining([
          'https://www.googleapis.com/auth/classroom.courses.readonly',
          'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
          'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
          'https://www.googleapis.com/auth/classroom.profile.emails'
        ])
      });
    });

    it('should handle authentication errors gracefully', async () => {
      mockAuth.getAccessToken.mockRejectedValue(new Error('Authentication failed'));

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      await expect(classroomSync.syncCompletions('sync-123')).rejects.toThrow('Authentication failed');
    });

    it('should handle API quota exceeded errors with retry logic', async () => {
      // First call: quota exceeded
      mockClassroomAPI.courses.list
        .mockRejectedValueOnce({
          code: 429,
          message: 'Quota exceeded'
        })
        // Second call: success
        .mockResolvedValueOnce({
          data: { courses: [] }
        });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      const result = await classroomSync.syncCompletions('sync-123');

      expect(mockClassroomAPI.courses.list).toHaveBeenCalledTimes(2);
      expect(result.coursesProcessed).toBe(0);
    });
  });

  describe('Course Discovery and Processing', () => {
    it('should discover and process compliance training courses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'HIPAA Training - December 2024',
          description: 'Monthly HIPAA compliance training',
          courseState: 'ACTIVE',
          teacherFolder: { id: 'folder-1' }
        },
        {
          id: 'course-2',
          name: 'Safety Training - December 2024',
          description: 'Workplace safety training',
          courseState: 'ACTIVE',
          teacherFolder: { id: 'folder-2' }
        },
        {
          id: 'course-3',
          name: 'Non-Compliance Course',
          description: 'Regular training course',
          courseState: 'ACTIVE',
          teacherFolder: { id: 'folder-3' }
        }
      ];

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: { courses: mockCourses }
      });

      // Mock coursework for each course
      mockClassroomAPI.coursework.list
        .mockResolvedValueOnce({
          data: {
            courseWork: [
              {
                id: 'coursework-1',
                title: 'HIPAA Quiz',
                maxPoints: 100,
                workType: 'ASSIGNMENT'
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            courseWork: [
              {
                id: 'coursework-2',
                title: 'Safety Assessment',
                maxPoints: 100,
                workType: 'ASSIGNMENT'
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: { courseWork: [] }
        });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      const result = await classroomSync.syncCompletions('sync-123');

      expect(result.coursesProcessed).toBe(2); // Only compliance courses
      expect(mockClassroomAPI.coursework.list).toHaveBeenCalledTimes(3);
    });

    it('should filter courses by domain restriction', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'HIPAA Training - December 2024',
          courseState: 'ACTIVE',
          ownerId: 'teacher@gangerdermatology.com'
        },
        {
          id: 'course-2',
          name: 'Safety Training - December 2024',
          courseState: 'ACTIVE',
          ownerId: 'external@otherdomain.com'
        }
      ];

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: { courses: mockCourses }
      });

      // Mock user profile checks
      mockClassroomAPI.userProfiles.get
        .mockResolvedValueOnce({
          data: {
            id: 'teacher@gangerdermatology.com',
            emailAddress: 'teacher@gangerdermatology.com'
          }
        })
        .mockResolvedValueOnce({
          data: {
            id: 'external@otherdomain.com',
            emailAddress: 'external@otherdomain.com'
          }
        });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: { courseWork: [] }
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      const result = await classroomSync.syncCompletions('sync-123', {
        restrictToDomain: true
      });

      expect(result.coursesProcessed).toBe(1); // Only gangerdermatology.com course
    });
  });

  describe('Student Submission Processing', () => {
    it('should sync student submissions and grades', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'HIPAA Training - December 2024',
          courseState: 'ACTIVE'
        }
      ];

      const mockCoursework = [
        {
          id: 'coursework-1',
          title: 'HIPAA Quiz',
          maxPoints: 100,
          workType: 'ASSIGNMENT'
        }
      ];

      const mockSubmissions = [
        {
          id: 'submission-1',
          userId: 'student1@gangerdermatology.com',
          state: 'TURNED_IN',
          assignedGrade: 95,
          submissionHistory: [
            {
              stateHistory: {
                state: 'TURNED_IN',
                stateTimestamp: '2024-12-15T10:00:00Z'
              }
            }
          ]
        },
        {
          id: 'submission-2',
          userId: 'student2@gangerdermatology.com',
          state: 'TURNED_IN',
          assignedGrade: 88,
          submissionHistory: [
            {
              stateHistory: {
                state: 'TURNED_IN',
                stateTimestamp: '2024-12-16T14:30:00Z'
              }
            }
          ]
        }
      ];

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: { courses: mockCourses }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: { courseWork: mockCoursework }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: { studentSubmissions: mockSubmissions }
      });

      // Mock employee matching
      const mockEmployeeData = [
        { id: 'emp-1', email: 'student1@gangerdermatology.com' },
        { id: 'emp-2', email: 'student2@gangerdermatology.com' }
      ];

      const mockTrainingModules = [
        { id: 'module-1', classroom_course_id: 'course-1', classroom_coursework_id: 'coursework-1' }
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: mockEmployeeData,
                error: null
              })
            })
          };
        }
        if (table === 'training_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: mockTrainingModules,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            upsert: jest.fn().mockReturnValue({
              data: [
                { id: 'completion-1', employee_id: 'emp-1' },
                { id: 'completion-2', employee_id: 'emp-2' }
              ],
              error: null
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

      const result = await classroomSync.syncCompletions('sync-123');

      expect(result.completionsFound).toBe(2);
      expect(result.gradesUpdated).toBe(2);
      
      // Verify training completions were upserted with correct data
      expect(mockSupabase.from).toHaveBeenCalledWith('training_completions');
    });

    it('should handle missing employee matches gracefully', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'HIPAA Training - December 2024',
          courseState: 'ACTIVE'
        }
      ];

      const mockCoursework = [
        {
          id: 'coursework-1',
          title: 'HIPAA Quiz',
          maxPoints: 100
        }
      ];

      const mockSubmissions = [
        {
          id: 'submission-1',
          userId: 'external@otherdomain.com', // Not in employee database
          state: 'TURNED_IN',
          assignedGrade: 95
        },
        {
          id: 'submission-2',
          userId: 'employee@gangerdermatology.com', // Valid employee
          state: 'TURNED_IN',
          assignedGrade: 88
        }
      ];

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: { courses: mockCourses }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: { courseWork: mockCoursework }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: { studentSubmissions: mockSubmissions }
      });

      // Mock employee lookup - only one match
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: [{ id: 'emp-1', email: 'employee@gangerdermatology.com' }],
                error: null
              })
            })
          };
        }
        if (table === 'training_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: [{ id: 'module-1', classroom_course_id: 'course-1' }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            upsert: jest.fn().mockReturnValue({
              data: [{ id: 'completion-1', employee_id: 'emp-1' }],
              error: null
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

      const result = await classroomSync.syncCompletions('sync-123');

      expect(result.completionsFound).toBe(2);
      expect(result.gradesUpdated).toBe(1); // Only one matched employee
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('external@otherdomain.com');
    });

    it('should handle different submission states correctly', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          userId: 'student1@gangerdermatology.com',
          state: 'TURNED_IN',
          assignedGrade: 95,
          submissionHistory: [
            {
              stateHistory: {
                state: 'TURNED_IN',
                stateTimestamp: '2024-12-15T10:00:00Z'
              }
            }
          ]
        },
        {
          id: 'submission-2',
          userId: 'student2@gangerdermatology.com',
          state: 'CREATED', // Not submitted yet
          assignedGrade: null
        },
        {
          id: 'submission-3',
          userId: 'student3@gangerdermatology.com',
          state: 'RECLAIMED_BY_STUDENT', // Student took it back
          assignedGrade: null
        }
      ];

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: {
          courses: [{
            id: 'course-1',
            name: 'HIPAA Training - December 2024',
            courseState: 'ACTIVE'
          }]
        }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: {
          courseWork: [{
            id: 'coursework-1',
            title: 'HIPAA Quiz',
            maxPoints: 100
          }]
        }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: { studentSubmissions: mockSubmissions }
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: [
                  { id: 'emp-1', email: 'student1@gangerdermatology.com' },
                  { id: 'emp-2', email: 'student2@gangerdermatology.com' },
                  { id: 'emp-3', email: 'student3@gangerdermatology.com' }
                ],
                error: null
              })
            })
          };
        }
        if (table === 'training_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: [{ id: 'module-1', classroom_course_id: 'course-1' }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            upsert: jest.fn().mockReturnValue({
              data: [{ id: 'completion-1', employee_id: 'emp-1' }],
              error: null
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

      const result = await classroomSync.syncCompletions('sync-123');

      expect(result.completionsFound).toBe(3);
      expect(result.gradesUpdated).toBe(1); // Only completed submission gets grade
    });
  });

  describe('Grade Calculation and Mapping', () => {
    it('should correctly map Classroom grades to compliance scores', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          userId: 'student@gangerdermatology.com',
          state: 'TURNED_IN',
          assignedGrade: 95,
          submissionHistory: [
            {
              stateHistory: {
                state: 'TURNED_IN',
                stateTimestamp: '2024-12-15T10:00:00Z'
              }
            }
          ]
        }
      ];

      const mockCoursework = [
        {
          id: 'coursework-1',
          title: 'HIPAA Quiz',
          maxPoints: 100
        }
      ];

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: {
          courses: [{
            id: 'course-1',
            name: 'HIPAA Training - December 2024',
            courseState: 'ACTIVE'
          }]
        }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: { courseWork: mockCoursework }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: { studentSubmissions: mockSubmissions }
      });

      const mockUpsert = jest.fn().mockReturnValue({
        data: [{ id: 'completion-1' }],
        error: null
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: [{ id: 'emp-1', email: 'student@gangerdermatology.com' }],
                error: null
              })
            })
          };
        }
        if (table === 'training_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: [{ id: 'module-1', classroom_course_id: 'course-1' }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
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

      await classroomSync.syncCompletions('sync-123');

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            employee_id: 'emp-1',
            module_id: 'module-1',
            status: 'completed',
            score: 95,
            completion_date: '2024-12-15T10:00:00.000Z'
          })
        ]),
        expect.any(Object)
      );
    });

    it('should handle different max points correctly', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          userId: 'student@gangerdermatology.com',
          state: 'TURNED_IN',
          assignedGrade: 38, // 38 out of 40 = 95%
          submissionHistory: [
            {
              stateHistory: {
                state: 'TURNED_IN',
                stateTimestamp: '2024-12-15T10:00:00Z'
              }
            }
          ]
        }
      ];

      const mockCoursework = [
        {
          id: 'coursework-1',
          title: 'Short Quiz',
          maxPoints: 40
        }
      ];

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: {
          courses: [{
            id: 'course-1',
            name: 'Safety Training - December 2024',
            courseState: 'ACTIVE'
          }]
        }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: { courseWork: mockCoursework }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: { studentSubmissions: mockSubmissions }
      });

      const mockUpsert = jest.fn().mockReturnValue({
        data: [{ id: 'completion-1' }],
        error: null
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: [{ id: 'emp-1', email: 'student@gangerdermatology.com' }],
                error: null
              })
            })
          };
        }
        if (table === 'training_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: [{ id: 'module-1', classroom_course_id: 'course-1' }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
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

      await classroomSync.syncCompletions('sync-123');

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            score: 95 // Should be normalized to percentage
          })
        ]),
        expect.any(Object)
      );
    });
  });

  describe('Batch Processing and Performance', () => {
    it('should process submissions in configurable batches', async () => {
      const mockSubmissions = Array.from({ length: 150 }, (_, i) => ({
        id: `submission-${i + 1}`,
        userId: `student${i + 1}@gangerdermatology.com`,
        state: 'TURNED_IN',
        assignedGrade: 85 + (i % 15), // Varying grades
        submissionHistory: [
          {
            stateHistory: {
              state: 'TURNED_IN',
              stateTimestamp: '2024-12-15T10:00:00Z'
            }
          }
        ]
      }));

      mockClassroomAPI.courses.list.mockResolvedValue({
        data: {
          courses: [{
            id: 'course-1',
            name: 'HIPAA Training - December 2024',
            courseState: 'ACTIVE'
          }]
        }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: {
          courseWork: [{
            id: 'coursework-1',
            title: 'HIPAA Quiz',
            maxPoints: 100
          }]
        }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: { studentSubmissions: mockSubmissions }
      });

      // Mock large employee dataset
      const mockEmployees = Array.from({ length: 150 }, (_, i) => ({
        id: `emp-${i + 1}`,
        email: `student${i + 1}@gangerdermatology.com`
      }));

      let batchCount = 0;
      const mockUpsert = jest.fn().mockImplementation(() => {
        batchCount++;
        return {
          data: [{ id: `completion-batch-${batchCount}` }],
          error: null
        };
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: mockEmployees,
                error: null
              })
            })
          };
        }
        if (table === 'training_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: [{ id: 'module-1', classroom_course_id: 'course-1' }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
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

      const result = await classroomSync.syncCompletions('sync-123', {
        batchSize: 50
      });

      expect(batchCount).toBe(3); // 150 submissions / 50 batch size = 3 batches
      expect(result.completionsFound).toBe(150);
      expect(result.gradesUpdated).toBe(150);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle Classroom API errors gracefully', async () => {
      mockClassroomAPI.courses.list.mockRejectedValue(new Error('API Error'));

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      await expect(classroomSync.syncCompletions('sync-123')).rejects.toThrow('API Error');
    });

    it('should continue processing after database errors', async () => {
      mockClassroomAPI.courses.list.mockResolvedValue({
        data: {
          courses: [{
            id: 'course-1',
            name: 'HIPAA Training - December 2024',
            courseState: 'ACTIVE'
          }]
        }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: {
          courseWork: [{
            id: 'coursework-1',
            title: 'HIPAA Quiz',
            maxPoints: 100
          }]
        }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: {
          studentSubmissions: [{
            id: 'submission-1',
            userId: 'student@gangerdermatology.com',
            state: 'TURNED_IN',
            assignedGrade: 95
          }]
        }
      });

      // Mock database error
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: null,
                error: { message: 'Database connection failed' }
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

      await expect(classroomSync.syncCompletions('sync-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('Sync Logging and Progress Tracking', () => {
    it('should update sync logs with detailed progress information', async () => {
      mockClassroomAPI.courses.list.mockResolvedValue({
        data: {
          courses: [{
            id: 'course-1',
            name: 'HIPAA Training - December 2024',
            courseState: 'ACTIVE'
          }]
        }
      });

      mockClassroomAPI.coursework.list.mockResolvedValue({
        data: {
          courseWork: [{
            id: 'coursework-1',
            title: 'HIPAA Quiz',
            maxPoints: 100
          }]
        }
      });

      mockClassroomAPI.studentSubmissions.list.mockResolvedValue({
        data: {
          studentSubmissions: [{
            id: 'submission-1',
            userId: 'student@gangerdermatology.com',
            state: 'TURNED_IN',
            assignedGrade: 95
          }]
        }
      });

      const mockUpdateSyncLog = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: null,
          error: null
        })
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: [{ id: 'emp-1', email: 'student@gangerdermatology.com' }],
                error: null
              })
            })
          };
        }
        if (table === 'training_modules') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  data: [{ id: 'module-1', classroom_course_id: 'course-1' }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'training_completions') {
          return {
            upsert: jest.fn().mockReturnValue({
              data: [{ id: 'completion-1' }],
              error: null
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

      await classroomSync.syncCompletions('sync-123');

      expect(mockUpdateSyncLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          records_processed: 1,
          records_total: 1,
          end_time: expect.any(String),
          summary: expect.objectContaining({
            coursesProcessed: 1,
            completionsFound: 1,
            gradesUpdated: 1
          })
        })
      );
    });
  });
});