-- EOS L10 Database Schema Migration
-- Based on captured ninety.io data structures
-- Created: 2025-06-18 
-- Compliance: @ganger/db patterns with platform standards

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TEAMS & COMPANIES
-- ============================================================================

-- Companies table (maps to ninety.io company structure)
CREATE TABLE IF NOT EXISTS l10_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io company ID for migration
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Teams table (maps to ninety.io team structure)
CREATE TABLE IF NOT EXISTS l10_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io team ID for migration
  company_id UUID REFERENCES l10_companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_project BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}', -- Meeting schedules, agendas, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Team members (maps to ninety.io user relationships)
CREATE TABLE IF NOT EXISTS l10_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES l10_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- member, leader, facilitator
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(team_id, user_id)
);

-- ============================================================================
-- ROCKS (Quarterly Goals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS l10_rocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io rock ID for migration
  team_id UUID REFERENCES l10_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Rock owner
  company_id UUID REFERENCES l10_companies(id) ON DELETE CASCADE,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  original_due_date TIMESTAMPTZ,
  due_date_quarter VARCHAR(50), -- "2025 Q2"
  
  status_code VARCHAR(10) DEFAULT '0001', -- ninety.io status codes
  level_code VARCHAR(10) DEFAULT '0000',  -- ninety.io level codes
  
  user_ordinal INTEGER DEFAULT 0,
  ordinal INTEGER DEFAULT 0,
  
  archived BOOLEAN DEFAULT false,
  archived_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Rock followers (for notifications)
CREATE TABLE IF NOT EXISTS l10_rock_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rock_id UUID REFERENCES l10_rocks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(rock_id, user_id)
);

-- Rock comments
CREATE TABLE IF NOT EXISTS l10_rock_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rock_id UUID REFERENCES l10_rocks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TODOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS l10_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io todo ID for migration
  team_id UUID REFERENCES l10_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Todo assignee
  company_id UUID REFERENCES l10_companies(id) ON DELETE CASCADE,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  original_due_date TIMESTAMPTZ,
  
  completed BOOLEAN DEFAULT false,
  completed_date TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false,
  archived_date TIMESTAMPTZ,
  
  repeat_setting VARCHAR(100) DEFAULT 'Don''t repeat',
  due_date_changed BOOLEAN DEFAULT false,
  auto_generated BOOLEAN DEFAULT false,
  is_personal BOOLEAN DEFAULT false,
  
  ordinal INTEGER DEFAULT 0,
  user_ordinal INTEGER DEFAULT 0,
  
  -- Google Tasks integration (future)
  google_task_id VARCHAR(255),
  google_task_list_id VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Todo followers
CREATE TABLE IF NOT EXISTS l10_todo_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID REFERENCES l10_todos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(todo_id, user_id)
);

-- Todo comments
CREATE TABLE IF NOT EXISTS l10_todo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID REFERENCES l10_todos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ISSUES (IDS - Identify, Discuss, Solve)
-- ============================================================================

CREATE TABLE IF NOT EXISTS l10_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io issue ID for migration
  team_id UUID REFERENCES l10_teams(id) ON DELETE CASCADE,
  company_id UUID REFERENCES l10_companies(id) ON DELETE CASCADE,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  status VARCHAR(50) DEFAULT 'identified', -- identified, discussing, solved, dropped
  priority VARCHAR(50) DEFAULT 'medium',  -- critical, high, medium, low
  
  archived BOOLEAN DEFAULT false,
  archived_date TIMESTAMPTZ,
  solved_at TIMESTAMPTZ,
  
  interval_code VARCHAR(10), -- ninety.io interval codes
  is_public BOOLEAN DEFAULT true,
  
  ordinal INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Issue comments
CREATE TABLE IF NOT EXISTS l10_issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES l10_issues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SCORECARD & MEASURABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS l10_measurables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io measurable ID
  team_id UUID REFERENCES l10_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Measurable owner
  company_id UUID REFERENCES l10_companies(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2),
  unit VARCHAR(50), -- %, $, count, etc.
  
  period_interval VARCHAR(50) DEFAULT 'weekly', -- weekly, monthly, quarterly
  is_active BOOLEAN DEFAULT true,
  
  ordinal INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Measurable data points
CREATE TABLE IF NOT EXISTS l10_measurable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measurable_id UUID REFERENCES l10_measurables(id) ON DELETE CASCADE,
  
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  actual_value DECIMAL(10,2),
  target_value DECIMAL(10,2),
  
  is_on_track BOOLEAN,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(measurable_id, period_start)
);

-- ============================================================================
-- MEETINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS l10_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io meeting ID
  team_id UUID REFERENCES l10_teams(id) ON DELETE CASCADE,
  company_id UUID REFERENCES l10_companies(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- weekly, quarterly, annual, focus_day, etc.
  title VARCHAR(255),
  
  scheduled_date TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  
  agenda JSONB DEFAULT '[]', -- Meeting agenda items
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Meeting participants
CREATE TABLE IF NOT EXISTS l10_meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES l10_meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  status VARCHAR(50) DEFAULT 'invited', -- invited, confirmed, attended, declined
  role VARCHAR(50) DEFAULT 'participant', -- participant, facilitator, note_taker
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(meeting_id, user_id)
);

-- Meeting agenda items timing
CREATE TABLE IF NOT EXISTS l10_meeting_agenda_timing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES l10_meetings(id) ON DELETE CASCADE,
  
  agenda_item VARCHAR(255) NOT NULL,
  planned_duration INTEGER, -- seconds
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  actual_duration INTEGER, -- seconds
  
  ordinal INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HEADLINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS l10_headlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_id VARCHAR(255) UNIQUE, -- Original ninety.io headline ID
  team_id UUID REFERENCES l10_teams(id) ON DELETE CASCADE,
  company_id UUID REFERENCES l10_companies(id) ON DELETE CASCADE,
  
  title VARCHAR(500) NOT NULL,
  content TEXT,
  
  type VARCHAR(50) DEFAULT 'general', -- customer, employee, general
  
  archived BOOLEAN DEFAULT false,
  archived_date TIMESTAMPTZ,
  is_discussed BOOLEAN DEFAULT false,
  discussed_date TIMESTAMPTZ,
  
  is_cascaded_message BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Teams
CREATE INDEX IF NOT EXISTS idx_l10_teams_company_id ON l10_teams(company_id);
CREATE INDEX IF NOT EXISTS idx_l10_teams_ninety_id ON l10_teams(ninety_id);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_l10_team_members_team_id ON l10_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_l10_team_members_user_id ON l10_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_l10_team_members_active ON l10_team_members(team_id, is_active);

-- Rocks
CREATE INDEX IF NOT EXISTS idx_l10_rocks_team_id ON l10_rocks(team_id);
CREATE INDEX IF NOT EXISTS idx_l10_rocks_user_id ON l10_rocks(user_id);
CREATE INDEX IF NOT EXISTS idx_l10_rocks_due_date ON l10_rocks(due_date);
CREATE INDEX IF NOT EXISTS idx_l10_rocks_archived ON l10_rocks(team_id, archived);

-- Todos
CREATE INDEX IF NOT EXISTS idx_l10_todos_team_id ON l10_todos(team_id);
CREATE INDEX IF NOT EXISTS idx_l10_todos_user_id ON l10_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_l10_todos_due_date ON l10_todos(due_date);
CREATE INDEX IF NOT EXISTS idx_l10_todos_completed ON l10_todos(team_id, completed, archived);

-- Issues
CREATE INDEX IF NOT EXISTS idx_l10_issues_team_id ON l10_issues(team_id);
CREATE INDEX IF NOT EXISTS idx_l10_issues_status ON l10_issues(team_id, status);
CREATE INDEX IF NOT EXISTS idx_l10_issues_archived ON l10_issues(team_id, archived);

-- Measurables
CREATE INDEX IF NOT EXISTS idx_l10_measurables_team_id ON l10_measurables(team_id);
CREATE INDEX IF NOT EXISTS idx_l10_measurables_user_id ON l10_measurables(user_id);
CREATE INDEX IF NOT EXISTS idx_l10_measurable_data_period ON l10_measurable_data(measurable_id, period_start);

-- Meetings
CREATE INDEX IF NOT EXISTS idx_l10_meetings_team_id ON l10_meetings(team_id);
CREATE INDEX IF NOT EXISTS idx_l10_meetings_date ON l10_meetings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_l10_meetings_status ON l10_meetings(team_id, status);

-- Headlines
CREATE INDEX IF NOT EXISTS idx_l10_headlines_team_id ON l10_headlines(team_id);
CREATE INDEX IF NOT EXISTS idx_l10_headlines_archived ON l10_headlines(team_id, archived);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE l10_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_rocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_rock_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_rock_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_todo_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_todo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_measurables ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_measurable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_meeting_agenda_timing ENABLE ROW LEVEL SECURITY;
ALTER TABLE l10_headlines ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only see companies they're associated with
CREATE POLICY "Users can view companies they're members of" ON l10_companies
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT company_id FROM l10_teams t
      JOIN l10_team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid() AND tm.is_active = true
    )
  );

-- Teams: Users can only see teams they're members of  
CREATE POLICY "Users can view teams they're members of" ON l10_teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Team Members: Users can see team members for teams they're in
CREATE POLICY "Users can view team members for their teams" ON l10_team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Rocks: Users can see rocks for teams they're members of
CREATE POLICY "Users can view rocks for their teams" ON l10_rocks
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Todos: Users can see todos for teams they're members of
CREATE POLICY "Users can view todos for their teams" ON l10_todos
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Issues: Users can see issues for teams they're members of
CREATE POLICY "Users can view issues for their teams" ON l10_issues
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Measurables: Users can see measurables for teams they're members of
CREATE POLICY "Users can view measurables for their teams" ON l10_measurables
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Meetings: Users can see meetings for teams they're members of
CREATE POLICY "Users can view meetings for their teams" ON l10_meetings
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Headlines: Users can see headlines for teams they're members of
CREATE POLICY "Users can view headlines for their teams" ON l10_headlines
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Insert/Update policies for team leaders
CREATE POLICY "Team leaders can manage team data" ON l10_rocks
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM l10_team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('leader', 'facilitator')
    )
  );

-- Similar policies for other tables...
-- (Additional policies can be added as needed)

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_l10_companies_updated_at BEFORE UPDATE ON l10_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_teams_updated_at BEFORE UPDATE ON l10_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_team_members_updated_at BEFORE UPDATE ON l10_team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_rocks_updated_at BEFORE UPDATE ON l10_rocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_rock_comments_updated_at BEFORE UPDATE ON l10_rock_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_todos_updated_at BEFORE UPDATE ON l10_todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_todo_comments_updated_at BEFORE UPDATE ON l10_todo_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_issues_updated_at BEFORE UPDATE ON l10_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_issue_comments_updated_at BEFORE UPDATE ON l10_issue_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_measurables_updated_at BEFORE UPDATE ON l10_measurables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_measurable_data_updated_at BEFORE UPDATE ON l10_measurable_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_meetings_updated_at BEFORE UPDATE ON l10_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_meeting_participants_updated_at BEFORE UPDATE ON l10_meeting_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_meeting_agenda_timing_updated_at BEFORE UPDATE ON l10_meeting_agenda_timing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_l10_headlines_updated_at BEFORE UPDATE ON l10_headlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Insert initial Ganger Dermatology company record if it doesn't exist
INSERT INTO l10_companies (ninety_id, name, created_by)
SELECT '65f5c6312caa0d0012965019', 'Ganger Dermatology', 
  (SELECT id FROM users WHERE email = 'anand@gangerdermatology.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM l10_companies WHERE ninety_id = '65f5c6312caa0d0012965019');

-- Migration schema created successfully
-- Ready for data import from ninety.io captured data