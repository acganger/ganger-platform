# Vercel Remote Caching Setup Guide

## Why Remote Caching Matters

Even though all apps are currently rebuilding on every push (due to turbo-ignore limitations), remote caching can:
- **Reduce build times by 50-90%** by reusing previous build artifacts
- **Save money** on build minutes
- **Speed up deployments** significantly

## Setup Steps

### 1. Login to Turborepo (One-time setup)

From the monorepo root directory:

```bash
npx turbo login
```

This will:
- Open a browser window
- Ask you to authenticate with Vercel
- Link your local machine to Turborepo's remote cache

### 2. Link Repository to Remote Cache

After logging in, link your repository:

```bash
npx turbo link
```

This will:
- Show a list of your Vercel teams
- Ask you to select the team: `team_wpY7PcIsYQNnslNN39o7fWvS` (Ganger)
- Create a connection between your repo and Vercel's remote cache

### 3. Verify Setup

Check that remote caching is enabled:

```bash
npx turbo run build --dry-run
```

You should see something like:
```
Remote caching enabled
```

## How It Works

1. **First Build**: When an app builds for the first time, Turborepo:
   - Runs the full build
   - Uploads the results to remote cache
   - Tags it with a hash of all inputs

2. **Subsequent Builds**: When the same app builds again:
   - Turborepo calculates the hash of inputs
   - If hash matches cache, it downloads cached results
   - Build completes in seconds instead of minutes

3. **Cache Invalidation**: Cache is automatically invalidated when:
   - Source code changes
   - Dependencies change
   - Build configuration changes

## Expected Benefits

### Before Remote Caching
- Full app build: 2-5 minutes
- All 19 apps building: 38-95 minutes total

### After Remote Caching
- Cached app build: 10-30 seconds
- All 19 apps with cache hits: 3-10 minutes total

## Monitoring Cache Performance

View cache statistics in your build logs:
```
cache hit, replaying output
cache miss, executing
```

Or check Turborepo's cache analysis:
```bash
npx turbo run build --summarize
```

## Troubleshooting

### Cache Misses When Expected
- Check if `turbo.json` inputs are too broad
- Verify no unexpected files are changing
- Ensure environment variables are consistent

### Force Cache Bypass
If you need to force a fresh build:
```bash
TURBO_FORCE=true npm run build
```

## Best Practices

1. **Keep turbo.json inputs specific** - Only include files that affect builds
2. **Use consistent Node versions** - Different versions create different cache keys
3. **Don't cache sensitive data** - Remote cache is shared across team
4. **Monitor cache hit rates** - Low rates indicate configuration issues

## Next Steps

After setting up remote caching:
1. Make a test commit to verify caching works
2. Monitor build times in Vercel dashboard
3. Adjust `turbo.json` if cache misses are too frequent

---

*Note: Remote caching works even if all apps rebuild - it just means each app's individual build will be much faster when nothing has actually changed in that app's code.*