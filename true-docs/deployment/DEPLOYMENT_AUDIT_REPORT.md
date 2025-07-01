# Ganger Platform - Deployment Audit Report

**Date**: June 30, 2025  
**Author**: Claude Code  
**Status**: Critical Issues Found  
**Impact**: Multiple deployment blockers affecting 17+ applications

---

## Executive Summary

A comprehensive deployment audit of the Ganger Platform monorepo revealed multiple critical issues that are preventing successful Vercel deployments. The audit uncovered configuration inconsistencies, file system issues, and pattern violations across the 21 applications in the platform.

### Key Findings
- **17 apps** have `node_modules` directories that block pnpm workspace deployments
- **20 different** `vercel.json` configurations exist (should be standardized)
- **3 apps** have `.env` files that override Vercel environment variables
- **PostCSS misconfiguration** was causing deployment failures (now fixed)

## Background

The Ganger Platform is a medical-grade monorepo containing 21 Next.js applications for Ganger Dermatology. As documented in the [MASTER_DEVELOPMENT_GUIDE.md](../MASTER_DEVELOPMENT_GUIDE.md), the platform follows strict deployment principles:

> "**Medical-Grade Reliability**: >99.9% uptime, zero data loss tolerance"  
> "**Monorepo Integrity**: Shared infrastructure prevents fragmentation"

The platform uses:
- **Package Manager**: pnpm with workspaces (see [PNPM_MIGRATION_SUMMARY.md](./PNPM_MIGRATION_SUMMARY.md))
- **Deployment**: Vercel distributed architecture with 20+ projects
- **Shared Dependencies**: `@ganger/deps` pattern to prevent version conflicts

## Audit Methodology

The audit examined multiple deployment risk factors:

1. **Configuration Files**: PostCSS, vercel.json, tsconfig.json
2. **File System**: node_modules, .env files, build artifacts
3. **Code Patterns**: Hardcoded tokens, edge runtime exports, custom servers
4. **Dependency Management**: Lock files, package naming, version consistency

## Critical Issues Found

### 1. PostCSS Configuration Pattern (FIXED)

**Issue**: Apps were split between Tailwind v3 and v4 PostCSS syntax, causing deployment failures.

**Root Cause**: The monorepo has `@tailwindcss/postcss@4.1.8` in root but documentation showed both v3 and v4 as valid.

**Fix Applied**: 
- Standardized all 18 apps to use Tailwind v4 syntax
- Updated documentation to mark v3 as FORBIDDEN

```javascript
// ❌ FORBIDDEN - Causes deployment failures
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}

// ✅ REQUIRED - All apps must use this
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### 2. Node Modules in Apps Directory (NOT AN ISSUE)

**Finding**: 17+ apps have `node_modules` directories

**Investigation Result**: These are **correct and required** - they're pnpm-managed symlinks created by `node-linker=hoisted` in .npmrc

**Why They Exist**:
- Added to solve "dramatic inconsistencies in builds" 
- Required for Vercel compatibility
- Provides predictable module resolution
- Only 145MB total real dependencies (staff: 130MB, handouts: 15MB)
- All other apps just have symlinks (36-56KB each)

**Impact of Removing**: 
- ❌ Would likely cause build failures to return
- ❌ May break Vercel deployments
- ❌ Could cause module resolution issues

**Recommendation**: **KEEP THE CURRENT SETUP** - it's working as designed and provides build stability

### 3. Environment Files Override

**Issue**: 3 apps have `.env` files that override Vercel settings

**Security Risk**: These files may contain production credentials

**Affected Apps**:
- `apps/eos-l10/.env.production`
- `apps/handouts/.env`
- `apps/inventory/.env.production`

**Fix Required**:
```bash
# Remove all .env files except examples
find apps -name ".env*" ! -name ".env.example" -delete

# Update .gitignore
echo "apps/*/.env*" >> .gitignore
echo "!apps/*/.env.example" >> .gitignore
```

### 4. Custom Server File

**Issue**: `apps/medication-auth/server.js` exists

**Impact**: Vercel requires serverless deployment, custom servers break this

**Fix Required**: Migrate to Next.js API routes or remove

### 5. Vercel.json Inconsistency

**Issue**: 20 unique vercel.json patterns across apps

**Risk**: 
- Different build commands
- Potential wrong project mappings
- Maintenance nightmare

**Sample Working Configuration**:
```json
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## Configuration Standards

Based on [CLAUDE.md](../../CLAUDE.md) deployment principles:

### Required for All Apps:
1. ✅ PostCSS with `@tailwindcss/postcss` 
2. ✅ No node_modules directories
3. ✅ No .env files (use Vercel dashboard)
4. ✅ Standardized vercel.json
5. ✅ No custom server files
6. ✅ Export `const dynamic = 'force-dynamic'` for auth pages
7. ✅ Correct auth imports (`@ganger/auth/client`, `/staff`, `/server`)

### Deployment Readiness Checklist:
From [MASTER_DEVELOPMENT_GUIDE.md](../MASTER_DEVELOPMENT_GUIDE.md#deployment-readiness-criteria-mandatory):

- [ ] No placeholder values in code
- [ ] No duplicate dependencies from @ganger/deps
- [ ] Correct auth import paths with subpaths
- [ ] Proper PostCSS configuration (v4 syntax)
- [ ] Dynamic rendering for auth-dependent pages
- [ ] All components properly exported
- [ ] No module-level API clients
- [ ] Environment variables in Vercel dashboard
- [ ] No node_modules directories
- [ ] No .env files committed

## Additional Patterns Discovered

### Potential Issues:
1. **Missing tsconfig.json**: 2 apps lack TypeScript config
2. **Middleware files**: Only staff app has middleware (REQUIRED for routing - see note below)
3. **Build command variations**: Some apps have non-standard build scripts
4. **Package name mismatches**: Some package.json names don't match folder names

### IMPORTANT: Staff App Middleware Requirement
The `apps/staff/middleware.ts` file is **REQUIRED** and must not be removed. This middleware:
- Acts as the central router for the distributed deployment architecture
- Rewrites requests from `staff.gangerdermatology.com/[app]` to individual Vercel deployments
- Uses Vercel Edge Config to dynamically manage app URLs
- Falls back to "coming soon" pages when apps are not yet deployed

**No other apps should have middleware** - they are accessed either directly or through the staff portal's routing.

### Verification Commands:
```bash
# Check PostCSS configuration
grep "@tailwindcss/postcss" postcss.config.js || echo "❌ Missing v4 syntax"

# Find node_modules
find apps -name "node_modules" -type d

# Find .env files
find apps -name ".env*" ! -name ".env.example"

# Check vercel.json consistency
md5sum apps/*/vercel.json | sort | uniq -c | sort -nr
```

## Recommendations

### Immediate Actions:
1. **Remove all node_modules** from apps directory
2. **Delete .env files** and move to Vercel dashboard
3. **Standardize vercel.json** across all apps
4. **Remove custom server** from medication-auth

### Process Improvements:
1. **Add pre-commit hooks** to prevent node_modules and .env files
2. **Create app template** with correct configuration
3. **Automate deployment checks** in CI/CD
4. **Document standard vercel.json** in deployment guide

### Monitoring:
1. Set up alerts for deployment failures
2. Regular audits using the patterns discovered
3. Track deployment success rates per app

## Conclusion

The deployment audit revealed that configuration drift and inconsistent patterns are the primary causes of deployment failures. The PostCSS v3/v4 issue was a symptom of larger standardization problems across the monorepo.

By implementing the fixes and following the established patterns in the documentation, all 21 apps should deploy successfully to Vercel. The key is maintaining consistency and preventing configuration drift through automation and regular audits.

---

**Related Documentation**:
- [MASTER_DEVELOPMENT_GUIDE.md](../MASTER_DEVELOPMENT_GUIDE.md) - Deployment readiness criteria
- [CLAUDE.md](../../CLAUDE.md) - AI deployment principles
- [PNPM_MIGRATION_SUMMARY.md](./PNPM_MIGRATION_SUMMARY.md) - Package manager setup
- [deployment/scripts/](./scripts/) - Deployment automation tools