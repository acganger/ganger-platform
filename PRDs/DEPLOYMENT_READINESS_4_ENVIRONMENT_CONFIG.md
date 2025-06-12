# PRD: Deployment Readiness Assignment 4 - Environment & Configuration Management

## Assignment Overview
**Coder 4**: Environment configuration, localhost references, and deployment configuration
**Priority**: ⚠️ HIGH PRIORITY  
**Estimated Time**: 2-3 days
**Dependencies**: Can run parallel to other assignments

## Scope
This assignment focuses on environment configuration management, removing hardcoded localhost references, implementing proper environment-based configurations, and ensuring all apps work correctly across development, staging, and production environments.

## Critical Issues to Address

### 🌍 Environment Configuration Standardization

#### 1. Localhost References Cleanup
**Search for hardcoded localhost:**
```bash
grep -r "localhost\|127\.0\.0\.1" apps/*/src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

**Common files likely affected:**
- `apps/*/src/lib/supabase.ts` - Database URLs
- `apps/*/src/lib/api-client.ts` - API base URLs  
- `apps/*/src/pages/api/` - API endpoint references
- `apps/*/next.config.js` - Development server configuration
- `apps/*/package.json` - Development scripts

**Required Changes:**
- [ ] Replace all localhost references with environment variables
- [ ] Implement dynamic base URL configuration
- [ ] Add environment detection for API endpoints
- [ ] Configure CORS for production domains
- [ ] Update development scripts to use environment variables

#### 2. Environment Variables Standardization
**Create comprehensive `.env.example` for each app:**

**Apps needing environment configuration:**
- `apps/clinical-staffing/` - Supabase, external APIs
- `apps/medication-auth/` - OpenAI, ModMed, insurance APIs
- `apps/call-center-ops/` - 3CX integration, telephony APIs
- `apps/integration-status/` - Monitoring APIs, external services
- `apps/platform-dashboard/` - Aggregated service APIs
- `apps/socials-reviews/` - Social media APIs
- `apps/handouts/` - PDF generation, communication APIs
- `apps/staff/` - Google Workspace, legacy database
- All other apps - Basic Supabase configuration

**Standard Environment Variables Pattern:**
```env
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Clinical Staffing
NEXT_PUBLIC_APP_URL=https://clinical-staffing.gangerdermatology.com

# Database Configuration
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication
GOOGLE_CLIENT_ID=745912643942-ttm6166flfqbsad430k7a5q3n8stvv34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Application-Specific APIs
# (varies by app)
```

#### 3. Next.js Configuration Standardization
**Files to update:**
- All `apps/*/next.config.js` files
- All `apps/*/package.json` scripts
- All `apps/*/tailwind.config.js` references

**Required Changes:**
- [ ] Standardize Next.js configuration across all apps
- [ ] Add environment-based configuration
- [ ] Configure proper asset optimization for production
- [ ] Set up proper domain configuration
- [ ] Add security headers for production

### 🔧 Configuration Management

#### 4. API Base URL Configuration
**Pattern to implement across all apps:**
```typescript
// apps/*/src/lib/config.ts
export const config = {
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_API_URL 
    : 'http://localhost:3000',
  
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // App-specific configuration
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebug: process.env.NODE_ENV === 'development',
  }
};
```

**Apps requiring API configuration:**
- [ ] **clinical-staffing** - Staffing optimization APIs
- [ ] **medication-auth** - OpenAI, ModMed, insurance APIs  
- [ ] **call-center-ops** - 3CX webhooks, telephony APIs
- [ ] **integration-status** - Monitoring and health check APIs
- [ ] **platform-dashboard** - Aggregated dashboard APIs
- [ ] **socials-reviews** - Social media platform APIs
- [ ] **handouts** - PDF generation and communication APIs
- [ ] **staff** - Google Workspace and legacy database APIs

#### 5. Database Configuration Standardization
**Files to update:**
- All `apps/*/src/lib/supabase.ts`
- All `apps/*/src/lib/db.ts` 
- Migration scripts and database clients

**Required Changes:**
- [ ] Standardize Supabase client configuration
- [ ] Add proper connection pooling for production
- [ ] Configure read/write splitting if needed
- [ ] Add database health checks
- [ ] Implement proper error handling for database connections

#### 6. Domain Configuration
**Apps with custom domains (from CLAUDE.md):**
- `staff.gangerdermatology.com` → `apps/staff`
- `lunch.gangerdermatology.com` → `apps/lunch` (not yet created)
- `l10.gangerdermatology.com` → `apps/eos-l10`

**Required Changes:**
- [ ] Configure proper domain routing in Next.js
- [ ] Set up CORS for cross-domain requests
- [ ] Configure proper redirect rules
- [ ] Add domain-specific environment variables
- [ ] Test subdomain routing and SSL

### 🔒 Security Configuration

#### 7. CORS and Security Headers
**Files to update:**
- All API routes in `apps/*/src/pages/api/`
- All `apps/*/next.config.js` for security headers

**Required Changes:**
- [ ] Configure proper CORS policies for production
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Restrict API access to authorized domains
- [ ] Configure proper cookie security
- [ ] Add rate limiting configuration

#### 8. Build and Deployment Configuration
**Files to standardize:**
- All `apps/*/package.json` build scripts
- All deployment-related configuration files
- GitHub Actions configuration (if exists)

**Required Changes:**
- [ ] Standardize build scripts across all apps
- [ ] Add environment-specific build configurations
- [ ] Configure proper asset optimization
- [ ] Add build validation scripts
- [ ] Set up proper deployment environment checks

## App-Specific Configuration Requirements

### High Priority Apps
#### Clinical Staffing
```env
# Staffing-specific APIs
DEPUTY_API_KEY=...
SCHEDULING_OPTIMIZATION_API=...
ANALYTICS_ENDPOINT=...
```

#### Medication Auth  
```env
# AI and Integration APIs
OPENAI_API_KEY=sk-...
MODMED_FHIR_URL=...
INSURANCE_VERIFICATION_API=...
```

#### Call Center Ops
```env
# 3CX Integration
THREECX_API_URL=...
THREECX_API_TOKEN=...
TELEPHONY_WEBHOOK_SECRET=...
```

#### Platform Dashboard
```env
# Aggregated APIs
DASHBOARD_API_ENDPOINTS=...
REAL_TIME_UPDATES_URL=...
```

### Medium Priority Apps
- **Integration Status**: Monitoring APIs, health check endpoints
- **Socials Reviews**: Social media platform APIs
- **Handouts**: PDF generation, communication services
- **Staff**: Google Workspace, legacy database migration

### Standard Configuration (All Apps)
```env
# Base configuration for all apps
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Testing Requirements
- [ ] Test all apps in development environment with new configuration
- [ ] Test all apps in staging environment 
- [ ] Verify environment variable validation works
- [ ] Test API endpoints with production domains
- [ ] Verify CORS configuration works correctly
- [ ] Test SSL and security headers
- [ ] Validate build processes with new configuration

## Validation Scripts
```bash
# Verify no localhost references remain
grep -r "localhost\|127\.0\.0\.1" apps/*/src/ | grep -v node_modules

# Verify environment variables are used
grep -r "process\.env\." apps/*/src/ | wc -l

# Test environment validation
NODE_ENV=production npm run validate:env
```

## Success Criteria
- [ ] Zero hardcoded localhost references in production code
- [ ] All apps have standardized environment configuration
- [ ] Environment variables properly validated on startup
- [ ] CORS and security headers configured for production
- [ ] Domain routing works correctly
- [ ] Build processes work in all environments
- [ ] All apps deployable to production domains

## Files Not to Modify
**DO NOT TOUCH** - These are assigned to other coders:
- Authentication implementation (Assignment 1)
- Mock service replacement (Assignment 2)  
- Console.log cleanup (Assignment 3)
- Error boundary components (Assignment 5)

## Dependencies
This assignment can run in parallel with others, but coordination needed for:
- Assignment 1: Authentication environment variables
- Assignment 2: External API environment variables

## Deployment Validation
After completion, verify:
```bash
# Test production builds with environment variables
NODE_ENV=production npm run build:all

# Verify environment validation
npm run validate:env:production

# Test with production domains (staging)
NEXT_PUBLIC_APP_URL=https://app.gangerdermatology.com npm run build
```

---
**Assignment Owner**: Coder 4  
**Status**: Ready to Start (Independent)  
**Blocker**: False  
**Estimated Completion**: Day 2-3 of sprint