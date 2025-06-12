# PRD: Advanced Integrations Fix
*Use this template for all new PRDs to ensure consistency, shared infrastructure, and quality enforcement*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Advanced Integrations Universal Hub
- **PRD ID**: PRD-INTEGRATIONS-001
- **Priority**: High
- **Development Timeline**: 4-5 weeks (reference PROJECT_TRACKER.md for velocity data)
- **Terminal Assignment**: Backend (server-side advanced services + client interfaces)
- **Dependencies**: @ganger/integrations, @ganger/auth, @ganger/db, @ganger/utils
- **MCP Integration Requirements**: Twilio MCP, Stripe MCP, OpenAI integration, AWS SES
- **Quality Gate Requirements**: Build verification across all frontend apps, zero Node.js module imports in client bundles

---

## 🎯 Product Overview

### **Purpose Statement**
Fix remaining advanced integrations across the Ganger Platform by implementing proper client-server separation for complex services, eliminating Node.js-specific module conflicts in frontend apps.

### **Target Users**
- **Primary**: Development team requiring stable builds and full integration functionality
- **Secondary**: Medical staff using communication, AI, and payment features across applications
- **Tertiary**: Patients receiving automated communications, AI-enhanced services, and payment processing

### **Success Metrics**
- 100% of frontend apps build successfully without Node.js module errors
- 91% reduction in client bundle size (10MB Node.js modules removal)
- Advanced integration functionality restored with <2 second response time
- 99.9% uptime for webhook processing and external service integrations

### **Business Value Measurement**
- **ROI Target**: $25,000 operational value through restored automation and communication features
- **Cost Savings**: 90% reduction in integration troubleshooting and manual communication tasks
- **Revenue Impact**: Restored payment processing and automated patient communication improves revenue flow
- **User Productivity**: AI assistance and automated workflows save 30 hours/week across clinical staff

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard - MANDATORY)**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Cloudflare Workers (with global edge network)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { 
  ClientCommunicationService, 
  ClientAIService, 
  ClientWebhookService,
  ClientMonitoringService 
} from '@ganger/integrations/client';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { 
  ServerCommunicationService,
  ServerAIService,
  ServerWebhookService,
  ServerMonitoringService
} from '@ganger/integrations/server';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  CommunicationRequest, AIRequest, WebhookEvent, MonitoringData,
  EmailData, SMSData, PaymentWebhook, AnalyticsEvent,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```

### **App-Specific Technology**
- Twilio SDK (server-side only) for SMS and voice communications
- OpenAI SDK (server-side only) for AI content generation and analysis
- Stripe webhook handling (server-side only) for payment processing
- AWS SES (server-side only) for email delivery
- Comprehensive webhook validation and processing system

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard - Updated Hierarchy)**
```typescript
// MANDATORY role hierarchy - see MASTER_DEVELOPMENT_GUIDE.md
type UserRole = 
  | 'superadmin'        // Full advanced integration administration
  | 'manager'           // Communication and AI service management
  | 'provider'          // Patient communication and AI assistance
  | 'nurse'             // Limited communication access
  | 'medical_assistant' // Administrative communication and AI tools
  | 'pharmacy_tech'     // Inventory and medication communications
  | 'billing'           // Payment webhook access and notifications
  | 'user';             // Basic notification access only

// Advanced integration permission matrix
interface IntegrationPermissions {
  send_communications: ['superadmin', 'manager', 'provider', 'medical_assistant'];
  use_ai_services: ['superadmin', 'manager', 'provider', 'medical_assistant'];
  manage_webhooks: ['superadmin', 'manager'];
  view_analytics: ['superadmin', 'manager', 'provider'];
  admin_integrations: ['superadmin'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com accounts for integration management
- **API Key Management**: Role-based access to external service credentials
- **Communication Permissions**: Patient-based access control for medical communications
- **Audit Trail**: All advanced integration operations logged for compliance

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, patients, appointments, payments
```

### **App-Specific Tables**
```sql
-- Communication tracking
CREATE TABLE communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Communication details
  communication_type VARCHAR(20) NOT NULL, -- 'sms', 'email', 'voice'
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  message_content TEXT,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  external_id VARCHAR(255), -- Twilio/SES message ID
  
  -- Context
  patient_id UUID REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  template_used VARCHAR(100),
  
  -- Compliance
  hipaa_compliant BOOLEAN DEFAULT false,
  opt_in_verified BOOLEAN DEFAULT false,
  
  -- Standard RLS policy
  CONSTRAINT rls_policy CHECK (
    created_by = auth.uid() OR 
    auth.jwt() ->> 'role' IN ('superadmin', 'manager') OR
    (patient_id IS NOT NULL AND patient_id IN (
      SELECT patient_id FROM patient_access WHERE user_id = auth.uid()
    ))
  )
);

-- AI service usage tracking
CREATE TABLE ai_service_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- AI operation details
  service_type VARCHAR(30) NOT NULL, -- 'content_generation', 'form_analysis', 'recommendation'
  input_tokens INTEGER,
  output_tokens INTEGER,
  processing_time_ms INTEGER,
  model_used VARCHAR(50),
  
  -- Context
  app_context VARCHAR(50), -- 'handouts', 'medication-auth', etc.
  patient_id UUID REFERENCES patients(id),
  
  -- Content tracking
  input_hash VARCHAR(64), -- For duplicate detection
  output_quality_score DECIMAL(3,2), -- 0.00-1.00
  human_review_required BOOLEAN DEFAULT false,
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(8,4)
);

-- Webhook processing log
CREATE TABLE webhook_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Webhook details
  webhook_source VARCHAR(20) NOT NULL, -- 'stripe', 'twilio', 'calendar'
  webhook_type VARCHAR(50) NOT NULL,
  payload_hash VARCHAR(64),
  signature_valid BOOLEAN,
  processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'retrying'
  processing_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_code VARCHAR(20),
  
  -- Business impact
  affected_entity_type VARCHAR(30), -- 'payment', 'appointment', 'communication'
  affected_entity_id UUID
);

-- Integration monitoring
CREATE TABLE integration_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Service details
  service_name VARCHAR(30) NOT NULL, -- 'twilio', 'openai', 'stripe', 'ses'
  health_status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'outage'
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4), -- 0.0000-1.0000
  
  -- Metrics
  requests_per_minute INTEGER,
  success_rate DECIMAL(5,4),
  quota_usage_percent DECIMAL(5,2),
  
  -- Alerting
  alert_sent BOOLEAN DEFAULT false,
  alert_level VARCHAR(10) -- 'info', 'warning', 'critical'
);
```

### **Data Relationships**
- Links to patient records for HIPAA-compliant communications
- Connects to appointments for automated reminders and confirmations
- References payments for webhook processing and notifications
- Audit trail for all advanced integration operations

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated with Response Standards)**
```typescript
// Communication service endpoints
POST   /api/communication/sms            // Send SMS message
POST   /api/communication/email          // Send email
POST   /api/communication/bulk           // Bulk communication
GET    /api/communication/status/[id]    // Delivery status

// AI service endpoints
POST   /api/ai/generate-content          // Generate content
POST   /api/ai/analyze-form              // Analyze form data
POST   /api/ai/recommend                 // Get recommendations
GET    /api/ai/usage-stats               // Usage statistics

// Webhook processing endpoints
POST   /api/webhooks/stripe              // Stripe webhook handler
POST   /api/webhooks/twilio              // Twilio webhook handler
POST   /api/webhooks/calendar            // Calendar webhook handler
GET    /api/webhooks/logs                // Webhook processing logs

// Monitoring endpoints
GET    /api/monitoring/health            // Service health status
GET    /api/monitoring/metrics           // Performance metrics
POST   /api/monitoring/alert             // Manual alert trigger
```

### **App-Specific Endpoints**
```typescript
// Handouts - AI content generation and delivery
POST   /api/handouts/ai/generate-content
interface HandoutAIRequest {
  templateType: string;
  patientData: PatientData;
  customizations: ContentCustomization[];
  deliveryMethod: 'email' | 'sms' | 'both';
}

// Medication auth - AI form analysis
POST   /api/medication-auth/ai/analyze-authorization
interface AuthAIRequest {
  formData: AuthorizationFormData;
  patientHistory: MedicalHistory;
  insuranceData: InsuranceInfo;
}

// Check-in kiosk - Payment webhook processing
POST   /api/checkin-kiosk/webhooks/payment-complete
interface PaymentWebhookRequest {
  paymentId: string;
  amount: number;
  status: PaymentStatus;
  notificationPreferences: NotificationPrefs;
}

// Pharma scheduling - Appointment reminders
POST   /api/pharma-scheduling/communication/send-reminder
interface ReminderRequest {
  appointmentId: string;
  reminderType: 'confirmation' | 'reminder_24h' | 'reminder_2h';
  communicationMethod: 'sms' | 'email' | 'both';
}

// EOS L10 - Analytics and reporting
POST   /api/eos-l10/analytics/track-event
interface AnalyticsRequest {
  eventType: string;
  eventData: Record<string, any>;
  userId: string;
  sessionId: string;
}
```

### **External Integrations (Use Universal Hubs ONLY)**
```typescript
// ✅ REQUIRED: Use Universal Hubs - NO direct external API calls
import { 
  UniversalCommunicationHub,  // Twilio MCP (SMS/Voice)
  UniversalPaymentHub,        // Stripe MCP (Payments)
  UniversalAIHub,             // OpenAI integration
  UniversalEmailHub,          // AWS SES integration
  UniversalMonitoringHub      // Service monitoring
} from '@ganger/integrations';

// Implementation patterns:
const commHub = new UniversalCommunicationHub();
await commHub.sendSMS({ 
  to: patient.phone, 
  message: 'Appointment confirmed for tomorrow at 2 PM' 
});

const aiHub = new UniversalAIHub();
const content = await aiHub.generateContent({
  prompt: 'Create patient education content for eczema treatment',
  context: patientData
});

const paymentHub = new UniversalPaymentHub();
await paymentHub.processWebhook(stripeEvent);
```

- **Twilio**: SMS, voice, and communication delivery tracking
- **OpenAI**: Content generation, form analysis, and recommendations
- **Stripe**: Payment webhook processing and transaction management
- **AWS SES**: Email delivery with bounce and complaint handling
- **Custom Analytics**: User behavior tracking and business intelligence

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // Integration actions and status
  secondary: 'green-600',   // Successful operations
  accent: 'purple-600',     // AI-powered features
  neutral: 'slate-600',     // Status text and metrics
  warning: 'amber-600',     // Service warnings and rate limits
  danger: 'red-600'         // Integration failures and errors
}
```

### **Component Usage**
```typescript
// Use shared components for integration interfaces
import {
  // Communication
  SendMessageButton, CommunicationStatus, DeliveryTracker,
  
  // AI Services
  AIGenerateButton, ContentPreview, AILoadingIndicator,
  
  // Webhooks & Monitoring
  WebhookStatus, ServiceHealthIndicator, AlertNotification,
  
  // Analytics
  UsageMetrics, PerformanceChart, IntegrationDashboard
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- Real-time communication delivery status indicators
- AI content generation progress and preview capabilities
- Webhook processing status and retry controls
- Service health monitoring dashboards
- Usage analytics and cost tracking displays

---

## 📱 User Experience

### **User Workflows**
1. **Automated Communications**: Background sending with status notifications and delivery confirmation
2. **AI-Assisted Content**: Interactive content generation with preview and editing capabilities
3. **Payment Processing**: Seamless webhook handling with real-time status updates
4. **Service Monitoring**: Proactive health monitoring with automatic error recovery

### **Performance Requirements (Enforced by Performance Budgets)**
```typescript
// MANDATORY performance budgets - automatically enforced
const PERFORMANCE_BUDGETS = {
  // Integration response time
  communication_send: 2000,    // 2.0s max for communication sending
  ai_generation: 5000,         // 5.0s max for AI content generation
  webhook_processing: 1000,    // 1.0s max for webhook processing
  
  // Client bundle size reduction
  bundle_reduction: 10000000,  // 10MB reduction from Node.js modules
  
  // Service reliability
  uptime_requirement: 0.999,   // 99.9% uptime for webhook processing
};
```
- **Real-time Updates**: < 500ms latency for status updates
- **Offline Capability**: Graceful degradation with queued operations

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all integration interfaces
- **Keyboard Navigation**: Full integration management without mouse
- **Screen Reader Support**: Semantic status and progress announcements
- **Color Contrast**: 4.5:1 minimum ratio for all integration indicators

---

## 🧪 Testing Strategy

### **Automated Testing (Enforced by Quality Gates)**
```typescript
// MANDATORY test patterns - automatically verified
Unit Tests: 95%+ coverage for integration service logic
Integration Tests: All external service endpoints with mock responses
E2E Tests: Complete integration workflows with real service testing
Performance Tests: Response timing and throughput verification
Build Tests: All frontend apps compile without Node.js module errors
Security Tests: API key management and webhook signature validation
Webhook Tests: All webhook scenarios with retry and failure handling
```

### **Quality Gate Integration**
```bash
# Pre-commit verification (automatically runs):
✅ npm run test              # All tests must pass
✅ npm run type-check        # 0 TypeScript errors
✅ npm run build            # All apps build without Node.js errors
✅ npm run test:integrations # Integration service tests
✅ npm run audit:bundle     # Bundle size verification
✅ npm run test:webhooks    # Webhook processing tests
```

### **Test Scenarios**
- SMS delivery with Twilio webhook confirmation
- Email sending with SES bounce handling
- AI content generation with quality validation
- Stripe payment webhook processing with idempotency
- Service health monitoring and alert generation
- Rate limiting and quota management testing
- Error recovery and retry mechanism validation

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with integration audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Advanced integration specific variables
# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...
OPENAI_MAX_TOKENS=4000

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS SES
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=...
AWS_SES_REGION=us-east-1

# Service limits
COMMUNICATION_RATE_LIMIT=100
AI_DAILY_TOKEN_LIMIT=100000
WEBHOOK_RETRY_MAX=3
```

### **Monitoring & Alerts**
- **Service Health Monitoring**: Real-time external service availability tracking
- **Performance Monitoring**: Integration response times and throughput
- **Error Tracking**: Failed operations with detailed error analysis
- **Cost Monitoring**: Usage tracking for paid services (OpenAI, Twilio)

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **Integration Performance**: Response times and success rates
- **Service Usage**: Communication volume and AI usage patterns
- **Cost Tracking**: External service costs and optimization opportunities
- **Error Analysis**: Common failure modes and resolution patterns

### **App-Specific Analytics**
- **Handouts**: AI content generation usage and delivery success rates
- **Medication Auth**: AI analysis accuracy and processing efficiency
- **Check-in Kiosk**: Payment processing success and communication delivery
- **Pharma Scheduling**: Appointment reminder effectiveness and delivery rates
- **EOS L10**: Meeting analytics and team performance insights

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **API Key Management**: Secure storage and rotation of external service credentials
- **Webhook Security**: Signature validation and replay attack prevention
- **Data Encryption**: All communications and AI processing encrypted
- **Audit Logging**: Comprehensive logging of all integration operations
- **Rate Limiting**: Protection against API abuse and cost overruns

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: Secure handling of patient data in communications and AI processing
- **Access Controls**: Role-based permissions for medical communications
- **Audit Requirements**: Complete logging of patient-related integrations
- **Data Minimization**: Only necessary patient data used in external services
- **Encryption**: Strong encryption for all patient communications

### **App-Specific Security**
- Patient communication opt-in verification and consent management
- Medical AI processing compliance and human oversight requirements
- Payment data security and PCI compliance for webhook processing
- Service credential isolation and least-privilege access

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All frontend apps build successfully without Node.js module errors
- [ ] Advanced integration functionality restored across all apps
- [ ] Performance benchmarks met (2s communication, 5s AI, 10MB bundle reduction)
- [ ] Security audit passed for API key management and webhook processing
- [ ] Integration testing completed with all external services

### **Success Metrics (6 months)**
- 100% build success rate across all frontend applications
- 99.9% uptime for webhook processing and critical integrations
- 30 hours/week saved through automated communications and AI assistance
- 25% improvement in patient communication response rates

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Service Health Monitoring**: Daily external service availability and performance checks
- **API Key Rotation**: Quarterly credential updates for all external services
- **Cost Optimization**: Monthly usage analysis and cost optimization
- **Performance Tuning**: Weekly optimization of integration response times

### **Future Enhancements**
- Advanced AI capabilities with custom model training
- Multi-channel communication orchestration
- Predictive analytics and automated decision making
- Integration with additional healthcare-specific services

---

## 📚 Documentation Requirements

### **Developer Documentation (Reference /true-docs/)**
- [ ] **API documentation**: Integration endpoints and service patterns
- [ ] **External service setup**: Step-by-step configuration for Twilio, OpenAI, Stripe, SES
- [ ] **Webhook implementation**: Security, validation, and retry patterns
- [ ] **Error handling**: Troubleshooting guide for integration failures
- [ ] **Performance optimization**: Response timing and cost optimization

### **User Documentation**
- [ ] **Communication features**: Sending messages and tracking delivery
- [ ] **AI assistance**: Using AI features and understanding limitations
- [ ] **Service status**: Understanding integration health and alerts
- [ ] **Troubleshooting**: Common issues and user resolution steps

---

## 🤖 AI Development Integration

### **Terminal Coordination (Reference AI_WORKFLOW_GUIDE.md)**
```yaml
# Specify terminal assignment for optimal development
Terminal_Assignment: Backend

# Expected development pattern
Backend_Terminal_Focus:
  - Advanced service separation (client/server)
  - External API integration (Twilio, OpenAI, Stripe, SES)
  - Webhook processing and validation
  - API route creation for integration operations
  - Error handling and retry logic
  - Performance monitoring and optimization

Coordination_Points:
  - Client interface definition (TypeScript types)
  - Authentication integration (service access control)
  - Real-time features (integration status updates)
  - Performance optimization (bundle size reduction)
```

### **Verification-First Development**
```bash
# MANDATORY verification before claiming completion
✅ npm run type-check        # "Found 0 errors"
✅ npm run build            # "Build completed successfully" (all apps)
✅ npm run test:integrations # "All integration tests passed"
✅ npm run audit:bundle     # "Bundle size reduced by 10MB"
✅ npm run test:e2e-services # "End-to-end service workflows passed"
```

### **Quality Gate Enforcement**
```typescript
// This PRD will be subject to automated quality enforcement:
PreCommitHooks: {
  typeScriptCompilation: "ZERO_ERRORS_TOLERANCE",
  packageBoundaries: "GANGER_PACKAGES_ONLY", 
  buildVerification: "ALL_APPS_BUILD_SUCCESS",
  bundleSize: "NODEJS_MODULES_REMOVAL_VERIFIED",
  integrationTests: "ADVANCED_SERVICES_FUNCTIONAL"
}
```

### **Integration Service Categories**
```typescript
// Clear separation of advanced integration services
CommunicationServices: {
  sms: 'twilio_server_side_only',
  email: 'aws_ses_server_side_only',
  voice: 'twilio_voice_server_side_only',
  clientInterface: 'rest_api_only'
}

AIServices: {
  contentGeneration: 'openai_server_side_only',
  formAnalysis: 'openai_server_side_only',
  recommendations: 'openai_server_side_only',
  clientInterface: 'rest_api_with_streaming'
}

WebhookServices: {
  stripe: 'server_side_validation_and_processing',
  twilio: 'server_side_delivery_confirmation',
  calendar: 'server_side_sync_processing',
  clientInterface: 'status_updates_only'
}
```

---

*This PRD ensures advanced integrations work reliably across all Ganger Platform applications while maintaining build stability and comprehensive functionality.*

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards
- `/true-docs/AI_WORKFLOW_GUIDE.md` - AI development methodologies
- `/_claude_desktop/SPRINT_ADVANCED_INTEGRATIONS_FIX.md` - Detailed implementation plan