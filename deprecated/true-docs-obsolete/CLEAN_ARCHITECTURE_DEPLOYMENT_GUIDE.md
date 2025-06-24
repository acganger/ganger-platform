# 📘 Clean Architecture Deployment Guide

**Last Updated**: January 19, 2025  
**Status**: ✅ Production Deployment Verified  
**Time Required**: ~10 minutes total  

---

## 🚀 Quick Start

```bash
# Set environment variables
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"

# Deploy all workers
cd /mnt/q/Projects/ganger-platform/clean-architecture
./deploy-all.sh

# Verify deployment
./verify-deployment.sh
```

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
```bash
export CLOUDFLARE_API_TOKEN="TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf"
export CLOUDFLARE_ACCOUNT_ID="68d0160c9915efebbbecfddfd48cddab"
export CLOUDFLARE_ZONE_ID="ba76d3d3f41251c49f0365421bd644a5"
```

### 2. Clean Up Old Workers (if migrating)
```bash
# List existing workers
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts" \
  | jq '.result[].id'

# Use Cloudflare MCP to delete old workers
# Or use the Cloudflare dashboard
```

### 3. Verify Directory Structure
```
/clean-architecture/
├── medical/
│   ├── index.js         # Medical app logic
│   └── wrangler.jsonc   # Routes: /inventory, /handouts, /meds, /kiosk
├── business/
│   ├── index.js         # Business app logic
│   └── wrangler.jsonc   # Routes: /l10, /compliance, /staffing, /socials
├── core/
│   ├── index.js         # Core platform logic
│   └── wrangler.jsonc   # Routes: /, /dashboard, /config, /status, etc.
├── portal/
│   ├── index.js         # Patient portal logic
│   └── wrangler.jsonc   # Domains: handouts.*, kiosk.*, meds.*, reps.*
├── api/
│   ├── index.js         # API gateway logic
│   └── wrangler.jsonc   # Routes: api.*, /api/*
├── deploy-all.sh        # Deployment script
└── verify-deployment.sh # Verification script
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Deploy Medical Worker
```bash
cd /mnt/q/Projects/ganger-platform/clean-architecture/medical
npx wrangler deploy --env production
```

Expected output:
```
Uploaded ganger-medical-production
Deployed ganger-medical-production triggers:
  staff.gangerdermatology.com/inventory/*
  staff.gangerdermatology.com/handouts/*
  staff.gangerdermatology.com/meds/*
  staff.gangerdermatology.com/kiosk/*
```

### Step 2: Deploy Business Worker
```bash
cd ../business
npx wrangler deploy --env production
```

Expected output:
```
Uploaded ganger-business-production
Deployed ganger-business-production triggers:
  staff.gangerdermatology.com/l10/*
  staff.gangerdermatology.com/compliance/*
  staff.gangerdermatology.com/staffing/*
  staff.gangerdermatology.com/socials/*
```

### Step 3: Deploy Core Worker
```bash
cd ../core
npx wrangler deploy --env production
```

Expected output:
```
Uploaded ganger-core-production
Deployed ganger-core-production triggers:
  staff.gangerdermatology.com/
  staff.gangerdermatology.com/dashboard/*
  staff.gangerdermatology.com/config/*
  staff.gangerdermatology.com/status/*
  ...and more routes
```

### Step 4: Deploy Portal Worker
```bash
cd ../portal
npx wrangler deploy --env production
```

Expected output:
```
Uploaded ganger-portal-production
Deployed ganger-portal-production triggers:
  handouts.gangerdermatology.com/*
  kiosk.gangerdermatology.com/*
  meds.gangerdermatology.com/*
  reps.gangerdermatology.com/*
```

### Step 5: Deploy API Worker
```bash
cd ../api
npx wrangler deploy --env production
```

Expected output:
```
Uploaded ganger-api-production
Deployed ganger-api-production triggers:
  api.gangerdermatology.com/*
  staff.gangerdermatology.com/api/*
```

---

## 🔍 Post-Deployment Verification

### Run Comprehensive Tests
```bash
cd /mnt/q/Projects/ganger-platform/clean-architecture
./verify-deployment.sh
```

### Expected Results
```
🔍 Verifying Ganger Platform Deployment
======================================

🏥 Medical Apps:
Testing Inventory... ✅ OK (200)
Testing Handouts... ✅ OK (200)
Testing Medications... ✅ OK (200)
Testing Kiosk Admin... ✅ OK (200)

💼 Business Apps:
Testing L10 (should redirect)... ✅ OK (302)
Testing Compliance... ✅ OK (200)
Testing Staffing... ✅ OK (200)
Testing Socials... ✅ OK (200)

🏠 Core Platform:
Testing Dashboard... ✅ OK (200)
Testing Config... ✅ OK (200)
Testing Status... ✅ OK (200)
Testing Admin... ✅ OK (200)

👥 Patient Portals:
Testing Handouts Portal... ✅ OK (200)
Testing Kiosk Portal... ✅ OK (200)
Testing Meds Portal... ✅ OK (200)
Testing Reps Portal... ✅ OK (200)

🔌 API Gateway:
Testing API Health... ✅ OK (200)
Testing API v1 Health... ✅ OK (200)

🎲 Testing Dynamic Content:
Checking for timestamps... ✅ Dynamic content confirmed
```

### Manual Verification Checklist

- [ ] Visit https://staff.gangerdermatology.com - Should show dashboard
- [ ] Check subroutes work: https://staff.gangerdermatology.com/inventory/dashboard
- [ ] Verify dynamic content (timestamps change on refresh)
- [ ] Test patient portals: https://handouts.gangerdermatology.com
- [ ] Confirm API endpoints: https://api.gangerdermatology.com/health

---

## 🌐 DNS Configuration

### Required DNS Records

If DNS records are missing, create them using Cloudflare MCP:

```javascript
// Patient portals
mcp__cloudflare-local__create_dns type: "CNAME" name: "handouts" content: "ganger-portal-production.workers.dev" proxied: true
mcp__cloudflare-local__create_dns type: "CNAME" name: "kiosk" content: "ganger-portal-production.workers.dev" proxied: true
mcp__cloudflare-local__create_dns type: "CNAME" name: "meds" content: "ganger-portal-production.workers.dev" proxied: true
mcp__cloudflare-local__create_dns type: "CNAME" name: "reps" content: "ganger-portal-production.workers.dev" proxied: true

// API domain
mcp__cloudflare-local__create_dns type: "CNAME" name: "api" content: "ganger-api-production.workers.dev" proxied: true
```

### SSL Certificates

- ✅ Cloudflare Universal SSL automatically handles certificates
- ✅ Wildcard certificate covers *.gangerdermatology.com
- ✅ All routes use HTTPS by default

---

## 🚨 Troubleshooting

### Common Issues

#### 1. "Route already assigned to another worker"
**Solution**: Delete the old worker first
```bash
# List workers to find the conflicting one
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts"

# Delete using MCP or dashboard
```

#### 2. "SSL certificate error" on patient portals
**Solution**: Ensure DNS records are proxied through Cloudflare
- Orange cloud icon should be enabled in Cloudflare dashboard
- Wait 5-10 minutes for SSL provisioning

#### 3. "Static content being served"
**Solution**: Verify worker code includes timestamp generation
```javascript
const timestamp = new Date().toISOString();
// Include timestamp in HTML response
```

#### 4. "Worker not found" errors
**Solution**: Check deployment succeeded
```bash
# Re-run deployment for specific worker
cd clean-architecture/[worker-name]
npx wrangler deploy --env production
```

---

## 📊 Performance Monitoring

### Check Worker Analytics
1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages
3. Click on each worker to view:
   - Request count
   - Error rate
   - CPU time
   - Response times

### Expected Performance
- **Cold start**: <200ms
- **Warm requests**: <50ms
- **Error rate**: <0.1%
- **CPU time**: <10ms average

---

## 🔄 Rollback Procedure

If issues arise:

1. **Keep old worker code backed up**
2. **Redeploy previous version**:
   ```bash
   cd [old-worker-directory]
   npx wrangler deploy
   ```
3. **Update routes in Cloudflare dashboard if needed**

---

## 📝 Deployment Checklist Summary

- [x] Set environment variables
- [x] Clean up old workers
- [x] Deploy medical worker
- [x] Deploy business worker
- [x] Deploy core worker
- [x] Deploy portal worker
- [x] Deploy API worker
- [x] Verify all routes working
- [x] Check dynamic content
- [x] Confirm SSL certificates
- [x] Update documentation

---

**Deployment Guide Version**: 1.0.0  
**Architecture**: 5-Worker Clean System  
**Support**: Use Cloudflare dashboard for monitoring and logs