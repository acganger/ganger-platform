# PRD: Shift Batch Closeout & Label Generator
*Ganger Platform Standard Application*

## 📋 Document Information
- **Application Name**: Shift Batch Closeout & Label Generator
- **Priority**: High
- **Development Timeline**: 4-5 weeks
- **Dependencies**: @ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations
- **Integration Requirements**: PDF processing, Label printing, File upload handling, Amount verification

---

## 🎯 Product Overview

### **Purpose Statement**
Create a verification and label generation system for end-of-shift batch closeouts. Staff upload their batch report PDF (generated from ModMed), the app extracts payment totals, users verify amounts match their physical envelope contents (cash, checks, coupons, gift certificates), provide explanations for any discrepancies, and generate professional labels for envelope identification and audit tracking.

### **Core Workflow**
1. **Upload**: Staff upload batch report PDF from ModMed (filename may be user-generated and inconsistent)
2. **Extract**: App parses PDF content to extract reliable batch date, location (A2/AA, PY, WX), staff name, and payment amounts
3. **Verify**: Staff confirm extracted amounts match what they're putting in physical envelope
4. **Explain**: Staff provide text explanations for any discrepancies between PDF and envelope
5. **Generate**: App creates professional label with verified amounts, location, staff name, and discrepancy notes
6. **Print**: Staff print label and attach to deposit envelope

### **Target Users**
- **Primary**: Front Desk Staff (staff role) - daily batch verification and label generation
- **Secondary**: Managers (manager role) - discrepancy oversight and analytics
- **Tertiary**: Accounting Staff - audit support and reconciliation

### **Success Metrics**
- 90% reduction in manual label creation time (2 minutes vs 20 minutes)
- 100% professional printed labels for audit compliance
- 95% reduction in missing envelope identification
- 100% discrepancy documentation for audit trail

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
import { Button, Input, LoadingSpinner, DataTable, StatCard, FormField } from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { PDFProcessor, PDFGenerator, PrintService } from '@ganger/integrations';
import { analytics, notifications } from '@ganger/utils';
```

### **App-Specific Technology**
- **PDF Processing**: PDF.js for reliable text extraction from ModMed batch reports
- **File Upload**: Supabase Storage for batch report PDF storage
- **Content Parsing**: Focus on PDF content rather than unreliable filename parsing
- **Location Mapping**: Ann Arbor (A2/AA), Plymouth (PY), Wixom (WX) standardization
- **Amount Extraction**: Pattern recognition for ModMed payment data within PDF content
- **Label Generation**: jsPDF with custom envelope label templates
- **Label Printing**: Browser print API with label printer optimization
- **Discrepancy Tracking**: Text input validation and audit logging

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin';

interface Permissions {
  uploadBatchReports: ['staff', 'manager', 'superadmin'];
  verifyAmounts: ['staff', 'manager', 'superadmin'];
  generateLabels: ['staff', 'manager', 'superadmin'];
  viewDiscrepancies: ['manager', 'superadmin'];
  manageTemplates: ['manager', 'superadmin'];
  viewAnalytics: ['manager', 'superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Multi-location Access**: Based on user.locations assignment
- **Session Management**: 24-hour JWT tokens with refresh
- **Audit Logging**: All batch uploads, verifications, and label generations tracked
- **File Security**: Uploaded PDFs stored securely with user access controls

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
-- Batch report uploads and processing
CREATE TABLE public.batch_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and location info
    staff_email TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    location TEXT NOT NULL, -- Ann Arbor (A2), Plymouth (PY), Wixom (WX)
    
    -- File information
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    file_upload_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Parsed batch information (from filename - unreliable)
    batch_date DATE,
    batch_info TEXT, -- Raw filename batch info (user-generated, inconsistent)
    filename_location_hint TEXT, -- Extracted location hint from filename (unreliable)
    filename_user_hint TEXT, -- Extracted user hint from filename (unreliable)
    
    -- Reliable data extracted from PDF content
    pdf_batch_date DATE, -- Actual batch date from PDF content
    pdf_location TEXT, -- Ann Arbor (A2/AA), Plymouth (PY), Wixom (WX)
    pdf_staff_name TEXT, -- Staff name from PDF content
    pdf_batch_id TEXT, -- ModMed batch ID from PDF
    
    -- Processing status
    processing_status TEXT DEFAULT 'uploaded', -- uploaded, processing, parsed, verified, label_generated
    pdf_parsing_status TEXT DEFAULT 'pending', -- pending, success, failed
    parsing_error_message TEXT,
    parsed_at TIMESTAMPTZ,
    
    -- Extracted payment amounts from PDF
    extracted_cash DECIMAL(10,2) DEFAULT 0.00,
    extracted_checks DECIMAL(10,2) DEFAULT 0.00,
    extracted_credit_cards DECIMAL(10,2) DEFAULT 0.00,
    extracted_gift_certificates DECIMAL(10,2) DEFAULT 0.00,
    extracted_coupons DECIMAL(10,2) DEFAULT 0.00,
    extracted_other DECIMAL(10,2) DEFAULT 0.00,
    extracted_total DECIMAL(10,2) GENERATED ALWAYS AS (
        extracted_cash + extracted_checks + extracted_credit_cards + 
        extracted_gift_certificates + extracted_coupons + extracted_other
    ) STORED,
    
    -- Staff verified amounts (what's actually in envelope)
    verified_cash DECIMAL(10,2),
    verified_checks DECIMAL(10,2),
    verified_credit_cards DECIMAL(10,2),
    verified_gift_certificates DECIMAL(10,2),
    verified_coupons DECIMAL(10,2),
    verified_other DECIMAL(10,2),
    verified_total DECIMAL(10,2) GENERATED ALWAYS AS (
        COALESCE(verified_cash, 0) + COALESCE(verified_checks, 0) + COALESCE(verified_credit_cards, 0) + 
        COALESCE(verified_gift_certificates, 0) + COALESCE(verified_coupons, 0) + COALESCE(verified_other, 0)
    ) STORED,
    
    -- Verification status and discrepancies
    verification_status TEXT DEFAULT 'pending', -- pending, verified, discrepancy_noted
    has_discrepancies BOOLEAN GENERATED ALWAYS AS (
        (COALESCE(verified_cash, 0) != extracted_cash) OR
        (COALESCE(verified_checks, 0) != extracted_checks) OR
        (COALESCE(verified_credit_cards, 0) != extracted_credit_cards) OR
        (COALESCE(verified_gift_certificates, 0) != extracted_gift_certificates) OR
        (COALESCE(verified_coupons, 0) != extracted_coupons) OR
        (COALESCE(verified_other, 0) != extracted_other)
    ) STORED,
    discrepancy_explanation TEXT,
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    
    -- Label generation
    label_generated BOOLEAN DEFAULT FALSE,
    label_file_path TEXT,
    label_printed BOOLEAN DEFAULT FALSE,
    label_generated_at TIMESTAMPTZ,
    label_printed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual discrepancies for detailed tracking
CREATE TABLE public.batch_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_report_id UUID NOT NULL REFERENCES public.batch_reports(id) ON DELETE CASCADE,
    
    -- Discrepancy details
    payment_type TEXT NOT NULL, -- cash, checks, credit_cards, etc.
    extracted_amount DECIMAL(10,2) NOT NULL,
    verified_amount DECIMAL(10,2) NOT NULL,
    variance_amount DECIMAL(10,2) GENERATED ALWAYS AS (verified_amount - extracted_amount) STORED,
    
    -- Explanations and resolution
    staff_explanation TEXT,
    manager_notes TEXT,
    resolution_status TEXT DEFAULT 'noted', -- noted, investigated, resolved, accepted
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Label templates for envelope labels
CREATE TABLE public.envelope_label_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template information
    template_name TEXT NOT NULL,
    template_description TEXT,
    
    -- Label dimensions and layout
    label_width_mm DECIMAL(6,2) NOT NULL DEFAULT 101.6, -- 4 inches
    label_height_mm DECIMAL(6,2) NOT NULL DEFAULT 50.8, -- 2 inches
    
    -- Template configuration
    template_data JSONB NOT NULL, -- Label layout and styling configuration
    font_family TEXT DEFAULT 'Arial',
    font_size INTEGER DEFAULT 10,
    margin_top_mm DECIMAL(4,2) DEFAULT 3.0,
    margin_left_mm DECIMAL(4,2) DEFAULT 3.0,
    margin_right_mm DECIMAL(4,2) DEFAULT 3.0,
    margin_bottom_mm DECIMAL(4,2) DEFAULT 3.0,
    
    -- Features
    include_qr_code BOOLEAN DEFAULT TRUE,
    include_amounts_table BOOLEAN DEFAULT TRUE,
    include_discrepancy_section BOOLEAN DEFAULT TRUE,
    include_verification_signature BOOLEAN DEFAULT FALSE,
    
    -- Template status
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated envelope labels
CREATE TABLE public.generated_envelope_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_report_id UUID NOT NULL REFERENCES public.batch_reports(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.envelope_label_templates(id),
    
    -- Label content
    label_data JSONB NOT NULL, -- Complete label content and data
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    
    -- QR code for tracking
    qr_code_data TEXT, -- Batch tracking information
    
    -- Print management
    print_status TEXT DEFAULT 'ready', -- ready, printing, printed, failed
    print_attempts INTEGER DEFAULT 0,
    last_print_attempt TIMESTAMPTZ,
    print_error_message TEXT,
    
    -- Audit
    generated_by TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    printed_at TIMESTAMPTZ
);

-- Daily batch summary for analytics
CREATE TABLE public.daily_batch_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Summary period
    summary_date DATE NOT NULL,
    location TEXT NOT NULL,
    
    -- Batch counts
    total_batches INTEGER DEFAULT 0,
    total_with_discrepancies INTEGER DEFAULT 0,
    discrepancy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_batches > 0 
        THEN (total_with_discrepancies::DECIMAL / total_batches::DECIMAL) * 100 
        ELSE 0 END
    ) STORED,
    
    -- Amount totals
    total_extracted_amount DECIMAL(12,2) DEFAULT 0.00,
    total_verified_amount DECIMAL(12,2) DEFAULT 0.00,
    total_variance_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        total_verified_amount - total_extracted_amount
    ) STORED,
    
    -- Processing stats
    successful_uploads INTEGER DEFAULT 0,
    failed_parsing INTEGER DEFAULT 0,
    labels_generated INTEGER DEFAULT 0,
    labels_printed INTEGER DEFAULT 0,
    
    -- Timing
    average_processing_time_minutes DECIMAL(8,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(summary_date, location)
);

-- System configuration
CREATE TABLE public.batch_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    last_updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_batch_reports_staff ON public.batch_reports(staff_email);
CREATE INDEX idx_batch_reports_date ON public.batch_reports(batch_date);
CREATE INDEX idx_batch_reports_location ON public.batch_reports(location);
CREATE INDEX idx_batch_reports_status ON public.batch_reports(processing_status);
CREATE INDEX idx_batch_reports_verification ON public.batch_reports(verification_status);
CREATE INDEX idx_batch_discrepancies_batch ON public.batch_discrepancies(batch_report_id);
CREATE INDEX idx_generated_labels_batch ON public.generated_envelope_labels(batch_report_id);
CREATE INDEX idx_generated_labels_status ON public.generated_envelope_labels(print_status);
CREATE INDEX idx_daily_summary_date_location ON public.daily_batch_summary(summary_date, location);

-- Row Level Security
ALTER TABLE public.batch_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelope_label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_envelope_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_batch_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_system_config ENABLE ROW LEVEL SECURITY;

-- Policies: Staff can access their own data, managers can see all
CREATE POLICY "Staff can access own batch reports" ON public.batch_reports
    FOR ALL USING (
        staff_email = auth.jwt() ->> 'email'
        OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Staff can access related discrepancies" ON public.batch_discrepancies
    FOR ALL USING (
        batch_report_id IN (
            SELECT id FROM public.batch_reports 
            WHERE staff_email = auth.jwt() ->> 'email'
        )
        OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Staff can read label templates" ON public.envelope_label_templates
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    );

CREATE POLICY "Managers can manage label templates" ON public.envelope_label_templates
    FOR INSERT, UPDATE, DELETE USING (
        auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Staff can access own labels" ON public.generated_envelope_labels
    FOR ALL USING (
        batch_report_id IN (
            SELECT id FROM public.batch_reports 
            WHERE staff_email = auth.jwt() ->> 'email'
        )
        OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Managers can view summaries" ON public.daily_batch_summary
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

CREATE POLICY "Managers can manage config" ON public.batch_system_config
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

-- Insert default label template
INSERT INTO public.envelope_label_templates (
    template_name, 
    template_description, 
    template_data, 
    is_default, 
    created_by
) VALUES (
    'Standard Envelope Label',
    'Default template for batch deposit envelope labels',
    '{
        "layout": "standard",
        "sections": [
            {"type": "header", "content": "DAILY DEPOSIT", "fontSize": 16, "bold": true, "align": "center"},
            {"type": "info", "content": "Date: {{batch_date}} | Location: {{location}} | Staff: {{staff_name}}", "fontSize": 10},
            {"type": "spacer", "height": 2},
            {"type": "amounts_table", "title": "VERIFIED AMOUNTS", "fontSize": 11},
            {"type": "spacer", "height": 2},
            {"type": "total", "content": "TOTAL DEPOSIT: ${{verified_total}}", "fontSize": 14, "bold": true},
            {"type": "spacer", "height": 3},
            {"type": "discrepancies", "content": "{{discrepancy_section}}", "fontSize": 9},
            {"type": "qr", "content": "{{batch_id}}", "size": 25, "position": "bottom-right"}
        ]
    }',
    true,
    'system'
);

-- Insert default system configurations
INSERT INTO public.batch_system_config (config_key, config_value, description) VALUES
('auto_parse_uploads', 'true', 'Automatically parse PDF files upon upload'),
('require_verification', 'true', 'Require staff verification of all amounts'),
('enable_discrepancy_alerts', 'true', 'Send alerts for discrepancies above threshold'),
('discrepancy_threshold_dollars', '5.00', 'Dollar threshold for discrepancy alerts'),
('discrepancy_threshold_percentage', '2.0', 'Percentage threshold for discrepancy alerts'),
('enable_qr_codes', 'true', 'Include QR codes on labels for tracking'),
('max_file_size_mb', '10', 'Maximum upload file size in megabytes'),
('supported_file_types', '["pdf"]', 'Supported file types for upload');
```

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
GET    /api/batch-reports              // List batch reports with filters
POST   /api/batch-reports              // Upload new batch report
GET    /api/batch-reports/[id]         // Get specific batch report
PUT    /api/batch-reports/[id]         // Update batch report
DELETE /api/batch-reports/[id]         // Delete batch report

GET    /api/labels                     // List generated labels
POST   /api/labels                     // Generate new label
GET    /api/labels/[id]                // Get specific label
```

### **App-Specific Endpoints**
```typescript
// File upload and processing
POST   /api/batch-reports/upload       // Upload batch report PDF
POST   /api/batch-reports/[id]/parse   // Parse uploaded PDF content (not filename)
GET    /api/batch-reports/[id]/parsed-data // Get extracted data from PDF content
POST   /api/batch-reports/[id]/suggest-location // Suggest location mapping if unclear

// Amount verification
POST   /api/batch-reports/[id]/verify  // Submit verified amounts
PUT    /api/batch-reports/[id]/discrepancy // Add discrepancy explanation
GET    /api/batch-reports/[id]/verification // Get verification status

// Label generation and printing
POST   /api/labels/generate            // Generate envelope label
GET    /api/labels/preview/[id]        // Preview label before printing
POST   /api/labels/print/[id]          // Send label to printer
GET    /api/labels/download/[id]       // Download label PDF

// Template management
GET    /api/templates/envelope         // Get envelope label templates
POST   /api/templates/envelope         // Create new template
PUT    /api/templates/envelope/[id]    // Update template
DELETE /api/templates/envelope/[id]    // Delete template

// Analytics and reporting
GET    /api/analytics/daily-summary    // Daily batch processing summary
GET    /api/analytics/discrepancies    // Discrepancy trends and patterns
GET    /api/analytics/staff-performance // Staff processing efficiency
POST   /api/analytics/export           // Export analytics reports

// System utilities
GET    /api/system/config              // Get system configuration
PUT    /api/system/config              // Update system configuration
POST   /api/system/test-parsing        // Test PDF parsing with sample file
```

---

## 📱 User Experience

### **Primary Workflow: Batch Verification & Label Generation**

#### **Step 1: Upload Batch Report**
```typescript
// Upload interface with drag-and-drop
interface UploadInterface {
  supportedFormats: ['PDF'];
  maxFileSize: '10MB';
  validationRules: [
    'Must be ModMed batch report PDF',
    'Filename must contain date and location info',
    'File must be readable and contain payment data'
  ];
  autoProcessing: true; // Automatically parse after upload
}
```

#### **Step 2: Review Extracted Data (from PDF Content)**
```typescript
// Show extracted data from PDF content (ignore unreliable filename)
interface ExtractedData {
  // Reliable data from PDF content
  batchDate: string; // From PDF content
  location: 'A2' | 'PY' | 'WX'; // Standardized location codes
  staffName: string; // From PDF content
  batchId: string; // ModMed batch ID from PDF
  
  // Payment amounts from PDF
  cash: number;
  checks: number;
  creditCards: number;
  giftCertificates: number;
  coupons: number;
  other: number;
  total: number;
  
  // Extraction metadata
  extractionConfidence: 'high' | 'medium' | 'low';
  warnings: string[]; // Any parsing warnings
  
  // Filename info (for reference only)
  originalFilename: string;
  filenameHints: {
    locationHint?: string; // User-generated, unreliable
    userHint?: string; // User-generated, unreliable
  };
}
```

#### **Step 3: Verify Physical Amounts**
```typescript
// Staff input their actual envelope amounts
interface VerificationForm {
  cashAmount: number;
  checksAmount: number;
  creditCardsAmount: number; // Usually 0 for physical deposit
  giftCertificatesAmount: number;
  couponsAmount: number;
  otherAmount: number;
  
  // Auto-calculate discrepancies
  discrepancies: {
    type: string;
    extracted: number;
    verified: number;
    variance: number;
  }[];
  
  // Required if discrepancies exist
  explanationRequired: boolean;
  explanation?: string;
}
```

#### **Step 4: Generate and Print Label**
```typescript
// Label generation with verification data
interface LabelData {
  batchDate: string; // From PDF content (reliable)
  location: 'A2' | 'PY' | 'WX'; // Standardized location codes
  staffName: string; // From PDF content (reliable)
  batchId: string; // ModMed batch ID from PDF
  
  verifiedAmounts: {
    cash: number;
    checks: number;
    giftCertificates: number;
    other: number;
    total: number;
  };
  
  discrepancies?: {
    summary: string;
    explanation: string;
    totalVariance: number;
  };
  
  qrCode: string; // For tracking and audit
}
```

### **User Interface Components**

#### **Upload Component**
```typescript
// Drag-and-drop file upload with validation
const BatchUpload = () => {
  return (
    <div className="upload-zone">
      <div className="upload-area">
        <CloudUploadIcon className="h-12 w-12 text-gray-400" />
        <h3>Upload Batch Report</h3>
        <p>Drag and drop your ModMed batch report PDF here</p>
        <Button>Choose File</Button>
      </div>
      
      <div className="upload-requirements">
        <h4>File Requirements:</h4>
        <ul>
          <li>PDF format only</li>
          <li>Maximum 10MB file size</li>
          <li>Must be ModMed generated batch report</li>
          <li>App will extract data from PDF content (filename not used for data)</li>
        </ul>
      </div>
    </div>
  );
};
```

#### **Amount Verification Component**
```typescript
// Side-by-side comparison of extracted vs verified amounts
const AmountVerification = ({ extractedData, onVerify }) => {
  const [verified, setVerified] = useState({});
  const [explanation, setExplanation] = useState('');
  
  const hasDiscrepancies = Object.keys(extractedData.amounts).some(
    key => verified[key] !== extractedData.amounts[key]
  );
  
  return (
    <div className="verification-container">
      {/* Show extracted metadata */}
      <div className="extraction-info">
        <h3>Extracted from PDF Content</h3>
        <div className="metadata">
          <p><strong>Date:</strong> {extractedData.batchDate}</p>
          <p><strong>Location:</strong> {extractedData.location} ({getLocationName(extractedData.location)})</p>
          <p><strong>Staff:</strong> {extractedData.staffName}</p>
          <p><strong>Batch ID:</strong> {extractedData.batchId}</p>
          <p><strong>Confidence:</strong> {extractedData.extractionConfidence}</p>
        </div>
        {extractedData.warnings.length > 0 && (
          <div className="warnings">
            <h4>Parsing Warnings:</h4>
            {extractedData.warnings.map((warning, i) => (
              <p key={i} className="warning">{warning}</p>
            ))}
          </div>
        )}
      </div>
      
      <div className="verification-grid">
        <div className="extracted-column">
          <h3>Extracted Amounts</h3>
          <AmountBreakdown amounts={extractedData.amounts} readonly />
        </div>
        
        <div className="verified-column">
          <h3>Amount in Envelope</h3>
          <AmountBreakdown 
            amounts={verified} 
            onChange={setVerified}
            editable 
          />
        </div>
      </div>
      
      {hasDiscrepancies && (
        <div className="discrepancy-section">
          <h4>Discrepancy Explanation Required</h4>
          <TextArea
            value={explanation}
            onChange={setExplanation}
            placeholder="Please explain any differences between extracted and verified amounts..."
            required
          />
        </div>
      )}
      
      <Button 
        onClick={() => onVerify(verified, explanation, extractedData)}
        disabled={hasDiscrepancies && !explanation.trim()}
      >
        Verify Amounts & Generate Label
      </Button>
    </div>
  );
};

function getLocationName(code: string): string {
  const locations = {
    'A2': 'Ann Arbor',
    'AA': 'Ann Arbor', 
    'PY': 'Plymouth',
    'WX': 'Wixom'
  };
  return locations[code] || 'Unknown';
}
```

#### **Label Preview Component**
```typescript
// Real-time label preview before printing
const LabelPreview = ({ labelData, template }) => {
  return (
    <div className="label-preview">
      <div className="preview-controls">
        <Select value={template} onChange={setTemplate}>
          <option value="standard">Standard Envelope Label</option>
          <option value="detailed">Detailed Breakdown Label</option>
        </Select>
        <Button onClick={handlePreviewRefresh}>Refresh Preview</Button>
      </div>
      
      <div className="label-canvas">
        {/* Rendered label preview */}
        <div className="label-content">
          <h2>DAILY DEPOSIT</h2>
          <p>{labelData.batchDate} | {labelData.location} | {labelData.staffName}</p>
          
          <table className="amounts-table">
            <tr><td>Cash:</td><td>${labelData.cash}</td></tr>
            <tr><td>Checks:</td><td>${labelData.checks}</td></tr>
            <tr><td>Gift Certificates:</td><td>${labelData.giftCertificates}</td></tr>
            <tr><td>Other:</td><td>${labelData.other}</td></tr>
            <tr className="total"><td>TOTAL:</td><td>${labelData.total}</td></tr>
          </table>
          
          {labelData.discrepancies && (
            <div className="discrepancies">
              <p><strong>Discrepancies Noted:</strong></p>
              <p>{labelData.discrepancies.explanation}</p>
            </div>
          )}
          
          <QRCode value={labelData.qrCode} size={25} />
        </div>
      </div>
      
      <div className="print-controls">
        <Button onClick={handlePrint} variant="primary">
          Print Label
        </Button>
        <Button onClick={handleDownload} variant="secondary">
          Download PDF
        </Button>
      </div>
    </div>
  );
};
```

### **Performance Requirements**
- **File Upload**: < 30 seconds for 10MB PDF files
- **PDF Parsing**: < 10 seconds for amount extraction
- **Label Generation**: < 5 seconds for PDF creation
- **Print Processing**: < 15 seconds from generation to printer
- **UI Responsiveness**: < 500ms for all user interactions
- **File Storage**: Secure cloud storage with 7-year retention

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all interfaces
- **Screen Reader Support**: Full navigation and form completion
- **Keyboard Navigation**: Complete functionality without mouse
- **High Contrast Mode**: For various lighting conditions
- **Touch-Friendly**: Large upload areas and buttons for mobile devices

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
Unit Tests: 90%+ coverage for PDF parsing and amount calculations
Integration Tests: File upload, PDF processing, label generation
E2E Tests: Complete workflow from upload to label printing
File Processing Tests: Various PDF formats and edge cases
Label Generation Tests: Template rendering and print formatting
Accessibility Tests: Automated WCAG validation
```

### **Test Scenarios**
- PDF upload with various ModMed batch report formats
- Amount extraction accuracy from different PDF layouts
- Verification workflow with and without discrepancies
- Label generation with different template configurations
- Print queue management with multiple concurrent users
- File upload interruption and recovery
- Large file handling and timeout scenarios
- Invalid PDF format rejection and error handling
- Discrepancy explanation validation and requirements

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
File Storage: Supabase Storage with CDN
Monitoring: Supabase analytics + Cloudflare analytics
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# App-specific variables
BATCH_PDF_STORAGE_BUCKET=batch-reports
LABEL_PDF_STORAGE_BUCKET=envelope-labels
MAX_FILE_SIZE_MB=10
SUPPORTED_FILE_TYPES=pdf
PDF_PARSING_TIMEOUT_SECONDS=30
LABEL_GENERATION_TIMEOUT_SECONDS=15
```

### **Monitoring & Alerts**
- **Health Checks**: PDF parsing service, label generation, file upload/download
- **Error Tracking**: Failed uploads, parsing errors, label generation failures
- **Performance Monitoring**: Upload times, parsing speed, label generation time
- **File Storage Monitoring**: Storage usage, file access patterns, retention compliance
- **Usage Analytics**: Daily upload volumes, discrepancy rates, staff efficiency metrics

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **User Engagement**: Daily active users, upload frequency, feature usage
- **Performance Metrics**: Processing times, success rates, error rates
- **File Management**: Storage usage, file types, processing success rates

### **App-Specific Analytics**
- **Processing Efficiency**: Upload to label generation time, staff productivity
- **Accuracy Metrics**: PDF parsing accuracy, amount extraction success rates
- **Discrepancy Analysis**: Frequency, types, variance amounts, resolution patterns
- **Label Usage**: Generation rates, print success, template preferences
- **Staff Performance**: Processing speed, discrepancy rates, accuracy trends
- **Audit Compliance**: Complete audit trails, retention compliance, access logs
- **Cost Analysis**: Storage costs, processing resources, time savings vs manual process

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **File Upload Security**: Virus scanning, format validation, size limits
- **Data Encryption**: Uploaded PDFs and generated labels encrypted at rest
- **Access Controls**: Role-based access to batch reports and labels
- **Audit Logging**: All file operations, verifications, and label generations logged
- **Secure File Storage**: Time-limited access URLs, automatic expiration

### **Financial Compliance**
- **Audit Trail**: Complete processing history for financial audits
- **Data Retention**: Batch reports and labels retained per financial regulations
- **Discrepancy Documentation**: All variances documented with explanations
- **Access Accountability**: Staff actions tracked with timestamps and user identification
- **Label Security**: Tamper-resistant batch identifiers and QR codes

### **App-Specific Security**
- **PDF Processing Security**: Sandboxed PDF parsing, malware prevention
- **File Type Validation**: Strict PDF format enforcement
- **Upload Limits**: File size and frequency limits to prevent abuse
- **Print Security**: Secure print queues with user authentication
- **Label Watermarking**: Unique identifiers for audit tracking

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] PDF upload and parsing functional for all ModMed batch report formats
- [ ] Amount extraction accuracy >95% for standard batch reports
- [ ] Verification workflow tested with discrepancy handling
- [ ] Label generation and printing tested with physical printers
- [ ] File storage and retention policies implemented
- [ ] Staff training materials and quick reference guides available
- [ ] Security audit completed and compliance verified

### **Success Metrics (3 months)**
- 90% reduction in manual label creation time achieved
- 100% professional printed labels for all deposit envelopes
- 95% reduction in missing envelope identification issues
- 100% discrepancy documentation maintained for audit compliance
- 98% staff satisfaction with upload and verification process
- <5% PDF parsing error rate for standard batch reports
- 100% file retention compliance for audit requirements

### **Success Metrics (6 months)**
- 95% staff adoption across all locations
- Zero audit compliance violations related to batch documentation
- 50% reduction in accounting reconciliation time
- 90% accuracy rate for amount extraction from PDFs
- 85% of batch verifications completed without discrepancies
- Real-time analytics providing actionable insights on batch processing trends

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **PDF Parsing Updates**: Monthly review and optimization of extraction algorithms
- **Template Updates**: Quarterly label template review and enhancement
- **File Storage Management**: Automated cleanup and archival per retention policies
- **Performance Optimization**: Regular monitoring and improvement of processing speeds
- **Security Reviews**: Annual penetration testing and vulnerability assessment

### **Future Enhancements**
- **OCR Integration**: Enhanced text extraction for challenging PDF formats
- **Mobile App**: Native mobile app for field batch processing
- **Automated Reconciliation**: Integration with accounting systems for automatic reconciliation
- **Advanced Analytics**: Predictive modeling for discrepancy prevention
- **Voice Integration**: Voice-activated amount verification for hands-free operation
- **Batch Scanning**: QR/barcode scanning for faster batch identification
- **Multi-format Support**: Support for additional file formats beyond PDF

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] PDF parsing and text extraction implementation guide
- [ ] Label generation system with template customization
- [ ] File upload and security implementation
- [ ] Amount calculation and verification algorithms
- [ ] Print integration and troubleshooting

### **User Documentation**
- [ ] Quick start guide for batch upload and verification
- [ ] Discrepancy explanation best practices
- [ ] Label printer setup and troubleshooting
- [ ] File management and retention policies
- [ ] Error handling and resolution procedures
- [ ] Video tutorials for complete workflow

---

*This batch verification and label generation system eliminates manual envelope labeling while ensuring complete audit compliance and professional presentation. Staff can quickly upload their batch reports, verify amounts against physical contents, document any discrepancies, and generate professional labels that provide clear identification and audit trails for all deposit envelopes.*
