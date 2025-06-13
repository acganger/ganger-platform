# PRD: Provider TV Dashboard - Operations & Communication Hub

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Provider TV Dashboard
- **PRD ID**: PRD-TVD-001
- **Priority**: High
- **Development Timeline**: 4-6 weeks (reference PROJECT_TRACKER.md for velocity data)
- **Terminal Assignment**: Mixed (Frontend-heavy with backend API integration)
- **Dependencies**: @ganger/ui, @ganger/auth/client, @ganger/integrations/client, checkin-kiosk app coordination
- **MCP Integration Requirements**: Google My Business API (reviews), UniFi API (network validation), Supabase real-time
- **Quality Gate Requirements**: TV display optimization, real-time performance, network-based access validation

---

## 🎯 Product Overview

### **Purpose Statement**
Real-time TV dashboard displaying patient flow status and team communications to optimize provider schedule adherence and enhance practice efficiency across all Ganger Dermatology locations.

### **Target Users**
- **Primary**: Healthcare Providers (doctors, PAs, NPs) - schedule monitoring and workflow optimization
- **Secondary**: Clinical Staff (nurses, medical assistants) - patient flow management and team communication
- **Tertiary**: Administrative Staff (front desk, practice managers) - practice overview and communication management

### **Success Metrics**
- **15% reduction** in average patient wait times within 3 months of deployment
- **20% improvement** in provider schedule adherence (appointments starting within 5 minutes of scheduled time)
- **90% proactive delay identification** (schedule issues detected 15+ minutes before they occur)
- **80% provider engagement** with SOP updates within 24 hours of posting
- **50% staff participation** in QR code communications monthly

### **Business Value Measurement**
- **ROI Target**: 300% within 12 months through improved patient throughput and reduced overtime costs
- **Cost Savings**: $50,000 annually per location through optimized scheduling and reduced patient complaints
- **Revenue Impact**: 10-15% increase in daily patient capacity through improved flow management
- **User Productivity**: 30 minutes daily time savings per provider through proactive schedule management

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard - MANDATORY)**
```yaml
Frontend: Next.js 14+ with TypeScript (100% compilation required)
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Network-based (UniFi API) + @ganger/auth for settings
Hosting: Cloudflare Workers (with global edge network)
Styling: Tailwind CSS + Ganger Design System (NO custom CSS allowed)
Real-time: Supabase subscriptions + WebSocket fallbacks
File Storage: Supabase Storage with CDN
Build System: Turborepo (workspace compliance required)
Quality Gates: Automated pre-commit hooks (see MASTER_DEVELOPMENT_GUIDE.md)
```

### **Required Shared Packages (MANDATORY - CLIENT-SERVER AWARE)**
```typescript
// ✅ REQUIRED CLIENT IMPORTS - Use exclusively in client components
'use client'
import { 
  AppLayout, Card, DataTable, StatCard, Button, Modal,
  LoadingSpinner, ErrorBoundary, ProgressIndicator
} from '@ganger/ui';
import { useAuth } from '@ganger/auth/client';
import { 
  ClientCommunicationService,
  ClientCacheService 
} from '@ganger/integrations/client';
import { validateForm, formatters, timeUtils } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { db, createClient } from '@ganger/db';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { 
  ServerCommunicationService,
  ServerGoogleService,
  ServerCacheService
} from '@ganger/integrations/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  User, Patient, Appointment, Provider, Location,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```

### **App-Specific Technology**
- **TV Display Optimization**: Large fonts (48px+), high contrast colors, auto-refresh capabilities
- **Network Validation**: UniFi API integration for IP-based access control (no authentication required for viewing)
- **Real-time Coordination**: Shared data service with checkin-kiosk app to prevent duplicate ModMed FHIR API calls
- **QR Code Generation**: Dynamic QR codes for staff submissions and SOP reviews
- **Multi-location Support**: Location-specific data filtering for 3 Ganger Dermatology locations

---

## 👥 Authentication & Authorization

### **Role-Based Access (Network-Based + Settings Authentication)**
```typescript
// Viewing Access: Network-based (no authentication required)
interface NetworkAccess {
  validation: 'unifi_api';
  allowedNetworks: ['ganger_office_ips', 'vpn_access'];
  noAuthRequired: true;
}

// Settings Access: Standard authentication required
interface SettingsAccess {
  roles: ['superadmin', 'manager']; // Can modify dashboard settings
  permissions: ['dashboard_admin'];
  authRequired: true;
}

// Data Access: Automatic based on location association
interface DataAccess {
  patientData: 'initials_and_appointment_type_only'; // HIPAA compliance
  locationFiltering: 'automatic_based_on_display_location';
  realTimeUpdates: 'all_users_in_network';
}
```

### **Access Control**
- **Viewing Access**: Any device on Ganger Dermatology network (office or VPN) - validated via UniFi API
- **Settings Access**: Requires @gangerdermatology.com authentication for dashboard configuration
- **Data Privacy**: Patient identifiers limited to initials + appointment type (no full names or PHI)
- **Location Filtering**: Each dashboard automatically filters to its assigned location

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, locations, providers, provider_schedules,
appointments, audit_logs, notifications
```

### **App-Specific Tables**
```sql
-- TV Dashboard configuration per location
CREATE TABLE tv_dashboard_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  display_name TEXT NOT NULL,
  refresh_interval INTEGER DEFAULT 30, -- seconds
  layout_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Staff submissions via QR code
CREATE TABLE staff_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('huddle_topic', 'kudos', 'photo', 'announcement')),
  content TEXT NOT NULL CHECK (length(content) <= 200),
  image_url TEXT,
  submitted_by_name TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT true,
  display_until TIMESTAMPTZ,
  moderation_notes TEXT,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- RLS policy
  CONSTRAINT rls_location_access CHECK (
    location_id IN (SELECT location_id FROM user_locations WHERE user_id = auth.uid())
  )
);

-- Daily announcements and celebrations
CREATE TABLE daily_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('birthday', 'anniversary', 'achievement', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  display_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- RLS policy
  CONSTRAINT rls_location_access CHECK (
    location_id IN (SELECT location_id FROM user_locations WHERE user_id = auth.uid())
  )
);

-- Google Reviews cache for dashboard display
CREATE TABLE patient_reviews_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) NOT NULL,
  external_review_id TEXT UNIQUE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 4 AND rating <= 5),
  review_text TEXT NOT NULL,
  patient_initials TEXT NOT NULL,
  review_date DATE NOT NULL,
  source TEXT DEFAULT 'google',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast location-based queries
  INDEX idx_reviews_location_rating ON patient_reviews_cache(location_id, rating, review_date DESC)
);

-- SOP updates for provider awareness (placeholder until Document Management System)
CREATE TABLE sop_updates_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  version TEXT NOT NULL,
  author_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'pending_approval', 'approved', 'rejected')),
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  submitted_date TIMESTAMPTZ DEFAULT NOW(),
  review_url TEXT, -- QR code will link here
  location_id UUID REFERENCES locations(id),
  
  -- Auto-cleanup approved/rejected items after 7 days
  display_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
```

### **Data Relationships**
- **Patient Flow Data**: Coordinated with checkin-kiosk app via shared patient status service
- **Provider Schedules**: Links to existing provider and appointment tables
- **Location Association**: All data automatically filtered by location_id for multi-location support
- **Real-time Updates**: Supabase subscriptions for immediate dashboard refresh

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated with Response Standards)**
```typescript
// Dashboard data endpoints (no auth required for viewing)
GET    /api/dashboard/patient-flow      // Current patient queue and lobby status
GET    /api/dashboard/provider-status   // Schedule health for all providers
GET    /api/dashboard/communication     // SOP updates, announcements, reviews
WS     /api/dashboard/real-time        // Live updates for all dashboard data

// Settings endpoints (auth required)
PUT    /api/dashboard/config           // Update dashboard configuration
GET    /api/dashboard/admin            // Admin interface for settings

// Staff interaction endpoints (no auth required)
POST   /api/dashboard/staff-submission // QR code form submissions
GET    /api/dashboard/qr-form/[id]     // Mobile form interface

// External integration endpoints
GET    /api/dashboard/sop-updates      // Document Management System integration
GET    /api/dashboard/reviews/refresh  // Manual Google Reviews refresh
```

### **App-Specific Endpoints**
```typescript
// Network validation endpoint
POST   /api/dashboard/network-check    // UniFi API validation
GET    /api/dashboard/health          // System health for monitoring

// Location-specific data
GET    /api/dashboard/location/[id]/data  // All dashboard data for specific location
GET    /api/dashboard/locations/config   // Multi-location configuration

// Shared data coordination with checkin-kiosk
GET    /api/shared/patient-status      // Coordinated patient data (shared service)
WS     /api/shared/patient-updates     // Real-time patient status changes
```

### **External Integrations (Use Universal Hubs ONLY)**
```typescript
// ✅ REQUIRED: Use Universal Hubs - NO direct external API calls
import { 
  UniversalGoogleHub,     // Google My Business API (reviews)
  UniversalNetworkHub,    // UniFi API (network validation)  
  UniversalDatabaseHub,   // Supabase MCP (real-time data)
  UniversalCacheHub       // Redis MCP (performance optimization)
} from '@ganger/integrations';

// Network validation usage
const networkHub = new UniversalNetworkHub();
const isValidNetwork = await networkHub.validateGangerIP(clientIP);

// Google Reviews integration
const googleHub = new UniversalGoogleHub();
const reviews = await googleHub.getLocationReviews({
  locationId: 'ganger_location_id',
  minRating: 4,
  maxResults: 10
});
```

- **UniFi Network API**: IP validation for network-based access control
- **Google My Business API**: Location-specific patient reviews (4-5 stars only)
- **ModMed FHIR API**: Patient appointment data (coordinated with checkin-kiosk, no duplication)
- **Document Management System API**: SOP updates (placeholder until system completion)

---

## 🎨 User Interface Design

### **Design System (TV-Optimized)**
```typescript
// Ganger Platform Design System - TV Dashboard Variant
colors: {
  primary: 'blue-600',      // Schedule status indicators
  secondary: 'green-600',   // On-time/ahead status
  accent: 'purple-600',     // Communication tiles
  neutral: 'slate-700',     // Large readable text
  warning: 'amber-500',     // Behind schedule
  danger: 'red-500'         // Critical delays/alerts
}

typography: {
  headers: '48px bold',     // Main dashboard headers
  patientQueue: '36px medium', // Patient names and status
  statusIndicators: '28px bold', // Schedule health
  communicationTiles: '24px regular', // Rotating content
  labels: '20px medium'     // Field labels and descriptions
}

spacing: '8px grid system'  // Larger spacing for TV viewing
borderRadius: 'rounded-xl (12px)' // Softer edges for TV display
shadows: 'enhanced depth for TV visibility'
```

### **Layout Specifications (Landscape 1920x1080)**
```typescript
// Main dashboard layout structure
interface DashboardLayout {
  patientFlowSection: {
    height: '80%', // 864px
    layout: 'three-column-grid',
    sections: ['provider-queue', 'lobby-status', 'schedule-health']
  };
  communicationSection: {
    height: '20%', // 216px  
    layout: 'four-tile-rotating',
    tiles: ['sop-updates', 'reviews-carousel', 'staff-qr', 'daily-announcements']
  };
}

// Component usage patterns
import {
  AppLayout,        // Full-screen TV layout
  Card,             // Dashboard sections
  DataTable,        // Patient queue display
  StatCard,         // Metrics and KPIs
  ProgressIndicator,// Schedule adherence
  Modal,            // QR code display
  LoadingSpinner,   // Real-time updates
  ErrorBoundary     // Graceful error handling
} from '@ganger/ui';
```

### **TV Display Optimization Requirements**
- **High Contrast**: 7:1 color contrast ratio for TV viewing distance
- **Large Typography**: Minimum 24px font size, 48px for critical information
- **Auto-Refresh**: 30-second intervals with smooth transitions
- **Error Resilience**: Graceful degradation when services unavailable
- **Screen Burn-in Prevention**: Subtle element movement and dimming schedules

---

## 📱 User Experience

### **Primary Workflows**
1. **Provider Schedule Monitoring**: Glance at dashboard → identify schedule status → adjust pace accordingly
2. **Patient Flow Management**: View lobby status → identify bottlenecks → proactively manage queues
3. **SOP Review via QR**: Notice pending SOP → scan QR with phone → review/approve on mobile
4. **Staff Communication**: Open QR form → submit huddle topic/kudos → see on dashboard within 2 minutes

### **TV Dashboard Auto-Rotation**
```typescript
interface RotationSchedule {
  sopUpdates: 15,      // seconds per SOP item
  reviewsCarousel: 10, // seconds per review
  staffSubmissions: 8, // seconds per submission
  announcements: 12,   // seconds per announcement
  fullCycle: 120      // max 2 minutes full rotation
}
```

### **Mobile QR Code Interfaces**
```typescript
// Staff submission form (mobile-optimized)
interface StaffSubmissionForm {
  categorySelector: ['huddle_topic', 'kudos', 'photo', 'announcement'];
  messageInput: { maxLength: 200, placeholder: 'Share your message...' };
  photoUpload: { optional: true, maxSize: '5MB', formats: ['jpg', 'png'] };
  submitButton: { action: 'immediate_display', feedback: 'success_confirmation' };
}

// SOP review interface (mobile-optimized) 
interface SOPReviewForm {
  documentViewer: { responsive: true, zoomable: true };
  commentsSection: { placeholder: 'Add review comments...' };
  actionButtons: ['approve', 'request_changes', 'save_draft'];
  navigation: { previousSOPs: true, nextSOPs: true };
}
```

### **Performance Requirements (Enforced by Performance Budgets)**
```typescript
// MANDATORY performance budgets - automatically enforced
const TV_DASHBOARD_BUDGETS = {
  // Critical for TV display experience
  fcp: 800,   // 0.8s max First Contentful Paint
  lcp: 1500,  // 1.5s max Largest Contentful Paint
  cls: 0.05,  // Max 0.05 CLS (minimal layout shift)
  tti: 2000,  // 2.0s max Time to Interactive
  
  // Real-time update performance
  dataRefresh: 500,    // 500ms max for patient status updates
  qrGeneration: 200,   // 200ms max for QR code generation
  rotationTransition: 300, // 300ms max for tile transitions
};

// Bundle size budgets optimized for TV loading
javascript: 200000, // 200KB max (faster loading for TV devices)
css: 25000,         // 25KB max
images: 500000,     // 500KB max per image (high quality for TV)
```

### **Accessibility Standards**
- **High Contrast Mode**: 7:1 contrast ratio for TV viewing distances
- **Large Text Support**: Minimum 24px text, scalable up to 60px for headers
- **Color Independence**: All status information conveyed through icons and text, not just color
- **Screen Reader Support**: Full semantic HTML for settings interfaces (dashboard is primarily visual)

---

## 🧪 Testing Strategy

### **Automated Testing (Enforced by Quality Gates)**
```typescript
// MANDATORY test patterns - automatically verified
Unit Tests: 85%+ coverage for real-time data processing
Integration Tests: All API endpoints with network validation
E2E Tests: Full patient flow workflow with real-time updates
Performance Tests: TV display optimization and load testing
Network Tests: UniFi API integration and fallback scenarios
Real-time Tests: WebSocket connection stability and data accuracy
Display Tests: TV layout rendering across different screen sizes
```

### **TV-Specific Testing Requirements**
```bash
# Additional testing for TV dashboard
✅ npm run test:tv-display     # TV layout and font size validation
✅ npm run test:network-access # UniFi API validation testing
✅ npm run test:real-time     # Live data update accuracy
✅ npm run test:qr-codes      # QR generation and mobile forms
✅ npm run test:multi-location # Location-specific data filtering
```

### **Critical Test Scenarios**
- **Network Interruption**: Dashboard continues displaying cached data when network fails
- **Real-time Data Accuracy**: Patient status changes reflect within 30 seconds
- **Multi-location Filtering**: Each location sees only relevant data
- **QR Code Mobile Experience**: Forms work properly on all smartphone browsers
- **Performance Under Load**: Dashboard maintains responsiveness during peak patient flow

---

## 🚀 Deployment & Operations

### **Deployment Strategy (TV-Optimized)**
```yaml
Environment: Cloudflare Workers with edge caching
Build: Next.js static export optimized for TV loading
CDN: Cloudflare global edge network with location-specific caching
Database: Supabase with real-time subscriptions
Monitoring: TV-specific health checks and display monitoring
Hardware: Raspberry Pi 4 or similar per TV location
```

### **Hardware Requirements per Location**
```yaml
Display: 43"+ TV with 1920x1080 resolution, HDMI input
Compute: Raspberry Pi 4 (4GB RAM) or equivalent mini PC
Network: Stable WiFi with Ganger network access
Power: UPS recommended for uninterrupted operation
Mounting: VESA mount in provider/staff common areas
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# TV Dashboard specific variables
TV_DASHBOARD_LOCATION_ID=uuid_for_specific_location
TV_DASHBOARD_REFRESH_INTERVAL=30
UNIFI_CONTROLLER_URL=https://unifi.gangerdermatology.com
UNIFI_API_KEY=unifi_access_token
GOOGLE_MY_BUSINESS_LOCATION_ID=ganger_gmb_location_id

# Device identification
TV_DEVICE_ID=unique_identifier_per_tv
TV_LOCATION_NAME=descriptive_location_name
```

### **Monitoring & Alerts**
- **TV Health Checks**: Automated ping every 5 minutes to verify display functionality  
- **Real-time Data Monitoring**: Alert if patient data updates lag beyond 2 minutes
- **Network Connectivity**: Monitor UniFi API connection and fallback to cached validation
- **Performance Monitoring**: Track page load times and ensure sub-2-second performance
- **Display Monitoring**: Detect screen burn-in and automatically adjust content positioning

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **Dashboard Usage**: View duration, interaction patterns, peak usage times
- **Performance Metrics**: Load times, real-time update latency, error rates
- **Network Analytics**: Connection stability, UniFi validation success rates
- **Staff Engagement**: QR code scan rates, submission frequency, SOP review times

### **TV Dashboard Specific Analytics**
- **Patient Flow Metrics**: Average wait times before/after dashboard deployment
- **Provider Schedule Adherence**: On-time appointment rates improvement tracking
- **Communication Effectiveness**: SOP review completion rates, staff submission engagement
- **Location Comparison**: Cross-location performance and adoption metrics
- **System Health**: Uptime tracking, auto-refresh success rates, data accuracy validation

### **Business Intelligence Reporting**
- **Weekly Practice Flow Report**: Wait times, schedule adherence, patient throughput
- **Monthly Communication Report**: SOP engagement, staff participation, patient feedback
- **Quarterly ROI Analysis**: Time savings, efficiency gains, patient satisfaction impact
- **Annual Performance Review**: Dashboard effectiveness, hardware maintenance, feature usage

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Network-Based Access**: UniFi API validation with IP whitelisting backup
- **Data Minimization**: Patient identifiers limited to initials + appointment type only
- **Encrypted Transmission**: TLS 1.3+ for all API communications
- **Device Security**: Hardened Raspberry Pi with auto-updates and monitoring
- **Display Privacy**: Automatic screen dimming during extended inactivity periods

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: No full patient names, addresses, or medical details displayed
- **Audit Logging**: All settings changes and administrative access logged
- **Data Retention**: Patient flow data purged after 24 hours, no long-term PHI storage
- **Access Controls**: Settings require authenticated admin access, viewing is network-restricted
- **Incident Response**: Automatic alerts for security events or compliance violations

### **TV Dashboard Specific Security**
- **Physical Security**: Device mounting and tamper detection recommendations
- **Network Isolation**: Dedicated VLAN for TV dashboard devices recommended
- **Auto-Lock Settings**: Settings panel auto-locks after 5 minutes of inactivity
- **Remote Management**: Secure SSH access for troubleshooting and updates
- **Content Moderation**: Optional post-moderation for staff submissions if abuse occurs

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All 3 Ganger Dermatology locations equipped with functional TV displays
- [ ] Real-time patient flow data displaying accurately within 30 seconds
- [ ] Network-based access control working with UniFi API integration
- [ ] QR code submissions and SOP review workflows operational
- [ ] Performance budgets met (sub-2-second load times, smooth transitions)
- [ ] Staff training completed for QR code interactions and dashboard interpretation

### **Success Metrics (6 months)**
- **Patient Flow Improvement**: 15% reduction in average wait times
- **Schedule Adherence**: 20% improvement in on-time appointment starts
- **Proactive Management**: 90% of delays identified 15+ minutes in advance
- **Staff Engagement**: 80% SOP review completion within 24 hours
- **Communication Participation**: 50% monthly staff participation in QR submissions
- **System Reliability**: 99.9% uptime during business hours across all locations

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Hardware Maintenance**: Monthly TV display cleaning and device health checks
- **Software Updates**: Automatic security patches, quarterly feature updates
- **Content Management**: Weekly review cache refresh, monthly content moderation review
- **Performance Optimization**: Quarterly performance analysis and optimization
- **Network Validation**: Annual UniFi API credential rotation and testing

### **Future Enhancements (Phase 2)**
- **Advanced Analytics Dashboard**: Historical trends and predictive scheduling
- **Voice Integration**: Automated announcements for critical alerts
- **Mobile Companion App**: Provider smartphone app for personal schedule monitoring
- **AI-Powered Insights**: Machine learning for wait time predictions and optimization
- **Integration Expansion**: Room management system, supply chain alerts, patient communication

### **Scalability Considerations**
- **Additional Locations**: Framework supports unlimited Ganger Dermatology locations
- **Multiple Displays per Location**: Support for provider-specific and area-specific displays
- **Enhanced Communication Features**: Video messages, document sharing, team collaboration tools
- **Advanced Patient Flow**: Integration with room sensors, equipment status, provider availability

---

## 📚 Documentation Requirements

### **Developer Documentation (Reference /true-docs/)**
- [ ] **API documentation**: OpenAPI spec with network validation and real-time endpoints
- [ ] **Database schema**: Multi-location tables, real-time subscriptions, data relationships
- [ ] **TV display optimization**: Performance guidelines, layout specifications, hardware setup
- [ ] **UniFi integration**: Network validation setup, IP whitelisting, troubleshooting procedures
- [ ] **Real-time coordination**: Shared data service with checkin-kiosk, subscription management
- [ ] **QR code system**: Generation, mobile form creation, submission processing workflows
- [ ] **Multi-location support**: Data filtering, configuration management, deployment procedures

### **User Documentation**
- [ ] **TV Dashboard User Guide**: Visual interpretation guide for providers and staff
- [ ] **QR Code Interaction Guide**: Step-by-step instructions for staff submissions and SOP reviews
- [ ] **Administrative Interface**: Dashboard configuration, content moderation, system monitoring
- [ ] **Hardware Setup Guide**: TV mounting, device configuration, network connection procedures
- [ ] **Troubleshooting Guide**: Common issues, support contacts, escalation procedures

### **Operational Documentation**
- [ ] **Installation Checklist**: Hardware setup, software configuration, testing procedures
- [ ] **Maintenance Schedule**: Daily, weekly, monthly, and quarterly maintenance tasks
- [ ] **Security Procedures**: Network validation setup, access control, incident response
- [ ] **Performance Monitoring**: Health check setup, alert configuration, optimization guidelines
- [ ] **Multi-location Deployment**: Scaling procedures, configuration management, support coordination

---

## 🤖 AI Development Integration

### **Terminal Coordination (Reference AI_WORKFLOW_GUIDE.md)**
```yaml
# Specify terminal assignment for optimal development
Terminal_Assignment: Mixed (Frontend-heavy with backend coordination)

# Expected development pattern
Frontend_Terminal_Focus:
  - TV-optimized React components and layouts
  - Real-time data visualization and patient flow displays
  - QR code generation and mobile form interfaces
  - Performance optimization for TV display hardware
  - UniFi network validation integration
  - @ganger/ui integration with TV-specific adaptations

Backend_Terminal_Focus:
  - Shared data service coordination with checkin-kiosk app
  - Google My Business API integration for reviews
  - Supabase real-time subscriptions and data management
  - Network validation API endpoints
  - Multi-location data filtering and security

Coordination_Points:
  - Real-time data service architecture (prevent ModMed API duplication)
  - Network-based access control implementation
  - Patient privacy compliance (initials + appointment type only)
  - Performance optimization for TV display requirements
  - Multi-location data filtering and configuration management
```

### **Verification-First Development**
```bash
# MANDATORY verification before claiming completion
# All tasks must include verification commands and expected output

TV Dashboard specific verification pattern:
✅ npm run type-check              # "Found 0 errors"
✅ npm run build                   # "Build completed successfully"
✅ npm run test                    # "All tests passed"
✅ npm run test:tv-display         # "TV layout optimization verified"
✅ npm run test:real-time          # "Real-time updates working correctly"
✅ npm run test:network-access     # "UniFi API validation functional"
✅ npm run test:multi-location     # "Location filtering working correctly"
✅ npm run audit:performance       # "TV performance budgets met"

# Additional verification for coordinated development
✅ Coordinate with checkin-kiosk:  # "Shared data service working, no duplicate API calls"
✅ Test QR code workflows:         # "Mobile forms functional on iOS/Android"
✅ Verify HIPAA compliance:        # "Patient data limited to initials + appointment type"
```

### **Quality Gate Enforcement**
```typescript
// This PRD will be subject to automated quality enforcement PLUS:
TVDashboardSpecificGates: {
  displayOptimization: "TV_LAYOUT_PERFORMANCE_VERIFIED",
  networkValidation: "UNIFI_API_INTEGRATION_TESTED",
  realTimeAccuracy: "PATIENT_DATA_UPDATES_WITHIN_30_SECONDS",
  multiLocationSupport: "LOCATION_FILTERING_VERIFIED",
  hipaaCompliance: "PHI_LIMITATION_ENFORCED",
  coordinationTesting: "NO_DUPLICATE_MODMED_API_CALLS"
}

// Business value measurement specific to patient flow optimization
ROIMeasurement: {
  waitTimeReduction: "BASELINE_VS_POST_DEPLOYMENT_COMPARISON",
  scheduleAdherence: "PROVIDER_ON_TIME_PERCENTAGE_TRACKING", 
  proactiveAlerts: "EARLY_DELAY_DETECTION_RATE_MONITORING",
  staffEngagement: "SOP_REVIEW_COMPLETION_RATE_TRACKING"
}
```

### **MCP Integration Opportunities**
```typescript
// Leverage available MCP servers for enhanced development:
- Google Sheets MCP: Staff submission tracking and analytics reporting
- Memory MCP: Context preservation across multi-location development sessions
- Time MCP: HIPAA-compliant timestamps and schedule accuracy verification
- Supabase MCP: Advanced real-time subscription management and optimization
- GitHub MCP: Coordinated issue tracking with checkin-kiosk app integration

// TV Dashboard specific MCP integrations:
- UniFi MCP: Network device management and IP validation automation
- Cloudflare MCP: Edge caching optimization for TV display performance
- Google My Business MCP: Automated review fetching and content filtering
```

---

## 📍 Implementation Phases

### **Phase 1: Core Patient Flow Dashboard (3 weeks)**

#### Week 1: Foundation & Shared Data Architecture
- [ ] Create new Next.js app: `/apps/provider-tv-dashboard`
- [ ] Coordinate with checkin-kiosk app to establish shared patient data service
- [ ] Implement UniFi API network validation (no authentication for viewing)
- [ ] Set up basic TV-optimized layout (80% patient flow, 20% communication)
- [ ] Configure Supabase real-time subscriptions for patient status updates

#### Week 2: Patient Flow Features & Multi-location Support
- [ ] Build provider queue display with real-time updates
- [ ] Implement lobby metrics dashboard with location filtering
- [ ] Create schedule health indicators and color-coded status system
- [ ] Add multi-location data filtering and configuration management
- [ ] Performance optimization for TV display requirements

#### Week 3: Testing & Deployment Preparation  
- [ ] Comprehensive testing of real-time data accuracy and performance
- [ ] TV display optimization (fonts, contrast, auto-refresh)
- [ ] Network validation testing and fallback scenarios
- [ ] Hardware setup documentation and deployment procedures
- [ ] Staff training materials for dashboard interpretation

### **Phase 2: Communication Features & QR Integration (2-3 weeks)**

#### Week 4: QR Code System & Mobile Interfaces
- [ ] Implement QR code generation and unique link system
- [ ] Build mobile-optimized staff submission forms
- [ ] Create SOP review interface (placeholder until Document Management System)
- [ ] Test QR code workflows across iOS and Android devices
- [ ] Implement content moderation interface for administrative oversight

#### Week 5: External Integrations & Content Systems
- [ ] Google My Business API integration for location-specific reviews
- [ ] Build rotating communication tiles system with smooth transitions
- [ ] Daily announcements management and display system
- [ ] Staff submissions processing and real-time dashboard updates
- [ ] Integration testing across all communication features

#### Week 6: Polish, Multi-location Deployment & Go-Live
- [ ] Complete performance optimization and bundle size reduction
- [ ] Deploy to all 3 Ganger Dermatology locations with location-specific configuration
- [ ] Comprehensive staff training on QR code interactions and dashboard use
- [ ] Production monitoring setup and health check implementation
- [ ] Go-live support and issue resolution

### **Success Validation**
- [ ] All 3 locations operational with real-time patient flow data
- [ ] Staff successfully using QR codes for submissions and SOP reviews
- [ ] Performance budgets met across all TV displays
- [ ] No duplicate ModMed API calls (coordination with checkin-kiosk verified)
- [ ] HIPAA compliance validated (patient data limited to initials + appointment type)

---

*This PRD ensures seamless integration with existing Ganger Platform infrastructure while delivering a high-impact patient flow optimization solution that improves provider efficiency and enhances team communication across all locations.*

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards and shared package usage
- `/true-docs/AI_WORKFLOW_GUIDE.md` - Terminal coordination for mixed frontend/backend development
- `/true-docs/PROJECT_TRACKER.md` - Current platform status and development velocity data
- `apps/checkin-kiosk/README.md` - Coordination requirements for shared patient data service
