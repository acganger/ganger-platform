# Staff App Split Architecture

## Overview

The Ganger Platform requires splitting the monolithic staff app into two distinct applications with clear responsibilities:

1. **`ganger-staff`** - Entry point and router only
2. **`ganger-actions`** - Employee functionality hub

## Current State (Incorrect)

The current split attempt resulted in the wrong distribution of functionality:

### ganger-actions (Currently Has Too Much)
- ✅ Employee pages (staff/, tickets/, dashboard)
- ❌ Middleware routing (should NOT be here)
- ❌ Coming soon pages (should NOT be here)

### ganger-staff (Currently Too Empty)
- ✅ Basic pages (index, auth, error pages)
- ❌ Missing middleware routing
- ❌ Not functioning as the platform router

## Target Architecture

### ganger-staff (Router Only)
**Deployed at**: `staff.gangerdermatology.com`

**Responsibilities**:
- Entry point for all users
- Middleware router using Edge Config
- Authentication flow (login/logout pages)
- Coming soon pages for undeployed apps
- Error pages (404, 500)
- Minimal index page with redirect logic

**Key Files**:
```
apps/ganger-staff/
├── middleware.ts          # Edge Config router - CRITICAL
├── src/
│   ├── pages/
│   │   ├── index.tsx     # Minimal landing/redirect
│   │   ├── auth/         # Login/logout/callback
│   │   ├── coming-soon.tsx
│   │   ├── 404.tsx
│   │   ├── 500.tsx
│   │   └── _app.tsx      # Minimal app wrapper
│   └── styles/           # Minimal styles
└── package.json          # Minimal dependencies
```

### ganger-actions (Employee Hub)
**Deployed at**: `ganger-actions-project.vercel.app`
**Accessed via**: `staff.gangerdermatology.com/actions`

**Responsibilities**:
- Main employee dashboard
- App launcher grid
- Legacy functionality (staff directory, tickets, time off, users)
- All employee-facing features

**Key Files**:
```
apps/ganger-actions/
├── src/
│   ├── pages/
│   │   ├── index.tsx     # Main dashboard/app launcher
│   │   ├── dashboard.tsx # Employee dashboard
│   │   ├── staff/        # Legacy pages
│   │   │   ├── directory.tsx
│   │   │   ├── tickets.tsx
│   │   │   ├── timeoff.tsx
│   │   │   └── users.tsx
│   │   ├── tickets/      # Ticket system
│   │   └── api/          # API routes
│   ├── components/       # All UI components
│   ├── lib/             # Business logic
│   └── hooks/           # React hooks
└── package.json         # Full dependencies
```

## Routing Flow

1. User visits `staff.gangerdermatology.com`
2. `ganger-staff` middleware checks the path:
   - `/` → Shows minimal landing page
   - `/actions/*` → Routes to `ganger-actions` app
   - `/inventory/*` → Routes to `ganger-inventory` app
   - `/handouts/*` → Routes to `ganger-handouts` app
   - etc.

## Edge Config Mapping

```json
{
  "appUrls": {
    "actions": "https://ganger-actions-project.vercel.app",
    "inventory": "https://ganger-inventory-project.vercel.app",
    "handouts": "https://ganger-handouts-project.vercel.app",
    // ... all other apps
  }
}
```

## Migration Steps

1. **Backup Current State**
   - ✅ Created `ganger-staff-reference` from milestone

2. **Rebuild ganger-staff as Router**
   - Move middleware from ganger-actions to ganger-staff
   - Remove all employee functionality
   - Keep only routing, auth, and error pages
   - Ensure Edge Config environment variable is set

3. **Rebuild ganger-actions as Employee Hub**
   - Remove middleware completely
   - Move all employee pages from reference
   - Ensure dashboard and app launcher work
   - Handle SSO parameter from router

4. **Test Routing**
   - Verify staff.gangerdermatology.com routes correctly
   - Test authentication flow
   - Ensure all apps are accessible

## Important Notes

1. **NO middleware in ganger-actions** - Only ganger-staff should have middleware
2. **Edge Config is critical** - Without it, routing won't work
3. **SSO parameter** - ganger-staff adds `?sso=true` when auth cookie exists
4. **Minimal dependencies** - ganger-staff should be as light as possible

*Last Updated: January 7, 2025*