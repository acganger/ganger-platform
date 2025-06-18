# ⚙️ Dev 5: Apps 13-16 Migration Assignment

**Developer**: Apps 13-16 Migration Specialist  
**Phase**: 2 - Application Migration (Configuration & Development Tools)  
**Priority**: MEDIUM-HIGH - Development tools and problem resolution  
**Estimated Time**: 16-20 hours  
**Prerequisites**: Dev 1 documentation must be complete

---

## 🎯 **Mission Critical Objective**

Migrate the final 4 applications to the new hybrid routing architecture while **resolving all identified production issues**. These apps include configuration management, development tools, and applications requiring fixes before deployment.

---

## 📋 **Your Applications**

### **App 13: Config Dashboard**
- **Current**: Will be `config.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/config` (staff access only)
- **Status**: ✅ Production Ready with code cleanup recommended (per assessment)
- **Issue**: 50+ ESLint warnings to address (optional, not blocking)

### **App 14: Component Showcase**  
- **Current**: Will be `showcase.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/showcase` (staff access only)
- **Status**: ❌ Needs TypeScript Fix (per assessment)
- **Issue**: **CRITICAL** - Missing `@cloudflare/workers-types` causing build failure

### **App 15: Staff Management**
- **Current**: `staff.gangerdermatology.com` (root domain)
- **New**: `staff.gangerdermatology.com/` (unchanged root)
- **Status**: ❌ Dependency Issue (per assessment)
- **Issue**: **CRITICAL** - Workspace protocol dependency not resolving

### **App 16: Integration Status**
- **Current**: Will be `status.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/status` (staff access only)
- **Status**: ⚠️ Demo Mode Active (per assessment)
- **Issue**: **MAJOR** - Extensive mock components need replacement with real @ganger components

---

## 🔧 **Migration Requirements by App**

### **App 13: Config Dashboard** (`/apps/config-dashboard/`)

#### **Current Status** (from `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`)
- ✅ **Build**: SUCCESS - 129kB bundle
- ⚠️ **Code Quality**: 50+ ESLint warnings to address
- ✅ **Features**: System configuration, user management
- ✅ **Status**: Production Ready (code cleanup recommended)

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/config-dashboard/wrangler.toml
   name = "ganger-config-dashboard"
   route = "config.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-config-staff"
   route = "staff.gangerdermatology.com/config/*"
   ```

2. **Optional: ESLint Cleanup** (Recommended but not blocking)
   ```bash
   cd apps/config-dashboard
   npm run lint -- --fix  # Fix auto-fixable issues
   # Review remaining warnings manually
   ```

3. **Test Configuration Management**
   - Verify user management features work
   - Test system configuration capabilities
   - Ensure security settings function properly

#### **Files to Modify**
- `apps/config-dashboard/wrangler.toml`
- Optional: ESLint cleanup throughout codebase
- Test configuration management features

---

### **App 14: Component Showcase** (`/apps/component-showcase/`)

#### **Current Status** (from assessment)
- ❌ **Build**: FAIL - Missing @cloudflare/workers-types
- **Error**: `Cannot find name 'Fetcher'` and similar TypeScript errors
- **Purpose**: Design system showcase
- **Status**: Needs TypeScript Fix

#### **Migration Tasks - CRITICAL FIX REQUIRED**

1. **Fix TypeScript Dependency Issue FIRST**
   ```bash
   cd apps/component-showcase
   npm install @cloudflare/workers-types --save-dev
   npm run type-check  # Verify fix
   npm run build       # Ensure build succeeds
   ```

2. **Update Wrangler Configuration**
   ```toml
   # Current: apps/component-showcase/wrangler.toml
   name = "ganger-component-showcase"
   route = "showcase.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-showcase-staff"
   route = "staff.gangerdermatology.com/showcase/*"
   ```

3. **Verify Showcase Functionality**
   - Test component library demonstrations
   - Verify design system examples work
   - Ensure development tools function

#### **Files to Modify**
- `apps/component-showcase/package.json` (add dependency)
- `apps/component-showcase/wrangler.toml`
- **CRITICAL**: Fix TypeScript compilation before routing migration

---

### **App 15: Staff Management** (`/apps/staff/`)

#### **Current Status** (from assessment)
- ❌ **Build**: FAIL - Missing Cloudflare Workers types
- **Issue**: Workspace protocol dependency not resolving
- **Status**: Dependency Issue
- **Target Route**: `staff.gangerdermatology.com/` (root of staff portal)

#### **Migration Tasks - CRITICAL FIX REQUIRED**

1. **Fix Workspace Dependency Issue FIRST**
   ```bash
   # From project root
   pnpm install
   
   # OR from app directory
   cd apps/staff
   npm install
   
   # Verify dependencies resolve
   npm run type-check
   npm run build
   ```

2. **Update Wrangler Configuration for Root Route**
   ```toml
   # Current: apps/staff/wrangler.toml
   name = "ganger-staff-management"
   route = "staff.gangerdermatology.com/*"  # Correct, but verify
   
   # Ensure root route handling:
   name = "ganger-staff-root"
   route = "staff.gangerdermatology.com/*"
   ```

3. **Implement Root Landing Page**
   - Create main staff portal landing page
   - Add navigation to all other staff applications
   - Implement role-based access and quick actions

#### **Files to Modify**
- Fix workspace dependencies first
- `apps/staff/wrangler.toml` (verify root route)
- `apps/staff/src/pages/index.tsx` (create staff portal home)

---

### **App 16: Integration Status** (`/apps/integration-status/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - 87.4kB bundle
- ⚠️ **Issue**: Extensive mock components need replacement
- **Problem**: Uses placeholder UI instead of real @ganger components
- **Status**: Demo Mode Active

#### **Migration Tasks - MAJOR COMPONENT REPLACEMENT**

1. **Identify Mock Components**
   ```bash
   cd apps/integration-status
   grep -r "Mock" src/
   grep -r "placeholder" src/
   grep -r "demo" src/
   ```

2. **Replace Mock Components with Real @ganger Components**
   ```typescript
   // Example replacement:
   // OLD (Mock):
   import { MockStatusCard } from '../components/mock/StatusCard';
   
   // NEW (Real):
   import { StatusCard } from '@ganger/ui/components/StatusCard';
   import { useRealTimeStatus } from '@ganger/db/hooks/useStatus';
   ```

3. **Update Wrangler Configuration**
   ```toml
   # Current: apps/integration-status/wrangler.toml
   name = "ganger-integration-status"
   route = "status.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-status-staff"
   route = "staff.gangerdermatology.com/status/*"
   ```

4. **Implement Real Data Integration**
   - Replace mock data with real Supabase queries
   - Connect to actual system monitoring APIs
   - Implement real-time status updates

#### **Files to Modify** (Extensive)
- `apps/integration-status/src/components/*` (replace all mock components)
- `apps/integration-status/src/hooks/*` (implement real data hooks)
- `apps/integration-status/src/lib/*` (real API integrations)
- `apps/integration-status/wrangler.toml`

---

## 🔍 **Quality Assurance Requirements**

### **Testing Checklist for Each App**
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **TypeScript**: `npm run type-check` passes
- [ ] **Routing**: New URLs resolve correctly
- [ ] **Authentication**: Staff routes require Google OAuth
- [ ] **Functionality**: Core features work on new routes
- [ ] **Performance**: Load times under 2 seconds

### **Critical Fix Verification**

#### **Component Showcase TypeScript Fix**
- [ ] **Dependencies**: `@cloudflare/workers-types` installed
- [ ] **TypeScript**: All "Cannot find name" errors resolved
- [ ] **Build**: Successful compilation
- [ ] **Functionality**: Component demonstrations work

#### **Staff Management Dependency Fix**
- [ ] **Workspace Dependencies**: All @ganger/* packages resolve
- [ ] **TypeScript**: Compilation successful
- [ ] **Root Route**: Staff portal landing page functional
- [ ] **Navigation**: Links to all staff applications work

#### **Integration Status Component Replacement**
- [ ] **Mock Removal**: No remaining mock/placeholder components
- [ ] **Real Data**: Actual system status displayed
- [ ] **Real-time Updates**: Live monitoring data
- [ ] **@ganger/ui Integration**: All components from shared library

---

## 📋 **Migration Process**

### **Step 1: Setup (30 minutes)**
1. Read Dev 1's completed documentation in `/true-docs/`
2. Review your app statuses in `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`
3. **CRITICAL**: Understand that 3 of your 4 apps have blocking issues

### **Step 2: App 14 - Component Showcase (3 hours)**
1. **CRITICAL FIX**: Install missing @cloudflare/workers-types
2. Verify TypeScript compilation works
3. Migrate to staff portal routing
4. Test showcase functionality

### **Step 3: App 13 - Config Dashboard (2 hours)**
1. Simple routing migration (working app)
2. Optional: ESLint cleanup (recommended)
3. Test configuration management features
4. Verify user management works

### **Step 4: App 15 - Staff Management (6 hours)**
1. **CRITICAL FIX**: Resolve workspace dependencies
2. Implement staff portal root landing page
3. Create navigation to all staff applications
4. Test authentication and role-based access

### **Step 5: App 16 - Integration Status (8 hours)**
1. **MAJOR WORK**: Replace all mock components
2. Implement real data integration with @ganger packages
3. Connect to actual monitoring APIs
4. Test real-time status updates

### **Step 6: Integration Testing (2 hours)**
1. Test all apps through staff portal routing
2. Verify staff portal root navigation
3. Test cross-app functionality
4. Performance verification

---

## ⚠️ **Critical Success Requirements**

### **Problem Resolution Priority**
1. **Component Showcase**: Must fix TypeScript build errors
2. **Staff Management**: Must resolve workspace dependencies
3. **Integration Status**: Must replace mock components with real functionality
4. **Config Dashboard**: Optional ESLint cleanup

### **Infrastructure Constraints**
- **DO NOT** modify any `@ganger/*` package dependencies when fixing issues
- **DO NOT** change database schemas or environment variables
- **DO NOT** break existing functionality during migration
- **ALWAYS** test builds before committing changes

### **Working Infrastructure to Preserve**
Reference `/CLAUDE.md` for working values:
- All environment variables are working and must not be changed
- @ganger/* packages are compiled and working (per assessment)
- Supabase connection: `https://pfqtzmxxxhhsxmlddrta.supabase.co`

### **Assessment Context**
Your apps are the **final 4** requiring:
- **2 critical TypeScript fixes** (Component Showcase, Staff Management)
- **1 major component replacement** (Integration Status)
- **1 code quality improvement** (Config Dashboard)

---

## 🎯 **Deliverables Checklist**

### **App 13: Config Dashboard**
- [ ] Updated wrangler.toml for staff routing
- [ ] Optional ESLint cleanup completed
- [ ] Configuration management tested
- [ ] User management functionality verified

### **App 14: Component Showcase**
- [ ] **CRITICAL**: @cloudflare/workers-types dependency added
- [ ] TypeScript compilation successful
- [ ] Updated wrangler.toml for staff routing
- [ ] Component showcase functionality tested

### **App 15: Staff Management**
- [ ] **CRITICAL**: Workspace dependencies resolved
- [ ] Staff portal root landing page implemented
- [ ] Navigation to all staff applications working
- [ ] Authentication and role-based access tested

### **App 16: Integration Status**
- [ ] **MAJOR**: All mock components replaced with real @ganger components
- [ ] Real data integration implemented
- [ ] Real-time monitoring functionality working
- [ ] Updated wrangler.toml for staff routing

### **Platform Completion**
- [ ] All 16 applications successfully migrated
- [ ] Staff portal root navigation working
- [ ] All critical issues resolved
- [ ] Platform ready for deployment

---

## 🚨 **Completion Criteria**

Your migration is **COMPLETE** when:

1. **All 4 apps migrated** to hybrid routing architecture
2. **All critical TypeScript issues resolved** (Component Showcase, Staff Management)
3. **All mock components replaced** with real functionality (Integration Status)
4. **Staff portal root navigation implemented** (Staff Management)
5. **All builds successful** with no TypeScript errors
6. **Performance maintained** under 2-second load times

**Success Metric**: Final 4 applications work perfectly, completing the full 16-app platform.

---

**You have the final and most challenging applications. Excellence completes the platform.**

*Assignment created: January 17, 2025*  
*Apps: Config Dashboard, Component Showcase, Staff Management, Integration Status*  
*Status: Ready after Dev 1 completion*