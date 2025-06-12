# NEW APPLICATION DEVELOPMENT STANDARDS
*Ganger Platform Standard Application Development Guidelines*
*Post-Beast Mode Excellence: Established Standards for Future Development*

## 📋 **MANDATORY INFRASTRUCTURE USAGE**

All new applications on the Ganger Platform MUST use the established shared infrastructure to maintain consistency, quality, and maintainability.

### **✅ Required Shared Packages**

```typescript
// MANDATORY - All UI components must use shared library
import { Button, Input, Card, DataTable, Modal, LoadingSpinner } from '@ganger/ui';

// MANDATORY - Standard authentication integration required
import { useAuth, withAuth, AuthProvider } from '@ganger/auth';

// MANDATORY - Database operations through shared utilities
import { db, createClient, Repository } from '@ganger/db';

// MANDATORY - Universal Hubs for external services
import { 
  UniversalCommunicationHub, 
  UniversalPaymentHub, 
  UniversalDatabaseHub 
} from '@ganger/integrations';

// MANDATORY - Shared utilities and validation
import { analytics, notifications, validateForm } from '@ganger/utils';
```

### **🚫 PROHIBITED PATTERNS**

```typescript
// ❌ NEVER create custom button implementations
const CustomButton = () => <button>...</button>; // Use @ganger/ui Button

// ❌ NEVER create custom card components  
const CustomCard = () => <div>...</div>; // Use @ganger/ui Card

// ❌ NEVER create custom form fields
const CustomInput = () => <input>...</input>; // Use @ganger/ui FormField

// ❌ NEVER create custom loading spinners
const CustomSpinner = () => <div>...</div>; // Use @ganger/ui LoadingSpinner

// ❌ NEVER use inline styling
<div style={{color: 'blue'}}>...</div> // Use design token system

// ❌ NEVER implement custom authentication
const customAuth = () => {...}; // Use @ganger/auth exclusively
```

## 🎯 **ESTABLISHED PATTERNS**

### **Design System Integration**
```typescript
// ✅ Use unified color tokens
const colors = {
  primary: 'blue-600',      // Professional/medical
  secondary: 'green-600',   // Success/confirmed  
  accent: 'purple-600',     // Analytics/insights
  neutral: 'slate-600',     // Text/borders
  warning: 'amber-600',     // Pending actions
  danger: 'red-600'         // Errors/critical
};

// ✅ Accessibility standards WCAG 2.1 AA
<Button 
  aria-label="Save patient handout"
  className="min-h-[44px] min-w-[44px]" // Touch targets
/>
```

### **Authentication Pattern**
```typescript
// ✅ Standard @ganger/auth integration (NO custom auth)
export default function MyApp() {
  return (
    <AuthProvider>
      <YourAppContent />
    </AuthProvider>
  );
}

// ✅ Protected routes
export default withAuth(PrivatePage, { requiredRoles: ['manager'] });

// ✅ Hook usage
const { user, signIn, signOut, isLoading } = useAuth();
```

### **API Standards**
```typescript
// ✅ OpenAPI documentation required for all endpoints
/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create new appointment
 *     parameters:
 *       - name: appointmentData
 *         required: true
 */

// ✅ Rate limiting integration
export default withRateLimit(handler, { tier: 'STANDARD' });

// ✅ Standard error handling
import { createAPIResponse } from '@ganger/utils';
return createAPIResponse({ success: true, data: result });
```

### **Performance Standards**
```typescript
// ✅ Redis caching integration mandatory
import { cacheManager } from '@ganger/integrations/database';
const cachedData = await cacheManager.get('patients:recent');

// ✅ Performance monitoring required
import { performanceMonitor } from '@ganger/utils';
await performanceMonitor.trackQuery('patient-lookup', queryFn);
```

## 🔍 **PRE-DEVELOPMENT VALIDATION**

### **🚨 Critical Lessons Learned**

**Always verify before coding:**
1. **Test current state compilation** - Ensure existing code compiles before making changes
2. **Verify dependencies exist** - Check package exports before writing import statements
3. **Don't trust static analysis** - Always run actual compilation and build tests

### **Mandatory Pre-Development Steps**
```bash
# 1. Test current state
npm run type-check
npm run build

# 2. Verify package dependencies exist
npm ls @ganger/ui @ganger/auth @ganger/db @ganger/integrations @ganger/utils

# 3. Check what's actually exported
cat packages/ui/src/index.ts
cat packages/auth/src/index.ts
```

### **During Development Validation**
```bash
# After creating each new component or function:
npm run type-check

# After each import addition:
npm run type-check

# After each new package dependency:
npm install && npm run type-check
```

## 🔍 **QUALITY GATES**

### **Pre-Commit Requirements**
```bash
# ✅ TypeScript compilation must be 100% successful
npm run type-check # Must pass without errors

# ✅ All components must use @ganger/ui (NO custom duplicates)
npm run test:ui-consistency # Verify shared component usage

# ✅ Authentication must use @ganger/auth (NO custom auth)
npm run test:auth-integration # Verify standard auth patterns

# ✅ API documentation required for all endpoints
npm run audit:api-documentation # Verify OpenAPI coverage

# ✅ Performance monitoring integration mandatory
npm run test:performance-monitoring # Verify metrics integration

# ✅ Security compliance verification required
npm run test:security-compliance # Verify HIPAA standards

# ✅ Accessibility compliance (WCAG 2.1 AA)
npm run test:accessibility # Verify compliance standards
```

### **Code Review Requirements**
1. **Reviewer must run compilation tests**
2. **No assumptions about working code without testing**
3. **Verify all imports actually exist**
4. **Check that referenced packages export what's being imported**

### **Recovery Process for Compilation Failures**

When compilation fails:

1. **Identify the exact error**
   ```bash
   npm run type-check 2>&1 | head -50
   ```

2. **Fix in order of dependency**
   - Fix package configurations first
   - Fix package exports second  
   - Fix application imports third

3. **Test incrementally**
   ```bash
   # Test packages first
   cd packages/config && npm run type-check
   cd packages/ui && npm run type-check
   
   # Then test apps
   cd apps/inventory && npm run type-check
   ```

4. **Verify fix is complete**
   ```bash
   npm run type-check  # Root level test
   npm run build       # Full build test
   ```

### **Code Quality Standards**
```typescript
// ✅ All TypeScript interfaces must be comprehensive
interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  // ... complete interface definition required
}

// ✅ Error boundaries required for all major components
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>

// ✅ Loading states must use @ganger/ui LoadingSpinner
{isLoading ? <LoadingSpinner /> : <YourContent />}
```

## 🏗️ **APPLICATION ARCHITECTURE REQUIREMENTS**

### **Standard Project Structure**
```
apps/your-app/
├── components/
│   ├── shared/           # App-specific shared components
│   └── pages/           # Page-specific components
├── pages/
│   ├── api/             # API routes with OpenAPI docs
│   ├── auth/            # Authentication pages
│   └── dashboard/       # Protected pages
├── lib/
│   ├── api-client.ts    # API integration layer
│   ├── validation.ts    # App-specific validation
│   └── utils.ts         # App-specific utilities
├── types/
│   └── index.ts         # TypeScript type definitions
├── styles/
│   └── globals.css      # Tailwind CSS imports only
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

### **Required Configuration Files**
```typescript
// next.config.js - Standard configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true
  }
};
module.exports = nextConfig;

// tailwind.config.js - Design system integration
module.exports = {
  presets: [require('@ganger/config/tailwind')],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // App-specific extensions only
    }
  }
};

// tsconfig.json - Standard TypeScript config
{
  "extends": "@ganger/config/typescript",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🧪 **TESTING REQUIREMENTS**

### **Required Test Coverage**
```typescript
// Unit tests for business logic (85%+ coverage required)
describe('PatientLookup', () => {
  it('should validate patient MRN format', () => {
    expect(validateMRN('12345')).toBe(true);
  });
});

// Integration tests for external APIs
describe('ModMed Integration', () => {
  it('should retrieve patient data successfully', async () => {
    const patient = await modmedClient.getPatient('12345');
    expect(patient).toBeDefined();
  });
});

// Component tests using @ganger/ui
describe('AppointmentCard', () => {
  it('should render using shared Card component', () => {
    render(<AppointmentCard appointment={mockData} />);
    expect(screen.getByTestId('ganger-card')).toBeInTheDocument();
  });
});
```

### **Accessibility Testing**
```typescript
// Required accessibility tests
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<YourComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 📋 **NEW APPLICATION CHECKLIST**

### **Setup Phase**
- [ ] Use standard project structure from template
- [ ] Configure all required shared packages (@ganger/ui, @ganger/auth, @ganger/db, @ganger/integrations, @ganger/utils)
- [ ] Set up TypeScript configuration extending @ganger/config
- [ ] Configure Tailwind CSS with design system presets
- [ ] Set up ESLint and Prettier from @ganger/config

### **Development Phase**  
- [ ] Implement authentication using @ganger/auth (NO custom auth systems)
- [ ] Use @ganger/ui for ALL components (verify zero custom duplicates)
- [ ] Integrate with appropriate Universal Hubs (@ganger/integrations)
- [ ] Follow unified design system and color tokens
- [ ] Implement OpenAPI documentation for all endpoints
- [ ] Add rate limiting appropriate to endpoint sensitivity
- [ ] Include Redis caching for frequently accessed data
- [ ] Implement comprehensive error handling with standard responses
- [ ] Add performance monitoring integration
- [ ] Ensure HIPAA compliance with audit logging
- [ ] Implement mobile-responsive design
- [ ] Add accessibility compliance (WCAG 2.1 AA)

### **Quality Verification**
- [ ] `npm run type-check` (must pass 100%)
- [ ] `npm run test:ui-consistency` (verify @ganger/ui usage)
- [ ] `npm run test:auth-integration` (verify standard auth)
- [ ] `npm run audit:api-documentation` (verify OpenAPI coverage)
- [ ] `npm run test:performance-monitoring` (verify metrics integration)
- [ ] `npm run test:security-compliance` (verify HIPAA standards)
- [ ] `npm run test:accessibility` (verify WCAG compliance)

### **Deployment Phase**
- [ ] Configure environment variables following standard patterns
- [ ] Set up monitoring and alerting integration
- [ ] Configure health checks and status endpoints
- [ ] Test rollback procedures
- [ ] Document operational procedures
- [ ] Complete security compliance review

## 🚀 **DEPLOYMENT STANDARDS**

### **Staging Environment Testing**
```yaml
Prerequisites:
  - All automated tests passing
  - Code review completed and approved
  - Security scan completed
  - Performance benchmarks met

Staging Checklist:
  - [ ] Deploy to staging.gangerdermatology.com subdomain
  - [ ] Test all user workflows
  - [ ] Verify external integrations with test data
  - [ ] Test authentication and authorization
  - [ ] Verify responsive design on multiple devices
  - [ ] Test error handling and edge cases
  - [ ] Performance testing under simulated load
  - [ ] Security testing and vulnerability scan
```

### **Production Deployment Protocol**
```yaml
Prerequisites:
  - Staging validation completed
  - Stakeholder approval obtained
  - Rollback plan prepared
  - Monitoring alerts configured

Production Deployment:
  - [ ] Deploy during low-traffic hours
  - [ ] Monitor application health metrics
  - [ ] Verify all integrations functional
  - [ ] Test critical user workflows
  - [ ] Monitor error rates and performance
  - [ ] Verify monitoring and alerting
  - [ ] Document deployment and any issues
  - [ ] Notify stakeholders of successful deployment
```

### **Infrastructure Testing Requirements**

#### **Database Testing**
```sql
-- Test queries to validate setup
SELECT version(); -- PostgreSQL version
SELECT current_database(); -- Database name
SELECT current_user; -- Current user permissions

-- Test RLS policies
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
SELECT * FROM pg_policies; -- Row Level Security policies

-- Test connection pooling
SELECT count(*) FROM pg_stat_activity;
```

#### **Authentication Testing**
```typescript
// Test Google OAuth integration
const testAuthFlow = async () => {
  // Test domain restriction
  // Test role assignment
  // Test session management
  // Test permission checks
};
```

#### **API Integration Testing**
```typescript
// Test external service connectivity
const testIntegrations = async () => {
  // ModMed FHIR API connectivity
  // Google Calendar API
  // Email service connectivity
  // SMS service connectivity
  // PDF generation service
};
```

### **Environment Configuration**
```bash
# Standard environment variables (inherited from platform)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App-specific variables (follow naming convention)
YOUR_APP_API_KEY=api_key_value
YOUR_APP_FEATURE_FLAG=true
YOUR_APP_CACHE_TTL=3600
```

### **Health Check Implementation**
```typescript
// Required health check endpoint
export default async function handler(req: Request) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    dependencies: {
      database: await testDatabaseConnection(),
      externalAPIs: await testExternalConnections(),
      redis: await testCacheConnection()
    }
  };
  
  return Response.json(health);
}
```

## 📊 **MONITORING REQUIREMENTS**

### **Required Metrics**
```typescript
// Application performance metrics
await analytics.track('page_view', {
  category: 'navigation',
  page: '/dashboard',
  loadTime: performanceData.loadTime
});

// Business logic metrics
await analytics.track('appointment_created', {
  category: 'appointments',
  appointmentType: 'pharma_lunch',
  location: 'Ann Arbor'
});

// Error tracking
await analytics.track('error_occurred', {
  category: 'errors',
  errorType: 'validation_failed',
  component: 'AppointmentForm'
});
```

### **Alert Configuration**
- **Error Rate**: > 1% over 5 minutes
- **Response Time**: > 2 seconds for 95th percentile
- **Availability**: < 99.5% uptime
- **Security**: Failed authentication attempts > 10/minute
- **Business Logic**: Critical workflow failures

## 💡 **DEVELOPMENT BEST PRACTICES**

### **Code Organization**
```typescript
// ✅ Group imports logically
// Third-party imports
import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';

// Ganger Platform imports
import { Button, Card } from '@ganger/ui';
import { useAuth } from '@ganger/auth';
import { db } from '@ganger/db';

// Local imports
import { validateAppointment } from '../lib/validation';
import { AppointmentType } from '../types';
```

### **Error Handling Patterns**
```typescript
// ✅ Consistent error handling
import { createAPIResponse, AppError } from '@ganger/utils';

try {
  const result = await businessLogic();
  return createAPIResponse({ success: true, data: result });
} catch (error) {
  if (error instanceof AppError) {
    return createAPIResponse({ 
      success: false, 
      error: error.message,
      statusCode: error.statusCode 
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  return createAPIResponse({ 
    success: false, 
    error: 'Internal server error',
    statusCode: 500 
  });
}
```

### **Performance Optimization**
```typescript
// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// ✅ Implement proper loading states
const [isLoading, setIsLoading] = useState(false);
const [data, setData] = useState(null);

// ✅ Use Suspense for data fetching
<Suspense fallback={<LoadingSpinner />}>
  <DataComponent />
</Suspense>
```

## 🔒 **SECURITY STANDARDS**

### **Input Validation**
```typescript
// ✅ Use Zod schemas for validation
import { z } from 'zod';

const AppointmentSchema = z.object({
  patientId: z.string().uuid(),
  appointmentDate: z.string().datetime(),
  type: z.enum(['consultation', 'follow_up', 'pharma_lunch'])
});

// ✅ Validate all inputs
const validatedData = AppointmentSchema.parse(requestData);
```

### **Data Protection**
```typescript
// ✅ Sanitize all outputs
import { sanitizeHtml } from '@ganger/utils';

const safeContent = sanitizeHtml(userGeneratedContent);

// ✅ Use parameterized queries
const patient = await db
  .from('patients')
  .select('*')
  .eq('id', patientId) // Parameterized - safe from SQL injection
  .single();
```

---

These standards ensure all new applications on the Ganger Platform maintain the exceptional quality and consistency achieved during Beast Mode development. Following these guidelines guarantees seamless integration with existing infrastructure and optimal maintainability.
