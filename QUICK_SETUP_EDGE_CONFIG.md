# Quick Setup - Edge Config (2 minutes)

## Step 1: Create Edge Config Store

1. Go to: https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS/stores
2. Click "Create Store"
3. Name: `ganger-platform-app-urls`
4. Click "Create"

## Step 2: Add Initial Data

Copy and paste this JSON into the Edge Config:

```json
{
  "appUrls": {
    "inventory": "https://ganger-inventory-anand-gangers-projects.vercel.app",
    "handouts": "https://ganger-handouts-anand-gangers-projects.vercel.app",
    "l10": "https://ganger-eos-l10-anand-gangers-projects.vercel.app",
    "batch": "https://ganger-batch-closeout-anand-gangers-projects.vercel.app",
    "compliance": "https://ganger-compliance-training-anand-gangers-projects.vercel.app",
    "clinical-staffing": "https://ganger-clinical-staffing-anand-gangers-projects.vercel.app",
    "config": "https://ganger-config-dashboard-anand-gangers-projects.vercel.app",
    "status": "https://ganger-integration-status-anand-gangers-projects.vercel.app",
    "ai-receptionist": "https://ganger-ai-receptionist-anand-gangers-projects.vercel.app",
    "call-center": "https://ganger-call-center-ops-anand-gangers-projects.vercel.app",
    "medication-auth": "https://ganger-medication-auth-anand-gangers-projects.vercel.app",
    "pharma": "https://ganger-pharma-scheduling-anand-gangers-projects.vercel.app",
    "kiosk": "https://ganger-checkin-kiosk-anand-gangers-projects.vercel.app",
    "socials": "https://ganger-socials-reviews-anand-gangers-projects.vercel.app",
    "component-showcase": "https://ganger-component-showcase-anand-gangers-projects.vercel.app",
    "platform-dashboard": "https://ganger-platform-dashboard-anand-gangers-projects.vercel.app"
  }
}
```

## Step 3: Connect to Staff App

1. Copy the connection string (starts with `https://edge-config.vercel.com/...`)
2. Go to: https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS/ganger-staff/settings/environment-variables
3. Add new variable:
   - Key: `EDGE_CONFIG`
   - Value: [paste connection string]
   - Target: Production, Preview, Development
4. Click "Save"

## Step 4: Monitor Deployments

Staff app should be deploying automatically now.

Check status at: https://vercel.com/team_wpY7PcIsYQNnslNN39o7fWvS/ganger-staff

Once deployed, test:
1. https://staff.gangerdermatology.com (should load)
2. https://staff.gangerdermatology.com/inventory (should show coming soon until inventory deploys)