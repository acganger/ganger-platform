-- Performance indexes for Ganger Platform
-- Based on expert review recommendations
-- Date: 2025-07-22

-- =====================================================
-- SOCIAL REVIEWS INDEXES
-- =====================================================

-- Index for social_reviews created_at (frequently queried for recent reviews)
CREATE INDEX IF NOT EXISTS idx_social_reviews_created_at 
ON social_reviews(created_at DESC);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_social_reviews_location_id 
ON social_reviews(location_id);

-- Composite index for location + created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_social_reviews_location_created 
ON social_reviews(location_id, created_at DESC);

-- Index for platform filtering
CREATE INDEX IF NOT EXISTS idx_social_reviews_platform 
ON social_reviews(platform);

-- Index for rating analysis
CREATE INDEX IF NOT EXISTS idx_social_reviews_rating 
ON social_reviews(rating);

-- =====================================================
-- INTEGRATION METRICS INDEXES
-- =====================================================

-- Index for integration_metrics queries (fixes N+1 query issue)
CREATE INDEX IF NOT EXISTS idx_integration_metrics_integration_id 
ON integration_metrics(integration_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_integration_metrics_created_at 
ON integration_metrics(created_at DESC);

-- Composite index for integration + time queries
CREATE INDEX IF NOT EXISTS idx_integration_metrics_integration_created 
ON integration_metrics(integration_id, created_at DESC);

-- =====================================================
-- INTEGRATIONS INDEXES
-- =====================================================

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_integrations_status 
ON integrations(status);

-- Index for active integrations
CREATE INDEX IF NOT EXISTS idx_integrations_is_active 
ON integrations(is_active) 
WHERE is_active = true;

-- =====================================================
-- STAFF SCHEDULES INDEXES
-- =====================================================

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_staff_schedules_schedule_date 
ON staff_schedules(schedule_date);

-- Index for staff member queries
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_member_id 
ON staff_schedules(staff_member_id);

-- Composite index for staff + date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_date 
ON staff_schedules(staff_member_id, schedule_date);

-- Index for schedule type filtering
CREATE INDEX IF NOT EXISTS idx_staff_schedules_schedule_type 
ON staff_schedules(schedule_type);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_staff_schedules_status 
ON staff_schedules(status);

-- =====================================================
-- TRAINING COMPLETIONS INDEXES
-- =====================================================

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_training_completions_status 
ON training_completions(status);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_training_completions_user_id 
ON training_completions(user_id);

-- Index for course queries
CREATE INDEX IF NOT EXISTS idx_training_completions_course_id 
ON training_completions(course_id);

-- Composite index for user + status (compliance checking)
CREATE INDEX IF NOT EXISTS idx_training_completions_user_status 
ON training_completions(user_id, status);

-- Index for expiration tracking
CREATE INDEX IF NOT EXISTS idx_training_completions_expires_at 
ON training_completions(expires_at) 
WHERE expires_at IS NOT NULL;

-- =====================================================
-- HANDOUT TEMPLATES INDEXES
-- =====================================================

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_handout_templates_category 
ON handout_templates(category);

-- Index for active templates
CREATE INDEX IF NOT EXISTS idx_handout_templates_is_active 
ON handout_templates(is_active) 
WHERE is_active = true;

-- Index for template type
CREATE INDEX IF NOT EXISTS idx_handout_templates_template_type 
ON handout_templates(template_type);

-- =====================================================
-- INVENTORY ITEMS INDEXES
-- =====================================================

-- Index for barcode lookups
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode 
ON inventory_items(barcode) 
WHERE barcode IS NOT NULL;

-- Index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku 
ON inventory_items(sku);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_inventory_items_category 
ON inventory_items(category);

-- Index for low stock alerts
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock 
ON inventory_items(quantity, reorder_point) 
WHERE quantity <= reorder_point;

-- =====================================================
-- PURCHASE REQUESTS INDEXES
-- =====================================================

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status 
ON purchase_requests(status);

-- Index for requester queries
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requester_id 
ON purchase_requests(requester_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at 
ON purchase_requests(created_at DESC);

-- =====================================================
-- PHARMA SCHEDULING INDEXES
-- =====================================================

-- Index for appointment date queries
CREATE INDEX IF NOT EXISTS idx_pharma_appointments_appointment_date 
ON pharma_appointments(appointment_date);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_pharma_appointments_status 
ON pharma_appointments(status);

-- Index for location queries
CREATE INDEX IF NOT EXISTS idx_pharma_appointments_location_id 
ON pharma_appointments(location_id);

-- Composite index for location + date
CREATE INDEX IF NOT EXISTS idx_pharma_appointments_location_date 
ON pharma_appointments(location_id, appointment_date);

-- =====================================================
-- AUDIT LOGS INDEXES
-- =====================================================

-- Index for user activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON audit_logs(user_id);

-- Index for resource queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON audit_logs(resource_type, resource_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

-- =====================================================
-- PERFORMANCE MONITORING INDEXES
-- =====================================================

-- Create partial indexes for frequently filtered queries
CREATE INDEX IF NOT EXISTS idx_api_metrics_slow_requests 
ON api_metrics(endpoint, response_time_ms) 
WHERE response_time_ms > 1000;

-- Index for error tracking
CREATE INDEX IF NOT EXISTS idx_api_metrics_errors 
ON api_metrics(endpoint, created_at DESC) 
WHERE error_count > 0;

-- =====================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =====================================================

-- Update table statistics for query planner optimization
ANALYZE social_reviews;
ANALYZE integration_metrics;
ANALYZE integrations;
ANALYZE staff_schedules;
ANALYZE training_completions;
ANALYZE handout_templates;
ANALYZE inventory_items;
ANALYZE purchase_requests;
ANALYZE pharma_appointments;
ANALYZE audit_logs;