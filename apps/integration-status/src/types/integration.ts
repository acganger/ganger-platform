// Core Integration Types
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown' | 'maintenance';
export type ServiceType = 'api' | 'database' | 'storage' | 'payment' | 'communication' | 'calendar' | 'analytics' | 'other';
export type AuthType = 'oauth2' | 'api_key' | 'bearer_token' | 'basic_auth' | 'custom';
export type Environment = 'production' | 'staging' | 'development';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

// Main Integration Interface
export interface Integration {
  id: string;
  name: string;
  display_name: string;
  description: string;
  service_type: ServiceType;
  health_status: HealthStatus;
  base_url: string;
  auth_type: AuthType;
  environment: Environment;
  is_active: boolean;
  icon_url?: string;
  
  // Status Information
  last_health_check: string;
  last_successful_check: string;
  next_health_check: string;
  health_check_interval: number; // seconds
  
  // Configuration
  config: IntegrationConfig;
  dependencies?: IntegrationDependency[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  tags?: string[];
}

// Integration Configuration
export interface IntegrationConfig {
  timeout: number;
  retry_attempts: number;
  alert_thresholds: AlertThresholds;
  monitoring_enabled: boolean;
  maintenance_windows?: MaintenanceWindow[];
  custom_headers?: Record<string, string>;
  endpoints?: HealthCheckEndpoint[];
}

// Alert Configuration
export interface AlertThresholds {
  response_time_warning: number; // ms
  response_time_critical: number; // ms
  uptime_warning: number; // percentage
  uptime_critical: number; // percentage
  error_rate_warning: number; // percentage
  error_rate_critical: number; // percentage
}

// Health Check Endpoints
export interface HealthCheckEndpoint {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'HEAD';
  expected_status: number;
  expected_response?: string;
  timeout: number;
}

// Integration Dependencies
export interface IntegrationDependency {
  name: string;
  integration_id?: string;
  status: HealthStatus;
  required: boolean;
  description?: string;
}

// Maintenance Windows
export interface MaintenanceWindow {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  recurring?: boolean;
  recurrence_pattern?: string;
}

// Service Metrics
export interface ServiceMetrics {
  integration_id: string;
  timestamp: string;
  
  // Performance Metrics
  uptime_percentage: number;
  avg_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  
  // Request Metrics
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  error_count: number;
  requests_per_hour: number;
  
  // Trend Data
  uptime_trend?: number;
  response_time_trend?: number;
  success_rate_trend?: number;
  error_change?: number;
  requests_change?: number;
  p95_change?: number;
  success_rate_change?: number;
  
  // Historical Data
  performance_history?: MetricDataPoint[];
  error_history?: MetricDataPoint[];
  uptime_history?: MetricDataPoint[];
  
  // Thresholds
  error_threshold?: number;
}

// Metric Data Point for Charts
export interface MetricDataPoint {
  timestamp: string;
  value: number;
  response_time?: number;
  success_rate?: number;
  error_count?: number;
  uptime?: number;
}

// Incident Reports
export interface IncidentReport {
  id: string;
  integration_id: string;
  integration_name: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  
  // Timing
  started_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  duration?: number; // seconds
  
  // Impact
  affected_endpoints?: string[];
  user_impact?: string;
  
  // Resolution
  resolution_notes?: string;
  root_cause?: string;
  
  // Metadata
  reported_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// Alert Rules and Notifications
export interface AlertRule {
  id: string;
  integration_id: string;
  integration_name: string;
  name: string;
  message: string;
  severity: AlertSeverity;
  condition: AlertCondition;
  
  // Status
  is_active: boolean;
  triggered_at?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  
  // Configuration
  notification_channels: string[];
  cooldown_period: number; // seconds
  escalation_rules?: EscalationRule[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Alert Conditions
export interface AlertCondition {
  metric: 'uptime' | 'response_time' | 'error_rate' | 'success_rate';
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'ne';
  threshold: number;
  duration: number; // seconds
  evaluation_window: number; // seconds
}

// Escalation Rules
export interface EscalationRule {
  level: number;
  delay: number; // seconds
  notification_channels: string[];
  assignees: string[];
}

// API Response Types
export interface APIResponse<T> {
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
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
  total_pages: number;
}

// Dashboard Data Types
export interface DashboardOverview {
  total_integrations: number;
  healthy_count: number;
  warning_count: number;
  critical_count: number;
  unknown_count: number;
  maintenance_count: number;
  
  // Aggregate Metrics
  overall_uptime: number;
  avg_response_time: number;
  total_incidents_24h: number;
  active_alerts: number;
  
  // Recent Activity
  recent_incidents: IncidentReport[];
  recent_changes: IntegrationChange[];
}

// Integration Change Log
export interface IntegrationChange {
  id: string;
  integration_id: string;
  integration_name: string;
  change_type: 'status_change' | 'config_update' | 'maintenance' | 'incident';
  description: string;
  previous_value?: any;
  new_value?: any;
  timestamp: string;
  user: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'integration_status_update' | 'new_alert' | 'alert_resolved' | 'health_check_complete' | 'incident_update';
  data: any;
  timestamp: string;
}

export interface IntegrationStatusUpdate {
  integration_id: string;
  health_status: HealthStatus;
  previous_status?: HealthStatus;
  display_name: string;
  last_health_check: string;
  metrics?: Partial<ServiceMetrics>;
}

// Filter and Search Types
export interface IntegrationFilters {
  status?: HealthStatus[];
  service_type?: ServiceType[];
  environment?: Environment[];
  search?: string;
  tags?: string[];
  has_incidents?: boolean;
  has_maintenance?: boolean;
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  color?: string;
}

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  data: ChartDataPoint[];
  timeRange: '1h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
}

// Component Props Types
export interface IntegrationStatusCardProps {
  integration: Integration;
  onClick: () => void;
  metrics?: ServiceMetrics;
  compact?: boolean;
  showActions?: boolean;
}

export interface CriticalAlertsBannerProps {
  alerts: AlertRule[];
  onDismiss?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
}

export interface IntegrationDetailModalProps {
  integration: Integration;
  onClose: () => void;
  initialTab?: 'overview' | 'metrics' | 'incidents' | 'config';
}

// Utility Types
export type IntegrationStatus = Pick<Integration, 'id' | 'health_status' | 'last_health_check'>;
export type MetricTrend = 'up' | 'down' | 'stable';
export type TimeRange = '1h' | '24h' | '7d' | '30d';

// All types are already exported above, no need for re-export