# Vercel Deployment Automation Guide

This guide covers the automated deployment setup for the Ganger Platform using Vercel and GitHub Actions.

## 🏗️ Architecture Overview

- **20+ Individual Vercel Projects**: Each app deploys independently
- **Automated Deployments**: Push to main branch triggers deployments
- **Staff Portal Router**: Central hub that routes to individual apps
- **GitHub Actions**: Orchestrates the entire deployment pipeline

## 📋 Initial Setup (One-Time)

### 1. Clean Slate - Remove Existing Projects

```bash
# Remove the 6 existing Vercel projects
./scripts/remove-vercel-projects.sh
```

### 2. Create All Vercel Projects

```bash
# This creates a Vercel project for each app
./scripts/setup-vercel-projects.sh

# Output: vercel-project-ids.env file with all project IDs
```

### 3. Add Secrets to GitHub

Add these secrets to your GitHub repository:

#### Vercel Authentication
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID (or user ID)
- `VERCEL_TEAM_ID`: team_wpY7PcIsYQNnslNN39o7fWvS

#### Project IDs (from vercel-project-ids.env)
- `VERCEL_PROJECT_ID_inventory`
- `VERCEL_PROJECT_ID_handouts`
- `VERCEL_PROJECT_ID_eos_l10` (note: underscore, not hyphen)
- ... (one for each app)

#### Environment Variables (from .env)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- All other variables from .env

### 4. Configure Environment Variables

```bash
# This sets all env vars for all Vercel projects
./scripts/setup-vercel-env.sh
```

### 5. Configure Custom Domains (Manual)

In Vercel Dashboard:
1. Go to each project's settings
2. Add custom domains:
   - `staff.gangerdermatology.com` → ganger-staff project
   - `lunch.gangerdermatology.com` → ganger-pharma-scheduling project
   - `kiosk.gangerdermatology.com` → ganger-checkin-kiosk project

## 🚀 Automated Deployment Workflow

### Push to Main Branch

When you push changes to the main branch:

1. **GitHub Actions** detects which apps changed
2. **Builds** only the changed apps
3. **Deploys** each app to its Vercel project
4. **Updates** staff portal rewrites if needed
5. **Notifies** on success/failure

### Manual Deployment

Deploy a specific app manually:

1. Go to GitHub Actions
2. Select "Deploy Single App" workflow
3. Choose the app and environment
4. Click "Run workflow"

## 📁 GitHub Actions Workflows

### `vercel-deploy.yml`
- **Trigger**: Push to main branch or manual
- **Function**: Deploys changed apps automatically
- **Features**:
  - Detects changed apps
  - Parallel deployments
  - Updates staff portal router
  - Deployment notifications

### `deploy-single-app.yml`
- **Trigger**: Manual only
- **Function**: Deploy one specific app
- **Features**:
  - Choose app from dropdown
  - Production or preview deployment
  - Quick targeted deployments

## 🔧 Common Operations

### Deploy After Bug Fix

```bash
# Fix bug in inventory app
cd apps/inventory
# ... make fixes ...
git add .
git commit -m "fix: inventory barcode scanning issue"
git push origin main

# GitHub Actions automatically deploys just inventory app
```

### Add New Environment Variable

```bash
# 1. Add to .env file
echo "NEW_VAR=value" >> .env

# 2. Add to all Vercel projects
cd apps/inventory
echo "value" | vercel env add NEW_VAR production

# 3. Add to GitHub Secrets
gh secret set NEW_VAR --body "value"
```

### Update Staff Portal Routes

If deployment URLs change:

```bash
# Create deployment-urls.txt with format:
# app-name=https://deployment-url.vercel.app

# Update staff portal
node scripts/update-vercel-rewrites.js deployment-urls.txt
cd apps/staff && vercel --prod
```

## 📊 Monitoring Deployments

### GitHub Actions
- Go to Actions tab in GitHub
- View real-time deployment progress
- Check logs for any errors

### Vercel Dashboard
- View all deployments
- Check function logs
- Monitor performance

## 🚨 Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure build commands work locally

### Environment Variables Missing
1. Check Vercel project settings
2. Re-run `setup-vercel-env.sh`
3. Verify secrets in GitHub

### Staff Portal Routes 404
1. Check vercel.json rewrites
2. Ensure app is deployed
3. Verify deployment URL is correct

## 🎯 Best Practices

1. **Test Locally First**: Always run `pnpm build:app-name` before pushing
2. **Use Preview Deployments**: Test changes in preview before production
3. **Monitor First Deployment**: Watch logs during initial rollout
4. **Keep Secrets Secure**: Never commit tokens or secrets
5. **Document Changes**: Update this guide as process evolves

## 📝 Rollback Procedure

If something goes wrong:

### Single App Rollback
```bash
# In Vercel Dashboard
# 1. Go to project
# 2. Click on previous deployment
# 3. Click "Promote to Production"
```

### GitHub Actions Rollback
```bash
# Revert the commit
git revert HEAD
git push origin main

# This triggers new deployment with previous code
```

---

## Quick Reference Commands

```bash
# Initial setup
./scripts/remove-vercel-projects.sh
./scripts/setup-vercel-projects.sh
./scripts/setup-vercel-env.sh

# Manual deployment
# Use GitHub Actions UI → Deploy Single App

# Check deployment status
# GitHub Actions tab → View workflows

# Update environment variable
vercel env add KEY_NAME production
```

Remember: After initial setup, everything is automated! Just push to main branch and deployments happen automatically.