# Vercel Deployment Checklist

## Table of Contents
- [Pre-Deployment Checklist for Each App](#-pre-deployment-checklist-for-each-app)
- [App-Specific Checks](#-app-specific-checks)
- [Documentation Requirements](#-documentation-requirements)
- [Post-Deployment Verification](#-post-deployment-verification)
- [Final Router Configuration](#-final-router-configuration)
- [Related Documentation](#related-documentation)

## 🔍 Pre-Deployment Checklist for Each App

### 1. **Remove Demo/Development Code**
- [ ] Check `pages/index.tsx` or `app/page.tsx` - no demo content
- [ ] Remove any `demo.tsx`, `example.tsx`, or `test.tsx` pages
- [ ] Verify no hardcoded test data in components
- [ ] Check for `console.log()` statements
- [ ] Remove any development-only routes

### 2. **Update Navigation & Links**
- [ ] All internal links use absolute paths (`/inventory`, not `./inventory`)
- [ ] No localhost URLs anywhere
- [ ] Navigation components use production URLs
- [ ] API calls point to production endpoints
- [ ] Remove any development environment checks that disable features

### 3. **Environment Configuration**
- [ ] `.env.local` is NOT committed
- [ ] All required env vars documented in `.env.example`
- [ ] Remove any `.env.development` or `.env.test` files
- [ ] Verify production API keys (not test keys)
- [ ] Check Supabase URL is production instance

### 4. **Next.js Configuration**
- [ ] Check `basePath` configuration matches staff portal navigation:
  ```javascript
  // integration-status app example
  basePath: '/status',  // Must match staff portal navigation, NOT folder name
  ```
- [ ] Verify dynamic configuration for standalone vs portal deployment:
  ```javascript
  ...(process.env.VERCEL && !process.env.STAFF_PORTAL_MODE ? {} : {
    basePath: '/status',
    assetPrefix: '/status',
  }),
  ```
- [ ] For Vercel deployment, keep:
  ```javascript
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
  ```
- [ ] Remove any development-only webpack configs
- [ ] Verify image domains include production URLs
- [ ] Check for proper error pages (404.tsx, 500.tsx)
- [ ] Remove Cloudflare-specific dependencies and scripts:
  ```json
  // Remove from package.json:
  "@cloudflare/next-on-pages": "^1.13.12"
  "build:worker": "npx @cloudflare/next-on-pages"
  ```

### 5. **Package.json Validation**
- [ ] Has correct `name` field (e.g., `@ganger/inventory`)
- [ ] All dependencies are listed (no missing deps)
- [ ] No development tools in `dependencies` (should be in `devDependencies`)
- [ ] Build script is standard: `"build": "next build"`
- [ ] No local file references (all should be `workspace:*`)
- [ ] Consistent Next.js version across apps:
  ```json
  "next": "^14.2.0"  // Use caret range, not exact version
  ```
- [ ] Check for duplicate dependencies (e.g., tailwindcss in both deps and devDeps)
- [ ] Ensure date-fns and other common deps are in root package.json if shared

### 6. **Authentication & Security**
- [ ] Auth redirects use production URLs
- [ ] CORS settings include production domains
- [ ] API routes have proper authentication checks
- [ ] No exposed secrets or API keys in code
- [ ] Session/cookie domains set correctly

### 7. **Database & API Connections**
- [ ] Supabase client uses production URL
- [ ] API endpoints point to production
- [ ] Database queries are optimized
- [ ] No seed data or test data generation
- [ ] Error handling for failed connections

### 8. **UI/UX Checks**
- [ ] Loading states implemented
- [ ] Error boundaries in place
- [ ] Mobile responsive design verified
- [ ] No broken images or assets
- [ ] Proper meta tags and SEO

### 9. **Testing Requirements**
- [ ] Unit tests pass (if any)
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Lighthouse score acceptable
- [ ] Accessibility checks pass

### 10. **Deployment-Specific**
- [ ] Create unique Vercel project name
- [ ] Document the deployment URL
- [ ] Set up environment variables in Vercel
- [ ] Configure build settings correctly
- [ ] Note any special deployment requirements

### 11. **Common Deployment Errors to Check**
- [ ] **Syntax Errors**: Check for malformed imports
  ```typescript
  // Wrong - export inside import
  import { 
  export const dynamic = 'force-dynamic';
    Star,
  } from 'lucide-react';
  
  // Correct
  import { Star } from 'lucide-react';
  export const dynamic = 'force-dynamic';
  ```
- [ ] **Module Resolution**: Ensure .npmrc exists in root for pnpm
- [ ] **Lockfile Issues**: Run `pnpm install` after any package.json changes
- [ ] **Build Command**: Should be `cd ../.. && pnpm run build --filter=@ganger/[app]...`
- [ ] **Install Command**: Should be `cd ../.. && pnpm install`

## 🚀 App-Specific Checks

### Staff Portal (Router)
- [ ] Has `vercel.json` with all rewrite rules
- [ ] All app URLs in rewrites are documented
- [ ] Navigation includes all apps
- [ ] Middleware doesn't interfere with routing
- [ ] Home page redirects to `/dashboard`

### Inventory App
- [ ] Barcode scanner permissions handled
- [ ] Camera access fallbacks
- [ ] Offline mode considerations
- [ ] Print functionality works
- [ ] Stock alerts configured

### Handouts App
- [ ] PDF generation works
- [ ] QR codes generate correctly
- [ ] File upload limits set
- [ ] S3/Storage bucket configured
- [ ] Email delivery tested

### Check-in Kiosk
- [ ] Touch-optimized UI
- [ ] Auto-logout timer set
- [ ] Payment processing live keys
- [ ] Printer integration checked
- [ ] Accessibility features enabled

### EOS L10
- [ ] Meeting templates load
- [ ] Real-time sync enabled
- [ ] Export functionality works
- [ ] Permissions per role
- [ ] Historical data preserved

### Medication Auth
- [ ] HIPAA compliance verified
- [ ] Audit logging enabled
- [ ] Provider verification active
- [ ] Insurance lookup works
- [ ] Prescription history loads

### Each Additional App
- [ ] Core functionality tested
- [ ] Integration points verified
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Documentation updated

## 📝 Documentation Requirements

For each deployed app, document:
1. Vercel project name
2. Deployment URL (*.vercel.app)
3. Environment variables needed
4. Any special build commands
5. Integration dependencies
6. Known limitations
7. Monitoring setup

## 🔄 Post-Deployment Verification

After each app is deployed:
1. [ ] Access the Vercel URL directly
2. [ ] Test core functionality
3. [ ] Verify env vars are working
4. [ ] Check browser console for errors
5. [ ] Test authentication flow
6. [ ] Verify API connections
7. [ ] Document the deployment URL

## 🎯 Final Router Configuration

Once all apps are deployed:
1. [ ] Update Staff Portal's `vercel.json` with all URLs
2. [ ] Test each route from staff.gangerdermatology.com
3. [ ] Verify authentication carries across apps
4. [ ] Check navigation between apps
5. [ ] Monitor for CORS issues
6. [ ] Set up domain DNS
7. [ ] SSL certificates active
8. [ ] Run full platform test

## Related Documentation

- **Previous**: [Platform Architecture Overview](./02-platform-architecture.md)
- **Next**: [Deployment Risk Mitigation Guide](./04-risk-mitigation.md)
- **Overview**: [Back to Index](./README.md)