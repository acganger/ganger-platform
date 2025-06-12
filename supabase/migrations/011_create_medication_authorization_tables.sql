-- ================================================
-- MEDICATION AUTHORIZATION SYSTEM
-- Migration: 011_create_medication_authorization_tables.sql
-- Description: Comprehensive database schema for AI-powered medication authorization
-- Date: 2025-01-08
-- ================================================

-- Create custom enum types for medication authorization
CREATE TYPE authorization_status_enum AS ENUM (
    'draft',
    'submitted', 
    'under_review',
    'approved',
    'denied',
    'expired',
    'cancelled',
    'appealed'
);

CREATE TYPE priority_enum AS ENUM (
    'routine',
    'urgent', 
    'emergent',
    'stat'
);

CREATE TYPE ai_recommendation_enum AS ENUM (
    'approve',
    'deny',
    'request_more_info',
    'suggest_alternative',
    'escalate_manual_review'
);

CREATE TYPE step_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'skipped',
    'failed'
);

CREATE TYPE comm_type_enum AS ENUM (
    'email',
    'fax',
    'phone',
    'portal',
    'api_call'
);

CREATE TYPE comm_direction_enum AS ENUM (
    'inbound',
    'outbound'
);

-- ================================================
-- CORE AUTHORIZATION TABLES
-- ================================================

-- Medication authorization requests
CREATE TABLE medication_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    medication_id UUID NOT NULL,
    insurance_provider_id UUID NOT NULL,
    
    -- Authorization details
    status authorization_status_enum NOT NULL DEFAULT 'draft',
    priority_level priority_enum NOT NULL DEFAULT 'routine',
    diagnosis_codes TEXT[] NOT NULL DEFAULT '{}',
    quantity_requested INTEGER NOT NULL,
    days_supply INTEGER NOT NULL,
    refills_requested INTEGER DEFAULT 0,
    
    -- AI processing data
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    ai_recommendation ai_recommendation_enum,
    ai_reasoning TEXT,
    estimated_approval_probability DECIMAL(3,2) CHECK (estimated_approval_probability >= 0 AND estimated_approval_probability <= 1),
    
    -- Cost and financial data
    estimated_cost DECIMAL(10,2),
    patient_responsibility DECIMAL(10,2),
    insurance_coverage_percentage DECIMAL(5,2),
    
    -- Important dates
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    denied_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Medical necessity documentation
    clinical_notes TEXT,
    previous_therapies_tried TEXT[],
    contraindications TEXT[],
    supporting_documentation JSONB DEFAULT '{}',
    
    -- External reference numbers
    insurance_reference_number VARCHAR(100),
    pharmacy_reference_number VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_quantity CHECK (quantity_requested > 0),
    CONSTRAINT valid_days_supply CHECK (days_supply > 0),
    CONSTRAINT valid_refills CHECK (refills_requested >= 0),
    CONSTRAINT logical_dates CHECK (
        (approved_at IS NULL OR submitted_at IS NOT NULL) AND
        (denied_at IS NULL OR submitted_at IS NOT NULL) AND
        (approved_at IS NULL OR denied_at IS NULL)
    )
);

-- Patient information cache from ModMed
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modmed_patient_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Basic demographics
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    
    -- Contact information
    phone VARCHAR(20),
    email VARCHAR(255),
    address JSONB DEFAULT '{}',
    
    -- Insurance information
    insurance_member_id VARCHAR(100),
    insurance_group_number VARCHAR(100),
    insurance_plan_name VARCHAR(200),
    
    -- Medical information
    active_medications JSONB DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    diagnosis_history JSONB DEFAULT '{}',
    medical_conditions TEXT[] DEFAULT '{}',
    
    -- Sync tracking
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'synced',
    sync_errors JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_birth_date CHECK (date_of_birth <= CURRENT_DATE),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL)
);

-- Medication database with authorization requirements
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Drug identification
    ndc_number VARCHAR(20) UNIQUE NOT NULL,
    brand_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    strength VARCHAR(100) NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    route_of_administration VARCHAR(100),
    manufacturer VARCHAR(200),
    
    -- Classification
    therapeutic_class VARCHAR(200),
    pharmacologic_class VARCHAR(200),
    controlled_substance_schedule VARCHAR(10),
    
    -- Authorization requirements
    requires_prior_auth BOOLEAN DEFAULT false,
    step_therapy_required BOOLEAN DEFAULT false,
    quantity_limits JSONB DEFAULT '{}',
    age_restrictions JSONB DEFAULT '{}',
    diagnosis_requirements TEXT[] DEFAULT '{}',
    
    -- Clinical information
    contraindications TEXT[] DEFAULT '{}',
    drug_interactions TEXT[] DEFAULT '{}',
    pregnancy_category VARCHAR(10),
    black_box_warning BOOLEAN DEFAULT false,
    
    -- Cost information
    average_wholesale_price DECIMAL(10,2),
    typical_copay_tier INTEGER,
    
    -- Status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_ndc CHECK (LENGTH(ndc_number) >= 10),
    CONSTRAINT valid_copay_tier CHECK (typical_copay_tier BETWEEN 1 AND 5)
);

-- Insurance provider requirements and policies
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider identification
    name VARCHAR(200) NOT NULL,
    plan_type VARCHAR(100) NOT NULL,
    plan_code VARCHAR(50),
    
    -- Formulary information
    formulary_tier INTEGER,
    formulary_restrictions JSONB DEFAULT '{}',
    preferred_alternatives JSONB DEFAULT '{}',
    
    -- Prior authorization requirements
    prior_auth_requirements JSONB NOT NULL DEFAULT '{}',
    step_therapy_protocols JSONB DEFAULT '{}',
    quantity_limit_policies JSONB DEFAULT '{}',
    
    -- API integration
    submission_endpoint VARCHAR(500),
    api_credentials_encrypted TEXT,
    supports_electronic_submission BOOLEAN DEFAULT false,
    
    -- Performance metrics
    processing_time_hours INTEGER DEFAULT 72,
    success_rate DECIMAL(5,2),
    average_approval_time_hours DECIMAL(8,2),
    
    -- Contact information
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    portal_url VARCHAR(500),
    
    -- Status and metadata
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_success_rate CHECK (success_rate BETWEEN 0 AND 100),
    CONSTRAINT valid_processing_time CHECK (processing_time_hours > 0)
);

-- ================================================
-- AI PROCESSING AND WORKFLOW TABLES
-- ================================================

-- AI processing and recommendations
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommendation_type ai_recommendation_enum NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    reasoning TEXT NOT NULL,
    
    -- Suggestions and alternatives
    suggested_alternatives JSONB DEFAULT '{}',
    required_documentation TEXT[] DEFAULT '{}',
    missing_information TEXT[] DEFAULT '{}',
    
    -- Probability assessments
    estimated_approval_probability DECIMAL(3,2) CHECK (estimated_approval_probability >= 0 AND estimated_approval_probability <= 1),
    risk_factors JSONB DEFAULT '{}',
    
    -- Processing metrics
    processing_time_ms INTEGER,
    model_version VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_ai_recommendations_auth_id ON ai_recommendations(authorization_id),
    INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type),
    INDEX idx_ai_recommendations_confidence ON ai_recommendations(confidence_score DESC)
);

-- Authorization workflow and status tracking
CREATE TABLE authorization_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- Step information
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    status step_status_enum NOT NULL DEFAULT 'pending',
    
    -- Assignment and timing
    assigned_to UUID,
    assigned_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Step details
    description TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '{}',
    
    -- AI assistance
    ai_assisted BOOLEAN DEFAULT false,
    ai_suggestions JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT logical_workflow_dates CHECK (
        (started_at IS NULL OR assigned_at IS NOT NULL) AND
        (completed_at IS NULL OR started_at IS NOT NULL)
    ),
    
    -- Indexes
    INDEX idx_workflow_steps_auth_id ON authorization_workflow_steps(authorization_id),
    INDEX idx_workflow_steps_status ON authorization_workflow_steps(status),
    INDEX idx_workflow_steps_assigned ON authorization_workflow_steps(assigned_to)
);

-- Communication log with insurance providers
CREATE TABLE authorization_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- Communication details
    communication_type comm_type_enum NOT NULL,
    direction comm_direction_enum NOT NULL,
    subject VARCHAR(200),
    content TEXT,
    
    -- Attachments and files
    attachments JSONB DEFAULT '{}',
    file_references TEXT[] DEFAULT '{}',
    
    -- External references
    insurance_reference_number VARCHAR(100),
    confirmation_number VARCHAR(100),
    
    -- Response tracking
    response_required BOOLEAN DEFAULT false,
    response_due_date TIMESTAMPTZ,
    response_received_at TIMESTAMPTZ,
    
    -- Contact information
    contact_name VARCHAR(200),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Indexes
    INDEX idx_auth_comm_auth_id ON authorization_communications(authorization_id),
    INDEX idx_auth_comm_type ON authorization_communications(communication_type),
    INDEX idx_auth_comm_direction ON authorization_communications(direction)
);

-- ================================================
-- ANALYTICS AND AUDIT TABLES  
-- ================================================

-- Authorization analytics and performance tracking
CREATE TABLE authorization_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    date DATE NOT NULL,
    hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
    
    -- Segmentation
    provider_id UUID,
    insurance_provider_id UUID,
    medication_category VARCHAR(100),
    
    -- Volume metrics
    total_requests INTEGER DEFAULT 0,
    submitted_requests INTEGER DEFAULT 0,
    approved_requests INTEGER DEFAULT 0,
    denied_requests INTEGER DEFAULT 0,
    pending_requests INTEGER DEFAULT 0,
    cancelled_requests INTEGER DEFAULT 0,
    
    -- Timing metrics
    avg_processing_time_hours DECIMAL(8,2),
    median_processing_time_hours DECIMAL(8,2),
    max_processing_time_hours DECIMAL(8,2),
    
    -- AI performance metrics
    ai_recommendations_count INTEGER DEFAULT 0,
    ai_accuracy_rate DECIMAL(5,2),
    ai_recommendations_followed INTEGER DEFAULT 0,
    avg_ai_confidence_score DECIMAL(3,2),
    
    -- Financial metrics
    total_estimated_cost DECIMAL(12,2),
    cost_savings_estimate DECIMAL(12,2),
    administrative_time_saved_hours DECIMAL(8,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_analytics_counts CHECK (
        total_requests >= 0 AND
        submitted_requests >= 0 AND
        approved_requests >= 0 AND
        denied_requests >= 0 AND
        pending_requests >= 0 AND
        cancelled_requests >= 0
    ),
    
    -- Unique constraints
    UNIQUE(date, hour_of_day, provider_id, insurance_provider_id, medication_category),
    
    -- Indexes
    INDEX idx_analytics_date ON authorization_analytics(date),
    INDEX idx_analytics_provider ON authorization_analytics(provider_id),
    INDEX idx_analytics_insurance ON authorization_analytics(insurance_provider_id)
);

-- Comprehensive audit trail for HIPAA compliance
CREATE TABLE authorization_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorization_id UUID REFERENCES medication_authorizations(id) ON DELETE CASCADE,
    
    -- User and session information
    user_id UUID,
    user_email VARCHAR(255),
    session_id VARCHAR(100),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    
    -- Change tracking
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    changed_fields TEXT[] DEFAULT '{}',
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    
    -- HIPAA compliance
    access_reason VARCHAR(200),
    compliance_note TEXT,
    phi_accessed BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for audit queries
    INDEX idx_audit_logs_auth_id ON authorization_audit_logs(authorization_id),
    INDEX idx_audit_logs_user_id ON authorization_audit_logs(user_id),
    INDEX idx_audit_logs_action ON authorization_audit_logs(action),
    INDEX idx_audit_logs_created_at ON authorization_audit_logs(created_at),
    INDEX idx_audit_logs_phi_access ON authorization_audit_logs(phi_accessed)
);

-- ================================================
-- CREATE UPDATED_AT TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_medication_authorizations_updated_at
    BEFORE UPDATE ON medication_authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_providers_updated_at
    BEFORE UPDATE ON insurance_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorization_workflow_steps_updated_at
    BEFORE UPDATE ON authorization_workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorization_analytics_updated_at
    BEFORE UPDATE ON authorization_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Primary lookup indexes
CREATE INDEX idx_med_auth_patient_id ON medication_authorizations(patient_id);
CREATE INDEX idx_med_auth_provider_id ON medication_authorizations(provider_id);
CREATE INDEX idx_med_auth_medication_id ON medication_authorizations(medication_id);
CREATE INDEX idx_med_auth_insurance_id ON medication_authorizations(insurance_provider_id);
CREATE INDEX idx_med_auth_status ON medication_authorizations(status);
CREATE INDEX idx_med_auth_priority ON medication_authorizations(priority_level);
CREATE INDEX idx_med_auth_created_at ON medication_authorizations(created_at);
CREATE INDEX idx_med_auth_submitted_at ON medication_authorizations(submitted_at);

-- Patient lookup indexes
CREATE INDEX idx_patients_modmed_id ON patients(modmed_patient_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_sync_status ON patients(sync_status);

-- Medication lookup indexes
CREATE INDEX idx_medications_ndc ON medications(ndc_number);
CREATE INDEX idx_medications_brand_name ON medications(brand_name);
CREATE INDEX idx_medications_generic_name ON medications(generic_name);
CREATE INDEX idx_medications_prior_auth ON medications(requires_prior_auth);
CREATE INDEX idx_medications_active ON medications(active);

-- Insurance provider indexes
CREATE INDEX idx_insurance_name ON insurance_providers(name);
CREATE INDEX idx_insurance_plan_type ON insurance_providers(plan_type);
CREATE INDEX idx_insurance_active ON insurance_providers(active);

-- Composite indexes for common queries
CREATE INDEX idx_med_auth_status_priority ON medication_authorizations(status, priority_level);
CREATE INDEX idx_med_auth_patient_status ON medication_authorizations(patient_id, status);
CREATE INDEX idx_med_auth_provider_date ON medication_authorizations(provider_id, created_at);

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE medication_authorizations IS 'Core table for tracking medication prior authorization requests with AI-powered processing';
COMMENT ON TABLE patients IS 'Cached patient information synchronized from ModMed FHIR API';
COMMENT ON TABLE medications IS 'Comprehensive medication database with authorization requirements and clinical data';
COMMENT ON TABLE insurance_providers IS 'Insurance provider policies, requirements, and API integration settings';
COMMENT ON TABLE ai_recommendations IS 'AI-generated recommendations and analysis for authorization requests';
COMMENT ON TABLE authorization_workflow_steps IS 'Workflow tracking for authorization processing steps and assignments';
COMMENT ON TABLE authorization_communications IS 'Communication log with insurance providers and external parties';
COMMENT ON TABLE authorization_analytics IS 'Performance analytics and metrics for authorization processing';
COMMENT ON TABLE authorization_audit_logs IS 'HIPAA-compliant audit trail for all system access and changes';

-- ================================================
-- MIGRATION COMPLETE
-- ================================================