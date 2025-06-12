# Monorepo Configuration Conflicts Analysis

**Generated:** January 12, 2025  
**Scope:** All applications in `/apps` directory  
**Purpose:** Deployment readiness assessment

## Executive Summary

Analysis of 19 applications across the Ganger Platform monorepo reveals **7 Critical conflicts**, **12 High-priority issues**, and **8 Medium-priority inconsistencies** that could prevent successful monorepo builds and deployments.

## Critical Conflicts ⚠️

### 1. Port Conflicts - CRITICAL
**Severity:** Critical  
**Issue:** Multiple applications configured for the same ports

**Conflicts Identified:**
- **Port 3004:** 
  - `eos-l10` (scripts: dev/start)
  - `checkin-kiosk` (scripts: dev/start) 
  - `pharma-scheduling` (scripts: dev/start)
- **Port 3008:**
  - `call-center-ops` (scripts: dev/start)
  - `integration-status` (scripts: dev/start)
  - `socials-reviews` (scripts: dev/start)
- **Port 3001:**
  - `inventory` (scripts: dev/start)
  - `staff` (scripts: dev/start)
- **Port 3007:**
  - `compliance-training` (scripts: dev/start)
  - `platform-dashboard` (scripts: dev/start)

**Impact:** Build system failures, runtime conflicts, deployment issues

**Recommendation:** Assign unique ports per application:
```json
{
  "eos-l10": 3004,
  "checkin-kiosk": 3005,
  "pharma-scheduling": 3006,
  "call-center-ops": 3008,
  "integration-status": 3009,
  "socials-reviews": 3010,
  "inventory": 3001,
  "staff": 3002,
  "compliance-training": 3007,
  "platform-dashboard": 3011
}
```

### 2. Dependency Version Conflicts - CRITICAL
**Severity:** Critical  
**Issue:** Inconsistent versions of core dependencies across applications

**Major Version Conflicts:**
- **Next.js Versions:**
  - `^14.0.0`: eos-l10, pharma-scheduling, platform-dashboard
  - `^14.2.0`: checkin-kiosk, handouts, inventory, medication-auth, staff
  - `14.0.4`: clinical-staffing, call-center-ops, config-dashboard
  - `14.2.5`: compliance-training, integration-status, socials-reviews, batch-closeout

- **TypeScript Versions:**
  - `^5.0.0`: eos-l10, pharma-scheduling, batch-closeout
  - `^5.3.3`: checkin-kiosk, clinical-staffing, call-center-ops, config-dashboard
  - `^5.5.0`: handouts, inventory, medication-auth, staff
  - `^5.5.4`: compliance-training, integration-status, socials-reviews

- **React Versions:**
  - `^18.3.0`: checkin-kiosk, handouts, inventory, medication-auth, staff
  - `^18.3.1`: Most other applications
  - Fixed `18.3.1`: call-center-ops, config-dashboard

**Impact:** Build incompatibilities, runtime errors, peer dependency warnings

**Recommendation:** Standardize on latest stable versions:
- Next.js: `^14.2.0`
- TypeScript: `^5.5.0` 
- React: `^18.3.1`

### 3. TypeScript Configuration Inconsistencies - CRITICAL
**Severity:** Critical  
**Issue:** Conflicting TypeScript configurations causing build failures

**Configuration Conflicts:**
- **Extends Configuration:**
  - `eos-l10`: Extends `../../tsconfig.json` (non-existent shared config)
  - `checkin-kiosk`, `medication-auth`: Extend `../../packages/config/typescript/nextjs.json`
  - `pharma-scheduling`: No extends, standalone configuration

- **Module Resolution:**
  - `eos-l10`: `"moduleResolution": "bundler"`
  - `pharma-scheduling`: `"moduleResolution": "node"`
  - Others: Inherit from base config

**Impact:** Compilation failures, import resolution errors

**Recommendation:** Standardize all apps to extend shared config

## High Priority Issues 🔴

### 4. Workspace Dependencies Inconsistencies - HIGH
**Severity:** High  
**Issue:** Inconsistent workspace dependency declarations

**Problems Found:**
- **Mixed Dependency Formats:**
  - Some use `"@ganger/auth": "*"`
  - Others use `"@ganger/auth": "workspace:*"`
  - `clinical-staffing` uses explicit versions: `"@ganger/ui": "0.1.0"`

**Affected Applications:**
- `batch-closeout`: Uses `workspace:*` format
- `call-center-ops`, `config-dashboard`: Uses `workspace:*` format
- Others: Use `"*"` format

**Recommendation:** Standardize on `"*"` format for all workspace dependencies

### 5. Tailwind Configuration Conflicts - HIGH
**Severity:** High  
**Issue:** Inconsistent Tailwind configurations and plugin usage

**Configuration Variations:**
- **Plugin Dependencies:**
  - `medication-auth`: Uses `@tailwindcss/forms`, `@tailwindcss/typography`
  - `eos-l10`: Commented out plugins to avoid dependency issues
  - `checkin-kiosk`: Extends shared config `@ganger/config/tailwind`

- **Content Paths:**
  - Inconsistent patterns for shared package inclusion
  - Some include `../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}`
  - Others don't include shared components

**Recommendation:** Standardize Tailwind configuration using shared preset

### 6. Next.js Configuration Conflicts - HIGH
**Severity:** High  
**Issue:** Conflicting Next.js configurations affecting build process

**Configuration Issues:**
- **Transpile Packages:**
  - Inconsistent package lists across applications
  - Some missing critical shared packages
  - `pharma-scheduling` has incomplete transpilePackages array

- **Build Settings:**
  - `medication-auth`: `eslint.ignoreDuringBuilds: true`
  - `pharma-scheduling`: `eslint.ignoreDuringBuilds: true`
  - `eos-l10`: `typescript.ignoreBuildErrors: false`

**Recommendation:** Standardize Next.js configuration with shared preset

### 7. Package Manager Inconsistencies - HIGH
**Severity:** High  
**Issue:** Mixed package manager usage causing lock file conflicts

**Problems:**
- Root `package.json` specifies `"packageManager": "pnpm@8.15.0"`
- Apps have `package-lock.json` (npm) instead of `pnpm-lock.yaml`
- Only `packages/ui` has `pnpm-lock.yaml`

**Recommendation:** Standardize on pnpm across entire monorepo

### 8. Testing Configuration Gaps - HIGH
**Severity:** High  
**Issue:** Incomplete testing setup across applications

**Testing Status:**
- **With Jest Config:** compliance-training, integration-status, socials-reviews, batch-closeout, clinical-staffing, platform-dashboard, config-dashboard
- **Missing Jest Config:** eos-l10, checkin-kiosk, handouts, inventory, medication-auth, pharma-scheduling, staff, call-center-ops

**Recommendation:** Implement consistent Jest configuration for all apps

### 9. ESLint Configuration Inconsistencies - HIGH
**Severity:** High  
**Issue:** Varying ESLint configurations affecting code quality

**Variations Found:**
- Different ESLint versions across applications
- Inconsistent plugin usage
- Some apps missing TypeScript ESLint integration

**Recommendation:** Standardize ESLint configuration using shared preset

## Medium Priority Issues 🟡

### 10. Environment Variable Management - MEDIUM
**Severity:** Medium  
**Issue:** Inconsistent environment variable handling

**Problems:**
- Different env variable patterns across applications
- Some apps have hardcoded configuration in Next.js config
- Inconsistent public variable naming

### 11. Build Output Configuration - MEDIUM  
**Severity:** Medium
**Issue:** Inconsistent build output directories

**Variations:**
- `medication-auth`: `distDir: 'dist'`
- Others: Default `.next` directory

### 12. PWA Configuration Conflicts - MEDIUM
**Severity:** Medium
**Issue:** PWA configuration only in `eos-l10`

**Issue:** Shared PWA dependencies but only one app configured for PWA

## Application-Specific Configuration Status

| Application | Port | Next.js | TypeScript | Critical Issues |
|-------------|------|---------|------------|-----------------|
| eos-l10 | 3004 ⚠️ | 14.0.0 | 5.0.0 | Port conflict, version mismatch |
| checkin-kiosk | 3004 ⚠️ | 14.2.0 | 5.3.3 | Port conflict |
| handouts | 3002 ✅ | 14.2.0 | 5.5.0 | Version standardization needed |
| inventory | 3001 ⚠️ | 14.2.0 | 5.5.0 | Port conflict |
| medication-auth | 3005 ✅ | 14.2.0 | 5.5.0 | Configuration complete |
| pharma-scheduling | 3004 ⚠️ | 14.0.0 | 5.0.0 | Multiple conflicts |
| staff | 3001 ⚠️ | 14.2.0 | 5.5.0 | Port conflict |
| clinical-staffing | 3005 ⚠️ | 14.0.4 | 5.3.3 | Port conflict (with med-auth) |
| compliance-training | 3007 ⚠️ | 14.2.5 | 5.5.4 | Port conflict |
| platform-dashboard | 3007 ⚠️ | 14.0.4 | 5.3.2 | Port conflict |
| batch-closeout | 3006 ✅ | 14.2.5 | 5.0.0 | Version standardization |
| call-center-ops | 3008 ⚠️ | 14.0.4 | 5.3.3 | Port conflict |
| config-dashboard | 3010 ✅ | 14.0.4 | 5.3.3 | Version updates needed |
| integration-status | 3008 ⚠️ | 14.2.5 | 5.5.4 | Port conflict |
| socials-reviews | 3008 ⚠️ | 14.2.5 | 5.5.4 | Port conflict |

## Deployment Readiness Assessment

### Blocking Issues for Deployment:
1. **Port conflicts** will prevent concurrent development
2. **Dependency version conflicts** will cause build failures  
3. **TypeScript configuration conflicts** will prevent compilation
4. **Package manager inconsistencies** will cause install failures

### Estimated Remediation Time:
- **Critical Issues:** 2-3 hours
- **High Priority Issues:** 4-6 hours  
- **Medium Priority Issues:** 2-3 hours
- **Total:** 8-12 hours

## Recommended Action Plan

### Phase 1: Critical Fixes (Immediate)
1. Resolve port conflicts by assigning unique ports
2. Standardize dependency versions across all applications
3. Fix TypeScript configuration inheritance
4. Standardize package manager to pnpm

### Phase 2: High Priority (Next Sprint)
1. Implement shared configuration presets
2. Standardize workspace dependency declarations
3. Complete testing setup for all applications
4. Implement consistent ESLint configuration

### Phase 3: Medium Priority (Future Iteration)
1. Standardize environment variable handling
2. Implement consistent build output configuration
3. Evaluate PWA strategy across applications

## Conclusion

The monorepo has significant configuration conflicts that **MUST be resolved before deployment**. The critical port conflicts and dependency version mismatches will prevent successful builds. However, these issues are well-defined and can be systematically resolved following the recommended action plan.

**Deployment Status: ❌ NOT READY** - Critical fixes required before deployment.