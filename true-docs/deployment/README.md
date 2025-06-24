# Vercel Distributed Deployment Documentation

> **🚀 CURRENT DEPLOYMENT STRATEGY**: This documentation describes the production deployment approach using Vercel's distributed architecture with 20+ individual projects.

## 🚀 Quick Start
See **[Quick Reference Guide](./QUICK_REFERENCE.md)** for rapid deployment commands.

## 📚 Table of Contents

### Documentation
1. **[Deployment History](./01-deployment-history.md)** - What we tried and why it failed
2. **[Deployment Plan](./02-deployment-plan.md)** - The complete distributed deployment strategy
3. **[Deployment Checklist](./03-deployment-checklist.md)** - Pre-deployment validation for each app
4. **[Risk Mitigation](./04-risk-mitigation.md)** - Addressing all identified deployment risks
5. **[Improvements Summary](./05-improvements-summary.md)** - Security and process improvements
6. **[Deployment Readiness](./06-deployment-readiness.md)** - Final readiness assessment
7. **[Legacy Guide](./07-legacy-deployment-guide.md)** - Original single-deployment approach (deprecated)

### Scripts
1. **[Deploy All Apps](./scripts/01-deploy-all-apps.sh)** - Main deployment automation
2. **[Pre-deployment Check](./scripts/02-pre-deployment-check.js)** - Validation script
3. **[Update Staff Rewrites](./scripts/03-update-staff-rewrites.js)** - Configure router
4. **[Verify Deployment](./scripts/04-verify-deployment.sh)** - Post-deployment testing
5. **[Emergency Rollback](./scripts/05-emergency-rollback.sh)** - Break-glass procedure


### Configuration
- **[Environment Template](./deployment-env.secret.example)** - Secure environment variables template

## 🚀 Quick Start

### 1. Prepare Environment
```bash
cp deployment-env.secret.example deployment-env.secret
# Edit with your actual values
```

### 2. Run Pre-deployment Checks
```bash
node scripts/02-pre-deployment-check.js
```

### 3. Deploy Apps
```bash
# Phased deployment (recommended)
APPS="component-showcase config-dashboard" ./scripts/01-deploy-all-apps.sh

# Or full deployment
./scripts/01-deploy-all-apps.sh
```

### 4. Configure Router
```bash
node scripts/03-update-staff-rewrites.js
cd ../../apps/staff && vercel --prod
```

### 5. Verify Deployment
```bash
./scripts/04-verify-deployment.sh
```

## 📋 Deployment Strategy Overview

We use a **distributed deployment architecture** where:
- Each app deploys as an independent Vercel project
- Staff Portal acts as the central router
- All apps remain accessible under `staff.gangerdermatology.com`

### Why This Approach?
- ✅ Solves pnpm workspace issues with Vercel
- ✅ Each app scales independently
- ✅ Faster deployments (only deploy what changes)
- ✅ Better error isolation
- ✅ Aligns with Vercel's design philosophy

### Architecture Diagram
```
staff.gangerdermatology.com (Router)
├── /inventory → inventory-xyz.vercel.app
├── /handouts → handouts-xyz.vercel.app
├── /l10 → eos-l10-xyz.vercel.app
└── ... (15+ more apps)
```

## ⚠️ Critical Notes

1. **Deploy in Phases** - Don't deploy all 20+ apps at once
2. **Test Authentication** - Most critical component
3. **Monitor First 24 Hours** - Most issues surface early
4. **Keep Secrets Secure** - Never commit deployment-env.secret

## 📚 Document Cross-References

- Start with **[Deployment History](./01-deployment-history.md)** to understand what doesn't work
- Follow the **[Deployment Plan](./02-deployment-plan.md)** for step-by-step instructions
- Use **[Deployment Checklist](./03-deployment-checklist.md)** to validate each app
- Review **[Risk Mitigation](./04-risk-mitigation.md)** for handling potential issues
- Check **[Deployment Readiness](./06-deployment-readiness.md)** before going live

## 🆘 Emergency Procedures

If something goes wrong:
```bash
# Immediate rollback
./scripts/05-emergency-rollback.sh

# Check what failed
./scripts/04-verify-deployment.sh
```

## 📝 Maintenance

- Update `deployment-urls.json` after each deployment
- Keep environment variables in sync across all apps
- Document any workarounds in this directory
- Archive old scripts in `scripts/archive/`

---

**Last Updated**: January 2025  
**Platform Version**: 1.6.0  
**Deployment Method**: Vercel Distributed Architecture (20+ Individual Projects)