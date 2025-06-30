# Vercel Distributed Deployment Documentation

> **🚀 CURRENT DEPLOYMENT STRATEGY**: This documentation describes the production deployment approach using Vercel's distributed architecture where each app is deployed as an individual Vercel project.
> 
> **✅ PACKAGE MANAGER**: This monorepo uses **pnpm** with workspace support.
> 
> **📅 Last Updated**: December 30, 2024 8:30 PM EST

## 🚀 Quick Start
See **[Quick Reference Guide](./QUICK_REFERENCE.md)** for rapid deployment commands.

## 📚 Table of Contents

### Core Documentation
- **[PNPM Migration Summary](./PNPM_MIGRATION_SUMMARY.md)** - How we use pnpm for deployments
- **[Monorepo Deployment Strategy](./monorepo-deployment-strategy.md)** - Understanding the architecture
- **[GitHub Integration Findings](./github-integration-findings.md)** - How GitHub integration works
- **[MCP Deployment Warning](./MCP_DEPLOYMENT_WARNING.md)** - Important submodule exclusions

### Scripts
1. **[Deploy All Apps](./scripts/01-deploy-all-apps.sh)** - Main deployment automation
2. **[Pre-deployment Check](./scripts/02-pre-deployment-check.js)** - Validation script
3. **[Update Staff Rewrites](./scripts/03-update-staff-rewrites.js)** - Configure router
4. **[Verify Deployment](./scripts/04-verify-deployment.sh)** - Post-deployment testing
5. **[Emergency Rollback](./scripts/05-emergency-rollback.sh)** - Break-glass procedure


### Configuration
- **[Environment Template](./deployment-env.secret.example)** - Secure environment variables template

## 🚀 Quick Start (GitHub Integration - Recommended)

### 1. Clean & Setup Projects
```bash
# Clean slate (if needed)
./scripts/cleanup-all-vercel-projects.sh

# Create projects with GitHub integration
./scripts/setup-vercel-github-integration.sh
```

### 2. Configure Environment Variables
Visit https://vercel.com/ganger and add environment variables to each project from your `.env` file.

### 3. Deploy via Git Push
```bash
git push origin main
```

### 4. Monitor Deployment
```bash
./scripts/check-vercel-status.sh
```

## 🚀 Manual Deployment Process

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
- ✅ Works perfectly with pnpm workspaces 
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


## 🆘 Emergency Procedures

If something goes wrong:
```bash
# Immediate rollback
./scripts/05-emergency-rollback.sh

# Check what failed
./scripts/04-verify-deployment.sh
```

## 🚨 Critical: MCP Submodules Must Be Excluded

### IMPORTANT: Local MCP Development Tools
The `mcp-servers/` directory contains git submodules for local Claude development tools. These MUST be excluded from deployments:

1. **Ensure .gitignore includes:**
   ```
   # MCP Servers (local Claude tools only - not needed for deployments)
   mcp-servers/
   servers/
   ```

2. **Ensure .vercelignore includes:**
   ```
   # Ignore MCP servers and related packages
   mcp-servers/
   ```

3. **If you see "Failed to fetch git submodules" errors:**
   ```bash
   # Remove submodule references
   git rm -r --cached mcp-servers/*
   git rm -r --cached servers
   
   # Add to .gitignore
   echo "mcp-servers/" >> .gitignore
   echo "servers/" >> .gitignore
   
   # Commit and push
   git commit -m "fix: remove MCP submodules for deployment"
   git push
   ```

## 🔧 Common Deployment Issues & Fixes

### 1. **Module Not Found Errors** (e.g., date-fns)
```bash
# Add .npmrc to root directory
echo "node-linker=hoisted
public-hoist-pattern[]=*
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true" > .npmrc

# Update lockfile
pnpm install
```

### 2. **Syntax Errors in Build**
- Check for malformed imports (exports inside import statements)
- Look for missing closing brackets in import statements
- Ensure all exports are outside of import blocks

### 3. **404 Errors After Deployment**
- Verify basePath in next.config.js matches staff portal navigation
- Check that environment variables are set in Vercel dashboard
- Ensure authentication is configured (401 is better than 404)

### 4. **Inconsistent Package Versions**
- Standardize Next.js versions: `"next": "^14.2.0"`
- Remove exact versions like `"next": "14.2.5"`
- Check for duplicate dependencies in package.json

### 5. **Leftover Cloudflare Dependencies**
```bash
# Find apps with Cloudflare deps
grep -l "@cloudflare/next-on-pages" apps/*/package.json

# Remove from each affected app's package.json
```

## 📝 Maintenance

- Update `deployment-urls.json` after each deployment
- Keep environment variables in sync across all apps
- Document any workarounds in this directory
- Archive old scripts in `scripts/archive/`

---

**Last Updated**: December 30, 2024 8:30 PM EST  
**Package Manager**: pnpm with workspaces  
**Deployment Method**: Vercel Distributed Architecture (Individual projects for all apps)