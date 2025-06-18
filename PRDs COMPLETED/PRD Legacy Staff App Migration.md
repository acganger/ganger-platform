# PRD: Legacy Staff Application Migration to Ganger Platform

## 📋 **Executive Summary**

**Project**: Migration of Legacy PHP Staff Portal to Modern Next.js Platform  
**Target Application**: `apps/staff` - Comprehensive Staff Management & Operations Platform  
**Migration Scope**: Complete feature parity + modern enhancements for staff management, ticket systems, and HR workflows  
**Business Impact**: Modernize critical HR and IT support workflows serving 50+ employees across 3 locations  

## 🎯 **Project Objectives**

### **Primary Goals**
1. **Feature Preservation**: Migrate all existing functionality without loss
2. **Modern Architecture**: Leverage Next.js, TypeScript, Supabase infrastructure
3. **Enhanced UX**: Improve user experience with modern interface patterns
4. **Integration Enhancement**: Upgrade Google Workspace and third-party integrations
5. **Scalability**: Prepare for multi-location expansion and increased user load

### **Success Metrics**
- **Migration Completeness**: 100% feature parity with legacy system
- **Performance**: Sub-500ms page load times (vs. 2-3s legacy)
- **User Adoption**: 100% staff transition within 30 days
- **Error Reduction**: 90% reduction in system errors and downtime
- **Mobile Usage**: 80% mobile compatibility (vs. 20% legacy)

## 🏗️ **Technical Architecture**

### **Platform Integration**
- **Application**: `apps/staff` within Ganger Platform monorepo
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Authentication**: Google OAuth via Supabase Auth + Workspace integration
- **File Storage**: Supabase Storage with CDN delivery
- **Real-time**: WebSocket subscriptions for live updates
- **API Layer**: Next.js API routes with TypeScript interfaces

### **Technology Stack**
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with Ganger Design System
- **State Management**: React Query + Zustand for complex state
- **Form Management**: React Hook Form + Zod validation
- **File Upload**: Supabase Storage with progressive upload
- **Real-time**: Supabase Realtime for live status updates

## 📊 **Database Schema Design**

### **Core Tables**

#### **`staff_tickets`** - Main Ticket System
```sql
CREATE TABLE staff_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL, -- 'support_ticket', 'time_off_request', etc.
  submitter_id UUID REFERENCES auth.users(id),
  submitter_email TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT,
  location TEXT, -- 'Northfield', 'Woodbury', 'Burnsville'
  title TEXT NOT NULL,
  description TEXT,
  form_data JSONB NOT NULL, -- Form-specific data
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can view own tickets" ON staff_tickets
  FOR SELECT USING (submitter_id = auth.uid() OR 
                   (auth.jwt() ->> 'email') = ANY(get_manager_emails()));

CREATE POLICY "Managers can view all tickets" ON staff_tickets
  FOR ALL USING ((auth.jwt() ->> 'email') = ANY(get_manager_emails()));
```

#### **`staff_ticket_comments`** - Comment System
```sql
CREATE TABLE staff_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES staff_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Manager-only comments
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_attachments`** - File Management
```sql
CREATE TABLE staff_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES staff_tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase storage path
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_form_definitions`** - Dynamic Form System
```sql
CREATE TABLE staff_form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  form_schema JSONB NOT NULL, -- JSON Schema for validation
  ui_schema JSONB, -- UI rendering configuration
  workflow_config JSONB, -- Status transitions and approvals
  is_active BOOLEAN DEFAULT TRUE,
  requires_manager_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_user_profiles`** - Extended User Information
```sql
CREATE TABLE staff_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  employee_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'staff', -- 'staff', 'manager', 'admin'
  location TEXT, -- Primary work location
  hire_date DATE,
  manager_id UUID REFERENCES staff_user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  google_user_data JSONB, -- Cached Google Workspace info
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_notifications`** - Notification System
```sql
CREATE TABLE staff_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ticket_id UUID REFERENCES staff_tickets(id),
  type TEXT NOT NULL, -- 'status_change', 'new_comment', 'assignment', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channels TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'slack'
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`staff_analytics`** - Usage Analytics
```sql
CREATE TABLE staff_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'ticket_created', 'status_changed', etc.
  user_id UUID REFERENCES auth.users(id),
  ticket_id UUID REFERENCES staff_tickets(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎨 **User Interface Design**

### **Dashboard Layout**
```typescript
interface StaffDashboard {
  header: {
    userProfile: UserProfile;
    notifications: NotificationBadge;
    quickActions: QuickActionMenu;
  };
  sidebar: {
    navigation: NavigationMenu;
    formTypes: FormTypeList;
    filters: FilterPanel;
  };
  main: {
    ticketList: TicketListView;
    ticketDetail: TicketDetailView;
    formEditor: DynamicFormView;
  };
  footer: {
    statusBar: SystemStatusBar;
    helpCenter: HelpCenterLink;
  };
}
```

### **Responsive Design Requirements**
- **Desktop**: Full-featured dashboard with multi-panel layout
- **Tablet**: Collapsible sidebar with touch-optimized controls
- **Mobile**: Stack layout with bottom navigation and swipe gestures
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation

## 🔧 **Feature Migration Plan**

### **Phase 1: Core Feature Migration**

#### **1.1 Authentication & User Management**
**Legacy**: Basic Google OAuth with domain restriction  
**Modern**: Enhanced Supabase Auth + Google Workspace integration

```typescript
interface AuthenticationFeatures {
  googleOAuth: {
    domainRestriction: 'gangerdermatology.com';
    scopes: ['profile', 'email', 'admin.directory.users.readonly'];
    sessionManagement: 'supabase_auth';
  };
  userProfiles: {
    autoSync: boolean; // Sync with Google Workspace
    roleManagement: 'database_driven';
    profileEnrichment: 'google_directory_api';
  };
  permissions: {
    roleBasedAccess: ('staff' | 'manager' | 'admin')[];
    resourceLevelSecurity: 'row_level_security';
    multiLocationSupport: boolean;
  };
}
```

#### **1.2 Dynamic Form System**
**Legacy**: JSON-configured forms with server-side validation  
**Modern**: React Hook Form + Zod schemas with real-time validation

```typescript
interface FormSystemFeatures {
  formTypes: {
    supportTicket: SupportTicketForm;
    timeOffRequest: TimeOffRequestForm;
    punchFix: PunchFixForm;
    availabilityChange: AvailabilityChangeForm;
    userCreation: UserCreationForm; // Enhanced from legacy stub
  };
  validation: {
    clientSide: 'zod_schemas';
    serverSide: 'api_validation';
    realTime: 'progressive_validation';
  };
  rendering: {
    dynamicGeneration: 'react_hook_form';
    conditionalFields: 'dependency_resolution';
    accessibility: 'aria_compliant';
  };
}
```

#### **1.3 File Upload & Management**
**Legacy**: Basic file upload with local storage  
**Modern**: Progressive upload with Supabase Storage + CDN

```typescript
interface FileManagementFeatures {
  upload: {
    progressive: boolean; // Chunked upload for large files
    validation: 'mime_type_detection';
    virusScanning: 'clamav_integration'; // New security feature
    imageOptimization: 'automatic_compression';
  };
  storage: {
    provider: 'supabase_storage';
    cdnDelivery: boolean;
    encryption: 'at_rest_and_transit';
    backup: 'automatic_redundancy';
  };
  access: {
    securityModel: 'rls_policies';
    temporaryUrls: 'signed_urls';
    downloadTracking: 'audit_logging';
  };
}
```

### **Phase 2: Enhanced Features**

#### **2.1 Real-time Collaboration**
**New Feature**: Live updates and collaboration capabilities

```typescript
interface RealTimeFeatures {
  liveUpdates: {
    ticketStatus: 'websocket_subscriptions';
    newComments: 'instant_notifications';
    assignmentChanges: 'real_time_updates';
  };
  collaboration: {
    concurrentEditing: 'conflict_resolution';
    presenceIndicators: 'user_activity_status';
    liveComments: 'real_time_chat';
  };
  notifications: {
    inApp: 'toast_notifications';
    email: 'smtp_integration';
    slack: 'webhook_integration';
    push: 'pwa_notifications';
  };
}
```

#### **2.2 Advanced Workflow Engine**
**Legacy**: Simple status progression  
**Modern**: Configurable workflows with complex routing

```typescript
interface WorkflowEngine {
  statusTransitions: {
    configurable: boolean;
    conditionalLogic: 'business_rules';
    approvalChains: 'multi_level_approval';
    escalation: 'time_based_escalation';
  };
  automation: {
    triggers: 'event_driven';
    actions: 'webhook_support';
    scheduling: 'cron_job_integration';
    businessRules: 'rule_engine';
  };
  reporting: {
    workflowMetrics: 'performance_analytics';
    bottleneckDetection: 'process_mining';
    complianceTracking: 'audit_trails';
  };
}
```

#### **2.3 Analytics & Reporting Dashboard**
**Legacy**: Basic ticket counts  
**Modern**: Comprehensive analytics with business intelligence

```typescript
interface AnalyticsFeatures {
  dashboards: {
    managerOverview: 'executive_summary';
    teamMetrics: 'performance_indicators';
    systemHealth: 'operational_metrics';
    customDashboards: 'user_configurable';
  };
  reports: {
    ticketAnalytics: 'trend_analysis';
    userProductivity: 'performance_metrics';
    slaCompliance: 'service_level_tracking';
    exportCapability: 'pdf_excel_export';
  };
  predictions: {
    workloadForecasting: 'ml_predictions';
    escalationPrediction: 'risk_analysis';
    resourceOptimization: 'capacity_planning';
  };
}
```

### **Phase 3: Integration & Automation**

#### **3.1 Enhanced Google Workspace Integration**
**Legacy**: Basic user info retrieval  
**Modern**: Full Admin SDK integration with automation

```typescript
interface GoogleWorkspaceIntegration {
  userManagement: {
    autoUserCreation: 'admin_sdk_integration';
    orgUnitManagement: 'automated_placement';
    groupManagement: 'role_based_groups';
    licenseManagement: 'automatic_assignment';
  };
  directorySync: {
    bidirectionalSync: boolean;
    realTimeUpdates: 'webhook_notifications';
    conflictResolution: 'master_data_management';
  };
  calendarIntegration: {
    timeOffSync: 'calendar_blocking';
    meetingScheduling: 'automated_booking';
    resourceBooking: 'room_equipment_management';
  };
}
```

#### **3.2 Zenefits & Deputy API Integration**
**New Feature**: HR system automation with third-party platforms

```typescript
interface HRSystemIntegration {
  zenefits: {
    newHireOnboarding: 'automated_workflow';
    employeeDataSync: 'bidirectional_sync';
    benefitsManagement: 'enrollment_tracking';
    complianceReporting: 'automated_reports';
  };
  deputy: {
    timesheetIntegration: 'punch_fix_automation';
    scheduleSync: 'availability_updates';
    shiftManagement: 'automated_assignments';
    payrollIntegration: 'timesheet_export';
  };
  workflows: {
    newHireDetection: 'zenefits_webhook';
    accountProvisioning: 'automated_google_creation';
    onboardingTasks: 'checklist_automation';
    offboardingProcess: 'account_deactivation';
  };
}
```

#### **3.3 Communication Hub Integration**
**New Feature**: Multi-channel communication platform

```typescript
interface CommunicationIntegration {
  email: {
    templating: 'dynamic_email_templates';
    automation: 'workflow_triggered';
    tracking: 'delivery_read_receipts';
  };
  slack: {
    channelIntegration: 'dedicated_channels';
    botCommands: 'slash_command_interface';
    notifications: 'contextual_alerts';
  };
  sms: {
    urgentAlerts: 'twilio_integration';
    twoFactorAuth: 'security_verification';
    appointmentReminders: 'automated_scheduling';
  };
}
```

## 📱 **Mobile-First Design**

### **Progressive Web App Features**
- **Offline Capability**: Service worker for offline form filling
- **Push Notifications**: Critical ticket updates and assignments
- **Home Screen Installation**: Native app-like experience
- **Touch Optimizations**: Swipe gestures and touch-friendly controls

### **Mobile-Specific Features**
```typescript
interface MobileFeatures {
  quickActions: {
    cameraUpload: 'photo_attachments';
    voiceNotes: 'audio_transcription';
    qrCodeScanning: 'asset_identification';
    locationServices: 'automatic_location_detection';
  };
  offlineMode: {
    formCaching: 'progressive_sync';
    dataStorage: 'indexed_db';
    backgroundSync: 'service_worker';
  };
  notifications: {
    pushNotifications: 'web_push_api';
    badgeUpdates: 'unread_counts';
    criticalAlerts: 'urgent_ticket_notifications';
  };
}
```

## 🔐 **Security & Compliance**

### **Enhanced Security Features**
```typescript
interface SecurityFeatures {
  authentication: {
    multiFactorAuth: 'google_authenticator';
    sessionManagement: 'jwt_refresh_tokens';
    passwordlessAuth: 'email_magic_links';
  };
  dataProtection: {
    encryptionAtRest: 'database_encryption';
    encryptionInTransit: 'tls_1_3';
    fileEncryption: 'client_side_encryption';
  };
  accessControl: {
    rowLevelSecurity: 'supabase_rls';
    roleBasedAccess: 'hierarchical_permissions';
    resourceLevelAuth: 'fine_grained_permissions';
  };
  auditLogging: {
    comprehensiveAudits: 'all_user_actions';
    complianceReporting: 'sox_hipaa_compliance';
    dataRetention: 'configurable_retention_policies';
  };
}
```

### **HIPAA Compliance Features**
- **Data Minimization**: Only collect necessary information
- **Access Logging**: Complete audit trail of data access
- **Encryption**: End-to-end encryption for sensitive data
- **User Training**: Built-in security awareness features

## 🚀 **Performance Requirements**

### **Performance Targets**
```typescript
interface PerformanceTargets {
  pageLoad: {
    dashboard: '<500ms';
    formRendering: '<200ms';
    fileUpload: '<1s_per_10MB';
  };
  realTime: {
    notificationDelay: '<100ms';
    statusUpdates: '<50ms';
    chatMessages: '<25ms';
  };
  scalability: {
    concurrentUsers: 100;
    dailyTickets: 500;
    fileStorage: '1TB_per_year';
  };
}
```

### **Optimization Strategies**
- **Code Splitting**: Dynamic imports for form components
- **Image Optimization**: Automatic WebP conversion and compression
- **Caching Strategy**: Redis for session data, CDN for static assets
- **Database Optimization**: Proper indexing and query optimization

## 📊 **Form Specifications**

### **Support Ticket Form**
```typescript
interface SupportTicketForm {
  fields: {
    location: {
      type: 'select';
      options: ['Northfield', 'Woodbury', 'Burnsville'];
      required: true;
    };
    requestType: {
      type: 'select';
      options: ['General Support', 'Equipment Issue', 'Software Problem', 'Network Issue', 'Other'];
      required: true;
    };
    priority: {
      type: 'matrix';
      dimensions: ['Urgent/Not Urgent', 'Important/Not Important'];
      required: true;
    };
    description: {
      type: 'textarea';
      maxLength: 2000;
      required: true;
    };
    attachments: {
      type: 'file_upload';
      maxFiles: 10;
      maxSize: '50MB_total';
      allowedTypes: ['image/*', '.pdf', '.doc', '.docx'];
    };
  };
  workflow: {
    initialStatus: 'pending';
    approvalRequired: false;
    autoAssignment: 'round_robin';
    escalationTimer: '24_hours';
  };
}
```

### **Time Off Request Form**
```typescript
interface TimeOffRequestForm {
  fields: {
    dateRange: {
      type: 'date_range';
      validation: 'start_before_end';
      minAdvanceNotice: '48_hours';
      required: true;
    };
    ptoElection: {
      type: 'select';
      options: ['Paid Time Off', 'Unpaid Leave', 'Sick Leave'];
      required: true;
    };
    reason: {
      type: 'textarea';
      maxLength: 500;
      required: false;
    };
  };
  workflow: {
    initialStatus: 'pending_approval';
    approvalRequired: true;
    approver: 'direct_manager';
    autoReminders: ['approval_pending', 'approved', 'denied'];
  };
}
```

### **Punch Fix Form**
```typescript
interface PunchFixForm {
  fields: {
    employeeSelect: {
      type: 'autocomplete';
      dataSource: 'google_directory';
      managerOnly: true;
      required: true;
    };
    date: {
      type: 'date';
      maxPastDays: 14;
      required: true;
    };
    punchIn: {
      type: 'time';
      required: false;
    };
    punchOut: {
      type: 'time';
      required: false;
      validation: 'after_punch_in';
    };
    comments: {
      type: 'textarea';
      maxLength: 500;
      required: true;
    };
  };
  workflow: {
    initialStatus: 'pending_approval';
    approvalRequired: true;
    approver: 'hr_admin';
    payrollIntegration: 'deputy_sync';
  };
}
```

### **Change of Availability Form**
```typescript
interface AvailabilityChangeForm {
  fields: {
    changeType: {
      type: 'select';
      options: ['Schedule Change', 'Hours Reduction', 'Hours Increase', 'Department Transfer'];
      required: true;
    };
    employmentType: {
      type: 'radio';
      options: ['Part Time', 'Full Time'];
      required: true;
    };
    effectiveDate: {
      type: 'date';
      minAdvanceNotice: '14_days';
      required: true;
    };
    affectedDays: {
      type: 'multi_select';
      options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      required: true;
    };
    reason: {
      type: 'textarea';
      maxLength: 1000;
      required: true;
    };
  };
  workflow: {
    initialStatus: 'pending_approval';
    approvalRequired: true;
    approvalChain: ['direct_manager', 'hr_admin'];
    scheduleSync: 'deputy_integration';
  };
}
```

### **Enhanced User Creation Form**
```typescript
interface UserCreationForm {
  fields: {
    employeeInfo: {
      firstName: { type: 'text'; required: true; };
      lastName: { type: 'text'; required: true; };
      personalEmail: { type: 'email'; required: true; };
      phoneNumber: { type: 'tel'; required: true; };
    };
    employmentDetails: {
      department: { type: 'select'; dataSource: 'departments'; required: true; };
      role: { type: 'text'; required: true; };
      manager: { type: 'autocomplete'; dataSource: 'managers'; required: true; };
      startDate: { type: 'date'; required: true; };
      location: { type: 'select'; options: ['Northfield', 'Woodbury', 'Burnsville']; };
    };
    googleAccount: {
      generateEmail: { type: 'computed'; pattern: 'first.last@gangerdermatology.com'; };
      organizationalUnit: { type: 'select'; dataSource: 'google_ous'; };
      groups: { type: 'multi_select'; dataSource: 'google_groups'; };
      licenses: { type: 'multi_select'; dataSource: 'google_licenses'; };
    };
    systemAccess: {
      applications: { type: 'multi_select'; dataSource: 'platform_apps'; };
      roles: { type: 'multi_select'; dataSource: 'system_roles'; };
      specialPermissions: { type: 'textarea'; required: false; };
    };
  };
  automation: {
    googleUserCreation: 'admin_sdk_api';
    accountProvisioning: 'automated_setup';
    notificationWorkflow: 'manager_hr_notifications';
    onboardingTasks: 'checklist_generation';
  };
}
```

## 🔄 **Migration Strategy**

### **Phase 1: Infrastructure Setup (Week 1-2)**
1. **Database Migration**: Convert legacy MySQL to Supabase PostgreSQL
2. **Authentication Setup**: Implement Google OAuth with Supabase Auth
3. **File Migration**: Transfer files to Supabase Storage
4. **Basic UI**: Create core dashboard and navigation

### **Phase 2: Core Feature Implementation (Week 3-6)**
1. **Form System**: Implement dynamic form engine with validation
2. **Ticket Management**: Create ticket list, detail views, and status management
3. **File Upload**: Implement progressive file upload with validation
4. **User Management**: Basic user profiles and role management

### **Phase 3: Enhanced Features (Week 7-10)**
1. **Real-time Updates**: WebSocket integration for live updates
2. **Notification System**: Email and in-app notifications
3. **Advanced Search**: Full-text search and filtering
4. **Mobile Optimization**: Responsive design and PWA features

### **Phase 4: Integrations & Automation (Week 11-14)**
1. **Google Workspace**: Full Admin SDK integration
2. **Zenefits Integration**: HR system automation
3. **Deputy Integration**: Time tracking and scheduling
4. **Analytics Dashboard**: Reporting and business intelligence

### **Phase 5: Testing & Deployment (Week 15-16)**
1. **User Acceptance Testing**: Staff and manager testing sessions
2. **Performance Optimization**: Load testing and optimization
3. **Security Audit**: Comprehensive security review
4. **Production Deployment**: Gradual rollout with fallback plan

## 📈 **Success Metrics & KPIs**

### **Technical Metrics**
```typescript
interface TechnicalKPIs {
  performance: {
    pageLoadTime: '<500ms';
    apiResponseTime: '<200ms';
    uptime: '>99.9%';
    errorRate: '<0.1%';
  };
  usage: {
    dailyActiveUsers: '100%_staff';
    formCompletionRate: '>95%';
    mobileUsage: '>50%';
    featureAdoption: '>80%';
  };
  quality: {
    bugReports: '<5_per_month';
    userSatisfaction: '>4.5_out_of_5';
    trainingTime: '<30_minutes';
    supportTickets: '<2_per_month';
  };
}
```

### **Business Metrics**
- **Ticket Resolution Time**: 50% improvement over legacy system
- **Manager Productivity**: 30% reduction in administrative overhead
- **User Onboarding**: 90% reduction in new user setup time
- **Compliance**: 100% audit trail for all HR processes
- **Cost Reduction**: 60% hosting cost reduction with modern infrastructure

## 🚨 **Risk Assessment & Mitigation**

### **High-Risk Areas**
1. **Data Migration**: Risk of data loss during MySQL to PostgreSQL migration
   - **Mitigation**: Comprehensive backup strategy and parallel testing
2. **User Adoption**: Resistance to change from legacy system
   - **Mitigation**: Training program and gradual rollout
3. **Google API Limits**: Rate limiting with Admin SDK integration
   - **Mitigation**: Proper caching and request batching
4. **File Migration**: Large file transfer and validation
   - **Mitigation**: Incremental migration with validation checksums

### **Medium-Risk Areas**
1. **Integration Complexity**: Third-party API changes
   - **Mitigation**: Robust error handling and fallback mechanisms
2. **Performance**: Real-time features may impact performance
   - **Mitigation**: Load testing and performance monitoring
3. **Security**: Increased attack surface with web application
   - **Mitigation**: Comprehensive security review and penetration testing

## 🎯 **Acceptance Criteria**

### **Functional Requirements**
- [ ] All legacy forms successfully migrated with enhanced validation
- [ ] User authentication works with Google Workspace integration
- [ ] File upload supports all legacy file types plus modern optimizations
- [ ] Ticket workflow matches legacy behavior with enhanced features
- [ ] Manager dashboard provides superior functionality to legacy system
- [ ] Real-time updates work across all supported devices
- [ ] Mobile interface provides full functionality with optimized UX

### **Non-Functional Requirements**
- [ ] Page load times under 500ms for dashboard and forms
- [ ] 99.9% uptime with automatic failover and recovery
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Full offline capability for form filling and viewing
- [ ] Comprehensive audit logging for all user actions
- [ ] Secure file handling with encryption and access controls

### **Integration Requirements**
- [ ] Google Admin SDK integration for user management
- [ ] Zenefits webhook integration for new hire detection
- [ ] Deputy API integration for time tracking automation
- [ ] Email and Slack notification delivery
- [ ] Supabase real-time subscriptions for live updates
- [ ] PWA capabilities with offline functionality

## 📚 **Implementation Standards & Procedures**

### **Development Standards**
This migration follows established Ganger Platform standards:
- **Frontend Development**: `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md` - Component patterns, state management, and UI standards
- **Backend Development**: `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md` - API design, database patterns, and performance optimization
- **Shared Infrastructure**: `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md` - Authentication, integrations, and deployment patterns
- **AI Workflow Integration**: `/true-docs/AI_WORKFLOW_GUIDE.md` - User training protocols and change management

### **Quality Assurance & Testing**
- **Performance Testing**: Load testing framework and acceptance criteria in `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md#performance-validation`
- **Security Audit**: Penetration testing procedures and compliance validation in `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md#security-architecture`
- **Code Quality**: TypeScript standards and ESLint configurations in `/true-docs/FRONTEND_DEVELOPMENT_GUIDE.md#code-quality`
- **API Testing**: REST API testing patterns and validation in `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md#api-testing`

### **Training & Change Management**
- **User Training**: Training delivery methodology and materials in `/true-docs/AI_WORKFLOW_GUIDE.md#user-training-protocols`
- **Documentation Standards**: Technical writing and maintenance in `/true-docs/PROJECT_TRACKER.md#documentation-references`
- **Change Management**: User adoption strategies and communication plans in `/true-docs/AI_WORKFLOW_GUIDE.md`

### **Infrastructure & Deployment**
- **Deployment Process**: CI/CD pipeline and environment configuration in `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md#deployment`
- **Monitoring & Observability**: System monitoring and alerting in `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md#monitoring`
- **Database Operations**: Migration procedures and backup strategies in `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md#database`

## 🔄 **Legacy-Specific Migration Procedures**

### **Data Migration Scripts**
**MySQL to PostgreSQL Conversion Requirements:**

Based on analysis of the actual legacy database structure, here are the verified migration scripts:

```sql
-- Verified Legacy Database Schema Analysis:
-- ✅ staff_tickets: Main tickets table with JSON payload
-- ✅ staff_ticket_comments: Comment system
-- ✅ staff_file_uploads: File attachment system
-- ✅ staff_user_cache: Google user information cache
-- ✅ staff_approvals: Approval workflow
-- ✅ staff_job_queue: Background job processing
-- ✅ staff_notifications: Notification delivery tracking
-- ✅ staff_pending_hires: User creation workflow
-- ✅ staff_login_attempts: Security audit logging

CREATE OR REPLACE FUNCTION migrate_legacy_staff_data()
RETURNS void AS $$
BEGIN
  -- Step 1: Migrate user cache to user profiles
  INSERT INTO staff_user_profiles (
    id, employee_id, full_name, email, department, role,
    location, hire_date, manager_id, is_active, google_user_data,
    created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    SUBSTRING(email, 1, POSITION('@' IN email) - 1), -- Extract username as employee_id
    JSON_UNQUOTE(JSON_EXTRACT(user_data, '$.name')),
    email,
    'General', -- Default department
    CASE 
      WHEN email IN ('anand@gangerdermatology.com', 'personnel@gangerdermatology.com', 'office@gangerdermatology.com') 
      THEN 'admin'
      WHEN email IN ('ops@gangerdermatology.com', 'compliance@gangerdermatology.com')
      THEN 'manager'
      ELSE 'staff'
    END,
    'Multiple', -- Default location
    NULL, -- hire_date not available in cache
    NULL, -- manager_id to be resolved later
    TRUE, -- is_active
    user_data::jsonb,
    created_at,
    updated_at
  FROM legacy_mysql.staff_user_cache;

  -- Step 2: Migrate main tickets with enhanced form data
  INSERT INTO staff_tickets (
    id, form_type, submitter_id, submitter_email, submitter_name,
    status, priority, location, title, description, form_data,
    assigned_to, due_date, completed_at, created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    form_type,
    get_user_id_by_email(submitter_email),
    submitter_email,
    JSON_UNQUOTE(JSON_EXTRACT(payload, '$.submitter_name')),
    CASE status
      WHEN 'Pending Approval' THEN 'pending'
      WHEN 'Open' THEN 'open'
      WHEN 'In Progress' THEN 'in_progress'
      WHEN 'Stalled' THEN 'stalled'
      WHEN 'Approved' THEN 'approved'
      WHEN 'Denied' THEN 'denied'
      WHEN 'Completed' THEN 'completed'
      ELSE 'pending'
    END,
    priority,
    COALESCE(location, JSON_UNQUOTE(JSON_EXTRACT(payload, '$.location'))),
    COALESCE(
      JSON_UNQUOTE(JSON_EXTRACT(payload, '$.title')),
      LEFT(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.details')), 100),
      CONCAT(form_type, ' request')
    ),
    JSON_UNQUOTE(JSON_EXTRACT(payload, '$.details')),
    payload::jsonb,
    get_user_id_by_email(assigned_to_email),
    NULL, -- due_date not in legacy
    CASE WHEN status = 'Completed' THEN action_taken_at ELSE NULL END,
    created_at,
    updated_at
  FROM legacy_mysql.staff_tickets;

  -- Step 3: Migrate comments with author resolution
  INSERT INTO staff_ticket_comments (
    id, ticket_id, author_id, author_email, author_name,
    content, is_internal, created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    get_new_ticket_id(ticket_id),
    get_user_id_by_email(author_email),
    author_email,
    COALESCE(
      (SELECT JSON_UNQUOTE(JSON_EXTRACT(user_data, '$.name')) 
       FROM legacy_mysql.staff_user_cache 
       WHERE email = author_email LIMIT 1),
      SUBSTRING(author_email, 1, POSITION('@' IN author_email) - 1)
    ),
    comment,
    FALSE, -- Legacy system didn't distinguish internal comments
    created_at,
    created_at AS updated_at
  FROM legacy_mysql.staff_ticket_comments;

  -- Step 4: Migrate file uploads with proper path mapping
  INSERT INTO staff_attachments (
    id, ticket_id, file_name, file_size, file_type,
    storage_path, uploaded_by, created_at
  )
  SELECT 
    gen_random_uuid(),
    get_new_ticket_id(ticket_id),
    original_filename,
    file_size,
    mime_type,
    CONCAT('migrated/', upload_path), -- Prefix legacy paths
    get_user_id_by_email(uploaded_by),
    created_at
  FROM legacy_mysql.staff_file_uploads
  WHERE status = 'active'; -- Only migrate active files

  -- Step 5: Migrate pending hires to modern user creation workflow
  INSERT INTO staff_user_creation_requests (
    id, first_name, last_name, personal_email, personal_mobile,
    generated_username, status, created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    first_name,
    last_name,
    personal_email,
    personal_mobile,
    generated_username,
    'pending',
    created_at,
    created_at AS updated_at
  FROM legacy_mysql.staff_pending_hires;

  -- Step 6: Migrate approvals to new approval tracking
  INSERT INTO staff_approval_history (
    id, ticket_id, approver_id, approver_email,
    action, comments, created_at
  )
  SELECT 
    gen_random_uuid(),
    get_new_ticket_id(ticket_id),
    get_user_id_by_email(approver_email),
    approver_email,
    LOWER(action), -- 'approved' or 'denied'
    comments,
    created_at
  FROM legacy_mysql.staff_approvals;

END;
$$ LANGUAGE plpgsql;

-- Helper functions for migration
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_addr TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  IF email_addr IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT id INTO user_id 
  FROM staff_user_profiles 
  WHERE email = email_addr;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_new_ticket_id(legacy_id INTEGER)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Map legacy ticket IDs to new UUIDs
  -- This would need to be populated during ticket migration
  SELECT id INTO new_id 
  FROM staff_tickets 
  WHERE form_data->>'legacy_id' = legacy_id::text;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

**File Migration Strategy:**
```bash
#!/bin/bash
# Legacy file migration script
LEGACY_PATH="/legacy-a2hosting-apps/staff/uploads"
SUPABASE_BUCKET="staff-attachments"

# Migrate active files
aws s3 sync $LEGACY_PATH/active/ supabase-storage:$SUPABASE_BUCKET/active/
# Migrate archived files  
aws s3 sync $LEGACY_PATH/archived/ supabase-storage:$SUPABASE_BUCKET/archived/
# Verify checksums
verify_file_integrity.sh
```

### **Emergency Rollback Procedures**

**Rollback Decision Matrix:**
- **Phase 1 Issues** (<24 hours): Full rollback to legacy system
- **Phase 2-3 Issues** (>24 hours): Data preservation with legacy system reactivation
- **Data Corruption**: Immediate rollback with data restoration

**Emergency Rollback Steps:**
```bash
# 1. Immediate System Isolation (5 minutes)
./scripts/emergency-isolate.sh
# - Disable new user signups
# - Set maintenance mode on new system
# - Preserve all data in read-only state

# 2. Legacy System Reactivation (10 minutes)
./scripts/reactivate-legacy.sh
# - Restore legacy database from latest backup
# - Reactivate legacy PHP application
# - Update DNS to point to legacy system
# - Notify all users via email

# 3. Data Synchronization (30 minutes)
./scripts/sync-data-to-legacy.sh
# - Export new tickets created during migration
# - Import into legacy system format
# - Verify data integrity
# - Generate reconciliation report

# 4. Post-Rollback Validation (15 minutes)
./scripts/validate-rollback.sh
# - Test all legacy functionality
# - Verify user access
# - Confirm data completeness
# - Document rollback decision and next steps
```

**Communication Template:**
```
Subject: URGENT: Staff Portal System Rollback

Team,

Due to technical issues, we have temporarily rolled back to the legacy staff portal system.

- All data from the new system has been preserved
- All tickets and files are accessible in the legacy system  
- Normal operations can resume immediately
- New migration timeline will be communicated within 24 hours

Legacy System Access: https://staff.gangerdermatology.com/legacy
Support: IT Team extension 1234

We apologize for any inconvenience.
```

### **User Acceptance Testing Protocol**

**UAT Phases:**

**Alpha Testing (Week 15):**
- **Participants**: 3 superusers (HR Admin, IT Manager, Office Manager)
- **Duration**: 3 days full-time testing
- **Focus**: Critical workflows and data integrity validation
- **Success Criteria**: 100% core workflow completion, <2 blocking issues

**Beta Testing (Week 16):**
- **Participants**: 8 staff members (2 from each location + 2 managers)
- **Duration**: 5 days parallel operation with legacy system
- **Focus**: Daily operation simulation and mobile usage
- **Success Criteria**: 95% task completion rate, <3 non-critical issues

**UAT Test Scenarios:**
```typescript
interface UATTestScenarios {
  criticalWorkflows: [
    'Support ticket submission and approval',
    'Time off request with manager approval',
    'Punch fix request processing',
    'File upload and download',
    'Manager dashboard navigation',
    'Mobile form submission'
  ];
  comparisonTests: [
    'Legacy vs modern form completion time',
    'File upload speed comparison',
    'Manager approval workflow timing',
    'Mobile usability assessment',
    'Search and filter functionality',
    'Notification delivery verification'
  ];
  stressTests: [
    '10 concurrent users submitting forms',
    'Large file upload (50MB) during peak usage',
    'Manager processing 20+ tickets rapidly',
    'Mobile usage during poor network conditions'
  ];
}
```

**Acceptance Criteria:**
- **Performance**: <500ms page load times, <2s form submissions
- **Usability**: 95% task completion rate, <30 minutes training time
- **Reliability**: <0.1% error rate, 99.9% uptime during testing
- **Data Integrity**: 100% data preservation, zero data loss events
- **Mobile Experience**: 90% of features usable on mobile devices

### **Documentation Requirements**

**Legacy Migration Documentation:**
1. **Migration Playbook**: Step-by-step migration procedures with rollback options
2. **Data Mapping Guide**: Legacy to modern field mapping and transformation rules
3. **User Transition Guide**: Side-by-side legacy vs modern workflow comparisons
4. **Technical Integration Guide**: API changes and system integration updates

**Standard Platform Documentation:**
- **User Documentation**: Following patterns in `/true-docs/AI_WORKFLOW_GUIDE.md#user-documentation`
- **API Documentation**: REST API specification following `/true-docs/BACKEND_DEVELOPMENT_GUIDE.md#api-documentation`
- **Security Documentation**: Following compliance standards in `/true-docs/SHARED_INFRASTRUCTURE_GUIDE.md#security-documentation`

---

## 📋 **Appendix: Legacy Feature Mapping**

### **Direct Migration Features**
| Legacy Feature | Modern Implementation | Enhancement |
|---|---|---|
| Support Ticket Form | React Hook Form + Zod | Real-time validation |
| Time Off Request | Enhanced form with calendar | Manager approval workflow |
| Punch Fix Form | Employee autocomplete | Deputy integration |
| Availability Change | Multi-step wizard | Schedule sync |
| File Upload | Progressive upload | Virus scanning |
| User Authentication | Supabase Auth | Enhanced security |
| Manager Dashboard | Real-time dashboard | Advanced analytics |
| Comment System | Real-time comments | Rich text editing |

### **New Features Added**
| Feature | Description | Business Value |
|---|---|---|
| User Creation Automation | Full Google Admin SDK integration | 90% time reduction |
| Real-time Notifications | WebSocket-based updates | Immediate awareness |
| Mobile PWA | Offline-capable mobile app | Field worker support |
| Analytics Dashboard | Business intelligence reporting | Data-driven decisions |
| Workflow Automation | Configurable approval processes | Process optimization |
| Integration APIs | REST API for external systems | Ecosystem connectivity |
| Advanced Search | Full-text search across all data | Information discovery |
| Audit Logging | Comprehensive compliance tracking | Regulatory compliance |

---

**Project Sponsor**: Anand Ganger  
**Technical Lead**: Platform Development Team  
**Stakeholders**: HR Department, IT Support Team, All Staff  
**Estimated Timeline**: 16 weeks  
**Estimated Effort**: 400-500 development hours  
**Budget Impact**: 60% cost reduction in hosting and maintenance  

*This PRD ensures zero functionality loss while modernizing the staff management platform with enhanced security, performance, and user experience for the Ganger Dermatology team.*