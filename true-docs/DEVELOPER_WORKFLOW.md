# 👨‍💻 Ganger Platform - Developer Workflow Guide

**Status**: ✅ **PRODUCTION WORKFLOW** - Step-by-step implementation guide  
**Last Updated**: January 17, 2025  
**Dependencies**: Platform assessment findings from `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`  
**Prerequisites**: Architecture documentation in `/true-docs/ROUTING_ARCHITECTURE.md`

---

## 🚨 **CRITICAL: Pre-Migration Requirements**

Before starting ANY application migration, developers MUST complete these validation steps based on the comprehensive platform assessment findings.

### **Platform Assessment Reference**

**REQUIRED READING:**
- **Platform Status**: `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md` - Current app status and issues
- **Deployment Readiness**: `/apptest/PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Infrastructure verification
- **Business Requirements**: `/apptest/EXECUTIVE_SUMMARY.md` - ROI justification and priorities

### **Infrastructure Validation Checklist**

```bash
# 1. Verify Working Infrastructure (from /CLAUDE.md)
echo "Testing Supabase connection..."
curl -I https://pfqtzmxxxhhsxmlddrta.supabase.co

echo "Testing Cloudflare API access..."
curl -H "Authorization: Bearer TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf" \
  "https://api.cloudflare.com/client/v4/zones/ba76d3d3f41251c49f0365421bd644a5"

echo "Testing Google OAuth configuration..."
# Verify client ID: 745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com

# 2. Verify Package Dependencies (CRITICAL: Use pnpm only)
pnpm type-check
# Expected: "Found 0 errors" across all packages

# 3. Verify Platform Assessment Findings
# 13 out of 17 applications are production-ready
# 100% infrastructure readiness confirmed
# 76% immediate deployment readiness
```

### **Current Application Status Matrix**

Based on `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`:

```
┌─────────────────────────────┬──────────────────┬─────────────────────────┐
│ Application                 │ Status           │ Issues to Resolve      │
├─────────────────────────────┼──────────────────┼─────────────────────────┤
│ ✅ Inventory               │ Production Ready │ None                    │
│ ✅ Handouts                │ Production Ready │ None                    │
│ ✅ Check-in Kiosk          │ Production Ready │ None                    │
│ ⚠️ Medication Auth         │ Minor Issues     │ Remove export mode     │
│ ✅ EOS L10                 │ Production Ready │ None                    │
│ ✅ Pharma Scheduling       │ Production Ready │ None                    │
│ ✅ Call Center Ops         │ Production Ready │ None                    │
│ ✅ Batch Closeout          │ Production Ready │ None                    │
│ ✅ Socials Reviews         │ Production Ready │ None                    │
│ ✅ Clinical Staffing       │ Production Ready │ None                    │
│ ✅ Compliance Training     │ Production Ready │ None                    │
│ ✅ Platform Dashboard      │ Production Ready │ None                    │
│ ⚠️ Config Dashboard       │ Minor Issues     │ ESLint cleanup          │
│ ❌ Component Showcase      │ TypeScript Errors│ Missing @cloudflare/... │
│ ❌ Staff Management        │ Dependency Issue │ Workspace resolution    │
│ ❌ Integration Status      │ Mock Components  │ Replace MockChart       │
└─────────────────────────────┴──────────────────┴─────────────────────────┘
```

---

## 📋 **Step-by-Step Migration Process**

### **Phase 1: Pre-Migration Setup (Required for All)**

**1. Verify Development Environment**
```bash
# Clone repository if not already done
git clone https://github.com/acganger/ganger-platform.git
cd ganger-platform

# CRITICAL: Use pnpm exclusively (never npm)
pnpm install

# Verify all shared packages compile
pnpm type-check

# Start local Supabase for development
pnpm supabase:start
```

**2. Read Required Documentation**
```bash
# MANDATORY reading before starting any migration
cat /true-docs/ROUTING_ARCHITECTURE.md          # Understand hybrid routing
cat /true-docs/HYBRID_WORKER_ARCHITECTURE.md    # Understand worker patterns
cat /apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md # Know current app status
```

**3. Understand Application Assignment**
- **Dev 2**: Apps 1-4 (Core Medical) - Review dual interface requirements
- **Dev 3**: Apps 5-8 (Business Operations) - Preserve PWA/3CX integrations
- **Dev 4**: Apps 9-12 (Platform Administration) - Cross-app navigation focus
- **Dev 5**: Apps 13-16 (Configuration/Development) - Fix critical TypeScript issues

### **Phase 2: Individual Application Migration**

**For Each Assigned Application:**

#### **Step 1: Application Analysis**
```bash
# Navigate to your assigned application
cd apps/[your-app-name]

# Analyze current status
pnpm type-check
# Document any TypeScript errors found

pnpm build
# Document any build issues found

# Review assessment findings for this app
grep -A 10 -B 5 "[your-app-name]" /apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md
```

#### **Step 2: Determine Interface Type**

**A. Staff-Only Applications (Most Apps)**
```typescript
// Standard staff application pattern
'use client'

import { StaffPortalLayout } from '@ganger/ui/staff';
import { useStaffAuth } from '@ganger/auth/staff';

export default function YourStaffApp() {
  const { user, isAuthenticated } = useStaffAuth();
  
  if (!isAuthenticated) {
    return <StaffLoginRedirect appName="your-app" />;
  }
  
  return (
    <StaffPortalLayout currentApp="your-app">
      <main className="staff-app-content">
        {/* Your app content here */}
      </main>
    </StaffPortalLayout>
  );
}
```

**B. Dual-Interface Applications (4 Apps: Handouts, Kiosk, Meds, Pharma)**
```bash
# Create both staff and external interfaces
mkdir -p src/staff src/external

# Staff interface (staff.gangerdermatology.com/app-path)
touch src/staff/staff-app.tsx
touch src/staff/wrangler-staff.jsonc

# External interface (app.gangerdermatology.com)
touch src/external/external-app.tsx  
touch src/external/wrangler-external.jsonc
```

#### **Step 3: Create Worker Configurations**

**A. Staff Worker Configuration**
```bash
# Copy template and customize
cp /true-docs/templates/staff-app-wrangler.toml ./wrangler-staff.jsonc

# Replace template variables:
# {APP_NAME} = your-app-staff
# {APP_PATH} = your-app
# {DESCRIPTION} = Your App Description
```

**B. External Worker Configuration (if dual interface)**
```bash
# Copy template and customize
cp /true-docs/templates/external-domain-wrangler.toml ./wrangler-external.jsonc

# Replace template variables:
# {APP_NAME} = your-app-patient/booking
# {DOMAIN} = your-app
# {DESCRIPTION} = External Interface Description
```

#### **Step 4: Implement Required Integration**

**Staff Portal Integration (MANDATORY for all staff apps):**
```typescript
// src/staff/app.tsx
'use client'

import { StaffPortalLayout, StaffPortalNav } from '@ganger/ui/staff';
import { useStaffAuth } from '@ganger/auth/staff';
import { Button, Card, DataTable } from '@ganger/ui';

export default function YourStaffApp() {
  const { user, isAuthenticated, permissions } = useStaffAuth();
  
  if (!isAuthenticated) {
    return <StaffLoginRedirect appName="your-app" />;
  }
  
  return (
    <StaffPortalLayout currentApp="your-app">
      <StaffPortalNav 
        currentApp="your-app"
        userRole={user.role}
        availableApps={permissions.apps}
      />
      
      <main className="staff-app-content">
        <h1>Your App Name</h1>
        {/* Implement your app functionality */}
      </main>
    </StaffPortalLayout>
  );
}
```

#### **Step 5: Resolve Identified Issues**

**Based on Platform Assessment Findings:**

**For Apps with TypeScript Errors:**
```bash
# Component Showcase - Missing @cloudflare/workers-types
cd apps/component-showcase
pnpm add -D @cloudflare/workers-types
pnpm type-check
```

**For Apps with Dependency Issues:**
```bash
# Staff Management - Workspace dependency resolution
cd apps/staff
rm -rf node_modules
pnpm install
pnpm type-check
```

**For Apps with Mock Components:**
```bash
# Integration Status - Replace MockChart components
cd apps/integration-status
# Replace all instances of MockChart with real chart components
sed -i 's/MockChart/Chart/g' src/**/*.tsx
```

**For Apps with Configuration Issues:**
```bash
# Medication Auth - Remove export mode for API functionality
cd apps/medication-auth
# Update next.config.js to remove static export mode
```

#### **Step 6: Testing and Validation**

**Local Development Testing:**
```bash
# Test staff interface locally
cd apps/[your-app]
pnpm dev

# Verify at http://localhost:3001 (or assigned port)
# Test authentication flow
# Test staff portal navigation
# Test core functionality
```

**Build Verification:**
```bash
# Verify production build works
pnpm build

# Check bundle size (target: <500KB)
npx bundlesize

# Verify TypeScript compilation
pnpm type-check
```

**Integration Testing:**
```bash
# Test with staff portal router (if available)
npm run dev:staff-portal

# Test cross-app navigation
# Verify authentication flows
# Test dual interfaces (if applicable)
```

---

## 🔧 **Testing Requirements for Dual Interfaces**

### **Dual Interface Applications Testing Protocol**

**Apps Requiring Dual Interface Testing:**
1. **Handouts Generator** (Patient access + Staff admin)
2. **Check-in Kiosk** (Patient touch + Staff monitoring)
3. **Medication Authorization** (Patient portal + Staff management)
4. **Pharma Scheduling** (Rep booking + Staff admin)

**Required Test Scenarios:**

#### **1. Staff Interface Testing**
```bash
# Test staff authentication
curl -I https://staff.gangerdermatology.com/your-app
# Should redirect to Google OAuth for unauthenticated users

# Test staff functionality
# - Full CRUD operations
# - Administrative features
# - Cross-app navigation
# - Role-based permissions
```

#### **2. External Interface Testing**
```bash
# Test external access (no authentication required)
curl -I https://your-app.gangerdermatology.com
# Should serve patient/rep interface directly

# Test external functionality
# - Patient/rep specific features
# - No staff functions visible
# - No administrative access
# - Mobile-optimized interface
```

#### **3. Cross-Interface Data Flow Testing**
```bash
# Verify data changes in staff interface appear in external interface
# Test workflow: Staff creates → Patient accesses
# Test security: External cannot access staff data
# Test performance: Both interfaces meet load time targets
```

---

## 🚀 **Deployment Verification Steps**

### **Individual Application Deployment**

**Step 1: Pre-Deployment Verification**
```bash
# Verify all issues from assessment are resolved
pnpm type-check
# Expected: "Found 0 errors"

pnpm build
# Expected: Successful build

# Test locally one final time
pnpm dev
```

**Step 2: Deploy to Cloudflare Workers**
```bash
# Deploy staff worker
npm run deploy:your-app-staff

# Deploy external worker (if dual interface)
npm run deploy:your-app-external

# Verify deployment
curl -I https://ganger-your-app-staff.workers.dev/health
```

**Step 3: Integration with Platform Router**
```bash
# Once ALL applications are deployed, test routing
curl -I https://staff.gangerdermatology.com/your-app

# Should route correctly to your deployed worker
# Should maintain authentication across apps
# Should preserve session state
```

### **Platform-Wide Verification**

**After ALL developers complete their assignments:**

```bash
# Test complete platform health
npm run test:platform-health

# Verify all 16 staff routes work
STAFF_ROUTES=("/" "/inventory" "/handouts" "/kiosk" "/meds" "/l10" "/reps" "/phones" "/batch" "/socials" "/staffing" "/compliance" "/dashboard" "/config" "/showcase" "/status")

for route in "${STAFF_ROUTES[@]}"; do
  echo "Testing staff.gangerdermatology.com$route"
  curl -I "https://staff.gangerdermatology.com$route"
done

# Verify all 4 external domains work
EXTERNAL_DOMAINS=("handouts" "kiosk" "meds" "reps")

for domain in "${EXTERNAL_DOMAINS[@]}"; do
  echo "Testing $domain.gangerdermatology.com"
  curl -I "https://$domain.gangerdermatology.com"
done
```

---

## 🔄 **Rollback Procedures**

### **Individual Application Rollback**

**If an application deployment fails:**
```bash
# Rollback individual worker
wrangler rollback --env production ganger-your-app-staff

# Verify rollback success
curl -I https://ganger-your-app-staff.workers.dev/health

# Update team on rollback status
# Fix issues in development
# Redeploy when ready
```

### **Platform-Wide Rollback**

**If platform routing fails:**
```bash
# Emergency rollback procedure
npm run rollback:platform

# This will:
# 1. Rollback staff portal router
# 2. Rollback all external domains
# 3. Restore previous working state
# 4. Notify team of rollback status
```

---

## ⚠️ **Critical Success Requirements**

### **Zero-Tolerance Violations**

**NEVER do these actions:**
- ❌ Modify working infrastructure values in `/CLAUDE.md`
- ❌ Use npm instead of pnpm for package management
- ❌ Deploy with TypeScript compilation errors
- ❌ Break existing functionality during migration
- ❌ Sanitize or replace working environment variables
- ❌ Create individual subdomain deployments

### **Mandatory Quality Gates**

**Before marking any application complete:**
- [ ] TypeScript compilation: 0 errors
- [ ] Production build: Successful completion
- [ ] Platform assessment issues: All resolved
- [ ] Staff portal integration: Working navigation
- [ ] Authentication flow: Google OAuth functional
- [ ] Dual interfaces: Both working independently (if applicable)
- [ ] Cross-app navigation: Seamless transitions
- [ ] Performance targets: <2s load time, <500KB bundle

### **Team Coordination Requirements**

**Communication Protocol:**
- **Daily standups**: Report progress and blockers
- **Immediate escalation**: Infrastructure or dependency issues
- **Cross-team coordination**: Shared component usage
- **Pre-deployment verification**: Test builds before deploying
- **Post-deployment confirmation**: Verify functionality after deployment

---

## 📊 **Success Metrics and Validation**

### **Individual Application Success**

**Technical Success Criteria:**
- Application builds successfully with 0 TypeScript errors
- Application integrates with staff portal navigation
- Authentication flows correctly (staff apps)
- External access works independently (dual interface apps)
- Performance meets targets (<2s load, <500KB bundle)

**Business Success Criteria:**
- All identified issues from platform assessment resolved
- Core functionality preserved and enhanced
- User experience improved through unified interface
- Security maintained with proper access controls

### **Platform-Wide Success**

**Complete Platform Success:**
- All 16 staff applications accessible via staff.gangerdermatology.com
- All 4 external domains providing patient/rep access
- Cross-app navigation working seamlessly
- Authentication sharing across all staff applications
- Performance targets met across entire platform

**Deployment Success Metrics:**
- Zero critical security vulnerabilities
- >99.9% uptime in first 24 hours
- <2 second average page load time
- >95% authentication success rate
- Zero data loss during migration

---

## 📚 **Reference Documentation**

### **Architecture References**
- **Routing Architecture**: `/true-docs/ROUTING_ARCHITECTURE.md`
- **Worker Implementation**: `/true-docs/HYBRID_WORKER_ARCHITECTURE.md`
- **Deployment Procedures**: `/true-docs/DEPLOYMENT_GUIDE.md`
- **Frontend Integration**: `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md`

### **Platform Assessment References**
- **Current App Status**: `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`
- **Deployment Readiness**: `/apptest/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Business Requirements**: `/apptest/EXECUTIVE_SUMMARY.md`

### **Template References**
- **Wrangler Configurations**: `/true-docs/templates/`
- **Package.json Scripts**: `/true-docs/templates/package-json-scripts.json`
- **GitHub Actions Workflow**: `/true-docs/templates/github-actions-workflow.yml`

### **Infrastructure References**
- **Working Configuration**: `/CLAUDE.md` (use exact values, never sanitize)
- **Environment Variables**: All working values documented and verified
- **Security Policy**: Follow medical platform HIPAA compliance

---

**This workflow ensures successful migration of all 16 applications to the hybrid routing architecture while maintaining medical platform reliability and security standards.**

*Developer Workflow Guide*  
*Created: January 17, 2025*  
*Based on: Comprehensive platform assessment findings*  
*Status: Ready for immediate developer implementation*