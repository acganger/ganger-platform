# BEAST MODE NEW APPLICATION - PHARMACEUTICAL REP SCHEDULING
# FROM: Desktop Coordination (Clinical Staffing Complete)
# TO: Terminal 2 (BACKEND-TERMINAL) ⚙️

## PROJECT STATUS: Clinical Staffing Complete - Starting Pharma Scheduling
## TERMINAL ROLE: Backend Development - Pharmaceutical Rep Scheduling System

## MISSION CRITICAL CONTEXT:
✅ CLINICAL STAFFING: 95% complete, production-ready, waiting for API credentials
🎯 NEW APPLICATION: Pharmaceutical Rep Scheduling System - REPLACE TIMETRADE
Timeline: Build complete backend while Terminal 1 finishes EOS L10

## YOUR NEW RESPONSIBILITIES:
1. Complete database schema for pharmaceutical rep scheduling
2. Google Calendar integration for staff availability sync
3. Approval workflow system for booking requests
4. Email/SMS notification system for confirmations and reminders
5. TimeTrade migration system for existing appointments
6. Compliance audit trail for pharmaceutical interactions

## STAY IN YOUR LANE - BACKEND ONLY:
✅ YOU HANDLE: Database schema, booking logic, approval workflows, integrations
❌ AVOID: UI components, frontend pages, styling
📋 COORDINATE: Terminal 1 continues EOS L10 (separate application)

## CURRENT INFRASTRUCTURE READY:
✅ Universal Communication Hub: Twilio MCP for SMS notifications
✅ Universal Payment Hub: Not needed for this app (free bookings)
✅ Time MCP: HIPAA-compliant timestamping for audit trails
✅ Database: Supabase with real-time capabilities
✅ Authentication: Google OAuth with @gangerdermatology.com domain

## PHARMACEUTICAL REP SCHEDULING REQUIREMENTS:

### **1. DATABASE SCHEMA DESIGN (HIGH PRIORITY)**

**Core Tables Needed:**
```sql
-- Pharmaceutical representative accounts
CREATE TABLE pharma_representatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Scheduled appointments (core booking system)
CREATE TABLE pharma_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Analytics for reporting
CREATE TABLE pharma_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

### **2. BOOKING ENGINE & AVAILABILITY SYSTEM (HIGH PRIORITY)**

**Availability Calculation Engine:**
```typescript
// Build intelligent availability system
interface AvailabilityEngine {
  calculation: AvailabilityCalculator;
  conflicts: ConflictDetection;
  optimization: SlotOptimization;
  realtime: LiveAvailability;
}

// Key services to build:
- AvailabilityCalculator: Real-time slot calculation with conflicts
- ConflictDetection: Google Calendar integration for staff conflicts
- SlotOptimization: Intelligent slot suggestions based on patterns
- LiveAvailabilityService: Real-time updates for booking interface
```

### **3. APPROVAL WORKFLOW SYSTEM (HIGH PRIORITY)**

**Booking Approval Engine:**
```typescript
// Build comprehensive approval system
interface ApprovalSystem {
  workflow: ApprovalWorkflow;
  notifications: ApprovalNotifications;
  escalation: EscalationRules;
  audit: ApprovalAuditTrail;
}

// Key features to build:
- ApprovalWorkflowService: Multi-stage approval process
- NotificationService: Real-time alerts for pending approvals
- EscalationEngine: Automatic escalation for overdue approvals
- AuditTrailService: Complete pharmaceutical compliance tracking
```

### **4. GOOGLE CALENDAR INTEGRATION (MEDIUM PRIORITY)**

**Calendar Sync System:**
```typescript
// Build calendar integration
interface CalendarIntegration {
  sync: CalendarSync;
  conflicts: ConflictDetection;
  events: EventManagement;
  availability: AvailabilitySync;
}

// Integration requirements:
- Staff calendar sync for availability checking
- Automatic calendar event creation for approved appointments
- Conflict detection with existing appointments
- Real-time availability updates based on calendar changes
```

### **5. COMMUNICATION & NOTIFICATIONS (MEDIUM PRIORITY)**

**Notification System:**
```typescript
// Build comprehensive communication system
interface CommunicationSystem {
  email: EmailNotifications;
  sms: SMSNotifications;
  templates: MessageTemplates;
  compliance: CommunicationCompliance;
}

// Integration with Universal Communication Hub:
- Email confirmations and reminders
- SMS notifications for urgent updates
- Template management for consistent messaging
- Compliance tracking for pharmaceutical regulations
```

### **6. TIMETRADE MIGRATION SYSTEM (LOWER PRIORITY)**

**Data Migration Engine:**
```typescript
// Build TimeTrade migration system
interface MigrationSystem {
  import: DataImport;
  validation: DataValidation;
  mapping: FieldMapping;
  verification: IntegrityCheck;
}

// Migration requirements:
- Import existing TimeTrade appointments
- Map TimeTrade users to pharmaceutical reps
- Validate data integrity and completeness
- Preserve appointment history and compliance records
```

## INTEGRATION REQUIREMENTS:

### **Universal Communication Hub Integration:**
```typescript
// Integrate with existing Twilio MCP
import { TwilioCommunicationService } from '@ganger/integrations/communication';

class PharmaNotificationService {
  private communicationService: TwilioCommunicationService;

  async sendBookingConfirmation(appointment: PharmaAppointment): Promise<void> {
    // Use existing Universal Communication Hub
    await this.communicationService.sendEmail({
      to: appointment.rep_email,
      subject: `Appointment Confirmed: ${appointment.activity_name}`,
      template: 'pharma_booking_confirmation',
      data: {
        appointment_date: appointment.appointment_date,
        location: appointment.location,
        contact_info: appointment.location_contact
      }
    });
  }

  async sendApprovalReminder(appointment: PharmaAppointment): Promise<void> {
    await this.communicationService.sendSMS({
      to: appointment.manager_phone,
      message: `Pharmaceutical rep booking pending approval: ${appointment.activity_name} on ${appointment.appointment_date}`
    });
  }
}
```

### **Google Calendar API Integration:**
```typescript
// Build Google Calendar service
import { GoogleCalendarService } from '@ganger/integrations/google';

class PharmaCalendarService {
  private calendarService: GoogleCalendarService;

  async createAppointmentEvent(appointment: PharmaAppointment): Promise<string> {
    // Create calendar event for approved appointment
    return await this.calendarService.createEvent({
      summary: `Pharma Rep: ${appointment.company_name}`,
      description: `${appointment.rep_name} - ${appointment.special_requests}`,
      start: {
        dateTime: `${appointment.appointment_date}T${appointment.start_time}`,
        timeZone: 'America/Detroit'
      },
      end: {
        dateTime: `${appointment.appointment_date}T${appointment.end_time}`,
        timeZone: 'America/Detroit'
      },
      location: appointment.location_address,
      attendees: appointment.participants.map(p => ({ email: p.email }))
    });
  }

  async checkStaffAvailability(date: string, startTime: string, endTime: string): Promise<boolean> {
    // Check for conflicts with staff calendars
    const conflicts = await this.calendarService.checkConflicts(date, startTime, endTime);
    return conflicts.length === 0;
  }
}
```

### **Time MCP Integration for Compliance:**
```typescript
// Use Time MCP for pharmaceutical audit trails
import { TimeMCPService } from '@ganger/integrations/time';

class PharmaComplianceService {
  private timeMCP: TimeMCPService;

  async logPharmaceuticalInteraction(interaction: PharmaInteraction): Promise<void> {
    // Use Time MCP for precise compliance timestamps
    const preciseTimestamp = await this.timeMCP.getCurrentTimestamp({
      timezone: 'America/Detroit',
      precision: 'milliseconds'
    });

    await this.db.pharma_communications.insert({
      ...interaction,
      compliance_timestamp: preciseTimestamp,
      audit_trail_id: await this.generateAuditTrailId()
    });
  }
}
```

## PERFORMANCE TARGETS:
- < 500ms for availability queries across all locations
- < 2 seconds for booking submission and processing
- < 1 second for approval status updates
- < 30 seconds for Google Calendar sync operations
- 99.9% uptime for booking system during business hours

## QUALITY GATES:
- All pharmaceutical interactions must maintain audit trails
- Google Calendar integration must handle API rate limits
- Approval workflows must prevent double-booking
- Email/SMS notifications must be reliable
- Integration with existing Universal Hubs must be seamless

## SUCCESS CRITERIA:
- Complete pharmaceutical rep scheduling system operational
- TimeTrade replacement ready for cutover
- Google Calendar integration working with staff accounts
- Approval workflows tested and validated
- Compliance audit trail meeting pharmaceutical regulations
- Ready for frontend development and user testing

This pharmaceutical representative scheduling system will replace TimeTrade with a modern, integrated solution that provides better booking experience while maintaining complete compliance audit trails.

BUILD THE PHARMA SCHEDULING SYSTEM THAT REPLACES TIMETRADE! 🏥📅🚀