# 🚀 Ganger Platform - Deployment Guide

> **UPDATED**: Streamlined deployment process with direct content serving for maximum reliability.

## ⚠️ DEPLOYMENT ARCHITECTURE

**✅ PROVEN APPROACH**: Direct content serving in platform Worker  
**✅ FALLBACK**: Individual Cloudflare Workers for complex apps  
**❌ DEPRECATED**: Cloudflare Pages (sunset), External Worker proxying (DNS issues)

## 🔧 Quick Deployment Commands

### Deploy Platform Worker (Primary Method)
```bash
cd cloudflare-workers
npx wrangler deploy --env production
```

### Deploy Individual App Workers (Secondary Method)
```bash
cd apps/[app-name]
npx wrangler deploy --env production
```

### Check Deployment Status
```bash
npx wrangler deployments list
```

### Trigger GitHub Actions Deployment
```bash
gh workflow run deploy-platform-worker.yml
```

## 📁 Deployment Methods

### Method 1: Direct Content in Platform Worker (RECOMMENDED)
**For simple apps that don't require complex functionality:**

1. **Add content directly to `staff-router.js`**:
```javascript
if (pathname === '/your-app') {
  return new Response(`<!DOCTYPE html>...`, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

2. **Deploy platform Worker**:
```bash
cd cloudflare-workers
npx wrangler deploy --env production
```

**Pros**: Instant deployment, no DNS issues, maximum reliability  
**Cons**: Limited to static content with embedded JavaScript

### Method 2: R2 Static Asset Workers (FOR COMPLEX NEXT.JS APPS)
**✅ PROVEN: Handouts, Inventory, L10 Apps Successfully Deployed**

**For Next.js applications requiring full static export with R2 asset storage:**

1. **Create `wrangler.toml` with R2 binding**:
```toml
name = "ganger-app-name-prod"
compatibility_date = "2024-12-13"
main = "worker.js"

[env.production]
name = "ganger-app-name-production"
account_id = "68d0160c9915efebbbecfddfd48cddab"

# R2 bucket for static assets
[[env.production.r2_buckets]]
binding = "STATIC_ASSETS"
bucket_name = "ganger-app-name-assets"
preview_bucket_name = "ganger-app-name-assets"

[env.production.vars]
ENVIRONMENT = "production"
APP_NAME = "app-name"
```

2. **Create R2-compatible worker**:
```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Strip app prefix if routed through staff-router
    if (pathname.startsWith('/app-name/')) {
      pathname = pathname.slice(10); // Remove '/app-name'
    }

    // Handle Next.js routing
    if (pathname === '/') pathname = '/index.html';
    
    const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const object = await env.STATIC_ASSETS.get(key);
    
    if (object === null) {
      // 404 for static assets, fallback for pages
      if (key.includes('/_next/') || key.includes('.js') || key.includes('.css')) {
        return new Response(`Static asset not found: ${key}`, { status: 404 });
      }
      // SPA fallback
      const indexObject = await env.STATIC_ASSETS.get('index.html');
      return new Response(indexObject.body, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Serve file with correct content-type
    const headers = new Headers();
    if (key.endsWith('.js')) headers.set('Content-Type', 'application/javascript');
    else if (key.endsWith('.css')) headers.set('Content-Type', 'text/css');
    else if (key.endsWith('.html')) headers.set('Content-Type', 'text/html');
    
    return new Response(object.body, { headers });
  }
};
```

3. **Create upload script (`upload-assets.js`)**:
```javascript
const cmd = `npx wrangler r2 object put ganger-app-name-assets/${file.key} --file="${tempFile}" --content-type="${contentType}" --remote`;
execSync(cmd, { 
  env: { 
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID 
  }
});
```

4. **Deploy process**:
```bash
# Build app (must have output: 'export' in next.config.js)
cd apps/your-app && npm run build

# Upload assets to R2
cd workers/your-app-static
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
export CLOUDFLARE_ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"
node upload-assets.js

# Deploy worker
npx wrangler deploy --env production
```

5. **Update staff-router.js**:
```javascript
const WORKER_ROUTES = {
  '/your-app': 'ganger-your-app-production.michiganger.workers.dev'
};
```

### Method 3: GitHub Actions (AUTOMATED)
**For CI/CD pipeline deployments:**

```yaml
- name: Deploy Worker
  run: |
    cd cloudflare-workers  # For platform Worker
    # OR cd apps/your-app   # For individual Worker
    npx wrangler deploy --env production
```

## 🌐 Domain Configuration

### ✅ WORKING DOMAIN STRUCTURE:
- **staff.gangerdermatology.com** → Main portal with path-based routing
- **reps.gangerdermatology.com** → Pharmaceutical representative portal  
- **kiosk.gangerdermatology.com** → Check-in kiosk system

### ✅ PATH-BASED ROUTING (Under staff.gangerdermatology.com):
**Working Applications:**
- `/status` → Integration status dashboard ✅ Live
- `/meds` → Medication authorization ✅ Live
- `/batch` → Batch closeout system ✅ Live  
- `/reps` → Rep scheduling system ✅ Live

**Ready for Activation (Professional coming soon pages):**
- `/inventory` → Inventory management ✅ Ready
- `/handouts` → Patient handouts ✅ Ready
- `/l10` → EOS L10 system ✅ Ready
- `/compliance` → Compliance training ✅ Ready
- `/phones` → Call center ops ✅ Ready
- `/config` → Config dashboard ✅ Ready
- `/social` → Social media & reviews ✅ Ready
- `/pepe` → AI receptionist ✅ Ready
- `/staffing` → Clinical staffing ✅ Ready
- `/dashboard` → Platform dashboard ✅ Ready

### Domain Routing Configuration:
1. **Cloudflare Zone**: `ba76d3d3f41251c49f0365421bd644a5` 
2. **DNS**: Managed by Cloudflare
3. **Platform Worker**: Handles all staff.gangerdermatology.com routing
4. **Routes**: Configured in `cloudflare-workers/wrangler.toml`

## 🔑 Required Secrets (GitHub)

```
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf
CLOUDFLARE_ACCOUNT_ID=[Your Account ID]
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=[Your Supabase Key]
UNIFI_SITE_MANAGER_API_KEY=X9HOYp_hBGvczT-f7Yt3xzkbeZ_eiSmi
UNIFI_ANN_ARBOR_API_KEY=xuqjItbqzMJzJcM8TC9SmS2MdbBXJGN2
UNIFI_PLYMOUTH_API_KEY=dfefdZNMxjoLydgyYkO7BZV-O-FKOnXP
UNIFI_WIXOM_API_KEY=uRu3Bgtq6aJ61ijIzFvY0S2U_ZLhIjph
UNIFI_HOST=192.168.1.1
UNIFI_USERNAME=anand@gangerdermatology.com
UNIFI_PASSWORD=ganger7072
UNIFI_PORT=443
UNIFI_SITE=default
UNIFI_VERIFY_SSL=false
```

## 🛠️ CI/CD Pipeline

### Working Workflow: `.github/workflows/deploy-medication-auth-simple.yml`
- ✅ Uses pnpm (NOT npm)
- ✅ Builds with Next.js
- ✅ Deploys to Workers
- ✅ Configures custom domain routing

### Build Process:
1. `pnpm install` - Install dependencies
2. `pnpm run build` - Build application
3. `wrangler deploy` - Deploy to Workers

## 🚨 Common Deployment Mistakes

### ❌ DON'T DO THIS:
```bash
# External Worker proxying (DNS ERRORS)
'/app': 'external-worker.workers.dev'

# Pages deployment (DEPRECATED)
npx wrangler pages deploy dist --project-name app-name

# Complex R2 + Worker setup for simple apps
[[r2_buckets]]
binding = "ASSETS"
```

### ✅ DO THIS INSTEAD:
```bash
# Direct content serving (RELIABLE)
if (pathname === '/app') {
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

# Platform Worker deployment (PROVEN)
cd cloudflare-workers && npx wrangler deploy --env production

# Simple Worker configs (NO R2 unless needed)
name = "ganger-app"
main = "worker-simple.js"
```

## 📱 Application Types

### Static Apps (Simple Workers)
- **Example**: medication-auth
- **Worker**: Self-contained HTML + API endpoints
- **Pros**: Fast, simple, no external dependencies
- **Use For**: Landing pages, simple apps

### Dynamic Apps (Workers + R2)
- **Worker**: Serves from R2 bucket
- **Static Assets**: Uploaded to R2
- **Pros**: Full Next.js app support
- **Use For**: Complex applications

## 🔍 Debugging Deployments

### Check Worker Status:
```bash
npx wrangler deployments list
npx wrangler tail [worker-name]
```

### Test Endpoints:
```bash
curl https://your-app.workers.dev/api/health
```

### Common Issues:

#### R2 Deployment Issues:
1. **"Static asset not found"** = Assets not uploaded to R2 or missing `--remote` flag
   ```bash
   # Fix: Re-upload with correct credentials and --remote flag
   export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
   export CLOUDFLARE_ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"
   node upload-assets.js
   ```

2. **Loading spinner stuck** = JavaScript files not loading, check R2 bucket contents
   ```bash
   # Check bucket contents
   curl -H "Authorization: Bearer TOKEN" "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/r2/buckets/BUCKET_NAME/objects"
   ```

3. **Worker can't access R2** = R2 binding missing in wrangler.toml or worker not deployed after bucket setup
   ```bash
   # Fix: Redeploy worker after R2 bucket configuration
   npx wrangler deploy --env production
   ```

#### General Issues:
4. **"Project not found"** = Using Pages instead of Workers
5. **"Must specify project name"** = Wrong wrangler command
6. **"Build failed"** = Missing environment variables
7. **DNS issues** = Wait 24-48h for propagation

## 🎯 Working Examples

### **Platform Worker (PROVEN BEST PRACTICE)**:
- ✅ **staff.gangerdermatology.com** - Main portal with 5 working apps
- ✅ **Direct content serving** - Zero DNS errors, instant deployment
- ✅ **Professional medical UI** - Consistent Ganger Dermatology branding
- ✅ **Path-based routing** - Clean URLs, intuitive navigation
- ✅ **Mobile responsive** - Works perfectly on all devices

### **Working Applications (Live in Production)**:
- ✅ **L10 Management** (`/l10`) - EOS Level 10 meetings platform (R2 deployment)
- ✅ **Patient Handouts** (`/handouts`) - Digital handout generation system (R2 deployment) 
- ✅ **Inventory Management** (`/inventory`) - Medical supply tracking with barcode scanning (R2 deployment)
- ✅ **Integration Status** (`/status`) - System monitoring dashboard
- ✅ **Medication Authorization** (`/meds`) - Prior authorization system
- ✅ **Batch Closeout** (`/batch`) - Financial reconciliation
- ✅ **Rep Scheduling** (`/reps`) - Pharmaceutical scheduling
- ✅ **Staff Portal** (`/`) - Professional app directory

### **Ready for Activation (11 Apps)**:
- ✅ **All Worker configs created** - Complete wrangler.toml + worker-simple.js
- ✅ **All deployment workflows ready** - GitHub Actions CI/CD configured
- ✅ **Professional content prepared** - Medical-appropriate branding
- ✅ **Can be activated instantly** - Add to staff router direct content

## 📋 Quick Start Checklist

1. **For new simple apps**: Add content to `staff-router.js` 
2. **For complex apps**: Create individual Worker
3. **Deploy**: `cd cloudflare-workers && npx wrangler deploy --env production`
4. **Verify**: Check `https://staff.gangerdermatology.com/[your-app]`
5. **Test**: Use verification checklist in `/deployments`

## 🎨 **MAKING CHANGES - EFFICIENT UPDATE SYSTEM**

### **🚀 Key Advantage: Single Deployment Updates ALL 16 Apps**

Since all applications use **direct content serving** in one platform Worker, you can update themes, content, or features for all applications with **ONE deployment** instead of 16 separate deployments.

### **⚡ Common Change Scenarios**

#### **Scenario 1: Change Individual App Theme (30 seconds)**
```bash
# Change one app's theme
node scripts/update-theme.js --app=inventory --theme=medical-blue

# Deploy changes to all apps
./scripts/quick-deploy.sh

# ✅ Done! Live in 30 seconds
```

#### **Scenario 2: Change All App Themes (30 seconds)**
```bash
# Update entire platform color scheme
node scripts/update-theme.js --all --theme=medical-purple

# Single deployment affects all 16 apps
./scripts/quick-deploy.sh

# ✅ All apps updated simultaneously!
```

#### **Scenario 3: Content/Feature Updates (30 seconds)**
```bash
# Edit any content in cloudflare-workers/staff-router.js
# Examples: feature lists, descriptions, navigation, styling

# Deploy everything at once
./scripts/quick-deploy.sh

# ✅ All 16 applications updated together!
```

#### **Scenario 4: Zero-Effort Auto Deployment (2 minutes)**
```bash
# Make any changes to platform content
git add . && git commit -m "Update platform" && git push origin main

# ✅ GitHub Actions auto-deploys, no manual commands needed!
```

### **🎨 Available Themes**

Pre-configured medical-appropriate themes:
- `medical-blue` - Professional blue (primary healthcare)
- `medical-green` - Medical green (growth/health)  
- `medical-purple` - Healthcare purple (calming)
- `medical-teal` - Medical teal (trust/stability)
- `professional-gray` - Business gray (neutral/professional)

### **📱 Theme Update Commands**

```bash
# List all available themes and apps
node scripts/update-theme.js --list-themes

# Update specific application
node scripts/update-theme.js --app=inventory --theme=medical-green
node scripts/update-theme.js --app=compliance --theme=professional-gray

# Update entire platform
node scripts/update-theme.js --all --theme=medical-blue

# Quick deployment (works with any change)
./scripts/quick-deploy.sh
```

### **⚡ What Requires Different Deployment Types**

#### **✅ SINGLE DEPLOYMENT (30 seconds) - Affects All 16 Apps**
- Theme colors and gradients
- Text content and descriptions
- Feature lists and navigation
- Layout and styling changes
- Homepage modifications
- Application status updates

#### **✅ NO DEPLOYMENT NEEDED**
- Documentation updates (`/docs`, `README.md`)
- Comments in code
- Deployment guides

#### **⚠️ INDIVIDUAL APP DEPLOYMENTS (Only if using Worker method)**
- Database integrations requiring Worker configs
- Complex third-party API connections
- Advanced form processing with server logic

### **🛠️ Change Management Best Practices**

#### **For Quick Changes:**
1. Use the automated scripts (`update-theme.js`, `quick-deploy.sh`)
2. Test changes locally if needed
3. Single deployment updates everything
4. Verify 2-3 applications to confirm changes

#### **For Major Updates:**
1. Make changes to `cloudflare-workers/staff-router.js`
2. Use `./scripts/quick-deploy.sh` for immediate deployment
3. Or commit/push for automated GitHub Actions deployment
4. Run verification checklist from `/deployments`

#### **Rollback Process:**
```bash
# Quick rollback to previous version
git revert HEAD
git push origin main
# ✅ Auto-deploys previous version in 2 minutes
```

### **📊 Efficiency Comparison**

**❌ Traditional Approach:**
- 16 separate app deployments
- 16 different configurations to manage
- 20-30 minutes for platform-wide changes
- Complex coordination between apps

**✅ Ganger Platform Approach:**
- 1 deployment updates all 16 apps
- 1 configuration file to manage
- 30 seconds for platform-wide changes  
- Guaranteed consistency across all apps

### **🎯 Example Workflow: Rebranding Platform**

```bash
# 1. Update all apps to new brand colors (10 seconds)
node scripts/update-theme.js --all --theme=medical-teal

# 2. Update any text/content in staff-router.js (2 minutes)
# Edit descriptions, titles, feature lists as needed

# 3. Deploy everything at once (30 seconds)
./scripts/quick-deploy.sh

# 4. Verify changes (1 minute)
# Check https://staff.gangerdermatology.com/
# Test 2-3 applications to confirm

# ✅ Total time: ~4 minutes for complete platform rebrand!
```

---

**Last Updated**: June 16, 2025 at 3:32 PM EST  
**Status**: ✅ **L10 APPLICATION FIXED** - JavaScript routing issue resolved with proper R2 upload  
**Achievement**: Proven R2 deployment pattern documented for complex Next.js applications  
**Working Deployments**: L10, Handouts, Inventory apps successfully deployed using R2 + Worker pattern  
**Pattern**: R2 static assets + Cloudflare Worker + Staff Router integration verified working