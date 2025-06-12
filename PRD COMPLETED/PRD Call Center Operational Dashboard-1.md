# PRD: Call Center Operations Dashboard - Part 1 (Data Pipeline & Backend Systems)
*Ganger Platform Standard Application - Backend Infrastructure*

## 📋 Document Information
- **Application Name**: Call Center Operations Dashboard - Data Pipeline & Backend
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/auth, @ganger/db, @ganger/integrations, @ganger/ai, @ganger/utils
- **Integration Requirements**: 3CX CDR API v18+, Call recording systems, AWS Bedrock (Claude 3.5 Sonnet), Twilio MCP, Time MCP, Database MCP
- **Compliance Requirements**: HIPAA, SOC 2 Type II, PCI DSS (for payment call tracking), Call recording retention (7 years)

## 🎯 Developer Assignment & Project Locations

### **Backend Developer Responsibilities**
**Primary Work Location**: `/ganger-platform/apps/call-center-ops/`

**Specific Development Areas**:
- `/ganger-platform/apps/call-center-ops/src/lib/` - Core business logic and integrations
- `/ganger-platform/apps/call-center-ops/src/pages/api/` - All API endpoints and webhooks
- `/ganger-platform/supabase/migrations/` - Database schema and migration files
- `/ganger-platform/packages/integrations/` - 3CX and external system integrations

**Key Responsibilities**:
1. **3CX CDR Integration**: Real-time call data processing and webhook handling
2. **Database Schema**: All call center tables, indexes, and Row Level Security policies
3. **API Development**: Performance analytics, reporting endpoints, and data processing
4. **Background Processing**: Performance calculations, goal tracking, and automated reporting
5. **External Integrations**: 3CX PBX, call recording systems, and notification services

---

## 🎯 Product Overview

### **Purpose Statement**
Develop the complete backend infrastructure for call center management including real-time CDR processing, performance analytics engine, and comprehensive reporting capabilities that support detailed productivity tracking and staff accountability metrics.

### **Backend Success Metrics**

**Data Processing Excellence (Measured in Real-time):**
- **CDR Processing Speed**: < 5 seconds for real-time call data ingestion and processing
- **API Response Time**: < 500ms for performance metrics queries and < 2 seconds for complex reports
- **Data Accuracy**: 99.9% accuracy in call record processing and performance calculations
- **System Reliability**: 99.9% uptime for data processing pipelines during peak hours (8 AM - 6 PM EST)

**Performance Analytics Accuracy (Measured Daily):**
- **KPI Calculation Precision**: 100% accuracy in productivity metrics, goal tracking, and quality scoring
- **Real-time Synchronization**: < 10 seconds latency for live dashboard data updates
- **Reporting Consistency**: 100% data consistency between raw CDR and calculated metrics
- **Integration Reliability**: 99.5% uptime for 3CX integration and external system connections

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard)**
```yaml
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Real-time: Supabase subscriptions and webhooks
File Storage: Supabase Storage with CDN
```

### **Required Shared Packages**
```typescript
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

### **Backend-Specific Technology**
- **3CX CDR Processing**: Real-time webhook processing with data validation and enrichment
- **Performance Analytics Engine**: Advanced KPI calculations and trend analysis via @ganger/ai
- **Automated Reporting**: Scheduled report generation and distribution system
- **Data Validation**: Comprehensive data integrity checks and error handling
- **Background Jobs**: Performance metric updates, goal tracking, and notification processing
- **Caching Layer**: Optimized data retrieval for frequently accessed performance metrics

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

### **Backend Access Control Implementation**
- **API Security**: Role-based endpoint protection with JWT validation
- **Data Security**: Row Level Security policies for all performance data
- **Audit Logging**: Comprehensive tracking of all data access and modifications
- **Performance Privacy**: Location-based and hierarchical data access controls

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

### **Backend-Specific API Endpoints**
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

// Backend processing endpoints
POST   /api/processing/calculate-kpis    // Trigger KPI calculations
POST   /api/processing/generate-reports  // Generate scheduled reports
POST   /api/processing/sync-3cx          // Sync agent data from 3CX
GET    /api/processing/health-check      // System health validation
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

## 🧪 Testing Strategy

### **Backend Testing Requirements**
```typescript
// Zero-tolerance quality gates for backend systems
Unit Tests: 95%+ coverage for performance calculations, CDR processing, and API endpoints
Integration Tests: 3CX CDR processing, goal tracking, quality scoring, MCP servers
API Tests: All endpoint functionality, error handling, and security validation
Performance Tests: High-volume CDR processing (1000+ calls/hour) and report generation
Data Integrity Tests: Performance metric accuracy and calculation validation
Security Tests: Role-based access, RLS policies, and data protection
TypeScript: 0 compilation errors in strict mode
ESLint: 0 errors, 0 warnings with @ganger/eslint-config
Load Tests: Concurrent API access and database performance under load
```

### **Backend Test Scenarios**
- **CDR Processing Accuracy**: Validate all incoming 3CX data is processed correctly
- **Performance Calculation Precision**: Test all KPI calculations with known data sets
- **Goal Tracking Logic**: Verify goal achievement calculations and progress tracking
- **API Security**: Test role-based access controls and data protection
- **Data Consistency**: Ensure calculated metrics match source CDR data
- **Real-time Processing**: Test webhook processing speed and reliability
- **Error Handling**: Validate graceful handling of malformed data and system failures

---

## 🚀 Deployment & Operations

### **Backend Deployment Strategy**
```yaml
Environment: Cloudflare Workers with analytics optimization
API Routes: Next.js API routes optimized for performance
Background Jobs: Supabase Edge Functions for scheduled processing
Database: Supabase with optimized indexing for large call datasets
Monitoring: Advanced performance and accuracy monitoring
Logging: Comprehensive audit trail for all data processing
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited from platform)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Call center backend specific variables
THREECX_CDR_WEBHOOK_SECRET=your-cdr-webhook-secret
THREECX_RECORDING_BASE_URL=https://recordings.3cx.gangerdermatology.com
THREECX_API_URL=https://3cx.gangerdermatology.com/api
THREECX_API_KEY=your-3cx-api-key
CALL_CENTER_MANAGER_EMAIL=callcenter@gangerdermatology.com
PERFORMANCE_REPORT_SCHEDULE=daily_8am
COACHING_REMINDER_ENABLED=true
GOAL_ACHIEVEMENT_NOTIFICATIONS=true
QA_REVIEW_QUOTA_PER_AGENT=5

# Background processing
KPI_CALCULATION_INTERVAL=900 # 15 minutes
REPORT_GENERATION_TIME=08:00 # 8 AM EST
DATA_RETENTION_DAYS=2555 # 7 years for compliance

# MCP Server Configuration (via shared @ganger/integrations)
TWILIO_ACCOUNT_SID=AC... # Communication Hub for notifications
TWILIO_AUTH_TOKEN=... # Communication Hub
CALL_RECORDING_RETENTION_DAYS=2555 # 7 years for compliance
PERFORMANCE_DATA_ENCRYPTION=true
```

### **Backend Monitoring & Alerts**
- **CDR Processing**: Monitor webhook delivery success rates and processing latency
- **API Performance**: Track response times, error rates, and throughput
- **Data Accuracy**: Automated validation of calculated metrics against source data
- **Integration Health**: Monitor 3CX connectivity and data synchronization
- **Performance Calculations**: Alert on KPI calculation failures or anomalies
- **Resource Usage**: Monitor database performance and query optimization needs

---

## 📊 Analytics & Reporting

### **Backend Analytics Focus**
- **Data Processing Performance**: CDR ingestion speed, error rates, and data quality metrics
- **API Usage Patterns**: Endpoint performance, most requested data, and caching effectiveness
- **Calculation Accuracy**: Validation of performance metrics against source data
- **Integration Reliability**: 3CX connectivity, webhook success rates, and data synchronization
- **Background Job Performance**: Report generation speed, KPI calculation efficiency

---

## 🔒 Security & Compliance

### **Backend Security Implementation**
- **Data Encryption**: All call records and performance data encrypted at rest and in transit
- **API Security**: JWT validation, rate limiting, and role-based endpoint protection
- **Webhook Security**: Secure 3CX webhook validation and payload verification
- **Audit Logging**: Comprehensive tracking of all data processing and API access
- **Data Validation**: Input validation and sanitization for all external data sources

### **Compliance Requirements**
- **HIPAA**: Patient data protection in call records and performance metrics
- **Data Retention**: 7-year retention for call recordings and performance data
- **Access Auditing**: Complete audit trail for all sensitive data access
- **Encryption Standards**: AES-256 encryption for all sensitive data storage

---

## 📈 Success Criteria

### **Backend Launch Criteria**
- [ ] 3CX CDR webhook processing 100% of incoming call data with < 5 second latency
- [ ] All API endpoints functional with < 500ms response times for standard queries
- [ ] Performance calculation engine producing accurate KPIs within 15 minutes of call completion
- [ ] Database schema deployed with all RLS policies tested and validated
- [ ] Background processing jobs running on schedule with 99%+ reliability

### **Backend Success Metrics (3 months)**
- 99.9% accuracy in CDR data processing and performance calculations
- < 500ms average API response time for performance queries
- 100% uptime for critical data processing pipelines
- < 10 second latency for real-time dashboard data updates
- Zero data security incidents or HIPAA violations

---

## 🔄 Maintenance & Evolution

### **Backend Maintenance Requirements**
- **Data Validation**: Daily verification of calculated metrics against source data
- **Performance Optimization**: Monthly review of query performance and index optimization
- **Integration Monitoring**: Continuous monitoring of 3CX connectivity and data synchronization
- **Security Updates**: Regular security patches and vulnerability assessments

### **Future Backend Enhancements**
- **Advanced Analytics**: Machine learning models for performance prediction and coaching recommendations
- **Real-time Streaming**: Enhanced real-time data processing for instant dashboard updates
- **API Optimization**: GraphQL implementation for more efficient data fetching
- **Scalability Improvements**: Database partitioning and caching enhancements for larger call volumes

---

## 📚 Backend Documentation Requirements

### **Developer Documentation**
- [ ] 3CX CDR webhook integration setup and data mapping guide
- [ ] Performance calculation algorithms and KPI definition documentation
- [ ] API endpoint documentation with authentication and rate limiting details
- [ ] Database schema documentation with relationship diagrams
- [ ] Background job configuration and monitoring setup guide

### **Operational Documentation**
- [ ] System monitoring and alerting configuration
- [ ] Data backup and recovery procedures
- [ ] Performance troubleshooting and optimization guide
- [ ] Security incident response procedures

---

*This backend infrastructure provides the robust data foundation required for comprehensive call center performance management, ensuring accurate real-time analytics and reliable reporting capabilities.*