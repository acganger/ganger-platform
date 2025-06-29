# 🚀 Pre-Launch Checklist for Vercel Deployment

## ✅ Pre-Launch Review Results

### 1. **GitHub Actions Workflows** ✅
- **Created**: `vercel-deploy.yml` - Automated deployment on push to main
- **Created**: `deploy-single-app.yml` - Manual single app deployment
- **Fixed**: Build commands now use correct paths (`cd apps/[app] && pnpm build`)
- **Archived**: 30+ old Cloudflare Workers workflows

### 2. **Deployment Scripts** ✅
- **Executable**: All scripts have correct permissions
- `remove-vercel-projects.sh` - Clean slate script
- `setup-vercel-projects.sh` - Project creation
- `setup-vercel-env.sh` - Environment configuration
- `setup-github-secrets.sh` - GitHub secrets automation
- `update-vercel-rewrites.js` - Staff portal routing
- `cleanup-cloudflare-artifacts.sh` - Remove old deployment files

### 3. **Environment Variables** ✅
- **Documented**: All required variables identified
- **Script Ready**: `setup-github-secrets.sh` automates adding to GitHub
- **Vercel Ready**: `setup-vercel-env.sh` configures all projects

### 4. **Build Configurations** ✅
- **Verified**: All apps have standard Next.js build scripts
- **No Special Config**: Apps use standard `next build` command
- **Monorepo Aware**: Dependencies handled by pnpm workspace

### 5. **Documentation** ✅
- **Created**: `/docs/VERCEL_DEPLOYMENT_GUIDE.md` - Complete guide
- **Updated**: `/true-docs` references aligned with Vercel strategy
- **Removed**: Deprecated notices and outdated references

### 6. **Cloudflare Cleanup** ⚠️
- **Found**: Legacy Cloudflare Workers artifacts in apps
- **Solution**: Run `./scripts/cleanup-cloudflare-artifacts.sh`
- **Impact**: Won't block deployment but should be cleaned

---

## 📋 Launch Steps (In Order)

### Step 1: Clean Up Legacy Files
```bash
# Remove Cloudflare Workers artifacts
./scripts/cleanup-cloudflare-artifacts.sh

# Commit the cleanup
git add -A
git commit -m "chore: remove Cloudflare Workers artifacts"
git push origin main
```

### Step 2: Remove Existing Vercel Projects
```bash
# Start with clean slate (removes 6 existing projects)
./scripts/remove-vercel-projects.sh
```

### Step 3: Create All Vercel Projects
```bash
# Creates 17 new projects with correct naming
./scripts/setup-vercel-projects-monorepo.sh

# This generates: vercel-project-ids.env
```

### Step 3.5: Link GitHub Repository ⚠️ NEW STEP
```bash
# Link GitHub repo to all Vercel projects (required for deployment)
./scripts/link-github-repo.sh
```

### Step 4: Configure GitHub Secrets
```bash
# Automated setup (requires GitHub CLI)
./scripts/setup-github-secrets.sh

# You'll need:
# - Vercel Token from https://vercel.com/account/tokens
# - Vercel Org ID from Vercel dashboard
```

### Step 5: Configure Environment Variables
```bash
# Sets all env vars for all 17 projects
./scripts/setup-vercel-env.sh
```

### Step 6: Test Deployment Pipeline
```bash
# Make a small test change
cd apps/component-showcase
echo "// Deployment test $(date)" >> src/app/page.tsx
git add .
git commit -m "test: vercel deployment automation"
git push origin main

# Watch GitHub Actions tab for deployment
```

### Step 7: Configure Custom Domains
In Vercel Dashboard, add domains:
- `staff.gangerdermatology.com` → ganger-staff
- `lunch.gangerdermatology.com` → ganger-pharma-scheduling  
- `kiosk.gangerdermatology.com` → ganger-checkin-kiosk

### Step 8: Update DNS (if needed)
In Cloudflare, ensure CNAME records point to:
- `cname.vercel-dns.com`

---

## ⚠️ Important Notes

### Build Times
- First deployment: ~5-10 minutes per app
- Subsequent deployments: ~1-2 minutes per app
- Total initial setup: ~2-3 hours for all 17 apps

### Environment Variables
- Each project needs ALL variables from .env
- Use production values, not development
- Sensitive values are encrypted by Vercel

### Monitoring
- Watch GitHub Actions for deployment status
- Check Vercel dashboard for build logs
- Verify each app loads after deployment

### Rollback Plan
- Vercel keeps all deployments
- Can instantly rollback in Vercel dashboard
- GitHub revert also triggers rollback

---

## 🎯 Success Criteria

1. ✅ All 17 apps deployed to individual Vercel projects
2. ✅ Staff portal routes correctly to all apps
3. ✅ Custom domains working
4. ✅ Authentication flows work across apps
5. ✅ Push to main triggers automatic deployment
6. ✅ Manual deployment workflow functional

---

## 🚨 If Something Goes Wrong

### Build Failures
- Check GitHub Actions logs
- Verify all dependencies installed
- Run build locally first

### Missing Secrets
- Re-run `setup-github-secrets.sh`
- Check GitHub Settings → Secrets
- Verify secret names match exactly

### Routing Issues
- Check staff/vercel.json has correct URLs
- Ensure apps are deployed first
- Run update-vercel-rewrites.js manually

### Domain Issues
- Verify DNS propagation (can take 48h)
- Check Vercel domain settings
- Ensure SSL certificates generated

---

## 📞 Post-Launch

1. **Monitor** first 24 hours closely
2. **Document** any issues encountered
3. **Update** scripts if improvements needed
4. **Train** team on new deployment process
5. **Celebrate** successful automation! 🎉

---

**Ready to Launch?** 
Start with Step 1 above. Total time: ~3 hours for complete setup.