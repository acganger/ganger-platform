# Vercel Deployment - Next Steps

## ✅ Completed Actions

1. **Removed npm artifacts**
   - Deleted `package-lock.json` 
   - Cleaned node_modules directories

2. **Standardized on pnpm**
   - Updated `pnpm-lock.yaml` with all dependencies
   - Verified `pnpm-workspace.yaml` configuration

3. **Created missing vercel.json files for 6 apps:**
   - `apps/handouts/vercel.json`
   - `apps/integration-status/vercel.json`
   - `apps/inventory/vercel.json`
   - `apps/medication-auth/vercel.json`
   - `apps/platform-dashboard/vercel.json`
   - `apps/component-showcase/vercel.json`

## 🚀 Next Steps

### 1. Commit and Push Changes
```bash
# Add deployment-related changes only
git add pnpm-lock.yaml
git add apps/*/vercel.json
git add -f package-lock.json  # Force add the deletion
git commit -m "fix: standardize on pnpm for Vercel deployments

- Remove package-lock.json to avoid package manager conflicts
- Add vercel.json configs for 6 missing apps
- Update pnpm-lock.yaml with fresh install
- All apps now use consistent pnpm commands"

git push origin main
```

### 2. Ensure Vercel Environment Variables

**CRITICAL**: Each Vercel project needs this environment variable:
```
ENABLE_EXPERIMENTAL_COREPACK=1
```

This enables Vercel to use the pnpm version specified in package.json (8.15.0).

### 3. Monitor Deployments

After pushing, monitor the Vercel dashboard for:
- All 17 apps should trigger new deployments
- Build logs should show: "Using pnpm"
- No more "workspace:*" errors
- No more package manager conflicts

### 4. Apps to Watch Closely

These apps previously had issues and should be monitored:
- **staff** - Main router app (highest priority)
- **batch-closeout**
- **eos-l10**
- **handouts**
- **integration-status**
- **pharma-scheduling**
- **socials-reviews**

### 5. Verify Successful Deployments

Once deployed, check:
1. Direct app URLs work (e.g., `https://ganger-inventory-ganger.vercel.app`)
2. Staff portal routing works (`https://staff.gangerdermatology.com/[app]`)
3. Authentication flows properly
4. No console errors

## 📋 Summary

Your monorepo is now standardized on pnpm with proper Vercel configuration for all apps. The key fixes were:

1. **Package Manager Consistency**: Removed npm lockfile, keeping only pnpm
2. **Complete Configuration**: All apps now have vercel.json with pnpm commands
3. **Workspace Support**: pnpm natively supports workspace:* protocol

The deployment should succeed after pushing these changes and ensuring the Corepack environment variable is set in all Vercel projects.