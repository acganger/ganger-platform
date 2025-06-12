# Third-Party Integration Status Dashboard - Frontend Development PRD
*React/Next.js Frontend Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Third-Party Integration Status Dashboard (Frontend)
- **Terminal Assignment**: TERMINAL 1 - FRONTEND
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/utils/client, @ganger/types
- **Integration Requirements**: Backend API endpoints, Real-time monitoring, Health status display

---

## 🎯 Frontend Scope

### **Terminal 1 Responsibilities**
- React components for integration monitoring dashboard
- Real-time status indicators and health visualization
- Alert and notification display interfaces
- Configuration management forms
- Responsive design for multiple device sizes
- Client-side state management for dashboard data

### **Excluded from Frontend Terminal**
- API route implementations (Terminal 2)
- Health check logic and monitoring services (Terminal 2)
- External service authentication handling (Terminal 2)
- Background monitoring processes (Terminal 2)

---

## 🏗️ Frontend Technology Stack

### **Required Client-Side Packages**
```typescript
'use client'

// Client-safe imports only
import { 
  StatusIndicator, HealthChart, AlertBanner, IntegrationCard,
  Button, Input, Modal, LoadingSpinner, DataTable,
  FormField, Select, TextArea, ProgressBar, Tooltip,
  Toast, Badge, MetricCard, RefreshButton
} from '@ganger/ui';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { formatTime, formatDuration, formatPercentage } from '@ganger/utils/client';
import { 
  User, Integration, HealthStatus, AlertRule,
  ServiceMetrics, IncidentReport, MaintenanceWindow
} from '@ganger/types';
```

### **Frontend-Specific Technology**
- **Real-time Updates**: WebSocket connections for live status monitoring
- **Data Visualization**: Charts and graphs for service metrics
- **Status Indicators**: Color-coded health status displays
- **Notification System**: Toast notifications for alerts and incidents
- **Responsive Dashboard**: Grid layout that adapts to screen size
- **Filtering and Search**: Client-side filtering for large integration lists

---

## 🎨 User Interface Components

### **Main Dashboard Layout**
```typescript
'use client'

export default function IntegrationStatusDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AlertRule | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AppLayout>
      <PageHeader 
        title="Third-Party Integration Status" 
        subtitle="Monitor health and performance of all external service integrations"
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Critical Alerts Banner */}
        <CriticalAlertsBanner alerts={getCriticalAlerts()} />
        
        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <OverviewMetrics integrations={integrations} />
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search integrations..."
              />
              <StatusFilter
                value={filterStatus}
                onChange={setFilterStatus}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <RefreshButton 
                onClick={refreshAllIntegrations}
                loading={isRefreshing}
              />
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(true)}
              >
                Configure Alerts
              </Button>
            </div>
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => (
            <IntegrationStatusCard
              key={integration.id}
              integration={integration}
              onClick={() => setSelectedIntegration(integration)}
            />
          ))}
        </div>

        {/* Detailed View Modal */}
        {selectedIntegration && (
          <IntegrationDetailModal
            integration={selectedIntegration}
            onClose={() => setSelectedIntegration(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
```

### **Integration Status Card Component**
```typescript
'use client'

interface IntegrationStatusCardProps {
  integration: Integration;
  onClick: () => void;
}

export function IntegrationStatusCard({ integration, onClick }: IntegrationStatusCardProps) {
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const statusConfig = {
    healthy: { color: 'green', icon: '✅', label: 'Healthy' },
    warning: { color: 'yellow', icon: '⚠️', label: 'Warning' },
    critical: { color: 'red', icon: '🚨', label: 'Critical' },
    unknown: { color: 'gray', icon: '❓', label: 'Unknown' }
  };

  const config = statusConfig[integration.health_status] || statusConfig.unknown;

  useEffect(() => {
    loadMetrics();
  }, [integration.id]);

  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const response = await fetch(`/api/integrations/${integration.id}/metrics`);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer
        border-l-${config.color}-500
      `}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <img 
                src={integration.icon_url || '/default-integration-icon.png'} 
                alt={integration.name}
                className="w-10 h-10 rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {integration.display_name}
              </h3>
              <p className="text-sm text-gray-500">{integration.description}</p>
            </div>
          </div>
          
          <StatusBadge 
            status={integration.health_status}
            icon={config.icon}
            label={config.label}
          />
        </div>

        {/* Metrics Grid */}
        {isLoadingMetrics ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricItem
              label="Uptime"
              value={formatPercentage(metrics.uptime_percentage)}
              trend={metrics.uptime_trend}
            />
            <MetricItem
              label="Response Time"
              value={`${metrics.avg_response_time}ms`}
              trend={metrics.response_time_trend}
            />
            <MetricItem
              label="Success Rate"
              value={formatPercentage(metrics.success_rate)}
              trend={metrics.success_rate_trend}
            />
            <MetricItem
              label="Incidents (24h)"
              value={metrics.incidents_24h}
              warning={metrics.incidents_24h > 0}
            />
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>Metrics unavailable</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Last checked: {formatTime(integration.last_health_check)}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                testConnection(integration.id);
              }}
            >
              Test Now
            </Button>
            
            {integration.health_status === 'critical' && (
              <Button 
                size="sm" 
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  acknowledgeAlert(integration.id);
                }}
              >
                Acknowledge
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricItem({ label, value, trend, warning = false }) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <span className="text-green-500">↗</span>;
    if (trend < 0) return <span className="text-red-500">↘</span>;
    return <span className="text-gray-400">→</span>;
  };

  return (
    <div className="text-center">
      <div className={`text-lg font-semibold ${warning ? 'text-red-600' : 'text-gray-900'}`}>
        {value} {getTrendIcon()}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
```

### **Critical Alerts Banner**
```typescript
'use client'

interface CriticalAlertsBannerProps {
  alerts: AlertRule[];
}

export function CriticalAlertsBanner({ alerts }: CriticalAlertsBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter(alert => 
    alert.severity === 'critical' && !dismissedAlerts.has(alert.id)
  );

  if (activeAlerts.length === 0) return null;

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  return (
    <div className="mb-6">
      {activeAlerts.map(alert => (
        <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-xl">🚨</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Critical Integration Issue
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{alert.message}</p>
                <p className="mt-1">
                  <strong>Service:</strong> {alert.integration_name} | 
                  <strong> Triggered:</strong> {formatTime(alert.triggered_at)}
                </p>
              </div>
              <div className="mt-4">
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => viewIntegrationDetails(alert.integration_id)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => dismissAlert(alert.id)}
                className="bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### **Integration Detail Modal**
```typescript
'use client'

interface IntegrationDetailModalProps {
  integration: Integration;
  onClose: () => void;
}

export function IntegrationDetailModal({ integration, onClose }: IntegrationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'incidents' | 'config'>('overview');
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDetailedData();
  }, [integration.id]);

  const loadDetailedData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, incidentsRes] = await Promise.all([
        fetch(`/api/integrations/${integration.id}/metrics?detailed=true`),
        fetch(`/api/integrations/${integration.id}/incidents?limit=10`)
      ]);

      const metricsData = await metricsRes.json();
      const incidentsData = await incidentsRes.json();

      if (metricsData.success) setMetrics(metricsData.metrics);
      if (incidentsData.success) setIncidents(incidentsData.incidents);
    } catch (error) {
      console.error('Failed to load detailed data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal size="xl" isOpen={true} onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <img 
              src={integration.icon_url || '/default-integration-icon.png'} 
              alt={integration.name}
              className="w-12 h-12 rounded-lg"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {integration.display_name}
              </h2>
              <p className="text-gray-500">{integration.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <StatusBadge status={integration.health_status} />
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'metrics', label: 'Metrics' },
              { id: 'incidents', label: 'Incidents' },
              { id: 'config', label: 'Configuration' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab integration={integration} metrics={metrics} />
              )}
              {activeTab === 'metrics' && (
                <MetricsTab integration={integration} metrics={metrics} />
              )}
              {activeTab === 'incidents' && (
                <IncidentsTab integration={integration} incidents={incidents} />
              )}
              {activeTab === 'config' && (
                <ConfigurationTab integration={integration} />
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function OverviewTab({ integration, metrics }) {
  return (
    <div className="space-y-6">
      {/* Service Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Type</label>
            <p className="mt-1">{integration.service_type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Base URL</label>
            <p className="mt-1 font-mono text-sm">{integration.base_url}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Authentication</label>
            <p className="mt-1">{integration.auth_type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Environment</label>
            <p className="mt-1">
              <Badge variant={integration.environment === 'production' ? 'default' : 'secondary'}>
                {integration.environment}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics?.uptime_percentage ? formatPercentage(metrics.uptime_percentage) : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Uptime (30d)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.avg_response_time || 'N/A'}ms
            </div>
            <div className="text-sm text-gray-500">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.requests_per_hour || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Requests/Hour</div>
          </div>
        </div>
      </div>

      {/* Dependencies */}
      {integration.dependencies && integration.dependencies.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dependencies</h3>
          <div className="space-y-2">
            {integration.dependencies.map((dep, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <span className="font-medium">{dep.name}</span>
                <StatusBadge status={dep.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricsTab({ integration, metrics }) {
  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends (24h)</h3>
        <PerformanceChart data={metrics.performance_history} />
      </div>

      {/* Error Rate Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Error Rate (24h)</h3>
        <ErrorRateChart data={metrics.error_history} />
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={metrics.total_requests}
          change={metrics.requests_change}
        />
        <MetricCard
          title="Success Rate"
          value={formatPercentage(metrics.success_rate)}
          change={metrics.success_rate_change}
        />
        <MetricCard
          title="P95 Response Time"
          value={`${metrics.p95_response_time}ms`}
          change={metrics.p95_change}
        />
        <MetricCard
          title="Error Count"
          value={metrics.error_count}
          change={metrics.error_change}
          alert={metrics.error_count > metrics.error_threshold}
        />
      </div>
    </div>
  );
}
```

### **Real-time Status Updates**
```typescript
'use client'

export function useIntegrationStatusUpdates() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Establish WebSocket connection for real-time updates
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws');
    
    ws.onopen = () => {
      setIsConnected(true);
      // Subscribe to integration status updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'integration_status'
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'integration_status_update':
          updateIntegrationStatus(message.data);
          break;
        case 'new_alert':
          addAlert(message.data);
          break;
        case 'alert_resolved':
          resolveAlert(message.data.alertId);
          break;
        case 'health_check_complete':
          updateHealthCheck(message.data);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        // Reconnection logic here
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  const updateIntegrationStatus = (update: any) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === update.integration_id
        ? { ...integration, ...update }
        : integration
    ));

    // Show toast notification for critical changes
    if (update.health_status === 'critical') {
      toast.error(`${update.display_name} is experiencing critical issues`);
    } else if (update.health_status === 'healthy' && update.previous_status === 'critical') {
      toast.success(`${update.display_name} has recovered`);
    }
  };

  const addAlert = (alert: AlertRule) => {
    setAlerts(prev => [alert, ...prev]);
    
    // Show notification
    toast.error(alert.message, {
      duration: 10000,
      action: {
        label: 'View',
        onClick: () => viewIntegrationDetails(alert.integration_id)
      }
    });
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return {
    integrations,
    alerts,
    isConnected,
    refreshAllIntegrations: () => {
      // Trigger manual refresh of all integrations
    }
  };
}
```

---

## 📊 Data Visualization Components

### **Health Status Charts**
```typescript
'use client'

export function PerformanceChart({ data }: { data: any[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="response_time" 
            stroke="#8884d8" 
            name="Response Time (ms)"
          />
          <Line 
            type="monotone" 
            dataKey="success_rate" 
            stroke="#82ca9d" 
            name="Success Rate (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UptimeHeatmap({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-24 gap-1">
      {data.map((hour, index) => (
        <Tooltip key={index} content={`${hour.timestamp}: ${hour.uptime}% uptime`}>
          <div
            className={`
              w-3 h-3 rounded-sm
              ${hour.uptime >= 99 ? 'bg-green-500' :
                hour.uptime >= 95 ? 'bg-yellow-500' :
                hour.uptime >= 90 ? 'bg-orange-500' : 'bg-red-500'}
            `}
          />
        </Tooltip>
      ))}
    </div>
  );
}
```

---

## 🔄 API Integration

### **Client-Side API Calls**
```typescript
'use client'

export const integrationApi = {
  // Get all integrations
  async getIntegrations(filters?: any) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/integrations?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch integrations');
    return response.json();
  },

  // Get integration details
  async getIntegration(integrationId: string) {
    const response = await fetch(`/api/integrations/${integrationId}`);
    if (!response.ok) throw new Error('Failed to fetch integration');
    return response.json();
  },

  // Test integration connection
  async testConnection(integrationId: string) {
    const response = await fetch(`/api/integrations/${integrationId}/test`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Connection test failed');
    return response.json();
  },

  // Get integration metrics
  async getMetrics(integrationId: string, timeRange = '24h') {
    const response = await fetch(`/api/integrations/${integrationId}/metrics?range=${timeRange}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },

  // Get incidents
  async getIncidents(integrationId?: string, limit = 25) {
    const url = integrationId 
      ? `/api/integrations/${integrationId}/incidents?limit=${limit}`
      : `/api/incidents?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch incidents');
    return response.json();
  },

  // Acknowledge alert
  async acknowledgeAlert(alertId: string) {
    const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to acknowledge alert');
    return response.json();
  },

  // Update integration configuration
  async updateConfiguration(integrationId: string, config: any) {
    const response = await fetch(`/api/integrations/${integrationId}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Failed to update configuration');
    return response.json();
  }
};
```

---

## 🧪 Frontend Testing

### **Component Testing**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntegrationStatusDashboard } from './IntegrationStatusDashboard';

describe('IntegrationStatusDashboard', () => {
  it('renders dashboard with integration cards', () => {
    const mockIntegrations = [
      { 
        id: '1', 
        display_name: 'Google Calendar', 
        health_status: 'healthy',
        service_type: 'calendar'
      }
    ];
    
    render(<IntegrationStatusDashboard />, {
      wrapper: ({ children }) => (
        <AuthProvider value={{ user: mockUser }}>
          {children}
        </AuthProvider>
      )
    });
    
    expect(screen.getByText('Third-Party Integration Status')).toBeInTheDocument();
    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
  });

  it('filters integrations by status', async () => {
    render(<IntegrationStatusDashboard />);
    
    const statusFilter = screen.getByRole('combobox', { name: /status filter/i });
    fireEvent.change(statusFilter, { target: { value: 'critical' } });
    
    await waitFor(() => {
      // Should only show critical integrations
      const healthyCards = screen.queryAllByText('Healthy');
      expect(healthyCards).toHaveLength(0);
    });
  });

  it('opens detail modal when integration clicked', () => {
    render(<IntegrationStatusDashboard />);
    
    const integrationCard = screen.getByText('Google Calendar');
    fireEvent.click(integrationCard);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('shows critical alerts banner', () => {
    const criticalAlert = {
      id: '1',
      severity: 'critical',
      message: 'Service unavailable',
      integration_name: 'Google Calendar'
    };
    
    render(<CriticalAlertsBanner alerts={[criticalAlert]} />);
    
    expect(screen.getByText('Critical Integration Issue')).toBeInTheDocument();
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });
});

describe('Real-time Updates', () => {
  it('receives and displays status updates', async () => {
    const { rerender } = render(<IntegrationStatusCard integration={mockIntegration} />);
    
    // Simulate WebSocket message
    act(() => {
      mockWebSocket.trigger('message', {
        type: 'integration_status_update',
        data: { integration_id: '1', health_status: 'critical' }
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  it('shows toast notifications for alerts', () => {
    render(<IntegrationStatusDashboard />);
    
    act(() => {
      mockWebSocket.trigger('message', {
        type: 'new_alert',
        data: { 
          id: '1',
          message: 'Service down',
          severity: 'critical',
          integration_name: 'Google Calendar'
        }
      });
    });
    
    expect(screen.getByText('Service down')).toBeInTheDocument();
  });
});
```

---

## 📈 Success Criteria

### **Frontend Launch Criteria**
- [ ] Dashboard displays all integrations with correct status
- [ ] Real-time updates show status changes within 30 seconds
- [ ] Critical alerts banner appears for urgent issues
- [ ] Integration detail modal loads metrics and incident history
- [ ] Status filtering and search work correctly
- [ ] Mobile responsive design tested on tablets
- [ ] WebSocket connections handle reconnection gracefully

### **Frontend Success Metrics**
- Dashboard initial load time <3 seconds
- Status updates appear within 30 seconds of backend changes
- Integration search returns results in <200ms
- Detail modal opens and loads data in <2 seconds
- Real-time connection uptime >99%
- Mobile interface usable on 7" tablets
- Zero client-side JavaScript errors in production

---

*This frontend PRD provides comprehensive guidance for Terminal 1 to build all React components and user interfaces for the Third-Party Integration Status Dashboard, with clear boundaries to prevent conflicts with Terminal 2's backend work.*