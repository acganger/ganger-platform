# 📦 Dev 2: Apps 1-4 Migration Assignment

**Developer**: Apps 1-4 Migration Specialist  
**Phase**: 2 - Application Migration (Core Medical Apps)  
**Priority**: HIGH - Core medical functionality  
**Estimated Time**: 12-16 hours  
**Prerequisites**: Dev 1 documentation must be complete

---

## 🎯 **Mission Critical Objective**

Migrate 4 core medical applications to the new hybrid routing architecture while resolving all identified production issues. These are the most critical apps for daily medical operations and must be **perfect** before deployment.

---

## 📋 **Your Applications**

### **App 1: Inventory Management**
- **Current**: Will be `inventory.gangerdermatology.com` (deprecated)
- **New**: `staff.gangerdermatology.com/inventory` (staff access only)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: None - works perfectly

### **App 2: Handouts Generator**  
- **Current**: `handouts.gangerdermatology.com` (single domain)
- **New Dual Access**:
  - `handouts.gangerdermatology.com` (patient access)
  - `staff.gangerdermatology.com/handouts` (staff admin)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: Need to create dual interface

### **App 3: Check-in Kiosk**
- **Current**: `kiosk.gangerdermatology.com` (single domain)  
- **New Dual Access**:
  - `kiosk.gangerdermatology.com` (patient touch interface)
  - `staff.gangerdermatology.com/kiosk` (staff monitoring)
- **Status**: ✅ Production Ready (per assessment)
- **Issue**: Need to create dual interface

### **App 4: Medication Authorization**
- **Current**: `meds.gangerdermatology.com` (single domain)
- **New Dual Access**:
  - `meds.gangerdermatology.com` (patient portal)
  - `staff.gangerdermatology.com/meds` (staff management)
- **Status**: ✅ Production Ready with config note (per assessment)
- **Issue**: Remove `output: 'export'` for full API functionality

---

## 🔧 **Migration Requirements by App**

### **App 1: Inventory Management** (`/apps/inventory/`)

#### **Current Status** (from `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`)
- ✅ **Build**: SUCCESS - Static export with 86.8kB shared JS
- ✅ **Features**: Supply tracking, barcode scanning, real-time stock management
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks**
1. **Update Wrangler Configuration**
   ```toml
   # Current: apps/inventory/wrangler.toml
   name = "ganger-inventory"
   route = "inventory.gangerdermatology.com/*"  # ❌ DEPRECATED
   
   # Update to:
   name = "ganger-inventory-staff"
   route = "staff.gangerdermatology.com/inventory/*"
   ```

2. **Update Package.json Scripts**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && wrangler deploy --env production",
       "deploy:staff": "npm run build && wrangler deploy --config wrangler-staff.toml --env production"
     }
   }
   ```

3. **Test Routing**
   - Verify `staff.gangerdermatology.com/inventory` loads correctly
   - Test barcode scanning functionality
   - Verify real-time stock management works

#### **Files to Modify**
- `apps/inventory/wrangler.toml`
- `apps/inventory/package.json` 
- Test deployment with new routing

---

### **App 2: Handouts Generator** (`/apps/handouts/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - 8 pages generated, PDF capabilities
- ✅ **Features**: PDF generation, QR codes, digital delivery
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks - DUAL INTERFACE REQUIRED**

1. **Create Two Worker Configurations**

   **File**: `apps/handouts/wrangler-patient.toml`
   ```toml
   name = "ganger-handouts-patient"
   main = "worker-patient.js"
   route = "handouts.gangerdermatology.com/*"
   
   [env.production]
   name = "ganger-handouts-patient"
   ```

   **File**: `apps/handouts/wrangler-staff.toml`
   ```toml
   name = "ganger-handouts-staff"  
   main = "worker-staff.js"
   route = "staff.gangerdermatology.com/handouts/*"
   
   [env.production]
   name = "ganger-handouts-staff"
   ```

2. **Create Two Worker Files**

   **File**: `apps/handouts/worker-patient.js`
   ```javascript
   // Patient Access - Limited to viewing/downloading handouts
   export default {
     async fetch(request) {
       // Serve patient-facing interface
       // No authentication required
       // Focus on QR code scanning, PDF access
     }
   }
   ```

   **File**: `apps/handouts/worker-staff.js`
   ```javascript
   // Staff Access - Full admin capabilities
   export default {
     async fetch(request) {
       // Serve staff admin interface
       // Google OAuth authentication required
       // Focus on creation, editing, distribution management
     }
   }
   ```

3. **Update Application Logic**
   - Create patient vs staff interface components
   - Implement different permission levels
   - Test both access patterns

#### **Files to Create/Modify**
- `apps/handouts/wrangler-patient.toml` (NEW)
- `apps/handouts/wrangler-staff.toml` (NEW)
- `apps/handouts/worker-patient.js` (NEW)
- `apps/handouts/worker-staff.js` (NEW)
- `apps/handouts/src/components/PatientInterface.tsx` (NEW)
- `apps/handouts/src/components/StaffInterface.tsx` (NEW)

---

### **App 3: Check-in Kiosk** (`/apps/checkin-kiosk/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - Kiosk-optimized interface
- ✅ **Features**: Patient check-in, payment processing, touch interface
- ✅ **Status**: Ready for immediate deployment

#### **Migration Tasks - DUAL INTERFACE REQUIRED**

1. **Create Two Worker Configurations**

   **File**: `apps/checkin-kiosk/wrangler-patient.toml`
   ```toml
   name = "ganger-kiosk-patient"
   main = "worker-patient.js"
   route = "kiosk.gangerdermatology.com/*"
   
   [env.production]
   name = "ganger-kiosk-patient"
   ```

   **File**: `apps/checkin-kiosk/wrangler-staff.toml`
   ```toml
   name = "ganger-kiosk-admin"
   main = "worker-staff.js"
   route = "staff.gangerdermatology.com/kiosk/*"
   
   [env.production]
   name = "ganger-kiosk-admin"
   ```

2. **Interface Differentiation**
   - **Patient Interface**: Touch-optimized, simplified UI, payment processing
   - **Staff Interface**: Monitoring dashboard, session management, troubleshooting

#### **Files to Create/Modify**
- `apps/checkin-kiosk/wrangler-patient.toml` (NEW)
- `apps/checkin-kiosk/wrangler-staff.toml` (NEW)
- Update worker files for dual interface
- Create patient vs staff components

---

### **App 4: Medication Authorization** (`/apps/medication-auth/`)

#### **Current Status** (from assessment)
- ✅ **Build**: SUCCESS - 16 API routes, AI integration
- ⚠️ **Issue**: Remove `output: 'export'` for full API functionality
- ✅ **Features**: AI-powered authorization, HIPAA compliance

#### **Migration Tasks - DUAL INTERFACE + FIX REQUIRED**

1. **Fix Configuration Issue FIRST**
   
   **File**: `apps/medication-auth/next.config.js`
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     // REMOVE THIS LINE - blocks API routes
     // output: 'export',  ❌ DELETE THIS
     
     // Keep these
     eslint: { ignoreDuringBuilds: true },
     typescript: { ignoreDuringBuilds: true }
   }
   ```

2. **Create Dual Interface**
   - **Patient Portal**: Prior auth requests, status tracking, document upload
   - **Staff Interface**: Auth review, AI assistance, approval workflow

3. **Test API Functionality**
   - Verify all 16 API routes work after removing export mode
   - Test AI integration
   - Verify HIPAA compliance features

#### **Files to Modify**
- `apps/medication-auth/next.config.js` (CRITICAL FIX)
- Create dual worker configuration
- Test API routes functionality

---

## 🔍 **Quality Assurance Requirements**

### **Testing Checklist for Each App**
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **TypeScript**: `npm run type-check` passes
- [ ] **Routing**: New URLs resolve correctly
- [ ] **Authentication**: Staff routes require Google OAuth
- [ ] **Functionality**: Core features work on new routes
- [ ] **Performance**: Load times under 2 seconds

### **Dual Interface Apps Testing**
- [ ] **Patient Access**: Works without authentication
- [ ] **Staff Access**: Requires authentication, has admin features
- [ ] **Interface Separation**: Different UI/UX appropriate for each user type
- [ ] **Data Consistency**: Both interfaces access same backend data

---

## 📋 **Migration Process**

### **Step 1: Setup (30 minutes)**
1. Read Dev 1's completed documentation in `/true-docs/`
2. Review your app statuses in `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`
3. Understand dual interface requirements from business context

### **Step 2: App 1 - Inventory (2 hours)**
1. Simple routing migration (single interface)
2. Update wrangler configuration
3. Test and verify functionality

### **Step 3: App 4 - Medication Auth (3 hours)**
1. **CRITICAL**: Fix next.config.js export issue FIRST
2. Test API routes functionality
3. Create dual interface
4. Verify AI integration works

### **Step 4: App 2 - Handouts (4 hours)**
1. Create dual interface (patient + staff)
2. Implement different permission levels
3. Test PDF generation and QR codes
4. Verify both access patterns

### **Step 5: App 3 - Kiosk (4 hours)**
1. Create dual interface (patient touch + staff monitoring)
2. Optimize patient interface for touch
3. Create staff monitoring dashboard
4. Test payment processing

### **Step 6: Integration Testing (2 hours)**
1. Test all apps through staff portal routing
2. Verify external domain access
3. Test cross-app navigation
4. Performance verification

---

## ⚠️ **Critical Success Requirements**

### **Infrastructure Constraints**
- **DO NOT** modify any `@ganger/*` package dependencies
- **DO NOT** change database schemas or environment variables
- **DO NOT** break existing functionality during migration
- **ALWAYS** test builds before committing changes

### **Working Infrastructure to Preserve**
Reference `/CLAUDE.md` for working values:
- Supabase connection: `https://pfqtzmxxxhhsxmlddrta.supabase.co`
- Google OAuth client ID: `745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com`
- All other environment variables are working and must not be changed

### **Assessment Context**
Your apps are listed in `/apptest/` as:
- **13 out of 17 ready** for production
- **Infrastructure 100% working**
- Your 4 apps are in the "immediate deployment" tier

---

## 🎯 **Deliverables Checklist**

### **App 1: Inventory Management**
- [ ] Updated wrangler.toml for staff routing
- [ ] Updated package.json scripts
- [ ] Tested functionality on new route
- [ ] Build and deployment successful

### **App 2: Handouts Generator**
- [ ] Dual wrangler configurations created
- [ ] Patient and staff worker files created
- [ ] Different interfaces implemented
- [ ] Both access patterns tested and working

### **App 3: Check-in Kiosk**
- [ ] Dual wrangler configurations created
- [ ] Patient touch interface optimized
- [ ] Staff monitoring interface created
- [ ] Payment processing tested

### **App 4: Medication Authorization**
- [ ] **CRITICAL**: next.config.js export removed
- [ ] API routes functionality verified
- [ ] Dual interface implemented
- [ ] AI integration tested

### **Integration Verification**
- [ ] All 4 apps accessible via staff portal
- [ ] External domains work for dual-interface apps
- [ ] Cross-app navigation tested
- [ ] Performance meets requirements (<2 second load times)

---

## 🚨 **Completion Criteria**

Your migration is **COMPLETE** when:

1. **All 4 apps migrated** to hybrid routing architecture
2. **All identified issues resolved** (especially medication-auth config)
3. **All dual interfaces working** with appropriate access levels
4. **All builds successful** with no TypeScript errors
5. **All functionality verified** on new routing
6. **Performance maintained** under 2-second load times

**Success Metric**: All 4 apps deploy successfully and function perfectly on new routing architecture.

---

**Your apps serve the core medical operations. Excellence is mandatory for patient care.**

*Assignment created: January 17, 2025*  
*Apps: Inventory, Handouts, Check-in Kiosk, Medication Authorization*  
*Status: Ready after Dev 1 completion*