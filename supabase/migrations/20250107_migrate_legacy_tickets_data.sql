-- Migration script to import legacy ticket data
-- This should be run after the table creation migration

-- Create temporary function to map legacy status to new status
CREATE OR REPLACE FUNCTION map_legacy_status(legacy_status TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE legacy_status
    WHEN 'Pending Approval' THEN 'pending_approval'
    WHEN 'Open' THEN 'open'
    WHEN 'In Progress' THEN 'in_progress'
    WHEN 'Stalled' THEN 'stalled'
    WHEN 'Approved' THEN 'approved'
    WHEN 'Denied' THEN 'denied'
    WHEN 'Completed' THEN 'completed'
    ELSE 'pending'
  END;
END;
$$ LANGUAGE plpgsql;

-- Create temporary function to map legacy priority
CREATE OR REPLACE FUNCTION map_legacy_priority(legacy_priority TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN legacy_priority ILIKE '%urgent%important%' THEN 'urgent'
    WHEN legacy_priority ILIKE '%urgent%' THEN 'high'
    WHEN legacy_priority ILIKE '%important%' THEN 'high'
    WHEN legacy_priority ILIKE '%not urgent%not important%' THEN 'low'
    ELSE 'normal'
  END;
END;
$$ LANGUAGE plpgsql;

-- Create temporary function to extract title from form data
CREATE OR REPLACE FUNCTION extract_title_from_payload(form_type TEXT, payload JSONB)
RETURNS TEXT AS $$
DECLARE
  title TEXT;
BEGIN
  title := CASE form_type
    WHEN 'support_ticket' THEN 
      COALESCE(payload->>'request_type', 'Support Ticket') || ' - ' || COALESCE(payload->>'location', 'Unknown')
    WHEN 'time_off_request' THEN 
      'Time Off Request - ' || COALESCE(payload->>'start_date', 'Unknown Date')
    WHEN 'punch_fix' THEN 
      'Punch Fix - ' || COALESCE(payload->>'date', 'Unknown Date')
    WHEN 'change_of_availability' THEN 
      'Availability Change - ' || COALESCE(payload->>'effective_date', 'Unknown Date')
    WHEN 'expense_reimbursement' THEN 
      'Expense Reimbursement - $' || COALESCE(payload->>'amount', '0')
    WHEN 'meeting_request' THEN 
      'Meeting Request - ' || COALESCE(payload->>'subject', 'Unknown Subject')
    WHEN 'impact_filter' THEN 
      'Impact Filter - ' || LEFT(COALESCE(payload->>'goal', 'Unknown Goal'), 50)
    ELSE form_type
  END;
  
  RETURN title;
END;
$$ LANGUAGE plpgsql;

-- Create temporary function to extract description
CREATE OR REPLACE FUNCTION extract_description_from_payload(form_type TEXT, payload JSONB)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE form_type
    WHEN 'support_ticket' THEN payload->>'details'
    WHEN 'time_off_request' THEN payload->>'reason'
    WHEN 'punch_fix' THEN payload->>'comments'
    WHEN 'change_of_availability' THEN payload->>'reason'
    WHEN 'expense_reimbursement' THEN payload->>'description'
    WHEN 'meeting_request' THEN payload->>'details'
    WHEN 'impact_filter' THEN payload->>'goal'
    ELSE payload::TEXT
  END;
END;
$$ LANGUAGE plpgsql;

-- Sample migration query (to be customized based on actual legacy data import)
-- This assumes you've imported the legacy MySQL data into a temporary table first

/*
-- Example: Import tickets from legacy system
INSERT INTO tickets (
  ticket_number,
  form_type,
  submitter_email,
  submitter_name,
  status,
  priority,
  location,
  assigned_to_email,
  created_at,
  updated_at,
  title,
  description,
  form_data,
  action_taken_at,
  completed_by_email
)
SELECT
  -- Generate new ticket numbers or use a mapping
  CASE 
    WHEN id < 100 THEN '24-' || LPAD(id::TEXT, 6, '0')
    ELSE '25-' || LPAD((id - 100)::TEXT, 6, '0')
  END,
  form_type,
  submitter_email,
  COALESCE(payload->>'submitter_name', split_part(submitter_email, '@', 1)),
  map_legacy_status(status),
  map_legacy_priority(priority),
  location,
  assigned_to_email,
  created_at,
  updated_at,
  extract_title_from_payload(form_type, payload::JSONB),
  extract_description_from_payload(form_type, payload::JSONB),
  payload::JSONB,
  action_taken_at,
  completed_by
FROM legacy_staff_tickets
WHERE submitter_email LIKE '%@gangerdermatology.com';

-- Import job queue entries
INSERT INTO job_queue (
  handler,
  payload,
  priority,
  retry_count,
  status,
  created_at
)
SELECT
  handler,
  payload::JSONB,
  priority,
  retry_count,
  LOWER(status),
  created_at
FROM legacy_staff_job_queue
WHERE status = 'pending';

*/

-- Clean up temporary functions
DROP FUNCTION IF EXISTS map_legacy_status(TEXT);
DROP FUNCTION IF EXISTS map_legacy_priority(TEXT);
DROP FUNCTION IF EXISTS extract_title_from_payload(TEXT, JSONB);
DROP FUNCTION IF EXISTS extract_description_from_payload(TEXT, JSONB);

-- Add some sample data for testing
INSERT INTO tickets (
  form_type,
  submitter_email,
  submitter_name,
  status,
  priority,
  location,
  title,
  description,
  form_data
) VALUES
(
  'support_ticket',
  'test@gangerdermatology.com',
  'Test User',
  'open',
  'normal',
  'Ann Arbor',
  'IT Support - Computer Issue',
  'My computer is running slowly and needs to be checked.',
  '{"location": "Ann Arbor", "request_type": "it_support", "priority": "Not Urgent + Important", "details": "My computer is running slowly and needs to be checked."}'::JSONB
),
(
  'time_off_request',
  'test@gangerdermatology.com',
  'Test User',
  'pending_approval',
  'normal',
  NULL,
  'Time Off Request - 2025-01-15',
  'Vacation request for family trip.',
  '{"start_date": "2025-01-15", "end_date": "2025-01-17", "reason": "Vacation request for family trip.", "requesting_pto": "Yes"}'::JSONB
);