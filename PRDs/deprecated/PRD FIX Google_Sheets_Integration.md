# PRD: Google Sheets Integration Fix
*Use this template for all new PRDs to ensure consistency, shared infrastructure, and quality enforcement*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Google Sheets Integration Universal Hub
- **PRD ID**: PRD-SHEETS-001
- **Priority**: High
- **Development Timeline**: 3-4 weeks (reference PROJECT_TRACKER.md for velocity data)
- **Terminal Assignment**: Backend (server-side Google APIs + client interfaces)
- **Dependencies**: @ganger/integrations, @ganger/auth, @ganger/db, @ganger/utils
- **MCP Integration Requirements**: Google Sheets MCP server, existing authentication system
- **Quality Gate Requirements**: Build verification across all frontend apps, zero googleapis imports in client bundles

---

## 🎯 Product Overview

### **Purpose Statement**
Fix Google Sheets integration across the Ganger Platform by separating client-side requests from server-side Google APIs operations, eliminating googleapis build conflicts in frontend apps.

### **Target Users**
- **Primary**: Development team requiring stable builds and Google Sheets functionality
- **Secondary**: Medical staff using automated reporting features (EOS L10 scorecards, inventory reports)
- **Tertiary**: Management requiring automated data synchronization to Google Sheets

### **Success Metrics**
- 100% of frontend apps build successfully without googleapis errors
- 95% reduction in client bundle size (8MB googleapis removal)
- Google Sheets sync functionality restored with <3 second response time
- Zero build failures related to Google APIs across all applications

### **Business Value Measurement**
- **ROI Target**: $15,000 development cost savings through eliminated build failures and debugging time
- **Cost Savings**: 80% reduction in deployment troubleshooting and build pipeline failures
- **Revenue Impact**: Restored automated reporting saves 20 hours/week of manual data entry
- **User Productivity**: Automated scorecard sync improves EOS L10 meeting efficiency by 30%

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
import { ClientGoogleService } from '@ganger/integrations/client';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { ServerGoogleService } from '@ganger/integrations/server';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  ScorecardData, InventoryData, CalendarEvent, Employee,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```

### **App-Specific Technology**
- Google Sheets API v4 (server-side only)
- Google Calendar API v3 (server-side only)
- Service Account authentication with domain-wide delegation
- Rate limiting for Google API quota management (100 requests per 100 seconds)

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard - Updated Hierarchy)**
```typescript
// MANDATORY role hierarchy - see MASTER_DEVELOPMENT_GUIDE.md
type UserRole = 
  | 'superadmin'        // Full Google Sheets access and configuration
  | 'manager'           // Read/write access to team sheets
  | 'provider'          // Read access to relevant sheets
  | 'nurse'             // Limited read access
  | 'medical_assistant' // Data entry access
  | 'pharmacy_tech'     // Inventory sheets access
  | 'billing'           // Financial sheets access
  | 'user';             // No direct sheets access

// Google Sheets permission matrix
interface SheetsPermissions {
  read_scorecards: ['superadmin', 'manager', 'provider'];
  write_scorecards: ['superadmin', 'manager'];
  read_inventory: ['superadmin', 'manager', 'pharmacy_tech'];
  write_inventory: ['superadmin', 'manager', 'pharmacy_tech'];
  admin_sheets: ['superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com Google Workspace accounts only
- **Service Account**: Domain-wide delegation for automated operations
- **Sheet Access**: Based on user role and location assignment
- **API Rate Limiting**: Per-user and global quota management

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff
```

### **App-Specific Tables**
```sql
-- Google Sheets sync tracking
CREATE TABLE google_sheets_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Sync details
  sheet_id VARCHAR(255) NOT NULL,
  sheet_name VARCHAR(255) NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- 'scorecard', 'inventory', 'calendar', 'employee'
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  data_hash VARCHAR(64), -- For change detection
  
  -- Standard RLS policy
  CONSTRAINT rls_policy CHECK (created_by = auth.uid() OR auth.jwt() ->> 'role' IN ('superadmin', 'manager'))
);

-- Google API rate limiting
CREATE TABLE google_api_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  api_type VARCHAR(50) NOT NULL, -- 'sheets', 'calendar'
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '100 seconds'
);
```

### **Data Relationships**
- Links to existing EOS L10 scorecard data
- Connects to inventory items and stock levels  
- References employee data for staff sync
- Audit trail for all Google Sheets operations

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated with Response Standards)**
```typescript
// Google Sheets API endpoints per app
GET    /api/google/sheets/status         // Sync status dashboard
POST   /api/google/sheets/sync           // Manual sync trigger

// EOS L10 specific
POST   /api/google/sheets/scorecard      // Sync scorecard data
GET    /api/google/sheets/scorecard/[id] // Get sync status

// Pharma scheduling specific  
POST   /api/google/calendar/sync         // Calendar sync
GET    /api/google/calendar/events       // Get events

// Inventory specific
POST   /api/google/sheets/inventory      // Inventory report sync
GET    /api/google/sheets/inventory/status // Sync status

// Staff specific
POST   /api/google/sheets/employees      // Employee data sync
GET    /api/google/sheets/employees/status // Sync status
```

### **App-Specific Endpoints**
```typescript
// EOS L10 - Scorecard sync
POST   /api/eos-l10/google/scorecard-sync
interface ScorecardSyncRequest {
  teamId: string;
  weekEnding: string;
  metrics: ScorecardMetric[];
  issues: Issue[];
  rocks: Rock[];
}

// Inventory - Stock level sync
POST   /api/inventory/google/stock-sync
interface StockSyncRequest {
  locationId: string;
  items: InventoryItem[];
  reportType: 'daily' | 'weekly' | 'monthly';
}

// Staff - Employee sync
POST   /api/staff/google/employee-sync
interface EmployeeSyncRequest {
  employees: Employee[];
  syncType: 'full' | 'incremental';
}
```

### **External Integrations (Use Universal Hubs ONLY)**
```typescript
// ✅ REQUIRED: Use Universal Hubs - NO direct external API calls
import { 
  UniversalSheetsHub          // Google Sheets MCP (Data export)
} from '@ganger/integrations';

// Implementation pattern:
const sheetsHub = new UniversalSheetsHub();
await sheetsHub.updateSpreadsheet({ 
  sheetId: 'abc123', 
  range: 'A1:Z100', 
  values: scorecardData 
});
```

- **Google Sheets API**: Scorecard sync, inventory reports, employee data
- **Google Calendar API**: Appointment scheduling integration
- **Error Handling**: Built into Universal Hubs with monitoring
- **Rate Limiting**: Automated through Hub architecture (100 req/100sec)
- **Authentication**: Service account with domain-wide delegation

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // Google integration status
  secondary: 'green-600',   // Successful sync
  accent: 'purple-600',     // Manual sync actions
  neutral: 'slate-600',     // Status text
  warning: 'amber-600',     // Sync warnings
  danger: 'red-600'         // Sync failures
}
```

### **Component Usage**
```typescript
// Use shared components for sync interfaces
import {
  // Sync Status Display
  SyncStatusCard, SyncProgressIndicator, LastSyncTime,
  
  // Manual Sync Controls
  SyncButton, BulkSyncControls, SyncScheduler,
  
  // Error Handling
  SyncErrorAlert, RetryButton, SyncLogViewer
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- Real-time sync status indicators in relevant apps
- Manual sync triggers with loading states
- Error displays with retry options
- Sync history and audit trail viewing
- Google Sheets access links for review

---

## 📱 User Experience

### **User Workflows**
1. **Automatic Sync**: Background sync occurs on data changes with status indicators
2. **Manual Sync**: Users can trigger immediate sync with progress feedback
3. **Error Recovery**: Clear error messages with retry options and fallback to manual export
4. **Status Monitoring**: Real-time sync status across all applications

### **Performance Requirements (Enforced by Performance Budgets)**
```typescript
// MANDATORY performance budgets - automatically enforced
const PERFORMANCE_BUDGETS = {
  // Sync operation response time
  sync_response: 3000, // 3.0s max for sync completion
  
  // Status check response time
  status_check: 500,   // 0.5s max for status updates
  
  // Client bundle size reduction
  bundle_reduction: 8000000, // 8MB reduction from googleapis removal
};
```
- **Real-time Updates**: < 500ms latency for sync status
- **Offline Capability**: Graceful degradation when Google APIs unavailable

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for sync status interfaces
- **Keyboard Navigation**: Full sync control functionality without mouse
- **Screen Reader Support**: Semantic status announcements
- **Color Contrast**: 4.5:1 minimum ratio for sync indicators

---

## 🧪 Testing Strategy

### **Automated Testing (Enforced by Quality Gates)**
```typescript
// MANDATORY test patterns - automatically verified
Unit Tests: 90%+ coverage for Google services logic
Integration Tests: All sync endpoints with real Google Sheets
E2E Tests: Complete sync workflows with data verification
Performance Tests: Sync operation timing and bundle size verification
Build Tests: All frontend apps compile without googleapis errors
Auth Tests: Service account and permission verification
```

### **Quality Gate Integration**
```bash
# Pre-commit verification (automatically runs):
✅ npm run test              # All tests must pass
✅ npm run type-check        # 0 TypeScript errors
✅ npm run build            # All apps build without Google API errors
✅ npm run test:sheets      # Google Sheets integration tests
✅ npm run audit:bundle     # Bundle size verification
```

### **Test Scenarios**
- Successful scorecard sync to Google Sheets
- Inventory report generation and sync
- Calendar event synchronization
- Error handling for API rate limits
- Service account authentication failures
- Large dataset sync performance
- Concurrent sync operations

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with sync audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Google Sheets specific variables
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets@gangerdermatology.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
GOOGLE_SHEETS_QUOTA_LIMIT=100
GOOGLE_SHEETS_QUOTA_WINDOW=100
```

### **Monitoring & Alerts**
- **Sync Status Monitoring**: Real-time sync success/failure tracking
- **API Quota Monitoring**: Google API usage tracking and alerts
- **Performance Monitoring**: Sync operation timing and optimization
- **Error Tracking**: Failed sync attempts with detailed logging

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **Sync Performance**: Operation timing and success rates
- **API Usage**: Google Sheets/Calendar API call patterns
- **Error Patterns**: Common failure modes and resolution
- **User Adoption**: Manual vs automatic sync usage

### **App-Specific Analytics**
- **EOS L10**: Scorecard sync frequency and data quality
- **Inventory**: Report generation patterns and timing
- **Staff**: Employee data sync accuracy and frequency
- **Usage Patterns**: Peak sync times and data volume trends

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Service Account Security**: Minimal permissions and key rotation
- **Data Encryption**: At rest and in transit (TLS 1.3+)
- **API Authentication**: Service account with domain-wide delegation
- **Audit Logging**: All Google Sheets operations logged
- **Rate Limiting**: Prevent API abuse and quota exhaustion

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: No sensitive patient data in Google Sheets
- **Access Controls**: Role-based permissions for sheets access
- **Audit Requirements**: Complete sync operation logging
- **Data Minimization**: Only sync necessary operational data

### **App-Specific Security**
- Google Workspace domain restriction (@gangerdermatology.com)
- Service account permission validation
- Sync data sanitization and validation
- Regular credential rotation schedule

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All frontend apps build successfully without googleapis errors
- [ ] Google Sheets sync functionality restored across all apps
- [ ] Performance benchmarks met (3s sync, 8MB bundle reduction)
- [ ] Security audit passed for service account implementation
- [ ] Integration testing completed with real Google Sheets

### **Success Metrics (6 months)**
- 100% build success rate across all frontend applications
- 95% reduction in Google API related support tickets
- 30% improvement in EOS L10 meeting efficiency through automated sync
- 20 hours/week saved in manual reporting tasks

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **API Quota Monitoring**: Daily quota usage tracking and optimization
- **Service Account Rotation**: Quarterly credential updates
- **Sync Performance Review**: Monthly performance optimization
- **Error Pattern Analysis**: Weekly failed sync investigation

### **Future Enhancements**
- Real-time bidirectional sync with Google Sheets
- Advanced data transformation and validation
- Integration with additional Google Workspace tools
- Automated report scheduling and distribution

---

## 📚 Documentation Requirements

### **Developer Documentation (Reference /true-docs/)**
- [ ] **API documentation**: Google Sheets integration endpoints with examples
- [ ] **Service account setup**: Step-by-step configuration guide
- [ ] **Sync patterns**: Best practices for data synchronization
- [ ] **Error handling**: Troubleshooting guide for common issues
- [ ] **Performance optimization**: Bundle size and sync timing guidelines

### **User Documentation**
- [ ] **Sync status guide**: Understanding sync indicators and controls
- [ ] **Manual sync process**: Step-by-step sync trigger instructions
- [ ] **Error recovery**: User actions for sync failures
- [ ] **Google Sheets access**: Viewing and managing synced data

---

## 🤖 AI Development Integration

### **Terminal Coordination (Reference AI_WORKFLOW_GUIDE.md)**
```yaml
# Specify terminal assignment for optimal development
Terminal_Assignment: Backend

# Expected development pattern
Backend_Terminal_Focus:
  - Google API service separation (client/server)
  - Service account authentication implementation
  - API route creation for sync operations
  - Rate limiting and quota management
  - Error handling and retry logic

Coordination_Points:
  - Client interface definition (TypeScript types)
  - Authentication integration (service account setup)
  - Real-time features (sync status updates)
  - Performance optimization (bundle size reduction)
```

### **Verification-First Development**
```bash
# MANDATORY verification before claiming completion
✅ npm run type-check        # "Found 0 errors"
✅ npm run build            # "Build completed successfully" (all apps)
✅ npm run test:sheets      # "All Google Sheets tests passed"
✅ npm run audit:bundle     # "Bundle size reduced by 8MB"
✅ npm run test:e2e-sync    # "End-to-end sync workflow passed"
```

### **Quality Gate Enforcement**
```typescript
// This PRD will be subject to automated quality enforcement:
PreCommitHooks: {
  typeScriptCompilation: "ZERO_ERRORS_TOLERANCE",
  packageBoundaries: "GANGER_PACKAGES_ONLY", 
  buildVerification: "ALL_APPS_BUILD_SUCCESS",
  bundleSize: "GOOGLEAPIS_REMOVAL_VERIFIED",
  integrationTests: "GOOGLE_SHEETS_FUNCTIONAL"
}
```

---

*This PRD ensures Google Sheets integration works reliably across all Ganger Platform applications while maintaining build stability and performance standards.*

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards
- `/true-docs/AI_WORKFLOW_GUIDE.md` - AI development methodologies
- `/_claude_desktop/SPRINT_GOOGLE_SHEETS_INTEGRATION_FIX.md` - Detailed implementation plan