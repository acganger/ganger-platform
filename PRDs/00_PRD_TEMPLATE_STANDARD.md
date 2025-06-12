# PRD Template - Ganger Platform Standard
*Use this template for all new PRDs to ensure consistency, shared infrastructure, and quality enforcement*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: [App Name]
- **PRD ID**: [PRD-{APP}-001 format for tracking]
- **Priority**: [High/Medium/Low] 
- **Development Timeline**: [Estimated weeks - reference PROJECT_TRACKER.md for velocity data]
- **Terminal Assignment**: [Frontend/Backend/Mixed - see AI_WORKFLOW_GUIDE.md]
- **Dependencies**: [List required @ganger/* packages]
- **MCP Integration Requirements**: [External systems and MCP servers needed]
- **Quality Gate Requirements**: [Custom verification beyond standard gates]

---

## 🎯 Product Overview

### **Purpose Statement**
[Single sentence describing the app's primary purpose]

### **Target Users**
- **Primary**: [Main user group with role/permission level]
- **Secondary**: [Additional user groups]
- **Tertiary**: [Limited access users]

### **Success Metrics**
- [Measurable outcome 1 - must include specific numbers/percentages]
- [Measurable outcome 2 - business value measurement required]
- [Measurable outcome 3 - user adoption/satisfaction metric]

### **Business Value Measurement**
- **ROI Target**: [Expected return on investment - reference PROJECT_TRACKER.md for calculation methods]
- **Cost Savings**: [Quantified operational efficiency gains]
- **Revenue Impact**: [Direct/indirect revenue effects]
- **User Productivity**: [Time savings or efficiency improvements]

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard - MANDATORY)**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with global edge network)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { /* ALL UI components */ } from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { 
  ClientCommunicationService, 
  ClientPaymentService,
  ClientCacheService 
} from '@ganger/integrations/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { db, createClient, Repository } from '@ganger/db';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { 
  ServerCommunicationService,
  ServerPaymentService, 
  ServerPdfService,
  ServerGoogleService,
  ServerCacheService
} from '@ganger/integrations/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Patient, Appointment, Provider,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```

### **Automated Quality Enforcement**
```bash
# Pre-commit hooks automatically enforce:
✅ TypeScript compilation (0 errors tolerance)
✅ Package boundary compliance (@ganger/* only)
✅ UI component compliance (no custom buttons/inputs)
✅ Authentication compliance (no custom auth)
✅ Performance budget compliance
✅ Security compliance (HIPAA + general)
```

### **App-Specific Technology**
- [Any additional technologies unique to this app]
- [Special libraries or services required]
- [Performance considerations]

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard - Updated Hierarchy)**
```typescript
// MANDATORY role hierarchy - see MASTER_DEVELOPMENT_GUIDE.md
type UserRole = 
  | 'superadmin'        // Full system access
  | 'manager'           // Location management and staff oversight
  | 'provider'          // Clinical operations and patient care
  | 'nurse'             // Clinical support and patient assistance
  | 'medical_assistant' // Administrative and clinical assistance
  | 'pharmacy_tech'     // Medication management
  | 'billing'           // Financial operations
  | 'user';             // Basic access

// App-specific permission matrix (use PermissionService)
interface Permissions {
  read: UserRole[];
  write: UserRole[];
  admin: UserRole[];
  [customPermission]: UserRole[];
}

// ✅ REQUIRED implementation pattern
import { PermissionService } from '@ganger/auth';
const hasPermission = PermissionService.hasPermission(user, 'access_patient_records');
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-location Access**: Based on user.locations assignment
- **Vinya Technician Access**: Special cross-company access for construction team
- **Session Management**: 24-hour JWT tokens with refresh

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
-- Define tables unique to this application
CREATE TABLE [app_specific_table] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  -- App-specific columns
  
  -- Standard RLS policy
  CONSTRAINT rls_policy CHECK (...)
);
```

### **Data Relationships**
- [How this app's data connects to shared entities]
- [Cross-app data sharing requirements]
- [Data migration considerations]

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated with Response Standards)**
```typescript
// CRUD operations follow standard patterns - see MASTER_DEVELOPMENT_GUIDE.md
GET    /api/[resource]              // List with pagination & filters
POST   /api/[resource]              // Create new
GET    /api/[resource]/[id]         // Get specific
PUT    /api/[resource]/[id]         // Update
DELETE /api/[resource]/[id]         // Soft delete

// Real-time subscriptions
WS     /api/[resource]/subscribe     // Live updates

// Bulk operations
POST   /api/[resource]/bulk         // Bulk create/update/delete

// ✅ REQUIRED: All responses use standard format
interface StandardResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
  requestId: string;
  meta?: {
    pagination?: PaginationMeta;
    performance?: PerformanceMeta;
  };
}
```

### **App-Specific Endpoints**
```typescript
// Define endpoints unique to this application
POST   /api/[app]/[specific-action]  // Custom business logic
GET    /api/[app]/[reports]          // Custom reports
POST   /api/[app]/[integrations]    // External system sync
```

### **External Integrations (Use Universal Hubs ONLY)**
```typescript
// ✅ REQUIRED: Use Universal Hubs - NO direct external API calls
import { 
  UniversalCommunicationHub,  // Twilio MCP (SMS/Voice)
  UniversalPaymentHub,        // Stripe MCP (Payments)
  UniversalDatabaseHub,       // Supabase MCP (Database)
  UniversalSheetsHub          // Google Sheets MCP (Data export)
} from '@ganger/integrations';

// Example usage pattern:
const commHub = new UniversalCommunicationHub();
await commHub.sendSMS({ to: patient.phone, message: 'Appointment confirmed' });
```

- **[System Name]**: [Purpose, Universal Hub used, data flow]
- **Error Handling**: Built into Universal Hubs with monitoring
- **Rate Limiting**: Automated through Hub architecture
- **Authentication**: Centralized credential management via Hubs

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // Medical professional
  secondary: 'green-600',   // Success/health
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Alerts
  danger: 'red-600'         // Errors/critical
}

typography: {
  sans: ['Inter', 'system-ui'],
  mono: ['JetBrains Mono']
}

spacing: '4px grid system'
borderRadius: 'rounded-lg (8px) standard'
shadows: 'subtle depth with medical-grade clean aesthetics'
```

### **Component Usage**
```typescript
// Use shared components wherever possible
import {
  // Layout
  AppLayout, PageHeader, Sidebar, NavigationTabs,
  
  // Forms
  FormBuilder, FormField, ValidationSummary,
  Button, Input, Select, DatePicker, FileUpload,
  
  // Data Display
  DataTable, PaginationControls, FilterPanel,
  StatCard, ChartContainer, ProgressIndicator,
  
  // Feedback
  LoadingSpinner, ErrorBoundary, SuccessToast,
  ConfirmDialog, EmptyState
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- [Unique layouts or interaction patterns]
- [Special mobile considerations]
- [Accessibility requirements beyond standard]
- [Custom visualizations or charts]

---

## 📱 User Experience

### **User Workflows**
1. **Primary Workflow**: [Step-by-step user journey]
2. **Secondary Workflows**: [Alternative paths]
3. **Error Recovery**: [How users recover from mistakes]
4. **Mobile Experience**: [Touch-first interactions]

### **Performance Requirements (Enforced by Performance Budgets)**
```typescript
// MANDATORY performance budgets - automatically enforced
const PERFORMANCE_BUDGETS = {
  // First Contentful Paint
  fcp: 1200, // 1.2s max (adjust based on app criticality)
  
  // Largest Contentful Paint  
  lcp: 2000, // 2.0s max
  
  // Cumulative Layout Shift
  cls: 0.1,  // Max 0.1 CLS score
  
  // Time to Interactive
  tti: 3000, // 3.0s max
};

// Bundle size budgets (automatically enforced)
javascript: 250000, // 250KB max
css: 30000,         // 30KB max  
```
- **Real-time Updates**: < 500ms latency
- **Offline Capability**: [If applicable - use service worker patterns]

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all interfaces
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Color Contrast**: 4.5:1 minimum ratio

---

## 🧪 Testing Strategy

### **Automated Testing (Enforced by Quality Gates)**
```typescript
// MANDATORY test patterns - automatically verified
Unit Tests: 80%+ coverage for business logic
Integration Tests: All API endpoints with standard responses
E2E Tests: Critical user workflows with real data
Performance Tests: Page load and interaction benchmarks (budget enforcement)
Accessibility Tests: Automated WCAG validation
TypeScript Tests: 100% compilation success required
Component Tests: All @ganger/ui component usage validated
Auth Tests: Permission system verification
```

### **Quality Gate Integration**
```bash
# Pre-commit verification (automatically runs):
✅ npm run test              # All tests must pass
✅ npm run type-check        # 0 TypeScript errors
✅ npm run test:performance  # Performance budget compliance
✅ npm run test:a11y         # Accessibility compliance
✅ npm run audit:ui-compliance    # UI component usage verification
✅ npm run audit:auth-compliance  # Authentication pattern verification
```

### **Test Scenarios**
- [Critical user workflows to test]
- [Edge cases and error conditions]
- [Integration failure scenarios]
- [Performance under load]

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

# App-specific variables
[APP_NAME]_SPECIFIC_CONFIG=value
```

### **Monitoring & Alerts**
- **Health Checks**: Automated endpoint monitoring
- **Error Tracking**: Real-time error reporting
- **Performance Monitoring**: Response time and throughput
- **Security Monitoring**: Authentication and access logs

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Page views, session duration, feature usage
- **Performance Metrics**: Load times, error rates, uptime
- **Security Metrics**: Authentication attempts, permission violations
- **Business Metrics**: User adoption, feature effectiveness

### **App-Specific Analytics**
- [Custom metrics relevant to this application]
- [Business intelligence requirements]
- [Reporting schedules and recipients]

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: At rest and in transit (TLS 1.3+)
- **Authentication**: Multi-factor where appropriate
- **Authorization**: Principle of least privilege
- **Audit Logging**: All user actions logged
- **Data Sanitization**: Input validation and output encoding

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: Encryption and access controls
- **Audit Requirements**: Comprehensive logging
- **Data Minimization**: Only collect necessary data
- **User Training**: Security awareness requirements

### **App-Specific Security**
- [Additional security requirements]
- [Data retention policies]
- [Third-party security considerations]

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All critical user workflows functional
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Accessibility compliance verified
- [ ] Integration testing completed

### **Success Metrics (6 months)**
- [Quantifiable adoption targets]
- [Performance improvement goals]
- [User satisfaction scores]
- [Business impact measurements]

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Dependency Updates**: Monthly security patches
- **Performance Optimization**: Quarterly reviews
- **User Feedback Integration**: Continuous improvement
- **Compliance Reviews**: Annual security audits

### **Future Enhancements**
- [Planned feature additions]
- [Integration opportunities]
- [Scalability considerations]

---

## 📚 Documentation Requirements

### **Developer Documentation (Reference /true-docs/)**
- [ ] **API documentation**: OpenAPI spec with examples (required)
- [ ] **Database schema**: Migrations and relationships documented
- [ ] **Component usage**: @ganger/ui integration examples
- [ ] **MCP integration**: Universal Hub usage patterns
- [ ] **Quality gates**: Custom verification procedures (if any)
- [ ] **Performance**: Budget configuration and monitoring setup
- [ ] **Troubleshooting**: Common issues and resolution procedures

### **User Documentation**
- [ ] **User guides**: Step-by-step workflows with screenshots
- [ ] **Training materials**: Role-based training content
- [ ] **FAQ and support**: Self-service knowledge base
- [ ] **Video tutorials**: Complex workflows (if applicable)

### **Documentation System Integration**
```markdown
# Documentation location and maintenance
- App-specific docs: apps/[app-name]/README.md
- API docs: Generated from OpenAPI spec
- User guides: Link from main app documentation
- Troubleshooting: Reference MASTER_DEVELOPMENT_GUIDE.md patterns

# Update procedures: See MASTER_DEVELOPMENT_GUIDE.md > Documentation System
- Update README.md when features complete
- Generate API docs automatically from code
- Keep user guides current with UI changes
- Archive outdated documentation per consolidation protocol
```

---

## 🤖 AI Development Integration

### **Terminal Coordination (Reference AI_WORKFLOW_GUIDE.md)**
```yaml
# Specify terminal assignment for optimal development
Terminal_Assignment: [Frontend/Backend/Mixed]

# Expected development pattern
Frontend_Terminal_Focus:
  - React components and pages
  - UI integration with @ganger/ui
  - Authentication integration
  - Performance optimization

Backend_Terminal_Focus:
  - Database schema and migrations
  - API endpoints and business logic
  - Universal Hub integrations
  - Security and compliance

Coordination_Points:
  - API interface definition (shared TypeScript types)
  - Authentication integration (role verification)
  - Real-time features (data synchronization)
  - Performance optimization (full-stack)
```

### **Verification-First Development**
```bash
# MANDATORY verification before claiming completion
# All tasks must include verification commands and expected output

Example verification pattern:
✅ npm run type-check        # "Found 0 errors"
✅ npm run build            # "Build completed successfully"
✅ npm run test             # "All tests passed"
✅ npm run audit:compliance # "All audits passed"

# Progress tracking in PROJECT_TRACKER.md
- Update completion status with verification receipts
- Record actual vs estimated development time
- Note any risks or dependencies discovered
```

### **Quality Gate Enforcement**
```typescript
// This PRD will be subject to automated quality enforcement:
PreCommitHooks: {
  typeScriptCompilation: "ZERO_ERRORS_TOLERANCE",
  packageBoundaries: "GANGER_PACKAGES_ONLY", 
  uiCompliance: "NO_CUSTOM_COMPONENTS",
  authCompliance: "STANDARD_AUTH_ONLY",
  performanceBudgets: "MUST_MEET_TARGETS",
  securityCompliance: "HIPAA_PLUS_STANDARDS"
}

// Verification receipts will be captured and stored
// Documentation drift detection will monitor claims vs reality
// Business value measurement will track actual ROI
```

### **MCP Integration Opportunities**
```typescript
// Leverage available MCP servers for enhanced development:
- Google Sheets MCP: Task tracking and progress reporting
- Memory MCP: Context preservation across development sessions  
- Time MCP: HIPAA-compliant timestamps and scheduling
- Supabase MCP: Advanced database operations
- GitHub MCP: Automated issue creation and PR management

// Future MCP integrations available:
- Stripe MCP: Payment processing features
- Twilio MCP: Communication features
- Cloudflare MCP: Advanced deployment and analytics
```

---

*This template ensures consistency across all Ganger Platform applications while leveraging shared infrastructure, automated quality enforcement, and AI-assisted development for maximum efficiency and maintainability.*

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards
- `/true-docs/AI_WORKFLOW_GUIDE.md` - AI development methodologies
- `/true-docs/PROJECT_TRACKER.md` - Current velocity and risk data