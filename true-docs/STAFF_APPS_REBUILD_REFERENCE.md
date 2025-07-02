# Staff Apps Rebuild Reference Document

*This document serves as the authoritative reference for rebuilding ganger-staff and ganger-actions*  
*Last Updated: January 7, 2025 3:00 PM EST*  
*Status: In Progress - Phase 0: Planning*

---

## 🎯 Mission Statement

Systematically split the monolithic staff application into two distinct, well-architected applications:
1. **ganger-staff**: Lightweight router and app launcher
2. **ganger-actions**: Comprehensive employee functionality hub

This rebuild follows all established monorepo principles with no shortcuts, hacks, or assumptions.

---

## 📋 Current State Analysis

### Existing Apps (What We Have)

#### ganger-actions (Currently Incorrect)
- **Has**: Middleware routing, legacy pages, coming-soon pages
- **Problem**: Doing too much - acting as both router AND employee hub
- **Location**: `/apps/ganger-actions`

#### ganger-staff (Currently Incorrect)  
- **Has**: Basic pages, minimal functionality
- **Problem**: Not functioning as the platform router
- **Location**: `/apps/ganger-staff`

### Reference Applications

#### 1. ganger-staff-reference (Next.js Milestone)
- **Location**: `/apps-legacy/ganger-staff-reference`
- **Contains**: Complete working staff portal from milestone commit
- **Key Features**:
  - Working middleware with Edge Config
  - Employee dashboard with stats
  - Legacy pages: directory, tickets, timeoff, users
  - Authentication flow
  - API routes for all functionality

#### 2. Legacy PHP Staff Portal
- **Location**: `/apps-legacy/staff`
- **Contains**: Original PHP implementation
- **Key Features**:
  - 7 form types (support, time off, punch fix, etc.)
  - Complete ticket management system
  - Role-based navigation
  - Manager approval workflows
  - File attachments system

---

## 🏗️ Target Architecture

### ganger-staff (Router & Launcher)

**Purpose**: Entry point and intelligent router for the entire platform

**Deployment**:
- URL: `staff.gangerdermatology.com`
- Vercel Project: `ganger-staff`

**Core Responsibilities**:
1. Edge Config-based routing to all platform apps
2. Visual app launcher grid
3. Authentication flow (login/logout/callback)
4. Coming soon pages for undeployed apps
5. Error pages (404, 500)
6. Platform status monitoring

**File Structure**:
```
apps/ganger-staff/
├── middleware.ts              # Edge Config router - CRITICAL
├── src/
│   ├── pages/
│   │   ├── index.tsx         # Visual app launcher grid
│   │   ├── auth/            
│   │   │   ├── login.tsx     # Login page
│   │   │   ├── logout.tsx    # Logout handler
│   │   │   └── callback.tsx  # OAuth callback
│   │   ├── coming-soon.tsx   # For undeployed apps
│   │   ├── 404.tsx          
│   │   ├── 500.tsx          
│   │   ├── _app.tsx         # Minimal app wrapper
│   │   └── _document.tsx    
│   ├── components/
│   │   ├── AppGrid.tsx      # Visual launcher
│   │   ├── AppCard.tsx      # Individual app cards
│   │   └── StatusIndicator.tsx
│   ├── lib/
│   │   └── edge-config.ts   # Edge Config utilities
│   └── styles/              # Minimal styles
├── package.json             # Minimal dependencies
└── vercel.json             # Deployment config
```

**Dependencies** (Minimal):
```json
{
  "dependencies": {
    "next": "^14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@ganger/deps": "workspace:*",
    "@ganger/ui": "workspace:*",
    "@ganger/auth": "workspace:*"
  }
}
```

### ganger-actions (Employee Hub)

**Purpose**: Comprehensive employee portal with all staff functionality

**Deployment**:
- URL: `ganger-actions-project.vercel.app`
- Accessed via: `staff.gangerdermatology.com/actions`
- Vercel Project: `ganger-actions`

**Core Features**:
1. Employee dashboard with statistics
2. Complete ticket management system
3. All 7 form types from legacy portal
4. Manager approval workflows
5. Employee directory
6. Time tracking and punch fixes
7. File attachments via Supabase Storage
8. Real-time notifications

**File Structure**:
```
apps/ganger-actions/
├── src/
│   ├── pages/
│   │   ├── index.tsx           # Main dashboard
│   │   ├── dashboard.tsx       # Detailed stats view
│   │   ├── tickets/
│   │   │   ├── index.tsx      # Ticket list
│   │   │   ├── new.tsx        # Create ticket
│   │   │   └── [id].tsx      # Ticket detail
│   │   ├── forms/
│   │   │   ├── support.tsx    # IT support request
│   │   │   ├── time-off.tsx   # PTO request
│   │   │   ├── punch-fix.tsx  # Time correction
│   │   │   ├── help-desk.tsx  # General help
│   │   │   ├── supply.tsx     # Supply request
│   │   │   ├── rx-delivery.tsx # Prescription delivery
│   │   │   └── schedule.tsx   # Schedule change
│   │   ├── staff/
│   │   │   ├── directory.tsx  # Employee directory
│   │   │   ├── profile/[id].tsx
│   │   │   └── my-team.tsx    # Manager view
│   │   ├── approvals/
│   │   │   ├── index.tsx      # Pending approvals
│   │   │   └── history.tsx    # Approval history
│   │   └── api/
│   │       ├── tickets/       # Ticket CRUD
│   │       ├── forms/         # Form submissions
│   │       ├── approvals/     # Approval workflows
│   │       └── notifications/ # Real-time updates
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Tickets/
│   │   ├── Forms/
│   │   ├── Staff/
│   │   └── shared/
│   ├── lib/
│   │   ├── api/
│   │   ├── tickets/
│   │   ├── forms/
│   │   └── notifications/
│   ├── hooks/
│   └── types/
├── package.json
└── vercel.json
```

**Dependencies**:
```json
{
  "dependencies": {
    "next": "^14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@ganger/deps": "workspace:*",
    "@ganger/auth": "workspace:*",
    "@ganger/cache": "workspace:*",
    "@ganger/config": "workspace:*",
    "@ganger/db": "workspace:*",
    "@ganger/integrations": "workspace:*",
    "@ganger/monitoring": "workspace:*",
    "@ganger/types": "workspace:*",
    "@ganger/ui": "workspace:*",
    "@ganger/utils": "workspace:*"
  }
}
```

---

## 🔄 Edge Config Structure

**Config Name**: `202507-1`  
**Config ID**: `ecfg_a1cpzdoogkmshw6hed5qhxcgd5m8`  
**Environment Variable**: `EDGE_CONFIG_202507_1`  
**Status**: ✅ Created and populated with all app mappings

```json
{
  "appUrls": {
    "actions": "https://ganger-actions-project.vercel.app",
    "inventory": "https://ganger-inventory-project.vercel.app",
    "handouts": "https://ganger-handouts-project.vercel.app",
    "l10": "https://ganger-eos-l10-project.vercel.app",
    "eos-l10": "https://ganger-eos-l10-project.vercel.app",
    "batch": "https://ganger-batch-closeout-project.vercel.app",
    "batch-closeout": "https://ganger-batch-closeout-project.vercel.app",
    "compliance": "https://ganger-compliance-training-project.vercel.app",
    "compliance-training": "https://ganger-compliance-training-project.vercel.app",
    "clinical-staffing": "https://ganger-clinical-staffing-project.vercel.app",
    "config": "https://ganger-config-dashboard-project.vercel.app",
    "config-dashboard": "https://ganger-config-dashboard-project.vercel.app",
    "status": "https://ganger-integration-status-project.vercel.app",
    "integration-status": "https://ganger-integration-status-project.vercel.app",
    "ai-receptionist": "https://ganger-ai-receptionist-project.vercel.app",
    "call-center": "https://ganger-call-center-ops-project.vercel.app",
    "call-center-ops": "https://ganger-call-center-ops-project.vercel.app",
    "medication-auth": "https://ganger-medication-auth-project.vercel.app",
    "pharma": "https://ganger-pharma-scheduling-project.vercel.app",
    "pharma-scheduling": "https://ganger-pharma-scheduling-project.vercel.app",
    "lunch": "https://ganger-pharma-scheduling-project.vercel.app",
    "kiosk": "https://ganger-checkin-kiosk-project.vercel.app",
    "checkin-kiosk": "https://ganger-checkin-kiosk-project.vercel.app",
    "socials": "https://ganger-socials-reviews-project.vercel.app",
    "socials-reviews": "https://ganger-socials-reviews-project.vercel.app",
    "component-showcase": "https://ganger-component-showcase-project.vercel.app",
    "components": "https://ganger-component-showcase-project.vercel.app",
    "platform-dashboard": "https://ganger-platform-dashboard-project.vercel.app"
  },
  "appMetadata": {
    "actions": {
      "name": "Ganger Actions",
      "description": "Employee hub and tools",
      "icon": "🏢",
      "category": "core"
    },
    "inventory": {
      "name": "Inventory Management",
      "description": "Medical supply tracking",
      "icon": "📦",
      "category": "operations"
    }
    // ... metadata for all apps
  }
}
```

---

## 📋 Feature Mapping from Legacy

### Forms to Implement in ganger-actions

1. **Support Ticket** (`/forms/support`)
   - IT help requests
   - Hardware/software issues
   - Account problems

2. **Time Off Request** (`/forms/time-off`)
   - PTO requests
   - Sick leave
   - Manager approval workflow

3. **Punch Fix** (`/forms/punch-fix`)
   - Clock in/out corrections
   - Missing punches
   - Manager approval required

4. **Help Desk** (`/forms/help-desk`)
   - General assistance
   - Non-IT questions
   - Process inquiries

5. **Supply Request** (`/forms/supply`)
   - Office supplies
   - Medical supplies
   - Facility needs

6. **Rx Delivery** (`/forms/rx-delivery`)
   - Prescription delivery requests
   - Patient information
   - Delivery tracking

7. **Schedule Change** (`/forms/schedule`)
   - Shift changes
   - Coverage requests
   - Manager coordination

### Ticket System Features

- **List View**: Sortable, filterable, searchable
- **Detail View**: Full history, comments, attachments
- **Status Workflow**: New → In Progress → Resolved → Closed
- **Priority Levels**: Low, Medium, High, Urgent
- **Assignment**: Auto-assign or manual
- **Notifications**: Email and in-app
- **Attachments**: Via Supabase Storage
- **Comments**: Threaded discussions
- **Manager Tools**: Bulk actions, reports

---

## 🚀 Implementation Phases

### Phase 1: Edge Config & Router Setup ✅
1. ✅ Move reference apps to apps-legacy
2. ✅ Create Edge Config with all app mappings
3. ✅ Rebuild ganger-staff as minimal router
4. ✅ Edge Config connected to project (env var EDGE_CONFIG_202507_1)
5. ⏳ Deploy ganger-staff to staff.gangerdermatology.com (needs GitHub repo fix)

### Phase 2: Core Employee Hub 
1. [ ] Set up ganger-actions project structure
2. [ ] Implement main dashboard
3. [ ] Create navigation system
4. [ ] Add authentication flow
5. [ ] Deploy initial version

### Phase 3: Ticket System
1. [ ] Database schema for tickets
2. [ ] Ticket CRUD operations
3. [ ] Comment system
4. [ ] File attachments
5. [ ] Status workflows

### Phase 4: Form Implementation
1. [ ] Create form components
2. [ ] Implement all 7 form types
3. [ ] Add validation
4. [ ] Connect to ticket system
5. [ ] Test submissions

### Phase 5: Manager Features
1. [ ] Approval workflows
2. [ ] Team management views
3. [ ] Reporting dashboard
4. [ ] Bulk operations

### Phase 6: Polish & Launch
1. [ ] Performance optimization
2. [ ] Error handling
3. [ ] Documentation
4. [ ] User training materials
5. [ ] Full deployment

---

## 🔧 Technical Standards

### Monorepo Principles
1. **Consistent Dependencies**: All apps use same Next.js, React versions
2. **Shared Packages**: Use @ganger/* packages, don't duplicate
3. **No Shortcuts**: Proper error handling, no console.logs in production
4. **Type Safety**: Full TypeScript coverage
5. **Testing**: Components and API routes tested

### Code Quality Rules
1. **No Placeholders**: Real implementation only
2. **No Assumptions**: Check everything, verify all
3. **No Hacks**: Clean, maintainable code
4. **No Rush**: Take time to do it right
5. **Document Everything**: Comments where needed

### Deployment Configuration
```javascript
// Standard vercel.json for monorepo
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Standard PostCSS Config
```javascript
// All apps must use Tailwind v4 syntax
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

---

## 📊 Success Metrics

### Technical Success
- [ ] All routing works via Edge Config
- [ ] No hardcoded URLs
- [ ] Consistent UI/UX across apps
- [ ] Fast page loads (<2s)
- [ ] Zero deployment errors

### Functional Success
- [ ] All 7 forms implemented
- [ ] Complete ticket lifecycle
- [ ] Manager workflows functional
- [ ] File attachments working
- [ ] Real-time notifications

### User Success
- [ ] Intuitive navigation
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1)
- [ ] Help documentation
- [ ] Training completed

---

## 🚨 Critical Reminders

1. **Check MCP Submodules**: Run check before ANY deployment
2. **Use pnpm**: Never use npm commands
3. **Edge Config First**: Router won't work without it
4. **Test Locally**: Full testing before deployment
5. **Update This Doc**: Keep it current as we progress

---

## 📝 Progress Log

### January 7, 2025
- Created this reference document
- Moved reference apps to apps-legacy
- Analyzed both legacy systems
- Defined clear architecture split
- Created Edge Config (ID: ecfg_a1cpzdoogkmshw6hed5qhxcgd5m8)
- Edge Config populated with all app URLs and metadata
- Successfully rebuilt ganger-staff as minimal router:
  - Clean middleware with Edge Config support
  - Visual app launcher on index page
  - Auth pages (login, logout, callback)
  - Coming soon page for undeployed apps
  - Error pages (404, 500)
  - Minimal dependencies following monorepo principles
  - Build succeeds with no errors
- Edge Config connected to ganger-staff project:
  - Created access token for Edge Config
  - Added EDGE_CONFIG_202507_1 environment variable
  - Connection string properly configured
- Deployment status:
  - Project settings updated with correct build commands
  - GitHub repository connection needs manual fix in Vercel dashboard
  - Need to connect acganger/ganger-platform repo to the project

### [Next Entry]
- Update after Edge Config creation
- Document any architecture decisions
- Track completed tasks

---

*This document is the source of truth for the staff apps rebuild. Update frequently.*