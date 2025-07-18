-- Remaining Ganger Platform Application Tables
-- Run this after clean-schema-final.sql to add all remaining app tables

BEGIN;

-- ============================================
-- MEDICATION AUTHORIZATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.medication_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name TEXT NOT NULL,
    patient_dob DATE,
    medication_name TEXT NOT NULL,
    diagnosis_code TEXT,
    insurance_provider TEXT,
    insurance_id TEXT,
    prescriber_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'denied', 'expired')),
    auth_number TEXT,
    submission_date TIMESTAMPTZ,
    approval_date TIMESTAMPTZ,
    expiration_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CALL CENTER OPERATIONS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_phone TEXT,
    caller_name TEXT,
    call_type TEXT CHECK (call_type IN ('inbound', 'outbound')),
    reason TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on-hold', 'completed', 'voicemail')),
    agent_id UUID REFERENCES public.profiles(id),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration INTEGER, -- seconds
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.call_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    missed_calls INTEGER DEFAULT 0,
    average_duration INTEGER DEFAULT 0,
    average_wait_time INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHARMA SCHEDULING TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.pharma_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rep_name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    location TEXT NOT NULL,
    purpose TEXT,
    meal_provided BOOLEAN DEFAULT false,
    attendees INTEGER DEFAULT 1,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE TRAINING TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    content_url TEXT,
    duration_minutes INTEGER,
    passing_score INTEGER DEFAULT 80,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.training_modules(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score INTEGER,
    passed BOOLEAN DEFAULT false,
    certificate_url TEXT,
    UNIQUE(user_id, module_id)
);

-- ============================================
-- SOCIALS & REVIEWS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL CHECK (platform IN ('google', 'facebook', 'instagram', 'twitter', 'linkedin')),
    post_type TEXT CHECK (post_type IN ('review', 'post', 'comment', 'message')),
    author_name TEXT,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    responded BOOLEAN DEFAULT false,
    response_text TEXT,
    responded_by UUID REFERENCES public.profiles(id),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLATFORM DASHBOARD TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    "position" INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    widget_id UUID REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
    "position" INTEGER,
    settings JSONB DEFAULT '{}',
    UNIQUE(user_id, widget_id)
);

-- ============================================
-- CONFIG DASHBOARD TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.app_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_name TEXT NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}',
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTEGRATION STATUS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.integration_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
    last_sync TIMESTAMPTZ,
    error_message TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES public.integration_connections(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    success BOOLEAN DEFAULT true,
    message TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPONENT SHOWCASE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.ui_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    props JSONB DEFAULT '{}',
    example_code TEXT,
    documentation_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI RECEPTIONIST TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    caller_phone TEXT,
    caller_name TEXT,
    intent TEXT,
    transcript JSONB DEFAULT '[]',
    outcome TEXT,
    transferred_to UUID REFERENCES public.profiles(id),
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR REMAINING TABLES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_medication_auth_patient ON public.medication_authorizations(patient_name);
CREATE INDEX IF NOT EXISTS idx_medication_auth_status ON public.medication_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_agent ON public.call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON public.call_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_pharma_visits_date ON public.pharma_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_training_completions_user ON public.training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON public.social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_sentiment ON public.social_posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_integration_logs_connection ON public.integration_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON public.ai_conversations(session_id);

-- ============================================
-- TRIGGERS FOR REMAINING TABLES
-- ============================================

DROP TRIGGER IF EXISTS update_medication_auth_updated_at ON public.medication_authorizations;
CREATE TRIGGER update_medication_auth_updated_at
    BEFORE UPDATE ON public.medication_authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pharma_visits_updated_at ON public.pharma_visits;
CREATE TRIGGER update_pharma_visits_updated_at
    BEFORE UPDATE ON public.pharma_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_modules_updated_at ON public.training_modules;
CREATE TRIGGER update_training_modules_updated_at
    BEFORE UPDATE ON public.training_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_configurations_updated_at ON public.app_configurations;
CREATE TRIGGER update_app_configurations_updated_at
    BEFORE UPDATE ON public.app_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_connections_updated_at ON public.integration_connections;
CREATE TRIGGER update_integration_connections_updated_at
    BEFORE UPDATE ON public.integration_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ui_components_updated_at ON public.ui_components;
CREATE TRIGGER update_ui_components_updated_at
    BEFORE UPDATE ON public.ui_components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES FOR REMAINING TABLES
-- ============================================

-- Enable RLS
ALTER TABLE public.medication_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharma_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Authenticated users can access medication_authorizations" ON public.medication_authorizations;
CREATE POLICY "Authenticated users can access medication_authorizations" ON public.medication_authorizations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access call_logs" ON public.call_logs;
CREATE POLICY "Authenticated users can access call_logs" ON public.call_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access call_metrics" ON public.call_metrics;
CREATE POLICY "Authenticated users can access call_metrics" ON public.call_metrics
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access pharma_visits" ON public.pharma_visits;
CREATE POLICY "Authenticated users can access pharma_visits" ON public.pharma_visits
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access training_modules" ON public.training_modules;
CREATE POLICY "Authenticated users can access training_modules" ON public.training_modules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access training_completions" ON public.training_completions;
CREATE POLICY "Authenticated users can access training_completions" ON public.training_completions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access social_posts" ON public.social_posts;
CREATE POLICY "Authenticated users can access social_posts" ON public.social_posts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access dashboard_widgets" ON public.dashboard_widgets;
CREATE POLICY "Authenticated users can access dashboard_widgets" ON public.dashboard_widgets
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access user_dashboards" ON public.user_dashboards;
CREATE POLICY "Authenticated users can access user_dashboards" ON public.user_dashboards
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access app_configurations" ON public.app_configurations;
CREATE POLICY "Authenticated users can access app_configurations" ON public.app_configurations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access integration_connections" ON public.integration_connections;
CREATE POLICY "Authenticated users can access integration_connections" ON public.integration_connections
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access integration_logs" ON public.integration_logs;
CREATE POLICY "Authenticated users can access integration_logs" ON public.integration_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access ui_components" ON public.ui_components;
CREATE POLICY "Authenticated users can access ui_components" ON public.ui_components
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can access ai_conversations" ON public.ai_conversations;
CREATE POLICY "Authenticated users can access ai_conversations" ON public.ai_conversations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;

SELECT 'Remaining application tables created successfully!' as status;