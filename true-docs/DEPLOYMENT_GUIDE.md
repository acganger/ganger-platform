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

### Method 2: Individual Workers (FOR COMPLEX APPS)
**For apps requiring server-side processing, databases, or advanced features:**

1. **Create `wrangler.toml`**:
```toml
name = "ganger-app-name"
main = "worker-simple.js"
compatibility_date = "2024-06-12"
# No direct routes - handled by staff-router
```

2. **Create `worker-simple.js`**:
```javascript
export default {
  async fetch(request, env, ctx) {
    // App logic here
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }
};
```

3. **Update staff-router.js to proxy**:
```javascript
const workingRoutes = {
  '/your-app': 'ganger-your-app-prod.workers.dev'
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
- `/status` → Integration status dashboard ✅ Working
- `/meds` → Medication authorization ✅ Working  
- `/inventory` → Coming soon page ✅ Working
- `/handouts` → Coming soon page ✅ Working
- `/l10` → Coming soon page ✅ Working
- And 8 more apps with coming soon pages

### Domain Routing Configuration:
1. **Cloudflare Zone**: `ba76d3d3f41251c49f0365421bd644a5` 
2. **DNS**: Managed by Cloudflare
3. **Platform Worker**: Handles all staff.gangerdermatology.com routing
4. **Routes**: Configured in `cloudflare-workers/wrangler.toml`

## 🔑 Required Secrets (GitHub)

```
CLOUDFLARE_API_TOKEN=CNJuDfW4xVxdeNfcNToaqtwKjtqRdQLxF7DvcKuj
CLOUDFLARE_ACCOUNT_ID=[Your Account ID]
SUPABASE_URL=https://pfqtzmxxxhhsxmlddrta.supabase.co
SUPABASE_ANON_KEY=[Your Supabase Key]
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
1. **"Project not found"** = Using Pages instead of Workers
2. **"Must specify project name"** = Wrong wrangler command
3. **"Build failed"** = Missing environment variables
4. **DNS issues** = Wait 24-48h for propagation

## 🎯 Working Examples

### **Platform Worker (BEST PRACTICE)**:
- ✅ **staff.gangerdermatology.com** - Main portal with all apps
- ✅ **Direct content serving** - No DNS issues, instant deployment
- ✅ **Professional UI** - Consistent branding across all apps
- ✅ **Path-based routing** - Clean URLs, easy navigation

### **Individual Workers (FOR COMPLEX APPS)**:
- ✅ **integration-status** - Complex dashboard with real-time data
- ✅ **medication-auth** - API endpoints and form processing
- ✅ **Custom configurations** - Database connections, third-party APIs

## 📋 Quick Start Checklist

1. **For new simple apps**: Add content to `staff-router.js` 
2. **For complex apps**: Create individual Worker
3. **Deploy**: `cd cloudflare-workers && npx wrangler deploy --env production`
4. **Verify**: Check `https://staff.gangerdermatology.com/[your-app]`
5. **Test**: Use verification checklist in `/deployments`

---

**Last Updated**: June 13, 2025 at 1:07 PM EST  
**Status**: ✅ Platform operational with working apps  
**Next**: Use direct content serving for maximum reliability