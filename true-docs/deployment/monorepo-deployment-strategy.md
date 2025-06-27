# Monorepo Deployment Strategy - Critical Understanding

**Date**: June 27, 2025

## The Deployment Helper Paradox

### Original Intent
The deployment-helper was created to:
1. Include ALL @ganger/* packages as dependencies
2. Build and cache them on Vercel
3. Allow other apps to reuse the cached packages

### What Actually Happened
To make it deploy, we:
1. Removed all @ganger/* package dependencies
2. Made it self-contained
3. **Completely defeated its purpose**

## The Real Problem

Vercel is trying to deploy each app in isolation, but the apps depend on workspace packages that exist in the monorepo structure. The deployment fails because:

1. When deploying from the app directory, Vercel can't access `../../packages/*`
2. The `file:` protocol doesn't work in Vercel's build environment
3. Each app is deployed as if it's a standalone project

## Why Some Apps Deployed Successfully

The 7 successfully deployed apps (Inventory, Handouts, etc.):
- Don't have vercel.json files in their directories
- Must be using Vercel project-level settings
- Likely deployed with root directory set to repository root
- Build commands that properly handle workspace dependencies

## Correct Deployment Approach

### Option 1: Root Directory Deployment (Recommended)
Configure each Vercel project with:
```json
{
  "rootDirectory": "./",
  "buildCommand": "npm run build --workspace=@ganger/[app-name]",
  "outputDirectory": "apps/[app-name]/.next",
  "installCommand": "npm install --legacy-peer-deps"
}
```

### Option 2: Fix Deployment Helper
Restore the deployment-helper to its original purpose:
1. Re-add all @ganger/* dependencies
2. Configure Vercel to deploy from root
3. Ensure it builds all packages
4. Deploy it first to establish cache

### Option 3: Vercel Monorepo Mode
Use Vercel's built-in monorepo support:
- Set up each project with proper root directory
- Use Vercel's workspace detection
- Let Vercel handle the dependency resolution

## Immediate Action Required

1. **Check Vercel Dashboard**: Look at the project settings for successfully deployed apps
2. **Replicate Settings**: Apply the same configuration to failing apps
3. **Deploy from Root**: Ensure builds happen from repository root, not app directory

## The Mistake We Made

We tried to make each app self-contained, but that's not how monorepos work. The whole point is to share code between apps. The deployment system needs to understand and support this structure.

---
*The deployment-helper's failure to serve its purpose reveals the core issue: we need proper monorepo deployment configuration, not workarounds*