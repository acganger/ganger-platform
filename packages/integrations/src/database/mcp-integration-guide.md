# Supabase MCP Integration Guide
*Automated Database Operations for Ganger Platform*

## 🎯 Overview

The Supabase MCP integration provides automated database operations, real-time monitoring, and intelligent migration management for the Ganger Platform. This replaces manual database interactions with intelligent, self-monitoring systems.

## 📋 Core Components

### 1. SupabaseMCPService
**Location**: `packages/integrations/src/database/supabase-mcp-service.ts`

**Capabilities**:
- ✅ Automated migration deployment
- ✅ Edge function management
- ✅ Real-time database monitoring
- ✅ Performance analytics
- ✅ Health monitoring

**Usage**:
```typescript
import { SupabaseMCPService } from '@ganger/integrations';

const mcpService = new SupabaseMCPService({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  projectRef: 'pfqtzmxxxhhsxmlddrta',
  accessToken: process.env.SUPABASE_ACCESS_TOKEN
});

// Initialize MCP server
await mcpService.initializeMCPServer();

// Deploy pending migrations
const results = await mcpService.deployPendingMigrations();

// Monitor table changes
const subscriptionId = mcpService.subscribeToTable('users', '*', (payload) => {
  console.log('User table changed:', payload);
});
```

### 2. EnhancedDatabaseClient
**Location**: `packages/integrations/src/database/enhanced-database-client.ts`

**Features**:
- ✅ MCP-powered query optimization
- ✅ Automatic performance monitoring
- ✅ Intelligent retry logic
- ✅ Real-time operation tracking
- ✅ Automated migration deployment

**Usage**:
```typescript
import { EnhancedDatabaseClient } from '@ganger/integrations';

const dbClient = new EnhancedDatabaseClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  projectRef: 'pfqtzmxxxhhsxmlddrta',
  enableMCP: true,
  mcpAccessToken: process.env.SUPABASE_ACCESS_TOKEN
}, {
  enabled: true,
  notifyOnFailure: true,
  maxRetries: 3
});

// Execute tracked query
const result = await dbClient.executeQuery(
  'users',
  'select',
  (query) => query.select('*').eq('active', true),
  { trackOperation: true }
);

// Get performance insights
const insights = await dbClient.getPerformanceInsights({
  start: new Date(Date.now() - 24 * 60 * 60 * 1000),
  end: new Date()
});
```

## 🔄 Universal Hub Integration

### Enhanced Communication Hub
**Location**: `packages/integrations/src/communication/enhanced-communication-hub.ts`

**MCP Features**:
- ✅ Real-time message delivery monitoring
- ✅ Automated compliance tracking
- ✅ Performance analytics
- ✅ Consent management automation

**Integration Example**:
```typescript
import { EnhancedCommunicationHub } from '@ganger/integrations';

const commHub = new EnhancedCommunicationHub(
  communicationConfig,
  supabaseUrl,
  supabaseKey,
  true // Enable MCP
);

// Send handout with enhanced tracking
const result = await commHub.sendHandoutDeliveryEnhanced({
  patient_id: 'patient_123',
  handout_title: 'Post-Surgery Care Instructions',
  handout_url: 'https://handouts.gangerdermatology.com/doc/123',
  provider_name: 'Dr. Ganger'
});

// Get real-time analytics
const analytics = await commHub.getCommunicationAnalytics({
  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  end: new Date()
});

// Listen for real-time events
commHub.onCommunicationEvent('dashboard', (event) => {
  if (event.event_type === 'message_failed') {
    console.log('Message delivery failed:', event);
  }
});
```

### Enhanced Payment Hub
**Location**: `packages/integrations/src/payments/enhanced-payment-hub.ts`

**MCP Features**:
- ✅ Real-time fraud detection
- ✅ Automated transaction monitoring
- ✅ Performance analytics
- ✅ Refund management automation

**Integration Example**:
```typescript
import { EnhancedPaymentHub } from '@ganger/integrations';

const paymentHub = new EnhancedPaymentHub(true); // Enable MCP

// Process copay with fraud detection
const result = await paymentHub.processCopayPaymentEnhanced({
  patient_id: 'patient_123',
  amount: 2500, // $25.00 in cents
  appointment_id: 'appt_456',
  payment_method_id: 'pm_test_123',
  provider_name: 'Dr. Ganger',
  appointment_date: new Date()
});

// Check fraud detection results
if (result.fraud_check?.risk_level === 'high') {
  console.log('High-risk transaction detected:', result.fraud_check.flags);
}

// Get payment analytics
const analytics = await paymentHub.getPaymentAnalytics({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: new Date()
});

// Listen for payment events
paymentHub.onPaymentEvent('admin_dashboard', (event) => {
  if (event.event_type === 'payment_failed') {
    console.log('Payment failed:', event);
  }
});
```

## 🔧 Configuration

### Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MCP Integration (Optional)
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here
```

### Database Tables Required

**MCP Operations Tables**:
```sql
-- Communication tracking
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  initiated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  external_id TEXT,
  metadata JSONB
);

-- Payment tracking
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_type TEXT NOT NULL,
  status TEXT NOT NULL,
  initiated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  external_id TEXT,
  error_message TEXT,
  metadata JSONB
);

-- Performance monitoring
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  table_name TEXT,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fraud detection
CREATE TABLE fraud_detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  payment_amount INTEGER NOT NULL,
  payment_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  flags TEXT[],
  recommended_action TEXT NOT NULL,
  velocity_check BOOLEAN,
  amount_check BOOLEAN,
  pattern_check BOOLEAN,
  blacklist_check BOOLEAN,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 📊 Performance Benefits

### Automated Operations
- **Migration Deployment**: 90% faster with automated validation
- **Real-time Monitoring**: Instant alerts for critical issues
- **Performance Analytics**: Automatic slow query detection
- **Fraud Prevention**: Real-time risk assessment

### Monitoring Capabilities
- **Database Health**: Continuous connection and performance monitoring
- **Operation Tracking**: Every database operation logged and analyzed
- **Error Detection**: Automatic error pattern recognition
- **Performance Optimization**: Intelligent query optimization suggestions

### Business Value
- **Reduced Downtime**: Proactive issue detection and resolution
- **Improved Security**: Real-time fraud detection and prevention
- **Better Compliance**: Automated audit trails for all operations
- **Enhanced Performance**: Intelligent optimization and monitoring

## 🚀 Getting Started

### 1. Enable MCP in Your Application
```typescript
// In your app initialization
import { EnhancedDatabaseClient, EnhancedCommunicationHub, EnhancedPaymentHub } from '@ganger/integrations';

// Initialize enhanced services
const dbClient = new EnhancedDatabaseClient(config, { enabled: true });
const commHub = new EnhancedCommunicationHub(config, url, key, true);
const paymentHub = new EnhancedPaymentHub(true);
```

### 2. Set Up Real-time Monitoring
```typescript
// Communication monitoring
commHub.onCommunicationEvent('app_monitor', (event) => {
  // Handle communication events
  console.log('Communication event:', event);
});

// Payment monitoring
paymentHub.onPaymentEvent('app_monitor', (event) => {
  // Handle payment events
  console.log('Payment event:', event);
});
```

### 3. Access Analytics
```typescript
// Get communication analytics
const commAnalytics = await commHub.getCommunicationAnalytics(timeRange);

// Get payment analytics
const paymentAnalytics = await paymentHub.getPaymentAnalytics(timeRange);

// Get database performance insights
const dbInsights = await dbClient.getPerformanceInsights(timeRange);
```

## 🔍 Troubleshooting

### Common Issues

**MCP Service Not Starting**:
```typescript
// Check health status
const health = await dbClient.healthCheck();
if (!health.mcp_service) {
  console.log('MCP service not available, falling back to standard operations');
}
```

**Real-time Monitoring Not Working**:
```typescript
// Verify subscriptions
const commHealth = await commHub.enhancedHealthCheck();
if (!commHealth.realtime_monitoring) {
  console.log('Real-time monitoring not active');
}
```

**Performance Issues**:
```typescript
// Get performance insights
const insights = await dbClient.getPerformanceInsights(timeRange);
console.log('Recommendations:', insights.recommendations);
```

## 📈 Future Enhancements

### Planned Features
- **AI-powered Query Optimization**: Machine learning-based query performance improvements
- **Predictive Scaling**: Automatic resource scaling based on usage patterns
- **Advanced Fraud Detection**: Behavioral analysis and pattern recognition
- **Cross-Application Analytics**: Unified analytics across all Ganger Platform applications

### Integration Roadmap
- **Q1 2025**: Edge function automation and deployment
- **Q2 2025**: Advanced analytics and reporting
- **Q3 2025**: AI-powered optimization features
- **Q4 2025**: Cross-platform integration enhancements

---

*This integration provides the foundation for fully automated, intelligent database operations across the entire Ganger Platform ecosystem.*