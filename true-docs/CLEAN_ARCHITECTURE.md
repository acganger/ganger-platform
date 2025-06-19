# 🚀 Clean Architecture Documentation

## Overview

The Ganger Platform has been simplified from 21+ Cloudflare Workers to just **5 Workers** with automatic route assignment and 5-minute deployments.

## Architecture Design

### 5-Worker Structure

1. **Medical Worker** (`ganger-medical-production`)
   - Routes: `/inventory/*`, `/handouts/*`, `/meds/*`, `/kiosk/*`
   - Purpose: All medical-related applications
   - Status: ✅ DEPLOYED AND WORKING

2. **Business Worker** (`ganger-business-production`)
   - Routes: `/l10/*`, `/compliance/*`, `/staffing/*`, `/socials/*`
   - Purpose: Business operations and management
   - Status: 🔄 Ready to deploy (conflicts with old workers)

3. **Core Worker** (`ganger-core-production`)
   - Routes: `/`, `/dashboard/*`, `/config/*`, `/status/*`, `/admin/*`, etc.
   - Purpose: Main platform and administrative functions
   - Status: 📋 Ready to deploy

4. **Portal Worker** (`ganger-portal-production`)
   - Routes: `handouts.gangerdermatology.com/*`, `kiosk.*.com/*`, etc.
   - Purpose: External patient-facing domains
   - Status: 📋 Ready to deploy

5. **API Worker** (`ganger-api-production`)
   - Routes: `api.gangerdermatology.com/*`, `/api/*`
   - Purpose: Centralized API gateway
   - Status: 📋 Ready to deploy

## Configuration

All workers use `wrangler.jsonc` format with:
- Compatibility date: `2025-03-07`
- Node.js compatibility enabled
- Observability enabled
- Automatic route assignment

Example configuration:
```jsonc
{
  "name": "ganger-medical",
  "main": "index.js",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "env": {
    "production": {
      "routes": [
        {
          "pattern": "staff.gangerdermatology.com/inventory/*",
          "zone_name": "gangerdermatology.com"
        }
      ]
    }
  }
}
```

## Deployment Process

### Quick Deploy
```bash
cd clean-architecture
export CLOUDFLARE_API_TOKEN="your-token"
./deploy-all.sh
```

### Individual Worker Deploy
```bash
cd clean-architecture/medical
npx wrangler deploy --env production
```

### Verify Deployment
```bash
./verify-deployment.sh
```

## Benefits

| Aspect | Old (21+ Workers) | New (5 Workers) |
|--------|-------------------|-----------------|
| Workers | 21+ | 5 |
| Deployment Time | 45-60 minutes | 5 minutes |
| Route Assignment | Manual | Automatic |
| Debugging | Complex | Simple |
| Conflicts | Frequent | None |

## Current Status

- ✅ **Medical Worker**: Deployed and working perfectly
  - All routes responding with dynamic content
  - Subroutes functioning correctly
  - No manual configuration needed

- 🔄 **Other Workers**: Ready but blocked by old worker conflicts
  - Need to delete old workers first
  - All code tested and ready

## Migration Path

1. **Phase 1**: Deploy new workers (Medical done ✅)
2. **Phase 2**: Test in parallel (Currently here)
3. **Phase 3**: Delete old workers systematically
4. **Phase 4**: Complete deployment of remaining workers

## Worker Capacity

Each worker can handle:
- 100,000+ requests/second
- 10MB compressed size
- 128MB memory
- Global edge deployment

Your load: ~1,000 requests/minute = **<1% capacity usage**

## Best Practices

1. **No Manual Route Assignment**: Routes are in `wrangler.jsonc`
2. **Dynamic Content**: All responses include timestamps
3. **Error Handling**: Comprehensive try/catch blocks
4. **Observability**: Built-in monitoring enabled
5. **Security**: Environment variables for secrets

## Troubleshooting

### Common Issues

**Route Conflicts**: Old workers blocking new ones
- Solution: Delete old workers in Cloudflare dashboard

**Static Content**: Check for caching issues
- Solution: Workers generate timestamps on every request

**404 Errors**: Route not assigned
- Solution: Check wrangler.jsonc and redeploy

## Related Documentation

- [Migration Guide](../MIGRATION_TO_CLEAN_ARCHITECTURE.md)
- [Deployment Guide](../CLEAN_ARCHITECTURE_DEPLOYMENT.md)
- [Routing Details](../CLEAN_ARCHITECTURE_ROUTING.md)
- [Implementation Code](../clean-architecture/README.md)