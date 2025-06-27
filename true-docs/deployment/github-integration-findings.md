# GitHub Integration Deployment Findings

## How the 7 Apps Originally Deployed

Based on our investigation, the 7 working apps were deployed successfully because:

1. **GitHub Integration**: All working apps have `ganger-` prefixed Vercel projects connected to GitHub
2. **No Local vercel.json**: They don't have local vercel.json files that override project settings
3. **Vercel Project Settings**: Configured with:
   ```json
   {
     "rootDirectory": "apps/[app-name]",
     "buildCommand": "npm run build",
     "installCommand": "npm install --force",
     "framework": "nextjs"
   }
   ```

## Why They're Failing Now

Our recent changes converted `workspace:*` to `file:../../packages/*` in all package.json files. This broke Vercel's ability to resolve dependencies because:

1. **Vercel's rootDirectory Setting**: When set to `apps/[app-name]`, Vercel can't access `../../packages`
2. **File Protocol Issue**: The `file:` protocol doesn't work in Vercel's isolated build environment
3. **npm install --force**: Was working with `workspace:*` but not with `file:` references

## The Real Solution

### Option 1: Revert Workspace Protocol (Recommended)
```bash
# Revert the workspace dependency changes
git revert HEAD
git push

# This will restore workspace:* which Vercel can handle with npm install --force
```

### Option 2: Change Vercel Project Settings
For each project in Vercel dashboard:
1. Set `rootDirectory` to `./` (repository root)
2. Change `buildCommand` to `npm run build --workspace=@ganger/[app-name]`
3. Keep `installCommand` as `npm install --force`
4. Set `outputDirectory` to `apps/[app-name]/.next`

### Option 3: Use pnpm on Vercel
1. Add `"packageManager": "pnpm@8.15.0"` to root package.json
2. Change install command to `pnpm install`
3. pnpm handles workspace: protocol natively

## Why This Happened

1. **Working Apps**: Were using `workspace:*` protocol with `npm install --force`
2. **Our "Fix"**: Changed to `file:` protocol for local npm compatibility
3. **Result**: Broke Vercel deployments that were working

## Immediate Action Required

The fastest fix is to revert our workspace dependency changes:

```bash
git revert b6b7af5419caaca573dc5bb22b20bbbffa243fe1
git push
```

This will restore the `workspace:*` protocol that Vercel's GitHub integration can handle.

---
*The 7 apps deployed successfully because they used workspace: protocol with npm install --force, not because of any special configuration. Our attempt to "fix" dependencies for local development broke the working Vercel deployments.*