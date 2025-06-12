# PRD - Third-Party Integration Status Dashboard
*Comprehensive monitoring and health checking system for all external services and internal applications*

## 📋 Document Information
- **Application Name**: Third-Party Integration Status Dashboard
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/integrations, @ganger/utils, @ganger/db
- **Integration Requirements**: All existing third-party services and internal apps

---

## 🎯 Product Overview

### **Purpose Statement**
Provide real-time monitoring and health checking for all third-party services and internal applications to prevent debugging delays and service interruptions.

### **Target Users**
- **Primary**: Super Admin (you) - Full access to all status information and configuration
- **Secondary**: Managers - Read-only access to relevant service statuses
- **Tertiary**: Staff - Limited visibility to services affecting their work

### **Success Metrics**
- Reduce third-party service debugging time by 80%
- Achieve 99.5% uptime monitoring accuracy
- Decrease support tickets related to service outages by 60%

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard)**
```yaml
Frontend: Next.js 14+ with TypeScript
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with static asset support)
Styling: Tailwind CSS + Ganger Design System
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
```

### **Required Shared Packages**
```typescript
import { StatusCard, AlertBanner, DataTable } from '@ganger/ui';
import { useAuth, withAuth } from '@ganger/auth';
import { db, User, AuditLog } from '@ganger/db';
import { 
  GoogleCalendarClient, GoogleSheetsClient, EmailClient, 
  TwilioSMSClient, UniversalPaymentHub 
} from '@ganger/integrations';
import { analytics, notifications, logger } from '@ganger/utils';
```

### **App-Specific Technology**
- **Health Check Engine**: Custom monitoring system with configurable intervals
- **Real-time Updates**: WebSocket connections for live status updates
- **Alert System**: Multi-channel notifications (Slack, Email, SMS)
- **Historical Analytics**: Time-series data storage for trending analysis

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard)**
```typescript
type UserRole = 'staff' | 'manager' | 'superadmin' | 'technician' | 'clinical_staff' | 'authorization_specialist';

interface StatusPermissions {
  view_all_services: ['superadmin'];
  view_relevant_services: ['manager', 'superadmin'];
  view_basic_status: ['staff', 'manager', 'superadmin'];
  configure_monitoring: ['superadmin'];
  manage_alerts: ['superadmin'];
  acknowledge_alerts: ['manager', 'superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com (Google OAuth)
- **Service Visibility**: Role-based filtering of visible services
- **Configuration Access**: Only superadmin can modify monitoring settings
- **Alert Management**: Managers can acknowledge alerts for their services

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
users, user_roles, user_permissions, audit_logs,
locations, location_configs, location_staff,
notifications, notification_preferences
```

### **App-Specific Tables**
```sql
-- Service definitions and configurations
CREATE TABLE third_party_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- 'third_party' | 'internal_app'
  category VARCHAR(100) NOT NULL, -- 'authentication', 'payment', 'communication', etc.
  description TEXT,
  
  -- Health check configuration
  endpoint_url TEXT,
  check_method VARCHAR(10) DEFAULT 'GET', -- GET, POST, PING
  check_interval INTEGER DEFAULT 300, -- seconds
  timeout_threshold INTEGER DEFAULT 30, -- seconds
  
  -- Authentication for health checks
  auth_type VARCHAR(50), -- 'api_key', 'oauth', 'basic', 'none'
  auth_config JSONB, -- Encrypted credentials
  
  -- Service metadata
  documentation_url TEXT,
  vendor_contact TEXT,
  critical_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Visibility settings
  visible_to_roles TEXT[] DEFAULT ARRAY['superadmin'],
  
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_service_type CHECK (service_type IN ('third_party', 'internal_app')),
  CONSTRAINT valid_critical_level CHECK (critical_level IN ('low', 'medium', 'high', 'critical'))
);

-- Real-time status tracking
CREATE TABLE service_status_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES third_party_services(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  
  status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'down', 'unknown'
  response_time_ms INTEGER,
  error_message TEXT,
  
  -- Health check details
  http_status_code INTEGER,
  check_type VARCHAR(50), -- 'endpoint', 'auth_test', 'scope_verification'
  
  -- Automated vs manual check
  check_source VARCHAR(20) DEFAULT 'automated', -- 'automated', 'manual'
  checked_by UUID REFERENCES users(id),
  
  CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'down', 'unknown'))
);

-- Service incidents and alerts
CREATE TABLE service_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES third_party_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved'
  
  -- Impact tracking
  affected_locations TEXT[],
  affected_apps TEXT[],
  user_impact_level VARCHAR(20), -- 'none', 'minimal', 'moderate', 'severe'
  
  -- Response tracking
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  
  -- External incident reference
  vendor_incident_id TEXT,
  vendor_status_page_url TEXT,
  
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_incident_status CHECK (status IN ('open', 'investigating', 'resolved'))
);

-- Alert subscriptions and preferences
CREATE TABLE service_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES third_party_services(id) ON DELETE CASCADE,
  
  -- Alert preferences
  alert_methods TEXT[] DEFAULT ARRAY['email'], -- 'email', 'slack', 'sms'
  min_severity VARCHAR(20) DEFAULT 'medium',
  
  -- Timing preferences
  immediate_alert BOOLEAN DEFAULT true,
  digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'none', 'hourly', 'daily', 'weekly'
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, service_id)
);

-- Service dependencies mapping
CREATE TABLE service_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_service_id UUID REFERENCES third_party_services(id) ON DELETE CASCADE,
  dependent_service_id UUID REFERENCES third_party_services(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'required', -- 'required', 'optional', 'related'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(parent_service_id, dependent_service_id),
  CONSTRAINT no_self_dependency CHECK (parent_service_id != dependent_service_id)
);

-- Create indexes for performance
CREATE INDEX idx_service_status_checks_service_time ON service_status_checks(service_id, checked_at DESC);
CREATE INDEX idx_service_incidents_status ON service_incidents(status) WHERE status != 'resolved';
CREATE INDEX idx_third_party_services_active ON third_party_services(is_active) WHERE is_active = true;
```

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated)**
```typescript
GET    /api/services                  // List all services with current status
POST   /api/services                  // Create new service (superadmin only)
GET    /api/services/[id]             // Get specific service details
PUT    /api/services/[id]             // Update service configuration
DELETE /api/services/[id]             // Soft delete service

GET    /api/status-checks             // List status checks with filters
POST   /api/status-checks             // Manual status check
GET    /api/status-checks/[id]        // Get specific check details

GET    /api/incidents                 // List incidents with filters
POST   /api/incidents                 // Create new incident
PUT    /api/incidents/[id]            // Update incident
```

### **App-Specific Endpoints**
```typescript
// Real-time monitoring
GET    /api/dashboard/overview         // Dashboard summary data
WS     /api/dashboard/live            // Live status updates via WebSocket

// Health checking system
POST   /api/health-check/run           // Manual health check for service
POST   /api/health-check/bulk          // Bulk health check for multiple services
GET    /api/health-check/history       // Historical health data

// Service discovery and management
POST   /api/services/discover          // Auto-discover new integrations from codebase
POST   /api/services/test-config       // Test service configuration
GET    /api/services/dependencies      // Get service dependency graph

// Alert management
GET    /api/alerts/subscriptions       // User's alert subscriptions
PUT    /api/alerts/subscriptions       // Update alert preferences
POST   /api/alerts/acknowledge         // Acknowledge alert/incident
POST   /api/alerts/test               // Send test alert

// Analytics and reporting
GET    /api/analytics/uptime           // Service uptime statistics
GET    /api/analytics/performance      // Response time trends
GET    /api/analytics/incidents        // Incident frequency analysis
POST   /api/reports/generate           // Generate status report
```

### **External Integrations Health Checks**
```typescript
// Authentication verification
POST   /api/verify/google-oauth        // Test Google OAuth configuration
POST   /api/verify/supabase-auth       // Test Supabase authentication

// Communication services
POST   /api/verify/twilio-sms          // Test Twilio SMS capability
POST   /api/verify/email-smtp          // Test email configuration
POST   /api/verify/slack-webhook       // Test Slack integration

// Payment processing
POST   /api/verify/stripe-api          // Test Stripe API connectivity
POST   /api/verify/stripe-webhooks     // Verify Stripe webhook configuration

// Google Services
POST   /api/verify/google-calendar     // Test Calendar API access
POST   /api/verify/google-sheets       // Test Sheets API access
POST   /api/verify/google-storage      // Test Cloud Storage access

// Infrastructure
POST   /api/verify/cloudflare-api      // Test Cloudflare API
POST   /api/verify/supabase-db         // Test database connectivity
```

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Status-specific color coding
colors: {
  status: {
    healthy: 'green-600',      // Service operational
    degraded: 'yellow-600',    // Performance issues
    down: 'red-600',           // Service unavailable
    unknown: 'gray-600',       // Status unclear
    maintenance: 'blue-600'    // Planned maintenance
  }
}

// Status indicators
components: {
  StatusDot: 'Animated dot indicators',
  StatusBadge: 'Text badges with status',
  TrendChart: 'Uptime percentage graphs',
  IncidentTimeline: 'Chronological incident view'
}
```

### **Component Usage**
```typescript
import {
  // Status components
  ServiceStatusCard, StatusGrid, UptimeChart,
  IncidentAlert, DependencyGraph, HealthCheckLog,
  
  // Management components
  ServiceConfigForm, AlertSettingsPanel,
  IncidentForm, ManualCheckButton,
  
  // Analytics components
  UptimeReport, PerformanceMetrics,
  IncidentAnalytics, ServiceComparisonChart
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- **Real-time Status Board**: Large-screen display for monitoring room
- **Mobile-Responsive**: Critical status checks on mobile devices
- **Color-Blind Accessibility**: Icons and patterns supplement color coding
- **Dark Mode Support**: 24/7 monitoring room compatibility

---

## 📱 User Experience

### **User Workflows**
1. **Daily Health Check**: Dashboard overview → Service status review → Incident acknowledgment
2. **Incident Response**: Alert received → Status investigation → Incident creation → Resolution tracking
3. **Service Configuration**: Add new service → Configure health checks → Set alert preferences
4. **Reporting**: Generate uptime report → Export analytics → Share with stakeholders

### **Dashboard Layouts**
- **Overview Dashboard**: Grid of service statuses with summary metrics
- **Detailed Service View**: Individual service health, history, and configuration
- **Incident Management**: Active incidents, resolution tracking, and history
- **Analytics Dashboard**: Uptime trends, performance metrics, and reports

### **Performance Requirements**
- **Dashboard Load**: < 1 second for status overview
- **Real-time Updates**: < 2 seconds for status changes
- **Health Checks**: Configurable intervals (1-60 minutes)
- **Historical Data**: 12 months of status history

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for monitoring interfaces
- **Screen Reader Support**: Status announcements and updates
- **High Contrast Mode**: Enhanced visibility for status indicators
- **Keyboard Navigation**: Full functionality without mouse

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// Health check system tests
Unit Tests: Service discovery, status evaluation, alert logic
Integration Tests: Third-party API connectivity, webhook handling
E2E Tests: Dashboard workflows, incident management, alert delivery
Load Tests: Multiple simultaneous health checks, real-time updates
```

### **Test Scenarios**
- **Service Outage Simulation**: Test alert delivery and incident creation
- **False Positive Handling**: Verify alert suppression and escalation
- **Configuration Validation**: Test invalid service configurations
- **Performance Under Load**: Multiple services checking simultaneously

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Monitoring: Self-monitoring with external health checks
Alerting: Multi-channel notification system
Scaling: Horizontal scaling for health check workers
```

### **Environment Configuration**
```bash
# Health checking configuration
HEALTH_CHECK_WORKER_COUNT=5
HEALTH_CHECK_TIMEOUT=30000
HEALTH_CHECK_RETRY_ATTEMPTS=3

# Alert configuration
SLACK_ALERT_WEBHOOK_URL=<encrypted>
SMS_ALERT_PROVIDER=twilio
EMAIL_ALERT_PROVIDER=smtp

# Monitoring intervals
DEFAULT_CHECK_INTERVAL=300
CRITICAL_SERVICE_INTERVAL=60
```

### **Monitoring & Alerts**
- **Self-Monitoring**: Monitor the monitoring system itself
- **External Validation**: Third-party uptime monitoring for validation
- **Alert Channels**: Slack, Email, SMS for different severity levels
- **Escalation Policies**: Auto-escalate unacknowledged critical alerts

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **Service Availability**: Uptime percentages and SLA tracking
- **Response Times**: API response time trends and alerts
- **Incident Metrics**: MTTR, MTBF, and incident frequency
- **User Activity**: Dashboard usage and alert engagement

### **App-Specific Analytics**
- **Service Performance Trends**: Historical response time analysis
- **Incident Impact Analysis**: Business impact correlation
- **Alert Effectiveness**: Alert accuracy and false positive rates
- **Vendor Reliability**: Third-party service comparison metrics

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Credential Encryption**: All third-party API keys encrypted at rest
- **Access Logging**: All configuration changes and status checks logged
- **Rate Limiting**: Health check frequency limits to prevent abuse
- **Secure Communication**: HTTPS/WSS for all external communications

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: No patient data in monitoring logs
- **Audit Logging**: All access to service status information logged
- **Access Controls**: Role-based visibility of service information

### **App-Specific Security**
- **API Key Rotation**: Support for rotating third-party credentials
- **Webhook Verification**: Validate incoming webhook signatures
- **IP Whitelisting**: Restrict health check sources where possible

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All identified third-party services configured and monitored
- [ ] Real-time dashboard functional with live updates
- [ ] Alert system tested and delivering notifications
- [ ] Role-based access controls implemented and verified
- [ ] Historical data collection and trending operational

### **Success Metrics (6 months)**
- Reduce service debugging time from 2+ hours to < 30 minutes
- Achieve 99.9% monitoring system uptime
- Identify and prevent 95% of service outages before user impact
- Decrease support escalations by 70%

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Service Discovery**: Monthly scans for new integrations in codebase
- **Configuration Updates**: Quarterly review of health check configurations
- **Performance Optimization**: Monthly analysis of check intervals and timeouts
- **Alert Tuning**: Ongoing adjustment of alert thresholds and escalation

### **Future Enhancements**
- **Predictive Analytics**: ML-based outage prediction
- **Auto-Remediation**: Automated recovery for common issues
- **Integration Marketplace**: Catalog of available third-party integrations
- **SLA Management**: Automated SLA tracking and reporting

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Service configuration guide with examples
- [ ] Health check development standards
- [ ] Alert integration documentation
- [ ] API reference with authentication examples

### **User Documentation**
- [ ] Dashboard user guide with role-specific views
- [ ] Incident response procedures
- [ ] Alert management guide
- [ ] Service status interpretation guide

---

## 🔧 Pre-configured Service Monitoring

### **Immediate Implementation Services**
```typescript
// Third-party services to monitor from day one
const PRE_CONFIGURED_SERVICES = [
  // Authentication & Core
  { name: 'Supabase Auth', endpoint: '/api/verify/supabase-auth', critical: true },
  { name: 'Google OAuth', endpoint: '/api/verify/google-oauth', critical: true },
  
  // Communication
  { name: 'Twilio SMS', endpoint: '/api/verify/twilio-sms', critical: false },
  { name: 'SMTP Email', endpoint: '/api/verify/email-smtp', critical: false },
  { name: 'Slack Notifications', endpoint: '/api/verify/slack-webhook', critical: false },
  
  // Payment Processing
  { name: 'Stripe API', endpoint: '/api/verify/stripe-api', critical: true },
  
  // Google Services
  { name: 'Google Calendar', endpoint: '/api/verify/google-calendar', critical: false },
  { name: 'Google Sheets', endpoint: '/api/verify/google-sheets', critical: false },
  { name: 'Google Cloud Storage', endpoint: '/api/verify/google-storage', critical: false },
  
  // Infrastructure
  { name: 'Cloudflare API', endpoint: '/api/verify/cloudflare-api', critical: true },
  { name: 'Supabase Database', endpoint: '/api/verify/supabase-db', critical: true },
  
  // Internal Applications
  { name: 'Staff App', endpoint: 'https://staff.gangerdermatology.com/health', critical: true },
  { name: 'Lunch App', endpoint: 'https://lunch.gangerdermatology.com/health', critical: false },
  { name: 'L10 App', endpoint: 'https://l10.gangerdermatology.com/health', critical: false },
  { name: 'Inventory App', endpoint: '/api/apps/inventory/health', critical: false },
  { name: 'Check-in Kiosk', endpoint: '/api/apps/checkin-kiosk/health', critical: true },
  { name: 'Medication Auth', endpoint: '/api/apps/medication-auth/health', critical: true },
  { name: 'Pharma Scheduling', endpoint: '/api/apps/pharma-scheduling/health', critical: false },
  { name: 'Handouts Generator', endpoint: '/api/apps/handouts/health', critical: false }
];
```

*This PRD ensures comprehensive monitoring of all third-party services and internal applications, providing the visibility needed to prevent debugging delays and maintain system reliability.*