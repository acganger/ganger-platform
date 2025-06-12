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