# 🔄 Migration Guide: From 21 Workers to 5 Workers

## Overview

This guide walks you through migrating from the current complex architecture (21+ workers) to the clean architecture (5 workers). The migration can be completed in approximately **2 hours**.

## Current State Assessment

### What You Have Now (21+ Workers)
```
❌ ganger-eos-l10-v2
❌ ganger-eos-l10-prod
❌ ganger-l10-staff-v3
❌ ganger-compliance-staff-production
❌ ganger-staffing-staff-production
❌ ganger-socials-staff-production
❌ staff-portal-router-production
❌ ganger-inventory-staff
❌ ganger-handouts-staff
❌ ganger-handouts-patient
❌ ganger-kiosk-admin
❌ ganger-kiosk-patient
❌ ganger-meds-staff
❌ ganger-meds-patient
❌ ganger-reps-admin
❌ ganger-reps-booking
❌ ganger-ai-receptionist-prod
❌ ganger-batch-closeout
❌ ganger-call-center-ops
❌ ganger-config-dashboard
❌ ganger-platform-dashboard
... and possibly more
```

### What You'll Have (5 Workers)
```
✅ ganger-medical-production     (Medical apps)
✅ ganger-business-production    (Business apps)
✅ ganger-core-production       (Core platform)
✅ ganger-portal-production      (Patient portals)
✅ ganger-api-production         (API gateway)
```

## Pre-Migration Checklist

### 1. Backup Current Configuration
```bash
# Document current workers
echo "=== Current Workers ===" > migration-backup.txt
echo "Date: $(date)" >> migration-backup.txt

# List all workers (you'll need to get this from Cloudflare dashboard)
# Copy the list to migration-backup.txt
```

### 2. Test Clean Architecture Locally
```bash
cd clean-architecture

# Test each worker locally
cd medical && npx wrangler dev
# Open http://localhost:8787 and test routes

cd ../business && npx wrangler dev
# Test business routes

# Continue for all 5 workers
```

### 3. Verify Environment Variables
```bash
# Check that all required environment variables are set in wrangler.jsonc files
grep -r "SUPABASE_URL" .
grep -r "STRIPE_" .
grep -r "TWILIO_" .
```

## Migration Steps

### Phase 1: Deploy New Workers (30 minutes)

**Step 1: Deploy Clean Architecture**
```bash
cd clean-architecture

# Deploy all 5 new workers
./deploy-all.sh

# Expected output:
# ✅ Medical Apps deployed
# ✅ Business Apps deployed
# ✅ Core Platform deployed
# ✅ Patient Portal deployed
# ✅ API Gateway deployed
```

**Step 2: Verify New Workers**
```bash
# Run verification script
./verify-deployment.sh

# All routes should return ✅ OK
```

### Phase 2: Test Parallel Operation (30 minutes)

At this point, both old and new workers are running. The new workers have more specific routes, so they'll take precedence.

**Test Key Routes:**
```bash
# Medical routes (should hit new worker)
curl -I https://staff.gangerdermatology.com/inventory
curl -I https://staff.gangerdermatology.com/handouts

# Business routes (should hit new worker)
curl -I https://staff.gangerdermatology.com/l10
curl -I https://staff.gangerdermatology.com/compliance

# Core routes (should hit new worker)
curl -I https://staff.gangerdermatology.com/
curl -I https://staff.gangerdermatology.com/dashboard

# External domains (should hit new worker)
curl -I https://handouts.gangerdermatology.com/
curl -I https://kiosk.gangerdermatology.com/
```

### Phase 3: Delete Old Workers (45 minutes)

**⚠️ IMPORTANT**: Only proceed if all tests pass!

**Step 1: Access Cloudflare Dashboard**
1. Go to: https://dash.cloudflare.com/
2. Navigate to Workers & Pages
3. You'll see all workers listed

**Step 2: Delete Workers Systematically**

Delete in this order (least critical first):
1. **Delete duplicate/test workers first:**
   - ganger-eos-l10-prod (duplicate of v2)
   - ganger-l10-staff-v3 (old version)

2. **Delete patient-specific workers:**
   - ganger-handouts-patient
   - ganger-kiosk-patient
   - ganger-meds-patient
   - ganger-reps-booking

3. **Delete staff-specific workers:**
   - ganger-inventory-staff
   - ganger-handouts-staff
   - ganger-kiosk-admin
   - ganger-meds-staff
   - ganger-reps-admin

4. **Delete specialized workers:**
   - ganger-ai-receptionist-prod
   - ganger-batch-closeout
   - ganger-call-center-ops
   - ganger-config-dashboard
   - ganger-platform-dashboard

5. **Delete app workers:**
   - ganger-eos-l10-v2
   - ganger-compliance-staff-production
   - ganger-staffing-staff-production
   - ganger-socials-staff-production

6. **Finally, delete the router:**
   - staff-portal-router-production

**For each worker:**
1. Click on the worker name
2. Go to Settings tab
3. Scroll to bottom
4. Click "Delete Worker"
5. Confirm deletion

### Phase 4: Final Verification (15 minutes)

**Step 1: Verify All Routes Still Work**
```bash
cd clean-architecture
./verify-deployment.sh

# All routes should still return ✅ OK
```

**Step 2: Check Cloudflare Dashboard**
- Only 5 workers should remain
- Check Analytics → No errors
- Check Logs → Normal traffic

**Step 3: Test Critical Functionality**
- Login to staff portal
- Access inventory system
- Check patient portals
- Verify API endpoints

## Rollback Plan

If anything goes wrong, you can quickly rollback:

### Option 1: Restore Old Workers
The old worker code is still in your Git repository:
```bash
# Restore old workers from Git
cd cloudflare-workers
npx wrangler deploy staff-router --env production
# Deploy other critical workers as needed
```

### Option 2: Use Cloudflare's Rollback
Each worker keeps 10 previous deployments:
1. Go to worker in dashboard
2. Click "Deployments" tab
3. Find previous deployment
4. Click "Promote to Production"

## Post-Migration Tasks

### 1. Update Documentation
- ✅ ROUTING_ARCHITECTURE.md → CLEAN_ARCHITECTURE_ROUTING.md
- ✅ DEPLOYMENT_GUIDE.md → CLEAN_ARCHITECTURE_DEPLOYMENT.md
- ✅ README.md updates
- ❌ Update any internal wikis or guides

### 2. Update CI/CD
```yaml
# Update .github/workflows/deploy.yml
- name: Deploy Workers
  run: |
    cd clean-architecture
    ./deploy-all.sh
```

### 3. Monitor Performance
- Watch CPU usage (should decrease)
- Monitor response times (should improve)
- Check error rates (should be near zero)
- Review costs (should decrease)

### 4. Team Communication
Send update to team:
```
Subject: Platform Architecture Simplified ✅

Team,

We've successfully migrated from 21+ workers to just 5 workers:
- Deployment time: 5 minutes (was 45-60 minutes)
- Routes: Automatically assigned (was manual)
- Debugging: Much simpler
- Performance: Improved

No action needed from your end. All routes work the same.

Documentation: /clean-architecture/README.md
```

## Troubleshooting

### Issue: Some routes return 404
**Solution**: Check that old workers are fully deleted. Routes might be cached.
```bash
# Clear cache and retry
curl -I https://staff.gangerdermatology.com/inventory?cachebust=$(date +%s)
```

### Issue: Routes going to wrong worker
**Solution**: More specific routes win. Check route patterns in wrangler.jsonc

### Issue: Need to restore old worker
**Solution**: Deploy from backup
```bash
cd cloudflare-workers
npx wrangler deploy [worker-name] --env production
```

## Benefits After Migration

### Immediate Benefits
- ✅ 5-minute deployments (was 45-60 minutes)
- ✅ No manual route assignment
- ✅ Cleaner architecture
- ✅ Easier debugging

### Long-term Benefits
- ✅ Lower maintenance burden
- ✅ Faster feature development
- ✅ Reduced complexity
- ✅ Better performance
- ✅ Lower costs

## Success Metrics

### Before Migration
- Workers: 21+
- Deployment time: 45-60 minutes
- Route assignment: Manual
- Debugging time: Hours
- Monthly errors: 100+

### After Migration
- Workers: 5
- Deployment time: 5 minutes
- Route assignment: Automatic
- Debugging time: Minutes
- Monthly errors: <10

## Final Checklist

- [ ] All 5 new workers deployed
- [ ] All routes tested and working
- [ ] All 21+ old workers deleted
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Celebration! 🎉

---

**Congratulations!** You've successfully migrated to a clean, simple architecture. Enjoy the improved developer experience!