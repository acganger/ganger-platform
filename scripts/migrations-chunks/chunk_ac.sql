<li>Fever over 101°F</li>
<li>Severe or increasing pain</li>
</ul>
</div>

<h3>Follow-up Care</h3>
<p>Your next appointment is scheduled for {{next_visit_date}}. Please call if you need to reschedule.</p>

<p><strong>{{location_name}}</strong><br>
Phone: {{location_phone}}<br>
Provider: {{provider_name}}</p>',
'["patient_full_name", "patient_mrn", "current_date", "next_visit_date", "location_name", "location_phone", "provider_name"]',
'Wound Care',
'{"wound care", "post-procedure", "healing"}',
true, true, NULL, NULL, 1, 'approved')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VENDOR CATALOG SEED DATA (Sample Henry Schein products)
-- =====================================================
INSERT INTO vendor_catalog (id, vendor, vendor_product_id, sku, name, description, category, unit_price, unit_of_measure, manufacturer, barcode, is_available) VALUES
('vc00000-0000-0000-0000-000000000001', 'Henry Schein', 'HS-100-1234', 'GLOVES-NITR-L', 'Nitrile Examination Gloves - Large', 'Powder-free nitrile examination gloves, blue, large size', 'PPE', 24.99, 'box', 'MedLine', '123456789012', true),
('vc00000-0000-0000-0000-000000000002', 'Henry Schein', 'HS-100-1235', 'GLOVES-NITR-M', 'Nitrile Examination Gloves - Medium', 'Powder-free nitrile examination gloves, blue, medium size', 'PPE', 24.99, 'box', 'MedLine', '123456789013', true),
('vc00000-0000-0000-0000-000000000003', 'Henry Schein', 'HS-200-5678', 'SYRINGE-3ML', '3ml Disposable Syringe', 'Sterile 3ml disposable syringe with Luer lock', 'Medical Supplies', 0.45, 'each', 'BD', '234567890123', true),
('vc00000-0000-0000-0000-000000000004', 'Henry Schein', 'HS-300-9012', 'GAUZE-4X4', '4x4 Gauze Pads', 'Sterile 4x4 inch gauze pads, 12-ply', 'Wound Care', 8.75, 'pack', 'Johnson & Johnson', '345678901234', true),
('vc00000-0000-0000-0000-000000000005', 'Henry Schein', 'HS-400-3456', 'ALCOHOL-PREP', 'Alcohol Prep Pads', 'Sterile 70% isopropyl alcohol prep pads', 'Antiseptics', 12.50, 'box', 'PDI', '456789012345', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE INVENTORY ITEMS (for Main Office location)
-- =====================================================
INSERT INTO inventory_items (id, name, description, sku, barcode, henry_schein_id, category, vendor, unit_price, quantity_on_hand, reorder_level, location_id, is_active) VALUES
('inv0000-0000-0000-0000-000000000001', 'Nitrile Examination Gloves - Large', 'Powder-free nitrile examination gloves, blue, large size', 'GLOVES-NITR-L', '123456789012', 'HS-100-1234', 'PPE', 'Henry Schein', 24.99, 15, 5, '550e8400-e29b-41d4-a716-446655440001', true),
('inv0000-0000-0000-0000-000000000002', 'Nitrile Examination Gloves - Medium', 'Powder-free nitrile examination gloves, blue, medium size', 'GLOVES-NITR-M', '123456789013', 'HS-100-1235', 'PPE', 'Henry Schein', 24.99, 8, 5, '550e8400-e29b-41d4-a716-446655440001', true),
('inv0000-0000-0000-0000-000000000003', '3ml Disposable Syringe', 'Sterile 3ml disposable syringe with Luer lock', 'SYRINGE-3ML', '234567890123', 'HS-200-5678', 'Medical Supplies', 'Henry Schein', 0.45, 250, 50, '550e8400-e29b-41d4-a716-446655440001', true),
('inv0000-0000-0000-0000-000000000004', '4x4 Gauze Pads', 'Sterile 4x4 inch gauze pads, 12-ply', 'GAUZE-4X4', '345678901234', 'HS-300-9012', 'Wound Care', 'Henry Schein', 8.75, 12, 8, '550e8400-e29b-41d4-a716-446655440001', true),
('inv0000-0000-0000-0000-000000000005', 'Alcohol Prep Pads', 'Sterile 70% isopropyl alcohol prep pads', 'ALCOHOL-PREP', '456789012345', 'HS-400-3456', 'Antiseptics', 'Henry Schein', 12.50, 3, 6, '550e8400-e29b-41d4-a716-446655440001', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE PATIENTS (for testing)
-- =====================================================
INSERT INTO patients (id, first_name, last_name, date_of_birth, email, phone, mrn) VALUES
('pat0000-0000-0000-0000-000000000001', 'John', 'Doe', '1980-05-15', 'john.doe@email.com', '(704) 555-1001', 'MRN-2025-001'),
('pat0000-0000-0000-0000-000000000002', 'Jane', 'Smith', '1975-08-22', 'jane.smith@email.com', '(704) 555-1002', 'MRN-2025-002'),
('pat0000-0000-0000-0000-000000000003', 'Robert', 'Johnson', '1965-12-03', 'bob.johnson@email.com', '(704) 555-1003', 'MRN-2025-003')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CREATE HEALTH CHECK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS health_check (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(20) DEFAULT 'healthy',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO health_check (status) VALUES ('healthy') ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS FOR AUTHENTICATED USERS
-- =====================================================
GRANT SELECT ON health_check TO authenticated;
GRANT SELECT ON health_check TO anon;


-- Migration: 006_create_communication_tables.sql
-- ==========================================

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


-- Migration: 007_create_payment_tables.sql
-- ==========================================

-- Migration 007: Universal Payment Processing Infrastructure
-- HIPAA-compliant payment system with audit trails and cross-PRD support
-- Created: January 6, 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patient payments table - Core payment tracking
CREATE TABLE patient_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    appointment_id UUID,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    payment_type TEXT NOT NULL CHECK (payment_type IN ('copay', 'deductible', 'subscription', 'deposit', 'fee')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method_id UUID,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    -- Indexes for performance
    CONSTRAINT fk_patient_payments_patient FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for patient payments
CREATE INDEX idx_patient_payments_patient_id ON patient_payments(patient_id);
CREATE INDEX idx_patient_payments_status ON patient_payments(status);
CREATE INDEX idx_patient_payments_type ON patient_payments(payment_type);
CREATE INDEX idx_patient_payments_created_at ON patient_payments(created_at);
CREATE INDEX idx_patient_payments_appointment ON patient_payments(appointment_id) WHERE appointment_id IS NOT NULL;

-- Payment methods table - Stored payment information
CREATE TABLE patient_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
    last_four TEXT NOT NULL,
    brand TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_payment_methods_patient FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for payment methods
CREATE INDEX idx_payment_methods_patient_id ON patient_payment_methods(patient_id);
CREATE INDEX idx_payment_methods_default ON patient_payment_methods(patient_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_payment_methods_active ON patient_payment_methods(is_active) WHERE is_active = TRUE;

-- Payment refunds table - Refund tracking
CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    stripe_refund_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL, -- Amount in cents
    reason TEXT CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'error')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES patient_payments(id) ON DELETE CASCADE
);

-- Create indexes for refunds
CREATE INDEX idx_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX idx_refunds_status ON payment_refunds(status);
CREATE INDEX idx_refunds_created_at ON payment_refunds(created_at);

-- Subscription plans table - For Training platform
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    interval_type TEXT NOT NULL CHECK (interval_type IN ('month', 'year')),
    stripe_price_id TEXT NOT NULL UNIQUE,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for subscription plans
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_subscription_plans_interval ON subscription_plans(interval_type);

-- Patient subscriptions table - Active subscriptions
CREATE TABLE patient_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_subscriptions_patient FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

-- Create indexes for subscriptions
CREATE INDEX idx_subscriptions_patient_id ON patient_subscriptions(patient_id);
CREATE INDEX idx_subscriptions_status ON patient_subscriptions(status);
CREATE INDEX idx_subscriptions_active ON patient_subscriptions(patient_id, status) WHERE status = 'active';
CREATE INDEX idx_subscriptions_period_end ON patient_subscriptions(current_period_end);

-- Payment audit log table - HIPAA compliance
CREATE TABLE payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID,
    subscription_id UUID,
    action TEXT NOT NULL CHECK (action IN ('created', 'processed', 'failed', 'refunded', 'disputed', 'webhook_received')),
    details JSONB NOT NULL DEFAULT '{}',
    encrypted_details TEXT, -- For sensitive data encryption
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_audit_payment FOREIGN KEY (payment_id) REFERENCES patient_payments(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_subscription FOREIGN KEY (subscription_id) REFERENCES patient_subscriptions(id) ON DELETE SET NULL
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_payment_id ON payment_audit_logs(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX idx_audit_logs_subscription_id ON payment_audit_logs(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action ON payment_audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON payment_audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON payment_audit_logs(user_id) WHERE user_id IS NOT NULL;

-- Billing analytics view - For Provider Dashboard
CREATE VIEW billing_analytics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_payments,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments,
    SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_payments,
    COUNT(CASE WHEN payment_type = 'copay' THEN 1 END) as copay_count,
    COUNT(CASE WHEN payment_type = 'deductible' THEN 1 END) as deductible_count,
    COUNT(CASE WHEN payment_type = 'subscription' THEN 1 END) as subscription_count,
    COUNT(CASE WHEN payment_type = 'deposit' THEN 1 END) as deposit_count,
    COUNT(CASE WHEN payment_type = 'fee' THEN 1 END) as fee_count
FROM patient_payments
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Row Level Security (RLS) policies
ALTER TABLE patient_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_payments
CREATE POLICY "Patients can view their own payments" ON patient_payments
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Staff can view all payments" ON patient_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'staff', 'provider')
        )
    );

CREATE POLICY "Staff can insert payments" ON patient_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'staff', 'provider')
        )
    );

CREATE POLICY "Staff can update payments" ON patient_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'staff', 'provider')
        )
    );

-- RLS Policies for patient_payment_methods
CREATE POLICY "Patients can manage their payment methods" ON patient_payment_methods
    FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Staff can view patient payment methods" ON patient_payment_methods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'staff', 'provider')
        )
    );

-- RLS Policies for payment_refunds
CREATE POLICY "Staff can manage refunds" ON payment_refunds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'staff', 'provider')
        )
    );

-- RLS Policies for subscription_plans
CREATE POLICY "Everyone can view active plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- RLS Policies for patient_subscriptions
CREATE POLICY "Patients can view their subscriptions" ON patient_subscriptions
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Staff can view all subscriptions" ON patient_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'staff', 'provider')
        )
    );

CREATE POLICY "Staff can manage subscriptions" ON patient_subscriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'staff', 'provider')
        )
    );

-- RLS Policies for payment_audit_logs
CREATE POLICY "Admin can view audit logs" ON payment_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON payment_audit_logs
    FOR INSERT WITH CHECK (true); -- Allow system to always log

-- Functions for payment processing

-- Function to calculate total revenue
CREATE OR REPLACE FUNCTION calculate_total_revenue(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)::NUMERIC / 100 -- Convert cents to dollars
        FROM patient_payments
        WHERE status = 'completed'
        AND (start_date IS NULL OR created_at >= start_date)
        AND (end_date IS NULL OR created_at <= end_date)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics(
    patient_id_param UUID DEFAULT NULL,
    days_back INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH stats AS (
        SELECT 
            COUNT(*) as total_payments,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as total_amount,
            COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as avg_amount
        FROM patient_payments
        WHERE (patient_id_param IS NULL OR patient_id = patient_id_param)
        AND created_at >= NOW() - INTERVAL '1 day' * days_back
    )
    SELECT json_build_object(
        'total_payments', total_payments,
        'successful_payments', successful_payments,
        'failed_payments', failed_payments,
        'total_amount_cents', total_amount,
        'total_amount_dollars', (total_amount::NUMERIC / 100),
        'average_amount_cents', avg_amount,
        'average_amount_dollars', (avg_amount::NUMERIC / 100),
        'success_rate', 
            CASE 
                WHEN total_payments > 0 THEN (successful_payments::NUMERIC / total_payments::NUMERIC)
                ELSE 0 
            END
    ) INTO result
    FROM stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old audit logs (7 year retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM payment_audit_logs 
    WHERE timestamp < NOW() - INTERVAL '7 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON patient_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON patient_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, amount, interval_type, stripe_price_id, features) VALUES
('Basic Training', 'Access to basic compliance training courses', 2999, 'month', 'price_basic_training', 
 '["Access to basic compliance courses", "Certificate generation", "Progress tracking"]'),
('Premium Training', 'Access to all training courses and advanced features', 4999, 'month', 'price_premium_training',
 '["Access to all training courses", "Advanced analytics", "Custom training paths", "Priority support"]'),
('Annual Basic', 'Basic training with annual billing discount', 29990, 'year', 'price_annual_basic',
 '["Access to basic compliance courses", "Certificate generation", "Progress tracking", "Annual billing discount"]'),
('Annual Premium', 'Premium training with annual billing discount', 49990, 'year', 'price_annual_premium',
 '["Access to all training courses", "Advanced analytics", "Custom training paths", "Priority support", "Annual billing discount"]');

-- Create a comment on the migration
COMMENT ON TABLE patient_payments IS 'Universal payment tracking for all medical billing across PRDs';
COMMENT ON TABLE patient_payment_methods IS 'Stored payment methods for quick checkout';
COMMENT ON TABLE subscription_plans IS 'Training platform subscription plans';
COMMENT ON TABLE patient_subscriptions IS 'Active patient subscriptions to training plans';
COMMENT ON TABLE payment_audit_logs IS 'HIPAA-compliant audit trail for all payment activities';


-- Migration: 008_create_clinical_staffing_tables.sql
-- ==========================================

-- =====================================================
-- Ganger Platform Database Schema - Clinical Staffing Optimization
-- Migration: 008_create_clinical_staffing_tables.sql
-- Created: January 7, 2025
-- Purpose: AI-powered clinical staffing optimization system
-- =====================================================

-- =====================================================
-- STAFF MEMBERS TABLE - Enhanced employee management
-- =====================================================
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Employment Details
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'per_diem')),
    employee_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (employee_status IN ('active', 'inactive', 'on_leave', 'terminated')),
    hire_date DATE NOT NULL,
    termination_date DATE,
    
    -- Staffing Configuration
    base_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    available_locations UUID[] DEFAULT '{}', -- Array of location IDs
    work_schedule_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (work_schedule_type IN ('standard', 'flexible', 'on_call', 'rotating')),
    
    -- Skills and Certifications
    certifications JSONB DEFAULT '[]', -- Array of certification objects
    skills JSONB DEFAULT '[]', -- Array of skill objects with proficiency levels
    specializations JSONB DEFAULT '[]', -- Medical specializations
    
    -- Scheduling Constraints
    min_hours_per_week INTEGER DEFAULT 0,
    max_hours_per_week INTEGER DEFAULT 40,
    preferred_shift_start TIME,
    preferred_shift_end TIME,
    overtime_eligible BOOLEAN DEFAULT false,
    
    -- External System Integration
    deputy_employee_id VARCHAR(50),
    zenefits_employee_id VARCHAR(50),
    modmed_provider_id VARCHAR(50),
    
    -- AI Optimization Data
    performance_score DECIMAL(3,2) DEFAULT 5.00, -- 1-10 scale
    patient_satisfaction_score DECIMAL(3,2) DEFAULT 5.00, -- 1-10 scale
    reliability_score DECIMAL(3,2) DEFAULT 5.00, -- 1-10 scale for attendance/punctuality
    productivity_metrics JSONB DEFAULT '{}',
    
    -- Metadata and Audit
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAFF AVAILABILITY TABLE - Real-time availability tracking
-- =====================================================
CREATE TABLE staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
    
    -- Availability Period
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability Type
    availability_type VARCHAR(20) NOT NULL CHECK (availability_type IN ('available', 'unavailable', 'preferred', 'conditional')),
    reason VARCHAR(100), -- vacation, sick, training, etc.
    
    -- Recurring Patterns
    recurring_pattern VARCHAR(20) CHECK (recurring_pattern IN ('none', 'daily', 'weekly', 'monthly')),
    recurring_end_date DATE,
    
    -- Deputy Integration
    deputy_availability_id VARCHAR(50),
    deputy_sync_status VARCHAR(20) DEFAULT 'pending' CHECK (deputy_sync_status IN ('pending', 'synced', 'error')),
    deputy_last_sync TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint to prevent overlapping availability for same staff member
    CONSTRAINT no_overlapping_availability EXCLUDE USING gist (
        staff_member_id WITH =,
        daterange(date, date, '[]') WITH &&,
        timerange(start_time, end_time) WITH &&
    ) WHERE (availability_type IN ('available', 'preferred'))
);

-- =====================================================
-- SCHEDULE_TEMPLATES TABLE - Predefined schedule patterns
-- =====================================================
CREATE TABLE schedule_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Template Configuration
    template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('daily', 'weekly', 'monthly')),
    is_active BOOLEAN DEFAULT true,
    
    -- Staffing Requirements
    staffing_requirements JSONB NOT NULL, -- JSON structure defining roles, skills, quantities
    /*
    Example structure:
    {
      "time_slots": [
        {
          "start_time": "08:00",
          "end_time": "16:00",
          "roles": [
            {"title": "Physician", "count": 2, "required_skills": ["dermatology"]},
            {"title": "Medical Assistant", "count": 3, "required_skills": ["patient_care"]},
            {"title": "Front Desk", "count": 2, "required_skills": ["scheduling"]}
          ]
        }
      ]
    }
    */
    
    -- AI Optimization Parameters
    optimization_priority VARCHAR(20) DEFAULT 'balanced' CHECK (optimization_priority IN ('cost', 'quality', 'balanced')),
    minimum_coverage_percentage DECIMAL(5,2) DEFAULT 95.00, -- Required coverage level
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAFF_SCHEDULES TABLE - Actual scheduled shifts
-- =====================================================
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES schedule_templates(id) ON DELETE SET NULL,
    
    -- Schedule Details
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 0,
    
    -- Schedule Status
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (assignment_type IN ('regular', 'overtime', 'on_call', 'emergency')),
    
    -- Role and Responsibilities
    assigned_role VARCHAR(100) NOT NULL,
    responsibilities JSONB DEFAULT '[]', -- Array of specific duties
    required_skills JSONB DEFAULT '[]', -- Skills needed for this shift
    
    -- AI Optimization Data
    ai_confidence_score DECIMAL(3,2), -- Confidence in AI assignment (0-1)
    optimization_factors JSONB DEFAULT '{}', -- Factors that influenced AI decision
    alternative_assignments JSONB DEFAULT '[]', -- Other viable staff options
    
    -- External System Integration
    deputy_schedule_id VARCHAR(50),
    modmed_appointment_ids JSONB DEFAULT '[]', -- Associated appointment IDs
    
    -- Performance Tracking
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    actual_hours_worked DECIMAL(4,2),
    performance_notes TEXT,
    patient_feedback_score DECIMAL(3,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent double-booking same staff member
    CONSTRAINT no_double_booking EXCLUDE USING gist (
        staff_member_id WITH =,
        daterange(schedule_date, schedule_date, '[]') WITH &&,
        timerange(start_time, end_time) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

-- =====================================================
-- COVERAGE_REQUIREMENTS TABLE - Location-specific staffing needs
-- =====================================================
CREATE TABLE coverage_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Time Period
    effective_date DATE NOT NULL,
    end_date DATE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    
