# PRD: Deployment Readiness Assignment 1 - Security & Authentication Fixes

## Assignment Overview
**Coder 1**: Critical security vulnerabilities and authentication system fixes
**Priority**: 🚨 DEPLOYMENT BLOCKER
**Estimated Time**: 1-2 days
**Dependencies**: None (can start immediately)

## Scope
This assignment focuses exclusively on security vulnerabilities that would prevent production deployment, specifically mock authentication systems and security bypasses.

## Critical Issues to Address

### 🚨 CRITICAL: Mock Authentication Replacement

#### 1. Integration-Status App Authentication
**Files to modify:**
- `apps/integration-status/src/lib/auth-mock.tsx`
- `apps/integration-status/src/pages/_app.tsx`

**Required Changes:**
- [ ] Replace `auth-mock.tsx` with real `@ganger/auth` implementation
- [ ] Remove all mock authentication logic
- [ ] Implement proper user session management
- [ ] Add proper role-based access controls
- [ ] Test authentication flow with real Google OAuth

#### 2. Socials-Reviews App Authentication  
**Files to modify:**
- `apps/socials-reviews/src/lib/auth-mock.tsx`
- `apps/socials-reviews/src/lib/types-mock.ts`
- `apps/socials-reviews/src/pages/_app.tsx`

**Required Changes:**
- [ ] Replace `auth-mock.tsx` with real `@ganger/auth` implementation
- [ ] Remove `types-mock.ts` and use real types from `@ganger/types`
- [ ] Implement proper user authentication
- [ ] Add proper authorization for social media management
- [ ] Test with real user accounts

### 🔒 Security Configuration

#### 3. API Security Hardening
**Files to secure:**
- `apps/integration-status/src/pages/api/integrations/[id]/test.ts`
- `apps/config-dashboard/src/pages/api/permissions/index.ts`
- `apps/config-dashboard/src/pages/api/impersonation/`

**Required Changes:**
- [ ] Add proper authentication middleware to all API endpoints
- [ ] Implement rate limiting on sensitive endpoints
- [ ] Add request validation and sanitization
- [ ] Secure admin-only endpoints with proper role checks
- [ ] Remove or secure test endpoints

#### 4. Environment Variable Security
**Files to audit:**
- All `package.json` files for exposed credentials
- All component files for hardcoded API keys
- All configuration files

**Required Changes:**
- [ ] Audit all apps for hardcoded credentials
- [ ] Move sensitive data to environment variables
- [ ] Implement proper secret management
- [ ] Add environment validation on startup
- [ ] Document required environment variables

## Implementation Requirements

### Authentication Flow
```typescript
// Replace mock auth with real implementation
import { AuthProvider, useAuth } from '@ganger/auth';

// Ensure all protected routes use:
const { user, isAuthenticated, signOut } = useAuth();

// Add proper loading states and error handling
if (!isAuthenticated) {
  return <LoginRedirect />;
}
```

### API Security Pattern
```typescript
// All API endpoints must include:
import { withAuth } from '@ganger/auth';

export default withAuth(async (req, res, user) => {
  // Validate user permissions
  if (!hasPermission(user, 'required_permission')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Implement endpoint logic
});
```

## Testing Requirements
- [ ] Test authentication flow with real Google OAuth
- [ ] Verify proper session management
- [ ] Test role-based access controls
- [ ] Verify API security with authenticated requests
- [ ] Test logout and session cleanup

## Success Criteria
- [ ] All mock authentication systems removed
- [ ] Real `@ganger/auth` implemented in all apps
- [ ] All API endpoints properly secured
- [ ] No hardcoded credentials or API keys
- [ ] Authentication flow works with production OAuth
- [ ] All tests passing with real authentication

## Files Not to Modify
**DO NOT TOUCH** - These are assigned to other coders:
- Any files with `console.log` statements (Assignment 3)
- Mock service integrations (Assignment 2)
- Environment configuration files (Assignment 4)
- Error handling components (Assignment 5)

## Dependencies for Other Assignments
This assignment must be completed first as other assignments depend on having working authentication:
- Assignment 2 (Mock Services) needs real auth for API testing
- Assignment 4 (Environment) needs auth patterns established
- Assignment 5 (Error Handling) needs auth context for error boundaries

## Deployment Validation
After completion, verify:
```bash
# Test authentication in each app
cd apps/integration-status && npm run build
cd apps/socials-reviews && npm run build

# Verify no security warnings
npm audit --audit-level moderate

# Test with production environment variables
NODE_ENV=production npm run type-check
```

---
**Assignment Owner**: Coder 1  
**Status**: Ready to Start  
**Blocker**: False  
**Estimated Completion**: Day 1-2 of sprint