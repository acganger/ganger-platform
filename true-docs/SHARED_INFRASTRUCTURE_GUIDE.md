# Ganger Platform - Shared Infrastructure Guide

*This document contains all shared infrastructure, quality enforcement, and platform-wide standards that apply to both frontend and backend development.*

## Table of Contents

### **Core Infrastructure**
- [Platform Constants and Standards](#platform-constants-and-standards)
- [Navigation Integration Patterns](#navigation-integration-patterns)
- [Monorepo Dependency Management](#monorepo-dependency-management)
- [Automated Quality Enforcement](#automated-quality-enforcement)
- [Architecture Decision Records](#architecture-decision-records)
- [Performance Budgets and Monitoring](#performance-budgets-and-monitoring)
- [Reality Verification Systems](#reality-verification-systems)
- [Documentation System and Maintenance](#documentation-system-and-maintenance)

### **Platform Setup**
- [Platform Overview](#platform-overview)
- [Development Environment Setup](#development-environment-setup)
- [Deployment and Infrastructure](#deployment-and-infrastructure)

### **Developer Workflow**
- [Quality Gates Reference](#quality-gates-reference)
- [Common Commands](#common-commands)
- [Troubleshooting Guide](#troubleshooting-guide)

### **Companion Documents**
- 📱 **[Frontend Development Guide](./FRONTEND_DEVELOPMENT_GUIDE.md)** - Complete frontend development reference
- 🔧 **[Backend Development Guide](./BACKEND_DEVELOPMENT_GUIDE.md)** - Complete backend development reference

---

*This shared infrastructure guide serves as the foundation for all Ganger Platform development. Frontend and backend developers should reference this alongside their specialized guides.*

---

# Platform Constants and Standards

## Platform Constants (MANDATORY USAGE)

All applications MUST use these exact constants for consistency across the platform. Import from `@ganger/types/constants`:

```typescript
// ✅ REQUIRED: Import platform constants
import { 
  USER_ROLES, 
  LOCATIONS, 
  PRIORITY_LEVELS,
  APPOINTMENT_STATUS,
  FORM_TYPES,
  PLATFORM_URLS
} from '@ganger/types/constants';

// ✅ Standard location values (use exactly these)
export const LOCATIONS = [
  'ann-arbor',     // Ganger Dermatology Ann Arbor
  'wixom',         // Ganger Dermatology Wixom  
  'plymouth',      // Ganger Dermatology Plymouth
  'vinya'          // Vinya Construction office
] as const;

// ✅ Standard role hierarchy (use exactly these)
export const USER_ROLES = [
  'superadmin',        // Full system access
  'manager',           // Location management and staff oversight
  'provider',          // Clinical operations and patient care
  'nurse',             // Clinical support and patient assistance
  'medical_assistant', // Administrative and clinical assistance
  'pharmacy_tech',     // Medication management
  'billing',           // Financial operations
  'user'               // Basic access
] as const;

// ✅ Standard form types (extend for new apps)
export const FORM_TYPES = [
  'support_ticket',
  'time_off_request', 
  'punch_fix',
  'change_of_availability',
  'expense_reimbursement',
  'meeting_request',
  'appointment_booking',
  'inventory_request',
  'pharma_rep_booking',
  'patient_handout_request'
] as const;

// ✅ Platform URLs for cross-app navigation
export const PLATFORM_URLS = {
  STAFF_PORTAL: 'https://staff.gangerdermatology.com',
  PATIENT_HANDOUTS: 'https://handouts.gangerdermatology.com',
  PATIENT_KIOSK: 'https://kiosk.gangerdermatology.com',
  PATIENT_MEDS: 'https://meds.gangerdermatology.com',
  REP_BOOKING: 'https://reps.gangerdermatology.com'
} as const;
```

## Working Infrastructure Values

**CRITICAL**: These are the exact working infrastructure values. DO NOT sanitize or replace with placeholders:

```bash
# ✅ Supabase Configuration (WORKING VALUES)
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ✅ Google OAuth & Workspace (WORKING VALUES)
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_DOMAIN=gangerdermatology.com

# ✅ Cloudflare Configuration (WORKING VALUES)
CLOUDFLARE_ZONE_ID=ba76d3d3f41251c49f0365421bd644a5
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf
```

**Security Policy**: This is an internal medical platform. These working values are intentionally committed and documented for proper deployment functionality.

---

# Navigation Integration Patterns

## Staff Portal Navigation Integration

All staff applications MUST integrate with the staff portal navigation system for seamless user experience.

### Required Navigation Implementation

```typescript
// ✅ MANDATORY: Add your app to staff portal navigation
// Location: packages/ui/src/staff/StaffPortalLayout.tsx

interface StaffApp {
  name: string;
  path: string;
  icon: React.ComponentType;
  category: 'Medical' | 'Business' | 'Administration';
  description: string;
  roles: UserRole[];
  permissions?: string[];
}

// ✅ Add your app to this array
const STAFF_APPS: StaffApp[] = [
  // Existing apps...
  {
    name: 'Your App Name',
    path: '/your-app-path',
    icon: YourAppIcon,  // Import from @ganger/ui/icons
    category: 'Medical', // or 'Business' or 'Administration'
    description: 'Brief description for tooltips and search',
    roles: ['staff', 'manager', 'provider'], // Who can access
    permissions: ['specific_permission'] // Optional additional restrictions
  }
];
```

### Navigation Categories

```typescript
// ✅ Medical Applications
category: 'Medical'
// Examples: inventory, handouts, kiosk, medication-auth, clinical-staffing

// ✅ Business Operations  
category: 'Business'
// Examples: eos-l10, pharma-scheduling, call-center-ops, batch-closeout

// ✅ Platform Administration
category: 'Administration'  
// Examples: socials-reviews, compliance-training, platform-dashboard, config-dashboard
```

### Cross-App Navigation

```typescript
// ✅ Implement cross-app navigation for related workflows
import { StaffPortalNav } from '@ganger/ui/staff';

<StaffPortalNav 
  currentApp="your-app"
  relatedApps={['inventory', 'handouts']} // Apps commonly used together
  quickActions={[
    { name: 'New Order', path: '/inventory/new' },
    { name: 'Patient Handouts', path: '/handouts' }
  ]}
/>
```

## External Domain Integration

For applications requiring patient or external access, follow the dual interface pattern:

### Dual Interface Configuration

```typescript
// ✅ Staff Interface: staff.gangerdermatology.com/your-app
// Uses StaffPortalLayout with authentication
export default function StaffInterface() {
  return (
    <StaffPortalLayout currentApp="your-app">
      {/* Full administrative interface */}
    </StaffPortalLayout>
  );
}

// ✅ External Interface: your-app.gangerdermatology.com  
// Direct access for patients/reps (no authentication required)
export default function ExternalInterface() {
  return (
    <ExternalLayout appName="your-app">
      {/* Limited public interface */}
    </ExternalLayout>
  );
}
```

### External Domain Requirements

Applications requiring external access:
- **Handouts**: Patient access to educational materials
- **Kiosk**: Patient check-in interface
- **Meds**: Patient medication portal
- **Reps**: Pharmaceutical rep booking system

Each requires both staff and external worker configurations.

## URL Structure Standards

```typescript
// ✅ Staff Portal URLs (authenticated)
https://staff.gangerdermatology.com/              // Staff portal home
https://staff.gangerdermatology.com/inventory     // Inventory management
https://staff.gangerdermatology.com/handouts     // Handouts admin
https://staff.gangerdermatology.com/dashboard    // Platform dashboard

// ✅ External URLs (no authentication)
https://handouts.gangerdermatology.com           // Patient handouts
https://kiosk.gangerdermatology.com             // Patient check-in
https://meds.gangerdermatology.com              // Patient medications
https://reps.gangerdermatology.com              // Rep booking

// ❌ FORBIDDEN: Individual app subdomains for staff apps
https://inventory.gangerdermatology.com          // NOT ALLOWED
https://dashboard.gangerdermatology.com          // NOT ALLOWED
```

---

# Monorepo Dependency Management

## Critical: Preventing Cascading Failures

The Ganger Platform uses **strict dependency standardization** to prevent cascading failures where fixing one app breaks others.

### **Dependency Version Standards**

**NEVER change these versions without team approval:**

```json
{
  "react": "^18.3.1",
  "@types/react": "^18.3.0", 
  "@types/react-dom": "^18.3.0",
  "typescript": "^5.3.0",
  "next": "^14.2.29",
  "eslint": "^8.57.0"
}
```

### **Package Manager Requirements**

**CRITICAL: Must use pnpm for workspace protocol support**

```bash
# ✅ CORRECT - Use pnpm exclusively
pnpm install
pnpm type-check
pnpm build

# ❌ WRONG - npm causes workspace protocol errors  
npm install  # FORBIDDEN - breaks workspace: dependencies
```

### **Workspace Configuration**

**Required Files:**
- `pnpm-workspace.yaml` (not package.json workspaces)
- `package.json` with `"packageManager": "pnpm@8.15.0"`

**TypeScript Config Resolution:**
```json
{
  "extends": "../config/typescript/base.json"  // ✅ Relative paths
  "extends": "@ganger/config/typescript/base.json"  // ❌ Package refs break
}
```

### **Monorepo Stability Rules**

**Rule 1: Dependency Isolation**
- Apps cannot change shared package versions
- All version changes require root package.json update
- Use `pnpm ls` to verify actual installed versions

**Rule 2: TypeScript Compilation Consistency**  
- All apps must use identical React/TypeScript versions
- No app-specific dependency overrides allowed
- Test compilation: `pnpm type-check` from root

**Rule 3: Workspace Protocol Compliance**
```json
{
  "@ganger/ui": "workspace:*",     // ✅ Correct pnpm syntax
  "@ganger/auth": "workspace:*",   // ✅ Correct pnpm syntax
  "@ganger/ui": "file:../packages/ui"  // ❌ npm-style breaks pnpm
}
```

### **Fixing Cascading Failures**

**If apps break each other during development:**

```bash
# 1. Reset to clean state
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules packages/*/node_modules

# 2. Reinstall with pnpm
pnpm install

# 3. Verify all working apps still work
pnpm type-check

# 4. Fix individual apps without changing dependencies
```

**Emergency Stability Check:**
```bash
# Verify no app has broken others
echo "Testing EOS L10 (known working)..."
cd apps/eos-l10 && pnpm type-check
echo "Testing Inventory (known working)..."
cd ../inventory && pnpm type-check
echo "Testing Pharma Scheduling (known working)..."
cd ../pharma-scheduling && pnpm type-check
```

---

# Automated Quality Enforcement

## Pre-Commit Hook Implementation

The Ganger Platform enforces architectural integrity through automated pre-commit hooks that prevent quality issues from entering the codebase.

### Required Pre-Commit Hooks

**Installation:**
```bash
# Install pre-commit framework
npm install --save-dev pre-commit husky lint-staged

# Initialize pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
```

**Mandatory Quality Gates (.husky/pre-commit):**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running quality enforcement checks..."

# 1. TypeScript Compilation - ZERO TOLERANCE
echo "📝 TypeScript compilation check..."
npm run type-check || {
  echo "❌ TypeScript compilation failed. Commit blocked."
  exit 1
}

# 2. Package Boundary Enforcement
echo "📦 Package boundary validation..."
npm run audit:package-boundaries || {
  echo "❌ Package boundary violations detected. Commit blocked."
  exit 1
}

# 3. Component Library Compliance
echo "🎨 UI component compliance check..."
npm run audit:ui-compliance || {
  echo "❌ Custom UI components detected. Use @ganger/ui only. Commit blocked."
  exit 1
}

# 4. Authentication Standard Compliance
echo "🔐 Authentication compliance check..."
npm run audit:auth-compliance || {
  echo "❌ Custom authentication detected. Use @ganger/auth only. Commit blocked."
  exit 1
}

# 5. Performance Budget Verification
echo "⚡ Performance budget check..."
npm run audit:performance-budget || {
  echo "❌ Performance budget exceeded. Optimize before commit."
  exit 1
}

# 6. Security Compliance Verification
echo "🔒 Security compliance check..."
npm run audit:security-compliance || {
  echo "❌ Security compliance violations. Commit blocked."
  exit 1
}

# 7. Client-Server Boundary Verification
echo "🔄 Client-server boundary check..."
npm run audit:client-server-boundaries || {
  echo "❌ Client-server boundary violations detected. Commit blocked."
  exit 1
}

# 8. 'use client' Directive Validation
echo "⚛️ 'use client' directive validation..."
npm run audit:use-client-directive || {
  echo "❌ Missing or incorrect 'use client' directive usage. Commit blocked."
  exit 1
}

# 9. Server Import Prevention in Client Code
echo "🚫 Server import prevention check..."
npm run audit:server-imports || {
  echo "❌ Server imports detected in client code. Commit blocked."
  exit 1
}

echo "✅ All quality gates passed. Commit approved."
```

### Package Boundary Enforcement Scripts

**Package Boundary Audit (scripts/audit-package-boundaries.js):**
```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const FORBIDDEN_PATTERNS = [
  // Forbidden imports in apps
  { 
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /import.*from ['"](?!@ganger\/|\.\.?\/|next\/|react)/,
      /import.*supabase.*from.*(?!@ganger\/)/,
      /import.*stripe.*from.*(?!@ganger\/)/,
    ],
    message: 'Apps must only import from @ganger/* packages or relative paths'
  },
  
  // Forbidden direct database imports
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /import.*from ['"]@supabase\/supabase-js['"]/, 
      /createClient.*from.*supabase/
    ],
    message: 'Use @ganger/db for all database operations'
  },
  
  // Forbidden UI implementations
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /const.*Button.*=.*\(.*\).*=>.*<button/,
      /const.*Input.*=.*\(.*\).*=>.*<input/,
      /const.*Modal.*=.*\(.*\).*=>.*<div.*modal/
    ],
    message: 'Custom UI components prohibited. Use @ganger/ui exclusively'
  },
  
  // Forbidden server imports in client components
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /('use client'[\s\S]*?import.*from ['"]@ganger\/integrations\/server)/,
      /('use client'[\s\S]*?import.*from ['"]@ganger\/db)/,
      /('use client'[\s\S]*?import.*from ['"]googleapis)/,
      /('use client'[\s\S]*?import.*from ['"]puppeteer)/,
      /('use client'[\s\S]*?import.*from ['"]ioredis)/
    ],
    message: 'Client components cannot import server-only packages'
  },
  
  // Missing 'use client' for interactive components
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /(import.*useState.*from.*react(?![\s\S]*'use client'))/,
      /(import.*useEffect.*from.*react(?![\s\S]*'use client'))/,
      /(import.*useCallback.*from.*react(?![\s\S]*'use client'))/
    ],
    message: 'Components using React hooks must include "use client" directive'
  },
  
  // Forbidden Node.js modules in client code
  {
    pattern: 'apps/*/src/**/*.{ts,tsx}',
    forbidden: [
      /import.*from ['"]fs['"]/,
      /import.*from ['"]crypto['"]/,
      /import.*from ['"]net['"]/,
      /import.*from ['"]dns['"]/,
      /import.*from ['"]child_process['"]/
    ],
    message: 'Node.js modules cannot be imported in client-side code'
  }
];

function auditPackageBoundaries() {
  let violations = 0;
  
  FORBIDDEN_PATTERNS.forEach(({ pattern, forbidden, message }) => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      forbidden.forEach(forbiddenPattern => {
        if (forbiddenPattern.test(content)) {
          console.error(`❌ ${file}: ${message}`);
          violations++;
        }
      });
    });
  });
  
  if (violations > 0) {
    console.error(`\n❌ ${violations} package boundary violations detected`);
    process.exit(1);
  }
  
  console.log('✅ Package boundaries clean');
}

auditPackageBoundaries();
```

### Package.json Script Integration

**Required Scripts Addition:**
```json
{
  "scripts": {
    "pre-commit": "npm run type-check && npm run audit:package-boundaries && npm run audit:ui-compliance && npm run audit:auth-compliance && npm run audit:performance-budget && npm run audit:security-compliance && npm run audit:client-server-boundaries && npm run audit:use-client-directive && npm run audit:server-imports",
    "audit:package-boundaries": "node scripts/audit-package-boundaries.js",
    "audit:ui-compliance": "node scripts/audit-ui-compliance.js", 
    "audit:auth-compliance": "node scripts/audit-auth-compliance.js",
    "audit:performance-budget": "node scripts/audit-performance-budget.js",
    "audit:security-compliance": "node scripts/audit-security-compliance.js",
    "audit:client-server-boundaries": "node scripts/audit-client-server-boundaries.js",
    "audit:use-client-directive": "node scripts/audit-use-client-directive.js",
    "audit:server-imports": "node scripts/audit-server-imports.js"
  }
}
```

## Quality Gates Reference

### **Frontend Quality Gates**
- **TypeScript Compilation**: Zero errors tolerance for UI components
- **Component Compliance**: Mandatory @ganger/ui usage, no custom components
- **Client Directive Usage**: Proper 'use client' for interactive components
- **Performance Budgets**: Bundle size and load time compliance

### **Backend Quality Gates**
- **TypeScript Compilation**: Zero errors tolerance for API routes
- **Authentication Standards**: Mandatory @ganger/auth usage, no custom auth
- **Security Compliance**: HIPAA compliance, no hardcoded secrets
- **API Standards**: Consistent response formats, proper error handling

### **Shared Quality Gates**
- **Package Boundaries**: Apps can only import @ganger/* packages
- **Client-Server Separation**: No server imports in client code
- **Documentation Standards**: All public APIs documented
- **Performance Monitoring**: Automated performance regression detection

---

# Architecture Decision Records

## ADR Template and Process

Architecture Decision Records (ADRs) document significant architectural decisions and their rationale to prevent future questioning and maintain consistency.

### ADR Format Template

**File Naming Convention:** `docs/adrs/ADR-YYYY-number-title.md`

**Standard ADR Template:**
```markdown
# ADR-YYYY-001: [Decision Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Deciders:** [List of decision makers]
**Technical Story:** [Link to issue/story if applicable]

## Context
[Describe the forces at play, including technological, political, social, and project constraints]

## Decision  
[Describe the change we're making and why]

## Rationale
[Explain why this decision was made, including alternatives considered]

## Consequences
**Positive:**
- [Benefit 1]
- [Benefit 2]

**Negative:**
- [Trade-off 1] 
- [Trade-off 2]

**Neutral:**
- [Impact 1]

## Implementation Notes
[Specific implementation guidance]

## Compliance Requirements
[Any quality gates or verification requirements]

## Review Date
[When this decision should be reviewed]
```

### Mandatory ADRs for Ganger Platform

**ADR-2025-001: Shared Package Architecture**
```markdown
## Decision
All applications MUST use @ganger/* shared packages exclusively. Custom implementations of UI components, authentication, database access, or external integrations are prohibited.

## Rationale  
- Ensures consistency across applications
- Reduces maintenance burden
- Prevents architectural drift
- Enforces quality standards

## Compliance Requirements
- Pre-commit hooks enforce package boundaries
- Automated auditing prevents violations
- 100% shared package usage required
```

**ADR-2025-002: Universal Hub Integration Pattern**
```markdown
## Decision
All external service integrations MUST use Universal Hub pattern through @ganger/integrations package with MCP server backends.

## Rationale
- Standardizes external service access
- Provides monitoring and error handling
- Enables service substitution
- Centralizes configuration management

## Implementation Notes
- Use UniversalDatabaseHub for all database operations
- Use UniversalPaymentHub for all payment processing  
- Use UniversalCommunicationHub for all messaging
```

**ADR-2025-003: Authentication Standardization**
```markdown
## Decision
All applications MUST use @ganger/auth package exclusively. Custom authentication implementations are prohibited.

## Rationale
- Ensures consistent security standards
- Maintains role-based access control
- Provides HIPAA compliance logging
- Centralizes session management

## Compliance Requirements
- No custom auth contexts or hooks
- Must use withAuth HOC for protected routes
- Required Google OAuth integration
```

### ADR Review and Maintenance Process

**Quarterly ADR Review:**
1. **Review Active ADRs**: Validate decisions are still appropriate
2. **Check Compliance**: Verify actual implementation matches ADR requirements  
3. **Update Status**: Mark deprecated or superseded ADRs
4. **Document Changes**: Create new ADRs for significant changes

**ADR Impact Assessment:**
- **High Impact**: Affects multiple applications or core architecture
- **Medium Impact**: Affects single application or package
- **Low Impact**: Affects specific component or feature

---

# Performance Budgets and Monitoring

## Quantified Performance Standards

The Ganger Platform enforces strict performance budgets to maintain exceptional user experience across all applications.

### Application Performance Budgets

**Page Load Performance:**
```typescript
const PERFORMANCE_BUDGETS = {
  // First Contentful Paint
  fcp: {
    inventory: 1200,      // 1.2s max
    handouts: 1000,       // 1.0s max  
    checkinKiosk: 800,    // 0.8s max (critical for patient flow)
    eosL10: 1500,         // 1.5s max
    medicationAuth: 1000, // 1.0s max
    pharmaScheduling: 1200 // 1.2s max
  },
  
  // Largest Contentful Paint
  lcp: {
    inventory: 2000,      // 2.0s max
    handouts: 1800,       // 1.8s max
    checkinKiosk: 1500,   // 1.5s max
    eosL10: 2500,         // 2.5s max
    medicationAuth: 1800, // 1.8s max
    pharmaScheduling: 2000 // 2.0s max
  },
  
  // Cumulative Layout Shift
  cls: {
    all: 0.1 // Max 0.1 CLS score for all applications
  },
  
  // Time to Interactive
  tti: {
    inventory: 3000,      // 3.0s max
    handouts: 2500,       // 2.5s max
    checkinKiosk: 2000,   // 2.0s max (critical for patient flow)
    eosL10: 4000,         // 4.0s max
    medicationAuth: 2500, // 2.5s max
    pharmaScheduling: 3000 // 3.0s max
  }
};
```

**Bundle Size Budgets:**
```typescript
const BUNDLE_SIZE_BUDGETS = {
  // JavaScript bundle sizes (gzipped)
  javascript: {
    'apps/*/pages/_app.js': 120000,    // 120KB max app shell
    'apps/*/pages/index.js': 200000,   // 200KB max home page
    'apps/*/pages/dashboard.js': 250000, // 250KB max dashboard
    'packages/ui/dist/index.js': 80000,  // 80KB max UI package
    'packages/auth/dist/index.js': 40000, // 40KB max auth package
  },
  
  // CSS bundle sizes (gzipped)
  css: {
    'apps/*/styles/globals.css': 20000, // 20KB max global styles
    'packages/ui/dist/styles.css': 30000 // 30KB max UI styles
  },
  
  // Image optimization requirements
  images: {
    maxFileSize: 500000,  // 500KB max per image
    webpRequired: true,   // WebP format required
    lazyLoadRequired: true // Lazy loading required for non-critical images
  }
};
```

### Build Time Performance Budgets

**Development Build Performance:**
```typescript
const BUILD_TIME_BUDGETS = {
  // TypeScript compilation times
  typeCheck: {
    root: 60000,          // 60s max for full workspace type check
    'apps/inventory': 15000, // 15s max per app
    'apps/handouts': 15000,
    'apps/checkin-kiosk': 15000,
    'packages/ui': 10000,    // 10s max per package
    'packages/auth': 5000,
    'packages/db': 8000
  },
  
  // Production build times
  build: {
    'apps/inventory': 120000,   // 2min max production build
    'apps/handouts': 120000,
    'apps/checkin-kiosk': 120000,
    'packages/ui': 60000,       // 1min max package build
  },
  
  // Development server startup
  devServer: {
    'apps/inventory': 30000,    // 30s max dev server start
    'apps/handouts': 30000,
    'apps/checkin-kiosk': 30000
  }
};
```

---

# Platform Overview

## Core Technology Stack

### **Infrastructure Foundation**
- **Frontend Framework**: Next.js 14 with TypeScript
- **Backend Services**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Hosting Platform**: Cloudflare Workers with global edge network
- **Build System**: Turborepo for monorepo management
- **Quality Enforcement**: Automated pre-commit hooks with zero-tolerance policies

### **Authentication & Security**
- **Authentication**: Google OAuth with Workspace integration
- **Domain Restriction**: @gangerdermatology.com
- **Session Management**: Supabase Auth with 24-hour JWT tokens
- **Security Standards**: HIPAA compliance with audit logging

### **Database & Storage**
- **Primary Database**: Supabase PostgreSQL with Row Level Security
- **File Storage**: Supabase Storage with CDN
- **Caching Layer**: Redis for session and application caching
- **Backup Strategy**: Automated daily backups with point-in-time recovery

### **MCP-Enhanced Development Infrastructure**
**15 Active MCP Servers for Accelerated Development:**

**Core Infrastructure MCP Servers:**
- **Supabase MCP**: Database operations, migrations, edge functions
- **Cloudflare MCP**: Workers deployment, DNS management, analytics
- **Google Cloud Run MCP**: Containerized microservices, auto-scaling
- **Filesystem MCP**: Advanced file operations and build automation

**Medical & Business MCP Servers:**
- **Stripe Agent Toolkit MCP**: Payment processing for medical billing
- **Twilio MCP**: HIPAA-compliant SMS/voice communication
- **Google Sheets MCP**: Real-time spreadsheet operations and data export
- **Time MCP**: Real-time timestamps, timezone management, HIPAA compliance auditing

**Development & Analytics MCP Servers:**
- **Memory MCP**: Knowledge graph-based persistent memory for AI workflows
- **Fetch MCP**: Web content fetching and external API integration
- **ClickHouse MCP**: Advanced analytics and medical data analysis
- **Puppeteer MCP**: Web automation and testing capabilities
- **Trello MCP**: Project management and task tracking integration

**Network Infrastructure MCP Servers:**
- **UniFi Network MCP**: Multi-site network monitoring and management across all 4 medical practice locations

## Development Environment Requirements

### **Prerequisites**
- **Node.js**: 18+ (required for Next.js 14)
- **Docker**: For local Supabase development
- **Git**: Version control with pre-commit hooks
- **VS Code**: Recommended IDE with workspace configuration

### **Environment Configuration**

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:password@localhost:54322/postgres"

# Supabase Configuration
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth & Workspace
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_DOMAIN=gangerdermatology.com

# Cloudflare Configuration
CLOUDFLARE_ZONE_ID=ba76d3d3f41251c49f0365421bd644a5
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf

# UniFi Network Management
UNIFI_SITE_MANAGER_API_KEY=X9HOYp_hBGvczT-f7Yt3xzkbeZ_eiSmi
UNIFI_SITE_MANAGER_URL=https://developer.ui.com/site-manager-api/
UNIFI_NETWORK_CONTROLLER=https://10.1.10.1
UNIFI_ANN_ARBOR_API_KEY=xuqjItbqzMJzJcM8TC9SmS2MdbBXJGN2
UNIFI_PLYMOUTH_API_KEY=dfefdZNMxjoLydgyYkO7BZV-O-FKOnXP
UNIFI_WIXOM_API_KEY=uRu3Bgtq6aJ61ijIzFvY0S2U_ZLhIjph

# UniFi MCP Server Configuration (Community MCP) - Multi-Site Network Access
# CRITICAL: Use iPhone UniFi Authenticator for MFA codes (new code every 30 seconds)
# Strategy: Authenticate to all 4 controllers simultaneously while MFA code is active
UNIFI_HOST=192.168.1.1
UNIFI_USERNAME=anand@gangerdermatology.com
UNIFI_PASSWORD=ganger7072
UNIFI_PORT=443
UNIFI_SITE=default
UNIFI_VERIFY_SSL=false

# Multi-Site Controller Access (All use same username/password + MFA)
UNIFI_MAIN_CONTROLLER=192.168.1.1          # Main/Home - UDM SE
UNIFI_ANN_ARBOR_CONTROLLER=50.238.160.230   # Ann Arbor Practice - UDM Pro
UNIFI_PLYMOUTH_CONTROLLER=50.216.114.162    # Plymouth Practice - UDM Pro  
UNIFI_WIXOM_CONTROLLER=50.238.161.46        # Wixom Practice - UDM Pro

# MFA Authentication Notes:
# - iPhone UniFi Authenticator generates new codes every 30 seconds
# - When provided MFA code, authenticate to ALL controllers quickly while code is active
# - Successful authentication provides 2-hour session cookies for each controller
# - Session cookies stored in /tmp/ for reuse: unifi_cookies.txt, ann_arbor_cookies.txt, 
#   plymouth_cookies.txt, wixom_cookies.txt
```

### **Initial Setup Commands**

```bash
# 1. Clone and Install
git clone https://github.com/acganger/ganger-platform.git
cd ganger-platform

# 2. CRITICAL: Use pnpm for workspace dependency resolution
pnpm install  # Do NOT use npm install

# 3. Start Local Infrastructure
pnpm supabase:start  # Requires Docker

# 4. Verify Environment
pnpm type-check      # Should show "Found 0 errors"
pnpm build          # Should complete successfully

# 5. Start Development
pnpm dev             # Starts all applications
```

## Common Development Commands

### **Quality Verification Commands**
```bash
# TypeScript Compilation (Must pass with 0 errors)
pnpm type-check

# Build Verification (Must complete successfully)  
pnpm build

# Full Quality Gate Check
pnpm pre-commit

# Individual Quality Audits
pnpm audit:package-boundaries
pnpm audit:ui-compliance
pnpm audit:auth-compliance
pnpm audit:performance-budget
pnpm audit:security-compliance
```

### **Development Workflow Commands**
```bash
# Start all applications
pnpm dev

# Start specific applications
pnpm dev:inventory
pnpm dev:handouts
pnpm dev:checkin-kiosk

# Database Operations
pnpm db:generate     # Generate Prisma client
pnpm db:push        # Push schema changes
pnpm db:migrate     # Run migrations

# Supabase Operations
pnpm supabase:start
pnpm supabase:stop
pnpm supabase:status
```

## Deployment and Infrastructure

### **Production Deployment Strategy**
- **Environment**: Cloudflare Workers
- **Build**: Next.js static export optimized for Workers
- **CDN**: Cloudflare global edge network
- **Database**: Supabase with global distribution
- **Monitoring**: Supabase analytics + Cloudflare analytics

### **Domain Configuration**
- **Production URLs**: 
  - Inventory: https://inventory.gangerdermatology.com
  - Handouts: https://handouts.gangerdermatology.com
  - Check-in: https://checkin.gangerdermatology.com
  - EOS L10: https://eos.gangerdermatology.com
  - Medication Auth: https://medication.gangerdermatology.com
  - Pharma Scheduling: https://pharma.gangerdermatology.com

### **Monitoring & Health Checks**
- **Application Monitoring**: Cloudflare Analytics for performance metrics
- **Database Monitoring**: Supabase built-in monitoring for database health
- **Deployment Monitoring**: GitHub Actions for deployment status
- **Error Tracking**: Real-time error reporting with Slack integration

## Troubleshooting Guide

### **Common Issues and Solutions**

**TypeScript Compilation Errors:**
```bash
# First: Check for version mismatches
pnpm ls react @types/react typescript

# Clear TypeScript cache
npx tsc --build --clean

# Remove any app-specific node_modules
rm -rf apps/*/node_modules packages/*/node_modules

# Reinstall with correct versions
pnpm install

# Regenerate types
pnpm db:generate

# Check for circular dependencies
pnpm audit:package-boundaries

# Test that working apps still work
cd apps/eos-l10 && pnpm type-check
```

**Build Failures:**
```bash
# Clear all caches
pnpm clean

# Delete and reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check bundle size violations
pnpm audit:performance-budget
```

**Supabase Connection Issues:**
```bash
# Restart Supabase
pnpm supabase:stop
pnpm supabase:start

# Check Supabase status
pnpm supabase:status

# Reset local database
pnpm supabase:reset
```

**Authentication Problems:**
```bash
# Verify environment variables
echo $GOOGLE_CLIENT_ID
echo $SUPABASE_URL

# Check auth compliance
pnpm audit:auth-compliance

# Test authentication flow
pnpm test:auth
```

---

*This shared infrastructure guide provides the foundation for all Ganger Platform development. For specialized development guidance, see:*

- 📱 **[Frontend Development Guide](./FRONTEND_DEVELOPMENT_GUIDE.md)** - UI components, React patterns, client-side development
- 🔧 **[Backend Development Guide](./BACKEND_DEVELOPMENT_GUIDE.md)** - APIs, database, server-side development, integrations

---
