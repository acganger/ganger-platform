# PRD: PDF Generation Integration Fix
*Use this template for all new PRDs to ensure consistency, shared infrastructure, and quality enforcement*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: PDF Generation Universal Hub
- **PRD ID**: PRD-PDF-001
- **Priority**: High
- **Development Timeline**: 2-3 weeks (reference PROJECT_TRACKER.md for velocity data)
- **Terminal Assignment**: Backend (server-side PDF generation + client interfaces)
- **Dependencies**: @ganger/integrations, @ganger/auth, @ganger/db, @ganger/utils
- **MCP Integration Requirements**: Supabase Storage for PDF hosting, existing file management system
- **Quality Gate Requirements**: Build verification across all frontend apps, zero Puppeteer imports in client bundles

---

## 🎯 Product Overview

### **Purpose Statement**
Fix PDF generation functionality across all Ganger Platform applications by separating client-side and server-side PDF operations, eliminating Puppeteer build conflicts in frontend apps.

### **Target Users**
- **Primary**: Development team requiring stable builds and PDF generation functionality
- **Secondary**: Medical staff using PDF generation features (handouts, receipts, forms, labels)
- **Tertiary**: Patients and staff receiving generated documents (receipts, educational materials, authorization forms)

### **Success Metrics**
- 100% of frontend apps build successfully without Puppeteer/PDF-related errors
- 93% reduction in client bundle size (15MB Puppeteer removal)
- PDF generation functionality restored with <5 second response time
- Zero build failures related to PDF libraries across all applications

### **Business Value Measurement**
- **ROI Target**: $12,000 development cost savings through eliminated build failures and PDF debugging
- **Cost Savings**: 85% reduction in deployment troubleshooting related to PDF generation
- **Revenue Impact**: Restored PDF functionality enables patient handout delivery and kiosk receipts
- **User Productivity**: Automated PDF generation saves 15 hours/week of manual document creation

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard - MANDATORY)**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with global edge network)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { ClientPdfService } from '@ganger/integrations/client';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { ServerPdfService } from '@ganger/integrations/server';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  HandoutData, PaymentData, AuthData, BarcodeData,
  PdfGenerationRequest, PdfGenerationResponse, 
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```

### **App-Specific Technology**
- Puppeteer (server-side only) for HTML to PDF conversion
- Custom PDF templates with medical compliance features
- Supabase Storage for PDF file hosting and access control
- Automatic file cleanup with configurable retention policies

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard - Updated Hierarchy)**
```typescript
// MANDATORY role hierarchy - see MASTER_DEVELOPMENT_GUIDE.md
type UserRole = 
  | 'superadmin'        // Full PDF generation and template management
  | 'manager'           // Generate reports and patient materials
  | 'provider'          // Generate patient handouts and forms
  | 'nurse'             // Generate basic patient materials
  | 'medical_assistant' // Generate routine forms and receipts
  | 'pharmacy_tech'     // Generate medication labels and inventory reports
  | 'billing'           // Generate payment receipts and reports
  | 'user';             // Basic receipt generation only

// PDF generation permission matrix
interface PdfPermissions {
  generate_handouts: ['superadmin', 'manager', 'provider', 'nurse'];
  generate_receipts: ['superadmin', 'manager', 'medical_assistant', 'billing'];
  generate_barcodes: ['superadmin', 'manager', 'pharmacy_tech'];
  generate_auth_forms: ['superadmin', 'manager', 'provider'];
  admin_templates: ['superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com accounts for template access
- **File Access**: Generated PDFs accessible based on role and patient assignment
- **Template Management**: Restricted to authorized personnel only
- **Audit Trail**: All PDF generation operations logged for compliance

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, file_uploads
```

### **App-Specific Tables**
```sql
-- PDF generation tracking
CREATE TABLE pdf_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- PDF details
  pdf_type VARCHAR(50) NOT NULL, -- 'handout', 'receipt', 'barcode', 'auth_form'
  template_name VARCHAR(255),
  generation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  file_url TEXT,
  file_size_bytes INTEGER,
  generation_time_ms INTEGER,
  error_message TEXT,
  
  -- Associated data
  patient_id UUID REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  payment_id UUID REFERENCES payments(id),
  
  -- Standard RLS policy
  CONSTRAINT rls_policy CHECK (
    created_by = auth.uid() OR 
    auth.jwt() ->> 'role' IN ('superadmin', 'manager') OR
    (patient_id IS NOT NULL AND patient_id IN (
      SELECT patient_id FROM patient_access WHERE user_id = auth.uid()
    ))
  )
);

-- PDF templates
CREATE TABLE pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Template details
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- 'handout', 'receipt', 'form', 'label'
  html_template TEXT NOT NULL,
  css_styles TEXT,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  
  -- Medical compliance
  hipaa_compliant BOOLEAN DEFAULT false,
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id)
);
```

### **Data Relationships**
- Links to patient records for handout generation
- Connects to payment data for receipt generation
- References inventory items for barcode generation
- Audit trail for all PDF operations and template usage

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated with Response Standards)**
```typescript
// PDF generation endpoints
POST   /api/pdf/generate                 // Generic PDF generation
GET    /api/pdf/status/[id]             // Generation status check
GET    /api/pdf/download/[id]           // Download generated PDF
DELETE /api/pdf/[id]                    // Delete PDF file

// Template management
GET    /api/pdf/templates               // List available templates
POST   /api/pdf/templates               // Create new template
PUT    /api/pdf/templates/[id]          // Update template
DELETE /api/pdf/templates/[id]          // Delete template
```

### **App-Specific Endpoints**
```typescript
// Handouts app - Patient education PDFs
POST   /api/handouts/pdf/generate
interface HandoutPdfRequest {
  templateId: string;
  patientId: string;
  customizations: {
    diagnosis: string;
    treatments: string[];
    instructions: string;
  };
}

// Check-in kiosk - Payment receipts
POST   /api/checkin-kiosk/pdf/receipt
interface ReceiptPdfRequest {
  paymentId: string;
  patientId: string;
  services: Service[];
  paymentMethod: PaymentMethod;
}

// Inventory - Barcode labels
POST   /api/inventory/pdf/barcode
interface BarcodePdfRequest {
  itemId: string;
  quantity: number;
  labelSize: 'small' | 'medium' | 'large';
}

// Medication auth - Authorization forms
POST   /api/medication-auth/pdf/authorization
interface AuthFormPdfRequest {
  authorizationId: string;
  patientId: string;
  medications: Medication[];
  insuranceInfo: InsuranceData;
}
```

### **External Integrations (Use Universal Hubs ONLY)**
```typescript
// ✅ REQUIRED: Use Universal Hubs - NO direct external API calls
import { 
  UniversalPdfHub,            // Server-side PDF generation
  UniversalStorageHub         // Supabase Storage integration
} from '@ganger/integrations';

// Implementation pattern:
const pdfHub = new UniversalPdfHub();
const storageHub = new UniversalStorageHub();

const pdfBuffer = await pdfHub.generateFromTemplate(templateHtml, data);
const fileUrl = await storageHub.uploadPdf(pdfBuffer, `handouts/${Date.now()}.pdf`);
```

- **Puppeteer**: Server-side HTML to PDF conversion
- **Supabase Storage**: PDF file hosting with access control
- **Error Handling**: Built into Universal Hubs with monitoring
- **File Management**: Automatic cleanup and retention policies
- **Access Control**: Role-based PDF file access

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // PDF generation actions
  secondary: 'green-600',   // Successful generation
  accent: 'purple-600',     // Download actions
  neutral: 'slate-600',     // Status text
  warning: 'amber-600',     // Generation warnings
  danger: 'red-600'         // Generation failures
}
```

### **Component Usage**
```typescript
// Use shared components for PDF interfaces
import {
  // PDF Generation
  PdfGenerateButton, GenerationProgress, PdfPreview,
  
  // File Management
  DownloadButton, PdfViewer, FileList,
  
  // Status Display
  GenerationStatus, ErrorAlert, SuccessMessage
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- Real-time generation progress indicators
- PDF preview capabilities before final generation
- Download buttons with appropriate file naming
- Error displays with regeneration options
- Template selection interfaces for customizable PDFs

---

## 📱 User Experience

### **User Workflows**
1. **Generate PDF**: User selects template, enters data, triggers generation with progress feedback
2. **Preview PDF**: Users can preview PDF before final generation (when applicable)
3. **Download PDF**: Immediate download after successful generation
4. **Error Recovery**: Clear error messages with regeneration options and alternative actions

### **Performance Requirements (Enforced by Performance Budgets)**
```typescript
// MANDATORY performance budgets - automatically enforced
const PERFORMANCE_BUDGETS = {
  // PDF generation response time
  pdf_generation: 5000,    // 5.0s max for PDF creation
  
  // Download initiation time
  download_start: 1000,    // 1.0s max for download to begin
  
  // Client bundle size reduction
  bundle_reduction: 15000000, // 15MB reduction from Puppeteer removal
};
```
- **Real-time Updates**: < 500ms latency for generation status
- **Offline Capability**: Graceful degradation with manual download options

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all PDF generation interfaces
- **Keyboard Navigation**: Full PDF generation workflow without mouse
- **Screen Reader Support**: Semantic generation status announcements
- **Color Contrast**: 4.5:1 minimum ratio for all PDF controls

---

## 🧪 Testing Strategy

### **Automated Testing (Enforced by Quality Gates)**
```typescript
// MANDATORY test patterns - automatically verified
Unit Tests: 90%+ coverage for PDF service logic
Integration Tests: All PDF generation endpoints with real output
E2E Tests: Complete PDF workflows with file verification
Performance Tests: Generation timing and bundle size verification
Build Tests: All frontend apps compile without Puppeteer errors
Security Tests: File access control and permissions
Template Tests: All PDF templates render correctly
```

### **Quality Gate Integration**
```bash
# Pre-commit verification (automatically runs):
✅ npm run test              # All tests must pass
✅ npm run type-check        # 0 TypeScript errors
✅ npm run build            # All apps build without PDF errors
✅ npm run test:pdf         # PDF generation integration tests
✅ npm run audit:bundle     # Bundle size verification
✅ npm run test:templates   # Template rendering tests
```

### **Test Scenarios**
- Successful handout PDF generation with patient data
- Receipt generation with payment information
- Barcode label generation with proper formatting
- Authorization form generation with medical data
- Error handling for invalid template data
- Large PDF generation performance testing
- Concurrent PDF generation load testing

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with PDF generation audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# PDF generation specific variables
PDF_STORAGE_BUCKET=pdfs
PDF_RETENTION_DAYS=30
PDF_MAX_SIZE_MB=50
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PDF_CONCURRENT_LIMIT=5
```

### **Monitoring & Alerts**
- **Generation Status Monitoring**: Real-time PDF generation success/failure tracking
- **Performance Monitoring**: Generation timing and optimization opportunities
- **Storage Monitoring**: PDF file storage usage and cleanup verification
- **Error Tracking**: Failed generation attempts with detailed logging

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **Generation Performance**: PDF creation timing and success rates
- **Template Usage**: Most popular templates and customizations
- **Error Patterns**: Common failure modes and resolution
- **Storage Usage**: PDF file storage patterns and retention

### **App-Specific Analytics**
- **Handouts**: Patient education PDF generation frequency and types
- **Receipts**: Payment receipt generation patterns and timing
- **Barcodes**: Inventory label generation volume and formats
- **Authorization Forms**: Medical authorization PDF compliance and usage

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **File Access Control**: Role-based permissions for PDF access
- **Data Encryption**: PDF files encrypted at rest in Supabase Storage
- **Audit Logging**: All PDF generation operations logged
- **Template Security**: Secure template storage and version control
- **Content Sanitization**: Input validation for all PDF data

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: Secure handling of patient data in PDFs
- **Access Controls**: Role-based permissions for medical PDFs
- **Audit Requirements**: Complete PDF generation logging
- **Data Retention**: Automatic cleanup with compliance schedules
- **Secure Transmission**: Encrypted download and sharing

### **App-Specific Security**
- Patient data sanitization in handout generation
- Payment information security in receipt generation
- Medical authorization form compliance and validation
- Template access control and change management

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All frontend apps build successfully without PDF-related errors
- [ ] PDF generation functionality restored across all apps
- [ ] Performance benchmarks met (5s generation, 15MB bundle reduction)
- [ ] Security audit passed for file access and storage
- [ ] Integration testing completed with all PDF types

### **Success Metrics (6 months)**
- 100% build success rate across all frontend applications
- 90% reduction in PDF-related support tickets
- 25% improvement in patient handout delivery efficiency
- 15 hours/week saved in manual document creation tasks

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Template Updates**: Monthly review and updates of PDF templates
- **Performance Optimization**: Quarterly generation speed improvements
- **Storage Cleanup**: Weekly automated file retention policy execution
- **Security Reviews**: Monthly access control and audit log analysis

### **Future Enhancements**
- Interactive PDF forms with digital signatures
- Batch PDF generation for bulk operations
- Advanced template designer with drag-and-drop interface
- Integration with external document management systems

---

## 📚 Documentation Requirements

### **Developer Documentation (Reference /true-docs/)**
- [ ] **API documentation**: PDF generation endpoints with examples
- [ ] **Template system**: Creating and managing PDF templates
- [ ] **Performance optimization**: Bundle size and generation timing guidelines
- [ ] **Error handling**: Troubleshooting guide for common issues
- [ ] **Security implementation**: File access control and compliance

### **User Documentation**
- [ ] **PDF generation guide**: Step-by-step generation instructions
- [ ] **Template customization**: Using and modifying PDF templates
- [ ] **Download and sharing**: Managing generated PDF files
- [ ] **Troubleshooting**: Common issues and resolution steps

---

## 🤖 AI Development Integration

### **Terminal Coordination (Reference AI_WORKFLOW_GUIDE.md)**
```yaml
# Specify terminal assignment for optimal development
Terminal_Assignment: Backend

# Expected development pattern
Backend_Terminal_Focus:
  - PDF service separation (client/server)
  - Puppeteer server-side implementation
  - API route creation for PDF operations
  - File storage integration with Supabase
  - Template management system
  - Error handling and retry logic

Coordination_Points:
  - Client interface definition (TypeScript types)
  - Authentication integration (file access control)
  - Real-time features (generation status updates)
  - Performance optimization (bundle size reduction)
```

### **Verification-First Development**
```bash
# MANDATORY verification before claiming completion
✅ npm run type-check        # "Found 0 errors"
✅ npm run build            # "Build completed successfully" (all apps)
✅ npm run test:pdf         # "All PDF generation tests passed"
✅ npm run audit:bundle     # "Bundle size reduced by 15MB"
✅ npm run test:e2e-pdf     # "End-to-end PDF workflow passed"
```

### **Quality Gate Enforcement**
```typescript
// This PRD will be subject to automated quality enforcement:
PreCommitHooks: {
  typeScriptCompilation: "ZERO_ERRORS_TOLERANCE",
  packageBoundaries: "GANGER_PACKAGES_ONLY", 
  buildVerification: "ALL_APPS_BUILD_SUCCESS",
  bundleSize: "PUPPETEER_REMOVAL_VERIFIED",
  integrationTests: "PDF_GENERATION_FUNCTIONAL"
}
```

---

*This PRD ensures PDF generation works reliably across all Ganger Platform applications while maintaining build stability and performance standards.*

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards
- `/true-docs/AI_WORKFLOW_GUIDE.md` - AI development methodologies
- `/_claude_desktop/SPRINT_PDF_GENERATION_FIX.md` - Detailed implementation plan