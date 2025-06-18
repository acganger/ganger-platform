# PRD - Secret Management System
*Ganger Platform Enterprise-Grade Secret Management Implementation*

## 📋 Document Information
- **Application Name**: Secret Management System
- **Priority**: **Critical** (HIPAA Compliance & Security Foundation)
- **Development Timeline**: 2-3 weeks
- **Dependencies**: @ganger/config, Google Cloud Secret Manager, GitHub Actions
- **Integration Requirements**: All existing applications, CI/CD pipelines, production infrastructure

---

## 🎯 Product Overview

### **Purpose Statement**
Implement enterprise-grade secret management to replace hardcoded credentials with Google Secret Manager for production, GitHub Secrets for CI/CD, and secure .env handling for development, ensuring HIPAA compliance and eliminating security vulnerabilities.

### **Target Users**
- **Primary**: Solo Developer (secure development workflow)
- **Secondary**: Production Systems (automated secret retrieval)
- **Tertiary**: CI/CD Pipelines (deployment automation)

### **Success Metrics**
- 100% elimination of hardcoded secrets from codebase
- Zero production deployment security incidents
- Sub-500ms secret retrieval performance in production
- 100% audit trail coverage for secret access
- HIPAA compliance certification achieved

---

## 🏗️ Technical Architecture

### **Shared Infrastructure (Standard)**
```yaml
Frontend: Next.js 14+ with TypeScript
Backend: Next.js API routes + Supabase Edge Functions
Database: Supabase PostgreSQL with Row Level Security
Authentication: Google OAuth + Supabase Auth (@gangerdermatology.com)
Hosting: Google App Engine (production) + Cloudflare Workers (edge)
Styling: Tailwind CSS + Ganger Design System
Real-time: Supabase subscriptions
File Storage: Supabase Storage with CDN
```

### **Required Shared Packages**
```typescript
import { SecretManager, ConfigLoader } from '@ganger/config';
import { Logger, AuditLogger } from '@ganger/utils';
import { db, AuditLog } from '@ganger/db';
```

### **Secret Management Technology Stack**
- **Production**: Google Cloud Secret Manager (primary)
- **CI/CD**: GitHub Secrets (deployment pipelines)
- **Development**: .env files (local only, never committed)
- **Backup**: GitHub Secrets (redundancy for critical secrets)
- **Audit**: Google Cloud Audit Logs + Custom audit trails
- **Encryption**: AES-256 encryption at rest, TLS 1.3 in transit

---

## 👥 Authentication & Authorization

### **Role-Based Secret Access (Standard)**
```typescript
type SecretAccessRole = 'developer' | 'system' | 'ci_cd' | 'admin';

interface SecretPermissions {
  read: SecretAccessRole[];
  write: SecretAccessRole[];
  admin: SecretAccessRole[];
  audit: SecretAccessRole[];
}

// Secret access matrix
const SECRET_ACCESS_MATRIX = {
  'supabase-credentials': {
    read: ['system', 'ci_cd', 'admin'],
    write: ['admin'],
    admin: ['admin'],
    audit: ['admin']
  },
  'google-oauth-credentials': {
    read: ['system', 'ci_cd', 'admin'],
    write: ['admin'],
    admin: ['admin'],
    audit: ['admin']
  },
  'api-keys': {
    read: ['system', 'ci_cd', 'admin'],
    write: ['admin'],
    admin: ['admin'],
    audit: ['admin']
  }
};
```

### **Access Control**
- **Google Cloud IAM**: Service account with minimal required permissions
- **GitHub Organization**: Repository secrets management
- **Local Development**: Environment variable validation and secure storage
- **Audit Trail**: All secret access logged with user, timestamp, and purpose

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, audit_logs, locations
```

### **Secret Management Tables**
```sql
-- Secret usage tracking and audit
CREATE TABLE secret_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'rotate', 'delete')),
  accessed_by TEXT NOT NULL, -- service account, user, or system
  access_timestamp TIMESTAMPTZ DEFAULT NOW(),
  source_system TEXT NOT NULL, -- 'google_secret_manager', 'github_secrets', 'local_env'
  application_name TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secret rotation tracking
CREATE TABLE secret_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name TEXT NOT NULL,
  old_version TEXT,
  new_version TEXT,
  rotation_type TEXT NOT NULL CHECK (rotation_type IN ('manual', 'automatic', 'emergency')),
  rotated_by TEXT NOT NULL,
  rotation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  next_rotation_due TIMESTAMPTZ,
  rotation_success BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Development environment secret validation
CREATE TABLE development_secret_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name TEXT NOT NULL,
  hash_value TEXT NOT NULL, -- SHA-256 hash for validation without storing actual secret
  environment TEXT DEFAULT 'development',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(secret_name, environment)
);
```

### **Data Relationships**
- Secret audit logs link to user authentication system
- Rotation logs connect to deployment and change management
- Development validation ensures consistency across environments

---

## 🔌 API Specifications

### **Secret Management Endpoints**
```typescript
// Secret retrieval service (internal only)
interface SecretManagerAPI {
  // Production secret access
  getSecret(name: string): Promise<string>;
  getSecretVersion(name: string, version: string): Promise<string>;
  
  // Batch secret retrieval for application startup
  getBatchSecrets(names: string[]): Promise<Record<string, string>>;
  
  // Development environment validation
  validateLocalSecrets(secrets: Record<string, string>): Promise<ValidationResult>;
  
  // Audit and monitoring
  getSecretAuditLog(secretName: string, timeRange: DateRange): Promise<AuditEntry[]>;
  
  // Health checks
  checkSecretManagerHealth(): Promise<HealthStatus>;
}

// Configuration loading patterns
interface ConfigLoader {
  // Environment-aware config loading
  loadConfig(environment: 'development' | 'staging' | 'production'): Promise<ApplicationConfig>;
  
  // Real-time config updates (for non-secret configs)
  subscribeToConfigChanges(callback: (config: ApplicationConfig) => void): void;
  
  // Validation and type safety
  validateConfig(config: unknown): config is ApplicationConfig;
}
```

### **Secret Access Patterns**
```typescript
// Standard secret access patterns across all applications
export class SecretAccessPatterns {
  // Application startup secret loading
  static async loadApplicationSecrets(appName: string): Promise<ApplicationSecrets> {
    const environment = process.env.NODE_ENV || 'development';
    
    if (environment === 'production') {
      return await GoogleSecretManager.getBatchSecrets([
        `${appName}-supabase-url`,
        `${appName}-supabase-anon-key`,
        `${appName}-supabase-service-role-key`,
        `${appName}-google-oauth-client-id`,
        `${appName}-google-oauth-client-secret`
      ]);
    } else {
      return LocalSecretManager.loadFromEnv();
    }
  }
  
  // API key retrieval with caching
  static async getAPIKey(serviceName: string, cacheTTL: number = 300): Promise<string> {
    const cacheKey = `api_key_${serviceName}`;
    
    // Check cache first
    const cached = await MemoryCache.get(cacheKey);
    if (cached) return cached;
    
    // Retrieve from secret manager
    const apiKey = await SecretManager.getSecret(`api-keys-${serviceName}`);
    
    // Cache with TTL
    await MemoryCache.set(cacheKey, apiKey, cacheTTL);
    
    // Audit log
    await AuditLogger.logSecretAccess({
      secretName: `api-keys-${serviceName}`,
      accessType: 'read',
      accessedBy: 'system',
      application: process.env.APP_NAME,
      timestamp: new Date().toISOString()
    });
    
    return apiKey;
  }
}
```

### **External Integrations**
- **Google Cloud Secret Manager**: Primary secret storage and retrieval
- **GitHub Secrets API**: CI/CD pipeline secret management
- **Supabase**: Secret usage audit logging
- **Google Cloud Audit Logs**: External audit trail integration

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// No user-facing UI - this is an internal infrastructure system
// All secret management happens through:
// 1. CLI tools and scripts
// 2. Automated deployment pipelines
// 3. Application startup configuration
// 4. Developer tooling and validation
```

### **Developer Tooling UI**
```typescript
// CLI interface for secret management
interface SecretManagerCLI {
  // Development setup
  'ganger-secrets init': 'Initialize local development secrets';
  'ganger-secrets validate': 'Validate all required secrets are present';
  'ganger-secrets sync': 'Sync development secrets with template';
  
  // Production management (admin only)
  'ganger-secrets rotate <secret-name>': 'Rotate production secret';
  'ganger-secrets audit <secret-name>': 'View secret access audit log';
  'ganger-secrets backup': 'Backup critical secrets to GitHub';
}
```

---

## 📱 User Experience

### **Developer Workflows**
1. **Initial Setup**: Run secret initialization script to create .env template
2. **Daily Development**: Automatic secret validation on application startup
3. **Secret Updates**: Use CLI tools to safely update and validate secrets
4. **Production Deployment**: Automated secret retrieval during deployment

### **System Administrator Workflows**
1. **Secret Rotation**: Scheduled and manual secret rotation procedures
2. **Audit Review**: Regular review of secret access patterns and anomalies
3. **Emergency Response**: Rapid secret rotation in case of security incidents
4. **Compliance Reporting**: Generate HIPAA-compliant audit reports

### **Performance Requirements**
- **Secret Retrieval**: < 200ms for individual secrets
- **Batch Loading**: < 500ms for application startup secret loading
- **Cache Hit Rate**: > 95% for frequently accessed secrets
- **Audit Logging**: < 50ms overhead for secret access logging

---

## 🧪 Testing Strategy

### **Automated Testing**
```typescript
// Secret management testing patterns
describe('SecretManager', () => {
  it('should retrieve secrets from Google Secret Manager in production', async () => {
    process.env.NODE_ENV = 'production';
    const secret = await SecretManager.getSecret('test-secret');
    expect(secret).toBeDefined();
    expect(secret).not.toContain('mock');
  });
  
  it('should fall back to environment variables in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.TEST_SECRET = 'development-value';
    const secret = await SecretManager.getSecret('test-secret');
    expect(secret).toBe('development-value');
  });
  
  it('should audit all secret access attempts', async () => {
    await SecretManager.getSecret('audit-test-secret');
    const auditLogs = await db.secretAuditLogs.findMany({
      where: { secret_name: 'audit-test-secret' }
    });
    expect(auditLogs).toHaveLength(1);
  });
  
  it('should handle secret rotation without downtime', async () => {
    const oldSecret = await SecretManager.getSecret('rotation-test');
    await SecretManager.rotateSecret('rotation-test');
    const newSecret = await SecretManager.getSecret('rotation-test');
    expect(newSecret).not.toBe(oldSecret);
    expect(newSecret).toBeDefined();
  });
});

// Environment validation testing
describe('EnvironmentValidation', () => {
  it('should detect missing required secrets', async () => {
    const result = await EnvironmentValidator.validate({
      SUPABASE_URL: 'present'
      // SUPABASE_ANON_KEY missing
    });
    expect(result.isValid).toBe(false);
    expect(result.missingSecrets).toContain('SUPABASE_ANON_KEY');
  });
  
  it('should validate secret formats and patterns', async () => {
    const result = await EnvironmentValidator.validate({
      SUPABASE_URL: 'invalid-url-format',
      SUPABASE_ANON_KEY: 'valid.jwt.token'
    });
    expect(result.isValid).toBe(false);
    expect(result.invalidFormats).toContain('SUPABASE_URL');
  });
});
```

### **Test Scenarios**
- **Secret Retrieval**: Test all secret access patterns across environments
- **Fallback Mechanisms**: Verify graceful degradation when secret manager unavailable
- **Audit Logging**: Validate all secret access is properly logged
- **Rotation Procedures**: Test secret rotation without service interruption
- **Security Validation**: Confirm no secrets leak into logs or error messages

---

## 🚀 Deployment & Operations

### **Deployment Strategy**
```yaml
# Multi-environment secret deployment
Environments:
  Development: .env files (local only, never committed)
  Staging: Google Secret Manager (staging project)
  Production: Google Secret Manager (production project)
  
CI/CD Integration:
  GitHub Actions: Uses GitHub Secrets for deployment credentials
  Build Process: Validates secret availability before deployment
  Deployment: Automated secret retrieval and validation
  
Monitoring:
  Secret Access: Real-time monitoring of secret usage patterns
  Audit Logs: Comprehensive logging of all secret operations
  Health Checks: Automated validation of secret manager availability
```

### **Environment Configuration**
```bash
# Development environment (.env - not committed)
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Production secrets (Google Secret Manager)
# Accessed via: gcloud secrets versions access latest --secret="secret-name"
secrets:
  - supabase-url-production
  - supabase-anon-key-production
  - supabase-service-role-key-production
  - google-oauth-client-id-production
  - google-oauth-client-secret-production
  - stripe-secret-key-production
  - twilio-auth-token-production

# GitHub Secrets (CI/CD)
GOOGLE_APPLICATION_CREDENTIALS_JSON: (base64 encoded service account)
SUPABASE_ACCESS_TOKEN: (for database migrations)
CLOUDFLARE_API_TOKEN: (for deployment)
```

### **Monitoring & Alerts**
- **Secret Access Monitoring**: Real-time alerts for unusual access patterns
- **Rotation Scheduling**: Automated alerts for upcoming secret rotations
- **Health Monitoring**: Service health checks for secret manager availability
- **Audit Compliance**: Regular audit reports for HIPAA compliance
- **Security Incidents**: Immediate alerts for failed access attempts or security events

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **Secret Usage Patterns**: Track which secrets are accessed most frequently
- **Performance Metrics**: Monitor secret retrieval times and cache effectiveness
- **Security Metrics**: Track failed access attempts and potential security issues
- **Compliance Reports**: Generate HIPAA-compliant audit reports

### **Secret Management Analytics**
- **Access Frequency**: Monitor secret access patterns to optimize caching
- **Rotation Compliance**: Track secret age and rotation schedule adherence
- **Environment Usage**: Analyze secret usage across development, staging, production
- **Error Rates**: Monitor secret retrieval failures and fallback usage
- **Cost Optimization**: Track Google Secret Manager API usage for cost management

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Encryption**: AES-256 encryption at rest, TLS 1.3 in transit
- **Access Controls**: IAM-based access with principle of least privilege
- **Audit Logging**: Comprehensive logging of all secret operations
- **Secret Rotation**: Automated and manual secret rotation capabilities
- **Zero-Trust**: No hardcoded secrets in code or configuration files

### **HIPAA Compliance**
- **Access Controls**: Unique user identification and role-based access
- **Audit Controls**: Complete audit trail of secret access and modifications
- **Integrity Controls**: Secret versioning and change tracking
- **Transmission Security**: Encrypted transmission of all secret data
- **Data Minimization**: Only store necessary secrets with appropriate retention

### **Secret-Specific Security**
- **Secret Isolation**: Separate secrets by environment and application
- **Version Control**: Complete versioning of secret changes
- **Emergency Procedures**: Rapid secret rotation for security incidents
- **Backup and Recovery**: Secure backup of critical secrets
- **Leak Detection**: Automated scanning for accidentally committed secrets

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All hardcoded secrets removed from codebase
- [ ] Google Secret Manager integration functional
- [ ] GitHub Secrets configured for CI/CD
- [ ] Local development environment setup documented
- [ ] Secret rotation procedures tested
- [ ] Audit logging operational
- [ ] All applications deploy successfully with new secret management

### **Success Metrics (6 months)**
- 100% elimination of hardcoded secrets (down from 15+ detected)
- 99.9% secret retrieval success rate in production
- Sub-200ms average secret retrieval time
- Zero security incidents related to secret management
- 100% HIPAA audit compliance for secret access
- Automated secret rotation for 100% of production secrets

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Secret Rotation**: Quarterly rotation of all production secrets
- **Access Review**: Monthly review of secret access patterns
- **Security Audits**: Annual security assessment of secret management
- **Performance Optimization**: Quarterly review of secret retrieval performance
- **Compliance Updates**: Ongoing updates for regulatory requirements

### **Future Enhancements**
- **Automated Secret Discovery**: AI-powered detection of hardcoded secrets
- **Advanced Rotation**: Context-aware intelligent secret rotation
- **Multi-Cloud Support**: Azure Key Vault and AWS Secrets Manager integration
- **Developer Experience**: Enhanced CLI tools and IDE integrations
- **Advanced Analytics**: ML-powered anomaly detection for secret access

---

## 📚 Documentation Requirements

### **Developer Documentation**
- [ ] Secret management setup guide
- [ ] Local development environment configuration
- [ ] Secret access patterns and best practices
- [ ] CLI tool usage and commands
- [ ] Troubleshooting guide for common secret issues

### **Operations Documentation**
- [ ] Production secret management procedures
- [ ] Secret rotation runbooks
- [ ] Incident response procedures for secret compromises
- [ ] HIPAA compliance audit procedures
- [ ] Backup and disaster recovery procedures

### **Security Documentation**
- [ ] Secret access control matrix
- [ ] Audit logging specifications
- [ ] Security incident response procedures
- [ ] Compliance reporting procedures
- [ ] Secret lifecycle management policies

---

## 🎯 Implementation Plan

### **Phase 1: Foundation (Week 1)**
- [ ] Set up Google Cloud Secret Manager
- [ ] Create @ganger/config package with SecretManager class
- [ ] Implement development environment validation
- [ ] Create secret audit logging system
- [ ] Document secret access patterns

### **Phase 2: Application Integration (Week 2)**
- [ ] Migrate Inventory app to new secret management
- [ ] Migrate Handouts app to new secret management
- [ ] Update all shared packages for secret management
- [ ] Implement secret retrieval performance monitoring
- [ ] Test secret rotation procedures

### **Phase 3: Production Deployment (Week 3)**
- [ ] Configure production Google Secret Manager
- [ ] Set up GitHub Secrets for CI/CD
- [ ] Deploy applications with new secret management
- [ ] Implement monitoring and alerting
- [ ] Conduct security audit and HIPAA compliance review
- [ ] Document all procedures and train development team

### **Phase 4: Optimization & Monitoring (Ongoing)**
- [ ] Monitor secret access patterns and optimize caching
- [ ] Implement automated secret rotation schedules
- [ ] Conduct regular security reviews
- [ ] Generate compliance reports
- [ ] Continuous improvement based on usage patterns

---

*This PRD ensures enterprise-grade secret management suitable for HIPAA-compliant medical applications while maintaining development velocity and operational excellence.*