# Vercel Monorepo Deployment Solution & Checklist

## Current Situation Analysis

Your Ganger Platform monorepo has a mixed package manager configuration that's causing deployment failures:

1. **Mixed Package Managers**: You have both `pnpm-lock.yaml` and `package-lock.json` in the root
2. **Package Manager Declaration**: `package.json` specifies `"packageManager": "pnpm@8.15.0"`
3. **Vercel Detection**: Vercel auto-detects pnpm from the lockfile but some apps are configured for npm
4. **Workspace Protocol**: Apps use `workspace:*` dependencies which npm doesn't support but pnpm does

## Root Cause

The primary issue is package manager inconsistency. Vercel detects pnpm from `pnpm-lock.yaml` but:
- Some apps may still be configured to use npm
- Having both lockfiles causes confusion
- The `workspace:*` protocol requires pnpm or needs conversion to `file:` paths for npm

## Solution: Standardize on PNPM

Since you already have pnpm configuration partially set up and it supports `workspace:*` protocol natively, the cleanest solution is to complete the pnpm migration.

## Deployment Checklist

### Phase 1: Clean Up Package Manager Conflicts

1. **Remove npm artifacts**
   ```bash
   rm -f package-lock.json
   rm -rf node_modules
   find . -name "node_modules" -type d -prune -exec rm -rf {} +
   ```

2. **Ensure pnpm-lock.yaml is up to date**
   ```bash
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "fix: update pnpm lockfile"
   ```

### Phase 2: Verify Vercel Configuration

3. **Check root vercel.json**
   - The root `vercel.json` should not interfere with monorepo deployments
   - Current content (`ignoreCommand`) is fine

4. **Verify app-specific vercel.json files**
   Each app should have:
   ```json
   {
     "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
     "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
     "outputDirectory": ".next",
     "framework": "nextjs"
   }
   ```

5. **Apps missing vercel.json** (need to create):
   - apps/handouts
   - apps/integration-status
   - apps/inventory
   - apps/medication-auth
   - apps/platform-dashboard
   - apps/staff
   - apps/component-showcase

### Phase 3: Environment Variables

6. **Set Corepack environment variable for ALL projects**
   ```bash
   ENABLE_EXPERIMENTAL_COREPACK=1
   ```
   This ensures Vercel uses the pnpm version specified in package.json

7. **Verify all required env vars are set in each Vercel project**
   - Database URLs
   - Supabase keys
   - Google OAuth credentials
   - Any app-specific variables

### Phase 4: Fix Any Remaining Issues

8. **For apps still using workspace:* in packages/**
   Check if any shared packages still have workspace:* dependencies:
   ```bash
   grep -r "workspace:\*" packages/*/package.json
   ```
   If found, these need to be in the pnpm workspace or converted to file: paths

9. **Ensure pnpm-workspace.yaml is correct**
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

### Phase 5: Deploy

10. **Trigger fresh deployments**
    ```bash
    git add .
    git commit -m "fix: complete pnpm migration for Vercel deployments"
    git push origin main
    ```

11. **Monitor deployments**
    - Check Vercel dashboard for build progress
    - Look for pnpm being used in build logs
    - Verify NODE_ENV=development during install

### Phase 6: Post-Deployment

12. **Update staff portal routing** (if needed)
    Once all apps deploy successfully, update the staff portal's vercel.json rewrites with new deployment URLs

13. **Test deployed apps**
    - Direct app URLs should work
    - Staff portal routing should proxy correctly
    - Authentication should function

## Quick Fix Script

Create and run this script to automate the fixes:

```bash
#!/bin/bash
# fix-vercel-deployments.sh

echo "🔧 Fixing Vercel Deployments..."

# 1. Clean npm artifacts
echo "📦 Cleaning npm artifacts..."
rm -f package-lock.json
find . -name "node_modules" -type d -prune -exec rm -rf {} +

# 2. Reinstall with pnpm
echo "📦 Installing dependencies with pnpm..."
pnpm install

# 3. Create missing vercel.json files
echo "📝 Creating missing vercel.json files..."

APPS_NEEDING_VERCEL_JSON=(
  "handouts"
  "integration-status"
  "inventory"
  "medication-auth"
  "platform-dashboard"
  "staff"
  "component-showcase"
)

for app in "${APPS_NEEDING_VERCEL_JSON[@]}"; do
  if [ ! -f "apps/$app/vercel.json" ]; then
    echo "Creating vercel.json for $app..."
    cat > "apps/$app/vercel.json" << EOF
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm -F @ganger/$app build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
EOF
  fi
done

# 4. Commit changes
echo "💾 Committing changes..."
git add .
git commit -m "fix: complete pnpm migration and add missing vercel.json files"

echo "✅ Done! Push to trigger deployments: git push origin main"
```

## Expected Results

After following this checklist:
1. All 17 apps should deploy successfully
2. Build logs should show pnpm being used
3. No more "workspace:*" errors
4. Consistent package manager usage across the monorepo

## If Issues Persist

1. **Check build logs** for specific errors
2. **Verify project settings** in Vercel dashboard
3. **Ensure GitHub integration** is properly connected
4. **Consider recreating problematic projects** through Vercel UI as last resort

## Success Metrics

- ✅ All apps show "Ready" status in Vercel
- ✅ No package manager conflicts in logs
- ✅ Apps accessible via their deployment URLs
- ✅ Staff portal routing works correctly