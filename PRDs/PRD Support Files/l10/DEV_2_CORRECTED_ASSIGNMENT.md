# Dev 2: L10 App Production Migration & Deployment Assignment (CORRECTED)

**Project**: Ninety.io to L10 App Migration - Production Implementation  
**Developer**: Dev 2  
**Priority**: High (Production Ready)  
**Timeline**: 2-3 weeks  
**Branch Strategy**: `feature/l10-production-migration` (branched from Dev 6's work)

**⚠️ CRITICAL PLATFORM COMPLIANCE**: This assignment has been updated to follow the mandatory Ganger Platform specifications from `/true-docs/`.

---

## 📋 Assignment Overview

You are tasked with completing the L10 app for production deployment by implementing comprehensive data migration from ninety.io and deploying via **Cloudflare Workers architecture** (MANDATORY). Dev 6 has completed the core L10 app functionality (80-90% complete), and your role is to finalize the migration, enhance missing features, and deploy to production following platform standards.

**Key Constraint**: Do NOT modify Dev 6's existing polished code unless absolutely necessary for deployment or critical bug fixes.

---

## 🚨 **MANDATORY PLATFORM COMPLIANCE**

### **Cloudflare Workers Architecture (Required)**
Based on `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` and `/true-docs/DEPLOYMENT_GUIDE.md`:

**✅ REQUIRED Configuration:**
```typescript
// next.config.js - MANDATORY for L10 app
const nextConfig = {
  experimental: {
    runtime: 'edge',         // MANDATORY for Workers
  },
  images: {
    unoptimized: true,       // Required for Workers
  },
  // DO NOT include output: 'export' - this breaks Workers
}
```

**✅ REQUIRED wrangler.jsonc:**
```jsonc
{
  "name": "ganger-l10-staff",
  "main": "dist/worker.js",
  "compatibility_date": "2025-01-18",
  "compatibility_flags": ["nodejs_compat"],
  
  "build": {
    "command": "pnpm build && pnpm dlx @cloudflare/next-on-pages"
  },
  
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
```

**❌ FORBIDDEN Patterns:**
- Static export configuration (`output: 'export'`)
- Cloudflare Pages deployment (sunset for Workers routes)
- Individual subdomain deployment (use hybrid routing)

### **Staff Portal Integration (Required)**
```typescript
// ✅ REQUIRED: All L10 app pages must use StaffPortalLayout
import { StaffPortalLayout } from '@ganger/ui/staff';

export default function L10App() {
  return (
    <StaffPortalLayout currentApp="l10">
      {/* L10 app content */}
    </StaffPortalLayout>
  );
}
```

### **Package Dependencies (Required)**
```json
{
  "dependencies": {
    "@ganger/ui": "workspace:*",           // MANDATORY UI components
    "@ganger/auth": "workspace:*",         // MANDATORY authentication
    "@ganger/db": "workspace:*",           // MANDATORY database
    "@ganger/types": "workspace:*",        // MANDATORY types
    "@ganger/utils": "workspace:*",        // MANDATORY utilities
    "@ganger/integrations": "workspace:*"  // MANDATORY external APIs
  }
}
```

---

## 🏗️ Development Strategy (Platform Compliant)

### Branch Management
```bash
# Create your feature branch from Dev 6's latest work
git checkout dev-6-l10-app  # or whatever Dev 6's branch is named
git pull origin dev-6-l10-app
git checkout -b feature/l10-production-migration

# Follow platform development workflow
```

### Platform-Compliant Architecture
1. **Use @ganger/* packages exclusively** - No external UI libraries
2. **Implement StaffPortalLayout** - Required for all staff applications
3. **Deploy via Workers** - No static exports or Pages deployment
4. **Follow hybrid routing** - Deploy as specialized worker in staff portal

---

## 🎯 Primary Objectives (Platform Aligned)

### 1. Production Data Migration (Week 1)
**Goal**: Migrate all ninety.io data using platform standards

#### Tasks:
- [ ] **Deep Data Scraping** - Comprehensive extraction beyond surface-level data
- [ ] **Database Migration** - Execute using @ganger/db patterns
- [ ] **Data Validation** - Verify using platform validation tools
- [ ] **Authentication Setup** - Configure using @ganger/auth/staff

#### Platform Requirements:
- Use `@ganger/db` for all database operations
- Use `@ganger/auth/server` for API authentication
- Follow standard response format for all API endpoints
- Implement proper Row Level Security policies

### 2. Platform-Compliant Deployment (Week 2)
**Goal**: Deploy as Workers to staff.gangerdermatology.com/l10

#### Tasks:
- [ ] **Workers Configuration** - Set up proper wrangler.jsonc
- [ ] **Staff Portal Integration** - Implement StaffPortalLayout
- [ ] **Hybrid Routing Setup** - Deploy as specialized worker
- [ ] **Platform Testing** - Verify health endpoints and compliance

#### Platform Requirements:
- Deploy to staff.gangerdermatology.com/l10 (not l10.gangerdermatology.com)
- Use Workers architecture (NOT static export)
- Implement /health endpoint following platform standards
- Pass all platform quality gates

### 3. Enhanced Features (Week 3)
**Goal**: Add features using platform packages only

#### Tasks:
- [ ] **Advanced V/TO Layouts** - Using @ganger/ui components
- [ ] **File Attachments** - Using Supabase storage integration
- [ ] **Comment System** - Using @ganger/integrations
- [ ] **Platform Integration** - Full staff portal compatibility

---

## 📂 File Structure & Organization (Platform Compliant)

### Your Work Areas (Safe to Modify):
```
apps/eos-l10/
├── migration/                    # NEW - Your migration code
│   ├── scripts/                 # Database migration scripts
│   ├── data-sync/              # Ongoing synchronization tools
│   └── validation/             # Data integrity checks
├── src/
│   ├── components/
│   │   ├── migration/          # NEW - Migration-specific components
│   │   └── enhanced/           # NEW - Enhanced features (using @ganger/ui)
│   ├── lib/
│   │   ├── migration/          # NEW - Migration utilities
│   │   └── ninety-sync/        # NEW - Ninety.io integration
│   └── pages/
│       ├── api/
│       │   └── migration/      # NEW - Migration API endpoints
│       └── admin/              # NEW - Admin/migration pages
├── wrangler.jsonc              # NEW - Workers configuration (REQUIRED)
└── next.config.js              # MODIFY - Add Workers config (REQUIRED)
```

### Platform Integration Requirements:
```typescript
// ✅ REQUIRED: Update layout to use StaffPortalLayout
// apps/eos-l10/src/pages/_app.tsx
import { StaffPortalLayout } from '@ganger/ui/staff';
import { AuthProvider } from '@ganger/auth';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <StaffPortalLayout currentApp="l10">
        <Component {...pageProps} />
      </StaffPortalLayout>
    </AuthProvider>
  );
}

// ✅ REQUIRED: Use platform authentication
// apps/eos-l10/src/lib/auth.tsx
import { useStaffAuth } from '@ganger/auth/staff';
// Remove any custom auth implementations
```

---

## 🔧 Technical Implementation Details (Platform Standards)

### 1. Workers Deployment Configuration

**Required next.config.js:**
```typescript
// apps/eos-l10/next.config.js
const nextConfig = {
  experimental: {
    runtime: 'edge'        // MANDATORY for Workers
  },
  images: {
    unoptimized: true      // Required for Workers compatibility
  }
  // CRITICAL: Do NOT include output: 'export' - breaks Workers
}

module.exports = nextConfig;
```

**Required wrangler.jsonc:**
```jsonc
// apps/eos-l10/wrangler.jsonc
{
  "name": "ganger-l10-staff",
  "main": "dist/worker.js",
  "compatibility_date": "2025-01-18",
  "compatibility_flags": ["nodejs_compat"],
  
  "build": {
    "command": "pnpm build && pnpm dlx @cloudflare/next-on-pages"
  },
  
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },
  
  "vars": {
    "ENVIRONMENT": "production"
  }
}
```

### 2. Database Migration Strategy (Platform Compliant)

```typescript
// migration/scripts/platform-compliant-migration.ts
import { db, Repository } from '@ganger/db';
import { auditLog } from '@ganger/utils/server';

export class PlatformCompliantMigrator {
  async migrateNinetyIoData() {
    // Use @ganger/db exclusively
    const teamRepo = new Repository<Team>('teams');
    const rockRepo = new Repository<Rock>('rocks');
    
    // Follow standard response format
    try {
      const result = await this.performMigration();
      
      // Audit logging requirement
      await auditLog({
        action: 'data_migration',
        resourceId: 'ninety_io_import',
        userId: 'system',
        details: result
      });
      
      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MIGRATION_FAILED',
          message: error.message
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        }
      };
    }
  }
}
```

### 3. Staff Portal Navigation Integration

```typescript
// Update packages/ui/src/staff/StaffPortalLayout.tsx
const STAFF_APPS = [
  // ... existing apps
  {
    name: 'L10 Management',
    path: '/l10',
    icon: L10Icon,
    category: 'Business',
    description: 'EOS Level 10 meetings and quarterly planning'
  }
];
```

---

## 📋 Detailed Task Breakdown (Platform Compliant)

### Phase 1: Platform Migration (Days 1-7)

#### Day 1-2: Platform Setup
```bash
# Tasks:
1. Configure Workers architecture (wrangler.jsonc, next.config.js)
2. Implement StaffPortalLayout integration
3. Replace any external packages with @ganger/* equivalents
4. Set up @ganger/auth authentication

# Verification Commands:
pnpm type-check                    # Must return 0 errors
grep -r "output.*export" .         # Must return no results
grep -r "@ganger" package.json     # Must show platform packages
```

#### Day 3-4: Data Migration (Platform Standards)
```bash
# Tasks:
1. Implement migration using @ganger/db patterns
2. Use standard API response format
3. Implement proper audit logging
4. Follow Row Level Security patterns

# Platform Requirements:
- All database operations via @ganger/db
- Standard response format for APIs
- Audit logging for all data changes
- RLS policies for data security
```

#### Day 5-7: Deployment Configuration
```bash
# Tasks:
1. Configure Workers deployment pipeline
2. Set up health endpoints following platform standards
3. Integrate with staff portal routing
4. Test deployment to staff.gangerdermatology.com/l10

# Verification:
curl -I https://staff.gangerdermatology.com/l10/health  # Must return 200
```

### Phase 2: Platform Compliance (Days 8-14)

#### Day 8-10: Quality Gates Compliance
```bash
# MANDATORY: All quality gates must pass
pnpm type-check              # 0 TypeScript errors required
pnpm lint                    # ESLint compliance
pnpm test                    # All tests must pass
pnpm test:performance        # Performance budget compliance
pnpm audit:ui-compliance     # UI component usage verification
pnpm audit:auth-compliance   # Authentication pattern verification
```

#### Day 11-14: Production Deployment
```bash
# Deploy via platform scripts
npm run deploy:l10-staff     # Deploy L10 worker
npm run deploy:staff-portal-router  # Update router

# Verify platform integration
curl -I https://staff.gangerdermatology.com/l10
```

### Phase 3: Enhanced Features (Days 15-21)

#### Day 15-17: Enhanced Features (Platform Packages Only)
```typescript
// ✅ Use @ganger/ui components exclusively
import {
  Button, Input, DataTable, FileUpload,
  LoadingSpinner, ConfirmDialog
} from '@ganger/ui';

// ✅ Use @ganger/integrations for external APIs
import { UniversalCommunicationHub } from '@ganger/integrations';

// ❌ FORBIDDEN: External packages
// import { Button } from 'react-bootstrap'; // BLOCKED
// import Twilio from 'twilio'; // BLOCKED - use UniversalCommunicationHub
```

---

## 🔍 Quality Assurance Requirements (Platform Standards)

### Mandatory Quality Gates
```bash
# Pre-commit hooks automatically enforce these:
✅ pnpm type-check              # 0 TypeScript errors required
✅ pnpm lint                    # ESLint compliance
✅ pnpm test                    # All tests must pass
✅ pnpm test:performance        # Performance budget compliance
✅ pnpm audit:ui-compliance     # @ganger/ui usage verification
✅ pnpm audit:auth-compliance   # @ganger/auth pattern verification
✅ pnpm audit:package-boundaries # Package import boundary verification
```

### Platform Compliance Verification
```bash
# Workers architecture verification
grep -r "runtime.*edge" next.config.js     # Must find runtime: 'edge'
grep -r "output.*export" next.config.js    # Must return no results
curl -I https://staff.gangerdermatology.com/l10/health  # Must return 200 (not 405)

# Staff portal integration verification
grep -r "StaffPortalLayout" src/            # Must find usage
grep -r "@ganger/ui" package.json          # Must show platform UI

# Package boundary verification
grep -r "react-bootstrap\|antd\|material-ui" package.json  # Must return no results
```

---

## 📊 Success Metrics (Platform Aligned)

### Technical Metrics (Platform Standards)
- **Workers Compliance**: Health endpoint returns 200 (not 405)
- **Package Compliance**: 100% @ganger/* package usage
- **Performance**: <2 second page load times, <500ms API responses
- **Quality Gates**: All automated quality checks pass
- **Staff Portal Integration**: Proper layout and navigation

### Business Metrics
- **User Adoption**: All 5 team members can access via staff.gangerdermatology.com/l10
- **Feature Parity**: 95% of ninety.io functionality available
- **Data Accuracy**: 100% data integrity maintained
- **Platform Integration**: Seamless staff portal experience

---

## 🚨 Critical Platform Constraints

### MUST FOLLOW (Platform Requirements)
- Use @ganger/* packages exclusively for UI, auth, database
- Deploy via Cloudflare Workers (NOT static export or Pages)
- Integrate with StaffPortalLayout for all pages
- Follow hybrid routing architecture (staff.gangerdermatology.com/l10)
- Pass all platform quality gates before deployment

### MUST NOT DO (Platform Violations)
- Use external UI libraries (react-bootstrap, antd, material-ui)
- Use static export configuration (causes 405 errors)
- Deploy to individual subdomain (l10.gangerdermatology.com)
- Bypass platform authentication (@ganger/auth required)
- Skip quality gate requirements

---

## 📞 Platform Resources & Escalation

### Platform Documentation
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Primary reference
- `/true-docs/DEPLOYMENT_GUIDE.md` - Workers deployment standards
- `/true-docs/HYBRID_WORKER_ARCHITECTURE.md` - Routing architecture
- `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md` - UI development standards

### Quality Verification Commands
```bash
# Platform compliance verification
pnpm type-check && pnpm lint && pnpm test
curl -I https://staff.gangerdermatology.com/l10/health
grep -r "@ganger" package.json
```

### Escalation Path
- **Platform Violations**: Reference `/true-docs/` documentation first
- **Quality Gate Failures**: Run verification commands for specific guidance
- **Workers Deployment Issues**: Follow deployment guide templates
- **Staff Portal Integration**: Use existing app patterns

---

## 🎯 Final Deliverable (Platform Compliant)

**Production-ready L10 app deployed at staff.gangerdermatology.com/l10 with:**
- Complete ninety.io data migration using @ganger/db
- All team members authenticated via @ganger/auth/staff
- Enhanced features using @ganger/ui components exclusively
- Workers deployment following platform standards
- Full staff portal integration and navigation
- All platform quality gates passing

**Timeline**: 3 weeks from assignment start date  
**Success Criteria**: Ganger Dermatology team can fully replace ninety.io via staff portal L10 app

---

*This assignment follows the mandatory Ganger Platform specifications from `/true-docs/` and ensures full platform compliance for production deployment.*