# 📊 Compliance Training Manager Dashboard - Product Requirements Document
*Ganger Platform Unified Architecture*

## 📋 Document Information
- **Application Name**: Compliance Training Manager Dashboard
- **Priority**: Medium
- **Development Timeline**: 4-6 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations
- **Integration Requirements**: Google Classroom, Zenefits

---

## 🎯 Product Overview

### **Purpose Statement**
Create a manager-only dashboard that displays real-time employee compliance training progress for mandatory monthly modules, integrating with Google Classroom and Zenefits APIs to provide comprehensive visibility into training completion status and automated compliance tracking.

### **Target Users**
- **Primary**: Manager+ role for compliance oversight and reporting
- **Secondary**: HR staff for employee training coordination
- **Tertiary**: Training administrators for module management

### **Success Metrics**
- 100% visibility into employee training completion status
- 90% reduction in manual compliance tracking time
- 95% completion rate for mandatory training modules

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard)**
```yaml
Frontend: Next.js 14+ with TypeScript
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with static asset support)
Styling: Tailwind CSS + Ganger Design System
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
```

### **Required Shared Packages**
```typescript
import { 
  ComplianceGrid, EmployeeRow, TrainingCard, ProgressChart,
  Button, Input, Modal, DataTable, LoadingSpinner
} from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth';
import { db, User, AuditLog, Employee, TrainingModule } from '@ganger/db';
import { GoogleClassroomClient, ZenefitsClient } from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

### **App-Specific Technology**
- **Google Classroom API**: Training completion tracking
- **Zenefits API**: Employee data synchronization
- **Real-time Sync**: Live training progress updates
- **Timeline View**: 5-month rolling compliance view

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'technician' | 'clinical_staff' | 'hr_admin';

// Compliance Training permission matrix
interface Permissions {
  read: ['manager', 'superadmin', 'hr_admin'];
  write: ['manager', 'superadmin'];
  admin: ['superadmin'];
  training_config: ['hr_admin', 'manager', 'superadmin'];
  exemptions: ['manager', 'superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-location Access**: Compliance tracking across all 3 locations
- **Vinya Technician Access**: No access to compliance data
- **Session Management**: 24-hour JWT tokens with refresh

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
notifications, notification_preferences
```

### **App-Specific Tables**
```sql
-- Compliance Training specific tables
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
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key TEXT UNIQUE NOT NULL,
  module_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  classroom_course_id TEXT,
  classroom_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  completion_date TIMESTAMPTZ,
  score DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue')),
  classroom_submission_id TEXT,
  due_date DATE NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  exemption_reason TEXT,
  exempted_by TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, module_id, due_date)
);

CREATE TABLE compliance_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('employees', 'training', 'full')),
  triggered_by TEXT,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  employees_synced INTEGER DEFAULT 0,
  completions_synced INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

-- Performance optimization indexes
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_start_date ON employees(start_date);
CREATE INDEX idx_training_completions_employee ON training_completions(employee_id);
CREATE INDEX idx_training_completions_module ON training_completions(module_id);
CREATE INDEX idx_training_completions_status ON training_completions(status);
CREATE INDEX idx_training_completions_due_date ON training_completions(due_date);

-- Row Level Security policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_sync_logs ENABLE ROW LEVEL SECURITY;

-- Manager+ access policies
CREATE POLICY "Managers can access employee data" ON employees
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'hr_admin'));

CREATE POLICY "Managers can access training data" ON training_modules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'hr_admin'));

CREATE POLICY "Managers can access completion data" ON training_completions
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'hr_admin'));
```

### **Data Relationships**
- Training completions connect to shared users and locations tables
- Employee data synced from Zenefits via @ganger/integrations ZenefitsClient
- Training progress synced from Google Classroom via GoogleClassroomClient
- Audit logging through shared audit_logs table for compliance tracking

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
// CRUD operations follow standard patterns
GET    /api/training-completions      // List with pagination & filters
POST   /api/training-completions      // Create new completion record
GET    /api/training-completions/[id] // Get specific completion
PUT    /api/training-completions/[id] // Update completion
DELETE /api/training-completions/[id] // Soft delete completion

// Real-time subscriptions
WS     /api/training-completions/subscribe // Live completion updates

// Bulk operations
POST   /api/training-completions/bulk     // Bulk operations
```

### **App-Specific Endpoints**
```typescript
// Compliance tracking endpoints
GET    /api/compliance/matrix          // Get compliance matrix view
GET    /api/compliance/employee/[id]   // Individual employee compliance
POST   /api/compliance/sync            // Manual sync trigger
GET    /api/compliance/analytics       // Compliance statistics

// Employee sync endpoints
POST   /api/zenefits/sync-employees    // Sync employees from Zenefits
GET    /api/zenefits/departments       // Get department data
POST   /api/zenefits/notifications     // Send completion notifications

// Google Classroom integration endpoints
POST   /api/classroom/sync-progress    // Sync training completion from Classroom
GET    /api/classroom/courses          // Get course enrollment data
POST   /api/classroom/assignments      // Check assignment completions

// Training module management
GET    /api/training-modules           // Get all training modules
POST   /api/training-modules           // Create new training module
PUT    /api/training-modules/[id]      // Update training module
POST   /api/training-modules/bulk      // Bulk module operations

// Reporting endpoints
GET    /api/reports/compliance         // Compliance summary reports
GET    /api/reports/department         // Department compliance breakdown
POST   /api/reports/export             // Export compliance data
```

### **External Integrations**
- **Google Classroom**: Training completion tracking via Classroom API
- **Zenefits**: Employee data and department information via @ganger/integrations
- **Error Handling**: Standard retry logic with exponential backoff
- **Rate Limiting**: Respect external API limits with intelligent queuing
- **Authentication**: Secure credential management via environment variables

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System + Compliance-specific colors
colors: {
  primary: 'blue-600',      // Medical professional
  secondary: 'green-600',   // Success/completed training
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Due soon alerts
  danger: 'red-600'         // Overdue/non-compliant
  
  // Compliance-specific colors
  completed: 'emerald-500', // Completed training
  overdue: 'red-500',       // Overdue training
  inProgress: 'yellow-500', // Training in progress
  notRequired: 'gray-400'   // Not required for employee
}
```

### **Component Usage**
```typescript
// Use shared components wherever possible
import {
  // Layout
  AppLayout, PageHeader, Sidebar, NavigationTabs,
  
  // Compliance-specific layouts
  ComplianceGrid, EmployeeRow, TrainingTimeline,
  
  // Data Display
  DataTable, PaginationControls, FilterPanel,
  ComplianceMetrics, ProgressChart, StatusIndicator,
  
  // Forms & Inputs
  FormBuilder, FormField, ValidationSummary,
  Button, Input, Select, DatePicker,
  
  // Feedback
  LoadingSpinner, ErrorBoundary, SuccessToast,
  ConfirmDialog, EmptyState, AlertBanner
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Compliance Matrix View**: Visual grid of employees vs training modules
- **5-Month Timeline**: Rolling view of past, current, and future months
- **Real-time Status Updates**: Live updates of training completion status
- **Filter Controls**: Smart filtering by department, location, compliance status
- **Mobile Responsive**: Manager access on mobile devices
- **Export Functionality**: One-click compliance reports export

---

## 📱 User Experience

### **User Workflows**
1. **Primary Workflow - Compliance Monitoring**: 
   - Dashboard displays all employee training status in matrix view
   - Filter by compliance status, department, or location
   - Drill down to individual employee details
   - Export compliance reports for auditing

2. **Secondary Workflows**: 
   - Manual sync of employee data from Zenefits
   - Training module configuration and management
   - Exemption management for special cases
   - Historical compliance trend analysis

3. **Error Recovery**: 
   - Manual sync retry for failed API calls
   - Data validation and error reporting
   - Alternative data entry for system outages

4. **Mobile Experience**: 
   - Touch-optimized compliance grid
   - Quick status filtering
   - Mobile-friendly report generation

### **Performance Requirements**
- **Page Load**: < 2 seconds for compliance dashboard
- **Real-time Updates**: < 500ms latency for status changes
- **API Sync**: < 30 seconds for employee/training data sync
- **Report Generation**: < 10 seconds for compliance reports

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all interfaces
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Semantic HTML and ARIA labels for compliance data
- **Color Contrast**: 4.5:1 minimum ratio for all status indicators

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// Standard test patterns
Unit Tests: 85%+ coverage for compliance logic
Integration Tests: All Zenefits and Google Classroom API endpoints
E2E Tests: Complete compliance tracking workflows
Performance Tests: Large employee dataset scenarios
```

### **Test Scenarios**
- **Happy Path**: Successful training completion tracking
- **New Hire Rules**: Automatic requirement assignment based on start date
- **External API Failures**: Graceful handling of Zenefits/Classroom outages
- **Manual Exemptions**: Manager override for special circumstances
- **Real-time Updates**: Live status propagation across users
- **Data Validation**: Employee and training data integrity checks

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with compliance audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Compliance Training specific variables
COMPLIANCE_GOOGLE_CLASSROOM_COURSE_ID=your-classroom-course-id
COMPLIANCE_ZENEFITS_API_URL=https://api.zenefits.com
COMPLIANCE_ZENEFITS_API_TOKEN=your-zenefits-api-token
COMPLIANCE_SYNC_INTERVAL_HOURS=24
COMPLIANCE_NOTIFICATION_EMAIL=compliance@gangerdermatology.com
```

### **Monitoring & Alerts**
- **Compliance Rate Monitoring**: Real-time tracking of overall compliance percentage
- **Sync Health**: Zenefits and Google Classroom API connectivity monitoring
- **Training Deadline Alerts**: Automated notifications for approaching deadlines
- **Data Quality**: Employee and training data integrity monitoring

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Dashboard usage, filter utilization
- **Performance Metrics**: Page load times, API response times
- **Integration Health**: External API success rates and error patterns

### **App-Specific Analytics**
- **Compliance Metrics**: Overall compliance rates by department and location
- **Training Effectiveness**: Completion rates and time-to-completion analysis
- **Employee Performance**: Individual training compliance tracking
- **Deadline Management**: Training deadline adherence and overdue patterns
- **Sync Performance**: Data synchronization success rates and timing
- **Manager Efficiency**: Time saved through automated compliance tracking

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] Zenefits employee data sync functional and accurate
- [ ] Google Classroom training completion tracking working
- [ ] Compliance matrix view displaying real-time status
- [ ] Filter and export functionality operational
- [ ] New hire training requirement logic implemented
- [ ] Manager training completed with 90% proficiency scores

### **Success Metrics (6 months)**
- 100% visibility into employee training completion status
- 90% reduction in manual compliance tracking time
- 95% completion rate for mandatory training modules
- 99% accuracy in training requirement assignments
- Zero compliance audit findings related to tracking

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Google Classroom API integration setup and authentication
- [ ] Zenefits API integration for employee data synchronization
- [ ] New hire training requirement business logic documentation
- [ ] Real-time compliance status update architecture
- [ ] Data validation and quality assurance procedures

### **User Documentation**
- [ ] Compliance dashboard user guide with screenshots
- [ ] Training module configuration procedures
- [ ] Employee exemption management guidelines
- [ ] Compliance report generation and export procedures
- [ ] Troubleshooting guide for sync issues and data discrepancies

---

*This PRD leverages the consolidated Ganger Platform architecture to deliver efficient compliance training management that integrates seamlessly with existing Google Classroom and Zenefits systems while providing powerful real-time visibility and automated tracking capabilities.*