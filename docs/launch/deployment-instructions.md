# 🚀 Ganger Platform - Deployment Instructions

## ✅ Ready for Deployment

**Successfully Built Applications:**
1. **Medication Authorization** (`apps/medication-auth`) - ✅ Next.js build complete
2. **Platform Dashboard** (`apps/platform-dashboard`) - ✅ Next.js build complete

## 📦 Deployment Options

### Option 1: Netlify Deployment (Recommended)

**For Medication Authorization:**
1. Open [Netlify Drop](https://app.netlify.com/drop)
2. Drag and drop the `/apps/medication-auth` folder
3. Once deployed, set custom domain: `meds.gangerdermatology.com`
4. Configure environment variables in Netlify dashboard (already in netlify.toml)

**For Platform Dashboard:**
1. Open [Netlify Drop](https://app.netlify.com/drop)  
2. Drag and drop the `/apps/platform-dashboard` folder
3. Once deployed, set custom domain: `dashboard.gangerdermatology.com`
4. Configure environment variables in Netlify dashboard (already in netlify.toml)

### Option 2: GitHub Actions Auto-Deployment

The GitHub Actions workflows are configured but need Vercel tokens. Once configured:
```bash
gh workflow run deploy-medication-auth.yml
```

### Option 3: Manual Vercel Deployment

```bash
cd apps/medication-auth
vercel --prod
# Set domain: meds.gangerdermatology.com

cd apps/platform-dashboard  
vercel --prod
# Set domain: dashboard.gangerdermatology.com
```

## 🔗 Update Cloudflare Worker Routing

Once apps are deployed, update the Cloudflare Worker to route to live URLs:

```javascript
// In cloudflare-workers/update-logo-worker.js
const deployedApps = {
  '/meds': 'https://meds.gangerdermatology.com',
  '/dashboard': 'https://dashboard.gangerdermatology.com',
  '/ai': 'https://ai-ganger.vercel.app'  // Already live
};
```

Deploy the updated Worker:
```bash
wrangler deploy cloudflare-workers/update-logo-worker.js
```

## 🌐 Domain Configuration

**Expected Live URLs:**
- `https://staff.gangerdermatology.com/meds` → Medication Authorization
- `https://staff.gangerdermatology.com/dashboard` → Platform Dashboard  
- `https://staff.gangerdermatology.com/ai` → AI Receptionist (already live)
- `https://staff.gangerdermatology.com/` → Main staff portal hub

**Alternative Direct Access:**
- `https://meds.gangerdermatology.com` → Direct medication auth access
- `https://dashboard.gangerdermatology.com` → Direct dashboard access

## 🔧 Post-Deployment Tasks

1. **Test Applications:**
   - Verify Supabase database connections
   - Test user authentication flows
   - Confirm API endpoints are working

2. **Update Documentation:**
   - Update live URLs in CLAUDE.md
   - Add deployment status to PROJECT_TRACKER.md
   - Update user guides with live links

3. **Monitor Performance:**
   - Check Cloudflare Analytics
   - Monitor Supabase usage
   - Verify SSL certificates are active

## 📊 Current Infrastructure Status

**✅ Working Infrastructure:**
- Cloudflare Worker routing: `https://staff.gangerdermatology.com/`
- Supabase database: `https://pfqtzmxxxhhsxmlddrta.supabase.co`
- Domain management: Cloudflare DNS
- SSL certificates: Auto-managed by Cloudflare

**🚧 Pending Applications:**
- inventory (Tailwind CSS issues)
- handouts (needs verification)
- clinical-staffing (needs verification)
- eos-l10 (babel-loader dependency issues)
- checkin-kiosk (needs verification)

## 🎯 Next Steps

1. Deploy the 2 ready applications to live URLs
2. Update Cloudflare Worker routing
3. Test end-to-end functionality
4. Fix remaining applications' build issues
5. Deploy additional applications as they become ready

**Estimated Time to Live Deployment:** 30 minutes

All infrastructure is ready - we just need to upload the built applications to hosting services and update the routing configuration.