# Third-Party Integration Status Dashboard - Backend Development PRD
*Server-side API and Database Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Third-Party Integration Status Dashboard (Backend)
- **Terminal Assignment**: TERMINAL 2 - BACKEND
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/db, @ganger/auth/server, @ganger/integrations/server, @ganger/utils/server
- **Integration Requirements**: Health check monitoring, Alert management, Metrics collection

---

## 🎯 Backend Scope

### **Terminal 2 Responsibilities**
- Database schema and migrations for integration monitoring
- API route implementations for status and metrics
- Health check monitoring and automated testing
- Alert rule engine and notification system
- Real-time WebSocket connections for status updates
- Background processing for continuous monitoring
- External service authentication and connection management

### **Excluded from Backend Terminal**
- React components and UI (Terminal 1)
- Client-side state management (Terminal 1)
- Frontend dashboard rendering (Terminal 1)
- User interface interactions (Terminal 1)

---

## 🏗️ Backend Technology Stack

### **Required Server-Side Packages**
```typescript
// Server-only imports
import { withAuth, getUserFromToken, verifyPermissions } from '@ganger/auth/server';
import { db, DatabaseService } from '@ganger/db';
import { 
  HealthCheckService, AlertEngine, MetricsCollector,
  ServerCommunicationService, ServerCacheService,
  WebSocketManager, NotificationService
} from '@ganger/integrations/server';
import { auditLog, validateIntegrationConfig } from '@ganger/utils/server';
import type { 
  User, Integration, HealthStatus, AlertRule,
  ServiceMetrics, IncidentReport, MaintenanceWindow
} from '@ganger/types';
```

### **Backend-Specific Technology**
- **Health Monitoring**: Automated periodic health checks for all integrations
- **Alert Engine**: Rule-based alerting system with multiple notification channels
- **Metrics Collection**: Performance and availability metrics aggregation
- **Real-time Updates**: WebSocket connections for live status broadcasting
- **Background Jobs**: Continuous monitoring and maintenance tasks
- **Service Discovery**: Automatic detection and registration of integrations

---

## 🗄️ Database Implementation

### **Migration Files**
```sql
-- Migration: 2025_01_11_create_integration_monitoring_tables.sql

-- Core integrations registry
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Integration identification
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  service_type VARCHAR(50) NOT NULL, -- 'api', 'database', 'messaging', 'storage', 'auth', 'payment'
  category VARCHAR(50) DEFAULT 'external', -- 'external', 'internal', 'infrastructure'
  
  -- Connection details
  base_url TEXT,
  health_check_endpoint TEXT,
  auth_type VARCHAR(50) NOT NULL, -- 'none', 'api_key', 'oauth', 'basic', 'bearer'
  auth_config JSONB, -- Encrypted authentication configuration
  
  -- Monitoring configuration
  is_active BOOLEAN DEFAULT TRUE,
  is_critical BOOLEAN DEFAULT FALSE, -- Critical integrations require immediate attention
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  health_check_interval_minutes INTEGER DEFAULT 5,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Status tracking
  current_health_status VARCHAR(20) DEFAULT 'unknown' CHECK (current_health_status IN ('healthy', 'warning', 'critical', 'unknown')),
  last_health_check TIMESTAMPTZ,
  last_successful_check TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Metadata
  icon_url TEXT,
  documentation_url TEXT,
  responsible_team VARCHAR(100),
  environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  version VARCHAR(50),
  
  -- Configuration
  custom_headers JSONB,
  expected_response_codes INTEGER[] DEFAULT ARRAY[200],
  health_check_method VARCHAR(10) DEFAULT 'GET' CHECK (health_check_method IN ('GET', 'POST', 'HEAD')),
  health_check_body TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health check results history
CREATE TABLE integration_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Check details
  check_timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  -- Check result
  is_successful BOOLEAN NOT NULL,
  health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('healthy', 'warning', 'critical', 'unknown')),
  
  -- Additional metadata
  check_type VARCHAR(50) DEFAULT 'automated', -- 'automated', 'manual', 'on_demand'
  triggered_by UUID REFERENCES users(id),
  dns_resolution_time_ms INTEGER,
  tcp_connection_time_ms INTEGER,
  ssl_handshake_time_ms INTEGER,
  
  -- Derived metrics
  availability_score DECIMAL(5,4), -- 0.0000 to 1.0000
  performance_score DECIMAL(5,4), -- Based on response time vs baseline
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service metrics aggregation
CREATE TABLE integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Time window
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour BETWEEN 0 AND 23),
  time_window_minutes INTEGER DEFAULT 60, -- Aggregation window size
  
  -- Availability metrics
  total_checks INTEGER DEFAULT 0,
  successful_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_checks > 0 
    THEN (successful_checks::DECIMAL / total_checks::DECIMAL) * 100 
    ELSE NULL END
  ) STORED,
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(8,2),
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  p50_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,
  
  -- Error analysis
  error_count INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_checks > 0 
    THEN (error_count::DECIMAL / total_checks::DECIMAL) * 100 
    ELSE NULL END
  ) STORED,
  
  -- Status distribution
  status_2xx_count INTEGER DEFAULT 0,
  status_3xx_count INTEGER DEFAULT 0,
  status_4xx_count INTEGER DEFAULT 0,
  status_5xx_count INTEGER DEFAULT 0,
  timeout_count INTEGER DEFAULT 0,
  
  -- Aggregated scores
  availability_score DECIMAL(5,4),
  performance_score DECIMAL(5,4),
  reliability_score DECIMAL(5,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, metric_date, metric_hour)
);

-- Alert rules and configuration
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Rule identification
  rule_name VARCHAR(255) NOT NULL,
  rule_description TEXT,
  alert_type VARCHAR(50) NOT NULL, -- 'availability', 'performance', 'error_rate', 'custom'
  
  -- Trigger conditions
  condition_metric VARCHAR(100) NOT NULL, -- 'uptime_percentage', 'response_time', 'error_rate', etc.
  condition_operator VARCHAR(10) NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=', '==', '!=')),
  condition_threshold DECIMAL(10,4) NOT NULL,
  condition_duration_minutes INTEGER DEFAULT 5, -- How long condition must persist
  
  -- Alert severity and handling
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'urgent')),
  auto_resolve BOOLEAN DEFAULT TRUE,
  cooldown_minutes INTEGER DEFAULT 15, -- Minimum time between alerts
  
  -- Notification configuration
  notification_channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'slack', 'sms', 'webhook'
  notification_recipients TEXT[],
  escalation_enabled BOOLEAN DEFAULT FALSE,
  escalation_after_minutes INTEGER DEFAULT 30,
  escalation_recipients TEXT[],
  
  -- Rule status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  -- Business hours configuration
  business_hours_only BOOLEAN DEFAULT FALSE,
  business_hours_start TIME DEFAULT '08:00',
  business_hours_end TIME DEFAULT '18:00',
  business_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active alerts and incidents
CREATE TABLE alert_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id),
  integration_id UUID NOT NULL REFERENCES integrations(id),
  
  -- Incident details
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Alert information
  alert_message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  trigger_value DECIMAL(10,4), -- The actual value that triggered the alert
  threshold_value DECIMAL(10,4), -- The configured threshold
  
  -- Incident status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'suppressed')),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_note TEXT,
  
  -- Impact assessment
  affected_services TEXT[],
  business_impact VARCHAR(20) CHECK (business_impact IN ('none', 'low', 'medium', 'high', 'critical')),
  estimated_affected_users INTEGER,
  
  -- Escalation tracking
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMPTZ,
  escalated_to TEXT[],
  
  -- Notification tracking
  notifications_sent JSONB, -- Track which notifications were sent when
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration dependencies mapping
CREATE TABLE integration_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  depends_on_integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Dependency details
  dependency_type VARCHAR(50) NOT NULL, -- 'hard', 'soft', 'optional'
  description TEXT,
  
  -- Impact configuration
  failure_propagates BOOLEAN DEFAULT TRUE,
  propagation_delay_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, depends_on_integration_id),
  CHECK (integration_id != depends_on_integration_id)
);

-- Maintenance windows scheduling
CREATE TABLE maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Window identification
  title VARCHAR(255) NOT NULL,
  description TEXT,
  maintenance_type VARCHAR(50) DEFAULT 'planned', -- 'planned', 'emergency', 'routine'
  
  -- Timing
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Affected integrations
  affected_integrations UUID[] NOT NULL,
  affected_services TEXT[],
  
  -- Impact details
  expected_impact VARCHAR(20) DEFAULT 'partial' CHECK (expected_impact IN ('none', 'partial', 'full')),
  impact_description TEXT,
  
  -- Notification settings
  notify_users BOOLEAN DEFAULT TRUE,
  notification_advance_hours INTEGER DEFAULT 24,
  notifications_sent BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT TRUE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (scheduled_end > scheduled_start)
);

-- Integration performance baselines
CREATE TABLE integration_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Baseline period
  baseline_start_date DATE NOT NULL,
  baseline_end_date DATE NOT NULL,
  baseline_type VARCHAR(50) DEFAULT 'rolling_30d', -- 'rolling_30d', 'monthly', 'custom'
  
  -- Performance baselines
  baseline_response_time_ms DECIMAL(8,2),
  baseline_uptime_percentage DECIMAL(5,2),
  baseline_error_rate DECIMAL(5,2),
  baseline_requests_per_hour DECIMAL(10,2),
  
  -- Variability metrics
  response_time_std_dev DECIMAL(8,2),
  uptime_std_dev DECIMAL(5,2),
  
  -- Baseline confidence
  sample_size INTEGER,
  confidence_level DECIMAL(5,2) DEFAULT 95.0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, baseline_type, baseline_start_date)
);

-- System configuration
CREATE TABLE integration_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  config_type VARCHAR(50) DEFAULT 'global', -- 'global', 'integration_specific'
  description TEXT,
  
  -- Validation
  validation_schema JSONB,
  is_encrypted BOOLEAN DEFAULT FALSE,
  
  last_updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_integrations_status ON integrations(current_health_status, is_active);
CREATE INDEX idx_integrations_category ON integrations(category, service_type);
CREATE INDEX idx_health_checks_integration_time ON integration_health_checks(integration_id, check_timestamp DESC);
CREATE INDEX idx_health_checks_status ON integration_health_checks(health_status, check_timestamp DESC);
CREATE INDEX idx_metrics_integration_date ON integration_metrics(integration_id, metric_date DESC, metric_hour DESC);
CREATE INDEX idx_metrics_uptime ON integration_metrics(uptime_percentage, metric_date DESC);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active, integration_id);
CREATE INDEX idx_alert_incidents_status ON alert_incidents(status, triggered_at DESC);
CREATE INDEX idx_alert_incidents_integration ON alert_incidents(integration_id, triggered_at DESC);
CREATE INDEX idx_maintenance_windows_time ON maintenance_windows(scheduled_start, scheduled_end);
CREATE INDEX idx_dependencies_integration ON integration_dependencies(integration_id);

-- Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_system_config ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Users can view integrations" ON integrations
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage integrations" ON integrations
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Users can view health checks" ON integration_health_checks
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Users can view metrics" ON integration_metrics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Managers can manage alert rules" ON alert_rules
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Users can view alert incidents" ON alert_incidents
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Staff can acknowledge incidents" ON alert_incidents
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin')
    AND (status = 'open' OR acknowledged_by = auth.uid())
  );

CREATE POLICY "Managers can manage maintenance windows" ON maintenance_windows
  FOR ALL USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

-- Insert default system configuration
INSERT INTO integration_system_config (config_key, config_value, description) VALUES
('default_health_check_interval', '5', 'Default health check interval in minutes'),
('default_timeout_seconds', '30', 'Default timeout for health checks in seconds'),
('max_consecutive_failures', '3', 'Maximum consecutive failures before marking as critical'),
('alert_cooldown_minutes', '15', 'Default cooldown period between alerts'),
('metrics_retention_days', '90', 'Number of days to retain detailed metrics'),
('health_check_retention_days', '30', 'Number of days to retain health check history'),
('enable_auto_recovery_detection', 'true', 'Automatically detect when services recover'),
('business_hours_start', '08:00', 'Default business hours start time'),
('business_hours_end', '18:00', 'Default business hours end time'),
('notification_rate_limit', '5', 'Maximum notifications per integration per hour');

-- Insert default integrations (examples)
INSERT INTO integrations (name, display_name, description, service_type, base_url, health_check_endpoint, auth_type, is_critical) VALUES
('google_calendar', 'Google Calendar', 'Google Calendar API for scheduling', 'api', 'https://www.googleapis.com/calendar/v3', '/calendar/v3/users/me/calendarList', 'oauth', true),
('supabase_db', 'Supabase Database', 'Primary application database', 'database', 'https://pfqtzmxxxhhsxmlddrta.supabase.co', '/rest/v1/', 'bearer', true),
('stripe_payments', 'Stripe Payments', 'Payment processing service', 'api', 'https://api.stripe.com', '/v1/account', 'bearer', true),
('twilio_sms', 'Twilio SMS', 'SMS and communication service', 'messaging', 'https://api.twilio.com', '/2010-04-01/Accounts', 'basic', false),
('cloudflare_cdn', 'Cloudflare CDN', 'Content delivery and DNS', 'infrastructure', 'https://api.cloudflare.com', '/client/v4/user', 'bearer', true);
```

---

## 🔌 API Route Implementation

### **Integration Management APIs**
```typescript
// pages/api/integrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@ganger/auth/server';
import { db } from '@ganger/db';
import { HealthCheckService } from '@ganger/integrations/server';

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let whereClause = { is_active: true };
    
    if (status && status !== 'all') {
      whereClause.current_health_status = status;
    }
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    if (search) {
      whereClause.OR = [
        { display_name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const integrations = await db.integrations.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            alert_incidents: {
              where: { status: 'open' }
            }
          }
        }
      },
      orderBy: [
        { is_critical: 'desc' },
        { current_health_status: 'asc' },
        { display_name: 'asc' }
      ]
    });

    // Get recent metrics for each integration
    const integrationsWithMetrics = await Promise.all(
      integrations.map(async (integration) => {
        const recentMetrics = await db.integration_metrics.findFirst({
          where: { integration_id: integration.id },
          orderBy: { created_at: 'desc' }
        });

        return {
          ...integration,
          recent_metrics: recentMetrics
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: integrationsWithMetrics
    });
  } catch (error) {
    console.error('Integrations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

// pages/api/integrations/[id]/test/route.ts
export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const integrationId = request.url.split('/')[5]; // Extract ID from URL
    
    const integration = await db.integrations.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Perform health check
    const healthCheckService = new HealthCheckService();
    const checkResult = await healthCheckService.performHealthCheck(integration);

    // Store the result
    await db.integration_health_checks.create({
      data: {
        integration_id: integrationId,
        response_time_ms: checkResult.responseTime,
        status_code: checkResult.statusCode,
        response_body: checkResult.responseBody?.substring(0, 1000), // Limit size
        error_message: checkResult.error,
        is_successful: checkResult.isSuccessful,
        health_status: checkResult.healthStatus,
        check_type: 'manual',
        triggered_by: user.id
      }
    });

    // Update integration status if needed
    if (integration.current_health_status !== checkResult.healthStatus) {
      await db.integrations.update({
        where: { id: integrationId },
        data: {
          current_health_status: checkResult.healthStatus,
          last_health_check: new Date(),
          last_successful_check: checkResult.isSuccessful ? new Date() : integration.last_successful_check,
          consecutive_failures: checkResult.isSuccessful ? 0 : integration.consecutive_failures + 1
        }
      });

      // Broadcast status update via WebSocket
      await broadcastStatusUpdate({
        integration_id: integrationId,
        health_status: checkResult.healthStatus,
        previous_status: integration.current_health_status,
        display_name: integration.display_name
      });
    }

    // Log the manual test
    await auditLog({
      action: 'integration_manual_test',
      userId: user.id,
      resourceType: 'integration',
      resourceId: integrationId,
      metadata: {
        health_status: checkResult.healthStatus,
        response_time: checkResult.responseTime,
        is_successful: checkResult.isSuccessful
      }
    });

    return NextResponse.json({
      success: true,
      result: {
        health_status: checkResult.healthStatus,
        response_time_ms: checkResult.responseTime,
        status_code: checkResult.statusCode,
        is_successful: checkResult.isSuccessful,
        error_message: checkResult.error,
        tested_at: new Date()
      }
    });
  } catch (error) {
    console.error('Integration test error:', error);
    return NextResponse.json(
      { error: 'Failed to test integration' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });
```

### **Health Check Service Implementation**
```typescript
// packages/integrations/server/health-check-service.ts
import axios from 'axios';
import { decrypt } from '@ganger/utils/server';

export class HealthCheckService {
  async performHealthCheck(integration: Integration): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Prepare request configuration
      const config = await this.buildRequestConfig(integration);
      
      // Perform the health check
      const response = await axios({
        ...config,
        timeout: integration.timeout_seconds * 1000,
        validateStatus: (status) => integration.expected_response_codes.includes(status)
      });

      const responseTime = Date.now() - startTime;
      const healthStatus = this.evaluateHealthStatus(response, responseTime, integration);

      return {
        isSuccessful: true,
        healthStatus,
        responseTime,
        statusCode: response.status,
        responseBody: typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data),
        error: null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthStatus = this.evaluateErrorHealthStatus(error, integration);

      return {
        isSuccessful: false,
        healthStatus,
        responseTime,
        statusCode: error.response?.status || null,
        responseBody: null,
        error: error.message
      };
    }
  }

  private async buildRequestConfig(integration: Integration): Promise<any> {
    const config = {
      method: integration.health_check_method || 'GET',
      url: this.buildHealthCheckUrl(integration),
      headers: {
        'User-Agent': 'Ganger-Platform-Monitor/1.0',
        ...this.parseCustomHeaders(integration.custom_headers)
      }
    };

    // Add authentication
    if (integration.auth_type !== 'none') {
      await this.addAuthentication(config, integration);
    }

    // Add request body if specified
    if (integration.health_check_body && config.method !== 'GET') {
      config.data = integration.health_check_body;
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  }

  private buildHealthCheckUrl(integration: Integration): string {
    const baseUrl = integration.base_url.replace(/\/$/, '');
    const endpoint = integration.health_check_endpoint || '';
    
    return endpoint.startsWith('http') 
      ? endpoint 
      : `${baseUrl}${endpoint}`;
  }

  private async addAuthentication(config: any, integration: Integration): Promise<void> {
    const authConfig = integration.auth_config;
    
    if (!authConfig) return;

    switch (integration.auth_type) {
      case 'api_key':
        const apiKey = await decrypt(authConfig.api_key);
        if (authConfig.api_key_location === 'header') {
          config.headers[authConfig.api_key_header || 'X-API-Key'] = apiKey;
        } else {
          config.params = { ...config.params, [authConfig.api_key_param || 'api_key']: apiKey };
        }
        break;

      case 'bearer':
        const token = await decrypt(authConfig.token);
        config.headers['Authorization'] = `Bearer ${token}`;
        break;

      case 'basic':
        const username = await decrypt(authConfig.username);
        const password = await decrypt(authConfig.password);
        config.auth = { username, password };
        break;

      case 'oauth':
        // For OAuth, we need to handle token refresh if needed
        const accessToken = await this.getValidOAuthToken(integration);
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        break;
    }
  }

  private evaluateHealthStatus(response: any, responseTime: number, integration: Integration): HealthStatus {
    // Check if response time is acceptable
    const baseline = await this.getPerformanceBaseline(integration.id);
    const responseTimeThreshold = baseline?.baseline_response_time_ms 
      ? baseline.baseline_response_time_ms * 2 
      : 5000; // Default 5 second threshold

    if (responseTime > responseTimeThreshold) {
      return 'warning';
    }

    // Check response content if specified
    if (integration.expected_response_content) {
      const responseText = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
        
      if (!responseText.includes(integration.expected_response_content)) {
        return 'warning';
      }
    }

    return 'healthy';
  }

  private evaluateErrorHealthStatus(error: any, integration: Integration): HealthStatus {
    // Network errors are critical
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return 'critical';
    }

    // Server errors are critical
    if (error.response?.status >= 500) {
      return 'critical';
    }

    // Client errors might be warnings (depends on the service)
    if (error.response?.status >= 400) {
      return 'warning';
    }

    return 'critical';
  }

  private async getPerformanceBaseline(integrationId: string) {
    return await db.integration_baselines.findFirst({
      where: {
        integration_id: integrationId,
        is_active: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  private parseCustomHeaders(customHeaders: any): Record<string, string> {
    if (!customHeaders) return {};
    
    try {
      return typeof customHeaders === 'string' 
        ? JSON.parse(customHeaders) 
        : customHeaders;
    } catch {
      return {};
    }
  }
}

interface HealthCheckResult {
  isSuccessful: boolean;
  healthStatus: HealthStatus;
  responseTime: number;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
}
```

### **Alert Engine Implementation**
```typescript
// packages/integrations/server/alert-engine.ts
export class AlertEngine {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async evaluateAlerts(integration: Integration, healthCheckResult: HealthCheckResult): Promise<void> {
    // Get active alert rules for this integration
    const alertRules = await db.alert_rules.findMany({
      where: {
        integration_id: integration.id,
        is_active: true
      }
    });

    for (const rule of alertRules) {
      await this.evaluateRule(rule, integration, healthCheckResult);
    }
  }

  private async evaluateRule(
    rule: AlertRule, 
    integration: Integration, 
    healthCheckResult: HealthCheckResult
  ): Promise<void> {
    // Get current metric value
    const metricValue = await this.getMetricValue(rule.condition_metric, integration);
    
    if (metricValue === null) return;

    // Check if condition is met
    const conditionMet = this.evaluateCondition(
      metricValue,
      rule.condition_operator,
      rule.condition_threshold
    );

    if (conditionMet) {
      await this.handleTriggeredRule(rule, integration, metricValue);
    } else {
      await this.handleResolvedRule(rule, integration);
    }
  }

  private async getMetricValue(metric: string, integration: Integration): Promise<number | null> {
    switch (metric) {
      case 'uptime_percentage':
        const recentMetrics = await db.integration_metrics.findFirst({
          where: { integration_id: integration.id },
          orderBy: { created_at: 'desc' }
        });
        return recentMetrics?.uptime_percentage || null;

      case 'response_time':
        return integration.last_response_time || null;

      case 'consecutive_failures':
        return integration.consecutive_failures;

      case 'error_rate':
        const errorMetrics = await db.integration_metrics.findFirst({
          where: { integration_id: integration.id },
          orderBy: { created_at: 'desc' }
        });
        return errorMetrics?.error_rate || null;

      default:
        return null;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  private async handleTriggeredRule(
    rule: AlertRule, 
    integration: Integration, 
    triggerValue: number
  ): Promise<void> {
    // Check if we're in cooldown period
    if (rule.last_triggered) {
      const cooldownEnd = new Date(rule.last_triggered.getTime() + rule.cooldown_minutes * 60000);
      if (new Date() < cooldownEnd) {
        return; // Still in cooldown
      }
    }

    // Check business hours if required
    if (rule.business_hours_only && !this.isBusinessHours(rule)) {
      return;
    }

    // Check if there's already an open incident for this rule
    const existingIncident = await db.alert_incidents.findFirst({
      where: {
        alert_rule_id: rule.id,
        status: { in: ['open', 'acknowledged'] }
      }
    });

    if (existingIncident) {
      // Update existing incident
      await db.alert_incidents.update({
        where: { id: existingIncident.id },
        data: {
          trigger_value: triggerValue,
          updated_at: new Date()
        }
      });
    } else {
      // Create new incident
      const incident = await db.alert_incidents.create({
        data: {
          alert_rule_id: rule.id,
          integration_id: integration.id,
          alert_message: this.buildAlertMessage(rule, integration, triggerValue),
          severity: rule.severity,
          trigger_value: triggerValue,
          threshold_value: rule.condition_threshold,
          status: 'open'
        }
      });

      // Send notifications
      await this.sendNotifications(rule, integration, incident);

      // Broadcast alert via WebSocket
      await this.broadcastAlert({
        type: 'new_alert',
        data: {
          id: incident.id,
          integration_id: integration.id,
          integration_name: integration.display_name,
          message: incident.alert_message,
          severity: rule.severity,
          triggered_at: incident.triggered_at
        }
      });
    }

    // Update rule last triggered
    await db.alert_rules.update({
      where: { id: rule.id },
      data: {
        last_triggered: new Date(),
        trigger_count: { increment: 1 }
      }
    });
  }

  private async handleResolvedRule(rule: AlertRule, integration: Integration): Promise<void> {
    if (!rule.auto_resolve) return;

    // Find open incidents for this rule
    const openIncidents = await db.alert_incidents.findMany({
      where: {
        alert_rule_id: rule.id,
        status: { in: ['open', 'acknowledged'] }
      }
    });

    for (const incident of openIncidents) {
      // Resolve the incident
      await db.alert_incidents.update({
        where: { id: incident.id },
        data: {
          status: 'resolved',
          resolved_at: new Date(),
          resolution_note: 'Auto-resolved: condition no longer met',
          duration_minutes: Math.floor(
            (new Date().getTime() - incident.triggered_at.getTime()) / 60000
          )
        }
      });

      // Send resolution notification
      await this.sendResolutionNotification(rule, integration, incident);

      // Broadcast resolution via WebSocket
      await this.broadcastAlert({
        type: 'alert_resolved',
        data: {
          alertId: incident.id,
          integration_id: integration.id,
          integration_name: integration.display_name
        }
      });
    }
  }

  private buildAlertMessage(rule: AlertRule, integration: Integration, triggerValue: number): string {
    const thresholdText = `${rule.condition_metric} ${rule.condition_operator} ${rule.condition_threshold}`;
    return `${integration.display_name}: ${rule.rule_name} - ${thresholdText} (current: ${triggerValue})`;
  }

  private async sendNotifications(rule: AlertRule, integration: Integration, incident: any): Promise<void> {
    const notificationData = {
      integration_name: integration.display_name,
      alert_message: incident.alert_message,
      severity: rule.severity,
      incident_id: incident.id,
      trigger_value: incident.trigger_value,
      threshold_value: incident.threshold_value
    };

    for (const channel of rule.notification_channels) {
      try {
        switch (channel) {
          case 'email':
            await this.notificationService.sendEmail({
              to: rule.notification_recipients,
              subject: `${rule.severity.toUpperCase()}: ${integration.display_name} Alert`,
              template: 'integration_alert',
              data: notificationData
            });
            break;

          case 'slack':
            await this.notificationService.sendSlack({
              message: incident.alert_message,
              severity: rule.severity,
              integration: integration.display_name,
              data: notificationData
            });
            break;

          case 'sms':
            if (rule.severity === 'urgent' || rule.severity === 'critical') {
              await this.notificationService.sendSMS({
                to: rule.notification_recipients,
                message: `ALERT: ${integration.display_name} - ${incident.alert_message}`
              });
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  private isBusinessHours(rule: AlertRule): boolean {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const startTime = this.parseTime(rule.business_hours_start);
    const endTime = this.parseTime(rule.business_hours_end);

    return rule.business_days.includes(currentDay) &&
           currentTime >= startTime &&
           currentTime <= endTime;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }
}
```

### **Background Monitoring Jobs**
```typescript
// packages/integrations/server/monitoring-jobs.ts
import { CronJob } from 'cron';
import { HealthCheckService, AlertEngine, MetricsCollector } from './index';

export class IntegrationMonitoringJobs {
  private healthCheckService: HealthCheckService;
  private alertEngine: AlertEngine;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.healthCheckService = new HealthCheckService();
    this.alertEngine = new AlertEngine();
    this.metricsCollector = new MetricsCollector();
  }

  startJobs(): void {
    // Health checks - every minute
    new CronJob('0 * * * * *', async () => {
      try {
        await this.performScheduledHealthChecks();
      } catch (error) {
        console.error('Scheduled health checks failed:', error);
      }
    }, null, true);

    // Metrics aggregation - every 5 minutes
    new CronJob('0 */5 * * * *', async () => {
      try {
        await this.aggregateMetrics();
      } catch (error) {
        console.error('Metrics aggregation failed:', error);
      }
    }, null, true);

    // Alert evaluation - every minute
    new CronJob('30 * * * * *', async () => {
      try {
        await this.evaluateAllAlerts();
      } catch (error) {
        console.error('Alert evaluation failed:', error);
      }
    }, null, true);

    // Cleanup old data - daily at 2 AM
    new CronJob('0 0 2 * * *', async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error('Data cleanup failed:', error);
      }
    }, null, true);

    // Calculate baselines - daily at 3 AM
    new CronJob('0 0 3 * * *', async () => {
      try {
        await this.calculatePerformanceBaselines();
      } catch (error) {
        console.error('Baseline calculation failed:', error);
      }
    }, null, true);

    console.log('Integration monitoring jobs started successfully');
  }

  private async performScheduledHealthChecks(): Promise<void> {
    // Get integrations that need health checks
    const integrations = await db.integrations.findMany({
      where: {
        is_active: true,
        monitoring_enabled: true,
        OR: [
          { last_health_check: null },
          {
            last_health_check: {
              lte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
            }
          }
        ]
      }
    });

    for (const integration of integrations) {
      try {
        const result = await this.healthCheckService.performHealthCheck(integration);
        
        // Store health check result
        await db.integration_health_checks.create({
          data: {
            integration_id: integration.id,
            response_time_ms: result.responseTime,
            status_code: result.statusCode,
            response_body: result.responseBody?.substring(0, 1000),
            error_message: result.error,
            is_successful: result.isSuccessful,
            health_status: result.healthStatus,
            check_type: 'automated'
          }
        });

        // Update integration status
        const statusChanged = integration.current_health_status !== result.healthStatus;
        
        await db.integrations.update({
          where: { id: integration.id },
          data: {
            current_health_status: result.healthStatus,
            last_health_check: new Date(),
            last_successful_check: result.isSuccessful ? new Date() : integration.last_successful_check,
            consecutive_failures: result.isSuccessful ? 0 : integration.consecutive_failures + 1
          }
        });

        // Broadcast status update if changed
        if (statusChanged) {
          await this.broadcastStatusUpdate({
            integration_id: integration.id,
            health_status: result.healthStatus,
            previous_status: integration.current_health_status,
            display_name: integration.display_name
          });
        }

        // Evaluate alerts
        await this.alertEngine.evaluateAlerts(integration, result);

      } catch (error) {
        console.error(`Health check failed for ${integration.name}:`, error);
      }
    }
  }

  private async aggregateMetrics(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const integrations = await db.integrations.findMany({
      where: { is_active: true }
    });

    for (const integration of integrations) {
      try {
        // Get health checks for the current hour
        const hourStart = new Date(currentDate.getTime() + currentHour * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

        const healthChecks = await db.integration_health_checks.findMany({
          where: {
            integration_id: integration.id,
            check_timestamp: {
              gte: hourStart,
              lt: hourEnd
            }
          },
          orderBy: { check_timestamp: 'asc' }
        });

        if (healthChecks.length === 0) continue;

        // Calculate metrics
        const metrics = this.calculateHourlyMetrics(healthChecks);

        // Upsert metrics record
        await db.integration_metrics.upsert({
          where: {
            integration_id_metric_date_metric_hour: {
              integration_id: integration.id,
              metric_date: currentDate,
              metric_hour: currentHour
            }
          },
          update: metrics,
          create: {
            integration_id: integration.id,
            metric_date: currentDate,
            metric_hour: currentHour,
            ...metrics
          }
        });

      } catch (error) {
        console.error(`Metrics aggregation failed for ${integration.name}:`, error);
      }
    }
  }

  private calculateHourlyMetrics(healthChecks: any[]): any {
    const totalChecks = healthChecks.length;
    const successfulChecks = healthChecks.filter(check => check.is_successful).length;
    const failedChecks = totalChecks - successfulChecks;
    
    const responseTimes = healthChecks
      .filter(check => check.response_time_ms !== null)
      .map(check => check.response_time_ms)
      .sort((a, b) => a - b);

    const statusCodes = healthChecks
      .filter(check => check.status_code !== null)
      .map(check => check.status_code);

    return {
      total_checks: totalChecks,
      successful_checks: successfulChecks,
      failed_checks: failedChecks,
      avg_response_time_ms: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : null,
      min_response_time_ms: responseTimes.length > 0 ? responseTimes[0] : null,
      max_response_time_ms: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : null,
      p50_response_time_ms: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.5)] 
        : null,
      p95_response_time_ms: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.95)] 
        : null,
      p99_response_time_ms: responseTimes.length > 0 
        ? responseTimes[Math.floor(responseTimes.length * 0.99)] 
        : null,
      error_count: failedChecks,
      status_2xx_count: statusCodes.filter(code => code >= 200 && code < 300).length,
      status_3xx_count: statusCodes.filter(code => code >= 300 && code < 400).length,
      status_4xx_count: statusCodes.filter(code => code >= 400 && code < 500).length,
      status_5xx_count: statusCodes.filter(code => code >= 500).length,
      timeout_count: healthChecks.filter(check => 
        check.error_message && check.error_message.includes('timeout')
      ).length
    };
  }

  private async cleanupOldData(): Promise<void> {
    const retentionConfig = await db.integration_system_config.findMany({
      where: {
        config_key: { in: ['metrics_retention_days', 'health_check_retention_days'] }
      }
    });

    const metricsRetentionDays = parseInt(
      retentionConfig.find(c => c.config_key === 'metrics_retention_days')?.config_value || '90'
    );
    const healthCheckRetentionDays = parseInt(
      retentionConfig.find(c => c.config_key === 'health_check_retention_days')?.config_value || '30'
    );

    const metricsThreshold = new Date(Date.now() - metricsRetentionDays * 24 * 60 * 60 * 1000);
    const healthCheckThreshold = new Date(Date.now() - healthCheckRetentionDays * 24 * 60 * 60 * 1000);

    // Clean up old metrics
    const deletedMetrics = await db.integration_metrics.deleteMany({
      where: {
        created_at: { lt: metricsThreshold }
      }
    });

    // Clean up old health checks
    const deletedHealthChecks = await db.integration_health_checks.deleteMany({
      where: {
        check_timestamp: { lt: healthCheckThreshold }
      }
    });

    // Clean up resolved incidents older than 30 days
    const incidentThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedIncidents = await db.alert_incidents.deleteMany({
      where: {
        status: 'resolved',
        resolved_at: { lt: incidentThreshold }
      }
    });

    console.log(`Cleanup completed: ${deletedMetrics.count} metrics, ${deletedHealthChecks.count} health checks, ${deletedIncidents.count} incidents`);
  }
}
```

---

## 🧪 Backend Testing

### **API Endpoint Testing**
```typescript
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '../../../pages/api/integrations';

describe('/api/integrations', () => {
  it('requires authentication', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      }
    });
  });

  it('returns integrations with status filtering', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer ' + await getTestToken('manager')
          },
          url: '?status=critical'
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeInstanceOf(Array);
      }
    });
  });

  it('performs manual health check', async () => {
    const mockIntegration = await createTestIntegration();
    
    await testApiHandler({
      handler: testHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          }
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.result.health_status).toBeDefined();
      }
    });
  });
});

describe('HealthCheckService', () => {
  it('performs successful health check', async () => {
    const service = new HealthCheckService();
    const mockIntegration = {
      id: '1',
      base_url: 'https://httpbin.org',
      health_check_endpoint: '/status/200',
      auth_type: 'none',
      timeout_seconds: 10,
      expected_response_codes: [200]
    };

    const result = await service.performHealthCheck(mockIntegration);
    
    expect(result.isSuccessful).toBe(true);
    expect(result.healthStatus).toBe('healthy');
    expect(result.responseTime).toBeGreaterThan(0);
    expect(result.statusCode).toBe(200);
  });

  it('handles failed health check', async () => {
    const service = new HealthCheckService();
    const mockIntegration = {
      id: '1',
      base_url: 'https://httpbin.org',
      health_check_endpoint: '/status/500',
      auth_type: 'none',
      timeout_seconds: 10,
      expected_response_codes: [200]
    };

    const result = await service.performHealthCheck(mockIntegration);
    
    expect(result.isSuccessful).toBe(false);
    expect(result.healthStatus).toBe('critical');
    expect(result.statusCode).toBe(500);
  });

  it('handles timeout correctly', async () => {
    const service = new HealthCheckService();
    const mockIntegration = {
      id: '1',
      base_url: 'https://httpbin.org',
      health_check_endpoint: '/delay/10',
      auth_type: 'none',
      timeout_seconds: 1,
      expected_response_codes: [200]
    };

    const result = await service.performHealthCheck(mockIntegration);
    
    expect(result.isSuccessful).toBe(false);
    expect(result.healthStatus).toBe('critical');
    expect(result.error).toContain('timeout');
  });
});

describe('AlertEngine', () => {
  it('triggers alert when threshold exceeded', async () => {
    const alertEngine = new AlertEngine();
    const mockRule = {
      id: '1',
      condition_metric: 'consecutive_failures',
      condition_operator: '>',
      condition_threshold: 2,
      severity: 'critical',
      notification_channels: ['email']
    };
    
    const mockIntegration = {
      id: '1',
      consecutive_failures: 3,
      display_name: 'Test Service'
    };

    await alertEngine.evaluateRule(mockRule, mockIntegration, {});
    
    // Verify alert incident was created
    const incident = await db.alert_incidents.findFirst({
      where: { alert_rule_id: mockRule.id }
    });
    expect(incident).toBeTruthy();
    expect(incident.status).toBe('open');
  });

  it('respects cooldown period', async () => {
    const alertEngine = new AlertEngine();
    const mockRule = {
      id: '1',
      last_triggered: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      cooldown_minutes: 10,
      condition_metric: 'consecutive_failures',
      condition_operator: '>',
      condition_threshold: 2
    };

    // Should not trigger due to cooldown
    const result = await alertEngine.evaluateRule(mockRule, mockIntegration, {});
    
    const incidents = await db.alert_incidents.findMany({
      where: { alert_rule_id: mockRule.id }
    });
    expect(incidents.length).toBe(0);
  });
});
```

---

## 📈 Success Criteria

### **Backend Launch Criteria**
- [ ] Database migrations executed successfully
- [ ] All API endpoints respond with correct status codes and data
- [ ] Health check service monitors all integrations correctly
- [ ] Alert engine triggers and resolves alerts properly
- [ ] Background jobs run on schedule without errors
- [ ] WebSocket connections broadcast real-time updates
- [ ] Row Level Security policies working correctly

### **Backend Success Metrics**
- API response times <500ms for standard queries
- Health check completion rate >99%
- Alert detection accuracy >95%
- Real-time update latency <30 seconds
- Background job success rate >99%
- Database query performance optimized
- Zero security vulnerabilities in production

---

*This backend PRD provides comprehensive guidance for Terminal 2 to build all server-side functionality for the Third-Party Integration Status Dashboard, with clear separation from Terminal 1's frontend responsibilities.*