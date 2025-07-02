# Ganger Platform Application Analysis Report

## Executive Summary

This report analyzes two reference applications to guide the systematic rebuild of ganger-actions (employee hub) and creation of ganger-staff (router). The analysis reveals that the current ganger-actions is already serving dual purposes and should be split into two distinct applications following monorepo principles.

## Current State Analysis

### 1. Ganger-Staff-Reference (Next.js Monolithic App)

**Core Functionality:**
- Full-featured staff management system
- Support ticket management with CRUD operations
- Time off request handling
- User authentication via Google OAuth
- Role-based access control (staff, manager, admin)
- File upload capabilities
- Comment system for tickets
- Real-time updates planned

**Navigation Structure:**
```
Main Navigation:
├── Dashboard
├── My Tickets
├── New Ticket
├── Time Off Requests
└── Punch Corrections

Platform Apps (External):
├── Inventory Management
├── Patient Handouts
├── Medication Auth
├── Check-in Kiosk
├── EOS L10
├── Compliance Training
├── Clinical Staffing
└── Social Reviews

Management Tools (Manager+):
├── Team Overview
├── Reports
├── User Management
├── Configuration
└── Integration Status

Admin Tools (Admin only):
├── System Settings
├── All Locations
├── AI Receptionist
├── Call Center Ops
├── Pharma Scheduling
├── Batch Closeout
└── Component Showcase
```

**Key Components:**
- **Authentication**: ProtectedRoute wrapper, useAuth hook
- **Forms**: SupportTicketForm, TimeOffRequestForm (dynamic, reusable)
- **Layout**: DashboardLayout with Sidebar navigation
- **Tickets**: Full ticket management UI components
- **API Routes**: Complete REST API for all operations

**Design Patterns:**
- Component-based architecture
- Custom hooks for auth and notifications
- Zod validation schemas
- API route handlers with TypeScript
- Responsive design with Tailwind CSS

### 2. Legacy PHP Staff Portal

**Core Functionality:**
- 7 form types (support, time off, punch fix, availability, expense, meeting, impact filter)
- Ticket management system with status workflow
- File upload with automatic archiving
- Manager approval workflow
- Comment system for managers
- User autocomplete and directory
- Activity dashboard with charts

**Form System Features:**
```json
Forms Available:
├── support_ticket (IT, maintenance, clinic issues)
├── time_off_request (PTO, vacation tracking)
├── punch_fix (timeclock corrections)
├── change_of_availability (schedule changes)
├── expense_reimbursement (expense claims)
├── meeting_request (manager meetings)
└── impact_filter (suggestion box)
```

**Authentication & Authorization:**
- Google OAuth with @gangerdermatology.com restriction
- Session-based authentication (24-hour sessions)
- CSRF protection
- Rate limiting
- Role-based access (employee, supervisor, administrator)

**Data Models:**
- staff_tickets (main ticket storage)
- staff_ticket_comments (comment threading)
- staff_file_uploads (file tracking)
- staff_user_cache (Google user data)
- staff_login_attempts (security)

### 3. Current Ganger-Actions State

**Current Dual Purpose:**
1. **Employee Hub Features:**
   - Dashboard with stats and quick actions
   - Ticket management pages
   - Time off request pages
   - User directory
   - Forms handling

2. **Router Features:**
   - Middleware-based routing to external apps
   - Edge Config for dynamic URL management
   - SSO cookie passing
   - Coming soon page fallbacks

## Recommended Architecture

### 1. Ganger-Actions (Employee Hub)

**Scope: Core employee self-service functionality**

```
Features to Include:
├── Authentication & Session Management
├── Employee Dashboard
│   ├── Personal stats and notifications
│   ├── Quick actions grid
│   ├── Recent activity feed
│   └── Upcoming events
├── Forms & Requests
│   ├── Support Tickets (create, view, track)
│   ├── Time Off Requests
│   ├── Punch Fix Requests
│   ├── Availability Changes
│   ├── Expense Reimbursement
│   ├── Meeting Requests
│   └── Impact Filter (suggestions)
├── Personal Management
│   ├── My Profile
│   ├── My Tickets (list, filter, search)
│   ├── My Requests (consolidated view)
│   ├── My Schedule
│   └── My Documents
├── Team Features
│   ├── Employee Directory
│   ├── Team Calendar
│   ├── Announcements
│   └── Resources/Handbooks
└── Manager Tools (role-based)
    ├── Team Overview
    ├── Approval Queue
    ├── Team Reports
    └── Direct Report Management
```

**Technical Implementation:**
- Use existing form components from reference app
- Implement all 7 form types from PHP portal
- Port ticket management system
- Add file upload with Supabase Storage
- Implement comment system
- Add real-time notifications
- Mobile-first responsive design

**API Endpoints to Implement:**
```
/api/tickets/* - Full CRUD for tickets
/api/forms/* - Dynamic form handling
/api/users/* - User management
/api/notifications/* - Real-time updates
/api/files/* - File upload/download
/api/comments/* - Comment threading
/api/reports/* - Manager reporting
```

### 2. Ganger-Staff (Router/Launcher)

**Scope: Platform navigation and app launching**

```
Features to Include:
├── App Launcher Dashboard
│   ├── App grid with icons
│   ├── Search/filter apps
│   ├── Favorites/pinned apps
│   ├── Recently used apps
│   └── App categories
├── Platform Status
│   ├── System health indicators
│   ├── App availability status
│   ├── Maintenance notices
│   └── Platform announcements
├── Navigation Hub
│   ├── Universal search
│   ├── Quick links
│   ├── Platform-wide notifications
│   └── User menu
└── Edge Middleware Router
    ├── Dynamic URL mapping
    ├── SSO cookie management
    ├── Fallback handling
    └── Performance monitoring
```

**Technical Implementation:**
- Extract current middleware.ts routing logic
- Create visual app launcher UI
- Add app search and categorization
- Implement favorites/pinning system
- Add platform-wide search
- Keep Edge Config integration
- Minimal backend - mostly routing

**Apps to Route:**
```javascript
const appCategories = {
  medical: [
    'inventory', 'handouts', 'medication-auth', 
    'checkin-kiosk', 'clinical-staffing'
  ],
  business: [
    'eos-l10', 'batch-closeout', 'pharma-scheduling',
    'call-center-ops', 'socials-reviews'
  ],
  platform: [
    'config-dashboard', 'integration-status', 
    'platform-dashboard', 'component-showcase'
  ],
  training: [
    'compliance-training', 'ai-receptionist'
  ]
};
```

## Migration Strategy

### Phase 1: Split Current Ganger-Actions
1. Create new ganger-staff app with routing logic
2. Move middleware.ts to ganger-staff
3. Move app launcher UI to ganger-staff
4. Keep employee features in ganger-actions

### Phase 2: Enhance Ganger-Actions
1. Port all 7 form types from PHP portal
2. Implement complete ticket management
3. Add file upload system
4. Create manager approval workflows
5. Add comment system
6. Implement real-time notifications

### Phase 3: Complete Ganger-Staff
1. Design visual app launcher
2. Add search and categorization
3. Implement favorites system
4. Add platform status monitoring
5. Create universal search

### Phase 4: Integration
1. Update all app links to use new router
2. Test SSO between all apps
3. Verify edge routing works
4. Update documentation

## Database Schema Requirements

```sql
-- Core tables needed for ganger-actions
CREATE TABLE staff_tickets (
  id UUID PRIMARY KEY,
  ticket_number SERIAL,
  form_type VARCHAR(50),
  status VARCHAR(50),
  priority VARCHAR(50),
  submitter_id UUID REFERENCES auth.users,
  assigned_to UUID REFERENCES auth.users,
  location VARCHAR(100),
  data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE staff_comments (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES staff_tickets,
  user_id UUID REFERENCES auth.users,
  comment TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE staff_attachments (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES staff_tickets,
  user_id UUID REFERENCES auth.users,
  file_name VARCHAR(255),
  file_path TEXT,
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ
);

CREATE TABLE staff_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  employee_id VARCHAR(50),
  full_name VARCHAR(255),
  location VARCHAR(100),
  department VARCHAR(100),
  role VARCHAR(50),
  manager_id UUID REFERENCES staff_user_profiles,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## UI/UX Considerations

### Ganger-Actions (Employee Hub)
- **Mobile-first design** - Most staff access on phones
- **Offline capability** - PWA for field staff
- **Quick actions** - One-tap access to common tasks
- **Smart defaults** - Pre-fill forms with user data
- **Batch operations** - Handle multiple tickets at once

### Ganger-Staff (Router)
- **Visual app grid** - Icons and descriptions
- **Instant search** - Find apps quickly
- **Keyboard navigation** - Power user shortcuts
- **Status indicators** - Show app health
- **Responsive grid** - Adapt to screen size

## Security Requirements

### Both Applications
- Google OAuth with domain restriction
- Session management with Supabase
- CSRF protection on all forms
- Input validation with Zod
- XSS prevention
- HTTPS only

### Ganger-Actions Specific
- File upload validation
- Role-based data access
- Audit logging for changes
- PII data encryption

### Ganger-Staff Specific
- Secure cookie passing
- Edge function security
- URL validation
- Rate limiting on routing

## Performance Targets

### Ganger-Actions
- Initial load: < 2s
- Form submission: < 1s
- Search results: < 500ms
- File upload: Progress indication

### Ganger-Staff
- App launch: < 300ms
- Route resolution: < 100ms
- Search: Instant (< 100ms)
- Status check: < 1s

## Conclusion

The reference applications provide a clear blueprint for splitting ganger-actions into two focused applications:

1. **Ganger-Actions**: A comprehensive employee self-service hub with forms, tickets, and team features
2. **Ganger-Staff**: A lightweight router and app launcher for platform navigation

This separation follows the single responsibility principle and allows each app to excel at its core purpose while maintaining the unified platform experience.