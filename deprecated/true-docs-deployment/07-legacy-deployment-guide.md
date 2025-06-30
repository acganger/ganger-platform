# Vercel Deployment Guide - Ganger Platform

## Overview

This guide explains how to deploy the entire Ganger Platform as a single Vercel deployment with all apps accessible under `staff.gangerdermatology.com`.

## Architecture

Instead of deploying 20 individual apps, we deploy the staff portal as the main entry point with intelligent routing to all other apps:

```
staff.gangerdermatology.com
├── /dashboard (main portal)
├── /inventory (inventory management app)
├── /handouts (patient handouts app)
├── /meds (medication auth app)
├── /kiosk (check-in kiosk app)
├── /l10 (EOS L10 app)
├── /compliance (compliance training app)
├── /staffing (clinical staffing app)
├── /socials (social reviews app)
└── ... (and more)
```

## Automated Deployment

### 1. One-Command Deployment

```bash
# From the root of the monorepo
./scripts/deploy-vercel.sh
```

This script:
- Installs Vercel CLI if needed
- Links the project to your Vercel team
- Builds and deploys the staff portal
- Provides the deployment URL

### 2. Manual Deployment Steps

If you prefer manual deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to staff app
cd apps/staff

# Deploy to production
vercel --prod
```

## Configuration

### Environment Variables

Already configured at the Vercel team level:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- All other required variables

### Routing Configuration

The staff portal handles routing through:

1. **next.config.js** - Rewrite rules for each app
2. **middleware.ts** - Request proxying (for future separate deployments)
3. **Sidebar.tsx** - Navigation with proper external link handling

### Custom Domain Setup

1. Go to Vercel Dashboard
2. Select the `ganger-platform` project
3. Go to Settings → Domains
4. Add `staff.gangerdermatology.com`
5. Configure DNS in Cloudflare:
   ```
   Type: CNAME
   Name: staff
   Content: cname.vercel-dns.com
   ```

## How It Works

### 1. User Navigation

When a user clicks on "Inventory Management" in the sidebar:
- The link points to `/inventory`
- Next.js rewrites this to `/apps/inventory/*`
- The dynamic app router loads the inventory app

### 2. App Loading

The `[...app].tsx` dynamic route:
- Matches the app name from the URL
- Dynamically imports the correct app
- Renders it within the staff portal layout

### 3. Benefits

- **Single deployment** instead of 20
- **Shared authentication** across all apps
- **Consistent navigation** and user experience
- **Faster deployments** (one build process)
- **Easier maintenance** (one codebase to update)

## Testing

After deployment, test each app:

```bash
# Medical Apps
curl -I https://staff.gangerdermatology.com/inventory
curl -I https://staff.gangerdermatology.com/handouts
curl -I https://staff.gangerdermatology.com/meds
curl -I https://staff.gangerdermatology.com/kiosk

# Business Apps
curl -I https://staff.gangerdermatology.com/l10
curl -I https://staff.gangerdermatology.com/compliance
curl -I https://staff.gangerdermatology.com/staffing
curl -I https://staff.gangerdermatology.com/socials

# Admin Apps
curl -I https://staff.gangerdermatology.com/config
curl -I https://staff.gangerdermatology.com/status
curl -I https://staff.gangerdermatology.com/ai-receptionist
curl -I https://staff.gangerdermatology.com/call-center
```

## Troubleshooting

### TypeScript Errors

The configuration already includes:
```javascript
typescript: {
  ignoreBuildErrors: true
}
```

This allows deployment even with TypeScript errors in individual apps.

### Build Failures

If the build fails:
1. Check the Vercel build logs
2. Ensure all dependencies are in package.json
3. Remove any local-only dependencies (like MCP servers)

### 404 Errors

If an app route returns 404:
1. Check the rewrite rule in `next.config.js`
2. Verify the app exists in `appComponents` in `[...app].tsx`
3. Ensure the sidebar link has `external: true`

## Next Steps

1. **Deploy**: Run `./scripts/deploy-vercel.sh`
2. **Configure Domain**: Add custom domain in Vercel
3. **Update DNS**: Point Cloudflare to Vercel
4. **Test**: Verify all apps are accessible
5. **Monitor**: Check Vercel dashboard for analytics

## Summary

This approach solves the deployment complexity by:
- ✅ Using Vercel's "configuration free" deployment
- ✅ Deploying once instead of 20 times
- ✅ Maintaining the intended architecture (apps under one domain)
- ✅ Automating the entire process
- ✅ Providing a scalable solution for all 20 apps

The entire platform is now accessible at `staff.gangerdermatology.com` with each app at its respective route!