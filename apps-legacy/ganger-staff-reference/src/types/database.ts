// types/database.ts

// Supporting types for better type safety
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface GoogleUserData {
  google_id: string;
  picture?: string;
  locale?: string;
  hd?: string; // hosted domain
  verified_email?: boolean;
}

export interface Database {
  public: {
    Tables: {
      staff_user_profiles: {
        Row: {
          id: string;
          employee_id: string | null;
          full_name: string;
          email: string;
          department: string | null;
          role: 'staff' | 'manager' | 'admin';
          location: 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple' | null;
          hire_date: string | null;
          manager_id: string | null;
          is_active: boolean;
          phone_number: string | null;
          emergency_contact: EmergencyContact | null;
          google_user_data: GoogleUserData | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id?: string | null;
          full_name: string;
          email: string;
          department?: string | null;
          role?: 'staff' | 'manager' | 'admin';
          location?: 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple' | null;
          hire_date?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
          phone_number?: string | null;
          emergency_contact?: EmergencyContact | null;
          google_user_data?: GoogleUserData | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          full_name?: string;
          email?: string;
          department?: string | null;
          role?: 'staff' | 'manager' | 'admin';
          location?: 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple' | null;
          hire_date?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
          phone_number?: string | null;
          emergency_contact?: EmergencyContact | null;
          google_user_data?: GoogleUserData | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_form_definitions: {
        Row: {
          id: string;
          form_type: string;
          display_name: string;
          description: string | null;
          category: string | null;
          form_schema: any;
          ui_schema: any | null;
          workflow_config: any | null;
          notification_config: any | null;
          is_active: boolean;
          requires_manager_approval: boolean;
          requires_admin_approval: boolean;
          auto_assign_to: string | null;
          sla_hours: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_type: string;
          display_name: string;
          description?: string | null;
          category?: string | null;
          form_schema: any;
          ui_schema?: any | null;
          workflow_config?: any | null;
          notification_config?: any | null;
          is_active?: boolean;
          requires_manager_approval?: boolean;
          requires_admin_approval?: boolean;
          auto_assign_to?: string | null;
          sla_hours?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_type?: string;
          display_name?: string;
          description?: string | null;
          category?: string | null;
          form_schema?: any;
          ui_schema?: any | null;
          workflow_config?: any | null;
          notification_config?: any | null;
          is_active?: boolean;
          requires_manager_approval?: boolean;
          requires_admin_approval?: boolean;
          auto_assign_to?: string | null;
          sla_hours?: number | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          form_type: string;
          submitter_id: string | null;
          submitter_email: string;
          submitter_name: string;
          status: 'pending' | 'open' | 'in_progress' | 'stalled' | 'approved' | 'denied' | 'completed' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent' | null;
          location: 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple' | null;
          title: string;
          description: string | null;
          form_data: any;
          assigned_to: string | null;
          assigned_at: string | null;
          due_date: string | null;
          completed_at: string | null;
          approval_required: boolean;
          approved_by: string | null;
          approved_at: string | null;
          approval_notes: string | null;
          estimated_hours: number | null;
          actual_hours: number | null;
          tags: string[] | null;
          impact_level: 'low' | 'medium' | 'high' | 'critical' | null;
          urgency_level: 'low' | 'medium' | 'high' | 'critical' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number?: string;
          form_type: string;
          submitter_id?: string | null;
          submitter_email: string;
          submitter_name: string;
          status?: 'pending' | 'open' | 'in_progress' | 'stalled' | 'approved' | 'denied' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
          location?: 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple' | null;
          title: string;
          description?: string | null;
          form_data?: any;
          assigned_to?: string | null;
          assigned_at?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          approval_required?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          approval_notes?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          tags?: string[] | null;
          impact_level?: 'low' | 'medium' | 'high' | 'critical' | null;
          urgency_level?: 'low' | 'medium' | 'high' | 'critical' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          form_type?: string;
          submitter_id?: string | null;
          submitter_email?: string;
          submitter_name?: string;
          status?: 'pending' | 'open' | 'in_progress' | 'stalled' | 'approved' | 'denied' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
          location?: 'Northfield' | 'Woodbury' | 'Burnsville' | 'Multiple' | null;
          title?: string;
          description?: string | null;
          form_data?: any;
          assigned_to?: string | null;
          assigned_at?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          approval_required?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          approval_notes?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          tags?: string[] | null;
          impact_level?: 'low' | 'medium' | 'high' | 'critical' | null;
          urgency_level?: 'low' | 'medium' | 'high' | 'critical' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string | null;
          author_email: string;
          author_name: string;
          content: string;
          comment_type: 'comment' | 'status_change' | 'assignment' | 'approval' | 'system' | null;
          is_internal: boolean;
          mentions: string[] | null;
          previous_status: string | null;
          new_status: string | null;
          edited_at: string | null;
          edited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id?: string | null;
          author_email: string;
          author_name: string;
          content: string;
          comment_type?: 'comment' | 'status_change' | 'assignment' | 'approval' | 'system' | null;
          is_internal?: boolean;
          mentions?: string[] | null;
          previous_status?: string | null;
          new_status?: string | null;
          edited_at?: string | null;
          edited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          author_id?: string | null;
          author_email?: string;
          author_name?: string;
          content?: string;
          comment_type?: 'comment' | 'status_change' | 'assignment' | 'approval' | 'system' | null;
          is_internal?: boolean;
          mentions?: string[] | null;
          previous_status?: string | null;
          new_status?: string | null;
          edited_at?: string | null;
          edited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_attachments: {
        Row: {
          id: string;
          ticket_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          mime_type: string | null;
          storage_path: string;
          storage_bucket: string | null;
          download_url: string | null;
          url_expires_at: string | null;
          is_image: boolean;
          thumbnail_path: string | null;
          virus_scan_status: 'pending' | 'clean' | 'infected' | 'error' | null;
          virus_scan_result: any | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          mime_type?: string | null;
          storage_path: string;
          storage_bucket?: string | null;
          download_url?: string | null;
          url_expires_at?: string | null;
          is_image?: boolean;
          thumbnail_path?: string | null;
          virus_scan_status?: 'pending' | 'clean' | 'infected' | 'error' | null;
          virus_scan_result?: any | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          mime_type?: string | null;
          storage_path?: string;
          storage_bucket?: string | null;
          download_url?: string | null;
          url_expires_at?: string | null;
          is_image?: boolean;
          thumbnail_path?: string | null;
          virus_scan_status?: 'pending' | 'clean' | 'infected' | 'error' | null;
          virus_scan_result?: any | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      staff_notifications: {
        Row: {
          id: string;
          user_id: string;
          ticket_id: string | null;
          type: 'status_change' | 'new_comment' | 'assignment' | 'approval_required' | 'approval_decision' | 'due_date_reminder' | 'escalation' | 'mention' | 'system';
          title: string;
          message: string;
          action_url: string | null;
          channels: string[] | null;
          delivery_status: any | null;
          priority: 'low' | 'normal' | 'high' | 'urgent' | null;
          read_at: string | null;
          sent_at: string | null;
          scheduled_for: string | null;
          expires_at: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ticket_id?: string | null;
          type: 'status_change' | 'new_comment' | 'assignment' | 'approval_required' | 'approval_decision' | 'due_date_reminder' | 'escalation' | 'mention' | 'system';
          title: string;
          message: string;
          action_url?: string | null;
          channels?: string[] | null;
          delivery_status?: any | null;
          priority?: 'low' | 'normal' | 'high' | 'urgent' | null;
          read_at?: string | null;
          sent_at?: string | null;
          scheduled_for?: string | null;
          expires_at?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ticket_id?: string | null;
          type?: 'status_change' | 'new_comment' | 'assignment' | 'approval_required' | 'approval_decision' | 'due_date_reminder' | 'escalation' | 'mention' | 'system';
          title?: string;
          message?: string;
          action_url?: string | null;
          channels?: string[] | null;
          delivery_status?: any | null;
          priority?: 'low' | 'normal' | 'high' | 'urgent' | null;
          read_at?: string | null;
          sent_at?: string | null;
          scheduled_for?: string | null;
          expires_at?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
      staff_analytics: {
        Row: {
          id: string;
          event_type: 'ticket_created' | 'ticket_updated' | 'ticket_completed' | 'comment_added' | 'file_uploaded' | 'user_login' | 'user_logout' | 'form_submitted' | 'approval_given' | 'assignment_changed' | 'status_changed';
          user_id: string | null;
          ticket_id: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          duration_ms: number | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: 'ticket_created' | 'ticket_updated' | 'ticket_completed' | 'comment_added' | 'file_uploaded' | 'user_login' | 'user_logout' | 'form_submitted' | 'approval_given' | 'assignment_changed' | 'status_changed';
          user_id?: string | null;
          ticket_id?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          duration_ms?: number | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: 'ticket_created' | 'ticket_updated' | 'ticket_completed' | 'comment_added' | 'file_uploaded' | 'user_login' | 'user_logout' | 'form_submitted' | 'approval_given' | 'assignment_changed' | 'status_changed';
          user_id?: string | null;
          ticket_id?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          duration_ms?: number | null;
          metadata?: any | null;
          created_at?: string;
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