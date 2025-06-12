-- Patient Communication Infrastructure
-- Universal communication system for all Ganger Platform applications
-- Created: January 6, 2025

-- =============================================
-- Patient Communication Consent Tracking
-- =============================================

CREATE TABLE patient_communication_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL, -- References patients table
    consent_type TEXT NOT NULL CHECK (consent_type IN ('sms', 'email', 'both')),
    consented BOOLEAN NOT NULL,
    consent_date TIMESTAMPTZ NOT NULL,
    consent_method TEXT NOT NULL CHECK (consent_method IN ('verbal', 'written', 'digital', 'kiosk')),
    ip_address INET,
    user_agent TEXT,
    staff_id UUID, -- References staff who obtained consent
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for consent tracking
CREATE INDEX idx_patient_consent_patient_id ON patient_communication_consent(patient_id);
CREATE INDEX idx_patient_consent_type ON patient_communication_consent(consent_type);
CREATE INDEX idx_patient_consent_date ON patient_communication_consent(consent_date);

-- =============================================
-- Patient Contact Information
-- =============================================

CREATE TABLE patient_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE, -- One contact record per patient
    phone_number TEXT,
    email TEXT,
    preferred_method TEXT NOT NULL DEFAULT 'sms' CHECK (preferred_method IN ('sms', 'email', 'both')),
    sms_consent BOOLEAN DEFAULT FALSE,
    email_consent BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contact lookup
CREATE INDEX idx_patient_contacts_patient_id ON patient_contacts(patient_id);
CREATE INDEX idx_patient_contacts_phone ON patient_contacts(phone_number);
CREATE INDEX idx_patient_contacts_email ON patient_contacts(email);

-- =============================================
-- Communication Templates
-- =============================================

CREATE TABLE communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Template identifier (e.g., 'handout_delivery')
    type TEXT NOT NULL CHECK (type IN (
        'appointment_reminder', 
        'handout_delivery', 
        'medication_update', 
        'training_notification', 
        'staff_alert', 
        'checkin_confirmation',
        'emergency', 
        'general'
    )),
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
    subject TEXT, -- For email templates
    content TEXT NOT NULL, -- Template with {{variable}} placeholders
    variables TEXT[] DEFAULT '{}', -- Available template variables
    hipaa_compliant BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for template lookup
CREATE INDEX idx_templates_name ON communication_templates(name);
CREATE INDEX idx_templates_type ON communication_templates(type);
CREATE INDEX idx_templates_channel ON communication_templates(channel);

-- =============================================
-- Communication Logs (HIPAA Audit Trail)
-- =============================================

CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID, -- Optional: for patient communications
    staff_id UUID, -- Optional: for staff communications
    template_id TEXT, -- Template name used
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
    recipient TEXT NOT NULL, -- Phone number or email
    content TEXT NOT NULL, -- Encrypted message content
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    external_id TEXT, -- Twilio message SID, email provider ID
    error_message TEXT,
    cost_cents INTEGER, -- Cost in cents for analytics
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for communication logs
CREATE INDEX idx_comm_logs_patient_id ON communication_logs(patient_id);
CREATE INDEX idx_comm_logs_staff_id ON communication_logs(staff_id);
CREATE INDEX idx_comm_logs_channel ON communication_logs(channel);
CREATE INDEX idx_comm_logs_status ON communication_logs(status);
CREATE INDEX idx_comm_logs_created_at ON communication_logs(created_at);
CREATE INDEX idx_comm_logs_external_id ON communication_logs(external_id);

-- =============================================
-- Insert Default Communication Templates
-- =============================================

-- Handout Delivery Template
INSERT INTO communication_templates (name, type, channel, content, variables, hipaa_compliant) VALUES 
('handout_delivery', 'handout_delivery', 'sms', 
'Your educational materials from {{provider_name}} at {{clinic_name}} are ready: {{handout_url}}. These materials contain important information about {{handout_title}}.', 
ARRAY['provider_name', 'clinic_name', 'handout_url', 'handout_title'], 
TRUE);

-- Appointment Reminder Template
INSERT INTO communication_templates (name, type, channel, content, variables, hipaa_compliant) VALUES 
('appointment_reminder', 'appointment_reminder', 'sms',
'Reminder: Your appointment with Dr. {{provider_name}} is {{appointment_date}} at {{appointment_time}}. {{clinic_name}} - {{clinic_phone}}. Reply CONFIRM or call if you need to reschedule.',
ARRAY['provider_name', 'appointment_date', 'appointment_time', 'clinic_name', 'clinic_phone'],
TRUE);

-- Medication Update Template
INSERT INTO communication_templates (name, type, channel, content, variables, hipaa_compliant) VALUES 
('medication_update', 'medication_update', 'sms',
'Update on your {{medication_name}} authorization: {{authorization_status}}. {{next_steps}} Contact Dr. {{provider_name}} at {{clinic_phone}} with questions.',
ARRAY['medication_name', 'authorization_status', 'next_steps', 'provider_name', 'clinic_phone'],
TRUE);

-- Training Notification Template
INSERT INTO communication_templates (name, type, channel, content, variables, hipaa_compliant) VALUES 
('training_notification', 'training_notification', 'sms',
'Training Reminder: "{{training_title}}" is due {{due_date}}. Complete at: {{completion_url}}. Contact {{manager_name}} with questions.',
ARRAY['training_title', 'due_date', 'completion_url', 'manager_name'],
FALSE); -- Staff communication, not patient data

-- Staff Alert Template
INSERT INTO communication_templates (name, type, channel, content, variables, hipaa_compliant) VALUES 
('staff_alert', 'staff_alert', 'sms',
'{{alert_type}} Alert: {{message}}. Priority: {{priority}}. Action Required: {{action_required}}.',
ARRAY['alert_type', 'message', 'priority', 'action_required'],
FALSE); -- Staff communication, not patient data

-- Check-in Confirmation Template
INSERT INTO communication_templates (name, type, channel, content, variables, hipaa_compliant) VALUES 
('checkin_confirmation', 'checkin_confirmation', 'sms',
'Thank you for checking in at {{clinic_name}}. Your {{appointment_time}} appointment with Dr. {{provider_name}} has an estimated wait time of {{estimated_wait}} minutes.',
ARRAY['clinic_name', 'appointment_time', 'provider_name', 'estimated_wait'],
TRUE);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all communication tables
ALTER TABLE patient_communication_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

-- Patient Communication Consent Policies
CREATE POLICY "Staff can manage patient consent" ON patient_communication_consent
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'clinical_staff', 'manager', 'superadmin')
    );

CREATE POLICY "Patients can view their own consent" ON patient_communication_consent
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'patient' AND 
        patient_id = (auth.jwt() ->> 'user_id')::uuid
    );

-- Patient Contacts Policies
CREATE POLICY "Staff can manage patient contacts" ON patient_contacts
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('staff', 'clinical_staff', 'manager', 'superadmin')
    );

CREATE POLICY "Patients can view their own contact info" ON patient_contacts
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'patient' AND 
        patient_id = (auth.jwt() ->> 'user_id')::uuid
    );

-- Communication Templates Policies
CREATE POLICY "All authenticated users can read templates" ON communication_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only managers can modify templates" ON communication_templates
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    );

-- Communication Logs Policies (HIPAA Audit Trail)
CREATE POLICY "Staff can view communication logs" ON communication_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('staff', 'clinical_staff', 'manager', 'superadmin')
    );

CREATE POLICY "System can insert communication logs" ON communication_logs
    FOR INSERT WITH CHECK (true); -- Service role can log all communications

CREATE POLICY "Only superadmin can delete logs" ON communication_logs
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'superadmin'
    );

-- =============================================
-- Functions for Communication Analytics
-- =============================================

-- Function to get daily communication metrics
CREATE OR REPLACE FUNCTION get_daily_communication_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'date', target_date,
    'total_messages_sent', (
      SELECT COUNT(*) FROM communication_logs 
      WHERE DATE(created_at) = target_date 
      AND status IN ('sent', 'delivered')
    ),
    'sms_messages', (
      SELECT COUNT(*) FROM communication_logs 
      WHERE DATE(created_at) = target_date 
      AND channel = 'sms' 
      AND status IN ('sent', 'delivered')
    ),
    'email_messages', (
      SELECT COUNT(*) FROM communication_logs 
      WHERE DATE(created_at) = target_date 
      AND channel = 'email' 
      AND status IN ('sent', 'delivered')
    ),
    'failed_messages', (
      SELECT COUNT(*) FROM communication_logs 
      WHERE DATE(created_at) = target_date 
      AND status = 'failed'
    ),
    'total_cost_cents', (
      SELECT COALESCE(SUM(cost_cents), 0) FROM communication_logs 
      WHERE DATE(created_at) = target_date 
      AND status IN ('sent', 'delivered')
    ),
    'messages_by_type', (
      SELECT json_object_agg(template_id, message_count)
      FROM (
        SELECT template_id, COUNT(*) as message_count
        FROM communication_logs 
        WHERE DATE(created_at) = target_date 
        AND status IN ('sent', 'delivered')
        GROUP BY template_id
      ) t
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get patient communication summary
CREATE OR REPLACE FUNCTION get_patient_communication_summary(patient_uuid UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'patient_id', patient_uuid,
    'has_sms_consent', (
      SELECT consented FROM patient_communication_consent 
      WHERE patient_id = patient_uuid 
      AND consent_type IN ('sms', 'both')
      AND consented = TRUE
      ORDER BY created_at DESC 
      LIMIT 1
    ),
    'has_email_consent', (
      SELECT consented FROM patient_communication_consent 
      WHERE patient_id = patient_uuid 
      AND consent_type IN ('email', 'both')
      AND consented = TRUE
      ORDER BY created_at DESC 
      LIMIT 1
    ),
    'total_messages_received', (
      SELECT COUNT(*) FROM communication_logs 
      WHERE patient_id = patient_uuid 
      AND status IN ('sent', 'delivered')
    ),
    'last_message_date', (
      SELECT MAX(created_at) FROM communication_logs 
      WHERE patient_id = patient_uuid 
      AND status IN ('sent', 'delivered')
    ),
    'preferred_contact_method', (
      SELECT preferred_method FROM patient_contacts 
      WHERE patient_id = patient_uuid
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Indexes for Performance
-- =============================================

-- Composite indexes for common queries
CREATE INDEX idx_consent_patient_type_date ON patient_communication_consent(patient_id, consent_type, created_at DESC);
CREATE INDEX idx_logs_patient_status_date ON communication_logs(patient_id, status, created_at DESC);
CREATE INDEX idx_logs_template_channel_date ON communication_logs(template_id, channel, created_at DESC);

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE patient_communication_consent IS 'HIPAA-compliant tracking of patient consent for all communication types';
COMMENT ON TABLE patient_contacts IS 'Patient contact information and communication preferences';
COMMENT ON TABLE communication_templates IS 'Reusable message templates for all applications';
COMMENT ON TABLE communication_logs IS 'Complete audit trail of all communications sent (HIPAA requirement)';

COMMENT ON FUNCTION get_daily_communication_metrics IS 'Analytics function for daily communication reporting';
COMMENT ON FUNCTION get_patient_communication_summary IS 'Patient-specific communication summary for support and audit';

-- Migration complete
SELECT 'Patient Communication Infrastructure created successfully' as status;