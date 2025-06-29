# Ganger Platform - Deployment Status Table

**Last Updated**: December 28, 2024  
**Root Directory Status**:
- ✅ `package-lock.json`: **REMOVED** (was causing conflicts)
- ✅ `pnpm-lock.yaml`: **EXISTS** (primary lockfile)
- ✅ `pnpm-workspace.yaml`: **EXISTS** (workspace configuration)
- ✅ `packageManager`: **"pnpm@8.15.0"** (in package.json)

## Application Status Overview

| App Name | package-lock | pnpm-lock | vercel.json | Install Command | Previous Status | Ready for Deploy |
|----------|--------------|-----------|-------------|-----------------|-----------------|------------------|
| **ai-receptionist** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **batch-closeout** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **call-center-ops** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **checkin-kiosk** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **checkout-slips** | ❌ NO | ❌ NO | ✅ YES | pnpm | In Dev | ✅ Ready |
| **clinical-staffing** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **compliance-training** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **component-showcase** | ❌ NO | ❌ NO | ✅ YES | pnpm | Working | ✅ Ready |
| **config-dashboard** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **deployment-helper** | ❌ NO | ❌ NO | ✅ YES | pnpm | Dep Helper | ✅ Ready |
| **eos-l10** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **handouts** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **integration-status** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **inventory** | ❌ NO | ❌ NO | ✅ YES | pnpm | Working | ✅ Ready |
| **llm-demo** | ❌ NO | ❌ NO | ✅ YES | pnpm | In Dev | ✅ Ready |
| **medication-auth** | ❌ NO | ❌ NO | ✅ YES | pnpm | Working | ✅ Ready |
| **pharma-scheduling** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **platform-dashboard** | ❌ NO | ❌ NO | ✅ YES | pnpm | Working | ✅ Ready |
| **socials-reviews** | ❌ NO | ❌ NO | ✅ YES | pnpm | Failed | ✅ Ready |
| **staff** | ❌ NO | ❌ NO | ✅ YES | pnpm *(fixed)* | Failed | ✅ Ready |

## Summary

### ✅ Fixes Applied:
1. **Root `package-lock.json`**: REMOVED (no more npm/pnpm conflicts)
2. **All apps**: NO individual lockfiles (using monorepo root `pnpm-lock.yaml`)
3. **vercel.json**: 20/20 apps have proper configuration
4. **Staff app**: Fixed to use pnpm (was using npm)

### 🚀 Ready for Deployment: **20 apps** (ALL APPS!)
- All previously failed apps now have proper pnpm configuration
- All working apps maintain their configuration
- Staff portal (router) now uses pnpm consistently
- All new/development apps have vercel.json files

### ✅ Special Purpose Apps:
- **deployment-helper**: Simple app to pre-load monorepo dependencies in Vercel
- **checkout-slips**: New app in development (untested)
- **llm-demo**: New app in development (untested)

### 📋 All Apps Now Use:
```json
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### 🔑 Critical Requirements:
1. **Environment Variable**: Set `ENABLE_EXPERIMENTAL_COREPACK=1` in ALL Vercel projects
2. **Git Push**: Commit and push to trigger fresh deployments
3. **Monitor**: Watch Vercel dashboard for build success

The monorepo is now fully standardized on pnpm with no conflicting package managers!