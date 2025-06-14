-- EOS L10 Seed Data
-- Creates initial team and user data for testing

-- Insert demo team
INSERT INTO eos_teams (id, name, description, owner_id, settings) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Leadership Team',
    'Executive leadership team for Ganger Dermatology',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    '{
        "meeting_day": "Monday",
        "meeting_time": "09:00",
        "timezone": "America/New_York", 
        "meeting_duration": 90,
        "scorecard_frequency": "weekly",
        "rock_quarters": ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert team members (assuming we have some users in auth.users)
INSERT INTO team_members (team_id, user_id, role, seat) 
SELECT 
    '123e4567-e89b-12d3-a456-426614174000',
    u.id,
    CASE 
        WHEN u.email = 'anand@gangerdermatology.com' THEN 'leader'
        ELSE 'member'
    END,
    CASE 
        WHEN u.email = 'anand@gangerdermatology.com' THEN 'Chief Technology Officer'
        ELSE 'Team Member'
    END
FROM auth.users u 
WHERE u.email LIKE '%@gangerdermatology.com'
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Insert sample rocks
INSERT INTO rocks (team_id, owner_id, title, description, quarter, status, completion_percentage, priority, due_date) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    'Q1 Patient Experience Initiative',
    'Improve patient satisfaction scores and reduce wait times',
    'Q1 2025',
    'on_track',
    75,
    8,
    '2025-03-31'
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    'New EHR System Implementation',
    'Deploy new electronic health records system across all locations',
    'Q1 2025',
    'off_track',
    45,
    9,
    '2025-03-15'
) ON CONFLICT DO NOTHING;

-- Insert sample scorecard
INSERT INTO scorecards (id, team_id, name, description) VALUES
(
    '223e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Leadership Scorecard',
    'Key metrics for leadership team performance'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample scorecard metrics
INSERT INTO scorecard_metrics (scorecard_id, name, description, goal, measurement_type, frequency, owner_id, sort_order) VALUES
(
    '223e4567-e89b-12d3-a456-426614174000',
    'Patient Satisfaction Score',
    'Weekly average patient satisfaction rating',
    4.5,
    'number',
    'weekly',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    1
),
(
    '223e4567-e89b-12d3-a456-426614174000',
    'Average Wait Time',
    'Average patient wait time in minutes',
    15.0,
    'number',
    'weekly',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    2
),
(
    '223e4567-e89b-12d3-a456-426614174000',
    'Revenue Target Achievement',
    'Percentage of weekly revenue target achieved',
    100.0,
    'percentage',
    'weekly',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    3
) ON CONFLICT DO NOTHING;

-- Insert sample issues
INSERT INTO issues (team_id, title, description, type, priority, status, created_by) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'EHR Training Delays',
    'Staff training on new EHR system is behind schedule',
    'process',
    'high',
    'identified',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Appointment Scheduling System Issues',
    'Patients reporting difficulty booking appointments online',
    'obstacle',
    'medium',
    'discussing',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Insert sample todos
INSERT INTO todos (team_id, title, description, assigned_to, created_by, due_date, status, priority) VALUES
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Complete EHR vendor evaluation',
    'Finish technical evaluation of remaining EHR vendors',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    '2025-01-20',
    'in_progress',
    'high'
),
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Update patient communication templates',
    'Revise automated patient communication templates for clarity',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1),
    '2025-01-25',
    'pending',
    'medium'
) ON CONFLICT DO NOTHING;

-- Insert sample meeting
INSERT INTO l10_meetings (id, team_id, title, scheduled_date, start_time, status, facilitator_id) VALUES
(
    '323e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Weekly Leadership L10',
    '2025-01-20',
    '09:00:00',
    'scheduled',
    (SELECT id FROM auth.users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;