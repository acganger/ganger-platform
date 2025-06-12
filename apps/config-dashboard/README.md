# Configuration Dashboard - Ganger Platform

A centralized configuration management system for the Ganger Platform, providing secure access control, approval workflows, and real-time configuration management across all platform applications.

## 🚀 Features

### Core Functionality
- **Application Registry**: Centralized registry of all platform applications with metadata
- **Configuration Management**: Secure storage and management of application configurations
- **Permission System**: Granular role-based and user-based access control
- **Approval Workflows**: Configurable approval processes for sensitive configuration changes
- **Audit Logging**: Comprehensive audit trail for all configuration modifications
- **User Impersonation**: Secure impersonation capabilities with full audit tracking

### Security Features
- **Row-Level Security**: Database-level security policies
- **Field-Level Permissions**: Granular control over configuration sections and keys
- **Sensitive Data Protection**: Automatic masking of sensitive configuration values
- **HIPAA Compliance**: Full audit logging and compliance features
- **Location-Based Restrictions**: Optional location-based access controls

### Real-Time Features
- **Live Updates**: Real-time configuration change notifications
- **WebSocket Integration**: Real-time updates across all connected clients
- **Health Monitoring**: Application health status tracking
- **Performance Metrics**: Configuration change impact tracking

## 🏗️ Architecture

### Database Schema
The application uses 6 core database tables:

1. **platform_applications**: Registry of all platform applications
2. **app_configurations**: Configuration key-value storage
3. **app_config_permissions**: Role and user-based permission management
4. **user_impersonation_sessions**: Secure impersonation session tracking
5. **config_change_audit**: Comprehensive audit logging
6. **pending_config_changes**: Approval workflow management

### API Endpoints

#### Applications API (`/api/applications`)
- `GET /api/applications` - List all applications with filtering and pagination
- `POST /api/applications` - Create new application (admin only)
- `GET /api/applications/[id]` - Get specific application details
- `PUT /api/applications/[id]` - Update application metadata
- `DELETE /api/applications/[id]` - Delete application (admin only)

#### Configurations API (`/api/configurations`)
- `GET /api/configurations` - List configurations with comprehensive filtering
- `POST /api/configurations` - Create new configuration
- `GET /api/configurations/[id]` - Get specific configuration
- `PUT /api/configurations/[id]` - Update configuration (with approval workflow)
- `DELETE /api/configurations/[id]` - Delete configuration (admin only)

#### Permissions API (`/api/permissions`)
- `GET /api/permissions` - List all permissions with filtering
- `POST /api/permissions` - Grant new permission
- `GET /api/permissions/[id]` - Get specific permission details
- `PUT /api/permissions/[id]` - Update permission
- `DELETE /api/permissions/[id]` - Revoke permission

### Permission Levels
- **Read**: View configurations (sensitive values may be masked)
- **Write**: Create and modify configurations
- **Admin**: Full access including user management and sensitive values

### Role Hierarchy
- **superadmin**: Full system access across all applications
- **manager**: Application-level administration for assigned apps
- **staff**: Read-only access to assigned applications
- **user**: Basic access as configured

## 🔧 Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (via Supabase)
- TypeScript knowledge

### Environment Setup
```bash
# Required environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

### Database Setup
The database migration is located at:
```
/supabase/migrations/2025_01_12_create_config_dashboard_tables.sql
```

This migration includes:
- All 6 core tables with proper constraints
- Row Level Security (RLS) policies
- Helper functions for permission checking
- Audit logging triggers
- Initial data population for existing platform applications

## 🔐 Security

### Authentication
- Google OAuth integration with domain restriction (@gangerdermatology.com)
- Session management via Supabase Auth
- JWT token validation on all API endpoints

### Authorization
- Row-level security policies in database
- Permission checking functions
- Field-level access control for sensitive configurations
- Audit logging for all actions

### Data Protection
- Automatic sensitive value masking for non-admin users
- Encrypted storage of sensitive configurations
- Comprehensive audit trails
- GDPR compliance features

## 📊 Monitoring

### Health Checks
- Application health status monitoring
- Database connectivity verification
- External service integration status
- Performance metrics tracking

### Audit Logging
All actions are logged with:
- User identification
- Action type and timestamp
- IP address and user agent
- Impersonation context (if applicable)
- Before/after values for changes

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] SSL certificates in place
- [ ] Monitoring setup configured
- [ ] Backup procedures tested

### Cloudflare Workers Deployment
```bash
# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

## 🔄 API Usage Examples

### Create Application
```typescript
const response = await fetch('/api/applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    app_name: 'new-app',
    display_name: 'New Application',
    description: 'Description of the new application',
    requires_approval_for_changes: true
  })
});
```

### Add Configuration
```typescript
const response = await fetch('/api/configurations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    app_id: 'uuid-of-application',
    config_key: 'api_endpoint',
    config_value: 'https://api.example.com',
    description: 'Main API endpoint URL',
    environment: 'production'
  })
});
```

### Grant Permission
```typescript
const response = await fetch('/api/permissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    app_id: 'uuid-of-application',
    permission_type: 'user',
    user_id: 'uuid-of-user',
    permission_level: 'write'
  })
});
```

## 📈 Performance

### Optimization Features
- Database indexing for all common queries
- Pagination for all list endpoints
- Efficient RLS policies
- Caching strategies for static data
- Optimized React components with proper state management

### Scalability
- Horizontal scaling via Cloudflare Workers
- Database connection pooling
- Efficient pagination and filtering
- Lazy loading for large datasets

## 🧪 Testing

### API Testing
```bash
# Run API endpoint tests
npm run test:api

# Run integration tests
npm run test:integration
```

### Manual Testing Checklist
- [ ] Authentication flow works correctly
- [ ] Permission system enforces access controls
- [ ] Audit logging captures all actions
- [ ] Sensitive data is properly masked
- [ ] Approval workflows function correctly

## 📝 Contributing

### Code Standards
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Comprehensive error handling
- Proper API response formats
- Security-first development practices

### Pull Request Process
1. Ensure all tests pass
2. Update documentation as needed
3. Follow security review process
4. Verify audit logging works correctly

---

**Version**: 1.0.0  
**Last Updated**: January 12, 2025  
**Maintainer**: Ganger Platform Development Team