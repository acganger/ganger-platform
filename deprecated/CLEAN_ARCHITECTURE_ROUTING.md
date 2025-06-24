# 🎯 Clean Architecture Routing Documentation

## Overview

The Ganger Platform has been simplified from 21+ workers to just **5 workers**, each handling a logical group of applications. This document describes the routing architecture and how traffic flows through the platform.

## Worker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  staff.gangerdermatology.com/*                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Medical Worker  │  │Business Worker│  │ Core Worker   │ │
│  │ /inventory/*    │  │ /l10/*       │  │ / (root)      │ │
│  │ /handouts/*     │  │ /compliance/* │  │ /dashboard/*  │ │
│  │ /meds/*         │  │ /staffing/*   │  │ /config/*     │ │
│  │ /kiosk/*        │  │ /socials/*    │  │ /admin/*      │ │
│  └─────────────────┘  └──────────────┘  │ /status/*     │ │
│                                          │ /ai-reception*│ │
│                                          │ /call-center/*│ │
│                                          │ /reps/*       │ │
│                                          │ /showcase/*   │ │
│                                          │ /batch/*      │ │
│                                          └───────────────┘ │
│                                                             │
│  External Domains                        API Gateway        │
│  ┌─────────────────┐                    ┌───────────────┐ │
│  │ Portal Worker   │                    │ API Worker    │ │
│  │ handouts.*.com  │                    │ api.*.com/*   │ │
│  │ kiosk.*.com     │                    │ /api/*        │ │
│  │ meds.*.com      │                    └───────────────┘ │
│  │ reps.*.com      │                                       │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

## Route Precedence

Cloudflare Workers use the following precedence rules:
1. **Exact routes** win over wildcards
2. **Longer patterns** win over shorter patterns
3. **More specific** wins over less specific

### Example Route Resolution

Request: `https://staff.gangerdermatology.com/inventory/barcode-scan`

1. ✅ Matches: `staff.gangerdermatology.com/inventory/*` (Medical Worker)
2. ❌ Does not match: `staff.gangerdermatology.com/*` (Core Worker)
3. **Result**: Handled by Medical Worker

## Worker Details

### 1. Medical Worker (`ganger-medical-production`)

**Purpose**: All medical-related applications

**Routes**:
- `staff.gangerdermatology.com/inventory`
- `staff.gangerdermatology.com/inventory/*`
- `staff.gangerdermatology.com/handouts`
- `staff.gangerdermatology.com/handouts/*`
- `staff.gangerdermatology.com/meds`
- `staff.gangerdermatology.com/meds/*`
- `staff.gangerdermatology.com/kiosk`
- `staff.gangerdermatology.com/kiosk/*`

**Subroutes**:
```
/inventory
├── /barcode-scan    # Barcode scanning interface
├── /stock-levels    # Current inventory levels
└── /reports         # Inventory reports

/handouts
├── /generate        # Create new handouts
├── /qr-scan        # QR code scanner
└── /library        # Handout library

/meds
├── /authorize      # Medication authorizations
└── /history        # Authorization history

/kiosk
├── /settings       # Kiosk configuration
└── /analytics      # Kiosk usage analytics
```

### 2. Business Worker (`ganger-business-production`)

**Purpose**: Business operations and management tools

**Routes**:
- `staff.gangerdermatology.com/l10`
- `staff.gangerdermatology.com/l10/*`
- `staff.gangerdermatology.com/compliance`
- `staff.gangerdermatology.com/compliance/*`
- `staff.gangerdermatology.com/staffing`
- `staff.gangerdermatology.com/staffing/*`
- `staff.gangerdermatology.com/socials`
- `staff.gangerdermatology.com/socials/*`

**Subroutes**:
```
/l10
├── /compass        # EOS vision/traction
├── /rocks          # Quarterly priorities
├── /scorecard      # Weekly metrics
└── /issues         # IDS issue list

/compliance
├── /dashboard      # Compliance overview
├── /courses        # Training courses
└── /reports        # Compliance reports

/staffing
├── /schedule-builder # Create schedules
├── /requests        # Time-off requests
└── /analytics       # Staffing metrics

/socials
├── /dashboard      # Social media overview
├── /respond        # Respond to reviews
└── /analytics      # Social analytics
```

### 3. Core Worker (`ganger-core-production`)

**Purpose**: Main platform dashboard and administrative functions

**Routes**:
- `staff.gangerdermatology.com` (root)
- `staff.gangerdermatology.com/`
- `staff.gangerdermatology.com/dashboard`
- `staff.gangerdermatology.com/dashboard/*`
- `staff.gangerdermatology.com/config`
- `staff.gangerdermatology.com/config/*`
- `staff.gangerdermatology.com/status`
- `staff.gangerdermatology.com/status/*`
- `staff.gangerdermatology.com/admin`
- `staff.gangerdermatology.com/admin/*`
- `staff.gangerdermatology.com/ai-receptionist`
- `staff.gangerdermatology.com/ai-receptionist/*`
- `staff.gangerdermatology.com/call-center`
- `staff.gangerdermatology.com/call-center/*`
- `staff.gangerdermatology.com/reps`
- `staff.gangerdermatology.com/reps/*`
- `staff.gangerdermatology.com/showcase`
- `staff.gangerdermatology.com/showcase/*`
- `staff.gangerdermatology.com/batch`
- `staff.gangerdermatology.com/batch/*`

**Subroutes**:
```
/ (root)            # Main dashboard

/config
├── /settings       # Platform settings
└── /integrations   # Service integrations

/admin
├── /users          # User management
└── /security       # Security settings

/reps
└── /schedule       # Rep visit scheduling
```

### 4. Portal Worker (`ganger-portal-production`)

**Purpose**: External patient-facing domains

**Routes**:
- `handouts.gangerdermatology.com/*`
- `kiosk.gangerdermatology.com/*`
- `meds.gangerdermatology.com/*`
- `reps.gangerdermatology.com/*`

**Domain Handling**:
```
handouts.gangerdermatology.com
├── /                # Main portal
└── /qr/{code}       # QR code redirects

kiosk.gangerdermatology.com
├── /                # Kiosk home
└── /checkin         # Check-in flow

meds.gangerdermatology.com
├── /                # Med portal home
└── /request         # Authorization request

reps.gangerdermatology.com
├── /                # Rep portal home
└── /schedule        # Visit scheduling
```

### 5. API Worker (`ganger-api-production`)

**Purpose**: Centralized API gateway for all services

**Routes**:
- `api.gangerdermatology.com/*`
- `staff.gangerdermatology.com/api/*`

**API Endpoints**:
```
/health             # Health check
/auth/*             # Authentication
/patients/*         # Patient management
/appointments/*     # Appointment scheduling
/inventory/*        # Inventory API
/handouts/*         # Handout generation
/medications/*      # Med authorizations
/staff/*            # Staff management
/analytics/*        # Analytics data
/webhooks/*         # External webhooks
```

## Route Configuration

All routes are configured in `wrangler.jsonc` files with automatic assignment:

```jsonc
{
  "name": "ganger-medical",
  "main": "index.js",
  "compatibility_date": "2025-03-07",
  "env": {
    "production": {
      "routes": [
        {
          "pattern": "staff.gangerdermatology.com/inventory",
          "zone_name": "gangerdermatology.com"
        },
        {
          "pattern": "staff.gangerdermatology.com/inventory/*",
          "zone_name": "gangerdermatology.com"
        }
        // ... more routes
      ]
    }
  }
}
```

## Deployment Process

1. **Automatic Route Assignment**: Routes are assigned automatically during deployment
2. **No Manual Configuration**: Unlike the old system, no manual route assignment needed
3. **Precedence Handling**: Cloudflare automatically handles route precedence
4. **Zero Conflicts**: Clean separation prevents route conflicts

## Testing Routes

### Quick Test Commands
```bash
# Test medical routes
curl -I https://staff.gangerdermatology.com/inventory
curl -I https://staff.gangerdermatology.com/handouts

# Test business routes
curl -I https://staff.gangerdermatology.com/l10
curl -I https://staff.gangerdermatology.com/compliance

# Test core routes
curl -I https://staff.gangerdermatology.com/
curl -I https://staff.gangerdermatology.com/dashboard

# Test portal routes
curl -I https://handouts.gangerdermatology.com/
curl -I https://kiosk.gangerdermatology.com/

# Test API routes
curl -I https://api.gangerdermatology.com/health
```

### Verify Dynamic Content
```bash
# Check for timestamps (proves dynamic content)
curl -s https://staff.gangerdermatology.com/inventory | grep -o "20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]"
```

## Common Issues and Solutions

### Issue: Route Returns 404
**Solution**: Check that the worker is deployed and routes are in wrangler.jsonc

### Issue: Wrong Worker Handles Request
**Solution**: More specific routes always win. Check route patterns.

### Issue: Static Content Served
**Solution**: Ensure worker code generates dynamic content with timestamps

### Issue: Route Not Updating
**Solution**: Routes update immediately on deployment. Clear browser cache.

## Benefits of Clean Architecture

1. **Automatic Route Management**: No manual assignment needed
2. **Clear Separation**: Each worker has distinct responsibilities
3. **Easy Debugging**: Only 5 workers to check instead of 21+
4. **Fast Deployment**: 5 minutes instead of 45-60 minutes
5. **No Route Conflicts**: Clean separation prevents overlaps

## Migration from Old Architecture

The old system had:
- 21+ separate workers
- Manual route assignment required
- Frequent route conflicts
- Complex debugging
- 45-60 minute deployments

The new system has:
- 5 consolidated workers
- Automatic route assignment
- No route conflicts
- Simple debugging
- 5 minute deployments

---

**Remember**: The clean architecture makes routing simple and automatic. No more manual route assignment headaches!