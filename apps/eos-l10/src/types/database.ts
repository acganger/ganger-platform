// Database types for Supabase integration
// This will be generated/updated when backend database schema is created

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          owner_id: string;
          settings: any;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          owner_id: string;
          settings?: any;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          owner_id?: string;
          settings?: any;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: 'leader' | 'member' | 'viewer';
          seat: string;
          joined_at: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role: 'leader' | 'member' | 'viewer';
          seat: string;
          joined_at?: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: 'leader' | 'member' | 'viewer';
          seat?: string;
          joined_at?: string;
          active?: boolean;
        };
      };
      l10_meetings: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          scheduled_date: string;
          start_time: string;
          end_time: string | null;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          facilitator_id: string;
          agenda: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          scheduled_date: string;
          start_time: string;
          end_time?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          facilitator_id: string;
          agenda?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          scheduled_date?: string;
          start_time?: string;
          end_time?: string | null;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          facilitator_id?: string;
          agenda?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      rocks: {
        Row: {
          id: string;
          team_id: string;
          owner_id: string;
          title: string;
          description: string | null;
          quarter: string;
          status: 'not_started' | 'on_track' | 'off_track' | 'complete';
          completion_percentage: number;
          priority: number;
          due_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          owner_id: string;
          title: string;
          description?: string | null;
          quarter: string;
          status?: 'not_started' | 'on_track' | 'off_track' | 'complete';
          completion_percentage?: number;
          priority: number;
          due_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          quarter?: string;
          status?: 'not_started' | 'on_track' | 'off_track' | 'complete';
          completion_percentage?: number;
          priority?: number;
          due_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string | null;
          type: 'obstacle' | 'opportunity' | 'process' | 'people' | 'other';
          priority: 'low' | 'medium' | 'high' | 'critical';
          status: 'identified' | 'discussing' | 'solved' | 'dropped';
          owner_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          solved_at: string | null;
          solution: string | null;
          meeting_id: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          description?: string | null;
          type: 'obstacle' | 'opportunity' | 'process' | 'people' | 'other';
          priority: 'low' | 'medium' | 'high' | 'critical';
          status?: 'identified' | 'discussing' | 'solved' | 'dropped';
          owner_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          solved_at?: string | null;
          solution?: string | null;
          meeting_id?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          description?: string | null;
          type?: 'obstacle' | 'opportunity' | 'process' | 'people' | 'other';
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'identified' | 'discussing' | 'solved' | 'dropped';
          owner_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          solved_at?: string | null;
          solution?: string | null;
          meeting_id?: string | null;
        };
      };
      todos: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string | null;
          assigned_to: string;
          created_by: string;
          due_date: string;
          status: 'pending' | 'in_progress' | 'completed' | 'dropped';
          priority: 'low' | 'medium' | 'high';
          meeting_id: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          description?: string | null;
          assigned_to: string;
          created_by: string;
          due_date: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'dropped';
          priority: 'low' | 'medium' | 'high';
          meeting_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          description?: string | null;
          assigned_to?: string;
          created_by?: string;
          due_date?: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'dropped';
          priority?: 'low' | 'medium' | 'high';
          meeting_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scorecards: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          description?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          description?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      scorecard_metrics: {
        Row: {
          id: string;
          scorecard_id: string;
          name: string;
          description: string | null;
          goal: number;
          measurement_type: 'number' | 'percentage' | 'currency' | 'boolean';
          frequency: 'daily' | 'weekly' | 'monthly';
          owner_id: string;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          scorecard_id: string;
          name: string;
          description?: string | null;
          goal: number;
          measurement_type: 'number' | 'percentage' | 'currency' | 'boolean';
          frequency: 'daily' | 'weekly' | 'monthly';
          owner_id: string;
          active?: boolean;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          scorecard_id?: string;
          name?: string;
          description?: string | null;
          goal?: number;
          measurement_type?: 'number' | 'percentage' | 'currency' | 'boolean';
          frequency?: 'daily' | 'weekly' | 'monthly';
          owner_id?: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      scorecard_entries: {
        Row: {
          id: string;
          metric_id: string;
          value: number;
          week_ending: string;
          notes: string | null;
          status: 'green' | 'yellow' | 'red';
          entered_by: string;
          entered_at: string;
        };
        Insert: {
          id?: string;
          metric_id: string;
          value: number;
          week_ending: string;
          notes?: string | null;
          status: 'green' | 'yellow' | 'red';
          entered_by: string;
          entered_at: string;
        };
        Update: {
          id?: string;
          metric_id?: string;
          value?: number;
          week_ending?: string;
          notes?: string | null;
          status?: 'green' | 'yellow' | 'red';
          entered_by?: string;
          entered_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}