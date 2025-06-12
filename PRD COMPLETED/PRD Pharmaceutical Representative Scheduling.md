# PRD: Pharmaceutical Representative Scheduling System
*Ganger Platform Standard Application*

## 📋 Document Information
- **Application Name**: Pharmaceutical Representative Scheduling System
- **Priority**: Medium
- **Development Timeline**: 4-5 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations
- **Integration Requirements**: Google Calendar API, Email services, SMS notifications, TimeTrade migration

---

## 🎯 Product Overview

### **Purpose Statement**
Replace the current TimeTrade system with a custom pharmaceutical representative appointment scheduling platform that manages lunch meetings and educational sessions across all clinic locations. The system enables pharma reps to book appointments, manages clinic availability, and integrates with staff calendars while maintaining compliance with pharmaceutical industry regulations.

### **Target Users**
- **Primary**: Pharmaceutical Representatives - booking lunch meetings and educational sessions
- **Secondary**: Office Managers (manager role) - managing availability and approvals
- **Tertiary**: Clinical Staff (staff role) - viewing scheduled pharma appointments and managing participation

### **Success Metrics**
- 100% migration from TimeTrade with zero appointment loss
- 50% reduction in scheduling conflicts through improved availability management
- 90% pharmaceutical representative satisfaction with booking experience
- 95% staff attendance rate for scheduled pharma appointments
- Complete compliance audit trail for all pharmaceutical interactions

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard)**
```yaml
Frontend: Next.js 14+ with TypeScript
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with static asset support)
Styling: Tailwind CSS + Ganger Design System
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
```

### **Required Shared Packages**
```typescript
import { Button, Input, LoadingSpinner, DataTable, Calendar } from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { GoogleCalendar, EmailService, SMSService } from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

### **App-Specific Technology**
- **Calendar Integration**: Google Calendar API for staff schedule synchronization
- **Availability Management**: Real-time availability checking across locations
- **Appointment Booking**: Multi-step booking wizard with validation
- **Email Automation**: Automated confirmations, reminders, and cancellation notifications
- **Compliance Tracking**: Complete audit trail for pharmaceutical industry compliance
- **Multi-location Support**: Location-specific availability and booking rules

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'pharma_rep';

interface Permissions {
  bookAppointments: ['pharma_rep'];
  manageAvailability: ['manager', 'superadmin'];
  viewSchedule: ['staff', 'manager', 'superadmin'];
  approveBookings: ['manager', 'superadmin'];
  exportReports: ['manager', 'superadmin'];
  manageRepAccounts: ['superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com for staff (Google OAuth)
- **External Rep Access**: Separate authentication system for pharmaceutical representatives
- **Multi-location Access**: Based on user.locations assignment for staff
- **Session Management**: 24-hour JWT tokens with refresh for staff, 4-hour sessions for reps
- **Audit Logging**: All pharmaceutical interactions logged per compliance requirements
- **Data Segregation**: Rep-specific data isolation with secure access controls

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
notifications, notification_preferences,
file_uploads, document_storage
```

### **App-Specific Tables**
```sql
-- Pharmaceutical representative accounts
CREATE TABLE pharma_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  company_name TEXT NOT NULL,
  territory TEXT,
  title TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  account_created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  notes TEXT, -- Internal staff notes about rep
  preferred_locations TEXT[], -- Array of preferred clinic locations
  specialties TEXT[], -- Therapeutic areas of focus
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment scheduling activities (like TimeTrade activities)
CREATE TABLE scheduling_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name TEXT NOT NULL, -- "Pharma Lunch Ann Arbor", etc.
  location TEXT NOT NULL, -- Ann Arbor, Plymouth, Wixom
  location_address TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  block_off_minutes INTEGER DEFAULT 0, -- Buffer time after appointment
  appointment_type TEXT NOT NULL DEFAULT 'in_person', -- in_person, virtual
  max_participants INTEGER DEFAULT 10,
  requires_approval BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  available_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=7
  available_times JSONB, -- Available time slots per day
  booking_window_weeks INTEGER DEFAULT 20, -- How far in advance booking allowed
  cancellation_hours INTEGER DEFAULT 24, -- Minimum notice for cancellation
  description TEXT,
  special_instructions TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled appointments
CREATE TABLE pharma_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES scheduling_activities(id),
  rep_id UUID NOT NULL REFERENCES pharma_representatives(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  location TEXT NOT NULL,
  location_address TEXT NOT NULL,
  participant_count INTEGER DEFAULT 0,
  approval_status TEXT DEFAULT 'pending', -- pending, approved, denied
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,
  special_requests TEXT,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT, -- Email of who cancelled
  cancellation_reason TEXT,
  completed_at TIMESTAMPTZ,
  google_calendar_event_id TEXT, -- For calendar integration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff participation tracking
CREATE TABLE appointment_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES pharma_appointments(id) ON DELETE CASCADE,
  staff_email TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  participation_status TEXT DEFAULT 'invited', -- invited, confirmed, declined, attended
  rsvp_at TIMESTAMPTZ,
  attendance_confirmed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability overrides and blackout dates
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES scheduling_activities(id),
  override_date DATE NOT NULL,
  override_type TEXT NOT NULL, -- 'blackout', 'special_hours', 'closed'
  custom_times JSONB, -- Custom available times if override_type = 'special_hours'
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(activity_id, override_date)
);

-- Communication log for compliance
CREATE TABLE pharma_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES pharma_appointments(id),
  rep_id UUID NOT NULL REFERENCES pharma_representatives(id),
  communication_type TEXT NOT NULL, -- 'booking_request', 'confirmation', 'reminder', 'cancellation', 'follow_up'
  method TEXT NOT NULL, -- 'email', 'sms', 'phone', 'in_person'
  content TEXT, -- Message content for compliance tracking
  sent_to TEXT[], -- Array of recipients
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent', -- sent, delivered, failed, bounced
  created_by TEXT, -- System or user email
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring appointment preferences
CREATE TABLE recurring_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES pharma_representatives(id),
  activity_id UUID NOT NULL REFERENCES scheduling_activities(id),
  frequency TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  preferred_day_of_week INTEGER, -- 1-7, Monday=1
  preferred_time TIME,
  preferred_week_of_month INTEGER, -- 1-4 for monthly
  is_active BOOLEAN DEFAULT TRUE,
  next_suggested_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rep_id, activity_id)
);

-- Analytics for reporting
CREATE TABLE pharma_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analytics_date DATE NOT NULL,
  location TEXT NOT NULL,
  total_appointments INTEGER DEFAULT 0,
  confirmed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  unique_reps INTEGER DEFAULT 0,
  average_booking_lead_time_days DECIMAL(4,1),
  cancellation_rate DECIMAL(5,2),
  attendance_rate DECIMAL(5,2),
  most_popular_time_slot TIME,
  busiest_day_of_week INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(analytics_date, location)
);
```

### **Data Relationships**
- Links to shared `users` table for staff tracking and approval workflows
- Connects to `locations` for multi-location scheduling management
- Integrates with Google Calendar through calendar event IDs
- Compliance audit trail connects to shared `audit_logs` table
- Real-time notifications through shared notification system

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
GET    /api/appointments              // List pharma appointments with filters
POST   /api/appointments              // Create new appointment booking
GET    /api/appointments/[id]         // Get specific appointment
PUT    /api/appointments/[id]         // Update appointment
DELETE /api/appointments/[id]         // Cancel appointment

GET    /api/activities               // List scheduling activities
POST   /api/activities               // Create new activity (managers only)
GET    /api/activities/[id]          // Get specific activity
PUT    /api/activities/[id]          // Update activity
```

### **App-Specific Endpoints**
```typescript
// Public booking interface (for pharma reps)
GET    /api/public/activities        // Get available booking activities
GET    /api/public/availability/[activityId] // Get available time slots
POST   /api/public/book              // Submit booking request
GET    /api/public/appointments/[token] // Get appointment details (secure token)
POST   /api/public/cancel/[token]    // Cancel appointment (secure token)

// Rep account management
POST   /api/reps/register            // New rep account registration
POST   /api/reps/login               // Rep authentication
GET    /api/reps/profile             // Get rep profile
PUT    /api/reps/profile             // Update rep profile
GET    /api/reps/appointments        // Get rep's appointments
POST   /api/reps/recurring           // Set recurring preferences

// Availability management
GET    /api/availability/[activityId]/[date] // Check specific date availability
POST   /api/availability/override    // Create availability override
DELETE /api/availability/override/[id] // Remove availability override
GET    /api/availability/calendar/[activityId] // Get calendar view

// Approval workflow
GET    /api/approvals/pending        // Get pending appointment approvals
POST   /api/approvals/[id]/approve   // Approve appointment
POST   /api/approvals/[id]/deny      // Deny appointment
GET    /api/approvals/history        // Get approval history

// Calendar integration
POST   /api/calendar/sync/[appointmentId] // Sync to Google Calendar
DELETE /api/calendar/sync/[appointmentId] // Remove from Google Calendar
GET    /api/calendar/conflicts       // Check for scheduling conflicts

// Communication
POST   /api/communications/send      // Send appointment communications
GET    /api/communications/log/[appointmentId] // Get communication history
POST   /api/communications/reminder  // Send appointment reminders

// Analytics and reporting
GET    /api/analytics/appointments   // Appointment analytics
GET    /api/analytics/reps           // Rep activity analytics
GET    /api/analytics/locations      // Location utilization
GET    /api/reports/compliance       // Compliance reporting
GET    /api/reports/export           // Export appointment data

// TimeTrade migration
POST   /api/migration/import         // Import TimeTrade data
GET    /api/migration/status         // Get migration progress
POST   /api/migration/validate       // Validate migrated data
```

### **External Integrations**
- **Google Calendar API**: Staff calendar integration and conflict checking
- **Email Services**: Automated confirmation and reminder emails
- **SMS Services**: Optional SMS notifications for appointment updates
- **TimeTrade API**: Data migration from existing system
- **Error Handling**: Standard retry logic with exponential backoff
- **Rate Limiting**: Respect Google Calendar API limits
- **Authentication**: Secure credential management through shared auth system

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // Professional/medical
  secondary: 'green-600',   // Success/confirmed
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Pending approvals
  danger: 'red-600'         // Cancellations/errors
}

// Appointment status indicators
appointmentStatus: {
  pending: 'yellow-500',
  confirmed: 'green-500',
  cancelled: 'red-500',
  completed: 'blue-500',
  denied: 'orange-500'
}

// Location-specific colors
locations: {
  'Ann Arbor': 'blue-500',
  'Plymouth': 'green-500',
  'Wixom': 'purple-500'
}
```

### **Component Usage**
```typescript
import {
  // Layout
  AppLayout, PageHeader, NavigationTabs,
  
  // Forms
  FormBuilder, Button, Input, Select, DatePicker,
  
  // Data Display
  Calendar, DataTable, AppointmentCard, TimeSlotPicker,
  
  // Feedback
  LoadingSpinner, ErrorBoundary, SuccessToast,
  
  // Scheduling-specific
  AvailabilityCalendar, BookingWizard, ApprovalQueue,
  ParticipantList, RecurringSettings
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Public Booking Interface**: Clean, professional interface for pharmaceutical reps
- **Calendar Views**: Month, week, and day views with appointment density indicators
- **Approval Dashboard**: Queue-based interface for managers to review booking requests
- **Availability Management**: Drag-and-drop interface for setting available time slots
- **Multi-location Support**: Clear location indicators and filtering
- **Mobile Responsive**: Touch-friendly for tablet and mobile booking
- **Accessibility**: Screen reader support and keyboard navigation for compliance

---

## 📱 User Experience

### **User Workflows**
1. **Pharmaceutical Rep Booking**:
   - Browse available activities by location
   - Select preferred date and time from available slots
   - Provide appointment details and special requests
   - Submit booking request for approval
   - Receive confirmation once approved

2. **Staff Approval Process**:
   - Review pending booking requests in approval queue
   - Check for scheduling conflicts with existing commitments
   - Approve or deny requests with optional notes
   - Automated notifications sent to reps upon decision

3. **Availability Management** (Managers):
   - Set default availability patterns for each activity
   - Create blackout dates for holidays or special events
   - Override availability for specific dates
   - Manage participant limits and booking rules

4. **Appointment Management**:
   - View upcoming appointments in calendar format
   - Send manual reminders or updates to participants
   - Track attendance and completion status
   - Generate compliance reports

### **Performance Requirements**
- **Availability Check**: < 500ms for real-time availability queries
- **Booking Submission**: < 2 seconds from form submission to confirmation
- **Calendar Loading**: < 1 second for monthly calendar view
- **Approval Processing**: < 30 seconds from approval to notification
- **Data Migration**: Complete TimeTrade import within 4 hours
- **Real-time Updates**: < 200ms latency for appointment status changes

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all interfaces
- **Keyboard Navigation**: Full booking workflow accessible via keyboard
- **Screen Reader Support**: Calendar navigation and form completion
- **High Contrast Mode**: For various lighting conditions
- **Touch Accessibility**: Large touch targets (44px minimum)
- **Multi-language**: English with potential for Spanish support

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
Unit Tests: 85%+ coverage for booking logic and availability calculations
Integration Tests: Google Calendar API, email services, authentication
E2E Tests: Complete booking workflow from rep request to approval
Performance Tests: Concurrent booking requests and availability checks
Accessibility Tests: Automated WCAG validation
Migration Tests: TimeTrade data import validation and integrity
```

### **Test Scenarios**
- Pharmaceutical rep booking with various time slot combinations
- Approval workflow with conflicting appointments
- Availability override scenarios and edge cases
- Calendar integration with Google Workspace accounts
- Email delivery and notification systems
- Multi-location booking conflicts and resolution
- Recurring appointment preference handling
- Data migration accuracy and completeness

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with compliance audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# App-specific variables
GOOGLE_CALENDAR_API_KEY=calendar_api_key
PHARMA_BOOKING_DOMAIN=scheduling.gangerdermatology.com
EMAIL_SERVICE_API_KEY=email_service_key
SMS_SERVICE_API_KEY=sms_service_key
TIMETRADE_MIGRATION_API_KEY=timetrade_import_key
APPOINTMENT_BUFFER_MINUTES=15
DEFAULT_BOOKING_WINDOW_WEEKS=20
COMPLIANCE_RETENTION_YEARS=7
```

### **Monitoring & Alerts**
- **Health Checks**: Google Calendar API connectivity, email service status
- **Error Tracking**: Failed bookings, approval failures, notification delivery issues
- **Performance Monitoring**: Booking completion times, availability query performance
- **Compliance Monitoring**: Complete audit trail verification
- **Usage Analytics**: Daily booking volumes, rep activity patterns

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Daily active users, session duration, feature usage
- **Performance Metrics**: Average booking time, error rates, uptime
- **Security Metrics**: Authentication attempts, permission violations

### **App-Specific Analytics**
- **Booking Efficiency**: Time to complete booking vs. TimeTrade baseline
- **Approval Metrics**: Average approval time, approval rates by manager
- **Rep Engagement**: Booking frequency, preferred locations and times
- **Location Utilization**: Appointment density by location and time slot
- **Attendance Tracking**: Show rates and no-show patterns
- **Seasonal Patterns**: Booking trends throughout the year
- **Compliance Reporting**: Complete pharmaceutical interaction audit trails

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: All pharmaceutical rep and appointment data encrypted at rest and in transit
- **Authentication**: Multi-factor where appropriate for administrative functions
- **Authorization**: Principle of least privilege for appointment access
- **Audit Logging**: All pharmaceutical interactions logged per compliance requirements
- **Session Security**: Automatic timeout and secure session management

### **Pharmaceutical Industry Compliance**
- **Sunshine Act Compliance**: Complete interaction tracking for pharmaceutical transparency
- **HIPAA Considerations**: Patient data protection where applicable
- **Audit Requirements**: 7-year retention of all pharmaceutical interactions
- **Access Controls**: Role-based access to pharmaceutical rep information
- **Data Retention**: Automated compliance with industry record-keeping requirements

### **App-Specific Security**
- **Rep Account Verification**: Email verification and company validation
- **Booking Token Security**: Secure, time-limited tokens for appointment management
- **Calendar Integration Security**: OAuth 2.0 for Google Calendar access
- **Communication Encryption**: Encrypted email and SMS communications
- **Migration Security**: Secure data transfer from TimeTrade system

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All critical booking workflows functional
- [ ] TimeTrade data successfully migrated with zero appointment loss
- [ ] Google Calendar integration tested with all staff accounts
- [ ] Pharmaceutical rep accounts created and validated
- [ ] Approval workflow tested with all manager roles
- [ ] Email and SMS notification systems operational
- [ ] Compliance audit trail verified and tested
- [ ] Staff training completed and documented

### **Success Metrics (6 months)**
- 100% successful migration from TimeTrade
- 50% reduction in scheduling conflicts
- 90% pharmaceutical representative satisfaction rating
- 95% staff attendance rate for scheduled appointments
- Zero compliance violations or audit issues
- 75% reduction in scheduling administration time
- 98% system uptime during business hours
- 100% staff adoption across all locations

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Google Calendar Sync**: Monthly integration health checks
- **Pharmaceutical Rep Database**: Quarterly account verification and cleanup
- **Compliance Audit**: Annual review of all pharmaceutical interactions
- **Performance Optimization**: Ongoing booking and availability optimization
- **Security Reviews**: Annual penetration testing and compliance audit

### **Future Enhancements**
- **Mobile App**: Native mobile app for pharmaceutical reps
- **Advanced Analytics**: Predictive booking patterns and optimization
- **Integration Expansion**: Connect with pharmaceutical company CRM systems
- **Automated Scheduling**: AI-powered optimal time slot suggestions
- **Video Integration**: Virtual meeting capabilities for remote appointments
- **Advanced Reporting**: Comprehensive pharmaceutical interaction analytics
- **Multi-timezone Support**: Support for national pharmaceutical territories

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Google Calendar API integration guide
- [ ] TimeTrade migration procedures and data mapping
- [ ] Pharmaceutical rep authentication system
- [ ] Approval workflow implementation
- [ ] Compliance audit trail architecture

### **User Documentation**
- [ ] Pharmaceutical rep booking guide
- [ ] Staff approval workflow procedures
- [ ] Availability management for office managers
- [ ] Compliance reporting and audit procedures
- [ ] Emergency procedures for booking system outages
- [ ] Video tutorials for all major workflows

---

*This pharmaceutical representative scheduling system replaces TimeTrade with a modern, compliant, and integrated solution that enhances the booking experience while maintaining complete audit trails for pharmaceutical industry compliance.*