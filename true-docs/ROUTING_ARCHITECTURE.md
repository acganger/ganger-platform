# 🌐 Ganger Platform - Routing Architecture

**Status**: ✅ **PRODUCTION ARCHITECTURE** - Current deployment pattern  
**Last Updated**: January 19, 2025  
**Dependencies**: Platform assessment findings from `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`  
**Security Policy**: Follow `/CLAUDE.md` - NEVER sanitize working infrastructure values  
**Subrouting**: ✅ IMPLEMENTED - Dynamic subroutes for L10 and other apps

---

## 🚨 **CRITICAL: Individual Subdomains are DEPRECATED**

**❌ OLD APPROACH (DEPRECATED - DO NOT USE):**
- inventory.gangerdermatology.com
- handouts.gangerdermatology.com  
- checkin.gangerdermatology.com
- Individual subdomain deployments create routing confusion and DNS management overhead

**✅ NEW APPROACH (CURRENT ARCHITECTURE):**
- **Staff Portal**: staff.gangerdermatology.com with path-based routing
- **External Access**: Dedicated domains for patient/rep access only
- **Hybrid Router Pattern**: Lightweight router + individual workers for performance

---

## 🏗️ **Platform Architecture Overview**

### **Two-Domain Architecture Pattern**

The Ganger Platform uses a sophisticated **hybrid routing architecture** that separates staff functions from patient/external access while maintaining optimal performance and security.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GANGER PLATFORM ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STAFF PORTAL (Internal Users - Google OAuth Required)                 │
│  ┌─ staff.gangerdermatology.com ──────────────────────────────────────┐ │
│  │  Lightweight Router Worker → Individual App Workers               │ │
│  │                                                                    │ │
│  │  Core Medical Applications:                                       │ │
│  │  ├─ /              → staff-management-worker                      │ │
│  │  ├─ /inventory     → inventory-worker                             │ │
│  │  ├─ /handouts      → handouts-staff-worker                       │ │
│  │  ├─ /kiosk         → kiosk-admin-worker                          │ │
│  │  ├─ /meds          → meds-staff-worker                           │ │
│  │                                                                    │ │
│  │  Business Operations:                                             │ │
│  │  ├─ /l10           → l10-worker                                   │ │
│  │  ├─ /reps          → reps-admin-worker                           │ │
│  │  ├─ /phones        → phones-worker                               │ │
│  │  ├─ /batch         → batch-worker                                │ │
│  │                                                                    │ │
│  │  Platform Administration:                                         │ │
│  │  ├─ /socials       → socials-worker                              │ │
│  │  ├─ /staffing      → staffing-worker                             │ │
│  │  ├─ /compliance    → compliance-worker                           │ │
│  │  ├─ /dashboard     → dashboard-worker                            │ │
│  │  ├─ /config        → config-worker                               │ │
│  │  ├─ /showcase      → showcase-worker                             │ │
│  │  └─ /status        → status-worker                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  EXTERNAL ACCESS (Public Users - No Auth Required)                     │
│  ┌─ External Domains ─────────────────────────────────────────────────┐ │
│  │  Patient Access:                                                   │ │
│  │  ├─ handouts.gangerdermatology.com → handouts-patient-worker      │ │
│  │  ├─ kiosk.gangerdermatology.com    → kiosk-patient-worker         │ │
│  │  ├─ meds.gangerdermatology.com     → meds-patient-worker          │ │
│  │                                                                    │ │
│  │  Third-Party Access:                                              │ │
│  │  └─ reps.gangerdermatology.com     → reps-booking-worker          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 **Staff Portal Routing Pattern**

### **Lightweight Router Implementation**

The staff portal router at `staff.gangerdermatology.com` uses a **lightweight proxy pattern** that routes requests to specialized workers while maintaining sub-5ms overhead.

**Router Worker Pattern:**
```typescript
// staff-portal-router.js - Lightweight routing layer
interface Env {
  ENVIRONMENT: string;
  STAFF_PORTAL_BASE: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    
    // Staff portal routing map
    const routingMap: Record<string, string> = {
      // Core Medical Applications
      '/': 'ganger-staff-management',
      '/inventory': 'ganger-inventory-staff',
      '/handouts': 'ganger-handouts-staff',
      '/kiosk': 'ganger-kiosk-admin',
      '/meds': 'ganger-meds-staff',
      
      // Business Operations
      '/l10': 'ganger-l10-staff',
      '/reps': 'ganger-reps-admin',
      '/phones': 'ganger-phones-staff',
      '/batch': 'ganger-batch-staff',
      
      // Platform Administration
      '/socials': 'ganger-socials-staff',
      '/staffing': 'ganger-staffing-staff',
      '/compliance': 'ganger-compliance-staff',
      '/dashboard': 'ganger-dashboard-staff',
      '/config': 'ganger-config-staff',
      '/showcase': 'ganger-showcase-staff',
      '/status': 'ganger-status-staff'
    };
    
    // Route resolution with fallback
    const targetWorker = routingMap[path] || routingMap['/'];
    
    // Proxy request to target worker
    const targetUrl = `https://${targetWorker}.workers.dev${url.pathname}${url.search}`;
    
    return fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
} satisfies ExportedHandler<Env>;
```

### **Staff Portal Navigation System**

**Cross-App Navigation Requirements:**
```typescript
// Staff portal navigation component (embedded in all staff apps)
const StaffPortalNav = () => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { 
      name: 'Medical',
      children: [
        { name: 'Inventory', href: '/inventory' },
        { name: 'Medications', href: '/meds' },
        { name: 'Patient Handouts', href: '/handouts' },
        { name: 'Check-in Admin', href: '/kiosk' }
      ]
    },
    {
      name: 'Business',
      children: [
        { name: 'EOS L10', href: '/l10' },
        { name: 'Rep Scheduling', href: '/reps' },
        { name: 'Call Center', href: '/phones' },
        { name: 'Batch Closeout', href: '/batch' }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'Social Media', href: '/socials' },
        { name: 'Staffing', href: '/staffing' },
        { name: 'Compliance', href: '/compliance' },
        { name: 'Configuration', href: '/config' },
        { name: 'Components', href: '/showcase' },
        { name: 'System Status', href: '/status' }
      ]
    }
  ];
  
  return (
    <nav className="staff-portal-nav">
      {/* Unified navigation across all staff applications */}
    </nav>
  );
};
```

---

## 🌍 **External Domain Access Pattern**

### **Patient and Third-Party Access**

External domains provide **direct access** to specific functionality without requiring staff authentication or access to the broader platform.

**Domain Purpose Matrix:**
```
┌──────────────────────────────────────┬─────────────────┬──────────────────┐
│ Domain                               │ Target Users    │ Authentication   │
├──────────────────────────────────────┼─────────────────┼──────────────────┤
│ handouts.gangerdermatology.com       │ Patients        │ None / QR Access │
│ kiosk.gangerdermatology.com          │ Patients        │ None / Touch UI  │
│ meds.gangerdermatology.com           │ Patients        │ Basic Auth       │
│ reps.gangerdermatology.com           │ Pharma Reps     │ Basic Auth       │
└──────────────────────────────────────┴─────────────────┴──────────────────┘
```

**External Domain Worker Pattern:**
```typescript
// handouts-patient-worker.js - Patient-facing handout access
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Patient interface - no staff functions exposed
    if (url.pathname.startsWith('/patient/')) {
      return handlePatientHandoutAccess(request);
    }
    
    if (url.pathname.startsWith('/qr/')) {
      return handleQRCodeAccess(request);
    }
    
    // Default patient landing page
    return new Response(patientHandoutHTML, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
```

### **Dual Interface Applications**

Four applications require **both staff and external access** with different interfaces:

**1. Handouts Generator**
- **Staff Interface**: `staff.gangerdermatology.com/handouts` - Create, manage, analyze handouts
- **Patient Interface**: `handouts.gangerdermatology.com` - View, download handouts via QR codes

**2. Check-in Kiosk**
- **Staff Interface**: `staff.gangerdermatology.com/kiosk` - Monitor, configure, manage kiosk
- **Patient Interface**: `kiosk.gangerdermatology.com` - Touch-based check-in experience

**3. Medication Authorization**
- **Staff Interface**: `staff.gangerdermatology.com/meds` - Manage authorizations, review requests
- **Patient Interface**: `meds.gangerdermatology.com` - Submit requests, check status

**4. Pharma Scheduling**
- **Staff Interface**: `staff.gangerdermatology.com/reps` - Admin scheduling, approve requests
- **Rep Interface**: `reps.gangerdermatology.com` - Book appointments, view availability

---

## 🔐 **Authentication and Security Architecture**

### **Staff Portal Authentication Flow**

```
┌─ User Access Request: staff.gangerdermatology.com/inventory ─┐
│                                                              │
├─ 1. Cloudflare Router Worker                                 │
│     ├─ Check: Valid staff.gangerdermatology.com request      │
│     └─ Route to: ganger-inventory-staff.workers.dev          │
│                                                              │
├─ 2. Individual App Worker (ganger-inventory-staff)           │
│     ├─ Check: Google OAuth token present and valid           │
│     ├─ Verify: @gangerdermatology.com domain restriction     │
│     ├─ Validate: User role permissions                       │
│     └─ Serve: Authenticated staff interface                  │
│                                                              │
└─ 3. Cross-App Session Sharing                                │
      ├─ Session token valid across all staff applications     │
      ├─ Single sign-on experience                             │
      └─ Unified logout across platform                        │
└──────────────────────────────────────────────────────────────┘
```

### **External Domain Security Model**

```
┌─ Patient Access: handouts.gangerdermatology.com ─────────────┐
│                                                              │
├─ 1. Direct Worker Access (No Router)                         │
│     ├─ Direct: ganger-handouts-patient.workers.dev          │
│     └─ Custom Domain: handouts.gangerdermatology.com         │
│                                                              │
├─ 2. Patient Authentication (Optional/Minimal)                │
│     ├─ QR Code Access: No authentication required           │
│     ├─ Phone/DOB Verification: Basic patient verification   │
│     └─ NO Staff Functions: Zero access to staff features    │
│                                                              │
└─ 3. Security Isolation                                       │
      ├─ No cross-domain session sharing                       │
      ├─ No staff data exposure                                │
      └─ HIPAA-compliant patient data handling                 │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ **Performance Architecture**

### **Why Hybrid Router + Individual Workers?**

**❌ REJECTED: Single Monolithic Worker**
- **CPU Limits**: Single worker would hit 50ms CPU limit with 16 applications
- **Memory Constraints**: Bundle size would exceed 1MB Worker limit
- **Cold Start Issues**: Single large worker = longer cold start times
- **Deployment Complexity**: Any change requires full platform redeployment

**✅ CHOSEN: Hybrid Router Pattern**
- **Lightweight Router**: <5ms overhead per request
- **Specialized Workers**: Each app optimized for specific functionality
- **Independent Scaling**: Apps scale based on individual usage patterns
- **Deployment Flexibility**: Update individual apps without affecting others
- **Performance Isolation**: Issues in one app don't affect others

### **Performance Benchmarks**

```
┌─ Performance Targets (All Must Meet) ────────────────────────┐
│                                                              │
│ Staff Portal Router:                                         │
│ ├─ Routing Overhead: <5ms                                    │
│ ├─ Cold Start: <100ms                                        │
│ └─ Memory Usage: <10MB                                       │
│                                                              │
│ Individual App Workers:                                      │
│ ├─ First Contentful Paint: <1.5s                            │
│ ├─ Time to Interactive: <3s                                 │
│ ├─ Bundle Size: <500KB per app                              │
│ └─ Cold Start: <200ms                                        │
│                                                              │
│ Cross-App Navigation:                                        │
│ ├─ Navigation Delay: <100ms                                 │
│ ├─ Session Transfer: <50ms                                  │
│ └─ Auth Verification: <25ms                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Subrouting Architecture**

### **Dynamic Subroute Handling**

**Implementation Status (January 19, 2025):**
- ✅ **L10 Application**: Full subrouting implemented (7 subroutes)
- ✅ **Staff Portal Router**: Handles prefix-based routing for 6 additional apps
- ✅ **Dynamic Content**: All subroutes serve dynamic content
- ✅ **Dedicated Workers**: Compliance, Staffing, and Socials have subroute pages
- ✅ **Total Apps with Subroutes**: 10 applications fully implemented

### **Subroute Patterns**

**1. L10 Application Subroutes** (Dedicated Worker)
```
/l10/              → Redirects to /l10/compass
/l10/compass       → Main L10 dashboard
/l10/rocks         → Quarterly rocks tracking
/l10/scorecard     → Weekly scorecard metrics
/l10/headlines     → Customer/employee headlines
/l10/todos         → To-do list management
/l10/issues        → IDS (Identify, Discuss, Solve)
/l10/meetings      → Meeting management
```

**2. Compliance Training Subroutes** (Dedicated Worker)
```
/compliance/dashboard  → Compliance overview and metrics
/compliance/courses    → Training course management
/compliance/reports    → Compliance reporting and analytics
```

**3. Clinical Staffing Subroutes** (Dedicated Worker)
```
/staffing/schedule-builder  → Drag-and-drop schedule creation
/staffing/staff-assignments → Staff assignment management
/staffing/analytics        → Coverage and performance analytics
```

**4. Social Reviews Subroutes** (Dedicated Worker)
```
/socials/dashboard  → Review metrics and platform overview
/socials/respond    → Response management interface
/socials/analytics  → Sentiment and performance analytics
```

**5. Check-in Kiosk Subroutes** (Staff Portal Router)
```
/kiosk/dashboard  → Kiosk performance monitoring
/kiosk/settings   → Configuration and display options
/kiosk/analytics  → Usage patterns and metrics
```

**6. Configuration Dashboard Subroutes** (Staff Portal Router)
```
/config/apps         → Application settings management
/config/integrations → External service configurations
/config/security     → Security and permission settings
```

**7. AI Receptionist Subroutes** (Staff Portal Router)
```
/ai-receptionist/dashboard  → Call handling overview
/ai-receptionist/settings   → AI configuration and rules
/ai-receptionist/analytics  → Performance metrics and insights
```

**8. Call Center Operations Subroutes** (Staff Portal Router)
```
/call-center/dashboard  → Real-time operations view
/call-center/agents     → Agent management and status
/call-center/history    → Call logs and recordings
```

**9. Pharma Scheduling Subroutes** (Staff Portal Router)
```
/reps/schedule      → Representative appointment calendar
/reps/availability  → Provider availability management
/reps/analytics     → Visit patterns and outcomes
```

**10. Component Showcase Subroutes** (Staff Portal Router)
```
/showcase/components  → UI component library
/showcase/patterns    → Design pattern examples
/showcase/examples    → Interactive demos and playgrounds
```

**11. Inventory Management Subroutes** (Staff Portal Router - R2 Bucket)
```
/inventory/dashboard  → Inventory overview and metrics
/inventory/scan       → Barcode scanning interface
/inventory/reports    → Analytics and reporting
```

**12. Patient Handouts Subroutes** (Staff Portal Router)
```
/handouts/templates  → Template management
/handouts/generate   → Create new handouts
/handouts/history    → Generated handout history
```

### **Implementation Patterns**

**Pattern 1: Dedicated Worker with Next.js Pages**
Used for: L10, Compliance, Staffing, Socials

```javascript
// In the Next.js app directory (e.g., apps/compliance-training/app/dashboard/page.tsx)
'use client'

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const timestamp = new Date().toISOString();
  // Dynamic content generation
}
```

**Pattern 2: Staff Portal Router with Subroute Handlers**
Used for: Kiosk, Config, AI Receptionist, Call Center, Reps, Showcase

```javascript
// In staff-router.js
if (pathname.startsWith('/kiosk/')) {
  return getKioskSubroute(pathname);
}

// Subroute handler function
function getKioskSubroute(pathname) {
  const subroute = pathname.split('/')[2] || 'dashboard';
  const timestamp = new Date().toISOString();
  
  return new Response(generateDynamicHTML(subroute, timestamp), {
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}
```

### **Route Precedence Rules**

Cloudflare Workers routes follow a **most specific match** precedence:

1. **Exact Match Routes** (highest precedence)
   - Example: `staff.gangerdermatology.com/l10`
   
2. **Prefix Routes with Wildcards**
   - Example: `staff.gangerdermatology.com/l10/*`
   
3. **Catch-All Routes** (lowest precedence)
   - Example: `staff.gangerdermatology.com/*`

**Current Configuration:**
```
# Dedicated Workers (bypass staff-portal-router)
staff.gangerdermatology.com/l10        → ganger-eos-l10-v2
staff.gangerdermatology.com/l10/*      → ganger-eos-l10-v2
staff.gangerdermatology.com/staffing/* → ganger-staffing-staff-production
staff.gangerdermatology.com/compliance/* → ganger-compliance-staff-production
staff.gangerdermatology.com/socials/*  → ganger-socials-staff-production

# Catch-all (handles all other routes including subroutes)
staff.gangerdermatology.com/*          → staff-portal-router-production
```

### **Implementing Subroutes in Your App**

**Step 1: Update Worker to Handle Subroutes**
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Extract app prefix and subroute
    if (pathname.startsWith('/yourapp/')) {
      const subroute = pathname.slice(8); // Remove '/yourapp/'
      return handleSubroute(subroute);
    }
  }
}
```

**Step 2: Dynamic Content Generation**
```javascript
function handleSubroute(subroute) {
  switch(subroute) {
    case 'dashboard':
      return generateDashboard();
    case 'settings':
      return generateSettings();
    case 'reports':
      return generateReports();
    default:
      return generateMainPage();
  }
}
```

**Step 3: Navigation Links**
Always use full paths in navigation:
```html
<!-- Correct: Full path from root -->
<a href="/yourapp/dashboard">Dashboard</a>
<a href="/yourapp/settings">Settings</a>

<!-- Wrong: Relative paths can break -->
<a href="dashboard">Dashboard</a>
<a href="./settings">Settings</a>
```

### **Testing Subroutes**

Use the route testing script:
```bash
# Test all subroutes for an app
for route in dashboard settings reports; do
  echo "Testing /yourapp/$route:"
  curl -s -o /dev/null -w "%{http_code}" https://staff.gangerdermatology.com/yourapp/$route
  echo
done
```

### **Subrouting Summary**

**Total Implementation Status:**
- **12 Applications** with full subroute support
- **49 Total Subroutes** implemented across the platform
- **2 Implementation Patterns** (Dedicated Workers vs Staff Router)
- **100% Dynamic Content** on all subroutes

**By the Numbers:**
- L10: 7 subroutes (dedicated worker)
- Compliance: 3 subroutes (dedicated worker)
- Staffing: 3 subroutes (dedicated worker)
- Socials: 3 subroutes (dedicated worker)
- Inventory: 3 subroutes (R2 bucket via router)
- Handouts: 3 subroutes (router function)
- Kiosk: 3 subroutes (router function)
- Config: 3 subroutes (router function)
- AI Receptionist: 3 subroutes (router function)
- Call Center: 3 subroutes (router function)
- Reps: 3 subroutes (router function)
- Showcase: 3 subroutes (router function)

---

## 🚀 **Deployment Architecture**

### **Production Deployment Workflow**

**Phase 1: External Domains (Isolated)**
```bash
# Deploy patient/rep access first (no dependencies)
npm run deploy:handouts-patient    # handouts.gangerdermatology.com
npm run deploy:kiosk-patient       # kiosk.gangerdermatology.com
npm run deploy:meds-patient        # meds.gangerdermatology.com
npm run deploy:reps-booking        # reps.gangerdermatology.com
```

**Phase 2: Individual Staff Workers**
```bash
# Deploy all 16 staff application workers
npm run deploy:staff-management    # Root staff portal
npm run deploy:inventory-staff     # Staff inventory management
npm run deploy:handouts-staff      # Staff handout admin
npm run deploy:kiosk-admin         # Staff kiosk monitoring
npm run deploy:meds-staff          # Staff medication admin
npm run deploy:l10-staff           # Staff L10 management
npm run deploy:reps-admin          # Staff rep scheduling admin
npm run deploy:phones-staff        # Staff call center
npm run deploy:batch-staff         # Staff batch closeout
npm run deploy:socials-staff       # Staff social media
npm run deploy:staffing-staff      # Staff clinical staffing
npm run deploy:compliance-staff    # Staff compliance training
npm run deploy:dashboard-staff     # Staff platform dashboard
npm run deploy:config-staff        # Staff configuration
npm run deploy:showcase-staff      # Staff component showcase
npm run deploy:status-staff        # Staff system status
```

**Phase 3: Staff Portal Router**
```bash
# Deploy router last (depends on all staff workers being live)
npm run deploy:staff-portal-router # Routes to all staff workers
```

### **Cloudflare DNS Configuration**

**Current Working Configuration** (per `/CLAUDE.md` security policy):
```bash
# DO NOT MODIFY - Working infrastructure values
CLOUDFLARE_ZONE_ID=ba76d3d3f41251c49f0365421bd644a5
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf

# Domain routing (configured in Cloudflare)
staff.gangerdermatology.com      → CNAME → ganger-staff-portal.workers.dev
handouts.gangerdermatology.com   → CNAME → ganger-handouts-patient.workers.dev
kiosk.gangerdermatology.com      → CNAME → ganger-kiosk-patient.workers.dev
meds.gangerdermatology.com       → CNAME → ganger-meds-patient.workers.dev
reps.gangerdermatology.com       → CNAME → ganger-reps-booking.workers.dev
```

---

## 📋 **Implementation Requirements for Developers**

### **For Dev 2-5: Application Migration**

**REQUIRED: Each app must support the hybrid routing pattern**

**Staff Application Structure:**
```typescript
// Every staff app must include:
import { StaffPortalNav } from '@ganger/ui/staff-nav';
import { useStaffAuth } from '@ganger/auth/staff';

export default function StaffApp() {
  const { user, isAuthenticated } = useStaffAuth();
  
  if (!isAuthenticated) {
    return <GoogleOAuthLogin redirectTo="/staff" />;
  }
  
  return (
    <div className="staff-app">
      <StaffPortalNav currentApp="inventory" />
      <main>
        {/* App-specific content */}
      </main>
    </div>
  );
}
```

**External Application Structure:**
```typescript
// External apps must NOT include staff navigation or auth
export default function PatientApp() {
  return (
    <div className="patient-app">
      <header className="patient-header">
        {/* Patient-specific branding */}
      </header>
      <main>
        {/* Patient-facing content only */}
      </main>
    </div>
  );
}
```

### **For Dev 6: Verification Requirements**

**REQUIRED: Test hybrid routing functionality**

**Routing Verification Script:**
```bash
#!/bin/bash
# test-routing-architecture.sh

echo "Testing Staff Portal Routing..."
for path in "/" "/inventory" "/handouts" "/kiosk" "/meds" "/l10" "/reps" "/phones" "/batch" "/socials" "/staffing" "/compliance" "/dashboard" "/config" "/showcase" "/status"; do
  echo "Testing: staff.gangerdermatology.com$path"
  curl -I "https://staff.gangerdermatology.com$path" | head -n 1
done

echo "Testing External Domain Routing..."
for domain in "handouts" "kiosk" "meds" "reps"; do
  echo "Testing: $domain.gangerdermatology.com"
  curl -I "https://$domain.gangerdermatology.com" | head -n 1
done
```

---

## 🎯 **Success Criteria**

### **Platform Routing Success Metrics**

1. **All 16 staff routes** accessible via staff.gangerdermatology.com
2. **All 4 external domains** accessible independently
3. **Cross-app navigation** works seamlessly within staff portal
4. **Authentication flows** correctly across all staff applications
5. **Performance targets** met for routing overhead (<5ms)
6. **Zero DNS confusion** - no individual subdomain conflicts

### **Architecture Validation Checklist**

- [ ] Staff portal router routes correctly to all 16 applications
- [ ] External domains provide isolated patient/rep access
- [ ] Authentication works across all staff applications
- [ ] Cross-app navigation preserves user session
- [ ] Performance targets met for all routing operations
- [ ] No individual subdomain deployments exist
- [ ] All routing follows documented patterns

---

## 📚 **Reference Documentation**

### **Platform Assessment Reference**
- **Current Status**: `/apptest/COMPREHENSIVE_PLATFORM_ASSESSMENT.md`
- **Business Requirements**: `/apptest/EXECUTIVE_SUMMARY.md`
- **Deployment Readiness**: `/apptest/PRODUCTION_DEPLOYMENT_CHECKLIST.md`

### **Infrastructure Reference**
- **Security Policy**: `/CLAUDE.md` (working infrastructure values)
- **Environment Variables**: Use exact values from `/CLAUDE.md`
- **Cloudflare Configuration**: Working zone and API token documented

### **Implementation Reference**
- **Hybrid Worker Details**: `/true-docs/HYBRID_WORKER_ARCHITECTURE.md`
- **Deployment Procedures**: `/true-docs/DEPLOYMENT_GUIDE.md`
- **Developer Workflow**: `/true-docs/DEVELOPER_WORKFLOW.md`

---

**This routing architecture transforms 16 individual applications into a unified, high-performance medical platform. Follow precisely for successful platform deployment.**

*Architecture Documentation*  
*Created: January 17, 2025*  
*Status: Foundation for all platform development*