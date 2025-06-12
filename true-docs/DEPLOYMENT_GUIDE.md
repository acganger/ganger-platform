# 🚀 Ganger Platform - Deployment Guide

> **CRITICAL**: This platform uses **Cloudflare Workers + Routes**, NOT Cloudflare Pages. Pages is deprecated/sunset.

## ⚠️ DEPLOYMENT ARCHITECTURE

**✅ CORRECT**: Cloudflare Workers with Custom Routes  
**❌ WRONG**: Cloudflare Pages (deprecated, will fail)

## 🔧 Quick Deployment Commands

### Deploy Medication Auth (Working Example)
```bash
cd apps/medication-auth
npx wrangler deploy --env production
```

### Check Deployment Status
```bash
npx wrangler deployments list
```

## 📁 Required Files for Each App

### 1. `wrangler.toml` Configuration
```toml
name = "ganger-app-name"
main = "worker-simple.js"
compatibility_date = "2024-06-12"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "ganger-app-name-prod"
routes = [
  { pattern = "subdomain.gangerdermatology.com/*", zone_name = "gangerdermatology.com" }
]

[vars]
ENVIRONMENT = "production"
APP_NAME = "Your App Name"
```

### 2. Worker Script (`worker-simple.js`)
- Self-contained JavaScript file
- Handles HTTP requests
- Serves static content OR API endpoints
- No external dependencies required

### 3. GitHub Actions Workflow
```yaml
- name: Deploy Worker
  run: |
    cd apps/your-app
    npx wrangler deploy --env production
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## 🌐 Domain Configuration

### Current Working Domains:
- `staff.gangerdermatology.com` ✅ Working (legacy static)
- `meds.gangerdermatology.com` ✅ Workers deployment

### Domain Routing Setup:
1. **Cloudflare Zone**: `ba76d3d3f41251c49f0365421bd644a5` 
2. **DNS**: Managed by Cloudflare
3. **Routes**: Configured in `wrangler.toml` per app

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
# Pages deployment (DEPRECATED)
npx wrangler pages deploy dist --project-name app-name

# Using pages-action in GitHub Actions
uses: cloudflare/pages-action@v1
```

### ✅ DO THIS INSTEAD:
```bash
# Workers deployment (CORRECT)
npx wrangler deploy --env production

# Direct wrangler command in GitHub Actions
npx wrangler deploy --env production
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

## 🎯 Working Example

**medication-auth** is the reference implementation:
- ✅ Deploys successfully to Workers
- ✅ Custom domain configured
- ✅ API endpoints working
- ✅ Professional UI

Copy its configuration for new apps.

---

**Last Updated**: January 12, 2025  
**Status**: Workers deployment active and verified  
**Next**: Use this architecture for all future deployments