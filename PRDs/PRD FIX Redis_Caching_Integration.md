# PRD: Redis Caching Integration Fix
*Use this template for all new PRDs to ensure consistency, shared infrastructure, and quality enforcement*

**📚 Documentation Reference:** Review `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` for complete technical standards before starting development.

## 📋 Document Information
- **Application Name**: Redis Caching Universal Hub
- **PRD ID**: PRD-CACHE-001
- **Priority**: High
- **Development Timeline**: 3-4 weeks (reference PROJECT_TRACKER.md for velocity data)
- **Terminal Assignment**: Backend (server-side Redis + hybrid client caching)
- **Dependencies**: @ganger/integrations, @ganger/auth, @ganger/db, @ganger/utils
- **MCP Integration Requirements**: Redis instance configuration, performance monitoring
- **Quality Gate Requirements**: Build verification across all frontend apps, zero ioredis imports in client bundles

---

## 🎯 Product Overview

### **Purpose Statement**
Fix Redis caching integration across the Ganger Platform by implementing proper client-side caching strategies and server-side Redis operations, eliminating ioredis build conflicts in frontend apps.

### **Target Users**
- **Primary**: Development team requiring stable builds and performant caching functionality
- **Secondary**: Medical staff experiencing improved application performance through optimized data access
- **Tertiary**: Patients benefiting from faster application response times and improved user experience

### **Success Metrics**
- 100% of frontend apps build successfully without Redis/ioredis errors
- 87% reduction in client bundle size (2MB ioredis removal)
- Cache hit rate >80% for frequently accessed data
- 40% improvement in API response time for cached data

### **Business Value Measurement**
- **ROI Target**: $18,000 performance improvement value through faster application response times
- **Cost Savings**: 75% reduction in database query costs through effective caching
- **Revenue Impact**: Improved user experience reduces patient wait times and increases satisfaction
- **User Productivity**: Faster data access improves clinical workflow efficiency by 25%

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
import { ClientCacheService } from '@ganger/integrations/client';
import { useAuth, AuthProvider } from '@ganger/auth/client';
import { validateForm, formatters } from '@ganger/utils/client';

// ✅ REQUIRED SERVER IMPORTS - Use exclusively in API routes
import { ServerCacheService } from '@ganger/integrations/server';
import { withAuth, verifyPermissions } from '@ganger/auth/server';
import { analytics, auditLog, healthCheck } from '@ganger/utils/server';

// ✅ SHARED TYPES - Framework-agnostic, safe for both client and server
import type { 
  CacheEntry, CacheMetadata, PatientData, InventoryItem,
  AppointmentSlot, TemplateData, CacheStrategy,
  ApiResponse, PaginationMeta, ValidationRule
} from '@ganger/types';
```

### **App-Specific Technology**
- Redis (server-side only) for high-performance distributed caching
- Browser localStorage + memory for client-side caching
- Hybrid caching strategy with intelligent cache warming
- Automatic cache invalidation with event-driven updates

---

## 👥 Authentication & Authorization

### **Role-Based Access (Standard - Updated Hierarchy)**
```typescript
// MANDATORY role hierarchy - see MASTER_DEVELOPMENT_GUIDE.md
type UserRole = 
  | 'superadmin'        // Full cache administration and monitoring
  | 'manager'           // Cache monitoring and manual invalidation
  | 'provider'          // Patient data caching access
  | 'nurse'             // Limited patient data cache access
  | 'medical_assistant' // Administrative data caching
  | 'pharmacy_tech'     // Inventory and medication caching
  | 'billing'           // Payment and billing data caching
  | 'user';             // Basic session caching only

// Cache access permission matrix
interface CachePermissions {
  access_patient_cache: ['superadmin', 'manager', 'provider', 'nurse'];
  access_inventory_cache: ['superadmin', 'manager', 'pharmacy_tech'];
  access_appointment_cache: ['superadmin', 'manager', 'provider', 'medical_assistant'];
  admin_cache: ['superadmin'];
  invalidate_cache: ['superadmin', 'manager'];
}
```

### **Access Control**
- **Domain Restriction**: @gangerdermatology.com accounts for cache administration
- **Data Segmentation**: User-specific and role-based cache isolation
- **Cache Invalidation**: Role-based permissions for manual cache clearing
- **Audit Trail**: All cache operations logged for compliance and debugging

---

## 🗄️ Database Schema

### **Shared Tables Used**
```sql
-- Standard tables (automatically available)
users, user_roles, user_permissions, audit_logs,
locations, location_configs, patients, inventory_items
```

### **App-Specific Tables**
```sql
-- Cache performance tracking
CREATE TABLE cache_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cache operation details
  cache_key VARCHAR(255) NOT NULL,
  operation_type VARCHAR(20) NOT NULL, -- 'hit', 'miss', 'set', 'invalidate'
  cache_layer VARCHAR(20) NOT NULL, -- 'redis', 'client', 'both'
  response_time_ms INTEGER,
  data_size_bytes INTEGER,
  ttl_seconds INTEGER,
  
  -- Context
  user_id UUID REFERENCES users(id),
  app_name VARCHAR(50),
  endpoint VARCHAR(255),
  
  -- Performance metrics
  hit_rate_window DECIMAL(5,4), -- Rolling hit rate
  memory_usage_mb DECIMAL(8,2)
);

-- Cache invalidation tracking
CREATE TABLE cache_invalidation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Invalidation details
  cache_pattern VARCHAR(255) NOT NULL,
  invalidation_reason VARCHAR(50) NOT NULL, -- 'manual', 'auto', 'expired', 'update'
  affected_keys_count INTEGER DEFAULT 0,
  invalidation_time_ms INTEGER,
  
  -- Triggering event
  trigger_table VARCHAR(50),
  trigger_operation VARCHAR(20), -- 'insert', 'update', 'delete'
  trigger_record_id UUID
);

-- Cache configuration
CREATE TABLE cache_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- Configuration details
  cache_key_pattern VARCHAR(255) NOT NULL UNIQUE,
  default_ttl_seconds INTEGER NOT NULL,
  max_size_mb DECIMAL(8,2),
  cache_strategy VARCHAR(20) NOT NULL, -- 'write-through', 'write-behind', 'cache-aside'
  auto_invalidate BOOLEAN DEFAULT true,
  
  -- Performance targets
  target_hit_rate DECIMAL(5,4) DEFAULT 0.8000,
  max_response_time_ms INTEGER DEFAULT 100
);
```

### **Data Relationships**
- Links to user sessions for personalized caching
- Connects to database tables for automatic invalidation
- References application endpoints for cache key management
- Audit trail for all cache operations and performance monitoring

---

## 🔌 API Specifications

### **Standard Endpoints (Auto-generated with Response Standards)**
```typescript
// Cache management endpoints
GET    /api/cache/status                 // Cache health and performance
POST   /api/cache/invalidate             // Manual cache invalidation
GET    /api/cache/stats                  // Cache hit rates and metrics
DELETE /api/cache/clear                  // Emergency cache clearing

// Data-specific cache endpoints
GET    /api/cache/patient/[id]           // Patient data cache access
GET    /api/cache/inventory/[itemId]     // Inventory cache access
GET    /api/cache/appointments/[locationId] // Appointment cache access
GET    /api/cache/templates/[type]       // Template cache access
```

### **App-Specific Endpoints**
```typescript
// Inventory - Product and stock caching
GET    /api/inventory/cache/items
interface InventoryCacheRequest {
  locationId: string;
  category?: string;
  forceRefresh?: boolean;
}

// Medication auth - Patient and authorization caching
GET    /api/medication-auth/cache/patient/[id]
interface PatientCacheRequest {
  patientId: string;
  includeAuthorizations: boolean;
  cacheTtl?: number;
}

// Pharma scheduling - Appointment availability caching
GET    /api/pharma-scheduling/cache/availability/[locationId]
interface AvailabilityCacheRequest {
  locationId: string;
  dateRange: { start: string; end: string };
  providerId?: string;
}

// Handouts - Template caching
GET    /api/handouts/cache/templates
interface TemplateCacheRequest {
  category: string;
  includeMetadata: boolean;
}
```

### **External Integrations (Use Universal Hubs ONLY)**
```typescript
// ✅ REQUIRED: Use Universal Hubs - NO direct external API calls
import { 
  UniversalCacheHub,          // Redis + client caching integration
  UniversalDatabaseHub        // Database integration for invalidation
} from '@ganger/integrations';

// Implementation pattern:
const cacheHub = new UniversalCacheHub();

// Server-side Redis caching
await cacheHub.setRedisCache('patient:123', patientData, 1800); // 30 min TTL

// Client-side caching
await cacheHub.setClientCache('user:preferences', preferences, 1440); // 24 hour TTL
```

- **Redis**: Server-side distributed caching with persistence
- **Browser Storage**: Client-side localStorage and memory caching
- **Error Handling**: Built into Universal Hubs with monitoring
- **Cache Invalidation**: Event-driven automatic invalidation
- **Performance Monitoring**: Real-time cache performance tracking

---

## 🎨 User Interface Design

### **Design System (Standard)**
```typescript
// Ganger Platform Design System
colors: {
  primary: 'blue-600',      // Cache status indicators
  secondary: 'green-600',   // Cache hits and performance
  accent: 'purple-600',     // Manual cache operations
  neutral: 'slate-600',     // Cache statistics
  warning: 'amber-600',     // Cache warnings and low hit rates
  danger: 'red-600'         // Cache failures and errors
}
```

### **Component Usage**
```typescript
// Use shared components for cache interfaces
import {
  // Performance Indicators
  CacheHitRateIndicator, LoadingWithCache, PerformanceMetrics,
  
  // Admin Controls
  CacheInvalidateButton, CacheStatusPanel, CacheConfigForm,
  
  // User Feedback
  CacheLoadingSpinner, CacheErrorAlert, PerformanceToast
} from '@ganger/ui';
```

### **App-Specific UI Requirements**
- Subtle cache status indicators (loading states, hit/miss feedback)
- Performance indicators in admin interfaces
- Cache invalidation controls for administrators
- Cache warming progress indicators
- Automatic refresh options for stale data

---

## 📱 User Experience

### **User Workflows**
1. **Transparent Caching**: Users experience faster load times without awareness of caching
2. **Cache Refresh**: Manual refresh options when users need latest data
3. **Performance Feedback**: Subtle indicators of cache performance for power users
4. **Admin Management**: Cache monitoring and control interfaces for administrators

### **Performance Requirements (Enforced by Performance Budgets)**
```typescript
// MANDATORY performance budgets - automatically enforced
const PERFORMANCE_BUDGETS = {
  // Cache operation response time
  cache_hit_response: 100,     // 100ms max for cache hits
  cache_miss_response: 500,    // 500ms max for cache misses
  
  // Client bundle size reduction
  bundle_reduction: 2000000,   // 2MB reduction from ioredis removal
  
  // Cache effectiveness
  cache_hit_rate: 0.80,        // 80% minimum hit rate
};
```
- **Real-time Updates**: < 100ms latency for cached data access
- **Offline Capability**: Client-side cache provides offline data access

### **Accessibility Standards**
- **WCAG 2.1 AA Compliance**: Required for all cache-related interfaces
- **Keyboard Navigation**: Full cache administration functionality without mouse
- **Screen Reader Support**: Semantic cache status announcements
- **Color Contrast**: 4.5:1 minimum ratio for all cache indicators

---

## 🧪 Testing Strategy

### **Automated Testing (Enforced by Quality Gates)**
```typescript
// MANDATORY test patterns - automatically verified
Unit Tests: 90%+ coverage for cache service logic
Integration Tests: All cache endpoints with hit/miss verification
E2E Tests: Complete caching workflows with performance measurement
Performance Tests: Cache hit rates and response timing verification
Build Tests: All frontend apps compile without Redis errors
Load Tests: Cache performance under high concurrency
Invalidation Tests: Automatic and manual cache invalidation verification
```

### **Quality Gate Integration**
```bash
# Pre-commit verification (automatically runs):
✅ npm run test              # All tests must pass
✅ npm run type-check        # 0 TypeScript errors
✅ npm run build            # All apps build without Redis errors
✅ npm run test:cache       # Cache integration tests
✅ npm run audit:bundle     # Bundle size verification
✅ npm run test:performance # Cache performance tests
```

### **Test Scenarios**
- Patient data caching and retrieval with proper TTL
- Inventory item cache invalidation on stock updates
- Appointment availability cache with concurrent access
- Template cache performance with large datasets
- Cache invalidation propagation across multiple instances
- Memory usage and garbage collection testing
- Cache warming and preloading functionality

---

## 🚀 Deployment & Operations

### **Deployment Strategy (Standard)**
```yaml
Environment: Cloudflare Workers
Build: Next.js static export optimized for Workers
CDN: Cloudflare global edge network
Database: Supabase with global distribution
Monitoring: Supabase analytics + Cloudflare analytics
Logging: Structured logs with cache performance audit trail
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

# Redis caching specific variables
REDIS_URL=redis://username:password@hostname:port
REDIS_MAX_CONNECTIONS=20
REDIS_COMMAND_TIMEOUT=5000
CACHE_DEFAULT_TTL=3600
CACHE_MAX_SIZE_MB=512
CLIENT_CACHE_SIZE_LIMIT=50
```

### **Monitoring & Alerts**
- **Cache Performance Monitoring**: Real-time hit rates and response times
- **Memory Usage Monitoring**: Redis and client cache memory tracking
- **Invalidation Monitoring**: Cache invalidation frequency and effectiveness
- **Error Tracking**: Cache failures and connection issues

---

## 📊 Analytics & Reporting

### **Standard Analytics (Included)**
- **Cache Performance**: Hit rates, miss rates, and response times
- **Memory Usage**: Cache size and memory consumption patterns
- **Invalidation Patterns**: Automatic vs manual invalidation frequency
- **User Impact**: Performance improvements and user experience metrics

### **App-Specific Analytics**
- **Inventory**: Product lookup cache performance and inventory update patterns
- **Medication Auth**: Patient data cache effectiveness and authorization lookup speed
- **Pharma Scheduling**: Appointment availability cache hit rates and booking performance
- **Handouts**: Template cache usage and content generation speed

---

## 🔒 Security & Compliance

### **Security Standards (Required)**
- **Data Encryption**: Cache data encrypted at rest and in transit
- **Access Control**: Role-based permissions for cache access and administration
- **Audit Logging**: All cache operations logged for compliance
- **Data Isolation**: User and role-based cache segmentation
- **Secure Storage**: Redis authentication and network security

### **HIPAA Compliance (Medical Apps)**
- **PHI Protection**: Secure caching of patient health information
- **Access Controls**: Role-based permissions for medical data cache
- **Audit Requirements**: Complete cache access logging
- **Data Retention**: Automatic expiration of sensitive cached data
- **Encryption**: Strong encryption for all cached PHI

### **App-Specific Security**
- Patient data cache isolation and access control
- Medical authorization cache security and compliance
- Inventory data cache protection and access logging
- Template cache integrity and version control

---

## 📈 Success Criteria

### **Launch Criteria**
- [ ] All frontend apps build successfully without Redis-related errors
- [ ] Cache hit rate >80% for frequently accessed data
- [ ] Performance benchmarks met (100ms cache hits, 2MB bundle reduction)
- [ ] Security audit passed for cache access control
- [ ] Integration testing completed with all cache scenarios

### **Success Metrics (6 months)**
- 100% build success rate across all frontend applications
- 85% average cache hit rate across all applications
- 40% improvement in API response times for cached data
- 75% reduction in database query costs

---

## 🔄 Maintenance & Evolution

### **Regular Maintenance**
- **Cache Performance Tuning**: Weekly optimization of TTL and cache strategies
- **Memory Usage Optimization**: Monthly Redis memory usage analysis and optimization
- **Invalidation Pattern Review**: Quarterly review of cache invalidation effectiveness
- **Security Audit**: Monthly access control and encryption verification

### **Future Enhancements**
- Distributed cache warming across multiple regions
- Machine learning-based cache prediction and preloading
- Advanced cache analytics and performance recommendations
- Integration with external caching services for scaling

---

## 📚 Documentation Requirements

### **Developer Documentation (Reference /true-docs/)**
- [ ] **API documentation**: Cache endpoints and integration patterns
- [ ] **Caching strategies**: Best practices for different data types
- [ ] **Performance optimization**: Cache tuning and monitoring guidelines
- [ ] **Invalidation patterns**: Automatic and manual invalidation strategies
- [ ] **Security implementation**: Access control and encryption setup

### **User Documentation**
- [ ] **Performance guide**: Understanding cache benefits and indicators
- [ ] **Data refresh**: Manual refresh options and when to use them
- [ ] **Admin interface**: Cache monitoring and management tools
- [ ] **Troubleshooting**: Common cache issues and resolution steps

---

## 🤖 AI Development Integration

### **Terminal Coordination (Reference AI_WORKFLOW_GUIDE.md)**
```yaml
# Specify terminal assignment for optimal development
Terminal_Assignment: Backend

# Expected development pattern
Backend_Terminal_Focus:
  - Cache service separation (client/server)
  - Redis server-side implementation
  - API route creation for cache operations
  - Cache invalidation logic implementation
  - Performance monitoring and optimization
  - Error handling and retry logic

Coordination_Points:
  - Client interface definition (TypeScript types)
  - Authentication integration (cache access control)
  - Real-time features (cache status updates)
  - Performance optimization (bundle size reduction)
```

### **Verification-First Development**
```bash
# MANDATORY verification before claiming completion
✅ npm run type-check        # "Found 0 errors"
✅ npm run build            # "Build completed successfully" (all apps)
✅ npm run test:cache       # "All cache tests passed"
✅ npm run audit:bundle     # "Bundle size reduced by 2MB"
✅ npm run test:performance # "Cache performance targets met"
```

### **Quality Gate Enforcement**
```typescript
// This PRD will be subject to automated quality enforcement:
PreCommitHooks: {
  typeScriptCompilation: "ZERO_ERRORS_TOLERANCE",
  packageBoundaries: "GANGER_PACKAGES_ONLY", 
  buildVerification: "ALL_APPS_BUILD_SUCCESS",
  bundleSize: "IOREDIS_REMOVAL_VERIFIED",
  performanceTests: "CACHE_PERFORMANCE_VERIFIED"
}
```

### **Cache Strategy Implementation**
```typescript
// Hybrid caching approach with clear separation
ServerSideCaching: {
  dataTypes: ['patient_auth', 'inventory_stock', 'appointment_slots', 'template_meta'],
  ttlStrategy: 'data_sensitivity_based',
  invalidation: 'event_driven_automatic'
}

ClientSideCaching: {
  dataTypes: ['user_preferences', 'form_drafts', 'search_results', 'recent_items'],
  storage: 'localStorage_plus_memory',
  sizeLimit: '50MB_with_LRU_eviction'
}
```

---

*This PRD ensures Redis caching works reliably across all Ganger Platform applications while maintaining build stability and optimal performance.*

**📚 Essential Reading Before Development:**
- `/true-docs/MASTER_DEVELOPMENT_GUIDE.md` - Complete technical standards
- `/true-docs/AI_WORKFLOW_GUIDE.md` - AI development methodologies
- `/_claude_desktop/SPRINT_REDIS_CACHING_INTEGRATION_FIX.md` - Detailed implementation plan