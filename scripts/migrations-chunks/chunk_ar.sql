-- Create triggers for audit logging
CREATE TRIGGER config_change_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON app_configurations
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Register existing platform applications
INSERT INTO platform_applications (
  app_name, display_name, description, app_url, health_check_endpoint,
  config_schema, default_config, requires_approval_for_changes
) VALUES 
-- Core Applications
('inventory', 'Inventory Management', 'Medical supply tracking with barcode scanning and real-time stock management', 
 'https://inventory.gangerdermatology.com', '/api/health',
 '{"sections": {"general": {"type": "object"}, "alerts": {"type": "object"}, "integrations": {"type": "object"}}}',
 '{"general": {"auto_reorder": true, "low_stock_threshold": 10}, "alerts": {"email_notifications": true}}',
 false),

('handouts', 'Patient Handouts Generator', 'Custom educational materials with QR scanning and digital delivery',
 'https://handouts.gangerdermatology.com', '/api/health',
 '{"sections": {"templates": {"type": "object"}, "delivery": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"templates": {"auto_save": true}, "delivery": {"default_method": "email"}, "analytics": {"track_opens": true}}',
 false),

('checkin-kiosk', 'Check-in Kiosk', 'Patient self-service terminal with payment processing',
 'https://checkin.gangerdermatology.com', '/api/health',
 '{"sections": {"payments": {"type": "object"}, "display": {"type": "object"}, "security": {"type": "object"}}}',
 '{"payments": {"stripe_mode": "live"}, "display": {"timeout_minutes": 5}, "security": {"require_signature": true}}',
 true),

('eos-l10', 'EOS L10 Management', 'Level 10 meeting platform replacing ninety.io',
 'https://l10.gangerdermatology.com', '/api/health',
 '{"sections": {"meetings": {"type": "object"}, "scorecard": {"type": "object"}, "rocks": {"type": "object"}}}',
 '{"meetings": {"default_duration": 90}, "scorecard": {"auto_calculate": true}, "rocks": {"quarterly_review": true}}',
 false),

('pharma-scheduling', 'Pharmaceutical Rep Scheduling', 'Professional pharmaceutical rep booking system',
 'https://pharma.gangerdermatology.com', '/api/health',
 '{"sections": {"booking": {"type": "object"}, "calendar": {"type": "object"}, "notifications": {"type": "object"}}}',
 '{"booking": {"advance_booking_days": 30}, "calendar": {"google_sync": true}, "notifications": {"sms_enabled": true}}',
 true),

-- Management Applications
('medication-auth', 'Medication Authorization Assistant', 'AI-powered prior authorization automation',
 'https://medauth.gangerdermatology.com', '/api/health',
 '{"sections": {"ai": {"type": "object"}, "fhir": {"type": "object"}, "compliance": {"type": "object"}}}',
 '{"ai": {"auto_submit": false}, "fhir": {"version": "R4"}, "compliance": {"audit_all": true}}',
 true),

('clinical-staffing', 'Clinical Staffing Optimization', 'AI-powered staff scheduling across locations',
 'https://staffing.gangerdermatology.com', '/api/health',
 '{"sections": {"scheduling": {"type": "object"}, "deputy": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"scheduling": {"auto_optimize": true}, "deputy": {"sync_enabled": false}, "analytics": {"performance_tracking": true}}',
 false),

('integration-status', 'Third-Party Integration Status', 'Real-time monitoring of all external services',
 'https://integrations.gangerdermatology.com', '/api/health',
 '{"sections": {"monitoring": {"type": "object"}, "alerting": {"type": "object"}, "performance": {"type": "object"}}}',
 '{"monitoring": {"check_interval": 60}, "alerting": {"slack_webhook": true}, "performance": {"track_metrics": true}}',
 false),

-- Additional Applications
('compliance-training', 'Compliance Training Manager', 'Manager training oversight and compliance tracking',
 'https://compliance.gangerdermatology.com', '/api/health',
 '{"sections": {"training": {"type": "object"}, "tracking": {"type": "object"}, "reporting": {"type": "object"}}}',
 '{"training": {"auto_assign": true}, "tracking": {"completion_alerts": true}, "reporting": {"monthly_reports": true}}',
 false),

('batch-closeout', 'Batch Closeout & Label Generator', 'Financial processing and label printing',
 'https://batch.gangerdermatology.com', '/api/health',
 '{"sections": {"processing": {"type": "object"}, "labels": {"type": "object"}, "verification": {"type": "object"}}}',
 '{"processing": {"auto_verify": false}, "labels": {"printer_settings": {}}, "verification": {"require_manual": true}}',
 true),

('socials-reviews', 'Socials & Reviews Management', 'AI-powered social media monitoring and Google Business review management',
 'https://socials.gangerdermatology.com', '/api/health',
 '{"sections": {"monitoring": {"type": "object"}, "responses": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"monitoring": {"check_frequency": "hourly"}, "responses": {"auto_respond": false}, "analytics": {"sentiment_tracking": true}}',
 false),

('call-center-ops', 'Call Center Operations Dashboard', 'Real-time operational analytics and optimization',
 'https://callcenter.gangerdermatology.com', '/api/health',
 '{"sections": {"3cx": {"type": "object"}, "analytics": {"type": "object"}, "reporting": {"type": "object"}}}',
 '{"3cx": {"webhook_enabled": true}, "analytics": {"real_time": true}, "reporting": {"daily_summary": true}}',
 false),

-- Platform Management
('platform-dashboard', 'Platform Entrypoint Dashboard', 'Unified access point for all platform applications',
 'https://platform.gangerdermatology.com', '/api/health',
 '{"sections": {"apps": {"type": "object"}, "search": {"type": "object"}, "activity": {"type": "object"}}}',
 '{"apps": {"show_health": true}, "search": {"cross_app": true}, "activity": {"log_access": true}}',
 false),

('config-dashboard', 'Consolidated Configuration Dashboard', 'Centralized application settings management',
 'https://config.gangerdermatology.com', '/api/health',
 '{"sections": {"permissions": {"type": "object"}, "audit": {"type": "object"}, "approvals": {"type": "object"}}}',
 '{"permissions": {"inherit_roles": true}, "audit": {"full_logging": true}, "approvals": {"auto_expire_days": 7}}',
 true),

-- Future Applications
('staff', 'Staff Management System', 'Employee management and HR workflows',
 'https://staff.gangerdermatology.com', '/api/health',
 '{"sections": {"hr": {"type": "object"}, "tickets": {"type": "object"}, "scheduling": {"type": "object"}}}',
 '{"hr": {"google_sync": true}, "tickets": {"auto_assign": true}, "scheduling": {"deputy_integration": false}}',
 true),

('provider-dashboard', 'Provider Revenue Dashboard', 'Revenue optimization and performance analytics',
 'https://provider.gangerdermatology.com', '/api/health',
 '{"sections": {"revenue": {"type": "object"}, "performance": {"type": "object"}, "analytics": {"type": "object"}}}',
 '{"revenue": {"track_collections": true}, "performance": {"benchmark_enabled": false}, "analytics": {"predictive_modeling": false}}',
 false),

('ai-agent', 'AI Phone Agent System', 'Revolutionary patient communication automation',
 'https://ai-agent.gangerdermatology.com', '/api/health',
 '{"sections": {"ai": {"type": "object"}, "telephony": {"type": "object"}, "integration": {"type": "object"}}}',
 '{"ai": {"model": "gpt-4"}, "telephony": {"provider": "twilio"}, "integration": {"modmed_sync": false}}',
 true);

-- Grant initial permissions to superadmin role
INSERT INTO app_config_permissions (
  app_id, permission_type, role_name, permission_level, granted_by
)
SELECT 
  id, 
  'role', 
  'superadmin', 
  'admin',
  (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
FROM platform_applications
WHERE (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1) IS NOT NULL;

-- Grant manager permissions for operational apps
INSERT INTO app_config_permissions (
  app_id, permission_type, role_name, permission_level, granted_by
)
SELECT 
  id, 
  'role', 
  'manager', 
  'write',
  (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
FROM platform_applications 
WHERE app_name IN ('inventory', 'handouts', 'eos-l10', 'clinical-staffing', 'integration-status', 'compliance-training', 'platform-dashboard')
AND (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1) IS NOT NULL;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE platform_applications IS 'Registry of all applications in the Ganger Platform with configuration schemas';
COMMENT ON TABLE app_configurations IS 'Storage for application configuration values with approval workflow support';
COMMENT ON TABLE app_config_permissions IS 'Role and user-based permission management for configuration access';
COMMENT ON TABLE user_impersonation_sessions IS 'Secure tracking of user impersonation sessions with comprehensive audit';
COMMENT ON TABLE config_change_audit IS 'Complete audit trail for all configuration changes with impersonation context';
COMMENT ON TABLE pending_config_changes IS 'Approval workflow queue for configuration changes requiring review';

COMMENT ON FUNCTION check_user_app_permission IS 'Check if user has specific permission level for app configuration';
COMMENT ON FUNCTION get_user_effective_permissions IS 'Get all effective permissions for a user across all applications';
COMMENT ON FUNCTION log_config_change IS 'Audit trigger function to log all configuration changes';

COMMIT;
