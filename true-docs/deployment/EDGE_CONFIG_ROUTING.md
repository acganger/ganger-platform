# Edge Config Routing Architecture

## Overview

The Ganger Platform uses Vercel Edge Config to dynamically route requests from the main staff portal domain (`staff.gangerdermatology.com`) to individual Vercel app deployments. This solves the problem of hardcoded preview URLs and enables seamless navigation between all platform applications.

## Architecture

### Routing Pattern
- **Main Entry Point**: `staff.gangerdermatology.com`
- **App Access Pattern**: `staff.gangerdermatology.com/[app-name]`
- **Individual App Deployments**: `https://ganger-[app-name]-project.vercel.app`

### How It Works

1. **Request Flow**:
   - User visits `staff.gangerdermatology.com/inventory`
   - Middleware intercepts the request
   - Edge Config provides the mapping: `inventory → https://ganger-inventory-project.vercel.app`
   - Request is rewritten to the target app URL
   - User sees the inventory app while URL remains `staff.gangerdermatology.com/inventory`

2. **Middleware Location**: `apps/ganger-actions/middleware.ts`
   - This is the ONLY middleware in the entire platform
   - Handles all routing for the staff portal
   - Falls back to "coming soon" pages if app URL not found

3. **Authentication Pass-Through**:
   - Middleware checks for Supabase auth cookies
   - Adds `?sso=true` parameter when auth cookie is present
   - Enables seamless authentication across all apps

## Edge Config Structure

```json
{
  "appUrls": {
    "inventory": "https://ganger-inventory-project.vercel.app",
    "handouts": "https://ganger-handouts-project.vercel.app",
    "l10": "https://ganger-eos-l10-project.vercel.app",
    "eos-l10": "https://ganger-eos-l10-project.vercel.app",
    "batch": "https://ganger-batch-closeout-project.vercel.app",
    "batch-closeout": "https://ganger-batch-closeout-project.vercel.app",
    "compliance": "https://ganger-compliance-training-project.vercel.app",
    "compliance-training": "https://ganger-compliance-training-project.vercel.app",
    "clinical-staffing": "https://ganger-clinical-staffing-project.vercel.app",
    "config": "https://ganger-config-dashboard-project.vercel.app",
    "config-dashboard": "https://ganger-config-dashboard-project.vercel.app",
    "status": "https://ganger-integration-status-project.vercel.app",
    "integration-status": "https://ganger-integration-status-project.vercel.app",
    "ai-receptionist": "https://ganger-ai-receptionist-project.vercel.app",
    "call-center": "https://ganger-call-center-ops-project.vercel.app",
    "call-center-ops": "https://ganger-call-center-ops-project.vercel.app",
    "medication-auth": "https://ganger-medication-auth-project.vercel.app",
    "pharma": "https://ganger-pharma-scheduling-project.vercel.app",
    "pharma-scheduling": "https://ganger-pharma-scheduling-project.vercel.app",
    "lunch": "https://ganger-pharma-scheduling-project.vercel.app",
    "kiosk": "https://ganger-checkin-kiosk-project.vercel.app",
    "checkin-kiosk": "https://ganger-checkin-kiosk-project.vercel.app",
    "socials": "https://ganger-socials-reviews-project.vercel.app",
    "socials-reviews": "https://ganger-socials-reviews-project.vercel.app",
    "component-showcase": "https://ganger-component-showcase-project.vercel.app",
    "components": "https://ganger-component-showcase-project.vercel.app",
    "platform-dashboard": "https://ganger-platform-dashboard-project.vercel.app"
  }
}
```

## URL Mappings

### Staff Portal Routes → Vercel Apps

| Route | Maps To | App |
|-------|---------|-----|
| `/inventory` | `ganger-inventory-project.vercel.app` | Medical supply tracking |
| `/handouts` | `ganger-handouts-project.vercel.app` | Patient education materials |
| `/l10`, `/eos-l10` | `ganger-eos-l10-project.vercel.app` | EOS L10 meetings |
| `/batch`, `/batch-closeout` | `ganger-batch-closeout-project.vercel.app` | Financial batch processing |
| `/compliance`, `/compliance-training` | `ganger-compliance-training-project.vercel.app` | Staff training |
| `/clinical-staffing` | `ganger-clinical-staffing-project.vercel.app` | Provider scheduling |
| `/config`, `/config-dashboard` | `ganger-config-dashboard-project.vercel.app` | Platform configuration |
| `/status`, `/integration-status` | `ganger-integration-status-project.vercel.app` | Integration monitoring |
| `/ai-receptionist` | `ganger-ai-receptionist-project.vercel.app` | AI phone agent |
| `/call-center`, `/call-center-ops` | `ganger-call-center-ops-project.vercel.app` | Call center dashboard |
| `/medication-auth` | `ganger-medication-auth-project.vercel.app` | Prior authorization |
| `/pharma`, `/pharma-scheduling`, `/lunch` | `ganger-pharma-scheduling-project.vercel.app` | Pharma rep scheduling |
| `/kiosk`, `/checkin-kiosk` | `ganger-checkin-kiosk-project.vercel.app` | Patient check-in |
| `/socials`, `/socials-reviews` | `ganger-socials-reviews-project.vercel.app` | Review management |
| `/components`, `/component-showcase` | `ganger-component-showcase-project.vercel.app` | UI library |
| `/platform-dashboard` | `ganger-platform-dashboard-project.vercel.app` | System overview |

## Configuration Steps

1. **Create Edge Config**:
   - Name: `202507-1` (matches the environment variable)
   - Add to the `ganger-staff` project
   - Populate with the appUrls object above

2. **Environment Variable**:
   - The staff portal expects: `EDGE_CONFIG_202507_1`
   - This is automatically set when Edge Config is connected to the project

3. **Fallback Behavior**:
   - If Edge Config fails, middleware falls back to local mappings
   - Shows "coming soon" page for unmapped routes
   - Preserves the requested app name in query parameters

## Benefits

1. **Dynamic Updates**: Change app URLs without redeploying the staff portal
2. **Zero Downtime**: Update routes instantly via Edge Config
3. **Consistent URLs**: Users always see `staff.gangerdermatology.com/[app]`
4. **Preview Support**: Easy to point to preview deployments for testing
5. **SSO Support**: Authentication cookies passed between apps automatically

## Troubleshooting

1. **App Not Loading**:
   - Check Edge Config has the correct URL mapping
   - Verify the target app is deployed and accessible
   - Check browser console for CORS or redirect issues

2. **Authentication Issues**:
   - Ensure the Supabase auth cookie name matches in middleware
   - Verify the `?sso=true` parameter is being added
   - Check that target apps handle SSO parameter correctly

3. **Edge Config Not Working**:
   - Verify `EDGE_CONFIG_202507_1` environment variable is set
   - Check Edge Config is attached to the `ganger-staff` project
   - Review middleware logs in Vercel Functions tab

## Future Enhancements

1. **A/B Testing**: Route percentage of traffic to preview deployments
2. **Feature Flags**: Enable/disable apps via Edge Config
3. **Custom Domains**: Support for app-specific domains while maintaining central routing
4. **Load Balancing**: Distribute traffic across multiple deployments

*Last Updated: January 7, 2025*