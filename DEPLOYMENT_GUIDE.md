# Ganger Platform Deployment Guide

## 🎯 Current Deployment Status

As of now, **auto-deploy is DISABLED** for all Vercel projects. This means:
- ✅ Pushing to GitHub will NOT trigger automatic deployments
- ✅ You have full control over when and what to deploy
- ✅ Deployments are triggered via GitHub Actions workflow

## 🚀 How to Deploy

### Option 1: GitHub Web Interface (Recommended)

1. Go to the [GitHub Actions page](https://github.com/acganger/ganger-platform/actions)
2. Click on **"Smart Sequential Deployment"** workflow
3. Click **"Run workflow"** button
4. Select your options:
   - **Deploy mode**: 
     - `changed-only` - Deploy only apps with changes
     - `sequential-all` - Deploy all 19 apps in order
     - `specific-apps` - Deploy specific apps you list
   - **Environment**: `production` or `preview`
   - **Apps to deploy**: (for specific-apps mode) e.g., `platform-dashboard,staff`
   - **Skip tests**: Check to skip tests (faster deployment)
5. Click **"Run workflow"**

### Option 2: Command Line (Requires GitHub Token)

```bash
# First, set your GitHub token (with 'repo' scope)
export GITHUB_TOKEN=your_github_personal_access_token

# Deploy only changed apps
./scripts/trigger-github-deployment.sh changed-only production

# Deploy all apps sequentially
./scripts/trigger-github-deployment.sh sequential-all production

# Deploy specific apps
./scripts/trigger-github-deployment.sh specific-apps production "platform-dashboard,staff"

# Deploy with tests skipped (faster)
./scripts/trigger-github-deployment.sh changed-only production "" true
```

### Option 3: Direct Vercel CLI (Single App)

For emergency single-app deployments:

```bash
cd apps/platform-dashboard
vercel deploy --prod --token=$VERCEL_TOKEN --scope=team_wpY7PcIsYQNnslNN39o7fWvS
```

## 📊 Monitoring Deployments

### View Active Deployments
1. Go to [Vercel Dashboard](https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS)
2. Or check GitHub Actions progress

### Check Deployment Status
```bash
# List recent deployments
curl -s "https://api.vercel.com/v6/deployments?teamId=team_wpY7PcIsYQNnslNN39o7fWvS&limit=10" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -m json.tool
```

## 🔄 Deployment Workflow Features

The GitHub Actions workflow provides:
- **Change detection**: Automatically detects which apps have changes
- **Sequential deployment**: Deploys one app at a time to avoid overload
- **Test integration**: Runs tests before deployment (optional)
- **Smoke tests**: Verifies each deployment is accessible
- **Deployment summary**: Shows results in GitHub Actions summary

## ⚡ Quick Reference

### Deploy After Code Changes
```bash
# 1. Make your changes
# 2. Commit and push
git add .
git commit -m "feat: your changes"
git push

# 3. Trigger deployment (choose one)
# Via GitHub UI: Actions → Smart Sequential Deployment → Run workflow
# Via CLI: ./scripts/trigger-github-deployment.sh changed-only production
```

### Deploy Everything
```bash
# Via GitHub UI: Select "sequential-all" mode
# Via CLI: ./scripts/trigger-github-deployment.sh sequential-all production
```

### Deploy Specific Apps
```bash
# Via GitHub UI: Select "specific-apps" mode and list apps
# Via CLI: ./scripts/trigger-github-deployment.sh specific-apps production "app1,app2,app3"
```

## 🚨 Important Notes

1. **No Auto-Deploy**: Remember, pushing to GitHub does NOT deploy automatically anymore
2. **Manual Control**: You must explicitly trigger deployments
3. **Remote Caching**: Even if all apps rebuild, remote caching makes it faster
4. **Preview Deployments**: Use `preview` environment for testing

## 🛟 Troubleshooting

### Deployment Not Starting
- Check GitHub Actions page for workflow runs
- Verify your GitHub token has 'repo' scope
- Ensure you're on the main branch

### Build Failures
- Check Vercel dashboard for detailed logs
- Most common: Missing environment variables
- Run tests locally first: `pnpm test`

### Slow Deployments
- Enable remote caching (see REMOTE_CACHING_SETUP.md)
- Skip tests for faster deployment (use carefully)

---

*Last Updated: December 30, 2024*
*Auto-deploy disabled for all projects to enable controlled deployments*