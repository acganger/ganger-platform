-- EOS L10 Database Schema
-- Based on types from apps/eos-l10/src/types/eos.ts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS eos_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{
        "meeting_day": "Monday",
        "meeting_time": "09:00",
        "timezone": "America/New_York",
        "meeting_duration": 90,
        "scorecard_frequency": "weekly",
        "rock_quarters": ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]
    }'::jsonb
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member', 'viewer')),
    seat VARCHAR(255), -- The person's role/seat in the company
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- L10 Meetings table
CREATE TABLE IF NOT EXISTS l10_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    facilitator_id UUID REFERENCES auth.users(id),
    agenda JSONB DEFAULT '{
        "segue": {"duration": 5, "completed": false},
        "scorecard": {"duration": 5, "completed": false},
        "rock_review": {"duration": 5, "completed": false},
        "customer_employee_headlines": {"duration": 5, "completed": false},
        "todo_review": {"duration": 5, "completed": false},
        "ids": {"duration": 60, "completed": false},
        "conclude": {"duration": 5, "completed": false}
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rocks (Quarterly Goals) table
CREATE TABLE IF NOT EXISTS rocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quarter VARCHAR(10) NOT NULL, -- 'Q1 2025'
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'on_track', 'off_track', 'complete')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rock milestones table
CREATE TABLE IF NOT EXISTS rock_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rock_id UUID REFERENCES rocks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scorecards table
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scorecard metrics table
CREATE TABLE IF NOT EXISTS scorecard_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scorecard_id UUID REFERENCES scorecards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal DECIMAL(10,2) NOT NULL,
    measurement_type VARCHAR(20) DEFAULT 'number' CHECK (measurement_type IN ('number', 'percentage', 'currency', 'boolean')),
    frequency VARCHAR(20) DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    owner_id UUID REFERENCES auth.users(id),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scorecard entries table
CREATE TABLE IF NOT EXISTS scorecard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id UUID REFERENCES scorecard_metrics(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    week_ending DATE NOT NULL,
    notes TEXT,
    status VARCHAR(10) DEFAULT 'yellow' CHECK (status IN ('green', 'yellow', 'red')),
    entered_by UUID REFERENCES auth.users(id),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_id, week_ending)
);

-- Issues table (IDS - Identify, Discuss, Solve)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'other' CHECK (type IN ('obstacle', 'opportunity', 'process', 'people', 'other')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'identified' CHECK (status IN ('identified', 'discussing', 'solved', 'dropped')),
    owner_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    solved_at TIMESTAMP WITH TIME ZONE,
    solution TEXT,
    meeting_id UUID REFERENCES l10_meetings(id)
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dropped')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    meeting_id UUID REFERENCES l10_meetings(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES l10_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(10) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
    cursor_position JSONB,
    UNIQUE(meeting_id, user_id)
);

-- Meeting activity table
CREATE TABLE IF NOT EXISTS meeting_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES l10_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team notifications table
CREATE TABLE IF NOT EXISTS team_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'general' CHECK (type IN ('meeting_reminder', 'rock_due', 'todo_assigned', 'scorecard_missing', 'issue_created', 'general')),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GWC Assessments table
CREATE TABLE IF NOT EXISTS gwc_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- 'Q1 2025'
    get_it INTEGER CHECK (get_it >= 1 AND get_it <= 5),
    want_it INTEGER CHECK (want_it >= 1 AND want_it <= 5),
    capacity INTEGER CHECK (capacity >= 1 AND capacity <= 5),
    overall_score DECIMAL(3,2),
    notes TEXT,
    assessed_by UUID REFERENCES auth.users(id),
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_member_id, period)
);

-- Vision/Traction Organizer table
CREATE TABLE IF NOT EXISTS vision_traction_organizer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES eos_teams(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT true,
    core_values TEXT[],
    core_focus JSONB DEFAULT '{}'::jsonb,
    ten_year_target TEXT,
    marketing_strategy JSONB DEFAULT '{}'::jsonb,
    three_year_picture TEXT,
    one_year_plan JSONB DEFAULT '{}'::jsonb,
    quarterly_rocks TEXT[],
    issues_list TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rocks_team_id ON rocks(team_id);
CREATE INDEX IF NOT EXISTS idx_rocks_owner_id ON rocks(owner_id);
CREATE INDEX IF NOT EXISTS idx_rocks_quarter ON rocks(quarter);
CREATE INDEX IF NOT EXISTS idx_issues_team_id ON issues(team_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_todos_team_id ON todos(team_id);
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_scorecard_entries_metric_id ON scorecard_entries(metric_id);
CREATE INDEX IF NOT EXISTS idx_scorecard_entries_week_ending ON scorecard_entries(week_ending);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_eos_teams_updated_at BEFORE UPDATE ON eos_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_meetings_updated_at BEFORE UPDATE ON l10_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rocks_updated_at BEFORE UPDATE ON rocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scorecards_updated_at BEFORE UPDATE ON scorecards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vision_traction_organizer_updated_at BEFORE UPDATE ON vision_traction_organizer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies
ALTER TABLE eos_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rock_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gwc_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_traction_organizer ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access teams they're members of)
CREATE POLICY "Users can view teams they're members of" ON eos_teams FOR SELECT
    USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view team members for their teams" ON team_members FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view rocks for their teams" ON rocks FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view issues for their teams" ON issues FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view todos for their teams" ON todos FOR SELECT
    USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Add similar policies for other tables...
-- (In production, you'd want more granular policies based on roles)