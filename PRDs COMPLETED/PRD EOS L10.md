# EOS Management Platform - Ganger Platform Standard
*Complete Entrepreneurial Operating System implementation with mobile-first design*

## 📋 Document Information
- **Application Name**: EOS Management Platform
- **Priority**: High
- **Development Timeline**: 8-10 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/utils
- **Integration Requirements**: Google Calendar, Email notifications, PDF generation

---

## 🎯 Product Overview

### **Purpose Statement**
Replace ninety.io with a self-hosted, mobile-first EOS management platform enabling distributed teams to implement the complete Entrepreneurial Operating System methodology with multi-team support and role-based access control.

### **Target Users**
- **Primary**: Leadership Team Members (CEO, COO, Department Heads) with full platform access
- **Secondary**: Team Leads (Department managers, supervisors) with team-specific access
- **Tertiary**: Team Members (Individual contributors) with limited access to assigned items

### **Success Metrics**
- Complete feature parity with ninety.io within 8 weeks
- 90%+ mobile usage for daily EOS activities
- 100% data independence from third-party vendors
- 50% reduction in meeting preparation time

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
import { Button, Card, DataTable, FormField, LoadingSpinner } from '@ganger/ui';
import { useAuth, withAuth, requireRole } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { analytics, notifications, fileUpload } from '@ganger/utils';
```

### **App-Specific Technology**
- **Mobile PWA**: Service worker for offline capabilities
- **Real-time Collaboration**: WebSocket connections for live meeting participation
- **PDF Generation**: Puppeteer for V/TO and report generation
- **Calendar Integration**: Google Calendar API for meeting scheduling
- **Email Templates**: Transactional email system for notifications

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'team_lead' | 'team_member';

interface EOSPermissions {
  read: UserRole[];
  write: UserRole[];
  admin: UserRole[];
  crossTeamAccess: UserRole[];
}

// Team-specific data isolation
interface TeamAccess {
  teamId: string;
  role: 'lead' | 'member';
  permissions: string[];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-Team Support**: Users can belong to multiple teams with different roles
- **Leadership Override**: Leadership team has read access to all teams
- **Session Management**: 24-hour JWT tokens with automatic refresh

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, providers,
notifications, notification_preferences,
file_uploads, document_storage
```

### **App-Specific Tables**
```sql
-- EOS Teams and organizational structure
CREATE TABLE eos_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  team_type TEXT NOT NULL, -- 'leadership', 'operational'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team membership with roles
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'lead', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(team_id, user_id)
);

-- Vision/Traction Organizer components
CREATE TABLE vto_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL, -- 'core_values', 'vision', 'swot', 'target'
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quarterly Rocks
CREATE TABLE rocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  quarter_year TEXT NOT NULL, -- '2024-Q1'
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  status TEXT DEFAULT 'not_started', -- 'not_started', 'on_track', 'at_risk', 'completed'
  due_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scorecard measurables
CREATE TABLE measurables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  measurement_type TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  target_value DECIMAL(15,2),
  unit TEXT, -- '$', '%', 'count', etc.
  is_leading_indicator BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scorecard data points
CREATE TABLE scorecard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measurable_id UUID REFERENCES measurables(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  actual_value DECIMAL(15,2) NOT NULL,
  notes TEXT,
  entered_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(measurable_id, measurement_date)
);

-- Issues tracking
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'open', -- 'open', 'discussed', 'solved', 'closed'
  assigned_to UUID REFERENCES users(id),
  resolution TEXT,
  due_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- To-Do items
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completion_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  priority TEXT DEFAULT 'medium',
  rock_id UUID REFERENCES rocks(id), -- Optional link to rock
  issue_id UUID REFERENCES issues(id), -- Optional link to issue
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting management
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL, -- 'level_10', 'quarterly', 'annual', 'ad_hoc'
  title TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  agenda JSONB, -- Structured agenda
  meeting_notes TEXT,
  google_calendar_event_id TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting attendance
CREATE TABLE meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attendance_status TEXT DEFAULT 'invited', -- 'invited', 'attending', 'absent', 'late'
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);

-- People management (GWC assessments)
CREATE TABLE people_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL, -- 'gwc', 'core_values', 'quarterly_review'
  assessment_date DATE NOT NULL,
  scores JSONB NOT NULL, -- Structured assessment scores
  notes TEXT,
  assessed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Process documentation
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
  process_name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- Array of process steps
  owner_id UUID REFERENCES users(id),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  last_reviewed_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard RLS policies
CREATE POLICY "Team members can access their team data" ON eos_teams
  FOR ALL USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );
```

### **Data Relationships**
- **Hierarchical**: Teams → Members → Roles → Permissions
- **Cross-Reference**: Rocks ↔ Issues ↔ To-dos ↔ Meetings
- **Temporal**: Quarterly cycles, weekly scorecards, meeting schedules
- **Multi-tenancy**: Team-level data isolation with leadership override

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
// CRUD operations follow standard patterns
GET    /api/teams                    // List user's teams
GET    /api/teams/[id]/rocks         // Team rocks for current quarter
GET    /api/teams/[id]/scorecard     // Team scorecard data
POST   /api/meetings                 // Create/schedule meeting
PUT    /api/rocks/[id]/progress      // Update rock progress

// Real-time subscriptions
WS     /api/teams/[id]/subscribe     // Live team updates
WS     /api/meetings/[id]/live       // Live meeting participation
```

### **App-Specific Endpoints**
```typescript
// EOS-specific functionality
POST   /api/eos/rocks/quarterly-setup     // Setup quarterly rocks
GET    /api/eos/scorecard/trends          // Scorecard trend analysis
POST   /api/eos/meetings/level-10         // Level 10 meeting workflow
GET    /api/eos/vto/export               // Export V/TO as PDF
POST   /api/eos/people/gwc-assessment    // GWC assessment tools
GET    /api/eos/analytics/team-health    // Team health metrics
```

### **External Integrations**
- **Google Calendar**: Meeting scheduling and sync
- **Email Notifications**: Meeting reminders, rock deadlines, issue alerts
- **PDF Generation**: V/TO documents, reports, meeting agendas
- **File Storage**: Process documents, meeting attachments

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // EOS brand alignment
  secondary: 'green-600',   // Success/completion
  accent: 'purple-600',     // Meetings/collaboration
  neutral: 'slate-600',     // Standard interface
  warning: 'amber-600',     // At-risk rocks/issues
  danger: 'red-600'         // Urgent items
}

// EOS-specific color coding
eosColors: {
  rocks: 'emerald-600',     // Quarterly rocks
  issues: 'red-500',        // Open issues
  todos: 'blue-500',        // Action items
  scorecard: 'indigo-600'   // Metrics
}
```

### **Component Usage**
```typescript
// Use shared components with EOS customization
import {
  AppLayout, PageHeader, Sidebar, NavigationTabs,
  DataTable, FormBuilder, Button, Card, Progress,
  CalendarView, MeetingRoom, ScoreboardDisplay,
  RockTracker, IssuePanel, TodoList
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Mobile-First Design**: Touch-optimized for iPad/iPhone usage
- **Offline Capability**: Core features work without internet
- **Real-time Updates**: Live collaboration during meetings
- **Gesture Support**: Swipe actions for quick updates
- **Progressive Disclosure**: Layered information architecture

---

## 📱 User Experience

### **User Workflows**
1. **Daily Check-in**: Quick scorecard update, todo review (2 minutes)
2. **Weekly L10 Meeting**: Structured 90-minute team meeting
3. **Quarterly Planning**: Rock setting and V/TO review session
4. **Issue Resolution**: IDS (Identify, Discuss, Solve) methodology
5. **People Management**: GWC assessments and 1-on-1 tracking

### **Performance Requirements**
- **Page Load**: < 2 seconds on mobile networks
- **Offline Mode**: 48-hour local data cache
- **Real-time Updates**: < 200ms meeting collaboration
- **Meeting Sync**: Seamless transition between devices

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Voice Input**: Meeting note dictation
- **Screen Reader**: Complete navigation support
- **Keyboard Navigation**: Desktop power-user features

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// EOS-specific test coverage
Unit Tests: 90%+ coverage for business logic
Integration Tests: All team workflows
E2E Tests: Complete L10 meeting cycle
Mobile Tests: iOS Safari, Android Chrome
Offline Tests: PWA functionality
Load Tests: Multi-team concurrent usage
```

### **Test Scenarios**
- **Multi-team Access**: User switching between teams
- **Meeting Collaboration**: Real-time participation
- **Data Integrity**: Rock completion tracking
- **Permission Boundaries**: Team data isolation
- **Mobile Performance**: Touch interactions, offline sync

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export with PWA optimization
CDN: Cloudflare global edge network
Database: Supabase with automated backups
Monitoring: Real-time performance and usage analytics
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# EOS-specific variables
GOOGLE_CALENDAR_API_KEY=your_calendar_api_key
EMAIL_SMTP_HOST=smtp.gangerdermatology.com
PDF_GENERATION_SERVICE=cloudflare_workers
```

### **Migration Strategy**
- **Data Export**: Automated ninety.io data extraction
- **Validation**: Comprehensive data integrity checks
- **Parallel Running**: 30-day overlap period
- **User Training**: Progressive rollout by team

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Daily/weekly active users by team
- **Feature Usage**: Rock completion rates, meeting attendance
- **Mobile Usage**: Device type, offline usage patterns
- **Performance**: Load times, error rates by feature

### **App-Specific Analytics**
- **EOS Health Score**: Team implementation maturity
- **Rock Completion Trends**: Quarterly success patterns
- **Meeting Effectiveness**: Attendance, duration, outcomes
- **Scorecard Performance**: Metric achievement rates
- **Issue Resolution**: Time to resolution, recurrence patterns

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: All EOS data encrypted at rest and in transit
- **Team Isolation**: Strict RLS policies prevent cross-team data access
- **Audit Logging**: Complete trail of all EOS activities
- **Session Security**: Automatic timeout, secure token handling

### **Business Continuity**
- **Self-Hosted**: Complete independence from vendor dependencies
- **Backup Strategy**: Daily automated backups with point-in-time recovery
- **Disaster Recovery**: 4-hour RTO, 1-hour RPO targets
- **Data Portability**: Full data export capabilities

### **App-Specific Security**
- **Team Data Isolation**: Bulletproof separation between teams
- **Meeting Security**: Encrypted real-time collaboration
- **Mobile Security**: Biometric authentication, device encryption
- **Access Logging**: Detailed audit trail for compliance

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] Complete ninety.io feature parity
- [ ] All teams migrated successfully
- [ ] Mobile usage > 60% within first month
- [ ] Meeting efficiency improved by 25%
- [ ] Zero data loss during migration

### **Success Metrics (6 months)**
- 90%+ user adoption across all teams
- 50% reduction in meeting preparation time
- 95% scorecard completion rate
- 80% quarterly rock completion rate
- 98% uptime with < 2 second load times

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **EOS Methodology Updates**: Quarterly review of best practices
- **Feature Enhancements**: User feedback integration
- **Performance Optimization**: Mobile experience improvements
- **Security Updates**: Regular penetration testing

### **Future Enhancements**
- **AI-Powered Insights**: Pattern recognition in team performance
- **Advanced Analytics**: Predictive rock completion modeling
- **Enhanced Collaboration**: Video meeting integration
- **API Ecosystem**: Third-party EOS tool integrations

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] EOS workflow API documentation
- [ ] Team data model relationships
- [ ] Mobile PWA implementation guide
- [ ] Real-time collaboration architecture

### **User Documentation**
- [ ] EOS methodology implementation guide
- [ ] Mobile app usage tutorials
- [ ] Team setup and management
- [ ] Meeting facilitation best practices

---

*This EOS Management Platform provides complete data independence while delivering a superior mobile-first experience that transforms how teams implement the Entrepreneurial Operating System methodology.*