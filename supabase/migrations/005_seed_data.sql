-- =====================================================
-- Ganger Platform Database Schema - Seed Data
-- Migration: 005_seed_data.sql
-- Created: June 5, 2025
-- =====================================================

-- =====================================================
-- LOCATIONS SEED DATA
-- =====================================================
INSERT INTO locations (id, name, address, city, state, zip_code, phone, email, timezone, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Ganger Dermatology - Main Office', '123 Medical Plaza Dr', 'Charlotte', 'NC', '28207', '(704) 555-0123', 'main@gangerdermatology.com', 'America/New_York', true),
('550e8400-e29b-41d4-a716-446655440002', 'Ganger Dermatology - North Location', '456 Healthcare Blvd', 'Charlotte', 'NC', '28262', '(704) 555-0124', 'north@gangerdermatology.com', 'America/New_York', true),
('550e8400-e29b-41d4-a716-446655440003', 'Ganger Dermatology - South Location', '789 Medical Center Way', 'Charlotte', 'NC', '28226', '(704) 555-0125', 'south@gangerdermatology.com', 'America/New_York', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TEMPLATE CATEGORIES SEED DATA
-- =====================================================
INSERT INTO template_categories (id, name, description, parent_category_id, sort_order, icon, color, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'General Education', 'General patient education materials', NULL, 1, 'book', '#3B82F6', true),
('c1000000-0000-0000-0000-000000000002', 'Pre-Procedure', 'Instructions before medical procedures', NULL, 2, 'calendar', '#059669', true),
('c1000000-0000-0000-0000-000000000003', 'Post-Procedure', 'Care instructions after procedures', NULL, 3, 'heart', '#DC2626', true),
('c1000000-0000-0000-0000-000000000004', 'Medication Information', 'Drug information and instructions', NULL, 4, 'pill', '#7C3AED', true),
('c1000000-0000-0000-0000-000000000005', 'Skin Care', 'Dermatology-specific care instructions', 'c1000000-0000-0000-0000-000000000001', 1, 'sun', '#F59E0B', true),
('c1000000-0000-0000-0000-000000000006', 'Appointment Preparation', 'How to prepare for appointments', 'c1000000-0000-0000-0000-000000000002', 1, 'clock', '#10B981', true),
('c1000000-0000-0000-0000-000000000007', 'Wound Care', 'Post-procedure wound care', 'c1000000-0000-0000-0000-000000000003', 1, 'bandage', '#EF4444', true),
('c1000000-0000-0000-0000-000000000008', 'Insurance Information', 'Insurance and billing information', NULL, 5, 'shield', '#6366F1', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TEMPLATE VARIABLES SEED DATA
-- =====================================================
INSERT INTO template_variables (id, name, display_name, description, variable_type, is_required, default_value, data_source, source_field, category, sort_order, is_system_variable) VALUES
-- Patient variables
('v1000000-0000-0000-0000-000000000001', 'patient_first_name', 'Patient First Name', 'The patient''s first name', 'text', true, NULL, 'patient', 'first_name', 'Patient Information', 1, true),
('v1000000-0000-0000-0000-000000000002', 'patient_last_name', 'Patient Last Name', 'The patient''s last name', 'text', true, NULL, 'patient', 'last_name', 'Patient Information', 2, true),
('v1000000-0000-0000-0000-000000000003', 'patient_full_name', 'Patient Full Name', 'The patient''s full name', 'text', true, NULL, 'patient', 'full_name', 'Patient Information', 3, true),
('v1000000-0000-0000-0000-000000000004', 'patient_mrn', 'Medical Record Number', 'The patient''s medical record number', 'text', true, NULL, 'patient', 'mrn', 'Patient Information', 4, true),
('v1000000-0000-0000-0000-000000000005', 'patient_dob', 'Date of Birth', 'The patient''s date of birth', 'date', false, NULL, 'patient', 'date_of_birth', 'Patient Information', 5, true),
('v1000000-0000-0000-0000-000000000006', 'patient_email', 'Patient Email', 'The patient''s email address', 'email', false, NULL, 'patient', 'email', 'Patient Information', 6, true),
('v1000000-0000-0000-0000-000000000007', 'patient_phone', 'Patient Phone', 'The patient''s phone number', 'phone', false, NULL, 'patient', 'phone', 'Patient Information', 7, true),

-- Provider variables
('v1000000-0000-0000-0000-000000000010', 'provider_name', 'Provider Name', 'The healthcare provider''s name', 'text', true, NULL, 'user', 'name', 'Provider Information', 10, true),
('v1000000-0000-0000-0000-000000000011', 'provider_email', 'Provider Email', 'The healthcare provider''s email', 'email', false, NULL, 'user', 'email', 'Provider Information', 11, true),

-- Location variables
('v1000000-0000-0000-0000-000000000020', 'location_name', 'Practice Name', 'The name of the medical practice', 'text', true, 'Ganger Dermatology', 'location', 'name', 'Practice Information', 20, true),
('v1000000-0000-0000-0000-000000000021', 'location_address', 'Practice Address', 'The address of the medical practice', 'text', false, NULL, 'location', 'address', 'Practice Information', 21, true),
('v1000000-0000-0000-0000-000000000022', 'location_phone', 'Practice Phone', 'The phone number of the medical practice', 'phone', false, NULL, 'location', 'phone', 'Practice Information', 22, true),

-- System variables
('v1000000-0000-0000-0000-000000000030', 'current_date', 'Current Date', 'Today''s date', 'date', false, NULL, 'system', 'current_date', 'System Information', 30, true),
('v1000000-0000-0000-0000-000000000031', 'current_time', 'Current Time', 'Current time', 'text', false, NULL, 'system', 'current_time', 'System Information', 31, true),
('v1000000-0000-0000-0000-000000000032', 'current_datetime', 'Current Date & Time', 'Current date and time', 'text', false, NULL, 'system', 'current_datetime', 'System Information', 32, true),

-- Custom variables for handouts
('v1000000-0000-0000-0000-000000000040', 'appointment_date', 'Appointment Date', 'Date of the appointment', 'date', false, NULL, 'manual', NULL, 'Appointment Information', 40, false),
('v1000000-0000-0000-0000-000000000041', 'appointment_time', 'Appointment Time', 'Time of the appointment', 'text', false, NULL, 'manual', NULL, 'Appointment Information', 41, false),
('v1000000-0000-0000-0000-000000000042', 'procedure_name', 'Procedure Name', 'Name of the medical procedure', 'text', false, NULL, 'manual', NULL, 'Procedure Information', 42, false),
('v1000000-0000-0000-0000-000000000043', 'medication_name', 'Medication Name', 'Name of prescribed medication', 'text', false, NULL, 'manual', NULL, 'Medication Information', 43, false),
('v1000000-0000-0000-0000-000000000044', 'medication_dosage', 'Medication Dosage', 'Dosage instructions for medication', 'text', false, NULL, 'manual', NULL, 'Medication Information', 44, false),
('v1000000-0000-0000-0000-000000000045', 'next_visit_date', 'Next Visit Date', 'Date of next scheduled visit', 'date', false, NULL, 'manual', NULL, 'Follow-up Information', 45, false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE HANDOUT TEMPLATES SEED DATA
-- =====================================================
INSERT INTO handout_templates (id, name, description, template_type, content, variables, category, tags, is_active, is_system_template, created_by, location_id, version, approval_status) VALUES
('t1000000-0000-0000-0000-000000000001', 'General Skin Care Instructions', 'Basic skin care instructions for dermatology patients', 'post_procedure', 
'<h1>Skin Care Instructions</h1>
<h2>Patient Information</h2>
<p><strong>Patient:</strong> {{patient_full_name}}<br>
<strong>MRN:</strong> {{patient_mrn}}<br>
<strong>Date:</strong> {{current_date}}</p>

<h2>General Skin Care Guidelines</h2>
<h3>Daily Care</h3>
<ul>
<li>Gently cleanse your skin with a mild, fragrance-free cleanser</li>
<li>Apply moisturizer while skin is still damp</li>
<li>Use sunscreen with SPF 30 or higher daily</li>
<li>Avoid harsh scrubbing or exfoliating</li>
</ul>

<h3>Important Notes</h3>
<div class="important">
<p><strong>Important:</strong> If you experience any unusual symptoms, redness, or irritation, please contact our office immediately.</p>
</div>

<h3>Contact Information</h3>
<p><strong>{{location_name}}</strong><br>
Phone: {{location_phone}}<br>
Email: {{provider_email}}</p>

<p><em>Instructions provided by: {{provider_name}}</em></p>',
'["patient_full_name", "patient_mrn", "current_date", "location_name", "location_phone", "provider_email", "provider_name"]',
'Skin Care', 
'{"general", "skin care", "daily routine"}',
true, true, NULL, NULL, 1, 'approved'),

('t1000000-0000-0000-0000-000000000002', 'Pre-Procedure Instructions', 'General instructions to prepare for dermatological procedures', 'pre_procedure',
'<h1>Pre-Procedure Instructions</h1>
<h2>Patient Information</h2>
<p><strong>Patient:</strong> {{patient_full_name}}<br>
<strong>MRN:</strong> {{patient_mrn}}<br>
<strong>Procedure:</strong> {{procedure_name}}<br>
<strong>Appointment Date:</strong> {{appointment_date}} at {{appointment_time}}</p>

<h2>Before Your Procedure</h2>
<h3>24 Hours Before</h3>
<ul>
<li>Avoid alcohol and blood-thinning medications (unless prescribed)</li>
<li>Get a good night''s sleep</li>
<li>Eat a light meal before your appointment</li>
</ul>

<h3>Day of Procedure</h3>
<ul>
<li>Arrive 15 minutes early for check-in</li>
<li>Bring a list of current medications</li>
<li>Wear comfortable, loose-fitting clothing</li>
<li>Arrange for transportation if sedation is involved</li>
</ul>

<h3>What to Bring</h3>
<ul>
<li>Photo identification</li>
<li>Insurance cards</li>
<li>Payment for any copays or deductibles</li>
<li>List of current medications and allergies</li>
</ul>

<div class="important">
<p><strong>Important:</strong> If you have any questions or concerns, please call our office at {{location_phone}}.</p>
</div>

<p><strong>{{location_name}}</strong><br>
{{location_address}}<br>
Phone: {{location_phone}}</p>',
'["patient_full_name", "patient_mrn", "procedure_name", "appointment_date", "appointment_time", "location_phone", "location_name", "location_address"]',
'Pre-Procedure',
'{"preparation", "procedure", "instructions"}',
true, true, NULL, NULL, 1, 'approved'),

('t1000000-0000-0000-0000-000000000003', 'Post-Procedure Wound Care', 'Instructions for caring for wounds after dermatological procedures', 'post_procedure',
'<h1>Post-Procedure Wound Care Instructions</h1>
<h2>Patient Information</h2>
<p><strong>Patient:</strong> {{patient_full_name}}<br>
<strong>MRN:</strong> {{patient_mrn}}<br>
<strong>Procedure Date:</strong> {{current_date}}<br>
<strong>Next Visit:</strong> {{next_visit_date}}</p>

<h2>Immediate Care (First 24 Hours)</h2>
<ul>
<li>Keep the bandage clean and dry</li>
<li>Do not remove the initial bandage for 24 hours</li>
<li>Apply ice for 10-15 minutes at a time to reduce swelling</li>
<li>Take pain medication as prescribed</li>
</ul>

<h2>Ongoing Care</h2>
<h3>Cleaning</h3>
<ol>
<li>Gently clean the area with mild soap and water</li>
<li>Pat dry with a clean towel</li>
<li>Apply prescribed ointment if recommended</li>
<li>Cover with a clean bandage</li>
</ol>

<h3>Activity Restrictions</h3>
<ul>
<li>Avoid strenuous activity for 48 hours</li>
<li>No swimming or soaking for 1 week</li>
<li>Protect the area from sun exposure</li>
</ul>

<div class="warning">
<h3>Call Our Office Immediately If You Experience:</h3>
<ul>
<li>Excessive bleeding that doesn''t stop with pressure</li>
<li>Signs of infection (increased redness, warmth, pus)</li>
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