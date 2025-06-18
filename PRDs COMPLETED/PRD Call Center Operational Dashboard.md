# PRD: Call Center Operations Dashboard
*Ganger Platform Standard Application*

## 📋 Document Information
- **Application Name**: Call Center Operations Dashboard
- **Priority**: High
- **Development Timeline**: 6-8 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations, @ganger/ai, @ganger/utils
- **Integration Requirements**: 3CX CDR API v18+, Call recording systems, AWS Bedrock (Claude 3.5 Sonnet), Twilio MCP, Time MCP, Database MCP
- **Compliance Requirements**: HIPAA, SOC 2 Type II, PCI DSS (for payment call tracking), Call recording retention (7 years)

---

## 🎯 Product Overview

### **Purpose Statement**
Create a comprehensive call center management dashboard that leverages 3CX CDR data to provide detailed reporting, productivity tracking, call journaling, and staff accountability metrics for optimizing reception and appointment scheduling operations.

### **Target Users**
- **Primary**: Call Center Managers (manager role) - team performance oversight and operational reporting
- **Secondary**: Reception Staff Supervisors (staff role) - daily productivity monitoring and coaching
- **Tertiary**: Individual Staff Members (staff role) - personal performance tracking and call logging

### **Success Metrics**

**Operational Excellence (Measured Daily):**
- **Call Center Productivity**: 30% improvement in calls handled per agent per hour (baseline: 12 calls/hour → target: 15.6 calls/hour)
- **Call Logging Accuracy**: 95% accuracy in call outcome classification and patient interaction tracking
- **Response Time**: < 10 seconds for real-time CDR data processing and dashboard updates
- **System Uptime**: 99.9% availability during peak call hours (8 AM - 6 PM EST)

**Performance Management (Measured Weekly):**
- **Training Efficiency**: 50% reduction in new agent training time (baseline: 6 weeks → target: 3 weeks)
- **Quality Consistency**: 90% of agents meeting quality score targets (>85/100) within 90 days
- **Coaching Effectiveness**: 25% improvement in agent performance within 30 days of targeted coaching
- **Goal Achievement**: 80% of agents meeting monthly performance goals

**Business Impact (Measured Monthly):**
- **Accountability Tracking**: 100% of calls documented with outcome tracking and follow-up requirements
- **Patient Satisfaction**: Maintain >4.5/5.0 rating for call center interactions
- **Cost Efficiency**: 20% reduction in call handling costs through optimized performance management
- **Compliance**: Zero HIPAA violations and 100% call recording retention compliance

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
  Button, Card, DataTable, FormField, LoadingSpinner, Chart,
  AppLayout, PageHeader, ConfirmDialog, ErrorBoundary,
  CallCenterDashboard, AgentPerformancePanel, TeamMetricsGrid,
  PerformanceReport, CallAnalyticsChart, ProductivityMetrics
} from '@ganger/ui';
import { useAuth, withAuth, requireRole } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { 
  ThreeCXClient, 
  DatabaseHub, // Supabase MCP integration
  CommunicationHub // Twilio MCP integration
} from '@ganger/integrations';
import { 
  PerformanceAnalyzer,
  CallQualityAnalyzer,
  ProductivityOptimizer
} from '@ganger/ai';
import { analytics, notifications, reporting, logger, encryption } from '@ganger/utils';
```

### **App-Specific Technology**
- **Advanced Reporting Engine**: Complex multi-dimensional analytics with drill-down capabilities via @ganger/ai
- **Call Journaling System**: Detailed call outcome tracking and note management
- **Performance Scoring**: Automated KPI calculation and benchmarking via @ganger/ai
- **Coaching Tools**: Performance review workflows and improvement tracking
- **Productivity Analytics**: Time tracking, efficiency metrics, and goal management
- **Real-time CDR Processing**: 3CX integration with live call data streaming

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'supervisor' | 'call_center_agent';

interface CallCenterPermissions {
  viewOwnPerformance: ['staff', 'call_center_agent', 'supervisor', 'manager', 'superadmin'];
  viewTeamPerformance: ['supervisor', 'manager', 'superadmin'];
  viewAllPerformance: ['manager', 'superadmin'];
  editCallJournals: ['call_center_agent', 'supervisor', 'manager', 'superadmin'];
  reviewJournals: ['supervisor', 'manager', 'superadmin'];
  generateReports: ['supervisor', 'manager', 'superadmin'];
  configureMetrics: ['manager', 'superadmin'];
  manageGoals: ['supervisor', 'manager', 'superadmin'];
  accessRecordings: ['supervisor', 'manager', 'superadmin'];
  conductQAReviews: ['supervisor', 'manager', 'superadmin'];
  manageCampaigns: ['manager', 'superadmin'];
  exportData: ['manager', 'superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Hierarchical Access**: Staff see own data, supervisors see team data, managers see all
- **Performance Privacy**: Individual metrics protected with role-based visibility
- **Call Recording Access**: Restricted to supervisory roles for quality assurance

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
notifications, notification_preferences,
file_uploads, document_storage
```

### **App-Specific Tables**
```sql
-- Enhanced call records with call center specific data
CREATE TABLE call_center_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL, -- 3CX call identifier
  
  -- Call identification and routing
  location TEXT NOT NULL CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth')),
  queue_name TEXT NOT NULL,
  agent_extension TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  
  -- Call details
  caller_number TEXT NOT NULL,
  caller_name TEXT,
  called_number TEXT NOT NULL,
  call_direction TEXT NOT NULL, -- 'inbound', 'outbound'
  call_type TEXT, -- 'appointment', 'prescription', 'billing', 'general', 'follow_up'
  
  -- Timing metrics (all in Eastern Time)
  call_start_time TIMESTAMPTZ NOT NULL,
  call_answer_time TIMESTAMPTZ,
  call_end_time TIMESTAMPTZ,
  ring_duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN call_answer_time IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (call_answer_time - call_start_time))::INTEGER
    ELSE NULL END
  ) STORED,
  talk_duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN call_end_time IS NOT NULL AND call_answer_time IS NOT NULL
    THEN EXTRACT(EPOCH FROM (call_end_time - call_answer_time))::INTEGER
    ELSE NULL END
  ) STORED,
  
  -- Call outcome and quality
  call_status TEXT NOT NULL, -- 'completed', 'missed', 'abandoned', 'transferred', 'voicemail'
  call_outcome TEXT, -- 'appointment_scheduled', 'information_provided', 'transfer_required', 'callback_scheduled'
  customer_satisfaction_score INTEGER, -- 1-5 rating if collected
  quality_score INTEGER, -- Manager/supervisor rating 1-100
  
  -- Patient and appointment context
  patient_mrn TEXT,
  appointment_scheduled BOOLEAN DEFAULT FALSE,
  appointment_date DATE,
  appointment_type TEXT,
  provider_requested TEXT,
  
  -- Performance indicators
  first_call_resolution BOOLEAN DEFAULT FALSE,
  escalation_required BOOLEAN DEFAULT FALSE,
  complaint_call BOOLEAN DEFAULT FALSE,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  
  -- Recording and compliance
  recording_available BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  recording_reviewed BOOLEAN DEFAULT FALSE,
  compliance_notes TEXT,
  
  -- Productivity metrics
  after_call_work_seconds INTEGER DEFAULT 0, -- Time spent on call-related tasks
  hold_time_seconds INTEGER DEFAULT 0,
  transfer_count INTEGER DEFAULT 0,
  
  -- Call center metadata
  shift_id UUID, -- Reference to agent's shift
  campaign_id TEXT, -- For outbound campaigns
  call_priority TEXT DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call journaling and detailed call notes
CREATE TABLE call_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_record_id UUID REFERENCES call_center_records(id) ON DELETE CASCADE,
  agent_email TEXT NOT NULL,
  
  -- Call summary and notes
  call_summary TEXT NOT NULL, -- Brief summary of call purpose
  detailed_notes TEXT, -- Detailed interaction notes
  patient_concern TEXT, -- Primary patient concern/request
  resolution_provided TEXT, -- How the concern was addressed
  
  -- Action items and follow-up
  action_items TEXT[], -- Array of action items created
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_type TEXT, -- 'callback', 'appointment', 'provider_review', 'billing'
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Call categorization
  call_tags TEXT[], -- Searchable tags for reporting
  department_involved TEXT[], -- Departments that were consulted
  referral_made BOOLEAN DEFAULT FALSE,
  referral_type TEXT,
  
  -- Quality and training
  coaching_notes TEXT, -- Supervisor coaching notes
  training_opportunities TEXT[], -- Identified training needs
  commendation_worthy BOOLEAN DEFAULT FALSE,
  improvement_areas TEXT[],
  
  -- Status tracking
  journal_status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed', 'approved'
  submitted_at TIMESTAMPTZ,
  reviewed_by TEXT, -- Supervisor who reviewed
  reviewed_at TIMESTAMPTZ,
  review_score INTEGER, -- Supervisor rating 1-100
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent shifts and scheduling
CREATE TABLE agent_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_email TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  location TEXT NOT NULL,
  
  -- Shift timing
  shift_date DATE NOT NULL,
  scheduled_start_time TIME NOT NULL,
  scheduled_end_time TIME NOT NULL,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  
  -- Break and availability tracking
  total_break_time_minutes INTEGER DEFAULT 0,
  lunch_break_minutes INTEGER DEFAULT 0,
  training_time_minutes INTEGER DEFAULT 0,
  meeting_time_minutes INTEGER DEFAULT 0,
  
  -- Performance during shift
  calls_handled INTEGER DEFAULT 0,
  calls_missed INTEGER DEFAULT 0,
  total_talk_time_seconds INTEGER DEFAULT 0,
  total_available_time_seconds INTEGER DEFAULT 0,
  total_after_call_work_seconds INTEGER DEFAULT 0,
  
  -- Productivity metrics
  utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_available_time_seconds > 0 
    THEN ((total_talk_time_seconds + total_after_call_work_seconds)::DECIMAL / total_available_time_seconds) * 100
    ELSE 0 END
  ) STORED,
  
  calls_per_hour DECIMAL(6,2) GENERATED ALWAYS AS (
    CASE WHEN total_available_time_seconds > 0 
    THEN (calls_handled::DECIMAL / (total_available_time_seconds / 3600))
    ELSE 0 END
  ) STORED,
  
  -- Goals and targets
  call_target INTEGER,
  appointment_target INTEGER,
  quality_target DECIMAL(5,2),
  
  -- Shift notes and status
  shift_notes TEXT,
  tardiness_minutes INTEGER DEFAULT 0,
  early_departure_minutes INTEGER DEFAULT 0,
  shift_status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'absent', 'partial'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_email, shift_date)
);

-- Performance goals and KPI tracking
CREATE TABLE performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_email TEXT NOT NULL,
  goal_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Quantitative goals
  calls_per_day_target INTEGER,
  talk_time_percentage_target DECIMAL(5,2),
  first_call_resolution_target DECIMAL(5,2),
  customer_satisfaction_target DECIMAL(5,2),
  appointment_conversion_target DECIMAL(5,2),
  quality_score_target DECIMAL(5,2),
  
  -- Current performance tracking
  calls_per_day_actual DECIMAL(6,2) DEFAULT 0,
  talk_time_percentage_actual DECIMAL(5,2) DEFAULT 0,
  first_call_resolution_actual DECIMAL(5,2) DEFAULT 0,
  customer_satisfaction_actual DECIMAL(5,2) DEFAULT 0,
  appointment_conversion_actual DECIMAL(5,2) DEFAULT 0,
  quality_score_actual DECIMAL(5,2) DEFAULT 0,
  
  -- Goal achievement tracking
  goals_met INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 6,
  achievement_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    (goals_met::DECIMAL / total_goals) * 100
  ) STORED,
  
  -- Development and coaching
  development_areas TEXT[],
  coaching_focus TEXT,
  improvement_plan TEXT,
  recognition_earned TEXT[],
  
  -- Status and review
  goal_status TEXT DEFAULT 'active', -- 'active', 'completed', 'revised', 'paused'
  created_by TEXT NOT NULL, -- Manager who set goals
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team performance analytics and reporting
CREATE TABLE team_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_period DATE NOT NULL,
  location TEXT,
  team_name TEXT,
  
  -- Team size and coverage
  total_agents INTEGER NOT NULL,
  active_agents INTEGER NOT NULL,
  average_experience_months DECIMAL(6,2),
  
  -- Volume metrics
  total_calls_handled INTEGER DEFAULT 0,
  total_calls_missed INTEGER DEFAULT 0,
  total_talk_time_hours DECIMAL(8,2) DEFAULT 0,
  total_available_hours DECIMAL(8,2) DEFAULT 0,
  
  -- Quality metrics
  average_quality_score DECIMAL(5,2) DEFAULT 0,
  average_customer_satisfaction DECIMAL(5,2) DEFAULT 0,
  first_call_resolution_rate DECIMAL(5,2) DEFAULT 0,
  complaint_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Productivity metrics
  calls_per_agent_per_day DECIMAL(6,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2) DEFAULT 0,
  appointment_conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Attendance and reliability
  attendance_rate DECIMAL(5,2) DEFAULT 100.00,
  punctuality_rate DECIMAL(5,2) DEFAULT 100.00,
  schedule_adherence_rate DECIMAL(5,2) DEFAULT 100.00,
  
  -- Goal achievement
  agents_meeting_goals INTEGER DEFAULT 0,
  team_goal_achievement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Training and development
  training_hours_completed DECIMAL(8,2) DEFAULT 0,
  certifications_earned INTEGER DEFAULT 0,
  coaching_sessions_conducted INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call center campaigns and initiatives
CREATE TABLE call_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'outbound_appointments', 'follow_up', 'satisfaction_survey', 'retention'
  
  -- Campaign timing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  campaign_status TEXT DEFAULT 'planned', -- 'planned', 'active', 'paused', 'completed', 'cancelled'
  
  -- Target and scope
  target_audience TEXT NOT NULL,
  target_call_count INTEGER,
  target_conversion_rate DECIMAL(5,2),
  assigned_agents TEXT[], -- Array of agent emails
  priority_level TEXT DEFAULT 'normal',
  
  -- Campaign performance
  calls_attempted INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  successful_outcomes INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Script and materials
  call_script TEXT,
  talking_points TEXT[],
  required_documentation TEXT[],
  training_materials TEXT[],
  
  -- Campaign notes and management
  campaign_notes TEXT,
  created_by TEXT NOT NULL,
  managed_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality assurance and call monitoring
CREATE TABLE quality_assurance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_record_id UUID REFERENCES call_center_records(id) ON DELETE CASCADE,
  agent_email TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  
  -- Review timing
  review_date DATE NOT NULL,
  review_type TEXT NOT NULL, -- 'random', 'targeted', 'complaint_follow_up', 'new_agent', 'coaching'
  
  -- Scoring categories (1-5 scale)
  greeting_professionalism INTEGER CHECK (greeting_professionalism BETWEEN 1 AND 5),
  active_listening INTEGER CHECK (active_listening BETWEEN 1 AND 5),
  problem_resolution INTEGER CHECK (problem_resolution BETWEEN 1 AND 5),
  product_knowledge INTEGER CHECK (product_knowledge BETWEEN 1 AND 5),
  communication_clarity INTEGER CHECK (communication_clarity BETWEEN 1 AND 5),
  empathy_patience INTEGER CHECK (empathy_patience BETWEEN 1 AND 5),
  call_control INTEGER CHECK (call_control BETWEEN 1 AND 5),
  closing_effectiveness INTEGER CHECK (closing_effectiveness BETWEEN 1 AND 5),
  
  -- Overall scoring
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(greeting_professionalism, 0) + COALESCE(active_listening, 0) + 
    COALESCE(problem_resolution, 0) + COALESCE(product_knowledge, 0) + 
    COALESCE(communication_clarity, 0) + COALESCE(empathy_patience, 0) + 
    COALESCE(call_control, 0) + COALESCE(closing_effectiveness, 0)
  ) STORED,
  
  percentage_score DECIMAL(5,2) GENERATED ALWAYS AS (
    (total_score::DECIMAL / 40) * 100
  ) STORED,
  
  -- Qualitative feedback
  strengths_observed TEXT,
  improvement_areas TEXT,
  specific_coaching_points TEXT,
  recognition_worthy BOOLEAN DEFAULT FALSE,
  
  -- Action items
  action_items_required TEXT[],
  follow_up_review_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  additional_training_recommended TEXT[],
  
  -- Review status
  review_status TEXT DEFAULT 'draft', -- 'draft', 'completed', 'discussed_with_agent'
  agent_discussion_date DATE,
  agent_acknowledgment BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance optimization indexes
CREATE INDEX idx_call_center_records_agent ON call_center_records(agent_email, call_start_time);
CREATE INDEX idx_call_center_records_outcome ON call_center_records(call_outcome, appointment_scheduled);
CREATE INDEX idx_call_center_records_time ON call_center_records(call_start_time);
CREATE INDEX idx_call_journals_agent ON call_journals(agent_email, created_at);
CREATE INDEX idx_call_journals_follow_up ON call_journals(follow_up_required, follow_up_date);
CREATE INDEX idx_agent_shifts_date ON agent_shifts(agent_email, shift_date);
CREATE INDEX idx_performance_goals_period ON performance_goals(agent_email, period_start_date, period_end_date);
CREATE INDEX idx_qa_reviews_agent ON quality_assurance_reviews(agent_email, review_date);
CREATE INDEX idx_team_metrics_period ON team_performance_metrics(reporting_period, location);

-- Row Level Security
ALTER TABLE call_center_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assurance_reviews ENABLE ROW LEVEL SECURITY;

-- Comprehensive access policies aligned with established patterns
CREATE POLICY "Users can view call records based on role and location" ON call_center_records
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'supervisor' -- Location-based team access
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
    OR (
      auth.jwt() ->> 'role' IN ('staff', 'call_center_agent') -- Own records only
      AND agent_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Agents can manage own call journals" ON call_journals
  FOR ALL USING (
    agent_email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'role' IN ('supervisor', 'manager', 'superadmin')
  );

CREATE POLICY "Supervisors can access team performance data" ON team_performance_metrics
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'supervisor' -- Location-based access
      AND location IN (
        SELECT location_name FROM location_staff 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "QA reviews visible based on role and agent relationship" ON quality_assurance_reviews
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR reviewer_email = auth.jwt() ->> 'email' -- Reviewers can see their reviews
    OR agent_email = auth.jwt() ->> 'email' -- Agents can see their own reviews
  );

CREATE POLICY "Performance goals visible based on role hierarchy" ON performance_goals
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin') -- Full access
    OR agent_email = auth.jwt() ->> 'email' -- Own goals
    OR created_by = auth.jwt() ->> 'email' -- Goals they created
  );
```

### **Data Relationships**
- Call records link to agents through email/extension mapping
- Call journals provide detailed notes and follow-up tracking for each call
- Agent shifts aggregate daily performance metrics
- Performance goals track individual and team KPI achievement
- Quality assurance reviews link to specific calls for coaching and improvement

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
GET    /api/call-records               // List call records with filters
GET    /api/call-records/[id]         // Get specific call details
POST   /api/call-journals             // Create call journal entry
PUT    /api/call-journals/[id]        // Update call journal
GET    /api/agent-performance/[email] // Get agent performance metrics
GET    /api/team-metrics              // Get team performance data

// Real-time subscriptions
WS     /api/call-center/live          // Live call center metrics
```

### **App-Specific Endpoints**
```typescript
// 3CX CDR integration and processing
POST   /api/3cx/cdr-webhook          // 3CX CDR webhook for call data
GET    /api/3cx/agent-status         // Current agent status from 3CX
POST   /api/call-processing/analyze  // Process and categorize call data

// Performance reporting and analytics
GET    /api/reports/agent-performance    // Individual agent performance reports
GET    /api/reports/team-performance     // Team performance reports
GET    /api/reports/call-analytics       // Call analytics and trends
POST   /api/reports/custom               // Generate custom reports
GET    /api/reports/productivity         // Productivity and efficiency reports

// Call journaling and documentation
POST   /api/journals/bulk-create         // Bulk create call journals
GET    /api/journals/pending-review      // Journals pending supervisor review
PUT    /api/journals/[id]/review         // Submit journal review
GET    /api/journals/search              // Search journals by criteria

// Goal management and tracking
POST   /api/goals/set                    // Set performance goals for agents
PUT    /api/goals/[id]/update            // Update goal progress
GET    /api/goals/achievement            // Goal achievement tracking
POST   /api/goals/team-goals             // Set team-wide goals

// Quality assurance and coaching
POST   /api/qa/review                    // Create QA review
GET    /api/qa/reviews/[agentEmail]      // Get agent QA reviews
PUT    /api/qa/reviews/[id]/discuss      // Mark review as discussed
GET    /api/qa/coaching-opportunities    // Identify coaching needs

// Campaign management
POST   /api/campaigns/create             // Create outbound campaign
PUT    /api/campaigns/[id]/assign        // Assign agents to campaign
GET    /api/campaigns/performance        // Campaign performance metrics
POST   /api/campaigns/[id]/calls         // Log campaign call outcomes

// Workforce management
GET    /api/workforce/scheduling         // Agent scheduling and coverage
POST   /api/workforce/shift-start        // Log shift start
POST   /api/workforce/shift-end          // Log shift end with metrics
GET    /api/workforce/utilization        // Agent utilization analytics

// Dashboard and visualization
GET    /api/dashboard/supervisor         // Supervisor dashboard data
GET    /api/dashboard/agent              // Agent personal dashboard
GET    /api/dashboard/executive          // Executive summary dashboard
GET    /api/dashboard/real-time          // Real-time operations data
```

### **External Integrations**
- **3CX PBX System**: Real-time CDR data, agent status, call recordings via @ganger/integrations
- **Performance Analytics**: Advanced statistical analysis and trending via @ganger/ai
- **Communication Hub**: Twilio MCP server for notification delivery
- **Database Hub**: Supabase MCP server for real-time data synchronization
- **Reporting Engine**: Automated report generation and distribution
- **Training Systems**: Integration with LMS for skill development tracking
- **HR Systems**: Employee data and performance review integration

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System + Call center specific colors
colors: {
  primary: 'blue-600',      // Standard interface
  secondary: 'green-600',   // Performance achievements
  accent: 'purple-600',     // Analytics and insights
  neutral: 'slate-600',     // Text and borders
  warning: 'amber-600',     // Performance warnings
  danger: 'red-600'         // Critical performance issues
}

// Call center performance colors
performanceColors: {
  excellent: 'emerald-600', // Top performance (90%+)
  good: 'green-600',        // Good performance (80-89%)
  average: 'blue-600',      // Average performance (70-79%)
  below: 'amber-600',       // Below expectations (60-69%)
  poor: 'red-600'           // Poor performance (<60%)
}
```

### **Component Usage**
```typescript
import {
  // Layout
  AppLayout, PageHeader, Sidebar, NavigationTabs,
  
  // Call center specific layouts
  CallCenterDashboard, AgentPerformancePanel, TeamMetricsGrid,
  
  // Reporting and analytics
  PerformanceReport, CallAnalyticsChart, ProductivityMetrics,
  GoalTrackingCard, QualityScoreDisplay, TrendAnalysis,
  
  // Call journaling
  CallJournalEditor, JournalReviewPanel, FollowUpTracker,
  
  // Quality assurance
  QAReviewForm, CoachingNotesPanel, SkillAssessment,
  
  // Workforce management
  ShiftSchedule, UtilizationChart, AttendanceTracker,
  
  // Interactive controls
  GoalSetter, CampaignManager, ReportBuilder
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Multi-Level Dashboards**: Agent, supervisor, and executive views with role-appropriate metrics
- **Performance Visualization**: Color-coded performance indicators and trending charts
- **Call Journal Interface**: Efficient call logging with templates and auto-completion
- **Quality Review Tools**: Streamlined QA review forms with scoring and feedback
- **Goal Tracking**: Visual progress indicators and achievement celebrations
- **Real-Time Metrics**: Live updating performance dashboards
- **Coaching Workflow**: Structured coaching conversation tracking and development plans

---

## 📱 User Experience

### **User Workflows**
1. **Agent Daily Workflow**:
   - View personal performance dashboard upon login
   - Log call outcomes and create detailed journals
   - Track progress toward daily/weekly goals
   - Access coaching feedback and development resources

2. **Supervisor Management Workflow**:
   - Monitor real-time team performance metrics
   - Review and approve call journals from team members
   - Conduct quality assurance reviews of recorded calls
   - Set goals and track achievement across team
   - Generate performance reports for management

3. **Call Journaling Process**:
   - Quick call outcome logging during/after calls
   - Detailed journal entry with follow-up tracking
   - Supervisor review and feedback loop
   - Integration with appointment scheduling and patient records

4. **Performance Review Cycle**:
   - Weekly goal tracking and adjustment
   - Monthly quality assurance reviews
   - Quarterly comprehensive performance evaluation
   - Continuous coaching and development planning

### **Performance Requirements**
- **Dashboard Load**: < 3 seconds for comprehensive performance dashboard on 3G
- **Real-Time Updates**: < 10 seconds for live metrics refresh via Supabase subscriptions
- **Report Generation**: < 30 seconds for complex multi-agent reports
- **Call Journal Save**: < 2 seconds for journal entry submission
- **CDR Processing**: < 5 seconds for real-time call data ingestion
- **Bundle Size**: < 120KB initial bundle (excluding shared packages)
- **TypeScript Compilation**: 0 errors, 0 warnings in strict mode
- **Lighthouse Score**: > 90 for Performance, Accessibility, Best Practices

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all reporting and dashboard interfaces
- **Keyboard Navigation**: Complete dashboard navigation for efficiency
- **Screen Reader Support**: Performance metrics and coaching content accessibility
- **High Contrast**: Clear visibility for extended dashboard monitoring

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// Zero-tolerance quality gates for call center operations
Unit Tests: 90%+ coverage for performance calculations and reporting logic
Integration Tests: 3CX CDR processing, goal tracking, quality scoring, MCP servers
E2E Tests: Complete call journaling and performance review workflows with Playwright
Performance Tests: High-volume CDR processing (1000+ calls/hour) and report generation
Analytics Tests: Performance metric accuracy and trending calculations
Security Tests: Role-based access to sensitive performance data, RLS validation
TypeScript: 0 compilation errors in strict mode
ESLint: 0 errors, 0 warnings with @ganger/eslint-config
Bundle Analysis: Size budgets enforced for all dashboard chunks
Accessibility Tests: WCAG 2.1 AA compliance for all interfaces
```

### **Test Scenarios**
- **Performance Calculation Accuracy**: Validate all KPI calculations with known data sets
- **Goal Tracking**: Test goal achievement calculations and progress tracking
- **Call Journal Workflow**: Complete journal creation to supervisor review cycle
- **Quality Assurance**: QA review scoring and coaching recommendation workflows
- **Reporting Accuracy**: Verify report data against source CDR records
- **Multi-User Concurrency**: Multiple supervisors accessing team data simultaneously

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers with analytics optimization
Build: Next.js static export with reporting performance optimization
CDN: Cloudflare global edge network with dashboard caching
Database: Supabase with optimized indexing for large call datasets
Monitoring: Advanced performance and accuracy monitoring
Logging: Comprehensive audit trail for performance data access
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited from platform)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Call center specific variables
THREECX_CDR_WEBHOOK_SECRET=your-cdr-webhook-secret
THREECX_RECORDING_BASE_URL=https://recordings.3cx.gangerdermatology.com
CALL_CENTER_MANAGER_EMAIL=callcenter@gangerdermatology.com
PERFORMANCE_REPORT_SCHEDULE=daily_8am
COACHING_REMINDER_ENABLED=true
GOAL_ACHIEVEMENT_NOTIFICATIONS=true
QA_REVIEW_QUOTA_PER_AGENT=5

# MCP Server Configuration (via shared @ganger/integrations)
TWILIO_ACCOUNT_SID=AC... # Communication Hub for notifications
TWILIO_AUTH_TOKEN=... # Communication Hub
CALL_RECORDING_RETENTION_DAYS=2555 # 7 years for compliance
PERFORMANCE_DATA_ENCRYPTION=true
```

### **Monitoring & Alerts**
- **CDR Processing**: Monitor webhook delivery and data processing accuracy
- **Performance Accuracy**: Validate calculated metrics against source data
- **Goal Achievement**: Track individual and team goal progress
- **Quality Assurance**: Monitor QA review completion rates and scores
- **System Usage**: Track dashboard engagement and feature adoption

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Dashboard usage patterns by role and feature
- **System Performance**: Report generation speed and data processing efficiency
- **Feature Adoption**: Most used reporting features and dashboard widgets

### **App-Specific Analytics**
- **Call Center Performance**: Overall productivity trends and efficiency metrics
- **Agent Development**: Individual performance improvement tracking over time
- **Quality Trends**: QA scores and coaching effectiveness measurement
- **Goal Achievement**: Success rates and achievement patterns across teams
- **Operational Efficiency**: Time savings from automated reporting and tracking
- **Training ROI**: Correlation between coaching/training and performance improvement

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: All call records and performance data encrypted at rest and in transit
- **Access Controls**: Strict role-based access to sensitive performance information
- **Audit Logging**: Complete tracking of performance data access and modifications
- **Call Recording Security**: Secure access to call recordings for QA purposes

### **Employee Privacy & HR Compliance**
- **Performance Privacy**: Individual metrics protected with appropriate access controls
- **Recording Consent**: Compliance with call recording consent requirements
- **Data Retention**: Appropriate retention periods for performance and coaching data
- **Documentation Standards**: Proper documentation of coaching and performance discussions

### **App-Specific Security**
- **Performance Data Protection**: Secure handling of sensitive employee performance metrics
- **Goal Setting Security**: Audit trail for goal changes and performance evaluations
- **Quality Review Security**: Secure storage and access to QA reviews and coaching notes
- **Reporting Access Control**: Role-based restrictions on performance reporting

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] 3CX CDR integration processing all call types with complete data accuracy
- [ ] Performance dashboards displaying real-time metrics for all roles
- [ ] Call journaling workflow tested and adopted by reception staff
- [ ] Goal tracking system configured with baseline performance metrics
- [ ] Quality assurance review process implemented with supervisor training

### **Success Metrics (6 months)**
- 30% improvement in call center productivity through performance visibility
- 95% accuracy in call logging and patient interaction tracking
- 50% reduction in new agent training time through detailed analytics
- 100% accountability achieved through comprehensive call journaling
- 90% supervisor adoption of QA review and coaching workflows

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Performance Model Updates**: Monthly review and calibration of KPI calculations
- **Goal Setting Optimization**: Quarterly review of performance targets and benchmarks
- **Quality Standards Review**: Regular update of QA scoring criteria and coaching standards
- **Reporting Enhancement**: Ongoing improvement of report accuracy and usefulness

### **Future Enhancements**
- **Predictive Analytics**: AI-powered performance forecasting and early intervention
- **Advanced Coaching**: Automated coaching recommendation based on performance patterns
- **Patient Outcome Correlation**: Link call center performance to patient satisfaction
- **Gamification**: Performance achievement badges and team competition features
- **Voice Analytics**: AI analysis of call tone, sentiment, and communication effectiveness

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Performance calculation algorithms and KPI definitions
- [ ] 3CX CDR integration setup and data mapping documentation
- [ ] Goal tracking system configuration and customization guide
- [ ] Quality assurance scoring methodology and review process

### **User Documentation**
- [ ] Agent performance dashboard user guide
- [ ] Call journaling best practices and templates
- [ ] Supervisor coaching and review workflow procedures
- [ ] Goal setting and achievement tracking guide
- [ ] Quality assurance review process and scoring criteria
- [ ] Performance improvement planning and development resources

---

*This Call Center Operations Dashboard transforms call center management through comprehensive performance tracking, detailed accountability measures, and data-driven coaching workflows that optimize both individual and team performance.*