# 🚀 Ganger Platform - Master Development Guide

**THE SINGLE SOURCE OF TRUTH FOR ALL PLATFORM DEVELOPMENT**

**Last Updated**: January 18, 2025  
**Version**: 2.0  
**Status**: ✅ PRODUCTION - Active Reference  

---

## 📚 **Navigation Guide**

### **🚨 START HERE FOR ALL NEW DEVELOPMENT**
1. **Read this Master Guide first** (you are here)
2. **Reference specific guides** as needed:
   - 🏗️ [Shared Infrastructure Guide](./SHARED_INFRASTRUCTURE_GUIDE.md) - Platform setup & standards
   - 🎨 [Frontend Development Guide](./FRONTEND_DEVELOPMENT_GUIDE.md) - UI/UX development
   - 🔧 [Backend Development Guide](./BACKEND_DEVELOPMENT_GUIDE.md) - API & database development
   - 🚀 [Deployment Documentation](./deployment/) - Vercel distributed deployment strategy

### **👨‍💻 Development Process**
- 👨‍💻 [Developer Workflow](./DEVELOPER_WORKFLOW.md) - Step-by-step development process
- 🤖 [AI Workflow Guide](./AI_WORKFLOW_GUIDE.md) - AI-assisted development patterns

### **📋 Project Management**
- 📊 [Project Tracker](./PROJECT_TRACKER.md) - Active development tracking

---

## 🎯 **Platform Overview & Philosophy**

### **Mission**
Transform Ganger Dermatology through a unified, scalable, medical-grade platform that replaces 17+ legacy PHP applications with modern TypeScript architecture while maintaining 100% business continuity.

### **Core Principles**
1. **Medical-Grade Reliability**: >99.9% uptime, zero data loss tolerance
2. **HIPAA Compliance**: All patient data protected with audit trails
3. **Monorepo Integrity**: Shared infrastructure prevents fragmentation
4. **Performance First**: <2s load times, <500KB bundles
5. **Security by Design**: Zero-trust architecture with role-based access
6. **Developer Experience**: Automated quality gates and instant feedback

---

## 🏗️ **Technology Stack (MANDATORY)**

### **Frontend Stack**
```typescript
Framework: Next.js 14+ with TypeScript
Styling: Tailwind CSS + @ganger/ui design system
Authentication: Google OAuth + Supabase Auth
Real-time: Supabase subscriptions
Performance: Vercel edge network deployment
Testing: Jest + React Testing Library + Playwright
```

### **Backend Stack**
```typescript
API Layer: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
File Storage: Supabase Storage with CDN
Cache: Redis via @ganger/cache
Background Jobs: Supabase Edge Functions
External APIs: Universal Hubs (@ganger/integrations)
```

### **Infrastructure Stack**
```typescript
Deployment: Vercel (distributed architecture with 20+ projects)
DNS/CDN: Cloudflare
Database: Supabase (global distribution)
Authentication: Google Workspace + Supabase
Monitoring: Supabase Analytics + Cloudflare Analytics
Build System: Turborepo (monorepo management)
```

---

## 🚀 **Vercel Deployment Architecture (MANDATORY)**

### **CRITICAL: Vercel Distributed Deployment**

**⚠️ IMPORTANT**: The Ganger Platform uses Vercel's distributed architecture with 20+ individual projects. Each app deploys independently for maximum reliability and scalability.

### **Forbidden Architecture Patterns**
```typescript
// ❌ NEVER USE: Static export configuration
// This prevents dynamic features and API routes
const nextConfig = {
  output: 'export',        // DELETE THIS - breaks dynamic functionality
  trailingSlash: true,     // DELETE THIS - causes routing issues
}

// ❌ NEVER USE: Single monolithic deployment
// Each app must deploy as independent Vercel project
```

### **Required Vercel Configuration**
```typescript
// ✅ REQUIRED: Proper Vercel configuration
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true    // Handle TypeScript errors gracefully
  },
  eslint: {
    ignoreDuringBuilds: true   // ESLint handled separately
  },
  transpilePackages: [         // Required for monorepo packages
    '@ganger/ui',
    '@ganger/auth',
    '@ganger/db',
    '@ganger/utils',
    '@ganger/config'
  ]
}

// ✅ REQUIRED: Vercel project settings
// Project Name: ganger-[app-name]
// Root Directory: apps/[app-name]
// Build Command: cd ../.. && npm run build:[app-name]
// Install Command: cd ../.. && npm install
// Output Directory: .next
// Framework Preset: Next.js
```

### **Vercel Deployment Verification**
```bash
# ✅ MANDATORY: These commands must pass for every app
npm run build:[app-name]           # Must complete successfully
npm run type-check                 # Errors acceptable with ignore flag
vercel --prod                      # Deploy to production

# ✅ DISTRIBUTED ARCHITECTURE: Each app has its own
# - Vercel project (ganger-[app-name])
# - Deployment URL ([app-name]-[hash].vercel.app)
# - Environment variables
# - Scaling configuration
```

### **Common Deployment Failures & Fixes**
```bash
# 1. Module Resolution Issues (pnpm on Vercel)
# Add .npmrc to root directory:
node-linker=hoisted
public-hoist-pattern[]=*
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true

# 2. Syntax Errors - Check for malformed imports
# Wrong: export inside import statement
# Right: Move exports outside import blocks

# 3. Routing Mismatches
# Ensure basePath in next.config.js matches staff portal navigation
# Example: basePath: '/status' NOT '/integration-status'

# 4. Package Version Consistency
# Standardize Next.js: "next": "^14.2.0" (not exact versions)

# 5. Cloudflare Dependencies
# Remove "@cloudflare/next-on-pages" from all package.json files
```

### **Why This Matters**
- **Independent Deployments**: Deploy only what changes
- **Platform Integration**: Staff Portal routes to individual apps
- **Scalability**: Each app scales independently based on usage
- **Medical Reliability**: Distributed architecture prevents cascade failures

### **⚠️ CRITICAL: Deployment Strategy**

**The Ganger Platform uses Vercel's distributed deployment model**. See [Deployment Documentation](./deployment/) for complete deployment procedures, automation scripts, and architecture details.

---

## 🚨 **Critical Success Requirements**

### **Zero-Tolerance Violations**
**These will cause immediate deployment failure:**

#### **TypeScript Compilation**
```bash
# MUST return 0 errors
pnpm type-check
# Expected output: "Found 0 errors in X files"
```

#### **Package Boundaries**
```typescript
// ✅ ALLOWED: Use @ganger/* packages only
import { Button } from '@ganger/ui';
import { useAuth } from '@ganger/auth';

// ❌ FORBIDDEN: External UI libraries
import { Button } from 'react-bootstrap'; // BLOCKED
import { Input } from 'antd'; // BLOCKED
```

#### **Authentication Compliance**
```typescript
// ✅ REQUIRED: Use @ganger/auth exclusively
import { useStaffAuth } from '@ganger/auth/staff';

// ❌ FORBIDDEN: Custom authentication
import { useSession } from 'next-auth/react'; // BLOCKED
```

#### **Performance Budgets (Automatically Enforced)**
```typescript
const MANDATORY_BUDGETS = {
  javascript: 250000,  // 250KB max
  css: 30000,         // 30KB max
  fcp: 1200,          // 1.2s max First Contentful Paint
  lcp: 2000,          // 2.0s max Largest Contentful Paint
  cls: 0.1            // Max Cumulative Layout Shift
};
```

### **🚨 FORBIDDEN: Architecture Anti-Patterns**

#### **Static Export Anti-Pattern (BREAKS DYNAMIC FEATURES)**
```typescript
// ❌ NEVER USE: This prevents API routes and dynamic features
const nextConfig = {
  output: 'export',        // DELETE THIS - breaks dynamic functionality
  trailingSlash: true,     // DELETE THIS - causes routing issues
}

// ✅ REQUIRED: Vercel-compatible configuration
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true    // Handle errors gracefully
  },
  eslint: {
    ignoreDuringBuilds: true   // Separate linting step
  },
  transpilePackages: ['@ganger/ui', '@ganger/auth', '@ganger/db', '@ganger/utils']
}
```

#### **Missing Staff Portal Integration**
```typescript
// ❌ FORBIDDEN: Apps without staff portal integration
export default function App() {
  return <div>My content</div>; // Breaks platform consistency
}

// ✅ REQUIRED: All staff apps must use StaffPortalLayout
export default function App() {
  return (
    <StaffPortalLayout currentApp="my-app">
      <div>My content</div>
    </StaffPortalLayout>
  );
}
```

### **ADR-003: Vercel Distributed Architecture (January 2025)**

**Status**: Active  
**Context**: Monorepo deployment complexity, need for independent scaling

**Decision**: All Ganger Platform applications deploy as independent Vercel projects

**Consequences**:
- ✅ Consistent deployment architecture across all apps
- ✅ Independent scaling and deployment per app
- ✅ Vercel's edge network for global performance
- ✅ Staff portal integration via vercel.json rewrites
- ✅ Faster deployments (only deploy what changes)
- ✅ Better error isolation between apps

**Implementation**: 
- Each app deploys to its own Vercel project
- Staff portal uses rewrites to proxy to individual apps
- Automated deployment scripts in /true-docs/deployment/scripts/

## 🚨 **Common Anti-Patterns (FORBIDDEN)**

### **Architecture Anti-Patterns**

#### **Static Export Configuration**
```typescript
// ❌ FORBIDDEN: Never use static export - breaks dynamic features
const nextConfig = {
  output: 'export'  // This prevents API routes and SSR
}

// ✅ CORRECT: Standard Next.js configuration for Vercel
const nextConfig = {
  // Use standard Next.js config, no special requirements
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
}
```

#### **Missing Staff Portal Integration**
```typescript
// ❌ CREATES INCONSISTENT UX: Apps without staff portal
export default function MyApp() {
  return <div>My content</div>; // No platform integration
}

// ✅ REQUIRED: All staff apps must use StaffPortalLayout
export default function MyApp() {
  return (
    <StaffPortalLayout currentApp="my-app">
      <div>My content</div>
    </StaffPortalLayout>
  );
}
```

#### **Custom UI Components**
```typescript
// ❌ FRAGMENTS PLATFORM: Never create custom components
import CustomButton from './CustomButton'; // Breaks design consistency

// ✅ REQUIRED: Use @ganger/ui exclusively
import { Button } from '@ganger/ui'; // Platform consistency
```

### **How These Anti-Patterns Cause Problems**
- **Static exports** → 405 Method Not Allowed errors
- **Missing staff portal** → Inconsistent user experience
- **Custom UI components** → Design fragmentation and maintenance burden
- **Direct external APIs** → Rate limiting and security issues

---

## 📦 **Shared Package Architecture**

### **Client-Server Boundary Compliance**

#### **Client-Side Imports (Use with 'use client')**
```typescript
'use client'

// ✅ UI Components (client-only)
import { Button, Input, DataTable } from '@ganger/ui';

// ✅ Client Authentication
import { useStaffAuth, AuthProvider } from '@ganger/auth/client';

// ✅ Client Services
import { 
  ClientCommunicationService,
  ClientPaymentService 
} from '@ganger/integrations/client';

// ✅ Client Utilities
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ Shared Types (safe for both)
import type { User, Patient } from '@ganger/types';
```

#### **Server-Side Imports (API routes only)**
```typescript
// ✅ Database Operations
import { db, createClient } from '@ganger/db';

// ✅ Server Authentication
import { withAuth, verifyPermissions } from '@ganger/auth/server';

// ✅ Server Services
import { 
  ServerCommunicationService,
  ServerPaymentService,
  ServerPdfService 
} from '@ganger/integrations/server';

// ✅ Server Utilities
import { analytics, auditLog } from '@ganger/utils/server';

// ✅ Shared Types (safe for both)
import type { ApiResponse, User } from '@ganger/types';
```

### **Package Import Rules**
```typescript
// ✅ ALWAYS ALLOWED
import type { ... } from '@ganger/types';     // Type-only imports
import { ... } from '@ganger/ui';             // UI components (client)
import { ... } from '@ganger/utils/shared';   // Framework-agnostic utilities

// ⚠️ CONTEXT-DEPENDENT
import { ... } from '@ganger/auth/client';    // Client components only
import { ... } from '@ganger/auth/server';    // API routes only
import { ... } from '@ganger/db';             // Server-side only

// ❌ NEVER ALLOWED
import anything from external UI libraries;   // Use @ganger/ui only
import anything from custom auth libraries;   // Use @ganger/auth only
```

---

## 🔐 **Authentication & Authorization**

### **Standard Role Hierarchy**
```typescript
type UserRole = 
  | 'superadmin'        // Full system access
  | 'manager'           // Location management and staff oversight
  | 'provider'          // Clinical operations and patient care
  | 'nurse'             // Clinical support and patient assistance
  | 'medical_assistant' // Administrative and clinical assistance
  | 'pharmacy_tech'     // Medication management
  | 'billing'           // Financial operations
  | 'user';             // Basic access

// ✅ REQUIRED implementation pattern
import { PermissionService } from '@ganger/auth';
const hasPermission = PermissionService.hasPermission(user, 'access_patient_records');
```

### **Authentication Implementation**
```typescript
// ✅ Staff Portal Authentication (staff apps)
'use client'
import { StaffPortalLayout } from '@ganger/ui/staff';
import { useStaffAuth } from '@ganger/auth/staff';

export default function StaffApp() {
  const { user, isAuthenticated } = useStaffAuth();
  
  if (!isAuthenticated) {
    return <StaffLoginRedirect appName="your-app" />;
  }
  
  return (
    <StaffPortalLayout currentApp="your-app">
      {/* Your app content */}
    </StaffPortalLayout>
  );
}

// ✅ API Route Protection
import { withAuth } from '@ganger/auth/server';

export default withAuth(async function handler(req, res) {
  // User is guaranteed authenticated
  const user = req.user;
  // ... API logic
}, { requiredRole: 'staff' });
```

---

## 🗄️ **Database Standards**

### **Shared Database Schema**
```sql
-- Standard tables (automatically available in all apps)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
providers, provider_schedules,
notifications, notification_preferences,
file_uploads, document_storage
```

### **App-Specific Table Creation**
```sql
-- Follow this pattern for all new tables
CREATE TABLE app_specific_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- App-specific columns here
  
  -- Standard RLS policy
  CONSTRAINT rls_policy CHECK (created_by = auth.uid())
);

-- Enable RLS
ALTER TABLE app_specific_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON app_specific_table
  FOR SELECT USING (created_by = auth.uid());
```

### **Database Operations**
```typescript
// ✅ Standard database operations
import { db, Repository } from '@ganger/db';

// Type-safe operations
const userRepo = new Repository<User>('users');
const users = await userRepo.findMany({ 
  where: { role: 'staff' },
  include: { permissions: true }
});

// ✅ Raw queries (when needed)
const result = await db.query<CustomResult>(
  'SELECT * FROM custom_view WHERE location = $1',
  [locationId]
);
```

---

## 🔌 **API Standards**

### **Standard Response Format**
```typescript
// ✅ REQUIRED: All API responses use this format
interface StandardResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
    performance?: PerformanceMeta;
  };
}

// ✅ Implementation example
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await performOperation();
    res.json({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: error.message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    });
  }
}
```

### **Standard CRUD Operations**
```typescript
// ✅ Follow this pattern for all resources
GET    /api/[resource]              // List with pagination & filters
POST   /api/[resource]              // Create new
GET    /api/[resource]/[id]         // Get specific
PUT    /api/[resource]/[id]         // Update
DELETE /api/[resource]/[id]         // Soft delete

// Real-time subscriptions
WS     /api/[resource]/subscribe    // Live updates

// Bulk operations
POST   /api/[resource]/bulk         // Bulk create/update/delete
```

---

## 🌐 **External Integrations (Universal Hubs)**

### **MANDATORY: Use Universal Hubs Only**
```typescript
// ✅ REQUIRED: All external API calls through Universal Hubs
import { 
  UniversalCommunicationHub,  // Twilio MCP (SMS/Voice)
  UniversalPaymentHub,        // Stripe MCP (Payments)
  UniversalDatabaseHub,       // Supabase MCP (Database)
  UniversalSheetsHub,         // Google Sheets MCP (Data export)
  UniversalCalendarHub        // Google Calendar MCP (Scheduling)
} from '@ganger/integrations';

// ✅ Example usage
const commHub = new UniversalCommunicationHub();
await commHub.sendSMS({ 
  to: patient.phone, 
  message: 'Appointment confirmed for tomorrow at 2 PM' 
});

// ❌ FORBIDDEN: Direct external API calls
import stripe from 'stripe'; // BLOCKED - use UniversalPaymentHub
```

### **Available Universal Hubs**
```typescript
// Communication Hub (Twilio MCP)
- SMS messaging (appointment reminders, notifications)
- Voice calls (automated confirmations)
- HIPAA-compliant messaging

// Payment Hub (Stripe MCP)  
- Payment processing (co-pays, services)
- Subscription management
- Invoice generation

// Database Hub (Supabase MCP)
- Advanced database operations
- Real-time subscriptions
- Edge function triggers

// Sheets Hub (Google Sheets MCP)
- Data export and reporting
- Bulk data operations
- Analytics dashboards

// Calendar Hub (Google Calendar MCP)
- Appointment scheduling
- Provider availability
- Automated reminders
```

---

## 🎨 **UI/UX Standards**

### **Design System Compliance**
```typescript
// ✅ REQUIRED: Use @ganger/ui components exclusively
import {
  // Layout
  AppLayout, StaffPortalLayout, PageHeader, Sidebar,
  
  // Forms
  Button, Input, Select, DatePicker, FileUpload, FormBuilder,
  
  // Data Display
  DataTable, PaginationControls, StatCard, ChartContainer,
  
  // Feedback
  LoadingSpinner, ErrorBoundary, SuccessToast, ConfirmDialog
} from '@ganger/ui';

// ✅ Standard layout implementation
export default function YourApp() {
  return (
    <StaffPortalLayout currentApp="your-app">
      <PageHeader title="Your App" />
      <main className="p-6">
        {/* Your content using @ganger/ui components */}
      </main>
    </StaffPortalLayout>
  );
}
```

### **Color System**
```typescript
// Ganger Platform Design System
const colors = {
  primary: 'blue-600',      // Medical professional
  secondary: 'green-600',   // Success/health
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Alerts
  danger: 'red-600'         // Errors/critical
};
```

---

## 🧪 **Quality Gates & Testing**

### **Automated Quality Enforcement**
```bash
# Pre-commit hooks automatically enforce these (runs on every commit):
✅ pnpm type-check              # 0 TypeScript errors required
✅ pnpm lint                    # ESLint compliance
✅ pnpm test                    # All tests must pass
✅ pnpm test:performance        # Performance budget compliance
✅ pnpm test:a11y               # Accessibility compliance
✅ pnpm audit:ui-compliance     # UI component usage verification
✅ pnpm audit:auth-compliance   # Authentication pattern verification
✅ pnpm audit:package-boundaries # Package import boundary verification
```

### **Testing Requirements**
```typescript
// ✅ MANDATORY test patterns
Unit Tests: 80%+ coverage for business logic
Integration Tests: All API endpoints with standard responses
E2E Tests: Critical user workflows with real data
Performance Tests: Page load and interaction benchmarks
Accessibility Tests: Automated WCAG 2.1 AA validation
Security Tests: Authentication and authorization verification
```

---

## 🚀 **Development Workflow**

### **Step-by-Step New App Development**

#### **1. Planning & Setup**
```bash
# Reference PRD template and create app-specific PRD
cp PRDs/00_PRD_TEMPLATE_STANDARD.md PRDs/your-app-prd.md

# Create app directory
mkdir apps/your-app
cd apps/your-app

# Initialize from template
pnpm create next-app@latest . --typescript --tailwind --app
```

#### **2. Shared Package Integration**
```typescript
// package.json dependencies
{
  "dependencies": {
    "@ganger/ui": "workspace:*",
    "@ganger/auth": "workspace:*", 
    "@ganger/db": "workspace:*",
    "@ganger/types": "workspace:*",
    "@ganger/utils": "workspace:*",
    "@ganger/integrations": "workspace:*"
  }
}
```

#### **3. Authentication Setup**
```typescript
// app/layout.tsx
import { AuthProvider } from '@ganger/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// app/page.tsx  
import { StaffPortalLayout } from '@ganger/ui/staff';
import { useStaffAuth } from '@ganger/auth/staff';

export default function HomePage() {
  return (
    <StaffPortalLayout currentApp="your-app">
      {/* Your app content */}
    </StaffPortalLayout>
  );
}
```

#### **4. Database Schema**
```sql
-- Create app-specific tables following standard pattern
-- Reference database standards section above
-- Update shared schema documentation
```

#### **5. API Implementation**
```typescript
// Follow standard API patterns
// Use standard response format
// Implement proper authentication
// Reference API standards section above
```

#### **6. Quality Verification**
```bash
# Run quality gates before committing
pnpm type-check    # Must pass with 0 errors
pnpm build        # Must complete successfully  
pnpm test         # All tests must pass
pnpm lint         # No linting errors
```

### **Navigation Integration**
```typescript
// ✅ Add your app to staff portal navigation
// Update packages/ui/src/staff/StaffPortalLayout.tsx
const STAFF_APPS = [
  // ... existing apps
  {
    name: 'Your App',
    path: '/your-app',
    icon: YourAppIcon,
    category: 'Medical' | 'Business' | 'Administration'
  }
];
```

---

## 📊 **Performance Standards**

### **Performance Budgets (Automatically Enforced)**
```typescript
const PERFORMANCE_BUDGETS = {
  // First Contentful Paint
  fcp: 1200, // 1.2s max
  
  // Largest Contentful Paint  
  lcp: 2000, // 2.0s max
  
  // Cumulative Layout Shift
  cls: 0.1,  // Max 0.1 CLS score
  
  // Time to Interactive
  tti: 3000, // 3.0s max
  
  // Bundle sizes
  javascript: 250000, // 250KB max
  css: 30000,         // 30KB max
};
```

### **Performance Optimization Techniques**
```typescript
// ✅ Code splitting
import dynamic from 'next/dynamic';
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />
});

// ✅ Image optimization
import Image from 'next/image';
<Image src="/image.jpg" alt="Description" width={500} height={300} />

// ✅ Bundle analysis
npm run analyze  // Check bundle composition
```

---

## 🔒 **Security & Compliance**

### **HIPAA Compliance Requirements**
```typescript
// ✅ Audit logging for all PHI access
import { auditLog } from '@ganger/utils/server';

await auditLog({
  action: 'patient_record_access',
  resourceId: patientId,
  userId: user.id,
  details: { fields_accessed: ['name', 'dob', 'diagnosis'] }
});

// ✅ Data encryption
import { encrypt, decrypt } from '@ganger/utils/encryption';
const encryptedPHI = encrypt(patientData);

// ✅ Access control verification
import { verifyAccess } from '@ganger/auth/server';
await verifyAccess(user, 'patient_records', patientId);
```

### **Security Headers**
```typescript
// ✅ Security headers (automatically applied in production)
Content-Security-Policy: strict CSP policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

---

## 📚 **Documentation Requirements**

### **When Creating New Apps**
1. **Update this Master Guide** with any new patterns or standards
2. **Create app-specific README.md** with:
   - Purpose and user workflows
   - API documentation
   - Database schema changes
   - Integration points
3. **Update shared schema documentation** if adding database tables
4. **Generate API documentation** from code using OpenAPI
5. **Create user documentation** for new features

### **Documentation Maintenance**
```bash
# Keep documentation current
- Update when adding features
- Archive outdated information
- Reference true-docs as single source of truth
- Remove duplicate documentation in other directories
```

---

## 🤖 **AI Development Integration**

### **Terminal Assignment Guidelines**
```yaml
# Specify optimal development approach in PRDs
Frontend_Terminal: UI components, authentication flows, user workflows
Backend_Terminal: Database schema, API endpoints, integrations
Mixed_Terminal: Full-stack features requiring coordination

# Verification-first development
- All claims must include verification commands
- Progress tracked in PROJECT_TRACKER.md
- Quality gates enforced automatically
```

### **Available MCP Servers**
```typescript
// Leverage these for enhanced development:
- Google Sheets MCP: Progress tracking and reporting
- Time MCP: HIPAA-compliant timestamps
- Supabase MCP: Advanced database operations
- GitHub MCP: Automated issue and PR management
- Stripe MCP: Payment processing features
- Twilio MCP: Communication features
- Cloudflare MCP: Deployment and analytics
```

---

## 🚨 **Common Issues & Solutions**

### **TypeScript Compilation Errors**
```bash
# Check for client/server boundary violations
pnpm type-check 2>&1 | grep -E "(client|server)"

# Fix import boundary violations
# Move server-only code to API routes
# Use 'use client' directive for client components
```

### **Package Boundary Violations**
```bash
# Check for external package usage
pnpm audit:package-boundaries

# Replace external packages with @ganger/* equivalents
# Update imports to use shared packages only
```

### **Performance Budget Failures**
```bash
# Analyze bundle size
pnpm analyze

# Optimize imports
import { Button } from '@ganger/ui';     # ✅ Tree-shakeable
import * as UI from '@ganger/ui';       # ❌ Imports everything

# Use dynamic imports for heavy components
const Heavy = dynamic(() => import('./Heavy'));
```

### **Authentication Issues**
```bash
# Verify auth implementation
pnpm audit:auth-compliance

# Check for proper auth providers and hooks usage
# Ensure protected routes use correct middleware
```

---

## 📋 **Quick Reference Checklist**

### **Before Starting Development**
- [ ] Read this Master Development Guide completely
- [ ] Review app-specific PRD requirements
- [ ] Check PROJECT_TRACKER.md for current status
- [ ] Verify shared package versions are current

### **During Development**
- [ ] Use only @ganger/* packages for UI, auth, database
- [ ] Follow client/server boundary rules
- [ ] Implement standard authentication patterns
- [ ] Use Universal Hubs for external integrations
- [ ] Write tests for all business logic
- [ ] Verify performance budgets continuously

### **Before Committing**
- [ ] `pnpm type-check` returns 0 errors
- [ ] `pnpm build` completes successfully
- [ ] `pnpm test` all tests pass
- [ ] `pnpm lint` no linting errors
- [ ] Performance budgets within limits
- [ ] Documentation updated for changes

### **Before Deployment**
- [ ] All quality gates pass
- [ ] Integration testing complete
- [ ] Security review completed
- [ ] User documentation current
- [ ] Performance monitoring configured

---

## 🆘 **Getting Help**

### **Documentation Hierarchy**
1. **This Master Guide** - Start here for all questions
2. **Specific guides** - Reference for detailed implementation
3. **Package README files** - For @ganger/* package-specific help
4. **Code examples** - In existing applications

### **Escalation Path**
1. **Search this documentation** first
2. **Check existing apps** for implementation patterns
3. **Review quality gate failures** for specific guidance
4. **Ask team leads** for architecture decisions

---

**This Master Development Guide is the authoritative source for all Ganger Platform development. When in doubt, reference this guide first.**

*Master Development Guide*  
*Version 2.0*  
*Last Updated: January 18, 2025*  
*Single Source of Truth for Platform Development*