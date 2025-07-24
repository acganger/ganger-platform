-- Migration: Document future feature tables
-- Issue: Some tables exist but aren't used, causing confusion
-- Solution: Add comments explaining these are for planned features

-- Document ai_conversations table (for AI Phone Agent)
COMMENT ON TABLE public.ai_conversations IS 
'Reserved for AI Phone Agent/Receptionist conversation history. Feature planned but not yet implemented. See AI Phone Agent PRD.';

-- Document dashboard_widgets table (for customizable dashboards)
COMMENT ON TABLE public.dashboard_widgets IS 
'Reserved for customizable dashboard feature. Will allow users to create personalized dashboards. Not yet implemented.';

-- Document kiosk_sessions table (for patient check-in)
COMMENT ON TABLE public.kiosk_sessions IS 
'Reserved for patient check-in kiosk session tracking. Kiosk app exists but currently uses different tables. Future implementation planned.';

-- Document ui_components table (for component registry)
COMMENT ON TABLE public.ui_components IS 
'Reserved for UI component registry/showcase. Currently components are managed in @ganger/ui package. Database storage planned for future.';

-- Document user_dashboards table (for user dashboard configs)
COMMENT ON TABLE public.user_dashboards IS 
'Reserved for storing user-specific dashboard configurations. Related to dashboard_widgets. Feature not yet implemented.';

-- Verify comments were added
SELECT 
    c.relname as table_name,
    CASE 
        WHEN obj_description(c.oid) IS NOT NULL THEN 'Documented'
        ELSE 'Not documented'
    END as documentation_status,
    obj_description(c.oid) as table_comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN (
    'ai_conversations',
    'dashboard_widgets',
    'kiosk_sessions',
    'ui_components',
    'user_dashboards'
)
AND c.relkind = 'r'
ORDER BY c.relname;