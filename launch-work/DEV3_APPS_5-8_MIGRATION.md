# 📈 Dev 3: Apps 5-8 Migration Assignment

**Developer**: Apps 5-8 Migration Specialist  
**Phase**: 2 - Application Migration (Advanced Business Apps)  
**Priority**: HIGH - Critical business operations  
**Estimated Time**: 12-16 hours  
**Prerequisites**: Dev 1 documentation must be complete

---

## 🎯 **Mission Critical Objective**

Migrate 4 advanced business applications to the new hybrid routing architecture while resolving all identified production issues. These apps handle critical business workflows and pharmaceutical representative scheduling.

---

## 📋 **Your Applications**

### **App 5: EOS L10**
- **Current**: Will be `l10.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/l10` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - works perfectly with PWA support

### **App 6: Pharma Scheduling**  
- **Current**: `reps.gangerdermatology.com` (single domain)
- **New Dual Access**:
  - `reps.gangerdermatology.com` (pharma rep booking)
  - `staff.gangerdermatology.com/reps` (staff management)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: Need to create dual interface

### **App 7: Call Center Operations**
- **Current**: Will be `phones.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/phones` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - role-based dashboards working

### **App 8: Batch Closeout**
- **Current**: Will be `batch.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/batch` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - protocol-based processing working

---

## 🔧 **Migration Requirements by App**

### **App 5: EOS L10** (`/apps/eos-l10/`)

#### **Current Status** (from `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`)
- ✅ **Build**: SUCCESS - 15 pages with PWA support
- ✅ **Features**: Level 10 meetings, offline support, team collaboration
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/eos-l10/wrangler.toml
   name = "ganger-eos-l10"
   route = "l10.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-l10-staff"
   route = "staff.gangerdermatology.com/l10/*"
   ```

2. **Preserve PWA Functionality**
   - Ensure service worker paths work with new routing
   - Update manifest.json base URL references
   - Test offline support on new route

3. **Update Internal Links**
   - Update any hardcoded L10 URLs in components
   - Verify team collaboration features work

#### **Files to Modify**
- `apps/eos-l10/wrangler.toml`
- `apps/eos-l10/public/manifest.json` (update start_url)
- `apps/eos-l10/src/components/*` (any hardcoded URLs)
- Test PWA installation from staff portal

---

### **App 6: Pharma Scheduling** (`/apps/pharma-scheduling/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - Professional scheduling interface
- ✅ **Features**: TimeTrade replacement, multi-location booking
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks - DUAL INTERFACE REQUIRED**

1. **Create Two Worker Configurations**

   **File**: `apps/pharma-scheduling/wrangler-reps.toml`
   ```toml
   name = "ganger-reps-booking"
   main = "worker-reps.js"
   route = "reps.gangerdermatology.com/*"
   
   [env.production]
   name = "ganger-reps-booking"
   ```

   **File**: `apps/pharma-scheduling/wrangler-staff.toml`
   ```toml
   name = "ganger-reps-staff"  
   main = "worker-staff.js"
   route = "staff.gangerdermatology.com/reps/*"
   
   [env.production]
   name = "ganger-reps-staff"
   ```

2. **Create Two Worker Files**

   **File**: `apps/pharma-scheduling/worker-reps.js`
   ```javascript
   // Pharma Rep Access - Booking focused
   export default {
     async fetch(request) {
       // Serve rep-facing booking interface
       // External authentication (pharma company login)
       // Focus on appointment booking, availability viewing
       // TimeTrade replacement functionality
     }
   }
   ```

   **File**: `apps/pharma-scheduling/worker-staff.js`
   ```javascript
   // Staff Access - Management focused
   export default {
     async fetch(request) {
       // Serve staff management interface
       // Google OAuth authentication required
       // Focus on schedule management, rep approval, analytics
     }
   }
   ```

3. **Interface Differentiation**
   - **Rep Interface**: Clean booking flow, company branding support, mobile optimized
   - **Staff Interface**: Full schedule management, rep vetting, location coordination

#### **Files to Create/Modify**
- `apps/pharma-scheduling/wrangler-reps.toml` (NEW)
- `apps/pharma-scheduling/wrangler-staff.toml` (NEW)
- `apps/pharma-scheduling/worker-reps.js` (NEW)
- `apps/pharma-scheduling/worker-staff.js` (NEW)
- `apps/pharma-scheduling/src/components/RepBookingInterface.tsx` (NEW)
- `apps/pharma-scheduling/src/components/StaffManagementInterface.tsx` (NEW)

---

### **App 7: Call Center Operations** (`/apps/call-center-ops/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - 8 routes with role-based dashboards
- ✅ **Features**: Agent/supervisor/manager dashboards, 3CX integration
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/call-center-ops/wrangler.toml
   name = "ganger-call-center"
   route = "phones.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-phones-staff"
   route = "staff.gangerdermatology.com/phones/*"
   ```

2. **Preserve Role-Based Access**
   - Verify agent/supervisor/manager dashboards work
   - Test 3CX integration on new route
   - Ensure real-time call monitoring functions

3. **Update 3CX Integration**
   - Verify webhook URLs point to new route
   - Test call logging and analytics
   - Ensure dashboard real-time updates work

#### **Files to Modify**
- `apps/call-center-ops/wrangler.toml`
- `apps/call-center-ops/src/lib/3cx-integration.ts` (update webhook URLs)
- Test role-based dashboard access

---

### **App 8: Batch Closeout** (`/apps/batch-closeout/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - Protocol-based processing
- ✅ **Features**: Financial reconciliation, batch tracking
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/batch-closeout/wrangler.toml
   name = "ganger-batch-closeout"
   route = "batch.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-batch-staff"
   route = "staff.gangerdermatology.com/batch/*"
   ```

2. **Preserve Financial Processing**
   - Verify batch upload and processing works
   - Test financial reconciliation features
   - Ensure protocol-based processing functions

3. **Test Critical Workflows**
   - Daily batch closeout process
   - Financial reporting generation
   - Error handling and recovery

#### **Files to Modify**
- `apps/batch-closeout/wrangler.toml`
- Test financial processing workflows
- Verify batch upload functionality

---

## 🔍 **Quality Assurance Requirements**

### **Testing Checklist for Each App**
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **TypeScript**: `npm run type-check` passes
- [ ] **Routing**: New URLs resolve correctly
- [ ] **Authentication**: Staff routes require Google OAuth
- [ ] **Functionality**: Core features work on new routes
- [ ] **Performance**: Load times under 2 seconds

### **Special Testing Requirements**

#### **EOS L10 PWA Testing**
- [ ] **Service Worker**: Functions correctly on new route
- [ ] **Offline Support**: App works without internet
- [ ] **Installation**: PWA installs from staff portal
- [ ] **Manifest**: Start URL points to new route

#### **Pharma Scheduling Dual Interface**
- [ ] **Rep Access**: External booking works without staff authentication
- [ ] **Staff Access**: Management interface requires Google OAuth
- [ ] **TimeTrade Parity**: All original TimeTrade features work
- [ ] **Multi-location**: Booking supports all practice locations

#### **Call Center 3CX Integration**
- [ ] **Webhook URLs**: Point to new routing
- [ ] **Real-time Data**: Dashboard updates in real-time
- [ ] **Role Access**: Agent/supervisor/manager permissions work
- [ ] **Call Logging**: Integration captures all call data

#### **Batch Closeout Financial Processing**
- [ ] **File Upload**: Batch files upload correctly
- [ ] **Processing**: Financial reconciliation completes
- [ ] **Reporting**: Generated reports are accurate
- [ ] **Error Handling**: Failed batches handled gracefully

---

## 📋 **Migration Process**

### **Step 1: Setup (30 minutes)**
1. Read Dev 1's completed documentation in `/true-docs/`
2. Review your app statuses in `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`
3. Understand business-critical nature of these applications

### **Step 2: App 5 - EOS L10 (2 hours)**
1. Simple routing migration with PWA preservation
2. Update wrangler configuration
3. Test PWA functionality and offline support
4. Verify team collaboration features

### **Step 3: App 7 - Call Center Ops (3 hours)**
1. Routing migration with 3CX integration
2. Update webhook URLs for new route
3. Test role-based dashboard access
4. Verify real-time call monitoring

### **Step 4: App 8 - Batch Closeout (3 hours)**
1. Simple routing migration
2. Test financial processing workflows
3. Verify batch upload and reconciliation
4. Test error handling and recovery

### **Step 5: App 6 - Pharma Scheduling (6 hours)**
1. **COMPLEX**: Create dual interface (rep booking + staff management)
2. Implement external rep access and staff admin
3. Preserve all TimeTrade replacement functionality
4. Test multi-location booking workflow

### **Step 6: Integration Testing (2 hours)**
1. Test all apps through staff portal routing
2. Verify pharma scheduling external access
3. Test cross-app navigation
4. Performance verification

---

## ⚠️ **Critical Success Requirements**

### **Business-Critical Applications**
- **EOS L10**: Essential for weekly team meetings and goal tracking
- **Pharma Scheduling**: Replaces $thousands/year TimeTrade subscription
- **Call Center Ops**: Critical for patient communication workflows
- **Batch Closeout**: Essential for daily financial operations

### **Infrastructure Constraints**
- **DO NOT** modify any `@ganger/*` package dependencies
- **DO NOT** change database schemas or environment variables
- **DO NOT** break existing functionality during migration
- **ALWAYS** test builds before committing changes

### **Working Infrastructure to Preserve**
Reference `/CLAUDE.md` for working values:
- Supabase connection: `https://pfqtzmxxxhhsxmlddrta.supabase.co`
- Google OAuth: Working with gangerdermatology.com domain
- 3CX Integration: Existing webhook configurations
- All environment variables are working and must not be changed

### **Assessment Context**
Your apps are listed in `/apptest/` as:
- **Production-ready** with no blocking issues
- **Advanced business applications** tier
- **Critical for daily operations**

---

## 🎯 **Deliverables Checklist**

### **App 5: EOS L10**
- [ ] Updated wrangler.toml for staff routing
- [ ] PWA functionality preserved
- [ ] Service worker and manifest updated
- [ ] Team collaboration tested

### **App 6: Pharma Scheduling** 
- [ ] Dual wrangler configurations created
- [ ] Rep booking and staff management interfaces implemented
- [ ] TimeTrade feature parity maintained
- [ ] Multi-location booking tested

### **App 7: Call Center Operations**
- [ ] Updated wrangler.toml for staff routing
- [ ] 3CX integration webhook URLs updated
- [ ] Role-based dashboard access verified
- [ ] Real-time monitoring tested

### **App 8: Batch Closeout**
- [ ] Updated wrangler.toml for staff routing
- [ ] Financial processing workflows tested
- [ ] Batch upload and reconciliation verified
- [ ] Error handling confirmed

### **Integration Verification**
- [ ] All 4 apps accessible via staff portal
- [ ] Pharma scheduling external domain works
- [ ] Cross-app navigation tested
- [ ] Performance meets requirements (<2 second load times)

---

## 🚨 **Completion Criteria**

Your migration is **COMPLETE** when:

1. **All 4 apps migrated** to hybrid routing architecture
2. **All business-critical features preserved** (PWA, 3CX, financial processing)
3. **Pharma scheduling dual interface working** with external rep access
4. **All builds successful** with no TypeScript errors
5. **All integrations verified** (3CX webhooks, financial processing)
6. **Performance maintained** under 2-second load times

**Success Metric**: All business operations continue seamlessly on new routing.

---

**Your apps power critical business workflows. Downtime is not acceptable.**

*Assignment created: January 17, 2025*  
*Apps: EOS L10, Pharma Scheduling, Call Center Ops, Batch Closeout*  
*Status: Ready after Dev 1 completion*