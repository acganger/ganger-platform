# Deployment Quick Reference

## 🚀 Quick Deployment Commands

### Full Deployment (Not Recommended)
```bash
# From project root
cd true-docs/deployment

# 1. Check
node scripts/02-pre-deployment-check.js

# 2. Deploy all
./scripts/01-deploy-all-apps.sh

# 3. Configure router
node scripts/03-update-staff-rewrites.js

# 4. Deploy staff portal
cd ../../apps/staff && vercel --prod

# 5. Verify
cd ../../true-docs/deployment && ./scripts/04-verify-deployment.sh
```

### Phased Deployment (Recommended)
```bash
# Phase 1: Low-risk apps
APPS="component-showcase config-dashboard" ./scripts/01-deploy-all-apps.sh

# Wait 24 hours, monitor

# Phase 2: Medium-risk apps
APPS="compliance-training socials-reviews" ./scripts/01-deploy-all-apps.sh

# Phase 3: Critical apps
APPS="inventory handouts medication-auth" ./scripts/01-deploy-all-apps.sh

# Phase 4: Router
node scripts/03-update-staff-rewrites.js
cd ../../apps/staff && vercel --prod
```

## 🔍 Quick Checks

### Check Deployment Status
```bash
# List all deployments
cat deployment-urls.json | jq '.'

# Test specific app
curl -I https://staff.gangerdermatology.com/inventory
```

### Check for Issues
```bash
# Pre-deployment validation
node scripts/02-pre-deployment-check.js | grep "❌"

# Post-deployment verification
./scripts/04-verify-deployment.sh
```

## 🆘 Emergency Commands

### Rollback Everything
```bash
./scripts/05-emergency-rollback.sh
```

### Rollback Single App
```bash
vercel rollback [deployment-url] --token=RdwA23mHSvPcm9ptReM6zxjF
```

## 📋 Environment Setup

```bash
# One-time setup
cp deployment-env.secret.example deployment-env.secret
# Edit deployment-env.secret with actual values
```

## 🔗 Key URLs

- **Staff Portal**: https://staff.gangerdermatology.com
- **Vercel Dashboard**: https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS
- **GitHub Repo**: https://github.com/acganger/ganger-platform

## 📚 Documentation Map

1. Start Here → [README.md](./README.md)
2. Understand Why → [01-deployment-history.md](./01-deployment-history.md)
3. Follow Plan → [02-deployment-plan.md](./02-deployment-plan.md)
4. Check Apps → [03-deployment-checklist.md](./03-deployment-checklist.md)
5. Handle Issues → [04-risk-mitigation.md](./04-risk-mitigation.md)

## ⚠️ Critical Reminders

1. **Never skip pre-deployment checks**
2. **Deploy staff portal LAST** (it makes everything live)
3. **Test authentication across apps**
4. **Monitor for 24 hours after deployment**
5. **Keep deployment-env.secret secure**

---
*For detailed instructions, see the [full documentation](./README.md)*