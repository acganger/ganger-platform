# PRD: Patient Check-in Kiosk System
*Ganger Platform Standard Application*

## 📋 Document Information
- **Application Name**: Patient Check-in Kiosk System
- **Priority**: High
- **Development Timeline**: 4 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations
- **Integration Requirements**: ModMed FHIR API, Digital signatures, Form management, Real-time sync

---

## 🎯 Product Overview

### **Purpose Statement**
Create a seamless dual-screen patient check-in system where receptionists use a desktop interface to search and load patient records while patients use an iPad interface to verify information, update details, and complete digital forms. The system integrates with ModMed EHR for real-time patient data and provides comprehensive form management with digital signature capabilities.

### **Target Users**
- **Primary**: Reception Staff (staff role) - patient search and session management
- **Secondary**: Patients - information verification and form completion
- **Tertiary**: Managers (manager role) - analytics and configuration management

### **Success Metrics**
- 70% reduction in patient check-in time vs paper-based process
- 95% reduction in transcription errors
- 60% reduction in manual data entry by staff
- 90% digital form completion rate
- 4.5/5.0 patient satisfaction rating

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
import { Button, Input, LoadingSpinner, DataTable, FormBuilder } from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { ModMedClient, SignatureService, FormProcessor } from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

### **App-Specific Technology**
- **Dual-Screen Design**: Receptionist desktop + patient iPad interfaces
- **Real-time Sync**: WebSocket connections for session state management
- **Digital Signatures**: HIPAA-compliant signature capture and validation
- **Form Engine**: Dynamic form rendering with conditional logic
- **Session Management**: Secure patient sessions with automatic timeout
- **Document Generation**: PDF form completion for patient records

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin';

interface Permissions {
  manageCheckInSessions: ['staff', 'manager', 'superadmin'];
  searchPatients: ['staff', 'manager', 'superadmin'];
  viewAnalytics: ['manager', 'superadmin'];
  manageFormTemplates: ['manager', 'superadmin'];
  configureSystem: ['superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-location Access**: Based on user.locations assignment
- **Session Management**: 24-hour JWT tokens with refresh for staff, temporary sessions for patients
- **Audit Logging**: All patient interactions logged with staff member and session details
- **Patient Privacy**: Temporary sessions with automatic timeout and data purging

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
-- Check-in sessions
CREATE TABLE checkin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_mrn TEXT NOT NULL,
  patient_id TEXT, -- ModMed patient ID
  receptionist_email TEXT NOT NULL,
  location TEXT NOT NULL, -- Ann Arbor, Wixom, Plymouth
  appointment_id TEXT, -- ModMed appointment ID if applicable
  session_status TEXT NOT NULL DEFAULT 'active', -- active, completed, expired, cancelled
  current_step TEXT NOT NULL DEFAULT 'verification', -- verification, forms, signature, complete
  patient_data JSONB NOT NULL, -- Cached patient data from ModMed
  verification_completed BOOLEAN DEFAULT FALSE,
  forms_assigned TEXT[], -- Array of form IDs assigned
  forms_completed TEXT[], -- Array of form IDs completed
  signatures_required TEXT[], -- Array of signature types required
  signatures_completed TEXT[], -- Array of signature IDs completed
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  completed_at TIMESTAMPTZ,
  notes TEXT, -- Staff notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient information verification and updates
CREATE TABLE patient_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES checkin_sessions(id) ON DELETE CASCADE,
  patient_mrn TEXT NOT NULL,
  verification_type TEXT NOT NULL, -- 'initial', 'update', 'correction'
  field_name TEXT NOT NULL, -- Which field was verified/updated
  original_value TEXT, -- Original value from ModMed
  verified_value TEXT, -- Value verified/updated by patient
  requires_staff_review BOOLEAN DEFAULT FALSE,
  staff_approved BOOLEAN DEFAULT FALSE,
  approved_by TEXT, -- Staff member who approved
  verification_method TEXT DEFAULT 'patient_input', -- patient_input, staff_override
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form templates and configurations
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL,
  form_title TEXT NOT NULL,
  form_description TEXT,
  form_category TEXT NOT NULL, -- 'intake', 'consent', 'insurance', 'medical_history'
  location_specific TEXT[], -- Locations where this form applies
  appointment_types TEXT[], -- Appointment types requiring this form
  is_required BOOLEAN DEFAULT TRUE,
  requires_signature BOOLEAN DEFAULT FALSE,
  form_fields JSONB NOT NULL, -- Dynamic form field definitions
  conditional_logic JSONB, -- Rules for showing/hiding fields
  validation_rules JSONB, -- Field validation requirements
  auto_populate_fields JSONB, -- Fields to auto-populate from patient data
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  version_number INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  last_modified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient form submissions
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES checkin_sessions(id) ON DELETE CASCADE,
  form_template_id UUID NOT NULL REFERENCES form_templates(id),
  patient_mrn TEXT NOT NULL,
  form_data JSONB NOT NULL, -- Complete form submission data
  completion_time_seconds INTEGER, -- Time taken to complete
  requires_staff_review BOOLEAN DEFAULT FALSE,
  staff_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by TEXT, -- Staff member who reviewed
  review_notes TEXT,
  submission_ip_address INET,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital signatures
CREATE TABLE digital_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES checkin_sessions(id) ON DELETE CASCADE,
  form_submission_id UUID REFERENCES form_submissions(id),
  patient_mrn TEXT NOT NULL,
  signature_type TEXT NOT NULL, -- 'consent', 'financial_agreement', 'hipaa', 'general'
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  signature_metadata JSONB NOT NULL, -- Timestamp, IP, device info, etc.
  document_hash TEXT, -- Hash of signed document for integrity
  biometric_data JSONB, -- Signing pressure, speed, etc. if available
  legal_name TEXT NOT NULL, -- Name of person signing
  relationship_to_patient TEXT DEFAULT 'self', -- self, parent, guardian, spouse
  witness_name TEXT, -- Staff witness if required
  is_valid BOOLEAN DEFAULT TRUE,
  invalidation_reason TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  witnessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Data Relationships**
- Links to shared `users` table for staff tracking and audit
- Connects to `locations` for multi-location check-in management
- Integrates with ModMed patient data through MRN lookup
- Audit trail connects to shared `audit_logs` table
- Real-time session management with WebSocket subscriptions

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
GET    /api/sessions                // List check-in sessions with filters
POST   /api/sessions                // Create new check-in session
GET    /api/sessions/[id]           // Get specific session
PUT    /api/sessions/[id]           // Update session
DELETE /api/sessions/[id]           // Cancel session

GET    /api/forms                   // List form templates
POST   /api/forms                   // Create new form template
GET    /api/forms/[id]              // Get specific form
PUT    /api/forms/[id]              // Update form template
```

### **App-Specific Endpoints**
```typescript
// Patient identification and search
GET    /api/patients/search         // Enhanced patient search
GET    /api/patients/[mrn]          // Get patient info from ModMed
GET    /api/patients/[mrn]/appointments // Today's appointments
POST   /api/patients/[mrn]/verify   // Verify patient identity

// Session management
POST   /api/sessions/start          // Start new check-in session
POST   /api/sessions/[id]/step      // Update session step
POST   /api/sessions/[id]/complete  // Complete check-in
GET    /api/sessions/active         // Get active sessions
WS     /api/sessions/[id]/realtime  // Real-time session updates

// Form processing
GET    /api/forms/assign/[sessionId] // Get assigned forms for session
POST   /api/forms/submit            // Submit completed form
GET    /api/forms/templates/[type]  // Get forms by appointment type
POST   /api/forms/validate          // Validate form data

// Digital signatures
POST   /api/signatures/capture      // Capture digital signature
GET    /api/signatures/[id]         // Get signature details
POST   /api/signatures/verify       // Verify signature validity

// Real-time communication
WS     /api/realtime/sessions       // Session state updates
POST   /api/realtime/broadcast      // Broadcast session updates

// Analytics and reporting
GET    /api/analytics/checkin       // Check-in completion metrics
GET    /api/analytics/efficiency    // Process efficiency statistics
GET    /api/analytics/forms         // Form completion analytics
```
### **External Integrations**
- **ModMed FHIR**: Patient data retrieval and updates
- **Digital Signature Services**: HIPAA-compliant signature capture
- **Document Generation**: PDF creation for completed forms
- **Error Handling**: Standard retry logic with exponential backoff
- **Rate Limiting**: Respect ModMed API limits
- **Authentication**: Secure credential management through shared auth system

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // Medical professional
  secondary: 'green-600',   // Success/health
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Alerts
  danger: 'red-600'         // Errors/critical
}

// Check-in status indicators
sessionStatus: {
  active: 'blue-500',
  verification: 'yellow-500',
  forms: 'purple-500',
  signature: 'orange-500',
  completed: 'green-500',
  expired: 'red-500'
}
```

### **Component Usage**
```typescript
import {
  // Layout
  AppLayout, PageHeader, NavigationTabs,
  
  // Forms
  FormBuilder, FormField, Button, Input, Checkbox,
  
  // Data Display
  DataTable, ProgressIndicator, PatientCard,
  
  // Feedback
  LoadingSpinner, ErrorBoundary, SuccessToast,
  
  // Check-in specific
  PatientSearch, SessionMonitor, FormRenderer,
  SignaturePad, ProgressTracker
} from '@ganger/ui';
```
### **App-Specific UI Requirements**
- **Dual-Screen Design**: Receptionist desktop interface and patient iPad interface
- **Patient Search**: Enhanced search with auto-suggestions and fuzzy matching
- **Session Monitoring**: Real-time progress tracking across all active sessions
- **Form Rendering**: Dynamic form display with conditional logic
- **Signature Capture**: Touch-optimized signature pad with biometric validation
- **Progress Indicators**: Clear visual feedback for multi-step check-in process
- **Timeout Warnings**: Proactive session timeout notifications
- **Touch-Friendly**: Large buttons and inputs optimized for iPad use

---

## 📱 User Experience

### **User Workflows**
1. **Patient Check-in Process**:
   - Receptionist searches and loads patient record
   - Patient verifies and updates personal information
   - Patient completes assigned forms with real-time validation
   - Patient provides digital signatures where required
   - System generates completed forms and updates ModMed

2. **Receptionist Management**:
   - Monitor multiple patient sessions simultaneously
   - Provide assistance for stuck or problematic sessions
   - Review and approve patient information updates
   - Generate reports on check-in efficiency

3. **Form Configuration** (Managers):
   - Create and edit dynamic form templates
   - Configure form assignment rules by appointment type
   - Set up conditional logic and validation rules
   - Manage digital signature requirements

4. **Session Recovery**:
   - Automatic session restoration after interruptions
   - Manual session override capabilities for staff
   - Data persistence across device disconnections
### **Performance Requirements**
- **Patient Lookup**: < 1 second via MRN search
- **Form Loading**: < 500ms for form template rendering
- **Real-time Sync**: < 200ms latency between receptionist and patient screens
- **Session Timeout**: 30 minutes of inactivity
- **Data Persistence**: Automatic save every 30 seconds
- **Signature Capture**: < 100ms response time for touch input

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all interfaces
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Form fields and navigation elements
- **High Contrast Mode**: For various lighting conditions
- **Touch Accessibility**: Large touch targets (44px minimum)
- **Language Support**: English with Spanish translation capability

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
Unit Tests: 85%+ coverage for form processing and session management
Integration Tests: ModMed API, signature capture, real-time sync
E2E Tests: Complete check-in workflow from search to completion
Performance Tests: Concurrent session handling and real-time updates
Accessibility Tests: Automated WCAG validation
Security Tests: Patient data protection and session security
```

### **Test Scenarios**
- Patient search with various name spellings and MRN formats
- Form completion with validation errors and corrections
- Session timeout and recovery scenarios
- Multiple concurrent patient sessions
- Network interruption during form submission
- Signature capture with various devices and orientations
- ModMed integration with missing or incomplete patient data
- Cross-device session continuity

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with HIPAA-compliant audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# App-specific variables
MODMED_API_URL=https://api.modmed.com/fhir/r4
MODMED_CLIENT_ID=checkin_client
CHECKIN_SESSION_TIMEOUT_MINUTES=30
SIGNATURE_STORAGE_BUCKET=digital-signatures
FORM_TEMPLATES_BUCKET=form-templates
REALTIME_WEBSOCKET_URL=wss://checkin-realtime.gangerdermatology.com
```
### **Monitoring & Alerts**
- **Health Checks**: ModMed API connectivity, form rendering service, signature capture
- **Error Tracking**: Failed check-ins, form submission errors, session timeouts
- **Performance Monitoring**: Check-in completion times, form loading performance
- **Security Monitoring**: Unusual session patterns, authentication failures
- **Usage Analytics**: Daily check-in volumes, form completion rates

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Daily active users, session duration, feature usage
- **Performance Metrics**: Average check-in time, error rates, uptime
- **Security Metrics**: Authentication attempts, permission violations

### **App-Specific Analytics**
- **Check-in Efficiency**: Time reduction vs paper-based process
- **Form Completion**: Completion rates by form type and patient demographics
- **Staff Productivity**: Sessions managed per staff member, assistance rates
- **Patient Experience**: Completion times, satisfaction indicators
- **Error Analysis**: Common form validation errors, session abandonment
- **Signature Success**: Digital signature completion and validation rates
- **Device Usage**: iPad vs desktop usage patterns

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: Patient data encrypted at rest and in transit
- **Authentication**: Multi-factor where appropriate for administrative functions
- **Authorization**: Principle of least privilege for patient data access
- **Audit Logging**: All patient interactions logged with staff and session identifiers
- **Session Security**: Automatic timeout and secure session management

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: Patient health information encrypted and access-controlled
- **Audit Requirements**: Complete check-in and form submission audit trail
- **Data Minimization**: Only collect necessary patient data for check-in process
- **Retention Policy**: Session data retained per medical records requirements
- **Access Controls**: Role-based access to patient information
- **Signature Compliance**: Legally binding digital signatures with full audit trail

### **App-Specific Security**
- **Session Isolation**: Each patient session isolated from others
- **Signature Validation**: Tamper-resistant signature capture and storage
- **Form Security**: Prevent XSS in user-created forms
- **Real-time Security**: Encrypted WebSocket connections
- **Device Security**: iPad kiosk mode with restricted access

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All critical check-in workflows functional
- [ ] ModMed integration tested with production patient data
- [ ] Dual-screen interface tested in clinical environment
- [ ] Digital signature system validated for legal compliance
- [ ] Real-time sync performance meets 200ms requirement
- [ ] Form builder tested with all appointment types
- [ ] Staff training completed and documented
- [ ] HIPAA compliance validated by security team

### **Success Metrics (6 months)**
- 70% reduction in patient check-in time achieved
- 95% reduction in transcription errors
- 90% digital form completion rate
- 60% reduction in manual data entry by staff
- 4.5/5.0 patient satisfaction rating
- 99.9% system uptime during business hours
- Zero HIPAA compliance violations
- 100% staff adoption across all locations

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **ModMed Integration**: Quarterly compatibility testing
- **Form Template Updates**: Monthly review and optimization
- **Device Maintenance**: Regular iPad and hardware maintenance
- **Performance Optimization**: Ongoing real-time sync optimization
- **Security Reviews**: Annual penetration testing and HIPAA audit

### **Future Enhancements**
- **Voice Recognition**: Voice-to-text form completion
- **AI Form Suggestions**: Smart form recommendations based on appointment type
- **Multi-language Support**: Additional language options for diverse patients
- **Biometric Authentication**: Fingerprint or facial recognition for patients
- **Integration Expansion**: Connect with additional EHR systems
- **Mobile App**: Native mobile check-in for pre-arrival completion
- **Appointment Scheduling**: Direct integration with appointment booking

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] ModMed FHIR integration guide
- [ ] Real-time WebSocket implementation
- [ ] Digital signature API documentation
- [ ] Form engine architecture and customization
- [ ] Session management and security implementation

### **User Documentation**
- [ ] Quick start guide for reception staff
- [ ] Patient check-in workflow instructions
- [ ] Form template creation and management
- [ ] Troubleshooting common check-in issues
- [ ] Device setup and maintenance procedures
- [ ] Emergency procedures for system outages
- [ ] Video tutorials for all major workflows

---

*This dual-screen patient check-in kiosk system transforms the traditional paper-based process into a modern, efficient, and compliant digital experience that enhances both patient satisfaction and staff productivity while maintaining the highest standards of healthcare data security.*
│   │       ├── forms/
│   │       │   ├── route.ts         # Form template CRUD
│   │       │   ├── [formId]/
│   │       │   │   ├── route.ts     # Individual form operations
│   │       │   │   ├── render/
│   │       │   │   │   └── route.ts # Form rendering data
│   │       │   │   └── submit/
│   │       │   │       └── route.ts # Form submission processing
│   │       │   ├── assign/
│   │       │   │   └── route.ts     # Form assignment logic
│   │       │   └── templates/
│   │       │       └── route.ts     # Form template management
│   │       ├── signatures/
│   │       │   ├── capture/
│   │       │   │   └── route.ts     # Digital signature capture
│   │       │   ├── verify/
│   │       │   │   └── route.ts     # Signature verification
│   │       │   └── [signatureId]/
│   │       │       └── route.ts     # Signature CRUD operations
│   │       ├── modmed/
│   │       │   ├── patients/
│   │       │   │   ├── route.ts     # ModMed patient lookup
│   │       │   │   └── [mrn]/
│   │       │   │       ├── route.ts # Patient by MRN
│   │       │   │       ├── update/
│   │       │   │       │   └── route.ts # Update ModMed patient
│   │       │   │       └── verify/
│   │       │   │           └── route.ts # Verify patient identity
│   │       │   ├── appointments/
│   │       │   │   └── route.ts     # Today's appointments
│   │       │   └── forms/
│   │       │       └── route.ts     # Required forms by appointment
│   │       ├── documents/
│   │       │   ├── generate/
│   │       │   │   └── route.ts     # PDF document generation
│   │       │   ├── [documentId]/
│   │       │   │   └── route.ts     # Document CRUD operations
│   │       │   └── templates/
│   │       │       └── route.ts     # Document template management
│   │       ├── real-time/
│   │       │   ├── subscribe/
│   │       │   │   └── route.ts     # WebSocket subscriptions
│   │       │   └── broadcast/
│   │       │       └── route.ts     # Real-time updates
│   │       └── analytics/
│   │           ├── completion-rates/
│   │           │   └── route.ts     # Check-in completion analytics
│   │           ├── efficiency/
│   │           │   └── route.ts     # Process efficiency metrics
│   │           └── usage/
│   │               └── route.ts     # System usage statistics
│   ├── components/
│   │   ├── receptionist/
│   │   │   ├── PatientSearch.tsx    # Enhanced patient search
│   │   │   ├── SessionMonitor.tsx   # Active session monitoring
│   │   │   ├── PatientQueue.tsx     # Check-in queue display
│   │   │   ├── FormAssignment.tsx   # Form selection interface
│   │   │   ├── ProgressTracker.tsx  # Patient progress tracking
│   │   │   └── QuickActions.tsx     # Common action buttons
│   │   ├── patient/
│   │   │   ├── WelcomeScreen.tsx    # Patient welcome interface
│   │   │   ├── InfoVerification.tsx # Patient info verification
│   │   │   ├── FormRenderer.tsx     # Dynamic form display
│   │   │   ├── SignaturePad.tsx     # Digital signature capture
│   │   │   ├── ProgressIndicator.tsx # Check-in progress display
│   │   │   └── CompletionScreen.tsx # Check-in completion
│   │   ├── forms/
│   │   │   ├── FormBuilder.tsx      # Dynamic form builder
│   │   │   ├── FieldTypes.tsx       # Form field components
│   │   │   ├── FormValidator.tsx    # Form validation logic
│   │   │   ├── ConditionalLogic.tsx # Form conditional display
│   │   │   └── FormPreview.tsx      # Form preview interface
│   │   ├── shared/
│   │   │   ├── PatientHeader.tsx    # Patient info header
│   │   │   ├── SessionStatus.tsx    # Session status indicator
│   │   │   ├── ErrorBoundary.tsx    # Error handling wrapper
│   │   │   ├── LoadingScreen.tsx    # Loading state display
│   │   │   └── TimeoutWarning.tsx   # Session timeout warning
│   │   ├── analytics/
│   │   │   ├── CompletionMetrics.tsx # Completion rate charts
│   │   │   ├── EfficiencyDash.tsx   # Efficiency dashboard
│   │   │   ├── UsageStatistics.tsx  # Usage analytics
│   │   │   ├── ErrorAnalytics.tsx   # Error rate analysis
│   │   │   └── TrendAnalysis.tsx    # Usage trend visualization
│   │   └── configuration/
│   │       ├── FormTemplateEditor.tsx # Form template editor
│   │       ├── AppointmentTypeConfig.tsx # Appointment configuration
│   │       ├── LocationSettings.tsx # Location-specific settings
│   │       ├── ValidationRules.tsx  # Validation rule management
│   │       └── IntegrationConfig.tsx # Integration settings
│   ├── lib/
│   │   ├── patient-search/
│   │   │   ├── search-engine.ts     # Enhanced search algorithms
│   │   │   ├── mrn-validation.ts    # MRN format validation
│   │   │   ├── fuzzy-matching.ts    # Fuzzy name matching
│   │   │   └── search-suggestions.ts # Auto-suggestion logic
│   │   ├── session-management/
│   │   │   ├── session-handler.ts   # Session lifecycle management
│   │   │   ├── timeout-manager.ts   # Session timeout handling
│   │   │   ├── security-handler.ts  # Session security controls
│   │   │   └── state-synchronizer.ts # Cross-screen state sync
│   │   ├── forms/
│   │   │   ├── form-engine.ts       # Dynamic form rendering
│   │   │   ├── validation-engine.ts # Form validation logic
│   │   │   ├── conditional-logic.ts # Form conditional display
│   │   │   ├── auto-population.ts   # Data auto-population
│   │   │   └── submission-handler.ts # Form submission processing
│   │   ├── signatures/
│   │   │   ├── signature-capture.ts # Digital signature handling
│   │   │   ├── signature-validation.ts # Signature verification
│   │   │   ├── biometric-binding.ts # Signature-identity binding
│   │   │   └── compliance-logger.ts # HIPAA signature compliance
│   │   ├── integrations/
│   │   │   ├── modmed-client.ts     # ModMed FHIR integration
│   │   │   ├── patient-sync.ts      # Patient data synchronization
│   │   │   ├── appointment-sync.ts  # Appointment data sync
│   │   │   └── form-submission.ts   # Form data to ModMed
│   │   ├── real-time/
│   │   │   ├── websocket-client.ts  # WebSocket client management
│   │   │   ├── state-broadcaster.ts # Real-time state broadcasting
│   │   │   ├── event-handlers.ts    # Real-time event processing
│   │   │   └── connection-manager.ts # Connection lifecycle
│   │   ├── security/
│   │   │   ├── hipaa-compliance.ts  # HIPAA security controls
│   │   │   ├── data-encryption.ts   # Patient data encryption
│   │   │   ├── audit-logger.ts      # Comprehensive audit trails
│   │   │   ├── access-control.ts    # Role-based permissions
│   │   │   └── session-security.ts  # Session security measures
│   │   ├── analytics/
│   │   │   ├── usage-tracker.ts     # System usage analytics
│   │   │   ├── completion-analyzer.ts # Check-in completion analysis
│   │   │   ├── efficiency-calculator.ts # Process efficiency metrics
│   │   │   ├── error-tracker.ts     # Error rate monitoring
│   │   │   └── performance-monitor.ts # System performance tracking
│   │   └── utils/
│   │       ├── patient-utils.ts     # Patient data utilities
│   │       ├── form-utils.ts        # Form processing utilities
│   │       ├── validation-utils.ts  # Validation helper functions
│   │       ├── formatting-utils.ts  # Data formatting utilities
│   │       └── error-handling.ts    # Error handling utilities
│   └── types/
│       ├── patient.ts               # Patient data types
│       ├── session.ts               # Check-in session types
│       ├── forms.ts                 # Form structure types
│       ├── signatures.ts            # Digital signature types
│       ├── modmed.ts                # ModMed API types
│       ├── analytics.ts             # Analytics data types
│       └── configuration.ts         # System configuration types
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## 🧰 Database Schema (Supabase PostgreSQL)

```sql
-- Check-in sessions
CREATE TABLE public.checkin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_mrn TEXT NOT NULL,
    patient_id TEXT, -- ModMed patient ID
    receptionist_email TEXT NOT NULL,
    location TEXT NOT NULL, -- Ann Arbor, Wixom, Plymouth
    appointment_id TEXT, -- ModMed appointment ID if applicable
    session_status TEXT NOT NULL DEFAULT 'active', -- active, completed, expired, cancelled
    current_step TEXT NOT NULL DEFAULT 'verification', -- verification, forms, signature, complete
    patient_data JSONB NOT NULL, -- Cached patient data from ModMed
    verification_completed BOOLEAN DEFAULT FALSE,
    forms_assigned TEXT[], -- Array of form IDs assigned
    forms_completed TEXT[], -- Array of form IDs completed
    signatures_required TEXT[], -- Array of signature types required
    signatures_completed TEXT[], -- Array of signature IDs completed
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
    completed_at TIMESTAMPTZ,
    notes TEXT, -- Staff notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient information verification and updates
CREATE TABLE public.patient_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.checkin_sessions(id) ON DELETE CASCADE,
    patient_mrn TEXT NOT NULL,
    verification_type TEXT NOT NULL, -- 'initial', 'update', 'correction'
    field_name TEXT NOT NULL, -- Which field was verified/updated
    original_value TEXT, -- Original value from ModMed
    verified_value TEXT, -- Value verified/updated by patient
    requires_staff_review BOOLEAN DEFAULT FALSE,
    staff_approved BOOLEAN DEFAULT FALSE,
    approved_by TEXT, -- Staff member who approved
    verification_method TEXT DEFAULT 'patient_input', -- patient_input, staff_override
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form templates and configurations
CREATE TABLE public.form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_name TEXT NOT NULL,
    form_title TEXT NOT NULL,
    form_description TEXT,
    form_category TEXT NOT NULL, -- 'intake', 'consent', 'insurance', 'medical_history'
    location_specific TEXT[], -- Locations where this form applies
    appointment_types TEXT[], -- Appointment types requiring this form
    is_required BOOLEAN DEFAULT TRUE,
    requires_signature BOOLEAN DEFAULT FALSE,
    form_fields JSONB NOT NULL, -- Dynamic form field definitions
    conditional_logic JSONB, -- Rules for showing/hiding fields
    validation_rules JSONB, -- Field validation requirements
    auto_populate_fields JSONB, -- Fields to auto-populate from patient data
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    version_number INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    last_modified_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient form submissions
CREATE TABLE public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.checkin_sessions(id) ON DELETE CASCADE,
    form_template_id UUID NOT NULL REFERENCES public.form_templates(id),
    patient_mrn TEXT NOT NULL,
    form_data JSONB NOT NULL, -- Complete form submission data
    completion_time_seconds INTEGER, -- Time taken to complete
    requires_staff_review BOOLEAN DEFAULT FALSE,
    staff_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by TEXT, -- Staff member who reviewed
    review_notes TEXT,
    submission_ip_address INET,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital signatures
CREATE TABLE public.digital_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.checkin_sessions(id) ON DELETE CASCADE,
    form_submission_id UUID REFERENCES public.form_submissions(id),
    patient_mrn TEXT NOT NULL,
    signature_type TEXT NOT NULL, -- 'consent', 'financial_agreement', 'hipaa', 'general'
    signature_data TEXT NOT NULL, -- Base64 encoded signature image
    signature_metadata JSONB NOT NULL, -- Timestamp, IP, device info, etc.
    document_hash TEXT, -- Hash of signed document for integrity
    biometric_data JSONB, -- Signing pressure, speed, etc. if available
    legal_name TEXT NOT NULL, -- Name of person signing
    relationship_to_patient TEXT DEFAULT 'self', -- self, parent, guardian, spouse
    witness_name TEXT, -- Staff witness if required
    is_valid BOOLEAN DEFAULT TRUE,
    invalidation_reason TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    witnessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment type configurations
CREATE TABLE public.appointment_type_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_type TEXT NOT NULL,
    location TEXT NOT NULL,
    required_forms UUID[] NOT NULL, -- Array of form_template IDs
    estimated_completion_minutes INTEGER DEFAULT 15,
    special_instructions TEXT,
    requires_id_verification BOOLEAN DEFAULT FALSE,
    requires_insurance_card BOOLEAN DEFAULT FALSE,
    auto_assign_forms BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(appointment_type, location)
);

-- System analytics and usage tracking
CREATE TABLE public.checkin_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analytics_date DATE NOT NULL,
    location TEXT NOT NULL,
    total_checkins INTEGER NOT NULL DEFAULT 0,
    completed_checkins INTEGER NOT NULL DEFAULT 0,
    expired_sessions INTEGER NOT NULL DEFAULT 0,
    average_completion_time_minutes DECIMAL(6,2),
    average_forms_per_patient DECIMAL(4,2),
    most_common_issues JSONB, -- Common problems encountered
    peak_usage_hours INTEGER[], -- Hours with highest usage
    staff_efficiency_score DECIMAL(5,2), -- Calculated efficiency metric
    patient_satisfaction_score DECIMAL(3,2), -- If surveys collected
    technical_issues_count INTEGER DEFAULT 0,
    system_downtime_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(analytics_date, location)
);

-- Error and issue tracking
CREATE TABLE public.system_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.checkin_sessions(id),
    error_type TEXT NOT NULL, -- 'validation', 'integration', 'system', 'user'
    error_code TEXT,
    error_message TEXT NOT NULL,
    error_context JSONB, -- Additional context data
    affected_component TEXT, -- Which part of system was affected
    user_impact TEXT, -- Impact on user experience
    resolution_status TEXT DEFAULT 'open', -- open, investigating, resolved
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    priority_level TEXT DEFAULT 'medium', -- low, medium, high, critical
    staff_notified BOOLEAN DEFAULT FALSE,
    patient_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form field definitions for dynamic forms
CREATE TABLE public.form_field_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_type TEXT UNIQUE NOT NULL, -- text, email, phone, date, select, checkbox, etc.
    field_name TEXT NOT NULL,
    validation_rules JSONB, -- Default validation for this field type
    display_properties JSONB, -- Default display properties
    is_hipaa_sensitive BOOLEAN DEFAULT FALSE,
    encryption_required BOOLEAN DEFAULT FALSE,
    audit_changes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_checkin_sessions_mrn ON public.checkin_sessions(patient_mrn);
CREATE INDEX idx_checkin_sessions_status ON public.checkin_sessions(session_status);
CREATE INDEX idx_checkin_sessions_location ON public.checkin_sessions(location);
CREATE INDEX idx_checkin_sessions_active ON public.checkin_sessions(session_status, expires_at) WHERE session_status = 'active';
CREATE INDEX idx_patient_verifications_session ON public.patient_verifications(session_id);
CREATE INDEX idx_form_submissions_session ON public.form_submissions(session_id);
CREATE INDEX idx_form_submissions_mrn ON public.form_submissions(patient_mrn);
CREATE INDEX idx_digital_signatures_session ON public.digital_signatures(session_id);
CREATE INDEX idx_digital_signatures_mrn ON public.digital_signatures(patient_mrn);
CREATE INDEX idx_appointment_configs_type ON public.appointment_type_configs(appointment_type, location);
CREATE INDEX idx_analytics_date_location ON public.checkin_analytics(analytics_date, location);
CREATE INDEX idx_system_errors_session ON public.system_errors(session_id);
CREATE INDEX idx_system_errors_type ON public.system_errors(error_type, created_at);

-- Row Level Security
ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_type_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_field_types ENABLE ROW LEVEL SECURITY;

-- Policies: Staff can access check-in data, patients can only access their own active session
CREATE POLICY "Staff can access checkin sessions" ON public.checkin_sessions
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

CREATE POLICY "Staff can access patient verifications" ON public.patient_verifications
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

CREATE POLICY "Staff can manage form templates" ON public.form_templates
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Staff can read form templates" ON public.form_templates
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

CREATE POLICY "Staff can access form submissions" ON public.form_submissions
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

CREATE POLICY "Staff can access digital signatures" ON public.digital_signatures
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

CREATE POLICY "Staff can manage appointment configs" ON public.appointment_type_configs
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Staff can access analytics" ON public.checkin_analytics
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

CREATE POLICY "Staff can access system errors" ON public.system_errors
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

-- Insert default form field types
INSERT INTO public.form_field_types (field_type, field_name, validation_rules, display_properties) VALUES
('text', 'Text Input', '{"maxLength": 255, "required": false}', '{"placeholder": "Enter text"}'),
('email', 'Email Address', '{"pattern": "email", "required": false}', '{"placeholder": "email@example.com"}'),
('phone', 'Phone Number', '{"pattern": "phone", "required": false}', '{"placeholder": "(555) 123-4567", "format": "US"}'),
('date', 'Date Picker', '{"format": "YYYY-MM-DD", "required": false}', '{"showCalendar": true}'),
('select', 'Dropdown Select', '{"required": false}', '{"options": [], "allowMultiple": false}'),
('checkbox', 'Checkbox', '{"required": false}', '{"label": "I agree"}'),
('radio', 'Radio Buttons', '{"required": false}', '{"options": [], "orientation": "vertical"}'),
('textarea', 'Text Area', '{"maxLength": 2000, "required": false}', '{"rows": 4, "placeholder": "Enter details"}'),
('signature', 'Digital Signature', '{"required": true}', '{"width": 400, "height": 200}'),
('file_upload', 'File Upload', '{"maxSize": 10485760, "allowedTypes": ["pdf", "jpg", "png"]}', '{"multiple": false}');

-- Insert default form templates
INSERT INTO public.form_templates (form_name, form_title, form_category, form_fields, is_required, created_by) VALUES
('patient_intake', 'New Patient Intake Form', 'intake', 
'[
  {"id": "chief_complaint", "type": "textarea", "label": "Chief Complaint", "required": true},
  {"id": "medical_history", "type": "textarea", "label": "Medical History", "required": false},
  {"id": "current_medications", "type": "textarea", "label": "Current Medications", "required": false},
  {"id": "allergies", "type": "text", "label": "Known Allergies", "required": false},
  {"id": "emergency_contact", "type": "text", "label": "Emergency Contact", "required": true},
  {"id": "emergency_phone", "type": "phone", "label": "Emergency Contact Phone", "required": true}
]', true, 'system'),

('hipaa_consent', 'HIPAA Privacy Notice Acknowledgment', 'consent',
'[
  {"id": "privacy_notice_read", "type": "checkbox", "label": "I have read and understand the HIPAA Privacy Notice", "required": true},
  {"id": "privacy_notice_received", "type": "checkbox", "label": "I acknowledge receiving a copy of the Privacy Notice", "required": true},
  {"id": "marketing_consent", "type": "radio", "label": "May we contact you about health-related services?", "options": ["Yes", "No"], "required": true}
]', true, 'system'),

('insurance_verification', 'Insurance Information Verification', 'insurance',
'[
  {"id": "insurance_primary", "type": "text", "label": "Primary Insurance", "required": true},
  {"id": "policy_number", "type": "text", "label": "Policy Number", "required": true},
  {"id": "group_number", "type": "text", "label": "Group Number", "required": false},
  {"id": "policy_holder", "type": "text", "label": "Policy Holder Name", "required": true},
  {"id": "secondary_insurance", "type": "text", "label": "Secondary Insurance", "required": false}
]', true, 'system');
```

---

## 💻 Frontend Components

### Receptionist Desktop Interface (`/apps/checkin/src/app/receptionist/page.tsx`)
```tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { PatientSearch } from '@/components/receptionist/PatientSearch';
import { SessionMonitor } from '@/components/receptionist/SessionMonitor';
import { PatientQueue } from '@/components/receptionist/PatientQueue';

export default function ReceptionistDashboard() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  
  const supabase = createClient();
  
  useEffect(() => {
    // Real-time subscription to active sessions
    const sessionsSubscription = supabase
      .channel('active_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'checkin_sessions',
        filter: 'session_status=eq.active'
      }, (payload) => {
        fetchActiveSessions();
      })
      .subscribe();
      
    fetchActiveSessions();
    
    return () => {
      sessionsSubscription.unsubscribe();
    };
  }, []);
  
  const fetchActiveSessions = async () => {
    const { data } = await supabase
      .from('checkin_sessions')
      .select('*')
      .eq('session_status', 'active')
      .order('started_at', { ascending: false });
      
    setActiveSessions(data || []);
  };
  
  const handlePatientSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    setSearchResults(results.data || []);
  };
  
  const startCheckInSession = async (patient: any) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_mrn: patient.mrn,
          patient_id: patient.id,
          location: 'Ann Arbor', // TODO: Get from user preference
          patient_data: patient
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Open patient interface in new window/tab for iPad
        const patientUrl = `/checkin/patient/verify/${result.data.id}`;
        window.open(patientUrl, 'patient_checkin', 'width=1024,height=768');
        
        setSelectedSession(result.data.id);
        await fetchActiveSessions();
      }
    } catch (error) {
      console.error('Failed to start check-in session:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="flex justify-between items-center p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Patient Check-in Management
            </h1>
            <p className="text-gray-600 mt-1">
              Search patients and monitor check-in progress
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">
                {activeSessions.length}
              </span> active check-ins
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Patient Search */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Patient Search</h2>
              <PatientSearch 
                onSearch={handlePatientSearch}
                searchResults={searchResults}
                onPatientSelect={startCheckInSession}
              />
            </div>
          </div>
          
          {/* Active Sessions Monitor */}
          <div className="xl:col-span-2">
            <div className="space-y-6">
              <PatientQueue 
                sessions={activeSessions}
                selectedSession={selectedSession}
                onSessionSelect={setSelectedSession}
              />
              
              {selectedSession && (
                <SessionMonitor 
                  sessionId={selectedSession}
                  onSessionUpdate={fetchActiveSessions}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### Patient Search Component (`/components/receptionist/PatientSearch.tsx`)
```tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

interface PatientSearchProps {
  onSearch: (query: string) => void;
  searchResults: Patient[];
  onPatientSelect: (patient: Patient) => void;
}

export function PatientSearch({ onSearch, searchResults, onPatientSelect }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        setIsLoading(true);
        onSearch(query.trim());
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [query, onSearch]);
  
  useEffect(() => {
    setIsLoading(false);
  }, [searchResults]);
  
  const handlePatientSelect = (patient: Patient) => {
    setQuery('');
    setShowResults(false);
    onPatientSelect(patient);
    searchRef.current?.focus();
  };
  
  const formatPatientDisplay = (patient: Patient) => {
    const age = patient.date_of_birth ? 
      Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '';
    
    return {
      primary: `${patient.last_name}, ${patient.first_name}`,
      secondary: `MRN: ${patient.mrn}${age ? ` • Age: ${age}` : ''}`,
      tertiary: patient.phone_number || patient.email
    };
  };
  
  return (
    <div className="relative">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter MRN, last name, or first name..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          autoComplete="off"
          autoFocus
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {isLoading ? 'Searching...' : 'No patients found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {searchResults.map((patient) => {
                const display = formatPatientDisplay(patient);
                return (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-blue-50 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {display.primary}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {display.secondary}
                        </div>
                        {display.tertiary && (
                          <div className="text-xs text-gray-400 truncate">
                            {display.tertiary}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <div className="text-xs text-blue-600 font-medium">
                          Start Check-in →
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="mb-2"><strong>Search Tips:</strong></div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Enter MRN for exact match</li>
          <li>Type last name, first name for name search</li>
          <li>Use partial names for fuzzy matching</li>
          <li>Search updates as you type</li>
        </ul>
      </div>
    </div>
  );
}
```

### Patient iPad Interface (`/apps/checkin/src/app/patient/verify/[sessionId]/page.tsx`)
```tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { InfoVerification } from '@/components/patient/InfoVerification';
import { ProgressIndicator } from '@/components/patient/ProgressIndicator';
import { WelcomeScreen } from '@/components/patient/WelcomeScreen';

export default function PatientVerification() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const supabase = createClient();
  
  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
      
      // Set up real-time subscription for session updates
      const subscription = supabase
        .channel(`session_${sessionId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'checkin_sessions',
          filter: `id=eq.${sessionId}`
        }, (payload) => {
          setSession(payload.new);
          setCurrentStep(payload.new.current_step);
        })
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [sessionId]);
  
  const fetchSessionData = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('checkin_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
        
      if (sessionError) throw sessionError;
      
      if (sessionData.session_status !== 'active') {
        setError('This check-in session is no longer active.');
        return;
      }
      
      setSession(sessionData);
      setPatient(sessionData.patient_data);
      setCurrentStep(sessionData.current_step);
      
    } catch (err) {
      console.error('Failed to fetch session data:', err);
      setError('Unable to load check-in information.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateSessionStep = async (step: string, additionalData?: any) => {
    try {
      const updateData = {
        current_step: step,
        last_activity_at: new Date().toISOString(),
        ...additionalData
      };
      
      const { error } = await supabase
        .from('checkin_sessions')
        .update(updateData)
        .eq('id', sessionId);
        
      if (error) throw error;
      
      setCurrentStep(step);
      
    } catch (err) {
      console.error('Failed to update session step:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your check-in...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Check-in Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-red-500">Please ask reception staff for assistance.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator 
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={['Welcome', 'Verify Info', 'Complete Forms', 'Finish']}
        />
        
        <div className="max-w-4xl mx-auto">
          {currentStep === 'welcome' && (
            <WelcomeScreen 
              patient={patient}
              onContinue={() => updateSessionStep('verification')}
            />
          )}
          
          {currentStep === 'verification' && (
            <InfoVerification 
              sessionId={sessionId}
              patient={patient}
              onComplete={() => updateSessionStep('forms')}
            />
          )}
          
          {currentStep === 'forms' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Forms will be displayed here</h2>
              <button 
                onClick={() => updateSessionStep('signature')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg"
              >
                Continue to Signatures
              </button>
            </div>
          )}
          
          {currentStep === 'signature' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Signature capture will be here</h2>
              <button 
                onClick={() => updateSessionStep('complete')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg"
              >
                Complete Check-in
              </button>
            </div>
          )}
          
          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-800 mb-4">Check-in Complete!</h2>
              <p className="text-lg text-gray-600 mb-6">
                Thank you for updating your information. Please have a seat and we'll call you shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔁 Backend: API Endpoints

### Enhanced Patient Search (`/api/patients/search/route.ts`)
```typescript
import { createClient } from '@/lib/supabase';
import { ModMedClient } from '@/lib/integrations/modmed-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return Response.json({ success: false, error: 'Search query too short' }, { status: 400 });
  }
  
  try {
    const modmed = new ModMedClient();
    
    // Determine search type based on query format
    const searchType = detectSearchType(query);
    let searchResults = [];
    
    switch (searchType) {
      case 'mrn':
        // Direct MRN search
        searchResults = await modmed.searchPatientByMRN(query);
        break;
        
      case 'name':
        // Name-based search with fuzzy matching
        searchResults = await modmed.searchPatientsByName(query);
        break;
        
      case 'phone':
        // Phone number search
        searchResults = await modmed.searchPatientsByPhone(query);
        break;
        
      default:
        // General search across multiple fields
        searchResults = await modmed.searchPatientsGeneral(query);
    }
    
    // Filter and rank results
    const rankedResults = rankSearchResults(searchResults, query);
    
    // Limit to top 10 results for UI performance
    const topResults = rankedResults.slice(0, 10);
    
    return Response.json({
      success: true,
      data: topResults,
      searchType,
      totalFound: searchResults.length
    });
    
  } catch (error) {
    console.error('Patient search error:', error);
    return Response.json({
      success: false,
      error: 'Failed to search patients'
    }, { status: 500 });
  }
}

function detectSearchType(query: string): string {
  // Check if query looks like an MRN (numeric, 6-10 digits)
  if (/^\d{6,10}$/.test(query)) {
    return 'mrn';
  }
  
  // Check if query looks like a phone number
  if (/^[\d\s\-\(\)\.]{10,}$/.test(query)) {
    return 'phone';
  }
  
  // Check if query contains comma (Last, First format)
  if (query.includes(',')) {
    return 'name';
  }
  
  // Default to name search for text queries
  if (/^[a-zA-Z\s]+$/.test(query)) {
    return 'name';
  }
  
  return 'general';
}

function rankSearchResults(results: any[], query: string): any[] {
  return results.map(patient => {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Exact MRN match gets highest score
    if (patient.mrn === query) {
      score += 100;
    }
    
    // Name matching scores
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const lastFirst = `${patient.last_name}, ${patient.first_name}`.toLowerCase();
    
    if (fullName.includes(queryLower)) {
      score += 50;
    }
    
    if (lastFirst.includes(queryLower)) {
      score += 50;
    }
    
    // Exact last name match
    if (patient.last_name.toLowerCase() === queryLower) {
      score += 75;
    }
    
    // Phone number matching
    if (patient.phone_number && patient.phone_number.includes(query.replace(/\D/g, ''))) {
      score += 30;
    }
    
    return { ...patient, _searchScore: score };
  }).sort((a, b) => b._searchScore - a._searchScore);
}
```

### Check-in Session Management (`/api/sessions/route.ts`)
```typescript
import { createClient } from '@/lib/supabase';
import { ModMedClient } from '@/lib/integrations/modmed-client';

export async function POST(request: Request) {
  const { patient_mrn, patient_id, location, patient_data } = await request.json();
  
  if (!patient_mrn || !location) {
    return Response.json({ 
      success: false, 
      error: 'Patient MRN and location are required' 
    }, { status: 400 });
  }
  
  const supabase = createClient();
  
  try {
    // Check for existing active session for this patient
    const { data: existingSession } = await supabase
      .from('checkin_sessions')
      .select('id')
      .eq('patient_mrn', patient_mrn)
      .eq('session_status', 'active')
      .single();
      
    if (existingSession) {
      return Response.json({
        success: false,
        error: 'Patient already has an active check-in session',
        existingSessionId: existingSession.id
      }, { status: 409 });
    }
    
    // Get current user from auth
    const { data: { user } } = await supabase.auth.getUser();
    const receptionistEmail = user?.email || 'unknown@gangerdermatology.com';
    
    // Create new check-in session
    const { data: session, error: sessionError } = await supabase
      .from('checkin_sessions')
      .insert({
        patient_mrn,
        patient_id,
        receptionist_email: receptionistEmail,
        location,
        patient_data,
        session_status: 'active',
        current_step: 'verification',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      })
      .select()
      .single();
      
    if (sessionError) throw sessionError;
    
    // Determine required forms based on appointment type and location
    const requiredForms = await determineRequiredForms(patient_id, location);
    
    // Update session with assigned forms
    if (requiredForms.length > 0) {
      await supabase
        .from('checkin_sessions')
        .update({ forms_assigned: requiredForms })
        .eq('id', session.id);
    }
    
    return Response.json({
      success: true,
      data: session,
      requiredForms
    });
    
  } catch (error) {
    console.error('Failed to create check-in session:', error);
    return Response.json({
      success: false,
      error: 'Failed to create check-in session'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';
  const location = searchParams.get('location');
  
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('checkin_sessions')
      .select('*')
      .eq('session_status', status)
      .order('started_at', { ascending: false });
      
    if (location) {
      query = query.eq('location', location);
    }
    
    const { data: sessions, error } = await query;
    
    if (error) throw error;
    
    return Response.json({
      success: true,
      data: sessions
    });
    
  } catch (error) {
    console.error('Failed to fetch check-in sessions:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}

async function determineRequiredForms(patientId: string, location: string): Promise<string[]> {
  const supabase = createClient();
  
  try {
    // Get today's appointments for this patient
    const modmed = new ModMedClient();
    const appointments = await modmed.getTodaysAppointments(patientId);
    
    if (appointments.length === 0) {
      // Default forms for walk-in patients
      const { data: defaultForms } = await supabase
        .from('form_templates')
        .select('id')
        .eq('is_required', true)
        .eq('form_category', 'intake');
        
      return defaultForms?.map(f => f.id) || [];
    }
    
    // Get forms required for specific appointment types
    const appointmentTypes = appointments.map(apt => apt.appointment_type);
    
    const { data: formConfigs } = await supabase
      .from('appointment_type_configs')
      .select('required_forms')
      .eq('location', location)
      .in('appointment_type', appointmentTypes);
      
    // Combine all required forms and remove duplicates
    const allRequiredForms = formConfigs?.flatMap(config => config.required_forms) || [];
    return [...new Set(allRequiredForms)];
    
  } catch (error) {
    console.error('Failed to determine required forms:', error);
    return [];
  }
}
```

---

## 🚀 Development Timeline

### Week 1: Foundation & Search
- [ ] Set up check-in app in monorepo structure
- [ ] Create Supabase schema and RLS policies
- [ ] Implement ModMed FHIR integration for patient search
- [ ] Build enhanced patient search with fuzzy matching
- [ ] Create basic receptionist dashboard interface

### Week 2: Session Management & Patient Interface
- [ ] Implement check-in session management system
- [ ] Build patient iPad interface with responsive design
- [ ] Create real-time sync between receptionist and patient screens
- [ ] Add patient information verification workflow
- [ ] Implement session timeout and security measures

### Week 3: Forms & Signatures
- [ ] Build dynamic form rendering system
- [ ] Create form builder interface for staff configuration
- [ ] Implement digital signature capture with HIPAA compliance
- [ ] Add form validation and conditional logic
- [ ] Create document generation for completed forms

### Week 4: Integration & Polish
- [ ] Complete ModMed integration for data updates
- [ ] Build analytics dashboard for check-in metrics
- [ ] Add comprehensive error handling and logging
- [ ] Implement security auditing and compliance features
- [ ] User training and system optimization

---

## ✅ Success Metrics

### Operational Efficiency
- **Check-in Time Reduction**: 70% faster than paper-based process
- **Data Accuracy**: 95% reduction in transcription errors
- **Staff Productivity**: 60% reduction in manual data entry
- **Form Completion**: 90% digital completion rate

### Patient Experience
- **Patient Satisfaction**: 4.5/5.0 rating for digital check-in experience
- **Wait Time Reduction**: 25% reduction in reception desk wait time
- **Error Rate**: <2% patient information errors
- **Accessibility**: 100% touch-friendly interface compliance

### Technical Performance
- **System Uptime**: 99.9% availability during business hours
- **Response Time**: <2 seconds for all patient interactions
- **Real-time Sync**: <500ms latency between screens
- **Security**: Zero HIPAA compliance violations

### Business Impact
- **Cost Savings**: $40,000 annual reduction in paper/administrative costs
- **Revenue Enhancement**: 15% increase in patient throughput capacity
- **Compliance**: 100% digital audit trail for all patient interactions
- **Scalability**: Support 200+ daily check-ins across all locations

---

*This dual-screen patient check-in kiosk system transforms the traditional paper-based process into a modern, efficient, and compliant digital experience that enhances both patient satisfaction and staff productivity while maintaining the highest standards of healthcare data security.*