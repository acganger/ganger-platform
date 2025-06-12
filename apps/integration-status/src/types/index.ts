// Re-export all integration types
export * from './integration';

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  lastUpdated?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

// Modal State Types
export interface ModalState {
  isOpen: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
}

// Search and Filter State
export interface SearchState {
  query: string;
  filters: any;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

// Dashboard Layout Types
export interface DashboardLayoutConfig {
  showSidebar: boolean;
  sidebarWidth: number;
  gridLayout: GridLayout;
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
}

export interface GridLayout {
  columns: number;
  rows: number;
  gaps: number;
  responsive: boolean;
}

// Real-time Connection State
export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: string;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  wsLatency?: number;
  apiLatency?: number;
  memoryUsage?: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  source: 'api' | 'websocket' | 'client';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'date' | 'time';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

// Theme and Styling Types
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: string;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

// Accessibility Types
export interface AccessibilityConfig {
  announcements: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
}

// Export grouped types for convenience
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface EventHandlers {
  onClick?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
}

// API Client Types
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

// WebSocket Types
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

export interface WebSocketHooks {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

// Testing Types (using any to avoid forward reference issues)
export interface MockData {
  integrations: any[];
  metrics: any[];
  incidents: any[];
  alerts: any[];
}

export interface TestConfig {
  mockData: MockData;
  mockWebSocket: boolean;
  mockAPI: boolean;
  enableDebugMode: boolean;
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_WS_URL: string;
  NEXT_PUBLIC_DEBUG_MODE: boolean;
  NEXT_PUBLIC_REFRESH_INTERVAL: number;
}

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Status badge types
export interface StatusBadgeProps {
  status: 'healthy' | 'warning' | 'critical' | 'unknown' | 'maintenance';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'solid' | 'outline' | 'soft';
}

// Metric card types
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  alert?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

// Chart types
export interface ChartProps {
  data: ChartPoint[];
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut';
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  responsive?: boolean;
  colors?: string[];
}

export interface ChartPoint {
  label: string;
  value: number;
  timestamp?: string;
  color?: string;
  metadata?: Record<string, any>;
}