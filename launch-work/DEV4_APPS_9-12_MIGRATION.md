# 🌐 Dev 4: Apps 9-12 Migration Assignment

**Developer**: Apps 9-12 Migration Specialist  
**Phase**: 2 - Application Migration (Platform & Operations Apps)  
**Priority**: HIGH - Platform administration and operations  
**Estimated Time**: 12-16 hours  
**Prerequisites**: Dev 1 documentation must be complete

---

## 🎯 **Mission Critical Objective**

Migrate 4 platform administration and operational applications to the new hybrid routing architecture while resolving all identified production issues. These apps handle social media management, staffing analytics, compliance tracking, and platform administration.

---

## 📋 **Your Applications**

### **App 9: Socials Reviews**
- **Current**: Will be `socials.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/socials` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - works perfectly

### **App 10: Clinical Staffing**  
- **Current**: Will be `staffing.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/staffing` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - drag-and-drop scheduling working

### **App 11: Compliance Training**
- **Current**: Will be `compliance.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/compliance` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - enterprise-grade reporting working

### **App 12: Platform Dashboard**
- **Current**: Will be `dashboard.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/dashboard` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - central management interface working

---

## 🔧 **Migration Requirements by App**

### **App 9: Socials Reviews** (`/apps/socials-reviews/`)

#### **Current Status** (from `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`)
- ✅ **Build**: SUCCESS - 5 routes with studio view
- ✅ **Features**: Review monitoring, social media management
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/socials-reviews/wrangler.toml
   name = "ganger-socials-reviews"
   route = "socials.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-socials-staff"
   route = "staff.gangerdermatology.com/socials/*"
   ```

2. **Preserve Social Media Features**
   - Verify review monitoring dashboard works
   - Test social media management tools
   - Ensure studio view functionality is preserved

3. **Update API Integrations**
   - Verify social media API connections work with new routing
   - Test review aggregation from multiple platforms
   - Ensure notifications and alerts function

#### **Files to Modify**
- `apps/socials-reviews/wrangler.toml`
- `apps/socials-reviews/src/lib/api-config.ts` (if any hardcoded URLs)
- Test social media integrations

#### **Special Note**: 
Located at `/mnt/q/Projects/ganger-platform/apps/socials-reviews/` (your current working directory)

---

### **App 10: Clinical Staffing** (`/apps/clinical-staffing/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - Drag-and-drop scheduling
- ✅ **Features**: Provider scheduling, coverage analytics
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/clinical-staffing/wrangler.toml
   name = "ganger-clinical-staffing"
   route = "staffing.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-staffing-staff"
   route = "staff.gangerdermatology.com/staffing/*"
   ```

2. **Preserve Scheduling Features**
   - Verify drag-and-drop scheduling interface works
   - Test provider assignment and coverage analytics
   - Ensure schedule conflict detection functions

3. **Test Critical Workflows**
   - Provider schedule creation and modification
   - Coverage gap analysis and reporting
   - Integration with existing HR systems

#### **Files to Modify**
- `apps/clinical-staffing/wrangler.toml`
- Test drag-and-drop functionality
- Verify analytics reporting

---

### **App 11: Compliance Training** (`/apps/compliance-training/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - Enterprise-grade dashboard
- ✅ **Features**: Training tracking, compliance monitoring
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/compliance-training/wrangler.toml
   name = "ganger-compliance-training"
   route = "compliance.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-compliance-staff"
   route = "staff.gangerdermatology.com/compliance/*"
   ```

2. **Preserve Enterprise Features**
   - Verify training tracking and progress monitoring
   - Test compliance reporting and certification management
   - Ensure automated reminder and notification systems work

3. **Test Compliance Workflows**
   - Employee training assignment and tracking
   - Certification expiration monitoring
   - Compliance audit report generation

#### **Files to Modify**
- `apps/compliance-training/wrangler.toml`
- Test enterprise reporting features
- Verify certification tracking

---

### **App 12: Platform Dashboard** (`/apps/platform-dashboard/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - 3 pages + API endpoints
- ✅ **Features**: Central hub, drag-and-drop, quick actions
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/platform-dashboard/wrangler.toml
   name = "ganger-platform-dashboard"
   route = "dashboard.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-dashboard-staff"
   route = "staff.gangerdermatology.com/dashboard/*"
   ```

2. **Preserve Platform Management**
   - Verify central hub functionality works
   - Test drag-and-drop dashboard customization
   - Ensure quick actions and shortcuts function

3. **Update Cross-App Links**
   - Update any hardcoded links to other applications
   - Ensure navigation to other staff portal sections works
   - Test platform-wide search and navigation

#### **Files to Modify**
- `apps/platform-dashboard/wrangler.toml`
- `apps/platform-dashboard/src/components/*` (update any hardcoded app URLs)
- Test cross-app navigation

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

#### **Socials Reviews Testing**
- [ ] **Review Monitoring**: Aggregation from multiple platforms works
- [ ] **Social Media Management**: Posting and scheduling functions
- [ ] **Studio View**: Design and content creation tools work
- [ ] **API Integrations**: All social platform connections maintained

#### **Clinical Staffing Testing**
- [ ] **Drag-and-Drop**: Schedule modification interface works
- [ ] **Provider Analytics**: Coverage and availability reporting
- [ ] **Conflict Detection**: Schedule overlap prevention
- [ ] **Integration**: HR system data synchronization

#### **Compliance Training Testing**
- [ ] **Training Tracking**: Employee progress monitoring
- [ ] **Certification Management**: Expiration tracking and renewals
- [ ] **Reporting**: Compliance audit and status reports
- [ ] **Automation**: Reminder and notification systems

#### **Platform Dashboard Testing**
- [ ] **Central Hub**: Overview and quick access functionality
- [ ] **Customization**: Drag-and-drop dashboard configuration
- [ ] **Quick Actions**: Shortcuts to common tasks
- [ ] **Cross-App Navigation**: Links to all staff portal sections

---

## 📋 **Migration Process**

### **Step 1: Setup (30 minutes)**
1. Read Dev 1's completed documentation in `/true-docs/`
2. Review your app statuses in `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`
3. Understand platform administration context

### **Step 2: App 9 - Socials Reviews (3 hours)**
1. Simple routing migration 
2. Update wrangler configuration
3. Test social media API integrations
4. Verify review monitoring functionality

### **Step 3: App 10 - Clinical Staffing (4 hours)**
1. Routing migration with scheduling preservation
2. Test drag-and-drop interface
3. Verify provider analytics
4. Test schedule conflict detection

### **Step 4: App 11 - Compliance Training (4 hours)**
1. Routing migration with enterprise features
2. Test training tracking and certification management
3. Verify compliance reporting
4. Test automated notification systems

### **Step 5: App 12 - Platform Dashboard (4 hours)**
1. Routing migration with cross-app navigation
2. Update hardcoded app URLs to new staff portal paths
3. Test dashboard customization
4. Verify quick actions and platform-wide features

### **Step 6: Integration Testing (2 hours)**
1. Test all apps through staff portal routing
2. Verify cross-app navigation from platform dashboard
3. Test integrated workflows across applications
4. Performance verification

---

## ⚠️ **Critical Success Requirements**

### **Platform Administration Context**
- **Socials Reviews**: Critical for practice reputation management
- **Clinical Staffing**: Essential for provider schedule coordination
- **Compliance Training**: Required for regulatory compliance
- **Platform Dashboard**: Central hub for all staff portal access

### **Infrastructure Constraints**
- **DO NOT** modify any `@ganger/*` package dependencies
- **DO NOT** change database schemas or environment variables
- **DO NOT** break existing functionality during migration
- **ALWAYS** test builds before committing changes

### **Working Infrastructure to Preserve**
Reference `/CLAUDE.md` for working values:
- Supabase connection: `https://pfqtzmxxxhhsxmlddrta.supabase.co`
- Google OAuth: Working with gangerdermatology.com domain
- Social media API integrations: Existing configurations
- All environment variables are working and must not be changed

### **Assessment Context**
Your apps are listed in `/apptest/` as:
- **Production-ready** with no blocking issues
- **Platform administration** tier
- **Essential for operations management**

---

## 🎯 **Deliverables Checklist**

### **App 9: Socials Reviews**
- [ ] Updated wrangler.toml for staff routing
- [ ] Social media API integrations tested
- [ ] Review monitoring functionality verified
- [ ] Studio view and content tools working

### **App 10: Clinical Staffing**
- [ ] Updated wrangler.toml for staff routing
- [ ] Drag-and-drop scheduling interface tested
- [ ] Provider analytics and reporting verified
- [ ] Schedule conflict detection working

### **App 11: Compliance Training**
- [ ] Updated wrangler.toml for staff routing
- [ ] Training tracking and certification management tested
- [ ] Compliance reporting verified
- [ ] Automated notification systems working

### **App 12: Platform Dashboard**
- [ ] Updated wrangler.toml for staff routing
- [ ] Cross-app navigation updated to new staff portal paths
- [ ] Dashboard customization tested
- [ ] Quick actions and platform features verified

### **Integration Verification**
- [ ] All 4 apps accessible via staff portal
- [ ] Cross-app navigation working seamlessly
- [ ] Platform dashboard provides access to all other apps
- [ ] Performance meets requirements (<2 second load times)

---

## 🚨 **Completion Criteria**

Your migration is **COMPLETE** when:

1. **All 4 apps migrated** to hybrid routing architecture
2. **All platform administration features preserved**
3. **Cross-app navigation working** through staff portal
4. **All builds successful** with no TypeScript errors
5. **All integrations verified** (social media, HR systems, compliance)
6. **Performance maintained** under 2-second load times

**Success Metric**: Platform administration and operations work seamlessly on new routing.

---

**Your apps are the control center for platform operations. Precision is essential.**

*Assignment created: January 17, 2025*  
*Apps: Socials Reviews, Clinical Staffing, Compliance Training, Platform Dashboard*  
*Status: Ready after Dev 1 completion*