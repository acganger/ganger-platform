# 🚀 Clean Architecture Deployment Guide

## Overview

This guide covers deploying the simplified Ganger Platform using just **5 Cloudflare Workers** instead of 21+. The entire deployment process takes approximately **5 minutes**.

## Prerequisites

- Cloudflare account with access to gangerdermatology.com zone
- Wrangler CLI installed (`npm install -g wrangler`)
- Node.js 18+ installed
- Git repository cloned locally

## Quick Start

### 1. Deploy All Workers (Recommended)
```bash
cd clean-architecture
./deploy-all.sh
```

This script will:
1. Deploy Medical Worker
2. Deploy Business Worker
3. Deploy Core Worker
4. Deploy Portal Worker
5. Deploy API Worker

### 2. Verify Deployment
```bash
./verify-deployment.sh
```

## Individual Worker Deployment

### Deploy Medical Worker
```bash
cd clean-architecture/medical
npx wrangler deploy --env production
```

### Deploy Business Worker
```bash
cd clean-architecture/business
npx wrangler deploy --env production
```

### Deploy Core Worker
```bash
cd clean-architecture/core
npx wrangler deploy --env production
```

### Deploy Portal Worker
```bash
cd clean-architecture/portal
npx wrangler deploy --env production
```

### Deploy API Worker
```bash
cd clean-architecture/api
npx wrangler deploy --env production
```

## Configuration Files

Each worker uses `wrangler.jsonc` (JSON with Comments):

```jsonc
{
  // Worker configuration
  "name": "ganger-medical",
  "main": "index.js",
  "compatibility_date": "2025-03-07",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "env": {
    "production": {
      "name": "ganger-medical-production",
      "routes": [
        // Routes are automatically assigned
        {
          "pattern": "staff.gangerdermatology.com/inventory/*",
          "zone_name": "gangerdermatology.com"
        }
      ],
      "vars": {
        // Environment variables
        "SUPABASE_URL": "https://pfqtzmxxxhhsxmlddrta.supabase.co"
      }
    }
  }
}
```

## Environment Variables

### Required Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (API worker only)
- `STRIPE_PUBLISHABLE_KEY`: Stripe public key
- `STRIPE_SECRET_KEY`: Stripe secret key (API worker only)
- `TWILIO_ACCOUNT_SID`: Twilio account ID (API worker only)
- `TWILIO_AUTH_TOKEN`: Twilio auth token (API worker only)

### Setting Secrets
```bash
# Set secrets for production
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put TWILIO_AUTH_TOKEN --env production
```

## Deployment Checklist

### Pre-Deployment
- [ ] Code committed and pushed to Git
- [ ] Environment variables verified
- [ ] Local testing completed
- [ ] Previous deployment backed up

### Deployment Steps
- [ ] Run `./deploy-all.sh`
- [ ] Monitor deployment output
- [ ] Note any warnings or errors
- [ ] Verify routes are assigned

### Post-Deployment
- [ ] Run `./verify-deployment.sh`
- [ ] Test each major route
- [ ] Check dynamic content generation
- [ ] Monitor worker analytics

## Monitoring Deployment

### Real-time Logs
```bash
# Monitor specific worker
wrangler tail ganger-medical-production

# Monitor all workers (in separate terminals)
wrangler tail ganger-medical-production
wrangler tail ganger-business-production
wrangler tail ganger-core-production
wrangler tail ganger-portal-production
wrangler tail ganger-api-production
```

### Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com/
2. Select your account
3. Navigate to Workers & Pages
4. View each worker's:
   - Analytics
   - Logs
   - Errors
   - Performance metrics

## Troubleshooting

### Deployment Fails

**Error: "Script not found"**
```bash
# Ensure you're in the correct directory
cd clean-architecture/medical
# Check index.js exists
ls -la index.js
```

**Error: "Route already exists"**
```bash
# Old worker might still have the route
# Check Cloudflare dashboard and remove old workers
```

**Error: "Authentication required"**
```bash
# Login to Wrangler
wrangler login
```

### Routes Not Working

**Check Route Assignment**
```bash
# Deployment output should show:
✅ Routes assigned:
  - staff.gangerdermatology.com/inventory/*
  
# If it shows:
⚠️ Route assignment required manually
# Then there's an issue with the configuration
```

**Verify in Dashboard**
1. Go to worker in Cloudflare dashboard
2. Check "Routes" tab
3. Ensure routes are listed

### Performance Issues

**Check Worker Metrics**
- CPU time: Should be < 50ms
- Memory: Should be < 128MB
- Errors: Should be < 0.1%

**Enable Detailed Logging**
```javascript
export default {
  async fetch(request, env, ctx) {
    console.log('Request:', request.url);
    // ... rest of code
  }
}
```

## Rollback Procedure

### Quick Rollback
```bash
# Cloudflare keeps 10 previous deployments
# In dashboard: Worker → Deployments → Select previous → Promote
```

### Manual Rollback
```bash
# Checkout previous commit
git checkout <previous-commit-hash>

# Redeploy
cd clean-architecture
./deploy-all.sh
```

## Best Practices

### 1. Always Test First
```bash
# Test locally with Miniflare
npx wrangler dev
```

### 2. Deploy During Low Traffic
- Best times: Early morning or late evening
- Avoid: Monday mornings, lunch hours

### 3. Monitor After Deployment
- Watch logs for 5-10 minutes
- Check error rates
- Verify key functionality

### 4. Use Staging Environment
```bash
# Deploy to staging first
npx wrangler deploy --env staging

# Test at staging URLs
# Then deploy to production
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
        run: |
          cd clean-architecture
          ./deploy-all.sh
```

## Performance Optimization

### 1. Enable Caching
```javascript
// Cache responses for 5 minutes
return new Response(html, {
  headers: {
    'Content-Type': 'text/html',
    'Cache-Control': 'public, max-age=300'
  }
});
```

### 2. Use Smart Placement
```jsonc
{
  "placement": {
    "mode": "smart"
  }
}
```

### 3. Minimize Cold Starts
- Keep worker code small
- Lazy load heavy dependencies
- Use proper bundling

## Security Considerations

### 1. Never Hardcode Secrets
```javascript
// Bad
const apiKey = "sk_test_123...";

// Good
const apiKey = env.STRIPE_SECRET_KEY;
```

### 2. Validate Input
```javascript
// Always validate user input
if (!request.headers.get('Authorization')) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 3. Use CORS Headers
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

## Deployment Metrics

### Expected Performance
- **Deployment time**: 5 minutes total
- **Cold start**: < 5ms
- **Response time**: < 50ms
- **Global availability**: 300+ locations
- **Uptime**: 99.99%

### Resource Usage
- **CPU**: < 10ms average
- **Memory**: < 50MB average
- **Bandwidth**: Unlimited
- **Requests**: 100M included

## Support and Resources

### Documentation
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- This guide: `/CLEAN_ARCHITECTURE_DEPLOYMENT.md`

### Getting Help
1. Check worker logs first
2. Review error messages
3. Verify configuration
4. Check Cloudflare status page
5. Contact support if needed

---

**Remember**: The clean architecture makes deployment simple and fast. No more 45-60 minute deployment marathons!