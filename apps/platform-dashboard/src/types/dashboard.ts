// Dashboard Types and Interfaces
// Terminal 2: Backend Implementation

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'manager' | 'superadmin';
  primary_location: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  widget_id: string;
  display_name: string;
  description?: string;
  category: 'application' | 'information' | 'action' | 'communication';
  icon_url?: string;
  supports_resize: boolean;
  min_width: number;
  min_height: number;
  max_width: number;
  max_height: number;
  source_application?: string;
  data_endpoint?: string;
  refresh_interval_seconds: number;
  required_permissions: string[];
  required_roles: string[];
  is_active: boolean;
  is_system_widget: boolean;
  created_at: string;
  updated_at: string;
  // User arrangement properties (added when fetched for specific user)
  size?: {
    width: number;
    height: number;
  };
  position?: number;
  configuration?: WidgetConfiguration;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  layout_columns: number;
  widget_arrangement: WidgetArrangement[];
  theme_preference: 'light' | 'dark' | 'system';
  show_weather: boolean;
  show_team_activity: boolean;
  show_recent_documents: boolean;
  show_upcoming_meetings: boolean;
  desktop_notifications: boolean;
  notification_sound: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  pinned_applications: string[];
  custom_quick_actions: CustomQuickAction[];
  created_at: string;
  updated_at: string;
}

export interface WidgetArrangement {
  widget_id: string;
  position: number;
  size: {
    width: number;
    height: number;
  };
}

export interface CustomQuickAction {
  id: string;
  name: string;
  icon: string;
  action: string;
  target: string;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  url: string;
  icon_url?: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  required_roles?: string[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  display_start: string;
  display_end?: string;
  target_roles?: string[];
  is_dismissible: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuickAction {
  id: string;
  action_id: string;
  display_name: string;
  description?: string;
  icon_name: string;
  button_color: string;
  action_type: 'app_launch' | 'external_link' | 'modal_form' | 'api_call';
  action_target: string;
  opens_in_new_tab: boolean;
  required_permissions: string[];
  required_roles: string[];
  category: string;
  display_order: number;
  is_system_action: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action_type: string;
  action_description: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  url?: string;
  icon_url?: string;
  type: string;
}

export interface SearchResults {
  applications: Application[];
  help: Array<{
    id: string;
    title: string;
    excerpt: string;
    url: string;
  }>;
  total_results: number;
  query_time_ms: number;
}

export interface WidgetData {
  [key: string]: any;
}

export interface DashboardData {
  user: User;
  widgets: DashboardWidget[];
  preferences: UserPreferences | null;
  applications: Application[];
  notifications: Notification[];
  announcements: PlatformAnnouncement[];
  quick_actions: QuickAction[];
  recent_activity: UserActivity[];
}

export interface PresenceUser {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  online_at: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

export interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    response_status?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
}

export interface WeatherInfo {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number;
  wind_speed?: number;
}

// Widget configuration types (backend data structure)
export interface WidgetConfiguration {
  app_launcher?: {
    show_recent: boolean;
    max_recent: number;
    show_quick_launch: boolean;
  };
  notifications?: {
    max_visible: number;
    auto_mark_read: boolean;
    show_timestamps: boolean;
  };
  team_activity?: {
    timeframe: 'today' | 'week' | 'month';
    max_items: number;
    show_avatars: boolean;
  };
  quick_actions?: {
    layout: 'grid' | 'list';
    items_per_row: number;
    show_descriptions: boolean;
  };
  upcoming_meetings?: {
    max_meetings: number;
    show_details: boolean;
    calendar_integration: boolean;
  };
  // Backend metadata properties
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  lastUpdated?: string;
  cacheExpiry?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Event types for real-time updates
export interface RealtimeEvent {
  type: 'notification' | 'announcement' | 'presence' | 'activity';
  payload: any;
  timestamp: string;
}

// Additional Backend Types

export interface ApplicationHealthStatus {
  id: string;
  application_name: string;
  health_check_url?: string;
  current_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  last_check_at: string;
  response_time_ms?: number;
  error_message?: string;
  uptime_percentage?: number;
  avg_response_time_24h?: number;
  incidents_count_7d: number;
  alert_threshold_ms: number;
  alert_enabled: boolean;
  updated_at: string;
}

export interface DashboardMetric {
  id: string;
  metric_type: string;
  metric_date: string;
  metric_value: number;
  metric_metadata: Record<string, any>;
  user_role?: string;
  location_name?: string;
  application_name?: string;
  recorded_at: string;
}

export interface SearchIndexItem {
  id: string;
  content_type: 'application' | 'help_article' | 'user' | 'document';
  content_id: string;
  title: string;
  content: string;
  excerpt?: string;
  keywords: string[];
  categories: string[];
  required_permissions: string[];
  required_roles: string[];
  url?: string;
  icon_url?: string;
  last_modified: string;
  indexed_at: string;
}

export interface WidgetDataCache {
  id: string;
  widget_id: string;
  user_id: string;
  data_content: any;
  data_hash: string;
  cached_at: string;
  expires_at: string;
  last_accessed: string;
  generation_time_ms?: number;
  cache_hits: number;
}

// Widget-specific data interfaces
export interface WidgetData {
  timestamp: string;
  error?: string;
}

export interface ApplicationLauncherData extends WidgetData {
  applications: Application[];
  recentApps: Application[];
  totalApps: number;
}

export interface NotificationCenterData extends WidgetData {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

export interface TeamActivityData extends WidgetData {
  activities: TeamActivity[];
  teamMemberCount: number;
  activeToday: number;
}

export interface UpcomingMeetingsData extends WidgetData {
  meetings: Meeting[];
  totalMeetings: number;
}

export interface QuickActionsData extends WidgetData {
  actions: QuickAction[];
  totalActions: number;
}

export interface SystemHealthData extends WidgetData {
  applications: ApplicationHealthStatus[];
  healthyCount: number;
  totalCount: number;
  overallHealth: number;
}

// Supporting interfaces
export interface TeamActivity {
  id: string;
  user_id: string;
  activity_type: string;
  target_app?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

// API Response types
export interface DashboardDataResponse {
  success: boolean;
  data: {
    preferences: UserPreferences;
    widgets: WidgetArrangement[];
    widgetData: Record<string, any>;
    announcements: PlatformAnnouncement[];
    quickActions: QuickAction[];
    userInfo: {
      id: string;
      name: string;
      email: string;
      role: string;
      location: string;
      avatar_url?: string;
    };
  };
  error?: string;
}

export interface SearchResponse {
  success: boolean;
  results: {
    applications: SearchResult[];
    help: SearchResult[];
    users: SearchResult[];
    documents: SearchResult[];
  };
  totalResults: number;
  error?: string;
}

export interface QuickActionResponse {
  success: boolean;
  result: any;
  action_type: string;
  error?: string;
}