# 🚀 Vercel Monorepo Deployment Success Guide

## 📅 Created: January 7, 2025 | Updated: January 29, 2025

This document captures the proven deployment strategy that successfully enabled Vercel deployments for our pnpm-based monorepo after extensive troubleshooting. Now includes advanced strategies for sequential deployments and isolated application changes.

## Overview
This document captures the proven solution for deploying pnpm monorepo applications to Vercel, specifically addressing the "Module not found" errors that occur even after proper pnpm detection.

## The Problem
Despite Vercel correctly detecting pnpm 8.15.0 and the monorepo structure, builds were failing with:
```
Module not found: Can't resolve '@ganger/auth'
```

## The Root Cause
Workspace packages were configured to export compiled JavaScript files from `dist/` directories:
```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

However:
- `dist/` directories are gitignored and don't exist in Vercel's build environment
- Even when packages are built during install, the module resolution fails
- Next.js `transpilePackages` needs access to TypeScript source files

## The Solution
Update all workspace packages to export TypeScript source files directly, allowing Next.js to handle transpilation:

```json
{
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "require": "./src/index.ts"
    }
  }
}
```

## Complete Working Configuration

### 1. Root `package.json`
```json
{
  "name": "ganger-platform",
  "packageManager": "pnpm@8.15.0",
  "workspaces": ["apps/*", "packages/*"]
}
```
**Critical**: Only the root should have `packageManager` field

### 2. Vercel Project Settings (API Configuration)
```bash
# Set via API for each project
{
  "rootDirectory": "apps/[app-name]",  # e.g., "apps/ai-receptionist"
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "outputDirectory": ".next"
}

# Environment Variables
ENABLE_EXPERIMENTAL_COREPACK=1
```

### 3. App Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ganger/auth',
    '@ganger/db', 
    '@ganger/integrations',
    '@ganger/ui',
    '@ganger/utils'
  ],
  // Other Next.js config...
};

module.exports = nextConfig;
```

### 4. Workspace Package Configuration
Example for `packages/auth/package.json`:
```json
{
  "name": "@ganger/auth",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "require": "./src/index.ts"
    },
    "./server": {
      "types": "./server.ts",
      "import": "./server.ts",
      "require": "./server.ts"
    }
  },
  "files": ["src/**/*"],
  "dependencies": {
    // dependencies
  }
}
```

### 5. App `vercel.json` Configuration
Place in each app directory (e.g., `apps/platform-dashboard/vercel.json`):
```json
{
  "ignoreCommand": "cd ../.. && npx turbo-ignore @ganger/[app-name]",
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && pnpm run build:packages",
  "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## 🚀 Advanced Deployment Strategies

### Preventing Unnecessary Rebuilds

#### 1. Root `vercel.json` Configuration
```json
{
  "ignoreCommand": "npx turbo-ignore"
}
```
This enables automatic change detection across the monorepo.

#### 2. App-Specific Ignore Commands
Each app's `vercel.json` should include:
```json
{
  "ignoreCommand": "cd ../.. && npx turbo-ignore @ganger/[app-name]"
}
```

This ensures:
- Only apps with code changes rebuild
- Apps rebuild when their dependencies change
- Unchanged apps skip deployment entirely

### Sequential Deployment Strategies

#### Manual Sequential Deployment
1. **Disable Auto-Promotion**: In Vercel project settings, disable automatic production promotion
2. **Deploy in Order**: 
   - Deploy foundational services first (e.g., shared APIs)
   - Deploy dependent applications after
3. **Manual Promotion**: Use Vercel Dashboard or CLI to promote to production
   ```bash
   vercel promote <deployment-url> --token=$VERCEL_TOKEN
   ```

#### Automated Sequential Deployment (GitHub Actions)
```yaml
name: Sequential Deployment
on:
  push:
    branches: [main]

jobs:
  deploy-platform-dashboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Platform Dashboard
        run: |
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=team_wpY7PcIsYQNnslNN39o7fWvS \
            --build-env ENABLE_EXPERIMENTAL_COREPACK=1
        working-directory: apps/platform-dashboard
    
  deploy-staff:
    needs: deploy-platform-dashboard
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Staff App
        run: |
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=team_wpY7PcIsYQNnslNN39o7fWvS \
            --build-env ENABLE_EXPERIMENTAL_COREPACK=1
        working-directory: apps/staff
```

### Progressive Delivery Options

#### Rolling Releases (Pro/Enterprise)
Configure gradual traffic shifting:
1. Enable in Project Settings → Build & Deployment → Rolling Releases
2. Enable Skew Protection for consistency
3. Define traffic stages: 5% → 25% → 50% → 100%
4. Monitor metrics during rollout

#### Blue-Green Deployments
Using Edge Config and Middleware:
```javascript
// middleware.js
import { get } from '@vercel/edge-config';

export async function middleware(request) {
  const config = await get('blueGreen');
  const trafficGreenPercent = config?.trafficGreenPercent || 0;
  
  // Route traffic based on percentage
  const useGreen = Math.random() * 100 < trafficGreenPercent;
  const deployment = useGreen ? config.green : config.blue;
  
  return Response.redirect(deployment);
}
```

## Deployment Checklist

### Pre-Deployment Verification
- [ ] Root `package.json` has `"packageManager": "pnpm@8.15.0"`
- [ ] No app-level `package.json` files contain `packageManager` field
- [ ] All workspace packages export TypeScript source files (not `dist/`)
- [ ] Each app's `next.config.js` includes `transpilePackages` array
- [ ] No `.next` directories are tracked in git
- [ ] Only `pnpm-lock.yaml` exists (no `package-lock.json` or `yarn.lock`)
- [ ] Root `vercel.json` uses `turbo-ignore` for change detection
- [ ] Each app has `vercel.json` with proper `ignoreCommand`

### Vercel Project Setup
- [ ] `rootDirectory` set to `"apps/[app-name]"` (no leading/trailing slashes)
- [ ] `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable set
- [ ] GitHub integration enabled for automatic deployments
- [ ] Correct build/install commands in `vercel.json`
- [ ] Consider disabling auto-promotion for sequential control

### Build Success Indicators
- ✅ "Detected ENABLE_EXPERIMENTAL_COREPACK=1 and \"pnpm@8.15.0\" in package.json"
- ✅ "Detected `pnpm-lock.yaml` version 6 generated by pnpm@8.x"
- ✅ No "Module not found: Can't resolve '@ganger/*'" errors
- ✅ Build completes with "READY" state
- ✅ "Skipping build" messages for unchanged apps

## Successfully Deployed Apps
1. **inventory** - Medical supply tracking
2. **handouts** - Patient education materials  
3. **eos-l10** - Team management
4. **call-center-ops** - Call management
5. **integration-status** - Integration monitoring
6. **llm-demo** - AI demo application
7. **medication-auth** - Prior authorization
8. **ai-receptionist** - AI phone agent
9. **batch-closeout** - Financial processing
10. **checkin-kiosk** - Patient check-in
11. **component-showcase** - UI library

## Remaining Apps to Deploy
Using the proven configuration above:
1. clinical-staffing
2. compliance-training
3. config-dashboard
4. deployment-helper
5. pharma-scheduling
6. platform-dashboard
7. socials-reviews
8. staff

## Key Insights

1. **pnpm Detection Works**: With `packageManager` in root only and `ENABLE_EXPERIMENTAL_COREPACK=1`, Vercel correctly detects pnpm.

2. **Source Files Required**: Next.js `transpilePackages` needs access to TypeScript source files, not compiled JavaScript.

3. **Git Integration Critical**: Projects created via Vercel UI have better default handling than API-created projects.

4. **Module Resolution**: The combination of `transpilePackages` + source file exports solves the workspace dependency resolution.

5. **Change Detection**: `turbo-ignore` prevents unnecessary rebuilds, saving time and resources.

6. **Sequential Control**: Manual promotion or CI/CD workflows enable controlled, ordered deployments.

## Troubleshooting

### "Module not found" errors
- Verify workspace package exports point to `.ts` files
- Check `transpilePackages` includes all `@ganger/*` dependencies
- Ensure packages are listed in app's `package.json` dependencies

### "No Next.js version detected"  
- Confirm `next` is in app's dependencies
- Check `rootDirectory` is correctly set
- Verify no path double-nesting issues

### Build hangs or times out
- Check for circular dependencies
- Verify all workspace packages build successfully locally
- Monitor Vercel's build queue status

### All apps rebuilding unnecessarily
- Verify root `vercel.json` has `"ignoreCommand": "npx turbo-ignore"`
- Check each app's `vercel.json` includes app-specific `ignoreCommand`
- Ensure `turbo.json` properly defines task dependencies

### Command length errors
- Use `build:packages` script to shorten commands
- Keep commands under 256 characters

## Expert Validation
This approach has been validated by Vercel deployment experts as the correct solution for Next.js monorepos using pnpm workspaces. The key insight is that `transpilePackages` requires access to source TypeScript files rather than pre-compiled distributions.

## Advanced References
- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Turborepo with Vercel](https://turbo.build/repo/docs/guides/deploy-to-vercel)
- [Progressive Delivery Strategies](https://vercel.com/docs/workflow-integrations/rolling-releases)
- [Blue-Green Deployments](https://vercel.com/docs/edge-network/headers#blue-green-deployments)

---

*Last Updated: January 29, 2025*
*Status: Production-ready deployment strategy with advanced optimization*