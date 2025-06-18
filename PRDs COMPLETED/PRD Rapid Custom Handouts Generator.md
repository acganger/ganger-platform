# PRD: Rapid Custom Handouts Generator
*Ganger Platform Standard Application*

## 📋 Document Information
- **Application Name**: Rapid Custom Handouts Generator
- **Priority**: High
- **Development Timeline**: 6-8 weeks (increased due to complex template engine requirements)
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations
- **Integration Requirements**: ModMed FHIR API, PDF generation, QR code scanning, SMS service, Email service

---

## 🎯 Product Overview

### **Purpose Statement**
Enable medical assistants to instantly generate personalized patient handouts by scanning QR codes or entering MRNs, selecting relevant materials, generating customized PDFs with patient-specific information, and offering digital delivery via SMS or email in addition to printing.

### **Target Users**
- **Primary**: Medical Assistants (staff role) - daily handout creation and digital delivery
- **Secondary**: Clinical Staff (clinical_staff role) - specialized handout selection
- **Tertiary**: Managers (manager role) - handout template management and analytics
- **Quaternary**: Chief Medical Officer (superadmin role) - template content editing and approval

### **Success Metrics**
- 80% reduction in handout preparation time (2 minutes vs 10+ minutes manual)
- 95% accuracy in patient information insertion vs manual transcription
- 60% digital delivery adoption rate (reducing paper usage and improving patient access)
- 90% staff adoption within 30 days of deployment

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
import { Button, Input, LoadingSpinner, DataTable, Checkbox } from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { ModMedClient, SMSService, EmailService } from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

### **App-Specific Technology**
- **PDF Generation**: jsPDF + custom template engine for dynamic content with medical formatting
- **QR Code Scanning**: QuaggaJS for camera-based scanning
- **Template Processing**: Advanced template engine supporting conditional content, field validation, and complex medical regimens
- **Conditional Content Engine**: Support for checkbox-based content inclusion with 14+ conditional blocks per template
- **Dynamic Form Builder**: React-based form generation from template field definitions
- **Template Categories**: Support for education, treatment, medication, pre/post-procedure categories
- **WYSIWYG Template Editor**: Rich text editor for Chief Medical Officer template management
- **Print Management**: Browser print API with format optimization
- **SMS Delivery**: Twilio integration for handout download links
- **Email Delivery**: SendGrid integration for PDF attachments
- **Secure File Sharing**: Time-limited download URLs with access tracking

---

## 🧩 Template Engine Architecture

### **Template Structure and Complexity**

The handouts app supports three levels of template complexity, based on legacy system analysis:

#### **Simple Templates (Static Content)**
```typescript
interface SimpleTemplate {
  type: "static";
  content: StaticContentBlock[];
  fields: never[]; // No dynamic fields
}

// Examples: patch-testing, vinegar-soak-nails, sun-protection
```

#### **Moderate Templates (Dynamic Content)**
```typescript
interface ModerateTemplate {
  type: "dynamic";
  content: ContentBlock[];
  fields: FormField[]; // 4-8 fill-in fields
}

// Examples: acne-treatment-regimen, eczema-treatment, rosacea-handout
```

#### **Complex Templates (Conditional Content)**
```typescript
interface ComplexTemplate {
  type: "conditional";
  content: ConditionalContentBlock[];
  fields: FormField[]; // 10+ fields with conditional logic
  conditionalRules: ConditionalRule[]; // Show/hide logic
}

// Examples: acne-handout-kf (14 conditional blocks), isotretinoin-female
```

### **Content Block Types**

#### **1. Static Content Blocks**
```typescript
interface StaticContentBlock {
  type: "static_text" | "static_list" | "warning" | "page_break";
  id: string;
  content: string | string[];
  variant?: "normal" | "warning" | "emphasis" | "heading";
}
```

#### **2. Conditional Content Blocks**
```typescript
interface ConditionalContentBlock {
  type: "conditional_checklist" | "conditional_medication_sections";
  id: string;
  items: ConditionalItem[];
  minSelected?: number; // Validation requirement
  maxSelected?: number; // Validation requirement
}

interface ConditionalItem {
  id: string;
  content: string; // May contain {{variable}} placeholders
  fields?: FormField[]; // Fields that appear when item is selected
  required?: boolean; // Must be included
  default?: boolean; // Selected by default
}
```

#### **3. Dynamic Field Sections**
```typescript
interface FieldSection {
  type: "field_section" | "treatment_regimen";
  id: string;
  content: string; // Content with {{variable}} placeholders
  fields: FormField[];
  validation?: ValidationRule[];
}
```

### **Form Field Types and Validation**

#### **Text Fields**
```typescript
interface TextField {
  id: string;
  type: "text";
  label: string;
  required: boolean;
  default?: string;
  validation: {
    pattern?: RegExp; // For percentages, frequencies
    minLength?: number;
    maxLength?: number;
    numeric?: boolean; // Force numeric input
    range?: [number, number]; // For percentages (0.5-20)
  };
}

// Examples:
// - benzoyl_peroxide_percent: numeric, range [0.5, 20]
// - wash_frequency: numeric, range [1, 5]
// - medication_name: text, required
```

#### **Select Fields**
```typescript
interface SelectField {
  id: string;
  type: "select";
  label: string;
  required: boolean;
  options: Array<{
    value: string;
    text: string;
    default?: boolean;
  }>;
  allowCustom?: boolean; // Allow "Other" option with text input
}

// Examples:
// - frequency: ["once", "twice", "three times", "custom"]
// - morning_antihistamine: ["allegra_180", "zyrtec_10", "claritin_10", "custom"]
```

#### **Checkbox Fields**
```typescript
interface CheckboxField {
  id: string;
  type: "checkbox";
  label: string;
  default?: boolean;
  dependsOn?: string; // Only visible if parent field is checked
}
```

### **Template Categories and Organization**

Based on legacy content analysis, templates are organized into:

#### **Primary Categories**
- **education**: General condition information (7 templates)
- **treatment**: Medication regimens and protocols (4 templates)
- **medication**: Specific drug information and warnings (1 template)
- **pre_procedure**: Patient preparation instructions (2 templates)
- **post_procedure**: Recovery and care instructions (0 current, expandable)

#### **Subcategories**
- **skin_conditions**: Acne, eczema, rosacea, psoriasis
- **procedures**: Patch testing, biopsies, extractions
- **medications**: Isotretinoin, topical treatments
- **infections**: Fungal, bacterial, viral conditions
- **cancer_related**: Prevention, treatment information

### **Variable Substitution Engine**

#### **Standard Variables**
All templates have access to standard patient/provider variables:
```typescript
interface StandardVariables {
  // Patient information
  patient_full_name: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_mrn: string;
  patient_dob: string;
  patient_email?: string;
  patient_phone?: string;
  
  // Provider information
  provider_name: string;
  provider_email?: string;
  
  // Practice information
  location_name: string;
  location_address?: string;
  location_phone?: string;
  
  // System information
  current_date: string;
  current_time: string;
  current_datetime: string;
}
```

#### **Template-Specific Variables**
Each template defines its own dynamic fields:
```typescript
// Example from acne-handout-kf.json
interface AcneHandoutVariables extends StandardVariables {
  benzoyl_peroxide_percent: string; // "2.5", "5", "10"
  wash_frequency: string; // "1", "2", "3"
  cleanser_frequency: string; // "1", "2"
  // ... 10+ more fields
}
```

### **Conditional Logic Engine**

#### **Content Inclusion Rules**
```typescript
interface ConditionalRule {
  type: "show_if" | "hide_if" | "require_if";
  field: string;
  operator: "equals" | "not_equals" | "contains" | "is_checked";
  value: any;
  target: string | string[]; // Content blocks or fields to affect
}

// Example: Show medication information only if medication is selected
{
  type: "show_if",
  field: "oral_medication_selected",
  operator: "is_checked",
  value: true,
  target: ["medication_information_section"]
}
```

#### **Field Dependencies**
```typescript
interface FieldDependency {
  field: string;
  dependsOn: string;
  condition: {
    operator: "equals" | "not_equals" | "is_checked";
    value: any;
  };
}

// Example: Medication dosage field only appears when medication is selected
{
  field: "medication_dosage",
  dependsOn: "medication_name",
  condition: { operator: "not_equals", value: "" }
}
```

### **PDF Generation Requirements**

#### **Medical Formatting Standards**
- **Consistent Headers**: Practice logo, patient information block
- **Page Breaks**: Explicit pagination for long handouts
- **Typography**: Medical-grade readable fonts (minimum 11pt)
- **List Formatting**: Proper bullet points and numbering
- **Warning Sections**: Special styling for critical information
- **Medication Sections**: Structured drug information with clear headings

#### **Template Processing Pipeline**
```typescript
interface PDFGenerationPipeline {
  1: "loadTemplate" // Get template from database
  2: "processConditionalLogic" // Apply show/hide rules
  3: "validateFields" // Check required fields and validation
  4: "substituteVariables" // Replace {{variables}} with actual data
  5: "generateHTML" // Create styled HTML content
  6: "convertToPDF" // Use jsPDF with medical formatting
  7: "addMetadata" // Patient info, generation timestamp
  8: "storeSecurely" // Save with audit trail
}
```

### **Legacy Template Migration**

#### **Preserved Templates (8 total)**
1. **acne-handout-kf.json** - Complex (14 conditional blocks)
2. **acne-treatment-regimen.json** - Moderate (8 fields)
3. **eczema-treatment-regimen.json** - Moderate (6 fields)
4. **isotretinoin-female-handout.json** - Complex (pregnancy warnings)
5. **patch-testing.json** - Simple (static content)
6. **rosacea-handout.json** - Moderate (treatment protocol)
7. **sun-protection-recommendations.json** - Simple (product lists)
8. **vinegar-soak-nails.json** - Simple (recipe instructions)

#### **Content Accuracy Requirements**
- **Medical Content**: Must preserve exact clinical instructions
- **Terminology**: Maintain precise medical terminology
- **Warnings**: Preserve all safety information and contraindications
- **Dosages**: Exact medication instructions and frequencies
- **Formatting**: Maintain professional medical document appearance

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'clinical_staff';

interface Permissions {
  generateHandouts: ['staff', 'clinical_staff', 'manager', 'superadmin'];
  manageTemplates: ['manager', 'superadmin'];
  viewAnalytics: ['manager', 'superadmin'];
  scanQRCodes: ['staff', 'clinical_staff', 'manager', 'superadmin'];
  sendDigitalHandouts: ['staff', 'clinical_staff', 'manager', 'superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-location Access**: Based on user.locations assignment
- **Session Management**: 24-hour JWT tokens with refresh
- **Audit Logging**: All handout generations and digital deliveries tracked with patient MRN and staff member
- **Digital Delivery Tracking**: SMS/email delivery status and patient access logs

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
providers, provider_schedules,
notifications, notification_preferences,
file_uploads, document_storage
```

### **App-Specific Tables**
```sql
-- Enhanced handout templates supporting conditional content and complex structures
CREATE TABLE handout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'education', 'treatment', 'medication', 'pre_procedure', 'post_procedure'
  subcategory TEXT, -- 'skin_conditions', 'procedures', 'medications', 'infections', 'cancer_related'
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'static', -- 'static', 'dynamic', 'conditional'
  
  -- Template content structure (enhanced for conditional logic)
  template_content JSONB NOT NULL, -- Complete template with content blocks
  fill_in_fields JSONB NOT NULL, -- Field definitions with validation rules
  conditional_logic JSONB DEFAULT '[]', -- Show/hide rules for conditional content
  validation_rules JSONB DEFAULT '[]', -- Field validation and dependencies
  
  -- Template metadata and organization
  complexity_level INTEGER DEFAULT 1, -- 1=simple, 2=moderate, 3=complex
  estimated_completion_time INTEGER DEFAULT 0, -- Minutes to complete
  provider_specific BOOLEAN DEFAULT FALSE,
  location_specific TEXT[], -- Array of locations where applicable
  specialty_tags TEXT[], -- Array of specialties/conditions ['acne', 'eczema', 'procedures']
  
  -- Content and delivery options
  digital_delivery_enabled BOOLEAN DEFAULT TRUE,
  requires_physician_review BOOLEAN DEFAULT FALSE, -- CMO approval needed
  medical_specialty TEXT DEFAULT 'dermatology',
  language_code TEXT DEFAULT 'en-US',
  
  -- Versioning and approval workflow
  is_active BOOLEAN DEFAULT TRUE,
  version_number INTEGER DEFAULT 1,
  parent_template_id UUID REFERENCES handout_templates(id), -- For versioning
  approval_status TEXT DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Template source and migration tracking
  source_file TEXT, -- Original file reference
  legacy_template_id TEXT, -- Reference to 2016 system template
  migration_notes TEXT, -- Notes from legacy system migration
  
  -- Audit and management
  created_by UUID REFERENCES users(id),
  last_modified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints and indexes
  CONSTRAINT valid_category CHECK (category IN ('education', 'treatment', 'medication', 'pre_procedure', 'post_procedure')),
  CONSTRAINT valid_template_type CHECK (template_type IN ('static', 'dynamic', 'conditional')),
  CONSTRAINT valid_complexity CHECK (complexity_level BETWEEN 1 AND 3),
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected'))
);

-- Template variables and field definitions (separate table for better organization)
CREATE TABLE template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES handout_templates(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  variable_type TEXT NOT NULL, -- 'text', 'select', 'checkbox', 'conditional'
  display_label TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  validation_pattern TEXT, -- RegExp pattern for validation
  field_options JSONB, -- For select fields: [{"value": "once", "text": "Once daily"}]
  depends_on_field TEXT, -- Field dependency for conditional fields
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, variable_name),
  CONSTRAINT valid_variable_type CHECK (variable_type IN ('text', 'select', 'checkbox', 'conditional'))
);

-- Conditional content blocks (for complex templates like acne-handout-kf)
CREATE TABLE template_conditional_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES handout_templates(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL, -- e.g., 'benzoyl_peroxide_wash'
  block_content TEXT NOT NULL, -- Content with {{variable}} placeholders
  block_type TEXT DEFAULT 'conditional_item', -- 'conditional_item', 'medication_section', 'warning'
  is_required BOOLEAN DEFAULT FALSE,
  is_default_selected BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  parent_block_id TEXT, -- For nested conditional blocks
  
  -- Associated fields for this block
  block_fields JSONB DEFAULT '[]', -- Fields that appear when block is selected
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, block_id)
);

-- Generated handouts log for audit and reprinting
CREATE TABLE generated_handouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_mrn TEXT NOT NULL,
  patient_name TEXT NOT NULL, -- Cached for quick reference
  patient_email TEXT, -- From ModMed record
  patient_phone TEXT, -- From ModMed record (mobile preferred)
  template_ids UUID[] NOT NULL, -- Array of template IDs used
  generated_content JSONB NOT NULL, -- Complete handout data
  fill_in_data JSONB NOT NULL, -- Patient-specific data used
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  location TEXT NOT NULL,
  pdf_file_path TEXT, -- Storage path for generated PDF
  secure_download_url TEXT, -- Time-limited download URL
  download_expires_at TIMESTAMPTZ, -- Download link expiration
  print_count INTEGER DEFAULT 0,
  last_printed_at TIMESTAMPTZ,
  
  -- Digital delivery options
  delivery_method TEXT[], -- Array: 'print', 'email', 'sms'
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_delivery_status TEXT, -- 'pending', 'delivered', 'failed', 'opened'
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMPTZ,
  sms_delivery_status TEXT, -- 'pending', 'delivered', 'failed', 'clicked'
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  patient_consent_digital BOOLEAN DEFAULT FALSE, -- Patient agreed to digital delivery
  
  -- RLS policy
  CONSTRAINT rls_policy CHECK (
    location = ANY(
      SELECT unnest(locations) FROM users WHERE id = auth.uid()
    )
  )
);

-- Handout categories and organization
CREATE TABLE handout_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  icon_name TEXT,
  color_scheme TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient QR code mappings for quick scanning
CREATE TABLE patient_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_mrn TEXT UNIQUE NOT NULL,
  qr_code_data TEXT UNIQUE NOT NULL, -- Encoded patient identifier
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ,
  scan_count INTEGER DEFAULT 0
);

-- Digital delivery tracking and analytics
CREATE TABLE handout_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_handout_id UUID REFERENCES generated_handouts(id) ON DELETE CASCADE,
  delivery_method TEXT NOT NULL, -- 'email', 'sms'
  delivery_status TEXT NOT NULL, -- 'sent', 'delivered', 'failed', 'opened', 'clicked'
  delivery_provider TEXT, -- 'sendgrid', 'twilio'
  provider_message_id TEXT, -- External service message ID
  delivery_attempted_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_confirmed_at TIMESTAMPTZ,
  failure_reason TEXT,
  patient_interaction_at TIMESTAMPTZ, -- When patient opened/clicked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient communication preferences
CREATE TABLE patient_communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_mrn TEXT UNIQUE NOT NULL,
  prefers_digital_handouts BOOLEAN DEFAULT FALSE,
  email_consent BOOLEAN DEFAULT FALSE,
  sms_consent BOOLEAN DEFAULT FALSE,
  preferred_delivery_method TEXT, -- 'print', 'email', 'sms', 'both'
  consent_date TIMESTAMPTZ,
  consent_updated_by UUID REFERENCES users(id),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handout usage analytics
CREATE TABLE handout_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analytics_date DATE NOT NULL,
  location TEXT NOT NULL,
  template_id UUID REFERENCES handout_templates(id),
  generation_count INTEGER DEFAULT 0,
  print_count INTEGER DEFAULT 0,
  email_count INTEGER DEFAULT 0,
  sms_count INTEGER DEFAULT 0,
  digital_delivery_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage delivered digitally
  unique_patients INTEGER DEFAULT 0,
  staff_usage_count INTEGER DEFAULT 0,
  average_generation_time_seconds INTEGER,
  patient_engagement_rate DECIMAL(5,2) DEFAULT 0.00, -- Download/open rate
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(analytics_date, location, template_id)
);
```

### **Data Relationships**
- Links to shared `users` table for staff tracking and audit
- Connects to `locations` for multi-location handout management
- Integrates with ModMed patient data through MRN lookup for contact information
- Audit trail connects to shared `audit_logs` table
- Digital delivery logs provide comprehensive tracking of patient engagement

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
GET    /api/handouts/templates      // List templates with filters
POST   /api/handouts/templates      // Create new template
GET    /api/handouts/templates/[id] // Get specific template
PUT    /api/handouts/templates/[id] // Update template
DELETE /api/handouts/templates/[id] // Soft delete template

GET    /api/handouts/generated      // List generated handouts
POST   /api/handouts/generate       // Generate new handout set
GET    /api/handouts/generated/[id] // Get specific generated handout
```

### **App-Specific Endpoints**
```typescript
// Patient identification and data retrieval
GET    /api/handouts/patient/[mrn]          // Get patient info + contact details from ModMed
POST   /api/handouts/patient/qr-scan        // Process QR code scan
GET    /api/handouts/patient/[mrn]/history  // Previous handouts for patient
GET    /api/handouts/patient/[mrn]/preferences // Get patient communication preferences

// Handout generation and customization
POST   /api/handouts/generate                // Generate custom handouts with delivery options
GET    /api/handouts/preview/[templateId]    // Preview template with sample data
POST   /api/handouts/bulk-generate           // Generate multiple handouts

// Digital delivery management
POST   /api/handouts/send-email/[generatedId]    // Send handouts via email
POST   /api/handouts/send-sms/[generatedId]      // Send download link via SMS
GET    /api/handouts/download/[secureToken]      // Secure download endpoint for patients
POST   /api/handouts/delivery-consent           // Record patient consent for digital delivery
GET    /api/handouts/delivery-status/[generatedId] // Get delivery status

// Template management
GET    /api/handouts/templates/categories    // Get all categories
POST   /api/handouts/templates/duplicate     // Duplicate existing template
POST   /api/handouts/templates/validate      // Validate template structure

// PDF and printing
GET    /api/handouts/pdf/[generatedId]       // Download generated PDF
POST   /api/handouts/print/[generatedId]     // Log print action
GET    /api/handouts/print-queue             // Get print queue status

// Analytics and reporting
GET    /api/handouts/analytics/usage         // Usage statistics including digital delivery
GET    /api/handouts/analytics/popular       // Most used templates
GET    /api/handouts/analytics/digital-adoption // Digital delivery adoption rates
GET    /api/handouts/analytics/patient-engagement // Patient interaction with digital handouts
```

### **External Integrations**
- **ModMed FHIR**: Patient data retrieval including email and mobile phone numbers
- **SendGrid**: Email delivery with PDF attachments and delivery tracking
- **Twilio**: SMS delivery with download links and click tracking
- **Error Handling**: Standard retry logic with exponential backoff
- **Rate Limiting**: Respect external API limits and implement delivery quotas
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

// Handout-specific color coding
handoutCategories: {
  pre_procedure: 'blue-500',
  post_procedure: 'green-500', 
  medication: 'purple-500',
  education: 'orange-500',
  discharge: 'teal-500'
}

// Delivery method indicators
deliveryMethods: {
  print: 'gray-600',
  email: 'blue-600',
  sms: 'green-600',
  both: 'purple-600'
}
```

### **Component Usage**
```typescript
import {
  // Layout
  AppLayout, PageHeader, NavigationTabs,
  
  // Forms
  FormBuilder, FormField, Button, Input, Select, Checkbox,
  
  // Data Display
  DataTable, FilterPanel, StatCard, ProgressIndicator,
  
  // Feedback
  LoadingSpinner, ErrorBoundary, SuccessToast,
  
  // Handout-specific
  QRScanner, PDFPreview, TemplateEditor, PrintQueue,
  DeliveryOptionsPanel, ContactVerification, DeliveryStatusTracker
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **QR Code Scanner**: Camera overlay with scan guides and feedback
- **Template Grid**: Visual template selection with category filtering
- **Delivery Options Panel**: Clear checkboxes for print/email/SMS with patient contact verification
- **Contact Verification**: Display patient email/phone with edit capability before sending
- **PDF Preview**: Real-time preview of filled handouts before generation
- **Delivery Status**: Real-time tracking of email/SMS delivery status
- **Patient Consent Interface**: Clear consent collection for digital delivery
- **Mobile Responsive**: Touch-friendly for tablet use at checkout stations

---

## 📱 User Experience

### **User Workflows**
1. **Enhanced Handout Generation with Digital Delivery**:
   - Scan patient QR code OR enter MRN
   - Auto-populate patient information including email/phone
   - Select relevant handout templates (checkboxes)
   - **NEW**: Choose delivery methods:
     - ☑️ Print for pickup
     - ☑️ Email PDF attachments
     - ☑️ SMS download link
   - **NEW**: Verify patient contact information
   - **NEW**: Obtain patient consent for digital delivery
   - Preview customized handouts
   - Generate and deliver via selected methods

2. **Patient Contact Verification Flow**:
   - Display email/phone from ModMed record
   - Allow staff to update if patient provides corrections
   - Confirm delivery preferences with patient
   - Record consent for digital communications

3. **Template Management** (Managers):
   - Browse existing templates by category
   - Enable/disable digital delivery per template
   - Create new templates with fill-in-the-blank fields
   - Preview templates with sample data
   - Activate/deactivate templates by location

4. **Digital Delivery Monitoring**:
   - Real-time delivery status updates
   - Resend failed deliveries
   - Track patient engagement (opens/downloads)

### **Performance Requirements**
- **Patient Lookup**: < 1 second via MRN or QR scan including contact info
- **PDF Generation**: < 3 seconds for typical handout packet (3-5 pages)
- **Email Delivery**: < 30 seconds from generation to sending
- **SMS Delivery**: < 15 seconds from generation to sending
- **Template Loading**: < 500ms for template selection interface
- **QR Code Scanning**: < 2 seconds from camera activation to patient identification

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all interfaces
- **Keyboard Navigation**: Full functionality without mouse for staff efficiency
- **Screen Reader Support**: Template selection, delivery options, and consent forms
- **High Contrast Mode**: For use in various lighting conditions
- **Touch-Friendly**: Large buttons for delivery method selection

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
Unit Tests: 85%+ coverage for template processing, PDF generation, and delivery logic
Integration Tests: ModMed API, QR code processing, PDF generation, email/SMS delivery
E2E Tests: Complete handout generation workflow including digital delivery
Performance Tests: PDF generation and delivery under load
Accessibility Tests: Automated WCAG validation for all interfaces
Delivery Tests: Email and SMS delivery success rates and timing
```

### **Test Scenarios**
- QR code scanning with various lighting conditions and angles
- Patient data retrieval with missing/invalid email or phone numbers
- Digital delivery with invalid contact information (bounced emails, invalid phone numbers)
- Template rendering with missing or malformed patient data
- PDF generation with large handout packets (10+ templates)
- Concurrent handout generation and delivery by multiple staff members
- Email attachment size limits and SMS character limits
- Patient consent workflow edge cases

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network with PDF caching
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with audit trail + delivery tracking
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# App-specific variables
MODMED_API_URL=https://api.modmed.com/fhir/r4
MODMED_CLIENT_ID=handouts_client
HANDOUTS_PDF_STORAGE_BUCKET=handouts-pdfs
HANDOUTS_QR_ENCRYPTION_KEY=qr_code_encryption_key

# Digital delivery services
SENDGRID_API_KEY=sendgrid_api_key
SENDGRID_FROM_EMAIL=handouts@gangerdermatology.com
TWILIO_ACCOUNT_SID=twilio_account_sid
TWILIO_AUTH_TOKEN=twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567
SECURE_DOWNLOAD_BASE_URL=https://handouts.gangerdermatology.com/download
DOWNLOAD_LINK_EXPIRY_HOURS=72
```

### **Monitoring & Alerts**
- **Health Checks**: ModMed API connectivity, PDF generation service, email/SMS delivery services
- **Error Tracking**: Failed handout generations, QR code scan failures, delivery failures
- **Performance Monitoring**: PDF generation times, patient lookup latency, delivery times
- **Usage Analytics**: Daily handout generation volumes, digital delivery adoption rates
- **Delivery Monitoring**: Email bounce rates, SMS delivery failures, patient engagement rates

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Daily active users, session duration, feature usage
- **Performance Metrics**: Average generation time, error rates, uptime
- **Security Metrics**: Authentication attempts, permission violations

### **App-Specific Analytics**
- **Handout Efficiency**: Time saved vs manual handout preparation
- **Digital Adoption**: Email vs SMS vs print delivery preferences by demographics
- **Patient Engagement**: Download rates, open rates, time to access digital handouts
- **Template Effectiveness**: Most/least used templates by location and specialty
- **Communication Success**: Delivery success rates by method and provider
- **Staff Productivity**: Handouts generated per staff member, delivery method efficiency
- **Cost Analysis**: Paper savings from digital delivery, postage elimination
- **Patient Satisfaction**: Reduced checkout time, improved access to materials

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: Patient data and contact information encrypted at rest and in transit
- **Authentication**: Multi-factor where appropriate for template management
- **Authorization**: Principle of least privilege for template access and patient contact info
- **Audit Logging**: All handout generations and digital deliveries logged with staff and patient identifiers
- **QR Code Security**: Encrypted patient identifiers with expiration
- **Secure Downloads**: Time-limited, tokenized download URLs with access logging

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: Patient contact information and handout content encrypted and access-controlled
- **Audit Requirements**: Complete handout generation and delivery audit trail
- **Data Minimization**: Only collect necessary patient data for handout customization and delivery
- **Retention Policy**: Generated handout data retained for 7 years per medical records requirements
- **Digital Delivery Security**: End-to-end encryption for email attachments, secure download links
- **Consent Management**: Explicit patient consent for digital communications recorded and auditable

### **App-Specific Security**
- **Template Validation**: Prevent XSS in user-created templates
- **QR Code Security**: Tamper-resistant patient identifiers
- **PDF Security**: Generated PDFs contain no embedded patient data beyond what's printed
- **Email Security**: SPF/DKIM/DMARC compliance for delivery reputation
- **SMS Security**: Patient phone number validation and opt-out compliance
- **Download Security**: Single-use tokens, IP logging, download attempt limits

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All critical handout generation workflows functional
- [ ] ModMed integration tested with production data including contact retrieval
- [ ] QR code scanning works reliably in clinic lighting conditions
- [ ] PDF generation performance meets 3-second requirement
- [ ] Email delivery system tested with 99%+ delivery rate
- [ ] SMS delivery system tested with 95%+ delivery rate
- [ ] Template management interface complete for all user roles
- [ ] Patient consent workflow implemented and tested

### **Success Metrics (6 months)**
- 80% reduction in handout preparation time achieved
- 60% digital delivery adoption rate (reducing paper usage)
- 90% staff adoption rate across all locations
- 95% accuracy in patient information insertion
- 98% email delivery success rate
- 95% SMS delivery success rate
- 70% patient engagement rate with digital handouts
- Zero HIPAA compliance violations
- 50% reduction in printing costs

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Template Updates**: Monthly review and update of handout content
- **ModMed Integration**: Quarterly compatibility testing including contact data fields
- **Performance Optimization**: Ongoing PDF generation and delivery optimization
- **Delivery Provider Management**: Monitor SendGrid and Twilio service health and costs
- **Security Reviews**: Annual penetration testing and audit including digital delivery

### **Future Enhancements**
- **Multi-language Support**: Spanish language templates and SMS/email content
- **Smart Template Suggestions**: AI-powered handout recommendations based on diagnosis
- **Integration Expansion**: Connect with other EMR systems beyond ModMed
- **Patient Portal Integration**: Allow patients to access handout library directly
- **Voice Commands**: Hands-free template selection and delivery method choice
- **Patient Feedback**: Digital surveys to improve handout effectiveness
- **Appointment Integration**: Auto-suggest handouts based on upcoming procedures
- **Family/Caregiver Delivery**: Send handouts to designated family members

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Template structure and fill-in-the-blank field documentation
- [ ] PDF generation API with examples
- [ ] QR code scanning implementation guide
- [ ] ModMed integration troubleshooting including contact data
- [ ] Email/SMS delivery API documentation and error handling
- [ ] Secure download URL generation and validation

### **User Documentation**
- [ ] Quick start guide for medical assistants including digital delivery options
- [ ] Patient consent collection best practices
- [ ] Template creation guide for managers
- [ ] QR code scanning best practices
- [ ] Digital delivery troubleshooting (failed emails, invalid phone numbers)
- [ ] Patient communication preferences management
- [ ] Troubleshooting common issues (scanning failures, delivery failures, printing problems)
- [ ] Video tutorials for template management and daily usage including digital delivery workflow

---

*This enhanced PRD ensures rapid, accurate handout generation with modern digital delivery options while maintaining HIPAA compliance and integrating seamlessly with existing Ganger Platform infrastructure.*