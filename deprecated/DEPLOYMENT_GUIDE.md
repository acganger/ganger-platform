# 🚀 Ganger Platform - Deployment Guide

## 🎯 Quick Start

### Deploy a Single App
```bash
# Make the script executable (first time only)
chmod +x scripts/deploy-app.sh

# Deploy an app
./scripts/deploy-app.sh compliance
./scripts/deploy-app.sh staffing
./scripts/deploy-app.sh socials
./scripts/deploy-app.sh l10
```

### Deploy Staff Portal Router
```bash
cd cloudflare-workers
npx wrangler deploy staff-router --env production
```

---

## 🏗️ Platform Architecture

### Current Worker Structure
```
staff.gangerdermatology.com/*
├── Dedicated Workers (bypass router)
│   ├── /l10/*        → ganger-eos-l10-v2
│   ├── /compliance/* → ganger-compliance-staff-production
│   ├── /staffing/*   → ganger-staffing-staff-production
│   └── /socials/*    → ganger-socials-staff-production
│
└── Staff Portal Router (catch-all)
    └── /*            → staff-portal-router-production
        ├── /dashboard
        ├── /inventory/*
        ├── /handouts/*
        ├── /kiosk/*
        ├── /config/*
        ├── /ai-receptionist/*
        ├── /call-center/*
        ├── /reps/*
        └── /showcase/*
```

---

## 📋 Deployment Steps

### 1. Pre-Deployment Checklist
- [ ] Code changes committed and pushed
- [ ] Environment variables verified in wrangler.toml
- [ ] Build tested locally (`npm run build`)

### 2. Deploy Dedicated Worker Apps

#### For Next.js Apps (Compliance, Staffing, Socials, L10)
```bash
cd apps/[app-name]

# 1. Install dependencies
npm install

# 2. Build the Next.js app
npm run build

# 3. Deploy to Cloudflare
npx wrangler deploy --env production

# 4. Verify deployment
curl -I https://staff.gangerdermatology.com/[app-route]
```

### 3. Deploy Staff Portal Router
```bash
cd cloudflare-workers

# Deploy the router (do this AFTER dedicated workers)
npx wrangler deploy staff-router --env production
```

---

## 🔧 Troubleshooting

### Problem: Routes Not Working After Deployment

**Symptom**: Deployment succeeds but app shows old content or 404

**Solution 1**: Check Route Assignment
```bash
# The deployment output should show:
# ✅ Routes assigned:
#   - staff.gangerdermatology.com/compliance/*

# If it shows:
# ⚠️ Route assignment required manually

# Then you need to manually assign in Cloudflare dashboard
```

**Solution 2**: Manual Route Assignment
1. Go to: https://dash.cloudflare.com/[account-id]/workers/overview
2. Find your Worker (e.g., `ganger-compliance-staff-production`)
3. Click on the Worker
4. Go to "Settings" → "Routes"
5. Add route: `staff.gangerdermatology.com/compliance/*`
6. Remove route from any conflicting Workers

### Problem: 500 Errors

**Check Worker Logs**:
1. Go to Cloudflare dashboard
2. Select your Worker
3. Click "Logs" tab
4. Look for error messages

**Common Causes**:
- Missing environment variables
- Build artifacts not included
- Memory/CPU limits exceeded

### Problem: Static Content Instead of Dynamic

**Causes**:
1. Old Worker still handling routes
2. Build didn't include latest changes
3. Wrong runtime configuration

**Fix**:
```bash
# Rebuild and redeploy
npm run build
npx wrangler deploy --env production --force
```

---

## 🚨 Route Precedence Issues

### Understanding Route Conflicts

Cloudflare Workers use **most specific match** precedence:
1. Exact routes: `staff.gangerdermatology.com/l10`
2. Wildcard routes: `staff.gangerdermatology.com/l10/*`
3. Catch-all routes: `staff.gangerdermatology.com/*`

### Checking Active Routes
```bash
# See which Worker handles a route
curl -I https://staff.gangerdermatology.com/compliance | grep cf-
```

### Fixing Route Conflicts
1. More specific routes automatically win
2. If two Workers have the same route pattern:
   - The most recently assigned wins
   - Manual intervention required

---

## 📊 Deployment Verification

### Automated Verification
```bash
# Run verification script
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

### Manual Verification Checklist
- [ ] Main route returns 200/302
- [ ] Subroutes are accessible
- [ ] Dynamic content visible (timestamps)
- [ ] No 404/500 errors
- [ ] Worker logs show no errors

---

## 🔄 Rollback Procedure

### Quick Rollback
```bash
# Cloudflare keeps previous deployments
# In dashboard: Worker → Deployments → Select previous version → Promote
```

### Manual Rollback
```bash
# Deploy previous git commit
git checkout [previous-commit-hash]
cd apps/[app-name]
npm run build
npx wrangler deploy --env production
```

---

## 📈 Monitoring After Deployment

### Key Metrics to Watch
1. **Error Rate**: Should be < 0.1%
2. **Response Time**: Should be < 500ms
3. **CPU Time**: Should be < 50ms
4. **Memory Usage**: Should be < 128MB

### Where to Monitor
- Cloudflare Dashboard → Workers → Analytics
- Check "Errors" tab for exceptions
- Monitor "Logs" for real-time issues

---

## 🚀 Deployment Best Practices

### 1. Deploy Order Matters
Always deploy in this order:
1. Dedicated Workers first
2. Staff Portal Router last

### 2. Test After Each Deployment
Don't deploy all apps at once. Deploy → Test → Next app

### 3. Keep Deployment Logs
```bash
./scripts/deploy-app.sh compliance 2>&1 | tee deployment-$(date +%Y%m%d-%H%M%S).log
```

### 4. Use Staging First
```bash
npx wrangler deploy --env staging
# Test at: https://staff-staging.gangerdermatology.com
```

---

## 🆘 Emergency Contacts

### If Deployment Fails
1. Check Worker logs in Cloudflare dashboard
2. Review deployment output for errors
3. Verify wrangler.toml configuration
4. Check GitHub Actions logs if using CI/CD

### Platform Issues
- Cloudflare Status: https://www.cloudflarestatus.com/
- Supabase Status: https://status.supabase.com/

---

## 📝 Deployment Checklist Template

```markdown
## Deployment: [App Name] - [Date]

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Build successful locally
- [ ] Environment variables verified

### Deployment
- [ ] Dependencies installed
- [ ] Build completed
- [ ] Worker deployed
- [ ] Routes assigned

### Post-Deployment
- [ ] Main route tested
- [ ] Subroutes tested
- [ ] Dynamic content verified
- [ ] Logs checked for errors
- [ ] Performance metrics normal

### Notes
- Deployment time: 
- Issues encountered: 
- Resolution: 
```

---

**Remember**: The platform's complexity comes from having 21+ separate Workers. Each deployment requires careful attention to route assignment and verification. When in doubt, check the Cloudflare dashboard for actual route assignments.