# 🏥 Clinical Support Staffing Optimization - Product Requirements Document
*Ganger Platform Unified Architecture*

## 📋 Document Information
- **Application Name**: Clinical Support Staffing Optimization System
- **Priority**: Medium
- **Development Timeline**: 6-8 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations
- **Integration Requirements**: ModMed, Deputy, Zenefits

---

## 🎯 Product Overview

### **Purpose Statement**
Create an intelligent staffing system that optimizes medical assistant and scribe assignments across all clinic locations by analyzing physician schedules, staff availability, and employee status to ensure appropriate provider-to-support-staff ratios.

### **Target Users**
- **Primary**: Manager+ role for staffing decisions and optimization
- **Secondary**: Clinic schedulers for daily schedule adjustments
- **Tertiary**: Staff members for availability viewing and shift preferences

### **Success Metrics**
- 95% optimal physician-to-support-staff coverage across all locations
- 25% reduction in understaffed clinic days
- 90% staff satisfaction with schedule fairness and predictability

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
  ScheduleBuilder, StaffCard, LocationSelector, DragDropCalendar,
  Button, Input, Modal, Chart, LoadingSpinner, DataTable
} from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth';
import { db, User, AuditLog, Provider, Location, StaffMember } from '@ganger/db';
import { ModMedClient, DeputyClient, ZenefitsClient } from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

### **App-Specific Technology**
- **Schedule Optimization**: AI-powered staffing recommendations
- **Drag & Drop**: React DnD for interactive schedule modification
- **Real-time Sync**: Live schedule updates across all scheduler devices
- **Cross-location Analytics**: Multi-site staff allocation optimization

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'technician' | 'clinical_staff' | 'scheduler';

// Clinical Staffing permission matrix
interface Permissions {
  read: ['staff', 'manager', 'superadmin', 'scheduler', 'clinical_staff'];
  write: ['manager', 'superadmin', 'scheduler'];
  admin: ['superadmin'];
  optimize: ['manager', 'superadmin'];
  cross_location: ['manager', 'superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-location Access**: Schedule viewing across all 3 locations based on user permissions
- **Vinya Technician Access**: No access to clinical staffing (not applicable)
- **Session Management**: 24-hour JWT tokens with refresh

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
providers, provider_schedules,
notifications, notification_preferences
```

### **App-Specific Tables**
```sql
-- Clinical Staffing specific tables
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  employee_id TEXT UNIQUE NOT NULL, -- Zenefits/Deputy employee ID
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_type TEXT NOT NULL CHECK (role_type IN ('medical_assistant', 'scribe', 'nurse', 'technician')),
  primary_location_id UUID REFERENCES locations(id),
  secondary_locations UUID[] REFERENCES locations(id),
  skill_level TEXT DEFAULT 'intermediate' CHECK (skill_level IN ('junior', 'intermediate', 'senior', 'specialist')),
  certifications TEXT[],
  max_hours_per_week INTEGER DEFAULT 40,
  preferred_schedule_type TEXT CHECK (preferred_schedule_type IN ('full_time', 'part_time', 'per_diem', 'flexible')),
  hire_date DATE,
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave', 'terminated')),
  deputy_user_id TEXT, -- Deputy system user ID
  zenefits_employee_id TEXT, -- Zenefits employee ID
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE physician_support_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL, -- ModMed provider ID
  location_id UUID NOT NULL REFERENCES locations(id),
  appointment_type TEXT,
  required_medical_assistants INTEGER DEFAULT 1,
  required_scribes INTEGER DEFAULT 0,
  required_skill_level TEXT DEFAULT 'intermediate' CHECK (required_skill_level IN ('junior', 'intermediate', 'senior', 'specialist')),
  special_requirements TEXT[],
  buffer_time_minutes INTEGER DEFAULT 15,
  notes TEXT,
  effective_start_date DATE,
  effective_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(provider_id, location_id, appointment_type)
);

CREATE TABLE staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id),
  schedule_date DATE NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  assigned_providers TEXT[], -- ModMed provider IDs
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('regular', 'overtime', 'on_call', 'substitute', 'training')),
  assignment_method TEXT DEFAULT 'manual' CHECK (assignment_method IN ('manual', 'ai_suggested', 'auto_optimized')),
  coverage_priority INTEGER DEFAULT 50 CHECK (coverage_priority BETWEEN 1 AND 100),
  special_assignments TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  deputy_schedule_id TEXT, -- Deputy system schedule ID
  last_modified_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(staff_member_id, schedule_date, shift_start_time)
);

CREATE TABLE provider_schedules_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL, -- ModMed provider ID
  provider_name TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_type TEXT,
  patient_count INTEGER DEFAULT 0,
  estimated_support_need DECIMAL(3,1), -- Calculated support staff hours needed
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  modmed_appointment_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, schedule_date, start_time, location_id)
);

CREATE TABLE staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  days_of_week INTEGER[] NOT NULL, -- 0=Sunday, 1=Monday, etc.
  available_start_time TIME NOT NULL,
  available_end_time TIME NOT NULL,
  location_preferences UUID[] REFERENCES locations(id),
  unavailable_dates DATE[],
  preferred_providers TEXT[], -- ModMed provider IDs
  max_consecutive_days INTEGER DEFAULT 5,
  min_hours_between_shifts INTEGER DEFAULT 12,
  overtime_willing BOOLEAN DEFAULT FALSE,
  cross_location_willing BOOLEAN DEFAULT FALSE,
  notes TEXT,
  deputy_availability_id TEXT,
  last_updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staffing_optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ratio_requirement', 'skill_matching', 'location_preference', 'workload_balance')),
  location_id UUID REFERENCES locations(id), -- NULL for all locations
  provider_id TEXT, -- ModMed provider ID, NULL for all providers
  rule_parameters JSONB NOT NULL,
  priority_weight INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  enforcement_level TEXT DEFAULT 'warning' CHECK (enforcement_level IN ('strict', 'warning', 'suggestion')),
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staffing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analytics_date DATE NOT NULL,
  location_id UUID REFERENCES locations(id), -- NULL for combined analytics
  total_provider_hours DECIMAL(6,2),
  total_support_hours DECIMAL(6,2),
  optimal_support_hours DECIMAL(6,2),
  coverage_percentage DECIMAL(5,2),
  understaffed_periods INTEGER DEFAULT 0,
  overstaffed_periods INTEGER DEFAULT 0,
  cross_location_assignments INTEGER DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  staff_utilization_rate DECIMAL(5,2),
  patient_satisfaction_impact DECIMAL(3,2),
  cost_efficiency_score DECIMAL(5,2),
  optimization_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(analytics_date, location_id)
);

-- Performance optimization indexes
CREATE INDEX idx_staff_members_location ON staff_members(primary_location_id);
CREATE INDEX idx_staff_members_role ON staff_members(role_type);
CREATE INDEX idx_staff_members_status ON staff_members(employment_status);
CREATE INDEX idx_staff_schedules_date ON staff_schedules(schedule_date);
CREATE INDEX idx_staff_schedules_staff ON staff_schedules(staff_member_id, schedule_date);
CREATE INDEX idx_staff_schedules_location ON staff_schedules(location_id, schedule_date);
CREATE INDEX idx_provider_schedules_date ON provider_schedules_cache(schedule_date);
CREATE INDEX idx_provider_schedules_provider ON provider_schedules_cache(provider_id, schedule_date);
CREATE INDEX idx_staff_availability_member ON staff_availability(staff_member_id);
CREATE INDEX idx_staff_availability_dates ON staff_availability(date_range_start, date_range_end);
CREATE INDEX idx_staffing_analytics_date ON staffing_analytics(analytics_date);

-- Row Level Security policies
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_support_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_schedules_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_analytics ENABLE ROW LEVEL SECURITY;

-- Location-based access policies
CREATE POLICY "Staff can view own schedules and profiles" ON staff_schedules
  FOR SELECT USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

CREATE POLICY "Managers can manage all staffing data" ON staff_schedules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler'));

CREATE POLICY "Staff can view own availability" ON staff_availability
  FOR SELECT USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );

CREATE POLICY "Staff can update own availability" ON staff_availability
  FOR UPDATE USING (
    staff_member_id IN (
      SELECT id FROM staff_members WHERE user_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'scheduler')
  );
```

### **Data Relationships**
- Staff schedules connect to shared providers and locations tables
- Provider schedule data synced from ModMed via @ganger/integrations ModMedClient
- Staff availability and assignments synced with Deputy via DeputyClient
- Employee status verification through ZenefitsClient integration

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
// CRUD operations follow standard patterns
GET    /api/staff-schedules           // List with pagination & filters
POST   /api/staff-schedules           // Create new schedule
GET    /api/staff-schedules/[id]      // Get specific schedule
PUT    /api/staff-schedules/[id]      // Update schedule
DELETE /api/staff-schedules/[id]      // Soft delete schedule

// Real-time subscriptions
WS     /api/staff-schedules/subscribe // Live schedule updates

// Bulk operations
POST   /api/staff-schedules/bulk     // Bulk schedule operations
```

### **App-Specific Endpoints**
```typescript
// Schedule optimization endpoints
POST   /api/staffing/optimize        // Generate AI staffing recommendations
GET    /api/staffing/coverage        // Check coverage for date range
POST   /api/staffing/suggestions     // Get specific suggestions for gaps
POST   /api/staffing/auto-assign     // Auto-assign staff to providers

// Provider schedule sync endpoints
POST   /api/modmed/sync-schedules    // Sync provider schedules from ModMed
GET    /api/modmed/providers         // Get all providers and schedules
GET    /api/modmed/provider/[id]/schedule // Get specific provider schedule

// Staff management endpoints
GET    /api/staff/availability       // Get staff availability
PUT    /api/staff/[id]/availability  // Update staff availability
GET    /api/staff/[id]/preferences   // Get staff preferences
PUT    /api/staff/[id]/preferences   // Update staff preferences

// Deputy integration endpoints
POST   /api/deputy/sync-availability // Sync staff availability from Deputy
POST   /api/deputy/push-schedules    // Push finalized schedules to Deputy
GET    /api/deputy/staff             // Get Deputy staff data
POST   /api/deputy/notifications     // Send schedule notifications

// Zenefits integration endpoints
GET    /api/zenefits/employees       // Get employee status data
GET    /api/zenefits/pto            // Get PTO/leave information
POST   /api/zenefits/sync           // Sync employee data

// Analytics endpoints
GET    /api/analytics/staffing-metrics // Staffing performance metrics
GET    /api/analytics/coverage-report  // Coverage analysis report
GET    /api/analytics/efficiency      // Staff efficiency metrics
GET    /api/analytics/cost-analysis   // Staffing cost analysis

// Cross-location optimization
GET    /api/optimization/cross-location // Cross-location staffing opportunities
POST   /api/optimization/rebalance     // Suggest staff reallocation
GET    /api/optimization/travel-costs  // Calculate travel/coverage costs
```

### **External Integrations**
- **ModMed FHIR**: Provider schedules and appointment data via @ganger/integrations
- **Deputy**: Staff availability, scheduling, and time tracking integration
- **Zenefits**: Employee status, PTO, and HR data verification
- **Error Handling**: Standard retry logic with exponential backoff for external APIs
- **Rate Limiting**: Respect external API limits with intelligent queuing
- **Authentication**: Secure credential management via environment variables

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System + Staffing-specific colors
colors: {
  primary: 'blue-600',      // Medical professional
  secondary: 'green-600',   // Success/optimal coverage
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Understaffed alerts
  danger: 'red-600'         // Critical coverage gaps
  
  // Staffing-specific colors
  optimal: 'emerald-500',   // Optimal staffing levels
  understaffed: 'red-500',  // Understaffed periods
  overstaffed: 'blue-500',  // Overstaffed periods
  crossLocation: 'purple-500', // Cross-location assignments
  aiSuggested: 'indigo-500' // AI-recommended assignments
}
```

### **Component Usage**
```typescript
// Use shared components wherever possible
import {
  // Layout
  AppLayout, PageHeader, Sidebar, NavigationTabs,
  
  // Staffing-specific layouts
  ScheduleBuilder, StaffingDashboard, CoverageAnalytics,
  
  // Interactive components
  DragDropCalendar, StaffCard, ProviderCard, LocationSelector,
  
  // Data visualization
  CoverageChart, StaffingMetrics, EfficiencyReport,
  
  // Forms & Inputs
  FormBuilder, FormField, TimeRangePicker, MultiSelect,
  Button, Input, Select, DatePicker,
  
  // Data Display
  DataTable, PaginationControls, FilterPanel,
  
  // Feedback
  LoadingSpinner, ErrorBoundary, SuccessToast,
  ConfirmDialog, EmptyState, AlertBanner
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Interactive Schedule Builder**: Drag & drop interface for staff assignments
- **Real-time Coverage Visualization**: Color-coded coverage status across all locations
- **AI Recommendation Display**: Visual indicators for AI-suggested optimizations
- **Cross-location Assignment Interface**: Clear visualization of staff working at secondary locations
- **Mobile Schedule Management**: Touch-optimized interface for clinic schedulers
- **Staff Preference Management**: User-friendly availability and preference setting interface

---

## 📱 User Experience

### **User Workflows**
1. **Primary Workflow - Schedule Optimization**: 
   - View provider schedules imported from ModMed
   - See current staff assignments and coverage gaps
   - Review AI suggestions for optimal staff allocation
   - Drag & drop staff to optimize coverage
   - Push finalized schedules to Deputy

2. **Secondary Workflows**: 
   - Staff availability management and preference setting
   - Cross-location coverage analysis and assignment
   - Historical performance analytics and reporting
   - Staff skill and certification management

3. **Error Recovery**: 
   - Manual override for AI suggestions
   - Conflict resolution for overlapping assignments
   - Backup staff identification for last-minute changes

4. **Mobile Experience**: 
   - Touch-optimized schedule viewing and basic editing
   - Push notifications for schedule changes
   - Quick staff availability updates

### **Performance Requirements**
- **Page Load**: < 2 seconds for schedule dashboard
- **Real-time Updates**: < 500ms latency for schedule changes
- **AI Optimization**: < 5 seconds for staffing recommendations
- **External Sync**: < 30 seconds for ModMed/Deputy synchronization

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all interfaces
- **Keyboard Navigation**: Full drag & drop functionality accessible via keyboard
- **Screen Reader Support**: Semantic HTML and ARIA labels for schedule data
- **Color Contrast**: 4.5:1 minimum ratio for all coverage indicators

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// Standard test patterns
Unit Tests: 85%+ coverage for optimization algorithms
Integration Tests: All ModMed, Deputy, and Zenefits API endpoints
E2E Tests: Complete schedule creation and optimization workflows
Performance Tests: Large-scale schedule optimization scenarios
```

### **Test Scenarios**
- **Optimal Coverage**: AI correctly identifies and fills all coverage gaps
- **Cross-location Optimization**: System suggests appropriate cross-site assignments
- **External API Failures**: Graceful handling of ModMed/Deputy/Zenefits outages
- **Complex Scheduling**: Multi-provider, multi-location optimization scenarios
- **Real-time Updates**: Schedule changes propagate correctly to all users
- **Staff Preferences**: System respects availability and preference constraints

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Clinical Staffing specific variables
STAFFING_MODMED_API_URL=https://api.modmed.com/fhir
STAFFING_DEPUTY_API_URL=https://api.deputy.com
STAFFING_DEPUTY_API_KEY=your-deputy-api-key
STAFFING_ZENEFITS_API_URL=https://api.zenefits.com
STAFFING_ZENEFITS_API_KEY=your-zenefits-api-key
STAFFING_OPTIMIZATION_ENGINE=ai_enhanced
STAFFING_MIN_COVERAGE_THRESHOLD=0.85
STAFFING_CROSS_LOCATION_ENABLED=true
```

### **Monitoring & Alerts**
- **Coverage Monitoring**: Real-time alerts for understaffed periods
- **Integration Health**: ModMed, Deputy, and Zenefits API connectivity monitoring
- **Optimization Performance**: AI recommendation accuracy and adoption tracking
- **Staff Satisfaction**: Schedule fairness and preference compliance monitoring

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Schedule builder usage, optimization adoption rates
- **Performance Metrics**: Page load times, real-time update latency
- **Integration Health**: External API response times and error rates

### **App-Specific Analytics**
- **Coverage Metrics**: Optimal vs actual staffing ratios across locations
- **Efficiency Metrics**: Staff utilization rates and productivity measures
- **Cost Analysis**: Overtime costs, cross-location travel expenses
- **AI Performance**: Optimization suggestion accuracy and adoption rates
- **Staff Satisfaction**: Schedule preference compliance and fairness metrics
- **Operational Impact**: Patient wait times and provider satisfaction correlation

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] ModMed provider schedule sync functional and accurate
- [ ] Deputy staff availability integration working correctly
- [ ] AI optimization generating valid staffing recommendations
- [ ] Drag & drop schedule builder functional across devices
- [ ] Real-time updates working for multi-user scheduling
- [ ] Staff training completed with 90% proficiency scores

### **Success Metrics (6 months)**
- 95% optimal physician-to-support-staff coverage across all locations
- 25% reduction in understaffed clinic days
- 90% staff satisfaction with schedule fairness and predictability
- 15% improvement in clinic operational efficiency
- 20% reduction in overtime costs through better optimization

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] ModMed FHIR integration setup and provider schedule mapping
- [ ] Deputy API integration for staff availability and schedule management
- [ ] Zenefits integration for employee status verification
- [ ] AI optimization algorithm documentation and tuning parameters
- [ ] Real-time scheduling architecture and conflict resolution procedures

### **User Documentation**
- [ ] Schedule builder user guide with drag & drop instructions
- [ ] Staff availability management tutorial
- [ ] Cross-location assignment procedures and guidelines
- [ ] AI optimization review and override procedures
- [ ] Mobile schedule management guide for clinic schedulers

---

*This PRD leverages the consolidated Ganger Platform architecture to deliver intelligent clinical staffing optimization that integrates seamlessly with existing ModMed, Deputy, and Zenefits systems while providing powerful AI-driven recommendations for optimal coverage.*