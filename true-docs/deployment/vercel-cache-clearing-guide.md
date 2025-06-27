# Vercel Cache Clearing Guide

## Overview
This guide provides multiple methods to clear Vercel's build cache, both manually and through automation.

## Method 1: CLI with --force Flag
The simplest way to bypass cache is using the `--force` flag:

```bash
npx vercel --force --prod
```

This skips the build cache entirely for that deployment.

## Method 2: Automated Shell Script
Use the provided script at `/scripts/clear-vercel-cache.sh`:

```bash
# Clear cache for specific app
./scripts/clear-vercel-cache.sh eos-l10

# Clear cache for all apps
./scripts/clear-vercel-cache.sh --all

# Use API method
./scripts/clear-vercel-cache.sh eos-l10 --api
```

## Method 3: GitHub Actions Workflow
Trigger cache clearing through GitHub Actions:

1. Go to Actions tab in GitHub
2. Select "Clear Vercel Cache" workflow
3. Click "Run workflow"
4. Select the app to clear cache for
5. Click "Run workflow" button

## Method 4: Vercel API
Clear cache programmatically using Vercel's API:

```bash
# Set environment variables
export VERCEL_TOKEN="your-token"
export VERCEL_TEAM_ID="your-team-id"

# Trigger deployment without cache
curl -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v13/deployments?teamId=$VERCEL_TEAM_ID&forceNew=1&withCache=0" \
  -d '{"name": "ganger-eos-l10", "gitSource": {"ref": "main"}}'
```

## Method 5: Environment Variable Trick
Adding or changing any environment variable forces cache invalidation:

```bash
# Add a cache-busting environment variable
npx vercel env add CACHE_BUST $(date +%s) production
```

## Method 6: Vercel Dashboard (Manual)
1. Log into Vercel Dashboard
2. Navigate to your project
3. Go to Settings → Advanced
4. Click "Purge Cache" button

## Automation Options

### 1. Pre-deployment Hook
Add to your deployment script:
```bash
# Always clear cache before deployment
npx vercel --force --prod
```

### 2. CI/CD Integration
In your CI/CD pipeline:
```yaml
- name: Deploy with Fresh Cache
  run: npx vercel --force --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 3. Scheduled Cache Clearing
Use GitHub Actions cron to clear cache regularly:
```yaml
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
```

### 4. API Integration
Create a webhook endpoint that clears cache:
```javascript
// api/clear-cache.js
export default async function handler(req, res) {
  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: req.query.app,
      gitSource: { ref: 'main' },
      forceNew: 1,
      withCache: 0
    })
  });
  
  res.json({ success: response.ok });
}
```

## Best Practices

1. **Use --force sparingly**: While it bypasses cache, it increases build time
2. **Automate for consistency**: Use scripts or CI/CD to ensure cache is cleared when needed
3. **Monitor build times**: Track if cache clearing is impacting performance
4. **Document when to clear**: Create guidelines for when cache should be cleared

## Troubleshooting

### Cache Not Clearing?
- Ensure you're using the correct project name
- Check if you have proper permissions (token/team ID)
- Try multiple methods if one doesn't work

### Build Still Failing?
- Cache might not be the issue
- Check build logs for actual error
- Verify dependencies are correctly configured

### Automation Not Working?
- Verify environment variables are set
- Check API token has proper permissions
- Ensure scripts have execute permissions

## Summary

For the eos-l10 deployment issue, the recommended approach is:

1. **Immediate**: Use `npx vercel --force --prod` to bypass cache
2. **Long-term**: Set up proper monorepo configuration in Vercel dashboard
3. **Automation**: Use the provided scripts and GitHub Actions for consistent deployments

The build cache issue is just one part of the monorepo deployment challenge. The real solution requires proper Vercel project configuration to handle workspace dependencies.