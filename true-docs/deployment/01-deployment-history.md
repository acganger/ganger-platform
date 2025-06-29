# Vercel Deployment History & Strategy

## 📚 Table of Contents
- [What Does NOT Work](#-what-does-not-work-verified-through-testing)
- [Why Distributed Architecture Works](#-why-distributed-architecture-works)
- [Deployment Architecture](#-deployment-architecture)
- [Why This Architecture](#-why-this-architecture)
- [Benefits of This Approach](#-benefits-of-this-approach)
- [Lessons Learned](#-lessons-learned)
- [Related Documentation](#-related-documentation)

## 🚫 What Does NOT Work (Verified Through Testing)

### 1. **Single Monorepo Deployment**
- **Attempted**: Deploy entire monorepo as one Vercel project
- **Result**: Failed - "No Next.js version detected"
- **Root Cause**: Vercel can't handle pnpm workspaces with `workspace:*` protocol
- **Error**: Build fails at dependency resolution stage

### 2. **Staff Portal with Local Path Rewrites**
- **Attempted**: Use Next.js rewrites to serve apps from `/apps/[app-name]`
- **Result**: Failed - Module not found errors
- **Root Cause**: Other apps don't exist in the staff portal's build output
- **Error**: `Module not found: Can't resolve '../../../../../inventory/src/pages'`

### 3. **GitHub Actions Pre-Build + Deploy**
- **Attempted**: Build locally in GitHub Actions, deploy pre-built to Vercel
- **Result**: Failed - Vercel still tries to build
- **Root Cause**: Vercel's build system doesn't properly handle pre-built monorepo outputs
- **Error**: Various build command and path resolution issues

### 4. **Direct Vercel CLI from Monorepo Root**
- **Attempted**: `vercel --prod` from repository root
- **Result**: Failed - Can't find Next.js
- **Root Cause**: Vercel looks for Next.js in root, not in subdirectories
- **Error**: "No Next.js version detected"

### 5. **npm/yarn Instead of pnpm**
- **Attempted**: Force npm with various configurations
- **Result**: Failed - Workspace protocol not understood
- **Root Cause**: `workspace:*` is pnpm-specific syntax
- **Error**: "Command npm install exited with 1"

### 6. **Git Submodules for MCP Tools**
- **Attempted**: Deploy with MCP server directories as git submodules
- **Result**: Failed - 13 out of 20 apps blocked
- **Root Cause**: Vercel runs `git clone --recurse-submodules` and can't access private/local submodules
- **Error**: "Warning: Failed to fetch one or more git submodules"
- **Solution**: Remove submodule references with `git rm --cached` and add to `.gitignore`

## ✅ Why Distributed Architecture Works

### The Solution: Independent App Deployments + Central Router

1. **Each app deploys independently**
   - No monorepo complexity
   - Standard Next.js deployments
   - Vercel handles each as a simple project

2. **Staff Portal acts as intelligent router**
   - Uses URL rewrites (not path rewrites)
   - Points to actual deployed URLs
   - Maintains single domain experience

3. **Solves all previous issues**
   - No pnpm workspace problems
   - No missing modules
   - No build path confusion
   - Each app builds in isolation

## 📋 Deployment Architecture

```
staff.gangerdermatology.com (Staff Portal - Router)
├── /dashboard → Staff Portal's own pages
├── /inventory → Rewrites to inventory-xyz.vercel.app
├── /handouts → Rewrites to handouts-xyz.vercel.app
├── /l10 → Rewrites to eos-l10-xyz.vercel.app
└── ... (17 more apps)
```

## 🔍 Why This Architecture?

1. **Vercel's Limitations**
   - Designed for single apps, not complex monorepos
   - Limited pnpm workspace support
   - Expects simple project structures

2. **Our Requirements**
   - 20+ interconnected applications
   - Shared authentication and components
   - Single domain experience
   - Independent deployment cycles

3. **The Match**
   - Distributed architecture works WITH Vercel's design
   - Maintains our single-domain requirement
   - Allows independent scaling and deployment
   - Standard Vercel projects = reliable deployments

## 📊 Benefits of This Approach

1. **Reliability**: Each app follows Vercel's standard patterns
2. **Speed**: Only deploy what changes
3. **Debugging**: Clear separation of concerns
4. **Scaling**: Each app scales independently
5. **Maintenance**: Standard Vercel projects are well-documented

## 🚨 Lessons Learned

1. **Don't fight the platform**: Vercel wants simple projects
2. **Monorepo ≠ Monodeployment**: Deploy separately, route together
3. **pnpm workspaces**: Great for development, problematic for Vercel
4. **URL rewrites > Path rewrites**: Use actual URLs, not local paths
5. **Automation is key**: 20 apps need scripted deployment

This distributed architecture aligns with Vercel's strengths while maintaining our unified platform vision.

## 📚 Related Documentation

- **Next**: [Deployment Plan](./02-deployment-plan.md) - Step-by-step implementation guide
- **Reference**: [Deployment Checklist](./03-deployment-checklist.md) - Pre-deployment validation
- **Important**: [Risk Mitigation](./04-risk-mitigation.md) - Handling potential issues
- **Overview**: [Back to Index](./README.md) - Complete documentation index