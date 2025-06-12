// Core EOS Types for L10 Management Platform

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  settings: TeamSettings;
}

export interface TeamSettings {
  meeting_day: string; // Monday, Tuesday, etc.
  meeting_time: string; // HH:MM format
  timezone: string;
  meeting_duration: number; // minutes
  scorecard_frequency: 'weekly' | 'monthly';
  rock_quarters: string[]; // ['Q1 2025', 'Q2 2025', ...]
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'leader' | 'member' | 'viewer';
  seat: string; // The person's seat/role in the company
  joined_at: string;
  active: boolean;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Level 10 Meeting Types
export interface L10Meeting {
  id: string;
  team_id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  facilitator_id: string;
  agenda: L10Agenda;
  created_at: string;
  updated_at: string;
}

export interface L10Agenda {
  segue: { duration: number; completed: boolean };
  scorecard: { duration: number; completed: boolean };
  rock_review: { duration: number; completed: boolean };
  customer_employee_headlines: { duration: number; completed: boolean };
  todo_review: { duration: number; completed: boolean };
  ids: { duration: number; completed: boolean }; // Issues-Discussion-Solutions
  conclude: { duration: number; completed: boolean };
}

// Rocks (Quarterly Goals) Types
export interface Rock {
  id: string;
  team_id: string;
  owner_id: string;
  title: string;
  description?: string;
  quarter: string; // 'Q1 2025'
  status: 'not_started' | 'on_track' | 'off_track' | 'complete';
  completion_percentage: number;
  priority: number; // 1-10
  due_date: string;
  created_at: string;
  updated_at: string;
  milestones?: RockMilestone[];
  owner?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface RockMilestone {
  id: string;
  rock_id: string;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

// Scorecard Types
export interface Scorecard {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  metrics: ScorecardMetric[];
}

export interface ScorecardMetric {
  id: string;
  scorecard_id: string;
  name: string;
  description?: string;
  goal: number;
  measurement_type: 'number' | 'percentage' | 'currency' | 'boolean';
  frequency: 'daily' | 'weekly' | 'monthly';
  owner_id: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  owner?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ScorecardEntry {
  id: string;
  metric_id: string;
  value: number;
  week_ending: string; // YYYY-MM-DD
  notes?: string;
  status: 'green' | 'yellow' | 'red';
  entered_by: string;
  entered_at: string;
}

// Issues (IDS - Identify, Discuss, Solve) Types
export interface Issue {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  type: 'obstacle' | 'opportunity' | 'process' | 'people' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'identified' | 'discussing' | 'solved' | 'dropped';
  owner_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  solved_at?: string;
  solution?: string;
  meeting_id?: string; // If discussed in a specific meeting
}

// Todos Types
export interface Todo {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  created_by: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dropped';
  priority: 'low' | 'medium' | 'high';
  meeting_id?: string; // If created in a meeting
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// People Management Types (GWC - Get it, Want it, Capacity)
export interface GWCAssessment {
  id: string;
  team_member_id: string;
  period: string; // 'Q1 2025'
  get_it: number; // 1-5 scale
  want_it: number; // 1-5 scale
  capacity: number; // 1-5 scale
  overall_score: number;
  notes?: string;
  assessed_by: string;
  assessed_at: string;
}

// Vision/Traction Organizer (V/TO) Types
export interface VisionTractionOrganizer {
  id: string;
  team_id: string;
  version: string;
  active: boolean;
  core_values: string[];
  core_focus: {
    purpose: string;
    niche: string;
  };
  ten_year_target: string;
  marketing_strategy: {
    target_market: string;
    three_uniques: string[];
    proven_process: string[];
  };
  three_year_picture: string;
  one_year_plan: {
    revenue_goal: number;
    profit_goal: number;
    measurables: string[];
  };
  quarterly_rocks: string[];
  issues_list: string[];
  created_at: string;
  updated_at: string;
}

// Real-time Collaboration Types
export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  status: 'online' | 'away' | 'offline';
  cursor_position?: {
    x: number;
    y: number;
    element_id?: string;
  };
}

export interface MeetingActivity {
  id: string;
  meeting_id: string;
  user_id: string;
  action: 'joined' | 'left' | 'updated_rock' | 'created_issue' | 'completed_todo' | 'scorecard_entry';
  details: Record<string, any>;
  timestamp: string;
}

// Notification Types
export interface TeamNotification {
  id: string;
  team_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'meeting_reminder' | 'rock_due' | 'todo_assigned' | 'scorecard_missing' | 'issue_created';
  read: boolean;
  action_url?: string;
  created_at: string;
}

// Dashboard Analytics Types
export interface TeamAnalytics {
  rock_completion_rate: number;
  scorecard_compliance: number;
  meeting_attendance: number;
  issue_resolution_time: number; // average days
  todo_completion_rate: number;
  trend_data: {
    period: string;
    metrics: Record<string, number>;
  }[];
}

// Mobile/Offline Types
export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'rock' | 'issue' | 'todo' | 'scorecard_entry';
  data: Record<string, any>;
  timestamp: string;
  synced: boolean;
}

// Form Types
export type CreateTeamForm = Pick<Team, 'name' | 'description'> & {
  meeting_day: string;
  meeting_time: string;
  timezone: string;
};

export type CreateRockForm = Pick<Rock, 'title' | 'description' | 'quarter' | 'due_date' | 'priority'> & {
  owner_id: string;
};

export type CreateIssueForm = Pick<Issue, 'title' | 'description' | 'type' | 'priority'> & {
  owner_id?: string;
};

export type CreateTodoForm = Pick<Todo, 'title' | 'description' | 'due_date' | 'priority'> & {
  assigned_to: string;
};

export type ScorecardEntryForm = Pick<ScorecardEntry, 'value' | 'notes'> & {
  metric_id: string;
  week_ending: string;
};