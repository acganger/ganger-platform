-- Phase 4: Database Performance Optimization
-- Add missing indexes identified in expert review

-- Social Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_social_reviews_created_at 
  ON social_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_reviews_location_created 
  ON social_reviews(business_location, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_reviews_status 
  ON social_reviews(review_status);

CREATE INDEX IF NOT EXISTS idx_social_reviews_sentiment 
  ON social_reviews(sentiment_category);

-- Integration metrics indexes
CREATE INDEX IF NOT EXISTS idx_integration_metrics_integration_id 
  ON integration_metrics(integration_id);

CREATE INDEX IF NOT EXISTS idx_integration_metrics_created_at 
  ON integration_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_metrics_metric_type 
  ON integration_metrics(metric_type);

-- Staff schedules indexes
CREATE INDEX IF NOT EXISTS idx_staff_schedules_schedule_date 
  ON staff_schedules(schedule_date);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_member 
  ON staff_schedules(staff_member_id, schedule_date);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_location_date 
  ON staff_schedules(location_id, schedule_date);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_status 
  ON staff_schedules(status);

-- Training completions indexes
CREATE INDEX IF NOT EXISTS idx_training_completions_status 
  ON training_completions(status);

CREATE INDEX IF NOT EXISTS idx_training_completions_user_status 
  ON training_completions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_training_completions_course_status 
  ON training_completions(course_id, status);

CREATE INDEX IF NOT EXISTS idx_training_completions_completed_at 
  ON training_completions(completed_at DESC);

-- Inventory transactions indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id 
  ON inventory_transactions(item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_location_date 
  ON inventory_transactions(location_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type 
  ON inventory_transactions(transaction_type);

-- Patient appointments indexes (for check-in kiosk)
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation 
  ON appointments(confirmation_number);

CREATE INDEX IF NOT EXISTS idx_appointments_date_location 
  ON appointments(appointment_date, location_id);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date 
  ON appointments(patient_id, appointment_date);

-- Medication authorizations indexes
CREATE INDEX IF NOT EXISTS idx_prior_authorizations_patient 
  ON prior_authorizations(patient_id);

CREATE INDEX IF NOT EXISTS idx_prior_authorizations_status 
  ON prior_authorizations(status);

CREATE INDEX IF NOT EXISTS idx_prior_authorizations_medication 
  ON prior_authorizations(medication_id, status);

-- Create materialized view for review statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS review_stats AS
SELECT 
  business_location,
  DATE_TRUNC('month', review_date) as month,
  COUNT(*) as total_reviews,
  AVG(rating) as avg_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_reviews,
  COUNT(CASE WHEN response_status = 'responded' THEN 1 END) as responded_count,
  AVG(CASE 
    WHEN response_status = 'responded' AND responded_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (responded_at - created_at))/3600 
  END) as avg_response_time_hours
FROM social_reviews
GROUP BY business_location, DATE_TRUNC('month', review_date);

-- Create index on materialized view
CREATE UNIQUE INDEX idx_review_stats_location_month 
  ON review_stats(business_location, month);

-- Create materialized view for training compliance
CREATE MATERIALIZED VIEW IF NOT EXISTS training_compliance_summary AS
SELECT 
  tc.user_id,
  u.full_name,
  u.department,
  u.location,
  COUNT(DISTINCT tc.course_id) as courses_completed,
  COUNT(DISTINCT CASE WHEN tc.status = 'completed' THEN tc.course_id END) as courses_passed,
  COUNT(DISTINCT CASE WHEN c.is_required = true THEN c.id END) as required_courses,
  COUNT(DISTINCT CASE WHEN c.is_required = true AND tc.status = 'completed' THEN c.id END) as required_completed,
  MAX(tc.completed_at) as last_completion_date,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN c.is_required = true THEN c.id END) = 
         COUNT(DISTINCT CASE WHEN c.is_required = true AND tc.status = 'completed' THEN c.id END)
    THEN 'compliant'
    ELSE 'non_compliant'
  END as compliance_status
FROM training_completions tc
JOIN auth.users u ON tc.user_id = u.id
LEFT JOIN training_courses c ON tc.course_id = c.id
GROUP BY tc.user_id, u.full_name, u.department, u.location;

-- Create index on compliance view
CREATE UNIQUE INDEX idx_compliance_user 
  ON training_compliance_summary(user_id);
CREATE INDEX idx_compliance_status 
  ON training_compliance_summary(compliance_status);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY review_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY training_compliance_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (would be set up in Supabase dashboard)
-- SELECT cron.schedule('refresh-materialized-views', '0 */6 * * *', 'SELECT refresh_materialized_views();');

-- Analyze tables to update statistics
ANALYZE social_reviews;
ANALYZE integration_metrics;
ANALYZE staff_schedules;
ANALYZE training_completions;
ANALYZE inventory_transactions;
ANALYZE appointments;
ANALYZE prior_authorizations;