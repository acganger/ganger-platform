-- Migration: 2025_01_11_create_batch_closeout_tables.sql
-- Batch Closeout & Label Generator Database Schema

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

-- Insert default label template
INSERT INTO envelope_label_templates (
  template_name, 
  template_description, 
  template_data, 
  is_default, 
  created_by
) VALUES (
  'Standard Batch Label',
  'Default template for batch closeout envelope labels',
  '{
    "sections": [
      {
        "type": "header",
        "content": "GANGER DERMATOLOGY BATCH CLOSEOUT",
        "fontSize": 14,
        "bold": true,
        "align": "center"
      },
      {
        "type": "spacer",
        "height": 3
      },
      {
        "type": "info",
        "content": "Date: {{batch_date}} | Location: {{location}} | Staff: {{staff_name}}",
        "fontSize": 10
      },
      {
        "type": "spacer",
        "height": 2
      },
      {
        "type": "amounts_table",
        "title": "VERIFIED AMOUNTS",
        "fontSize": 11
      },
      {
        "type": "spacer",
        "height": 2
      },
      {
        "type": "total",
        "content": "TOTAL: ${{verified_total}}",
        "fontSize": 14,
        "bold": true
      },
      {
        "type": "discrepancies",
        "fontSize": 9
      },
      {
        "type": "qr",
        "size": 25,
        "position": "bottom-right"
      }
    ]
  }',
  true,
  'system'
);