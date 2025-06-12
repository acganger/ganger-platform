# Batch Closeout & Label Generator - Backend Development PRD
*Server-side API and Database Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Batch Closeout & Label Generator (Backend)
- **Terminal Assignment**: TERMINAL 2 - BACKEND
- **Priority**: High
- **Development Timeline**: 4-5 weeks
- **Dependencies**: @ganger/db, @ganger/auth/server, @ganger/integrations/server, @ganger/utils/server
- **Integration Requirements**: PDF processing, Label generation, File storage

---

## 🎯 Backend Scope

### **Terminal 2 Responsibilities**
- Database schema and migrations
- API route implementations
- PDF processing and text extraction
- Label generation and PDF creation
- File upload and storage management
- Server-side authentication and authorization
- Background processing and analytics
- Data validation and business logic

### **Excluded from Backend Terminal**
- React components and UI (Terminal 1)
- Client-side state management (Terminal 1)
- Frontend form handling (Terminal 1)
- User interface for label preview (Terminal 1)

---

## 🏗️ Backend Technology Stack

### **Required Server-Side Packages**
```typescript
// Server-only imports
import { withAuth, getUserFromToken, verifyPermissions } from '@ganger/auth/server';
import { db, DatabaseService } from '@ganger/db';
import { 
  PDFProcessor, LabelGenerator, FileStorage,
  ServerCommunicationService, ServerCacheService 
} from '@ganger/integrations/server';
import { auditLog, validateBatchData } from '@ganger/utils/server';
import type { 
  User, BatchReport, BatchDiscrepancy, EnvelopeLabel,
  LabelTemplate, PDFExtractionResult
} from '@ganger/types';
```

### **Backend-Specific Technology**
- **PDF Processing**: PDF.js and pdf-parse for text extraction
- **Text Analysis**: Pattern recognition for ModMed batch data
- **Label Generation**: jsPDF for professional envelope labels
- **File Storage**: Supabase Storage with secure access
- **Background Jobs**: Automated processing and cleanup
- **Caching Layer**: Redis for PDF processing optimization

---

## 🗄️ Database Implementation

### **Migration Files**
```sql
-- Migration: 2025_01_11_create_batch_closeout_tables.sql

-- Batch report uploads and processing
CREATE TABLE batch_reports (
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
  processing_status TEXT DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'parsed', 'verified', 'label_generated')),
  pdf_parsing_status TEXT DEFAULT 'pending' CHECK (pdf_parsing_status IN ('pending', 'processing', 'success', 'failed')),
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
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'discrepancy_noted')),
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
CREATE TABLE batch_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_report_id UUID NOT NULL REFERENCES batch_reports(id) ON DELETE CASCADE,
  
  -- Discrepancy details
  payment_type TEXT NOT NULL, -- cash, checks, credit_cards, etc.
  extracted_amount DECIMAL(10,2) NOT NULL,
  verified_amount DECIMAL(10,2) NOT NULL,
  variance_amount DECIMAL(10,2) GENERATED ALWAYS AS (verified_amount - extracted_amount) STORED,
  
  -- Explanations and resolution
  staff_explanation TEXT,
  manager_notes TEXT,
  resolution_status TEXT DEFAULT 'noted' CHECK (resolution_status IN ('noted', 'investigated', 'resolved', 'accepted')),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Label templates for envelope labels
CREATE TABLE envelope_label_templates (
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
CREATE TABLE generated_envelope_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_report_id UUID NOT NULL REFERENCES batch_reports(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES envelope_label_templates(id),
  
  -- Label content
  label_data JSONB NOT NULL, -- Complete label content and data
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- QR code for tracking
  qr_code_data TEXT, -- Batch tracking information
  
  -- Print management
  print_status TEXT DEFAULT 'ready' CHECK (print_status IN ('ready', 'printing', 'printed', 'failed')),
  print_attempts INTEGER DEFAULT 0,
  last_print_attempt TIMESTAMPTZ,
  print_error_message TEXT,
  
  -- Audit
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  printed_at TIMESTAMPTZ
);

-- PDF parsing patterns and rules
CREATE TABLE pdf_parsing_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern identification
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('amount_extraction', 'date_extraction', 'location_mapping', 'staff_identification')),
  
  -- Pattern definition
  regex_pattern TEXT NOT NULL,
  extraction_rules JSONB NOT NULL,
  validation_rules JSONB,
  
  -- Pattern effectiveness
  success_rate DECIMAL(5,2),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Pattern status
  is_active BOOLEAN DEFAULT TRUE,
  priority_order INTEGER DEFAULT 100,
  
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily batch summary for analytics
CREATE TABLE daily_batch_summary (
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
CREATE TABLE batch_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  last_updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_batch_reports_staff ON batch_reports(staff_email);
CREATE INDEX idx_batch_reports_date ON batch_reports(batch_date);
CREATE INDEX idx_batch_reports_location ON batch_reports(location);
CREATE INDEX idx_batch_reports_status ON batch_reports(processing_status);
CREATE INDEX idx_batch_reports_verification ON batch_reports(verification_status);
CREATE INDEX idx_batch_discrepancies_batch ON batch_discrepancies(batch_report_id);
CREATE INDEX idx_generated_labels_batch ON generated_envelope_labels(batch_report_id);
CREATE INDEX idx_generated_labels_status ON generated_envelope_labels(print_status);
CREATE INDEX idx_daily_summary_date_location ON daily_batch_summary(summary_date, location);
CREATE INDEX idx_pdf_patterns_type ON pdf_parsing_patterns(pattern_type, is_active);

-- Row Level Security
ALTER TABLE batch_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE envelope_label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_envelope_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_parsing_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_batch_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_system_config ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Staff can access own batch reports" ON batch_reports
  FOR ALL USING (
    staff_email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Staff can access related discrepancies" ON batch_discrepancies
  FOR ALL USING (
    batch_report_id IN (
      SELECT id FROM batch_reports 
      WHERE staff_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Staff can read label templates" ON envelope_label_templates
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
  );

CREATE POLICY "Managers can manage templates" ON envelope_label_templates
  FOR INSERT, UPDATE, DELETE USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Staff can access own labels" ON generated_envelope_labels
  FOR ALL USING (
    batch_report_id IN (
      SELECT id FROM batch_reports 
      WHERE staff_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Managers can view summaries" ON daily_batch_summary
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Managers can manage config" ON batch_system_config
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

-- Insert default parsing patterns
INSERT INTO pdf_parsing_patterns (pattern_name, pattern_type, regex_pattern, extraction_rules, created_by) VALUES
('ModMed Cash Amount', 'amount_extraction', '(?:cash|currency)[:\s]*\$?(\d+\.?\d{0,2})', '{"field": "cash", "multiplier": 1, "validation": "positive_number"}', 'system'),
('ModMed Check Amount', 'amount_extraction', '(?:check|cheque)[:\s]*\$?(\d+\.?\d{0,2})', '{"field": "checks", "multiplier": 1, "validation": "positive_number"}', 'system'),
('ModMed Credit Card', 'amount_extraction', '(?:credit|card|visa|mastercard)[:\s]*\$?(\d+\.?\d{0,2})', '{"field": "credit_cards", "multiplier": 1, "validation": "positive_number"}', 'system'),
('Batch Date Pattern', 'date_extraction', '(\d{1,2}\/\d{1,2}\/\d{4})', '{"format": "MM/DD/YYYY", "field": "batch_date"}', 'system'),
('Location Code AA', 'location_mapping', '(?:ann arbor|AA|A2)', '{"location_code": "A2", "location_name": "Ann Arbor"}', 'system'),
('Location Code PY', 'location_mapping', '(?:plymouth|PY)', '{"location_code": "PY", "location_name": "Plymouth"}', 'system'),
('Location Code WX', 'location_mapping', '(?:wixom|WX)', '{"location_code": "WX", "location_name": "Wixom"}', 'system');

-- Insert default system configurations
INSERT INTO batch_system_config (config_key, config_value, description) VALUES
('auto_parse_uploads', 'true', 'Automatically parse PDF files upon upload'),
('require_verification', 'true', 'Require staff verification of all amounts'),
('enable_discrepancy_alerts', 'true', 'Send alerts for discrepancies above threshold'),
('discrepancy_threshold_dollars', '5.00', 'Dollar threshold for discrepancy alerts'),
('discrepancy_threshold_percentage', '2.0', 'Percentage threshold for discrepancy alerts'),
('enable_qr_codes', 'true', 'Include QR codes on labels for tracking'),
('max_file_size_mb', '10', 'Maximum upload file size in megabytes'),
('supported_file_types', '["pdf"]', 'Supported file types for upload'),
('pdf_parsing_timeout_seconds', '30', 'Maximum time allowed for PDF parsing'),
('label_generation_timeout_seconds', '15', 'Maximum time for label generation');
```

---

## 🔌 API Route Implementation

### **File Upload and Processing**
```typescript
// pages/api/batch-reports/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@ganger/auth/server';
import { db } from '@ganger/db';
import { FileStorage, PDFProcessor } from '@ganger/integrations/server';

export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Store file
    const fileStorage = new FileStorage();
    const filePath = await fileStorage.uploadFile(file, {
      bucket: 'batch-reports',
      folder: `${user.id}/${new Date().getFullYear()}/${new Date().getMonth() + 1}`
    });

    // Parse filename for hints (unreliable but useful for reference)
    const filenameHints = parseFilename(file.name);

    // Create batch report record
    const batchReport = await db.batch_reports.create({
      data: {
        staff_email: user.email,
        staff_name: user.name || user.email,
        location: filenameHints.location || 'unknown',
        original_filename: file.name,
        file_path: filePath,
        file_size_bytes: file.size,
        batch_info: filenameHints.batchInfo,
        filename_location_hint: filenameHints.location,
        filename_user_hint: filenameHints.user,
        processing_status: 'uploaded'
      }
    });

    // Trigger PDF parsing asynchronously
    processPDFAsync(batchReport.id, filePath);

    // Log the upload
    await auditLog({
      action: 'batch_report_uploaded',
      userId: user.id,
      resourceType: 'batch_report',
      resourceId: batchReport.id,
      metadata: {
        filename: file.name,
        file_size: file.size,
        location_hint: filenameHints.location
      }
    });

    return NextResponse.json({
      success: true,
      data: batchReport
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

function parseFilename(filename: string) {
  // Extract hints from filename (user-generated, inconsistent)
  const cleanName = filename.toLowerCase().replace(/[^\w\s.-]/g, '');
  
  // Try to extract location
  let location = null;
  if (cleanName.includes('ann') || cleanName.includes('aa') || cleanName.includes('a2')) {
    location = 'A2';
  } else if (cleanName.includes('plymouth') || cleanName.includes('py')) {
    location = 'PY';
  } else if (cleanName.includes('wixom') || cleanName.includes('wx')) {
    location = 'WX';
  }

  // Try to extract user initials or name
  const userPattern = /([a-z]{2,3})[.\-_]?(?:am|pm|batch|report)/i;
  const userMatch = cleanName.match(userPattern);
  const user = userMatch ? userMatch[1] : null;

  return {
    location,
    user,
    batchInfo: cleanName
  };
}

async function processPDFAsync(batchId: string, filePath: string) {
  try {
    // Update status to processing
    await db.batch_reports.update({
      where: { id: batchId },
      data: { 
        processing_status: 'processing',
        pdf_parsing_status: 'processing'
      }
    });

    const pdfProcessor = new PDFProcessor();
    const extractionResult = await pdfProcessor.extractBatchData(filePath);

    // Update with extracted data
    await db.batch_reports.update({
      where: { id: batchId },
      data: {
        pdf_batch_date: extractionResult.batchDate,
        pdf_location: extractionResult.location,
        pdf_staff_name: extractionResult.staffName,
        pdf_batch_id: extractionResult.batchId,
        extracted_cash: extractionResult.amounts.cash,
        extracted_checks: extractionResult.amounts.checks,
        extracted_credit_cards: extractionResult.amounts.creditCards,
        extracted_gift_certificates: extractionResult.amounts.giftCertificates,
        extracted_coupons: extractionResult.amounts.coupons,
        extracted_other: extractionResult.amounts.other,
        processing_status: 'parsed',
        pdf_parsing_status: 'success',
        parsed_at: new Date()
      }
    });
  } catch (error) {
    console.error('PDF processing error:', error);
    
    await db.batch_reports.update({
      where: { id: batchId },
      data: {
        pdf_parsing_status: 'failed',
        parsing_error_message: error.message
      }
    });
  }
}
```

### **PDF Processing Service**
```typescript
// packages/integrations/server/pdf-processor.ts
import * as pdfjsLib from 'pdfjs-dist';
import { PDFExtract } from 'pdf-extract';

export class PDFProcessor {
  private patterns: PDFParsingPattern[];

  constructor() {
    this.loadPatterns();
  }

  private async loadPatterns() {
    this.patterns = await db.pdf_parsing_patterns.findMany({
      where: { is_active: true },
      orderBy: { priority_order: 'asc' }
    });
  }

  async extractBatchData(filePath: string): Promise<PDFExtractionResult> {
    try {
      // Load PDF and extract text
      const textContent = await this.extractTextFromPDF(filePath);
      
      // Extract different data types using patterns
      const batchDate = this.extractBatchDate(textContent);
      const location = this.extractLocation(textContent);
      const staffName = this.extractStaffName(textContent);
      const batchId = this.extractBatchId(textContent);
      const amounts = this.extractAmounts(textContent);

      // Validate extraction quality
      const confidence = this.calculateExtractionConfidence({
        batchDate, location, staffName, amounts
      });

      return {
        batchDate,
        location,
        staffName,
        batchId,
        amounts,
        confidence,
        rawText: textContent,
        extractionMetadata: {
          totalPatterns: this.patterns.length,
          successfulExtractions: this.countSuccessfulExtractions({ batchDate, location, staffName, amounts }),
          processingTime: Date.now()
        }
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract data from PDF: ${error.message}`);
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    const fileBuffer = await this.loadFileBuffer(filePath);
    
    // Use PDF.js to extract text
    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }

  private extractBatchDate(text: string): Date | null {
    const datePatterns = this.patterns.filter(p => p.pattern_type === 'date_extraction');
    
    for (const pattern of datePatterns) {
      const regex = new RegExp(pattern.regex_pattern, 'gi');
      const matches = text.match(regex);
      
      if (matches && matches.length > 0) {
        // Try to parse the first match
        const dateStr = matches[0];
        const parsedDate = this.parseDate(dateStr, pattern.extraction_rules);
        
        if (parsedDate && this.isValidBatchDate(parsedDate)) {
          // Update pattern usage
          this.updatePatternUsage(pattern.id);
          return parsedDate;
        }
      }
    }
    
    return null;
  }

  private extractLocation(text: string): string | null {
    const locationPatterns = this.patterns.filter(p => p.pattern_type === 'location_mapping');
    
    for (const pattern of locationPatterns) {
      const regex = new RegExp(pattern.regex_pattern, 'gi');
      
      if (regex.test(text)) {
        this.updatePatternUsage(pattern.id);
        return pattern.extraction_rules.location_code;
      }
    }
    
    return null;
  }

  private extractStaffName(text: string): string | null {
    // Look for staff name patterns in the PDF
    const staffPatterns = [
      /prepared by[:\s]+([a-z\s]+)/gi,
      /staff[:\s]+([a-z\s]+)/gi,
      /user[:\s]+([a-z\s]+)/gi
    ];
    
    for (const pattern of staffPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 50) {
          return this.capitalizeWords(name);
        }
      }
    }
    
    return null;
  }

  private extractBatchId(text: string): string | null {
    // Look for ModMed batch ID patterns
    const batchIdPatterns = [
      /batch[:\s#]+([a-z0-9\-]+)/gi,
      /id[:\s#]+([a-z0-9\-]+)/gi,
      /reference[:\s#]+([a-z0-9\-]+)/gi
    ];
    
    for (const pattern of batchIdPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const id = match[1].trim();
        if (id.length >= 3 && id.length <= 20) {
          return id.toUpperCase();
        }
      }
    }
    
    return null;
  }

  private extractAmounts(text: string): BatchAmounts {
    const amounts = {
      cash: 0,
      checks: 0,
      creditCards: 0,
      giftCertificates: 0,
      coupons: 0,
      other: 0
    };

    const amountPatterns = this.patterns.filter(p => p.pattern_type === 'amount_extraction');
    
    for (const pattern of amountPatterns) {
      const regex = new RegExp(pattern.regex_pattern, 'gi');
      const matches = [...text.matchAll(regex)];
      
      if (matches.length > 0) {
        // Take the last (most recent) match for this amount type
        const lastMatch = matches[matches.length - 1];
        const amountStr = lastMatch[1];
        const amount = parseFloat(amountStr.replace(/[,$]/g, ''));
        
        if (!isNaN(amount) && amount >= 0) {
          const field = pattern.extraction_rules.field;
          if (amounts.hasOwnProperty(field)) {
            amounts[field] = amount;
            this.updatePatternUsage(pattern.id);
          }
        }
      }
    }
    
    return amounts;
  }

  private calculateExtractionConfidence(result: any): number {
    let score = 0;
    let maxScore = 0;
    
    // Date extraction (20 points)
    maxScore += 20;
    if (result.batchDate) score += 20;
    
    // Location extraction (20 points)
    maxScore += 20;
    if (result.location) score += 20;
    
    // Staff name extraction (15 points)
    maxScore += 15;
    if (result.staffName) score += 15;
    
    // Amount extraction (45 points total)
    const amountFields = Object.keys(result.amounts);
    const maxAmountScore = 45;
    const amountScore = (amountFields.filter(field => result.amounts[field] > 0).length / amountFields.length) * maxAmountScore;
    
    maxScore += maxAmountScore;
    score += amountScore;
    
    return Math.min(100, Math.round((score / maxScore) * 100));
  }

  private async updatePatternUsage(patternId: string) {
    await db.pdf_parsing_patterns.update({
      where: { id: patternId },
      data: {
        usage_count: { increment: 1 },
        last_used_at: new Date()
      }
    });
  }

  private isValidBatchDate(date: Date): boolean {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return date >= thirtyDaysAgo && date <= tomorrow;
  }

  private parseDate(dateStr: string, rules: any): Date | null {
    try {
      // Clean the date string
      const cleaned = dateStr.replace(/[^\d\/\-\.]/g, '');
      
      // Try different date formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
        /(\d{4})\/(\d{1,2})\/(\d{1,2})/,  // YYYY/MM/DD
        /(\d{4})-(\d{1,2})-(\d{1,2})/    // YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const match = cleaned.match(format);
        if (match) {
          let year, month, day;
          
          if (format.source.startsWith('(\\d{4})')) {
            // YYYY format
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1; // JavaScript months are 0-based
            day = parseInt(match[3]);
          } else {
            // MM/DD/YYYY format
            month = parseInt(match[1]) - 1;
            day = parseInt(match[2]);
            year = parseInt(match[3]);
          }
          
          const date = new Date(year, month, day);
          
          // Validate the date
          if (date.getFullYear() === year && 
              date.getMonth() === month && 
              date.getDate() === day) {
            return date;
          }
        }
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }
    
    return null;
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}

interface PDFExtractionResult {
  batchDate: Date | null;
  location: string | null;
  staffName: string | null;
  batchId: string | null;
  amounts: BatchAmounts;
  confidence: number;
  rawText: string;
  extractionMetadata: any;
}

interface BatchAmounts {
  cash: number;
  checks: number;
  creditCards: number;
  giftCertificates: number;
  coupons: number;
  other: number;
}
```

### **Label Generation Service**
```typescript
// packages/integrations/server/label-generator.ts
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export class LabelGenerator {
  async generateEnvelopeLabel(
    batchReport: BatchReport, 
    template: LabelTemplate
  ): Promise<GeneratedLabel> {
    try {
      // Create PDF document with label dimensions
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [template.label_width_mm, template.label_height_mm]
      });

      // Set up fonts and styling
      pdf.setFont(template.font_family || 'Arial');
      pdf.setFontSize(template.font_size || 10);

      // Generate QR code for tracking
      const qrCodeData = this.generateTrackingCode(batchReport);
      const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
        width: 100,
        margin: 1
      });

      // Render label content based on template
      await this.renderLabelContent(pdf, batchReport, template, qrCodeImage);

      // Generate PDF buffer
      const pdfBuffer = pdf.output('arraybuffer');
      
      // Store label file
      const fileStorage = new FileStorage();
      const labelPath = await fileStorage.uploadBuffer(
        Buffer.from(pdfBuffer),
        {
          bucket: 'envelope-labels',
          filename: `label-${batchReport.id}-${Date.now()}.pdf`,
          contentType: 'application/pdf'
        }
      );

      // Create label record
      const generatedLabel = await db.generated_envelope_labels.create({
        data: {
          batch_report_id: batchReport.id,
          template_id: template.id,
          label_data: this.compileLabelData(batchReport, template),
          file_path: labelPath,
          file_size_bytes: pdfBuffer.byteLength,
          qr_code_data: qrCodeData,
          generated_by: batchReport.staff_email
        }
      });

      // Update batch report
      await db.batch_reports.update({
        where: { id: batchReport.id },
        data: {
          label_generated: true,
          label_file_path: labelPath,
          label_generated_at: new Date(),
          processing_status: 'label_generated'
        }
      });

      return {
        id: generatedLabel.id,
        filePath: labelPath,
        qrCode: qrCodeData,
        labelData: generatedLabel.label_data
      };
    } catch (error) {
      console.error('Label generation error:', error);
      throw new Error(`Failed to generate label: ${error.message}`);
    }
  }

  private async renderLabelContent(
    pdf: jsPDF, 
    batch: BatchReport, 
    template: LabelTemplate, 
    qrCodeImage: string
  ): Promise<void> {
    const { template_data } = template;
    let currentY = template.margin_top_mm || 3;

    // Render each section defined in template
    for (const section of template_data.sections) {
      switch (section.type) {
        case 'header':
          currentY = this.renderHeader(pdf, section, currentY, template);
          break;
        
        case 'info':
          currentY = this.renderInfo(pdf, section, batch, currentY, template);
          break;
        
        case 'amounts_table':
          currentY = this.renderAmountsTable(pdf, section, batch, currentY, template);
          break;
        
        case 'total':
          currentY = this.renderTotal(pdf, section, batch, currentY, template);
          break;
        
        case 'discrepancies':
          if (batch.has_discrepancies) {
            currentY = this.renderDiscrepancies(pdf, section, batch, currentY, template);
          }
          break;
        
        case 'qr':
          this.renderQRCode(pdf, qrCodeImage, section, template);
          break;
        
        case 'spacer':
          currentY += section.height || 2;
          break;
      }
    }
  }

  private renderHeader(pdf: jsPDF, section: any, y: number, template: LabelTemplate): number {
    pdf.setFontSize(section.fontSize || 16);
    
    if (section.bold) {
      pdf.setFont(template.font_family, 'bold');
    }
    
    const text = this.interpolateText(section.content, {});
    
    if (section.align === 'center') {
      const textWidth = pdf.getTextWidth(text);
      const x = (template.label_width_mm - textWidth) / 2;
      pdf.text(text, x, y);
    } else {
      pdf.text(text, template.margin_left_mm || 3, y);
    }
    
    // Reset font
    pdf.setFont(template.font_family, 'normal');
    
    return y + (section.fontSize || 16) * 0.35 + 2; // Convert to mm spacing
  }

  private renderInfo(pdf: jsPDF, section: any, batch: BatchReport, y: number, template: LabelTemplate): number {
    pdf.setFontSize(section.fontSize || 10);
    
    const text = this.interpolateText(section.content, {
      batch_date: this.formatDate(batch.pdf_batch_date || batch.batch_date),
      location: this.getLocationName(batch.pdf_location || batch.location),
      staff_name: batch.pdf_staff_name || batch.staff_name
    });
    
    pdf.text(text, template.margin_left_mm || 3, y);
    
    return y + (section.fontSize || 10) * 0.35 + 1;
  }

  private renderAmountsTable(pdf: jsPDF, section: any, batch: BatchReport, y: number, template: LabelTemplate): number {
    pdf.setFontSize(section.fontSize || 11);
    
    // Title
    pdf.setFont(template.font_family, 'bold');
    pdf.text(section.title || 'VERIFIED AMOUNTS', template.margin_left_mm || 3, y);
    pdf.setFont(template.font_family, 'normal');
    
    y += (section.fontSize || 11) * 0.35 + 2;
    
    // Table rows
    const amounts = [
      { label: 'Cash:', value: batch.verified_cash || 0 },
      { label: 'Checks:', value: batch.verified_checks || 0 },
      { label: 'Gift Certificates:', value: batch.verified_gift_certificates || 0 },
      { label: 'Other:', value: batch.verified_other || 0 }
    ];
    
    pdf.setFontSize((section.fontSize || 11) - 1);
    
    for (const amount of amounts) {
      if (amount.value > 0) { // Only show non-zero amounts
        pdf.text(amount.label, template.margin_left_mm || 3, y);
        pdf.text(
          `$${amount.value.toFixed(2)}`, 
          (template.label_width_mm - (template.margin_right_mm || 3) - 20), 
          y
        );
        y += (section.fontSize || 11) * 0.35 + 1;
      }
    }
    
    return y;
  }

  private renderTotal(pdf: jsPDF, section: any, batch: BatchReport, y: number, template: LabelTemplate): number {
    pdf.setFontSize(section.fontSize || 14);
    
    if (section.bold) {
      pdf.setFont(template.font_family, 'bold');
    }
    
    const text = this.interpolateText(section.content, {
      verified_total: (batch.verified_total || 0).toFixed(2)
    });
    
    pdf.text(text, template.margin_left_mm || 3, y);
    
    // Reset font
    pdf.setFont(template.font_family, 'normal');
    
    return y + (section.fontSize || 14) * 0.35 + 2;
  }

  private renderDiscrepancies(pdf: jsPDF, section: any, batch: BatchReport, y: number, template: LabelTemplate): number {
    pdf.setFontSize(section.fontSize || 9);
    
    const discrepancyText = `DISCREPANCIES NOTED: ${batch.discrepancy_explanation || 'See attached documentation'}`;
    
    // Word wrap for long explanations
    const maxWidth = template.label_width_mm - (template.margin_left_mm || 3) - (template.margin_right_mm || 3);
    const lines = pdf.splitTextToSize(discrepancyText, maxWidth);
    
    for (const line of lines) {
      pdf.text(line, template.margin_left_mm || 3, y);
      y += (section.fontSize || 9) * 0.35 + 0.5;
    }
    
    return y + 1;
  }

  private renderQRCode(pdf: jsPDF, qrCodeImage: string, section: any, template: LabelTemplate): void {
    const size = section.size || 25;
    
    let x, y;
    
    if (section.position === 'bottom-right') {
      x = template.label_width_mm - size - (template.margin_right_mm || 3);
      y = template.label_height_mm - size - (template.margin_bottom_mm || 3);
    } else {
      x = template.margin_left_mm || 3;
      y = template.margin_top_mm || 3;
    }
    
    pdf.addImage(qrCodeImage, 'PNG', x, y, size, size);
  }

  private generateTrackingCode(batch: BatchReport): string {
    // Generate unique tracking code for QR
    return JSON.stringify({
      batch_id: batch.id,
      date: batch.pdf_batch_date || batch.batch_date,
      location: batch.pdf_location || batch.location,
      total: batch.verified_total || batch.extracted_total
    });
  }

  private compileLabelData(batch: BatchReport, template: LabelTemplate): any {
    return {
      batch_id: batch.id,
      batch_date: batch.pdf_batch_date || batch.batch_date,
      location: batch.pdf_location || batch.location,
      staff_name: batch.pdf_staff_name || batch.staff_name,
      verified_amounts: {
        cash: batch.verified_cash || 0,
        checks: batch.verified_checks || 0,
        gift_certificates: batch.verified_gift_certificates || 0,
        other: batch.verified_other || 0,
        total: batch.verified_total || 0
      },
      has_discrepancies: batch.has_discrepancies,
      discrepancy_explanation: batch.discrepancy_explanation,
      template_used: template.template_name,
      generated_at: new Date().toISOString()
    };
  }

  private interpolateText(text: string, variables: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  private formatDate(date: Date | string | null): string {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }

  private getLocationName(code: string): string {
    const locations = {
      'A2': 'Ann Arbor',
      'AA': 'Ann Arbor',
      'PY': 'Plymouth',
      'WX': 'Wixom'
    };
    return locations[code] || code || 'Unknown';
  }
}

interface GeneratedLabel {
  id: string;
  filePath: string;
  qrCode: string;
  labelData: any;
}
```

### **Amount Verification API**
```typescript
// pages/api/batch-reports/[id]/verify/route.ts
export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const batchId = request.url.split('/')[5]; // Extract ID from URL
    const { verified_amounts, discrepancy_explanation } = await request.json();

    // Get batch report
    const batch = await db.batch_reports.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch report not found' },
        { status: 404 }
      );
    }

    // Verify user can access this batch
    if (batch.staff_email !== user.email && !['manager', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Calculate discrepancies
    const extractedAmounts = {
      cash: batch.extracted_cash || 0,
      checks: batch.extracted_checks || 0,
      credit_cards: batch.extracted_credit_cards || 0,
      gift_certificates: batch.extracted_gift_certificates || 0,
      coupons: batch.extracted_coupons || 0,
      other: batch.extracted_other || 0
    };

    const discrepancies = [];
    let hasDiscrepancies = false;

    for (const [type, verifiedAmount] of Object.entries(verified_amounts)) {
      const extractedAmount = extractedAmounts[type] || 0;
      const variance = verifiedAmount - extractedAmount;
      
      if (Math.abs(variance) > 0.01) { // Account for floating point precision
        hasDiscrepancies = true;
        discrepancies.push({
          payment_type: type,
          extracted_amount: extractedAmount,
          verified_amount: verifiedAmount,
          variance_amount: variance
        });
      }
    }

    // Validate discrepancy explanation if needed
    if (hasDiscrepancies && !discrepancy_explanation?.trim()) {
      return NextResponse.json(
        { error: 'Discrepancy explanation is required when amounts differ' },
        { status: 400 }
      );
    }

    // Update batch report
    const updatedBatch = await db.batch_reports.update({
      where: { id: batchId },
      data: {
        verified_cash: verified_amounts.cash,
        verified_checks: verified_amounts.checks,
        verified_credit_cards: verified_amounts.credit_cards,
        verified_gift_certificates: verified_amounts.gift_certificates,
        verified_coupons: verified_amounts.coupons,
        verified_other: verified_amounts.other,
        verification_status: hasDiscrepancies ? 'discrepancy_noted' : 'verified',
        discrepancy_explanation: hasDiscrepancies ? discrepancy_explanation : null,
        verified_at: new Date(),
        verified_by: user.email,
        processing_status: 'verified'
      }
    });

    // Create discrepancy records
    if (discrepancies.length > 0) {
      await db.batch_discrepancies.createMany({
        data: discrepancies.map(d => ({
          ...d,
          batch_report_id: batchId,
          staff_explanation: discrepancy_explanation
        }))
      });

      // Send alert if discrepancy exceeds threshold
      await this.checkDiscrepancyThreshold(updatedBatch, discrepancies);
    }

    // Log verification
    await auditLog({
      action: 'batch_amounts_verified',
      userId: user.id,
      resourceType: 'batch_report',
      resourceId: batchId,
      metadata: {
        has_discrepancies: hasDiscrepancies,
        total_variance: discrepancies.reduce((sum, d) => sum + Math.abs(d.variance_amount), 0),
        discrepancy_count: discrepancies.length
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedBatch,
      discrepancies: discrepancies
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify amounts' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

async function checkDiscrepancyThreshold(batch: BatchReport, discrepancies: any[]) {
  const config = await db.batch_system_config.findMany({
    where: {
      config_key: {
        in: ['discrepancy_threshold_dollars', 'discrepancy_threshold_percentage', 'enable_discrepancy_alerts']
      }
    }
  });

  const alertsEnabled = config.find(c => c.config_key === 'enable_discrepancy_alerts')?.config_value || false;
  
  if (!alertsEnabled) return;

  const dollarThreshold = parseFloat(config.find(c => c.config_key === 'discrepancy_threshold_dollars')?.config_value || '5.00');
  const percentageThreshold = parseFloat(config.find(c => c.config_key === 'discrepancy_threshold_percentage')?.config_value || '2.0');

  const totalVariance = discrepancies.reduce((sum, d) => sum + Math.abs(d.variance_amount), 0);
  const percentageVariance = (totalVariance / (batch.extracted_total || 1)) * 100;

  if (totalVariance > dollarThreshold || percentageVariance > percentageThreshold) {
    // Send alert to managers
    await sendDiscrepancyAlert(batch, discrepancies, {
      totalVariance,
      percentageVariance,
      dollarThreshold,
      percentageThreshold
    });
  }
}
```

---

## 🧪 Backend Testing

### **API Endpoint Testing**
```typescript
import { testApiHandler } from 'next-test-api-route-handler';
import uploadHandler from '../../../pages/api/batch-reports/upload';

describe('/api/batch-reports/upload', () => {
  it('requires authentication', async () => {
    await testApiHandler({
      handler: uploadHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(401);
      }
    });
  });

  it('validates file type', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

    await testApiHandler({
      handler: uploadHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          },
          body: formData
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('PDF files');
      }
    });
  });

  it('processes valid PDF upload', async () => {
    const mockPDF = createMockPDFFile();
    const formData = new FormData();
    formData.append('file', mockPDF);

    await testApiHandler({
      handler: uploadHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          },
          body: formData
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.id).toBeDefined();
      }
    });
  });
});

describe('PDF Processing', () => {
  it('extracts amounts from ModMed PDF', async () => {
    const processor = new PDFProcessor();
    const testPDFPath = createTestPDFWithAmounts({
      cash: 150.00,
      checks: 75.50,
      creditCards: 200.00
    });

    const result = await processor.extractBatchData(testPDFPath);
    
    expect(result.amounts.cash).toBe(150.00);
    expect(result.amounts.checks).toBe(75.50);
    expect(result.amounts.creditCards).toBe(200.00);
    expect(result.confidence).toBeGreaterThan(70);
  });

  it('handles malformed PDF gracefully', async () => {
    const processor = new PDFProcessor();
    const corruptPDFPath = createCorruptPDFFile();

    await expect(processor.extractBatchData(corruptPDFPath))
      .rejects
      .toThrow('Failed to extract data from PDF');
  });
});

describe('Label Generation', () => {
  it('generates valid label PDF', async () => {
    const generator = new LabelGenerator();
    const mockBatch = createMockBatchReport();
    const mockTemplate = createMockLabelTemplate();

    const result = await generator.generateEnvelopeLabel(mockBatch, mockTemplate);
    
    expect(result.id).toBeDefined();
    expect(result.filePath).toBeDefined();
    expect(result.qrCode).toBeDefined();
    
    // Verify PDF file was created
    const fileExists = await checkFileExists(result.filePath);
    expect(fileExists).toBe(true);
  });

  it('includes QR code with tracking data', async () => {
    const generator = new LabelGenerator();
    const mockBatch = createMockBatchReport();
    const mockTemplate = createMockLabelTemplate();

    const result = await generator.generateEnvelopeLabel(mockBatch, mockTemplate);
    
    const qrData = JSON.parse(result.qrCode);
    expect(qrData.batch_id).toBe(mockBatch.id);
    expect(qrData.location).toBe(mockBatch.location);
    expect(qrData.total).toBeDefined();
  });
});
```

---

## 📈 Success Criteria

### **Backend Launch Criteria**
- [ ] Database migrations executed successfully
- [ ] File upload API handles 10MB PDFs correctly
- [ ] PDF processing extracts amounts with >90% accuracy
- [ ] Label generation creates valid PDF files
- [ ] Discrepancy tracking and alerts functional
- [ ] Row Level Security policies working correctly
- [ ] Background processing jobs operational

### **Backend Success Metrics**
- API response times <500ms for standard queries
- PDF processing completes in <30 seconds for 10MB files
- Amount extraction accuracy >95% for standard batch reports
- Label generation completes in <15 seconds
- File storage and retrieval success rate >99%
- Zero security vulnerabilities in production
- 100% test coverage for critical business logic

---

*This backend PRD provides comprehensive guidance for Terminal 2 to build all server-side functionality for the Batch Closeout application, with clear separation from Terminal 1's frontend responsibilities.*