# Gateway Architecture Migration Plan

**Date**: December 30, 2024  
**Issue**: Staff Portal's hardcoded Vercel preview URLs break on every deployment  
**Solution**: Migrate to dynamic gateway architecture with Vercel Edge Config

## Current Architecture Problems

### 1. Hardcoded Preview URLs Break on Deployment
The staff portal's `vercel.json` contains 17 hardcoded rewrites pointing to Vercel preview URLs:
```json
{
  "source": "/inventory/:path*",
  "destination": "https://ganger-inventory-anand-gangers-projects.vercel.app/:path*"
}
```

**Problem**: These URLs change with every deployment, making production deployment impossible.

### 2. SSO Cookie Domain Challenge
- Current setup: Individual apps at `app-name-[hash].vercel.app`
- Required: Seamless SSO across all apps via `staff.gangerdermatology.com`
- Issue: Cookies can't be shared across different `.vercel.app` domains

### 3. Build Time Issues
- Staff app builds take 4+ minutes (vs 2 minutes for others)
- Caused by: googleapis dependency (144MB+) and duplicate middleware

## New Gateway Architecture

### Overview
Transform the staff portal from a static router to a dynamic gateway using Vercel Edge Config and Middleware.

```
User Flow:
1. User visits: staff.gangerdermatology.com/inventory
2. Middleware reads Edge Config for current inventory URL
3. Request proxied to: inventory-[latest].vercel.app/inventory
4. User sees: staff.gangerdermatology.com/inventory (URL preserved)
```

### Key Components

#### 1. Vercel Edge Config
Stores dynamic URL mappings for all apps:
```json
{
  "appUrls": {
    "inventory": "https://inventory-latest.vercel.app",
    "handouts": "https://handouts-latest.vercel.app",
    "eos-l10": "https://eos-l10-latest.vercel.app",
    // ... all 17 apps
  }
}
```

#### 2. Staff Portal Middleware
Replace static `vercel.json` rewrites with dynamic `middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);
  
  // Get app mappings from Edge Config
  const appUrls = await get<Record<string, string>>('appUrls');
  
  // Route based on path
  for (const [appPath, appUrl] of Object.entries(appUrls || {})) {
    if (pathname.startsWith(`/${appPath}`)) {
      const targetUrl = new URL(pathname, appUrl);
      return NextResponse.rewrite(targetUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/inventory/:path*',
    '/handouts/:path*',
    '/l10/:path*',
    '/batch/:path*',
    '/compliance/:path*',
    '/clinical-staffing/:path*',
    '/config/:path*',
    '/status/:path*',
    '/ai-receptionist/:path*',
    '/call-center/:path*',
    '/medication-auth/:path*',
    '/pharma/:path*',
    '/lunch/:path*',
    '/kiosk/:path*',
    '/socials/:path*',
    '/component-showcase/:path*',
    '/platform-dashboard/:path*'
  ]
};
```

#### 3. App basePath Configuration
Each app must be configured to serve from its subpath:

**Example for inventory app** (`apps/inventory/next.config.js`):
```javascript
module.exports = {
  basePath: '/inventory',
  // ... existing config
};
```

#### 4. SSO Configuration Update

**Supabase Cookie Domain** (`packages/auth/src/lib/supabase.ts`):
```typescript
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        domain: '.gangerdermatology.com', // Enable cross-subdomain cookies
        secure: true,
        sameSite: 'lax'
      }
    }
  );
};
```

## Implementation Steps

### Phase 1: Setup Infrastructure
1. Create Vercel Edge Config Store
2. Populate with current app URLs
3. Grant staff portal read access to Edge Config

### Phase 2: Update Staff Portal
1. Remove all rewrites from `vercel.json`
2. Create `middleware.ts` with dynamic routing
3. Remove duplicate `middleware.ts.disabled`
4. Remove googleapis dependency (if not needed)

### Phase 3: Configure Apps (Sequential)
For each of the 17 apps:
1. Add `basePath` to `next.config.js`
2. Test app works with basePath locally
3. Deploy and update Edge Config with new URL

### Phase 4: SSO Updates
1. Update Supabase client configuration for cookie domain
2. Test authentication flow across apps
3. Verify session persistence

## Benefits

1. **Stable Production URLs**: Users always see `staff.gangerdermatology.com/[app]`
2. **Dynamic Updates**: Change app URLs without redeploying staff portal
3. **Seamless SSO**: Cookies shared across `.gangerdermatology.com` domain
4. **Faster Builds**: Staff portal becomes lightweight gateway
5. **Independent Deployments**: Apps deploy without affecting routing

## Testing Plan

1. **Local Testing**:
   - Set up Edge Config with local URLs
   - Test middleware routing locally
   - Verify basePath configuration

2. **Staging Testing**:
   - Deploy one app (e.g., inventory) with new setup
   - Verify routing through staff portal
   - Test SSO flow

3. **Production Rollout**:
   - Sequential migration of all apps
   - Update Edge Config after each deployment
   - Monitor for issues

## Rollback Plan

If issues arise:
1. Revert to static `vercel.json` rewrites (temporary)
2. Remove basePath from affected apps
3. Investigate and fix issues
4. Resume migration

## Success Criteria

- [ ] All apps accessible via `staff.gangerdermatology.com/[path]`
- [ ] SSO works seamlessly across all apps
- [ ] Staff portal build time < 2 minutes
- [ ] No hardcoded URLs in routing configuration
- [ ] Apps can be deployed independently

## Notes

- This architecture aligns with Vercel's micro-frontend best practices
- Existing `@ganger/auth` package already supports cross-app SSO
- No changes needed to individual app authentication logic
- Focus on routing and cookie configuration only