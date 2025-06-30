# NPM to PNPM Migration Conflicts Report

## Summary
Found conflicts in 22 files that need to be updated to use pnpm instead of npm.

## Conflicts Found

### 1. Package.json Files with NPM Scripts (1 file)
- **apps/eos-l10/package.json**
  - Line 14: `"setup:l10": "npm run migrate:schema && npm run import:data"`
  - Should be: `"setup:l10": "pnpm run migrate:schema && pnpm run import:data"`

### 2. Vercel.json Files with NPM Commands (21 files)
These apps still use npm in their vercel.json build/install commands:

**Apps using old npm format:**
- apps/staff/vercel.json
- apps/socials-reviews/vercel.json
- apps/pharma-scheduling/vercel.json
- apps/medication-auth/vercel.json
- apps/llm-demo/vercel.json
- apps/inventory/vercel.json
- apps/integration-status/vercel.json
- apps/handouts/vercel.json
- apps/eos-l10/vercel.json
- apps/deployment-helper/vercel.json
- apps/config-dashboard/vercel.json
- apps/component-showcase/vercel.json
- apps/compliance-training/vercel.json
- apps/checkout-slips/vercel.json
- apps/checkin-kiosk/vercel.json
- apps/call-center-ops/vercel.json
- apps/batch-closeout/vercel.json
- apps/ai-receptionist/vercel.json
- apps/platform-dashboard/vercel.json

**Root vercel.json template:**
- apps/vercel.json (appears to be a template, has incomplete buildCommand)

### 3. JavaScript/TypeScript Files with NPM References (4 files)
These are utility scripts that reference npm:
- apps/inventory/upload-remote.js
- apps/inventory/upload-assets.js
- apps/checkin-kiosk/upload-r2-direct.js
- apps/eos-l10/migration/scripts/import-data.ts

### 4. README Files with NPM Commands (Multiple)
Many README.md files contain npm commands in their documentation.

## Proven PNPM Configuration Format

Based on the successfully deployed clinical-staffing app, the correct format is:

```json
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && pnpm -F @ganger/auth build && pnpm -F @ganger/ui build && pnpm -F @ganger/utils build && pnpm -F @ganger/config build",
  "buildCommand": "cd ../.. && pnpm -F @ganger/clinical-staffing build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

Key elements:
1. `cd ../..` to get to monorepo root
2. `NODE_ENV=development` for dev dependencies
3. `pnpm install --no-frozen-lockfile` for flexibility
4. Build required dependencies with `pnpm -F @ganger/[package] build`
5. Build the app with `pnpm -F @ganger/[app-name] build`

## Action Required

1. Update all vercel.json files to use the proven pnpm format
2. Fix the eos-l10 package.json script
3. Consider updating utility scripts to use pnpm (low priority)
4. Update documentation after deployment is working

## Apps Already Using Correct Format
- apps/clinical-staffing/vercel.json ✅ (proven working deployment)