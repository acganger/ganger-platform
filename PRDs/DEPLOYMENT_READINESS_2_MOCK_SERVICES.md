# PRD: Deployment Readiness Assignment 2 - Mock Services & API Cleanup

## Assignment Overview
**Coder 2**: Replace mock services and clean up example/demo API endpoints
**Priority**: 🚨 DEPLOYMENT BLOCKER
**Estimated Time**: 2-3 days
**Dependencies**: Assignment 1 (Authentication) must be completed first

## Scope
This assignment focuses on replacing mock service integrations with real production services and removing example/demo API endpoints that could expose sensitive functionality.

## Critical Issues to Address

### 🚨 CRITICAL: Mock Service Replacement (Medication-Auth App)

#### 1. AI/OpenAI Mock Service
**Files to replace:**
- `apps/medication-auth/src/lib/ai/mock-openai.ts`
- `apps/medication-auth/src/lib/ai/ml-models.ts`
- `apps/medication-auth/src/pages/api/ai/analyze.ts`

**Required Changes:**
- [ ] Replace `mock-openai.ts` with real OpenAI API integration
- [ ] Implement proper API key management for OpenAI
- [ ] Add error handling for OpenAI API failures
- [ ] Implement proper token usage monitoring
- [ ] Add fallback mechanisms for AI analysis

#### 2. Integration Manager Mock Services
**Files to replace:**
- `apps/medication-auth/src/lib/integrations/mock-integrations-manager.ts`
- `apps/medication-auth/src/pages/api/insurance/`
- `apps/medication-auth/src/pages/api/medications/`

**Required Changes:**
- [ ] Replace mock integration manager with real ModMed FHIR client
- [ ] Implement real insurance verification APIs
- [ ] Connect to real medication database services
- [ ] Add proper error handling for external API failures
- [ ] Implement retry logic and circuit breakers

#### 3. Monitoring Services Mock
**Files to replace:**
- `apps/medication-auth/src/lib/monitoring/mock-monitoring-services.ts`
- `apps/medication-auth/src/lib/utils/mock-health-check.ts`
- `apps/medication-auth/src/pages/api/monitoring/`

**Required Changes:**
- [ ] Replace mock monitoring with real health check services
- [ ] Implement proper application performance monitoring
- [ ] Connect to real logging and alerting systems
- [ ] Add database connection monitoring
- [ ] Implement proper uptime tracking

### 🗑️ Example/Demo API Cleanup

#### 4. Remove Example API Endpoints
**Files to remove/secure:**
- `apps/medication-auth/src/pages/api/example-migrated.ts`
- `apps/medication-auth/src/pages/api/example-standardized.ts`
- `apps/medication-auth/src/pages/api/cache/example.ts`
- `apps/batch-closeout/src/pages/api/batch-reports/[id]/verify.ts` (if demo)
- `apps/batch-closeout/src/pages/api/batch-reports/[id]/generate-label.ts` (verify production ready)

**Required Changes:**
- [ ] Remove all example/demo API endpoints
- [ ] Secure any endpoints marked as "test" or "example"
- [ ] Ensure remaining endpoints require proper authentication
- [ ] Add rate limiting to production endpoints
- [ ] Document remaining API endpoints

#### 5. Mock Data Cleanup
**Files to clean:**
- `apps/socials-reviews/src/components/ui/MockComponents.tsx`
- `apps/medication-auth/src/lib/utils/mock-response-utils.ts`
- Any components with hardcoded demo data

**Required Changes:**
- [ ] Remove mock UI components not needed for production
- [ ] Replace hardcoded demo data with real data fetching
- [ ] Remove mock response utilities
- [ ] Implement proper loading states for real data
- [ ] Add error states for failed data fetching

## Real Service Integration Requirements

### OpenAI Integration Pattern
```typescript
// Replace mock with real implementation
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeAuthorization(data: AuthorizationData) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [/* ... */],
      max_tokens: 1000,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    // Implement proper error handling and fallbacks
    throw new AuthorizationAnalysisError(error.message);
  }
}
```

### ModMed FHIR Integration Pattern  
```typescript
// Replace mock with real FHIR client
import { FHIRClient } from '@/lib/integrations/fhir-client';

const fhirClient = new FHIRClient({
  baseUrl: process.env.MODMED_FHIR_URL,
  clientId: process.env.MODMED_CLIENT_ID,
  clientSecret: process.env.MODMED_CLIENT_SECRET,
});

export async function getPatientMedications(patientId: string) {
  try {
    return await fhirClient.getMedicationRequests(patientId);
  } catch (error) {
    // Implement proper error handling
    throw new MedicationFetchError(error.message);
  }
}
```

### Health Check Pattern
```typescript
// Replace mock with real health checks
export async function performHealthCheck() {
  const checks = await Promise.allSettled([
    checkDatabaseConnection(),
    checkExternalAPIHealth(),
    checkCacheHealth(),
  ]);
  
  return {
    status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
    checks: checks.map(formatHealthCheckResult),
    timestamp: new Date().toISOString(),
  };
}
```

## Testing Requirements
- [ ] Test real OpenAI API integration with actual requests
- [ ] Verify ModMed FHIR connectivity in staging environment
- [ ] Test insurance verification with real insurance APIs
- [ ] Validate health checks report accurate system status
- [ ] Verify no example endpoints are accessible
- [ ] Test error handling for external API failures

## Configuration Requirements
**Environment Variables to Add:**
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# ModMed FHIR Configuration  
MODMED_FHIR_URL=https://api.modmed.com/fhir
MODMED_CLIENT_ID=...
MODMED_CLIENT_SECRET=...

# Insurance API Configuration
INSURANCE_API_URL=...
INSURANCE_API_KEY=...

# Monitoring Configuration
MONITORING_ENDPOINT=...
HEALTH_CHECK_INTERVAL=300000
```

## Success Criteria
- [ ] All mock services replaced with real implementations
- [ ] All example/demo API endpoints removed or secured
- [ ] Real external API integrations working
- [ ] Proper error handling for all external services
- [ ] Health checks accurately reflect system status
- [ ] No mock data visible in production UI
- [ ] All tests passing with real services

## Files Not to Modify
**DO NOT TOUCH** - These are assigned to other coders:
- Authentication-related files (Assignment 1)
- Console.log statements (Assignment 3)  
- Environment configuration patterns (Assignment 4)
- Error boundary components (Assignment 5)

## Dependencies
**Requires completion of Assignment 1**: Authentication systems must be in place before testing real API integrations that require authenticated requests.

## Deployment Validation
After completion, verify:
```bash
# Test real service integrations
cd apps/medication-auth && npm run build
cd apps/batch-closeout && npm run build

# Verify no mock services in production
grep -r "mock" apps/medication-auth/src/lib/ | grep -v node_modules

# Test external API connectivity
npm run test:integration
```

---
**Assignment Owner**: Coder 2  
**Status**: Waiting for Assignment 1 (Authentication)  
**Blocker**: Requires Assignment 1 completion  
**Estimated Completion**: Day 2-3 of sprint