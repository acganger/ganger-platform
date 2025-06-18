# Workers Template Usage Guide

## Creating New Apps with Workers Architecture

### 1. Copy Template Structure

```bash
# Copy the template to your new app directory
cp -r /true-docs/templates/workers-app-template apps/your-app
cd apps/your-app
```

### 2. Replace Template Variables

Use find and replace to update all template variables:

```bash
# Replace app name variables
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md"  < /dev/null |  \
  xargs sed -i "s/\[APP_NAME\]/your-app-name/g"

# Replace app path variables  
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md" | \
  xargs sed -i "s/\[APP_PATH\]/your-app-path/g"

# Replace app slug variables
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md" | \
  xargs sed -i "s/\[APP_SLUG\]/your-app-slug/g"

# Replace app description
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md" | \
  xargs sed -i "s/\[APP_DESCRIPTION\]/Description of your app/g"
```

### 3. Verify Configuration

```bash
# Check that all template variables have been replaced
grep -r "\[APP_" . || echo "✅ All template variables replaced"

# Verify Workers configuration
cat next.config.js | grep "runtime.*edge" && echo "✅ Workers runtime configured"
cat next.config.js | grep "output.*export" && echo "❌ Static export found - remove this\!" || echo "✅ No static export"

# Check staff portal integration
grep -r "StaffPortalLayout" app/ && echo "✅ Staff portal integration found"
```

### 4. Install Dependencies and Test

```bash
# Install dependencies
pnpm install

# Type check
pnpm type-check
# Expected: "Found 0 errors"

# Build test
pnpm build
# Expected: "Build completed successfully"

# Development test
pnpm dev
# Expected: App runs on http://localhost:3000
```

### 5. Deploy and Verify

```bash
# Deploy to Cloudflare Workers
wrangler deploy --config wrangler.jsonc --env production

# Test deployment
curl -I https://ganger-your-app-staff.workers.dev/health
# Expected: HTTP 200 response

# Test staff portal integration
curl -I https://staff.gangerdermatology.com/your-app-path
# Expected: HTTP 200 response (after router configuration)
```

## Template Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `[APP_NAME]` | Application name (kebab-case) | `inventory-management` |
| `[APP_PATH]` | URL path in staff portal | `inventory` |
| `[APP_SLUG]` | Short identifier for app | `inventory` |
| `[APP_DESCRIPTION]` | Brief description | `Medical supply tracking with barcode scanning` |

## Common Mistakes to Avoid

### ❌ DONT DO THIS:

```typescript
// Adding static export to next.config.js
const nextConfig = {
  output: "export", // ❌ Causes 405 errors in Workers
  trailingSlash: true, // ❌ Static export pattern
}

// Skipping staff portal integration
export default function MyApp() {
  return <div>My content</div>; // ❌ No platform integration
}

// Using external UI libraries
import { Button } from "react-bootstrap"; // ❌ Use @ganger/ui
```

### ✅ DO THIS INSTEAD:

```typescript
// Proper Workers configuration
const nextConfig = {
  experimental: {
    runtime: "edge", // ✅ Workers compatible
  },
  images: {
    unoptimized: true, // ✅ Required for Workers
  },
}

// Proper staff portal integration
export default function MyApp() {
  return (
    <StaffPortalLayout currentApp="my-app">
      <div>My content</div>
    </StaffPortalLayout>
  );
}

// Use platform UI components
import { Button } from "@ganger/ui"; // ✅ Platform consistency
```

## Verification Checklist

### ✅ Pre-Development
- [ ] Template copied to correct location
- [ ] All template variables replaced
- [ ] No `[APP_*]` placeholders remain
- [ ] Dependencies installed successfully

### ✅ Development Phase
- [ ] TypeScript compilation passes (0 errors)
- [ ] Build process completes successfully
- [ ] StaffPortalLayout implemented
- [ ] Only @ganger/* packages used
- [ ] No static export configuration

### ✅ Deployment Phase
- [ ] Workers deployment succeeds
- [ ] Health endpoint returns HTTP 200
- [ ] Staff portal integration working
- [ ] No 405 Method Not Allowed errors

## Quick Commands Reference

```bash
# Create new app from template
cp -r /true-docs/templates/workers-app-template apps/my-new-app

# Replace all variables at once
cd apps/my-new-app
sed -i "s/\[APP_NAME\]/my-new-app/g; s/\[APP_PATH\]/mynewapp/g; s/\[APP_SLUG\]/mynewapp/g; s/\[APP_DESCRIPTION\]/My new application/g" $(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md")

# Full verification
pnpm install && pnpm type-check && pnpm build

# Deploy and test
wrangler deploy --config wrangler.jsonc --env production
curl -I https://ganger-my-new-app-staff.workers.dev/health
```

## Getting Help

If you encounter issues:

1. **Check template variables**: Ensure all `[APP_*]` placeholders are replaced
2. **Verify configuration**: Confirm no static export in next.config.js
3. **Test builds**: Make sure TypeScript and build processes pass
4. **Check documentation**: Reference MASTER_DEVELOPMENT_GUIDE.md for detailed patterns

## Template Files Included

- `next.config.js` - Workers-compatible Next.js configuration
- `wrangler.jsonc` - Cloudflare Workers deployment configuration  
- `app/layout.tsx` - Staff portal layout integration
- `app/page.tsx` - Example page with @ganger/ui components
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `README.md` - App-specific documentation

This template ensures all new applications follow Workers architecture standards and prevent the 405 errors that occur with static export configurations.
