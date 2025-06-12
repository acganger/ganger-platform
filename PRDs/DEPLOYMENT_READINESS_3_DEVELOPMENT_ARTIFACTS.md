# PRD: Deployment Readiness Assignment 3 - Development Artifacts & Console Cleanup

## Assignment Overview
**Coder 3**: Remove development artifacts, console statements, and debug code
**Priority**: ⚠️ HIGH PRIORITY
**Estimated Time**: 1-2 days
**Dependencies**: None (can run in parallel with other assignments)

## Scope
This assignment focuses on cleaning up development artifacts that should not appear in production, including console.log statements, debug code, TODO comments, and test utilities.

## Critical Issues to Address

### 🧹 Console Log Cleanup (181+ instances found)

#### 1. Remove Console.log Statements
**Apps with heavy console usage:**
- `apps/clinical-staffing/` - 40+ console.log statements
- `apps/medication-auth/` - 35+ console.log statements  
- `apps/platform-dashboard/` - 25+ console.log statements
- `apps/integration-status/` - 20+ console.log statements
- `apps/socials-reviews/` - 15+ console.log statements
- `apps/compliance-training/` - 15+ console.log statements
- `apps/call-center-ops/` - 10+ console.log statements
- `apps/eos-l10/` - 10+ console.log statements
- All other apps - 5-10 console.log statements each

**Search and Replace Strategy:**
```bash
# Find all console.log statements
grep -r "console\.log" apps/*/src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Replace with proper logging or remove entirely
```

**Required Changes:**
- [ ] Remove all `console.log` statements from production code
- [ ] Replace critical logging with proper logging service
- [ ] Keep only essential error logging with proper log levels
- [ ] Remove debug console statements in components
- [ ] Remove temporary console statements in API routes

#### 2. Debug Code Cleanup
**Files likely containing debug code:**
- `apps/*/src/components/__tests__/` - Remove test console.log
- `apps/*/src/pages/api/` - Remove API debug statements
- `apps/*/src/hooks/` - Remove hook debug logging
- `apps/*/src/lib/` - Remove service debug statements

**Required Changes:**
- [ ] Remove `console.error`, `console.warn`, `console.debug` in production code
- [ ] Remove temporary debug variables
- [ ] Remove debug flags and development-only code paths
- [ ] Clean up commented-out debug code
- [ ] Remove test data logged to console

### 🗑️ Development Artifacts Removal

#### 3. TODO/FIXME Comments Cleanup
**Search for development comments:**
```bash
grep -r "TODO\|FIXME\|HACK\|XXX\|NOTE:" apps/*/src/
```

**Required Changes:**
- [ ] Remove or resolve all TODO comments
- [ ] Remove FIXME comments (implement fixes or document as known issues)
- [ ] Remove HACK comments (implement proper solutions)
- [ ] Document any remaining issues in proper issue tracking
- [ ] Remove development notes and personal comments

#### 4. Test Utilities in Production
**Files to clean:**
- `apps/compliance-training/src/test-utils.tsx`
- `apps/clinical-staffing/src/__tests__/`
- `apps/platform-dashboard/__tests__/`
- `apps/integration-status/jest.setup.js`

**Required Changes:**
- [ ] Ensure test utilities are not imported in production builds
- [ ] Remove test-only components from production bundles
- [ ] Clean up jest configuration files for production
- [ ] Remove development test data generators
- [ ] Verify no test fixtures in production code

#### 5. Development Dependencies Cleanup
**Files to audit:**
- All `package.json` files for unused dev dependencies
- Import statements for development-only packages
- Development-only configuration files

**Required Changes:**
- [ ] Remove unused development dependencies
- [ ] Ensure no dev dependencies imported in production code
- [ ] Clean up development-only configuration
- [ ] Remove development build artifacts
- [ ] Verify production build doesn't include dev code

### 🔧 Code Quality Improvements

#### 6. Commented Code Removal
**Search for commented code blocks:**
```bash
grep -r "//.*\(function\|const\|export\)" apps/*/src/
grep -r "/\*.*\*/" apps/*/src/
```

**Required Changes:**
- [ ] Remove large blocks of commented-out code
- [ ] Remove old implementation attempts
- [ ] Keep only meaningful code comments
- [ ] Remove development experiment code
- [ ] Clean up version control artifacts

#### 7. Temporary Variables and Flags
**Common patterns to find:**
```typescript
// Remove these patterns:
const DEBUG = true;
const IS_DEV = process.env.NODE_ENV === 'development';
let tempVar = 'test';
// eslint-disable-next-line
```

**Required Changes:**
- [ ] Remove temporary development flags
- [ ] Remove hardcoded development mode checks
- [ ] Remove temporary variables not used in production
- [ ] Clean up ESLint disable comments
- [ ] Remove development shortcuts

## Logging Replacement Strategy

### Replace Console.log with Proper Logging
```typescript
// Instead of: console.log('User action', data);
// Use proper logging:
import { logger } from '@/lib/logger';

// For development debugging (remove entirely):
// console.log('Debug info', data); // DELETE THIS

// For error logging (keep with proper service):
logger.error('Authentication failed', { error, userId });

// For important events (use proper service):
logger.info('User signed in', { userId, timestamp });
```

### Proper Error Logging Pattern
```typescript
// Replace console.error with proper error handling
try {
  // operation
} catch (error) {
  // Instead of: console.error('Error:', error);
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { userId, operation: 'example' }
  });
  
  // Show user-friendly error
  throw new UserFacingError('Operation failed. Please try again.');
}
```

## Implementation Tools

### Automated Cleanup Scripts
```bash
# Find all console statements
find apps/*/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\."

# Remove console.log statements (manual review each)
sed -i '/console\.log/d' file.ts

# Find TODO comments
grep -rn "TODO\|FIXME" apps/*/src/
```

### Build-time Validation
```typescript
// Add to build process to catch remaining console statements
const hasConsoleLog = /console\.log/;
if (process.env.NODE_ENV === 'production' && hasConsoleLog.test(fileContent)) {
  throw new Error('Console.log found in production build');
}
```

## Testing Requirements
- [ ] Verify no console.log statements in production builds
- [ ] Test that applications run without debug dependencies
- [ ] Verify no TODO/FIXME comments remain
- [ ] Check that builds complete without development artifacts
- [ ] Test error logging works with proper logging service
- [ ] Verify no test utilities in production bundles

## Success Criteria
- [ ] Zero console.log statements in all production code
- [ ] All TODO/FIXME comments resolved or removed
- [ ] No test utilities in production builds
- [ ] No commented-out code blocks
- [ ] No development flags or temporary variables
- [ ] Proper logging service implemented for errors
- [ ] Clean, production-ready codebase

## Files Not to Modify
**DO NOT TOUCH** - These are assigned to other coders:
- Authentication systems (Assignment 1)
- Mock service files (Assignment 2)
- Environment configuration files (Assignment 4)
- Error boundary components (Assignment 5)

## App-by-App Checklist

### High Priority Apps (Clean First)
- [ ] **clinical-staffing** (40+ console.log statements)
- [ ] **medication-auth** (35+ console.log statements)
- [ ] **platform-dashboard** (25+ console.log statements)
- [ ] **integration-status** (20+ console.log statements)

### Medium Priority Apps  
- [ ] **socials-reviews** (15+ console.log statements)
- [ ] **compliance-training** (15+ console.log statements)
- [ ] **call-center-ops** (10+ console.log statements)
- [ ] **eos-l10** (10+ console.log statements)

### Low Priority Apps
- [ ] **handouts** (5-10 console.log statements)
- [ ] **inventory** (5-10 console.log statements)
- [ ] **staff** (5-10 console.log statements)
- [ ] **pharma-scheduling** (5-10 console.log statements)
- [ ] **config-dashboard** (5-10 console.log statements)
- [ ] **checkin-kiosk** (5-10 console.log statements)
- [ ] **batch-closeout** (5-10 console.log statements)

## Deployment Validation
After completion, verify:
```bash
# Verify no console statements remain
grep -r "console\." apps/*/src/ | grep -v node_modules | wc -l  # Should be 0

# Verify no TODO comments
grep -r "TODO\|FIXME" apps/*/src/ | wc -l  # Should be 0

# Test production builds are clean
NODE_ENV=production npm run build:all
```

---
**Assignment Owner**: Coder 3  
**Status**: Ready to Start (Independent)  
**Blocker**: False  
**Estimated Completion**: Day 1-2 of sprint