# Current Deployment Process

*Last Updated: December 30, 2024 8:30 PM EST*

## Overview

The Ganger Platform uses Vercel for deployment with pnpm as the package manager. Each app is deployed as an individual Vercel project, with automatic deployments currently **DISABLED** to allow manual control.

## Package Manager: pnpm

All apps use **pnpm** with workspace support:
- `pnpm-workspace.yaml` defines the monorepo structure
- Each app's `vercel.json` specifies pnpm commands
- `NODE_ENV=development` ensures devDependencies are installed

## Deployment Methods

### 1. GitHub Actions (Recommended)
Since auto-deploy is disabled, use the GitHub Actions workflow:

```bash
# Go to GitHub Actions page
# Select "Smart Sequential Deployment"
# Choose deployment mode:
#   - changed-only: Deploy only changed apps
#   - sequential-all: Deploy all apps
#   - specific-apps: Deploy selected apps
```

### 2. Direct Vercel CLI
For single app deployment:

```bash
cd apps/[app-name]
npx vercel deploy --prod --token=$VERCEL_TOKEN --scope=$VERCEL_SCOPE
```

### 3. Trigger via Script
```bash
./scripts/trigger-github-deployment.sh changed-only production
```

## Environment Variables

Environment variables must be set in each Vercel project. Use the script:

```bash
# Add env vars to all projects
./true-docs/deployment/scripts/add-all-env-vars.sh
```

Key variables include:
- Database URLs (Supabase)
- Authentication keys (Google OAuth)
- API keys for integrations
- `ENABLE_EXPERIMENTAL_COREPACK=1` for pnpm support

## App Configuration

Each app requires a `vercel.json` file:

```json
{
  "installCommand": "cd ../.. && NODE_ENV=development pnpm install --no-frozen-lockfile && pnpm -F @ganger/auth build && pnpm -F @ganger/ui build",
  "buildCommand": "cd ../.. && pnpm -F @ganger/[app-name] build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## Current Apps

As of December 30, 2024 8:30 PM EST, the platform includes these apps in the `apps/` directory:

- ai-receptionist
- batch-closeout
- call-center-ops
- checkin-kiosk
- clinical-staffing
- compliance-training
- component-showcase
- config-dashboard
- deployment-helper
- eos-l10
- handouts
- integration-status
- inventory
- llm-demo
- medication-auth
- pharma-scheduling
- platform-dashboard
- socials-reviews
- staff

## Important Notes

1. **Auto-deploy is DISABLED** - You must manually trigger deployments
2. **Remote Caching** - Set up via `npx turbo login` and `npx turbo link`
3. **MCP Submodules** - Must be excluded from deployments (see MCP_DEPLOYMENT_WARNING.md)
4. **Build Dependencies** - Some apps require @ganger/auth and @ganger/ui to be built first

## Troubleshooting

If builds fail:
1. Check that pnpm is being used (not npm)
2. Verify environment variables are set
3. Ensure NODE_ENV=development in install command
4. Check for MCP submodule issues
5. Verify shared packages (@ganger/*) are built first

## Scripts Location

Active deployment scripts are in:
- `/scripts/` - Only 3 remaining utility scripts
- `/true-docs/deployment/scripts/` - Deployment-specific scripts

Many old scripts have been moved to `/deprecated/` to reduce confusion.