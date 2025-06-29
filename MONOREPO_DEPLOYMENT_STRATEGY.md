# Ganger Platform - Monorepo Deployment Strategy

## 📅 Created: January 29, 2025

This document outlines our deployment strategy based on extensive testing and expert analysis of Vercel's monorepo capabilities.

## Current Situation

Despite properly configuring:
- ✅ `commandForIgnoringBuildStep` via Vercel API (not in vercel.json)
- ✅ `turbo-ignore` with `--fallback=HEAD~10` to handle shallow clones
- ✅ Proper monorepo structure with turbo.json

**Result**: All apps still rebuild on every push, indicating platform limitations or configuration nuances.

## Root Cause Analysis

### 1. Shared Dependencies Detection
`turbo-ignore` correctly triggers rebuilds when:
- Files in `/packages/*` change (shared code)
- Root configuration files change (`turbo.json`, `pnpm-lock.yaml`)
- Global dependencies listed in `turbo.json` are modified

### 2. Git History Limitations
- Vercel's shallow clone (`--depth=10`) may be insufficient
- Even with `--fallback=HEAD~10`, comparison points might be missing
- Deep branch histories or divergent branches exacerbate this

### 3. Configuration Scope
Our `turbo.json` may have overly broad `globalDependencies` or `inputs` that trigger all builds.

## Recommended Strategy

### 🎯 Primary Approach: GitHub Actions for Sequential Deployments

**Why**: Full control over deployment order and timing, bypassing Vercel's automatic triggers.

#### Implementation Steps:

1. **Disable Auto-Deploy in Vercel**
   - For each project: Settings → Git → Disable "Auto-deploy on push"
   - Keeps Vercel builds manual/API-triggered only

2. **Use Enhanced GitHub Actions Workflow**
   ```yaml
   name: Sequential Monorepo Deployment
   
   on:
     workflow_dispatch:
       inputs:
         deploy_mode:
           description: 'Deployment mode'
           type: choice
           options:
             - 'changed-only'    # Deploy only changed apps
             - 'sequential-all'  # Deploy all in order
             - 'specific-apps'   # Deploy selected apps
         apps_to_deploy:
           description: 'Apps to deploy (comma-separated, for specific-apps mode)'
           required: false
   
   jobs:
     detect-changes:
       runs-on: ubuntu-latest
       outputs:
         changed_apps: ${{ steps.changes.outputs.apps }}
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0  # Full history for accurate detection
         
         - name: Detect changed apps
           id: changes
           run: |
             # Use git diff to detect changed apps
             CHANGED_APPS=$(git diff --name-only ${{ github.event.before }}...${{ github.sha }} | 
               grep '^apps/' | cut -d'/' -f2 | sort -u | tr '\n' ',' | sed 's/,$//')
             echo "apps=$CHANGED_APPS" >> $GITHUB_OUTPUT
   
     deploy-foundation:
       needs: detect-changes
       if: contains(needs.detect-changes.outputs.changed_apps, 'auth') || 
           contains(needs.detect-changes.outputs.changed_apps, 'db') ||
           github.event.inputs.deploy_mode != 'changed-only'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Deploy shared packages
           run: |
             # Deploy foundational services first
             vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} \
               --scope=${{ secrets.VERCEL_SCOPE }} \
               --build-env ENABLE_EXPERIMENTAL_COREPACK=1
   
     deploy-apps:
       needs: deploy-foundation
       runs-on: ubuntu-latest
       strategy:
         matrix:
           app: [platform-dashboard, staff, inventory, handouts]
         max-parallel: 1  # Sequential deployment
       steps:
         - uses: actions/checkout@v4
         - name: Deploy ${{ matrix.app }}
           run: |
             vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} \
               --scope=${{ secrets.VERCEL_SCOPE }} \
               --cwd apps/${{ matrix.app }} \
               --build-env ENABLE_EXPERIMENTAL_COREPACK=1
   ```

3. **Implement Deployment Gates**
   - Health checks between deployments
   - Smoke tests before proceeding
   - Rollback capabilities

### 🔄 Secondary Approach: Optimize Vercel's Native Detection

1. **Test Vercel's Automatic Skipping**
   - Remove custom `Ignored Build Step` temporarily
   - Let Vercel use its built-in monorepo detection
   - Monitor if behavior improves

2. **Enable Remote Caching**
   ```bash
   # From monorepo root
   npx turbo login
   npx turbo link
   ```
   - Even if all apps rebuild, caching dramatically reduces time/cost
   - Artifacts are reused when unchanged

3. **Refine turbo.json**
   ```json
   {
     "globalDependencies": [
       ".env.production",     // Only truly global files
       "tsconfig.base.json"
     ],
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": [".next/**", "!.next/cache/**"],
         "inputs": [
           "src/**",
           "package.json",
           "next.config.js",
           "tsconfig.json"
         ]
       }
     }
   }
   ```

### 🚨 Immediate Actions

1. **Set Up Vercel Remote Caching**
   ```bash
   npx turbo login
   npx turbo link
   ```

2. **Disable Auto-Deploy**
   - Via Vercel Dashboard for each project
   - Or via API to disable Git integration

3. **Implement GitHub Actions Workflow**
   - Start with the template above
   - Customize for your deployment order
   - Add monitoring and notifications

4. **Document Deployment Order**
   ```yaml
   # deployment-order.yaml
   tiers:
     - name: foundation
       apps: [auth, db, utils]
     - name: core
       apps: [platform-dashboard, staff]
     - name: features
       apps: [inventory, handouts, eos-l10]
     - name: auxiliary
       apps: [all remaining apps]
   ```

## Monitoring and Optimization

### Build Performance Tracking
```javascript
// scripts/track-builds.js
const builds = await fetch('https://api.vercel.com/v6/deployments', {
  headers: { 'Authorization': `Bearer ${process.env.VERCEL_TOKEN}` }
});

// Analyze build times, cache hit rates, etc.
```

### Cost Analysis
- Track build minutes used
- Monitor cache effectiveness
- Identify optimization opportunities

## Long-term Considerations

1. **Evaluate Monorepo Structure**
   - Are all apps truly interdependent?
   - Could some be separate repos?
   - Balance DX vs deployment complexity

2. **Platform Alternatives**
   - Self-hosted runners for more control
   - Alternative deployment platforms
   - Hybrid approaches

3. **Engage Vercel Support**
   - Share findings and logs
   - Request feature enhancements
   - Explore enterprise options

## Conclusion

While Vercel's monorepo support has limitations, a combination of:
- GitHub Actions for orchestration
- Remote caching for efficiency
- Strategic deployment planning

...provides a robust solution for sequential deployments and controlled rollouts.

The key is accepting that perfect granular detection may not be achievable with current tooling, but the workarounds provide sufficient control and efficiency for production use.

---

*Last Updated: January 29, 2025*
*Status: Active deployment strategy based on real-world testing*