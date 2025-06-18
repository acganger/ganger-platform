# PRD: Compliance Training Manager Dashboard - Backend
*Backend development specifications for parallel beast mode development*

## 📋 Document Information
- **Application Name**: Compliance Training Manager Dashboard (Backend)
- **PRD ID**: PRD-COMPLIANCE-BACKEND-001
- **Priority**: Medium
- **Development Timeline**: 3-4 weeks (Backend portion)
- **Terminal Assignment**: Backend Terminal
- **Dependencies**: @ganger/auth/server, @ganger/db, @ganger/integrations/server, @ganger/utils/server
- **Frontend Coordination**: Provides API endpoints for Frontend Terminal (PRD_Compliance_Training_Frontend.md)

---

## 🎯 Backend Product Overview

### **Backend Scope**
Create robust server-side infrastructure for compliance training management including database operations, external API integrations (Google Classroom, Zenefits), real-time synchronization, and comprehensive API endpoints.

### **Backend Responsibilities**
- **Database Management**: Employee and training data with PostgreSQL + RLS
- **External Integrations**: Google Classroom and Zenefits API synchronization
- **API Endpoints**: RESTful API for frontend consumption
- **Real-time Updates**: Live compliance status broadcasting
- **Data Processing**: Compliance calculations and reporting logic

### **Backend Success Metrics**
- API response times < 200ms for standard queries
- 100% data synchronization accuracy with external systems
- Zero data loss during external API failures
- Real-time updates delivered within 100ms of database changes

---

## 🏗️ Backend Technical Architecture

### **Required Backend Packages (SERVER-ONLY)**
```typescript
// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes and server functions
import { withAuth, verifyPermissions, getUserFromToken } from '@ganger/auth/server';
import { db, createClient } from '@ganger/db';
import { 
  GoogleClassroomService, 
  ZenefitsService,
  ServerCacheService 
} from '@ganger/integrations/server';
import { analytics, auditLog, healthCheck, validateSchema } from '@ganger/utils/server';
import type { 
  Employee, TrainingModule, TrainingCompletion, ComplianceMatrix,
  ApiResponse, SyncResult, ExternalAPIResponse
} from '@ganger/types';

// ❌ PROHIBITED IN BACKEND - These are handled by frontend terminal
// Do NOT import: @ganger/ui, React hooks, client-side utilities
```

### **Backend-Specific Technology Stack**
- **API Framework**: Next.js 14 API Routes with server-side processing
- **Database**: Supabase PostgreSQL with Row Level Security policies
- **External APIs**: Google Classroom API v1, Zenefits REST API
- **Caching**: Redis for external API response caching
- **Background Jobs**: Scheduled sync operations via cron
- **Real-time**: Supabase real-time subscriptions and database triggers

---

## 🗄️ Backend Database Schema

### **Complete Database Implementation**
```sql
-- Employees table with Zenefits integration
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zenefits_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  department TEXT,
  job_title TEXT,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  manager_email TEXT,
  location TEXT CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  
  -- Integration metadata
  zenefits_data JSONB,
  classroom_user_id TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_errors JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training modules with Google Classroom integration
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key TEXT UNIQUE NOT NULL,              -- '2025-01', '2025-02', etc.
  module_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  
  -- Google Classroom integration
  classroom_course_id TEXT NOT NULL,
  classroom_coursework_id TEXT,
  classroom_url TEXT,
  classroom_data JSONB,
  
  -- Module configuration
  description TEXT,
  estimated_duration_minutes INTEGER DEFAULT 30,
  passing_score DECIMAL(5,2) DEFAULT 80.00,
  max_attempts INTEGER DEFAULT 3,
  is_required_for_new_hires BOOLEAN DEFAULT TRUE,
  grace_period_days INTEGER DEFAULT 7,
  
  -- Status and lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training completions with detailed tracking
CREATE TABLE training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  
  -- Completion tracking
  completion_date TIMESTAMPTZ,
  score DECIMAL(5,2),
  attempts_count INTEGER DEFAULT 0,
  time_spent_minutes INTEGER,
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'completed', 'overdue', 'exempted')
  ),
  due_date DATE NOT NULL,
  overdue_days INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN status = 'overdue' AND due_date < CURRENT_DATE 
      THEN CURRENT_DATE - due_date 
      ELSE 0 
    END
  ) STORED,
  
  -- Google Classroom integration
  classroom_submission_id TEXT,
  classroom_submission_data JSONB,
  classroom_grade DECIMAL(5,2),
  
  -- Business logic
  is_required BOOLEAN DEFAULT TRUE,
  exemption_reason TEXT,
  exempted_by UUID REFERENCES users(id),
  exempted_at TIMESTAMPTZ,
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_errors JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, module_id, due_date)
);

-- Comprehensive sync logging
CREATE TABLE compliance_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('employees', 'training_modules', 'completions', 'full')),
  sync_source TEXT NOT NULL CHECK (sync_source IN ('zenefits', 'classroom', 'manual', 'scheduled')),
  
  -- Sync execution
  triggered_by UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'partial')),
  
  -- Results tracking
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Detailed logging
  sync_details JSONB,
  errors JSONB,
  warnings JSONB,
  
  -- Performance metrics
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
      ELSE NULL 
    END
  ) STORED
);

-- Department-based compliance requirements
CREATE TABLE department_training_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  
  -- Requirement configuration
  is_required BOOLEAN DEFAULT TRUE,
  priority_level TEXT DEFAULT 'standard' CHECK (priority_level IN ('critical', 'high', 'standard', 'optional')),
  grace_period_days INTEGER DEFAULT 7,
  reminder_days_before INTEGER DEFAULT 7,
  
  -- Effectiveness tracking
  completion_rate_target DECIMAL(5,2) DEFAULT 95.00,
  average_completion_days INTEGER,
  
  effective_start_date DATE DEFAULT CURRENT_DATE,
  effective_end_date DATE,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(department, module_id)
);

-- Performance optimization indexes
CREATE INDEX idx_employees_status ON employees(status, last_synced_at);
CREATE INDEX idx_employees_department ON employees(department, location);
CREATE INDEX idx_employees_zenefits ON employees(zenefits_id) WHERE zenefits_id IS NOT NULL;

CREATE INDEX idx_training_modules_active ON training_modules(is_active, due_date);
CREATE INDEX idx_training_modules_classroom ON training_modules(classroom_course_id);

CREATE INDEX idx_completions_employee_status ON training_completions(employee_id, status);
CREATE INDEX idx_completions_module_status ON training_completions(module_id, status);
CREATE INDEX idx_completions_due_date ON training_completions(due_date, status);
CREATE INDEX idx_completions_overdue ON training_completions(status, overdue_days) WHERE status = 'overdue';

CREATE INDEX idx_sync_logs_type_status ON compliance_sync_logs(sync_type, status, started_at);

-- Row Level Security Implementation
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_training_requirements ENABLE ROW LEVEL SECURITY;

-- Manager+ access policies
CREATE POLICY "compliance_access_policy" ON employees
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'hr_admin'));

CREATE POLICY "training_access_policy" ON training_modules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'hr_admin'));

CREATE POLICY "completions_access_policy" ON training_completions
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'hr_admin'));

-- Database functions for compliance calculations
CREATE OR REPLACE FUNCTION calculate_compliance_rate(dept TEXT DEFAULT NULL, loc TEXT DEFAULT NULL)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_required INTEGER;
  total_completed INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE tc.is_required = true),
    COUNT(*) FILTER (WHERE tc.is_required = true AND tc.status = 'completed')
  INTO total_required, total_completed
  FROM training_completions tc
  JOIN employees e ON tc.employee_id = e.id
  WHERE 
    e.status = 'active'
    AND (dept IS NULL OR e.department = dept)
    AND (loc IS NULL OR e.location = loc);
  
  IF total_required = 0 THEN
    RETURN 100.00;
  END IF;
  
  RETURN (total_completed::DECIMAL / total_required) * 100;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic status updates
CREATE OR REPLACE FUNCTION update_training_completion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on completion and due dates
  IF NEW.completion_date IS NOT NULL AND NEW.score >= 80.00 THEN
    NEW.status = 'completed';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.completion_date IS NULL THEN
    NEW.status = 'overdue';
  ELSIF NEW.completion_date IS NULL AND NEW.due_date >= CURRENT_DATE THEN
    NEW.status = COALESCE(NEW.status, 'not_started');
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_completion_status
  BEFORE INSERT OR UPDATE ON training_completions
  FOR EACH ROW EXECUTE FUNCTION update_training_completion_status();
```

---

## 🔌 Backend API Implementation

### **Complete API Endpoint Implementation**
```typescript
// /pages/api/compliance/dashboard.ts
import { withAuth } from '@ganger/auth/server';
import { db } from '@ganger/db';

export default withAuth(async function handler(request, user) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Fetch comprehensive dashboard data
    const [employees, modules, completions, departments] = await Promise.all([
      db.employees.findMany({
        where: { status: 'active' },
        include: { training_completions: true }
      }),
      db.training_modules.findMany({
        where: { is_active: true },
        orderBy: { due_date: 'asc' }
      }),
      db.training_completions.findMany({
        include: {
          employee: true,
          module: true
        }
      }),
      getDepartmentSummaries()
    ]);

    const dashboardData = {
      matrix: buildComplianceMatrix(employees, modules, completions),
      departments,
      overallStats: calculateOverallStats(completions),
      lastSync: await getLastSyncTime(),
      summary: {
        totalEmployees: employees.length,
        totalModules: modules.length,
        overallComplianceRate: await calculateComplianceRate(),
        overdueCount: completions.filter(c => c.status === 'overdue').length
      }
    };

    return Response.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return Response.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}, { requiredRoles: ['manager', 'superadmin', 'hr_admin'] });

// /pages/api/compliance/sync.ts
import { GoogleClassroomService, ZenefitsService } from '@ganger/integrations/server';

export default withAuth(async function handler(request, user) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const syncLog = await db.compliance_sync_logs.create({
      data: {
        sync_type: 'full',
        sync_source: 'manual',
        triggered_by: user.id,
        status: 'started'
      }
    });

    // Execute parallel sync operations
    const syncResults = await Promise.allSettled([
      syncEmployeesFromZenefits(syncLog.id),
      syncTrainingFromClassroom(syncLog.id),
      syncCompletionsFromClassroom(syncLog.id)
    ]);

    // Aggregate results
    const overallStatus = syncResults.every(r => r.status === 'fulfilled') 
      ? 'completed' : 'partial';

    await db.compliance_sync_logs.update({
      where: { id: syncLog.id },
      data: {
        status: overallStatus,
        completed_at: new Date(),
        sync_details: syncResults
      }
    });

    // Trigger real-time updates
    await broadcastComplianceUpdate('sync_completed', { syncLogId: syncLog.id });

    return Response.json({
      success: true,
      data: { syncLogId: syncLog.id, status: overallStatus }
    });
  } catch (error) {
    console.error('Sync API Error:', error);
    return Response.json(
      { error: 'Sync operation failed', details: error.message },
      { status: 500 }
    );
  }
}, { requiredRoles: ['manager', 'superadmin'] });

// /pages/api/compliance/employee/[id].ts
export default withAuth(async function handler(request, user) {
  const { id } = request.query;

  if (request.method === 'GET') {
    try {
      const employee = await db.employees.findUnique({
        where: { id: id as string },
        include: {
          training_completions: {
            include: { module: true },
            orderBy: { due_date: 'desc' }
          }
        }
      });

      if (!employee) {
        return Response.json({ error: 'Employee not found' }, { status: 404 });
      }

      const employeeDetail = {
        ...employee,
        complianceStats: calculateEmployeeStats(employee.training_completions),
        upcomingDeadlines: getUpcomingDeadlines(employee.training_completions),
        complianceHistory: getComplianceHistory(employee.id)
      };

      return Response.json({ success: true, data: employeeDetail });
    } catch (error) {
      return Response.json(
        { error: 'Failed to fetch employee details' },
        { status: 500 }
      );
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}, { requiredRoles: ['manager', 'superadmin', 'hr_admin'] });

// /pages/api/compliance/export.ts
export default withAuth(async function handler(request, user) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { format = 'csv', department, location, status } = request.query;

  try {
    const exportData = await generateComplianceReport({
      department: department as string,
      location: location as string,
      status: status as string,
      format: format as 'csv' | 'pdf'
    });

    // Log export for audit trail
    await auditLog({
      action: 'compliance_export',
      userId: user.id,
      resourceType: 'compliance_report',
      metadata: { format, filters: { department, location, status } }
    });

    return Response.json({
      success: true,
      data: {
        fileName: `compliance-report-${new Date().toISOString().split('T')[0]}.${format}`,
        data: exportData,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'Export generation failed' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['manager', 'superadmin'] });
```

### **External API Integration Services**
```typescript
// /lib/services/zenefits-sync.ts
export class ZenefitsComplianceSync {
  private zenefitsClient: ZenefitsService;

  constructor() {
    this.zenefitsClient = new ZenefitsService({
      apiKey: process.env.ZENEFITS_API_KEY!,
      baseUrl: process.env.ZENEFITS_API_URL!
    });
  }

  async syncEmployees(syncLogId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0, created = 0, updated = 0, failed = 0;

    try {
      // Fetch all active employees from Zenefits
      const zenefitsEmployees = await this.zenefitsClient.getEmployees({
        status: 'active',
        include: ['department', 'job_title', 'location', 'manager']
      });

      for (const zenEmployee of zenefitsEmployees) {
        try {
          const existingEmployee = await db.employees.findUnique({
            where: { zenefits_id: zenEmployee.id }
          });

          if (existingEmployee) {
            // Update existing employee
            await db.employees.update({
              where: { id: existingEmployee.id },
              data: {
                first_name: zenEmployee.first_name,
                last_name: zenEmployee.last_name,
                email: zenEmployee.email,
                department: zenEmployee.department?.name,
                job_title: zenEmployee.job_title,
                location: zenEmployee.location,
                manager_email: zenEmployee.manager?.email,
                zenefits_data: zenEmployee,
                last_synced_at: new Date(),
                sync_status: 'synced'
              }
            });
            updated++;
          } else {
            // Create new employee
            await db.employees.create({
              data: {
                zenefits_id: zenEmployee.id,
                first_name: zenEmployee.first_name,
                last_name: zenEmployee.last_name,
                email: zenEmployee.email,
                department: zenEmployee.department?.name,
                job_title: zenEmployee.job_title,
                start_date: new Date(zenEmployee.start_date),
                location: zenEmployee.location,
                manager_email: zenEmployee.manager?.email,
                zenefits_data: zenEmployee,
                last_synced_at: new Date(),
                sync_status: 'synced'
              }
            });
            created++;

            // Auto-assign training modules for new employees
            await this.assignNewHireTraining(zenEmployee);
          }
          processed++;
        } catch (error) {
          console.error(`Failed to sync employee ${zenEmployee.id}:`, error);
          failed++;
        }
      }

      // Update sync log
      await db.compliance_sync_logs.update({
        where: { id: syncLogId },
        data: {
          records_processed: processed,
          records_created: created,
          records_updated: updated,
          records_failed: failed
        }
      });

      return {
        success: true,
        processed,
        created,
        updated,
        failed,
        duration: Date.now() - startTime
      };
    } catch (error) {
      console.error('Zenefits sync failed:', error);
      throw error;
    }
  }

  private async assignNewHireTraining(employee: any): Promise<void> {
    // Get current training modules
    const activeModules = await db.training_modules.findMany({
      where: { 
        is_active: true,
        is_required_for_new_hires: true
      }
    });

    // Create training assignments for new hire
    const trainingAssignments = activeModules.map(module => ({
      employee_id: employee.id,
      module_id: module.id,
      due_date: new Date(Date.now() + (module.grace_period_days * 24 * 60 * 60 * 1000)),
      status: 'not_started',
      is_required: true
    }));

    await db.training_completions.createMany({
      data: trainingAssignments,
      skipDuplicates: true
    });
  }
}

// /lib/services/classroom-sync.ts
export class GoogleClassroomComplianceSync {
  private classroomClient: GoogleClassroomService;

  constructor() {
    this.classroomClient = new GoogleClassroomService({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/classroom.courses.readonly']
    });
  }

  async syncTrainingCompletions(syncLogId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0, updated = 0, failed = 0;

    try {
      // Get all active training modules with Classroom integration
      const modules = await db.training_modules.findMany({
        where: { 
          is_active: true,
          classroom_course_id: { not: null }
        }
      });

      for (const module of modules) {
        try {
          // Fetch submissions from Google Classroom
          const submissions = await this.classroomClient.getSubmissions({
            courseId: module.classroom_course_id,
            courseworkId: module.classroom_coursework_id
          });

          for (const submission of submissions) {
            const student = await this.findEmployeeByClassroomId(submission.userId);
            if (!student) continue;

            // Update or create completion record
            await db.training_completions.upsert({
              where: {
                employee_id_module_id_due_date: {
                  employee_id: student.id,
                  module_id: module.id,
                  due_date: module.due_date
                }
              },
              update: {
                completion_date: submission.submissionHistory?.[0]?.submissionTime,
                score: submission.assignedGrade,
                classroom_submission_id: submission.id,
                classroom_submission_data: submission,
                status: submission.state === 'TURNED_IN' ? 'completed' : 'in_progress',
                last_synced_at: new Date(),
                sync_status: 'synced'
              },
              create: {
                employee_id: student.id,
                module_id: module.id,
                due_date: module.due_date,
                completion_date: submission.submissionHistory?.[0]?.submissionTime,
                score: submission.assignedGrade,
                classroom_submission_id: submission.id,
                classroom_submission_data: submission,
                status: submission.state === 'TURNED_IN' ? 'completed' : 'in_progress',
                is_required: true,
                last_synced_at: new Date(),
                sync_status: 'synced'
              }
            });
            updated++;
          }
          processed++;
        } catch (error) {
          console.error(`Failed to sync module ${module.id}:`, error);
          failed++;
        }
      }

      return {
        success: true,
        processed,
        updated,
        failed,
        duration: Date.now() - startTime
      };
    } catch (error) {
      console.error('Classroom sync failed:', error);
      throw error;
    }
  }

  private async findEmployeeByClassroomId(classroomUserId: string): Promise<any> {
    // Match Classroom user to employee by email
    const profile = await this.classroomClient.getUserProfile(classroomUserId);
    return await db.employees.findUnique({
      where: { email: profile.emailAddress }
    });
  }
}
```

---

## ⚡ Backend Real-time Features

### **Real-time Updates Implementation**
```typescript
// /lib/services/realtime-compliance.ts
export class ComplianceRealtimeService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async broadcastComplianceUpdate(
    event: string, 
    payload: any, 
    channel = 'compliance-updates'
  ): Promise<void> {
    try {
      await this.supabase.channel(channel).send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Real-time broadcast failed:', error);
    }
  }

  // Database triggers for automatic real-time updates
  async setupRealtimeTriggers(): Promise<void> {
    const triggers = [
      {
        table: 'training_completions',
        events: ['INSERT', 'UPDATE'],
        function: 'notify_compliance_change'
      },
      {
        table: 'employees',
        events: ['INSERT', 'UPDATE'],
        function: 'notify_employee_change'
      }
    ];

    for (const trigger of triggers) {
      await this.supabase.rpc('create_realtime_trigger', trigger);
    }
  }
}

// Database function for real-time notifications
CREATE OR REPLACE FUNCTION notify_compliance_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'compliance_update',
    json_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'employee_id', NEW.employee_id,
      'module_id', NEW.module_id,
      'old_status', COALESCE(OLD.status, null),
      'new_status', NEW.status,
      'timestamp', NOW()
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Backend Testing Requirements

### **Backend-Specific Testing**
```typescript
// __tests__/api/compliance.test.ts
describe('Compliance API Endpoints', () => {
  describe('GET /api/compliance/dashboard', () => {
    it('returns comprehensive dashboard data for managers', async () => {
      const response = await request(app)
        .get('/api/compliance/dashboard')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('matrix');
      expect(response.body.data).toHaveProperty('departments');
      expect(response.body.data).toHaveProperty('overallStats');
    });

    it('denies access to non-manager users', async () => {
      const response = await request(app)
        .get('/api/compliance/dashboard')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });
  });

  describe('POST /api/compliance/sync', () => {
    it('triggers full compliance sync successfully', async () => {
      // Mock external API responses
      mockZenefitsAPI.getEmployees.mockResolvedValue(mockEmployeeData);
      mockClassroomAPI.getSubmissions.mockResolvedValue(mockSubmissionData);

      const response = await request(app)
        .post('/api/compliance/sync')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.syncLogId).toBeDefined();
    });
  });
});

// __tests__/services/zenefits-sync.test.ts
describe('ZenefitsComplianceSync', () => {
  it('syncs employees correctly from Zenefits API', async () => {
    const syncService = new ZenefitsComplianceSync();
    const result = await syncService.syncEmployees('test-sync-id');

    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThan(0);
    expect(result.created + result.updated).toBe(result.processed);
  });

  it('handles API failures gracefully', async () => {
    mockZenefitsAPI.getEmployees.mockRejectedValue(new Error('API Error'));
    
    const syncService = new ZenefitsComplianceSync();
    await expect(syncService.syncEmployees('test-sync-id'))
      .rejects.toThrow('API Error');
  });
});
```

---

## 🚀 Backend Deployment Configuration

### **Environment Variables (Backend)**
```bash
# Standard environment variables (inherited)
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Compliance Training Backend specific variables
ZENEFITS_API_URL=https://api.zenefits.com/core
ZENEFITS_API_KEY=your_zenefits_api_key
ZENEFITS_COMPANY_ID=your_company_id

# Google Classroom integration
GOOGLE_CLASSROOM_COURSE_ID=123456789
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Background sync configuration
COMPLIANCE_SYNC_INTERVAL_HOURS=24
COMPLIANCE_SYNC_RETRY_ATTEMPTS=3
COMPLIANCE_CACHE_TTL_MINUTES=60

# Performance and monitoring
DATABASE_POOL_SIZE=20
API_RATE_LIMIT_RPM=1000
REALTIME_BROADCAST_ENABLED=true
```

### **Background Job Configuration**
```typescript
// /lib/jobs/compliance-sync.ts
export class ComplianceSyncJob {
  static async scheduleSync(): Promise<void> {
    const syncInterval = parseInt(process.env.COMPLIANCE_SYNC_INTERVAL_HOURS || '24');
    
    setInterval(async () => {
      try {
        console.log('Starting scheduled compliance sync...');
        await this.executeFullSync();
        console.log('Scheduled compliance sync completed');
      } catch (error) {
        console.error('Scheduled sync failed:', error);
        await this.notifyAdmins('sync_failure', error);
      }
    }, syncInterval * 60 * 60 * 1000); // Convert hours to milliseconds
  }

  private static async executeFullSync(): Promise<void> {
    const syncLog = await db.compliance_sync_logs.create({
      data: {
        sync_type: 'full',
        sync_source: 'scheduled',
        status: 'started'
      }
    });

    try {
      const [zenefitsResult, classroomResult] = await Promise.allSettled([
        new ZenefitsComplianceSync().syncEmployees(syncLog.id),
        new GoogleClassroomComplianceSync().syncTrainingCompletions(syncLog.id)
      ]);

      await db.compliance_sync_logs.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completed_at: new Date(),
          sync_details: { zenefitsResult, classroomResult }
        }
      });

      // Broadcast update to frontend
      await new ComplianceRealtimeService().broadcastComplianceUpdate(
        'scheduled_sync_completed',
        { syncLogId: syncLog.id }
      );
    } catch (error) {
      await db.compliance_sync_logs.update({
        where: { id: syncLog.id },
        data: { status: 'failed', completed_at: new Date() }
      });
      throw error;
    }
  }
}
```

---

## 📊 Backend Success Criteria

### **Backend Launch Criteria**
- [ ] All API endpoints respond within 200ms for standard queries
- [ ] Zenefits employee sync achieves 100% data accuracy
- [ ] Google Classroom completion sync works without data loss
- [ ] Real-time updates broadcast within 100ms of database changes
- [ ] Background sync jobs run reliably every 24 hours
- [ ] Row Level Security policies prevent unauthorized data access

### **Backend Quality Gates**
```bash
# Required backend validations
npm run type-check          # 0 TypeScript errors
npm run test:api           # All API endpoint tests pass
npm run test:integrations  # External API integration tests pass
npm run audit:security     # Security compliance verified
npm run test:performance   # Performance benchmarks met
```

---

## 🔄 Coordination with Frontend Terminal

### **Frontend Dependencies**
**The Frontend Terminal (PRD_Compliance_Training_Frontend.md) depends on:**

1. **API Endpoints**: All `/api/compliance/*` routes functional and documented
2. **TypeScript Types**: Shared interfaces for Employee, TrainingModule, etc.
3. **Real-time Subscriptions**: Supabase channels for live updates
4. **Error Handling**: Consistent API error response formats
5. **Authentication**: Server-side auth middleware working

### **Data Contracts**
```typescript
// Shared interfaces (both terminals must implement)
interface DashboardData {
  matrix: ComplianceMatrix;
  departments: DepartmentSummary[];
  overallStats: ComplianceStats;
  lastSync: Date;
  summary: {
    totalEmployees: number;
    totalModules: number;
    overallComplianceRate: number;
    overdueCount: number;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

---

## 📚 Backend Documentation Requirements

### **API Documentation**
- [ ] Complete API endpoint documentation with examples
- [ ] External API integration setup guides (Zenefits, Classroom)
- [ ] Database schema and relationship documentation
- [ ] Real-time subscription implementation guide

### **Integration Documentation**
- [ ] Zenefits API authentication and rate limiting
- [ ] Google Classroom service account setup
- [ ] Background job configuration and monitoring
- [ ] Error handling and retry logic documentation

---

*This backend PRD provides complete server-side infrastructure for the Compliance Training Manager Dashboard, enabling seamless integration with the frontend terminal and ensuring robust, scalable compliance management.*

**🔗 Companion Document**: [PRD_Compliance_Training_Frontend.md](./PRD_Compliance_Training_Frontend.md) - Frontend development specifications