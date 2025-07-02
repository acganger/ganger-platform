# Ganger Actions & Staff Portal - Full Build Reference Document

*Created: January 7, 2025*
*Purpose: Comprehensive guide for building out ganger-actions (employee hub) and ganger-staff (router) to full functionality*

## Overview

This document provides the complete implementation roadmap for rebuilding the Ganger platform's staff applications based on analysis of:
1. **ganger-staff-reference** - The attempted Next.js rebuild
2. **PHP legacy staff portal** - The original working implementation

## Architecture Summary

### ganger-staff (Router App)
- **Purpose**: Minimal entry point and Edge Config router
- **URL**: staff.gangerdermatology.com
- **Functionality**: Authentication, routing, app launcher
- **Status**: ✅ DEPLOYED and working

### ganger-actions (Employee Hub)
- **Purpose**: Comprehensive employee functionality portal
- **URL**: Routed through staff.gangerdermatology.com/actions
- **Functionality**: Forms, dashboards, tickets, user management
- **Status**: 🚧 TO BE BUILT

## Complete Feature List from Reference Apps

### 1. Form System (7 Types)

Based on PHP legacy implementation, all forms must support:

#### 1.1 Support Ticket
```typescript
interface SupportTicket {
  location: 'Ann Arbor' | 'Wixom' | 'Plymouth' | 'Any/All';
  request_type: 
    | 'property_maintenance'    // Outdoor
    | 'building_maintenance'    // Indoor  
    | 'it_support'             // Network/Computer/Software
    | 'clinic_issue'
    | 'admin_issue'
    | 'information_request'
    | 'general_support'
    | 'meeting_request';
  priority: 'Urgent + Important' | 'Urgent + Not Important' | 'Not Urgent + Important' | 'Not Urgent + Not Important';
  details: string;
  photos?: File[];
}
```

#### 1.2 Time Off Request
```typescript
interface TimeOffRequest {
  start_date: string;
  end_date: string;
  requesting_pto: 'Yes' | 'No';
  reason: string;
  comments?: string;
  attachments?: File[];
}
```

#### 1.3 Punch Fix
```typescript
interface PunchFix {
  employee_name: string;      // Managers can select other employees
  employee_email: string;
  date: string;
  in_time?: string;          // At least one required
  out_time?: string;         // At least one required
  comments?: string;
  attachments?: File[];
}
```

#### 1.4 Change of Availability
```typescript
interface ChangeOfAvailability {
  employee_name: string;      // Managers can select other employees
  employee_email: string;
  availability_change: 'Increase' | 'Decrease' | 'Limited' | 'Change of Schedule';
  employment_type: 'Full-Time' | 'Part-Time' | 'PRN';
  effective_date: string;
  probation_completed: 'Yes' | 'No' | 'N/A';
  days_affected?: string[];
  limited_availability_details?: string;
  return_date?: string;
  reason: string;
  additional_comments?: string;
  supporting_documentation?: File[];
}
```

#### 1.5 Expense Reimbursement
```typescript
interface ExpenseReimbursement {
  expense_date: string;
  amount: number;
  category: 'Travel' | 'Supplies' | 'Meals' | 'Other';
  description: string;
  receipt: File[];           // Required
}
```

#### 1.6 Meeting Request
```typescript
interface MeetingRequest {
  meeting_date: string;
  meeting_time: string;
  subject: string;
  participants: string;      // Comma-separated emails
  details: string;
}
```

#### 1.7 Impact Filter (Suggestion Box)
```typescript
interface ImpactFilter {
  goal: string;              // Big idea
  context: string;           // Why now?
  success_definition: string;
  tradeoffs: string;
  participants: string;
  timeframe: string;
}
```

### 2. Dashboard System

#### 2.1 Main Dashboard Features
- **Ticket Statistics**: Cards showing counts by status
- **Recent Activity**: Timeline of recent submissions and updates
- **Quick Actions**: Buttons for common tasks
- **Charts**: Visual analytics for patterns and trends
- **Filters**: By location, type, date range, status

#### 2.2 Manager-Only Features
- **All Tickets View**: See all employee submissions
- **Bulk Actions**: Approve/deny multiple tickets
- **Export Data**: CSV/Excel export functionality
- **Analytics**: Department-wide metrics
- **User Management**: Create/manage staff accounts

### 3. User Management (Critical Missing Feature)

From PHP legacy `User-Create.php`:

```typescript
interface UserCreation {
  firstName: string;
  lastName: string;
  email: string;             // Must be @gangerdermatology.com
  recoveryEmail?: string;
  recoveryPhone?: string;
  orgUnit: '/Google Cloud Identity';
  groups: ['gci-users@gangerdermatology.com'];
  // Creates Google Workspace account via Admin SDK
}
```

### 4. Navigation & External Links

#### 4.1 Main Navigation
```typescript
const navigation = {
  forms: {
    label: 'Submit Request',
    items: [
      { label: 'Support Ticket', href: '/actions/forms/support', icon: 'TicketIcon' },
      { label: 'Time Off Request', href: '/actions/forms/time-off', icon: 'CalendarIcon' },
      { label: 'Punch Fix', href: '/actions/forms/punch-fix', icon: 'ClockIcon' },
      { label: 'Change of Availability', href: '/actions/forms/availability', icon: 'UserIcon' },
      { label: 'Expense Reimbursement', href: '/actions/forms/expense', icon: 'CurrencyDollarIcon' },
      { label: 'Meeting Request', href: '/actions/forms/meeting', icon: 'UsersIcon' },
      { label: 'Impact Filter', href: '/actions/forms/impact', icon: 'LightBulbIcon' }
    ]
  },
  dashboards: {
    label: 'View & Manage',
    items: [
      { label: 'My Tickets', href: '/actions/tickets/mine' },
      { label: 'All Tickets', href: '/actions/tickets/all', requiresRole: 'manager' },
      { label: 'Analytics', href: '/actions/analytics', requiresRole: 'manager' },
      { label: 'User Management', href: '/actions/users', requiresRole: 'admin' }
    ]
  },
  resources: {
    label: 'Quick Links',
    items: [
      { label: 'Eagle Compliance Login', href: 'https://eaglecompliancesoftware.com/', external: true },
      { label: 'Eagle Compliance Instructions', href: '/resources/eagle-instructions.pdf' },
      { label: 'Specialty Pharmacy Prices', href: '/resources/pharmacy-prices.pdf' },
      { label: 'Shadow Interview Form', href: 'https://forms.gle/...', external: true },
      { label: 'Rockstar Appreciation', href: 'https://forms.gle/...', external: true },
      { label: 'Anonymous Feedback', href: 'https://forms.gle/...', external: true }
    ]
  }
};
```

### 5. API Endpoints Required

Based on PHP `api.php` analysis:

```typescript
// Core ticket operations
POST   /api/tickets                  // Create ticket
GET    /api/tickets                  // List tickets (with filters)
GET    /api/tickets/:id              // Get single ticket
PATCH  /api/tickets/:id/status       // Update status
POST   /api/tickets/:id/comments     // Add comment

// User operations
GET    /api/users/search             // Autocomplete users
GET    /api/users/current            // Get current user
POST   /api/users                    // Create user (admin only)
GET    /api/users/directory          // List all users

// File operations
POST   /api/files/upload             // Upload files
GET    /api/files/:id                // Download file
POST   /api/files/archive            // Archive old files

// Analytics
GET    /api/analytics/dashboard      // Dashboard stats
GET    /api/analytics/activity       // 7-day activity chart
GET    /api/analytics/export         // Export data

// System
GET    /api/system/status            // Health check
POST   /api/system/test-as           // Admin impersonation
```

### 6. Database Schema

From reference apps, complete schema includes:

```sql
-- Core tables (already exist)
staff_tickets
staff_ticket_comments
staff_file_uploads
staff_user_cache
staff_login_attempts
staff_job_queue

-- Additional tables needed
staff_ticket_mentions        -- Track @mentions in comments
staff_ticket_watchers        -- Subscribe to ticket updates
staff_analytics_cache        -- Pre-computed analytics
staff_export_history         -- Track data exports
staff_user_preferences       -- User settings
```

### 7. Component Library Needed

Based on reference implementation:

```
components/
├── forms/
│   ├── FormWizard.tsx              // Multi-step form handler
│   ├── FormField.tsx               // Dynamic field renderer
│   ├── FileUpload.tsx              // Multi-file upload
│   ├── UserAutocomplete.tsx        // Google user search
│   └── DateRangePicker.tsx         // Date selection
├── tickets/
│   ├── TicketList.tsx              // Sortable/filterable table
│   ├── TicketCard.tsx              // Individual ticket display
│   ├── TicketFilters.tsx           // Advanced filtering
│   ├── StatusBadge.tsx             // Status indicators
│   └── BulkActions.tsx             // Manager bulk operations
├── dashboard/
│   ├── StatsCard.tsx               // Metric display
│   ├── ActivityFeed.tsx            // Recent activity
│   ├── Charts/                     // Recharts components
│   │   ├── TicketTrendChart.tsx
│   │   ├── LocationChart.tsx
│   │   └── ResponseTimeChart.tsx
│   └── QuickActions.tsx            // Action buttons
├── users/
│   ├── UserCreateForm.tsx          // Google user creation
│   ├── UserDirectory.tsx           // Staff directory
│   └── UserProfile.tsx             // Profile display
└── common/
    ├── Layout.tsx                  // App layout wrapper
    ├── Navigation.tsx              // Side navigation
    ├── ErrorBoundary.tsx           // Error handling
    ├── LoadingStates.tsx           // Skeletons
    └── ConfirmDialog.tsx           // Action confirmations
```

### 8. Implementation Phases

#### Phase 1: Core Infrastructure (Week 1)
1. Set up ganger-actions with proper structure
2. Implement authentication flow (inherit from ganger-staff)
3. Create base layout and navigation
4. Set up API routes structure
5. Configure database connections

#### Phase 2: Form System (Week 2)
1. Create FormWizard component
2. Implement all 7 form types
3. Add file upload functionality
4. Implement form submission logic
5. Add validation and error handling

#### Phase 3: Dashboard & Tickets (Week 3)
1. Build ticket list with filters
2. Implement ticket detail view
3. Add commenting system with @mentions
4. Create dashboard with statistics
5. Add manager-only features

#### Phase 4: User Management (Week 4)
1. Implement user creation form
2. Add Google Admin SDK integration
3. Create user directory
4. Add user search/autocomplete
5. Implement role management

#### Phase 5: Analytics & Polish (Week 5)
1. Add analytics charts
2. Implement data export
3. Add external resource links
4. Performance optimization
5. Mobile responsiveness

### 9. Key Technical Decisions

#### 9.1 State Management
- Use React Context for auth/user state
- TanStack Query for server state
- Local state for forms

#### 9.2 Styling
- Tailwind CSS with custom design tokens
- Radix UI for accessible components
- Consistent with @ganger/ui patterns

#### 9.3 Data Fetching
- API routes for all operations
- Optimistic updates for better UX
- Proper error boundaries

#### 9.4 Testing Strategy
- Jest for unit tests
- React Testing Library for components
- Playwright for E2E critical paths

### 10. Migration Considerations

#### 10.1 Data Migration
- Existing tickets remain in database
- User cache can be reused
- File uploads need path updates

#### 10.2 URL Redirects
```
/staff/form.php → /actions/forms
/staff/dashboard.php → /actions
/staff/api.php → /api/*
```

#### 10.3 Feature Parity Checklist
- [ ] All 7 form types working
- [ ] Manager dashboard with filters
- [ ] User creation functionality
- [ ] File upload/download
- [ ] Comment system with mentions
- [ ] Analytics and charts
- [ ] External resource links
- [ ] Mobile responsive
- [ ] Role-based access control
- [ ] Data export functionality

### 11. Environment Variables Required

```env
# Google Admin SDK (for user creation)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_ADMIN_CUSTOMER_ID=C02f5q8kn

# Slack Integration (for mentions)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# File Storage
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif

# Session Config
SESSION_LIFETIME=86400    # 24 hours
```

### 12. Success Metrics

1. **Functional Completeness**
   - All 7 form types operational
   - User creation working
   - Analytics dashboard functional

2. **Performance**
   - Page load < 2 seconds
   - Form submission < 1 second
   - Smooth animations/transitions

3. **User Experience**
   - Mobile responsive
   - Intuitive navigation
   - Clear error messages
   - Loading states

4. **Maintainability**
   - TypeScript throughout
   - Comprehensive comments
   - Consistent patterns
   - Test coverage > 80%

## Next Steps

1. **Immediate**: Start Phase 1 infrastructure setup
2. **This Week**: Complete form system implementation
3. **Next Week**: Dashboard and ticket management
4. **Priority**: User creation feature (critical for operations)

*This document should be updated as implementation progresses to reflect actual decisions and discoveries.*