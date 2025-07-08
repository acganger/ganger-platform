// Core type definitions for Staff Management System
// Based on API Interface Contract from PRD

import { GoogleUserData } from './database';

export interface Ticket {
  id: string;
  form_type: 'support_ticket' | 'time_off_request' | 'punch_fix' | 'change_of_availability';
  submitter: {
    id: string;
    email: string;
    name: string;
  };
  status: 'pending' | 'open' | 'in_progress' | 'stalled' | 'approved' | 'denied' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: 'Wixom' | 'Ann Arbor' | 'Plymouth';
  title: string; // max 200 chars
  description: string; // max 2000 chars
  form_data: Record<string, unknown>;
  assigned_to?: {
    id: string;
    email: string;
    name: string;
  };
  comments: Comment[];
  attachments: Attachment[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface Comment {
  id: string;
  ticket_id: string;
  author: {
    id: string;
    email: string;
    name: string;
  };
  content: string; // max 1000 chars
  is_internal: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface Attachment {
  id: string;
  ticket_id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
  uploaded_by: {
    id: string;
    email: string;
    name: string;
  };
  created_at: string; // ISO 8601
}

export interface UserProfile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  role: 'staff' | 'manager' | 'admin';
  location: 'Wixom' | 'Ann Arbor' | 'Plymouth';
  hire_date?: string; // ISO 8601 date
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  is_active: boolean;
  google_user_data?: GoogleUserData;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string; // ISO 8601
    request_id: string;
  };
}

// Form-specific data types
export interface SupportTicketFormData {
  location: 'Wixom' | 'Ann Arbor' | 'Plymouth';
  request_type: 'General Support' | 'Equipment Issue' | 'Software Problem' | 'Network Issue' | 'Other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  details: string; // max 2000 chars
  submitter_name: string;
  submitter_email: string;
  attachments: File[]; // max 10 files, 50MB total
}

export interface TimeOffRequestFormData {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  ptoElection: 'Paid Time Off' | 'Unpaid Leave' | 'Sick Leave';
  reason?: string; // max 500 chars
}

export interface PunchFixFormData {
  employeeSelect?: string; // For managers only
  date: Date;
  punchIn?: string; // time string
  punchOut?: string; // time string
  comments: string; // max 500 chars
}

export interface ChangeOfAvailabilityFormData {
  effectiveDate: Date;
  availabilityChanges: {
    dayOfWeek: string;
    startTime?: string;
    endTime?: string;
    isAvailable: boolean;
  }[];
  reason: string; // max 500 chars
}

// Filtering and UI state types
export interface TicketFilters {
  status?: Ticket['status'][];
  priority?: Ticket['priority'][];
  location?: Ticket['location'][];
  form_type?: Ticket['form_type'][];
  assigned_to?: string;
  date_range?: {
    start: Date | undefined;
    end: Date | undefined;
  };
  search?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

// UI state types
export interface UIState {
  sidebarOpen: boolean;
  currentView: 'list' | 'detail' | 'form';
  selectedTicket: string | null;
  filters: TicketFilters;
  notifications: Notification[];
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserProfile['role'];
  department: string;
  location: UserProfile['location'];
  avatar_url?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
}

// Real-time event types
export interface RealtimeEvent {
  type: 'ticket_created' | 'ticket_updated' | 'comment_added' | 'status_changed';
  payload: {
    ticket_id: string;
    user_id: string;
    timestamp: string;
    data: any;
  };
}

export type BreakpointType = 'mobile' | 'tablet' | 'desktop';

export interface FormFieldProps {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'date' | 'time' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: any; // Zod schema
}