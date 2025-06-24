# 🔍 Deployment Verification Checklist

## 🚨 Critical Pre-Check: Script Review Analysis

### Script Compatibility Assessment:
- **01-deploy-all-apps.sh**: ❌ **INCOMPATIBLE** - Uses old Vercel CLI approach
- **02-pre-deployment-check.js**: ✅ **SAFE** - Only validates, doesn't modify
- **03-update-staff-rewrites.js**: ⚠️ **NEEDS VERIFICATION** - May conflict with our setup
- **04-verify-deployment.sh**: ✅ **SAFE** - Only tests, doesn't modify
- **05-emergency-rollback.sh**: ✅ **SAFE** - Good to have ready

### Key Conflicts Found:
1. **Their deployment script** creates new projects each time (we already created them)
2. **Their script** uses hardcoded tokens (we have GitHub secrets configured)
3. **Their approach** deploys from temp directories (we have GitHub Actions)
4. **Path mismatch**: Scripts expect to run from `/true-docs/deployment/scripts/`

## ✅ What We've Already Completed

### 1. **Infrastructure Setup** ✅
- [x] Removed Cloudflare Workers artifacts (70+ files)
- [x] Created 17 Vercel projects with proper naming
- [x] Configured GitHub Secrets (tokens + project IDs)
- [x] Set environment variables for all projects
- [x] GitHub Actions workflows created

**Verification Method 1**: Check Vercel Dashboard
```bash
# All 17 projects should exist:
ganger-inventory, ganger-handouts, ganger-eos-l10, etc.
```

**Verification Method 2**: Check GitHub Secrets
```bash
gh secret list
# Should show: VERCEL_TOKEN, VERCEL_ORG_ID, all project IDs
```

### 2. **Automation Setup** ✅
- [x] Created `vercel-deploy.yml` workflow
- [x] Created `deploy-single-app.yml` for manual deploys
- [x] Test deployment triggered for component-showcase

**Verification**: Check GitHub Actions
- URL: https://github.com/acganger/ganger-platform/actions
- Should show workflow runs

## 🔄 Current Status

### What's Happening Now:
1. **GitHub Actions** deployment in progress - Fixed issues:
   - ✅ Removed git submodule error (legacy-a2hosting-apps/staff)
   - ✅ Fixed pnpm lockfile mismatch in compliance-training
   - ✅ Fixed GitHub push protection (removed claude_desktop_config files)
   - ✅ Fixed build commands to use turbo filter
   - ⏳ Testing compliance-training deployment
2. **Documentation Updates Completed**:
   - ✅ Removed hardcoded tokens from 01-deploy-all-apps.sh
   - ✅ Removed temp directory usage
   - ✅ Updated script to use GitHub secrets
   - ✅ Added warning that script is INCOMPATIBLE with our setup
3. **Current Issue**: Build compilation error in compliance-training
   - Error: `TypeError: n.createContext is not a function`
   - Likely edge runtime compatibility issue

### How to Verify Current Deployment:
```bash
# Check GitHub Actions status
# URL: https://github.com/acganger/ganger-platform/actions

# Check latest run
gh run list --limit=5

# View specific run details
gh run view [run-id] --log-failed
```

## 📋 Next Steps Verification Checklist

### Step 1: Verify Test Deployment ⏳
Before proceeding, confirm:
- [ ] GitHub Actions workflow completed successfully
- [ ] Vercel shows successful deployment
- [ ] Component showcase is accessible at deployment URL
- [ ] No build errors in logs

**Verification Commands**:
```bash
# Get deployment URL from Vercel
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/ganger-component-showcase/deployments?teamId=$VERCEL_TEAM_ID&limit=1"

# Test the deployment
curl -I <deployment-url>
```

### Step 2: Pre-Deployment Validation 🔍
**SAFE TO RUN** - Only checks, no modifications:
```bash
cd /mnt/q/Projects/ganger-platform
node true-docs/deployment/scripts/02-pre-deployment-check.js
```

**Expected Issues to Fix**:
- [ ] Remove any console.log statements
- [ ] Remove localhost references
- [ ] Remove demo/test files
- [ ] Fix TypeScript errors (if any)

### Step 3: Deploy Remaining Apps 🚀
**DO NOT** use their `01-deploy-all-apps.sh` script!

**Instead, use our GitHub Actions**:
1. Make a small change to each app
2. Commit and push
3. Let GitHub Actions handle deployment

**OR** use manual deployment:
```bash
# Deploy one app at a time
gh workflow run deploy-single-app.yml -f app=inventory
gh workflow run deploy-single-app.yml -f app=handouts
# ... etc
```

### Step 4: Update Staff Portal Routes 🔄
After all apps are deployed:

**First, collect all deployment URLs**:
```bash
# Create deployment-urls.json manually by checking each Vercel project
# OR extract from GitHub Actions logs
```

**Then update staff router**:
```bash
# This updates apps/staff/vercel.json with routes
node scripts/update-vercel-rewrites.js
```

**Verify before deploying**:
```bash
# Check the generated vercel.json
cat apps/staff/vercel.json
```

### Step 5: Deploy Staff Portal (Critical!) 🎯
**This makes everything LIVE!**
```bash
# Deploy staff portal through GitHub Actions
gh workflow run deploy-single-app.yml -f app=staff
```

### Step 6: Post-Deployment Verification ✅
Run comprehensive tests:
```bash
# Use their verification script (safe to run)
./true-docs/deployment/scripts/04-verify-deployment.sh
```

**Manual Verification**:
- [ ] Access https://staff.gangerdermatology.com
- [ ] Test each app route (/inventory, /handouts, etc.)
- [ ] Check authentication flow
- [ ] Verify cross-app navigation
- [ ] Check browser console for errors

### Step 7: Configure Custom Domains 🌐
In Vercel Dashboard:
- [ ] Add `staff.gangerdermatology.com` to ganger-staff
- [ ] Add `lunch.gangerdermatology.com` to ganger-pharma-scheduling
- [ ] Add `kiosk.gangerdermatology.com` to ganger-checkin-kiosk

### Step 8: Monitor First 24 Hours 📊
- [ ] Check Vercel Analytics for errors
- [ ] Monitor GitHub Actions for failed deployments
- [ ] Test critical user flows
- [ ] Check performance metrics

## 🚨 Emergency Procedures

### If Something Goes Wrong:
1. **Stop all deployments immediately**
2. **Check error logs in**:
   - GitHub Actions logs
   - Vercel deployment logs
   - Browser console
3. **Use rollback if needed**:
   ```bash
   ./true-docs/deployment/scripts/05-emergency-rollback.sh
   ```

### Common Issues & Solutions:

**Build Failures**:
- Check package.json dependencies
- Verify environment variables
- Check TypeScript errors

**Routing Not Working**:
- Verify staff/vercel.json has correct URLs
- Check if apps deployed successfully first
- Ensure no basePath conflicts

**Authentication Issues**:
- Verify Google OAuth credentials
- Check NEXTAUTH_URL matches deployment
- Ensure cookies domain is correct

## 📊 Success Criteria

### Deployment is successful when:
1. ✅ All 17 apps deployed to Vercel
2. ✅ Staff portal routes to all apps correctly
3. ✅ Authentication works across apps
4. ✅ No console errors in browser
5. ✅ Custom domains configured and working
6. ✅ All verification tests pass

## ⏰ Timeline Estimate

Based on our setup:
- **Test deployment verification**: 10 minutes
- **Pre-deployment fixes**: 30-60 minutes
- **Deploy all apps**: 1-2 hours (via GitHub Actions)
- **Staff portal configuration**: 30 minutes
- **Verification & testing**: 30 minutes
- **Domain configuration**: 30 minutes

**Total**: 3-4 hours (less than their estimate!)

## 🎯 Final Reminders

1. **DO NOT RUSH** - Better to go slow and verify each step
2. **VERIFY TWICE** - Use both automated and manual checks
3. **DOCUMENT ISSUES** - Keep notes of any problems
4. **HAVE ROLLBACK READY** - Know how to undo if needed

---

**Current Step**: Troubleshooting Vercel deployment errors
**Fixes Applied**: 
- ✅ Removed edge runtime from all apps
- ✅ Fixed GitHub Actions workflow_dispatch syntax error
- ✅ Fixed project ID secret mapping with shell script
- ✅ Updated deployment scripts (removed tokens & temp dirs)
- ✅ Builds complete successfully locally

**Current Issue**: 
- Vercel deployment starts but fails with "Unexpected error"
- Deployment URL created: https://ganger-component-showcase-jfda95eqy-ganger.vercel.app
- Build begins but encounters unknown error

**Next Actions**:
1. Check Vercel dashboard for error details
2. Verify project settings and permissions
3. Try manual Vercel CLI deployment
4. Consider creating fresh Vercel project

**Risk Level**: Low (infrastructure ready, just deployment config issue)