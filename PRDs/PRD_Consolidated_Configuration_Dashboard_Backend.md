# PRD - Consolidated Configuration Dashboard - Backend Implementation
*Backend developer specification for centralized application settings management*

## 🎯 Project Overview

### **Purpose Statement**
Develop a secure, scalable backend system for managing application configurations across all Ganger Platform apps with comprehensive role-based access control, user impersonation, and audit capabilities.

### **Business Context**
This system will provide the API foundation for 70% reduction in configuration management time and ensure 100% audit trail compliance for all configuration changes across 16+ platform applications.

### **Target Integration Points**
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Google OAuth integration with existing @ganger/auth
- **Real-time**: Supabase subscriptions for live updates
- **MCP Integration**: Database MCP for enhanced operations

---

## 👥 Team Coordination

### **Your Role (Backend Team)**
- **API Implementation**: All REST endpoints and WebSocket handlers
- **Database Design**: Schema design, migrations, and optimization
- **Business Logic**: Configuration validation and approval workflows
- **Security**: Permission validation and impersonation management
- **Data Validation**: Server-side validation and sanitization

### **Frontend Team's Role**
- **UI Implementation**: All user interface components and interactions
- **API Consumption**: Frontend will consume your APIs as specified
- **Client State**: Frontend handles UI state and user experience
- **Form Validation**: Basic client-side validation (you handle server-side)

### **Communication Plan**
- **API Contract Reviews**: Notify frontend before any endpoint changes
- **Schema Coordination**: Both teams review configuration schema updates
- **Integration Testing**: Backend APIs ready before frontend integration
- **Performance Monitoring**: Monitor API response times and optimize

---

## 🔗 API Interface Contract

### **Authentication & Headers**
```typescript
// Standard headers for all requests
Authorization: Bearer <jwt_token>
Content-Type: application/json

// Impersonation header (when active)
X-Impersonate-User: <target_user_id>

// Response headers
X-Request-ID: <unique_request_id>
X-Rate-Limit-Remaining: <remaining_requests>
```

### **Core API Endpoints**

#### **Application Management**
```typescript
// GET /api/applications
// Frontend Usage: Display app list in ApplicationCard grid
Response: {
  applications: Application[];
  user_permissions: Record<string, UserPermissions>;
}

// POST /api/applications
// Frontend Usage: Register new application via form
Request: { app_name: string; display_name: string; config_schema: object; }
Response: { application: Application; }

// GET /api/applications/[id]
// Frontend Usage: Load app details for configuration panel
Response: { application: Application; configurations: Configuration[]; }
```

#### **Configuration Management**
```typescript
// GET /api/config/[app]
// Frontend Usage: Load configurations in ConfigurationPanel
Query: { section?: string; include_sensitive?: boolean; }
Response: { 
  configurations: Configuration[];
  schema: ConfigurationSchema;
  user_permissions: ConfigPermissions;
}

// PUT /api/config/[app]/[key]
// Frontend Usage: Submit form changes
Request: { 
  value: any; 
  change_reason?: string; 
  requires_approval?: boolean; 
}
Response: { 
  configuration: Configuration; 
  approval_required: boolean;
  pending_change_id?: string;
}

// DELETE /api/config/[app]/[key]
// Frontend Usage: Delete configuration
Response: { success: boolean; audit_log_id: string; }
```

#### **Permission Management**
```typescript
// GET /api/permissions/matrix
// Frontend Usage: Display permission grid
Response: {
  users: UserPermissionMatrix[];
  roles: RoleDefinition[];
  apps: ApplicationPermissionSummary[];
}

// POST /api/permissions/grant
// Frontend Usage: Grant permissions via form
Request: {
  target_type: 'user' | 'role';
  target_id: string;
  app_id: string;
  permission_level: 'read' | 'write' | 'admin';
  config_sections?: string[];
  expires_at?: string;
}
Response: { permission: AppConfigPermission; }
```

#### **User Impersonation**
```typescript
// POST /api/impersonation/start
// Frontend Usage: Start impersonation session
Request: { 
  target_user_id: string; 
  reason: string; 
  duration_minutes?: number; 
}
Response: { 
  session: ImpersonationSession;
  impersonation_token: string;
  expires_at: string;
}

// POST /api/impersonation/end
// Frontend Usage: End current impersonation
Response: { 
  session_summary: ImpersonationSessionSummary;
  actions_performed: number;
}

// GET /api/impersonation/active
// Frontend Usage: Check active impersonation status
Response: { 
  active_session?: ImpersonationSession;
  remaining_time_minutes?: number;
}
```

#### **Approval Workflow**
```typescript
// GET /api/config/pending
// Frontend Usage: Show approval queue
Query: { app?: string; status?: string; assigned_to_me?: boolean; }
Response: { 
  pending_changes: PendingConfigChange[];
  approval_stats: ApprovalStatistics;
}

// POST /api/config/approve/[id]
// Frontend Usage: Approve pending change
Request: { approval_notes?: string; }
Response: { 
  approved_change: ConfigurationChange;
  applied_configuration: Configuration;
}

// POST /api/config/reject/[id]
// Frontend Usage: Reject pending change
Request: { rejection_reason: string; }
Response: { rejected_change: ConfigurationChange; }
```

#### **Real-time Updates**
```typescript
// WebSocket: /api/config/live-updates
// Frontend Usage: Real-time configuration updates

// Subscription message format
Subscribe: { 
  type: 'subscribe';
  channels: string[]; // ['config_changes', 'permissions', 'impersonation']
}

// Event message format
Event: {
  type: 'config_change' | 'permission_update' | 'impersonation_start' | 'impersonation_end';
  data: any;
  timestamp: string;
  user_id: string;
  app_name?: string;
}
```

### **Error Response Format**
```typescript
interface APIError {
  error: string;
  message: string;
  details?: Record<string, any>;
  request_id: string;
  timestamp: string;
}

// Standard error codes you must implement
400: "Bad Request - Invalid request format"
401: "Unauthorized - Authentication required"
403: "Forbidden - Insufficient permissions"
404: "Not Found - Resource does not exist"
409: "Conflict - Configuration already exists"
422: "Validation Error - Invalid configuration value"
429: "Rate Limited - Too many requests"
500: "Internal Server Error - Server processing error"
```

---

## 📋 Your Implementation Scope

### **Database Schema Implementation**

#### **Required Tables** (6 core tables)
```sql
-- 1. platform_applications (Application registry)
CREATE TABLE platform_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  app_name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  app_version VARCHAR(50),
  
  app_url TEXT,
  health_check_endpoint TEXT,
  documentation_url TEXT,
  
  config_schema JSONB,
  default_config JSONB,
  
  is_active BOOLEAN DEFAULT true,
  last_discovered_at TIMESTAMPTZ DEFAULT NOW(),
  discovery_method VARCHAR(50) DEFAULT 'manual',
  
  requires_approval_for_changes BOOLEAN DEFAULT false,
  config_change_notification_roles TEXT[] DEFAULT ARRAY['superadmin']
);

-- 2. app_configurations (Configuration storage)
CREATE TABLE app_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  config_key VARCHAR(255) NOT NULL,
  config_section VARCHAR(100),
  config_value JSONB NOT NULL,
  value_type VARCHAR(50) DEFAULT 'json',
  
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  requires_restart BOOLEAN DEFAULT false,
  environment VARCHAR(50) DEFAULT 'production',
  
  approval_status VARCHAR(20) DEFAULT 'approved',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  UNIQUE(app_id, config_key, environment)
);

-- 3. app_config_permissions (Permission management)
CREATE TABLE app_config_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  
  permission_type VARCHAR(20) NOT NULL,
  role_name VARCHAR(100),
  user_id UUID REFERENCES users(id),
  
  permission_level VARCHAR(20) NOT NULL,
  config_section VARCHAR(100),
  specific_keys TEXT[],
  
  location_restricted BOOLEAN DEFAULT false,
  allowed_locations TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ
);

-- 4. user_impersonation_sessions (Impersonation tracking)
CREATE TABLE user_impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID REFERENCES users(id) NOT NULL,
  target_user_id UUID REFERENCES users(id) NOT NULL,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_duration_minutes INTEGER,
  
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  status VARCHAR(20) DEFAULT 'active',
  ended_by VARCHAR(20)
);

-- 5. config_change_audit (Audit trail)
CREATE TABLE config_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  config_id UUID REFERENCES app_configurations(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  changed_by UUID REFERENCES users(id),
  change_type VARCHAR(20) NOT NULL,
  
  was_impersonating BOOLEAN DEFAULT false,
  impersonation_session_id UUID REFERENCES user_impersonation_sessions(id),
  actual_user_id UUID REFERENCES users(id),
  
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  
  ip_address INET,
  user_agent TEXT
);

-- 6. pending_config_changes (Approval workflow)
CREATE TABLE pending_config_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES platform_applications(id) ON DELETE CASCADE,
  config_key VARCHAR(255) NOT NULL,
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES users(id),
  
  change_type VARCHAR(20) NOT NULL,
  current_value JSONB,
  proposed_value JSONB,
  change_reason TEXT NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
```

#### **Row Level Security (RLS) Policies**
```sql
-- Application access control
CREATE POLICY "app_access_policy" ON platform_applications
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('manager', 'superadmin')
    OR app_name IN (
      SELECT pa.app_name FROM platform_applications pa
      JOIN app_config_permissions acp ON pa.id = acp.app_id
      WHERE (
        acp.permission_type = 'role' AND acp.role_name = auth.jwt() ->> 'role'
        OR acp.permission_type = 'user' AND acp.user_id = auth.uid()
      ) AND acp.is_active = true
    )
  );

-- Configuration access control
CREATE POLICY "config_access_policy" ON app_configurations
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'superadmin'
    OR (
      app_id IN (
        SELECT acp.app_id FROM app_config_permissions acp
        WHERE (
          acp.permission_type = 'role' AND acp.role_name = auth.jwt() ->> 'role'
          OR acp.permission_type = 'user' AND acp.user_id = auth.uid()
        ) 
        AND acp.permission_level IN ('read', 'write', 'admin')
        AND acp.is_active = true
        AND (acp.expires_at IS NULL OR acp.expires_at > NOW())
      )
      AND (
        NOT is_sensitive
        OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
      )
    )
  );

-- Configuration modification control
CREATE POLICY "config_modify_policy" ON app_configurations
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'superadmin'
    OR app_id IN (
      SELECT acp.app_id FROM app_config_permissions acp
      WHERE (
        acp.permission_type = 'role' AND acp.role_name = auth.jwt() ->> 'role'
        OR acp.permission_type = 'user' AND acp.user_id = auth.uid()
      ) 
      AND acp.permission_level IN ('write', 'admin')
      AND acp.is_active = true
    )
  );
```

### **Business Logic Implementation**

#### **Configuration Management Service**
```typescript
// /src/services/ConfigurationService.ts
export class ConfigurationService {
  // Core configuration operations
  async getAppConfigurations(appId: string, userId: string): Promise<Configuration[]>
  async updateConfiguration(appId: string, key: string, value: any, userId: string): Promise<Configuration>
  async deleteConfiguration(appId: string, key: string, userId: string): Promise<boolean>
  
  // Schema validation
  async validateConfiguration(appId: string, key: string, value: any): Promise<ValidationResult>
  async getConfigurationSchema(appId: string): Promise<ConfigurationSchema>
  
  // Permission checking
  async checkUserPermission(userId: string, appId: string, action: string): Promise<boolean>
  async getUserEffectivePermissions(userId: string): Promise<UserPermissionMatrix>
}
```

#### **Permission Management Service**
```typescript
// /src/services/PermissionService.ts
export class PermissionService {
  // Permission CRUD operations
  async grantPermission(granterId: string, permission: PermissionGrant): Promise<AppConfigPermission>
  async revokePermission(revokerId: string, permissionId: string): Promise<boolean>
  async getPermissionMatrix(): Promise<PermissionMatrix>
  
  // Permission validation
  async validateUserAccess(userId: string, appId: string, configKey?: string): Promise<AccessResult>
  async calculateEffectivePermissions(userId: string): Promise<EffectivePermissions>
  
  // Role-based operations
  async updateRolePermissions(roleName: string, permissions: RolePermissionUpdate[]): Promise<void>
}
```

#### **Impersonation Management Service**
```typescript
// /src/services/ImpersonationService.ts
export class ImpersonationService {
  // Session management
  async startImpersonation(impersonatorId: string, targetUserId: string, reason: string): Promise<ImpersonationSession>
  async endImpersonation(sessionId: string): Promise<ImpersonationSessionSummary>
  async getActiveSession(impersonatorId: string): Promise<ImpersonationSession | null>
  
  // Security and validation
  async validateImpersonationRequest(impersonatorId: string, targetUserId: string): Promise<boolean>
  async logImpersonationAction(sessionId: string, action: string, details: any): Promise<void>
  async checkSessionExpiry(sessionId: string): Promise<boolean>
  
  // Audit and monitoring
  async getImpersonationHistory(userId: string): Promise<ImpersonationHistory[]>
  async getActiveImpersonationSessions(): Promise<ImpersonationSession[]>
}
```

#### **Approval Workflow Service**
```typescript
// /src/services/ApprovalWorkflowService.ts
export class ApprovalWorkflowService {
  // Workflow management
  async submitForApproval(change: ConfigurationChangeRequest): Promise<PendingConfigChange>
  async approveChange(changeId: string, approverId: string, notes?: string): Promise<Configuration>
  async rejectChange(changeId: string, reviewerId: string, reason: string): Promise<void>
  
  // Queue management
  async getPendingChanges(appId?: string, assignedTo?: string): Promise<PendingConfigChange[]>
  async getApprovalStatistics(): Promise<ApprovalStatistics>
  
  // Notification handling
  async notifyApprovers(change: PendingConfigChange): Promise<void>
  async notifyChangeRequester(change: PendingConfigChange, outcome: 'approved' | 'rejected'): Promise<void>
}
```

### **API Route Implementation**

#### **Application Routes** (`/src/pages/api/applications/`)
```typescript
// GET /api/applications
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Authenticate user and get permissions
  // 2. Query applications with RLS filtering
  // 3. Calculate user permissions for each app
  // 4. Return filtered application list
}

// POST /api/applications
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Validate superadmin permission
  // 2. Validate application schema
  // 3. Create application record
  // 4. Initialize default configurations
  // 5. Return created application
}
```

#### **Configuration Routes** (`/src/pages/api/config/`)
```typescript
// GET /api/config/[app]
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Validate user access to app configurations
  // 2. Apply permission filtering for sensitive configs
  // 3. Query configurations with RLS
  // 4. Return configurations with user permissions
}

// PUT /api/config/[app]/[key]
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Validate write permission for app/key
  // 2. Validate configuration value against schema
  // 3. Check if approval required
  // 4. Either save directly or create pending change
  // 5. Trigger notifications and audit logging
  // 6. Broadcast real-time update
}
```

#### **Permission Routes** (`/src/pages/api/permissions/`)
```typescript
// GET /api/permissions/matrix
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Validate manager/superadmin permission
  // 2. Query all users and their effective permissions
  // 3. Calculate permission inheritance
  // 4. Return complete permission matrix
}

// POST /api/permissions/grant
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Validate permission to grant (admin/superadmin)
  // 2. Validate permission grant request
  // 3. Create permission record
  // 4. Trigger permission cache invalidation
  // 5. Audit log permission grant
}
```

### **Real-time Implementation**

#### **WebSocket Handler** (`/src/pages/api/config/live-updates.ts`)
```typescript
// WebSocket connection handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Upgrade to WebSocket connection
    const ws = await upgradeToWebSocket(req, res);
    
    ws.on('message', async (message) => {
      const { type, channels } = JSON.parse(message.toString());
      
      if (type === 'subscribe') {
        // Subscribe user to configuration change channels
        await subscribeToChannels(ws, channels, getUserFromToken(req));
      }
    });
    
    ws.on('close', () => {
      // Clean up subscriptions
      unsubscribeFromAllChannels(ws);
    });
  }
}

// Broadcast configuration changes
export async function broadcastConfigChange(change: ConfigurationChange) {
  const subscribers = getSubscribersForApp(change.app_name);
  
  for (const subscriber of subscribers) {
    if (await hasPermissionToViewChange(subscriber.userId, change)) {
      subscriber.ws.send(JSON.stringify({
        type: 'config_change',
        data: change,
        timestamp: new Date().toISOString()
      }));
    }
  }
}
```

#### **Supabase Subscription Integration**
```typescript
// Real-time subscription setup
export async function setupRealTimeSubscriptions() {
  // Subscribe to configuration changes
  supabase
    .channel('config_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'app_configurations' },
      (payload) => broadcastConfigChange(payload.new)
    )
    .subscribe();
    
  // Subscribe to permission changes
  supabase
    .channel('permission_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'app_config_permissions' },
      (payload) => broadcastPermissionChange(payload.new)
    )
    .subscribe();
}
```

---

## 🚫 NOT Your Responsibility

### **Frontend-Only Features**
- UI component implementation and styling
- Client-side state management and caching
- Form rendering and client-side validation
- Responsive design and mobile layouts
- User experience flows and navigation
- Accessibility implementation (ARIA, keyboard support)

### **Infrastructure Management**
- Frontend build processes and bundling
- Static asset optimization and CDN
- Client-side performance optimization
- Browser compatibility and polyfills

---

## 🧪 Testing Requirements

### **Backend-Specific Testing**

#### **Unit Tests** (95% coverage required)
```typescript
// Test all service classes and utilities
- ConfigurationService: CRUD operations and validation
- PermissionService: Access control and permission calculation
- ImpersonationService: Session management and security
- ApprovalWorkflowService: Workflow state management
- Database utilities: Query builders and data access
```

#### **Integration Tests**
```typescript
// Test API endpoints with real database
- Configuration management: Full CRUD with permission validation
- Permission system: Grant/revoke with RLS policy testing
- Impersonation: Session lifecycle with audit logging
- Approval workflow: Complete approval process
- Real-time updates: WebSocket message delivery
```

#### **Security Tests**
```typescript
// Test security boundaries and access control
- RLS policy enforcement: Unauthorized access prevention
- Permission bypass attempts: Invalid permission escalation
- Impersonation security: Session hijacking prevention
- SQL injection: All user inputs properly sanitized
- JWT validation: Token expiry and invalid token handling
```

#### **Performance Tests**
```typescript
// Test API performance under load
- Configuration queries: < 100ms for permission-filtered queries
- Permission validation: < 50ms for access checks
- Bulk operations: Handle 100+ configuration updates
- WebSocket connections: Support 100+ concurrent connections
- Database performance: Optimized queries with proper indexing
```

### **Database Tests**
```typescript
// Test database schema and policies
- RLS policies: Verify row-level security enforcement
- Migration scripts: Test schema changes and rollbacks
- Index performance: Query optimization validation
- Data integrity: Foreign key constraints and validation
- Backup/restore: Data consistency verification
```

---

## 📅 Timeline & Milestones

### **Week 1: Database & Core APIs**
- [ ] Database schema implementation and migrations
- [ ] RLS policies setup and testing
- [ ] Core application management APIs
- [ ] Basic configuration CRUD operations
- [ ] Authentication middleware integration

### **Week 2: Permission System**
- [ ] Permission management service implementation
- [ ] Permission validation middleware
- [ ] Permission matrix calculation APIs
- [ ] Role-based access control testing
- [ ] Permission inheritance logic

### **Week 3: Impersonation & Workflow**
- [ ] Impersonation session management
- [ ] Approval workflow implementation
- [ ] Audit logging system
- [ ] Security validation and testing
- [ ] Real-time notification setup

### **Week 4: Real-time & Integration**
- [ ] WebSocket handler implementation
- [ ] Supabase subscription integration
- [ ] Bulk operations and data export
- [ ] API performance optimization
- [ ] Integration testing with frontend

### **Week 5: Security & Deployment**
- [ ] Security penetration testing
- [ ] Performance optimization and monitoring
- [ ] Documentation and API specification
- [ ] Production deployment preparation
- [ ] End-to-end testing coordination

---

## ✅ Acceptance Criteria

### **API Functionality**
- [ ] **Application Management**: CRUD operations for all 16+ registered applications
- [ ] **Configuration Management**: Secure CRUD with permission validation
- [ ] **Permission System**: Complete role and user-based access control
- [ ] **Impersonation**: Secure user switching with comprehensive audit
- [ ] **Approval Workflow**: Complete workflow with approval/rejection
- [ ] **Real-time Updates**: Live configuration changes via WebSocket
- [ ] **Audit Trail**: Complete logging of all configuration operations

### **Security Requirements**
- [ ] **Authentication**: JWT validation on all protected endpoints
- [ ] **Authorization**: RLS policies enforcing permission boundaries
- [ ] **Impersonation Security**: Session limits and audit logging
- [ ] **Sensitive Data**: Encryption of sensitive configuration values
- [ ] **SQL Injection**: All inputs properly sanitized and validated

### **Performance Requirements**
- [ ] **API Response Time**: < 100ms for permission-filtered queries
- [ ] **Database Performance**: Optimized queries with proper indexing
- [ ] **Concurrent Users**: Support 100+ simultaneous configuration operations
- [ ] **WebSocket Performance**: Handle 100+ real-time connections
- [ ] **Bulk Operations**: Process 100+ configuration changes efficiently

### **Data Integrity**
- [ ] **Schema Validation**: Configuration values validated against schemas
- [ ] **Referential Integrity**: Proper foreign key relationships
- [ ] **Audit Completeness**: 100% configuration change audit coverage
- [ ] **Permission Consistency**: Accurate permission calculation and inheritance

---

## 🔒 Security Implementation

### **Authentication & Authorization**
```typescript
// JWT validation middleware
export async function validateJWT(req: NextApiRequest): Promise<User | null> {
  // 1. Extract JWT from Authorization header
  // 2. Validate token signature and expiry
  // 3. Extract user information and roles
  // 4. Handle impersonation context if present
  // 5. Return authenticated user or null
}

// Permission validation middleware
export async function requirePermission(
  permission: string, 
  appId?: string
): Promise<(req: NextApiRequest, res: NextApiResponse, next: NextFunction) => void> {
  // 1. Get authenticated user from JWT
  // 2. Check effective permissions including role inheritance
  // 3. Validate app-specific permissions if appId provided
  // 4. Handle impersonation context and restrictions
  // 5. Allow or deny request based on permission check
}
```

### **Sensitive Data Handling**
```typescript
// Configuration value encryption
export async function encryptSensitiveValue(value: any): Promise<string> {
  // 1. Detect if value contains sensitive information
  // 2. Use AES-256-GCM encryption with rotation keys
  // 3. Store encryption metadata for decryption
  // 4. Return encrypted value string
}

export async function decryptSensitiveValue(encryptedValue: string): Promise<any> {
  // 1. Extract encryption metadata
  // 2. Use appropriate decryption key version
  // 3. Decrypt and return original value
  // 4. Log access for audit trail
}
```

### **Audit Logging**
```typescript
// Comprehensive audit logging
export async function logConfigurationChange(change: ConfigurationChangeAudit): Promise<void> {
  // 1. Capture complete change context
  // 2. Include impersonation information if applicable
  // 3. Store IP address and user agent
  // 4. Ensure tamper-proof audit trail
  // 5. Trigger real-time audit notifications
}

export async function logImpersonationAction(action: ImpersonationAudit): Promise<void> {
  // 1. Log all actions during impersonation session
  // 2. Include actual user and impersonated user context
  // 3. Store action details and timestamps
  // 4. Monitor for suspicious impersonation patterns
}
```

---

## 📊 Monitoring & Analytics

### **API Performance Monitoring**
```typescript
// Request monitoring middleware
export async function monitorAPIPerformance(req: NextApiRequest, res: NextApiResponse, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    logger.info('api_request', {
      method: req.method,
      url: req.url,
      status_code: res.statusCode,
      duration_ms: duration,
      user_id: req.user?.id,
      impersonating: req.headers['x-impersonate-user']
    });
    
    // Alert on slow requests
    if (duration > 1000) {
      alerting.warn('slow_api_request', { url: req.url, duration });
    }
  });
  
  next();
}
```

### **Security Monitoring**
```typescript
// Security event monitoring
export async function monitorSecurityEvents() {
  // 1. Monitor failed authentication attempts
  // 2. Track permission escalation attempts
  // 3. Alert on suspicious impersonation patterns
  // 4. Monitor configuration access patterns
  // 5. Detect and prevent brute force attacks
}
```

---

## 📚 Documentation Requirements

### **API Documentation**
- [ ] OpenAPI 3.0 specification for all endpoints
- [ ] Request/response examples for each endpoint
- [ ] Error code documentation with resolution guidance
- [ ] WebSocket message format documentation
- [ ] Rate limiting and authentication details

### **Database Documentation**
- [ ] Complete schema documentation with relationships
- [ ] RLS policy explanation and test scenarios
- [ ] Migration guide and rollback procedures
- [ ] Performance optimization recommendations
- [ ] Backup and recovery procedures

### **Security Documentation**
- [ ] Permission system architecture and inheritance rules
- [ ] Impersonation security model and restrictions
- [ ] Audit logging format and retention policies
- [ ] Encryption key management procedures
- [ ] Security monitoring and incident response

*This backend specification provides comprehensive implementation guidance for secure, scalable configuration management APIs that integrate seamlessly with the frontend implementation.*