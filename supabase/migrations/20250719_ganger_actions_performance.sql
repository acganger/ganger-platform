-- Performance optimization for ganger-actions
-- Adds indexes and aggregation functions for dashboard stats

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_staff_tickets_status ON staff_tickets(status);
CREATE INDEX IF NOT EXISTS idx_staff_tickets_submitter_email ON staff_tickets(submitter_email);
CREATE INDEX IF NOT EXISTS idx_staff_tickets_assigned_to ON staff_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_staff_tickets_created_at ON staff_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_staff_tickets_priority ON staff_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_staff_tickets_form_type ON staff_tickets(form_type);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_staff_tickets_user_tickets 
  ON staff_tickets(submitter_email, assigned_to, status);

-- Index for text search
CREATE INDEX IF NOT EXISTS idx_staff_tickets_search 
  ON staff_tickets USING gin(to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(ticket_number, '')
  ));

-- Function to get ticket counts by field
CREATE OR REPLACE FUNCTION get_ticket_counts_by_field(
  field_name TEXT,
  user_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  field_value TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  EXECUTE format(
    'SELECT %I::TEXT as field_value, COUNT(*)::BIGINT as count
     FROM staff_tickets
     WHERE ($1 IS NULL OR submitter_email = $1 OR assigned_to = $1)
     GROUP BY %I
     ORDER BY count DESC',
    field_name, field_name
  ) USING user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get average resolution time
CREATE OR REPLACE FUNCTION get_average_resolution_time(
  user_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  avg_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(
      EXTRACT(EPOCH FROM (
        COALESCE(resolved_at, updated_at) - created_at
      )) / 3600
    )::NUMERIC(10,2) as avg_hours
  FROM staff_tickets
  WHERE status = 'completed'
    AND (user_email IS NULL OR submitter_email = user_email OR assigned_to = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Materialized view for dashboard stats (refresh every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_ticket_stats AS
SELECT 
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_tickets,
  COUNT(*) FILTER (WHERE status IN ('pending', 'pending_approval')) as pending_tickets,
  DATE_TRUNC('hour', CURRENT_TIMESTAMP) as calculated_at
FROM staff_tickets;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_dashboard_ticket_stats_calculated_at 
  ON dashboard_ticket_stats(calculated_at);

-- Function to refresh stats (can be called by cron job)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_ticket_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_ticket_counts_by_field TO authenticated;
GRANT EXECUTE ON FUNCTION get_average_resolution_time TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO service_role;
GRANT SELECT ON dashboard_ticket_stats TO authenticated;