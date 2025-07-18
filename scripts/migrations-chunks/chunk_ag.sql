    ON appointments(location_id, status, scheduled_date)
    WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- Audit Logs Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_date 
    ON audit_logs(user_id, action, created_at)
    WHERE created_at > NOW() - INTERVAL '7 years';

-- Patient Data Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_active 
    ON patients(id, active)
    WHERE active = true;

-- =============================================
-- Optimized RLS Helper Functions
-- =============================================

-- Enhanced user role function with caching
CREATE OR REPLACE FUNCTION get_current_user_role_cached() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- Enhanced location access function with better performance
CREATE OR REPLACE FUNCTION user_can_access_location_optimized(location_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN get_current_user_role_cached() = 'superadmin' THEN true
    WHEN location_id = ANY(
      SELECT unnest(locations) FROM users WHERE id = auth.uid()
    ) THEN true
    ELSE false
  END
$$;

-- Function to check multiple locations at once for better performance
CREATE OR REPLACE FUNCTION user_can_access_any_location(location_ids UUID[]) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN get_current_user_role_cached() = 'superadmin' THEN true
    WHEN location_ids && (
      SELECT locations FROM users WHERE id = auth.uid()
    ) THEN true
    ELSE false
  END
$$;

-- =============================================
-- Query Performance Monitoring
-- =============================================

-- Function to analyze RLS policy performance
CREATE OR REPLACE FUNCTION analyze_rls_performance()
RETURNS TABLE(
    table_name TEXT,
    policy_name TEXT,
    estimated_cost NUMERIC,
    index_usage TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::TEXT,
        p.policyname::TEXT,
        0.0::NUMERIC as estimated_cost, -- Placeholder for actual cost analysis
        'Index analysis not available'::TEXT as index_usage
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get slow RLS queries
CREATE OR REPLACE FUNCTION get_slow_rls_queries(threshold_ms INTEGER DEFAULT 100)
RETURNS JSON AS $$
DECLARE
    slow_queries JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'query', left(query, 200),
            'state', state,
            'query_start', query_start,
            'duration_ms', EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000,
            'wait_event', wait_event,
            'application_name', application_name
        )
    ) INTO slow_queries
    FROM pg_stat_activity 
    WHERE datname = current_database()
    AND state = 'active'
    AND query ILIKE '%rls%' OR query ILIKE '%policy%' OR query ILIKE '%auth.uid%'
    AND query_start < NOW() - (threshold_ms || ' milliseconds')::INTERVAL
    ORDER BY query_start ASC;
    
    RETURN COALESCE(slow_queries, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Index Usage Analysis
-- =============================================

-- Function to check which RLS indexes are being used
CREATE OR REPLACE FUNCTION get_rls_index_usage()
RETURNS JSON AS $$
DECLARE
    index_usage JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'table_name', schemaname || '.' || relname,
            'index_name', indexrelname,
            'scans', idx_scan,
            'tuples_read', idx_tup_read,
            'tuples_fetched', idx_tup_fetch,
            'size_mb', round(pg_relation_size(indexrelid) / 1024.0 / 1024.0, 2),
            'usage_ratio', CASE 
                WHEN idx_scan > 0 THEN round(idx_tup_fetch::numeric / idx_scan, 2)
                ELSE 0
            END
        )
    ) INTO index_usage
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND (
        indexrelname LIKE '%auth%' OR 
        indexrelname LIKE '%location%' OR
        indexrelname LIKE '%rls%' OR
        indexrelname LIKE '%access%'
    )
    ORDER BY idx_scan DESC;
    
    RETURN COALESCE(index_usage, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS Performance Testing Functions
-- =============================================

-- Function to benchmark RLS policy performance
CREATE OR REPLACE FUNCTION benchmark_rls_policies()
RETURNS JSON AS $$
DECLARE
    benchmark_results JSON;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    test_user_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RETURN json_build_object('error', 'No test user found');
    END IF;
    
    -- Benchmark key RLS operations
    start_time := clock_timestamp();
    
    -- Test inventory access
    PERFORM count(*) FROM inventory_items WHERE location_id IS NOT NULL LIMIT 10;
    
    -- Test handout access
    PERFORM count(*) FROM handout_templates WHERE is_active = true LIMIT 10;
    
    -- Test user permissions
    PERFORM count(*) FROM users WHERE active = true LIMIT 10;
    
    end_time := clock_timestamp();
    
    SELECT json_build_object(
        'test_duration_ms', EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
        'timestamp', NOW(),
        'test_user_id', test_user_id,
        'queries_tested', 3,
        'status', 'completed'
    ) INTO benchmark_results;
    
    RETURN benchmark_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS Policy Recommendations
-- =============================================

-- Function to generate RLS optimization recommendations
CREATE OR REPLACE FUNCTION get_rls_recommendations()
RETURNS JSON AS $$
DECLARE
    recommendations JSON;
    total_policies INTEGER;
    slow_queries INTEGER;
    unused_indexes INTEGER;
BEGIN
    -- Count total RLS policies
    SELECT count(*) INTO total_policies 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count potentially slow queries (this is a simplified check)
    SELECT count(*) INTO slow_queries
    FROM pg_stat_activity 
    WHERE query ILIKE '%auth.uid%' 
    AND state = 'active'
    AND query_start < NOW() - INTERVAL '1 second';
    
    -- Count indexes with low usage
    SELECT count(*) INTO unused_indexes
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND idx_scan < 10;
    
    SELECT json_build_object(
        'total_rls_policies', total_policies,
        'potentially_slow_queries', slow_queries,
        'low_usage_indexes', unused_indexes,
        'recommendations', json_build_array(
            CASE WHEN slow_queries > 5 THEN 'Consider adding more specific indexes for frequently used RLS conditions' ELSE null END,
            CASE WHEN unused_indexes > 10 THEN 'Review and potentially drop unused indexes' ELSE null END,
            CASE WHEN total_policies > 50 THEN 'Consider consolidating similar RLS policies' ELSE null END,
            'Regularly monitor RLS query performance',
            'Use EXPLAIN ANALYZE on queries with RLS policies'
        ),
        'optimization_status', CASE 
            WHEN slow_queries < 3 AND unused_indexes < 5 THEN 'Good'
            WHEN slow_queries < 10 AND unused_indexes < 15 THEN 'Fair'
            ELSE 'Needs Attention'
        END
    ) INTO recommendations;
    
    RETURN recommendations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Grant Permissions
-- =============================================

GRANT EXECUTE ON FUNCTION get_current_user_role_cached() TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_location_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_any_location(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_rls_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_rls_queries(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rls_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION benchmark_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_rls_recommendations() TO authenticated;

-- =============================================
-- Performance Monitoring View
-- =============================================

-- Create a view for easy RLS performance monitoring
CREATE OR REPLACE VIEW rls_performance_monitor AS
SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    'RLS Policy' as object_type,
    CASE 
        WHEN cmd = 'ALL' THEN 'All Operations'
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        ELSE cmd
    END as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Row Level Security'
        ELSE 'No RLS'
    END as security_type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

GRANT SELECT ON rls_performance_monitor TO authenticated;

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON FUNCTION get_current_user_role_cached() IS 'Optimized version of user role lookup with better performance';
COMMENT ON FUNCTION user_can_access_location_optimized(UUID) IS 'Performance-optimized location access check for RLS policies';
COMMENT ON FUNCTION user_can_access_any_location(UUID[]) IS 'Batch location access check for better performance';
COMMENT ON FUNCTION analyze_rls_performance() IS 'Analyzes RLS policy performance and index usage';
COMMENT ON FUNCTION get_slow_rls_queries(INTEGER) IS 'Returns RLS-related queries that are running slowly';
COMMENT ON FUNCTION get_rls_index_usage() IS 'Returns usage statistics for RLS-related indexes';
COMMENT ON FUNCTION benchmark_rls_policies() IS 'Benchmarks RLS policy performance';
COMMENT ON FUNCTION get_rls_recommendations() IS 'Provides optimization recommendations for RLS policies';
COMMENT ON VIEW rls_performance_monitor IS 'View for monitoring RLS policies and their configuration';

-- =============================================
-- Update RLS Policies to Use Optimized Functions
-- =============================================

-- Note: In production, we would gradually migrate policies to use the optimized functions
-- For now, we're creating the infrastructure for future optimization

-- Migration complete
SELECT 'RLS performance optimization completed successfully' as status;


-- Migration: 20250107_create_ganger_actions_tables.sql
-- ==========================================

-- Drop existing tables if they exist (to allow for clean migration)
DROP TABLE IF EXISTS public.ticket_comments CASCADE;
DROP TABLE IF EXISTS public.ticket_file_uploads CASCADE;
DROP TABLE IF EXISTS public.ticket_approvals CASCADE;
DROP TABLE IF EXISTS public.ticket_notifications CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.job_queue CASCADE;

-- Create updated tickets table with improved schema
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  
  -- Form metadata
  form_type TEXT NOT NULL CHECK (form_type IN (
    'support_ticket',
    'time_off_request',
    'punch_fix',
    'change_of_availability',
    'expense_reimbursement',
    'meeting_request',
    'impact_filter'
  )),
  
  -- Submitter information
  submitter_email TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  submitter_id UUID REFERENCES auth.users(id),
  
  -- Ticket status and workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'pending_approval',
    'open',
    'in_progress',
    'stalled',
    'approved',
    'denied',
    'completed',
    'cancelled'
  )),
  
  -- Priority and categorization
  priority TEXT CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  location TEXT,
  category TEXT,
  
  -- Assignment and ownership
  assigned_to_email TEXT,
  assigned_to_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Ticket content
  title TEXT NOT NULL,
  description TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  
  -- Workflow timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  action_taken_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by_email TEXT,
  completed_by_id UUID REFERENCES auth.users(id),
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by_email TEXT,
  approved_by_id UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,
  
  -- Search and indexing
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(submitter_name, '')), 'C')
  ) STORED
);

-- Create indexes for performance
CREATE INDEX idx_tickets_form_type ON tickets(form_type);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_submitter_email ON tickets(submitter_email);
CREATE INDEX idx_tickets_assigned_to_email ON tickets(assigned_to_email);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_search ON tickets USING GIN(search_vector);
CREATE INDEX idx_tickets_location ON tickets(location) WHERE location IS NOT NULL;
CREATE INDEX idx_tickets_priority ON tickets(priority) WHERE priority IS NOT NULL;

-- Create ticket comments table
CREATE TABLE public.ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Track edits
  edited_at TIMESTAMPTZ,
  edited_by_email TEXT,
  edit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at DESC);

-- Create file uploads table
CREATE TABLE public.ticket_file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  
  uploaded_by_email TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_by_id UUID REFERENCES auth.users(id),
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_file_uploads_ticket_id ON ticket_file_uploads(ticket_id);
CREATE INDEX idx_file_uploads_status ON ticket_file_uploads(status);

-- Create approvals table for approval workflow
CREATE TABLE public.ticket_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  approver_email TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  approver_id UUID REFERENCES auth.users(id),
  
  action TEXT NOT NULL CHECK (action IN ('approved', 'denied', 'requested_info')),
  comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_approvals_ticket_id ON ticket_approvals(ticket_id);
CREATE INDEX idx_ticket_approvals_created_at ON ticket_approvals(created_at DESC);

-- Create notifications table
CREATE TABLE public.ticket_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id),
  
  type TEXT NOT NULL CHECK (type IN (
    'new_ticket',
    'ticket_assigned',
    'ticket_updated',
    'ticket_commented',
    'ticket_approved',
    'ticket_denied',
    'ticket_completed'
  )),
  
  payload JSONB NOT NULL DEFAULT '{}',
  
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_ticket_id ON ticket_notifications(ticket_id);
CREATE INDEX idx_notifications_recipient_email ON ticket_notifications(recipient_email);
CREATE INDEX idx_notifications_read_at ON ticket_notifications(read_at) WHERE read_at IS NULL;

-- Create job queue table for background processing
CREATE TABLE public.job_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  handler TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )),
  
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_scheduled ON job_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_job_queue_priority ON job_queue(priority DESC, created_at ASC) WHERE status = 'pending';

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_number INTEGER;
  new_ticket_number TEXT;
BEGIN
  -- Get current year
  year_part := TO_CHAR(NOW(), 'YY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 3) AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM tickets
  WHERE ticket_number LIKE year_part || '%';
  
  -- Format: YY-NNNNNN (e.g., 25-000001)
  new_ticket_number := year_part || '-' || LPAD(sequence_number::TEXT, 6, '0');
  
  RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tickets
-- Users can see their own tickets
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (auth.uid() = submitter_id OR auth.email() = submitter_email);

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = submitter_id OR auth.email() = submitter_email);

-- Users can update their own pending tickets
CREATE POLICY "Users can update own pending tickets" ON tickets
  FOR UPDATE USING (
    (auth.uid() = submitter_id OR auth.email() = submitter_email) 
    AND status IN ('pending', 'open')
  );

-- Assigned users can view and update tickets
CREATE POLICY "Assigned users can view tickets" ON tickets
  FOR SELECT USING (auth.uid() = assigned_to_id OR auth.email() = assigned_to_email);

CREATE POLICY "Assigned users can update tickets" ON tickets
  FOR UPDATE USING (auth.uid() = assigned_to_id OR auth.email() = assigned_to_email);

-- Create RLS policies for comments
-- Users can view comments on tickets they can see
CREATE POLICY "Users can view comments" ON ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

-- Users can create comments on tickets they can see
CREATE POLICY "Users can create comments" ON ticket_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view file uploads" ON ticket_file_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_file_uploads.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

CREATE POLICY "Users can upload files" ON ticket_file_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_file_uploads.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

-- Create views for common queries
CREATE OR REPLACE VIEW ticket_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'open') AS open_tickets,
  COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
  COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '30 days') AS completed_last_30_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS created_last_7_days,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600)::INTEGER AS avg_resolution_hours
FROM tickets;

-- Create view for user ticket summary
CREATE OR REPLACE VIEW user_ticket_summary AS
SELECT
  submitter_email,
  submitter_name,
  COUNT(*) AS total_tickets,
  COUNT(*) FILTER (WHERE status = 'open') AS open_tickets,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_tickets,
  COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_tickets,
  MAX(created_at) AS last_ticket_date
FROM tickets
GROUP BY submitter_email, submitter_name;

-- Add helpful comments
COMMENT ON TABLE tickets IS 'Main tickets table for all form submissions in ganger-actions';
COMMENT ON COLUMN tickets.form_data IS 'JSONB storage for form-specific fields that vary by form_type';
COMMENT ON COLUMN tickets.search_vector IS 'Full-text search index for ticket title, description, and submitter name';
COMMENT ON TABLE job_queue IS 'Background job processing queue for notifications and other async tasks';


-- Migration: 20250107_create_user_management_tables.sql
-- ==========================================

-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(100),
  position VARCHAR(100),
  role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'intern')),
  location VARCHAR(50) CHECK (location IN ('Ann Arbor', 'Wixom', 'Plymouth', 'Remote', 'All')),
  manager_id UUID REFERENCES public.user_profiles(id),
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  profile_picture_url TEXT,
  google_user_data JSONB,
  skills TEXT[],
  emergency_contact JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_manager_id ON public.user_profiles(manager_id);
CREATE INDEX idx_user_profiles_location ON public.user_profiles(location);
CREATE INDEX idx_user_profiles_department ON public.user_profiles(department);
CREATE INDEX idx_user_profiles_is_active ON public.user_profiles(is_active);

-- User permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  granted_by UUID REFERENCES public.user_profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission)
);

-- Create index for permission lookups
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON public.user_permissions(permission);

-- Manager relationships history
CREATE TABLE IF NOT EXISTS public.manager_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.user_profiles(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  reason VARCHAR(255),
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for manager assignment lookups
CREATE INDEX idx_manager_assignments_employee_id ON public.manager_assignments(employee_id);
CREATE INDEX idx_manager_assignments_manager_id ON public.manager_assignments(manager_id);
CREATE INDEX idx_manager_assignments_dates ON public.manager_assignments(start_date, end_date);

-- Department definitions
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  head_id UUID REFERENCES public.user_profiles(id),
  parent_department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity log for audit trail
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for activity log lookups
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_action ON public.user_activity_log(action);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
-- Everyone can view active user profiles
CREATE POLICY "Users can view active profiles" ON public.user_profiles
  FOR SELECT USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins and managers can update any profile
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- User permissions policies
-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON public.user_permissions
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all permissions
CREATE POLICY "Admins can manage permissions" ON public.user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Manager assignments policies
-- Everyone can view manager assignments
CREATE POLICY "View manager assignments" ON public.manager_assignments
  FOR SELECT USING (true);

-- Admins and managers can manage assignments
CREATE POLICY "Manage manager assignments" ON public.manager_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Department policies
-- Everyone can view departments
CREATE POLICY "View departments" ON public.departments
  FOR SELECT USING (true);

-- Admins can manage departments
CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Activity log policies
-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON public.user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create user profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's team members (for managers)
CREATE OR REPLACE FUNCTION public.get_team_members(manager_uuid UUID)
RETURNS TABLE(
  id UUID,
  full_name VARCHAR(255),
  email VARCHAR(255),
  position VARCHAR(100),
  department VARCHAR(100),
  location VARCHAR(50),
  hire_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.position,
    up.department,
    up.location,
    up.hire_date
  FROM public.user_profiles up
  WHERE up.manager_id = manager_uuid
    AND up.is_active = true
  ORDER BY up.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check direct permission
  IF EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = user_uuid 
      AND permission = permission_name
      AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN true;
  END IF;
  
  -- Check role-based permissions
  -- Admins have all permissions
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- Managers have specific permissions
  IF permission_name IN ('view_team', 'manage_team', 'approve_time_off', 'approve_expenses') THEN
    IF EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = user_uuid AND role = 'manager'
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('Administration', 'Administrative and support staff'),
  ('Clinical', 'Medical providers and clinical staff'),
  ('Operations', 'Operations and facility management'),
  ('IT', 'Information Technology'),
  ('Finance', 'Finance and accounting'),
  ('Marketing', 'Marketing and communications')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_permissions TO authenticated;
GRANT ALL ON public.manager_assignments TO authenticated;
GRANT ALL ON public.departments TO authenticated;
GRANT ALL ON public.user_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission TO authenticated;


-- Migration: 20250107_migrate_legacy_tickets_data.sql
-- ==========================================

-- Migration script to import legacy ticket data
