# Vercel Distributed Deployment Plan

## 📚 Table of Contents
- [Objective](#-objective)
- [Architecture Overview](#️-architecture-overview)
- [Deployment Phases](#-deployment-phases)
- [Automation Scripts](#-automation-scripts)
- [Parallel Deployment Strategy](#-parallel-deployment-strategy)
- [Success Metrics](#-success-metrics)
- [Rollback Plan](#-rollback-plan)
- [Documentation Updates](#-documentation-updates)
- [Timeline](#️-timeline)
- [Final Checklist](#-final-checklist)
- [Related Documentation](#-related-documentation)

## 🎯 Objective

Deploy 20+ apps from the Ganger Platform monorepo as individual Vercel projects, with the Staff Portal acting as the central router under `staff.gangerdermatology.com`.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│          staff.gangerdermatology.com                     │
│            (Staff Portal - Router)                       │
├─────────────────────────────────────────────────────────┤
│                    vercel.json                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  "/inventory/*" → inventory-xyz.vercel.app      │   │
│  │  "/handouts/*" → handouts-xyz.vercel.app        │   │
│  │  "/l10/*" → eos-l10-xyz.vercel.app              │   │
│  │  ... (15+ more rewrites)                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
     ┌──────────────┬──────────────┬──────────────┐
     │ Independent  │ Independent  │ Independent  │
     │   Vercel     │   Vercel     │   Vercel     │
     │  Projects    │  Projects    │  Projects    │
     └──────────────┴──────────────┴──────────────┘
```

## 📋 Deployment Phases

### Phase 1: Pre-Deployment Validation
**Time: 30 minutes**
**Automated: Yes**

1. Run `node scripts/pre-deployment-check.js`
2. Fix any critical issues (❌)
3. Review warnings (⚠️)
4. Document any exceptions

### Phase 2: Deploy Individual Apps
**Time: 2-3 hours**
**Automated: Yes**

1. **Prepare environment variables**:
   ```bash
   cp deployment-env.secret.example deployment-env.secret
   # Edit deployment-env.secret with your actual values
   ```

2. Run `./scripts/vercel-deploy-all-apps.sh`
3. Script will:
   - Deploy each app to its own Vercel project
   - Configure environment variables for both production and preview environments
   - Save deployment URLs to `deployment-urls.json`
   - Handle errors gracefully
   - NOT expose secrets in logs (uses Vercel CLI securely)

**Note**: The script uses `vercel env add` which securely handles secrets without exposing them in logs.

### Phase 3: Configure Staff Portal Router
**Time: 15 minutes**
**Automated: Yes**

1. Run `node scripts/update-staff-rewrites.js`
2. This updates `apps/staff/vercel.json` with all deployment URLs
3. Deploy staff portal: `cd apps/staff && vercel --prod`

⚠️ **CRITICAL**: This final step makes everything LIVE to the public domain. Ensure all testing is complete before proceeding!

### Phase 4: Domain Configuration
**Time: 30 minutes**
**Manual: Requires Vercel Dashboard**

1. Add custom domain in Vercel
2. Update Cloudflare DNS
3. Verify SSL certificates

### Phase 5: Testing & Verification
**Time: 1 hour**
**Semi-Automated**

1. Run automated tests
2. Manual verification of critical paths
3. Cross-app navigation testing

## 🤖 Automation Scripts

### 1. **pre-deployment-check.js**
- Validates all apps against checklist
- Finds demo files, console.logs, localhost refs
- Checks TypeScript compilation
- Outputs actionable report

### 2. **vercel-deploy-all-apps.sh**
- Deploys 15+ apps automatically
- Configures all environment variables
- Handles errors without stopping
- Outputs deployment URLs

### 3. **update-staff-rewrites.js**
- Reads deployment URLs
- Generates vercel.json rewrites
- Updates staff portal configuration

### 4. **test-deployments.js** (to be created)
- Tests each deployment URL
- Verifies API endpoints
- Checks authentication flow

## 🔀 Parallel Deployment Strategy

To speed up deployment with multiple AI assistants:

### Assistant 1: Medical Apps
```bash
# Deploy these apps:
- inventory
- handouts
- checkin-kiosk
- medication-auth
```

### Assistant 2: Business Apps
```bash
# Deploy these apps:
- eos-l10
- compliance-training
- clinical-staffing
- socials-reviews
```

### Assistant 3: Core/Admin Apps
```bash
# Deploy these apps:
- config-dashboard
- integration-status
- ai-receptionist
- call-center-ops
- pharma-scheduling
- component-showcase
- batch-closeout
```

### Coordinator: Staff Portal
```bash
# After all apps deployed:
- Collect all deployment URLs
- Update staff portal rewrites
- Deploy staff portal
- Configure domain
```

## 📊 Success Metrics

1. **All apps accessible** via staff.gangerdermatology.com/[app]
2. **Authentication works** across all apps
3. **No console errors** in browser
4. **Performance scores** > 80 (Lighthouse)
5. **All API endpoints** responding correctly

## 🚨 Rollback Plan

If deployment fails:
1. Vercel maintains previous deployments
2. Can instantly rollback via Vercel dashboard
3. DNS changes can be reverted in Cloudflare
4. Each app can be rolled back independently

## 📝 Documentation Updates

After successful deployment:
1. Update CLAUDE.md with Vercel URLs
   - CLAUDE.md is our internal codebase documentation for AI assistants
   - Contains platform configuration, deployment info, and architectural decisions
2. Document any workarounds needed
3. Create runbook for future deployments
4. Update environment variable documentation

## ⏱️ Timeline

- **Total Time**: 4-5 hours
- **With 3 AI Assistants**: 2-3 hours
- **Critical Path**: Staff Portal deployment (must be last)

## 🎯 Final Checklist

- [ ] All apps pass pre-deployment checks
- [ ] All apps deployed to Vercel
- [ ] All deployment URLs documented
- [ ] Staff portal rewrites configured
- [ ] Staff portal deployed
- [ ] Custom domain configured
- [ ] DNS updated
- [ ] SSL certificates active
- [ ] Full platform test passed
- [ ] Documentation updated

## 🚀 Ready to Deploy?

1. **First**: Fix any critical issues from pre-deployment check
2. **Second**: Run automated deployment scripts
3. **Third**: Configure domain and test
4. **Finally**: Celebrate successful deployment! 🎉

## 📚 Related Documentation

- **Previous**: [Deployment History](./01-deployment-history.md) - Understanding what failed
- **Next**: [Deployment Checklist](./03-deployment-checklist.md) - Pre-deployment validation
- **Critical**: [Risk Mitigation](./04-risk-mitigation.md) - Handling potential issues
- **Scripts**: [Automation Scripts](./scripts/) - Implementation details
- **Overview**: [Back to Index](./README.md) - Complete documentation index