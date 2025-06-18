# PRD: Provider Revenue & Performance Dashboard
*Ganger Platform Standard Application*

**📚 REQUIRED READING:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development. This is the single source of truth for all platform development patterns, standards, and quality requirements.

## 📋 Document Information
- **Application Name**: Provider Revenue & Performance Dashboard
- **PRD ID**: PRD-PROVIDER-DASHBOARD-001
- **Priority**: High
- **Development Timeline**: 6-8 weeks
- **Last Updated**: June 17, 2025
- **Terminal Assignment**: MIXED (Frontend + Backend)
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/auth/server, @ganger/db, @ganger/integrations/client, @ganger/integrations/server, @ganger/ai, @ganger/utils/client, @ganger/utils/server
- **MCP Integration Requirements**: Zenefits API v2.0, ModMed FHIR R4, Google Sheets MCP, AWS Bedrock (Claude 3.5 Sonnet), Time MCP, Database MCP
- **Integration Requirements**: Zenefits API v2.0, ModMed FHIR R4, Google Sheets MCP, AWS Bedrock (Claude 3.5 Sonnet), Time MCP, Database MCP
- **Compliance Requirements**: HIPAA, SOC 2 Type II, PCI DSS (for financial data), IRS Publication 15 (payroll compliance)

---

## 🎯 Product Overview

### **Purpose Statement**
Transform monthly provider reporting from a manual Excel-based process to an intelligent, real-time analytics platform that processes operational data, calculates production-based compensation, and provides AI-powered optimization insights for practice growth.

### **Target Users**
- **Primary**: Practice Managers requiring comprehensive provider analytics
- **Secondary**: Individual Providers viewing their own performance metrics
- **Tertiary**: Executive Leadership monitoring practice-wide performance

### **Success Metrics**

**Operational Excellence (Measured Monthly):**
- **Report Generation Time**: 90% reduction from 8 hours to < 45 minutes for monthly provider reports
- **Calculation Accuracy**: < 0.1% variance in compensation calculations vs Zenefits payroll data
- **Data Processing Speed**: < 10 minutes to process 1,000+ patient encounters per provider
- **System Availability**: 99.9% uptime during business hours (8 AM - 8 PM EST)

**Business Impact (Measured Quarterly):**
- **Revenue Optimization**: $150,000+ annual revenue increase through AI-driven insights implementation
- **Cost Savings**: $75,000+ annual savings from eliminated manual reporting processes
- **Process Automation**: 100% elimination of Excel-based financial reporting workflows
- **Decision Speed**: 80% faster executive decision-making through real-time dashboards

**Technical Performance (Real-time Monitoring):**
- **Dashboard Load Time**: < 3 seconds for complete provider analytics on 3G connection
- **Real-time Sync**: < 30 seconds for Zenefits compensation data synchronization
- **AI Insight Generation**: < 5 seconds for comprehensive performance analysis
- **Data Integrity**: 99.95% accuracy in PHI sanitization and financial data processing

---

## 🏗️ Technical Architecture

### **MANDATORY: Cloudflare Workers Architecture**
```yaml
# ✅ REQUIRED: Workers-only deployment (Pages is sunset)
Framework: Next.js 14+ with Workers runtime (runtime: 'edge')
Deployment: Cloudflare Workers (NO Pages deployment)
Build Process: @cloudflare/next-on-pages
Configuration: Workers-compatible next.config.js (NO static export)

# ❌ FORBIDDEN: These patterns cause 405 errors
Static_Export: Never use output: 'export'
Cloudflare_Pages: Sunset for Workers routes
Custom_Routing: Must use Workers request handling
```

### **⚠️ CRITICAL: Anti-Pattern Prevention**
```typescript
// ❌ NEVER USE: Static export configuration (causes 405 errors)
const nextConfig = {
  output: 'export',        // DELETE THIS - breaks Workers
  trailingSlash: true,     // DELETE THIS - static pattern
  distDir: 'dist'          // DELETE THIS - Workers incompatible
}

// ✅ REQUIRED: Workers-compatible configuration
const nextConfig = {
  experimental: {
    runtime: 'edge',         // MANDATORY for Workers
  },
  images: {
    unoptimized: true,       // Required for Workers
  },
  basePath: '/provider-dashboard', // Required for staff portal routing
}
```

### **Architecture Verification Requirements**
```bash
# ✅ MANDATORY: Every app must pass these checks
pnpm type-check              # 0 errors required
pnpm build                   # Successful completion required
curl -I [app-url]/health     # HTTP 200 required (not 405)
grep -r "StaffPortalLayout"  # Must find implementation
grep -r "output.*export"     # Must find nothing
```

### **Shared Infrastructure with Pages Sunset Note**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions (Workers runtime)
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers EXCLUSIVELY (Pages sunset for Workers routes)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
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
  Button, Card, DataTable, FormField, LoadingSpinner, ChartContainer,
  AppLayout, PageHeader, ConfirmDialog, ErrorBoundary, ExportControls,
  ExecutiveSummary, ProviderGrid, RevenueChart, CompensationPanel
} from '@ganger/ui';
import { useAuth, withAuth, requireRole } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { 
  ZenefitsClient, 
  ModMedClient, 
  GoogleSheetsHub, // Google Sheets MCP integration
  DatabaseHub // Supabase MCP integration
} from '@ganger/integrations';
import { 
  AIInsightEngine, 
  RevenueOptimizer, 
  PerformanceAnalyzer,
  FinancialAnalyticsService
} from '@ganger/ai';
import { analytics, notifications, dataProcessor, encryption, logger } from '@ganger/utils';
```

### **App-Specific Technology**
- **Data Processing Pipeline**: Automated monthly data import with PHI sanitization via @ganger/utils
- **AI Analytics Engine**: AWS Bedrock (Claude 3.5 Sonnet) for performance insights and revenue optimization
- **Real-time Compensation**: Live Zenefits integration for accurate compensation tracking
- **Advanced Visualizations**: Chart.js integration via @ganger/ui for financial analytics
- **Export Engine**: Automated PDF generation and Google Sheets MCP integration

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'provider' | 'billing_admin';

interface ProviderDashboardPermissions {
  viewAllProviders: ['manager', 'superadmin', 'billing_admin'];
  viewOwnData: ['provider', 'manager', 'superadmin', 'billing_admin'];
  editCompensation: ['manager', 'superadmin', 'billing_admin'];
  configureReports: ['manager', 'superadmin'];
  viewAIInsights: ['manager', 'superadmin', 'billing_admin'];
  exportData: ['manager', 'superadmin'];
  viewFinancialData: ['manager', 'superadmin', 'billing_admin'];
  manageProviderConfigs: ['manager', 'superadmin'];
}

// Provider-specific access control with location restrictions
interface ProviderAccess {
  providerId: string;
  canViewCompensation: boolean;
  canViewPatientMetrics: boolean;
  locationAccess: ('Ann Arbor' | 'Wixom' | 'Plymouth')[];
  dataAccessLevel: 'own' | 'location' | 'all';
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Manager-Level Access**: Full provider data and compensation visibility
- **Provider Self-Service**: Providers can view their own performance metrics
- **Location-Based Access**: Data filtering based on provider assignments

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
providers, provider_schedules,
notifications, notification_preferences,
file_uploads, document_storage
```

### **App-Specific Tables**
```sql
-- Provider configuration and compensation settings
CREATE TABLE provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) UNIQUE,
  zenefits_employee_id TEXT UNIQUE,
  employment_status TEXT DEFAULT 'active', -- active, inactive, terminated
  primary_location_id UUID REFERENCES locations(id),
  
  -- Compensation configuration
  medical_revenue_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  injectable_revenue_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  midlevel_oversight_percentage DECIMAL(5,2) DEFAULT 0.00,
  base_salary DECIMAL(10,2) DEFAULT 0.00,
  
  -- Performance settings
  target_revenue_per_day DECIMAL(8,2),
  target_patients_per_day INTEGER,
  quality_bonus_eligible BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  supervised_by UUID REFERENCES providers(id), -- For mid-level providers
  supervises_midlevels BOOLEAN DEFAULT FALSE,
  
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly data imports and processing
CREATE TABLE data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_month DATE NOT NULL, -- First day of the month being imported
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  
  -- Processing stats
  raw_records_count INTEGER,
  processed_records_count INTEGER,
  excluded_records_count INTEGER,
  error_records_count INTEGER,
  
  -- Data quality metrics
  data_quality_score DECIMAL(5,2), -- 0.00-100.00
  anomalies_detected INTEGER DEFAULT 0,
  validation_errors JSONB,
  
  -- Processing metadata
  sanitization_log JSONB, -- PHI removal audit trail
  processing_duration_seconds INTEGER,
  imported_by UUID REFERENCES users(id),
  
  -- Status tracking
  status TEXT DEFAULT 'processing', -- processing, completed, failed, requires_review
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly provider performance data
CREATE TABLE provider_monthly_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  data_import_id UUID REFERENCES data_imports(id) ON DELETE CASCADE,
  reporting_month DATE NOT NULL,
  
  -- Work metrics
  days_worked INTEGER NOT NULL DEFAULT 0,
  total_patients_seen INTEGER NOT NULL DEFAULT 0,
  total_encounters INTEGER NOT NULL DEFAULT 0,
  new_patients INTEGER DEFAULT 0,
  follow_up_patients INTEGER DEFAULT 0,
  
  -- Revenue breakdown
  medical_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  injectable_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  injectable_costs DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_injectable_revenue DECIMAL(12,2) GENERATED ALWAYS AS (injectable_revenue - injectable_costs) STORED,
  midlevel_supervised_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_gross_revenue DECIMAL(12,2) GENERATED ALWAYS AS (medical_revenue + net_injectable_revenue + midlevel_supervised_revenue) STORED,
  
  -- Compensation calculations
  calculated_medical_compensation DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  calculated_injectable_compensation DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  calculated_oversight_compensation DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_calculated_compensation DECIMAL(12,2) GENERATED ALWAYS AS (
    calculated_medical_compensation + calculated_injectable_compensation + calculated_oversight_compensation
  ) STORED,
  
  -- Zenefits integration
  zenefits_ytd_compensation DECIMAL(12,2) DEFAULT 0.00,
  compensation_variance DECIMAL(12,2) GENERATED ALWAYS AS (
    total_calculated_compensation - COALESCE(zenefits_ytd_compensation, 0)
  ) STORED,
  last_zenefits_sync TIMESTAMPTZ,
  
  -- Efficiency metrics
  revenue_per_day DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN days_worked > 0 THEN total_gross_revenue / days_worked ELSE 0 END
  ) STORED,
  patients_per_day DECIMAL(6,2) GENERATED ALWAYS AS (
    CASE WHEN days_worked > 0 THEN total_patients_seen::decimal / days_worked ELSE 0 END
  ) STORED,
  revenue_per_patient DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE WHEN total_patients_seen > 0 THEN total_gross_revenue / total_patients_seen ELSE 0 END
  ) STORED,
  
  -- AI-calculated scores
  efficiency_score DECIMAL(5,2) DEFAULT 0.00, -- 0.00-100.00
  quality_score DECIMAL(5,2) DEFAULT 0.00,
  growth_score DECIMAL(5,2) DEFAULT 0.00,
  overall_performance_score DECIMAL(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, reporting_month)
);

-- Detailed billing code distribution
CREATE TABLE billing_code_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_monthly_data_id UUID REFERENCES provider_monthly_data(id) ON DELETE CASCADE,
  billing_code TEXT NOT NULL,
  code_description TEXT,
  code_category TEXT, -- consultation, procedure, injectable, diagnostic
  
  -- Volume metrics
  encounter_count INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  average_revenue_per_code DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE WHEN encounter_count > 0 THEN total_revenue / encounter_count ELSE 0 END
  ) STORED,
  
  -- Quality metrics
  denial_count INTEGER DEFAULT 0,
  denial_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN encounter_count > 0 THEN (denial_count::decimal / encounter_count) * 100 ELSE 0 END
  ) STORED,
  appeal_count INTEGER DEFAULT 0,
  appeal_success_count INTEGER DEFAULT 0,
  
  -- Comparison metrics
  previous_month_count INTEGER DEFAULT 0,
  count_variance INTEGER GENERATED ALWAYS AS (encounter_count - previous_month_count) STORED,
  variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN previous_month_count > 0 
    THEN ((encounter_count - previous_month_count)::decimal / previous_month_count) * 100 
    ELSE 0 END
  ) STORED,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims denials and revenue recovery tracking
CREATE TABLE revenue_recovery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_monthly_data_id UUID REFERENCES provider_monthly_data(id) ON DELETE CASCADE,
  denial_category TEXT NOT NULL,
  denial_reason_code TEXT NOT NULL,
  denial_reason_description TEXT NOT NULL,
  
  -- Financial impact
  claim_count INTEGER NOT NULL DEFAULT 0,
  denied_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  recoverable_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  recovered_amount DECIMAL(10,2) DEFAULT 0.00,
  written_off_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Recovery metrics
  recovery_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN recoverable_amount > 0 
    THEN (recovered_amount / recoverable_amount) * 100 
    ELSE 0 END
  ) STORED,
  
  -- Payer information
  payer_name TEXT NOT NULL,
  payer_category TEXT, -- commercial, medicare, medicaid, self_pay
  
  -- Resolution tracking
  resolution_status TEXT DEFAULT 'pending', -- pending, resolved, appealed, written_off
  resolution_date DATE,
  days_to_resolution INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient demographics and payer mix analysis
CREATE TABLE patient_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_monthly_data_id UUID REFERENCES provider_monthly_data(id) ON DELETE CASCADE,
  
  -- Demographics (aggregated, no PHI)
  age_group TEXT NOT NULL, -- 0-17, 18-30, 31-45, 46-65, 65+
  gender TEXT NOT NULL, -- M, F, Other, Unspecified
  patient_count INTEGER NOT NULL DEFAULT 0,
  percentage_of_total DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  average_revenue_per_patient DECIMAL(8,2) DEFAULT 0.00,
  
  -- Payer mix
  payer_name TEXT NOT NULL,
  payer_category TEXT NOT NULL, -- commercial, medicare, medicaid, self_pay, other
  encounter_count INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentage_of_encounters DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  percentage_of_revenue DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  average_reimbursement DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE WHEN encounter_count > 0 THEN total_revenue / encounter_count ELSE 0 END
  ) STORED,
  
  collection_rate DECIMAL(5,2) DEFAULT 100.00,
  days_to_collection INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zenefits compensation synchronization
CREATE TABLE zenefits_compensation_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  zenefits_employee_id TEXT NOT NULL,
  
  -- Pay period information
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_frequency TEXT, -- weekly, biweekly, monthly, semimonthly
  
  -- Compensation breakdown
  compensation_type TEXT NOT NULL, -- salary, commission, bonus, overtime, other
  gross_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(10,2) DEFAULT 0.00,
  ytd_gross DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ytd_net DECIMAL(12,2) DEFAULT 0.00,
  
  -- Tax and deduction information
  federal_tax DECIMAL(10,2) DEFAULT 0.00,
  state_tax DECIMAL(10,2) DEFAULT 0.00,
  fica_tax DECIMAL(10,2) DEFAULT 0.00,
  benefits_deduction DECIMAL(10,2) DEFAULT 0.00,
  other_deductions DECIMAL(10,2) DEFAULT 0.00,
  
  -- Sync metadata
  sync_status TEXT DEFAULT 'synced', -- synced, error, manual_override
  zenefits_data JSONB, -- Raw Zenefits response
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_errors JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, pay_period_start, compensation_type)
);

-- AI-generated insights and recommendations
CREATE TABLE ai_performance_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  reporting_month DATE NOT NULL,
  
  -- Insight classification
  insight_type TEXT NOT NULL, -- opportunity, efficiency, quality, risk, trend
  insight_category TEXT NOT NULL, -- revenue, coding, scheduling, patient_care, billing
  priority_level TEXT NOT NULL, -- high, medium, low
  
  -- Insight content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detailed_analysis TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  
  -- Impact assessment
  potential_revenue_impact DECIMAL(10,2), -- Monthly potential
  confidence_score DECIMAL(3,2) NOT NULL, -- 0.00-1.00
  implementation_difficulty TEXT, -- easy, moderate, difficult
  estimated_implementation_time_days INTEGER,
  
  -- Supporting data
  supporting_metrics JSONB NOT NULL,
  benchmark_comparison JSONB,
  trend_analysis JSONB,
  
  -- Status tracking
  status TEXT DEFAULT 'new', -- new, reviewed, in_progress, implemented, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  implementation_notes TEXT,
  actual_impact DECIMAL(10,2), -- Measured impact after implementation
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report generation and distribution
CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL, -- monthly_provider, executive_summary, custom_analytics
  reporting_period DATE NOT NULL,
  
  -- Report scope
  provider_id UUID REFERENCES providers(id), -- NULL for practice-wide reports
  location_filter TEXT[], -- Empty array for all locations
  
  -- Report content
  report_title TEXT NOT NULL,
  report_parameters JSONB NOT NULL,
  generated_data JSONB, -- Report data for recreating
  
  -- File management
  pdf_file_path TEXT,
  excel_file_path TEXT,
  google_sheet_id TEXT,
  google_sheet_url TEXT,
  file_size_bytes BIGINT,
  
  -- Generation metadata
  generated_by UUID REFERENCES users(id) NOT NULL,
  generation_time_seconds INTEGER,
  template_version TEXT,
  
  -- Distribution tracking
  email_sent_to TEXT[],
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  shared_with TEXT[],
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-deletion for sensitive reports
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data exclusion rules and test patient filtering
CREATE TABLE data_exclusion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_type TEXT NOT NULL, -- patient_exclusion, revenue_exclusion, encounter_exclusion
  
  -- Rule definition
  field_name TEXT NOT NULL, -- Which field to check
  operator TEXT NOT NULL, -- equals, contains, starts_with, ends_with, regex, less_than, greater_than
  match_value TEXT NOT NULL, -- Value to match against
  case_sensitive BOOLEAN DEFAULT FALSE,
  
  -- Rule scope
  applies_to_locations TEXT[], -- Empty for all locations
  applies_to_providers UUID[], -- Empty for all providers
  
  -- Rule status
  is_active BOOLEAN DEFAULT TRUE,
  priority_order INTEGER DEFAULT 0, -- Lower numbers processed first
  
  -- Audit information
  created_by UUID REFERENCES users(id) NOT NULL,
  last_modified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System configuration and settings
CREATE TABLE dashboard_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_section TEXT NOT NULL, -- compensation, reporting, analytics, integrations
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  config_description TEXT,
  
  -- Configuration metadata
  data_type TEXT NOT NULL, -- string, number, boolean, array, object
  is_sensitive BOOLEAN DEFAULT FALSE, -- For encryption of sensitive values
  requires_restart BOOLEAN DEFAULT FALSE,
  
  -- Change tracking
  previous_value JSONB,
  last_updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(config_section, config_key)
);

-- Create comprehensive indexes
CREATE INDEX idx_provider_configs_provider ON provider_configs(provider_id);
CREATE INDEX idx_provider_configs_zenefits ON provider_configs(zenefits_employee_id);
CREATE INDEX idx_data_imports_month ON data_imports(import_month);
CREATE INDEX idx_data_imports_status ON data_imports(status);
CREATE INDEX idx_provider_monthly_provider ON provider_monthly_data(provider_id);
CREATE INDEX idx_provider_monthly_month ON provider_monthly_data(reporting_month);
CREATE INDEX idx_provider_monthly_revenue ON provider_monthly_data(total_gross_revenue);
CREATE INDEX idx_billing_analytics_provider ON billing_code_analytics(provider_monthly_data_id);
CREATE INDEX idx_billing_analytics_code ON billing_code_analytics(billing_code);
CREATE INDEX idx_revenue_recovery_provider ON revenue_recovery_tracking(provider_monthly_data_id);
CREATE INDEX idx_revenue_recovery_payer ON revenue_recovery_tracking(payer_name);
CREATE INDEX idx_patient_analytics_provider ON patient_analytics(provider_monthly_data_id);
CREATE INDEX idx_patient_analytics_payer ON patient_analytics(payer_category);
CREATE INDEX idx_zenefits_sync_provider ON zenefits_compensation_sync(provider_id);
CREATE INDEX idx_zenefits_sync_period ON zenefits_compensation_sync(pay_period_start, pay_period_end);
CREATE INDEX idx_ai_insights_provider ON ai_performance_insights(provider_id);
CREATE INDEX idx_ai_insights_type ON ai_performance_insights(insight_type, priority_level);
CREATE INDEX idx_generated_reports_provider ON generated_reports(provider_id);
CREATE INDEX idx_generated_reports_period ON generated_reports(reporting_period);
CREATE INDEX idx_exclusion_rules_active ON data_exclusion_rules(is_active, priority_order);

-- Row Level Security
ALTER TABLE provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_code_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_recovery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE zenefits_compensation_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exclusion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configuration ENABLE ROW LEVEL SECURITY;

-- Comprehensive RLS policies aligned with established patterns
CREATE POLICY "Users can access provider data based on role and ownership" ON provider_monthly_data
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'billing_admin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'provider' -- Providers can view own data
      AND provider_id IN (
        SELECT id FROM providers 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Managers can manage provider data" ON provider_monthly_data
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'billing_admin')
  );

-- Compensation data requires elevated privileges
CREATE POLICY "Authorized roles can access compensation data" ON zenefits_compensation_sync
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'billing_admin')
  );

CREATE POLICY "Managers can manage compensation data" ON zenefits_compensation_sync
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

-- AI insights with privacy protection
CREATE POLICY "Users can access AI insights based on data access" ON ai_performance_insights
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'billing_admin') -- Full access
    OR (
      auth.jwt() ->> 'role' = 'provider' -- Providers can view own insights
      AND provider_id IN (
        SELECT id FROM providers 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Financial data protection
CREATE POLICY "Billing configuration access" ON dashboard_configuration
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin', 'billing_admin')
    OR (
      config_section NOT IN ('compensation', 'financial') -- Non-sensitive configs
      AND auth.jwt() ->> 'role' IN ('provider', 'staff')
    )
  );
```

### **Data Relationships**
- **Provider-Centric**: Provider → Monthly Data → Analytics → Insights
- **Temporal**: Monthly cycles with year-over-year comparisons
- **Financial**: Revenue → Compensation → Variance Analysis
- **Integration**: Zenefits ↔ ModMed ↔ Dashboard Analytics

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
// CRUD operations follow standard patterns
GET    /api/providers                    // List providers with access control
GET    /api/providers/[id]/performance   // Provider performance data
GET    /api/compensation/[providerId]    // Compensation calculations
PUT    /api/compensation/[providerId]    // Update compensation settings
GET    /api/reports/[id]                 // Generated report details

// Real-time subscriptions
WS     /api/dashboard/subscribe          // Live dashboard updates
WS     /api/compensation/[providerId]/subscribe // Live compensation changes
```

### **App-Specific Endpoints**
```typescript
// Data processing and import
POST   /api/data/import                  // Monthly data file upload
GET    /api/data/import/[id]/status      // Import processing status
POST   /api/data/sanitize                // PHI sanitization process
GET    /api/data/validation/[importId]   // Data quality validation

// Analytics and insights
GET    /api/analytics/provider/[id]      // Comprehensive provider analytics
GET    /api/analytics/practice           // Practice-wide performance metrics
POST   /api/ai/insights/generate         // Generate AI performance insights
GET    /api/ai/insights/[providerId]     // Provider-specific AI insights

// Compensation management
POST   /api/compensation/calculate       // Recalculate compensation
GET    /api/compensation/variance        // Compensation variance analysis
POST   /api/zenefits/sync               // Sync compensation from Zenefits
GET    /api/zenefits/payroll/[period]   // Payroll data for period

// Report generation
POST   /api/reports/generate             // Generate custom reports
GET    /api/reports/templates            // Available report templates
POST   /api/reports/[id]/export          // Export report to various formats
GET    /api/reports/monthly/[month]      // Monthly provider reports

// Configuration and settings
GET    /api/config/compensation          // Compensation configuration
PUT    /api/config/compensation          // Update compensation settings
GET    /api/config/exclusions            // Data exclusion rules
POST   /api/config/exclusions            // Create exclusion rule
```

### **External Integrations**
- **Zenefits API**: Real-time compensation and payroll synchronization via @ganger/integrations
- **ModMed FHIR**: Provider schedule and patient volume extraction via @ganger/integrations
- **Google Sheets MCP**: Automated report export and sharing via MCP server
- **AWS Bedrock**: AI-powered performance insights and recommendations via @ganger/ai
- **Supabase MCP**: Real-time data synchronization and edge function management
- **Database Hub**: Automated backup and migration management

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System with financial dashboard colors
colors: {
  primary: 'blue-600',      // Standard interface
  secondary: 'green-600',   // Positive performance/revenue
  accent: 'purple-600',     // AI insights and recommendations
  neutral: 'slate-600',     // Text and borders
  warning: 'amber-600',     // Performance alerts
  danger: 'red-600'         // Negative variance/issues
}

// Dashboard-specific color coding
dashboardColors: {
  revenue: 'emerald-600',   // Revenue metrics
  compensation: 'blue-600', // Compensation data
  efficiency: 'indigo-600', // Performance metrics
  ai_insight: 'purple-600', // AI recommendations
  variance: 'amber-600',    // Variance indicators
  target: 'green-600'       // Target achievements
}
```

### **Component Usage**
```typescript
// Use shared components with dashboard customization
import {
  ExecutiveSummary, ProviderGrid, RevenueChart, CompensationPanel,
  PerformanceMetrics, AIInsightsCard, DataImportWizard,
  ReportGenerator, VarianceAnalysis, TrendAnalysis,
  KPIDashboard, ExportControls
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Executive Dashboard**: High-level KPIs with drill-down capabilities
- **Interactive Charts**: Complex financial visualizations with filtering
- **Real-time Updates**: Live compensation and performance tracking
- **Mobile Responsiveness**: Key metrics accessible on mobile devices
- **Export Integration**: One-click report generation and sharing

---

## 📱 User Experience

### **User Workflows**
1. **Monthly Data Import**: Upload data file → Automatic processing → Quality validation → PHI sanitization (10 minutes)
2. **Performance Review**: View provider dashboard → Analyze trends → Review AI insights → Take action (15 minutes)
3. **Compensation Analysis**: Check real-time compensation → Review variance → Sync with Zenefits → Approve payments (5 minutes)
4. **Report Generation**: Select template → Configure parameters → Generate PDF → Share with stakeholders (2 minutes)
5. **AI-Driven Optimization**: Review insights → Implement recommendations → Track impact → Continuous improvement

### **Performance Requirements**
- **Dashboard Load**: < 3 seconds for complete provider dashboard on 3G
- **Data Processing**: < 10 minutes for monthly data import (1000+ records)
- **Real-time Sync**: < 30 seconds for Zenefits compensation updates via Supabase subscriptions
- **Report Generation**: < 60 seconds for complex multi-provider reports
- **Bundle Size**: < 150KB initial bundle (excluding shared packages)
- **TypeScript Compilation**: 0 errors, 0 warnings in strict mode
- **Lighthouse Score**: > 90 for Performance, Accessibility, Best Practices
- **AI Insights**: < 5 seconds for insight generation via AWS Bedrock

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Full accessibility for financial data
- **Screen Reader Support**: Financial metrics and chart descriptions
- **Keyboard Navigation**: Complete dashboard navigation
- **High Contrast**: Clear visibility for financial analysis

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// Zero-tolerance quality gates for financial application
Unit Tests: 95%+ coverage for calculation logic and financial algorithms
Integration Tests: Zenefits API, ModMed FHIR, Google Sheets MCP, AWS Bedrock
E2E Tests: Complete data import to report generation workflow with Playwright
Performance Tests: Large dataset processing (10,000+ records)
Security Tests: PHI sanitization, compensation data protection, RLS validation
Accuracy Tests: Financial calculation validation against known datasets
TypeScript: 0 compilation errors in strict mode with financial precision
ESLint: 0 errors, 0 warnings with @ganger/eslint-config
Bundle Analysis: Size budgets enforced for all financial dashboard chunks
Accessibility Tests: WCAG 2.1 AA compliance for financial interfaces
```

### **Test Scenarios**
- **Calculation Accuracy**: Validate all compensation calculations with sample data
- **Data Quality**: Test PHI sanitization and exclusion rule processing
- **Integration Resilience**: Handle API failures and data sync issues
- **Performance Load**: Process multiple months of data simultaneously
- **Report Accuracy**: Verify generated reports against source data

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers with financial-grade security
Build: Next.js static export with advanced caching optimization
CDN: Cloudflare global edge network with financial data protection
Database: Supabase with automated backups and audit logging
AI Processing: AWS Bedrock with secure financial analysis
Monitoring: Real-time performance and financial accuracy monitoring
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited from platform)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Provider Dashboard specific variables
ZENEFITS_API_KEY=your_zenefits_api_key
ZENEFITS_COMPANY_ID=your_company_id
MODMED_PROVIDER_API_URL=https://api.modmed.com/providers
AWS_BEDROCK_FINANCIAL_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
DATA_ENCRYPTION_KEY=your_financial_encryption_key

# Data processing and compliance
PHI_SANITIZATION_ENABLED=true
FINANCIAL_DATA_ENCRYPTION=true
AUDIT_LOG_RETENTION_YEARS=7
COMPENSATION_VARIANCE_THRESHOLD=0.01

# MCP Server Configuration (via shared @ganger/integrations)
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=provider-dashboard@gangerdermatology.iam.gserviceaccount.com
FINANCIAL_REPORT_SHEET_ID=your-google-sheet-id
```

### **Financial Data Security**
- **Encryption**: AES-256 encryption for all compensation data
- **PHI Sanitization**: Automated removal of protected health information
- **Audit Logging**: Comprehensive tracking of all financial data access
- **Access Controls**: Multi-factor authentication for sensitive operations

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Dashboard usage patterns and feature adoption
- **System Performance**: Data processing speed and accuracy metrics
- **Report Usage**: Most generated reports and export formats
- **Security Monitoring**: Access patterns and compliance metrics

### **App-Specific Analytics**
- **Financial Performance**: Revenue trends and compensation accuracy
- **Provider Efficiency**: Performance benchmarking and improvement tracking
- **AI Insight Impact**: Recommendation implementation and ROI measurement
- **Data Quality**: Import success rates and processing efficiency
- **Cost Savings**: Time reduction and automation value quantification

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Financial Data Protection**: Bank-level security for compensation information
- **PHI Compliance**: HIPAA-compliant handling of patient-related metrics
- **Audit Logging**: Comprehensive tracking exceeding financial regulations
- **Access Controls**: Role-based permissions with financial data restrictions

### **Data Privacy & Protection**
- **PHI Sanitization**: Automated removal of identifiable health information
- **Compensation Security**: Encrypted storage and transmission of salary data
- **Data Minimization**: Only collect necessary operational metrics
- **Retention Policies**: Automated compliance with financial record requirements

### **App-Specific Security**
- **Calculation Integrity**: Cryptographic verification of compensation calculations
- **Export Security**: Secure transmission of financial reports
- **API Security**: Encrypted communication with financial systems
- **Backup Encryption**: Multi-layered encryption for financial data backups

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] Real-time Zenefits integration with < 1% compensation variance
- [ ] Monthly data processing completed in < 10 minutes
- [ ] AI insights generating actionable recommendations with 80%+ confidence
- [ ] All legacy Excel reporting processes eliminated
- [ ] Provider self-service dashboard fully functional

### **Success Metrics (6 months)**
- 90% reduction in time to generate monthly provider reports
- Real-time compensation tracking with 99.9% accuracy
- $150,000+ annual revenue increase from AI optimization insights
- 100% elimination of manual Excel-based reporting processes
- 95%+ user satisfaction with dashboard usability and insights

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Financial Model Updates**: Monthly calibration of compensation algorithms
- **AI Model Training**: Quarterly retraining with new performance data
- **Integration Health**: Weekly verification of Zenefits and ModMed connections
- **Performance Optimization**: Monthly review of processing efficiency

### **Future Enhancements**
- **Predictive Analytics**: Forecast provider performance and revenue trends
- **Advanced AI**: Multi-dimensional analysis including patient satisfaction scores
- **Expanded Integration**: Additional EHR and practice management systems
- **Automated Coaching**: AI-driven performance improvement recommendations

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Financial calculation algorithm documentation
- [ ] Zenefits API integration implementation guide
- [ ] PHI sanitization process documentation
- [ ] AI analytics and insight generation architecture

### **User Documentation**
- [ ] Monthly data import procedure guide
- [ ] Provider performance dashboard user manual
- [ ] Report generation and customization guide
- [ ] Compensation variance investigation procedures

---

*This Provider Revenue & Performance Dashboard transforms practice management through intelligent automation, real-time analytics, and AI-powered insights while maintaining the highest standards of financial data security and accuracy.*